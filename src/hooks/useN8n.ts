import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { n8nService, n8nConfigValidator } from '@/services/n8nService';
import { useToast } from '@/hooks/use-toast';
import { N8nWorkflowConfig, N8nExecutionLog } from '@/types/agenda';

// Query Keys
export const n8nKeys = {
  all: ['n8n'] as const,
  workflows: () => [...n8nKeys.all, 'workflows'] as const,
  workflow: (id: string) => [...n8nKeys.workflows(), id] as const,
  executions: () => [...n8nKeys.all, 'executions'] as const,
  execution: (id: string) => [...n8nKeys.executions(), id] as const,
  health: () => [...n8nKeys.all, 'health'] as const,
};

// ===== CONFIGURATION HOOKS =====

/**
 * 🔧 Hook para verificar status da configuração n8n
 */
export function useN8nConfig() {
  return useQuery({
    queryKey: ['n8n', 'config'],
    queryFn: () => {
      const validation = n8nConfigValidator.validateConfig();
      return {
        ...validation,
        timestamp: new Date().toISOString()
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * 🔧 Hook para verificar health do n8n
 */
export function useN8nHealth() {
  return useQuery({
    queryKey: n8nKeys.health(),
    queryFn: () => n8nService.getHealthStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    retry: 2,
  });
}

// ===== WORKFLOW MANAGEMENT HOOKS =====

/**
 * 📋 Hook para listar workflows n8n
 */
export function useN8nWorkflows() {
  return useQuery({
    queryKey: n8nKeys.workflows(),
    queryFn: () => n8nService.client.getWorkflows(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * 📋 Hook para obter workflow específico
 */
export function useN8nWorkflow(workflowId: string) {
  return useQuery({
    queryKey: n8nKeys.workflow(workflowId),
    queryFn: () => n8nService.client.getWorkflow(workflowId),
    enabled: !!workflowId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 🔄 Hook para ativar/desativar workflow
 */
export function useToggleWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ workflowId, active }: { workflowId: string; active: boolean }) =>
      n8nService.client.toggleWorkflow(workflowId, active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: n8nKeys.workflow(variables.workflowId) });
      queryClient.invalidateQueries({ queryKey: n8nKeys.workflows() });
      
      toast({
        title: 'Sucesso',
        description: `Workflow ${variables.active ? 'ativado' : 'desativado'} com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao alterar workflow: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// ===== EXECUTION HOOKS =====

/**
 * 📊 Hook para listar execuções
 */
export function useN8nExecutions(workflowId?: string, limit: number = 20) {
  return useQuery({
    queryKey: [...n8nKeys.executions(), workflowId, limit],
    queryFn: () => n8nService.client.getExecutions(workflowId, limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * 📊 Hook para obter execução específica
 */
export function useN8nExecution(executionId: string) {
  return useQuery({
    queryKey: n8nKeys.execution(executionId),
    queryFn: () => n8nService.client.getExecution(executionId),
    enabled: !!executionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * ⏹️ Hook para parar execução
 */
export function useStopExecution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (executionId: string) => n8nService.client.stopExecution(executionId),
    onSuccess: (_, executionId) => {
      queryClient.invalidateQueries({ queryKey: n8nKeys.execution(executionId) });
      queryClient.invalidateQueries({ queryKey: n8nKeys.executions() });
      
      toast({
        title: 'Sucesso',
        description: 'Execução interrompida com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao interromper execução: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// ===== WORKFLOW EXECUTION HOOKS =====

/**
 * 💬 Hook para executar workflow de agendamento via WhatsApp
 */
export function useExecuteWhatsAppScheduling() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      phoneNumber: string;
      message: string;
      contactId?: string;
      agentId?: string;
    }) => n8nService.executeWhatsAppScheduling(data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Workflow de agendamento WhatsApp executado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao processar mensagem WhatsApp: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

/**
 * ⏰ Hook para executar workflow de lembretes
 */
export function useExecuteAppointmentReminders() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      appointmentId: string;
      reminderType: '24h' | '1h' | 'confirmation';
      contactInfo: {
        name: string;
        phone?: string;
        email?: string;
      };
      appointmentDetails: {
        date: string;
        time: string;
        address?: string;
        agentName: string;
      };
    }) => n8nService.executeAppointmentReminders(data),
    onSuccess: (_, variables) => {
      toast({
        title: 'Sucesso',
        description: `Lembrete ${variables.reminderType} enviado com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao enviar lembrete: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

/**
 * 🔄 Hook para executar workflow de follow-up
 */
export function useExecutePostVisitFollowup() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      appointmentId: string;
      contactId: string;
      propertyId?: string;
      agentId: string;
      visitOutcome?: 'interested' | 'not_interested' | 'needs_followup';
      notes?: string;
    }) => n8nService.executePostVisitFollowup(data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Follow-up pós-visita iniciado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao iniciar follow-up: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

/**
 * ⚡ Hook para executar workflow de resolução de conflitos
 */
export function useExecuteConflictResolution() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      conflictId: string;
      conflictType: string;
      appointmentId: string;
      conflictData: any;
      resolutionStrategy?: string;
    }) => n8nService.executeConflictResolution(data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Resolução de conflito iniciada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro na resolução de conflito: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

/**
 * 📅 Hook para executar workflow de sincronização de calendário
 */
export function useExecuteCalendarSync() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      operation: 'create' | 'update' | 'delete';
      appointmentId: string;
      calendarData: any;
      syncDirection: 'to_google' | 'from_google';
    }) => n8nService.executeCalendarSync(data),
    onSuccess: (_, variables) => {
      toast({
        title: 'Sucesso',
        description: `Sincronização de calendário (${variables.operation}) executada com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro na sincronização: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// ===== WEBHOOK MANAGEMENT HOOKS =====

/**
 * 🔗 Hook para configurar todos os webhooks
 */
export function useSetupWebhooks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => n8nService.setupAllWebhooks(),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: n8nKeys.workflows() });
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      if (errorCount === 0) {
        toast({
          title: 'Sucesso',
          description: `${successCount} webhooks configurados com sucesso`,
        });
      } else {
        toast({
          title: 'Parcialmente concluído',
          description: `${successCount} webhooks configurados, ${errorCount} falharam`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao configurar webhooks: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// ===== UNIFIED n8n MANAGER HOOK =====

/**
 * 🎛️ Hook unificado para gerenciar n8n
 */
export function useN8nManager() {
  const config = useN8nConfig();
  const health = useN8nHealth();
  const workflows = useN8nWorkflows();
  const executions = useN8nExecutions();
  
  const toggleWorkflow = useToggleWorkflow();
  const stopExecution = useStopExecution();
  const setupWebhooks = useSetupWebhooks();
  
  // Workflow execution hooks
  const executeWhatsApp = useExecuteWhatsAppScheduling();
  const executeReminders = useExecuteAppointmentReminders();
  const executeFollowup = useExecutePostVisitFollowup();
  const executeConflictResolution = useExecuteConflictResolution();
  const executeCalendarSync = useExecuteCalendarSync();

  return {
    // Configuration & Health
    config: config.data,
    health: health.data,
    isConfigValid: config.data?.valid || false,
    isHealthy: health.data?.status === 'healthy',
    
    // Workflows
    workflows: workflows.data || [],
    isLoadingWorkflows: workflows.isLoading,
    workflowsError: workflows.error,
    
    // Executions
    executions: executions.data || [],
    isLoadingExecutions: executions.isLoading,
    executionsError: executions.error,
    
    // Actions
    toggleWorkflow: toggleWorkflow.mutate,
    stopExecution: stopExecution.mutate,
    setupWebhooks: setupWebhooks.mutate,
    
    // Workflow Executions
    executeWhatsAppScheduling: executeWhatsApp.mutate,
    executeAppointmentReminders: executeReminders.mutate,
    executePostVisitFollowup: executeFollowup.mutate,
    executeConflictResolution: executeConflictResolution.mutate,
    executeCalendarSync: executeCalendarSync.mutate,
    
    // Loading States
    isTogglingWorkflow: toggleWorkflow.isPending,
    isStoppingExecution: stopExecution.isPending,
    isSettingUpWebhooks: setupWebhooks.isPending,
    isExecutingWorkflow: [
      executeWhatsApp.isPending,
      executeReminders.isPending,
      executeFollowup.isPending,
      executeConflictResolution.isPending,
      executeCalendarSync.isPending,
    ].some(Boolean),
    
    // Utilities
    printSetupInstructions: () => n8nConfigValidator.printSetupInstructions(),
    validateConfig: () => n8nConfigValidator.validateConfig(),
  };
}

// ===== WORKFLOW TEMPLATES =====

/**
 * 📋 Hook para obter templates de workflows disponíveis
 */
export function useWorkflowTemplates() {
  return {
    templates: [
      {
        id: 'whatsapp-scheduling',
        name: 'Agendamento via WhatsApp',
        description: 'Processa mensagens do WhatsApp e cria agendamentos automaticamente',
        category: 'comunicacao',
        icon: '💬',
        status: 'available',
      },
      {
        id: 'appointment-reminders',
        name: 'Lembretes de Agendamento',
        description: 'Envia lembretes automáticos 24h e 1h antes dos agendamentos',
        category: 'notificacao',
        icon: '⏰',
        status: 'available',
      },
      {
        id: 'post-visit-followup',
        name: 'Follow-up Pós-Visita',
        description: 'Automatiza o follow-up após visitas a imóveis',
        category: 'crm',
        icon: '🔄',
        status: 'available',
      },
      {
        id: 'conflict-resolution',
        name: 'Resolução de Conflitos',
        description: 'Resolve conflitos de agendamento automaticamente',
        category: 'automacao',
        icon: '⚡',
        status: 'available',
      },
      {
        id: 'calendar-sync',
        name: 'Sincronização de Calendário',
        description: 'Mantém sincronização bidirecional com Google Calendar',
        category: 'integracao',
        icon: '📅',
        status: 'available',
      },
    ],
    categories: {
      comunicacao: 'Comunicação',
      notificacao: 'Notificações',
      crm: 'CRM & Vendas',
      automacao: 'Automação',
      integracao: 'Integrações',
    }
  };
}