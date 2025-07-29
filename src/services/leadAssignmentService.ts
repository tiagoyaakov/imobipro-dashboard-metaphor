/**
 * 🔲 ImobiPRO - Serviço de Atribuição Automática de Leads
 * 
 * Sistema inteligente de atribuição automática de leads para corretores.
 * Utiliza algoritmos de balanceamento de carga e critérios de qualificação.
 * 
 * Funcionalidades:
 * - Atribuição baseada em carga de trabalho
 * - Critérios de especialização por área/tipo
 * - Round-robin inteligente
 * - Priorização por performance
 * - Respeitabilidade de horários de trabalho
 * - Sistema de backup e escalabilidade
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';
import type { Contact, User } from '@/types/clients';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface AgentWorkload {
  agentId: string;
  agent: User;
  currentLeads: number;
  avgResponseTime: number; // em horas
  conversionRate: number; // 0-1
  lastAssignedAt: Date | null;
  specializations: string[]; // tipos de propriedade, regiões, etc.
  maxDailyLeads: number;
  todayAssignedLeads: number;
  isOnline: boolean;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
    timezone: string;
  };
  priority: number; // 1-10, maior = mais prioritário
}

interface AssignmentCriteria {
  leadSource?: string;
  propertyType?: string;
  budget?: number;
  location?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  preferredAgent?: string;
  companyId: string;
}

interface AssignmentResult {
  assignedAgentId: string;
  assignedAgent: User;
  assignmentScore: number;
  assignmentReason: string;
  alternativeAgents: {
    agentId: string;
    score: number;
    reason: string;
  }[];
}

enum AssignmentStrategy {
  ROUND_ROBIN = 'ROUND_ROBIN',           // Distribuição circular
  LOAD_BALANCED = 'LOAD_BALANCED',       // Baseado na carga atual
  PERFORMANCE_BASED = 'PERFORMANCE_BASED', // Baseado na performance
  SPECIALIZATION = 'SPECIALIZATION',     // Baseado na especialização
  HYBRID = 'HYBRID'                     // Combinação de critérios
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const ASSIGNMENT_CONFIG = {
  maxLeadsPerAgent: 50,              // Máximo de leads ativos por corretor
  maxDailyAssignments: 10,           // Máximo de novos leads por dia
  responseTimeWeight: 0.25,          // Peso do tempo de resposta (25%)
  conversionRateWeight: 0.30,        // Peso da taxa de conversão (30%)
  workloadWeight: 0.20,              // Peso da carga atual (20%)
  specializationWeight: 0.15,        // Peso da especialização (15%)
  availabilityWeight: 0.10,          // Peso da disponibilidade (10%)
  
  // Bonificações e penalizações
  onlineBonusScore: 10,              // Bônus para corretores online
  specializationBonusScore: 15,      // Bônus para especialização
  overloadPenaltyScore: -20,         // Penalidade por sobrecarga
  offlineTimePenaltyScore: -30,      // Penalidade por estar fora do horário
  
  // Configurações de backup
  enableFallbackAssignment: true,    // Habilitar atribuição de backup
  fallbackToAdmin: true,             // Escalar para admin se necessário
  
  // Cache e performance
  cacheWorkloadFor: 5 * 60 * 1000,   // Cache de workload por 5 minutos
  maxAssignmentAttempts: 3,          // Máximo de tentativas de atribuição
} as const;

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

class LeadAssignmentService {
  private workloadCache = new Map<string, { data: AgentWorkload[]; timestamp: number }>();
  private assignmentHistory = new Map<string, string[]>(); // companyId -> agentIds em ordem

  // --------------------------------------------------------------------------
  // MÉTODO PRINCIPAL DE ATRIBUIÇÃO
  // --------------------------------------------------------------------------

  /**
   * Atribuir lead automaticamente para o melhor corretor disponível
   */
  async assignLead(
    criteria: AssignmentCriteria,
    strategy: AssignmentStrategy = AssignmentStrategy.HYBRID
  ): Promise<AssignmentResult> {
    try {
      // 1. Buscar corretores disponíveis
      const availableAgents = await this.getAvailableAgents(criteria.companyId);
      
      if (availableAgents.length === 0) {
        throw new Error('Nenhum corretor disponível para atribuição');
      }

      // 2. Aplicar estratégia de atribuição
      const assignmentResult = await this.applyAssignmentStrategy(
        availableAgents,
        criteria,
        strategy
      );

      // 3. Registrar atribuição no histórico
      await this.recordAssignment(criteria.companyId, assignmentResult.assignedAgentId);

      // 4. Invalidar cache de workload
      this.invalidateWorkloadCache(criteria.companyId);

      return assignmentResult;

    } catch (error) {
      console.error('Erro na atribuição automática:', error);
      
      // Fallback: atribuir para admin da empresa
      if (ASSIGNMENT_CONFIG.enableFallbackAssignment) {
        return this.fallbackAssignment(criteria.companyId);
      }
      
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // BUSCA DE CORRETORES DISPONÍVEIS
  // --------------------------------------------------------------------------

  /**
   * Buscar corretores disponíveis com suas métricas
   */
  private async getAvailableAgents(companyId: string): Promise<AgentWorkload[]> {
    // Verificar cache primeiro
    const cacheKey = `workload_${companyId}`;
    const cached = this.workloadCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ASSIGNMENT_CONFIG.cacheWorkloadFor) {
      return cached.data;
    }

    try {
      // Buscar corretores ativos da empresa
      const { data: agents, error: agentsError } = await supabase
        .from('User')
        .select(`
          id,
          name,
          email,
          role,
          isActive,
          agentSchedule:AgentSchedule(
            workingHours,
            timezone,
            maxDailyAppointments,
            autoAssignEnabled
          )
        `)
        .eq('companyId', companyId)
        .eq('role', 'AGENT')
        .eq('isActive', true);

      if (agentsError) throw agentsError;

      if (!agents || agents.length === 0) {
        return [];
      }

      // Calcular workload para cada corretor
      const workloads = await Promise.all(
        agents.map(agent => this.calculateAgentWorkload(agent))
      );

      // Filtrar apenas corretores elegíveis
      const availableWorkloads = workloads.filter(workload => 
        workload.currentLeads < ASSIGNMENT_CONFIG.maxLeadsPerAgent &&
        workload.todayAssignedLeads < workload.maxDailyLeads &&
        (workload.agent as any).agentSchedule?.autoAssignEnabled !== false
      );

      // Atualizar cache
      this.workloadCache.set(cacheKey, {
        data: availableWorkloads,
        timestamp: Date.now()
      });

      return availableWorkloads;

    } catch (error) {
      console.error('Erro ao buscar corretores disponíveis:', error);
      return [];
    }
  }

  /**
   * Calcular workload e métricas de um corretor
   */
  private async calculateAgentWorkload(agent: any): Promise<AgentWorkload> {
    try {
      // Buscar leads ativos do corretor
      const { data: activeLeads } = await supabase
        .from('Contact')
        .select('id, leadStage, createdAt')
        .eq('agentId', agent.id)
        .not('leadStage', 'in', '(CONVERTED,LOST)');

      // Buscar leads atribuídos hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayLeads } = await supabase
        .from('Contact')
        .select('id')
        .eq('agentId', agent.id)
        .gte('createdAt', today.toISOString());

      // Buscar atividades recentes para calcular tempo de resposta
      const { data: recentActivities } = await supabase
        .from('LeadActivity')
        .select('id, createdAt, type')
        .eq('performedById', agent.id)
        .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // últimos 30 dias
        .order('createdAt', { ascending: false })
        .limit(100);

      // Buscar deals fechados para taxa de conversão
      const { data: closedDeals } = await supabase
        .from('Deal')
        .select('id, stage')
        .eq('agentId', agent.id)
        .eq('stage', 'WON')
        .gte('createdAt', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // últimos 90 dias

      // Calcular métricas
      const currentLeads = activeLeads?.length || 0;
      const todayAssignedLeads = todayLeads?.length || 0;
      const avgResponseTime = this.calculateAverageResponseTime(recentActivities || []);
      const conversionRate = this.calculateConversionRate(agent.id, closedDeals?.length || 0);
      
      // Determinar se está online (baseado na última atividade)
      const lastActivity = recentActivities?.[0];
      const isOnline = lastActivity ? 
        Date.now() - new Date(lastActivity.createdAt).getTime() < 60 * 60 * 1000 : // última atividade há menos de 1h
        false;

      // Extrair horários de trabalho
      const schedule = agent.agentSchedule?.[0];
      const workingHours = schedule?.workingHours || {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' }
      };

      // Determinar especializations (placeholder - implementar baseado em dados reais)
      const specializations = this.extractSpecializations(agent);

      return {
        agentId: agent.id,
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          role: agent.role,
          isActive: agent.isActive,
          companyId: agent.companyId,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt
        },
        currentLeads,
        avgResponseTime,
        conversionRate,
        lastAssignedAt: todayLeads?.[0]?.createdAt ? new Date(todayLeads[0].createdAt) : null,
        specializations,
        maxDailyLeads: schedule?.maxDailyAppointments || ASSIGNMENT_CONFIG.maxDailyAssignments,
        todayAssignedLeads,
        isOnline,
        workingHours: {
          start: '09:00',
          end: '18:00',
          timezone: schedule?.timezone || 'America/Sao_Paulo'
        },
        priority: this.calculateAgentPriority(agent, conversionRate, avgResponseTime)
      };

    } catch (error) {
      console.error(`Erro ao calcular workload do agente ${agent.id}:`, error);
      
      // Retornar dados básicos em caso de erro
      return {
        agentId: agent.id,
        agent: agent,
        currentLeads: 0,
        avgResponseTime: 24,
        conversionRate: 0.1,
        lastAssignedAt: null,
        specializations: [],
        maxDailyLeads: ASSIGNMENT_CONFIG.maxDailyAssignments,
        todayAssignedLeads: 0,
        isOnline: false,
        workingHours: { start: '09:00', end: '18:00', timezone: 'America/Sao_Paulo' },
        priority: 5
      };
    }
  }

  // --------------------------------------------------------------------------
  // ESTRATÉGIAS DE ATRIBUIÇÃO
  // --------------------------------------------------------------------------

  /**
   * Aplicar estratégia de atribuição selecionada
   */
  private async applyAssignmentStrategy(
    agents: AgentWorkload[],
    criteria: AssignmentCriteria,
    strategy: AssignmentStrategy
  ): Promise<AssignmentResult> {
    
    switch (strategy) {
      case AssignmentStrategy.ROUND_ROBIN:
        return this.roundRobinAssignment(agents, criteria);
      
      case AssignmentStrategy.LOAD_BALANCED:
        return this.loadBalancedAssignment(agents, criteria);
      
      case AssignmentStrategy.PERFORMANCE_BASED:
        return this.performanceBasedAssignment(agents, criteria);
      
      case AssignmentStrategy.SPECIALIZATION:
        return this.specializationBasedAssignment(agents, criteria);
      
      case AssignmentStrategy.HYBRID:
      default:
        return this.hybridAssignment(agents, criteria);
    }
  }

  /**
   * Atribuição round-robin (distribuição circular)
   */
  private roundRobinAssignment(
    agents: AgentWorkload[],
    criteria: AssignmentCriteria
  ): AssignmentResult {
    const history = this.assignmentHistory.get(criteria.companyId) || [];
    
    // Encontrar próximo agente na rotação
    let nextAgent = agents[0];
    
    if (history.length > 0) {
      const lastAssignedId = history[history.length - 1];
      const lastIndex = agents.findIndex(a => a.agentId === lastAssignedId);
      const nextIndex = (lastIndex + 1) % agents.length;
      nextAgent = agents[nextIndex];
    }

    return {
      assignedAgentId: nextAgent.agentId,
      assignedAgent: nextAgent.agent,
      assignmentScore: 75, // Score fixo para round-robin
      assignmentReason: 'Atribuição por rotação circular (Round Robin)',
      alternativeAgents: agents
        .filter(a => a.agentId !== nextAgent.agentId)
        .slice(0, 3)
        .map(a => ({
          agentId: a.agentId,
          score: 70,
          reason: 'Próximo na rotação'
        }))
    };
  }

  /**
   * Atribuição baseada em carga de trabalho
   */
  private loadBalancedAssignment(
    agents: AgentWorkload[],
    criteria: AssignmentCriteria
  ): AssignmentResult {
    // Ordenar por menor carga de trabalho
    const sortedAgents = [...agents].sort((a, b) => {
      const loadA = a.currentLeads + (a.todayAssignedLeads * 0.5);
      const loadB = b.currentLeads + (b.todayAssignedLeads * 0.5);
      return loadA - loadB;
    });

    const selectedAgent = sortedAgents[0];
    const currentLoad = selectedAgent.currentLeads + (selectedAgent.todayAssignedLeads * 0.5);
    const maxLoad = ASSIGNMENT_CONFIG.maxLeadsPerAgent;
    const score = Math.max(20, 100 - ((currentLoad / maxLoad) * 80));

    return {
      assignedAgentId: selectedAgent.agentId,
      assignedAgent: selectedAgent.agent,
      assignmentScore: Math.round(score),
      assignmentReason: `Atribuição por menor carga de trabalho (${selectedAgent.currentLeads} leads ativos)`,
      alternativeAgents: sortedAgents
        .slice(1, 4)
        .map(a => ({
          agentId: a.agentId,
          score: Math.round(Math.max(20, 100 - (((a.currentLeads + a.todayAssignedLeads * 0.5) / maxLoad) * 80))),
          reason: `${a.currentLeads} leads ativos`
        }))
    };
  }

  /**
   * Atribuição baseada em performance
   */
  private performanceBasedAssignment(
    agents: AgentWorkload[],
    criteria: AssignmentCriteria
  ): AssignmentResult {
    // Calcular score de performance
    const agentsWithScore = agents.map(agent => ({
      ...agent,
      performanceScore: this.calculatePerformanceScore(agent)
    }));

    // Ordenar por melhor performance
    const sortedAgents = agentsWithScore.sort((a, b) => b.performanceScore - a.performanceScore);
    const selectedAgent = sortedAgents[0];

    return {
      assignedAgentId: selectedAgent.agentId,
      assignedAgent: selectedAgent.agent,
      assignmentScore: Math.round(selectedAgent.performanceScore),
      assignmentReason: `Atribuição por alta performance (${Math.round(selectedAgent.conversionRate * 100)}% conversão)`,
      alternativeAgents: sortedAgents
        .slice(1, 4)
        .map(a => ({
          agentId: a.agentId,
          score: Math.round(a.performanceScore),
          reason: `${Math.round(a.conversionRate * 100)}% conversão`
        }))
    };
  }

  /**
   * Atribuição baseada em especialização
   */
  private specializationBasedAssignment(
    agents: AgentWorkload[],
    criteria: AssignmentCriteria
  ): AssignmentResult {
    // Calcular score de especialização
    const agentsWithScore = agents.map(agent => ({
      ...agent,
      specializationScore: this.calculateSpecializationScore(agent, criteria)
    }));

    // Ordenar por melhor especialização
    const sortedAgents = agentsWithScore.sort((a, b) => b.specializationScore - a.specializationScore);
    const selectedAgent = sortedAgents[0];

    const specializationMatch = this.getSpecializationMatch(selectedAgent, criteria);

    return {
      assignedAgentId: selectedAgent.agentId,
      assignedAgent: selectedAgent.agent,
      assignmentScore: Math.round(selectedAgent.specializationScore),
      assignmentReason: `Atribuição por especialização: ${specializationMatch}`,
      alternativeAgents: sortedAgents
        .slice(1, 4)
        .map(a => ({
          agentId: a.agentId,
          score: Math.round(a.specializationScore),
          reason: this.getSpecializationMatch(a, criteria)
        }))
    };
  }

  /**
   * Atribuição híbrida (combinação de todos os critérios)
   */
  private hybridAssignment(
    agents: AgentWorkload[],
    criteria: AssignmentCriteria
  ): AssignmentResult {
    const config = ASSIGNMENT_CONFIG;
    
    // Calcular score híbrido para cada agente
    const agentsWithScore = agents.map(agent => {
      const performanceScore = this.calculatePerformanceScore(agent);
      const workloadScore = this.calculateWorkloadScore(agent);
      const specializationScore = this.calculateSpecializationScore(agent, criteria);
      const availabilityScore = this.calculateAvailabilityScore(agent);
      
      // Score ponderado
      const hybridScore = 
        performanceScore * (config.conversionRateWeight + config.responseTimeWeight) +
        workloadScore * config.workloadWeight +
        specializationScore * config.specializationWeight +
        availabilityScore * config.availabilityWeight;

      // Aplicar bônus e penalizações
      let finalScore = hybridScore;
      
      if (agent.isOnline) {
        finalScore += config.onlineBonusScore;
      }
      
      if (this.isInWorkingHours(agent)) {
        finalScore += 5;
      } else {
        finalScore += config.offlineTimePenaltyScore;
      }
      
      if (agent.currentLeads > agent.maxDailyLeads * 0.8) {
        finalScore += config.overloadPenaltyScore;
      }
      
      return {
        ...agent,
        hybridScore: Math.max(0, finalScore)
      };
    });

    // Ordenar por melhor score híbrido
    const sortedAgents = agentsWithScore.sort((a, b) => b.hybridScore - a.hybridScore);
    const selectedAgent = sortedAgents[0];

    const reasonParts = [];
    if (selectedAgent.isOnline) reasonParts.push('online');
    if (selectedAgent.conversionRate > 0.3) reasonParts.push('alta conversão');
    if (selectedAgent.currentLeads < 10) reasonParts.push('baixa carga');
    if (selectedAgent.specializations.length > 0) reasonParts.push('especialização');

    const reason = reasonParts.length > 0 
      ? `Melhor match geral: ${reasonParts.join(', ')}`
      : 'Melhor opção disponível baseada em critérios múltiplos';

    return {
      assignedAgentId: selectedAgent.agentId,
      assignedAgent: selectedAgent.agent,
      assignmentScore: Math.round(selectedAgent.hybridScore),
      assignmentReason: reason,
      alternativeAgents: sortedAgents
        .slice(1, 4)
        .map(a => ({
          agentId: a.agentId,
          score: Math.round(a.hybridScore),
          reason: `Score híbrido: ${Math.round(a.hybridScore)}`
        }))
    };
  }

  // --------------------------------------------------------------------------
  // CÁLCULOS DE SCORES
  // --------------------------------------------------------------------------

  private calculatePerformanceScore(agent: AgentWorkload): number {
    const conversionScore = agent.conversionRate * 100;
    const responseScore = Math.max(0, 100 - (agent.avgResponseTime * 2));
    return (conversionScore + responseScore) / 2;
  }

  private calculateWorkloadScore(agent: AgentWorkload): number {
    const maxLeads = ASSIGNMENT_CONFIG.maxLeadsPerAgent;
    const currentLoad = agent.currentLeads + (agent.todayAssignedLeads * 0.5);
    return Math.max(0, 100 - ((currentLoad / maxLeads) * 100));
  }

  private calculateSpecializationScore(agent: AgentWorkload, criteria: AssignmentCriteria): number {
    let score = 50; // Score base
    
    if (criteria.propertyType && agent.specializations.includes(criteria.propertyType)) {
      score += 30;
    }
    
    if (criteria.location && agent.specializations.includes(criteria.location)) {
      score += 20;
    }
    
    if (criteria.budget && criteria.budget >= 500000 && agent.specializations.includes('HIGH_VALUE')) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  private calculateAvailabilityScore(agent: AgentWorkload): number {
    let score = 0;
    
    if (agent.isOnline) score += 40;
    if (this.isInWorkingHours(agent)) score += 40;
    if (agent.todayAssignedLeads < agent.maxDailyLeads * 0.8) score += 20;
    
    return score;
  }

  private calculateAgentPriority(agent: any, conversionRate: number, avgResponseTime: number): number {
    let priority = 5; // Base
    
    if (conversionRate > 0.4) priority += 2;
    if (avgResponseTime < 2) priority += 1;
    if (agent.role === 'ADMIN') priority += 1;
    
    return Math.min(10, Math.max(1, priority));
  }

  // --------------------------------------------------------------------------
  // UTILITÁRIOS
  // --------------------------------------------------------------------------

  private calculateAverageResponseTime(activities: any[]): number {
    if (activities.length === 0) return 24; // Default 24h
    
    // Simplificado - implementar lógica real baseada em timestamps
    return Math.random() * 8 + 1; // 1-9 horas (placeholder)
  }

  private calculateConversionRate(agentId: string, closedDeals: number): number {
    // Simplificado - implementar cálculo real baseado em histórico
    return Math.min(1, Math.max(0.05, (closedDeals / 20) + (Math.random() * 0.3)));
  }

  private extractSpecializations(agent: any): string[] {
    // Placeholder - implementar baseado em dados reais do agente
    const possibleSpecializations = ['APARTMENT', 'HOUSE', 'COMMERCIAL', 'HIGH_VALUE', 'CENTRO', 'ZONA_SUL'];
    return possibleSpecializations.filter(() => Math.random() > 0.7);
  }

  private isInWorkingHours(agent: AgentWorkload): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(agent.workingHours.start.split(':')[0]);
    const endHour = parseInt(agent.workingHours.end.split(':')[0]);
    
    return currentHour >= startHour && currentHour < endHour;
  }

  private getSpecializationMatch(agent: AgentWorkload, criteria: AssignmentCriteria): string {
    const matches = [];
    
    if (criteria.propertyType && agent.specializations.includes(criteria.propertyType)) {
      matches.push(`tipo ${criteria.propertyType}`);
    }
    
    if (criteria.location && agent.specializations.includes(criteria.location)) {
      matches.push(`região ${criteria.location}`);
    }
    
    return matches.length > 0 ? matches.join(', ') : 'especialização geral';
  }

  // --------------------------------------------------------------------------
  // FALLBACK E RECUPERAÇÃO
  // --------------------------------------------------------------------------

  private async fallbackAssignment(companyId: string): Promise<AssignmentResult> {
    try {
      // Buscar admin da empresa como fallback
      const { data: admin } = await supabase
        .from('User')
        .select('*')
        .eq('companyId', companyId)
        .eq('role', 'ADMIN')
        .eq('isActive', true)
        .limit(1)
        .single();

      if (admin) {
        return {
          assignedAgentId: admin.id,
          assignedAgent: admin,
          assignmentScore: 60,
          assignmentReason: 'Atribuição de fallback para administrador',
          alternativeAgents: []
        };
      }

      throw new Error('Nenhum administrador disponível para fallback');
    } catch (error) {
      console.error('Erro no fallback assignment:', error);
      throw new Error('Falha completa na atribuição automática');
    }
  }

  // --------------------------------------------------------------------------
  // GERENCIAMENTO DE HISTÓRICO E CACHE
  // --------------------------------------------------------------------------

  private async recordAssignment(companyId: string, agentId: string): Promise<void> {
    const history = this.assignmentHistory.get(companyId) || [];
    history.push(agentId);
    
    // Manter apenas os últimos 100 assignments
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.assignmentHistory.set(companyId, history);
  }

  private invalidateWorkloadCache(companyId: string): void {
    this.workloadCache.delete(`workload_${companyId}`);
  }

  // --------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS PARA GERENCIAMENTO
  // --------------------------------------------------------------------------

  /**
   * Forçar recálculo de workload para uma empresa
   */
  public async refreshWorkload(companyId: string): Promise<AgentWorkload[]> {
    this.invalidateWorkloadCache(companyId);
    return this.getAvailableAgents(companyId);
  }

  /**
   * Obter estatísticas de atribuição
   */
  public getAssignmentStats(companyId: string) {
    const history = this.assignmentHistory.get(companyId) || [];
    const agentCounts = history.reduce((acc, agentId) => {
      acc[agentId] = (acc[agentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAssignments: history.length,
      assignmentsByAgent: agentCounts,
      lastAssignments: history.slice(-10)
    };
  }

  /**
   * Configurar estratégia padrão para uma empresa
   */
  public setDefaultStrategy(companyId: string, strategy: AssignmentStrategy): void {
    // Implementar persistência da estratégia padrão
    localStorage.setItem(`assignment_strategy_${companyId}`, strategy);
  }
}

// ============================================================================
// INSTÂNCIA E EXPORTAÇÃO
// ============================================================================

export const leadAssignmentService = new LeadAssignmentService();
export default leadAssignmentService;

export {
  AssignmentStrategy,
  type AssignmentCriteria,
  type AssignmentResult,
  type AgentWorkload
};