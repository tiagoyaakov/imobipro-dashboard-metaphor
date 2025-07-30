// ===================================================================
// PIPELINE HOOKS - ImobiPRO Dashboard
// ===================================================================
// React Query hooks especializados para gestão do funil de vendas
// com cache inteligente, otimistic updates e auto-refresh

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Deal,
  DealStage,
  DealStageHistory,
  DealActivity,
  PipelineMetrics,
  PipelineFilters,
  CreateDealData,
  UpdateDealData,
  MoveDealData,
  AddDealActivityData,
  PipelineReportData,
  DEAL_STAGE_CONFIGS
} from '@/types/pipeline';
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  moveDeal,
  getDealStageHistory,
  getDealActivities,
  addDealActivity,
  getPipelineMetrics,
  generatePipelineReport,
  generateMockDeals
} from '@/services/pipelineService';

// ===================================================================
// QUERY KEYS - Chaves padronizadas para cache
// ===================================================================

export const PIPELINE_QUERY_KEYS = {
  all: ['pipeline'] as const,
  deals: () => [...PIPELINE_QUERY_KEYS.all, 'deals'] as const,
  deal: (id: string) => [...PIPELINE_QUERY_KEYS.deals(), id] as const,
  dealsFiltered: (filters: PipelineFilters) => [...PIPELINE_QUERY_KEYS.deals(), 'filtered', filters] as const,
  stageHistory: (dealId: string) => [...PIPELINE_QUERY_KEYS.all, 'stageHistory', dealId] as const,
  activities: (dealId: string) => [...PIPELINE_QUERY_KEYS.all, 'activities', dealId] as const,
  metrics: (agentId?: string, dateRange?: { start: string; end: string }) => 
    [...PIPELINE_QUERY_KEYS.all, 'metrics', agentId, dateRange] as const,
  report: (agentId?: string, dateRange?: { start: string; end: string }) => 
    [...PIPELINE_QUERY_KEYS.all, 'report', agentId, dateRange] as const,
};

// ===================================================================
// CONFIGURAÇÕES DE CACHE - Otimização de performance
// ===================================================================

const CACHE_CONFIG = {
  // Dados que mudam frequentemente
  deals: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  },
  
  // Dados estáticos ou que mudam pouco
  metrics: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60 * 1000, // 10 minutos
  },
  
  // Histórico e atividades (dados append-only)
  history: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
  },
};

// ===================================================================
// HOOKS DE CONSULTA - Leitura de dados
// ===================================================================

/**
 * Hook para buscar todos os deals com filtros
 */
export function useDeals(filters?: PipelineFilters, enabled = true) {
  return useQuery({
    queryKey: filters ? PIPELINE_QUERY_KEYS.dealsFiltered(filters) : PIPELINE_QUERY_KEYS.deals(),
    queryFn: () => getDeals(filters),
    enabled,
    ...CACHE_CONFIG.deals,
    onError: (error: any) => {
      console.error('Erro ao carregar deals:', error);
      toast.error('Erro ao carregar deals: ' + error.message);
    },
  });
}

/**
 * Hook para buscar deals organizados por estágio (Kanban)
 */
export function useDealsKanban(agentId?: string) {
  const { data: deals, ...queryResult } = useDeals(agentId ? { agentId } : undefined);
  
  const dealsByStage = React.useMemo(() => {
    if (!deals) return {};
    
    const grouped: Record<DealStage, Deal[]> = {} as Record<DealStage, Deal[]>;
    
    // Inicializar com arrays vazios para todos os estágios
    Object.values(DealStage).forEach(stage => {
      grouped[stage] = [];
    });
    
    // Agrupar deals por estágio
    deals.forEach(deal => {
      if (grouped[deal.currentStage]) {
        grouped[deal.currentStage].push(deal);
      }
    });
    
    return grouped;
  }, [deals]);
  
  return {
    ...queryResult,
    data: deals,
    dealsByStage,
  };
}

/**
 * Hook para buscar um deal específico por ID
 */
export function useDeal(id: string, enabled = true) {
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.deal(id),
    queryFn: () => getDealById(id),
    enabled: enabled && !!id,
    ...CACHE_CONFIG.deals,
    onError: (error: any) => {
      console.error('Erro ao carregar deal:', error);
      toast.error('Erro ao carregar deal: ' + error.message);
    },
  });
}

/**
 * Hook para buscar histórico de estágios de um deal
 */
export function useDealStageHistory(dealId: string, enabled = true) {
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.stageHistory(dealId),
    queryFn: () => getDealStageHistory(dealId),
    enabled: enabled && !!dealId,
    ...CACHE_CONFIG.history,
    onError: (error: any) => {
      console.error('Erro ao carregar histórico de estágios:', error);
      toast.error('Erro ao carregar histórico: ' + error.message);
    },
  });
}

/**
 * Hook para buscar atividades de um deal
 */
export function useDealActivities(dealId: string, enabled = true) {
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.activities(dealId),
    queryFn: () => getDealActivities(dealId),
    enabled: enabled && !!dealId,
    ...CACHE_CONFIG.history,
    onError: (error: any) => {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar atividades: ' + error.message);
    },
  });
}

/**
 * Hook para buscar métricas do pipeline
 */
export function usePipelineMetrics(
  agentId?: string, 
  dateRange?: { start: string; end: string },
  enabled = true
) {
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.metrics(agentId, dateRange),
    queryFn: () => getPipelineMetrics(agentId, dateRange),
    enabled,
    ...CACHE_CONFIG.metrics,
    onError: (error: any) => {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas: ' + error.message);
    },
  });
}

/**
 * Hook para gerar relatório do pipeline
 */
export function usePipelineReport(
  agentId?: string, 
  dateRange?: { start: string; end: string },
  enabled = true
) {
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.report(agentId, dateRange),
    queryFn: () => generatePipelineReport(agentId, dateRange),
    enabled,
    ...CACHE_CONFIG.metrics,
    onError: (error: any) => {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório: ' + error.message);
    },
  });
}

// ===================================================================
// HOOKS DE MUTAÇÃO - Modificação de dados
// ===================================================================

/**
 * Hook para criar um novo deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDeal,
    onMutate: async (newDeal: CreateDealData) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEYS.deals() });
      
      // Snapshot do estado anterior
      const previousDeals = queryClient.getQueryData(PIPELINE_QUERY_KEYS.deals());
      
      // Optimistic update
      const tempDeal: Deal = {
        id: `temp-${Date.now()}`,
        ...newDeal,
        stage: newDeal.stage || DealStage.LEAD_IN,
        status: 'ACTIVE' as any,
        currentStage: newDeal.stage || DealStage.LEAD_IN,
        probability: newDeal.probability || DEAL_STAGE_CONFIGS[newDeal.stage || DealStage.LEAD_IN].probability.default,
        daysInStage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.deals(), (old: Deal[] | undefined) => 
        old ? [tempDeal, ...old] : [tempDeal]
      );
      
      return { previousDeals };
    },
    onError: (error: any, newDeal, context) => {
      // Rollback
      if (context?.previousDeals) {
        queryClient.setQueryData(PIPELINE_QUERY_KEYS.deals(), context.previousDeals);
      }
      console.error('Erro ao criar deal:', error);
      toast.error('Erro ao criar deal: ' + error.message);
    },
    onSuccess: (data) => {
      toast.success('Deal criado com sucesso!');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.deals() });
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.metrics() });
    },
  });
}

/**
 * Hook para atualizar um deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealData }) => updateDeal(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEYS.deal(id) });
      
      const previousDeal = queryClient.getQueryData(PIPELINE_QUERY_KEYS.deal(id));
      
      // Optimistic update
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.deal(id), (old: Deal | undefined) => 
        old ? { ...old, ...data, updatedAt: new Date().toISOString() } : undefined
      );
      
      return { previousDeal };
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousDeal) {
        queryClient.setQueryData(PIPELINE_QUERY_KEYS.deal(id), context.previousDeal);
      }
      console.error('Erro ao atualizar deal:', error);
      toast.error('Erro ao atualizar deal: ' + error.message);
    },
    onSuccess: (data) => {
      toast.success('Deal atualizado com sucesso!');
      
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.deals() });
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.metrics() });
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.deal(data.id), data);
    },
  });
}

/**
 * Hook para mover deal entre estágios
 */
export function useMoveDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: moveDeal,
    onMutate: async (moveData: MoveDealData) => {
      const { dealId, toStage } = moveData;
      
      await queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEYS.deal(dealId) });
      
      const previousDeal = queryClient.getQueryData(PIPELINE_QUERY_KEYS.deal(dealId));
      
      // Optimistic update
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.deal(dealId), (old: Deal | undefined) => 
        old ? { 
          ...old, 
          currentStage: toStage,
          stage: toStage,
          probability: DEAL_STAGE_CONFIGS[toStage].probability.default,
          daysInStage: 0,
          updatedAt: new Date().toISOString() 
        } : undefined
      );
      
      // Atualizar lista de deals também
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.deals(), (old: Deal[] | undefined) => 
        old?.map(deal => 
          deal.id === dealId 
            ? { 
                ...deal, 
                currentStage: toStage,
                stage: toStage,
                probability: DEAL_STAGE_CONFIGS[toStage].probability.default,
                daysInStage: 0,
                updatedAt: new Date().toISOString() 
              }
            : deal
        )
      );
      
      return { previousDeal };
    },
    onError: (error: any, { dealId }, context) => {
      if (context?.previousDeal) {
        queryClient.setQueryData(PIPELINE_QUERY_KEYS.deal(dealId), context.previousDeal);
      }
      console.error('Erro ao mover deal:', error);
      toast.error('Erro ao mover deal: ' + error.message);
    },
    onSuccess: (data, { toStage }) => {
      const stageConfig = DEAL_STAGE_CONFIGS[toStage];
      toast.success(`Deal movido para ${stageConfig.name}!`);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.deals() });
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.stageHistory(data.id) });
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.activities(data.id) });
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.metrics() });
      
      // Atualizar deal específico
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.deal(data.id), data);
    },
  });
}

/**
 * Hook para deletar um deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDeal,
    onMutate: async (dealId: string) => {
      await queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEYS.deals() });
      
      const previousDeals = queryClient.getQueryData(PIPELINE_QUERY_KEYS.deals());
      
      // Optimistic update
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.deals(), (old: Deal[] | undefined) => 
        old?.filter(deal => deal.id !== dealId)
      );
      
      return { previousDeals };
    },
    onError: (error: any, dealId, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(PIPELINE_QUERY_KEYS.deals(), context.previousDeals);
      }
      console.error('Erro ao deletar deal:', error);
      toast.error('Erro ao deletar deal: ' + error.message);
    },
    onSuccess: () => {
      toast.success('Deal removido com sucesso!');
      
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.deals() });
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.metrics() });
    },
  });
}

/**
 * Hook para adicionar atividade a um deal
 */
export function useAddDealActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addDealActivity,
    onMutate: async (activityData: AddDealActivityData) => {
      const { dealId } = activityData;
      
      await queryClient.cancelQueries({ queryKey: PIPELINE_QUERY_KEYS.activities(dealId) });
      
      const previousActivities = queryClient.getQueryData(PIPELINE_QUERY_KEYS.activities(dealId));
      
      // Optimistic update
      const tempActivity: DealActivity = {
        id: `temp-${Date.now()}`,
        ...activityData,
        createdAt: new Date().toISOString(),
        createdByName: 'Você',
      };
      
      queryClient.setQueryData(PIPELINE_QUERY_KEYS.activities(dealId), (old: DealActivity[] | undefined) => 
        old ? [tempActivity, ...old] : [tempActivity]
      );
      
      return { previousActivities };
    },
    onError: (error: any, { dealId }, context) => {
      if (context?.previousActivities) {
        queryClient.setQueryData(PIPELINE_QUERY_KEYS.activities(dealId), context.previousActivities);
      }
      console.error('Erro ao adicionar atividade:', error);
      toast.error('Erro ao adicionar atividade: ' + error.message);
    },
    onSuccess: (data) => {
      toast.success('Atividade adicionada com sucesso!');
      
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.activities(data.dealId) });
    },
  });
}

// ===================================================================
// HOOKS COMPOSTOS - Combinação de múltiplas operações
// ===================================================================

/**
 * Hook composto para gerenciamento completo de deals
 */
export function usePipelineManager(agentId?: string) {
  const dealsQuery = useDealsKanban(agentId);
  const metricsQuery = usePipelineMetrics(agentId);
  
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();
  const moveMutation = useMoveDeal();
  const deleteMutation = useDeleteDeal();
  
  const isLoading = dealsQuery.isLoading || metricsQuery.isLoading;
  const isError = dealsQuery.isError || metricsQuery.isError;
  const error = dealsQuery.error || metricsQuery.error;
  
  return {
    // Dados
    deals: dealsQuery.data,
    dealsByStage: dealsQuery.dealsByStage,
    metrics: metricsQuery.data,
    
    // Estados
    isLoading,
    isError,
    error,
    
    // Ações
    createDeal: createMutation.mutate,
    updateDeal: (id: string, data: UpdateDealData) => updateMutation.mutate({ id, data }),
    moveDeal: moveMutation.mutate,
    deleteDeal: deleteMutation.mutate,
    
    // Estados das mutações
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isMoving: moveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Refresh manual
    refresh: () => {
      dealsQuery.refetch();
      metricsQuery.refetch();
    },
  };
}

/**
 * Hook para dashboard de métricas do pipeline
 */
export function usePipelineDashboard(agentId?: string) {
  const metricsQuery = usePipelineMetrics(agentId);
  const dealsQuery = useDeals(agentId ? { agentId } : undefined);
  
  const dashboardData = React.useMemo(() => {
    if (!metricsQuery.data || !dealsQuery.data) return null;
    
    const metrics = metricsQuery.data;
    const deals = dealsQuery.data;
    
    // Deals que precisam de atenção
    const dealsNeedingAttention = deals.filter(deal => {
      if (deal.status !== 'ACTIVE') return false;
      
      const daysInStage = deal.daysInStage || 0;
      const stageConfig = DEAL_STAGE_CONFIGS[deal.currentStage];
      const maxDaysInStage = stageConfig.automations?.reminders?.[0]?.days || 7;
      
      return daysInStage >= maxDaysInStage;
    });
    
    // Top deals por valor
    const topDealsByValue = [...deals]
      .filter(deal => deal.status === 'ACTIVE')
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 5);
    
    return {
      metrics,
      deals,
      dealsNeedingAttention,
      topDealsByValue,
      totalPipelineValue: deals
        .filter(deal => deal.status === 'ACTIVE')
        .reduce((sum, deal) => sum + (deal.value || 0), 0),
    };
  }, [metricsQuery.data, dealsQuery.data]);
  
  return {
    data: dashboardData,
    isLoading: metricsQuery.isLoading || dealsQuery.isLoading,
    error: metricsQuery.error || dealsQuery.error,
    refresh: () => {
      metricsQuery.refetch();
      dealsQuery.refetch();
    },
  };
}

// ===================================================================
// UTILITÁRIOS - Hooks auxiliares
// ===================================================================

/**
 * Hook para invalidar cache do pipeline
 */
export function usePipelineCacheManager() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.all }),
    invalidateDeals: () => queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.deals() }),
    invalidateMetrics: () => queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.metrics() }),
    clearAll: () => queryClient.removeQueries({ queryKey: PIPELINE_QUERY_KEYS.all }),
    
    // Pré-carregamento de dados
    prefetchDeal: (id: string) => 
      queryClient.prefetchQuery({
        queryKey: PIPELINE_QUERY_KEYS.deal(id),
        queryFn: () => getDealById(id),
        staleTime: CACHE_CONFIG.deals.staleTime,
      }),
      
    prefetchDealActivities: (dealId: string) =>
      queryClient.prefetchQuery({
        queryKey: PIPELINE_QUERY_KEYS.activities(dealId),
        queryFn: () => getDealActivities(dealId),
        staleTime: CACHE_CONFIG.history.staleTime,
      }),
  };
}

/**
 * Hook para dados mock (desenvolvimento)
 */
export function useMockPipelineData(enabled = false) {
  return useQuery({
    queryKey: ['pipeline', 'mock'],
    queryFn: () => Promise.resolve(generateMockDeals(20)),
    enabled,
    staleTime: Infinity, // Mock data nunca fica stale
    cacheTime: Infinity,
  });
}

// Import React for useMemo
import React from 'react';