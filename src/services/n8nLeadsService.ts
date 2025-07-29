/**
 * 🔲 ImobiPRO - Serviço de Integração n8n para Leads
 * 
 * Serviço especializado para integração com n8n no módulo de leads.
 * Fornece endpoints webhook e automações para criação/gestão de leads.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  N8nLeadWebhook, 
  LeadResponse,
  N8nLeadActivity,
  LeadTriggerMetadata,
  validateN8nLeadWebhook,
  validateN8nLeadActivity,
  convertFromN8nFormat,
  convertToN8nFormat,
  sanitizeN8nWebhookData,
  LEAD_SOURCE_SCORES,
  SCORING_WEIGHTS
} from '@/schemas/n8n-leads-schemas';
import type { CreateContactInput } from '@/types/clients';

// ============================================================================
// INTERFACES INTERNAS
// ============================================================================

interface WebhookResponse {
  success: boolean;
  data?: LeadResponse;
  error?: string;
  processingTime: number;
  webhookId?: string;
}

interface TriggerOptions {
  skipNotifications?: boolean;
  correlationId?: string;
  workflowId?: string;
  executionId?: string;
}

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

class N8nLeadsService {

  // --------------------------------------------------------------------------
  // WEBHOOK ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Processa webhook de criação de lead vindo do n8n
   */
  async processLeadWebhook(
    rawData: unknown,
    triggerOptions: TriggerOptions = {}
  ): Promise<WebhookResponse> {
    const startTime = Date.now();
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Sanitizar e validar dados
      const sanitized = sanitizeN8nWebhookData(rawData);
      const webhookData = validateN8nLeadWebhook(sanitized);

      // Verificar duplicatas se não for para pular
      if (!triggerOptions.skipNotifications) {
        const existingLead = await this.checkForDuplicates(webhookData);
        if (existingLead) {
          return {
            success: false,
            error: `Lead já existe: ${existingLead.name} (${existingLead.email || existingLead.phone})`,
            processingTime: Date.now() - startTime,
            webhookId
          };
        }
      }

      // Converter para formato interno
      const leadData = convertFromN8nFormat(webhookData);

      // Atribuição automática se necessário
      if (webhookData.autoAssign && !webhookData.agentId) {
        const assignment = await this.autoAssignLead(leadData);
        leadData.agentId = assignment.assignedAgent.id;
        leadData.autoAssigned = true;
        leadData.assignmentScore = assignment.assignmentScore;
        leadData.assignmentReason = assignment.assignmentReason;
      }

      // Criar lead no banco
      const createdLead = await this.createLeadInDatabase(leadData);

      // Converter para formato de resposta
      const response = convertToN8nFormat(createdLead);

      // Disparar triggers para outros workflows n8n
      if (triggerOptions.workflowId !== webhookData.n8nWorkflowId) {
        await this.triggerN8nWorkflows('lead.created', response, {
          correlationId: triggerOptions.correlationId || webhookData.correlationId,
          workflowId: webhookData.n8nWorkflowId,
          executionId: webhookData.n8nExecutionId
        });
      }

      // Registrar atividade inicial
      await this.createInitialActivity(createdLead.id, webhookData);

      return {
        success: true,
        data: response,
        processingTime: Date.now() - startTime,
        webhookId
      };

    } catch (error) {
      console.error('Erro no webhook de lead:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        processingTime: Date.now() - startTime,
        webhookId
      };
    }
  }

  /**
   * Processa webhook de atividade de lead
   */
  async processActivityWebhook(
    rawData: unknown,
    triggerOptions: TriggerOptions = {}
  ): Promise<WebhookResponse> {
    const startTime = Date.now();
    const webhookId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const activityData = validateN8nLeadActivity(rawData);

      // Verificar se o contato existe
      const { data: contact, error: contactError } = await supabase
        .from('Contact')
        .select('id, name')
        .eq('id', activityData.contactId)
        .single();

      if (contactError || !contact) {
        throw new Error(`Contato não encontrado: ${activityData.contactId}`);
      }

      // Criar atividade
      const { data: activity, error: activityError } = await supabase
        .from('LeadActivity')
        .insert({
          contactId: activityData.contactId,
          type: activityData.type,
          title: activityData.title,
          description: activityData.description,
          direction: activityData.direction,
          channel: activityData.channel,
          duration: activityData.duration,
          outcome: activityData.outcome,
          nextAction: activityData.nextAction,
          performedById: activityData.performedById,
          metadata: {
            ...activityData.metadata,
            n8nWorkflowId: activityData.n8nWorkflowId,
            n8nExecutionId: activityData.n8nExecutionId,
            automationTrigger: activityData.automationTrigger
          }
        })
        .select('*')
        .single();

      if (activityError) throw activityError;

      // Atualizar estatísticas do contato
      await this.updateContactInteractionStats(activityData.contactId);

      return {
        success: true,
        data: activity as any,
        processingTime: Date.now() - startTime,
        webhookId
      };

    } catch (error) {
      console.error('Erro no webhook de atividade:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        processingTime: Date.now() - startTime,
        webhookId
      };
    }
  }

  // --------------------------------------------------------------------------
  // OPERAÇÕES DE LEAD
  // --------------------------------------------------------------------------

  /**
   * Criar lead no banco de dados
   */
  private async createLeadInDatabase(leadData: any) {
    // Calcular score inicial
    const initialScore = this.calculateLeadScore({
      sourceQuality: LEAD_SOURCE_SCORES[leadData.leadSource] || 50,
      engagementLevel: 0,
      budgetAlignment: leadData.budget ? this.getBudgetAlignment(leadData.budget) : 0,
      timelineUrgency: leadData.timeline ? this.getTimelineUrgency(leadData.timeline) : 0,
      qualificationLevel: 0,
      responseRate: 0,
      interactionFrequency: 0
    });

    const { data, error } = await supabase
      .from('Contact')
      .insert({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        category: 'LEAD',
        status: 'NEW',
        leadStage: 'NEW',
        leadScore: initialScore,
        leadSource: leadData.leadSource,
        leadSourceDetails: leadData.leadSourceDetails,
        company: leadData.company,
        position: leadData.position,
        budget: leadData.budget,
        timeline: leadData.timeline,
        preferences: leadData.preferences,
        tags: leadData.tags || [],
        priority: leadData.priority || 'MEDIUM',
        isQualified: false,
        unsubscribed: false,
        optInWhatsApp: leadData.optInWhatsApp || false,
        optInEmail: leadData.optInEmail || false,
        optInSMS: leadData.optInSMS || false,
        agentId: leadData.agentId,
        autoAssigned: leadData.autoAssigned || false,
        assignmentScore: leadData.assignmentScore,
        assignmentReason: leadData.assignmentReason,
        interactionCount: 0,
        engagementLevel: 'LOW'
      })
      .select(`
        *,
        agent:User(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Erro detalhado ao criar lead:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    return data;
  }

  /**
   * Verificar duplicatas
   */
  private async checkForDuplicates(webhookData: N8nLeadWebhook) {
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (webhookData.email) {
      conditions.push('email.eq.email_param');
      params.email_param = webhookData.email;
    }

    if (webhookData.phone) {
      conditions.push('phone.eq.phone_param');
      params.phone_param = webhookData.phone;
    }

    if (conditions.length === 0) {
      return null;
    }

    const { data } = await supabase
      .from('Contact')
      .select('id, name, email, phone')
      .or(conditions.join(','))
      .limit(1)
      .single();

    return data;
  }

  /**
   * Atribuição automática de lead
   */
  private async autoAssignLead(leadData: any) {
    try {
      // Importar serviço de atribuição
      const { leadAssignmentService, AssignmentStrategy } = await import('./leadAssignmentService');
      
      const criteria = {
        leadSource: leadData.leadSource,
        propertyType: leadData.preferences?.propertyType,
        budget: leadData.budget,
        location: leadData.preferences?.location,
        urgency: leadData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        companyId: '' // TODO: Pegar do contexto
      };

      return await leadAssignmentService.assignLead(criteria, AssignmentStrategy.HYBRID);

    } catch (error) {
      console.error('Erro na atribuição automática:', error);
      
      // Fallback: buscar primeiro agente ativo
      const { data: agent } = await supabase
        .from('User')
        .select('id, name, email')
        .eq('role', 'AGENT')
        .eq('isActive', true)
        .limit(1)
        .single();

      if (!agent) {
        throw new Error('Nenhum agente disponível para atribuição');
      }

      return {
        assignedAgent: agent,
        assignmentScore: 0.5,
        assignmentReason: 'Atribuição fallback - primeiro agente disponível'
      };
    }
  }

  /**
   * Criar atividade inicial
   */
  private async createInitialActivity(contactId: string, webhookData: N8nLeadWebhook) {
    const { error } = await supabase
      .from('LeadActivity')
      .insert({
        contactId: contactId,
        type: 'NOTE',
        title: 'Lead criado via n8n',
        description: `Lead criado automaticamente via webhook n8n. Fonte: ${webhookData.leadSource}`,
        direction: 'INBOUND',
        metadata: {
          n8nWorkflowId: webhookData.n8nWorkflowId,
          n8nExecutionId: webhookData.n8nExecutionId,
          webhookSource: webhookData.webhookSource,
          correlationId: webhookData.correlationId,
          automationType: 'webhook'
        }
      });

    if (error) {
      console.error('Erro ao criar atividade inicial:', error);
    }
  }

  // --------------------------------------------------------------------------
  // TRIGGERS PARA N8N
  // --------------------------------------------------------------------------

  /**
   * Disparar workflows n8n
   */
  private async triggerN8nWorkflows(
    eventType: string,
    data: LeadResponse,
    metadata: Partial<LeadTriggerMetadata> = {}
  ) {
    try {
      // TODO: Implementar chamadas HTTP para n8n webhooks
      // Por enquanto apenas log
      console.log('Trigger n8n:', {
        event: eventType,
        leadId: data.id,
        leadName: data.name,
        metadata
      });

      // Exemplo de como seria a implementação:
      /*
      const webhookUrls = await this.getN8nWebhookUrls(eventType);
      
      for (const url of webhookUrls) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            data,
            metadata: {
              ...metadata,
              triggeredBy: 'imobipro_system',
              source: 'leads_module'
            }
          })
        });
      }
      */

    } catch (error) {
      console.error('Erro ao disparar workflows n8n:', error);
    }
  }

  // --------------------------------------------------------------------------
  // CÁLCULOS E UTILITÁRIOS
  // --------------------------------------------------------------------------

  /**
   * Calcular score do lead
   */
  private calculateLeadScore(factors: {
    sourceQuality: number;
    engagementLevel: number;
    budgetAlignment: number;
    timelineUrgency: number;
    qualificationLevel: number;
    responseRate: number;
    interactionFrequency: number;
  }): number {
    const score = 
      factors.sourceQuality * SCORING_WEIGHTS.sourceQuality +
      factors.engagementLevel * SCORING_WEIGHTS.engagementLevel +
      factors.budgetAlignment * SCORING_WEIGHTS.budgetAlignment +
      factors.timelineUrgency * SCORING_WEIGHTS.timelineUrgency +
      factors.qualificationLevel * SCORING_WEIGHTS.qualificationLevel +
      factors.responseRate * SCORING_WEIGHTS.responseRate +
      factors.interactionFrequency * SCORING_WEIGHTS.interactionFrequency;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Avaliar alinhamento orçamentário
   */
  private getBudgetAlignment(budget: number): number {
    if (budget >= 1000000) return 100; // R$ 1M+
    if (budget >= 500000) return 85;   // R$ 500K+
    if (budget >= 300000) return 70;   // R$ 300K+
    if (budget >= 150000) return 55;   // R$ 150K+
    if (budget >= 50000) return 40;    // R$ 50K+
    return 20;
  }

  /**
   * Avaliar urgência do prazo
   */
  private getTimelineUrgency(timeline: string): number {
    const timelineScores: Record<string, number> = {
      'Imediato': 100,
      '1-3 meses': 85,
      '3-6 meses': 70,
      '6-12 meses': 55,
      '1+ anos': 30,
      'Indeterminado': 20
    };

    return timelineScores[timeline] || 40;
  }

  /**
   * Atualizar estatísticas de interação do contato
   */
  private async updateContactInteractionStats(contactId: string): Promise<void> {
    try {
      const { data: activities } = await supabase
        .from('LeadActivity')
        .select('*')
        .eq('contactId', contactId);

      if (!activities) return;

      const interactionCount = activities.length;
      const lastInteractionAt = new Date();
      
      // Calcular taxa de resposta básica
      const inboundCount = activities.filter(a => a.direction === 'INBOUND').length;
      const responseRate = interactionCount > 0 ? inboundCount / interactionCount : 0;

      // Determinar nível de engajamento
      let engagementLevel = 'LOW';
      if (interactionCount >= 10 && responseRate > 0.6) engagementLevel = 'HIGH';
      else if (interactionCount >= 5 && responseRate > 0.3) engagementLevel = 'MEDIUM';

      await supabase
        .from('Contact')
        .update({
          interactionCount,
          lastInteractionAt,
          responseRate,
          engagementLevel
        })
        .eq('id', contactId);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas de interação:', error);
    }
  }

  // --------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS PARA API
  // --------------------------------------------------------------------------

  /**
   * Buscar leads com filtros específicos para n8n
   */
  async getLeadsForN8n(filters: {
    leadStage?: string;
    leadSource?: string;
    agentId?: string;
    createdSince?: string;
    limit?: number;
  } = {}) {
    try {
      let query = supabase
        .from('Contact')
        .select(`
          id, name, email, phone, leadStage, leadScore, leadSource,
          company, budget, timeline, tags, priority, agentId,
          createdAt, updatedAt,
          agent:User(id, name, email)
        `);

      if (filters.leadStage) query = query.eq('leadStage', filters.leadStage);
      if (filters.leadSource) query = query.eq('leadSource', filters.leadSource);
      if (filters.agentId) query = query.eq('agentId', filters.agentId);
      if (filters.createdSince) query = query.gte('createdAt', filters.createdSince);

      query = query
        .order('createdAt', { ascending: false })
        .limit(filters.limit || 50);

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(lead => convertToN8nFormat(lead)) || [];

    } catch (error) {
      console.error('Erro ao buscar leads para n8n:', error);
      throw new Error('Falha ao buscar leads');
    }
  }

  /**
   * Atualizar lead via n8n
   */
  async updateLeadFromN8n(leadId: string, updates: Partial<N8nLeadWebhook>) {
    try {
      const { data, error } = await supabase
        .from('Contact')
        .update({
          ...updates,
          updatedAt: new Date()
        })
        .eq('id', leadId)
        .select(`
          *,
          agent:User(id, name, email)
        `)
        .single();

      if (error) throw error;

      const response = convertToN8nFormat(data);

      // Disparar trigger de atualização
      await this.triggerN8nWorkflows('lead.updated', response);

      return response;

    } catch (error) {
      console.error('Erro ao atualizar lead via n8n:', error);
      throw new Error('Falha ao atualizar lead');
    }
  }
}

// ============================================================================
// INSTÂNCIA E EXPORTAÇÃO
// ============================================================================

export const n8nLeadsService = new N8nLeadsService();
export default n8nLeadsService;