import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { chatsService, ChatWithDetails, ChatFilters } from '@/services/chatsService';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Chaves para query cache
const QUERY_KEYS = {
  chats: (filters?: ChatFilters) => ['chats', filters],
  chat: (id: string) => ['chat', id],
  chatStats: (agentId?: string) => ['chat-stats', agentId],
  chatsByAgent: (agentId: string) => ['chats-by-agent', agentId]
};

// Hook para buscar lista de chats
export const useChats = (filters?: ChatFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.chats(filters),
    queryFn: () => chatsService.getChats(filters),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada minuto
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

// Hook para buscar chat específico
export const useChat = (chatId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.chat(chatId!),
    queryFn: () => chatsService.getChatById(chatId!),
    enabled: !!user && !!chatId,
    staleTime: 15 * 1000, // 15 segundos
    retry: 2
  });
};

// Hook para buscar chats por agente (para admin)
export const useChatsByAgent = (agentId?: string) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CREATOR';

  return useQuery({
    queryKey: QUERY_KEYS.chatsByAgent(agentId!),
    queryFn: () => chatsService.getChatsByAgent(agentId!),
    enabled: !!user && isAdmin && !!agentId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2
  });
};

// Hook para estatísticas de chats
export const useChatStats = (agentId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.chatStats(agentId),
    queryFn: () => chatsService.getChatStats(agentId),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
    retry: 2
  });
};

// Hook para criar novo chat
export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { agentId: string; contactId: string }) => 
      chatsService.findOrCreateChat(data.agentId, data.contactId),
    onSuccess: (newChat) => {
      // Invalidar cache de chats
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      // Adicionar chat ao cache se não existir
      queryClient.setQueryData(QUERY_KEYS.chat(newChat.id), newChat);
      
      toast({
        title: 'Chat criado',
        description: 'Nova conversa iniciada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar chat',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para atualizar chat
export const useUpdateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, data }: { chatId: string; data: any }) => 
      chatsService.updateChat(chatId, data),
    onSuccess: (updatedChat, variables) => {
      // Atualizar cache do chat específico
      queryClient.setQueryData(QUERY_KEYS.chat(variables.chatId), updatedChat);
      
      // Invalidar cache de lista de chats
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      toast({
        title: 'Chat atualizado',
        description: 'Conversa atualizada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar chat',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para marcar chat como lido
export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatsService.markChatAsRead(chatId),
    onSuccess: (_, chatId) => {
      // Atualizar cache do chat para zerar contador de não lidas
      queryClient.setQueryData(
        QUERY_KEYS.chat(chatId), 
        (oldData: ChatWithDetails | undefined) => {
          if (oldData) {
            return { ...oldData, unreadCount: 0 };
          }
          return oldData;
        }
      );
      
      // Invalidar cache de lista de chats para refletir mudanças
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: ['chat-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao marcar como lido',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para deletar chat
export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatsService.deleteChat(chatId),
    onSuccess: (_, chatId) => {
      // Remover chat do cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.chat(chatId) });
      
      // Invalidar lista de chats
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: ['chat-stats'] });
      
      toast({
        title: 'Chat deletado',
        description: 'Conversa removida com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar chat',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook composto para gerenciamento completo de chats
export const useChatsManager = (filters?: ChatFilters) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CREATOR';
  
  const chatsQuery = useChats(filters);
  const statsQuery = useChatStats(filters?.agentId);
  const createChatMutation = useCreateChat();
  const updateChatMutation = useUpdateChat();
  const markAsReadMutation = useMarkChatAsRead();
  const deleteChatMutation = useDeleteChat();

  // Funções de conveniência
  const createChat = (agentId: string, contactId: string) => {
    return createChatMutation.mutateAsync({ agentId, contactId });
  };

  const updateChat = (chatId: string, data: any) => {
    return updateChatMutation.mutateAsync({ chatId, data });
  };

  const markAsRead = (chatId: string) => {
    return markAsReadMutation.mutateAsync(chatId);
  };

  const deleteChat = (chatId: string) => {
    return deleteChatMutation.mutateAsync(chatId);
  };

  // Filtros para diferentes views
  const getUnreadChats = () => {
    return chatsQuery.data?.filter(chat => chat.unreadCount > 0) || [];
  };

  const getActiveChats = () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return chatsQuery.data?.filter(chat => 
      chat.lastMessage && new Date(chat.updatedAt) > threeDaysAgo
    ) || [];
  };

  const getChatsByAgent = (agentId: string) => {
    return chatsQuery.data?.filter(chat => chat.agentId === agentId) || [];
  };

  return {
    // Queries
    chats: chatsQuery.data || [],
    stats: statsQuery.data,
    isLoading: chatsQuery.isLoading || statsQuery.isLoading,
    isError: chatsQuery.isError || statsQuery.isError,
    error: chatsQuery.error || statsQuery.error,
    
    // Mutations
    createChat,
    updateChat,
    markAsRead,
    deleteChat,
    
    // Mutation states
    isCreating: createChatMutation.isPending,
    isUpdating: updateChatMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeleting: deleteChatMutation.isPending,
    
    // Filtered data
    unreadChats: getUnreadChats(),
    activeChats: getActiveChats(),
    getChatsByAgent,
    
    // Permissions
    canViewAllChats: isAdmin,
    canCreateChats: true,
    canDeleteChats: isAdmin,
    
    // Refresh functions
    refetch: () => {
      chatsQuery.refetch();
      statsQuery.refetch();
    }
  };
};

// Hook para busca em chats
export const useChatsSearch = (searchTerm: string, debounceMs: number = 300) => {
  const { user } = useAuth();
  
  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useQuery({
    queryKey: ['chats-search', debouncedSearchTerm],
    queryFn: () => chatsService.getChats({ search: debouncedSearchTerm }),
    enabled: !!user && debouncedSearchTerm.length >= 2,
    staleTime: 30 * 1000,
    retry: 1
  });
};