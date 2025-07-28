/**
 * 🔲 ImobiPRO - Tipos para Módulo de Clientes
 * 
 * Definições de tipos locais para evitar dependência do Prisma Client no frontend.
 * Mantém compatibilidade com os tipos do banco sem requerer Prisma no build.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export type LeadStage = 
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'INTERESTED'
  | 'NEGOTIATING'
  | 'CONVERTED'
  | 'LOST';

export type CampaignStatus = 
  | 'DRAFT'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type LeadActivityType = 
  | 'CALL'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'MEETING'
  | 'VISIT'
  | 'SMS'
  | 'FOLLOW_UP'
  | 'NOTE'
  | 'PROPOSAL_SENT'
  | 'CONTRACT_SENT'
  | 'DOCUMENT_RECEIVED'
  | 'PAYMENT_RECEIVED';

export type ContactCategory = 
  | 'CLIENT'
  | 'LEAD'
  | 'PARTNER';

export type ContactStatus = 
  | 'ACTIVE'
  | 'NEW'
  | 'INACTIVE';

export type UserRole = 
  | 'CREATOR'
  | 'ADMIN'
  | 'AGENT';

// ============================================================================
// MODELOS BASE
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category: ContactCategory;
  status: ContactStatus;
  lastContactAt?: Date;
  avatarUrl?: string;

  // Campos do funil de leads
  leadStage: LeadStage;
  leadScore: number;
  leadSource?: string;
  leadSourceDetails?: string;
  
  // Informações adicionais
  company?: string;
  position?: string;
  budget?: number;
  timeline?: string;
  preferences?: Record<string, any>;
  
  // Comportamento e engajamento
  interactionCount: number;
  lastInteractionAt?: Date;
  responseRate?: number;
  engagementLevel?: string;
  
  // Qualificação e segmentação
  isQualified: boolean;
  qualificationNotes?: string;
  tags: string[];
  priority: string;
  
  // Controle de campanhas
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  optInWhatsApp: boolean;
  optInEmail: boolean;
  optInSMS: boolean;
  
  // Próximas ações
  nextFollowUpAt?: Date;
  followUpReason?: string;

  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadActivity {
  id: string;
  contactId: string;
  type: LeadActivityType;
  title: string;
  description?: string;
  direction?: string;
  channel?: string;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  metadata?: Record<string, any>;
  performedById?: string;
  appointmentId?: string;
  dealId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageCampaign {
  id: string;
  name: string;
  description?: string;
  channel: string;
  status: CampaignStatus;
  subject?: string;
  template: string;
  variables?: Record<string, any>;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  targetCriteria?: Record<string, any>;
  sendDelay?: number;
  maxRecipients?: number;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  responseCount: number;
  errorCount: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageCampaignParticipation {
  id: string;
  campaignId: string;
  contactId: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  respondedAt?: Date;
  messageId?: string;
  errorMessage?: string;
  personalizedContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TIPOS COMPOSTOS
// ============================================================================

export interface ContactWithDetails extends Contact {
  agent: Pick<User, 'id' | 'name' | 'email'>;
  leadActivities: LeadActivity[];
  campaignParticipations: MessageCampaignParticipation[];
  _count: {
    appointments: number;
    deals: number;
    leadActivities: number;
  };
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  leadSource?: string;
  leadSourceDetails?: string;
  company?: string;
  position?: string;
  budget?: number;
  timeline?: string;
  preferences?: Record<string, any>;
  tags?: string[];
  priority?: string;
  agentId: string;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  leadStage?: LeadStage;
  leadScore?: number;
  isQualified?: boolean;
  qualificationNotes?: string;
  nextFollowUpAt?: Date;
  followUpReason?: string;
  optInWhatsApp?: boolean;
  optInEmail?: boolean;
  optInSMS?: boolean;
}

export interface CreateLeadActivityInput {
  contactId: string;
  type: LeadActivityType;
  title: string;
  description?: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  channel?: string;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  metadata?: Record<string, any>;
  performedById?: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  subject?: string;
  template: string;
  variables?: Record<string, any>;
  scheduledAt?: Date;
  targetCriteria?: Record<string, any>;
  sendDelay?: number;
  maxRecipients?: number;
  createdById: string;
}

export interface LeadScoringFactors {
  sourceQuality: number;
  engagementLevel: number;
  budgetAlignment: number;
  timelineUrgency: number;
  qualificationLevel: number;
  responseRate: number;
  interactionFrequency: number;
}

export interface FunnelStats {
  totalLeads: number;
  byStage: Record<LeadStage, number>;
  conversionRates: Record<string, number>;
  averageTimeInStage: Record<LeadStage, number>;
  topSources: Array<{ source: string; count: number; conversionRate: number }>;
}