// ================================================================
// HOOK USECHATSMVP - INTEGRAÇÃO COM TABELA MVP CHATS 
// ================================================================
// Data: 07/08/2025
// Descrição: Hook para gestão de chats usando chatsMvp.service.ts
// Migração: Sistema antigo → nova tabela chats (6 tabelas MVP)
// ================================================================

import { useCallback, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation, CacheStrategy, usePaginatedQuery } from './useSupabaseQuery';
import { chatsMvpService } from '@/services/chatsMvp.service';
import type { 
  ChatsMvp, 
  ChatsMvpFilters, 
  ChatsMvpStats,
  ChatsMvpInsert,
  ChatsMvpUpdate,
  ChatWithRelations
} from '@/services/chatsMvp.service';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from '@/hooks/use-toast';
import { useUnifiedCache, useCrossModuleInvalidation } from '@/hooks/useUnifiedCache';
import { QUERY_KEYS, getQueryConfig } from '@/lib/cache-manager';

// ================================================================
// MAPEAMENTO DE TIPOS - COMPATIBILIDADE COM SISTEMA ANTIGO
// ================================================================

// Interface Chat antiga que preciso manter compatível (se necessário)
export interface Chat {
  id: string;
  contactId: string;
  agentId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Mapeamento ChatsMvp → Chat (se necessário para compatibilidade)
function mapChatsMvpToChat(chat: ChatsMvp): Chat {
  return {
    id: chat.id,
    contactId: chat.cliente_id || '',
    agentId: chat.funcionario || '',
    lastMessage: chat.ultima_mensagem || undefined,
    lastMessageAt: chat.data_ultima_mensagem || undefined,
    unreadCount: chat.nao_lidas || 0,
    status: chat.status === 'ativo' ? 'active' : 
            chat.status === 'encerrado' ? 'closed' : 'archived',
    createdAt: chat.created_at,
    updatedAt: chat.updated_at
  };
}

// Mapeamento inverso Chat → ChatsMvpInsert
function mapChatToChatsMvpInsert(chat: Partial<Chat>): ChatsMvpInsert {
  return {
    id: chat.id,
    cliente_id: chat.contactId,
    funcionario: chat.agentId || '',
    ultima_mensagem: chat.lastMessage,
    data_ultima_mensagem: chat.lastMessageAt,
    nao_lidas: chat.unreadCount || 0,
    status: chat.status === 'active' ? 'ativo' : 
           chat.status === 'closed' ? 'encerrado' : 'arquivado',
    created_at: chat.createdAt,
    updated_at: chat.updatedAt
  };
}

// ================================================================
// INTERFACES DO HOOK
// ================================================================

export interface UseChatsMvpOptions {
  filters?: ChatsMvpFilters;
  limit?: number;
  page?: number;
  enableRealtime?: boolean;
  cacheStrategy?: CacheStrategy;
}

export interface UseChatsMvpReturn {
  // Dados
  chats: ChatsMvp[] | undefined;
  totalCount: number;
  stats: ChatsMvpStats | undefined;
  
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
  createChat: (data: ChatsMvpInsert) => Promise<ChatsMvp>;
  updateChat: (id: string, data: ChatsMvpUpdate) => Promise<ChatsMvp>;
  deleteChat: (id: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  archiveChat: (chatId: string) => Promise<void>;
  
  // Utilidades
  refetch: () => void;
  refetchStats: () => void;
}

// ================================================================
// HOOK PRINCIPAL
// ================================================================

export function useChatsMvp(options: UseChatsMvpOptions = {}): UseChatsMvpReturn {
  const {
    filters,
    limit = 20,
    enableRealtime = true,
    cacheStrategy = CacheStrategy.DYNAMIC
  } = options;

  // Cache unificado
  const cache = useUnifiedCache({ 
    module: 'chats',
    enableAutoSync: true,
    enableOptimisticUpdates: true
  });
  
  const { invalidateRelated } = useCrossModuleInvalidation();

  // Query para listar chats com paginação
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
    QUERY_KEYS.chats.list(filters),
    async (page, limit) => {
      const result = await chatsMvpService.findAll({
        filters,
        limit,
        offset: page * limit,
        orderBy: 'data_ultima_mensagem',
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
      staleTime: cacheStrategy === CacheStrategy.STATIC ? 30 * 60 * 1000 : cache.queryConfig.staleTime
    }
  );

  // Query para estatísticas
  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useSupabaseQuery(
    ['chats', 'stats', ...(filters ? [JSON.stringify(filters)] : [])],
    async () => {
      const result = await chatsMvpService.getStats();
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      staleTime: 5 * 60 * 1000
    }
  );

  // Mutation para criar chat
  const createMutation = cache.createMutation(
    async (data: ChatsMvpInsert) => {
      const result = await chatsMvpService.create(data);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        EventBus.emit(SystemEvents.CHAT_CREATED, {
          chat: result.data,
          userId: data.funcionario
        });
      }
      
      return result.data!;
    },
    {
      optimisticUpdate: (data) => ({
        ...data,
        id: crypto.randomUUID(),
        nao_lidas: 0,
        status: 'ativo' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      onSuccess: async () => {
        toast({
          title: 'Chat criado',
          description: 'Novo chat iniciado com sucesso'
        });
        await invalidateRelated('chats', ['dashboard', 'activities']);
      }
    }
  );

  // Mutation para atualizar chat
  const updateMutation = useSupabaseMutation(
    async ({ id, data }: { id: string; data: ChatsMvpUpdate }) => {
      const result = await chatsMvpService.update(id, data);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        EventBus.emit(SystemEvents.CHAT_UPDATED, {
          chat: result.data
        });
      }
      
      return result.data!;
    },
    {
      invalidateQueries: [['chats'], ['chats', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Chat atualizado',
          description: 'Chat atualizado com sucesso'
        });
      }
    }
  );

  // Mutation para deletar chat
  const deleteMutation = useSupabaseMutation(
    async (id: string) => {
      const result = await chatsMvpService.delete(id);
      
      if (result.error) {
        throw result.error;
      }
      
      EventBus.emit(SystemEvents.CHAT_DELETED, {
        chatId: id
      });
    },
    {
      invalidateQueries: [['chats'], ['chats', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Chat removido',
          description: 'Chat removido com sucesso'
        });
      }
    }
  );

  // Mutation para marcar como lido
  const markAsReadMutation = useSupabaseMutation(
    async (chatId: string) => {
      const result = await chatsMvpService.markAsRead(chatId);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      invalidateQueries: [['chats'], ['chats', 'stats']],
      onSuccess: () => {
        // Toast silencioso para marcar como lido
      }
    }
  );

  // Mutation para arquivar chat
  const archiveMutation = useSupabaseMutation(
    async (chatId: string) => {
      const result = await chatsMvpService.update(chatId, {
        status: 'arquivado'
      });
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      invalidateQueries: [['chats'], ['chats', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Chat arquivado',
          description: 'Chat arquivado com sucesso'
        });
      }
    }
  );

  // Funções wrapper para as mutations
  const createChat = useCallback(async (data: ChatsMvpInsert): Promise<ChatsMvp> => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateChat = useCallback(async (id: string, data: ChatsMvpUpdate): Promise<ChatsMvp> => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteChat = useCallback(async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const markAsRead = useCallback(async (chatId: string): Promise<void> => {
    await markAsReadMutation.mutateAsync(chatId);
  }, [markAsReadMutation]);

  const archiveChat = useCallback(async (chatId: string): Promise<void> => {
    await archiveMutation.mutateAsync(chatId);
  }, [archiveMutation]);

  // Dados processados
  const chats = useMemo(() => data?.items, [data]);
  const totalCount = useMemo(() => data?.totalCount || 0, [data]);
  const totalPages = useMemo(() => data?.totalPages || 0, [data]);

  return {
    // Dados
    chats,
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
    createChat,
    updateChat,
    deleteChat,
    markAsRead,
    archiveChat,
    
    // Utilidades
    refetch,
    refetchStats
  };
}

// ================================================================
// HOOK PARA CHAT INDIVIDUAL
// ================================================================

export interface UseChatMvpOptions {
  enableRealtime?: boolean;
}

export interface UseChatMvpReturn {
  chat: ChatsMvp | undefined;
  isLoading: boolean;
  error: Error | null;
  update: (data: ChatsMvpUpdate) => Promise<void>;
  remove: () => Promise<void>;
  markAsRead: () => Promise<void>;
  archive: () => Promise<void>;
  refetch: () => void;
}

export function useChatMvp(
  id: string,
  options: UseChatMvpOptions = {}
): UseChatMvpReturn {
  const { enableRealtime = true } = options;

  // Query para buscar chat
  const {
    data: chat,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['chat', id],
    async () => {
      const result = await chatsMvpService.findById(id);
      
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
    async (data: ChatsMvpUpdate) => {
      const result = await chatsMvpService.update(id, data);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        EventBus.emit(SystemEvents.CHAT_UPDATED, {
          chat: result.data
        });
      }
      
      return result.data;
    },
    {
      invalidateQueries: [['chat', id], ['chats']],
      onSuccess: () => {
        toast({
          title: 'Chat atualizado',
          description: 'Chat atualizado com sucesso'
        });
      }
    }
  );

  const deleteMutation = useSupabaseMutation(
    async () => {
      const result = await chatsMvpService.delete(id);
      
      if (result.error) {
        throw result.error;
      }
      
      EventBus.emit(SystemEvents.CHAT_DELETED, {
        chatId: id
      });
      
      return result;
    },
    {
      invalidateQueries: [['chats'], ['chats', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Chat removido',
          description: 'Chat removido com sucesso'
        });
      }
    }
  );

  const markAsReadMutation = useSupabaseMutation(
    async () => {
      const result = await chatsMvpService.markAsRead(id);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      invalidateQueries: [['chat', id], ['chats']],
    }
  );

  const archiveMutation = useSupabaseMutation(
    async () => {
      const result = await chatsMvpService.update(id, {
        status: 'arquivado'
      });
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      invalidateQueries: [['chat', id], ['chats']],
      onSuccess: () => {
        toast({
          title: 'Chat arquivado',
          description: 'Chat foi arquivado'
        });
      }
    }
  );

  const update = useCallback(async (data: ChatsMvpUpdate) => {
    await updateMutation.mutateAsync(data);
  }, [updateMutation]);

  const remove = useCallback(async () => {
    await deleteMutation.mutateAsync();
  }, [deleteMutation]);

  const markAsRead = useCallback(async () => {
    await markAsReadMutation.mutateAsync();
  }, [markAsReadMutation]);

  const archive = useCallback(async () => {
    await archiveMutation.mutateAsync();
  }, [archiveMutation]);

  return {
    chat,
    isLoading,
    error,
    update,
    remove,
    markAsRead,
    archive,
    refetch
  };
}

// ================================================================
// HOOK PARA ESTATÍSTICAS DE CHATS
// ================================================================

export interface UseChatsMvpStatsReturn {
  stats: ChatsMvpStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useChatsMvpStats(): UseChatsMvpStatsReturn {
  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['chats', 'stats'],
    async () => {
      const result = await chatsMvpService.getStats();
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    },
    {
      cacheStrategy: CacheStrategy.STATIC,
      staleTime: 5 * 60 * 1000 // 5 minutos
    }
  );

  return {
    stats,
    isLoading,
    error,
    refetch
  };
}

// ================================================================
// HOOK PARA CHATS ATIVOS DE UM AGENTE  
// ================================================================

export interface UseAgentActiveChatsOptions {
  agentId: string;
  enableRealtime?: boolean;
}

export function useAgentActiveChats(options: UseAgentActiveChatsOptions) {
  const { agentId, enableRealtime = true } = options;
  
  return useChatsMvp({
    filters: {
      funcionario: agentId,
      status: 'ativo'
    },
    enableRealtime
  });
}

// ================================================================
// HOOK PARA CHATS NÃO LIDOS
// ================================================================

export function useUnreadChats() {
  return useChatsMvp({
    filters: {
      hasUnread: true
    }
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default useChatsMvp;