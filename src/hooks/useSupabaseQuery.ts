import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { EventBus, SystemEvents, useEventBus } from '@/lib/event-bus'
import { supabase } from '@/lib/supabase-client'
import { toast } from '@/hooks/use-toast'

// Tipos para o hook
export interface SupabaseQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  fallbackData?: T
  showErrorToast?: boolean
  cacheTime?: number
  staleTime?: number
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  autoRefetch?: boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface SupabaseMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  invalidateQueries?: string[][]
  optimisticUpdate?: (variables: TVariables) => void
}

// Cache strategies
export enum CacheStrategy {
  STATIC = 'static',      // 5 minutos, sem refetch
  DYNAMIC = 'dynamic',    // 1 minuto, refetch on focus
  REALTIME = 'realtime',  // 10 segundos, auto refetch
  CRITICAL = 'critical',  // Sem cache, sempre fresh
  HISTORICAL = 'historical' // 1 hora, dados históricos
}

const cacheConfigs = {
  [CacheStrategy.STATIC]: {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  },
  [CacheStrategy.DYNAMIC]: {
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  },
  [CacheStrategy.REALTIME]: {
    staleTime: 10 * 1000,
    cacheTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30 * 1000
  },
  [CacheStrategy.CRITICAL]: {
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  },
  [CacheStrategy.HISTORICAL]: {
    staleTime: 60 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  }
}

// Hook principal para queries
export function useSupabaseQuery<T = any>(
  queryKey: string[],
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  options: SupabaseQueryOptions<T> = {},
  cacheStrategy: CacheStrategy = CacheStrategy.DYNAMIC
) {
  const {
    fallbackData,
    showErrorToast = true,
    onSuccess,
    onError,
    ...queryOptions
  } = options

  const cacheConfig = cacheConfigs[cacheStrategy]

  const query = useQuery<T>({
    queryKey,
    queryFn: async () => {
      try {
        const { data, error } = await queryFn()
        
        if (error) {
          throw error
        }

        if (!data && fallbackData) {
          console.warn(`Using fallback data for query: ${queryKey.join('.')}`)
          return fallbackData
        }

        if (!data) {
          throw new Error('No data returned')
        }

        onSuccess?.(data)
        return data
      } catch (error) {
        const err = error as Error
        
        if (showErrorToast) {
          toast({
            title: 'Erro ao carregar dados',
            description: err.message,
            variant: 'destructive'
          })
        }

        onError?.(err)

        // Se houver fallback, retornar mesmo com erro
        if (fallbackData) {
          console.warn(`Error in query, using fallback: ${queryKey.join('.')}`, err)
          return fallbackData
        }

        throw err
      }
    },
    ...cacheConfig,
    ...queryOptions,
    enabled: queryOptions.enabled !== false
  })

  return query
}

// Hook para mutations
export function useSupabaseMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: Error | null }>,
  options: SupabaseMutationOptions<TData, TVariables> = {}
) {
  const queryClient = useQueryClient()
  const {
    showSuccessToast = true,
    showErrorToast = true,
    invalidateQueries = [],
    optimisticUpdate,
    onSuccess,
    onError,
    ...mutationOptions
  } = options

  const mutation = useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      // Otimistic update
      if (optimisticUpdate) {
        optimisticUpdate(variables)
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
    onSuccess: (data, variables, context) => {
      if (showSuccessToast) {
        toast({
          title: 'Sucesso',
          description: 'Operação realizada com sucesso'
        })
      }

      // Invalidar queries relacionadas
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey })
      })

      onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      if (showErrorToast) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive'
        })
      }

      onError?.(error, variables, context)
    },
    ...mutationOptions
  })

  return mutation
}

// Hook para real-time subscriptions
export function useSupabaseSubscription(
  table: string,
  filters?: Record<string, any>,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  const queryClient = useQueryClient()

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
        (payload) => {
          console.log(`📡 Realtime event on ${table}:`, payload)

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

// Hook para ouvir eventos do sistema
export function useSystemEvents(
  events: string[],
  handler: (event: string, data: any) => void
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const subscriptions = events.map(event => 
      EventBus.on(event, (data) => {
        handler(event, data)
        
        // Invalidar queries baseadas no evento
        const entityMap = {
          [SystemEvents.PROPERTY_CREATED]: ['properties'],
          [SystemEvents.PROPERTY_UPDATED]: ['properties'],
          [SystemEvents.PROPERTY_DELETED]: ['properties'],
          [SystemEvents.CONTACT_CREATED]: ['contacts'],
          [SystemEvents.CONTACT_UPDATED]: ['contacts'],
          [SystemEvents.CONTACT_STAGE_CHANGED]: ['contacts', 'deals'],
          [SystemEvents.APPOINTMENT_CREATED]: ['appointments', 'contacts'],
          [SystemEvents.APPOINTMENT_UPDATED]: ['appointments'],
          [SystemEvents.APPOINTMENT_CANCELED]: ['appointments'],
          [SystemEvents.DEAL_CREATED]: ['deals', 'contacts'],
          [SystemEvents.DEAL_UPDATED]: ['deals'],
          [SystemEvents.DEAL_STAGE_CHANGED]: ['deals', 'contacts'],
          [SystemEvents.DEAL_WON]: ['deals', 'contacts', 'properties'],
          [SystemEvents.DEAL_LOST]: ['deals', 'contacts']
        }

        const queriesToInvalidate = entityMap[event]
        if (queriesToInvalidate) {
          queriesToInvalidate.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey: [queryKey] })
          })
        }
      })
    )

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [events, handler])
}

// Hook helper para paginação
export function usePaginatedQuery<T = any>(
  baseKey: string[],
  queryFn: (page: number, limit: number) => Promise<{ data: T[] | null; error: Error | null; count: number }>,
  limit: number = 10,
  options?: SupabaseQueryOptions<{ items: T[]; totalCount: number; totalPages: number }>
) {
  const [page, setPage] = useState(0)
  
  const query = useSupabaseQuery(
    [...baseKey, 'page', page, 'limit', limit],
    async () => {
      const { data, error, count } = await queryFn(page, limit)
      
      if (error) throw error
      
      return {
        data: {
          items: data || [],
          totalCount: count,
          totalPages: Math.ceil(count / limit)
        },
        error: null
      }
    },
    options
  )

  const nextPage = useCallback(() => {
    if (query.data && page < query.data.totalPages - 1) {
      setPage(p => p + 1)
    }
  }, [page, query.data])

  const previousPage = useCallback(() => {
    if (page > 0) {
      setPage(p => p - 1)
    }
  }, [page])

  const goToPage = useCallback((newPage: number) => {
    if (query.data && newPage >= 0 && newPage < query.data.totalPages) {
      setPage(newPage)
    }
  }, [query.data])

  return {
    ...query,
    page,
    nextPage,
    previousPage,
    goToPage,
    hasNextPage: query.data ? page < query.data.totalPages - 1 : false,
    hasPreviousPage: page > 0
  }
}

// Hook para busca com debounce
export function useSearchQuery<T = any>(
  baseKey: string[],
  searchFn: (search: string) => Promise<{ data: T[] | null; error: Error | null }>,
  debounceMs: number = 300,
  options?: SupabaseQueryOptions<T[]>
) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [search, debounceMs])

  const query = useSupabaseQuery(
    [...baseKey, 'search', debouncedSearch],
    () => searchFn(debouncedSearch),
    {
      ...options,
      enabled: debouncedSearch.length > 0
    }
  )

  return {
    ...query,
    search,
    setSearch,
    clearSearch: () => setSearch('')
  }
}