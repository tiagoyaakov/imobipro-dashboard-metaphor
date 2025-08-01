// ================================================================
// TIPOS TYPESCRIPT - ATIVIDADES
// ================================================================
// Data: 01/02/2025
// Descrição: Tipos TypeScript para sistema de atividades
// ================================================================

// ================================================================
// TIPOS BÁSICOS
// ================================================================

export type ActivityType = 
  | 'USER_CREATED'
  | 'PROPERTY_CREATED'
  | 'PROPERTY_UPDATED' 
  | 'PROPERTY_DELETED'
  | 'CONTACT_CREATED'
  | 'CONTACT_UPDATED'
  | 'CONTACT_DELETED'
  | 'APPOINTMENT_SCHEDULED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_CANCELED'
  | 'DEAL_CREATED'
  | 'DEAL_UPDATED'
  | 'DEAL_CLOSED'
  | 'CHAT_MESSAGE_SENT'
  | 'LEAD_ASSIGNED'
  | 'PIPELINE_MOVED'
  | 'REPORT_GENERATED'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SYSTEM_ERROR'
  | 'INTEGRATION_SYNC';

export type ActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActivityStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// ================================================================
// INTERFACES PRINCIPAIS
// ================================================================

export interface RecentActivity {
  id: string;
  action: string;
  time: string;
  type: 'property' | 'contact' | 'appointment' | 'deal' | 'other';
  user: string;
  metadata?: {
    userId?: string;
    userEmail?: string;
    userAvatar?: string;
    entityId?: string;
    entityType?: string;
    originalType?: string;
    rawData?: Record<string, any>;
    timestamp?: string;
    priority?: ActivityPriority;
    status?: ActivityStatus;
  };
}

export interface ActivityFilter {
  userId?: string;
  entityType?: string;
  types?: ActivityType[];
  dateFrom?: string;
  dateTo?: string;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  limit?: number;
}

// ================================================================
// DADOS DE CRIAÇÃO
// ================================================================

export interface ActivityCreateData {
  type: ActivityType;
  description: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  priority?: ActivityPriority;
}

// ================================================================
// ESTATÍSTICAS
// ================================================================

export interface ActivityStats {
  total: number;
  byType: Record<ActivityType, number>;
  byUser: Record<string, number>;
  byPriority: Record<ActivityPriority, number>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
  dailyDistribution: Array<{
    date: string;
    count: number;
  }>;
}

// ================================================================
// CONFIGURAÇÕES
// ================================================================

export interface ActivityServiceOptions {
  enableRealtime?: boolean;
  bufferSize?: number;
  maxRetries?: number;
  onError?: (error: Error) => void;
  onActivity?: (activity: RecentActivity) => void;
}

// ================================================================
// LOGS E AUDITORIA
// ================================================================

export interface ActivityLog {
  id: string;
  activityId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'VIEWED';
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ================================================================
// TEMPLATES DE ATIVIDADE
// ================================================================

export interface ActivityTemplate {
  type: ActivityType;
  template: string;
  variables: string[];
  priority?: ActivityPriority;
  icon?: string;
  color?: string;
}

// ================================================================
// NOTIFICAÇÕES
// ================================================================

export interface ActivityNotification {
  id: string;
  activityId: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

// ================================================================
// AGRUPAMENTO E CATEGORIZAÇÃO
// ================================================================

export interface ActivityGroup {
  type: ActivityType;
  activities: RecentActivity[];
  count: number;
  latestActivity: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  description?: string;
  types: ActivityType[];
  color?: string;
  icon?: string;
}

// ================================================================
// MÉTRICAS E PERFORMANCE
// ================================================================

export interface ActivityMetrics {
  averagePerDay: number;
  averagePerUser: number;
  peakHours: number[];
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  typeDistribution: Array<{
    type: ActivityType;
    count: number;
    percentage: number;
  }>;
}

// ================================================================
// HOOKS RETURN TYPES
// ================================================================

export interface UseActivitiesReturn {
  activities: RecentActivity[];
  stats: ActivityStats | undefined;
  metrics: ActivityMetrics | undefined;
  
  isLoading: boolean;
  isLoadingStats: boolean;
  error: Error | null;
  
  refetch: () => Promise<void>;
  createActivity: (data: ActivityCreateData) => Promise<RecentActivity>;
  clearActivities: () => void;
  
  // Realtime
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

// ================================================================
// COMPONENTES PROPS
// ================================================================

export interface ActivityFeedProps {
  activities: RecentActivity[];
  loading?: boolean;
  error?: Error | null;
  limit?: number;
  groupByType?: boolean;
  showUserAvatars?: boolean;
  onActivityClick?: (activity: RecentActivity) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface ActivityItemProps {
  activity: RecentActivity;
  showUser?: boolean;
  showTime?: boolean;
  interactive?: boolean;
  onClick?: (activity: RecentActivity) => void;
}

export interface ActivityStatsProps {
  stats: ActivityStats;
  loading?: boolean;
  error?: Error | null;
  timeRange?: 'today' | 'week' | 'month';
  onTimeRangeChange?: (range: 'today' | 'week' | 'month') => void;
}

// ================================================================
// EXPORT PRINCIPAL
// ================================================================

export type {
  ActivityType,
  ActivityPriority,
  ActivityStatus,
  RecentActivity,
  ActivityFilter,
  ActivityStats,
  ActivityCreateData,
  UseActivitiesReturn,
};