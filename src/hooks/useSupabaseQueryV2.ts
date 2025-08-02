import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { EventBus, SystemEvents, useEventBus } from '@/lib/event-bus'
import { supabase } from '@/lib/supabase-client'
import { toast } from '@/hooks/use-toast'
import { getUnifiedCache } from '@/lib/cache/UnifiedCache'
import { CacheStrategy as UnifiedCacheStrategy, CacheOptions } from '@/lib/cache/types'
import { useCacheQuery, useCacheInvalidation, useOfflineCache } from '@/hooks/cache/useCache'

// Re-export tipos existentes para compatibilidade
export { CacheStrategy } from './useSupabaseQuery'
export type { SupabaseQueryOptions, SupabaseMutationOptions } from './useSupabaseQuery'

// Mapeamento de estratégias antigas para novas
const strategyMapping = {
  'static': UnifiedCacheStrategy.STATIC,
  'dynamic': UnifiedCacheStrategy.DYNAMIC,
  'realtime': UnifiedCacheStrategy.REALTIME,
  'critical': UnifiedCacheStrategy.CRITICAL,
  'historical': UnifiedCacheStrategy.HISTORICAL
}

// Hook principal otimizado com cache unificado
export function useSupabaseQuery<T = any>(
  queryKey: string[],
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  options: any = {},
  cacheStrategy: string = 'dynamic'
) {
  const cache = getUnifiedCache()
  const { isOnline, queueSize } = useOfflineCache()
  const cacheKey = queryKey.join(':')
  
  // Mapear estratégia
  const unifiedStrategy = strategyMapping[cacheStrategy] || UnifiedCacheStrategy.DYNAMIC

  // Configurações de cache baseadas na estratégia
  const cacheOptions: CacheOptions = {
    strategy: unifiedStrategy,
    persist: cacheStrategy !== 'critical',
    syncAcrossTabs: true,
    compress: cacheStrategy === 'historical',
    tags: queryKey
  }

  // Usar hook de cache unificado
  const query = useCacheQuery(
    queryKey,
    async () => {
      try {
        // Se offline e tem dados em cache, usar cache
        if (!isOnline) {
          const cachedData = await cache.get<T>(cacheKey)
          if (cachedData !== null) {
            console.log(`🔌 Offline mode: using cached data for ${cacheKey}`)
            return cachedData
          }
        }

        const { data, error } = await queryFn()
        
        if (error) {
          throw error
        }

        if (!data && options.fallbackData) {
          console.warn(`Using fallback data for query: ${cacheKey}`)
          return options.fallbackData
        }

        if (!data) {
          throw new Error('No data returned')
        }

        options.onSuccess?.(data)
        return data
      } catch (error) {
        const err = error as Error
        
        // Se offline, tentar cache mesmo expirado
        if (!isOnline) {
          const staleData = await cache.get<T>(cacheKey)
          if (staleData !== null) {
            console.warn(`🔌 Offline mode: using stale cache due to error`)
            return staleData
          }
        }
        
        if (options.showErrorToast !== false) {
          toast({
            title: 'Erro ao carregar dados',
            description: err.message,
            variant: 'destructive'
          })
        }

        options.onError?.(err)

        // Se houver fallback, retornar mesmo com erro
        if (options.fallbackData) {
          console.warn(`Error in query, using fallback: ${cacheKey}`, err)
          return options.fallbackData
        }

        throw err
      }
    },
    cacheOptions,
    {
      ...options,
      enabled: options.enabled !== false && (isOnline || cacheStrategy !== 'critical')
    }
  )

  // Adicionar informações de offline
  return {
    ...query,
    isOffline: !isOnline,
    offlineQueueSize: queueSize,
    cacheStrategy: unifiedStrategy
  }
}

// Hook para mutations com cache unificado
export function useSupabaseMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: Error | null }>,
  options: any = {}
) {
  const queryClient = useQueryClient()
  const cache = getUnifiedCache()
  const { invalidateByTags } = useCacheInvalidation()
  const { isOnline } = useOfflineCache()
  
  const mutation = useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      // Se offline e é operação crítica, adicionar à fila
      if (!isOnline && options.offlineQueue) {
        await cache.set(`offline:${Date.now()}`, {
          type: 'mutation',
          fn: mutationFn.toString(),
          variables,
          timestamp: Date.now()
        }, {
          strategy: UnifiedCacheStrategy.CRITICAL,
          persist: true
        })
        
        toast({
          title: 'Operação salva offline',
          description: 'Será sincronizada quando a conexão retornar'
        })
        
        return options.optimisticData || {} as TData
      }

      // Otimistic update
      if (options.optimisticUpdate) {
        options.optimisticUpdate(variables)
      }

      const { data, error } = await mutationFn(variables)
      
      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('No data returned')
      }

      return data
    },
    onSuccess: async (data, variables, context) => {
      if (options.showSuccessToast !== false) {
        toast({
          title: 'Sucesso',
          description: 'Operação realizada com sucesso'
        })
      }

      // Invalidar queries relacionadas
      if (options.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          await queryClient.invalidateQueries({ queryKey })
          
          // Invalidar também no cache unificado
          await invalidateByTags(queryKey)
        }
      }

      options.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      if (options.showErrorToast !== false) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive'
        })
      }

      options.onError?.(error, variables, context)
    },
    ...options
  })

  return {
    ...mutation,
    isOffline: !isOnline
  }
}

// Hook para real-time subscriptions com cache
export function useSupabaseSubscription(
  table: string,
  filters?: Record<string, any>,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  const queryClient = useQueryClient()
  const cache = getUnifiedCache()
  const { invalidate } = useCacheInvalidation()

  useEffect(() => {
    const channel = supabase
      .channel(`table-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filters && { filter: Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join(',') })
        },
        async (payload) => {
          console.log(`📡 Realtime event on ${table}:`, payload)

          // Invalidar cache relacionado
          await invalidate(table)

          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload)
              break
            case 'UPDATE':
              onUpdate?.(payload)
              break
            case 'DELETE':
              onDelete?.(payload)
              break
          }

          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ 
            predicate: (query) => query.queryKey[0] === table 
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filters])
}

// Hook helper para cache metrics
export function useCacheMetrics() {
  const cache = getUnifiedCache()
  const [metrics, setMetrics] = useState(cache.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(cache.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return metrics
}

// Hook para prefetch com cache
export async function prefetchWithCache(
  queryClient: QueryClient,
  queryKey: string[],
  queryFn: () => Promise<any>,
  cacheStrategy: string = 'dynamic'
) {
  const cache = getUnifiedCache()
  const cacheKey = queryKey.join(':')
  const unifiedStrategy = strategyMapping[cacheStrategy] || UnifiedCacheStrategy.DYNAMIC
  
  // Verificar cache primeiro
  const cached = await cache.get(cacheKey)
  if (cached !== null) {
    queryClient.setQueryData(queryKey, cached)
    return cached
  }
  
  // Fazer prefetch
  return queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const data = await queryFn()
      
      // Armazenar no cache unificado
      await cache.set(cacheKey, data, {
        strategy: unifiedStrategy,
        tags: queryKey
      })
      
      return data
    }
  })
}

// Re-exportar hooks auxiliares para compatibilidade
export { useSystemEvents, usePaginatedQuery, useSearchQuery } from './useSupabaseQuery'