/**
 * 🔲 Schemas Zod para Integração n8n - Módulo de Leads
 * 
 * Validação TypeScript completa para integração de leads via n8n
 * Baseado no schema Prisma e necessidades de automação
 */

import { z } from 'zod';

// ==============================================
// ENUMS E TIPOS BASE PARA LEADS
// ==============================================

export const LeadStageSchema = z.enum([
  'NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 
  'NEGOTIATING', 'CONVERTED', 'LOST'
]);

export const LeadPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const ContactCategorySchema = z.enum(['CLIENT', 'LEAD', 'PARTNER']);
export const LeadSourceSchema = z.enum([
  'WhatsApp', 'Site', 'Indicação', 'Facebook', 'Instagram', 
  'Google Ads', 'Cold Call', 'Email Marketing', 'Evento', 
  'Parceiro', 'N8N_AUTOMATION', 'Outros'
]);

export const PropertyTypeSchema = z.enum([
  'APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OTHER'
]);

// ==============================================
// SCHEMAS DE ENTRADA PARA N8N
// ==============================================

export const N8nLeadWebhookSchema = z.object({
  // Dados básicos obrigatórios
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  
  // Origem e fonte
  leadSource: LeadSourceSchema,
  leadSourceDetails: z.string().optional(),
  
  // Dados adicionais do lead
  company: z.string().optional(),
  position: z.string().optional(),
  budget: z.number().positive().optional(),
  timeline: z.string().optional(),
  
  // Preferências estruturadas
  preferences: z.object({
    propertyType: PropertyTypeSchema.optional(),
    location: z.string().optional(),
    bedrooms: z.number().min(0).optional(),
    minArea: z.number().min(0).optional(),
    maxArea: z.number().min(0).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional()
  }).optional(),
  
  // Segmentação
  tags: z.array(z.string()).optional(),
  priority: LeadPrioritySchema.default('MEDIUM'),
  
  // Consentimentos
  optInWhatsApp: z.boolean().default(false),
  optInEmail: z.boolean().default(false),
  optInSMS: z.boolean().default(false),
  
  // Atribuição automática
  agentId: z.string().optional(), // Se não fornecido, será feita atribuição automática
  autoAssign: z.boolean().default(true),
  
  // Metadados do n8n
  n8nWorkflowId: z.string().optional(),
  n8nExecutionId: z.string().optional(),
  webhookSource: z.string().default('n8n'),
  correlationId: z.string().optional(),
  
  // Dados customizados
  customFields: z.record(z.unknown()).optional()
});

// ==============================================
// SCHEMAS DE RESPOSTA
// ==============================================

export const LeadResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  leadStage: LeadStageSchema,
  leadScore: z.number().min(0).max(100),
  leadSource: z.string(),
  leadSourceDetails: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  budget: z.number().optional(),
  timeline: z.string().optional(),
  preferences: z.record(z.unknown()).optional(),
  tags: z.array(z.string()),
  priority: LeadPrioritySchema,
  isQualified: z.boolean(),
  agentId: z.string(),
  agent: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string()
  }).optional(),
  autoAssigned: z.boolean().optional(),
  assignmentScore: z.number().optional(),
  assignmentReason: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const LeadAssignmentResponseSchema = z.object({
  assignedAgent: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    specializations: z.array(z.string()).optional(),
    workload: z.object({
      current: z.number(),
      capacity: z.number(),
      utilizationRate: z.number()
    }).optional()
  }),
  assignmentScore: z.number().min(0).max(1),
  assignmentReason: z.string(),
  alternativeAgents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    score: z.number(),
    reason: z.string()
  })).optional()
});

// ==============================================
// SCHEMAS DE TRIGGER PAYLOADS PARA N8N
// ==============================================

export const LeadTriggerMetadataSchema = z.object({
  triggeredBy: z.string(),
  source: z.string(),
  workflowId: z.string().optional(),
  executionId: z.string().optional(),
  correlationId: z.string().optional(),
  timestamp: z.string().datetime(),
  environment: z.enum(['production', 'staging', 'development']).optional()
});

export const LeadCreatedTriggerSchema = z.object({
  event: z.literal('lead.created'),
  timestamp: z.string().datetime(),
  data: LeadResponseSchema,
  metadata: LeadTriggerMetadataSchema.optional()
});

export const LeadUpdatedTriggerSchema = z.object({
  event: z.enum(['lead.updated', 'lead.stage_changed', 'lead.assigned']),
  timestamp: z.string().datetime(),
  data: LeadResponseSchema,
  changes: z.object({
    previous: z.record(z.unknown()),
    current: z.record(z.unknown())
  }),
  metadata: LeadTriggerMetadataSchema.optional()
});

export const LeadQualifiedTriggerSchema = z.object({
  event: z.literal('lead.qualified'),
  timestamp: z.string().datetime(),
  data: LeadResponseSchema,
  qualification: z.object({
    score: z.number(),
    qualifiedBy: z.string(),
    qualificationNotes: z.string().optional(),
    meetsCriteria: z.array(z.string()),
    nextActions: z.array(z.string())
  }),
  metadata: LeadTriggerMetadataSchema.optional()
});

export const LeadConvertedTriggerSchema = z.object({
  event: z.literal('lead.converted'),
  timestamp: z.string().datetime(),
  data: LeadResponseSchema,
  conversion: z.object({
    dealValue: z.number().optional(),
    convertedBy: z.string(),
    conversionPath: z.array(z.string()),
    timeToConversion: z.number(), // dias
    touchpoints: z.number()
  }),
  metadata: LeadTriggerMetadataSchema.optional()
});

// ==============================================
// SCHEMAS DE ATIVIDADES DE LEAD
// ==============================================

export const LeadActivityTypeSchema = z.enum([
  'CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'VISIT', 'SMS',
  'FOLLOW_UP', 'NOTE', 'PROPOSAL_SENT', 'CONTRACT_SENT',
  'DOCUMENT_RECEIVED', 'PAYMENT_RECEIVED'
]);

export const N8nLeadActivitySchema = z.object({
  contactId: z.string(),
  type: LeadActivityTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  channel: z.string().optional(),
  duration: z.number().min(0).optional(), // minutos
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  performedById: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  
  // Metadados do n8n
  n8nWorkflowId: z.string().optional(),
  n8nExecutionId: z.string().optional(),
  automationTrigger: z.string().optional(),
  
  // Dados estruturados
  metadata: z.record(z.unknown()).optional()
});

// ==============================================
// SCHEMAS DE CAMPANHA
// ==============================================

export const N8nCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  channel: z.enum(['WHATSAPP', 'EMAIL', 'SMS']),
  template: z.string().min(1),
  variables: z.record(z.unknown()).optional(),
  
  // Critérios de segmentação
  targetCriteria: z.object({
    leadStages: z.array(LeadStageSchema).optional(),
    leadSources: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    scoreRange: z.object({
      min: z.number().min(0).max(100),
      max: z.number().min(0).max(100)
    }).optional(),
    locations: z.array(z.string()).optional(),
    budgetRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional()
  }).optional(),
  
  // Configurações
  scheduledAt: z.string().datetime().optional(),
  sendDelay: z.number().min(0).optional(), // segundos
  maxRecipients: z.number().min(1).optional(),
  
  // Metadados do n8n
  n8nWorkflowId: z.string().optional(),
  createdById: z.string()
});

// ==============================================
// SCHEMAS DE WEBHOOK DE ENTRADA
// ==============================================

export const N8nWebhookRequestSchema = z.object({
  action: z.enum(['create_lead', 'update_lead', 'assign_lead', 'create_activity', 'create_campaign']),
  data: z.union([
    N8nLeadWebhookSchema,
    N8nLeadActivitySchema,
    N8nCampaignSchema
  ]),
  options: z.object({
    validateOnly: z.boolean().default(false),
    skipDuplicateCheck: z.boolean().default(false),
    sendNotifications: z.boolean().default(true),
    triggerWorkflows: z.boolean().default(true)
  }).optional(),
  metadata: LeadTriggerMetadataSchema.optional()
});

// ==============================================
// SCHEMAS DE BULK OPERATIONS
// ==============================================

export const N8nBulkLeadsSchema = z.object({
  leads: z.array(N8nLeadWebhookSchema).min(1).max(100),
  options: z.object({
    continueOnError: z.boolean().default(true),
    assignmentStrategy: z.enum(['round_robin', 'least_busy', 'specialized', 'random']).default('least_busy'),
    batchSize: z.number().min(1).max(50).default(10),
    delayBetweenBatches: z.number().min(0).default(1000) // milliseconds
  }).optional(),
  metadata: LeadTriggerMetadataSchema.optional()
});

export const N8nBulkResponseSchema = z.object({
  totalProcessed: z.number(),
  successful: z.number(),
  failed: z.number(),
  results: z.array(z.object({
    index: z.number(),
    success: z.boolean(),
    data: LeadResponseSchema.optional(),
    error: z.string().optional()
  })),
  processingTime: z.number(), // milliseconds
  metadata: LeadTriggerMetadataSchema.optional()
});

// ==============================================
// TIPOS TYPESCRIPT INFERIDOS
// ==============================================

export type LeadStage = z.infer<typeof LeadStageSchema>;
export type LeadPriority = z.infer<typeof LeadPrioritySchema>;
export type LeadSource = z.infer<typeof LeadSourceSchema>;
export type PropertyType = z.infer<typeof PropertyTypeSchema>;
export type LeadActivityType = z.infer<typeof LeadActivityTypeSchema>;

export type N8nLeadWebhook = z.infer<typeof N8nLeadWebhookSchema>;
export type LeadResponse = z.infer<typeof LeadResponseSchema>;
export type LeadAssignmentResponse = z.infer<typeof LeadAssignmentResponseSchema>;

export type LeadTriggerMetadata = z.infer<typeof LeadTriggerMetadataSchema>;
export type LeadCreatedTrigger = z.infer<typeof LeadCreatedTriggerSchema>;
export type LeadUpdatedTrigger = z.infer<typeof LeadUpdatedTriggerSchema>;
export type LeadQualifiedTrigger = z.infer<typeof LeadQualifiedTriggerSchema>;
export type LeadConvertedTrigger = z.infer<typeof LeadConvertedTriggerSchema>;

export type N8nLeadActivity = z.infer<typeof N8nLeadActivitySchema>;
export type N8nCampaign = z.infer<typeof N8nCampaignSchema>;
export type N8nWebhookRequest = z.infer<typeof N8nWebhookRequestSchema>;
export type N8nBulkLeads = z.infer<typeof N8nBulkLeadsSchema>;
export type N8nBulkResponse = z.infer<typeof N8nBulkResponseSchema>;

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Valida payload de webhook de lead do n8n
 */
export function validateN8nLeadWebhook(data: unknown): N8nLeadWebhook {
  return N8nLeadWebhookSchema.parse(data);
}

/**
 * Valida resposta de lead
 */
export function validateLeadResponse(data: unknown): LeadResponse {
  return LeadResponseSchema.parse(data);
}

/**
 * Valida atividade de lead do n8n
 */
export function validateN8nLeadActivity(data: unknown): N8nLeadActivity {
  return N8nLeadActivitySchema.parse(data);
}

/**
 * Valida request de webhook genérico
 */
export function validateN8nWebhookRequest(data: unknown): N8nWebhookRequest {
  return N8nWebhookRequestSchema.parse(data);
}

/**
 * Valida payload de trigger baseado no tipo de evento
 */
export function validateLeadTriggerPayload(data: unknown, eventType: string) {
  switch (eventType) {
    case 'lead.created':
      return LeadCreatedTriggerSchema.parse(data);
    case 'lead.updated':
    case 'lead.stage_changed':
    case 'lead.assigned':
      return LeadUpdatedTriggerSchema.parse(data);
    case 'lead.qualified':
      return LeadQualifiedTriggerSchema.parse(data);
    case 'lead.converted':
      return LeadConvertedTriggerSchema.parse(data);
    default:
      throw new Error(`Tipo de evento de lead não suportado: ${eventType}`);
  }
}

/**
 * Converte lead do formato interno para formato n8n
 */
export function convertToN8nFormat(lead: any): LeadResponse {
  return LeadResponseSchema.parse({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    leadStage: lead.leadStage,
    leadScore: lead.leadScore,
    leadSource: lead.leadSource,
    leadSourceDetails: lead.leadSourceDetails,
    company: lead.company,
    position: lead.position,
    budget: lead.budget ? Number(lead.budget) : undefined,
    timeline: lead.timeline,
    preferences: lead.preferences,
    tags: lead.tags || [],
    priority: lead.priority,
    isQualified: lead.isQualified,
    agentId: lead.agentId,
    agent: lead.agent ? {
      id: lead.agent.id,
      name: lead.agent.name,
      email: lead.agent.email
    } : undefined,
    autoAssigned: lead.autoAssigned,
    assignmentScore: lead.assignmentScore,
    assignmentReason: lead.assignmentReason,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString()
  });
}

/**
 * Converte formato n8n para formato interno
 */
export function convertFromN8nFormat(webhook: N8nLeadWebhook) {
  return {
    name: webhook.name,
    email: webhook.email || undefined,
    phone: webhook.phone || undefined,
    leadSource: webhook.leadSource,
    leadSourceDetails: webhook.leadSourceDetails,
    company: webhook.company,
    position: webhook.position,
    budget: webhook.budget,
    timeline: webhook.timeline,
    preferences: webhook.preferences,
    tags: webhook.tags || [],
    priority: webhook.priority,
    agentId: webhook.agentId,
    optInWhatsApp: webhook.optInWhatsApp,
    optInEmail: webhook.optInEmail,
    optInSMS: webhook.optInSMS,
    // Metadados n8n
    n8nWorkflowId: webhook.n8nWorkflowId,
    n8nExecutionId: webhook.n8nExecutionId,
    automationTrigger: 'N8N_WEBHOOK',
    automationData: {
      webhookSource: webhook.webhookSource,
      correlationId: webhook.correlationId,
      customFields: webhook.customFields
    }
  };
}

/**
 * Type guard para webhook de lead
 */
export function isN8nLeadWebhook(data: unknown): data is N8nLeadWebhook {
  try {
    N8nLeadWebhookSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza dados de webhook antes da validação
 */
export function sanitizeN8nWebhookData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data as Record<string, unknown> };

  // Remove campos vazios
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '' || sanitized[key] === null || sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  // Converte strings numéricas para números
  if ('budget' in sanitized && typeof sanitized.budget === 'string') {
    const budget = parseFloat(sanitized.budget);
    sanitized.budget = isNaN(budget) ? undefined : budget;
  }

  // Garante que arrays sejam arrays
  if ('tags' in sanitized && typeof sanitized.tags === 'string') {
    sanitized.tags = sanitized.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }

  // Garante que booleans sejam booleans
  ['optInWhatsApp', 'optInEmail', 'optInSMS', 'autoAssign'].forEach(field => {
    if (field in sanitized) {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = sanitized[field] === 'true' || sanitized[field] === '1';
      }
    }
  });

  return sanitized;
}

// ==============================================
// CONSTANTS
// ==============================================

export const DEFAULT_LEAD_PRIORITY: LeadPriority = 'MEDIUM';
export const DEFAULT_LEAD_STAGE: LeadStage = 'NEW';
export const DEFAULT_WEBHOOK_SOURCE = 'n8n';
export const MAX_BULK_LEADS = 100;
export const DEFAULT_BATCH_SIZE = 10;
export const DEFAULT_BATCH_DELAY = 1000; // ms

// Mapeamento de fontes para scores
export const LEAD_SOURCE_SCORES: Record<string, number> = {
  'Indicação': 100,
  'Site': 80,
  'WhatsApp': 70,
  'Facebook': 60,
  'Instagram': 60,
  'Google Ads': 75,
  'Cold Call': 30,
  'Email Marketing': 45,
  'Evento': 85,
  'Parceiro': 90,
  'N8N_AUTOMATION': 65,
  'Outros': 50
};

// Pesos para cálculo de score
export const SCORING_WEIGHTS = {
  sourceQuality: 0.20,
  engagementLevel: 0.25,
  budgetAlignment: 0.20,
  timelineUrgency: 0.15,
  qualificationLevel: 0.15,
  responseRate: 0.03,
  interactionFrequency: 0.02
};