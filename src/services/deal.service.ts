import { BaseService } from './base.service'
import { supabase, type Tables } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// Tipos específicos para Deal
export type Deal = Tables['Deal']['Row']
export type DealInsert = Tables['Deal']['Insert']
export type DealUpdate = Tables['Deal']['Update']

// Filtros específicos para negociações
export interface DealFilters {
  stage?: Deal['stage']
  status?: string
  agentId?: string
  clientId?: string
  propertyId?: string
  minValue?: number
  maxValue?: number
  expectedCloseDateFrom?: string
  expectedCloseDateTo?: string
  search?: string
}

// Estatísticas de negociações
export interface DealStats {
  total: number
  totalValue: number
  avgValue: number
  avgDaysToClose: number
  byStage: Record<string, { count: number; value: number }>
  conversionRate: number
  winRate: number
  lostRate: number
  activeDeals: number
  expectedRevenue: number
  closedThisMonth: { count: number; value: number }
  velocity: number // deals fechados por mês
}

// Histórico de estágio
export interface StageHistory {
  fromStage: Deal['stage']
  toStage: Deal['stage']
  changedAt: string
  changedBy: string
  daysInStage: number
  reason?: string
}

// Previsão de fechamento
export interface DealForecast {
  dealId: string
  currentStage: Deal['stage']
  expectedCloseDate: string
  probability: number
  expectedValue: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
}

class DealServiceClass extends BaseService<'Deal'> {
  constructor() {
    super('Deal', 'deal')
  }

  // Override findAll para incluir relacionamentos
  async findAll(options?: any) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl),
          client:Contact!clientId(id, name, email, phone, leadStage),
          property:Property!propertyId(id, title, address, price, status),
          stageHistory:DealStageHistory(count),
          activities:LeadActivity(count)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters as DealFilters
        
        if (filters.stage) query = query.eq('stage', filters.stage)
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.agentId) query = query.eq('agentId', filters.agentId)
        if (filters.clientId) query = query.eq('clientId', filters.clientId)
        if (filters.propertyId) query = query.eq('propertyId', filters.propertyId)
        if (filters.minValue !== undefined) query = query.gte('value', filters.minValue)
        if (filters.maxValue !== undefined) query = query.lte('value', filters.maxValue)
        
        // Filtros de data
        if (filters.expectedCloseDateFrom) {
          query = query.gte('expectedCloseDate', filters.expectedCloseDateFrom)
        }
        if (filters.expectedCloseDateTo) {
          query = query.lte('expectedCloseDate', filters.expectedCloseDateTo)
        }
        
        // Busca textual
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: valor e data esperada
        query = query
          .order('value', { ascending: false })
          .order('expectedCloseDate', { ascending: true })
      }

      // Aplicar paginação
      if (options?.limit) {
        query = query.limit(options.limit)
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1)
        }
      }

      const { data, error, count } = await query

      if (error) throw this.handleError(error)

      // Calcular probabilidade para cada deal
      if (data) {
        data.forEach(deal => {
          deal.probability = this.calculateProbability(deal.stage)
          deal.expectedValue = deal.value * (deal.probability / 100)
        })
      }

      return { data, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar por ID com histórico completo
  async findById(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl),
          client:Contact!clientId(
            id, name, email, phone, leadStage,
            company, position, budget
          ),
          property:Property!propertyId(
            id, title, address, price, status,
            area, bedrooms, bathrooms, 
            images:PropertyImage(url, isMain)
          ),
          stageHistory:DealStageHistory(*),
          activities:DealActivity(*)
        `)
        .eq('id', id)
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw this.handleError(error)

      // Adicionar métricas calculadas
      if (data) {
        data.probability = this.calculateProbability(data.stage)
        data.expectedValue = data.value * (data.probability / 100)
        data.daysInPipeline = this.calculateDaysInPipeline(data.createdAt)
        data.velocity = this.calculateVelocity(data.stageHistory)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Mover deal entre estágios
  async moveToStage(id: string, newStage: Deal['stage'], reason?: string) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Buscar deal atual
      const { data: deal } = await this.findById(id)
      if (!deal) throw new Error('Deal not found')

      const oldStage = deal.stage

      // Validar transição de estágio
      if (!this.isValidStageTransition(oldStage, newStage)) {
        throw new Error(`Transição inválida de ${oldStage} para ${newStage}`)
      }

      // Calcular dias no estágio anterior
      const lastStageChange = deal.stageHistory?.slice(-1)[0]
      const daysInStage = lastStageChange 
        ? this.calculateDaysBetween(lastStageChange.changedAt, new Date().toISOString())
        : this.calculateDaysBetween(deal.createdAt, new Date().toISOString())

      // Registrar histórico de estágio
      await supabase.from('DealStageHistory').insert({
        id: crypto.randomUUID(),
        dealId: id,
        fromStage: oldStage,
        toStage: newStage,
        changedAt: new Date().toISOString(),
        changedBy: profile.id,
        reason,
        daysInStage
      })

      // Atualizar deal
      const updateData: DealUpdate = {
        stage: newStage,
        ...(newStage === 'WON' && { 
          closedAt: new Date().toISOString(),
          status: 'CLOSED'
        }),
        ...(newStage === 'LOST' && { 
          closedAt: new Date().toISOString(),
          status: 'CLOSED'
        })
      }

      const { data, error } = await this.update(id, updateData)

      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.DEAL_STAGE_CHANGED, {
        dealId: id,
        oldStage,
        newStage,
        userId: profile.id,
        value: deal.value
      })

      // Eventos específicos para won/lost
      if (newStage === 'WON') {
        EventBus.emit(SystemEvents.DEAL_WON, {
          dealId: id,
          value: deal.value,
          clientId: deal.clientId,
          propertyId: deal.propertyId,
          agentId: deal.agentId
        })
      } else if (newStage === 'LOST') {
        EventBus.emit(SystemEvents.DEAL_LOST, {
          dealId: id,
          value: deal.value,
          reason,
          agentId: deal.agentId
        })
      }

      // Atualizar lead score do contato
      await this.updateContactScore(deal.clientId, newStage)

      // Registrar atividade
      await this.logDealActivity(id, {
        type: 'STAGE_CHANGED',
        description: `Estágio alterado de ${oldStage} para ${newStage}`,
        metadata: { oldStage, newStage, reason }
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar valor do deal
  async updateValue(id: string, newValue: number, reason?: string) {
    try {
      const { data: deal } = await this.findById(id)
      if (!deal) throw new Error('Deal not found')

      const oldValue = deal.value

      const { data, error } = await this.update(id, { value: newValue })

      if (error) throw error

      // Registrar atividade
      await this.logDealActivity(id, {
        type: 'OFFER_MADE',
        description: `Valor alterado de ${oldValue} para ${newValue}`,
        metadata: { oldValue, newValue, reason }
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: DealStats | null; error: Error | null }> {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*')
      baseQuery = await this.applyRLS(baseQuery)
      const { data: allDeals } = await baseQuery

      if (!allDeals || allDeals.length === 0) {
        return {
          data: {
            total: 0,
            totalValue: 0,
            avgValue: 0,
            avgDaysToClose: 0,
            byStage: {},
            conversionRate: 0,
            winRate: 0,
            lostRate: 0,
            activeDeals: 0,
            expectedRevenue: 0,
            closedThisMonth: { count: 0, value: 0 },
            velocity: 0
          },
          error: null
        }
      }

      // Métricas básicas
      const total = allDeals.length
      const totalValue = allDeals.reduce((sum, deal) => sum + Number(deal.value), 0)
      const avgValue = totalValue / total

      // Por estágio
      const stages = ['LEAD_IN', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
      const byStage: Record<string, { count: number; value: number }> = {}
      
      stages.forEach(stage => {
        const dealsInStage = allDeals.filter(d => d.stage === stage)
        byStage[stage] = {
          count: dealsInStage.length,
          value: dealsInStage.reduce((sum, d) => sum + Number(d.value), 0)
        }
      })

      // Taxas
      const closedDeals = allDeals.filter(d => d.stage === 'WON' || d.stage === 'LOST')
      const wonDeals = allDeals.filter(d => d.stage === 'WON')
      const lostDeals = allDeals.filter(d => d.stage === 'LOST')
      
      const conversionRate = total > 0 ? (wonDeals.length / total) * 100 : 0
      const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0
      const lostRate = closedDeals.length > 0 ? (lostDeals.length / closedDeals.length) * 100 : 0

      // Deals ativos e receita esperada
      const activeDeals = allDeals.filter(d => !['WON', 'LOST'].includes(d.stage)).length
      const expectedRevenue = allDeals
        .filter(d => !['WON', 'LOST'].includes(d.stage))
        .reduce((sum, deal) => {
          const probability = this.calculateProbability(deal.stage)
          return sum + (Number(deal.value) * probability / 100)
        }, 0)

      // Fechados este mês
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const closedThisMonth = wonDeals.filter(d => 
        d.closedAt && new Date(d.closedAt) >= thisMonth
      )

      const closedThisMonthStats = {
        count: closedThisMonth.length,
        value: closedThisMonth.reduce((sum, d) => sum + Number(d.value), 0)
      }

      // Tempo médio para fechar
      const wonDealsWithTime = wonDeals.filter(d => d.closedAt)
      const avgDaysToClose = wonDealsWithTime.length > 0
        ? wonDealsWithTime.reduce((sum, deal) => {
            const days = this.calculateDaysBetween(deal.createdAt, deal.closedAt!)
            return sum + days
          }, 0) / wonDealsWithTime.length
        : 0

      // Velocidade (deals fechados por mês)
      const oldestDeal = allDeals.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0]
      
      const monthsSinceStart = oldestDeal 
        ? Math.max(1, this.calculateMonthsBetween(oldestDeal.createdAt, new Date().toISOString()))
        : 1
      
      const velocity = wonDeals.length / monthsSinceStart

      const stats: DealStats = {
        total,
        totalValue,
        avgValue,
        avgDaysToClose,
        byStage,
        conversionRate,
        winRate,
        lostRate,
        activeDeals,
        expectedRevenue,
        closedThisMonth: closedThisMonthStats,
        velocity
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Prever fechamento de deals
  async getForecast(dealId?: string): Promise<{ data: DealForecast[] | null; error: Error | null }> {
    try {
      let deals: Deal[]
      
      if (dealId) {
        const { data } = await this.findById(dealId)
        deals = data ? [data] : []
      } else {
        const { data } = await this.findAll({
          filters: { 
            status: 'ACTIVE'
          }
        })
        deals = data || []
      }

      const forecasts: DealForecast[] = deals
        .filter(deal => !['WON', 'LOST'].includes(deal.stage))
        .map(deal => {
          const probability = this.calculateProbability(deal.stage)
          const expectedValue = deal.value * (probability / 100)
          const daysInPipeline = this.calculateDaysInPipeline(deal.createdAt)
          
          // Calcular risco
          let riskLevel: 'low' | 'medium' | 'high' = 'low'
          const recommendations: string[] = []

          // Risco por tempo no pipeline
          if (daysInPipeline > 90) {
            riskLevel = 'high'
            recommendations.push('Deal está há muito tempo no pipeline')
          } else if (daysInPipeline > 60) {
            riskLevel = 'medium'
            recommendations.push('Considere acelerar o processo de venda')
          }

          // Risco por estágio
          if (deal.stage === 'LEAD_IN' && daysInPipeline > 30) {
            riskLevel = 'high'
            recommendations.push('Lead ainda não qualificado após 30 dias')
          }

          // Risco por data esperada
          if (deal.expectedCloseDate) {
            const daysUntilClose = this.calculateDaysBetween(
              new Date().toISOString(),
              deal.expectedCloseDate
            )
            if (daysUntilClose < 0) {
              riskLevel = 'high'
              recommendations.push('Data de fechamento já passou')
            } else if (daysUntilClose < 7 && deal.stage !== 'NEGOTIATION') {
              riskLevel = 'medium'
              recommendations.push('Próximo do fechamento mas ainda não em negociação')
            }
          }

          // Recomendações por estágio
          const stageRecommendations = {
            LEAD_IN: 'Agende uma reunião de qualificação',
            QUALIFICATION: 'Prepare uma proposta personalizada',
            PROPOSAL: 'Faça follow-up da proposta enviada',
            NEGOTIATION: 'Identifique e resolva objeções finais'
          }

          if (stageRecommendations[deal.stage]) {
            recommendations.push(stageRecommendations[deal.stage])
          }

          return {
            dealId: deal.id,
            currentStage: deal.stage,
            expectedCloseDate: deal.expectedCloseDate || this.calculateExpectedCloseDate(deal),
            probability,
            expectedValue,
            riskLevel,
            recommendations
          }
        })

      return { data: forecasts, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Helpers privados
  private calculateProbability(stage: Deal['stage']): number {
    const probabilities = {
      LEAD_IN: 10,
      QUALIFICATION: 25,
      PROPOSAL: 50,
      NEGOTIATION: 75,
      WON: 100,
      LOST: 0
    }
    return probabilities[stage] || 0
  }

  private calculateDaysInPipeline(createdAt: string): number {
    return this.calculateDaysBetween(createdAt, new Date().toISOString())
  }

  private calculateDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private calculateMonthsBetween(date1: string, date2: string): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
  }

  private calculateVelocity(stageHistory: any[]): number {
    if (!stageHistory || stageHistory.length === 0) return 0
    
    const avgDaysPerStage = stageHistory.reduce((sum, h) => sum + (h.daysInStage || 0), 0) / stageHistory.length
    return avgDaysPerStage
  }

  private calculateExpectedCloseDate(deal: Deal): string {
    // Estimar baseado no estágio atual e tempo médio
    const daysToAdd = {
      LEAD_IN: 60,
      QUALIFICATION: 45,
      PROPOSAL: 30,
      NEGOTIATION: 15,
      WON: 0,
      LOST: 0
    }

    const date = new Date()
    date.setDate(date.getDate() + (daysToAdd[deal.stage] || 30))
    return date.toISOString()
  }

  private isValidStageTransition(from: Deal['stage'], to: Deal['stage']): boolean {
    // Definir transições válidas
    const validTransitions = {
      LEAD_IN: ['QUALIFICATION', 'LOST'],
      QUALIFICATION: ['PROPOSAL', 'LOST'],
      PROPOSAL: ['NEGOTIATION', 'LOST'],
      NEGOTIATION: ['WON', 'LOST', 'PROPOSAL'], // Pode voltar para proposta
      WON: [], // Estado final
      LOST: ['LEAD_IN'] // Pode reabrir
    }

    return validTransitions[from]?.includes(to) || false
  }

  private async updateContactScore(contactId: string, dealStage: Deal['stage']) {
    try {
      // Ajustar score baseado no estágio do deal
      const scoreAdjustments = {
        QUALIFICATION: 10,
        PROPOSAL: 20,
        NEGOTIATION: 30,
        WON: 50,
        LOST: -20
      }

      const adjustment = scoreAdjustments[dealStage]
      if (adjustment) {
        const { data: contact } = await supabase
          .from('Contact')
          .select('leadScore')
          .eq('id', contactId)
          .single()

        if (contact) {
          const newScore = Math.max(0, Math.min(100, contact.leadScore + adjustment))
          await supabase
            .from('Contact')
            .update({ leadScore: newScore })
            .eq('id', contactId)
        }
      }
    } catch (error) {
      console.error('Error updating contact score:', error)
    }
  }

  private async logDealActivity(dealId: string, activity: any) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) return

      await supabase.from('DealActivity').insert({
        id: crypto.randomUUID(),
        dealId,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging deal activity:', error)
    }
  }

  private async getCurrentUserProfile() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null

    const { data: profile } = await supabase
      .from('User')
      .select('*, Company(*)')
      .eq('id', data.user.id)
      .single()

    return profile
  }
}

// Exportar instância única
export const dealService = new DealServiceClass()