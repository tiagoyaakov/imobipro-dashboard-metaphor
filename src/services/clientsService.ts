/**
 * 🔲 ImobiPRO - Serviço de Clientes (Funil de Leads)
 * 
 * Serviço completo para gestão do funil de leads e CRM.
 * Inclui CRUD de contatos, atividades, campanhas e scoring automático.
 * 
 * Funcionalidades:
 * - Gestão completa de contatos/leads
 * - Sistema de scoring automático
 * - Gestão de campanhas de mensagens
 * - Atividades e histórico de interações
 * - Atribuição automática de leads
 * - Funil Kanban com drag & drop
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Contact, 
  LeadActivity,
  MessageCampaign,
  MessageCampaignParticipation,
  LeadStage,
  LeadActivityType,
  CampaignStatus,
  User,
  ContactWithDetails,
  CreateContactInput,
  UpdateContactInput,
  CreateLeadActivityInput,
  CreateCampaignInput,
  LeadScoringFactors,
  FunnelStats
} from '@/types/clients';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

class ClientsService {
  
  // --------------------------------------------------------------------------
  // CRUD DE CONTATOS/LEADS
  // --------------------------------------------------------------------------

  /**
   * Criar novo contato/lead
   */
  async createContact(input: CreateContactInput): Promise<ContactWithDetails> {
    try {
      // Calcular score inicial
      const initialScore = await this.calculateLeadScore({
        sourceQuality: this.getSourceQuality(input.leadSource || ''),
        engagementLevel: 0,
        budgetAlignment: input.budget ? this.getBudgetAlignment(input.budget) : 0,
        timelineUrgency: input.timeline ? this.getTimelineUrgency(input.timeline) : 0,
        qualificationLevel: 0,
        responseRate: 0,
        interactionFrequency: 0
      });

      const { data, error } = await supabase
        .from('Contact')
        .insert({
          ...input,
          leadScore: initialScore,
          leadStage: 'NEW' as LeadStage,
          interactionCount: 0,
          engagementLevel: 'LOW'
        })
        .select(`
          *,
          agent:User(id, name, email),
          leadActivities:LeadActivity(*),
          campaignParticipations:MessageCampaignParticipation(*),
          _count:appointments(count),
          _count:deals(count),
          _count:leadActivities(count)
        `)
        .single();

      if (error) throw error;

      // Registrar atividade de criação
      await this.createLeadActivity({
        contactId: data.id,
        type: 'NOTE',
        title: 'Lead criado',
        description: `Lead criado a partir da fonte: ${input.leadSource || 'Manual'}`,
        direction: 'INBOUND',
        performedById: input.agentId
      });

      // Atribuição automática se configurada
      await this.handleAutoAssignment(data);

      return data as ContactWithDetails;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      throw new Error('Falha ao criar contato');
    }
  }

  /**
   * Buscar contatos com filtros avançados
   */
  async getContacts(filters: {
    agentId?: string;
    leadStage?: LeadStage;
    leadSource?: string;
    priority?: string;
    minScore?: number;
    maxScore?: number;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ contacts: ContactWithDetails[]; total: number }> {
    try {
      let query = supabase
        .from('Contact')
        .select(`
          *,
          agent:User(id, name, email),
          leadActivities:LeadActivity(*),
          campaignParticipations:MessageCampaignParticipation(*),
          _count:appointments(count),
          _count:deals(count),
          _count:leadActivities(count)
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters.agentId) {
        query = query.eq('agentId', filters.agentId);
      }
      
      if (filters.leadStage) {
        query = query.eq('leadStage', filters.leadStage);
      }
      
      if (filters.leadSource) {
        query = query.eq('leadSource', filters.leadSource);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.minScore !== undefined) {
        query = query.gte('leadScore', filters.minScore);
      }
      
      if (filters.maxScore !== undefined) {
        query = query.lte('leadScore', filters.maxScore);
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      // Paginação
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      // Ordenação por score e data
      query = query.order('leadScore', { ascending: false })
                   .order('createdAt', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        contacts: data as ContactWithDetails[],
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      throw new Error('Falha ao buscar contatos');
    }
  }

  /**
   * Buscar contato por ID
   */
  async getContactById(id: string): Promise<ContactWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('Contact')
        .select(`
          *,
          agent:User(id, name, email),
          leadActivities:LeadActivity(*),
          campaignParticipations:MessageCampaignParticipation(*),
          _count:appointments(count),
          _count:deals(count),
          _count:leadActivities(count)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data as ContactWithDetails | null;
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      throw new Error('Falha ao buscar contato');
    }
  }

  /**
   * Atualizar contato
   */
  async updateContact(id: string, input: UpdateContactInput): Promise<ContactWithDetails> {
    try {
      // Recalcular score se necessário
      let updatedData = { ...input };
      
      if (input.leadStage || input.budget || input.timeline) {
        const currentContact = await this.getContactById(id);
        if (currentContact) {
          const newScore = await this.calculateLeadScore({
            sourceQuality: this.getSourceQuality(currentContact.leadSource || ''),
            engagementLevel: this.getEngagementScore(currentContact.engagementLevel || 'LOW'),
            budgetAlignment: input.budget ? this.getBudgetAlignment(input.budget) : 
                           currentContact.budget ? this.getBudgetAlignment(Number(currentContact.budget)) : 0,
            timelineUrgency: input.timeline ? this.getTimelineUrgency(input.timeline) :
                           currentContact.timeline ? this.getTimelineUrgency(currentContact.timeline) : 0,
            qualificationLevel: input.isQualified ? 100 : (currentContact.isQualified ? 100 : 0),
            responseRate: currentContact.responseRate || 0,
            interactionFrequency: this.getInteractionFrequency(currentContact.interactionCount)
          });
          
          updatedData.leadScore = newScore;
        }
      }

      const { data, error } = await supabase
        .from('Contact')
        .update(updatedData)
        .eq('id', id)
        .select(`
          *,
          agent:User(id, name, email),
          leadActivities:LeadActivity(*),
          campaignParticipations:MessageCampaignParticipation(*),
          _count:appointments(count),
          _count:deals(count),
          _count:leadActivities(count)
        `)
        .single();

      if (error) throw error;

      // Registrar atividade de atualização
      if (input.leadStage) {
        await this.createLeadActivity({
          contactId: id,
          type: 'NOTE',
          title: 'Stage alterado',
          description: `Lead movido para stage: ${input.leadStage}`,
          direction: 'OUTBOUND'
        });
      }

      return data as ContactWithDetails;
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      throw new Error('Falha ao atualizar contato');
    }
  }

  /**
   * Excluir contato
   */
  async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Contact')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      throw new Error('Falha ao excluir contato');
    }
  }

  // --------------------------------------------------------------------------
  // ATIVIDADES DE LEADS
  // --------------------------------------------------------------------------

  /**
   * Criar atividade de lead
   */
  async createLeadActivity(input: CreateLeadActivityInput): Promise<LeadActivity> {
    try {
      const { data, error } = await supabase
        .from('LeadActivity')
        .insert(input)
        .select('*')
        .single();

      if (error) throw error;

      // Atualizar estatísticas do contato
      await this.updateContactInteractionStats(input.contactId);

      return data as LeadActivity;
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      throw new Error('Falha ao criar atividade');
    }
  }

  /**
   * Buscar atividades por contato
   */
  async getLeadActivities(contactId: string): Promise<LeadActivity[]> {
    try {
      const { data, error } = await supabase
        .from('LeadActivity')
        .select('*')
        .eq('contactId', contactId)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      return data as LeadActivity[];
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      throw new Error('Falha ao buscar atividades');
    }
  }

  // --------------------------------------------------------------------------
  // CAMPANHAS DE MENSAGENS
  // --------------------------------------------------------------------------

  /**
   * Criar campanha de mensagens
   */
  async createCampaign(input: CreateCampaignInput): Promise<MessageCampaign> {
    try {
      const { data, error } = await supabase
        .from('MessageCampaign')
        .insert(input)
        .select('*')
        .single();

      if (error) throw error;

      return data as MessageCampaign;
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      throw new Error('Falha ao criar campanha');
    }
  }

  /**
   * Buscar campanhas
   */
  async getCampaigns(filters: {
    status?: CampaignStatus;
    channel?: string;
    createdById?: string;
  } = {}): Promise<MessageCampaign[]> {
    try {
      let query = supabase
        .from('MessageCampaign')
        .select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.channel) {
        query = query.eq('channel', filters.channel);
      }

      if (filters.createdById) {
        query = query.eq('createdById', filters.createdById);
      }

      query = query.order('createdAt', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data as MessageCampaign[];
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      throw new Error('Falha ao buscar campanhas');
    }
  }

  // --------------------------------------------------------------------------
  // SISTEMA DE SCORING
  // --------------------------------------------------------------------------

  /**
   * Calcular score do lead baseado em múltiplos fatores
   */
  private async calculateLeadScore(factors: LeadScoringFactors): Promise<number> {
    const weights = {
      sourceQuality: 0.20,      // 20% - Qualidade da fonte
      engagementLevel: 0.25,    // 25% - Nível de engajamento
      budgetAlignment: 0.20,    // 20% - Alinhamento orçamentário
      timelineUrgency: 0.15,    // 15% - Urgência do prazo
      qualificationLevel: 0.15, // 15% - Nível de qualificação
      responseRate: 0.03,       // 3% - Taxa de resposta
      interactionFrequency: 0.02 // 2% - Frequência de interação
    };

    const score = 
      factors.sourceQuality * weights.sourceQuality +
      factors.engagementLevel * weights.engagementLevel +
      factors.budgetAlignment * weights.budgetAlignment +
      factors.timelineUrgency * weights.timelineUrgency +
      factors.qualificationLevel * weights.qualificationLevel +
      factors.responseRate * weights.responseRate +
      factors.interactionFrequency * weights.interactionFrequency;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Avaliar qualidade da fonte
   */
  private getSourceQuality(source: string): number {
    const sourceScores: Record<string, number> = {
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
      'Outros': 50
    };

    return sourceScores[source] || 50;
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
   * Avaliar nível de engajamento
   */
  private getEngagementScore(level: string): number {
    const engagementScores: Record<string, number> = {
      'HIGH': 100,
      'MEDIUM': 60,
      'LOW': 20
    };

    return engagementScores[level] || 20;
  }

  /**
   * Avaliar frequência de interação
   */
  private getInteractionFrequency(count: number): number {
    if (count >= 10) return 100;
    if (count >= 5) return 70;
    if (count >= 3) return 50;
    if (count >= 1) return 30;
    return 0;
  }

  // --------------------------------------------------------------------------
  // ATRIBUIÇÃO AUTOMÁTICA
  // --------------------------------------------------------------------------

  /**
   * Gerenciar atribuição automática de leads
   */
  private async handleAutoAssignment(contact: Contact): Promise<void> {
    try {
      // Lógica de atribuição baseada em critérios
      // Implementar algoritmo de balanceamento de cargas
      // Por ora, manter o agente atual
      console.log('Auto-assignment:', contact.id);
    } catch (error) {
      console.error('Erro na atribuição automática:', error);
    }
  }

  // --------------------------------------------------------------------------
  // ESTATÍSTICAS E RELATÓRIOS
  // --------------------------------------------------------------------------

  /**
   * Buscar estatísticas do funil
   */
  async getFunnelStats(agentId?: string): Promise<FunnelStats> {
    try {
      let query = supabase
        .from('Contact')
        .select('leadStage, leadSource, createdAt');

      if (agentId) {
        query = query.eq('agentId', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Processar estatísticas
      const totalLeads = data.length;
      const byStage = data.reduce((acc, contact) => {
        acc[contact.leadStage as LeadStage] = (acc[contact.leadStage as LeadStage] || 0) + 1;
        return acc;
      }, {} as Record<LeadStage, number>);

      // Calcular taxas de conversão
      const conversionRates = this.calculateConversionRates(byStage, totalLeads);

      // Top sources
      const sourceCounts = data.reduce((acc, contact) => {
        const source = contact.leadSource || 'Desconhecido';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({
          source,
          count,
          conversionRate: (count / totalLeads) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalLeads,
        byStage,
        conversionRates,
        averageTimeInStage: {} as Record<LeadStage, number>, // TODO: Implementar
        topSources
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Falha ao buscar estatísticas do funil');
    }
  }

  /**
   * Calcular taxas de conversão entre stages
   */
  private calculateConversionRates(byStage: Record<LeadStage, number>, total: number): Record<string, number> {
    const rates: Record<string, number> = {};
    
    if (total === 0) return rates;

    const stages: LeadStage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED', 'LOST'];
    
    for (let i = 0; i < stages.length - 1; i++) {
      const current = byStage[stages[i]] || 0;
      const next = byStage[stages[i + 1]] || 0;
      
      if (current > 0) {
        rates[`${stages[i]}_to_${stages[i + 1]}`] = (next / current) * 100;
      }
    }

    return rates;
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
}

// ============================================================================
// INSTÂNCIA E EXPORTAÇÃO
// ============================================================================

export const clientsService = new ClientsService();
export default clientsService;

// ============================================================================
// UTILITÁRIOS PARA TESTES E DESENVOLVIMENTO
// ============================================================================

/**
 * Dados mockados para desenvolvimento
 */
export const mockLeadData = {
  newLead: {
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    leadSource: 'WhatsApp',
    company: 'Empresa ABC',
    budget: 500000,
    timeline: '3-6 meses',
    preferences: {
      propertyType: 'APARTMENT',
      location: 'Centro',
      bedrooms: 3
    },
    tags: ['VIP', 'Investidor'],
    agentId: 'agent-1'
  },
  activities: [
    {
      type: 'CALL' as LeadActivityType,
      title: 'Primeira ligação',
      description: 'Contato inicial para qualificação',
      direction: 'OUTBOUND',
      duration: 15,
      outcome: 'Interessado',
      nextAction: 'Agendar visita'
    }
  ]
};