import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { messagesService, MessageWithSender, MessageFilters } from '@/services/messagesService';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Chaves para query cache
const QUERY_KEYS = {
  messages: (filters: MessageFilters) => ['messages', filters],
  messagesPaginated: (chatId: string) => ['messages-paginated', chatId],
  messageStats: (chatId: string) => ['message-stats', chatId],
  recentMessages: (chatId: string, limit?: number) => ['recent-messages', chatId, limit],
  lastMessage: (chatId: string) => ['last-message', chatId],
  unreadCount: (chatId: string, userId: string) => ['unread-count', chatId, userId]
};

// Hook para buscar mensagens de um chat
export const useMessages = (filters: MessageFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.messages(filters),
    queryFn: () => messagesService.getMessages(filters),
    enabled: !!user && !!filters.chatId,
    staleTime: 10 * 1000, // 10 segundos
    retry: 2
  });
};

// Hook para mensagens com paginação infinita
export const useMessagesInfinite = (chatId: string, limit: number = 50) => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.messagesPaginated(chatId),
    queryFn: ({ pageParam = 1 }) => 
      messagesService.getMessagesPaginated(chatId, pageParam, limit),
    enabled: !!user && !!chatId,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 30 * 1000,
    retry: 2
  });
};

// Hook para mensagens recentes (últimas N mensagens)
export const useRecentMessages = (chatId?: string, limit: number = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.recentMessages(chatId!, limit),
    queryFn: () => messagesService.getRecentMessages(chatId!, limit),
    enabled: !!user && !!chatId,
    staleTime: 5 * 1000, // 5 segundos
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
    retry: 2
  });
};

// Hook para última mensagem de um chat
export const useLastMessage = (chatId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.lastMessage(chatId!),
    queryFn: () => messagesService.getLastMessage(chatId!),
    enabled: !!user && !!chatId,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000, // Refetch a cada 15 segundos
    retry: 2
  });
};

// Hook para estatísticas de mensagens
export const useMessageStats = (chatId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.messageStats(chatId!),
    queryFn: () => messagesService.getMessageStats(chatId!),
    enabled: !!user && !!chatId,
    staleTime: 60 * 1000, // 1 minuto
    retry: 2
  });
};

// Hook para contador de mensagens não lidas
export const useUnreadCount = (chatId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.unreadCount(chatId!, user?.id!),
    queryFn: () => messagesService.getUnreadCount(chatId!, user?.id!),
    enabled: !!user && !!chatId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    retry: 2
  });
};

// Hook para enviar mensagem
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, content, senderId }: { 
      chatId: string; 
      content: string; 
      senderId: string; 
    }) => messagesService.sendMessage(chatId, content, senderId),
    onSuccess: (newMessage, variables) => {
      // Adicionar mensagem ao cache de mensagens recentes
      queryClient.setQueryData(
        QUERY_KEYS.recentMessages(variables.chatId, 20),
        (oldData: MessageWithSender[] | undefined) => {
          if (oldData) {
            return [...oldData, newMessage];
          }
          return [newMessage];
        }
      );

      // Atualizar última mensagem
      queryClient.setQueryData(
        QUERY_KEYS.lastMessage(variables.chatId),
        newMessage
      );

      // Invalidar cache de mensagens paginadas
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.messagesPaginated(variables.chatId) 
      });

      // Invalidar estatísticas
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.messageStats(variables.chatId) 
      });

      // Invalidar chats para atualizar última mensagem
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para atualizar mensagem
export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, data }: { messageId: string; data: any }) => 
      messagesService.updateMessage(messageId, data),
    onSuccess: () => {
      // Invalidar todas as queries de mensagens
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['recent-messages'] });
      queryClient.invalidateQueries({ queryKey: ['last-message'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar mensagem',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para deletar mensagem
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesService.deleteMessage(messageId),
    onSuccess: () => {
      // Invalidar todas as queries de mensagens
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['recent-messages'] });
      queryClient.invalidateQueries({ queryKey: ['last-message'] });
      queryClient.invalidateQueries({ queryKey: ['message-stats'] });
      
      toast({
        title: 'Mensagem deletada',
        description: 'Mensagem removida com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar mensagem',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para busca global em mensagens
export const useMessagesSearch = (searchTerm: string, agentId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages-search', searchTerm, agentId],
    queryFn: () => messagesService.searchMessages(searchTerm, agentId),
    enabled: !!user && searchTerm.length >= 2,
    staleTime: 30 * 1000,
    retry: 1
  });
};

// Hook para tempo real - subscribe para novas mensagens
export const useMessagesRealTime = (
  chatId?: string,
  onNewMessage?: (message: MessageWithSender) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    const subscription = messagesService.subscribeToMessages(
      chatId,
      (newMessage) => {
        // Atualizar cache automaticamente
        queryClient.setQueryData(
          QUERY_KEYS.recentMessages(chatId, 20),
          (oldData: MessageWithSender[] | undefined) => {
            if (oldData) {
              // Evitar duplicatas
              const exists = oldData.some(msg => msg.id === newMessage.id);
              if (!exists) {
                return [...oldData, newMessage];
              }
            }
            return oldData;
          }
        );

        // Atualizar última mensagem
        queryClient.setQueryData(QUERY_KEYS.lastMessage(chatId), newMessage);

        // Invalidar paginação
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.messagesPaginated(chatId) 
        });

        // Invalidar chats para atualizar contador
        queryClient.invalidateQueries({ queryKey: ['chats'] });

        // Callback personalizado
        onNewMessage?.(newMessage);
      },
      onError
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId, queryClient, onNewMessage, onError]);
};

// Hook composto para gerenciamento completo de mensagens de um chat
export const useMessagesManager = (
  chatId?: string,
  options: {
    enableRealTime?: boolean;
    enablePagination?: boolean;
    limit?: number;
    onNewMessage?: (message: MessageWithSender) => void;
  } = {}
) => {
  const { user } = useAuth();
  const { enableRealTime = true, enablePagination = false, limit = 20, onNewMessage } = options;

  // Queries
  const recentMessagesQuery = useRecentMessages(chatId, limit);
  const paginatedQuery = useMessagesInfinite(chatId, limit);
  const statsQuery = useMessageStats(chatId);
  const unreadQuery = useUnreadCount(chatId);

  // Mutations
  const sendMessageMutation = useSendMessage();
  const updateMessageMutation = useUpdateMessage();
  const deleteMessageMutation = useDeleteMessage();

  // Real-time subscription
  useMessagesRealTime(
    enableRealTime ? chatId : undefined,
    onNewMessage,
    (error) => {
      console.error('Real-time messages error:', error);
    }
  );

  // Funções de conveniência
  const sendMessage = useCallback((content: string) => {
    if (!chatId || !user?.id) return Promise.reject('Chat ID ou User ID não encontrado');
    
    return sendMessageMutation.mutateAsync({
      chatId,
      content,
      senderId: user.id
    });
  }, [chatId, user?.id, sendMessageMutation]);

  const updateMessage = useCallback((messageId: string, data: any) => {
    return updateMessageMutation.mutateAsync({ messageId, data });
  }, [updateMessageMutation]);

  const deleteMessage = useCallback((messageId: string) => {
    return deleteMessageMutation.mutateAsync(messageId);
  }, [deleteMessageMutation]);

  // Processar mensagens para adicionar metadata
  const processMessages = useCallback((messages: MessageWithSender[]) => {
    return messages.map(message => ({
      ...message,
      isFromCurrentUser: message.senderId === user?.id,
      // Adicionar outros campos úteis se necessário
    }));
  }, [user?.id]);

  const messages = enablePagination 
    ? paginatedQuery.data?.pages.flatMap(page => page.messages) || []
    : recentMessagesQuery.data || [];

  const processedMessages = processMessages(messages);

  return {
    // Data
    messages: processedMessages,
    stats: statsQuery.data,
    unreadCount: unreadQuery.data || 0,
    
    // Loading states
    isLoading: recentMessagesQuery.isLoading || (enablePagination && paginatedQuery.isLoading),
    isLoadingMore: enablePagination && paginatedQuery.isFetchingNextPage,
    isError: recentMessagesQuery.isError || (enablePagination && paginatedQuery.isError),
    error: recentMessagesQuery.error || (enablePagination && paginatedQuery.error),
    
    // Pagination (se habilitada)
    hasNextPage: enablePagination ? paginatedQuery.hasNextPage : false,
    fetchNextPage: enablePagination ? paginatedQuery.fetchNextPage : undefined,
    
    // Actions
    sendMessage,
    updateMessage,
    deleteMessage,
    
    // Action states
    isSending: sendMessageMutation.isPending,
    isUpdating: updateMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    
    // Utilities
    refetch: () => {
      recentMessagesQuery.refetch();
      if (enablePagination) paginatedQuery.refetch();
      statsQuery.refetch();
      unreadQuery.refetch();
    },
    
    // Chat info
    chatId,
    canSendMessages: !!chatId && !!user,
    
    // Message utilities
    getMessageById: (messageId: string) => 
      processedMessages.find(msg => msg.id === messageId),
    getLastMessage: () => processedMessages[processedMessages.length - 1],
    getMessagesFromUser: (userId: string) => 
      processedMessages.filter(msg => msg.senderId === userId),
  };
};