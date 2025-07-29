/**
 * 🔗 ImobiPRO - Hooks React Query para WhatsApp
 * 
 * Hooks especializados para gestão de conexões WhatsApp usando React Query.
 * Inclui operações CRUD, cache inteligente e atualizações em tempo real.
 * 
 * Funcionalidades:
 * - CRUD completo de instâncias WhatsApp
 * - Gerenciamento de conexões e QR codes
 * - Monitoramento de status em tempo real
 * - Cache inteligente com invalidação
 * - Logs de conexão e auditoria
 * - Configurações por empresa
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import whatsappService from '@/services/whatsappService';
import type { 
  WhatsAppInstance,
  WhatsAppConnectionLog,
  WhatsAppConfig,
  CreateInstanceInput,
  UpdateInstanceInput,
  WhatsAppStatus
} from '@/services/whatsappService';

// ============================================================================
// KEYS PARA REACT QUERY
// ============================================================================

export const whatsappKeys = {
  all: ['whatsapp'] as const,
  instances: () => [...whatsappKeys.all, 'instances'] as const,
  instance: (id: string) => [...whatsappKeys.instances(), id] as const,
  instanceByAgent: (agentId: string) => [...whatsappKeys.instances(), 'agent', agentId] as const,
  instancesByFilter: (filters: Record<string, any>) => [...whatsappKeys.instances(), 'filtered', filters] as const,
  logs: (instanceId: string) => [...whatsappKeys.all, 'logs', instanceId] as const,
  config: (companyId: string) => [...whatsappKeys.all, 'config', companyId] as const,
  health: () => [...whatsappKeys.all, 'health'] as const,
} as const;

// ============================================================================
// HOOKS DE INSTÂNCIAS
// ============================================================================

/**
 * Hook para buscar instância específica por ID
 */
export function useWhatsAppInstance(id: string) {
  return useQuery({
    queryKey: whatsappKeys.instance(id),
    queryFn: () => whatsappService.getInstanceById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para buscar instância por agente
 */
export function useWhatsAppInstanceByAgent(agentId: string) {
  return useQuery({
    queryKey: whatsappKeys.instanceByAgent(agentId),
    queryFn: () => whatsappService.getInstanceByAgent(agentId),
    enabled: !!agentId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para listar instâncias com filtros
 */
export function useWhatsAppInstances(filters: {
  companyId?: string;
  status?: WhatsAppStatus;
  isActive?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: whatsappKeys.instancesByFilter(filters),
    queryFn: () => whatsappService.getInstances(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para criar nova instância
 */
export function useCreateWhatsAppInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInstanceInput) => whatsappService.createInstance(input),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instanceByAgent(data.agentId) });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.health() });

      // Adicionar ao cache individual
      queryClient.setQueryData(whatsappKeys.instance(data.id), data);

      toast({
        title: "✅ Instância WhatsApp criada",
        description: `Instância ${data.displayName} foi criada com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar instância WhatsApp:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao criar instância",
        description: error instanceof Error ? error.message : "Não foi possível criar a instância WhatsApp.",
      });
    },
  });
}

/**
 * Hook para atualizar instância
 */
export function useUpdateWhatsAppInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInstanceInput }) =>
      whatsappService.updateInstance(id, input),
    onMutate: async ({ id, input }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: whatsappKeys.instance(id) });

      // Snapshot do valor anterior
      const previousInstance = queryClient.getQueryData(whatsappKeys.instance(id));

      // Otimistic update
      if (previousInstance) {
        queryClient.setQueryData(whatsappKeys.instance(id), {
          ...previousInstance,
          ...input,
          updatedAt: new Date()
        });
      }

      return { previousInstance };
    },
    onSuccess: (data, { id }) => {
      // Atualizar cache com dados reais
      queryClient.setQueryData(whatsappKeys.instance(id), data);
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instanceByAgent(data.agentId) });

      toast({
        title: "✅ Instância atualizada",
        description: `${data.displayName} foi atualizada com sucesso.`,
      });
    },
    onError: (error, { id }, context) => {
      // Reverter otimistic update
      if (context?.previousInstance) {
        queryClient.setQueryData(whatsappKeys.instance(id), context.previousInstance);
      }

      console.error('Erro ao atualizar instância:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao atualizar",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a instância.",
      });
    },
  });
}

/**
 * Hook para deletar instância
 */
export function useDeleteWhatsAppInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => whatsappService.deleteInstance(id),
    onSuccess: (_, id) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: whatsappKeys.instance(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.health() });

      toast({
        title: "🗑️ Instância removida",
        description: "A instância WhatsApp foi removida permanentemente.",
      });
    },
    onError: (error) => {
      console.error('Erro ao deletar instância:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao remover",
        description: error instanceof Error ? error.message : "Não foi possível remover a instância.",
      });
    },
  });
}

// ============================================================================
// HOOKS DE CONEXÃO
// ============================================================================

/**
 * Hook para conectar instância
 */
export function useConnectWhatsAppInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => whatsappService.connectInstance(id),
    onMutate: async (id) => {
      // Update status otimistic
      await queryClient.cancelQueries({ queryKey: whatsappKeys.instance(id) });
      
      const previousInstance = queryClient.getQueryData(whatsappKeys.instance(id)) as WhatsAppInstance;
      
      if (previousInstance) {
        queryClient.setQueryData(whatsappKeys.instance(id), {
          ...previousInstance,
          status: 'CONNECTING' as WhatsAppStatus
        });
      }

      return { previousInstance };
    },
    onSuccess: (data, id) => {
      // Atualizar instância com QR code
      queryClient.setQueryData(whatsappKeys.instance(id), (old: WhatsAppInstance | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: data.status,
          qrCode: data.qrCode,
          qrCodeExpiry: data.qrCode ? new Date(Date.now() + 5 * 60 * 1000) : undefined
        };
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.health() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.logs(id) });

      toast({
        title: "🔗 Conectando WhatsApp",
        description: data.qrCode ? "QR Code gerado. Escaneie com seu WhatsApp." : "Conectando...",
      });
    },
    onError: (error, id, context) => {
      // Reverter status
      if (context?.previousInstance) {
        queryClient.setQueryData(whatsappKeys.instance(id), context.previousInstance);
      }

      toast({
        variant: "destructive",
        title: "❌ Erro ao conectar",
        description: error instanceof Error ? error.message : "Não foi possível conectar a instância.",
      });
    },
  });
}

/**
 * Hook para desconectar instância
 */
export function useDisconnectWhatsAppInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => whatsappService.disconnectInstance(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: whatsappKeys.instance(id) });
      
      const previousInstance = queryClient.getQueryData(whatsappKeys.instance(id)) as WhatsAppInstance;
      
      if (previousInstance) {
        queryClient.setQueryData(whatsappKeys.instance(id), {
          ...previousInstance,
          status: 'DISCONNECTED' as WhatsAppStatus,
          qrCode: undefined,
          qrCodeExpiry: undefined
        });
      }

      return { previousInstance };
    },
    onSuccess: (_, id) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.health() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.logs(id) });

      toast({
        title: "🔌 WhatsApp desconectado",
        description: "Instância foi desconectada com sucesso.",
      });
    },
    onError: (error, id, context) => {
      if (context?.previousInstance) {
        queryClient.setQueryData(whatsappKeys.instance(id), context.previousInstance);
      }

      toast({
        variant: "destructive",
        title: "❌ Erro ao desconectar",
        description: error instanceof Error ? error.message : "Não foi possível desconectar a instância.",
      });
    },
  });
}

/**
 * Hook para renovar QR code
 */
export function useRefreshQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => whatsappService.refreshQRCode(id),
    onSuccess: (qrCode, id) => {
      // Atualizar instância com novo QR code
      queryClient.setQueryData(whatsappKeys.instance(id), (old: WhatsAppInstance | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: 'QR_CODE_PENDING' as WhatsAppStatus,
          qrCode,
          qrCodeExpiry: new Date(Date.now() + 5 * 60 * 1000)
        };
      });

      // Invalidar logs
      queryClient.invalidateQueries({ queryKey: whatsappKeys.logs(id) });

      toast({
        title: "🔄 QR Code renovado",
        description: "Novo QR Code gerado. Escaneie com seu WhatsApp.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao renovar QR Code",
        description: error instanceof Error ? error.message : "Não foi possível renovar o QR Code.",
      });
    },
  });
}

/**
 * Hook para simular conexão (desenvolvimento)
 */
export function useSimulateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, phoneNumber }: { id: string; phoneNumber: string }) => 
      whatsappService.simulateConnection(id, phoneNumber),
    onSuccess: (_, { id, phoneNumber }) => {
      // Atualizar instância como conectada
      queryClient.setQueryData(whatsappKeys.instance(id), (old: WhatsAppInstance | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: 'CONNECTED' as WhatsAppStatus,
          phoneNumber,
          qrCode: undefined,
          qrCodeExpiry: undefined,
          lastConnectionAt: new Date()
        };
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.health() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.logs(id) });

      toast({
        title: "✅ WhatsApp conectado",
        description: `Conectado com sucesso ao número ${phoneNumber}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "❌ Erro na simulação",
        description: error instanceof Error ? error.message : "Erro ao simular conexão.",
      });
    },
  });
}

// ============================================================================
// HOOKS DE MONITORAMENTO
// ============================================================================

/**
 * Hook para verificar saúde das instâncias
 */
export function useWhatsAppHealth() {
  return useQuery({
    queryKey: whatsappKeys.health(),
    queryFn: () => whatsappService.checkInstancesHealth(),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 60 * 1000, // Atualizar a cada 60 segundos
  });
}

/**
 * Hook para buscar logs de conexão
 */
export function useWhatsAppConnectionLogs(instanceId: string, limit = 50) {
  return useQuery({
    queryKey: whatsappKeys.logs(instanceId),
    queryFn: () => whatsappService.getConnectionLogs(instanceId, limit),
    enabled: !!instanceId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 3 * 60 * 1000, // 3 minutos
  });
}

// ============================================================================
// HOOKS DE CONFIGURAÇÃO
// ============================================================================

/**
 * Hook para buscar configuração da empresa
 */
export function useWhatsAppConfig(agentId: string) {
  return useQuery({
    queryKey: whatsappKeys.config(agentId),
    queryFn: () => whatsappService.getCompanyConfig(agentId),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para atualizar configuração da empresa
 */
export function useUpdateWhatsAppConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, config }: { companyId: string; config: Partial<WhatsAppConfig> }) =>
      whatsappService.updateCompanyConfig(companyId, config),
    onSuccess: (data) => {
      // Atualizar cache de configuração
      queryClient.setQueryData(whatsappKeys.config(data.companyId), data);
      
      toast({
        title: "⚙️ Configurações atualizadas",
        description: "Configurações do WhatsApp foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao salvar configurações",
        description: error instanceof Error ? error.message : "Não foi possível salvar as configurações.",
      });
    },
  });
}

// ============================================================================
// HOOKS COMPOSTOS E UTILITÁRIOS
// ============================================================================

/**
 * Hook para gerenciar estado completo de uma instância
 */
export function useWhatsAppInstanceManager(agentId: string) {
  const { data: instance, isLoading } = useWhatsAppInstanceByAgent(agentId);
  const { data: config } = useWhatsAppConfig(agentId);
  const createInstance = useCreateWhatsAppInstance();
  const updateInstance = useUpdateWhatsAppInstance();
  const deleteInstance = useDeleteWhatsAppInstance();
  const connectInstance = useConnectWhatsAppInstance();
  const disconnectInstance = useDisconnectWhatsAppInstance();
  const refreshQR = useRefreshQRCode();
  const simulateConnection = useSimulateConnection();

  // Estado derivado
  const hasInstance = !!instance;
  const isConnected = instance?.status === 'CONNECTED';
  const isConnecting = instance?.status === 'CONNECTING' || instance?.status === 'QR_CODE_PENDING';
  const canConnect = instance?.canConnect ?? false;
  const qrCodeExpired = instance ? whatsappService.isQRCodeExpired(instance) : false;
  const qrTimeLeft = instance ? whatsappService.getQRCodeTimeLeft(instance) : 0;

  // Handlers
  const handleCreateInstance = (input: Omit<CreateInstanceInput, 'agentId'>) => {
    createInstance.mutate({ ...input, agentId });
  };

  const handleUpdateInstance = (input: UpdateInstanceInput) => {
    if (!instance) return;
    updateInstance.mutate({ id: instance.id, input });
  };

  const handleDeleteInstance = () => {
    if (!instance) return;
    deleteInstance.mutate(instance.id);
  };

  const handleConnect = () => {
    if (!instance) return;
    connectInstance.mutate(instance.id);
  };

  const handleDisconnect = () => {
    if (!instance) return;
    disconnectInstance.mutate(instance.id);
  };

  const handleRefreshQR = () => {
    if (!instance) return;
    refreshQR.mutate(instance.id);
  };

  const handleSimulateConnection = (phoneNumber: string) => {
    if (!instance) return;
    simulateConnection.mutate({ id: instance.id, phoneNumber });
  };

  return {
    instance,
    config,
    isLoading,
    hasInstance,
    isConnected,
    isConnecting,
    canConnect,
    qrCodeExpired,
    qrTimeLeft,
    actions: {
      createInstance: handleCreateInstance,
      updateInstance: handleUpdateInstance,
      deleteInstance: handleDeleteInstance,
      connect: handleConnect,
      disconnect: handleDisconnect,
      refreshQR: handleRefreshQR,
      simulateConnection: handleSimulateConnection
    },
    mutations: {
      createInstance,
      updateInstance,
      deleteInstance,
      connectInstance,
      disconnectInstance,
      refreshQR,
      simulateConnection
    }
  };
}

/**
 * Hook para monitoramento em tempo real
 */
export function useWhatsAppRealTimeMonitoring() {
  const { data: health } = useWhatsAppHealth();
  const queryClient = useQueryClient();

  // Função para forçar atualização de todas as instâncias
  const refreshAll = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() });
    queryClient.invalidateQueries({ queryKey: whatsappKeys.health() });
  }, [queryClient]);

  // Auto-refresh QR codes expirados
  React.useEffect(() => {
    const interval = setInterval(() => {
      const instances = queryClient.getQueriesData({ 
        queryKey: whatsappKeys.instances() 
      });

      instances.forEach(([key, data]: [any, any]) => {
        if (data?.instances) {
          data.instances.forEach((instance: WhatsAppInstance) => {
            if (instance.status === 'QR_CODE_PENDING' && whatsappService.isQRCodeExpired(instance)) {
              // Invalidar instância específica para re-fetch
              queryClient.invalidateQueries({ 
                queryKey: whatsappKeys.instance(instance.id) 
              });
            }
          });
        }
      });
    }, 30 * 1000); // Check a cada 30 segundos

    return () => clearInterval(interval);
  }, [queryClient]);

  return {
    health,
    refreshAll
  };
}

// ============================================================================
// EXPORTAÇÕES ORGANIZADAS
// ============================================================================

export const whatsappHooks = {
  // Instâncias
  useWhatsAppInstance,
  useWhatsAppInstanceByAgent,
  useWhatsAppInstances,
  useCreateWhatsAppInstance,
  useUpdateWhatsAppInstance,
  useDeleteWhatsAppInstance,
  
  // Conexão
  useConnectWhatsAppInstance,
  useDisconnectWhatsAppInstance,
  useRefreshQRCode,
  useSimulateConnection,
  
  // Monitoramento
  useWhatsAppHealth,
  useWhatsAppConnectionLogs,
  
  // Configuração
  useWhatsAppConfig,
  useUpdateWhatsAppConfig,
  
  // Compostos
  useWhatsAppInstanceManager,
  useWhatsAppRealTimeMonitoring,
} as const;

export default whatsappHooks;