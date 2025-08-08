import { supabase } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// ========================================
// TIPOS PARA NOVA TABELA chat_messages
// ========================================

// Tipos básicos para chat_messages (temporário até regenerar Supabase types)
export interface ChatMessagesMvp {
  id: string
  chat_id: string  // FK para tabela chats
  conteudo: string
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao'
  remetente: 'funcionario' | 'cliente' | 'sistema'
  funcionario_id?: string | null  // ID do funcionario se for remetente funcionario
  lida: boolean
  data_envio: string  // Date
  metadata?: any | null  // JSON para dados adicionais (nome do arquivo, coordenadas, etc)
  created_at: string
  updated_at: string
}

export interface ChatMessagesMvpInsert {
  id?: string
  chat_id: string
  conteudo: string
  tipo?: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao'
  remetente?: 'funcionario' | 'cliente' | 'sistema'
  funcionario_id?: string | null
  lida?: boolean
  data_envio?: string
  metadata?: any | null
  created_at?: string
  updated_at?: string
}

export interface ChatMessagesMvpUpdate {
  conteudo?: string
  tipo?: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao'
  remetente?: 'funcionario' | 'cliente' | 'sistema'
  funcionario_id?: string | null
  lida?: boolean
  data_envio?: string
  metadata?: any | null
  updated_at?: string
}

// ========================================
// INTERFACES
// ========================================

// Filtros específicos para chat_messages
export interface ChatMessagesMvpFilters {
  chat_id?: string
  tipo?: ChatMessagesMvp['tipo']
  remetente?: ChatMessagesMvp['remetente']
  funcionario_id?: string
  lida?: boolean
  search?: string  // Busca no conteúdo da mensagem
  dateStart?: string  // Filtrar por data de envio
  dateEnd?: string
  hasMedia?: boolean  // Apenas mensagens com mídia (não texto)
}

// Estatísticas de mensagens
export interface ChatMessagesMvpStats {
  total: number
  byType: Record<string, number>
  bySender: Record<string, number>
  unread: number
  today: number
  thisWeek: number
  mediaMessages: number
  averagePerChat: number
}

// Interface para busca com relacionamentos
export interface ChatMessageWithRelations extends ChatMessagesMvp {
  chat?: {
    id: string
    cliente_nome?: string | null
    cliente_telefone?: string | null
  }
  funcionario?: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
}

// ========================================
// SERVICE CLASS  
// ========================================

export class ChatMessagesMvpService {
  private tableName = 'chat_messages'
  
  constructor() {}

  // Aplicar RLS baseado no usuário logado (via chats)
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

    // Aplicar filtros baseados no role através da relação com chats
    if (profile.role === 'DEV_MASTER') {
      // DEV_MASTER vê todas as mensagens
      return query
    } else if (profile.role === 'ADMIN') {
      // ADMIN vê mensagens de chats da sua empresa
      const { data: companyUsers } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', profile.companyId)
      
      const agentIds = companyUsers?.map(u => u.id) || []
      
      // Subconsulta para filtrar por chats dos agentes da empresa
      const { data: companyChats } = await supabase
        .from('chats')
        .select('id')
        .in('funcionario', agentIds)
      
      const chatIds = companyChats?.map(c => c.id) || []
      return query.in('chat_id', chatIds)
    } else if (profile.role === 'AGENT') {
      // AGENT vê apenas mensagens dos próprios chats
      const { data: agentChats } = await supabase
        .from('chats')
        .select('id')
        .eq('funcionario', profile.id)
      
      const chatIds = agentChats?.map(c => c.id) || []
      return query.in('chat_id', chatIds)
    }

    return query
  }

  // Buscar todas as mensagens com filtros
  async findAll(options?: {
    filters?: ChatMessagesMvpFilters
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
          chat:chats!chat_id(id, cliente_nome, cliente_telefone),
          funcionario:User!funcionario_id(id, name, email, avatarUrl)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters
        
        if (filters.chat_id) query = query.eq('chat_id', filters.chat_id)
        if (filters.tipo) query = query.eq('tipo', filters.tipo)
        if (filters.remetente) query = query.eq('remetente', filters.remetente)
        if (filters.funcionario_id) query = query.eq('funcionario_id', filters.funcionario_id)
        if (filters.lida !== undefined) query = query.eq('lida', filters.lida)
        
        // Filtrar apenas mensagens com mídia
        if (filters.hasMedia !== undefined) {
          if (filters.hasMedia) {
            query = query.not('tipo', 'eq', 'texto')
          } else {
            query = query.eq('tipo', 'texto')
          }
        }
        
        // Filtros de data
        if (filters.dateStart) {
          query = query.gte('data_envio', filters.dateStart)
        }
        if (filters.dateEnd) {
          query = query.lte('data_envio', filters.dateEnd)
        }
        
        // Busca textual no conteúdo
        if (filters.search) {
          query = query.ilike('conteudo', `%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: por data de envio (mais recente primeiro)
        query = query.order('data_envio', { ascending: false })
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
          chat:chats!chat_id(id, cliente_nome, cliente_telefone),
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

  // Buscar mensagens de um chat específico
  async findByChat(chatId: string, options?: {
    limit?: number
    offset?: number
    beforeMessageId?: string
    afterMessageId?: string
  }) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          funcionario:User!funcionario_id(id, name, email, avatarUrl)
        `)
        .eq('chat_id', chatId)
        .order('data_envio', { ascending: true })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Filtros de paginação por ID de mensagem
      if (options?.beforeMessageId) {
        const { data: beforeMsg } = await this.findById(options.beforeMessageId)
        if (beforeMsg) {
          query = query.lt('data_envio', beforeMsg.data_envio)
        }
      }

      if (options?.afterMessageId) {
        const { data: afterMsg } = await this.findById(options.afterMessageId)
        if (afterMsg) {
          query = query.gt('data_envio', afterMsg.data_envio)
        }
      }

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
  async create(mensagem: ChatMessagesMvpInsert) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const mensagemWithDefaults: ChatMessagesMvpInsert = {
        ...mensagem,
        id: mensagem.id || crypto.randomUUID(),
        tipo: mensagem.tipo || 'texto',
        remetente: mensagem.remetente || 'funcionario',
        lida: mensagem.lida !== undefined ? mensagem.lida : false,
        data_envio: mensagem.data_envio || new Date().toISOString(),
        funcionario_id: mensagem.funcionario_id || (mensagem.remetente === 'funcionario' ? user.id : null),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(mensagemWithDefaults)
        .select()
        .single()

      if (error) throw error

      // Atualizar última mensagem no chat pai
      if (data) {
        await supabase
          .from('chats')
          .update({
            ultima_mensagem: data.conteudo.substring(0, 200),
            data_ultima_mensagem: data.data_envio,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.chat_id)

        // Se a mensagem é do cliente, incrementar contador não lidas
        if (data.remetente === 'cliente') {
          await supabase.rpc('increment_unread_count', { chat_id: data.chat_id })
        }
      }

      // Emitir evento
      EventBus.emit(SystemEvents.CHAT_MESSAGE_SENT, {
        messageId: data.id,
        chatId: data.chat_id,
        userId: user.id
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar mensagem
  async update(id: string, updates: ChatMessagesMvpUpdate) {
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

  // Marcar mensagem como lida
  async markAsRead(messageId: string) {
    try {
      return await this.update(messageId, {
        lida: true
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Marcar todas as mensagens de um chat como lidas
  async markChatAsRead(chatId: string) {
    try {
      // Buscar mensagens não lidas do chat
      const { data: unreadMessages } = await this.findAll({
        filters: {
          chat_id: chatId,
          lida: false
        }
      })

      if (unreadMessages && unreadMessages.length > 0) {
        // Marcar todas como lidas
        const messageIds = unreadMessages.map(msg => msg.id)
        
        const { error } = await supabase
          .from(this.tableName)
          .update({ lida: true, updated_at: new Date().toISOString() })
          .in('id', messageIds)

        if (error) throw error

        // Zerar contador no chat
        await supabase
          .from('chats')
          .update({ 
            nao_lidas: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', chatId)
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: ChatMessagesMvpStats | null; error: Error | null }> {
    try {
      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de mensagens
      const { count: total } = await baseQuery

      // Por tipo
      const types = ['texto', 'imagem', 'audio', 'video', 'documento', 'localizacao']
      const typeQueries = types.map(async (tipo) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('tipo', tipo)
        q = await this.applyRLS(q)
        const { count } = await q
        return { tipo, count: count || 0 }
      })

      const typeCounts = await Promise.all(typeQueries)
      const byType = Object.fromEntries(typeCounts.map(t => [t.tipo, t.count]))

      // Por remetente
      const senders = ['funcionario', 'cliente', 'sistema']
      const senderQueries = senders.map(async (remetente) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('remetente', remetente)
        q = await this.applyRLS(q)
        const { count } = await q
        return { remetente, count: count || 0 }
      })

      const senderCounts = await Promise.all(senderQueries)
      const bySender = Object.fromEntries(senderCounts.map(s => [s.remetente, s.count]))

      // Mensagens não lidas
      let unreadQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('lida', false)
      unreadQuery = await this.applyRLS(unreadQuery)
      const { count: unread } = await unreadQuery

      // Mensagens hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let todayQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('data_envio', today.toISOString())
      todayQuery = await this.applyRLS(todayQuery)
      const { count: todayCount } = await todayQuery

      // Mensagens esta semana
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      let weekQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('data_envio', weekAgo.toISOString())
      weekQuery = await this.applyRLS(weekQuery)
      const { count: thisWeek } = await weekQuery

      // Mensagens de mídia (não texto)
      const mediaMessages = (byType.imagem || 0) + (byType.audio || 0) + 
                          (byType.video || 0) + (byType.documento || 0) + 
                          (byType.localizacao || 0)

      // Média de mensagens por chat
      const chatsQuery = supabase.from('chats').select('*', { count: 'exact', head: true })
      const { count: totalChats } = await chatsQuery
      const averagePerChat = totalChats ? (total || 0) / totalChats : 0

      const stats: ChatMessagesMvpStats = {
        total: total || 0,
        byType,
        bySender,
        unread: unread || 0,
        today: todayCount || 0,
        thisWeek: thisWeek || 0,
        mediaMessages,
        averagePerChat
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar mensagens de mídia
  async getMediaMessages(chatId?: string) {
    try {
      const filters: ChatMessagesMvpFilters = {
        hasMedia: true
      }
      
      if (chatId) {
        filters.chat_id = chatId
      }

      return await this.findAll({
        filters,
        orderBy: 'data_envio',
        ascending: false
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar mensagens recentes
  async getRecentMessages(limit: number = 50) {
    try {
      return await this.findAll({
        orderBy: 'data_envio',
        ascending: false,
        limit
      })
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar mensagens em lote
  async importMessages(mensagens: ChatMessagesMvpInsert[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Preparar mensagens com defaults
      const mensagensWithDefaults = mensagens.map(msg => ({
        ...msg,
        id: msg.id || crypto.randomUUID(),
        tipo: msg.tipo || 'texto',
        remetente: msg.remetente || 'funcionario',
        lida: msg.lida !== undefined ? msg.lida : false,
        data_envio: msg.data_envio || new Date().toISOString(),
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
export const chatMessagesMvpService = new ChatMessagesMvpService()