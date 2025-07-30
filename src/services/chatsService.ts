import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Types
type Chat = Database['public']['Tables']['Chat']['Row'];
type ChatInsert = Database['public']['Tables']['Chat']['Insert'];
type ChatUpdate = Database['public']['Tables']['Chat']['Update'];

export interface ChatWithDetails extends Chat {
  contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  agent: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    sentAt: string;
    senderId: string;
  };
  unreadCount: number;
  messagesCount: number;
}

export interface ChatFilters {
  agentId?: string;
  search?: string;
  hasUnread?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

class ChatsService {
  // Buscar chats com filtros e RLS (Row Level Security)
  async getChats(filters: ChatFilters = {}): Promise<ChatWithDetails[]> {
    try {
      let query = supabase
        .from('Chat')
        .select(`
          *,
          contact:Contact!Chat_contactId_fkey (
            id,
            name,
            email,
            phone
          ),
          agent:User!Chat_agentId_fkey (
            id,
            name,
            email
          )
        `)
        .order('updatedAt', { ascending: false });

      // Aplicar filtros
      if (filters.agentId) {
        query = query.eq('agentId', filters.agentId);
      }

      const { data: chats, error } = await query;

      if (error) {
        console.error('Error fetching chats:', error);
        throw new Error(`Erro ao buscar chats: ${error.message}`);
      }

      if (!chats) return [];

      // Buscar última mensagem e contador de não lidas para cada chat
      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          const [lastMessageResult, unreadCountResult, totalCountResult] = await Promise.all([
            // Última mensagem
            supabase
              .from('Message')
              .select('id, content, sentAt, senderId')
              .eq('chatId', chat.id)
              .order('sentAt', { ascending: false })
              .limit(1)
              .single(),
            
            // Mensagens não lidas (assumindo que mensagens do agente atual são sempre lidas)
            supabase
              .from('Message')
              .select('id', { count: 'exact' })
              .eq('chatId', chat.id)
              .neq('senderId', chat.agentId), // Mensagens que não são do agente atual
            
            // Total de mensagens
            supabase
              .from('Message')
              .select('id', { count: 'exact' })
              .eq('chatId', chat.id)
          ]);

          return {
            ...chat,
            lastMessage: lastMessageResult.data || undefined,
            unreadCount: unreadCountResult.count || 0,
            messagesCount: totalCountResult.count || 0
          } as ChatWithDetails;
        })
      );

      // Aplicar filtros adicionais
      let filteredChats = chatsWithDetails;

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredChats = filteredChats.filter((chat) =>
          chat.contact.name.toLowerCase().includes(searchTerm) ||
          chat.contact.email?.toLowerCase().includes(searchTerm) ||
          chat.contact.phone?.includes(searchTerm) ||
          chat.lastMessage?.content.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.hasUnread) {
        filteredChats = filteredChats.filter((chat) => chat.unreadCount > 0);
      }

      return filteredChats;
    } catch (error) {
      console.error('Error in getChats:', error);
      throw error;
    }
  }

  // Buscar chat específico com mensagens
  async getChatById(chatId: string): Promise<ChatWithDetails | null> {
    try {
      const { data: chat, error } = await supabase
        .from('Chat')
        .select(`
          *,
          contact:Contact!Chat_contactId_fkey (
            id,
            name,
            email,
            phone
          ),
          agent:User!Chat_agentId_fkey (
            id,
            name,
            email
          )
        `)
        .eq('id', chatId)
        .single();

      if (error) {
        console.error('Error fetching chat:', error);
        throw new Error(`Erro ao buscar chat: ${error.message}`);
      }

      if (!chat) return null;

      // Buscar estatísticas do chat
      const [lastMessageResult, unreadCountResult, totalCountResult] = await Promise.all([
        supabase
          .from('Message')
          .select('id, content, sentAt, senderId')
          .eq('chatId', chat.id)
          .order('sentAt', { ascending: false })
          .limit(1)
          .single(),
        
        supabase
          .from('Message')
          .select('id', { count: 'exact' })
          .eq('chatId', chat.id)
          .neq('senderId', chat.agentId),
        
        supabase
          .from('Message')
          .select('id', { count: 'exact' })
          .eq('chatId', chat.id)
      ]);

      return {
        ...chat,
        lastMessage: lastMessageResult.data || undefined,
        unreadCount: unreadCountResult.count || 0,
        messagesCount: totalCountResult.count || 0
      } as ChatWithDetails;
    } catch (error) {
      console.error('Error in getChatById:', error);
      throw error;
    }
  }

  // Criar novo chat
  async createChat(data: Omit<ChatInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat> {
    try {
      const { data: chat, error } = await supabase
        .from('Chat')
        .insert({
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        throw new Error(`Erro ao criar chat: ${error.message}`);
      }

      return chat;
    } catch (error) {
      console.error('Error in createChat:', error);
      throw error;
    }
  }

  // Buscar ou criar chat entre agente e contato
  async findOrCreateChat(agentId: string, contactId: string): Promise<Chat> {
    try {
      // Primeiro tenta encontrar chat existente
      const { data: existingChat, error: findError } = await supabase
        .from('Chat')
        .select('*')
        .eq('agentId', agentId)
        .eq('contactId', contactId)
        .single();

      if (existingChat && !findError) {
        return existingChat;
      }

      // Se não existe, cria novo chat
      return await this.createChat({
        agentId,
        contactId
      });
    } catch (error) {
      console.error('Error in findOrCreateChat:', error);
      throw error;
    }
  }

  // Atualizar chat
  async updateChat(chatId: string, data: ChatUpdate): Promise<Chat> {
    try {
      const { data: chat, error } = await supabase
        .from('Chat')
        .update({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .eq('id', chatId)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat:', error);
        throw new Error(`Erro ao atualizar chat: ${error.message}`);
      }

      return chat;
    } catch (error) {
      console.error('Error in updateChat:', error);
      throw error;
    }
  }

  // Marcar chat como lido
  async markChatAsRead(chatId: string): Promise<void> {
    try {
      // Atualizar timestamp do chat
      await this.updateChat(chatId, {
        updatedAt: new Date().toISOString()
      });

      // TODO: Implementar lógica para marcar mensagens como lidas
      // quando tivermos o campo readAt na tabela Message
    } catch (error) {
      console.error('Error in markChatAsRead:', error);
      throw error;
    }
  }

  // Buscar chats por agente (para admin)
  async getChatsByAgent(agentId: string): Promise<ChatWithDetails[]> {
    return this.getChats({ agentId });
  }

  // Buscar estatísticas de chats
  async getChatStats(agentId?: string): Promise<{
    totalChats: number;
    unreadChats: number;
    totalMessages: number;
    activeChatsToday: number;
  }> {
    try {
      let chatQuery = supabase
        .from('Chat')
        .select('id', { count: 'exact' });

      if (agentId) {
        chatQuery = chatQuery.eq('agentId', agentId);
      }

      const { count: totalChats } = await chatQuery;

      // TODO: Implementar contadores mais específicos quando tivermos
      // campos adequados no schema (lastMessageAt, unreadCount, etc.)

      return {
        totalChats: totalChats || 0,
        unreadChats: 0, // Placeholder
        totalMessages: 0, // Placeholder
        activeChatsToday: 0 // Placeholder
      };
    } catch (error) {
      console.error('Error in getChatStats:', error);
      throw error;
    }
  }

  // Deletar chat
  async deleteChat(chatId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Chat')
        .delete()
        .eq('id', chatId);

      if (error) {
        console.error('Error deleting chat:', error);
        throw new Error(`Erro ao deletar chat: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteChat:', error);
      throw error;
    }
  }
}

export const chatsService = new ChatsService();