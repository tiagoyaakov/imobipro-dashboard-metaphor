// ================================================================
// CONFIGURAÇÃO REACT QUERY CLIENT - IMOBIPRO
// ================================================================
// Data: 01/02/2025
// Descrição: Configuração otimizada do React Query para ImobiPRO
// Features: Cache inteligente, retry strategies, error handling
// ================================================================

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

// ================================================================
// CONFIGURAÇÕES DE CACHE GLOBAIS
// ================================================================

export const CACHE_STRATEGIES = {
  // Dados estáticos (raramente mudam)
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  
  // Dados dinâmicos (mudam frequentemente)
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000, // 1 minuto
  },

  // Dados em tempo real (atualização constante)
  REALTIME: {
    staleTime: 0, // Sempre stale
    cacheTime: 1 * 60 * 1000, // 1 minuto
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 10 * 1000, // 10 segundos
  },

  // Dados críticos (alta prioridade)
  CRITICAL: {
    staleTime: 10 * 1000, // 10 segundos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 5,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // Dados históricos (pouco volateis)
  HISTORICAL: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 2 * 60 * 60 * 1000, // 2 horas
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
} as const;

// ================================================================
// CONFIGURAÇÃO DE RETRY
// ================================================================

const getRetryConfig = (context: any) => {
  const { failureCount, error } = context;
  
  // Não retry para erros 4xx (cliente)
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }
  
  // Limite máximo de tentativas
  const maxRetries = 3;
  
  // Exponential backoff
  if (failureCount < maxRetries) {
    return Math.min(1000 * 2 ** failureCount, 30000);
  }
  
  return false;
};

// ================================================================
// QUERY CACHE COM ERROR HANDLING
// ================================================================

const queryCache = new QueryCache({
  onError: (error: any, query) => {
    const errorMessage = error?.message || 'Erro desconhecido';
    const queryKey = query.queryKey[0] as string;
    
    // Log detalhado para desenvolvimento
    if (import.meta.env.DEV) {
      console.error('🔴 Query Error:', {
        queryKey: query.queryKey,
        error: errorMessage,
        meta: query.meta,
        state: query.state,
      });
    }

    // Notificações específicas por tipo de erro
    if (error?.code === 'PGRST116') {
      // Não mostrar toast para "not found" - é esperado
      return;
    }

    if (error?.status === 401) {
      toast.error('Sessão expirada. Faça login novamente.');
      // Aqui poderia redirecionar para login
      return;
    }

    if (error?.status === 403) {
      toast.error('Acesso negado. Você não tem permissão para esta ação.');
      return;
    }

    if (error?.status >= 500) {
      toast.error('Erro no servidor. Tente novamente em alguns instantes.');
      return;
    }

    // Erros de conexão
    if (error?.name === 'NetworkError' || !navigator.onLine) {
      toast.error('Sem conexão com a internet. Verifique sua conexão.');
      return;
    }

    // Toast genérico para outros erros
    if (query.meta?.showErrorToast !== false) {
      toast.error(`Erro ao carregar ${queryKey}: ${errorMessage}`);
    }
  },

  onSuccess: (data, query) => {
    // Log de sucesso em desenvolvimento
    if (import.meta.env.DEV && query.meta?.logSuccess) {
      console.log('✅ Query Success:', {
        queryKey: query.queryKey,
        dataSize: Array.isArray(data) ? data.length : 'single',
        cacheTime: query.cacheTime,
      });
    }
  },
});

// ================================================================
// MUTATION CACHE COM ERROR HANDLING
// ================================================================

const mutationCache = new MutationCache({
  onError: (error: any, variables, context, mutation) => {
    const errorMessage = error?.message || 'Erro ao executar operação';
    
    if (import.meta.env.DEV) {
      console.error('🔴 Mutation Error:', {
        variables,
        error: errorMessage,
        context,
        meta: mutation.meta,
      });
    }

    // Notificações específicas
    if (error?.status === 409) {
      toast.error('Conflito: este registro foi modificado por outro usuário.');
      return;
    }

    if (error?.status === 422) {
      toast.error('Dados inválidos. Verifique os campos e tente novamente.');
      return;
    }

    if (mutation.meta?.showErrorToast !== false) {
      toast.error(errorMessage);
    }
  },

  onSuccess: (data, variables, context, mutation) => {
    if (import.meta.env.DEV && mutation.meta?.logSuccess) {
      console.log('✅ Mutation Success:', {
        variables,
        result: data,
        context,
      });
    }

    // Toast de sucesso se configurado
    if (mutation.meta?.successMessage) {
      toast.success(mutation.meta.successMessage as string);
    }
  },
});

// ================================================================
// QUERY CLIENT PRINCIPAL
// ================================================================

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Configurações padrão para todas as queries
      staleTime: 30 * 1000, // 30 segundos por padrão
      cacheTime: 5 * 60 * 1000, // 5 minutos por padrão
      refetchOnWindowFocus: false, // Desabilitado por padrão
      refetchOnReconnect: true,
      retry: getRetryConfig,
      
      // Error handling personalizado
      throwOnError: false,
      
      // Configurações de rede
      networkMode: 'online',
    },
    mutations: {
      // Configurações padrão para mutations
      retry: 1,
      networkMode: 'online',
      
      // Meta padrão
      meta: {
        showErrorToast: true,
      },
    },
  },
});

// ================================================================
// UTILITÁRIOS DE CACHE
// ================================================================

/**
 * Invalidar cache por padrão de chaves
 */
export const invalidateQueriesByPattern = (pattern: string[]) => {
  return queryClient.invalidateQueries({
    queryKey: pattern,
    exact: false,
  });
};

/**
 * Remover queries antigas para liberar memória
 */
export const clearOldCache = (olderThan: number = 60 * 60 * 1000) => {
  const now = Date.now();
  const cache = queryClient.getQueryCache();
  
  cache.getAll().forEach(query => {
    if (query.state.dataUpdatedAt < now - olderThan) {
      cache.remove(query);
    }
  });
};

/**
 * Prefetch inteligente de dados relacionados
 */
export const prefetchRelatedData = async (
  entityType: string, 
  entityId: string
) => {
  const prefetchers = {
    property: () => Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['property', entityId, 'images'],
        queryFn: () => {/* buscar imagens */},
        ...CACHE_STRATEGIES.STATIC,
      }),
      queryClient.prefetchQuery({
        queryKey: ['property', entityId, 'activities'],
        queryFn: () => {/* buscar atividades */},
        ...CACHE_STRATEGIES.DYNAMIC,
      }),
    ]),
    contact: () => Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['contact', entityId, 'activities'],
        queryFn: () => {/* buscar atividades */},
        ...CACHE_STRATEGIES.DYNAMIC,
      }),
      queryClient.prefetchQuery({
        queryKey: ['contact', entityId, 'appointments'],
        queryFn: () => {/* buscar agendamentos */},
        ...CACHE_STRATEGIES.DYNAMIC,
      }),
    ]),
  };

  const prefetcher = prefetchers[entityType as keyof typeof prefetchers];
  if (prefetcher) {
    await prefetcher();
  }
};

/**
 * Otimistic updates helper
 */
export const setOptimisticData = <T>(
  queryKey: string[],
  updater: (oldData: T | undefined) => T
) => {
  return queryClient.setQueryData(queryKey, updater);
};

/**
 * Revalidar dados críticos
 */
export const revalidateCriticalData = () => {
  return Promise.all([
    invalidateQueriesByPattern(['dashboard', 'stats']),
    invalidateQueriesByPattern(['activities']),
    invalidateQueriesByPattern(['appointments', 'today']),
    invalidateQueriesByPattern(['deals', 'active']),
  ]);
};

// ================================================================
// MONITORAMENTO DE PERFORMANCE
// ================================================================

export const getCacheStats = () => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  return {
    totalQueries: queries.length,
    activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
    staleQueries: queries.filter(q => q.isStale()).length,
    errorQueries: queries.filter(q => q.state.error).length,
    cacheSize: queries.reduce((acc, q) => {
      return acc + JSON.stringify(q.state.data || {}).length;
    }, 0),
    oldestQuery: Math.min(...queries.map(q => q.state.dataUpdatedAt)),
    newestQuery: Math.max(...queries.map(q => q.state.dataUpdatedAt)),
  };
};

// ================================================================
// CONFIGURAÇÃO DE PERSISTÊNCIA (OPCIONAL)
// ================================================================

export const persistConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  buster: 'imobipro-v1', // Incrementar para limpar cache
  serialize: JSON.stringify,
  deserialize: JSON.parse,
};

// ================================================================
// CLEANUP AUTOMÁTICO
// ================================================================

// Limpar cache antigo a cada 30 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    clearOldCache();
  }, 30 * 60 * 1000);
  
  // Limpar ao descarregar a página
  window.addEventListener('beforeunload', () => {
    clearOldCache(10 * 60 * 1000); // Limpar queries mais antigas que 10 min
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default queryClient;
export {
  queryCache,
  mutationCache,
  CACHE_STRATEGIES,
};