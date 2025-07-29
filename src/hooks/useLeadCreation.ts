/**
 * 🔲 ImobiPRO - Hook para Criação de Leads com Fallback
 * 
 * Hook que tenta criar leads via múltiplas estratégias:
 * 1. Webhook n8n (se configurado)
 * 2. Supabase direto (fallback)
 * 3. Tratamento de erros e retry logic
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { leadWebhookService } from '@/services/leadWebhookService';
import type { CreateContactInput } from '@/types/clients';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para criação de lead com fallback automático
 */
export function useCreateLeadWithFallback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      console.log('Iniciando criação de lead com dados:', input);
      
      const result = await leadWebhookService.createLead(input);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido na criação do lead');
      }
      
      return result;
    },
    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['n8n-leads'] });

      // Toast personalizado baseado no método usado
      const methodLabels = {
        'n8n': '🚀 via webhook n8n',
        'supabase': '💾 via Supabase',
        'fallback': '🔄 via fallback'
      };

      toast({
        title: `✅ Lead criado ${methodLabels[result.method]}`,
        description: `${result.data?.name} foi adicionado ao funil em ${result.processingTime}ms`,
      });

      console.log('Lead criado com sucesso:', result);
    },
    onError: (error) => {
      console.error('Erro ao criar lead:', error);
      
      toast({
        variant: "destructive",
        title: "❌ Erro ao criar lead",
        description: error instanceof Error ? error.message : "Não foi possível criar o lead. Tente novamente.",
      });
    },
  });
}

// ============================================================================
// HOOK DE DIAGNÓSTICO
// ============================================================================

/**
 * Hook para testar conectividade dos sistemas
 */
export function useLeadSystemDiagnostic() {
  return useQuery({
    queryKey: ['lead-system-diagnostic'],
    queryFn: () => leadWebhookService.testConnectivity(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook para obter configuração atual
 */
export function useLeadSystemConfig() {
  return useQuery({
    queryKey: ['lead-system-config'],
    queryFn: () => leadWebhookService.getConfig(),
    staleTime: Infinity, // Configuração não muda durante a sessão
  });
}

// ============================================================================
// HOOK DE TESTE MANUAL
// ============================================================================

/**
 * Hook para testar criação de lead (útil para debug)
 */
export function useTestLeadCreation() {
  return useMutation({
    mutationFn: async () => {
      const testData: CreateContactInput = {
        name: `Teste Lead ${new Date().getHours()}:${new Date().getMinutes()}`,
        email: `teste${Date.now()}@test.com`,
        phone: '(11) 99999-9999',
        leadSource: 'Site',
        leadSourceDetails: 'Teste de funcionalidade',
        priority: 'MEDIUM',
        agentId: 'test-agent-id',
        tags: ['Teste', 'Debug']
      };

      return leadWebhookService.createLead(testData);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "🧪 Teste bem-sucedido",
          description: `Lead de teste criado via ${result.method} em ${result.processingTime}ms`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "🧪 Teste falhou",
          description: result.error,
        });
      }
    }
  });
}

// ============================================================================
// HOOK COMPATÍVEL COM COMPONENTES EXISTENTES
// ============================================================================

/**
 * Hook compatível que substitui o useCreateContact original
 */
export function useCreateContact() {
  const createLead = useCreateLeadWithFallback();

  return {
    mutateAsync: async (input: CreateContactInput) => {
      const result = await createLead.mutateAsync(input);
      
      // Retornar no formato esperado pelos componentes existentes
      return result.data;
    },
    mutate: createLead.mutate,
    isPending: createLead.isPending,
    isError: createLead.isError,
    error: createLead.error,
    isSuccess: createLead.isSuccess,
    data: createLead.data?.data,
    reset: createLead.reset
  };
}

// ============================================================================
// EXPORTAÇÕES ORGANIZADAS
// ============================================================================

export const leadCreationHooks = {
  useCreateLeadWithFallback,
  useLeadSystemDiagnostic,
  useLeadSystemConfig,
  useTestLeadCreation,
  useCreateContact // Compatibilidade
} as const;

export default leadCreationHooks;