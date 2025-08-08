// ================================================================
// HOOK PARA NOVO MÓDULO CLIENTES MVP
// ================================================================
// Data: 07/08/2025
// Descrição: Hook React Query para integração com dadosClienteService
// ================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { dadosClienteService, type DadosCliente, type DadosClienteFilters, type DadosClienteInsert, type DadosClienteUpdate } from '@/services/dadosCliente.service';
import { type ClienteKanbanCard, type StatusCliente } from '@/types/clientes';
import { useToast } from '@/hooks/use-toast';

// Chaves para React Query
const QUERY_KEYS = {
  clientes: 'clientes-mvp',
  cliente: (id: string) => ['cliente-mvp', id],
  stats: 'clientes-stats-mvp',
  upcomingActions: (days: number) => ['upcoming-actions', days]
} as const;

// Hook principal para listar clientes
export function useClientesMVP(options?: {
  filters?: DadosClienteFilters;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [QUERY_KEYS.clientes, options],
    queryFn: async () => {
      const result = await dadosClienteService.findAll(options);
      if (result.error) {
        throw result.error;
      }
      return result;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Converter DadosCliente[] para ClienteKanbanCard[]
  const clientes: ClienteKanbanCard[] = query.data?.data?.map(cliente => {
    const rawStatus = (cliente.status || 'novos').toString().toLowerCase();
    const allowed: StatusCliente[] = ['novos','contatados','qualificados','interessados','negociando','convertidos','perdidos'];
    const normalizedStatus = (allowed.includes(rawStatus as StatusCliente) ? rawStatus : 'novos') as StatusCliente;

    return {
      id: String(cliente.id),
      nome: cliente.nome || 'Sem nome',
      telefone: cliente.telefone || '',
      email: cliente.email || null,
      status: normalizedStatus,
      funcionario: cliente.funcionario || null,
      score_lead: 50,
      origem_lead: 'site',
      empresa: undefined,
      ultima_interacao: cliente.updated_at || cliente.created_at || new Date().toISOString(),
      proxima_acao: undefined,
      created_at: cliente.created_at || new Date().toISOString(),
      updated_at: cliente.updated_at || cliente.created_at || new Date().toISOString(),
    };
  }) || [];

  return {
    clientes,
    raw: (query.data?.data as unknown as DadosCliente[]) || [],
    totalCount: query.data?.count || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook para buscar cliente por ID
export function useClienteMVP(clienteId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.cliente(clienteId),
    queryFn: async () => {
      const result = await dadosClienteService.findById(clienteId);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user && !!clienteId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para estatísticas
export function useClientesStatsMVP() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: async () => {
      const result = await dadosClienteService.getStats();
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para ações próximas
export function useUpcomingActionsMVP(days: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.upcomingActions(days),
    queryFn: async () => {
      const result = await dadosClienteService.getUpcomingActions(days);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Mutations para operações CRUD
export function useClientesMutationsMVP() {
  const queryClient = useQueryClient();

  // Criar cliente
  const createMutation = useMutation({
    mutationFn: async (data: DadosClienteInsert) => {
      const result = await dadosClienteService.create(data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clientes] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });

  // Atualizar cliente
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DadosClienteUpdate }) => {
      const result = await dadosClienteService.update(id, data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clientes] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cliente(variables.id) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });

  // Deletar cliente
  const deleteMutation = useMutation({
    mutationFn: async (clienteId: string) => {
      const result = await dadosClienteService.delete(clienteId);
      if (result.error) {
        throw result.error;
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clientes] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });

  // Atualizar status (para Kanban)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      clienteId, 
      novoStatus, 
      observacoes 
    }: { 
      clienteId: string; 
      novoStatus: StatusCliente; 
      observacoes?: string 
    }) => {
      const result = await dadosClienteService.updateStatus(clienteId, novoStatus, observacoes);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clientes] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cliente(variables.clienteId) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });

  // Atualizar score
  const updateScoreMutation = useMutation({
    mutationFn: async ({ 
      clienteId, 
      score, 
      reason 
    }: { 
      clienteId: string; 
      score: number; 
      reason?: string 
    }) => {
      const result = await dadosClienteService.updateScore(clienteId, score, reason);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clientes] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cliente(variables.clienteId) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });

  // Importar clientes em lote
  const importMutation = useMutation({
    mutationFn: async (clientes: DadosClienteInsert[]) => {
      const result = await dadosClienteService.importClientes(clientes);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clientes] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    updateStatus: updateStatusMutation,
    updateScore: updateScoreMutation,
    import: importMutation,
  };
}

// Hook conveniente para uso no Kanban
export function useKanbanMVP(filters?: DadosClienteFilters) {
  const { clientes, isLoading, error, refetch } = useClientesMVP({
    filters,
    orderBy: 'score_lead',
    ascending: false,
  });

  const { updateStatus } = useClientesMutationsMVP();
  const { toast } = useToast();

  const handleStatusChange = async (clienteId: string, novoStatus: StatusCliente) => {
    try {
      await updateStatus.mutateAsync({ clienteId, novoStatus });
      toast({
        title: 'Status atualizado',
        description: `O cliente foi movido para "${novoStatus}" com sucesso.`,
      });
    } catch (error) {
      const err = error as any;
      console.error('Erro ao atualizar status:', err);
      const code = err?.code || '';
      const isRls = code === '42501' || code === 'PGRST301' || code === '301';
      toast({
        title: isRls ? 'Permissão negada' : 'Erro ao atualizar status',
        description: err?.message || 'Ocorreu um erro ao mover o cliente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    clientes,
    isLoading: isLoading || updateStatus.isPending,
    error,
    refetch,
    onStatusChange: handleStatusChange,
    isUpdating: updateStatus.isPending,
  };
}

// Hook conveniente para lista com filtros
export function useClientesListMVP(initialFilters?: DadosClienteFilters) {
  const [filters, setFilters] = useState<DadosClienteFilters>(initialFilters || {});
  
  const { clientes, totalCount, isLoading, error, refetch } = useClientesMVP({
    filters,
    limit: 50, // Paginação padrão
  });

  const mutations = useClientesMutationsMVP();

  const handleEdit = async (cliente: ClienteKanbanCard) => {
    // TODO: Abrir modal de edição
    console.log('Editar cliente:', cliente);
  };

  const handleView = async (cliente: ClienteKanbanCard) => {
    // TODO: Abrir modal de visualização
    console.log('Ver cliente:', cliente);
  };

  const handleDelete = async (clienteId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await mutations.delete.mutateAsync(clienteId);
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
      }
    }
  };

  const handleFilterChange = (newFilters: DadosClienteFilters) => {
    setFilters(newFilters);
  };

  return {
    clientes,
    totalCount,
    isLoading: isLoading || mutations.delete.isPending,
    error,
    filters,
    onEdit: handleEdit,
    onView: handleView,
    onDelete: handleDelete,
    onFilterChange: handleFilterChange,
    refetch,
    mutations,
  };
}

// Estados adicionais
import { useState } from 'react';

export { QUERY_KEYS };