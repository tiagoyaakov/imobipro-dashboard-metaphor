/**
 * Hook para uso do sistema de cache unificado
 * Facilita operações de cache com sintaxe simplificada
 */

import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { 
  getCacheManager, 
  QUERY_KEYS, 
  CACHE_CONFIG,
  getQueryConfig,
  type CacheManager 
} from '@/lib/cache-manager'
import { EventBus } from '@/lib/event-bus'
import { useToast } from '@/components/ui/use-toast'

interface UseUnifiedCacheOptions {
  module: keyof typeof QUERY_KEYS
  enableAutoSync?: boolean
  enableOptimisticUpdates?: boolean
}

export function useUnifiedCache(options: UseUnifiedCacheOptions) {
  const { module, enableAutoSync = true, enableOptimisticUpdates = true } = options
  const queryClient = useQueryClient()
  const cacheManager = useMemo(() => getCacheManager(queryClient), [queryClient])
  const { toast } = useToast()
  
  // Invalidar cache do módulo
  const invalidateModule = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS[module].all })
      
      if (enableAutoSync) {
        EventBus.emit('cache.invalidated', { module })
      }
    } catch (error) {
      console.error(`Error invalidating ${module} cache:`, error)
      toast({
        title: "Erro ao atualizar cache",
        description: "Tente novamente em alguns segundos",
        variant: "destructive",
      })
    }
  }, [module, queryClient, enableAutoSync, toast])
  
  // Invalidar item específico
  const invalidateItem = useCallback(async (id: string) => {
    try {
      // Invalidar detalhe
      if ('detail' in QUERY_KEYS[module]) {
        await queryClient.invalidateQueries({ 
          queryKey: (QUERY_KEYS[module] as any).detail(id) 
        })
      }
      
      // Invalidar listas também
      if ('lists' in QUERY_KEYS[module]) {
        await queryClient.invalidateQueries({ 
          queryKey: (QUERY_KEYS[module] as any).lists() 
        })
      }
      
      if (enableAutoSync) {
        EventBus.emit('cache.item.invalidated', { module, id })
      }
    } catch (error) {
      console.error(`Error invalidating ${module} item ${id}:`, error)
    }
  }, [module, queryClient, enableAutoSync])
  
  // Prefetch de dados
  const prefetchItem = useCallback(async (id: string, fetcher: () => Promise<any>) => {
    try {
      if ('detail' in QUERY_KEYS[module]) {
        await queryClient.prefetchQuery({
          queryKey: (QUERY_KEYS[module] as any).detail(id),
          queryFn: fetcher,
          staleTime: CACHE_CONFIG.staleTime[module as keyof typeof CACHE_CONFIG.staleTime],
        })
      }
    } catch (error) {
      console.error(`Error prefetching ${module} item ${id}:`, error)
    }
  }, [module, queryClient])
  
  // Update otimista
  const setOptimistic = useCallback((id: string, data: any) => {
    if (!enableOptimisticUpdates) return
    
    try {
      if ('detail' in QUERY_KEYS[module]) {
        queryClient.setQueryData(
          (QUERY_KEYS[module] as any).detail(id),
          data
        )
      }
      
      // Atualizar também nas listas
      if ('lists' in QUERY_KEYS[module]) {
        queryClient.setQueriesData(
          { queryKey: (QUERY_KEYS[module] as any).lists() },
          (oldData: any) => {
            if (!oldData || !Array.isArray(oldData)) return oldData
            
            return oldData.map((item: any) => 
              item.id === id ? { ...item, ...data } : item
            )
          }
        )
      }
    } catch (error) {
      console.error(`Error setting optimistic data for ${module} item ${id}:`, error)
    }
  }, [module, queryClient, enableOptimisticUpdates])
  
  // Mutation com cache automático
  const createMutation = useCallback(<TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: {
      onSuccess?: (data: TData, variables: TVariables) => void
      onError?: (error: Error, variables: TVariables) => void
      optimisticUpdate?: (variables: TVariables) => any
    }
  ) => {
    return useMutation({
      mutationFn,
      onMutate: async (variables) => {
        if (options?.optimisticUpdate && enableOptimisticUpdates) {
          const optimisticData = options.optimisticUpdate(variables)
          
          // Cancelar queries em progresso
          await queryClient.cancelQueries({ queryKey: QUERY_KEYS[module].all })
          
          // Guardar snapshot anterior
          const previousData = queryClient.getQueryData(QUERY_KEYS[module].all)
          
          // Aplicar update otimista
          if (optimisticData.id) {
            setOptimistic(optimisticData.id, optimisticData)
          }
          
          return { previousData }
        }
      },
      onError: (error, variables, context) => {
        // Reverter em caso de erro
        if (context?.previousData) {
          queryClient.setQueryData(QUERY_KEYS[module].all, context.previousData)
        }
        
        options?.onError?.(error as Error, variables)
        
        toast({
          title: "Erro na operação",
          description: error.message || "Ocorreu um erro ao processar a solicitação",
          variant: "destructive",
        })
      },
      onSuccess: (data, variables) => {
        // Invalidar cache após sucesso
        invalidateModule()
        
        options?.onSuccess?.(data, variables)
      },
      onSettled: () => {
        // Garantir que o cache seja atualizado
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS[module].all })
      },
    })
  }, [module, queryClient, enableOptimisticUpdates, invalidateModule, setOptimistic, toast])
  
  // Sincronizar com outros módulos
  const syncWithModules = useCallback(async (modules: Array<keyof typeof QUERY_KEYS>) => {
    try {
      await Promise.all(
        modules.map(mod => 
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS[mod].all })
        )
      )
      
      if (enableAutoSync) {
        EventBus.emit('cache.sync.completed', { modules })
      }
    } catch (error) {
      console.error('Error syncing modules:', error)
    }
  }, [queryClient, enableAutoSync])
  
  // Limpar cache do módulo
  const clearCache = useCallback(() => {
    cacheManager.clearModuleCache(module)
    
    toast({
      title: "Cache limpo",
      description: `Cache do módulo ${module} foi limpo com sucesso`,
    })
  }, [module, cacheManager, toast])
  
  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    return cacheManager.getCacheStats()
  }, [cacheManager])
  
  // Configuração de query padrão para o módulo
  const queryConfig = useMemo(() => 
    getQueryConfig(module as keyof typeof CACHE_CONFIG.staleTime),
    [module]
  )
  
  return {
    // Operações básicas
    invalidateModule,
    invalidateItem,
    prefetchItem,
    setOptimistic,
    
    // Mutations
    createMutation,
    
    // Sincronização
    syncWithModules,
    
    // Utilitários
    clearCache,
    getCacheStats,
    
    // Configurações
    queryConfig,
    queryKeys: QUERY_KEYS[module],
    
    // Manager direto (casos avançados)
    cacheManager,
  }
}

// Hook específico para invalidação cross-module
export function useCrossModuleInvalidation() {
  const queryClient = useQueryClient()
  
  const invalidateRelated = useCallback(async (
    sourceModule: keyof typeof QUERY_KEYS,
    relatedModules: Array<keyof typeof QUERY_KEYS>
  ) => {
    // Invalidar módulo fonte
    await queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS[sourceModule].all 
    })
    
    // Invalidar módulos relacionados
    await Promise.all(
      relatedModules.map(module =>
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS[module].all 
        })
      )
    )
    
    EventBus.emit('cache.cross-module.invalidated', {
      source: sourceModule,
      related: relatedModules,
    })
  }, [queryClient])
  
  return { invalidateRelated }
}

// Hook para monitoramento de cache
export function useCacheMonitor() {
  const queryClient = useQueryClient()
  const cacheManager = getCacheManager(queryClient)
  
  const stats = useMemo(() => cacheManager.getCacheStats(), [cacheManager])
  
  const logState = useCallback(() => {
    cacheManager.logCacheState()
  }, [cacheManager])
  
  return {
    stats,
    logState,
    isHealthy: stats.staleQueries < stats.totalQueries * 0.3, // Menos de 30% stale
  }
}