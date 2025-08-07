import { supabase } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// ========================================
// TIPOS PARA NOVA TABELA imobipro_messages
// ========================================

// Tipos básicos para imobipro_messages (temporário até regenerar Supabase types)
export interface ImobiproMessages {
  id: string
  session_id: string  // Sessão de conversa (para agrupar mensagens)
  funcionario_id: string  // ID do funcionario que está usando o agente
  message_type: 'user' | 'agent' | 'system'  // Tipo da mensagem
  content: string  // Conteúdo da mensagem
  metadata?: any | null  // JSON com dados extras (contexto, referências legais, etc)
  timestamp: string  // Data/hora da mensagem
  is_processed: boolean  // Se foi processada pelo sistema
  response_time?: number | null  // Tempo de resposta em ms (para agente)
  created_at: string
  updated_at: string
}

export interface ImobiproMessagesInsert {
  id?: string
  session_id: string
  funcionario_id: string
  message_type?: 'user' | 'agent' | 'system'
  content: string
  metadata?: any | null
  timestamp?: string
  is_processed?: boolean
  response_time?: number | null
  created_at?: string
  updated_at?: string
}

export interface ImobiproMessagesUpdate {
  session_id?: string
  funcionario_id?: string
  message_type?: 'user' | 'agent' | 'system'
  content?: string
  metadata?: any | null
  timestamp?: string
  is_processed?: boolean
  response_time?: number | null
  updated_at?: string
}

// ========================================
// INTERFACES
// ========================================

// Filtros específicos para imobipro_messages
export interface ImobiproMessagesFilters {
  session_id?: string
  funcionario_id?: string
  message_type?: ImobiproMessages['message_type']
  search?: string  // Busca no conteúdo
  dateStart?: string  // Filtrar por timestamp
  dateEnd?: string
  is_processed?: boolean
  hasMetadata?: boolean  // Apenas mensagens com metadata
}

// Estatísticas do agente IA
export interface ImobiproMessagesStats {
  total: number
  byType: Record<string, number>
  sessions: number  // Número total de sessões
  avgResponseTime: number  // Tempo médio de resposta do agente (ms)
  processed: number
  unprocessed: number
  today: number
  thisWeek: number
  byUser: Record<string, number>
}

// Interface para sessão completa
export interface ChatSession {
  session_id: string
  funcionario_id: string
  funcionario?: {
    id: string
    name: string
    email: string
  }
  messages: ImobiproMessages[]
  startTime: string
  lastActivity: string
  messageCount: number
  avgResponseTime?: number
}

// Interface para análise de performance
export interface AgentPerformance {
  totalQueries: number
  avgResponseTime: number
  successRate: number
  topicDistribution: Record<string, number>
  userSatisfaction?: number
}

// ========================================
// SERVICE CLASS  
// ========================================

export class ImobiproMessagesService {
  private tableName = 'imobipro_messages'
  
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
      // DEV_MASTER vê todas as mensagens
      return query
    } else if (profile.role === 'ADMIN') {
      // ADMIN vê mensagens de funcionários da sua empresa
      const { data: companyUsers } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', profile.companyId)
      
      const agentIds = companyUsers?.map(u => u.id) || []
      return query.in('funcionario_id', agentIds)
    } else if (profile.role === 'AGENT') {
      // AGENT vê apenas próprias mensagens
      return query.eq('funcionario_id', profile.id)
    }

    return query
  }

  // Buscar todas as mensagens com filtros
  async findAll(options?: {
    filters?: ImobiproMessagesFilters
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
          funcionario:User!funcionario_id(id, name, email, avatarUrl)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters
        
        if (filters.session_id) query = query.eq('session_id', filters.session_id)
        if (filters.funcionario_id) query = query.eq('funcionario_id', filters.funcionario_id)
        if (filters.message_type) query = query.eq('message_type', filters.message_type)
        if (filters.is_processed !== undefined) query = query.eq('is_processed', filters.is_processed)
        
        // Filtrar apenas mensagens com metadata
        if (filters.hasMetadata !== undefined) {
          if (filters.hasMetadata) {
            query = query.not('metadata', 'is', null)
          } else {
            query = query.is('metadata', null)
          }
        }
        
        // Filtros de data
        if (filters.dateStart) {
          query = query.gte('timestamp', filters.dateStart)
        }
        if (filters.dateEnd) {
          query = query.lte('timestamp', filters.dateEnd)
        }
        
        // Busca textual no conteúdo
        if (filters.search) {
          query = query.ilike('content', `%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: por timestamp (mais recente primeiro)
        query = query.order('timestamp', { ascending: false })
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

  // Buscar mensagens de uma sessão específica
  async findBySession(sessionId: string, options?: {
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          funcionario:User!funcionario_id(id, name, email, avatarUrl)
        `)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar paginação
      if (options?.limit) {
        query = query.limit(options.limit)
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1)
        }
      }

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Criar nova mensagem
  async create(mensagem: ImobiproMessagesInsert) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const mensagemWithDefaults: ImobiproMessagesInsert = {
        ...mensagem,
        id: mensagem.id || crypto.randomUUID(),
        message_type: mensagem.message_type || 'user',
        timestamp: mensagem.timestamp || new Date().toISOString(),
        is_processed: mensagem.is_processed !== undefined ? mensagem.is_processed : false,
        funcionario_id: mensagem.funcionario_id || user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(mensagemWithDefaults)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar mensagem
  async update(id: string, updates: ImobiproMessagesUpdate) {
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

  // Deletar mensagem
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

  // Marcar mensagem como processada
  async markAsProcessed(messageId: string, responseTime?: number) {
    try {
      return await this.update(messageId, {
        is_processed: true,
        response_time: responseTime
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter sessões de conversa
  async getSessions(funcionarioId?: string): Promise<{ data: ChatSession[] | null; error: Error | null }> {
    try {
      // Buscar sessões únicas
      let sessionQuery = supabase
        .from(this.tableName)
        .select('session_id, funcionario_id, timestamp')
        .order('timestamp', { ascending: false })

      // Aplicar RLS
      sessionQuery = await this.applyRLS(sessionQuery)

      if (funcionarioId) {
        sessionQuery = sessionQuery.eq('funcionario_id', funcionarioId)
      }

      const { data: sessionData, error: sessionError } = await sessionQuery

      if (sessionError) throw sessionError

      // Agrupar por session_id
      const sessionsMap: Record<string, ChatSession> = {}

      for (const row of sessionData || []) {
        if (!sessionsMap[row.session_id]) {
          // Buscar mensagens da sessão
          const { data: messages } = await this.findBySession(row.session_id)
          
          if (messages && messages.length > 0) {
            const timestamps = messages.map(m => new Date(m.timestamp).getTime())
            const responseTimes = messages
              .filter(m => m.message_type === 'agent' && m.response_time)
              .map(m => m.response_time!) || []

            sessionsMap[row.session_id] = {
              session_id: row.session_id,
              funcionario_id: row.funcionario_id,
              funcionario: messages[0]?.funcionario,
              messages,
              startTime: new Date(Math.min(...timestamps)).toISOString(),
              lastActivity: new Date(Math.max(...timestamps)).toISOString(),
              messageCount: messages.length,
              avgResponseTime: responseTimes.length > 0 
                ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
                : undefined
            }
          }
        }
      }

      const sessions = Object.values(sessionsMap)

      return { data: sessions, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: ImobiproMessagesStats | null; error: Error | null }> {
    try {
      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de mensagens
      const { count: total } = await baseQuery

      // Por tipo
      const types = ['user', 'agent', 'system']
      const typeQueries = types.map(async (tipo) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('message_type', tipo)
        q = await this.applyRLS(q)
        const { count } = await q
        return { tipo, count: count || 0 }
      })

      const typeCounts = await Promise.all(typeQueries)
      const byType = Object.fromEntries(typeCounts.map(t => [t.tipo, t.count]))

      // Sessões únicas
      let sessionsQuery = supabase.from(this.tableName).select('session_id')
      sessionsQuery = await this.applyRLS(sessionsQuery)
      const { data: sessionData } = await sessionsQuery
      const uniqueSessions = new Set(sessionData?.map(s => s.session_id) || [])
      const sessions = uniqueSessions.size

      // Tempo médio de resposta
      let responseTimeQuery = supabase.from(this.tableName)
        .select('response_time')
        .eq('message_type', 'agent')
        .not('response_time', 'is', null)
      responseTimeQuery = await this.applyRLS(responseTimeQuery)
      const { data: responseData } = await responseTimeQuery
      const responseTimes = responseData?.map(r => r.response_time) || []
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0

      // Mensagens processadas
      let processedQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('is_processed', true)
      processedQuery = await this.applyRLS(processedQuery)
      const { count: processed } = await processedQuery

      const unprocessed = (total || 0) - (processed || 0)

      // Mensagens hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let todayQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', today.toISOString())
      todayQuery = await this.applyRLS(todayQuery)
      const { count: todayCount } = await todayQuery

      // Mensagens esta semana
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      let weekQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', weekAgo.toISOString())
      weekQuery = await this.applyRLS(weekQuery)
      const { count: thisWeek } = await weekQuery

      // Por usuário
      let userQuery = supabase.from(this.tableName).select('funcionario_id')
      userQuery = await this.applyRLS(userQuery)
      const { data: userData } = await userQuery
      
      const userCount: Record<string, number> = {}
      userData?.forEach(msg => {
        if (msg.funcionario_id) {
          userCount[msg.funcionario_id] = (userCount[msg.funcionario_id] || 0) + 1
        }
      })
      const byUser = userCount

      const stats: ImobiproMessagesStats = {
        total: total || 0,
        byType,
        sessions,
        avgResponseTime,
        processed: processed || 0,
        unprocessed,
        today: todayCount || 0,
        thisWeek: thisWeek || 0,
        byUser
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter performance do agente IA
  async getAgentPerformance(funcionarioId?: string, days: number = 30): Promise<{ data: AgentPerformance | null; error: Error | null }> {
    try {
      const dateLimit = new Date()
      dateLimit.setDate(dateLimit.getDate() - days)

      let query = supabase
        .from(this.tableName)
        .select('*')
        .gte('timestamp', dateLimit.toISOString())

      if (funcionarioId) {
        query = query.eq('funcionario_id', funcionarioId)
      }

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          data: {
            totalQueries: 0,
            avgResponseTime: 0,
            successRate: 0,
            topicDistribution: {}
          },
          error: null
        }
      }

      const userQueries = data.filter(m => m.message_type === 'user')
      const agentResponses = data.filter(m => m.message_type === 'agent')
      
      const totalQueries = userQueries.length
      
      // Tempo médio de resposta
      const responseTimes = agentResponses
        .filter(m => m.response_time)
        .map(m => m.response_time!)
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0

      // Taxa de sucesso (baseada em mensagens processadas)
      const processedResponses = agentResponses.filter(m => m.is_processed)
      const successRate = agentResponses.length > 0 
        ? (processedResponses.length / agentResponses.length) * 100 
        : 0

      // Distribuição de tópicos (baseada em metadata)
      const topicDistribution: Record<string, number> = {}
      data.forEach(m => {
        if (m.metadata && m.metadata.topic) {
          const topic = m.metadata.topic
          topicDistribution[topic] = (topicDistribution[topic] || 0) + 1
        }
      })

      const performance: AgentPerformance = {
        totalQueries,
        avgResponseTime,
        successRate,
        topicDistribution
      }

      return { data: performance, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Criar nova sessão de conversa
  async createSession(funcionarioId?: string): Promise<{ sessionId: string; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const sessionId = `session_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`

      // Criar mensagem inicial do sistema
      await this.create({
        session_id: sessionId,
        funcionario_id: funcionarioId || user.id,
        message_type: 'system',
        content: 'Nova sessão iniciada',
        metadata: {
          event: 'session_started',
          user_id: funcionarioId || user.id
        },
        is_processed: true
      })

      return { sessionId, error: null }
    } catch (error) {
      return { sessionId: '', error: error as Error }
    }
  }

  // Importar mensagens em lote
  async importMessages(mensagens: ImobiproMessagesInsert[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Preparar mensagens com defaults
      const mensagensWithDefaults = mensagens.map(msg => ({
        ...msg,
        id: msg.id || crypto.randomUUID(),
        message_type: msg.message_type || 'user',
        timestamp: msg.timestamp || new Date().toISOString(),
        is_processed: msg.is_processed !== undefined ? msg.is_processed : false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(mensagensWithDefaults)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

// Exportar instância única
export const imobiproMessagesService = new ImobiproMessagesService()