// ================================================================
// HOOK USECHATMESSAGESMVP - INTEGRAÇÃO COM TABELA MVP CHAT_MESSAGES
// ================================================================
// Data: 07/08/2025
// Descrição: Hook para gestão de mensagens usando chatMessagesMvp.service.ts
// Migração: Sistema antigo → nova tabela chat_messages (6 tabelas MVP)
// ================================================================

import { useCallback, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation, CacheStrategy, usePaginatedQuery } from './useSupabaseQuery';
import { chatMessagesMvpService } from '@/services/chatMessagesMvp.service';
import type { 
  ChatMessagesMvp, 
  ChatMessagesMvpFilters, 
  ChatMessagesMvpStats,
  ChatMessagesMvpInsert,
  ChatMessagesMvpUpdate,
  ChatMessageWithRelations
} from '@/services/chatMessagesMvp.service';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from '@/hooks/use-toast';
import { useUnifiedCache, useCrossModuleInvalidation } from '@/hooks/useUnifiedCache';
import { QUERY_KEYS, getQueryConfig } from '@/lib/cache-manager';

// ================================================================
// MAPEAMENTO DE TIPOS - COMPATIBILIDADE COM SISTEMA ANTIGO
// ================================================================

// Interface Message antiga que preciso manter compatível (se necessário)
export interface Message {
  id: string;
  content: string;
  sentAt: string;
  senderId: string;
  chatId: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
  isRead: boolean;
  metadata?: any;
}

// Mapeamento ChatMessagesMvp → Message (se necessário para compatibilidade)
function mapChatMessagesMvpToMessage(message: ChatMessagesMvp): Message {
  return {
    id: message.id,
    content: message.conteudo,
    sentAt: message.data_envio,
    senderId: message.funcionario_id || '',
    chatId: message.chat_id,
    messageType: mapTipoToMessageType(message.tipo),
    isRead: message.lida,
    metadata: message.metadata
  };
}

// Mapeamento inverso Message → ChatMessagesMvpInsert
function mapMessageToChatMessagesMvpInsert(message: Partial<Message>): ChatMessagesMvpInsert {
  return {
    id: message.id,
    chat_id: message.chatId || '',
    conteudo: message.content || '',
    tipo: mapMessageTypeToTipo(message.messageType),
    funcionario_id: message.senderId,
    lida: message.isRead || false,
    data_envio: message.sentAt,
    metadata: message.metadata
  };
}

// Helpers de mapeamento de tipos
function mapTipoToMessageType(tipo: ChatMessagesMvp['tipo']): Message['messageType'] {
  switch (tipo) {
    case 'texto': return 'text';
    case 'imagem': return 'image';
    case 'audio': return 'audio';
    case 'video': return 'video';
    case 'documento': return 'document';
    case 'localizacao': return 'location';
    default: return 'text';
  }
}

function mapMessageTypeToTipo(type?: Message['messageType']): ChatMessagesMvp['tipo'] {
  switch (type) {
    case 'text': return 'texto';
    case 'image': return 'imagem';
    case 'audio': return 'audio';
    case 'video': return 'video';
    case 'document': return 'documento';
    case 'location': return 'localizacao';
    default: return 'texto';
  }
}

// ================================================================
// INTERFACES DO HOOK
// ================================================================

export interface UseChatMessagesMvpOptions {
  chatId?: string;
  filters?: ChatMessagesMvpFilters;
  limit?: number;
  page?: number;
  enableRealtime?: boolean;
  cacheStrategy?: CacheStrategy;
}

export interface UseChatMessagesMvpReturn {
  // Dados
  messages: ChatMessagesMvp[] | undefined;
  totalCount: number;
  stats: ChatMessagesMvpStats | undefined;
  
  // Estados  
  isLoading: boolean;
  isLoadingStats: boolean;
  error: Error | null;
  
  // Paginação
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  
  // Ações
  sendMessage: (data: ChatMessagesMvpInsert) => Promise<ChatMessagesMvp>;
  updateMessage: (id: string, data: ChatMessagesMvpUpdate) => Promise<ChatMessagesMvp>;
  deleteMessage: (id: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
  
  // Utilidades
  refetch: () => void;
  refetchStats: () => void;
}

// ================================================================
// HOOK PRINCIPAL
// ================================================================

export function useChatMessagesMvp(options: UseChatMessagesMvpOptions = {}): UseChatMessagesMvpReturn {
  const {
    chatId,
    filters,
    limit = 50,
    enableRealtime = true,
    cacheStrategy = CacheStrategy.DYNAMIC
  } = options;

  // Cache unificado
  const cache = useUnifiedCache({ 
    module: 'chat-messages',
    enableAutoSync: true,
    enableOptimisticUpdates: true
  });
  
  const { invalidateRelated } = useCrossModuleInvalidation();

  // Combinar filtros com chatId se fornecido
  const combinedFilters = useMemo(() => ({
    ...filters,
    ...(chatId ? { chat_id: chatId } : {})
  }), [filters, chatId]);

  // Query para listar mensagens com paginação
  const {
    data,
    isLoading,
    error,
    refetch,
    page,
    nextPage,
    previousPage,
    goToPage,
    hasNextPage,
    hasPreviousPage
  } = usePaginatedQuery(
    ['chat-messages', 'list', chatId, JSON.stringify(combinedFilters)],
    async (page, limit) => {
      const result = await chatMessagesMvpService.findAll({
        filters: combinedFilters,
        limit,
        offset: page * limit,
        orderBy: 'data_envio',
        ascending: false
      });
      
      if (result.error) {
        throw result.error;
      }
      
      return {
        items: result.data || [],
        totalCount: result.count || 0,
        totalPages: Math.ceil((result.count || 0) / limit)
      };
    },
    limit,
    {
      ...cache.queryConfig,
      cacheStrategy,
      staleTime: cacheStrategy === CacheStrategy.STATIC ? 10 * 60 * 1000 : cache.queryConfig.staleTime
    }
  );

  // Query para estatísticas
  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useSupabaseQuery(
    ['chat-messages', 'stats', ...(combinedFilters ? [JSON.stringify(combinedFilters)] : [])],
    async () => {
      const result = await chatMessagesMvpService.getStats();
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      staleTime: 3 * 60 * 1000 // 3 minutos para stats de mensagens
    }
  );

  // Mutation para enviar mensagem
  const sendMessageMutation = cache.createMutation(
    async (data: ChatMessagesMvpInsert) => {
      const result = await chatMessagesMvpService.create(data);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        EventBus.emit(SystemEvents.CHAT_MESSAGE_SENT, {
          messageId: result.data.id,
          chatId: result.data.chat_id,
          userId: result.data.funcionario_id
        });
      }
      
      return result.data!;
    },
    {
      optimisticUpdate: (data) => ({
        ...data,
        id: crypto.randomUUID(),
        tipo: data.tipo || 'texto',
        remetente: data.remetente || 'funcionario',
        lida: false,
        data_envio: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      onSuccess: async (result, variables) => {
        // Toast silencioso para envio de mensagem
        // Invalidar módulos relacionados (chats para atualizar última mensagem)
        await invalidateRelated('chat-messages', ['chats']);
      }
    }
  );

  // Mutation para atualizar mensagem
  const updateMutation = useSupabaseMutation(
    async ({ id, data }: { id: string; data: ChatMessagesMvpUpdate }) => {
      const result = await chatMessagesMvpService.update(id, data);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        EventBus.emit(SystemEvents.CHAT_MESSAGE_UPDATED, {
          messageId: result.data.id,
          chatId: result.data.chat_id
        });
      }
      
      return result.data!;
    },
    {
      invalidateQueries: [['chat-messages'], ['chat-messages', 'stats']],
      onSuccess: () => {
        // Toast silencioso para update de mensagem
      }
    }
  );

  // Mutation para deletar mensagem
  const deleteMutation = useSupabaseMutation(
    async (id: string) => {
      const result = await chatMessagesMvpService.delete(id);
      
      if (result.error) {
        throw result.error;
      }
      
      EventBus.emit(SystemEvents.CHAT_MESSAGE_DELETED, {
        messageId: id
      });
    },
    {
      invalidateQueries: [['chat-messages'], ['chat-messages', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Mensagem removida',
          description: 'A mensagem foi removida com sucesso'
        });
      }
    }
  );

  // Mutation para marcar mensagem como lida
  const markAsReadMutation = useSupabaseMutation(
    async (messageId: string) => {
      const result = await chatMessagesMvpService.markAsRead(messageId);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      invalidateQueries: [['chat-messages'], ['chat-messages', 'stats'], ['chats']],
      onSuccess: () => {
        // Toast silencioso para marcar como lida
      }
    }
  );

  // Mutation para marcar chat como lido
  const markChatAsReadMutation = useSupabaseMutation(
    async (chatId: string) => {
      const result = await chatMessagesMvpService.markChatAsRead(chatId);
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    },
    {
      invalidateQueries: [['chat-messages'], ['chat-messages', 'stats'], ['chats']],
      onSuccess: () => {
        // Toast silencioso para marcar chat como lido
      }
    }
  );

  // Funções wrapper para as mutations
  const sendMessage = useCallback(async (data: ChatMessagesMvpInsert): Promise<ChatMessagesMvp> => {
    return await sendMessageMutation.mutateAsync(data);
  }, [sendMessageMutation]);

  const updateMessage = useCallback(async (id: string, data: ChatMessagesMvpUpdate): Promise<ChatMessagesMvp> => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteMessage = useCallback(async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    await markAsReadMutation.mutateAsync(messageId);
  }, [markAsReadMutation]);

  const markChatAsRead = useCallback(async (chatId: string): Promise<void> => {
    await markChatAsReadMutation.mutateAsync(chatId);
  }, [markChatAsReadMutation]);

  // Dados processados
  const messages = useMemo(() => data?.items, [data]);
  const totalCount = useMemo(() => data?.totalCount || 0, [data]);
  const totalPages = useMemo(() => data?.totalPages || 0, [data]);

  return {
    // Dados
    messages,
    totalCount,
    stats: statsData,
    
    // Estados
    isLoading,
    isLoadingStats,
    error,
    
    // Paginação
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    
    // Ações
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    markChatAsRead,
    
    // Utilidades
    refetch,
    refetchStats
  };
}

// ================================================================
// HOOK PARA MENSAGENS DE UM CHAT ESPECÍFICO
// ================================================================

export interface UseChatMessagesOptions {
  enableRealtime?: boolean;
  limit?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
}

export function useChatMessages(
  chatId: string, 
  options: UseChatMessagesOptions = {}
) {
  const { enableRealtime = true, limit = 50, beforeMessageId, afterMessageId } = options;
  
  const {
    data: messages,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['chat-messages', 'by-chat', chatId, beforeMessageId, afterMessageId],
    async () => {
      const result = await chatMessagesMvpService.findByChat(chatId, {
        limit,
        beforeMessageId,
        afterMessageId
      });
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data || [];
    },
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      enabled: !!chatId,
      staleTime: 30 * 1000 // 30 segundos para mensagens do chat
    }
  );

  return {
    messages,
    isLoading,
    error,
    refetch
  };
}

// ================================================================
// HOOK PARA MENSAGEM INDIVIDUAL
// ================================================================

export interface UseChatMessageMvpOptions {
  enableRealtime?: boolean;
}

export function useChatMessageMvp(
  id: string,
  options: UseChatMessageMvpOptions = {}
) {
  const { enableRealtime = true } = options;

  // Query para buscar mensagem
  const {
    data: message,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['chat-message', id],
    async () => {
      const result = await chatMessagesMvpService.findById(id);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      enabled: !!id
    }
  );

  // Mutations
  const updateMutation = useSupabaseMutation(
    async (data: ChatMessagesMvpUpdate) => {
      const result = await chatMessagesMvpService.update(id, data);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      invalidateQueries: [['chat-message', id], ['chat-messages']],
      onSuccess: () => {
        toast({
          title: 'Mensagem atualizada',
          description: 'Mensagem atualizada com sucesso'
        });
      }
    }
  );

  const deleteMutation = useSupabaseMutation(
    async () => {
      const result = await chatMessagesMvpService.delete(id);
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    },
    {
      invalidateQueries: [['chat-messages'], ['chat-messages', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Mensagem removida',
          description: 'Mensagem removida com sucesso'
        });
      }
    }
  );

  const update = useCallback(async (data: ChatMessagesMvpUpdate) => {
    await updateMutation.mutateAsync(data);
  }, [updateMutation]);

  const remove = useCallback(async () => {
    await deleteMutation.mutateAsync();
  }, [deleteMutation]);

  return {
    message,
    isLoading,
    error,
    update,
    remove,
    refetch
  };
}

// ================================================================
// HOOK PARA MENSAGENS DE MÍDIA
// ================================================================

export function useMediaMessages(chatId?: string) {
  return useChatMessagesMvp({
    chatId,
    filters: {
      hasMedia: true
    }
  });
}

// ================================================================
// HOOK PARA MENSAGENS RECENTES
// ================================================================

export function useRecentMessages(limit: number = 50) {
  const {
    data: messages,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['chat-messages', 'recent', limit],
    async () => {
      const result = await chatMessagesMvpService.getRecentMessages(limit);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data || [];
    },
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      staleTime: 60 * 1000 // 1 minuto para mensagens recentes
    }
  );

  return {
    messages,
    isLoading,
    error,
    refetch
  };
}

// ================================================================
// HOOK PARA MENSAGENS NÃO LIDAS
// ================================================================

export function useUnreadMessages() {
  return useChatMessagesMvp({
    filters: {
      lida: false
    }
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default useChatMessagesMvp;