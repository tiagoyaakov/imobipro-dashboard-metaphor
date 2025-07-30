// ===================================================================
// PIPELINE MODULE TYPES - ImobiPRO Dashboard
// ===================================================================
// Sistema completo de gestão de funil de vendas com estágios
// detalhados, métricas avançadas e automações inteligentes

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  status: DealStatus;
  expectedCloseDate: string;
  closedAt?: string;
  propertyId?: string;
  clientId: string;
  agentId: string;
  
  // Campos estendidos do Pipeline
  currentStage: DealStage;
  probability: number; // 0-100%
  expectedValue?: number;
  daysInStage: number;
  
  // Ações e follow-up
  nextAction?: string;
  nextActionDate?: string;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  agent?: {
    id: string;
    name: string;
  };
  property?: {
    id: string;
    title: string;
    address?: string;
  };
  
  // Histórico e atividades (carregadas opcionalmente)
  stageHistory?: DealStageHistory[];
  activities?: DealActivity[];
}

export interface DealStageHistory {
  id: string;
  dealId: string;
  fromStage: DealStage;
  toStage: DealStage;
  changedAt: string;
  changedBy: string;
  changedByName?: string;
  reason?: string;
  durationInPreviousStage?: number; // dias no estágio anterior
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: DealActivityType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

// ===================================================================
// ENUMS - Sistema de estágios e tipos de atividade
// ===================================================================

export enum DealStage {
  LEAD_IN = 'LEAD_IN',             // Lead inicial (0-20%)
  QUALIFICATION = 'QUALIFICATION',  // Qualificação (20-40%)
  PROPOSAL = 'PROPOSAL',           // Proposta enviada (40-60%)
  NEGOTIATION = 'NEGOTIATION',     // Negociação (60-80%)
  WON = 'WON',                     // Fechado ganho (100%)
  LOST = 'LOST'                    // Perdido (0%)
}

export enum DealStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export enum DealActivityType {
  STAGE_CHANGED = 'STAGE_CHANGED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATION_STARTED = 'NEGOTIATION_STARTED',
  OFFER_MADE = 'OFFER_MADE',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  DOCUMENT_SENT = 'DOCUMENT_SENT',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  FOLLOW_UP_SENT = 'FOLLOW_UP_SENT',
  CALL_MADE = 'CALL_MADE',
  EMAIL_SENT = 'EMAIL_SENT',
  WHATSAPP_SENT = 'WHATSAPP_SENT',
  NOTE_ADDED = 'NOTE_ADDED'
}

// ===================================================================
// CONFIGURAÇÃO DOS ESTÁGIOS - Definições visuais e de negócio
// ===================================================================

export interface DealStageConfig {
  id: DealStage;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  probability: {
    min: number;
    max: number;
    default: number;
  };
  nextStages: DealStage[];
  automations?: {
    onEnter?: string[];
    onExit?: string[];
    reminders?: {
      days: number;
      message: string;
    }[];
  };
}

export const DEAL_STAGE_CONFIGS: Record<DealStage, DealStageConfig> = {
  [DealStage.LEAD_IN]: {
    id: DealStage.LEAD_IN,
    name: 'Lead Inicial',
    description: 'Primeiro contato, interesse demonstrado',
    color: '#64748B',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: 'UserPlus',
    probability: { min: 0, max: 20, default: 10 },
    nextStages: [DealStage.QUALIFICATION, DealStage.LOST],
    automations: {
      onEnter: ['send_welcome_message', 'schedule_follow_up'],
      reminders: [
        { days: 1, message: 'Follow-up inicial pendente' },
        { days: 3, message: 'Lead sem contato há 3 dias' }
      ]
    }
  },
  [DealStage.QUALIFICATION]: {
    id: DealStage.QUALIFICATION,
    name: 'Qualificação',
    description: 'Lead qualificado, necessidades identificadas',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'Search',
    probability: { min: 20, max: 40, default: 30 },
    nextStages: [DealStage.PROPOSAL, DealStage.LOST],
    automations: {
      onEnter: ['send_qualification_form', 'schedule_needs_assessment'],
      reminders: [
        { days: 2, message: 'Qualificação pendente há 2 dias' },
        { days: 5, message: 'Lead qualificado sem proposta' }
      ]
    }
  },
  [DealStage.PROPOSAL]: {
    id: DealStage.PROPOSAL,
    name: 'Proposta',
    description: 'Proposta enviada e em análise',
    color: '#8B5CF6',
    bgColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    icon: 'FileText',
    probability: { min: 40, max: 60, default: 50 },
    nextStages: [DealStage.NEGOTIATION, DealStage.LOST],
    automations: {
      onEnter: ['send_proposal_template', 'set_follow_up_reminder'],
      reminders: [
        { days: 3, message: 'Proposta sem resposta há 3 dias' },
        { days: 7, message: 'Follow-up de proposta urgente' }
      ]
    }
  },
  [DealStage.NEGOTIATION]: {
    id: DealStage.NEGOTIATION,
    name: 'Negociação',
    description: 'Em processo de negociação ativa',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FED7AA',
    icon: 'MessageSquare',
    probability: { min: 60, max: 80, default: 70 },
    nextStages: [DealStage.WON, DealStage.LOST],
    automations: {
      onEnter: ['prepare_negotiation_docs', 'schedule_meeting'],
      reminders: [
        { days: 1, message: 'Negociação requer atenção' },
        { days: 3, message: 'Negociação prolongada - revisar estratégia' }
      ]
    }
  },
  [DealStage.WON]: {
    id: DealStage.WON,
    name: 'Fechado - Ganho',
    description: 'Negócio fechado com sucesso',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    icon: 'CheckCircle',
    probability: { min: 100, max: 100, default: 100 },
    nextStages: [],
    automations: {
      onEnter: ['send_celebration_message', 'generate_commission_report', 'update_agent_metrics']
    }
  },
  [DealStage.LOST]: {
    id: DealStage.LOST,
    name: 'Perdido',
    description: 'Negócio perdido ou cancelado',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'XCircle',
    probability: { min: 0, max: 0, default: 0 },
    nextStages: [],
    automations: {
      onEnter: ['send_feedback_request', 'analyze_loss_reason', 'update_lead_scoring']
    }
  }
};

// ===================================================================
// MÉTRICAS E ANALYTICS - Interfaces para dashboard e relatórios
// ===================================================================

export interface PipelineMetrics {
  // Métricas gerais
  totalDeals: number;
  totalValue: number;
  averageDealValue: number;
  conversionRate: number;
  
  // Métricas por estágio
  dealsByStage: Record<DealStage, number>;
  valueByStage: Record<DealStage, number>;
  
  // Métricas de tempo
  averageTimeInStage: Record<DealStage, number>;
  averageCycleTime: number; // tempo total médio do lead ao fechamento
  
  // Métricas de performance
  monthlyClosedDeals: number;
  monthlyRevenue: number;
  projectedRevenue: number; // baseado na probabilidade dos deals ativos
  
  // Tendências (crescimento em relação ao período anterior)
  trends: {
    deals: number; // % de crescimento
    revenue: number; // % de crescimento
    conversion: number; // % de mudança na conversão
  };
}

export interface PipelineFilters {
  agentId?: string;
  stage?: DealStage;
  status?: DealStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  minValue?: number;
  maxValue?: number;
  searchTerm?: string;
}

export interface PipelineSort {
  field: 'title' | 'value' | 'stage' | 'probability' | 'createdAt' | 'updatedAt' | 'expectedCloseDate';
  direction: 'asc' | 'desc';
}

// ===================================================================
// ACTIONS E OPERAÇÕES - Interfaces para manipulação de deals
// ===================================================================

export interface CreateDealData {
  title: string;
  value: number;
  clientId: string;
  agentId?: string;
  propertyId?: string;
  expectedCloseDate?: string;
  nextAction?: string;
  nextActionDate?: string;
  stage?: DealStage;
  probability?: number;
}

export interface UpdateDealData {
  title?: string;
  value?: number;
  expectedCloseDate?: string;
  nextAction?: string;
  nextActionDate?: string;
  probability?: number;
}

export interface MoveDealData {
  dealId: string;
  fromStage: DealStage;
  toStage: DealStage;
  reason?: string;
}

export interface AddDealActivityData {
  dealId: string;
  type: DealActivityType;
  description: string;
  metadata?: Record<string, any>;
}

// ===================================================================
// UI COMPONENTS - Interfaces para componentes React
// ===================================================================

export interface KanbanColumn {
  stage: DealStage;
  config: DealStageConfig;
  deals: Deal[];
  totalValue: number;
  isLoading?: boolean;
}

export interface DealCard {
  deal: Deal;
  isCompact?: boolean;
  showActions?: boolean;
  onMove?: (dealId: string, toStage: DealStage) => void;
  onEdit?: (deal: Deal) => void;
  onDelete?: (dealId: string) => void;
}

export interface PipelineViewMode {
  mode: 'kanban' | 'list' | 'table';
  groupBy?: 'stage' | 'agent' | 'date';
  sortBy?: PipelineSort;
}

// ===================================================================
// AUTOMATIONS - Sistema de automações baseadas em estágios
// ===================================================================

export interface PipelineAutomation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'stage_change' | 'time_based' | 'manual';
    stage?: DealStage;
    conditions?: Record<string, any>;
  };
  actions: PipelineAutomationAction[];
  isActive: boolean;
}

export interface PipelineAutomationAction {
  type: 'send_email' | 'send_whatsapp' | 'create_task' | 'schedule_reminder' | 'webhook' | 'update_field';
  config: Record<string, any>;
  delay?: number; // minutos de delay
}

// ===================================================================
// REPORTS - Interfaces para relatórios do pipeline
// ===================================================================

export interface PipelineReportData {
  period: {
    start: string;
    end: string;
  };
  metrics: PipelineMetrics;
  topPerformers: {
    agentId: string;
    agentName: string;
    dealsWon: number;
    revenue: number;
    conversionRate: number;
  }[];
  conversionFunnel: {
    stage: DealStage;
    entered: number;
    converted: number;
    conversionRate: number;
    averageTime: number;
  }[];
  lossAnalysis: {
    stage: DealStage;
    lostDeals: number;
    lostValue: number;
    mainReasons: string[];
  }[];
}

export type { Deal as PipelineDeal };