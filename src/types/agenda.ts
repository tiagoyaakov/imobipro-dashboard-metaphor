// =====================================================
// TIPOS PARA MÓDULO DE AGENDA - IMOBIPRO DASHBOARD
// =====================================================

// =====================================================
// TIPOS BASE PARA AGENDAMENTOS
// =====================================================

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  
  // Relacionamentos
  agentId: string;
  agent?: User;
  contactId: string;
  contact?: Contact;
  propertyId?: string;
  property?: Property;
  
  // Integração Google Calendar
  googleCalendarEventId?: string;
  n8nWorkflowId?: string;
  autoAssigned: boolean;
  
  // Slot de disponibilidade
  availabilitySlotId?: string;
  availabilitySlot?: AvailabilitySlot;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

export enum AppointmentType {
  PROPERTY_VIEWING = 'PROPERTY_VIEWING',
  CLIENT_MEETING = 'CLIENT_MEETING',
  NEGOTIATION = 'NEGOTIATION',
  DOCUMENT_SIGNING = 'DOCUMENT_SIGNING',
  FOLLOW_UP = 'FOLLOW_UP',
  OTHER = 'OTHER'
}

// =====================================================
// TIPOS PARA HORÁRIOS DE TRABALHO
// =====================================================

export interface AgentSchedule {
  id: string;
  agentId: string;
  agent?: User;
  
  // Configuração por dia da semana
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

export interface DaySchedule {
  start: string; // "09:00"
  end: string; // "18:00"
  available: boolean;
  breakStart?: string; // "12:00"
  breakEnd?: string; // "13:00"
}

// =====================================================
// TIPOS PARA SLOTS DE DISPONIBILIDADE
// =====================================================

export interface AvailabilitySlot {
  id: string;
  agentId: string;
  agent?: User;
  
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  isAvailable: boolean;
  isBooked: boolean;
  
  appointmentId?: string;
  appointment?: Appointment;
  
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// TIPOS PARA FULLCALENDAR
// =====================================================

export interface FullCalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  url?: string;
  className?: string | string[];
  editable?: boolean;
  startEditable?: boolean;
  durationEditable?: boolean;
  resourceEditable?: boolean;
  rendering?: string;
  overlap?: boolean;
  constraint?: any;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    appointmentId?: string;
    agentId?: string;
    contactId?: string;
    propertyId?: string;
    status?: AppointmentStatus;
    type?: AppointmentType;
    notes?: string;
    googleCalendarEventId?: string;
  };
}

export interface FullCalendarEventSource {
  id?: string;
  url?: string;
  method?: string;
  extraParams?: any;
  startParam?: string;
  endParam?: string;
  timeZoneParam?: string;
  events?: FullCalendarEvent[];
}

// =====================================================
// TIPOS PARA GOOGLE CALENDAR
// =====================================================

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: GoogleCalendarDateTime;
  end: GoogleCalendarDateTime;
  attendees?: GoogleCalendarAttendee[];
  reminders?: GoogleCalendarReminders;
  transparency?: 'opaque' | 'transparent';
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  created?: string;
  updated?: string;
  creator?: GoogleCalendarPerson;
  organizer?: GoogleCalendarPerson;
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
}

export interface GoogleCalendarDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarAttendee {
  id?: string;
  email: string;
  displayName?: string;
  organizer?: boolean;
  self?: boolean;
  resource?: boolean;
  optional?: boolean;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  comment?: string;
  additionalGuests?: number;
}

export interface GoogleCalendarReminders {
  useDefault?: boolean;
  overrides?: GoogleCalendarReminderOverride[];
}

export interface GoogleCalendarReminderOverride {
  method: 'email' | 'popup';
  minutes: number;
}

export interface GoogleCalendarPerson {
  id?: string;
  email: string;
  displayName?: string;
  self?: boolean;
}

export interface GoogleCalendarList {
  kind: string;
  etag: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
}

export interface GoogleCalendar {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone?: string;
  conferenceProperties?: {
    allowedConferenceSolutionTypes: string[];
  };
  primary?: boolean;
  selected?: boolean;
  accessRole?: string;
  defaultReminders?: GoogleCalendarReminderOverride[];
  notificationSettings?: {
    notifications: GoogleCalendarNotification[];
  };
}

export interface GoogleCalendarNotification {
  type: 'eventCreation' | 'eventChange' | 'eventCancellation' | 'eventResponse';
  method: 'email' | 'popup';
}

// =====================================================
// TIPOS PARA AUTENTICAÇÃO GOOGLE
// =====================================================

export interface GoogleAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface GoogleAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface GoogleAuthCallbackRequest {
  code: string;
  userId: string;
}

// =====================================================
// TIPOS PARA WEBHOOKS GOOGLE CALENDAR
// =====================================================

export interface GoogleCalendarWebhook {
  id: string;
  calendarId: string;
  webhookUrl: string;
  resourceId: string;
  expiration: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleCalendarWebhookNotification {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: string;
}

// =====================================================
// EXTENSÕES DO TIPO USER
// =====================================================

export interface UserWithGoogleCalendar {
  id: string;
  email: string;
  name: string;
  role: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  isActive: boolean;
  companyId: string;
  avatarUrl?: string;
  company?: {
    id: string;
    name: string;
  };
  // Campos do Google Calendar
  googleRefreshToken?: string;
  googleAccessToken?: string;
  googleTokenExpiry?: Date;
  googleCalendarId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// TIPOS PARA FORMULÁRIOS
// =====================================================

export interface CreateAppointmentForm {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: AppointmentType;
  notes?: string;
  agentId: string;
  contactId: string;
  propertyId?: string;
  syncWithGoogle?: boolean;
}

export interface UpdateAppointmentForm {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  status?: AppointmentStatus;
  type?: AppointmentType;
  notes?: string;
  syncWithGoogle?: boolean;
}

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

// =====================================================
// TIPOS PARA FILTROS E BUSCA
// =====================================================

export interface AppointmentFilters {
  agentId?: string;
  contactId?: string;
  propertyId?: string;
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface AvailabilityFilters {
  agentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  availableOnly?: boolean;
}

// =====================================================
// TIPOS PARA RESPONSES DA API
// =====================================================

export interface AppointmentResponse {
  success: boolean;
  data?: Appointment;
  error?: string;
}

export interface AppointmentsResponse {
  success: boolean;
  data?: Appointment[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export interface GoogleCalendarResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// =====================================================
// TIPOS PARA HOOKS
// =====================================================

export interface UseAppointmentsReturn {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  createAppointment: (data: CreateAppointmentForm) => Promise<void>;
  updateAppointment: (id: string, data: UpdateAppointmentForm) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  refetch: () => void;
}

export interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectGoogleCalendar: () => Promise<string>;
  handleAuthCallback: (code: string) => Promise<void>;
  syncAppointment: (appointmentId: string) => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  listCalendars: () => Promise<GoogleCalendar[]>;
  listEvents: (calendarId: string, params?: any) => Promise<GoogleCalendarEvent[]>;
  createEvent: (eventData: any, calendarId?: string) => Promise<GoogleCalendarEvent>;
  updateEvent: (eventId: string, eventData: any, calendarId?: string) => Promise<GoogleCalendarEvent>;
  deleteEvent: (eventId: string, calendarId?: string) => Promise<void>;
  fullSync: (calendarId?: string) => Promise<any>;
  setupWebhook: (webhookUrl: string, calendarId?: string) => Promise<GoogleCalendarWebhook>;
  processWebhookNotification: (notification: GoogleCalendarWebhookNotification) => Promise<boolean>;
  checkAvailability: (startTime: string, endTime: string, calendarId?: string) => Promise<boolean>;
  getCalendarStats: (timeMin: string, timeMax: string, calendarId?: string) => Promise<any>;
  clearError: () => void;
}

// =====================================================
// TIPOS PARA COMPONENTES
// =====================================================

export interface CalendarViewProps {
  events: FullCalendarEvent[];
  onEventClick?: (event: FullCalendarEvent) => void;
  onEventDrop?: (event: FullCalendarEvent, delta: any, revert: () => void) => void;
  onEventResize?: (event: FullCalendarEvent, delta: any, revert: () => void) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  height?: string | number;
  editable?: boolean;
  selectable?: boolean;
  selectMirror?: boolean;
  dayMaxEvents?: boolean | number;
  weekends?: boolean;
  initialView?: string;
}

export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment;
  mode: 'create' | 'edit' | 'view';
  onSubmit?: (data: CreateAppointmentForm | UpdateAppointmentForm) => Promise<void>;
}

export interface AgentScheduleFormProps {
  agentId: string;
  schedule?: AgentSchedule;
  onSubmit: (data: AgentScheduleForm) => Promise<void>;
  onCancel: () => void;
}

// =====================================================
// TIPOS PARA UTILITÁRIOS
// =====================================================

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface DayAvailability {
  date: Date;
  slots: TimeSlot[];
}

export interface WeekAvailability {
  weekStart: Date;
  days: DayAvailability[];
}

export interface AppointmentConflict {
  appointmentId: string;
  conflictType: 'overlap' | 'double_booking' | 'unavailable_time';
  conflictingAppointment?: Appointment;
  message: string;
}

// =====================================================
// TIPOS PARA NOTIFICAÇÕES
// =====================================================

export interface AppointmentNotification {
  id: string;
  appointmentId: string;
  type: 'reminder' | 'confirmation' | 'cancellation' | 'reschedule';
  recipientId: string;
  recipientType: 'agent' | 'contact';
  message: string;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

// =====================================================
// TIPOS PARA RELATÓRIOS
// =====================================================

export interface AppointmentStats {
  total: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  conversionRate: number;
  averageDuration: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalAppointments: number;
  completedAppointments: number;
  conversionRate: number;
  averageRating: number;
  totalRevenue: number;
}

// =====================================================
// TIPOS PARA AUTOMAÇÃO N8N
// =====================================================

export interface N8nWorkflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: 'webhook' | 'schedule' | 'manual';
  triggerConfig: any;
  nodes: N8nNode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  parameters: any;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'cancelled';
  startedAt: Date;
  finishedAt?: Date;
  data: any;
  error?: string;
}

// =====================================================
// TIPOS PARA INTEGRAÇÃO COM OUTROS MÓDULOS
// =====================================================

// Tipos básicos para relacionamentos
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  googleRefreshToken?: string;
  googleAccessToken?: string;
  googleTokenExpiry?: Date;
  googleCalendarId?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  leadStage?: string;
  leadScore?: number;
}

export interface Property {
  id: string;
  title: string;
  address?: string;
  price?: number;
  type?: string;
  vivaRealId?: string;
} 