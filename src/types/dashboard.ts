// ================================================================
// TIPOS TYPESCRIPT - DASHBOARD
// ================================================================
// Data: 01/02/2025
// Descrição: Tipos TypeScript completos para o sistema de dashboard
// ================================================================

// ================================================================
// ESTATÍSTICAS PRINCIPAIS
// ================================================================

export interface StatItem {
  value: number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  formatted?: string;
}

export interface DashboardStats {
  totalProperties: StatItem;
  activeClients: StatItem;
  weeklyAppointments: StatItem;
  monthlyRevenue: StatItem & { formatted: string };
  lastUpdated: string;
}

// ================================================================
// DADOS DE GRÁFICOS
// ================================================================

export interface ChartDataPoint {
  month: string;
  value: number;
  label?: string;
  color?: string;
}

export interface DashboardChartData {
  revenue: ChartDataPoint[];
  properties: ChartDataPoint[];
  period: string;
  lastUpdated: string;
}

// ================================================================
// ATIVIDADES RECENTES
// ================================================================

export interface RecentActivity {
  id: string;
  action: string;
  time: string;
  type: 'property' | 'contact' | 'appointment' | 'deal' | 'other';
  user: string;
  metadata?: Record<string, any>;
}

// ================================================================
// FILTROS E CONFIGURAÇÕES
// ================================================================

export interface DashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  agentId?: string;
  propertyTypes?: string[];
  contactCategories?: string[];
  includeInactive?: boolean;
}

export interface DashboardConfig {
  refreshInterval: number;
  enableRealtime: boolean;
  defaultChartPeriod: string;
  activitiesLimit: number;
  enableNotifications: boolean;
}

// ================================================================
// PERFORMANCE E MÉTRICAS
// ================================================================

export interface PerformanceMetrics {
  conversionRate: {
    leadsToClients: number;
    viewsToContacts: number;
    appointmentsToDeals: number;
  };
  averages: {
    dealValue: number;
    daysToClose: number;
    propertiesPerAgent: number;
  };
  trends: {
    salesGrowth: number;
    clientGrowth: number;
    propertyGrowth: number;
  };
}

// ================================================================
// DADOS EM TEMPO REAL
// ================================================================

export interface RealtimeData {
  onlineUsers: number;
  activeChats: number;
  pendingAppointments: number;
  newLeads: number;
  timestamp: string;
}

// ================================================================
// ERROS E STATUS
// ================================================================

export interface DashboardError {
  code: string;
  message: string;
  context?: any;
  timestamp: string;
}

export interface ConnectionStatus {
  isOnline: boolean;
  lastSync: string;
  hasErrors: boolean;
  errorCount: number;
}

// ================================================================
// AÇÕES RÁPIDAS
// ================================================================

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
}

// ================================================================
// NOTIFICAÇÕES
// ================================================================

export interface DashboardNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// ================================================================
// CONFIGURAÇÕES DE CACHE
// ================================================================

export interface CacheConfig {
  staleTime: number;
  cacheTime: number;
  refetchInterval?: number;
  enabled?: boolean;
}

// ================================================================
// HOOKS RETURN TYPES
// ================================================================

export interface UseDashboardReturn {
  // Estados dos dados
  stats: DashboardStats | undefined;
  chartData: DashboardChartData | undefined;
  activities: RecentActivity[] | undefined;
  performance?: PerformanceMetrics | undefined;
  realtime?: RealtimeData | undefined;

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
  connectionStatus: ConnectionStatus;
}

// ================================================================
// COMPONENTES PROPS
// ================================================================

export interface DashboardStatsCardProps {
  title: string;
  stat: StatItem;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  loading?: boolean;
  error?: Error | null;
}

export interface DashboardChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  title: string;
  period: string;
  loading?: boolean;
  error?: Error | null;
  height?: number;
}

export interface RecentActivitiesProps {
  activities: RecentActivity[];
  limit?: number;
  loading?: boolean;
  error?: Error | null;
  onActivityClick?: (activity: RecentActivity) => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  loading?: boolean;
  error?: Error | null;
}

// ================================================================
// API RESPONSE TYPES
// ================================================================

export interface DashboardApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    version: string;
    cached: boolean;
  };
}

// ================================================================
// SUPABASE ESPECÍFICO
// ================================================================

export interface SupabaseRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, any>;
  old?: Record<string, any>;
  schema: string;
  table: string;
  commit_timestamp: string;
}

// ================================================================
// CONFIGURAÇÕES DO SISTEMA
// ================================================================

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  realtime: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
}

export interface DashboardTheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
}

// ================================================================
// EXPORT DEFAULT
// ================================================================

export type {
  DashboardStats,
  DashboardChartData,
  RecentActivity,
  DashboardFilters,
  PerformanceMetrics,
  RealtimeData,
  UseDashboardReturn,
  QuickAction,
  DashboardNotification,
};