// ================================================================
// HOOK USEDASHBOARDV3 - MIGRAÇÃO PARA SERVICES MVP
// ================================================================
// Data: 07/08/2025
// Descrição: Hook de dashboard migrado para usar services MVP (6 tabelas)
// Migração: Sistema antigo → MVP services (imoveisVivaReal, dadosCliente, etc.)
// ================================================================

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { EventBus, SystemEvents, useEventBus } from '@/lib/event-bus';

// MVP Services
import { imoveisVivaRealService } from '@/services/imoveisVivaReal.service';
import { dadosClienteService } from '@/services/dadosCliente.service';
import { interesseImoveisService } from '@/services/interesseImoveis.service';

// Types
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

export const DASHBOARD_V3_QUERY_KEYS = {
  stats: ['dashboard-v3', 'stats'] as const,
  chartData: (period: string) => ['dashboard-v3', 'charts', period] as const,
  activities: (limit: number) => ['dashboard-v3', 'activities', limit] as const,
  realtimeStats: ['dashboard-v3', 'realtime'] as const,
  performance: (period: string) => ['dashboard-v3', 'performance', period] as const,
} as const;

// ================================================================
// CONFIGURAÇÕES DE CACHE
// ================================================================

const CACHE_CONFIG = {
  // Stats atualizadas a cada 5 minutos
  stats: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 5 * 60 * 1000, // Auto-refresh a cada 5 min
  },
  // Gráficos atualizados a cada 15 minutos
  charts: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchInterval: 15 * 60 * 1000,
  },
  // Atividades em tempo real (1 minuto)
  activities: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 1 * 60 * 1000,
  },
} as const;

// ================================================================
// FUNÇÕES DE API PARA MVP SERVICES
// ================================================================

/**
 * Buscar estatísticas principais do dashboard usando MVP services
 */
async function fetchDashboardStatsV3(): Promise<DashboardStats> {
  try {
    // Executar queries em paralelo usando os serviços MVP
    const [
      propertiesResult,
      clientsResult,
      interestResult
    ] = await Promise.allSettled([
      imoveisVivaRealService.getStats(),
      dadosClienteService.getStats(),
      interesseImoveisService.getStats()
    ]);

    // Processar resultados com fallback
    const propertiesData = propertiesResult.status === 'fulfilled' ? propertiesResult.value.data : null;
    const clientsData = clientsResult.status === 'fulfilled' ? clientsResult.value.data : null;
    const interestData = interestResult.status === 'fulfilled' ? interestResult.value.data : null;

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

    // ===============================================
    // VALORES PARA PROPRIEDADES (MVP)
    // ===============================================
    
    const totalProperties = propertiesData?.totalProperties || 0;
    const propertiesThisMonth = propertiesData?.createdThisMonth || 0;
    const propertiesLastMonth = propertiesData?.createdLastMonth || 0;

    // ===============================================
    // VALORES PARA CLIENTES (MVP)
    // ===============================================
    
    const activeClients = clientsData?.totalClients || 0;
    const clientsThisMonth = clientsData?.createdThisMonth || 0;
    const clientsLastMonth = clientsData?.createdLastMonth || 0;

    // ===============================================
    // VALORES PARA AGENDAMENTOS (MVP - FALLBACK)
    // ===============================================
    
    // NOTA: No MVP, agendamentos podem vir dos dados de interesse
    const weeklyAppointments = interestData?.activeInterests || 0;
    const appointmentsLastWeek = Math.max(0, weeklyAppointments - 5); // Fallback simples

    // ===============================================
    // VALORES PARA RECEITA (FALLBACK)
    // ===============================================
    
    // NOTA: No MVP, receita pode ser estimada baseada nas propriedades vendidas/alugadas
    const avgPropertyValue = propertiesData?.averageSalePrice || 200000; // Valor médio BR
    const estimatedMonthlyRevenue = propertiesThisMonth * avgPropertyValue * 0.05; // 5% comissão estimada
    const revenueLastMonth = propertiesLastMonth * avgPropertyValue * 0.05;

    // Calcular mudanças
    const propertiesChange = calculateChange(propertiesThisMonth, propertiesLastMonth);
    const clientsChange = calculateChange(clientsThisMonth, clientsLastMonth);
    const appointmentsChange = calculateChange(weeklyAppointments, appointmentsLastWeek);
    const revenueChange = calculateChange(estimatedMonthlyRevenue, revenueLastMonth);

    return {
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
        value: estimatedMonthlyRevenue,
        change: revenueChange,
        trend: getTrend(revenueChange),
        formatted: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
        }).format(estimatedMonthlyRevenue),
      },
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard V3:', error);
    throw new DashboardError('Erro ao carregar estatísticas MVP', 'STATS_FETCH_ERROR_V3');
  }
}

/**
 * Buscar dados para gráficos usando MVP services
 */
async function fetchChartDataV3(period: string = '6months'): Promise<DashboardChartData> {
  try {
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

    // Buscar propriedades criadas no período usando MVP service
    const propertiesResult = await imoveisVivaRealService.findAll({
      filters: {
        createdFrom: startDate.toISOString(),
        createdTo: endDate.toISOString()
      },
      orderBy: 'created_at',
      ascending: true,
      limit: 1000 // Limit alto para análises
    });

    // Buscar dados de interesse (proxy para vendas no MVP)
    const interestResult = await interesseImoveisService.findAll({
      filters: {
        created_at_gte: startDate.toISOString(),
        created_at_lte: endDate.toISOString(),
        status: 'concluido' // Interesses concluídos como proxy para vendas
      },
      orderBy: 'created_at',
      ascending: true,
      limit: 1000
    });

    // Processar dados de propriedades
    const propertiesData = propertiesResult.data || [];
    
    // Processar dados de "vendas" (interesses concluídos)
    const salesData = interestResult.data?.map(interest => ({
      value: 200000, // Valor médio estimado - no futuro pode vir da tabela propriedades
      closedAt: interest.created_at
    })) || [];

    // Agrupar dados por mês
    const monthlyRevenue = groupDataByMonth(salesData, 'closedAt', 'value');
    const monthlyProperties = groupDataByMonth(
      propertiesData.map(prop => ({
        createdAt: prop.created_at,
        status: prop.status
      })), 
      'createdAt'
    );

    // Garantir que todos os meses estejam representados
    const allMonths = generateMonthRange(startDate, endDate);
    const completeRevenue = fillMissingMonths(monthlyRevenue, allMonths);
    const completeProperties = fillMissingMonths(monthlyProperties, allMonths);

    return {
      revenue: completeRevenue,
      properties: completeProperties,
      period,
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos V3:', error);
    throw new DashboardError('Erro ao carregar gráficos MVP', 'CHARTS_FETCH_ERROR_V3');
  }
}

/**
 * Buscar atividades recentes usando MVP services
 */
async function fetchRecentActivitiesV3(limit: number = 10): Promise<RecentActivity[]> {
  try {
    // Buscar atividades de múltiplas fontes MVP
    const [propertiesResult, clientsResult, interestResult] = await Promise.allSettled([
      
      // Propriedades recentes
      imoveisVivaRealService.findAll({
        orderBy: 'updated_at',
        ascending: false,
        limit: Math.floor(limit / 3)
      }),
      
      // Clientes recentes
      dadosClienteService.findAll({
        orderBy: 'updated_at',
        ascending: false,
        limit: Math.floor(limit / 3)
      }),

      // Interesses recentes
      interesseImoveisService.findAll({
        orderBy: 'updated_at',
        ascending: false,
        limit: Math.floor(limit / 3)
      })
    ]);

    const activities: RecentActivity[] = [];

    // Processar propriedades
    if (propertiesResult.status === 'fulfilled' && propertiesResult.value.data) {
      propertiesResult.value.data.forEach(property => {
        const isNew = property.created_at === property.updated_at;
        
        activities.push({
          id: `property-${property.id}`,
          action: isNew 
            ? `Nova propriedade: ${property.title || 'Sem título'}`
            : `Propriedade atualizada: ${property.title || 'Sem título'}`,
          time: formatRelativeTime(property.updated_at),
          type: 'property',
          user: property.funcionario_id || 'Sistema'
        });
      });
    }

    // Processar clientes
    if (clientsResult.status === 'fulfilled' && clientsResult.value.data) {
      clientsResult.value.data.forEach(client => {
        const isNew = client.created_at === client.updated_at;
        
        activities.push({
          id: `client-${client.id}`,
          action: isNew
            ? `Novo cliente: ${client.nome}`
            : `Cliente atualizado: ${client.nome}`,
          time: formatRelativeTime(client.updated_at),
          type: 'contact',
          user: client.funcionario_id || 'Sistema'
        });
      });
    }

    // Processar interesses (como atividades de negócio)
    if (interestResult.status === 'fulfilled' && interestResult.value.data) {
      interestResult.value.data.forEach(interest => {
        const actionMap = {
          'ativo': 'Novo interesse registrado',
          'concluido': 'Interesse concluído',
          'pausado': 'Interesse pausado',
          'cancelado': 'Interesse cancelado'
        };
        
        activities.push({
          id: `interest-${interest.id}`,
          action: actionMap[interest.status] || 'Interesse atualizado',
          time: formatRelativeTime(interest.updated_at),
          type: 'deal',
          user: interest.funcionario_id || 'Sistema'
        });
      });
    }

    // Ordenar por tempo e limitar
    return activities
      .sort((a, b) => {
        // Converter tempo relativo de volta para comparação
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
    console.error('Erro ao buscar atividades recentes V3:', error);
    throw new DashboardError('Erro ao carregar atividades MVP', 'ACTIVITIES_FETCH_ERROR_V3');
  }
}

// ================================================================
// HOOK PRINCIPAL
// ================================================================

export interface UseDashboardV3Options {
  chartPeriod?: string;
  activitiesLimit?: number;
  enableRealtime?: boolean;
  filters?: DashboardFilters;
}

export interface UseDashboardV3Return {
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

  // Status da conexão
  isOnline: boolean;
  lastUpdated: string | null;
  
  // Flag para identificar versão
  version: 'V3_MVP';
}

export function useDashboardV3(options: UseDashboardV3Options = {}): UseDashboardV3Return {
  const {
    chartPeriod = '6months',
    activitiesLimit = 10,
    enableRealtime = true,
    filters
  } = options;

  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Query para estatísticas principais
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: DASHBOARD_V3_QUERY_KEYS.stats,
    queryFn: fetchDashboardStatsV3,
    ...CACHE_CONFIG.stats,
    enabled: isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query para dados dos gráficos
  const {
    data: chartData,
    isLoading: isLoadingCharts,
    error: chartsError,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: DASHBOARD_V3_QUERY_KEYS.chartData(chartPeriod),
    queryFn: () => fetchChartDataV3(chartPeriod),
    ...CACHE_CONFIG.charts,
    enabled: isOnline,
    retry: 2,
  });

  // Query para atividades recentes
  const {
    data: activities,
    isLoading: isLoadingActivities,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: DASHBOARD_V3_QUERY_KEYS.activities(activitiesLimit),
    queryFn: () => fetchRecentActivitiesV3(activitiesLimit),
    ...CACHE_CONFIG.activities,
    enabled: isOnline,
    retry: 2,
  });

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Configurar atualizações em tempo real via EventBus (MVP)
  useEffect(() => {
    if (!enableRealtime || !isOnline) return;

    const events = [
      SystemEvents.PROPERTY_CREATED,
      SystemEvents.PROPERTY_UPDATED,
      SystemEvents.CONTACT_CREATED,
      SystemEvents.CONTACT_UPDATED,
      SystemEvents.CONTACT_STAGE_CHANGED,
      SystemEvents.CHAT_MESSAGE_SENT, // MVP event
      SystemEvents.CHAT_MESSAGE_UPDATED // MVP event
    ];

    const subscriptions = events.map(event => 
      EventBus.on(event, () => {
        // Invalidar queries relevantes baseado no evento
        switch (event) {
          case SystemEvents.PROPERTY_CREATED:
          case SystemEvents.PROPERTY_UPDATED:
            queryClient.invalidateQueries({ queryKey: DASHBOARD_V3_QUERY_KEYS.stats });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_V3_QUERY_KEYS.chartData(chartPeriod) });
            break;
          
          case SystemEvents.CONTACT_CREATED:
          case SystemEvents.CONTACT_UPDATED:
          case SystemEvents.CONTACT_STAGE_CHANGED:
            queryClient.invalidateQueries({ queryKey: DASHBOARD_V3_QUERY_KEYS.stats });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_V3_QUERY_KEYS.activities(activitiesLimit) });
            break;
          
          case SystemEvents.CHAT_MESSAGE_SENT:
          case SystemEvents.CHAT_MESSAGE_UPDATED:
            queryClient.invalidateQueries({ queryKey: DASHBOARD_V3_QUERY_KEYS.activities(activitiesLimit) });
            break;
        }
      })
    );

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [enableRealtime, isOnline, chartPeriod, activitiesLimit, queryClient]);

  // Função para atualizar todos os dados
  const refetchAll = useCallback(() => {
    refetchStats();
    refetchCharts();
    refetchActivities();
  }, [refetchStats, refetchCharts, refetchActivities]);

  // Estados derivados
  const isLoading = isLoadingStats || isLoadingCharts || isLoadingActivities;
  const hasError = Boolean(statsError || chartsError || activitiesError);
  const lastUpdated = stats?.lastUpdated || chartData?.lastUpdated || null;

  return {
    // Dados
    stats,
    chartData,
    activities,
    
    // Loading states
    isLoadingStats,
    isLoadingCharts,
    isLoadingActivities,
    isLoading,
    
    // Error states
    statsError,
    chartsError,
    activitiesError,
    hasError,
    
    // Controles
    refetchStats,
    refetchCharts,
    refetchActivities,
    refetchAll,
    
    // Status
    isOnline,
    lastUpdated,
    
    // Version identifier
    version: 'V3_MVP',
  };
}

// ================================================================
// FUNÇÕES UTILITÁRIAS (MANTIDAS DO ORIGINAL)
// ================================================================

/**
 * Agrupar dados por mês
 */
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

/**
 * Formatar tempo relativo
 */
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

/**
 * Gerar range de meses entre duas datas
 */
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

/**
 * Preencher meses faltantes com valor zero
 */
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

// ================================================================
// CLASSE DE ERRO CUSTOMIZADA
// ================================================================

class DashboardError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DashboardErrorV3';
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default useDashboardV3;
export { DashboardError };