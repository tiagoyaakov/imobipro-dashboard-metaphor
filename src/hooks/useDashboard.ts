// ================================================================
// HOOK USEDASHBOARD - DADOS REAIS COM REACT QUERY
// ================================================================
// Data: 01/02/2025
// Descrição: Hook principal para dashboard com dados reais do Supabase
// Features: Cache inteligente, atualizações em tempo real, error handling
// ================================================================

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useState, useEffect, useCallback } from 'react';
import { propertyService, contactService, appointmentService, dealService } from '@/services';
import { EventBus, SystemEvents, useEventBus } from '@/lib/event-bus';
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
// FUNÇÕES DE API PARA SUPABASE
// ================================================================

/**
 * Buscar estatísticas principais do dashboard
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
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

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    throw new DashboardError('Erro ao carregar estatísticas', 'STATS_FETCH_ERROR');
  }
}

/**
 * Buscar dados para gráficos
 */
async function fetchChartData(period: string = '6months'): Promise<DashboardChartData> {
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

    // Buscar dados em paralelo
    const [dealsResult, propertiesResult] = await Promise.allSettled([
      // Buscar deals fechados no período
      dealService.findAll({
        filters: {
          stage: 'WON',
          closedDateFrom: startDate.toISOString(),
          closedDateTo: endDate.toISOString()
        },
        orderBy: 'closedAt',
        ascending: true
      }),
      
      // Buscar propriedades criadas no período
      propertyService.findAll({
        filters: {
          createdFrom: startDate.toISOString(),
          createdTo: endDate.toISOString()
        },
        orderBy: 'createdAt',
        ascending: true
      })
    ]);

    // Processar dados de vendas
    const salesData = dealsResult.status === 'fulfilled' && dealsResult.value.data 
      ? dealsResult.value.data.map(deal => ({
          value: Number(deal.value),
          closedAt: deal.closedAt || deal.updatedAt
        }))
      : [];

    // Processar dados de propriedades
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

    return {
      revenue: completeRevenue,
      properties: completeProperties,
      period,
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error);
    throw new DashboardError('Erro ao carregar gráficos', 'CHARTS_FETCH_ERROR');
  }
}

/**
 * Buscar atividades recentes
 */
async function fetchRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  try {
    // Por enquanto, vamos buscar atividades de múltiplas fontes e combiná-las
    const [appointmentsResult, dealsResult, contactsResult] = await Promise.allSettled([
      // Buscar agendamentos recentes
      appointmentService.findAll({
        orderBy: 'createdAt',
        ascending: false,
        limit: Math.floor(limit / 3)
      }),
      
      // Buscar deals recentes
      dealService.findAll({
        orderBy: 'updatedAt',
        ascending: false,
        limit: Math.floor(limit / 3)
      }),
      
      // Buscar contatos recentes
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
        // Converter tempo relativo de volta para comparação
        // Isso é uma simplificação - em produção, seria melhor manter timestamps
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
// HOOK PRINCIPAL
// ================================================================

export interface UseDashboardOptions {
  chartPeriod?: string;
  activitiesLimit?: number;
  enableRealtime?: boolean;
  filters?: DashboardFilters;
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

  // Status da conexão
  isOnline: boolean;
  lastUpdated: string | null;
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
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
    queryKey: DASHBOARD_QUERY_KEYS.stats,
    queryFn: fetchDashboardStats,
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
    queryKey: DASHBOARD_QUERY_KEYS.chartData(chartPeriod),
    queryFn: () => fetchChartData(chartPeriod),
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
    queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit),
    queryFn: () => fetchRecentActivities(activitiesLimit),
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

  // Configurar atualizações em tempo real via EventBus
  useEffect(() => {
    if (!enableRealtime || !isOnline) return;

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
      EventBus.on(event, () => {
        // Invalidar queries relevantes baseado no evento
        switch (event) {
          case SystemEvents.PROPERTY_CREATED:
          case SystemEvents.PROPERTY_UPDATED:
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.stats });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.chartData(chartPeriod) });
            break;
          
          case SystemEvents.CONTACT_CREATED:
          case SystemEvents.CONTACT_UPDATED:
          case SystemEvents.CONTACT_STAGE_CHANGED:
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.stats });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit) });
            break;
          
          case SystemEvents.APPOINTMENT_CREATED:
          case SystemEvents.APPOINTMENT_UPDATED:
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.stats });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit) });
            break;
          
          case SystemEvents.DEAL_CREATED:
          case SystemEvents.DEAL_UPDATED:
          case SystemEvents.DEAL_WON:
          case SystemEvents.DEAL_LOST:
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.stats });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.chartData(chartPeriod) });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit) });
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
  };
}

// ================================================================
// FUNÇÕES UTILITÁRIAS
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
 * Mapear tipo de atividade para visualização
 */
function mapActivityType(type: string): 'property' | 'contact' | 'appointment' | 'deal' | 'other' {
  const typeMap: Record<string, 'property' | 'contact' | 'appointment' | 'deal' | 'other'> = {
    'PROPERTY_CREATED': 'property',
    'PROPERTY_UPDATED': 'property',
    'CONTACT_CREATED': 'contact',
    'CONTACT_UPDATED': 'contact',
    'APPOINTMENT_SCHEDULED': 'appointment',
    'DEAL_CREATED': 'deal',
    'DEAL_UPDATED': 'deal',
  };

  return typeMap[type] || 'other';
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
    this.name = 'DashboardError';
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default useDashboard;
export { DashboardError };