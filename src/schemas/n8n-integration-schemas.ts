/**
 * 🔲 Schemas Zod para Integração n8n - ImobiPRO Agenda
 * 
 * Validação TypeScript completa para todos os endpoints da API n8n
 * Baseado na especificação OpenAPI 3.0 do módulo de agenda
 */

import { z } from 'zod';

// ==============================================
// ENUMS E TIPOS BASE
// ==============================================

export const AppointmentTypeSchema = z.enum(['VISIT', 'MEETING', 'CALL', 'OTHER']);
export const AppointmentStatusSchema = z.enum(['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELED']);
export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const SourceSchema = z.enum(['whatsapp', 'web_form', 'crm', 'manual', 'calendar_sync', 'api']);
export const ConflictResolutionSchema = z.enum(['reschedule_existing', 'reject_new', 'manual_review']);

// ==============================================
// SCHEMAS DE CONTATO
// ==============================================

export const ContactReferenceSchema = z.object({
  id: z.string().min(1)
});

export const NewContactDataSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^[\+]?[1-9]\d{1,14}$/).optional(),
  email: z.string().email().optional(),
  document: z.string().optional(),
  notes: z.string().max(500).optional()
});

export const ContactSchema = z.union([ContactReferenceSchema, NewContactDataSchema]);

// ==============================================
// SCHEMAS DE PROPRIEDADE E AGENTE
// ==============================================

export const PropertyReferenceSchema = z.object({
  id: z.string().optional(),
  externalId: z.string().optional()
}).refine(data => data.id || data.externalId, {
  message: "Pelo menos um dos campos 'id' ou 'externalId' deve ser fornecido"
});

export const AgentAssignmentCriteriaSchema = z.object({
  propertyType: z.string().optional(),
  location: z.string().optional(),
  priority: PrioritySchema.optional(),
  workload: z.enum(['low', 'balanced', 'any']).optional()
});

export const AgentReferenceSchema = z.object({
  id: z.string().optional(),
  autoAssign: z.boolean().default(false),
  assignmentCriteria: AgentAssignmentCriteriaSchema.optional()
});

// ==============================================
// SCHEMAS DE DADOS DE AGENDAMENTO
// ==============================================

export const AppointmentDataSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: AppointmentTypeSchema,
  preferredDateTime: z.string().datetime(),
  alternativeDateTime: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).default(60),
  priority: PrioritySchema.optional(),
  autoConfirm: z.boolean().default(false),
  conflictResolution: ConflictResolutionSchema.optional(),
  contact: ContactSchema,
  property: PropertyReferenceSchema.optional(),
  agent: AgentReferenceSchema.optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional()
});

// ==============================================
// SCHEMAS DE WEBHOOK REQUESTS
// ==============================================

export const AppointmentWebhookRequestSchema = z.object({
  source: SourceSchema,
  sourceId: z.string().optional(),
  appointmentData: AppointmentDataSchema,
  webhookId: z.string().optional(),
  retryCount: z.number().min(0).max(5).default(0),
  metadata: z.record(z.unknown()).optional()
});

export const AvailabilityRequestSchema = z.object({
  agentIds: z.array(z.string()).min(1),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  duration: z.number().min(15).max(480).default(60),
  slotInterval: z.number().min(15).max(60).default(30),
  appointmentType: AppointmentTypeSchema.optional(),
  location: z.string().optional()
});

export const RescheduleRequestSchema = z.object({
  newDateTime: z.string().datetime(),
  alternativeDateTime: z.string().datetime().optional(),
  reason: z.string().min(1).max(500),
  notifyParties: z.boolean().default(true),
  source: SourceSchema.optional(),
  requestedBy: z.enum(['client', 'agent', 'system']).optional()
});

export const CancelRequestSchema = z.object({
  reason: z.string().min(1).max(500),
  canceledBy: z.enum(['client', 'agent', 'system']).optional(),
  notifyParties: z.boolean().default(true),
  rescheduleOffered: z.boolean().default(false),
  compensationOffered: z.boolean().default(false)
});

export const AgentAssignmentRequestSchema = z.object({
  appointmentData: AppointmentDataSchema,
  assignmentCriteria: AgentAssignmentCriteriaSchema.optional(),
  excludeAgents: z.array(z.string()).optional(),
  requireConfirmation: z.boolean().default(true)
});

// ==============================================
// SCHEMAS DE DISPONIBILIDADE
// ==============================================

export const TimeSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  available: z.boolean(),
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1).optional()
});

export const AvailabilitySlotSchema = z.object({
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dayOfWeek: z.number().min(1).max(7).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  slotDuration: z.number().min(15).max(120).default(60),
  bufferTime: z.number().min(0).max(60).default(15)
});

export const DayScheduleSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  breakTimes: z.array(z.object({
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })).optional()
});

export const WorkingHoursSchema = z.object({
  monday: DayScheduleSchema,
  tuesday: DayScheduleSchema,
  wednesday: DayScheduleSchema,
  thursday: DayScheduleSchema,
  friday: DayScheduleSchema,
  saturday: DayScheduleSchema,
  sunday: DayScheduleSchema
});

export const BlockedPeriodSchema = z.object({
  id: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string(),
  recurring: z.boolean(),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly']).optional()
});

export const AvailabilityExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  available: z.boolean(),
  customHours: DayScheduleSchema.optional(),
  reason: z.string().optional()
});

export const SetAvailabilityRequestSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  availableSlots: z.array(AvailabilitySlotSchema),
  workingHours: WorkingHoursSchema.optional(),
  blockedPeriods: z.array(BlockedPeriodSchema).optional(),
  exceptions: z.array(AvailabilityExceptionSchema).optional()
});

// ==============================================
// SCHEMAS DE RESPONSE
// ==============================================

export const AgentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  rating: z.number().optional(),
  availability: z.enum(['available', 'busy', 'unavailable']).optional()
});

export const ContactSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  category: z.enum(['CLIENT', 'LEAD', 'PARTNER']).optional()
});

export const PropertySummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  address: z.string().optional(),
  type: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OTHER']).optional(),
  price: z.number().optional(),
  status: z.enum(['AVAILABLE', 'SOLD', 'RESERVED']).optional()
});

export const SyncStatusSchema = z.object({
  enabled: z.boolean(),
  lastSync: z.string().datetime().optional(),
  nextSync: z.string().datetime().optional(),
  status: z.enum(['synced', 'pending', 'error', 'disabled']),
  errorMessage: z.string().optional()
});

export const CalendarSyncStatusSchema = z.object({
  googleCalendar: SyncStatusSchema.optional(),
  outlookCalendar: SyncStatusSchema.optional(),
  appleCalendar: SyncStatusSchema.optional()
});

export const NotificationDeliveryStatusSchema = z.object({
  sent: z.boolean(),
  deliveredAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
  error: z.string().optional(),
  retryCount: z.number().optional()
});

export const NotificationStatusSchema = z.object({
  whatsapp: NotificationDeliveryStatusSchema.optional(),
  email: NotificationDeliveryStatusSchema.optional(),
  sms: NotificationDeliveryStatusSchema.optional(),
  push: NotificationDeliveryStatusSchema.optional()
});

export const AppointmentResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string().datetime(),
  duration: z.number(),
  type: AppointmentTypeSchema,
  status: AppointmentStatusSchema,
  priority: PrioritySchema.optional(),
  agent: AgentSummarySchema.optional(),
  contact: ContactSummarySchema.optional(),
  property: PropertySummarySchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  calendarSyncStatus: CalendarSyncStatusSchema.optional(),
  notifications: NotificationStatusSchema.optional()
});

export const AlternativeSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  agentId: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional()
});

export const AppointmentSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().datetime(),
  duration: z.number(),
  type: AppointmentTypeSchema,
  status: AppointmentStatusSchema,
  agentName: z.string().optional(),
  contactName: z.string().optional(),
  propertyTitle: z.string().optional()
});

export const ConflictResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  conflictDetails: z.object({
    conflictingAppointments: z.array(AppointmentSummarySchema),
    suggestedAlternatives: z.array(AlternativeSlotSchema),
    resolutionOptions: z.array(ConflictResolutionSchema),
    impactAnalysis: z.object({
      affectedParties: z.array(z.string()),
      businessImpact: z.enum(['low', 'medium', 'high']),
      urgencyLevel: z.enum(['low', 'medium', 'high']),
      estimatedResolutionTime: z.string()
    }).optional()
  }),
  retryAfter: z.number().optional()
});

export const AgentAvailabilitySlotSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  availableSlots: z.array(TimeSlotSchema),
  workload: z.object({
    current: z.number(),
    capacity: z.number(),
    utilizationRate: z.number().min(0).max(1)
  }).optional()
});

export const AvailabilityResponseSchema = z.object({
  agentAvailability: z.array(AgentAvailabilitySlotSchema),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }),
  requestedDuration: z.number(),
  totalSlotsFound: z.number(),
  generatedAt: z.string().datetime()
});

export const AgentAssignmentResponseSchema = z.object({
  assignedAgent: AgentSummarySchema,
  assignmentScore: z.number().min(0).max(1),
  assignmentReason: z.string(),
  alternativeAgents: z.array(z.object({
    agent: AgentSummarySchema,
    score: z.number().min(0).max(1),
    reason: z.string()
  })).optional(),
  requiresConfirmation: z.boolean(),
  estimatedResponse: z.string().optional()
});

// ==============================================
// SCHEMAS DE TRIGGER PAYLOADS
// ==============================================

export const TriggerMetadataSchema = z.object({
  triggeredBy: z.string(),
  source: SourceSchema,
  workflowId: z.string().optional(),
  retryCount: z.number().default(0),
  correlationId: z.string().optional(),
  environment: z.enum(['production', 'staging', 'development']).optional()
});

export const AppointmentTriggerPayloadSchema = z.object({
  event: z.literal('appointment.created'),
  timestamp: z.string().datetime(),
  data: AppointmentResponseSchema,
  metadata: TriggerMetadataSchema.optional()
});

export const AppointmentUpdateTriggerPayloadSchema = z.object({
  event: z.enum(['appointment.updated', 'appointment.rescheduled', 'appointment.status_changed']),
  timestamp: z.string().datetime(),
  data: AppointmentResponseSchema,
  changes: z.object({
    previous: z.record(z.unknown()),
    current: z.record(z.unknown())
  }),
  metadata: TriggerMetadataSchema.optional()
});

export const AppointmentCancelTriggerPayloadSchema = z.object({
  event: z.literal('appointment.cancelled'),
  timestamp: z.string().datetime(),
  data: AppointmentResponseSchema,
  cancellation: z.object({
    reason: z.string(),
    canceledBy: z.string(),
    cancellationTime: z.string().datetime(),
    refundEligible: z.boolean().optional()
  }),
  metadata: TriggerMetadataSchema.optional()
});

export const AvailabilityChangeTriggerPayloadSchema = z.object({
  event: z.enum(['availability.changed', 'availability.blocked', 'availability.opened']),
  timestamp: z.string().datetime(),
  data: z.object({
    agentId: z.string(),
    affectedSlots: z.array(TimeSlotSchema),
    changeType: z.enum(['manual', 'automatic', 'sync']),
    impactedAppointments: z.array(z.string())
  }),
  metadata: TriggerMetadataSchema.optional()
});

export const ConflictTriggerPayloadSchema = z.object({
  event: z.enum(['conflict.detected', 'conflict.resolved']),
  timestamp: z.string().datetime(),
  data: z.object({
    conflictId: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    conflictingAppointments: z.array(z.string()),
    resolutionRequired: z.boolean(),
    autoResolutionAttempted: z.boolean(),
    suggestedActions: z.array(z.string())
  }),
  metadata: TriggerMetadataSchema.optional()
});

export const CalendarSyncTriggerPayloadSchema = z.object({
  event: z.enum(['calendar.sync.started', 'calendar.sync.completed', 'calendar.sync.failed']),
  timestamp: z.string().datetime(),
  data: z.object({
    syncId: z.string(),
    calendarProvider: z.enum(['google', 'outlook', 'apple']),
    agentId: z.string(),
    eventsProcessed: z.number(),
    eventsCreated: z.number(),
    eventsUpdated: z.number(),
    eventsDeleted: z.number(),
    errors: z.array(z.object({
      eventId: z.string(),
      error: z.string(),
      severity: z.string()
    })).optional()
  }),
  metadata: TriggerMetadataSchema.optional()
});

// ==============================================
// SCHEMAS DE MONITORAMENTO
// ==============================================

export const DependencyStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  responseTime: z.number(),
  lastCheck: z.string().datetime(),
  error: z.string().optional()
});

export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number(),
  dependencies: z.object({
    database: DependencyStatusSchema,
    googleCalendar: DependencyStatusSchema,
    redis: DependencyStatusSchema,
    messageQueue: DependencyStatusSchema
  }),
  metrics: z.object({
    requestsPerMinute: z.number(),
    averageResponseTime: z.number(),
    errorRate: z.number(),
    activeConnections: z.number()
  })
});

export const MetricsResponseSchema = z.object({
  timestamp: z.string().datetime(),
  period: z.string(),
  appointments: z.object({
    total: z.number(),
    created: z.number(),
    completed: z.number(),
    canceled: z.number(),
    rescheduled: z.number()
  }),
  api: z.object({
    totalRequests: z.number(),
    successRate: z.number().min(0).max(1),
    averageResponseTime: z.number(),
    errorsByType: z.record(z.number())
  }),
  webhooks: z.object({
    delivered: z.number(),
    failed: z.number(),
    retries: z.number(),
    averageDeliveryTime: z.number()
  }),
  calendar: z.object({
    syncEvents: z.number(),
    syncErrors: z.number(),
    lastSuccessfulSync: z.string().datetime().optional()
  })
});

// ==============================================
// SCHEMAS DE ERRO
// ==============================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string(),
  timestamp: z.string().datetime(),
  path: z.string().optional(),
  requestId: z.string().optional(),
  details: z.record(z.unknown()).optional()
});

export const ValidationErrorSchema = ErrorResponseSchema.extend({
  validationErrors: z.array(z.object({
    field: z.string(),
    code: z.string(),
    message: z.string(),
    value: z.string()
  }))
});

// ==============================================
// TIPOS TYPESCRIPT INFERIDOS
// ==============================================

export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type Source = z.infer<typeof SourceSchema>;
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

export type ContactReference = z.infer<typeof ContactReferenceSchema>;
export type NewContactData = z.infer<typeof NewContactDataSchema>;
export type Contact = z.infer<typeof ContactSchema>;

export type PropertyReference = z.infer<typeof PropertyReferenceSchema>;
export type AgentAssignmentCriteria = z.infer<typeof AgentAssignmentCriteriaSchema>;
export type AgentReference = z.infer<typeof AgentReferenceSchema>;

export type AppointmentData = z.infer<typeof AppointmentDataSchema>;
export type AppointmentWebhookRequest = z.infer<typeof AppointmentWebhookRequestSchema>;
export type AvailabilityRequest = z.infer<typeof AvailabilityRequestSchema>;
export type RescheduleRequest = z.infer<typeof RescheduleRequestSchema>;
export type CancelRequest = z.infer<typeof CancelRequestSchema>;
export type AgentAssignmentRequest = z.infer<typeof AgentAssignmentRequestSchema>;

export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
export type DaySchedule = z.infer<typeof DayScheduleSchema>;
export type WorkingHours = z.infer<typeof WorkingHoursSchema>;
export type BlockedPeriod = z.infer<typeof BlockedPeriodSchema>;
export type AvailabilityException = z.infer<typeof AvailabilityExceptionSchema>;
export type SetAvailabilityRequest = z.infer<typeof SetAvailabilityRequestSchema>;

export type AgentSummary = z.infer<typeof AgentSummarySchema>;
export type ContactSummary = z.infer<typeof ContactSummarySchema>;
export type PropertySummary = z.infer<typeof PropertySummarySchema>;
export type SyncStatus = z.infer<typeof SyncStatusSchema>;
export type CalendarSyncStatus = z.infer<typeof CalendarSyncStatusSchema>;
export type NotificationDeliveryStatus = z.infer<typeof NotificationDeliveryStatusSchema>;
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
export type AlternativeSlot = z.infer<typeof AlternativeSlotSchema>;
export type AppointmentSummary = z.infer<typeof AppointmentSummarySchema>;
export type ConflictResponse = z.infer<typeof ConflictResponseSchema>;
export type AgentAvailabilitySlot = z.infer<typeof AgentAvailabilitySlotSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
export type AgentAssignmentResponse = z.infer<typeof AgentAssignmentResponseSchema>;

export type TriggerMetadata = z.infer<typeof TriggerMetadataSchema>;
export type AppointmentTriggerPayload = z.infer<typeof AppointmentTriggerPayloadSchema>;
export type AppointmentUpdateTriggerPayload = z.infer<typeof AppointmentUpdateTriggerPayloadSchema>;
export type AppointmentCancelTriggerPayload = z.infer<typeof AppointmentCancelTriggerPayloadSchema>;
export type AvailabilityChangeTriggerPayload = z.infer<typeof AvailabilityChangeTriggerPayloadSchema>;
export type ConflictTriggerPayload = z.infer<typeof ConflictTriggerPayloadSchema>;
export type CalendarSyncTriggerPayload = z.infer<typeof CalendarSyncTriggerPayloadSchema>;

export type DependencyStatus = z.infer<typeof DependencyStatusSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Valida payload de webhook de agendamento
 */
export function validateAppointmentWebhook(data: unknown): AppointmentWebhookRequest {
  return AppointmentWebhookRequestSchema.parse(data);
}

/**
 * Valida resposta de agendamento
 */
export function validateAppointmentResponse(data: unknown): AppointmentResponse {
  return AppointmentResponseSchema.parse(data);
}

/**
 * Valida dados de disponibilidade
 */
export function validateAvailabilityRequest(data: unknown): AvailabilityRequest {
  return AvailabilityRequestSchema.parse(data);
}

/**
 * Valida payload de trigger
 */
export function validateTriggerPayload(data: unknown, eventType: string) {
  switch (eventType) {
    case 'appointment.created':
      return AppointmentTriggerPayloadSchema.parse(data);
    case 'appointment.updated':
    case 'appointment.rescheduled':
    case 'appointment.status_changed':
      return AppointmentUpdateTriggerPayloadSchema.parse(data);
    case 'appointment.cancelled':
      return AppointmentCancelTriggerPayloadSchema.parse(data);
    case 'availability.changed':
    case 'availability.blocked':
    case 'availability.opened':
      return AvailabilityChangeTriggerPayloadSchema.parse(data);
    case 'conflict.detected':
    case 'conflict.resolved':
      return ConflictTriggerPayloadSchema.parse(data);
    case 'calendar.sync.started':
    case 'calendar.sync.completed':
    case 'calendar.sync.failed':
      return CalendarSyncTriggerPayloadSchema.parse(data);
    default:
      throw new Error(`Tipo de evento não suportado: ${eventType}`);
  }
}

/**
 * Helpers para validação de conflitos
 */
export function isScheduleConflict(data: unknown): data is ConflictResponse {
  try {
    ConflictResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper para validar horários de trabalho
 */
export function validateWorkingHours(data: unknown): WorkingHours {
  return WorkingHoursSchema.parse(data);
}

/**
 * Helper para validar agente
 */
export function validateAgentSummary(data: unknown): AgentSummary {
  return AgentSummarySchema.parse(data);
}

/**
 * Helper para criar request de reagendamento
 */
export function createRescheduleRequest(
  newDateTime: string,
  reason: string,
  options?: Partial<RescheduleRequest>
): RescheduleRequest {
  return RescheduleRequestSchema.parse({
    newDateTime,
    reason,
    ...options
  });
}

/**
 * Helper para criar request de cancelamento
 */
export function createCancelRequest(
  reason: string,
  options?: Partial<CancelRequest>
): CancelRequest {
  return CancelRequestSchema.parse({
    reason,
    ...options
  });
}

/**
 * Type guards para diferentes tipos de contato
 */
export function isContactReference(contact: Contact): contact is ContactReference {
  return 'id' in contact && typeof contact.id === 'string';
}

export function isNewContactData(contact: Contact): contact is NewContactData {
  return 'name' in contact && typeof contact.name === 'string';
}

/**
 * Função para sanitizar dados de webhook antes da validação
 */
export function sanitizeWebhookData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data as Record<string, unknown> };

  // Remove campos vazios
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '' || sanitized[key] === null) {
      delete sanitized[key];
    }
  });

  // Converte strings vazias em undefined para campos opcionais
  if ('metadata' in sanitized && typeof sanitized.metadata === 'object') {
    sanitized.metadata = sanitized.metadata || {};
  }

  return sanitized;
}

// ==============================================
// CONSTANTS
// ==============================================

export const DEFAULT_APPOINTMENT_DURATION = 60; // minutos
export const DEFAULT_SLOT_INTERVAL = 30; // minutos
export const DEFAULT_BUFFER_TIME = 15; // minutos
export const MAX_RETRY_COUNT = 3;
export const DEFAULT_PRIORITY: Priority = 'medium';
export const DEFAULT_SOURCE: Source = 'api';