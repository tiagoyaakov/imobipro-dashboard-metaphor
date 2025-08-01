import { BaseService } from './base.service'
import { supabase, type Tables } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// Tipos específicos para Contact
export type Contact = Tables['Contact']['Row']
export type ContactInsert = Tables['Contact']['Insert']
export type ContactUpdate = Tables['Contact']['Update']

// Filtros específicos para contatos
export interface ContactFilters {
  category?: Contact['category']
  status?: Contact['status']
  leadStage?: Contact['leadStage']
  minScore?: number
  maxScore?: number
  agentId?: string
  search?: string
  hasAppointments?: boolean
  hasDeals?: boolean
  tags?: string[]
  source?: string
  priority?: string
  isQualified?: boolean
  unsubscribed?: boolean
}

// Estatísticas de contatos
export interface ContactStats {
  total: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
  byStage: Record<string, number>
  avgLeadScore: number
  qualified: number
  converted: number
  lost: number
  activeDeals: number
  scheduledAppointments: number
}

// Atividade de lead
export interface LeadActivity {
  id: string
  type: Tables['LeadActivity']['Row']['type']
  title: string
  description?: string
  metadata?: any
  createdAt: string
}

class ContactServiceClass extends BaseService<'Contact'> {
  constructor() {
    super('Contact', 'contact')
  }

  // Override findAll para incluir relacionamentos
  async findAll(options?: any) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl),
          appointments:Appointment(count),
          deals:Deal(count),
          activities:LeadActivity(count)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters as ContactFilters
        
        if (filters.category) query = query.eq('category', filters.category)
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.leadStage) query = query.eq('leadStage', filters.leadStage)
        if (filters.minScore !== undefined) query = query.gte('leadScore', filters.minScore)
        if (filters.maxScore !== undefined) query = query.lte('leadScore', filters.maxScore)
        if (filters.agentId) query = query.eq('agentId', filters.agentId)
        if (filters.source) query = query.eq('leadSource', filters.source)
        if (filters.priority) query = query.eq('priority', filters.priority)
        if (filters.isQualified !== undefined) query = query.eq('isQualified', filters.isQualified)
        if (filters.unsubscribed !== undefined) query = query.eq('unsubscribed', filters.unsubscribed)
        
        // Filtro por tags (array contains)
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags)
        }
        
        // Busca textual
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: prioridade e score
        query = query
          .order('priority', { ascending: false })
          .order('leadScore', { ascending: false })
          .order('createdAt', { ascending: false })
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

      return { data, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar por ID com relacionamentos completos
  async findById(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl),
          appointments:Appointment(
            id, 
            title, 
            date, 
            status,
            property:Property(id, title, address)
          ),
          deals:Deal(
            id, 
            title, 
            stage, 
            value,
            property:Property(id, title)
          ),
          activities:LeadActivity(*)
        `)
        .eq('id', id)
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw this.handleError(error)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar estágio do lead
  async updateLeadStage(id: string, newStage: Tables['Contact']['Row']['leadStage'], notes?: string) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Buscar contato atual
      const { data: contact } = await this.findById(id)
      if (!contact) throw new Error('Contact not found')

      const oldStage = contact.leadStage

      // Atualizar estágio
      const { data, error } = await this.update(id, {
        leadStage: newStage,
        lastInteractionAt: new Date().toISOString(),
        ...(newStage === 'QUALIFIED' && { isQualified: true }),
        ...(newStage === 'CONVERTED' && { category: 'CLIENT' }),
      })

      if (error) throw error

      // Registrar atividade
      await this.logLeadActivity(id, {
        type: 'NOTE',
        title: `Estágio alterado de ${oldStage} para ${newStage}`,
        description: notes,
        metadata: { oldStage, newStage }
      })

      // Emitir evento
      EventBus.emit(SystemEvents.CONTACT_STAGE_CHANGED, {
        contactId: id,
        oldStage,
        newStage,
        userId: profile.id
      })

      // Calcular novo score baseado no estágio
      const stageScores = {
        NEW: 10,
        CONTACTED: 25,
        QUALIFIED: 50,
        INTERESTED: 70,
        NEGOTIATING: 85,
        CONVERTED: 100,
        LOST: 0
      }

      if (stageScores[newStage] !== undefined) {
        await this.updateLeadScore(id, stageScores[newStage])
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar score do lead
  async updateLeadScore(id: string, score: number, reason?: string) {
    try {
      const boundedScore = Math.max(0, Math.min(100, score))

      const { data, error } = await this.update(id, {
        leadScore: boundedScore,
        lastInteractionAt: new Date().toISOString()
      })

      if (error) throw error

      // Registrar mudança de score
      await this.logLeadActivity(id, {
        type: 'NOTE',
        title: `Lead score atualizado para ${boundedScore}`,
        description: reason,
        metadata: { score: boundedScore, reason }
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Registrar atividade do lead
  async logLeadActivity(
    contactId: string, 
    activity: {
      type: Tables['LeadActivity']['Row']['type']
      title: string
      description?: string
      metadata?: any
      appointmentId?: string
      dealId?: string
    }
  ) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('LeadActivity')
        .insert({
          id: crypto.randomUUID(),
          contactId,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          metadata: activity.metadata,
          appointmentId: activity.appointmentId,
          dealId: activity.dealId,
          performedById: profile.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar contato
      await this.update(contactId, {
        lastInteractionAt: new Date().toISOString(),
        interactionCount: supabase.sql`interaction_count + 1`
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: ContactStats | null; error: Error | null }> {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de contatos
      const { count: total } = await baseQuery

      // Por categoria
      const categories = ['CLIENT', 'LEAD', 'PARTNER']
      const categoryQueries = categories.map(async (category) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('category', category)
        q = await this.applyRLS(q)
        const { count } = await q
        return { category, count: count || 0 }
      })

      const categoryCounts = await Promise.all(categoryQueries)
      const byCategory = Object.fromEntries(categoryCounts.map(c => [c.category, c.count]))

      // Por status
      const statuses = ['ACTIVE', 'NEW', 'INACTIVE']
      const statusQueries = statuses.map(async (status) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', status)
        q = await this.applyRLS(q)
        const { count } = await q
        return { status, count: count || 0 }
      })

      const statusCounts = await Promise.all(statusQueries)
      const byStatus = Object.fromEntries(statusCounts.map(s => [s.status, s.count]))

      // Por estágio
      const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED', 'LOST']
      const stageQueries = stages.map(async (stage) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('leadStage', stage)
        q = await this.applyRLS(q)
        const { count } = await q
        return { stage, count: count || 0 }
      })

      const stageCounts = await Promise.all(stageQueries)
      const byStage = Object.fromEntries(stageCounts.map(s => [s.stage, s.count]))

      // Média de lead score
      let scoreQuery = supabase.from(this.tableName).select('leadScore')
      scoreQuery = await this.applyRLS(scoreQuery)
      const { data: scoreData } = await scoreQuery
      const avgLeadScore = scoreData?.length 
        ? scoreData.reduce((sum, c) => sum + (c.leadScore || 0), 0) / scoreData.length 
        : 0

      // Contadores específicos
      let qualifiedQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('isQualified', true)
      qualifiedQuery = await this.applyRLS(qualifiedQuery)
      const { count: qualified } = await qualifiedQuery

      // Deals ativos
      let dealsQuery = supabase.from('Deal').select('*', { count: 'exact', head: true }).in('stage', ['LEAD_IN', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION'])
      if (profile.role === 'AGENT') {
        dealsQuery = dealsQuery.eq('agentId', profile.id)
      } else if (profile.role === 'ADMIN') {
        const { data: companyUsers } = await supabase
          .from('User')
          .select('id')
          .eq('companyId', profile.companyId)
        const agentIds = companyUsers?.map(u => u.id) || []
        dealsQuery = dealsQuery.in('agentId', agentIds)
      }
      const { count: activeDeals } = await dealsQuery

      // Agendamentos futuros
      let appointmentsQuery = supabase.from('Appointment').select('*', { count: 'exact', head: true })
        .gte('date', new Date().toISOString())
        .in('status', ['CONFIRMED', 'PENDING'])
      if (profile.role === 'AGENT') {
        appointmentsQuery = appointmentsQuery.eq('agentId', profile.id)
      } else if (profile.role === 'ADMIN') {
        const { data: companyUsers } = await supabase
          .from('User')
          .select('id')
          .eq('companyId', profile.companyId)
        const agentIds = companyUsers?.map(u => u.id) || []
        appointmentsQuery = appointmentsQuery.in('agentId', agentIds)
      }
      const { count: scheduledAppointments } = await appointmentsQuery

      const stats: ContactStats = {
        total: total || 0,
        byCategory,
        byStatus,
        byStage,
        avgLeadScore,
        qualified: qualified || 0,
        converted: byStage.CONVERTED || 0,
        lost: byStage.LOST || 0,
        activeDeals: activeDeals || 0,
        scheduledAppointments: scheduledAppointments || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar contatos em lote
  async importContacts(contacts: Partial<ContactInsert>[]) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Preparar contatos com defaults
      const contactsWithDefaults = contacts.map(contact => ({
        ...contact,
        id: crypto.randomUUID(),
        agentId: contact.agentId || profile.id,
        category: contact.category || 'LEAD',
        status: contact.status || 'NEW',
        leadStage: contact.leadStage || 'NEW',
        leadScore: contact.leadScore || 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      const result = await this.createMany(contactsWithDefaults as ContactInsert[])

      if (result.data) {
        // Registrar atividade de importação
        for (const contact of result.data) {
          await this.logLeadActivity(contact.id, {
            type: 'NOTE',
            title: 'Contato importado',
            metadata: { source: 'bulk_import' }
          })
        }
      }

      return result
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar contatos próximos a follow-up
  async getUpcomingFollowUps(days: number = 7) {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)

      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl)
        `)
        .lte('nextFollowUpAt', futureDate.toISOString())
        .gte('nextFollowUpAt', new Date().toISOString())
        .order('nextFollowUpAt', { ascending: true })

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw this.handleError(error)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Segmentar contatos
  async segmentContacts(criteria: ContactFilters) {
    return this.findAll({ filters: criteria })
  }

  // Calcular score automaticamente baseado em atividades
  async recalculateLeadScore(contactId: string) {
    try {
      const { data: contact } = await this.findById(contactId)
      if (!contact) throw new Error('Contact not found')

      let score = 10 // Base score

      // Pontos por estágio
      const stagePoints = {
        NEW: 0,
        CONTACTED: 15,
        QUALIFIED: 25,
        INTERESTED: 35,
        NEGOTIATING: 40,
        CONVERTED: 50,
        LOST: -50
      }
      score += stagePoints[contact.leadStage] || 0

      // Pontos por interações
      score += Math.min(contact.interactionCount * 2, 20)

      // Pontos por qualificação
      if (contact.isQualified) score += 10

      // Pontos por ter budget
      if (contact.budget) score += 10

      // Pontos por deals ativos
      if (contact.deals && contact.deals.length > 0) score += 15

      // Pontos por agendamentos
      if (contact.appointments && contact.appointments.length > 0) score += 10

      // Penalidade por inatividade
      if (contact.lastInteractionAt) {
        const daysSinceLastInteraction = Math.floor(
          (new Date().getTime() - new Date(contact.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLastInteraction > 30) score -= 10
        if (daysSinceLastInteraction > 60) score -= 10
        if (daysSinceLastInteraction > 90) score -= 10
      }

      // Garantir score entre 0 e 100
      const finalScore = Math.max(0, Math.min(100, score))

      await this.updateLeadScore(contactId, finalScore, 'Recálculo automático baseado em atividades')

      return { data: finalScore, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Helpers privados
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
export const contactService = new ContactServiceClass()