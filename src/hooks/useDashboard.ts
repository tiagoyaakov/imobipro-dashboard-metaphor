// ================================================================
// HOOK USEDASHBOARD - DADOS REAIS COM REACT QUERY
// ================================================================
// Data: 01/02/2025
// Descrição: Hook principal para dashboard com dados reais do Supabase
// Features: Cache inteligente, atualizações em tempo real, error handling
// ================================================================

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';
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
    // Executar queries em paralelo para performance
    const [
      propertiesResult,
      contactsResult,
      appointmentsResult,
      dealsResult
    ] = await Promise.allSettled([
      // Total de propriedades e mudança mensal
      supabase
        .from('Property')
        .select('id, createdAt, status, salePrice')
        .eq('isActive', true),
      
      // Clientes ativos
      supabase
        .from('Contact')
        .select('id, createdAt, status, leadStage')
        .eq('status', 'ACTIVE'),
      
      // Agendamentos desta semana
      supabase
        .from('Appointment')
        .select('id, createdAt, status, scheduledFor')
        .gte('scheduledFor', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('scheduledFor', new Date().toISOString()),
      
      // Receita mensal
      supabase
        .from('Deal')
        .select('id, value, stage, closedAt')
        .eq('stage', 'WON')
        .gte('closedAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    // Processar resultados
    const properties = propertiesResult.status === 'fulfilled' ? propertiesResult.value.data || [] : [];
    const contacts = contactsResult.status === 'fulfilled' ? contactsResult.value.data || [] : [];
    const appointments = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.data || [] : [];
    const deals = dealsResult.status === 'fulfilled' ? dealsResult.value.data || [] : [];

    // Calcular mudanças mensais
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    const propertiesThisMonth = properties.filter(p => 
      new Date(p.createdAt) >= lastMonth
    ).length;
    
    const contactsThisMonth = contacts.filter(c => 
      new Date(c.createdAt) >= lastMonth
    ).length;

    // Calcular receita total
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    return {
      totalProperties: {
        value: properties.length,
        change: propertiesThisMonth > 0 ? `+${Math.round((propertiesThisMonth / properties.length) * 100)}%` : '0%',
        trend: 'up' as const,
      },
      activeClients: {
        value: contacts.length,
        change: contactsThisMonth > 0 ? `+${Math.round((contactsThisMonth / contacts.length) * 100)}%` : '0%',
        trend: 'up' as const,
      },
      weeklyAppointments: {
        value: appointments.length,
        change: appointments.length > 0 ? '+23%' : '0%', // Placeholder para cálculo real
        trend: 'up' as const,
      },
      monthlyRevenue: {
        value: totalRevenue,
        change: '+15%', // Placeholder para cálculo de comparação mensal
        trend: 'up' as const,
        formatted: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
        }).format(totalRevenue),
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

    // Buscar dados de vendas por mês
    const { data: salesData, error: salesError } = await supabase
      .from('Deal')
      .select('value, closedAt, stage')
      .eq('stage', 'WON')
      .gte('closedAt', startDate.toISOString())
      .order('closedAt', { ascending: true });

    if (salesError) throw salesError;

    // Buscar dados de propriedades por mês  
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('Property')
      .select('createdAt, status, salePrice')
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: true });

    if (propertiesError) throw propertiesError;

    // Agrupar dados por mês
    const monthlyRevenue = groupDataByMonth(salesData || [], 'closedAt', 'value');
    const monthlyProperties = groupDataByMonth(propertiesData || [], 'createdAt');

    return {
      revenue: monthlyRevenue,
      properties: monthlyProperties,
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
    const { data: activities, error } = await supabase
      .from('Activity')
      .select(`
        id,
        type,
        description,
        createdAt,
        user:userId (
          name
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (activities || []).map(activity => ({
      id: activity.id,
      action: activity.description,
      time: formatRelativeTime(activity.createdAt),
      type: mapActivityType(activity.type),
      user: activity.user?.name || 'Sistema',
    }));

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

  // Configurar atualizações em tempo real via Supabase
  useEffect(() => {
    if (!enableRealtime || !isOnline) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Property' },
        () => {
          queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.stats });
          queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.chartData(chartPeriod) });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'Contact' },
        () => {
          queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.stats });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'Activity' },
        () => {
          queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.activities(activitiesLimit) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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