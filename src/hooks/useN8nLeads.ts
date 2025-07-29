/**
 * 🔲 ImobiPRO - Hooks React Query para Integração n8n Leads
 * 
 * Hooks especializados para gestão de leads via integração n8n.
 * Inclui operações CRUD, webhooks e automações com dados reais.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { n8nLeadsService } from '@/services/n8nLeadsService';
import { 
  N8nLeadWebhook, 
  LeadResponse,
  N8nLeadActivity,
  validateN8nLeadWebhook,
  convertFromN8nFormat
} from '@/schemas/n8n-leads-schemas';
import type { CreateContactInput } from '@/types/clients';

// ============================================================================
// KEYS PARA REACT QUERY
// ============================================================================

export const n8nLeadsKeys = {
  all: ['n8n-leads'] as const,
  leads: () => [...n8nLeadsKeys.all, 'leads'] as const,
  lead: (id: string) => [...n8nLeadsKeys.leads(), id] as const,
  leadsByFilter: (filters: Record<string, any>) => [...n8nLeadsKeys.leads(), 'filtered', filters] as const,
  activities: (leadId: string) => [...n8nLeadsKeys.all, 'activities', leadId] as const,
  webhooks: () => [...n8nLeadsKeys.all, 'webhooks'] as const,
} as const;

// ============================================================================
// HOOKS DE CRIAÇÃO VIA N8N
// ============================================================================

/**
 * Hook para criar lead via webhook n8n
 */
export function useCreateLeadViaWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookData: N8nLeadWebhook) => {
      const response = await n8nLeadsService.processLeadWebhook(webhookData);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao processar webhook');
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: n8nLeadsKeys.leads() });
      
      // Adicionar ao cache individual
      queryClient.setQueryData(n8nLeadsKeys.lead(data.id), data);

      toast({
        title: "🚀 Lead criado via n8n",
        description: `${data.name} foi adicionado ao funil automaticamente.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar lead via webhook:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro no webhook n8n",
        description: error instanceof Error ? error.message : "Não foi possível processar o webhook.",
      });
    },
  });
}

/**
 * Hook para criar lead tradicional (compatível com n8n)
 */
export function useCreateLeadCompatible() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      // Converter input tradicional para formato n8n
      const n8nData: N8nLeadWebhook = {
        name: input.name,
        email: input.email,
        phone: input.phone,
        leadSource: (input.leadSource as any) || 'Site',
        leadSourceDetails: input.leadSourceDetails,
        company: input.company,
        position: input.position,
        budget: input.budget,
        timeline: input.timeline,
        preferences: input.preferences,
        tags: input.tags,
        priority: (input.priority as any) || 'MEDIUM',
        agentId: input.agentId,
        autoAssign: !input.agentId, // Auto-assign se não tiver agente
        webhookSource: 'dashboard'
      };

      const response = await n8nLeadsService.processLeadWebhook(n8nData, {
        skipNotifications: false
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar lead');
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: n8nLeadsKeys.leads() });
      queryClient.setQueryData(n8nLeadsKeys.lead(data.id), data);

      toast({
        title: "✅ Lead criado",
        description: `${data.name} foi adicionado ao funil com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar lead:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao criar lead",
        description: error instanceof Error ? error.message : "Não foi possível criar o lead.",
      });
    },
  });
}

// ============================================================================
// HOOKS DE CONSULTA
// ============================================================================

/**
 * Hook para buscar leads via n8n service
 */
export function useN8nLeads(filters: {
  leadStage?: string;
  leadSource?: string;
  agentId?: string;
  createdSince?: string;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: n8nLeadsKeys.leadsByFilter(filters),
    queryFn: () => n8nLeadsService.getLeadsForN8n(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar lead específico
 */
export function useN8nLead(id: string) {
  return useQuery({
    queryKey: n8nLeadsKeys.lead(id),
    queryFn: async () => {
      const leads = await n8nLeadsService.getLeadsForN8n({ limit: 1 });
      return leads.find(lead => lead.id === id) || null;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// ============================================================================
// HOOKS DE ATIVIDADES
// ============================================================================

/**
 * Hook para criar atividade via n8n
 */
export function useCreateActivityViaWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityData: N8nLeadActivity) => {
      const response = await n8nLeadsService.processActivityWebhook(activityData);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao processar atividade');
      }
      
      return response.data!;
    },
    onSuccess: (data, variables) => {
      // Invalidar atividades do contato
      queryClient.invalidateQueries({ 
        queryKey: n8nLeadsKeys.activities(variables.contactId) 
      });
      
      // Invalidar dados do lead
      queryClient.invalidateQueries({ 
        queryKey: n8nLeadsKeys.lead(variables.contactId) 
      });

      toast({
        title: "📝 Atividade registrada",
        description: `${data.title} foi registrada via n8n.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar atividade via webhook:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro na atividade",
        description: "Não foi possível registrar a atividade via n8n.",
      });
    },
  });
}

// ============================================================================
// HOOKS DE ATUALIZAÇÃO
// ============================================================================

/**
 * Hook para atualizar lead via n8n
 */
export function useUpdateLeadViaWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<N8nLeadWebhook> }) =>
      n8nLeadsService.updateLeadFromN8n(id, updates),
    onSuccess: (data, { id }) => {
      // Atualizar cache
      queryClient.setQueryData(n8nLeadsKeys.lead(id), data);
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: n8nLeadsKeys.leads() });

      toast({
        title: "✅ Lead atualizado",
        description: `${data.name} foi atualizado via n8n.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar lead via n8n:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao atualizar",
        description: "Não foi possível atualizar o lead via n8n.",
      });
    },
  });
}

// ============================================================================
// HOOKS COMPOSTOS
// ============================================================================

/**
 * Hook para gestão completa de leads com n8n
 */
export function useN8nLeadsManagement(agentId?: string) {
  const { data: leads, isLoading } = useN8nLeads({ agentId });
  const createLead = useCreateLeadCompatible();
  const createActivity = useCreateActivityViaWebhook();
  const updateLead = useUpdateLeadViaWebhook();

  // Organizar leads por stage
  const leadsByStage = leads?.reduce((acc, lead) => {
    const stage = lead.leadStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(lead);
    return acc;
  }, {} as Record<string, LeadResponse[]>) || {};

  // Estatísticas rápidas
  const stats = {
    totalLeads: leads?.length || 0,
    byStage: leadsByStage,
    topSources: [] // TODO: Calcular top sources
  };

  return {
    leads,
    leadsByStage,
    stats,
    isLoading,
    createLead: createLead.mutate,
    createActivity: createActivity.mutate,
    updateLead: updateLead.mutate,
    isProcessing: createLead.isPending || createActivity.isPending || updateLead.isPending
  };
}

// ============================================================================
// HOOKS DE WEBHOOK TESTING
// ============================================================================

/**
 * Hook para testar webhook n8n
 */
export function useTestN8nWebhook() {
  return useMutation({
    mutationFn: async (testData: {
      name: string;
      email?: string;
      phone?: string;
      leadSource: string;
    }) => {
      const webhookData: N8nLeadWebhook = {
        ...testData,
        leadSource: testData.leadSource as any,
        webhookSource: 'test',
        autoAssign: true
      };

      return n8nLeadsService.processLeadWebhook(webhookData, {
        correlationId: `test_${Date.now()}`
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "🧪 Teste de webhook bem-sucedido",
          description: `Lead ${response.data?.name} criado em ${response.processingTime}ms`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "🧪 Teste de webhook falhou",
          description: response.error,
        });
      }
    }
  });
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Hook para validar dados de webhook
 */
export function useValidateWebhookData() {
  return useMutation({
    mutationFn: async (rawData: unknown) => {
      try {
        const validatedData = validateN8nLeadWebhook(rawData);
        return { valid: true, data: validatedData };
      } catch (error) {
        return { 
          valid: false, 
          error: error instanceof Error ? error.message : 'Dados inválidos' 
        };
      }
    },
  });
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export const n8nLeadsHooks = {
  useCreateLeadViaWebhook,
  useCreateLeadCompatible,
  useN8nLeads,
  useN8nLead,
  useCreateActivityViaWebhook,
  useUpdateLeadViaWebhook,
  useN8nLeadsManagement,
  useTestN8nWebhook,
  useValidateWebhookData,
} as const;

export default n8nLeadsHooks;