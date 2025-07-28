/**
 * 🔲 ImobiPRO - Hooks React Query para Clientes
 * 
 * Hooks especializados para gestão de clientes/leads usando React Query.
 * Inclui operações CRUD, cache inteligente e otimistic updates.
 * 
 * Funcionalidades:
 * - CRUD completo de contatos/leads
 * - Gestão de atividades e campanhas
 * - Cache inteligente com invalidação
 * - Otimistic updates para UX fluida
 * - Filtros avançados e busca
 * - Estatísticas do funil
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import clientsService from '@/services/clientsService';
import type { 
  ContactWithDetails, 
  CreateContactInput, 
  UpdateContactInput,
  CreateLeadActivityInput,
  CreateCampaignInput,
  FunnelStats,
  LeadStage, 
  LeadActivity, 
  MessageCampaign, 
  CampaignStatus 
} from '@/types/clients';

// ============================================================================
// KEYS PARA REACT QUERY
// ============================================================================

export const clientsKeys = {
  all: ['clients'] as const,
  contacts: () => [...clientsKeys.all, 'contacts'] as const,
  contact: (id: string) => [...clientsKeys.contacts(), id] as const,
  contactsByFilter: (filters: Record<string, any>) => [...clientsKeys.contacts(), 'filtered', filters] as const,
  activities: (contactId: string) => [...clientsKeys.all, 'activities', contactId] as const,
  campaigns: () => [...clientsKeys.all, 'campaigns'] as const,
  campaign: (id: string) => [...clientsKeys.campaigns(), id] as const,
  stats: (agentId?: string) => [...clientsKeys.all, 'stats', agentId] as const,
  funnel: (agentId?: string) => [...clientsKeys.all, 'funnel', agentId] as const,
} as const;

// ============================================================================
// HOOKS DE CONTATOS/LEADS
// ============================================================================

/**
 * Hook para buscar contatos com filtros avançados
 */
export function useContacts(filters: {
  agentId?: string;
  leadStage?: LeadStage;
  leadSource?: string;
  priority?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: clientsKeys.contactsByFilter(filters),
    queryFn: () => clientsService.getContacts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar contato específico por ID
 */
export function useContact(id: string) {
  return useQuery({
    queryKey: clientsKeys.contact(id),
    queryFn: () => clientsService.getContactById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para criar novo contato
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContactInput) => clientsService.createContact(input),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: clientsKeys.stats() });
      queryClient.invalidateQueries({ queryKey: clientsKeys.funnel() });

      // Adicionar ao cache individual
      queryClient.setQueryData(clientsKeys.contact(data.id), data);

      toast({
        title: "✅ Contato criado",
        description: `${data.name} foi adicionado ao funil com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar contato:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao criar contato",
        description: "Não foi possível criar o contato. Tente novamente.",
      });
    },
  });
}

/**
 * Hook para atualizar contato
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContactInput }) =>
      clientsService.updateContact(id, input),
    onMutate: async ({ id, input }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: clientsKeys.contact(id) });

      // Snapshot do valor anterior
      const previousContact = queryClient.getQueryData(clientsKeys.contact(id));

      // Otimistic update
      if (previousContact) {
        queryClient.setQueryData(clientsKeys.contact(id), {
          ...previousContact,
          ...input,
          updatedAt: new Date()
        });
      }

      return { previousContact };
    },
    onSuccess: (data, { id }) => {
      // Atualizar cache com dados reais
      queryClient.setQueryData(clientsKeys.contact(id), data);
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: clientsKeys.stats() });

      toast({
        title: "✅ Contato atualizado",
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error, { id }, context) => {
      // Reverter otimistic update
      if (context?.previousContact) {
        queryClient.setQueryData(clientsKeys.contact(id), context.previousContact);
      }

      console.error('Erro ao atualizar contato:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao atualizar",
        description: "Não foi possível atualizar o contato. Tente novamente.",
      });
    },
  });
}

/**
 * Hook para mover contato no funil (atualizar leadStage)
 */
export function useMoveContactInFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newStage }: { id: string; newStage: LeadStage }) =>
      clientsService.updateContact(id, { leadStage: newStage }),
    onMutate: async ({ id, newStage }) => {
      await queryClient.cancelQueries({ queryKey: clientsKeys.contact(id) });

      const previousContact = queryClient.getQueryData(clientsKeys.contact(id)) as ContactWithDetails;

      if (previousContact) {
        queryClient.setQueryData(clientsKeys.contact(id), {
          ...previousContact,
          leadStage: newStage,
          updatedAt: new Date()
        });
      }

      return { previousContact };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: clientsKeys.funnel() });
      
      toast({
        title: "🚀 Lead movido",
        description: `${data.name} foi movido para ${data.leadStage}.`,
      });
    },
    onError: (error, { id }, context) => {
      if (context?.previousContact) {
        queryClient.setQueryData(clientsKeys.contact(id), context.previousContact);
      }

      toast({
        variant: "destructive",
        title: "❌ Erro ao mover lead",
        description: "Não foi possível mover o lead no funil.",
      });
    },
  });
}

/**
 * Hook para deletar contato
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsService.deleteContact(id),
    onSuccess: (_, id) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: clientsKeys.contact(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: clientsKeys.stats() });

      toast({
        title: "🗑️ Contato removido",
        description: "O contato foi removido permanentemente.",
      });
    },
    onError: (error) => {
      console.error('Erro ao deletar contato:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao remover",
        description: "Não foi possível remover o contato.",
      });
    },
  });
}

// ============================================================================
// HOOKS DE ATIVIDADES
// ============================================================================

/**
 * Hook para buscar atividades de um lead
 */
export function useLeadActivities(contactId: string) {
  return useQuery({
    queryKey: clientsKeys.activities(contactId),
    queryFn: () => clientsService.getLeadActivities(contactId),
    enabled: !!contactId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para criar atividade de lead
 */
export function useCreateLeadActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeadActivityInput) => clientsService.createLeadActivity(input),
    onSuccess: (data, input) => {
      // Invalidar atividades do contato
      queryClient.invalidateQueries({ queryKey: clientsKeys.activities(input.contactId) });
      
      // Invalidar dados do contato (para atualizar estatísticas)
      queryClient.invalidateQueries({ queryKey: clientsKeys.contact(input.contactId) });

      toast({
        title: "📝 Atividade registrada",
        description: `${data.title} foi registrada com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar atividade:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao registrar atividade",
        description: "Não foi possível registrar a atividade.",
      });
    },
  });
}

// ============================================================================
// HOOKS DE CAMPANHAS
// ============================================================================

/**
 * Hook para buscar campanhas
 */
export function useCampaigns(filters: {
  status?: CampaignStatus;
  channel?: string;
  createdById?: string;
} = {}) {
  return useQuery({
    queryKey: [...clientsKeys.campaigns(), filters],
    queryFn: () => clientsService.getCampaigns(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para criar campanha
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCampaignInput) => clientsService.createCampaign(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.campaigns() });
      
      toast({
        title: "📢 Campanha criada",
        description: `${data.name} foi criada com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar campanha:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao criar campanha",
        description: "Não foi possível criar a campanha.",
      });
    },
  });
}

// ============================================================================
// HOOKS DE ESTATÍSTICAS E RELATÓRIOS
// ============================================================================

/**
 * Hook para buscar estatísticas do funil
 */
export function useFunnelStats(agentId?: string) {
  return useQuery({
    queryKey: clientsKeys.funnel(agentId),
    queryFn: () => clientsService.getFunnelStats(agentId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 30 * 1000, // Atualizar a cada 30s
  });
}

// ============================================================================
// HOOKS COMPOSTOS E UTILITÁRIOS
// ============================================================================

/**
 * Hook para gerenciar estado do funil Kanban
 */
export function useFunnelKanban(agentId?: string) {
  const { data: contacts, isLoading } = useContacts({ agentId });
  const { data: stats } = useFunnelStats(agentId);
  const moveContact = useMoveContactInFunnel();

  // Organizar contatos por stage
  const contactsByStage = contacts?.contacts.reduce((acc, contact) => {
    const stage = contact.leadStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(contact);
    return acc;
  }, {} as Record<LeadStage, ContactWithDetails[]>) || {};

  // Função para mover contato no Kanban
  const handleMoveContact = (contactId: string, newStage: LeadStage) => {
    moveContact.mutate({ id: contactId, newStage });
  };

  return {
    contactsByStage,
    stats,
    isLoading,
    moveContact: handleMoveContact,
    isMoving: moveContact.isPending,
  };
}

/**
 * Hook para busca inteligente de contatos
 */
export function useContactSearch() {
  const queryClient = useQueryClient();

  const searchContacts = async (query: string, filters?: Record<string, any>) => {
    const searchFilters = {
      ...filters,
      search: query,
      limit: 20
    };

    return queryClient.fetchQuery({
      queryKey: clientsKeys.contactsByFilter(searchFilters),
      queryFn: () => clientsService.getContacts(searchFilters),
      staleTime: 30 * 1000, // 30 segundos para buscas
    });
  };

  return { searchContacts };
}

/**
 * Hook para ações em lote
 */
export function useBulkContactActions() {
  const queryClient = useQueryClient();
  const updateContact = useUpdateContact();

  const bulkUpdateStage = async (contactIds: string[], newStage: LeadStage) => {
    const promises = contactIds.map(id => 
      clientsService.updateContact(id, { leadStage: newStage })
    );

    try {
      await Promise.all(promises);
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: clientsKeys.funnel() });
      
      toast({
        title: "✅ Ação em lote concluída",
        description: `${contactIds.length} contatos foram atualizados.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Erro na ação em lote",
        description: "Alguns contatos não puderam ser atualizados.",
      });
    }
  };

  const bulkAssignAgent = async (contactIds: string[], agentId: string) => {
    const promises = contactIds.map(id => 
      clientsService.updateContact(id, { agentId })
    );

    try {
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts() });
      
      toast({
        title: "👨‍💼 Atribuição concluída",
        description: `${contactIds.length} leads foram atribuídos.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Erro na atribuição",
        description: "Alguns leads não puderam ser atribuídos.",
      });
    }
  };

  return {
    bulkUpdateStage,
    bulkAssignAgent,
  };
}

// ============================================================================
// HOOKS DE REAL-TIME (FUTURO)
// ============================================================================

/**
 * Hook para atualizações em tempo real (placeholder)
 */
export function useRealTimeContacts(agentId?: string) {
  // TODO: Implementar WebSocket/Server-Sent Events
  // para atualizações em tempo real do funil
  
  const queryClient = useQueryClient();
  
  const enableRealTime = () => {
    // Configurar conexão real-time
    console.log('Real-time habilitado para:', agentId);
  };

  const disableRealTime = () => {
    // Desconectar real-time
    console.log('Real-time desabilitado');
  };

  return {
    enableRealTime,
    disableRealTime,
  };
}

// ============================================================================
// EXPORTAÇÕES PARA FACILITAR IMPORTAÇÃO
// ============================================================================

export const clientsHooks = {
  // Contatos
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useMoveContactInFunnel,
  useDeleteContact,
  
  // Atividades
  useLeadActivities,
  useCreateLeadActivity,
  
  // Campanhas
  useCampaigns,
  useCreateCampaign,
  
  // Estatísticas
  useFunnelStats,
  
  // Compostos
  useFunnelKanban,
  useContactSearch,
  useBulkContactActions,
  useRealTimeContacts,
} as const;

export default clientsHooks;