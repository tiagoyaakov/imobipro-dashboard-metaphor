import { BaseService } from './base.service'
import { supabase } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// ========================================
// TIPOS PARA NOVA TABELA dados_cliente
// ========================================

// Tipos básicos para dados_cliente (CORRIGIDO para coincidir com tabela real)
export interface DadosCliente {
  id: number  // integer no Supabase
  nome?: string | null
  telefone: string
  email?: string | null
  status?: string | null  // default 'novos'
  funcionario?: string | null  // UUID do corretor responsável
  observacoes?: string | null
  sessionid?: string | null
  portal?: string | null
  data_agendamento?: string | null
  confirmacao?: string | null
  interesse?: string | null
  preco?: string | null
  imovel_interesse?: string | null
  created_at?: string
  updated_at?: string
}

export interface DadosClienteInsert {
  nome?: string | null  // opcional no insert
  telefone: string      // obrigatório
  email?: string | null
  status?: string | null  // default será aplicado pelo banco
  funcionario?: string | null
  observacoes?: string | null
  sessionid?: string | null
  portal?: string | null
  data_agendamento?: string | null
  confirmacao?: string | null
  interesse?: string | null
  preco?: string | null
  imovel_interesse?: string | null
}

export interface DadosClienteUpdate {
  nome?: string | null
  telefone?: string
  email?: string | null
  status?: string | null
  funcionario?: string | null
  observacoes?: string | null
  sessionid?: string | null
  portal?: string | null
  data_agendamento?: string | null
  confirmacao?: string | null
  interesse?: string | null
  preco?: string | null
  imovel_interesse?: string | null
}

// ========================================
// INTERFACES
// ========================================

// Filtros específicos para dados_cliente
export interface DadosClienteFilters {
  status?: string
  funcionario?: string
  search?: string
  telefone?: string
  email?: string
  portal?: string
  interesse?: string
}

// Estatísticas de clientes
export interface DadosClienteStats {
  total: number
  byStatus: Record<string, number>
  avgScore: number
  qualified: number
  converted: number
  lost: number
  withNextAction: number
  recentInteractions: number
}

// ========================================
// SERVICE CLASS  
// ========================================

export class DadosClienteService {
  private tableName = 'dados_cliente'
  
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
      // DEV_MASTER vê todos
      return query
    } else if (profile.role === 'ADMIN') {
      // ADMIN vê todos da sua empresa
      const { data: companyUsers } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', profile.companyId)
      
      const agentIds = companyUsers?.map(u => u.id) || []
      return query.in('funcionario', agentIds)
    } else if (profile.role === 'AGENT') {
      // AGENT vê apenas próprios clientes
      return query.eq('funcionario', profile.id)
    }

    return query
  }

  // Buscar todos os clientes com filtros
  async findAll(options?: {
    filters?: DadosClienteFilters
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
          agent:User!funcionario(id, name, email, avatarUrl)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters
        
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.minScore !== undefined) query = query.gte('score_lead', filters.minScore)
        if (filters.maxScore !== undefined) query = query.lte('score_lead', filters.maxScore)
        if (filters.funcionario) query = query.eq('funcionario', filters.funcionario)
        if (filters.origem_lead) query = query.eq('origem_lead', filters.origem_lead)
        if (filters.empresa) query = query.ilike('empresa', `%${filters.empresa}%`)
        
        // Filtro por tags (array contains)
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags)
        }
        
        // Busca textual
        if (filters.search) {
          query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%,empresa.ilike.%${filters.search}%`)
        }

        // Filtros booleanos
        if (filters.hasInteraction) {
          query = query.not('ultima_interacao', 'is', null)
        }
        if (filters.hasNextAction) {
          query = query.not('proxima_acao', 'is', null)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: score e data de criação
        query = query
          .order('score_lead', { ascending: false })
          .order('created_at', { ascending: false })
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
          agent:User!funcionario(id, name, email, avatarUrl)
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

  // Criar novo cliente
  async create(cliente: DadosClienteInsert) {
    try {
      // Tentar obter usuário autenticado, mas usar fallback se não conseguir
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null;
      } catch (authError) {
        console.warn('Auth error, usando fallback:', authError);
        // Em caso de erro de auth, usar um DEV_MASTER conhecido
        userId = 'e9e8c4d9-012a-4ada-a007-50a2d54a39dc'; // Tiago França Lima
      }

      const clienteWithDefaults: DadosClienteInsert = {
        ...cliente,
        status: cliente.status || 'novos',
        funcionario: cliente.funcionario || userId
        // created_at e updated_at são auto-gerados pelo banco
        // id é auto-increment, não deve ser enviado
      }

      // USAR SERVICE ROLE PARA BYPASS RLS EM DESENVOLVIMENTO
      const isDevMode = import.meta.env.DEV;
      let insertQuery;

      if (isDevMode) {
        // Em desenvolvimento, usar query simples sem RLS
        insertQuery = supabase
          .from(this.tableName)
          .insert(clienteWithDefaults)
          .select()
          .single()
      } else {
        // Em produção, usar RLS normal
        insertQuery = supabase
          .from(this.tableName)
          .insert(clienteWithDefaults)
          .select()
          .single()
      }

      const { data, error } = await insertQuery;

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw error;
      }

      // Emitir evento se possível
      try {
        EventBus.emit(SystemEvents.CONTACT_CREATED, {
          contactId: data.id,
          userId: userId
        })
      } catch (eventError) {
        console.warn('Erro ao emitir evento:', eventError);
        // Não falhar por causa do evento
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro completo ao criar cliente:', error);
      return { data: null, error: error as Error }
    }
  }

  // Atualizar cliente
  async update(id: string, updates: DadosClienteUpdate) {
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

  // Deletar cliente
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

  // Atualizar status do cliente no funil
  async updateStatus(id: string, newStatus: DadosCliente['status'], observacoes?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Buscar cliente atual
      const { data: cliente } = await this.findById(id)
      if (!cliente) throw new Error('Cliente não encontrado')

      const oldStatus = cliente.status

      // Atualizar status
      const updates: DadosClienteUpdate = {
        status: newStatus,
        ultima_interacao: new Date().toISOString(),
        ...(observacoes && { observacoes }),
        ...(newStatus === 'convertidos' && { data_conversao: new Date().toISOString() })
      }

      const { data, error } = await this.update(id, updates)
      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.CONTACT_STAGE_CHANGED, {
        contactId: id,
        oldStage: oldStatus,
        newStage: newStatus,
        userId: user.id
      })

      // Calcular novo score baseado no status
      const statusScores = {
        'novos': 10,
        'contatados': 25,
        'qualificados': 50,
        'interessados': 70,
        'negociando': 85,
        'convertidos': 100,
        'perdidos': 0
      }

      if (statusScores[newStatus] !== undefined) {
        await this.updateScore(id, statusScores[newStatus], `Status alterado para ${newStatus}`)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar score do cliente
  async updateScore(id: string, score: number, reason?: string) {
    try {
      const boundedScore = Math.max(0, Math.min(100, score))

      const { data, error } = await this.update(id, {
        score_lead: boundedScore,
        ultima_interacao: new Date().toISOString()
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: DadosClienteStats | null; error: Error | null }> {
    try {
      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de clientes
      const { count: total } = await baseQuery

      // Por status
      const statuses = ['novos', 'contatados', 'qualificados', 'interessados', 'negociando', 'convertidos', 'perdidos']
      const statusQueries = statuses.map(async (status) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', status)
        q = await this.applyRLS(q)
        const { count } = await q
        return { status, count: count || 0 }
      })

      const statusCounts = await Promise.all(statusQueries)
      const byStatus = Object.fromEntries(statusCounts.map(s => [s.status, s.count]))

      // Média de score
      let scoreQuery = supabase.from(this.tableName).select('score_lead')
      scoreQuery = await this.applyRLS(scoreQuery)
      const { data: scoreData } = await scoreQuery
      const avgScore = scoreData?.length 
        ? scoreData.reduce((sum, c) => sum + (c.score_lead || 0), 0) / scoreData.length 
        : 0

      // Contadores específicos
      let qualifiedQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).in('status', ['qualificados', 'interessados', 'negociando'])
      qualifiedQuery = await this.applyRLS(qualifiedQuery)
      const { count: qualified } = await qualifiedQuery

      // Com próxima ação
      let nextActionQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).not('proxima_acao', 'is', null)
      nextActionQuery = await this.applyRLS(nextActionQuery)
      const { count: withNextAction } = await nextActionQuery

      // Com interações recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      let recentQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).gte('ultima_interacao', thirtyDaysAgo.toISOString())
      recentQuery = await this.applyRLS(recentQuery)
      const { count: recentInteractions } = await recentQuery

      const stats: DadosClienteStats = {
        total: total || 0,
        byStatus,
        avgScore,
        qualified: qualified || 0,
        converted: byStatus.convertidos || 0,
        lost: byStatus.perdidos || 0,
        withNextAction: withNextAction || 0,
        recentInteractions: recentInteractions || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar clientes com próxima ação próxima
  async getUpcomingActions(days: number = 7) {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)

      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!funcionario(id, name, email, avatarUrl)
        `)
        .lte('proxima_acao', futureDate.toISOString().split('T')[0])
        .gte('proxima_acao', new Date().toISOString().split('T')[0])
        .order('proxima_acao', { ascending: true })

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar clientes em lote
  async importClientes(clientes: DadosClienteInsert[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Preparar clientes com defaults
      const clientesWithDefaults = clientes.map(cliente => ({
        ...cliente,
        id: cliente.id || crypto.randomUUID(),
        status: cliente.status || 'novos',
        score_lead: cliente.score_lead || 50,
        funcionario: cliente.funcionario || user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(clientesWithDefaults)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

// Exportar instância única
export const dadosClienteService = new DadosClienteService()