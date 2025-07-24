// =====================================================
// TIPOS DO MÓDULO DE AGENDA - IMOBIPRO DASHBOARD
// =====================================================

// Enums
export enum AppointmentType {
  VISIT = 'VISIT',
  MEETING = 'MEETING', 
  CALL = 'CALL',
  OTHER = 'OTHER'
}

export enum AppointmentStatus {
  CONFIRMED = 'CONFIRMED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

// Configuração de horário por dia da semana
export interface DaySchedule {
  start: string;      // "09:00"
  end: string;        // "18:00"
  available: boolean; // true/false
  breakStart?: string; // "12:00" (opcional)
  breakEnd?: string;   // "13:00" (opcional)
}

// Horários de trabalho dos corretores
export interface AgentSchedule {
  id: string;
  agentId: string;
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
  createdAt: Date;
  updatedAt: Date;
}

// Slots de disponibilidade
export interface AvailabilitySlot {
  id: string;
  agentId: string;
  date: Date;
  startTime: string;    // "09:00"
  endTime: string;      // "18:00"
  isAvailable: boolean;
  isBooked: boolean;
  appointmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook do Google Calendar
export interface GoogleCalendarWebhook {
  id: string;
  calendarId: string;
  webhookUrl: string;
  resourceId: string;
  expiration: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Modelo base Appointment
export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  date: Date; // Manter para compatibilidade
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  
  // Relacionamentos
  agentId: string;
  contactId: string;
  propertyId?: string;
  
  // Integração Google Calendar
  googleCalendarEventId?: string;
  n8nWorkflowId?: string;
  autoAssigned: boolean;
  
  // Relacionamento com slot
  availabilitySlotId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Extensões do modelo Appointment
export interface AppointmentWithSlot {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  
  // Relacionamentos
  agentId: string;
  contactId: string;
  propertyId?: string;
  
  // Integração Google Calendar
  googleCalendarEventId?: string;
  n8nWorkflowId?: string;
  autoAssigned: boolean;
  
  // Relacionamento com slot
  availabilitySlotId?: string;
  availabilitySlot?: AvailabilitySlot;
  
  createdAt: Date;
  updatedAt: Date;
}

// Formulário para criar/editar horários
export interface AgentScheduleForm {
  agentId: string;
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

// Formulário para criar/editar slots
export interface AvailabilitySlotForm {
  agentId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

// Filtros para agenda
export interface AgendaFilters {
  agentId?: string;
  date?: Date;
  status?: string;
  type?: string;
  propertyId?: string;
}

// Configuração de geração de slots
export interface SlotGenerationConfig {
  agentId: string;
  startDate: Date;
  endDate: Date;
  slotDuration: number; // em minutos
  breakDuration?: number; // em minutos
}

// Resultado da geração de slots
export interface SlotGenerationResult {
  generated: number;
  conflicts: number;
  errors: string[];
}

// Atribuição automática de corretores
export interface AutoAssignmentConfig {
  appointmentId: string;
  preferredAgentId?: string;
  excludeAgentIds?: string[];
  priority?: 'load' | 'specialization' | 'availability';
}

// Métricas de ocupação
export interface OccupancyMetrics {
  agentId: string;
  agentName: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  occupancyRate: number; // 0-100%
  period: {
    start: Date;
    end: Date;
  };
}

// Relatório de agenda
export interface AgendaReport {
  period: {
    start: Date;
    end: Date;
  };
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  agentMetrics: OccupancyMetrics[];
  topProperties: Array<{
    propertyId: string;
    propertyTitle: string;
    appointmentCount: number;
  }>;
}

// Evento do Google Calendar
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

// Status de sincronização
export interface SyncStatus {
  lastSync: Date;
  status: 'success' | 'error' | 'pending';
  error?: string;
  eventsSynced: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
}

// Configurações de notificação
export interface NotificationConfig {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
  reminderMinutes: number[]; // [24*60, 60, 30] = 1 dia, 1 hora, 30 min
}

// Template de notificação
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation';
  subject: string;
  body: string;
  variables: string[]; // ['{agent_name}', '{client_name}', '{property_title}']
}

// Evento do FullCalendar
export interface FullCalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  extendedProps: {
    type: AppointmentType;
    status: AppointmentStatus;
    contactId: string;
    propertyId?: string;
    agentId: string;
    notes?: string;
  };
} 