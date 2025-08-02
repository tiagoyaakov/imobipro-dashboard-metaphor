import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { getUnifiedCache } from '@/lib/cache/UnifiedCache';
import { CacheStrategy, CacheOptions, CacheMetrics } from '@/lib/cache/types';

/**
 * Hook principal para interação com o cache unificado
 */
export function useCache<T = any>(
  key: string,
  options?: CacheOptions
) {
  const cache = getUnifiedCache();
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar valor inicial
  useEffect(() => {
    let mounted = true;

    const loadValue = async () => {
      try {
        setLoading(true);
        const cachedValue = await cache.get<T>(key);
        
        if (mounted) {
          setValue(cachedValue);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadValue();

    // Escutar atualizações do cache
    const unsubscribe = cache.addEventListener((event) => {
      if (event.type === 'set' && event.key === key) {
        loadValue();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [key]);

  // Métodos de manipulação
  const set = useCallback(async (newValue: T) => {
    try {
      await cache.set(key, newValue, options);
      setValue(newValue);
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [key, options]);

  const remove = useCallback(async () => {
    try {
      await cache.delete(key);
      setValue(null);
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [key]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const freshValue = await cache.get<T>(key);
      setValue(freshValue);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  return {
    data: value,
    loading,
    error,
    set,
    remove,
    refresh
  };
}

/**
 * Hook integrado com React Query
 */
export function useCacheQuery<T = any>(
  queryKey: QueryKey,
  fetcher: () => Promise<T>,
  cacheOptions?: CacheOptions & {
    strategy?: CacheStrategy;
    staleTime?: number;
  },
  queryOptions?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const cache = getUnifiedCache();
  const cacheKey = Array.isArray(queryKey) ? queryKey.join(':') : String(queryKey);

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      // Usar cache unificado com fallback para fetcher
      return cache.getOrSet(
        cacheKey,
        fetcher,
        {
          strategy: cacheOptions?.strategy || CacheStrategy.DYNAMIC,
          ...cacheOptions
        }
      );
    },
    staleTime: cacheOptions?.staleTime,
    ...queryOptions
  });
}

/**
 * Hook para invalidação de cache
 */
export function useCacheInvalidation() {
  const cache = getUnifiedCache();

  const invalidate = useCallback(async (pattern: string | RegExp) => {
    await cache.invalidate(pattern);
  }, []);

  const invalidateByTags = useCallback(async (tags: string[]) => {
    await cache.clearByTags(tags);
  }, []);

  const invalidateByStrategy = useCallback(async (strategy: CacheStrategy) => {
    await cache.clearByStrategy(strategy);
  }, []);

  const invalidateAll = useCallback(async () => {
    await cache.clear();
  }, []);

  return {
    invalidate,
    invalidateByTags,
    invalidateByStrategy,
    invalidateAll
  };
}

/**
 * Hook para métricas de cache
 */
export function useCacheMetrics() {
  const cache = getUnifiedCache();
  const [metrics, setMetrics] = useState<CacheMetrics>(cache.getMetrics());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Atualizar métricas periodicamente
    const updateMetrics = () => {
      setMetrics(cache.getMetrics());
    };

    intervalRef.current = setInterval(updateMetrics, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    cache.resetMetrics();
    setMetrics(cache.getMetrics());
  }, []);

  return {
    ...metrics,
    reset
  };
}

/**
 * Hook para cache com otimistic updates
 */
export function useOptimisticCache<T = any>(
  key: string,
  options?: CacheOptions
) {
  const cache = useCache<T>(key, options);
  const [optimisticValue, setOptimisticValue] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const setOptimistic = useCallback(async (
    newValue: T,
    updater: () => Promise<void>
  ) => {
    // Aplicar atualização otimista
    setOptimisticValue(newValue);
    setIsOptimistic(true);

    try {
      // Executar atualização real
      await updater();
      
      // Atualizar cache
      await cache.set(newValue);
      
      // Limpar estado otimista
      setOptimisticValue(null);
      setIsOptimistic(false);
    } catch (error) {
      // Reverter em caso de erro
      setOptimisticValue(null);
      setIsOptimistic(false);
      throw error;
    }
  }, [cache, key]);

  return {
    ...cache,
    data: isOptimistic ? optimisticValue : cache.data,
    isOptimistic,
    setOptimistic
  };
}

/**
 * Hook para gerenciar cache offline
 */
export function useOfflineCache() {
  const cache = getUnifiedCache();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Atualizar tamanho da fila periodicamente
    const interval = setInterval(() => {
      setQueueSize(cache.getOfflineQueueSize());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    queueSize,
    syncStatus: cache.getSyncStatus()
  };
}

/**
 * Hook para cache com debounce
 */
export function useDebouncedCache<T = any>(
  key: string,
  delay: number = 500,
  options?: CacheOptions
) {
  const cache = useCache<T>(key, options);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setDebounced = useCallback((value: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      cache.set(value);
    }, delay);
  }, [cache, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...cache,
    setDebounced
  };
}

/**
 * Hook para cache com transformação
 */
export function useTransformedCache<T = any, R = T>(
  key: string,
  transform: (value: T | null) => R,
  options?: CacheOptions
) {
  const cache = useCache<T>(key, options);
  const [transformedData, setTransformedData] = useState<R>(() => 
    transform(cache.data)
  );

  useEffect(() => {
    setTransformedData(transform(cache.data));
  }, [cache.data, transform]);

  return {
    ...cache,
    data: transformedData,
    rawData: cache.data
  };
}