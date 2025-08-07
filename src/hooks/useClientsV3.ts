// ================================================================
// HOOK USECLIENTS V3 - MIGRAÇÃO PARA NOVO SISTEMA MVP (6 TABELAS)
// ================================================================
// Data: 07/08/2025
// Descrição: Hook migrado para usar dadosCliente.service.ts (nova tabela dados_cliente)
// Migração: Contact → DadosCliente com mapeamento de compatibilidade
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
import { dadosClienteService } from '@/services/dadosCliente.service';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from 'sonner';
import { z } from 'zod';
import type { 
  DadosCliente,
  DadosClienteFilters,
  DadosClienteStats,
  DadosClienteInsert,
  DadosClienteUpdate
} from '@/services/dadosCliente.service';

// ================================================================
// TIPOS DE COMPATIBILIDADE (MANTER INTERFACE PÚBLICA IGUAL)
// ================================================================

// Mantém interface Contact para compatibilidade com código existente
export interface Contact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  category: 'CLIENT' | 'LEAD' | 'PARTNER'
  status: 'ACTIVE' | 'NEW' | 'INACTIVE'
  leadStage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'INTERESTED' | 'NEGOTIATING' | 'CONVERTED' | 'LOST'
  leadScore: number
  leadSource?: string | null
  leadSourceDetails?: string | null
  company?: string | null
  position?: string | null
  budget?: number | null
  timeline?: string | null
  preferences?: any
  interactionCount: number
  lastInteractionAt?: string | null
  responseRate?: number | null
  engagementLevel?: string | null
  isQualified: boolean
  qualificationNotes?: string | null
  tags: string[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  unsubscribed: boolean
  unsubscribedAt?: string | null
  optInWhatsApp: boolean
  optInEmail: boolean
  optInSMS: boolean
  nextFollowUpAt?: string | null
  followUpReason?: string | null
  agentId: string
  createdAt: string
  updatedAt: string
}

export interface ContactFilters {
  leadStage?: Contact['leadStage']
  status?: Contact['status']
  category?: Contact['category']
  agentId?: string
  search?: string
  minScore?: number
  maxScore?: number
  leadSource?: string
  priority?: Contact['priority']
  isQualified?: boolean
  tags?: string[]
  hasActivity?: boolean
  needsFollowUp?: boolean
  dateStart?: string
  dateEnd?: string
}

export interface ContactStats {
  total: number
  byStage: Record<string, number>
  byStatus: Record<string, number>
  bySource: Record<string, number>
  byAgent: Record<string, number>
  avgScore: number
  qualified: number
  needingFollowUp: number
  converted: number
  lastUpdated?: string
}

export interface LeadFunnelStats {
  stages: {
    stage: string
    count: number
    percentage: number
    averageTime: number
  }[]
  conversion: {
    total: number
    converted: number
    rate: number
  }
  lastUpdated?: string
}

export interface LeadActivity {
  id: string
  type: string
  title: string
  description?: string
  direction?: string
  channel?: string
  duration?: number
  outcome?: string
  nextAction?: string
  metadata?: any
  performedById?: string
  contactId: string
  appointmentId?: string
  dealId?: string
  createdAt: string
  updatedAt: string
}

export interface MessageCampaign {
  id: string
  name: string
  description?: string
  channel: string
  status: string
  subject?: string
  template: string
  variables?: any
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  targetCriteria?: any
  sendDelay?: number
  maxRecipients?: number
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  readCount: number
  responseCount: number
  errorCount: number
  createdAt: string
  updatedAt: string
}

export type CreateContactDTO = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateContactDTO = Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>

// ================================================================
// FUNÇÕES DE MAPEAMENTO ENTRE SISTEMAS
// ================================================================

/**
 * Mapeia DadosCliente (novo) para Contact (interface pública)
 */
function mapDadosClienteToContact(dadosCliente: DadosCliente): Contact {
  return {
    id: dadosCliente.id,
    name: dadosCliente.nome,
    email: dadosCliente.email,
    phone: dadosCliente.telefone,
    category: mapStatusToCategory(dadosCliente.status),
    status: mapStatusToContactStatus(dadosCliente.status),
    leadStage: mapStatusToLeadStage(dadosCliente.status),
    leadScore: dadosCliente.score_lead || 50,
    leadSource: dadosCliente.origem || null,
    leadSourceDetails: dadosCliente.detalhes_origem,
    company: dadosCliente.empresa,
    position: dadosCliente.cargo,
    budget: dadosCliente.orcamento_disponivel ? Number(dadosCliente.orcamento_disponivel) : null,
    timeline: dadosCliente.prazo_desejado,
    preferences: dadosCliente.preferencias_estruturadas,
    interactionCount: dadosCliente.contador_interacoes || 0,
    lastInteractionAt: dadosCliente.data_ultima_interacao,
    responseRate: dadosCliente.taxa_resposta,
    engagementLevel: dadosCliente.nivel_engajamento,
    isQualified: dadosCliente.qualificado || false,
    qualificationNotes: dadosCliente.observacoes_qualificacao,
    tags: dadosCliente.tags_personalizadas || [],
    priority: mapPrioridadeToEnglish(dadosCliente.prioridade),
    unsubscribed: dadosCliente.descadastrou || false,
    unsubscribedAt: dadosCliente.data_descadastro,
    optInWhatsApp: dadosCliente.opt_in_whatsapp || false,
    optInEmail: dadosCliente.opt_in_email || false,
    optInSMS: dadosCliente.opt_in_sms || false,
    nextFollowUpAt: dadosCliente.proximo_followup_em,
    followUpReason: dadosCliente.motivo_followup,
    agentId: dadosCliente.funcionario_responsavel || '',
    createdAt: dadosCliente.created_at,
    updatedAt: dadosCliente.updated_at
  }
}

/**
 * Mapeia Contact (interface pública) para DadosCliente (novo sistema)
 */
function mapContactToDadosCliente(contact: Partial<Contact>): Partial<DadosCliente> {
  return {
    nome: contact.name,
    email: contact.email,
    telefone: contact.phone,
    status: mapLeadStageToStatus(contact.leadStage),
    score_lead: contact.leadScore,
    origem: contact.leadSource,
    detalhes_origem: contact.leadSourceDetails,
    empresa: contact.company,
    cargo: contact.position,
    orcamento_disponivel: contact.budget ? String(contact.budget) : null,
    prazo_desejado: contact.timeline,
    preferencias_estruturadas: contact.preferences,
    taxa_resposta: contact.responseRate,
    nivel_engajamento: contact.engagementLevel,
    qualificado: contact.isQualified,
    observacoes_qualificacao: contact.qualificationNotes,
    tags_personalizadas: contact.tags,
    prioridade: mapEnglishToPrioridade(contact.priority),
    descadastrou: contact.unsubscribed,
    data_descadastro: contact.unsubscribedAt,
    opt_in_whatsapp: contact.optInWhatsApp,
    opt_in_email: contact.optInEmail,
    opt_in_sms: contact.optInSMS,
    proximo_followup_em: contact.nextFollowUpAt,
    motivo_followup: contact.followUpReason,
    funcionario_responsavel: contact.agentId
  }
}

/**
 * Mapeia ContactFilters para DadosClienteFilters
 */
function mapContactFiltersToDadosClienteFilters(filters: ContactFilters = {}): DadosClienteFilters {
  return {
    status: filters.leadStage ? mapLeadStageToStatus(filters.leadStage) : undefined,
    funcionario_responsavel: filters.agentId,
    search: filters.search,
    minScore: filters.minScore,
    maxScore: filters.maxScore,
    origem: filters.leadSource,
    prioridade: filters.priority ? mapEnglishToPrioridade(filters.priority) : undefined,
    qualificado: filters.isQualified,
    tags: filters.tags,
    dateStart: filters.dateStart,
    dateEnd: filters.dateEnd
  }
}

// ================================================================
// FUNÇÕES DE MAPEAMENTO DE VALORES
// ================================================================

function mapStatusToCategory(status?: string | null): 'CLIENT' | 'LEAD' | 'PARTNER' {
  switch (status) {
    case 'cliente':
    case 'convertido':
      return 'CLIENT'
    case 'novo':
    case 'contatado':  
    case 'qualificado':
    case 'interessado':
    case 'negociando':
      return 'LEAD'
    default:
      return 'LEAD'
  }
}

function mapStatusToContactStatus(status?: string | null): 'ACTIVE' | 'NEW' | 'INACTIVE' {
  switch (status) {
    case 'novo':
      return 'NEW'
    case 'perdido':
    case 'inativo':
      return 'INACTIVE'
    default:
      return 'ACTIVE'
  }
}

function mapStatusToLeadStage(status?: string | null): 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'INTERESTED' | 'NEGOTIATING' | 'CONVERTED' | 'LOST' {
  switch (status) {
    case 'novo':
      return 'NEW'
    case 'contatado':
      return 'CONTACTED'
    case 'qualificado':
      return 'QUALIFIED'
    case 'interessado':
      return 'INTERESTED'
    case 'negociando':
      return 'NEGOTIATING'
    case 'convertido':
      return 'CONVERTED'
    case 'perdido':
      return 'LOST'
    default:
      return 'NEW'
  }
}

function mapLeadStageToStatus(leadStage?: string): string {
  switch (leadStage) {
    case 'NEW':
      return 'novo'
    case 'CONTACTED':
      return 'contatado'
    case 'QUALIFIED':
      return 'qualificado'
    case 'INTERESTED':
      return 'interessado'
    case 'NEGOTIATING':
      return 'negociando'
    case 'CONVERTED':
      return 'convertido'
    case 'LOST':
      return 'perdido'
    default:
      return 'novo'
  }
}

function mapPrioridadeToEnglish(prioridade?: string | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  switch (prioridade) {
    case 'baixa':
      return 'LOW'
    case 'media':
      return 'MEDIUM'
    case 'alta':
      return 'HIGH'
    case 'urgente':
      return 'URGENT'
    default:
      return 'MEDIUM'
  }
}

function mapEnglishToPrioridade(priority?: string): string {
  switch (priority) {
    case 'LOW':
      return 'baixa'
    case 'MEDIUM':
      return 'media'
    case 'HIGH':
      return 'alta'
    case 'URGENT':
      return 'urgente'
    default:
      return 'media'
  }
}

// ================================================================
// SCHEMAS DE VALIDAÇÃO
// ================================================================

const ContactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().min(10, 'Telefone inválido').optional().nullable(),
  category: z.enum(['CLIENT', 'LEAD', 'PARTNER']).optional(),
  leadStage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED', 'LOST']).optional(),
  leadSource: z.string().optional(),
  company: z.string().optional(),
  budget: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
});

// ================================================================
// KEYS DE CACHE CONSOLIDADAS (MANTIDAS PARA COMPATIBILIDADE)
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
// FUNÇÕES DE API COM NOVO SERVICE (dadosCliente)
// ================================================================

/**
 * Buscar lista de contatos/clientes com filtros usando novo service
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
      console.log('👥 Contacts list from cache (V3)');
      return cached;
    }

    // Converter filtros e buscar do novo service
    const dadosClienteFilters = mapContactFiltersToDadosClienteFilters(filters);
    const result = await dadosClienteService.findAll({
      filters: dadosClienteFilters,
      limit: filters?.limit,
      offset: filters?.offset
    });
    
    if (result.error) {
      throw new Error(result.error.message || 'Erro ao buscar contatos');
    }

    // Mapear resultado para interface Contact
    const mappedData = (result.data || []).map(mapDadosClienteToContact);

    const response = {
      data: mappedData,
      total: result.count || 0,
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

    console.log(`👥 Loaded ${mappedData.length} contacts from dadosCliente service`);
    return response;

  } catch (error) {
    console.error('Erro ao buscar contatos (V3):', error);
    
    // Tentar cache stale
    const staleData = await cache.get<{ data: Contact[]; total: number }>(cacheKey);
    if (staleData) {
      console.warn('👥 Using stale contacts data (V3)');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar estatísticas de contatos usando novo service
 */
async function fetchContactStats(filters?: ContactFilters): Promise<ContactStats> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.stats(filters).join(':');

  try {
    // Cache crítico de curta duração
    const cached = await cache.get<ContactStats>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 10 * 1000) {
      console.log('📊 Contact stats from cache (V3)');
      return cached;
    }

    const result = await dadosClienteService.getStats();
    
    if (result.error || !result.data) {
      throw new Error(result.error?.message || 'Erro ao buscar estatísticas');
    }

    // Mapear estatísticas do novo formato para interface antiga
    const stats: ContactStats = {
      total: result.data.total,
      byStage: mapStatusStatsToStageStats(result.data.byStatus),
      byStatus: mapStatusStatsToContactStatus(result.data.byStatus),
      bySource: result.data.bySource,
      byAgent: result.data.byAgent,
      avgScore: result.data.avgScore,
      qualified: result.data.qualified,
      needingFollowUp: result.data.needingFollowUp,
      converted: result.data.byStatus['convertido'] || 0,
      lastUpdated: new Date().toISOString()
    };

    // Cache sem compressão (dados pequenos e críticos)
    await cache.set(cacheKey, stats, {
      strategy: CACHE_STRATEGIES.stats,
      tags: ['clients', 'stats'],
      compress: false,
      syncAcrossTabs: true
    });

    console.log('📊 Loaded contact stats from dadosCliente service');
    return stats;

  } catch (error) {
    console.error('Erro ao buscar estatísticas (V3):', error);
    
    const staleData = await cache.get<ContactStats>(cacheKey);
    if (staleData) {
      console.warn('📊 Using stale stats (V3)');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Mapear estatísticas de status para stages (compatibilidade)
 */
function mapStatusStatsToStageStats(byStatus: Record<string, number>): Record<string, number> {
  return {
    'NEW': byStatus['novo'] || 0,
    'CONTACTED': byStatus['contatado'] || 0,
    'QUALIFIED': byStatus['qualificado'] || 0,
    'INTERESTED': byStatus['interessado'] || 0,
    'NEGOTIATING': byStatus['negociando'] || 0,
    'CONVERTED': byStatus['convertido'] || 0,
    'LOST': byStatus['perdido'] || 0
  };
}

/**
 * Mapear estatísticas de status para contact status (compatibilidade)
 */
function mapStatusStatsToContactStatus(byStatus: Record<string, number>): Record<string, number> {
  return {
    'NEW': byStatus['novo'] || 0,
    'ACTIVE': (byStatus['contatado'] || 0) + (byStatus['qualificado'] || 0) + 
              (byStatus['interessado'] || 0) + (byStatus['negociando'] || 0),
    'INACTIVE': (byStatus['perdido'] || 0)
  };
}

/**
 * Buscar contato individual usando novo service
 */
async function fetchContactById(id: string): Promise<Contact> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.detail(id).join(':');

  try {
    // Verificar cache primeiro
    const cached = await cache.get<Contact>(cacheKey);
    if (cached && Date.now() - new Date(cached.updatedAt).getTime() < 5 * 60 * 1000) {
      console.log('👤 Contact detail from cache (V3)');
      return cached;
    }

    const result = await dadosClienteService.findById(id);
    
    if (result.error || !result.data) {
      throw new Error(result.error?.message || 'Contato não encontrado');
    }

    // Mapear para interface Contact
    const mappedContact = mapDadosClienteToContact(result.data);

    // Armazenar no cache
    await cache.set(cacheKey, mappedContact, {
      strategy: CACHE_STRATEGIES.detail,
      tags: ['clients', 'detail', id],
      syncAcrossTabs: true
    });

    console.log('👤 Loaded contact detail from dadosCliente service');
    return mappedContact;

  } catch (error) {
    console.error('Erro ao buscar contato (V3):', error);
    
    const staleData = await cache.get<Contact>(cacheKey);
    if (staleData) {
      console.warn('👤 Using stale contact data (V3)');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar contatos por texto usando novo service
 */
async function searchContacts(query: string): Promise<Contact[]> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.search(query).join(':');

  try {
    // Cache de busca
    const cached = await cache.get<Contact[]>(cacheKey);
    if (cached && Date.now() - new Date(cached[0]?.updatedAt || 0).getTime() < 5 * 60 * 1000) {
      console.log('🔍 Search results from cache (V3)');
      return cached;
    }

    const result = await dadosClienteService.findAll({
      filters: { search: query },
      limit: 20
    });
    
    if (result.error) {
      throw new Error(result.error.message || 'Erro na busca');
    }

    // Mapear resultados
    const mappedContacts = (result.data || []).map(mapDadosClienteToContact);

    // Cache de resultados de busca
    await cache.set(cacheKey, mappedContacts, {
      strategy: CACHE_STRATEGIES.search,
      tags: ['clients', 'search'],
      syncAcrossTabs: true
    });

    console.log(`🔍 Search found ${mappedContacts.length} contacts in dadosCliente service`);
    return mappedContacts;

  } catch (error) {
    console.error('Erro na busca (V3):', error);
    
    const staleData = await cache.get<Contact[]>(cacheKey);
    if (staleData) {
      console.warn('🔍 Using stale search results (V3)');
      return staleData;
    }
    
    throw error;
  }
}

// ================================================================
// FUNÇÕES PLACEHOLDER PARA FUNNEL E CAMPANHAS (A IMPLEMENTAR)
// ================================================================

/**
 * Buscar funil de leads - PLACEHOLDER (implementar depois)
 */
async function fetchLeadFunnel(agentId?: string): Promise<LeadFunnelStats> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.funnel(agentId).join(':');

  try {
    // Cache crítico
    const cached = await cache.get<LeadFunnelStats>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 10 * 1000) {
      console.log('🎯 Lead funnel from cache (V3)');
      return cached;
    }

    // TODO: Implementar usando dadosClienteService
    // Por enquanto, gerar dados simulados baseados nas estatísticas
    const statsResult = await dadosClienteService.getStats();
    
    if (statsResult.error || !statsResult.data) {
      throw new Error('Erro ao buscar dados para funil');
    }

    const funnel: LeadFunnelStats = {
      stages: [
        { stage: 'NEW', count: statsResult.data.byStatus['novo'] || 0, percentage: 0, averageTime: 0 },
        { stage: 'CONTACTED', count: statsResult.data.byStatus['contatado'] || 0, percentage: 0, averageTime: 0 },
        { stage: 'QUALIFIED', count: statsResult.data.byStatus['qualificado'] || 0, percentage: 0, averageTime: 0 },
        { stage: 'INTERESTED', count: statsResult.data.byStatus['interessado'] || 0, percentage: 0, averageTime: 0 },
        { stage: 'NEGOTIATING', count: statsResult.data.byStatus['negociando'] || 0, percentage: 0, averageTime: 0 },
        { stage: 'CONVERTED', count: statsResult.data.byStatus['convertido'] || 0, percentage: 0, averageTime: 0 },
        { stage: 'LOST', count: statsResult.data.byStatus['perdido'] || 0, percentage: 0, averageTime: 0 }
      ],
      conversion: {
        total: statsResult.data.total,
        converted: statsResult.data.byStatus['convertido'] || 0,
        rate: statsResult.data.total > 0 ? ((statsResult.data.byStatus['convertido'] || 0) / statsResult.data.total) * 100 : 0
      },
      lastUpdated: new Date().toISOString()
    };

    await cache.set(cacheKey, funnel, {
      strategy: CACHE_STRATEGIES.funnel,
      tags: ['clients', 'funnel'],
      compress: false,
      syncAcrossTabs: true
    });

    console.log('🎯 Generated funnel from dadosCliente stats');
    return funnel;

  } catch (error) {
    console.error('Erro ao buscar funil (V3):', error);
    
    const staleData = await cache.get<LeadFunnelStats>(cacheKey);
    if (staleData) {
      console.warn('🎯 Using stale funnel data (V3)');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar campanhas - PLACEHOLDER (implementar depois)
 */
async function fetchCampaigns(): Promise<MessageCampaign[]> {
  const cache = getUnifiedCache();
  const cacheKey = CLIENT_QUERY_KEYS.campaigns().join(':');

  try {
    // Cache de longa duração para campanhas
    const cached = await cache.get<MessageCampaign[]>(cacheKey);
    if (cached && Date.now() - new Date(cached[0]?.updatedAt || 0).getTime() < 30 * 60 * 1000) {
      console.log('📧 Campaigns from cache (V3)');
      return cached;
    }

    // TODO: Implementar sistema de campanhas no novo banco
    // Por enquanto, retornar array vazio
    const campaigns: MessageCampaign[] = [];

    // Cache com compressão
    await cache.set(cacheKey, campaigns, {
      strategy: CACHE_STRATEGIES.campaigns,
      tags: ['clients', 'campaigns'],
      compress: true,
      syncAcrossTabs: true
    });

    console.log('📧 Empty campaigns list (V3 - to be implemented)');
    return campaigns;

  } catch (error) {
    console.error('Erro ao buscar campanhas (V3):', error);
    
    const staleData = await cache.get<MessageCampaign[]>(cacheKey);
    if (staleData) {
      console.warn('📧 Using stale campaigns (V3)');
      return staleData;
    }
    
    return [];
  }
}

/**
 * Buscar atividades - PLACEHOLDER (implementar depois)
 */
async function fetchContactActivities(contactId: string): Promise<LeadActivity[]> {
  try {
    // TODO: Implementar sistema de atividades no novo banco
    // Por enquanto, retornar array vazio
    console.log('📝 Empty activities list (V3 - to be implemented)');
    return [];

  } catch (error) {
    console.error('Erro ao buscar atividades (V3):', error);
    return [];
  }
}

// ================================================================
// HOOK PRINCIPAL OTIMIZADO (INTERFACE IGUAL AO V2)
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
  updateLeadStage: (id: string, stage: Contact['leadStage']) => Promise<Contact>;
  updateLeadScore: (id: string) => Promise<Contact>;
  bulkUpdateStage: (ids: string[], stage: Contact['leadStage']) => Promise<void>;
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

export function useClientsV3(options: UseClientsOptions = {}): UseClientsReturn {
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

  // Query principal de contatos usando novo service
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
      refetchInterval: isOnline ? 30 * 1000 : false
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

  // Mutations usando novo service
  const createMutation = useCacheMutation<Contact, Error, CreateContactDTO>(
    async (data) => {
      // Validar dados
      const validated = ContactSchema.parse(data);
      
      // Mapear para DadosCliente e criar
      const dadosClienteData = mapContactToDadosCliente(validated);
      const result = await dadosClienteService.create(dadosClienteData as DadosClienteInsert);
      
      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'Erro ao criar contato');
      }
      
      // Mapear resultado de volta para Contact
      return mapDadosClienteToContact(result.data);
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
        toast.success('Contato criado com sucesso! (V3)');
      },
      onError: (error) => {
        console.error('Erro ao criar contato (V3):', error);
        toast.error(error.message || 'Erro ao criar contato');
      }
    }
  );

  const updateMutation = useCacheMutation<Contact, Error, { id: string; data: UpdateContactDTO }>(
    async ({ id, data }) => {
      // Mapear dados para DadosCliente
      const dadosClienteUpdates = mapContactToDadosCliente(data);
      const result = await dadosClienteService.update(id, dadosClienteUpdates as DadosClienteUpdate);
      
      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'Erro ao atualizar contato');
      }
      
      return mapDadosClienteToContact(result.data);
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
        toast.success('Contato atualizado! (V3)');
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
      const result = await dadosClienteService.delete(id);
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao deletar contato');
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
        toast.success('Contato removido! (V3)');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover contato');
      }
    }
  );

  // Função de busca com debounce interno
  const searchContactsHandler = useCallback(async (query: string) => {
    if (!query || query.length < 2) return [];
    
    try {
      return await searchContacts(query);
    } catch (error) {
      console.error('Erro na busca (V3):', error);
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
    updateLeadStage: async (id, stage) => {
      // TODO: Implementar updateLeadStage específico
      return updateMutation.mutateAsync({ id, data: { leadStage: stage } });
    },
    updateLeadScore: async (id) => {
      // TODO: Implementar cálculo de score
      const contact = contacts.find(c => c.id === id);
      if (!contact) throw new Error('Contato não encontrado');
      return contact;
    },
    bulkUpdateStage: async (ids, stage) => {
      // TODO: Implementar bulk update
      console.log('Bulk update stage (V3 - to be implemented)', ids, stage);
    },
    bulkDelete: async (ids) => {
      // TODO: Implementar bulk delete  
      console.log('Bulk delete (V3 - to be implemented)', ids);
    },
    addActivity: async (contactId, activity) => {
      // TODO: Implementar sistema de atividades
      console.log('Add activity (V3 - to be implemented)', contactId, activity);
      return {} as LeadActivity;
    },
    createCampaign: async (campaign) => {
      // TODO: Implementar sistema de campanhas
      console.log('Create campaign (V3 - to be implemented)', campaign);
      return {} as MessageCampaign;
    },

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
// HOOKS ESPECÍFICOS MIGRADOS
// ================================================================

/**
 * Hook para buscar um contato específico
 */
export function useContactV3(id: string) {
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
export function useContactActivitiesV3(contactId: string) {
  const { isOnline } = useOfflineCache();

  const query = useCacheQuery(
    CLIENT_QUERY_KEYS.activities(contactId),
    () => fetchContactActivities(contactId),
    {
      strategy: CACHE_STRATEGIES.activities,
      tags: ['clients', 'activities', contactId],
      staleTime: 0
    },
    {
      enabled: Boolean(contactId) && isOnline,
      refetchInterval: 30 * 1000
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
export function useContactSearchV3(initialQuery: string = '') {
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

export default useClientsV3;