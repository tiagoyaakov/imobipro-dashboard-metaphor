// ================================================================
// HOOK USEDASHBOARD V2 - INTEGRADO COM CACHE UNIFICADO
// ================================================================
// Data: 02/08/2025
// Descrição: Versão otimizada do hook de dashboard com cache unificado
// Features: Cache persistente, sincronização entre tabs, suporte offline
// ================================================================

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useState, useEffect, useCallback } from 'react';
import { propertyService, contactService, appointmentService, dealService } from '@/services';
import { EventBus, SystemEvents, useEventBus } from '@/lib/event-bus';
import { getUnifiedCache } from '@/lib/cache/UnifiedCache';
import { CacheStrategy } from '@/lib/cache/types';
import { useCacheQuery, useCacheInvalidation, useOfflineCache } from '@/hooks/cache/useCache';
import type { 
  DashboardStats, 
  DashboardChartData, 
  RecentActivity,
  DashboardFilters,
  DashboardError 
} from '@/types/dashboard';

// ================================================================
// KEYS DE CACHE REACT QUERY
// ================================================================

export const DASHBOARD_QUERY_KEYS = {
  stats: ['dashboard', 'stats'] as const,
  chartData: (period: string) => ['dashboard', 'charts', period] as const,
  activities: (limit: number) => ['dashboard', 'activities', limit] as const,
  realtimeStats: ['dashboard', 'realtime'] as const,
  performance: (period: string) => ['dashboard', 'performance', period] as const,
} as const;

// ================================================================
// CONFIGURAÇÕES DE CACHE UNIFICADO
// ================================================================

const CACHE_STRATEGIES = {
  stats: CacheStrategy.CRITICAL,      // 10s - métricas críticas
  charts: CacheStrategy.STATIC,       // 30min - dados históricos
  activities: CacheStrategy.REALTIME,  // 0s - sempre fresh
  performance: CacheStrategy.HISTORICAL // 5min - dados de análise
} as const;

// ================================================================
// FUNÇÕES DE API COM CACHE UNIFICADO
// ================================================================

/**
 * Buscar estatísticas principais do dashboard com cache unificado
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  const cache = getUnifiedCache();
  const cacheKey = DASHBOARD_QUERY_KEYS.stats.join(':');

  try {
    // Verificar cache primeiro
    const cached = await cache.get<DashboardStats>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated).getTime() < 10000) {
      console.log('📊 Dashboard stats from cache');
      return cached;
    }

    // Executar queries em paralelo usando os serviços
    const [
      propertiesStats,
      contactsStats,
      appointmentsStats,
      dealsStats
    ] = await Promise.allSettled([
      propertyService.getStats(),
      contactService.getStats(),
      appointmentService.getStats(),
      dealService.getStats()
    ]);

    // Processar resultados com fallback
    const propertyData = propertiesStats.status === 'fulfilled' ? propertiesStats.value.data : null;
    const contactData = contactsStats.status === 'fulfilled' ? contactsStats.value.data : null;
    const appointmentData = appointmentsStats.status === 'fulfilled' ? appointmentsStats.value.data : null;
    const dealData = dealsStats.status === 'fulfilled' ? dealsStats.value.data : null;

    // Calcular mudanças percentuais
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return change >= 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
    };

    // Determinar tendências
    const getTrend = (change: string): 'up' | 'down' | 'stable' => {
      if (change.startsWith('+') && change !== '+0%') return 'up';
      if (change.startsWith('-')) return 'down';
      return 'stable';
    };

    // Valores atuais e históricos
    const totalProperties = propertyData?.total || 0;
    const propertiesThisMonth = propertyData?.thisMonth || 0;
    const propertiesLastMonth = propertyData?.lastMonth || 0;

    const activeClients = contactData?.activeLeads || 0;
    const clientsThisMonth = contactData?.leadsThisMonth || 0;
    const clientsLastMonth = contactData?.leadsLastMonth || 0;

    const weeklyAppointments = appointmentData?.thisWeek || 0;
    const appointmentsLastWeek = appointmentData?.lastWeek || 0;

    const monthlyRevenue = dealData?.closedThisMonth?.value || 0;
    const revenueLastMonth = dealData?.closedLastMonth?.value || 0;

    // Calcular mudanças
    const propertiesChange = calculateChange(propertiesThisMonth, propertiesLastMonth);
    const clientsChange = calculateChange(clientsThisMonth, clientsLastMonth);
    const appointmentsChange = calculateChange(weeklyAppointments, appointmentsLastWeek);
    const revenueChange = calculateChange(monthlyRevenue, revenueLastMonth);

    const stats: DashboardStats = {
      totalProperties: {
        value: totalProperties,
        change: propertiesChange,
        trend: getTrend(propertiesChange),
      },
      activeClients: {
        value: activeClients,
        change: clientsChange,
        trend: getTrend(clientsChange),
      },
      weeklyAppointments: {
        value: weeklyAppointments,
        change: appointmentsChange,
        trend: getTrend(appointmentsChange),
      },
      monthlyRevenue: {
        value: monthlyRevenue,
        change: revenueChange,
        trend: getTrend(revenueChange),
        formatted: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
        }).format(monthlyRevenue),
      },
      lastUpdated: new Date().toISOString(),
    };

    // Armazenar no cache unificado
    await cache.set(cacheKey, stats, {
      strategy: CACHE_STRATEGIES.stats,
      tags: ['dashboard', 'stats'],
      compress: false, // Dados pequenos, não precisa comprimir
      syncAcrossTabs: true
    });

    return stats;

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    
    // Tentar cache mesmo expirado se offline
    const staleData = await cache.get<DashboardStats>(cacheKey);
    if (staleData) {
      console.warn('📊 Using stale dashboard stats due to error');
      return staleData;
    }
    
    throw new DashboardError('Erro ao carregar estatísticas', 'STATS_FETCH_ERROR');
  }
}

/**
 * Buscar dados para gráficos com cache otimizado
 */
async function fetchChartData(period: string = '6months'): Promise<DashboardChartData> {
  const cache = getUnifiedCache();
  const cacheKey = DASHBOARD_QUERY_KEYS.chartData(period).join(':');

  try {
    // Cache de longa duração para dados históricos
    const cached = await cache.get<DashboardChartData>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated).getTime() < 30 * 60 * 1000) {
      console.log('📈 Chart data from cache');
      return cached;
    }

    const periodMap = {
      '7days': 7,
      '30days': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365,
    };

    const days = periodMap[period as keyof typeof periodMap] || 180;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Buscar dados em paralelo
    const [dealsResult, propertiesResult] = await Promise.allSettled([
      dealService.findAll({
        filters: {
          stage: 'WON',
          closedDateFrom: startDate.toISOString(),
          closedDateTo: endDate.toISOString()
        },
        orderBy: 'closedAt',
        ascending: true
      }),
      
      propertyService.findAll({
        filters: {
          createdFrom: startDate.toISOString(),
          createdTo: endDate.toISOString()
        },
        orderBy: 'createdAt',
        ascending: true
      })
    ]);

    // Processar dados...
    const salesData = dealsResult.status === 'fulfilled' && dealsResult.value.data 
      ? dealsResult.value.data.map(deal => ({
          value: Number(deal.value),
          closedAt: deal.closedAt || deal.updatedAt
        }))
      : [];

    const propertiesData = propertiesResult.status === 'fulfilled' && propertiesResult.value.data
      ? propertiesResult.value.data.map(prop => ({
          createdAt: prop.createdAt,
          status: prop.status,
          salePrice: Number(prop.salePrice || 0)
        }))
      : [];

    // Agrupar dados por mês
    const monthlyRevenue = groupDataByMonth(salesData, 'closedAt', 'value');
    const monthlyProperties = groupDataByMonth(propertiesData, 'createdAt');

    // Garantir que todos os meses estejam representados
    const allMonths = generateMonthRange(startDate, endDate);
    const completeRevenue = fillMissingMonths(monthlyRevenue, allMonths);
    const completeProperties = fillMissingMonths(monthlyProperties, allMonths);

    const chartData: DashboardChartData = {
      revenue: completeRevenue,
      properties: completeProperties,
      period,
      lastUpdated: new Date().toISOString(),
    };

    // Armazenar no cache com compressão para dados maiores
    await cache.set(cacheKey, chartData, {
      strategy: CACHE_STRATEGIES.charts,
      tags: ['dashboard', 'charts', period],
      compress: true, // Comprimir dados históricos
      syncAcrossTabs: true
    });

    return chartData;

  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error);
    
    // Tentar cache stale
    const staleData = await cache.get<DashboardChartData>(cacheKey);
    if (staleData) {
      console.warn('📈 Using stale chart data due to error');
      return staleData;
    }
    
    throw new DashboardError('Erro ao carregar gráficos', 'CHARTS_FETCH_ERROR');
  }
}

/**
 * Buscar atividades recentes sem cache (tempo real)
 */
async function fetchRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  // Atividades sempre fresh, sem cache
  try {
    const [appointmentsResult, dealsResult, contactsResult] = await Promise.allSettled([
      appointmentService.findAll({
        orderBy: 'createdAt',
        ascending: false,
        limit: Math.floor(limit / 3)
      }),
      
      dealService.findAll({
        orderBy: 'updatedAt',
        ascending: false,
        limit: Math.floor(limit / 3)
      }),
      
      contactService.findAll({
        orderBy: 'updatedAt',
        ascending: false,
        limit: Math.floor(limit / 3)
      })
    ]);

    const activities: RecentActivity[] = [];

    // Processar agendamentos
    if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value.data) {
      appointmentsResult.value.data.forEach(apt => {
        activities.push({
          id: `apt-${apt.id}`,
          action: `Agendamento ${apt.type === 'VISIT' ? 'de visita' : 'de reunião'} marcado`,
          time: formatRelativeTime(apt.createdAt),
          type: 'appointment',
          user: apt.agent?.name || 'Sistema'
        });
      });
    }

    // Processar deals
    if (dealsResult.status === 'fulfilled' && dealsResult.value.data) {
      dealsResult.value.data.forEach(deal => {
        const action = deal.stage === 'WON' 
          ? `Negócio fechado: ${deal.title}`
          : `Negócio atualizado para ${deal.stage}`;
        
        activities.push({
          id: `deal-${deal.id}`,
          action,
          time: formatRelativeTime(deal.updatedAt),
          type: 'deal',
          user: deal.agent?.name || 'Sistema'
        });
      });
    }

    // Processar contatos
    if (contactsResult.status === 'fulfilled' && contactsResult.value.data) {
      contactsResult.value.data.forEach(contact => {
        activities.push({
          id: `contact-${contact.id}`,
          action: `Lead ${contact.name} ${contact.createdAt === contact.updatedAt ? 'adicionado' : 'atualizado'}`,
          time: formatRelativeTime(contact.updatedAt),
          type: 'contact',
          user: contact.agent?.name || 'Sistema'
        });
      });
    }

    // Ordenar por tempo e limitar
    return activities
      .sort((a, b) => {
        const getTimeValue = (time: string): number => {
          if (time === 'agora') return 0;
          const match = time.match(/(\d+)\s*(min|h|dias?)/);
          if (!match) return Infinity;
          
          const value = parseInt(match[1]);
          const unit = match[2];
          
          if (unit.includes('min')) return value;
          if (unit === 'h') return value * 60;
          if (unit.includes('dia')) return value * 24 * 60;
          return Infinity;
        };
        
        return getTimeValue(a.time) - getTimeValue(b.time);
      })
      .slice(0, limit);

  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    throw new DashboardError('Erro ao carregar atividades', 'ACTIVITIES_FETCH_ERROR');
  }
}

// ================================================================
// HOOK PRINCIPAL OTIMIZADO
// ================================================================

export interface UseDashboardOptions {
  chartPeriod?: string;
  activitiesLimit?: number;
  enableRealtime?: boolean;
  filters?: DashboardFilters;
  enableCache?: boolean;
}

export interface UseDashboardReturn {
  // Estados dos dados
  stats: DashboardStats | undefined;
  chartData: DashboardChartData | undefined;
  activities: RecentActivity[] | undefined;

  // Estados de loading
  isLoadingStats: boolean;
  isLoadingCharts: boolean;
  isLoadingActivities: boolean;
  isLoading: boolean;

  // Estados de erro
  statsError: Error | null;
  chartsError: Error | null;
  activitiesError: Error | null;
  hasError: boolean;

  // Controles
  refetchStats: () => void;
  refetchCharts: () => void;
  refetchActivities: () => void;
  refetchAll: () => void;

  // Status da conexão e cache
  isOnline: boolean;
  isOffline: boolean;
  lastUpdated: string | null;
  cacheMetrics: {
    hitRate: number;
    size: number;
    offlineQueueSize: number;
  };
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const {
    chartPeriod = '6months',
    activitiesLimit = 10,
    enableRealtime = true,
    filters,
    enableCache = true
  } = options;

  const queryClient = useQueryClient();
  const cache = getUnifiedCache();
  const { invalidate, invalidateByTags } = useCacheInvalidation();
  const { isOnline, queueSize } = useOfflineCache();
  const [cacheMetrics, setCacheMetrics] = useState(cache.getMetrics());

  // Query para estatísticas principais com cache unificado
  const statsQuery = useCacheQuery(
    DASHBOARD_QUERY_KEYS.stats,
    fetchDashboardStats,
    {
      strategy: CACHE_STRATEGIES.stats,
      tags: ['dashboard', 'stats'],
      staleTime: 10 * 1000 // 10 segundos
    },
    {
      enabled: enableCache,
      retry: isOnline ? 3 : 0,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Query para dados dos gráficos com cache unificado
  const chartsQuery = useCacheQuery(
    DASHBOARD_QUERY_KEYS.chartData(chartPeriod),
    () => fetchChartData(chartPeriod),
    {
      strategy: CACHE_STRATEGIES.charts,
      tags: ['dashboard', 'charts', chartPeriod],
      staleTime: 30 * 60 * 1000 // 30 minutos
    },
    {
      enabled: enableCache,
      retry: isOnline ? 2 : 0,
    }
  );

  // Query para atividades recentes (sem cache - tempo real)
  const activitiesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit),
    queryFn: () => fetchRecentActivities(activitiesLimit),
    staleTime: 0, // Sempre fresh
    cacheTime: 0, // Sem cache
    enabled: isOnline, // Só buscar se online
    retry: 1,
  });

  // Atualizar métricas de cache periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheMetrics(cache.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [cache]);

  // Configurar atualizações em tempo real via EventBus
  useEffect(() => {
    if (!enableRealtime) return;

    const events = [
      SystemEvents.PROPERTY_CREATED,
      SystemEvents.PROPERTY_UPDATED,
      SystemEvents.CONTACT_CREATED,
      SystemEvents.CONTACT_UPDATED,
      SystemEvents.CONTACT_STAGE_CHANGED,
      SystemEvents.APPOINTMENT_CREATED,
      SystemEvents.APPOINTMENT_UPDATED,
      SystemEvents.DEAL_CREATED,
      SystemEvents.DEAL_UPDATED,
      SystemEvents.DEAL_WON,
      SystemEvents.DEAL_LOST
    ];

    const subscriptions = events.map(event => 
      EventBus.on(event, async () => {
        // Invalidar cache relevante baseado no evento
        switch (event) {
          case SystemEvents.PROPERTY_CREATED:
          case SystemEvents.PROPERTY_UPDATED:
            await invalidateByTags(['dashboard', 'stats']);
            await invalidateByTags(['dashboard', 'charts']);
            break;
          
          case SystemEvents.CONTACT_CREATED:
          case SystemEvents.CONTACT_UPDATED:
          case SystemEvents.CONTACT_STAGE_CHANGED:
            await invalidateByTags(['dashboard', 'stats']);
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit) });
            break;
          
          case SystemEvents.APPOINTMENT_CREATED:
          case SystemEvents.APPOINTMENT_UPDATED:
            await invalidateByTags(['dashboard', 'stats']);
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit) });
            break;
          
          case SystemEvents.DEAL_CREATED:
          case SystemEvents.DEAL_UPDATED:
          case SystemEvents.DEAL_WON:
          case SystemEvents.DEAL_LOST:
            await invalidateByTags(['dashboard']);
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit) });
            break;
        }
      })
    );

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [enableRealtime, chartPeriod, activitiesLimit, queryClient, invalidateByTags]);

  // Função para atualizar todos os dados
  const refetchAll = useCallback(async () => {
    // Invalidar cache antes de refetch
    await invalidateByTags(['dashboard']);
    
    statsQuery.refetch();
    chartsQuery.refetch();
    activitiesQuery.refetch();
  }, [statsQuery, chartsQuery, activitiesQuery, invalidateByTags]);

  // Estados derivados
  const isLoading = statsQuery.isLoading || chartsQuery.isLoading || activitiesQuery.isLoading;
  const hasError = Boolean(statsQuery.error || chartsQuery.error || activitiesQuery.error);
  const lastUpdated = statsQuery.data?.lastUpdated || chartsQuery.data?.lastUpdated || null;

  return {
    // Dados
    stats: statsQuery.data,
    chartData: chartsQuery.data,
    activities: activitiesQuery.data,
    
    // Loading states
    isLoadingStats: statsQuery.isLoading,
    isLoadingCharts: chartsQuery.isLoading,
    isLoadingActivities: activitiesQuery.isLoading,
    isLoading,
    
    // Error states
    statsError: statsQuery.error,
    chartsError: chartsQuery.error,
    activitiesError: activitiesQuery.error,
    hasError,
    
    // Controles
    refetchStats: () => statsQuery.refetch(),
    refetchCharts: () => chartsQuery.refetch(),
    refetchActivities: () => activitiesQuery.refetch(),
    refetchAll,
    
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
// FUNÇÕES UTILITÁRIAS (reutilizadas do original)
// ================================================================

function groupDataByMonth(
  data: any[], 
  dateField: string, 
  valueField?: string
): { month: string; value: number }[] {
  const monthlyData: Record<string, number> = {};

  data.forEach(item => {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    
    monthlyData[monthKey] += valueField ? (item[valueField] || 0) : 1;
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dias atrás`;
}

function generateMonthRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthKey);
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}

function fillMissingMonths(
  data: { month: string; value: number }[],
  allMonths: string[]
): { month: string; value: number }[] {
  const dataMap = new Map(data.map(item => [item.month, item.value]));
  
  return allMonths.map(month => ({
    month,
    value: dataMap.get(month) || 0
  }));
}

class DashboardError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default useDashboard;
export { DashboardError };