import { supabase } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// ========================================
// TIPOS PARA NOVA TABELA chats
// ========================================

// Tipos básicos para chats (temporário até regenerar Supabase types)
export interface ChatsMvp {
  id: string
  funcionario: string  // ID do corretor/usuário
  cliente_nome?: string | null
  cliente_telefone?: string | null
  ultima_mensagem?: string | null
  data_ultima_mensagem?: string | null  // Date
  status: 'ativo' | 'arquivado' | 'pausado'
  nao_lidas: number  // Contador de mensagens não lidas
  origem?: string | null  // whatsapp, site, manual, etc
  tags?: string[] | null
  observacoes?: string | null
  created_at: string
  updated_at: string
}

export interface ChatsMvpInsert {
  id?: string
  funcionario: string
  cliente_nome?: string | null
  cliente_telefone?: string | null
  ultima_mensagem?: string | null
  data_ultima_mensagem?: string | null
  status?: 'ativo' | 'arquivado' | 'pausado'
  nao_lidas?: number
  origem?: string | null
  tags?: string[] | null
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export interface ChatsMvpUpdate {
  funcionario?: string
  cliente_nome?: string | null
  cliente_telefone?: string | null
  ultima_mensagem?: string | null
  data_ultima_mensagem?: string | null
  status?: 'ativo' | 'arquivado' | 'pausado'
  nao_lidas?: number
  origem?: string | null
  tags?: string[] | null
  observacoes?: string | null
  updated_at?: string
}

// ========================================
// INTERFACES
// ========================================

// Filtros específicos para chats
export interface ChatsMvpFilters {
  status?: ChatsMvp['status']
  funcionario?: string
  origem?: string
  search?: string  // Busca por nome do cliente ou telefone
  tags?: string[]
  hasUnread?: boolean  // Apenas chats com mensagens não lidas
  dateStart?: string  // Filtrar por data da última mensagem
  dateEnd?: string
}

// Estatísticas de chats
export interface ChatsMvpStats {
  total: number
  byStatus: Record<string, number>
  totalUnread: number
  byOrigin: Record<string, number>
  byAgent: Record<string, number>
  activeToday: number
  responseRate: number  // Taxa de resposta média
}

// ========================================
// SERVICE CLASS  
// ========================================

export class ChatsMvpService {
  private tableName = 'chats'
  
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
      // AGENT vê apenas próprios chats
      return query.eq('funcionario', profile.id)
    }

    return query
  }

  // Buscar todos os chats com filtros
  async findAll(options?: {
    filters?: ChatsMvpFilters
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
        if (filters.funcionario) query = query.eq('funcionario', filters.funcionario)
        if (filters.origem) query = query.eq('origem', filters.origem)
        if (filters.hasUnread !== undefined) {
          if (filters.hasUnread) {
            query = query.gt('nao_lidas', 0)
          } else {
            query = query.eq('nao_lidas', 0)
          }
        }
        
        // Filtro por tags (array contains)
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags)
        }
        
        // Filtros de data
        if (filters.dateStart) {
          query = query.gte('data_ultima_mensagem', filters.dateStart)
        }
        if (filters.dateEnd) {
          query = query.lte('data_ultima_mensagem', filters.dateEnd)
        }
        
        // Busca textual
        if (filters.search) {
          query = query.or(`cliente_nome.ilike.%${filters.search}%,cliente_telefone.ilike.%${filters.search}%,ultima_mensagem.ilike.%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: mensagens não lidas primeiro, depois por data da última mensagem
        query = query
          .order('nao_lidas', { ascending: false })
          .order('data_ultima_mensagem', { ascending: false })
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

  // Criar novo chat
  async create(chat: ChatsMvpInsert) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const chatWithDefaults: ChatsMvpInsert = {
        ...chat,
        id: chat.id || crypto.randomUUID(),
        status: chat.status || 'ativo',
        nao_lidas: chat.nao_lidas || 0,
        funcionario: chat.funcionario || user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(chatWithDefaults)
        .select()
        .single()

      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.CHAT_MESSAGE_SENT, {
        chatId: data.id,
        userId: user.id
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar chat
  async update(id: string, updates: ChatsMvpUpdate) {
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

  // Deletar chat
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

  // Marcar mensagens como lidas
  async markAsRead(chatId: string) {
    try {
      return await this.update(chatId, {
        nao_lidas: 0
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Arquivar chat
  async archive(chatId: string) {
    try {
      return await this.update(chatId, {
        status: 'arquivado'
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Reativar chat
  async unarchive(chatId: string) {
    try {
      return await this.update(chatId, {
        status: 'ativo'
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar última mensagem (chamado quando nova mensagem é enviada)
  async updateLastMessage(chatId: string, messageContent: string) {
    try {
      return await this.update(chatId, {
        ultima_mensagem: messageContent.substring(0, 200), // Limitar a 200 caracteres
        data_ultima_mensagem: new Date().toISOString()
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Incrementar contador de mensagens não lidas
  async incrementUnread(chatId: string) {
    try {
      // Buscar valor atual
      const { data: chat } = await this.findById(chatId)
      if (!chat) throw new Error('Chat not found')

      return await this.update(chatId, {
        nao_lidas: (chat.nao_lidas || 0) + 1
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: ChatsMvpStats | null; error: Error | null }> {
    try {
      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de chats
      const { count: total } = await baseQuery

      // Por status
      const statusQueries = ['ativo', 'arquivado', 'pausado'].map(async (status) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', status)
        q = await this.applyRLS(q)
        const { count } = await q
        return { status, count: count || 0 }
      })

      const statusCounts = await Promise.all(statusQueries)
      const byStatus = Object.fromEntries(statusCounts.map(s => [s.status, s.count]))

      // Total de mensagens não lidas
      let unreadQuery = supabase.from(this.tableName).select('nao_lidas')
      unreadQuery = await this.applyRLS(unreadQuery)
      const { data: unreadData } = await unreadQuery
      const totalUnread = unreadData?.reduce((sum, chat) => sum + (chat.nao_lidas || 0), 0) || 0

      // Por origem
      let originQuery = supabase.from(this.tableName).select('origem')
      originQuery = await this.applyRLS(originQuery)
      const { data: originData } = await originQuery
      
      const originCount: Record<string, number> = {}
      originData?.forEach(chat => {
        const origem = chat.origem || 'desconhecido'
        originCount[origem] = (originCount[origem] || 0) + 1
      })
      const byOrigin = originCount

      // Por agente
      let agentQuery = supabase.from(this.tableName).select('funcionario')
      agentQuery = await this.applyRLS(agentQuery)
      const { data: agentData } = await agentQuery
      
      const agentCount: Record<string, number> = {}
      agentData?.forEach(chat => {
        if (chat.funcionario) {
          agentCount[chat.funcionario] = (agentCount[chat.funcionario] || 0) + 1
        }
      })
      const byAgent = agentCount

      // Chats ativos hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let todayQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('data_ultima_mensagem', today.toISOString())
      todayQuery = await this.applyRLS(todayQuery)
      const { count: activeToday } = await todayQuery

      // Taxa de resposta (simplificada)
      const responseRate = total ? (activeToday || 0) / total * 100 : 0

      const stats: ChatsMvpStats = {
        total: total || 0,
        byStatus,
        totalUnread,
        byOrigin,
        byAgent,
        activeToday: activeToday || 0,
        responseRate
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar chats com mensagens não lidas
  async getUnreadChats() {
    try {
      return await this.findAll({
        filters: { hasUnread: true },
        orderBy: 'nao_lidas',
        ascending: false
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar chats por cliente (telefone)
  async findByClientPhone(phone: string) {
    try {
      return await this.findAll({
        filters: { search: phone }
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar chats em lote
  async importChats(chats: ChatsMvpInsert[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Preparar chats com defaults
      const chatsWithDefaults = chats.map(chat => ({
        ...chat,
        id: chat.id || crypto.randomUUID(),
        status: chat.status || 'ativo',
        nao_lidas: chat.nao_lidas || 0,
        funcionario: chat.funcionario || user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(chatsWithDefaults)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

// Exportar instância única
export const chatsMvpService = new ChatsMvpService()