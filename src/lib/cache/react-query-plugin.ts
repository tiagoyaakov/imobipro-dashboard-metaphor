import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { getUnifiedCache } from './UnifiedCache';
import { CacheStrategy } from './types';

/**
 * Plugin para integrar o Cache Unificado com React Query
 */
export function createQueryClientWithCache() {
  const cache = getUnifiedCache();

  return new QueryClient({
    queryCache: new QueryCache({
      // Sincronizar com cache unificado ao buscar dados
      onSuccess: async (data, query) => {
        const queryKey = query.queryKey;
        const cacheKey = Array.isArray(queryKey) ? queryKey.join(':') : String(queryKey);
        
        // Determinar estratégia baseada no staleTime
        let strategy = CacheStrategy.DYNAMIC;
        if (query.options.staleTime === Infinity) {
          strategy = CacheStrategy.STATIC;
        } else if (query.options.staleTime === 0) {
          strategy = CacheStrategy.REALTIME;
        } else if (query.options.staleTime && query.options.staleTime < 30000) {
          strategy = CacheStrategy.CRITICAL;
        }

        // Armazenar no cache unificado
        await cache.set(cacheKey, data, {
          strategy,
          tags: query.meta?.tags as string[],
          syncAcrossTabs: true
        });
      },

      // Notificar erros
      onError: (error, query) => {
        console.error('Query error:', {
          queryKey: query.queryKey,
          error
        });
      }
    }),

    mutationCache: new MutationCache({
      // Invalidar cache relacionado após mutações
      onSuccess: async (data, variables, context, mutation) => {
        const invalidateKeys = mutation.meta?.invalidateKeys as string[];
        
        if (invalidateKeys) {
          for (const key of invalidateKeys) {
            await cache.invalidate(key);
          }
        }
      }
    }),

    defaultOptions: {
      queries: {
        // Tentar cache unificado antes de fazer request
        queryFn: async ({ queryKey, queryFn, meta }) => {
          if (!queryFn) return null;

          const cacheKey = Array.isArray(queryKey) ? queryKey.join(':') : String(queryKey);
          const useCache = meta?.useCache !== false;

          if (useCache) {
            // Tentar obter do cache primeiro
            const cached = await cache.get(cacheKey);
            if (cached !== null) {
              return cached;
            }
          }

          // Executar query function original
          return queryFn();
        },

        // Configurações padrão
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
        retry: (failureCount, error: any) => {
          // Não retentar em erros de autenticação
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
      },

      mutations: {
        // Configurações padrão para mutações
        retry: false,
        onError: (error) => {
          console.error('Mutation error:', error);
        }
      }
    }
  });
}

/**
 * Hook helper para usar query com cache unificado
 */
export function createCacheAwareQueryOptions<T>(
  key: string | string[],
  fetcher: () => Promise<T>,
  options?: {
    strategy?: CacheStrategy;
    tags?: string[];
    syncAcrossTabs?: boolean;
    staleTime?: number;
  }
) {
  const queryKey = Array.isArray(key) ? key : [key];
  
  return {
    queryKey,
    queryFn: fetcher,
    staleTime: options?.staleTime ?? getStaleTimeForStrategy(options?.strategy),
    meta: {
      useCache: true,
      tags: options?.tags,
      strategy: options?.strategy
    }
  };
}

/**
 * Determina staleTime baseado na estratégia
 */
function getStaleTimeForStrategy(strategy?: CacheStrategy): number {
  switch (strategy) {
    case CacheStrategy.STATIC:
      return 30 * 60 * 1000; // 30 minutos
    case CacheStrategy.DYNAMIC:
      return 30 * 1000; // 30 segundos
    case CacheStrategy.REALTIME:
      return 0; // Sempre fresh
    case CacheStrategy.CRITICAL:
      return 10 * 1000; // 10 segundos
    case CacheStrategy.HISTORICAL:
      return 5 * 60 * 1000; // 5 minutos
    default:
      return 30 * 1000; // 30 segundos padrão
  }
}

/**
 * Invalidação inteligente baseada em padrões
 */
export async function invalidateRelatedQueries(
  queryClient: QueryClient,
  patterns: string[]
) {
  const cache = getUnifiedCache();
  
  // Invalidar no React Query
  for (const pattern of patterns) {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        const keyString = Array.isArray(queryKey) ? queryKey.join(':') : String(queryKey);
        return keyString.includes(pattern);
      }
    });
  }
  
  // Invalidar no cache unificado
  for (const pattern of patterns) {
    await cache.invalidate(pattern);
  }
}

/**
 * Prefetch com cache unificado
 */
export async function prefetchWithCache(
  queryClient: QueryClient,
  key: string | string[],
  fetcher: () => Promise<any>,
  options?: {
    strategy?: CacheStrategy;
    tags?: string[];
  }
) {
  const cache = getUnifiedCache();
  const queryKey = Array.isArray(key) ? key : [key];
  const cacheKey = queryKey.join(':');
  
  // Verificar se já está no cache
  const cached = await cache.get(cacheKey);
  if (cached !== null) {
    // Adicionar ao React Query cache
    queryClient.setQueryData(queryKey, cached);
    return cached;
  }
  
  // Fazer prefetch normal
  return queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetcher();
      
      // Armazenar no cache unificado
      await cache.set(cacheKey, data, {
        strategy: options?.strategy || CacheStrategy.DYNAMIC,
        tags: options?.tags
      });
      
      return data;
    }
  });
}