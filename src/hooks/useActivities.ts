// ================================================================
// HOOK USEACTIVITIES - FEED EM TEMPO REAL
// ================================================================
// Data: 01/02/2025
// Descrição: Hook para gerenciar feed de atividades com tempo real
// Features: Cache React Query, WebSockets, buffer inteligente
// ================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { activitiesService } from '@/services/activitiesService';
import type { 
  RecentActivity, 
  ActivityFilter, 
  ActivityStats,
  ActivityCreateData,
  UseActivitiesReturn,
  ActivityMetrics
} from '@/types/activities';

// ================================================================
// QUERY KEYS
// ================================================================

export const ACTIVITIES_QUERY_KEYS = {
  activities: (filters: ActivityFilter) => ['activities', 'list', filters] as const,
  stats: (timeRange: string) => ['activities', 'stats', timeRange] as const,
  metrics: (timeRange: string) => ['activities', 'metrics', timeRange] as const,
  buffer: ['activities', 'buffer'] as const,
} as const;

// ================================================================
// CONFIGURAÇÕES DE CACHE
// ================================================================

const CACHE_CONFIG = {
  activities: {
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 60 * 1000, // 1 minuto
  },
  stats: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 2 * 60 * 1000,
  },
} as const;

// ================================================================
// HOOK PRINCIPAL
// ================================================================

export interface UseActivitiesOptions {
  limit?: number;
  filters?: ActivityFilter;
  enableRealtime?: boolean;
  enableStats?: boolean;
  autoRefresh?: boolean;
  onNewActivity?: (activity: RecentActivity) => void;
}

export function useActivities(options: UseActivitiesOptions = {}): UseActivitiesReturn {
  const {
    limit = 20,
    filters = {},
    enableRealtime = true,
    enableStats = false,
    autoRefresh = true,
    onNewActivity,
  } = options;

  const queryClient = useQueryClient();
  const [isListening, setIsListening] = useState(false);
  const [realtimeActivities, setRealtimeActivities] = useState<RecentActivity[]>([]);
  const serviceRef = useRef(activitiesService);

  // ================================================================
  // QUERIES PRINCIPAIS
  // ================================================================

  // Query para atividades
  const {
    data: fetchedActivities = [],
    isLoading,
    error,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEYS.activities({ ...filters, limit }),
    queryFn: () => serviceRef.current.getRecentActivities(limit, filters),
    ...CACHE_CONFIG.activities,
    enabled: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Query para estatísticas (opcional)
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEYS.stats('week'),
    queryFn: () => serviceRef.current.getActivityStats('week'),
    ...CACHE_CONFIG.stats,
    enabled: enableStats,
    retry: 1,
  });

  // Query para métricas (opcional)
  const {
    data: metrics,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEYS.metrics('week'),
    queryFn: async () => {
      // Implementar cálculo de métricas baseado nas estatísticas
      const statsData = await serviceRef.current.getActivityStats('week');
      return calculateMetrics(statsData);
    },
    enabled: enableStats,
    staleTime: 5 * 60 * 1000,
  });

  // ================================================================
  // MUTATIONS
  // ================================================================

  // Mutation para criar atividade
  const createActivityMutation = useMutation({
    mutationFn: (data: ActivityCreateData) => serviceRef.current.createActivity(data),
    onSuccess: (newActivity) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Adicionar ao estado de tempo real
      setRealtimeActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
      
      // Callback customizado
      onNewActivity?.(newActivity);
    },
    onError: (error) => {
      console.error('Erro ao criar atividade:', error);
    },
  });

  // ================================================================
  // GERENCIAMENTO DE TEMPO REAL
  // ================================================================

  // Configurar serviço de tempo real
  useEffect(() => {
    if (!enableRealtime) return;

    const service = serviceRef.current;
    
    // Configurar callbacks do serviço
    service.options.onActivity = (activity: RecentActivity) => {
      setRealtimeActivities(prev => {
        // Evitar duplicatas
        const exists = prev.find(a => a.id === activity.id);
        if (exists) return prev;
        
        // Adicionar nova atividade no topo
        const updated = [activity, ...prev.slice(0, limit - 1)];
        
        // Callback customizado
        onNewActivity?.(activity);
        
        return updated;
      });

      // Invalidar cache para manter sincronização
      queryClient.invalidateQueries({ 
        queryKey: ACTIVITIES_QUERY_KEYS.activities({ ...filters, limit }),
        exact: false
      });
    };

    service.options.onError = (error: Error) => {
      console.error('Erro no serviço de atividades:', error);
    };

    return () => {
      service.options.onActivity = undefined;
      service.options.onError = undefined;
    };
  }, [enableRealtime, limit, filters, onNewActivity, queryClient]);

  // Controlar escuta de tempo real
  const startListening = useCallback(() => {
    if (!enableRealtime || isListening) return;
    
    serviceRef.current.startRealtimeListening();
    setIsListening(true);
  }, [enableRealtime, isListening]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    
    serviceRef.current.stopRealtimeListening();
    setIsListening(false);
    setRealtimeActivities([]);
  }, [isListening]);

  // Auto-iniciar escuta quando habilitado
  useEffect(() => {
    if (enableRealtime && !isListening) {
      startListening();
    }

    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [enableRealtime, isListening, startListening, stopListening]);

  // ================================================================
  // FUNÇÕES DE CONTROLE
  // ================================================================

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchActivities(),
      enableStats ? refetchStats() : Promise.resolve(),
      enableStats ? refetchMetrics() : Promise.resolve(),
    ]);
  }, [refetchActivities, refetchStats, refetchMetrics, enableStats]);

  const createActivity = useCallback(
    async (data: ActivityCreateData): Promise<RecentActivity> => {
      const result = await createActivityMutation.mutateAsync(data);
      return result;
    },
    [createActivityMutation]
  );

  const clearActivities = useCallback(() => {
    setRealtimeActivities([]);
    serviceRef.current.clearBuffer();
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  }, [queryClient]);

  // ================================================================
  // COMBINAÇÃO DE DADOS
  // ================================================================

  // Combinar atividades buscadas com atividades de tempo real
  const activities = useCallback(() => {
    const combined = [...realtimeActivities];
    
    // Adicionar atividades buscadas que não estão no tempo real
    fetchedActivities.forEach(activity => {
      const exists = combined.find(a => a.id === activity.id);
      if (!exists) {
        combined.push(activity);
      }
    });

    // Ordenar por timestamp e limitar
    return combined
      .sort((a, b) => {
        const timeA = a.metadata?.timestamp || a.time;
        const timeB = b.metadata?.timestamp || b.time;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      })
      .slice(0, limit);
  }, [realtimeActivities, fetchedActivities, limit]);

  // ================================================================
  // CLEANUP
  // ================================================================

  useEffect(() => {
    return () => {
      if (isListening) {
        serviceRef.current.stopRealtimeListening();
      }
    };
  }, [isListening]);

  // ================================================================
  // RETURN
  // ================================================================

  return {
    activities: activities(),
    stats,
    metrics,
    
    isLoading,
    isLoadingStats,
    error,
    
    refetch,
    createActivity,
    clearActivities,
    
    // Realtime
    isListening,
    startListening,
    stopListening,
  };
}

// ================================================================
// FUNÇÕES UTILITÁRIAS
// ================================================================

/**
 * Calcular métricas baseadas nas estatísticas
 */
function calculateMetrics(stats: any): ActivityMetrics {
  if (!stats) {
    return {
      averagePerDay: 0,
      averagePerUser: 0,
      peakHours: [],
      mostActiveUsers: [],
      typeDistribution: [],
    };
  }

  // Média por dia (assumindo dados da semana)
  const averagePerDay = stats.total / 7;

  // Média por usuário
  const userCount = Object.keys(stats.byUser).length;
  const averagePerUser = userCount > 0 ? stats.total / userCount : 0;

  // Horas de pico (top 3)
  const peakHours = stats.hourlyDistribution
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 3)
    .map((item: any) => item.hour);

  // Usuários mais ativos (top 5)
  const mostActiveUsers = Object.entries(stats.byUser)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([userName, count]) => ({
      userId: '', // Seria necessário mapear se tivéssemos o ID
      userName,
      count: count as number,
    }));

  // Distribuição por tipo
  const typeDistribution = Object.entries(stats.byType)
    .map(([type, count]) => ({
      type: type as any,
      count: count as number,
      percentage: ((count as number) / stats.total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    averagePerDay,
    averagePerUser,
    peakHours,
    mostActiveUsers,
    typeDistribution,
  };
}

// ================================================================
// HOOKS AUXILIARES
// ================================================================

/**
 * Hook simplificado para apenas atividades recentes
 */
export function useRecentActivities(limit: number = 10) {
  return useActivities({ 
    limit, 
    enableRealtime: true, 
    enableStats: false 
  });
}

/**
 * Hook para estatísticas de atividades
 */
export function useActivityStats(timeRange: 'today' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: ACTIVITIES_QUERY_KEYS.stats(timeRange),
    queryFn: () => activitiesService.getActivityStats(timeRange),
    ...CACHE_CONFIG.stats,
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default useActivities;