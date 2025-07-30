// ===================================================================
// PIPELINE SERVICE - ImobiPRO Dashboard
// ===================================================================
// Serviço completo para gestão de funil de vendas com operações CRUD,
// métricas avançadas, automações e integração com outros módulos

import { supabase } from '@/integrations/supabase/client';
import { 
  Deal, 
  DealStage, 
  DealStatus,
  DealStageHistory,
  DealActivity,
  DealActivityType,
  PipelineMetrics,
  PipelineFilters,
  CreateDealData,
  UpdateDealData,
  MoveDealData,
  AddDealActivityData,
  DEAL_STAGE_CONFIGS,
  PipelineReportData
} from '@/types/pipeline';

// ===================================================================
// CONSTANTES E CONFIGURAÇÕES
// ===================================================================

const DEALS_TABLE = 'Deal';
const DEAL_STAGE_HISTORY_TABLE = 'DealStageHistory';
const DEAL_ACTIVITY_TABLE = 'DealActivity';
const CONTACTS_TABLE = 'Contact';
const USERS_TABLE = 'User';
const PROPERTIES_TABLE = 'Property';

// Cache para otimização de consultas frequentes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const metricsCache = new Map<string, { data: any; timestamp: number }>();

// ===================================================================
// OPERAÇÕES CRUD - Gestão básica de deals
// ===================================================================

/**
 * Busca todos os deals com filtros e ordenação
 */
export async function getDeals(
  filters?: PipelineFilters,
  sortBy?: { field: string; direction: 'asc' | 'desc' }
): Promise<Deal[]> {
  try {
    let query = supabase
      .from(DEALS_TABLE)
      .select(`
        *,
        client:Contact!clientId(id, name, email, phone),
        agent:User!agentId(id, name),
        property:Property!propertyId(id, title, address)
      `);

    // Aplicar filtros
    if (filters?.stage) {
      query = query.eq('currentStage', filters.stage);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.agentId) {
      query = query.eq('agentId', filters.agentId);
    }
    
    if (filters?.minValue) {
      query = query.gte('value', filters.minValue);
    }
    
    if (filters?.maxValue) {
      query = query.lte('value', filters.maxValue);
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('createdAt', filters.dateRange.start)
        .lte('createdAt', filters.dateRange.end);
    }
    
    if (filters?.searchTerm) {
      query = query.ilike('title', `%${filters.searchTerm}%`);
    }

    // Aplicar ordenação
    if (sortBy) {
      query = query.order(sortBy.field, { ascending: sortBy.direction === 'asc' });
    } else {
      query = query.order('updatedAt', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar deals:', error);
      throw new Error(`Erro ao buscar deals: ${error.message}`);
    }

    return data.map(transformDealData);
  } catch (error) {
    console.error('Erro no getDeals:', error);
    throw error;
  }
}

/**
 * Busca um deal específico por ID com dados completos
 */
export async function getDealById(id: string): Promise<Deal | null> {
  try {
    const { data, error } = await supabase
      .from(DEALS_TABLE)
      .select(`
        *,
        client:Contact!clientId(id, name, email, phone),
        agent:User!agentId(id, name),
        property:Property!propertyId(id, title, address)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Erro ao buscar deal:', error);
      throw new Error(`Erro ao buscar deal: ${error.message}`);
    }

    return transformDealData(data);
  } catch (error) {
    console.error('Erro no getDealById:', error);
    throw error;
  }
}

/**
 * Cria um novo deal
 */
export async function createDeal(dealData: CreateDealData): Promise<Deal> {
  try {
    // Calcular probabilidade baseada no estágio inicial
    const stage = dealData.stage || DealStage.LEAD_IN;
    const stageConfig = DEAL_STAGE_CONFIGS[stage];
    const probability = dealData.probability || stageConfig.probability.default;

    const newDeal = {
      ...dealData,
      currentStage: stage,
      probability,
      daysInStage: 0,
      status: DealStatus.ACTIVE
    };

    const { data, error } = await supabase
      .from(DEALS_TABLE)
      .insert([newDeal])
      .select(`
        *,
        client:Contact!clientId(id, name, email, phone),
        agent:User!agentId(id, name),
        property:Property!propertyId(id, title, address)
      `)
      .single();

    if (error) {
      console.error('Erro ao criar deal:', error);
      throw new Error(`Erro ao criar deal: ${error.message}`);
    }

    // Registrar atividade de criação
    await addDealActivity({
      dealId: data.id,
      type: DealActivityType.STAGE_CHANGED,
      description: `Deal criado no estágio ${stageConfig.name}`,
      metadata: {
        fromStage: null,
        toStage: stage,
        isInitial: true
      }
    });

    // Executar automações de entrada no estágio
    await executeStageAutomations(data.id, stage, 'onEnter');

    return transformDealData(data);
  } catch (error) {
    console.error('Erro no createDeal:', error);
    throw error;
  }
}

/**
 * Atualiza um deal existente
 */
export async function updateDeal(id: string, updateData: UpdateDealData): Promise<Deal> {
  try {
    const { data, error } = await supabase
      .from(DEALS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:Contact!clientId(id, name, email, phone),
        agent:User!agentId(id, name),
        property:Property!propertyId(id, title, address)
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar deal:', error);
      throw new Error(`Erro ao atualizar deal: ${error.message}`);
    }

    // Registrar atividade de atualização
    await addDealActivity({
      dealId: id,
      type: DealActivityType.NOTE_ADDED,
      description: 'Deal atualizado',
      metadata: updateData
    });

    return transformDealData(data);
  } catch (error) {
    console.error('Erro no updateDeal:', error);
    throw error;
  }
}

/**
 * Remove um deal (soft delete)
 */
export async function deleteDeal(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(DEALS_TABLE)
      .update({ status: DealStatus.CANCELLED })
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar deal:', error);
      throw new Error(`Erro ao deletar deal: ${error.message}`);
    }

    // Registrar atividade de cancelamento
    await addDealActivity({
      dealId: id,
      type: DealActivityType.NOTE_ADDED,
      description: 'Deal cancelado',
      metadata: { action: 'cancelled' }
    });
  } catch (error) {
    console.error('Erro no deleteDeal:', error);
    throw error;
  }
}

// ===================================================================
// OPERAÇÕES DE ESTÁGIO - Movimentação no funil
// ===================================================================

/**
 * Move um deal para um novo estágio
 */
export async function moveDeal(moveData: MoveDealData): Promise<Deal> {
  try {
    const { dealId, fromStage, toStage, reason } = moveData;

    // Validar se a transição é permitida
    const fromConfig = DEAL_STAGE_CONFIGS[fromStage];
    if (!fromConfig.nextStages.includes(toStage) && toStage !== DealStage.LOST) {
      throw new Error(`Transição de ${fromStage} para ${toStage} não é permitida`);
    }

    // Calcular nova probabilidade
    const toConfig = DEAL_STAGE_CONFIGS[toStage];
    const newProbability = toConfig.probability.default;

    // Calcular dias no estágio anterior
    const deal = await getDealById(dealId);
    if (!deal) throw new Error('Deal não encontrado');

    const stageHistory = await getDealStageHistory(dealId);
    const lastStageChange = stageHistory[0];
    const daysInPreviousStage = lastStageChange 
      ? Math.floor((Date.now() - new Date(lastStageChange.changedAt).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    // Atualizar o deal
    const updateData: any = {
      currentStage: toStage,
      probability: newProbability,
      daysInStage: 0,
      updatedAt: new Date().toISOString()
    };

    // Se fechado, atualizar status e data
    if (toStage === DealStage.WON || toStage === DealStage.LOST) {
      updateData.status = DealStatus.CLOSED;
      updateData.closedAt = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(DEALS_TABLE)
      .update(updateData)
      .eq('id', dealId)
      .select(`
        *,
        client:Contact!clientId(id, name, email, phone),
        agent:User!agentId(id, name),
        property:Property!propertyId(id, title, address)
      `)
      .single();

    if (error) {
      console.error('Erro ao mover deal:', error);
      throw new Error(`Erro ao mover deal: ${error.message}`);
    }

    // Registrar no histórico de estágios
    await addStageHistoryEntry({
      dealId,
      fromStage,
      toStage,
      reason,
      durationInPreviousStage: daysInPreviousStage
    });

    // Registrar atividade
    await addDealActivity({
      dealId,
      type: DealActivityType.STAGE_CHANGED,
      description: `Deal movido de ${fromConfig.name} para ${toConfig.name}`,
      metadata: {
        fromStage,
        toStage,
        reason,
        daysInPreviousStage
      }
    });

    // Executar automações
    await executeStageAutomations(dealId, fromStage, 'onExit');
    await executeStageAutomations(dealId, toStage, 'onEnter');

    return transformDealData(data);
  } catch (error) {
    console.error('Erro no moveDeal:', error);
    throw error;
  }
}

/**
 * Busca histórico de estágios de um deal
 */
export async function getDealStageHistory(dealId: string): Promise<DealStageHistory[]> {
  try {
    const { data, error } = await supabase
      .from(DEAL_STAGE_HISTORY_TABLE)
      .select(`
        *,
        changedByUser:User!changedBy(name)
      `)
      .eq('dealId', dealId)
      .order('changedAt', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico de estágios:', error);
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }

    return data.map(item => ({
      ...item,
      changedByName: item.changedByUser?.name
    }));
  } catch (error) {
    console.error('Erro no getDealStageHistory:', error);
    throw error;
  }
}

/**
 * Adiciona entrada no histórico de estágios
 */
async function addStageHistoryEntry(data: {
  dealId: string;
  fromStage: DealStage;
  toStage: DealStage;
  reason?: string;
  durationInPreviousStage?: number;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from(DEAL_STAGE_HISTORY_TABLE)
      .insert([{
        ...data,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user-id' // TODO: Pegar do contexto de autenticação
      }]);

    if (error) {
      console.error('Erro ao adicionar histórico de estágio:', error);
      throw new Error(`Erro ao adicionar histórico: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro no addStageHistoryEntry:', error);
    throw error;
  }
}

// ===================================================================
// ATIVIDADES - Gestão de atividades do deal
// ===================================================================

/**
 * Adiciona uma atividade ao deal
 */
export async function addDealActivity(activityData: AddDealActivityData): Promise<DealActivity> {
  try {
    const newActivity = {
      ...activityData,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user-id' // TODO: Pegar do contexto de autenticação
    };

    const { data, error } = await supabase
      .from(DEAL_ACTIVITY_TABLE)
      .insert([newActivity])
      .select(`
        *,
        createdByUser:User!createdBy(name)
      `)
      .single();

    if (error) {
      console.error('Erro ao adicionar atividade:', error);
      throw new Error(`Erro ao adicionar atividade: ${error.message}`);
    }

    return {
      ...data,
      createdByName: data.createdByUser?.name
    };
  } catch (error) {
    console.error('Erro no addDealActivity:', error);
    throw error;
  }
}

/**
 * Busca atividades de um deal
 */
export async function getDealActivities(dealId: string): Promise<DealActivity[]> {
  try {
    const { data, error } = await supabase
      .from(DEAL_ACTIVITY_TABLE)
      .select(`
        *,
        createdByUser:User!createdBy(name)
      `)
      .eq('dealId', dealId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atividades:', error);
      throw new Error(`Erro ao buscar atividades: ${error.message}`);
    }

    return data.map(item => ({
      ...item,
      createdByName: item.createdByUser?.name
    }));
  } catch (error) {
    console.error('Erro no getDealActivities:', error);
    throw error;
  }
}

// ===================================================================
// MÉTRICAS E ANALYTICS - Dashboard e relatórios
// ===================================================================

/**
 * Calcula métricas do pipeline
 */
export async function getPipelineMetrics(
  agentId?: string,
  dateRange?: { start: string; end: string }
): Promise<PipelineMetrics> {
  try {
    // Verificar cache
    const cacheKey = `metrics_${agentId || 'all'}_${dateRange?.start || ''}_${dateRange?.end || ''}`;
    const cached = metricsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    let query = supabase.from(DEALS_TABLE).select('*');
    
    if (agentId) {
      query = query.eq('agentId', agentId);
    }
    
    if (dateRange) {
      query = query
        .gte('createdAt', dateRange.start)
        .lte('createdAt', dateRange.end);
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error('Erro ao calcular métricas:', error);
      throw new Error(`Erro ao calcular métricas: ${error.message}`);
    }

    // Calcular métricas
    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const averageDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;
    
    const wonDeals = deals.filter(deal => deal.currentStage === DealStage.WON);
    const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;

    // Métricas por estágio
    const dealsByStage = {} as Record<DealStage, number>;
    const valueByStage = {} as Record<DealStage, number>;
    
    Object.values(DealStage).forEach(stage => {
      const stageDeals = deals.filter(deal => deal.currentStage === stage);
      dealsByStage[stage] = stageDeals.length;
      valueByStage[stage] = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    });

    // Métricas de tempo (placeholder - necessita implementação mais complexa)
    const averageTimeInStage = {} as Record<DealStage, number>;
    Object.values(DealStage).forEach(stage => {
      averageTimeInStage[stage] = 7; // Placeholder: 7 dias médio
    });

    // Métricas mensais
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyDeals = deals.filter(deal => 
      new Date(deal.closedAt || deal.createdAt) >= startOfMonth &&
      deal.currentStage === DealStage.WON
    );
    
    const monthlyClosedDeals = monthlyDeals.length;
    const monthlyRevenue = monthlyDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    // Receita projetada baseada na probabilidade
    const activeDeals = deals.filter(deal => deal.status === DealStatus.ACTIVE);
    const projectedRevenue = activeDeals.reduce((sum, deal) => {
      return sum + ((deal.value || 0) * (deal.probability || 0) / 100);
    }, 0);

    const metrics: PipelineMetrics = {
      totalDeals,
      totalValue,
      averageDealValue,
      conversionRate,
      dealsByStage,
      valueByStage,
      averageTimeInStage,
      averageCycleTime: 30, // Placeholder
      monthlyClosedDeals,
      monthlyRevenue,
      projectedRevenue,
      trends: {
        deals: 0, // Placeholder - necessita comparação com período anterior
        revenue: 0,
        conversion: 0
      }
    };

    // Salvar no cache
    metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });

    return metrics;
  } catch (error) {
    console.error('Erro no getPipelineMetrics:', error);
    throw error;
  }
}

/**
 * Gera dados para relatório completo do pipeline
 */
export async function generatePipelineReport(
  agentId?: string,
  dateRange?: { start: string; end: string }
): Promise<PipelineReportData> {
  try {
    const metrics = await getPipelineMetrics(agentId, dateRange);
    
    // TODO: Implementar cálculos mais detalhados para:
    // - Top performers
    // - Conversion funnel
    // - Loss analysis
    
    const reportData: PipelineReportData = {
      period: dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      metrics,
      topPerformers: [], // Placeholder
      conversionFunnel: [], // Placeholder
      lossAnalysis: [] // Placeholder
    };

    return reportData;
  } catch (error) {
    console.error('Erro no generatePipelineReport:', error);
    throw error;
  }
}

// ===================================================================
// AUTOMAÇÕES - Sistema de automações baseadas em estágios
// ===================================================================

/**
 * Executa automações de um estágio
 */
async function executeStageAutomations(
  dealId: string, 
  stage: DealStage, 
  event: 'onEnter' | 'onExit'
): Promise<void> {
  try {
    const stageConfig = DEAL_STAGE_CONFIGS[stage];
    const automations = stageConfig.automations?.[event];
    
    if (!automations || automations.length === 0) return;

    // TODO: Implementar execução das automações
    // Por enquanto, apenas log
    console.log(`Executando automações ${event} para deal ${dealId} no estágio ${stage}:`, automations);
    
    // Registrar que automações foram executadas
    await addDealActivity({
      dealId,
      type: DealActivityType.NOTE_ADDED,
      description: `Automações ${event} executadas para estágio ${stageConfig.name}`,
      metadata: {
        stage,
        event,
        automations
      }
    });
  } catch (error) {
    console.error(`Erro ao executar automações ${event} para estágio ${stage}:`, error);
    // Não propagar o erro para não quebrar o fluxo principal
  }
}

// ===================================================================
// UTILITÁRIOS - Funções auxiliares
// ===================================================================

/**
 * Transforma dados do banco para o formato da interface
 */
function transformDealData(data: any): Deal {
  return {
    id: data.id,
    title: data.title,
    value: data.value,
    stage: data.currentStage || data.stage, // Compatibilidade com dados existentes
    status: data.status,
    expectedCloseDate: data.expectedCloseDate,
    closedAt: data.closedAt,
    propertyId: data.propertyId,
    clientId: data.clientId,
    agentId: data.agentId,
    
    // Campos estendidos
    currentStage: data.currentStage || data.stage,
    probability: data.probability || 0,
    expectedValue: data.expectedValue,
    daysInStage: data.daysInStage || 0,
    nextAction: data.nextAction,
    nextActionDate: data.nextActionDate,
    
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    
    // Relacionamentos
    client: data.client,
    agent: data.agent,
    property: data.property
  };
}

/**
 * Calcula dias entre duas datas
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Calcula cor de probabilidade baseada no valor
 */
export function getProbabilityColor(probability: number): string {
  if (probability >= 80) return '#10B981'; // Verde
  if (probability >= 60) return '#F59E0B'; // Amarelo
  if (probability >= 40) return '#8B5CF6'; // Roxo
  if (probability >= 20) return '#3B82F6'; // Azul
  return '#64748B'; // Cinza
}

// ===================================================================
// MOCK DATA - Para desenvolvimento e testes
// ===================================================================

/**
 * Gera dados mock para desenvolvimento
 */
export function generateMockDeals(count: number = 10): Deal[] {
  const mockDeals: Deal[] = [];
  const stages = Object.values(DealStage);
  const statuses = [DealStatus.ACTIVE, DealStatus.CLOSED];
  
  for (let i = 0; i < count; i++) {
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const stageConfig = DEAL_STAGE_CONFIGS[stage];
    
    mockDeals.push({
      id: `mock-deal-${i + 1}`,
      title: `Deal Mock ${i + 1}`,
      value: Math.floor(Math.random() * 2000000) + 100000,
      stage,
      status: stage === DealStage.WON || stage === DealStage.LOST ? DealStatus.CLOSED : DealStatus.ACTIVE,
      expectedCloseDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      closedAt: stage === DealStage.WON || stage === DealStage.LOST ? new Date().toISOString() : undefined,
      clientId: `mock-client-${i + 1}`,
      agentId: 'mock-agent-1',
      
      currentStage: stage,
      probability: stageConfig.probability.default + Math.floor(Math.random() * 20) - 10,
      daysInStage: Math.floor(Math.random() * 30),
      nextAction: `Próxima ação para deal ${i + 1}`,
      nextActionDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      
      client: {
        id: `mock-client-${i + 1}`,
        name: `Cliente Mock ${i + 1}`,
        email: `cliente${i + 1}@mock.com`,
        phone: `(11) 9999-${String(i + 1).padStart(4, '0')}`
      },
      agent: {
        id: 'mock-agent-1',
        name: 'Agente Mock'
      }
    });
  }
  
  return mockDeals;
}