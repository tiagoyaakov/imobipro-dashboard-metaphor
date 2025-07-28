// Types específicos para o módulo de agenda
// Sincronizados com os modelos Prisma

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PENDING' | 'CANCELLED' | 'TENTATIVE';

export type SlotType = 'REGULAR' | 'URGENT' | 'FOLLOW_UP' | 'VIEWING' | 'MEETING' | 'BREAK';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export type SyncDirection = 'TO_GOOGLE' | 'FROM_GOOGLE' | 'BIDIRECTIONAL';

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC_CHECK';

export type SyncLogStatus = 'SUCCESS' | 'FAILED' | 'RETRYING' | 'CANCELLED';

export type AutomationTrigger = 'N8N_WEBHOOK' | 'WHATSAPP_BOT' | 'CALENDAR_SYNC' | 'AUTO_ASSIGNMENT' | 'MANUAL_CREATION';

export type ConflictType = 'TIME_OVERLAP' | 'DOUBLE_BOOKING' | 'SYNC_MISMATCH' | 'AVAILABILITY';

export type ConflictSource = 'GOOGLE_CALENDAR' | 'N8N_WORKFLOW' | 'MANUAL_EDIT' | 'AUTO_ASSIGNMENT';

export type ConflictStrategy = 'LATEST_WINS' | 'IMOBIPRO_WINS' | 'GOOGLE_WINS' | 'MANUAL_REVIEW';

export type ConflictResolution = 'AUTO_RESOLVED' | 'MANUAL_RESOLVED' | 'ESCALATED' | 'PENDING';

export type AppointmentSource = 'MANUAL' | 'WHATSAPP' | 'N8N_AUTOMATION' | 'GOOGLE_CALENDAR' | 'API_INTEGRATION' | 'BULK_IMPORT';

export type AppointmentPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type N8nTriggerType = 'WEBHOOK' | 'SCHEDULE' | 'MANUAL' | 'EVENT_DRIVEN';

export type N8nExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'WAITING';

// ===== INTERFACES PRINCIPAIS =====

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  available: boolean;
  start?: string; // HH:mm format
  end?: string;   // HH:mm format
  breaks?: BreakTime[];
}

export interface BreakTime {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  title?: string;
}

export interface AgentSchedule {
  id: string;
  agentId: string;
  workingHours: WorkingHours;
  timezone: string;
  isActive: boolean;
  bufferTime: number;
  maxDailyAppointments?: number;
  allowWeekendWork: boolean;
  autoAssignEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  agent?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export interface AvailabilitySlot {
  id: string;
  agentId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  duration: number;  // minutes
  status: SlotStatus;
  slotType: SlotType;
  priority: number;
  source?: string;
  externalId?: string;
  automationData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  agent?: {
    id: string;
    name: string;
    email: string;
  };
  appointments?: AppointmentExtended[];
}

export interface AppointmentExtended {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  status: string;
  agentId: string;
  contactId: string;
  propertyId?: string;
  
  // Novos campos da agenda
  googleCalendarEventId?: string;
  googleCalendarId?: string;
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncAt?: string;
  syncError?: string;
  
  n8nWorkflowId?: string;
  n8nExecutionId?: string;
  automationTrigger?: AutomationTrigger;
  automationData?: Record<string, any>;
  
  autoAssigned: boolean;
  assignmentScore?: number;
  assignmentReason?: string;
  reassignmentCount: number;
  
  conflictResolved: boolean;
  conflictStrategy?: ConflictStrategy;
  originalSlotId?: string;
  
  source: AppointmentSource;
  priority: AppointmentPriority;
  estimatedDuration: number;
  actualDuration?: number;
  
  confirmationSent: boolean;
  remindersSent?: Record<string, boolean>;
  clientFeedback?: Record<string, any>;
  reschedulingCount: number;
  
  availabilitySlotId?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  agent?: {
    id: string;
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  };
  availabilitySlot?: AvailabilitySlot;
}

export interface GoogleCalendarCredentials {
  id: string;
  userId: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  tokenExpiry: string;
  scope: string;
  defaultCalendarId?: string;
  watchChannelId?: string;
  watchExpiration?: string;
  isActive: boolean;
  lastSyncAt?: string;
  syncErrors: number;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  user?: {
    id: string;
    name: string;
    email: string;
  };
  calendars?: GoogleCalendarConfig[];
}

export interface GoogleCalendarConfig {
  id: string;
  credentialId: string;
  calendarId: string;
  calendarName: string;
  color?: string;
  isPrimary: boolean;
  isActive: boolean;
  syncDirection: SyncDirection;
  syncEvents: boolean;
  syncAvailability: boolean;
  autoCreateSlots: boolean;
  eventFilter?: Record<string, any>;
  timeRange?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  credential?: GoogleCalendarCredentials;
}

export interface CalendarSyncLog {
  id: string;
  appointmentId?: string;
  operation: SyncOperation;
  direction: SyncDirection;
  status: SyncLogStatus;
  googleEventId?: string;
  googleCalendarId?: string;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
  errorMessage?: string;
  duration?: number;
  retryCount: number;
  createdAt: string;
  
  // Relacionamentos
  appointment?: AppointmentExtended;
}

export interface AppointmentConflictLog {
  id: string;
  appointmentId: string;
  conflictType: ConflictType;
  conflictSource: ConflictSource;
  originalData: Record<string, any>;
  conflictingData: Record<string, any>;
  resolvedData?: Record<string, any>;
  strategy: ConflictStrategy;
  resolution: ConflictResolution;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  
  // Relacionamentos
  appointment?: AppointmentExtended;
}

export interface N8nWorkflowConfig {
  id: string;
  name: string;
  description?: string;
  workflowId: string; // ID no n8n
  isActive: boolean;
  triggerType: N8nTriggerType;
  webhookUrl?: string;
  companyId?: string;
  agentId?: string;
  settings?: Record<string, any>;
  mapping?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  company?: {
    id: string;
    name: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  };
  executions?: N8nExecutionLog[];
}

export interface N8nExecutionLog {
  id: string;
  workflowConfigId: string;
  executionId: string; // ID da execução no n8n
  status: N8nExecutionStatus;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorData?: Record<string, any>;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  appointmentId?: string;
  createdAt: string;
  
  // Relacionamentos
  workflowConfig?: N8nWorkflowConfig;
  appointment?: AppointmentExtended;
}

// ===== TYPES DE INPUT/UPDATE =====

export interface AgentScheduleInput {
  agentId: string;
  workingHours: WorkingHours;
  timezone?: string;
  isActive?: boolean;
  bufferTime?: number;
  maxDailyAppointments?: number;
  allowWeekendWork?: boolean;
  autoAssignEnabled?: boolean;
}

export interface AvailabilitySlotInput {
  agentId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status?: SlotStatus;
  slotType?: SlotType;
  priority?: number;
  source?: string;
  externalId?: string;
  automationData?: Record<string, any>;
}

export interface GoogleCalendarCredentialsInput {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: string;
  scope: string;
  defaultCalendarId?: string;
}

export interface N8nWorkflowConfigInput {
  name: string;
  description?: string;
  workflowId: string;
  triggerType: N8nTriggerType;
  webhookUrl?: string;
  companyId?: string;
  agentId?: string;
  settings?: Record<string, any>;
  mapping?: Record<string, any>;
}

// ===== UTILITY TYPES =====

export interface TimeSlot {
  start: string;
  end: string;
  duration: number;
  available: boolean;
  slotId?: string;
  reason?: string;
}

export interface AgentAvailability {
  agentId: string;
  agentName: string;
  date: string;
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string;
  source: 'imobipro' | 'google' | 'n8n';
  status: 'confirmed' | 'tentative' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface ConflictResolutionStrategy {
  type: ConflictStrategy;
  description: string;
  automatic: boolean;
  priority: number;
}

// ===== VALIDATION SCHEMAS =====

export const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const SLOT_STATUS_OPTIONS: { value: SlotStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'BOOKED', label: 'Agendado' },
  { value: 'BLOCKED', label: 'Bloqueado' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'TENTATIVE', label: 'Tentativo' },
];

export const SLOT_TYPE_OPTIONS: { value: SlotType; label: string }[] = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'URGENT', label: 'Urgente' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'VIEWING', label: 'Visita' },
  { value: 'MEETING', label: 'Reunião' },
  { value: 'BREAK', label: 'Intervalo' },
];

export const APPOINTMENT_PRIORITY_OPTIONS: { value: AppointmentPriority; label: string }[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export const SYNC_STATUS_OPTIONS: { value: SyncStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pendente', color: 'yellow' },
  { value: 'SYNCING', label: 'Sincronizando', color: 'blue' },
  { value: 'SYNCED', label: 'Sincronizado', color: 'green' },
  { value: 'FAILED', label: 'Falhou', color: 'red' },
  { value: 'CONFLICT', label: 'Conflito', color: 'orange' },
];