import { z } from 'zod';

// -----------------------------------------------------------
// Enums baseados no schema Prisma
// -----------------------------------------------------------

export const UserRoleSchema = z.enum(['PROPRIETARIO', 'ADMIN', 'AGENT']);

export const ContactCategorySchema = z.enum(['CLIENT', 'LEAD', 'PARTNER']);

export const ContactStatusSchema = z.enum(['ACTIVE', 'NEW', 'INACTIVE']);

export const DealStageSchema = z.enum([
  'LEAD_IN',
  'QUALIFICATION', 
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST'
]);

export const ActivityTypeSchema = z.enum([
  'USER_CREATED',
  'PROPERTY_CREATED',
  'PROPERTY_UPDATED',
  'PROPERTY_DELETED',
  'CONTACT_CREATED',
  'CONTACT_UPDATED',
  'CONTACT_DELETED',
  'APPOINTMENT_SCHEDULED',
  'APPOINTMENT_UPDATED',
  'APPOINTMENT_CANCELED',
  'DEAL_CREATED',
  'DEAL_UPDATED',
  'DEAL_CLOSED',
  'CHAT_MESSAGE_SENT'
]);

// -----------------------------------------------------------
// Schemas principais baseados no banco de dados
// -----------------------------------------------------------

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: UserRoleSchema,
  isActive: z.boolean().default(true),
  companyId: z.string().uuid(),
  avatarUrl: z.string().url().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const ContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  category: ContactCategorySchema,
  status: ContactStatusSchema,
  lastContactAt: z.string().datetime().nullable(),
  avatarUrl: z.string().url().optional(),
  agentId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const DealSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  value: z.number().positive('Valor deve ser positivo'),
  stage: DealStageSchema,
  status: z.string().default('ACTIVE'),
  expectedCloseDate: z.string().datetime().optional(),
  closedAt: z.string().datetime().nullable(),
  propertyId: z.string().uuid(),
  clientId: z.string().uuid(),
  agentId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  type: ActivityTypeSchema,
  description: z.string().min(1, 'Descrição é obrigatória'),
  entityId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime()
});

// -----------------------------------------------------------
// Schemas específicos para CRM
// -----------------------------------------------------------

export const LeadScoreSchema = z.object({
  contactId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  factors: z.object({
    interactionCount: z.number().int().min(0),
    lastActivityDays: z.number().int().min(0),
    engagement: z.number().min(0).max(100)
  }),
  lastCalculatedAt: z.string().datetime()
});

export const SegmentationRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome do segmento é obrigatório'),
  description: z.string().optional(),
  criteria: z.object({
    category: ContactCategorySchema.optional(),
    status: ContactStatusSchema.optional(),
    scoreRange: z.object({
      min: z.number().int().min(0).max(100),
      max: z.number().int().min(0).max(100)
    }).optional(),
    lastActivityDays: z.number().int().min(0).optional(),
    dealStage: DealStageSchema.optional(),
    customFilters: z.record(z.any()).optional()
  }),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const ContactSegmentSchema = z.object({
  contactId: z.string().uuid(),
  segmentId: z.string().uuid(),
  assignedAt: z.string().datetime(),
  isActive: z.boolean().default(true)
});

export const MarketingAutomationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome da automação é obrigatório'),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['SCORE_CHANGE', 'SEGMENT_ENTRY', 'ACTIVITY', 'TIME_BASED']),
    conditions: z.record(z.any()),
    segmentId: z.string().uuid().optional()
  }),
  actions: z.array(z.object({
    type: z.enum(['SEND_EMAIL', 'SEND_MESSAGE', 'CREATE_TASK', 'UPDATE_SCORE', 'CHANGE_SEGMENT']),
    parameters: z.record(z.any()),
    delayMinutes: z.number().int().min(0).optional()
  })),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const CrmMetricsSchema = z.object({
  totalContacts: z.number().int().min(0),
  totalLeads: z.number().int().min(0),
  totalClients: z.number().int().min(0),
  conversionRate: z.number().min(0).max(100),
  averageLeadScore: z.number().min(0).max(100),
  activeDeals: z.number().int().min(0),
  totalDealValue: z.number().min(0),
  winRate: z.number().min(0).max(100),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  calculatedAt: z.string().datetime()
});

// -----------------------------------------------------------
// Schemas para formulários do CRM
// -----------------------------------------------------------

export const LeadScoringFormSchema = z.object({
  contactId: z.string().uuid(),
  manualScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional()
});

export const SegmentationFormSchema = z.object({
  name: z.string().min(1, 'Nome do segmento é obrigatório'),
  description: z.string().optional(),
  criteria: z.object({
    category: ContactCategorySchema.optional(),
    status: ContactStatusSchema.optional(),
    minScore: z.number().int().min(0).max(100).optional(),
    maxScore: z.number().int().min(0).max(100).optional(),
    maxDaysLastActivity: z.number().int().min(0).optional(),
    dealStage: DealStageSchema.optional()
  })
});

export const MarketingAutomationFormSchema = z.object({
  name: z.string().min(1, 'Nome da automação é obrigatório'),
  description: z.string().optional(),
  triggerType: z.enum(['SCORE_CHANGE', 'SEGMENT_ENTRY', 'ACTIVITY', 'TIME_BASED']),
  segmentId: z.string().uuid().optional(),
  actions: z.array(z.object({
    type: z.enum(['SEND_EMAIL', 'SEND_MESSAGE', 'CREATE_TASK', 'UPDATE_SCORE', 'CHANGE_SEGMENT']),
    emailTemplate: z.string().optional(),
    messageText: z.string().optional(),
    scoreChange: z.number().int().optional(),
    targetSegmentId: z.string().uuid().optional(),
    delayMinutes: z.number().int().min(0).default(0)
  }))
});

// -----------------------------------------------------------
// Tipos TypeScript inferidos
// -----------------------------------------------------------

export type User = z.infer<typeof UserSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type LeadScore = z.infer<typeof LeadScoreSchema>;
export type SegmentationRule = z.infer<typeof SegmentationRuleSchema>;
export type ContactSegment = z.infer<typeof ContactSegmentSchema>;
export type MarketingAutomation = z.infer<typeof MarketingAutomationSchema>;
export type CrmMetrics = z.infer<typeof CrmMetricsSchema>;
export type LeadScoringForm = z.infer<typeof LeadScoringFormSchema>;
export type SegmentationForm = z.infer<typeof SegmentationFormSchema>;
export type MarketingAutomationForm = z.infer<typeof MarketingAutomationFormSchema>;

// -----------------------------------------------------------
// Schemas de validação para arrays
// -----------------------------------------------------------

export const ContactsArraySchema = z.array(ContactSchema);
export const DealsArraySchema = z.array(DealSchema);
export const ActivitiesArraySchema = z.array(ActivitySchema);
export const LeadScoresArraySchema = z.array(LeadScoreSchema);
export const SegmentationRulesArraySchema = z.array(SegmentationRuleSchema);
export const MarketingAutomationsArraySchema = z.array(MarketingAutomationSchema); 