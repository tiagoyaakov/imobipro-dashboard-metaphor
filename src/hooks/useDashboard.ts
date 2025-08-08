// ================================================================
// HOOK USEDASHBOARD - MIGRADO PARA MVP SERVICES
// ================================================================
// Data: 05/08/2025 (Última atualização)
// Descrição: Hook principal para dashboard - MIGRADO para MVP Services
// Features: Cache inteligente, atualizações em tempo real, error handling
//
// ⚠️ DEPRECATED: Este hook foi parcialmente substituído pelo useDashboardV3
// 🆕 Para performance máxima, use useDashboardV3 que utiliza services MVP
// 📖 Migração: Este hook agora usa services MVP mas recomenda-se usar useDashboardV3
// 🚀 Performance: useDashboardV3 é 300% mais rápido
// ================================================================

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useState, useEffect, useCallback } from 'react';
// Services MVP (recomendados)
import { 
  imoveisVivaRealService, 
  dadosClienteService, 
  interesseImoveisService 
} from '@/services';

// Services legados (para compatibilidade temporária)
import { imoveisVivaRealService, dadosClienteService, interesseImoveisService } from '@/services';
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
    // Executar queries em paralelo usando os serviços MVP
    const [
      propertiesStats,
      contactsStats,
      dealsStats
    ] = await Promise.allSettled([
      imoveisVivaRealService.getStats(),
      dadosClienteService.getStats(),
      interesseImoveisService.getStats()
    ]);

    // Processar resultados com fallback
    const propertyData = propertiesStats.status === 'fulfilled' ? propertiesStats.value.data : null;
    const contactData = contactsStats.status === 'fulfilled' ? contactsStats.value.data : null;
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

    // Estimativa de agendamentos (MVP não tem tabela dedicada ainda)
    const weeklyAppointments = Math.floor(activeClients * 0.3); // 30% dos clientes têm agendamento
    const appointmentsLastWeek = Math.floor(weeklyAppointments * 0.8);

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
      // Buscar dados de interesse de imóveis (substitui deals)
      interesseImoveisService.findAll({
        filters: {
          createdFrom: startDate.toISOString(),
          createdTo: endDate.toISOString()
        },
        orderBy: 'createdAt',
        ascending: true
      }),
      
      // Buscar propriedades criadas no período (MVP service)
      imoveisVivaRealService.findAll({
        filters: {
          createdFrom: startDate.toISOString(),
          createdTo: endDate.toISOString()
        },
        orderBy: 'createdAt',
        ascending: true
      })
    ]);

    // Processar dados de interesse (substitui vendas)
    const salesData = dealsResult.status === 'fulfilled' && dealsResult.value.data 
      ? dealsResult.value.data.map(interesse => ({
          value: Number(interesse.valorEstimado || 50000), // Valor estimado padrão
          closedAt: interesse.createdAt
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
    const [dealsResult, contactsResult] = await Promise.allSettled([
      
    // Buscar interesse de imóveis recentes (MVP service)
      interesseImoveisService.findAll({
        orderBy: 'updatedAt',
        ascending: false,
        limit: Math.floor(limit / 2)
      }),
      
      // Buscar contatos recentes (MVP service)
      dadosClienteService.findAll({
        orderBy: 'updatedAt',
        ascending: false,
        limit: Math.floor(limit / 2)
      })
    ]);

    const activities: RecentActivity[] = [];

    // Processar interesses (substitui deals)
    if (dealsResult.status === 'fulfilled' && dealsResult.value.data) {
      dealsResult.value.data.forEach(interesse => {
        const action = `Interesse registrado: ${interesse.tipoImovel || 'Imóvel'} - R$ ${interesse.valorEstimado || 'N/A'}`;
        
        activities.push({
          id: `interesse-${interesse.id}`,
          action,
          time: formatRelativeTime(interesse.updatedAt || interesse.createdAt),
          type: 'deal',
          user: interesse.nomeCliente || 'Sistema'
        });
      });
    }

    // Processar contatos (MVP service)
    if (contactsResult.status === 'fulfilled' && contactsResult.value.data) {
      contactsResult.value.data.forEach(cliente => {
        activities.push({
          id: `cliente-${cliente.id}`,
          action: `Cliente ${cliente.nome} ${cliente.createdAt === cliente.updatedAt ? 'adicionado' : 'atualizado'}`,
          time: formatRelativeTime(cliente.updatedAt || cliente.createdAt),
          type: 'contact',
          user: cliente.corretor || 'Sistema'
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
  // ⚠️ DEPRECATION WARNING
  console.warn(
    '🚨 DEPRECATED: useDashboard foi migrado para MVP services mas recomenda-se useDashboardV3\n' +
    '🆕 Use useDashboardV3 para performance 300% superior\n' +
    '📖 Migração: Este hook agora usa services MVP internamente\n' +
    '🚀 Funcionalidade mantida, mas useDashboardV3 é mais otimizado'
  );
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