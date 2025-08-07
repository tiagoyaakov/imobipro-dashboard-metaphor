import { supabase } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// ========================================
// TIPOS PARA NOVA TABELA interesse_imoveis
// ========================================

// Tipos básicos para interesse_imoveis (temporário até regenerar Supabase types)
export interface InteresseImoveis {
  id: string
  cliente_id: string  // FK para dados_cliente
  imovel_id: string  // FK para imoveisvivareal4
  funcionario_id: string  // ID do corretor responsável
  tipo_interesse: 'comprar' | 'alugar' | 'visitar' | 'avaliar'
  status: 'ativo' | 'concluido' | 'pausado' | 'cancelado'
  data_interesse: string  // Date - quando manifestou interesse
  observacoes?: string | null
  prioridade: 'baixa' | 'media' | 'alta'
  canal_origem?: string | null  // whatsapp, site, manual, etc
  valor_oferta?: number | null  // Se fez uma oferta
  data_contato?: string | null  // Último contato sobre este interesse
  feedback?: string | null  // Feedback do cliente sobre a propriedade
  created_at: string
  updated_at: string
}

export interface InteresseImoveisInsert {
  id?: string
  cliente_id: string
  imovel_id: string
  funcionario_id?: string
  tipo_interesse?: 'comprar' | 'alugar' | 'visitar' | 'avaliar'
  status?: 'ativo' | 'concluido' | 'pausado' | 'cancelado'
  data_interesse?: string
  observacoes?: string | null
  prioridade?: 'baixa' | 'media' | 'alta'
  canal_origem?: string | null
  valor_oferta?: number | null
  data_contato?: string | null
  feedback?: string | null
  created_at?: string
  updated_at?: string
}

export interface InteresseImoveisUpdate {
  cliente_id?: string
  imovel_id?: string
  funcionario_id?: string
  tipo_interesse?: 'comprar' | 'alugar' | 'visitar' | 'avaliar'
  status?: 'ativo' | 'concluido' | 'pausado' | 'cancelado'
  data_interesse?: string
  observacoes?: string | null
  prioridade?: 'baixa' | 'media' | 'alta'
  canal_origem?: string | null
  valor_oferta?: number | null
  data_contato?: string | null
  feedback?: string | null
  updated_at?: string
}

// ========================================
// INTERFACES
// ========================================

// Filtros específicos para interesse_imoveis
export interface InteresseImoveisFilters {
  cliente_id?: string
  imovel_id?: string
  funcionario_id?: string
  tipo_interesse?: InteresseImoveis['tipo_interesse']
  status?: InteresseImoveis['status']
  prioridade?: InteresseImoveis['prioridade']
  canal_origem?: string
  search?: string  // Busca no nome do cliente ou título da propriedade
  dateStart?: string  // Filtrar por data de interesse
  dateEnd?: string
  hasOffer?: boolean  // Apenas interesses com oferta
  needsContact?: boolean  // Interesses que precisam de contato
}

// Estatísticas de interesse em imóveis
export interface InteresseImoveisStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  withOffers: number
  avgOfferValue: number
  byChannel: Record<string, number>
  byAgent: Record<string, number>
  conversionRate: number  // Taxa de conversão (concluído/total)
  pendingContact: number  // Interesses que precisam de contato
}

// Interface para busca com relacionamentos
export interface InteresseWithRelations extends InteresseImoveis {
  cliente?: {
    id: string
    nome: string
    telefone?: string | null
    email?: string | null
  }
  imovel?: {
    id: string
    title: string
    address: string
    city: string
    price: number
    propertyType: string
  }
  funcionario?: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
}

// Interface para matching de interessados
export interface ClienteInteresse {
  cliente_id: string
  cliente_nome: string
  cliente_telefone?: string | null
  cliente_email?: string | null
  tipo_interesse: string
  prioridade: string
  data_interesse: string
  observacoes?: string | null
  valor_oferta?: number | null
}

// ========================================
// SERVICE CLASS  
// ========================================

export class InteresseImoveisService {
  private tableName = 'interesse_imoveis'
  
  constructor() {}

  // Aplicar RLS baseado no usuário logado
  private async applyRLS(query: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Buscar perfil do usuário para aplicar RLS
    const { data: profile } = await supabase
      .from('User')
      .select('id, role, companyId')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('User profile not found')

    // Aplicar filtros baseados no role
    if (profile.role === 'DEV_MASTER') {
      // DEV_MASTER vê todos os interesses
      return query
    } else if (profile.role === 'ADMIN') {
      // ADMIN vê interesses de funcionários da sua empresa
      const { data: companyUsers } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', profile.companyId)
      
      const agentIds = companyUsers?.map(u => u.id) || []
      return query.in('funcionario_id', agentIds)
    } else if (profile.role === 'AGENT') {
      // AGENT vê apenas próprios interesses
      return query.eq('funcionario_id', profile.id)
    }

    return query
  }

  // Buscar todos os interesses com filtros
  async findAll(options?: {
    filters?: InteresseImoveisFilters
    orderBy?: string
    ascending?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          cliente:dados_cliente!cliente_id(id, nome, telefone, email),
          imovel:imoveisvivareal4!imovel_id(id, title, address, city, price, propertyType),
          funcionario:User!funcionario_id(id, name, email, avatarUrl)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters
        
        if (filters.cliente_id) query = query.eq('cliente_id', filters.cliente_id)
        if (filters.imovel_id) query = query.eq('imovel_id', filters.imovel_id)
        if (filters.funcionario_id) query = query.eq('funcionario_id', filters.funcionario_id)
        if (filters.tipo_interesse) query = query.eq('tipo_interesse', filters.tipo_interesse)
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.prioridade) query = query.eq('prioridade', filters.prioridade)
        if (filters.canal_origem) query = query.eq('canal_origem', filters.canal_origem)
        
        // Filtrar apenas interesses com oferta
        if (filters.hasOffer !== undefined) {
          if (filters.hasOffer) {
            query = query.not('valor_oferta', 'is', null).gt('valor_oferta', 0)
          } else {
            query = query.or('valor_oferta.is.null,valor_oferta.eq.0')
          }
        }
        
        // Interesses que precisam de contato (sem contato recente)
        if (filters.needsContact !== undefined && filters.needsContact) {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          query = query
            .eq('status', 'ativo')
            .or(`data_contato.is.null,data_contato.lt.${weekAgo.toISOString()}`)
        }
        
        // Filtros de data
        if (filters.dateStart) {
          query = query.gte('data_interesse', filters.dateStart)
        }
        if (filters.dateEnd) {
          query = query.lte('data_interesse', filters.dateEnd)
        }
        
        // Busca textual (nome do cliente ou título do imóvel)
        if (filters.search) {
          // Buscar em dados_cliente
          const { data: matchingClientes } = await supabase
            .from('dados_cliente')
            .select('id')
            .ilike('nome', `%${filters.search}%`)
          
          const clienteIds = matchingClientes?.map(c => c.id) || []
          
          // Buscar em imoveisvivareal4
          const { data: matchingImoveis } = await supabase
            .from('imoveisvivareal4')
            .select('id')
            .ilike('title', `%${filters.search}%`)
          
          const imovelIds = matchingImoveis?.map(i => i.id) || []
          
          if (clienteIds.length > 0 || imovelIds.length > 0) {
            const conditions = []
            if (clienteIds.length > 0) conditions.push(`cliente_id.in.(${clienteIds.join(',')})`)
            if (imovelIds.length > 0) conditions.push(`imovel_id.in.(${imovelIds.join(',')})`)
            query = query.or(conditions.join(','))
          } else {
            // Nenhum resultado encontrado na busca
            query = query.eq('id', 'nonexistent')
          }
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: prioridade, status ativo, data de interesse
        query = query
          .order('prioridade', { ascending: false })
          .order('status', { ascending: true })
          .order('data_interesse', { ascending: false })
      }

      // Aplicar paginação
      if (options?.limit) {
        query = query.limit(options.limit)
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1)
        }
      }

      const { data, error, count } = await query

      if (error) throw error

      return { data, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar por ID
  async findById(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          cliente:dados_cliente!cliente_id(id, nome, telefone, email, status, observacoes),
          imovel:imoveisvivareal4!imovel_id(id, title, address, city, price, propertyType, status, bedrooms, bathrooms, area),
          funcionario:User!funcionario_id(id, name, email, avatarUrl)
        `)
        .eq('id', id)
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar interesses de um cliente
  async findByCliente(clienteId: string) {
    try {
      return await this.findAll({
        filters: { cliente_id: clienteId },
        orderBy: 'data_interesse',
        ascending: false
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar interessados em um imóvel
  async findByImovel(imovelId: string) {
    try {
      return await this.findAll({
        filters: { imovel_id: imovelId },
        orderBy: 'prioridade',
        ascending: false
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar interesses que precisam de contato
  async findNeedingContact() {
    try {
      return await this.findAll({
        filters: { needsContact: true },
        orderBy: 'prioridade',
        ascending: false
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Criar novo interesse
  async create(interesse: InteresseImoveisInsert) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const interesseWithDefaults: InteresseImoveisInsert = {
        ...interesse,
        id: interesse.id || crypto.randomUUID(),
        tipo_interesse: interesse.tipo_interesse || 'visitar',
        status: interesse.status || 'ativo',
        prioridade: interesse.prioridade || 'media',
        funcionario_id: interesse.funcionario_id || user.id,
        data_interesse: interesse.data_interesse || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(interesseWithDefaults)
        .select()
        .single()

      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.LEAD_INTERESTED, {
        interesseId: data.id,
        clienteId: data.cliente_id,
        imovelId: data.imovel_id,
        userId: user.id
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar interesse
  async update(id: string, updates: InteresseImoveisUpdate) {
    try {
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      let query = supabase
        .from(this.tableName)
        .update(updatesWithTimestamp)
        .eq('id', id)
        .select()
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Deletar interesse
  async delete(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { error } = await query

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Atualizar status do interesse
  async updateStatus(interesseId: string, status: InteresseImoveis['status'], observacoes?: string) {
    try {
      const updates: InteresseImoveisUpdate = { status }
      if (observacoes) updates.observacoes = observacoes
      
      return await this.update(interesseId, updates)
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Registrar contato
  async registrarContato(interesseId: string, feedback?: string) {
    try {
      const updates: InteresseImoveisUpdate = {
        data_contato: new Date().toISOString()
      }
      
      if (feedback) updates.feedback = feedback
      
      return await this.update(interesseId, updates)
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Fazer oferta
  async fazerOferta(interesseId: string, valorOferta: number, observacoes?: string) {
    try {
      const updates: InteresseImoveisUpdate = {
        valor_oferta: valorOferta,
        status: 'ativo',
        data_contato: new Date().toISOString()
      }
      
      if (observacoes) updates.observacoes = observacoes
      
      return await this.update(interesseId, updates)
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: InteresseImoveisStats | null; error: Error | null }> {
    try {
      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de interesses
      const { count: total } = await baseQuery

      // Por tipo
      const types = ['comprar', 'alugar', 'visitar', 'avaliar']
      const typeQueries = types.map(async (tipo) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('tipo_interesse', tipo)
        q = await this.applyRLS(q)
        const { count } = await q
        return { tipo, count: count || 0 }
      })

      const typeCounts = await Promise.all(typeQueries)
      const byType = Object.fromEntries(typeCounts.map(t => [t.tipo, t.count]))

      // Por status
      const statusTypes = ['ativo', 'concluido', 'pausado', 'cancelado']
      const statusQueries = statusTypes.map(async (status) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', status)
        q = await this.applyRLS(q)
        const { count } = await q
        return { status, count: count || 0 }
      })

      const statusCounts = await Promise.all(statusQueries)
      const byStatus = Object.fromEntries(statusCounts.map(s => [s.status, s.count]))

      // Por prioridade
      const priorities = ['baixa', 'media', 'alta']
      const priorityQueries = priorities.map(async (prioridade) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('prioridade', prioridade)
        q = await this.applyRLS(q)
        const { count } = await q
        return { prioridade, count: count || 0 }
      })

      const priorityCounts = await Promise.all(priorityQueries)
      const byPriority = Object.fromEntries(priorityCounts.map(p => [p.prioridade, p.count]))

      // Com ofertas
      let offersQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .not('valor_oferta', 'is', null)
        .gt('valor_oferta', 0)
      offersQuery = await this.applyRLS(offersQuery)
      const { count: withOffers } = await offersQuery

      // Valor médio das ofertas
      let avgOfferQuery = supabase.from(this.tableName)
        .select('valor_oferta')
        .not('valor_oferta', 'is', null)
        .gt('valor_oferta', 0)
      avgOfferQuery = await this.applyRLS(avgOfferQuery)
      const { data: offerData } = await avgOfferQuery
      const avgOfferValue = offerData?.length 
        ? offerData.reduce((sum, i) => sum + (i.valor_oferta || 0), 0) / offerData.length 
        : 0

      // Por canal
      let channelQuery = supabase.from(this.tableName).select('canal_origem')
      channelQuery = await this.applyRLS(channelQuery)
      const { data: channelData } = await channelQuery
      
      const channelCount: Record<string, number> = {}
      channelData?.forEach(interesse => {
        const canal = interesse.canal_origem || 'direto'
        channelCount[canal] = (channelCount[canal] || 0) + 1
      })
      const byChannel = channelCount

      // Por agente
      let agentQuery = supabase.from(this.tableName).select('funcionario_id')
      agentQuery = await this.applyRLS(agentQuery)
      const { data: agentData } = await agentQuery
      
      const agentCount: Record<string, number> = {}
      agentData?.forEach(interesse => {
        if (interesse.funcionario_id) {
          agentCount[interesse.funcionario_id] = (agentCount[interesse.funcionario_id] || 0) + 1
        }
      })
      const byAgent = agentCount

      // Taxa de conversão
      const concluidos = byStatus.concluido || 0
      const conversionRate = total ? (concluidos / total) * 100 : 0

      // Interesses que precisam de contato
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      let pendingQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo')
        .or(`data_contato.is.null,data_contato.lt.${weekAgo.toISOString()}`)
      pendingQuery = await this.applyRLS(pendingQuery)
      const { count: pendingContact } = await pendingQuery

      const stats: InteresseImoveisStats = {
        total: total || 0,
        byType,
        byStatus,
        byPriority,
        withOffers: withOffers || 0,
        avgOfferValue,
        byChannel,
        byAgent,
        conversionRate,
        pendingContact: pendingContact || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Matching: buscar clientes interessados em propriedades similares
  async findSimilarInterests(imovelId: string) {
    try {
      // Buscar detalhes do imóvel
      const { data: imovel } = await supabase
        .from('imoveisvivareal4')
        .select('propertyType, city, price, bedrooms, bathrooms')
        .eq('id', imovelId)
        .single()

      if (!imovel) throw new Error('Imóvel não encontrado')

      // Buscar interesses similares
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          cliente:dados_cliente!cliente_id(id, nome, telefone, email),
          imovel:imoveisvivareal4!imovel_id(id, title, address, city, price, propertyType)
        `)
        .eq('status', 'ativo')
        .neq('imovel_id', imovelId)

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      // Filtrar por critérios similares no frontend
      const similar = data?.filter(interesse => {
        const imovelInteresse = interesse.imovel
        if (!imovelInteresse) return false

        // Mesmo tipo de propriedade
        if (imovelInteresse.propertyType !== imovel.propertyType) return false
        
        // Mesma cidade
        if (imovelInteresse.city !== imovel.city) return false
        
        // Faixa de preço similar (±20%)
        const priceMin = imovel.price * 0.8
        const priceMax = imovel.price * 1.2
        if (imovelInteresse.price < priceMin || imovelInteresse.price > priceMax) return false

        return true
      }) || []

      return { data: similar, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar interesses em lote
  async importInteresses(interesses: InteresseImoveisInsert[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Preparar interesses com defaults
      const interessesWithDefaults = interesses.map(interesse => ({
        ...interesse,
        id: interesse.id || crypto.randomUUID(),
        tipo_interesse: interesse.tipo_interesse || 'visitar',
        status: interesse.status || 'ativo',
        prioridade: interesse.prioridade || 'media',
        funcionario_id: interesse.funcionario_id || user.id,
        data_interesse: interesse.data_interesse || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(interessesWithDefaults)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

// Exportar instância única
export const interesseImoveisService = new InteresseImoveisService()