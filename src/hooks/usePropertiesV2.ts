// ================================================================
// HOOK USEPROPERTIES V2 - INTEGRADO COM CACHE UNIFICADO
// ================================================================
// Data: 02/08/2025
// Descrição: Versão otimizada do hook de propriedades com cache unificado
// Features: Cache persistente, sincronização entre tabs, suporte offline
// ================================================================

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getUnifiedCache } from '@/lib/cache/UnifiedCache';
import { CacheStrategy } from '@/lib/cache/types';
import { 
  useCacheQuery, 
  useCacheMutation, 
  useCacheInvalidation,
  useOfflineCache,
  useCachePrefetch,
  useOptimisticCache
} from '@/hooks/cache/useCache';
import { propertyService } from '@/services';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from 'sonner';
import type { 
  Property, 
  PropertyFilters, 
  PropertyFormData,
  PropertyStats,
  PropertyStatus,
  PropertyType,
  CreatePropertyDTO,
  UpdatePropertyDTO 
} from '@/types/property';

// ================================================================
// KEYS DE CACHE CONSOLIDADAS
// ================================================================

export const PROPERTY_QUERY_KEYS = {
  all: ['properties'] as const,
  lists: () => [...PROPERTY_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: PropertyFilters) => 
    [...PROPERTY_QUERY_KEYS.lists(), filters || {}] as const,
  details: () => [...PROPERTY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROPERTY_QUERY_KEYS.details(), id] as const,
  stats: (filters?: PropertyFilters) => 
    [...PROPERTY_QUERY_KEYS.all, 'stats', filters || {}] as const,
  dashboard: () => [...PROPERTY_QUERY_KEYS.all, 'dashboard'] as const,
  images: (propertyId: string) => 
    [...PROPERTY_QUERY_KEYS.all, 'images', propertyId] as const,
} as const;

// ================================================================
// CONFIGURAÇÕES DE CACHE POR TIPO DE DADO
// ================================================================

const CACHE_STRATEGIES = {
  list: CacheStrategy.DYNAMIC,        // 5min - lista de propriedades
  detail: CacheStrategy.DYNAMIC,      // 5min - detalhes individuais
  stats: CacheStrategy.STATIC,        // 30min - estatísticas
  dashboard: CacheStrategy.CRITICAL,  // 10s - métricas críticas
  images: CacheStrategy.HISTORICAL   // 1h - URLs de imagens
} as const;

// ================================================================
// FUNÇÕES DE API COM CACHE UNIFICADO
// ================================================================

/**
 * Buscar lista paginada de propriedades
 */
async function fetchProperties(
  page: number, 
  limit: number, 
  filters?: PropertyFilters
): Promise<{ data: Property[]; total: number; pages: number }> {
  const cache = getUnifiedCache();
  const cacheKey = PROPERTY_QUERY_KEYS.list(filters).join(':');
  
  try {
    // Verificar cache primeiro para página específica
    const pageCacheKey = `${cacheKey}:page:${page}:limit:${limit}`;
    const cached = await cache.get<{ data: Property[]; total: number; pages: number }>(pageCacheKey);
    
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 5 * 60 * 1000) {
      console.log('🏠 Properties list from cache');
      return cached;
    }

    // Buscar dados do servidor
    const result = await propertyService.findAll({
      page,
      limit,
      filters,
      orderBy: filters?.orderBy || 'createdAt',
      ascending: filters?.ascending ?? false
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar propriedades');
    }

    const response = {
      data: result.data || [],
      total: result.total || 0,
      pages: result.pages || 1
    };

    // Armazenar no cache unificado
    await cache.set(pageCacheKey, response, {
      strategy: CACHE_STRATEGIES.list,
      tags: ['properties', 'list', `page:${page}`],
      compress: response.data.length > 20, // Comprimir se muitos dados
      syncAcrossTabs: true
    });

    // Também cachear propriedades individuais
    for (const property of response.data) {
      const detailKey = PROPERTY_QUERY_KEYS.detail(property.id).join(':');
      await cache.set(detailKey, property, {
        strategy: CACHE_STRATEGIES.detail,
        tags: ['properties', 'detail', property.id],
        syncAcrossTabs: true
      });
    }

    return response;

  } catch (error) {
    console.error('Erro ao buscar propriedades:', error);
    
    // Tentar cache stale se offline
    const staleData = await cache.get<{ data: Property[]; total: number; pages: number }>(
      `${cacheKey}:page:${page}:limit:${limit}`
    );
    
    if (staleData) {
      console.warn('🏠 Using stale properties data due to error');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar estatísticas de propriedades
 */
async function fetchPropertyStats(filters?: PropertyFilters): Promise<PropertyStats> {
  const cache = getUnifiedCache();
  const cacheKey = PROPERTY_QUERY_KEYS.stats(filters).join(':');

  try {
    // Cache de longa duração para stats
    const cached = await cache.get<PropertyStats>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 30 * 60 * 1000) {
      console.log('📊 Property stats from cache');
      return cached;
    }

    const result = await propertyService.getStats(filters);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Erro ao buscar estatísticas');
    }

    const stats: PropertyStats = {
      ...result.data,
      lastUpdated: new Date().toISOString()
    };

    // Cache com compressão para dados estatísticos
    await cache.set(cacheKey, stats, {
      strategy: CACHE_STRATEGIES.stats,
      tags: ['properties', 'stats'],
      compress: true,
      syncAcrossTabs: true
    });

    return stats;

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    
    // Fallback para cache stale
    const staleData = await cache.get<PropertyStats>(cacheKey);
    if (staleData) {
      console.warn('📊 Using stale stats due to error');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Buscar propriedade individual
 */
async function fetchPropertyById(id: string): Promise<Property> {
  const cache = getUnifiedCache();
  const cacheKey = PROPERTY_QUERY_KEYS.detail(id).join(':');

  try {
    // Verificar cache primeiro
    const cached = await cache.get<Property>(cacheKey);
    if (cached && Date.now() - new Date(cached.updatedAt).getTime() < 5 * 60 * 1000) {
      console.log('🏠 Property detail from cache');
      return cached;
    }

    const result = await propertyService.findById(id);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Propriedade não encontrada');
    }

    // Armazenar no cache
    await cache.set(cacheKey, result.data, {
      strategy: CACHE_STRATEGIES.detail,
      tags: ['properties', 'detail', id],
      syncAcrossTabs: true
    });

    return result.data;

  } catch (error) {
    console.error('Erro ao buscar propriedade:', error);
    
    // Tentar cache stale
    const staleData = await cache.get<Property>(cacheKey);
    if (staleData) {
      console.warn('🏠 Using stale property data');
      return staleData;
    }
    
    throw error;
  }
}

/**
 * Dashboard stats de propriedades
 */
async function fetchPropertiesDashboard(): Promise<{
  total: number;
  available: number;
  sold: number;
  reserved: number;
  recentlyAdded: number;
  averagePrice: number;
}> {
  const cache = getUnifiedCache();
  const cacheKey = PROPERTY_QUERY_KEYS.dashboard().join(':');

  try {
    // Cache crítico de curta duração
    const cached = await cache.get<any>(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated || 0).getTime() < 10 * 1000) {
      console.log('📊 Dashboard stats from cache');
      return cached;
    }

    const stats = await propertyService.getStats();
    
    if (!stats.success || !stats.data) {
      throw new Error('Erro ao buscar dashboard stats');
    }

    const dashboardData = {
      total: stats.data.total,
      available: stats.data.byStatus?.AVAILABLE || 0,
      sold: stats.data.byStatus?.SOLD || 0,
      reserved: stats.data.byStatus?.RESERVED || 0,
      recentlyAdded: stats.data.thisMonth || 0,
      averagePrice: stats.data.averagePrice || 0,
      lastUpdated: new Date().toISOString()
    };

    // Cache crítico sem compressão
    await cache.set(cacheKey, dashboardData, {
      strategy: CACHE_STRATEGIES.dashboard,
      tags: ['properties', 'dashboard'],
      compress: false,
      syncAcrossTabs: true
    });

    return dashboardData;

  } catch (error) {
    console.error('Erro ao buscar dashboard stats:', error);
    
    const staleData = await cache.get<any>(cacheKey);
    if (staleData) {
      console.warn('📊 Using stale dashboard data');
      return staleData;
    }
    
    throw error;
  }
}

// ================================================================
// HOOK PRINCIPAL OTIMIZADO
// ================================================================

export interface UsePropertiesOptions {
  filters?: PropertyFilters;
  page?: number;
  limit?: number;
  enableRealtime?: boolean;
  enablePrefetch?: boolean;
}

export interface UsePropertiesReturn {
  // Dados
  properties: Property[];
  stats: PropertyStats | undefined;
  dashboardStats: any | undefined;
  totalProperties: number;
  totalPages: number;
  currentPage: number;

  // Estados
  isLoading: boolean;
  isLoadingStats: boolean;
  isLoadingDashboard: boolean;
  error: Error | null;
  hasError: boolean;

  // Paginação
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Mutations
  createProperty: (data: CreatePropertyDTO) => Promise<Property>;
  updateProperty: (id: string, data: UpdatePropertyDTO) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  uploadImages: (propertyId: string, files: File[]) => Promise<string[]>;

  // Controles
  refetch: () => void;
  refetchStats: () => void;
  prefetchPage: (page: number) => void;

  // Status
  isOnline: boolean;
  isOffline: boolean;
  lastUpdated: string | null;
  cacheMetrics: {
    hitRate: number;
    size: number;
    offlineQueueSize: number;
  };
}

export function usePropertiesV2(options: UsePropertiesOptions = {}): UsePropertiesReturn {
  const {
    filters,
    page: initialPage = 1,
    limit = 20,
    enableRealtime = true,
    enablePrefetch = true
  } = options;

  const queryClient = useQueryClient();
  const cache = getUnifiedCache();
  const { invalidateByTags } = useCacheInvalidation();
  const { isOnline, queueSize } = useOfflineCache();
  const { prefetch } = useCachePrefetch();
  const { optimisticUpdate } = useOptimisticCache();
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [cacheMetrics, setCacheMetrics] = useState(cache.getMetrics());

  // Query para lista de propriedades
  const propertiesQuery = useCacheQuery(
    PROPERTY_QUERY_KEYS.list({ ...filters, page: currentPage }),
    () => fetchProperties(currentPage, limit, filters),
    {
      strategy: CACHE_STRATEGIES.list,
      tags: ['properties', 'list'],
      staleTime: 5 * 60 * 1000
    },
    {
      enabled: true,
      retry: isOnline ? 2 : 0,
      keepPreviousData: true // Manter dados ao mudar página
    }
  );

  // Query para estatísticas
  const statsQuery = useCacheQuery(
    PROPERTY_QUERY_KEYS.stats(filters),
    () => fetchPropertyStats(filters),
    {
      strategy: CACHE_STRATEGIES.stats,
      tags: ['properties', 'stats'],
      staleTime: 30 * 60 * 1000
    }
  );

  // Query para dashboard stats
  const dashboardQuery = useCacheQuery(
    PROPERTY_QUERY_KEYS.dashboard(),
    fetchPropertiesDashboard,
    {
      strategy: CACHE_STRATEGIES.dashboard,
      tags: ['properties', 'dashboard'],
      staleTime: 10 * 1000
    }
  );

  // Atualizar métricas de cache
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheMetrics(cache.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [cache]);

  // Prefetch de páginas adjacentes
  useEffect(() => {
    if (!enablePrefetch || !propertiesQuery.data) return;

    // Prefetch próxima página
    if (currentPage < propertiesQuery.data.pages) {
      prefetch(
        PROPERTY_QUERY_KEYS.list({ ...filters, page: currentPage + 1 }),
        () => fetchProperties(currentPage + 1, limit, filters)
      );
    }

    // Prefetch página anterior (se não for a primeira)
    if (currentPage > 1) {
      prefetch(
        PROPERTY_QUERY_KEYS.list({ ...filters, page: currentPage - 1 }),
        () => fetchProperties(currentPage - 1, limit, filters)
      );
    }
  }, [currentPage, propertiesQuery.data, enablePrefetch, filters, limit, prefetch]);

  // Configurar real-time updates
  useEffect(() => {
    if (!enableRealtime) return;

    const events = [
      SystemEvents.PROPERTY_CREATED,
      SystemEvents.PROPERTY_UPDATED,
      SystemEvents.PROPERTY_DELETED,
      SystemEvents.PROPERTY_STATUS_CHANGED
    ];

    const subscriptions = events.map(event =>
      EventBus.on(event, async (data) => {
        // Invalidar caches relevantes
        await invalidateByTags(['properties']);
        
        // Ações específicas por evento
        switch (event) {
          case SystemEvents.PROPERTY_CREATED:
            toast.success('Nova propriedade adicionada');
            break;
          case SystemEvents.PROPERTY_DELETED:
            toast.info('Propriedade removida');
            break;
          case SystemEvents.PROPERTY_STATUS_CHANGED:
            toast.info('Status da propriedade atualizado');
            break;
        }
      })
    );

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [enableRealtime, invalidateByTags]);

  // Mutations com cache unificado
  const createMutation = useCacheMutation<Property, Error, CreatePropertyDTO>(
    async (data) => {
      const result = await propertyService.create(data);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao criar propriedade');
      }
      return result.data;
    },
    {
      onSuccess: async (property) => {
        // Invalidar listas e stats
        await invalidateByTags(['properties', 'list', 'stats', 'dashboard']);
        
        // Adicionar ao cache individual
        const detailKey = PROPERTY_QUERY_KEYS.detail(property.id).join(':');
        await cache.set(detailKey, property, {
          strategy: CACHE_STRATEGIES.detail,
          tags: ['properties', 'detail', property.id]
        });

        // Emitir evento
        EventBus.emit(SystemEvents.PROPERTY_CREATED, property);
        toast.success('Propriedade criada com sucesso!');
      },
      onError: (error) => {
        console.error('Erro ao criar propriedade:', error);
        toast.error(error.message || 'Erro ao criar propriedade');
      }
    }
  );

  const updateMutation = useCacheMutation<Property, Error, { id: string; data: UpdatePropertyDTO }>(
    async ({ id, data }) => {
      const result = await propertyService.update(id, data);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao atualizar propriedade');
      }
      return result.data;
    },
    {
      onMutate: async ({ id, data }) => {
        // Optimistic update
        const previousData = await optimisticUpdate(
          PROPERTY_QUERY_KEYS.detail(id),
          (old: Property) => ({ ...old, ...data })
        );
        return { previousData };
      },
      onSuccess: async (property) => {
        await invalidateByTags(['properties', 'list', 'stats']);
        EventBus.emit(SystemEvents.PROPERTY_UPDATED, property);
        toast.success('Propriedade atualizada!');
      },
      onError: (error, variables, context) => {
        // Reverter optimistic update
        if (context?.previousData) {
          queryClient.setQueryData(
            PROPERTY_QUERY_KEYS.detail(variables.id),
            context.previousData
          );
        }
        toast.error(error.message || 'Erro ao atualizar');
      }
    }
  );

  const deleteMutation = useCacheMutation<void, Error, string>(
    async (id) => {
      const result = await propertyService.delete(id);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar propriedade');
      }
    },
    {
      onSuccess: async (_, id) => {
        // Remover do cache
        await cache.remove(PROPERTY_QUERY_KEYS.detail(id).join(':'));
        await invalidateByTags(['properties']);
        
        EventBus.emit(SystemEvents.PROPERTY_DELETED, { id });
        toast.success('Propriedade removida!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover propriedade');
      }
    }
  );

  const uploadImagesMutation = useCacheMutation<string[], Error, { propertyId: string; files: File[] }>(
    async ({ propertyId, files }) => {
      const result = await propertyService.uploadImages(propertyId, files);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }
      return result.data;
    },
    {
      onSuccess: async (urls, { propertyId }) => {
        // Invalidar cache da propriedade
        await invalidateByTags(['properties', 'detail', propertyId]);
        toast.success(`${urls.length} imagens enviadas!`);
      },
      onError: (error) => {
        toast.error(error.message || 'Erro no upload');
      }
    }
  );

  // Funções de paginação
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= (propertiesQuery.data?.pages || 1)) {
      setCurrentPage(page);
    }
  }, [propertiesQuery.data?.pages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const prefetchPage = useCallback((page: number) => {
    prefetch(
      PROPERTY_QUERY_KEYS.list({ ...filters, page }),
      () => fetchProperties(page, limit, filters)
    );
  }, [filters, limit, prefetch]);

  // Estados derivados
  const properties = propertiesQuery.data?.data || [];
  const totalProperties = propertiesQuery.data?.total || 0;
  const totalPages = propertiesQuery.data?.pages || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const hasError = Boolean(propertiesQuery.error || statsQuery.error || dashboardQuery.error);
  const lastUpdated = propertiesQuery.data?.data?.[0]?.updatedAt || null;

  return {
    // Dados
    properties,
    stats: statsQuery.data,
    dashboardStats: dashboardQuery.data,
    totalProperties,
    totalPages,
    currentPage,

    // Estados
    isLoading: propertiesQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingDashboard: dashboardQuery.isLoading,
    error: propertiesQuery.error || statsQuery.error || dashboardQuery.error,
    hasError,

    // Paginação
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,

    // Mutations
    createProperty: (data) => createMutation.mutateAsync(data),
    updateProperty: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteProperty: (id) => deleteMutation.mutateAsync(id),
    uploadImages: (propertyId, files) => uploadImagesMutation.mutateAsync({ propertyId, files }),

    // Controles
    refetch: () => propertiesQuery.refetch(),
    refetchStats: () => statsQuery.refetch(),
    prefetchPage,

    // Status
    isOnline,
    isOffline: !isOnline,
    lastUpdated,
    cacheMetrics: {
      hitRate: cacheMetrics.hitRate,
      size: cacheMetrics.size,
      offlineQueueSize: queueSize
    }
  };
}

// ================================================================
// HOOKS ESPECÍFICOS
// ================================================================

/**
 * Hook para buscar uma propriedade individual
 */
export function usePropertyV2(id: string) {
  const cache = getUnifiedCache();
  const { isOnline } = useOfflineCache();

  const query = useCacheQuery(
    PROPERTY_QUERY_KEYS.detail(id),
    () => fetchPropertyById(id),
    {
      strategy: CACHE_STRATEGIES.detail,
      tags: ['properties', 'detail', id],
      staleTime: 5 * 60 * 1000
    },
    {
      enabled: Boolean(id),
      retry: isOnline ? 2 : 0
    }
  );

  return {
    property: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para dashboard de propriedades
 */
export function usePropertiesDashboardV2() {
  const cache = getUnifiedCache();
  const { isOnline } = useOfflineCache();

  const query = useCacheQuery(
    PROPERTY_QUERY_KEYS.dashboard(),
    fetchPropertiesDashboard,
    {
      strategy: CACHE_STRATEGIES.dashboard,
      tags: ['properties', 'dashboard'],
      staleTime: 10 * 1000
    },
    {
      refetchInterval: isOnline ? 30 * 1000 : false // Refresh a cada 30s se online
    }
  );

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default usePropertiesV2;