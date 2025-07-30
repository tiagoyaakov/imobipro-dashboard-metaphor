import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Types
type Message = Database['public']['Tables']['Message']['Row'];
type MessageInsert = Database['public']['Tables']['Message']['Insert'];
type MessageUpdate = Database['public']['Tables']['Message']['Update'];

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  isFromCurrentUser?: boolean;
}

export interface MessageFilters {
  chatId: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  senderId?: string;
  limit?: number;
  offset?: number;
}

export interface MessageStats {
  totalMessages: number;
  messagesFromAgent: number;
  messagesFromContact: number;
  averageResponseTime?: number;
  lastMessageAt?: string;
}

class MessagesService {
  // Buscar mensagens de um chat
  async getMessages(filters: MessageFilters): Promise<MessageWithSender[]> {
    try {
      let query = supabase
        .from('Message')
        .select(`
          *,
          sender:User!Message_senderId_fkey (
            id,
            name,
            email,
            role
          )
        `)
        .eq('chatId', filters.chatId)
        .order('sentAt', { ascending: true });

      // Aplicar filtros
      if (filters.search) {
        query = query.ilike('content', `%${filters.search}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('sentAt', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        query = query.lte('sentAt', filters.dateTo.toISOString());
      }

      if (filters.senderId) {
        query = query.eq('senderId', filters.senderId);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        throw new Error(`Erro ao buscar mensagens: ${error.message}`);
      }

      return messages || [];
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  }

  // Buscar mensagens com paginação
  async getMessagesPaginated(
    chatId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<{
    messages: MessageWithSender[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Buscar total de mensagens
      const { count: total } = await supabase
        .from('Message')
        .select('id', { count: 'exact' })
        .eq('chatId', chatId);

      // Buscar mensagens da página
      const messages = await this.getMessages({
        chatId,
        limit,
        offset
      });

      return {
        messages,
        total: total || 0,
        hasMore: (offset + limit) < (total || 0)
      };
    } catch (error) {
      console.error('Error in getMessagesPaginated:', error);
      throw error;
    }
  }

  // Criar nova mensagem
  async createMessage(data: Omit<MessageInsert, 'id' | 'sentAt'>): Promise<Message> {
    try {
      const { data: message, error } = await supabase
        .from('Message')
        .insert({
          ...data,
          id: crypto.randomUUID(),
          sentAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating message:', error);
        throw new Error(`Erro ao criar mensagem: ${error.message}`);
      }

      // Atualizar timestamp do chat
      await supabase
        .from('Chat')
        .update({ updatedAt: new Date().toISOString() })
        .eq('id', data.chatId);

      return message;
    } catch (error) {
      console.error('Error in createMessage:', error);
      throw error;
    }
  }

  // Enviar mensagem
  async sendMessage(
    chatId: string, 
    content: string, 
    senderId: string
  ): Promise<MessageWithSender> {
    try {
      // Criar mensagem
      const message = await this.createMessage({
        chatId,
        content,
        senderId
      });

      // Buscar mensagem com dados do sender
      const { data: messageWithSender, error } = await supabase
        .from('Message')
        .select(`
          *,
          sender:User!Message_senderId_fkey (
            id,
            name,
            email,
            role
          )
        `)
        .eq('id', message.id)
        .single();

      if (error) {
        console.error('Error fetching message with sender:', error);
        throw new Error(`Erro ao buscar mensagem: ${error.message}`);
      }

      return messageWithSender;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  // Buscar última mensagem de um chat
  async getLastMessage(chatId: string): Promise<MessageWithSender | null> {
    try {
      const { data: message, error } = await supabase
        .from('Message')
        .select(`
          *,
          sender:User!Message_senderId_fkey (
            id,
            name,
            email,
            role
          )
        `)
        .eq('chatId', chatId)
        .order('sentAt', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching last message:', error);
        throw new Error(`Erro ao buscar última mensagem: ${error.message}`);
      }

      return message || null;
    } catch (error) {
      console.error('Error in getLastMessage:', error);
      throw error;
    }
  }

  // Buscar mensagens recentes (últimas N mensagens)
  async getRecentMessages(chatId: string, limit: number = 20): Promise<MessageWithSender[]> {
    try {
      const { data: messages, error } = await supabase
        .from('Message')
        .select(`
          *,
          sender:User!Message_senderId_fkey (
            id,
            name,
            email,
            role
          )
        `)
        .eq('chatId', chatId)
        .order('sentAt', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent messages:', error);
        throw new Error(`Erro ao buscar mensagens recentes: ${error.message}`);
      }

      // Reverter ordem para mostrar mais antigas primeiro
      return (messages || []).reverse();
    } catch (error) {
      console.error('Error in getRecentMessages:', error);
      throw error;
    }
  }

  // Buscar estatísticas de mensagens de um chat
  async getMessageStats(chatId: string): Promise<MessageStats> {
    try {
      // Buscar total de mensagens
      const { count: totalMessages } = await supabase
        .from('Message')
        .select('id', { count: 'exact' })
        .eq('chatId', chatId);

      // Buscar dados do chat para saber qual é o agente
      const { data: chat } = await supabase
        .from('Chat')
        .select('agentId')
        .eq('id', chatId)
        .single();

      if (!chat) {
        throw new Error('Chat não encontrado');
      }

      // Contar mensagens do agente
      const { count: messagesFromAgent } = await supabase
        .from('Message')
        .select('id', { count: 'exact' })
        .eq('chatId', chatId)
        .eq('senderId', chat.agentId);

      // Buscar última mensagem
      const { data: lastMessage } = await supabase
        .from('Message')
        .select('sentAt')
        .eq('chatId', chatId)
        .order('sentAt', { ascending: false })
        .limit(1)
        .single();

      return {
        totalMessages: totalMessages || 0,
        messagesFromAgent: messagesFromAgent || 0,
        messagesFromContact: (totalMessages || 0) - (messagesFromAgent || 0),
        lastMessageAt: lastMessage?.sentAt
      };
    } catch (error) {
      console.error('Error in getMessageStats:', error);
      throw error;
    }
  }

  // Atualizar mensagem
  async updateMessage(messageId: string, data: MessageUpdate): Promise<Message> {
    try {
      const { data: message, error } = await supabase
        .from('Message')
        .update(data)
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        console.error('Error updating message:', error);
        throw new Error(`Erro ao atualizar mensagem: ${error.message}`);
      }

      return message;
    } catch (error) {
      console.error('Error in updateMessage:', error);
      throw error;
    }
  }

  // Deletar mensagem
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Message')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        throw new Error(`Erro ao deletar mensagem: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      throw error;
    }
  }

  // Buscar mensagens por texto (para busca global)
  async searchMessages(
    searchTerm: string, 
    agentId?: string,
    limit: number = 50
  ): Promise<MessageWithSender[]> {
    try {
      let query = supabase
        .from('Message')
        .select(`
          *,
          sender:User!Message_senderId_fkey (
            id,
            name,
            email,
            role
          ),
          chat:Chat!Message_chatId_fkey (
            id,
            agentId
          )
        `)
        .ilike('content', `%${searchTerm}%`)
        .order('sentAt', { ascending: false })
        .limit(limit);

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error searching messages:', error);
        throw new Error(`Erro ao buscar mensagens: ${error.message}`);
      }

      // Filtrar por agente se especificado (Row Level Security já deve aplicar isso)
      let filteredMessages = messages || [];
      
      if (agentId) {
        filteredMessages = filteredMessages.filter((msg: any) => 
          msg.chat.agentId === agentId
        );
      }

      return filteredMessages;
    } catch (error) {
      console.error('Error in searchMessages:', error);
      throw error;
    }
  }

  // Contar mensagens não lidas de um chat
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      // TODO: Implementar lógica de mensagens não lidas
      // Atualmente, consideramos que mensagens do próprio usuário são sempre lidas
      const { count } = await supabase
        .from('Message')
        .select('id', { count: 'exact' })
        .eq('chatId', chatId)
        .neq('senderId', userId);

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  // Subscribe para mensagens em tempo real
  subscribeToMessages(
    chatId: string,
    onMessage: (message: MessageWithSender) => void,
    onError?: (error: any) => void
  ) {
    const subscription = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `chatId=eq.${chatId}`
        },
        async (payload) => {
          try {
            // Buscar mensagem completa com dados do sender
            const { data: message, error } = await supabase
              .from('Message')
              .select(`
                *,
                sender:User!Message_senderId_fkey (
                  id,
                  name,
                  email,
                  role
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching new message:', error);
              onError?.(error);
              return;
            }

            onMessage(message);
          } catch (error) {
            console.error('Error in message subscription:', error);
            onError?.(error);
          }
        }
      )
      .subscribe();

    return subscription;
  }
}

export const messagesService = new MessagesService();