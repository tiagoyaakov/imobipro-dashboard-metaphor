// ================================================================
// HOOK USECLIENTS V2 - INTEGRADO COM CACHE UNIFICADO
// ================================================================
// Data: 02/08/2025
// Descrição: Versão otimizada do hook de clientes com cache unificado
// Features: Cache persistente, lead scoring, funnel, campanhas
// ================================================================

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getUnifiedCache } from '@/lib/cache/UnifiedCache';
import { CacheStrategy } from '@/lib/cache/types';
import { 
  useCacheQuery, 
  useCacheMutation, 
  useCacheInvalidation,
  useOfflineCache,
  useCachePrefetch,
  useOptimisticCache,
  useCacheBatchInvalidation
} from '@/hooks/cache/useCache';
import { contactService } from '@/services';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from 'sonner';
import { z } from 'zod';
import type { 
  Contact,
  ContactFilters,
  LeadStage,
  LeadActivity,
  MessageCampaign,
  ContactStats,
  LeadFunnelStats,
  CreateContactDTO,
  UpdateContactDTO
} from '@/types/contact';

// ================================================================
// SCHEMAS DE VALIDAÇÃO
// ================================================================

const ContactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().min(10, 'Telefone inválido').optional().nullable(),
  category: z.enum(['CLIENT', 'LEAD', 'PARTNER']),
  leadStage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED', 'LOST']).optional(),
  leadSource: z.string().optional(),
  company: z.string().optional(),
  budget: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
});

// ================================================================
// KEYS DE CACHE CONSOLIDADAS
// ================================================================

export const CLIENT_QUERY_KEYS = {
  all: ['clients'] as const,
  lists: () => [...CLIENT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: ContactFilters) => 
    [...CLIENT_QUERY_KEYS.lists(), filters || {}] as const,
  details: () => [...CLIENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLIENT_QUERY_KEYS.details(), id] as const,
  activities: (contactId: string) => 
    [...CLIENT_QUERY_KEYS.all, 'activities', contactId] as const,
  campaigns: () => [...CLIENT_QUERY_KEYS.all, 'campaigns'] as const,
  campaign: (id: string) => [...CLIENT_QUERY_KEYS.campaigns(), id] as const,
  stats: (filters?: ContactFilters) => 
    [...CLIENT_QUERY_KEYS.all, 'stats', filters || {}] as const,
  funnel: (agentId?: string) => 
    [...CLIENT_QUERY_KEYS.all, 'funnel', agentId || 'all'] as const,
  leadScores: () => [...CLIENT_QUERY_KEYS.all, 'lead-scores'] as const,
  search: (query: string) => 
    [...CLIENT_QUERY_KEYS.all, 'search', query] as const,
} as const;

// ================================================================
// CONFIGURAÇÕES DE CACHE POR TIPO
// ================================================================

const CACHE_STRATEGIES = {
  list: CacheStrategy.DYNAMIC,          // 5min - listas de contatos
  detail: CacheStrategy.DYNAMIC,        // 5min - detalhes individuais
  activities: CacheStrategy.REALTIME,   // 0s - atividades em tempo real
  campaigns: CacheStrategy.STATIC,      // 30min - campanhas
  stats: CacheStrategy.CRITICAL,        // 10s - estatísticas críticas
  funnel: CacheStrategy.CRITICAL,       // 10s - funil de vendas
  leadScores: CacheStrategy.DYNAMIC,    // 5min - pontuações de leads
  search: CacheStrategy.DYNAMIC         // 5min - resultados de busca
} as const;

// ================================================================
// FUNÇÕES DE API COM CACHE UNIFICADO
// ================================================================

/**
 * Buscar lista de contatos/clientes com filtros
 */
async function fetchContacts(
  filters?: ContactFilters
): Promise<{ data: Contact[]; total: number }> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.list(filters).join(':');

  try {
    // Verificar cache primeiro
    const cached = await cache.get<{ data: Contact[]; total: number }>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 5 * 60 * 1000) {
      console.log('👥 Contacts list from cache');
      return cached;
    }

    // Buscar do servidor
    const result = await contactService.findAll(filters);
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar contatos');
    }

    const response = {
      data: result.data || [],
      total: result.total || 0,
      lastUpdated: new Date().toISOString()
    };

    // Armazenar no cache com compressão para listas grandes
    await cache.set(cacheKey, response, {
      strategy: CACHE_STRATEGIES.list,
      tags: ['clients', 'list'],
      compress: response.data.length > 50,
      syncAcrossTabs: true
    });

    // Cachear contatos individuais também
    for (const contact of response.data) {
      const detailKey = CLIENT_QUERY_KEYS.detail(contact.id).join(':');
      await cache.set(detailKey, contact, {
        strategy: CACHE_STRATEGIES.detail,
        tags: ['clients', 'detail', contact.id],
        syncAcrossTabs: true
      });
    }

    return response;

  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    
    // Tentar cache stale
    const staleData = await cache.get<{ data: Contact[]; total: number }>(cacheKey);
    if (staleData) {
      console.warn('👥 Using stale contacts data');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar estatísticas de contatos
 */
async function fetchContactStats(filters?: ContactFilters): Promise<ContactStats> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.stats(filters).join(':');

  try {
    // Cache crítico de curta duração
    const cached = await cache.get<ContactStats>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 10 * 1000) {
      console.log('📊 Contact stats from cache');
      return cached;
    }

    const result = await contactService.getStats(filters);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Erro ao buscar estatísticas');
    }

    const stats: ContactStats = {
      ...result.data,
      lastUpdated: new Date().toISOString()
    };

    // Cache sem compressão (dados pequenos e críticos)
    await cache.set(cacheKey, stats, {
      strategy: CACHE_STRATEGIES.stats,
      tags: ['clients', 'stats'],
      compress: false,
      syncAcrossTabs: true
    });

    return stats;

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    
    const staleData = await cache.get<ContactStats>(cacheKey);
    if (staleData) {
      console.warn('📊 Using stale stats');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar funil de leads
 */
async function fetchLeadFunnel(agentId?: string): Promise<LeadFunnelStats> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.funnel(agentId).join(':');

  try {
    // Cache crítico
    const cached = await cache.get<LeadFunnelStats>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 10 * 1000) {
      console.log('🎯 Lead funnel from cache');
      return cached;
    }

    const result = await contactService.getLeadFunnel(agentId);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Erro ao buscar funil');
    }

    const funnel: LeadFunnelStats = {
      ...result.data,
      lastUpdated: new Date().toISOString()
    };

    await cache.set(cacheKey, funnel, {
      strategy: CACHE_STRATEGIES.funnel,
      tags: ['clients', 'funnel'],
      compress: false,
      syncAcrossTabs: true
    });

    return funnel;

  } catch (error) {
    console.error('Erro ao buscar funil:', error);
    
    const staleData = await cache.get<LeadFunnelStats>(cacheKey);
    if (staleData) {
      console.warn('🎯 Using stale funnel data');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar atividades de um contato
 */
async function fetchContactActivities(contactId: string): Promise<LeadActivity[]> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.activities(contactId).join(':');

  try {
    // Sem cache para atividades (tempo real)
    const result = await contactService.getActivities(contactId);
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar atividades');
    }

    return result.data || [];

  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    throw error;
  }
}

/**
 * Buscar campanhas de marketing
 */
async function fetchCampaigns(): Promise<MessageCampaign[]> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.campaigns().join(':');

  try {
    // Cache de longa duração para campanhas
    const cached = await cache.get<MessageCampaign[]>(cacheKey);
    if (cached && Date.now() - new Date(cached[0]?.updatedAt || 0).getTime() < 30 * 60 * 1000) {
      console.log('📧 Campaigns from cache');
      return cached;
    }

    const result = await contactService.getCampaigns();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar campanhas');
    }

    const campaigns = result.data || [];

    // Cache com compressão
    await cache.set(cacheKey, campaigns, {
      strategy: CACHE_STRATEGIES.campaigns,
      tags: ['clients', 'campaigns'],
      compress: true,
      syncAcrossTabs: true
    });

    return campaigns;

  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    
    const staleData = await cache.get<MessageCampaign[]>(cacheKey);
    if (staleData) {
      console.warn('📧 Using stale campaigns');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar contato individual
 */
async function fetchContactById(id: string): Promise<Contact> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.detail(id).join(':');

  try {
    // Verificar cache primeiro
    const cached = await cache.get<Contact>(cacheKey);
    if (cached && Date.now() - new Date(cached.updatedAt).getTime() < 5 * 60 * 1000) {
      console.log('👤 Contact detail from cache');
      return cached;
    }

    const result = await contactService.findById(id);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Contato não encontrado');
    }

    // Armazenar no cache
    await cache.set(cacheKey, result.data, {
      strategy: CACHE_STRATEGIES.detail,
      tags: ['clients', 'detail', id],
      syncAcrossTabs: true
    });

    return result.data;

  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    
    const staleData = await cache.get<Contact>(cacheKey);
    if (staleData) {
      console.warn('👤 Using stale contact data');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar contatos por texto
 */
async function searchContacts(query: string): Promise<Contact[]> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.search(query).join(':');

  try {
    // Cache de busca
    const cached = await cache.get<Contact[]>(cacheKey);
    if (cached && Date.now() - new Date(cached[0]?.updatedAt || 0).getTime() < 5 * 60 * 1000) {
      console.log('🔍 Search results from cache');
      return cached;
    }

    const result = await contactService.findAll({
      search: query,
      limit: 20
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro na busca');
    }

    const contacts = result.data || [];

    // Cache de resultados de busca
    await cache.set(cacheKey, contacts, {
      strategy: CACHE_STRATEGIES.search,
      tags: ['clients', 'search'],
      syncAcrossTabs: true
    });

    return contacts;

  } catch (error) {
    console.error('Erro na busca:', error);
    
    const staleData = await cache.get<Contact[]>(cacheKey);
    if (staleData) {
      console.warn('🔍 Using stale search results');
      return staleData;
    }
    
    throw error;
  }
}

// ================================================================
// HOOK PRINCIPAL OTIMIZADO
// ================================================================

export interface UseClientsOptions {
  filters?: ContactFilters;
  enableRealtime?: boolean;
  enablePrefetch?: boolean;
}

export interface UseClientsReturn {
  // Dados principais
  contacts: Contact[];
  totalContacts: number;
  stats: ContactStats | undefined;
  funnel: LeadFunnelStats | undefined;
  campaigns: MessageCampaign[] | undefined;

  // Estados
  isLoading: boolean;
  isLoadingStats: boolean;
  isLoadingFunnel: boolean;
  isLoadingCampaigns: boolean;
  error: Error | null;
  hasError: boolean;

  // Mutations
  createContact: (data: CreateContactDTO) => Promise<Contact>;
  updateContact: (id: string, data: UpdateContactDTO) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  updateLeadStage: (id: string, stage: LeadStage) => Promise<Contact>;
  updateLeadScore: (id: string) => Promise<Contact>;
  bulkUpdateStage: (ids: string[], stage: LeadStage) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  addActivity: (contactId: string, activity: Omit<LeadActivity, 'id' | 'createdAt'>) => Promise<LeadActivity>;
  createCampaign: (campaign: Omit<MessageCampaign, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MessageCampaign>;

  // Controles
  refetch: () => void;
  refetchStats: () => void;
  refetchFunnel: () => void;
  refetchCampaigns: () => void;
  searchContacts: (query: string) => Promise<Contact[]>;

  // Status
  isOnline: boolean;
  isOffline: boolean;
  lastUpdated: string | null;
  cacheMetrics: {
    hitRate: number;
    size: number;
    offlineQueueSize: number;
  };
}

export function useClientsV2(options: UseClientsOptions = {}): UseClientsReturn {
  const {
    filters,
    enableRealtime = true,
    enablePrefetch = true
  } = options;

  const queryClient = useQueryClient();
  const cache = getUnifiedCache();
  const { invalidateByTags, invalidateMultiple } = useCacheInvalidation();
  const { batchInvalidate } = useCacheBatchInvalidation();
  const { isOnline, queueSize } = useOfflineCache();
  const { prefetch } = useCachePrefetch();
  const { optimisticUpdate } = useOptimisticCache();
  
  const [cacheMetrics, setCacheMetrics] = useState(cache.getMetrics());

  // Query principal de contatos
  const contactsQuery = useCacheQuery(
    CLIENT_QUERY_KEYS.list(filters),
    () => fetchContacts(filters),
    {
      strategy: CACHE_STRATEGIES.list,
      tags: ['clients', 'list'],
      staleTime: 5 * 60 * 1000
    },
    {
      enabled: true,
      retry: isOnline ? 2 : 0
    }
  );

  // Query de estatísticas
  const statsQuery = useCacheQuery(
    CLIENT_QUERY_KEYS.stats(filters),
    () => fetchContactStats(filters),
    {
      strategy: CACHE_STRATEGIES.stats,
      tags: ['clients', 'stats'],
      staleTime: 10 * 1000
    },
    {
      refetchInterval: isOnline ? 30 * 1000 : false // Refresh a cada 30s
    }
  );

  // Query do funil
  const funnelQuery = useCacheQuery(
    CLIENT_QUERY_KEYS.funnel(filters?.agentId),
    () => fetchLeadFunnel(filters?.agentId),
    {
      strategy: CACHE_STRATEGIES.funnel,
      tags: ['clients', 'funnel'],
      staleTime: 10 * 1000
    },
    {
      refetchInterval: isOnline ? 30 * 1000 : false
    }
  );

  // Query de campanhas
  const campaignsQuery = useCacheQuery(
    CLIENT_QUERY_KEYS.campaigns(),
    fetchCampaigns,
    {
      strategy: CACHE_STRATEGIES.campaigns,
      tags: ['clients', 'campaigns'],
      staleTime: 30 * 60 * 1000
    }
  );

  // Atualizar métricas de cache
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheMetrics(cache.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [cache]);

  // Configurar real-time updates
  useEffect(() => {
    if (!enableRealtime) return;

    const events = [
      SystemEvents.CONTACT_CREATED,
      SystemEvents.CONTACT_UPDATED,
      SystemEvents.CONTACT_DELETED,
      SystemEvents.CONTACT_STAGE_CHANGED,
      SystemEvents.LEAD_SCORED,
      SystemEvents.CAMPAIGN_CREATED,
      SystemEvents.CAMPAIGN_UPDATED
    ];

    const subscriptions = events.map(event =>
      EventBus.on(event, async (data) => {
        // Invalidar caches relevantes
        switch (event) {
          case SystemEvents.CONTACT_CREATED:
          case SystemEvents.CONTACT_DELETED:
            await batchInvalidate([
              ['clients', 'list'],
              ['clients', 'stats'],
              ['clients', 'funnel']
            ]);
            break;
            
          case SystemEvents.CONTACT_STAGE_CHANGED:
          case SystemEvents.LEAD_SCORED:
            await invalidateByTags(['clients', 'funnel']);
            if (data.contactId) {
              await invalidateByTags(['clients', 'detail', data.contactId]);
            }
            break;
            
          case SystemEvents.CAMPAIGN_CREATED:
          case SystemEvents.CAMPAIGN_UPDATED:
            await invalidateByTags(['clients', 'campaigns']);
            break;
        }
      })
    );

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [enableRealtime, batchInvalidate, invalidateByTags]);

  // Mutations com cache unificado
  const createMutation = useCacheMutation<Contact, Error, CreateContactDTO>(
    async (data) => {
      // Validar dados
      const validated = ContactSchema.parse(data);
      
      const result = await contactService.create(validated);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao criar contato');
      }
      return result.data;
    },
    {
      onSuccess: async (contact) => {
        // Invalidar listas e stats
        await batchInvalidate([
          ['clients', 'list'],
          ['clients', 'stats'],
          ['clients', 'funnel']
        ]);
        
        // Adicionar ao cache individual
        const detailKey = CLIENT_QUERY_KEYS.detail(contact.id).join(':');
        await cache.set(detailKey, contact, {
          strategy: CACHE_STRATEGIES.detail,
          tags: ['clients', 'detail', contact.id]
        });

        // Emitir evento
        EventBus.emit(SystemEvents.CONTACT_CREATED, contact);
        toast.success('Contato criado com sucesso!');
      },
      onError: (error) => {
        console.error('Erro ao criar contato:', error);
        toast.error(error.message || 'Erro ao criar contato');
      }
    }
  );

  const updateMutation = useCacheMutation<Contact, Error, { id: string; data: UpdateContactDTO }>(
    async ({ id, data }) => {
      const result = await contactService.update(id, data);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao atualizar contato');
      }
      return result.data;
    },
    {
      onMutate: async ({ id, data }) => {
        // Optimistic update
        const previousData = await optimisticUpdate(
          CLIENT_QUERY_KEYS.detail(id),
          (old: Contact) => ({ ...old, ...data })
        );
        return { previousData };
      },
      onSuccess: async (contact) => {
        await invalidateByTags(['clients']);
        EventBus.emit(SystemEvents.CONTACT_UPDATED, contact);
        toast.success('Contato atualizado!');
      },
      onError: (error, variables, context) => {
        // Reverter optimistic update
        if (context?.previousData) {
          queryClient.setQueryData(
            CLIENT_QUERY_KEYS.detail(variables.id),
            context.previousData
          );
        }
        toast.error(error.message || 'Erro ao atualizar');
      }
    }
  );

  const deleteMutation = useCacheMutation<void, Error, string>(
    async (id) => {
      const result = await contactService.delete(id);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar contato');
      }
    },
    {
      onSuccess: async (_, id) => {
        // Remover do cache
        await cache.remove(CLIENT_QUERY_KEYS.detail(id).join(':'));
        await batchInvalidate([
          ['clients', 'list'],
          ['clients', 'stats'],
          ['clients', 'funnel']
        ]);
        
        EventBus.emit(SystemEvents.CONTACT_DELETED, { id });
        toast.success('Contato removido!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover contato');
      }
    }
  );

  const updateStageMutation = useCacheMutation<Contact, Error, { id: string; stage: LeadStage }>(
    async ({ id, stage }) => {
      const result = await contactService.updateLeadStage(id, stage);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao atualizar estágio');
      }
      return result.data;
    },
    {
      onMutate: async ({ id, stage }) => {
        const previousData = await optimisticUpdate(
          CLIENT_QUERY_KEYS.detail(id),
          (old: Contact) => ({ ...old, leadStage: stage })
        );
        return { previousData };
      },
      onSuccess: async (contact) => {
        await invalidateByTags(['clients', 'funnel']);
        EventBus.emit(SystemEvents.CONTACT_STAGE_CHANGED, contact);
        toast.success(`Lead movido para ${contact.leadStage}`);
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            CLIENT_QUERY_KEYS.detail(variables.id),
            context.previousData
          );
        }
        toast.error(error.message || 'Erro ao atualizar estágio');
      }
    }
  );

  const updateScoreMutation = useCacheMutation<Contact, Error, string>(
    async (id) => {
      const result = await contactService.updateLeadScore(id);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao calcular score');
      }
      return result.data;
    },
    {
      onSuccess: async (contact) => {
        await invalidateByTags(['clients', 'detail', contact.id]);
        EventBus.emit(SystemEvents.LEAD_SCORED, contact);
        toast.success(`Score atualizado: ${contact.leadScore}`);
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao calcular score');
      }
    }
  );

  const bulkUpdateStageMutation = useCacheMutation<void, Error, { ids: string[]; stage: LeadStage }>(
    async ({ ids, stage }) => {
      const result = await contactService.bulkUpdateStage(ids, stage);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar em lote');
      }
    },
    {
      onSuccess: async (_, { ids, stage }) => {
        await batchInvalidate([
          ['clients', 'list'],
          ['clients', 'funnel']
        ]);
        
        // Invalidar cache individual de cada contato
        for (const id of ids) {
          await cache.remove(CLIENT_QUERY_KEYS.detail(id).join(':'));
        }
        
        toast.success(`${ids.length} contatos atualizados para ${stage}`);
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar em lote');
      }
    }
  );

  const bulkDeleteMutation = useCacheMutation<void, Error, string[]>(
    async (ids) => {
      const result = await contactService.bulkDelete(ids);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar em lote');
      }
    },
    {
      onSuccess: async (_, ids) => {
        await batchInvalidate([
          ['clients', 'list'],
          ['clients', 'stats'],
          ['clients', 'funnel']
        ]);
        
        // Remover do cache individual
        for (const id of ids) {
          await cache.remove(CLIENT_QUERY_KEYS.detail(id).join(':'));
        }
        
        toast.success(`${ids.length} contatos removidos`);
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao deletar em lote');
      }
    }
  );

  const addActivityMutation = useCacheMutation<LeadActivity, Error, { 
    contactId: string; 
    activity: Omit<LeadActivity, 'id' | 'createdAt'> 
  }>(
    async ({ contactId, activity }) => {
      const result = await contactService.addActivity(contactId, activity);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao adicionar atividade');
      }
      return result.data;
    },
    {
      onSuccess: async (activity, { contactId }) => {
        await invalidateByTags(['clients', 'activities', contactId]);
        toast.success('Atividade registrada!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao adicionar atividade');
      }
    }
  );

  const createCampaignMutation = useCacheMutation<MessageCampaign, Error, Omit<MessageCampaign, 'id' | 'createdAt' | 'updatedAt'>>(
    async (campaign) => {
      const result = await contactService.createCampaign(campaign);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao criar campanha');
      }
      return result.data;
    },
    {
      onSuccess: async (campaign) => {
        await invalidateByTags(['clients', 'campaigns']);
        EventBus.emit(SystemEvents.CAMPAIGN_CREATED, campaign);
        toast.success('Campanha criada com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar campanha');
      }
    }
  );

  // Função de busca com debounce interno
  const searchContactsHandler = useCallback(async (query: string) => {
    if (!query || query.length < 2) return [];
    
    try {
      return await searchContacts(query);
    } catch (error) {
      console.error('Erro na busca:', error);
      return [];
    }
  }, []);

  // Estados derivados
  const contacts = contactsQuery.data?.data || [];
  const totalContacts = contactsQuery.data?.total || 0;
  const hasError = Boolean(contactsQuery.error || statsQuery.error || funnelQuery.error);
  const lastUpdated = contactsQuery.data?.lastUpdated || null;

  return {
    // Dados principais
    contacts,
    totalContacts,
    stats: statsQuery.data,
    funnel: funnelQuery.data,
    campaigns: campaignsQuery.data,

    // Estados
    isLoading: contactsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingFunnel: funnelQuery.isLoading,
    isLoadingCampaigns: campaignsQuery.isLoading,
    error: contactsQuery.error || statsQuery.error || funnelQuery.error,
    hasError,

    // Mutations
    createContact: (data) => createMutation.mutateAsync(data),
    updateContact: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteContact: (id) => deleteMutation.mutateAsync(id),
    updateLeadStage: (id, stage) => updateStageMutation.mutateAsync({ id, stage }),
    updateLeadScore: (id) => updateScoreMutation.mutateAsync(id),
    bulkUpdateStage: (ids, stage) => bulkUpdateStageMutation.mutateAsync({ ids, stage }),
    bulkDelete: (ids) => bulkDeleteMutation.mutateAsync(ids),
    addActivity: (contactId, activity) => addActivityMutation.mutateAsync({ contactId, activity }),
    createCampaign: (campaign) => createCampaignMutation.mutateAsync(campaign),

    // Controles
    refetch: () => contactsQuery.refetch(),
    refetchStats: () => statsQuery.refetch(),
    refetchFunnel: () => funnelQuery.refetch(),
    refetchCampaigns: () => campaignsQuery.refetch(),
    searchContacts: searchContactsHandler,

    // Status
    isOnline,
    isOffline: !isOnline,
    lastUpdated,
    cacheMetrics: {
      hitRate: cacheMetrics.hitRate,
      size: cacheMetrics.size,
      offlineQueueSize: queueSize
    }
  };
}

// ================================================================
// HOOKS ESPECÍFICOS
// ================================================================

/**
 * Hook para buscar um contato específico
 */
export function useContactV2(id: string) {
  const cache = getUnifiedCache();
  const { isOnline } = useOfflineCache();

  const query = useCacheQuery(
    CLIENT_QUERY_KEYS.detail(id),
    () => fetchContactById(id),
    {
      strategy: CACHE_STRATEGIES.detail,
      tags: ['clients', 'detail', id],
      staleTime: 5 * 60 * 1000
    },
    {
      enabled: Boolean(id),
      retry: isOnline ? 2 : 0
    }
  );

  return {
    contact: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para atividades de um contato
 */
export function useContactActivitiesV2(contactId: string) {
  const { isOnline } = useOfflineCache();

  const query = useCacheQuery(
    CLIENT_QUERY_KEYS.activities(contactId),
    () => fetchContactActivities(contactId),
    {
      strategy: CACHE_STRATEGIES.activities,
      tags: ['clients', 'activities', contactId],
      staleTime: 0 // Sempre fresh
    },
    {
      enabled: Boolean(contactId) && isOnline,
      refetchInterval: 30 * 1000 // Atualizar a cada 30s
    }
  );

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para busca de contatos com debounce
 */
export function useContactSearchV2(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce da query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useCacheQuery(
    CLIENT_QUERY_KEYS.search(debouncedQuery),
    () => searchContacts(debouncedQuery),
    {
      strategy: CACHE_STRATEGIES.search,
      tags: ['clients', 'search'],
      staleTime: 5 * 60 * 1000
    },
    {
      enabled: debouncedQuery.length >= 2
    }
  );

  return {
    query,
    setQuery,
    results: searchQuery.data || [],
    isSearching: searchQuery.isLoading,
    error: searchQuery.error
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default useClientsV2;