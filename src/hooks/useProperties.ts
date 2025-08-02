// ================================================================
// HOOK USEPROPERTIES - INTEGRAÇÃO COM PROPERTYSERVICE
// ================================================================
// Data: 01/08/2025
// Descrição: Hook para gestão de propriedades com cache e real-time
// ================================================================

import { useCallback, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation, CacheStrategy, usePaginatedQuery } from './useSupabaseQuery';
import { propertyService } from '@/services';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from '@/hooks/use-toast';
import { useUnifiedCache, useCrossModuleInvalidation } from '@/hooks/useUnifiedCache';
import { QUERY_KEYS, getQueryConfig } from '@/lib/cache-manager';
import type { Property, PropertyFilters, PropertyStats } from '@/services';

// ================================================================
// INTERFACES
// ================================================================

export interface UsePropertiesOptions {
  filters?: PropertyFilters;
  limit?: number;
  page?: number;
  enableRealtime?: boolean;
  cacheStrategy?: CacheStrategy;
}

export interface UsePropertiesReturn {
  // Dados
  properties: Property[] | undefined;
  totalCount: number;
  stats: PropertyStats | undefined;
  
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
  createProperty: (data: any) => Promise<void>;
  updateProperty: (id: string, data: any) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  uploadImages: (propertyId: string, files: File[]) => Promise<void>;
  
  // Utilidades
  refetch: () => void;
  refetchStats: () => void;
}

// ================================================================
// HOOK PRINCIPAL
// ================================================================

export function useProperties(options: UsePropertiesOptions = {}): UsePropertiesReturn {
  const {
    filters,
    limit = 20,
    enableRealtime = true,
    cacheStrategy = CacheStrategy.DYNAMIC
  } = options;

  // Cache unificado
  const cache = useUnifiedCache({ 
    module: 'properties',
    enableAutoSync: true,
    enableOptimisticUpdates: true
  });
  
  const { invalidateRelated } = useCrossModuleInvalidation();

  // Query para listar propriedades com paginação
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
    QUERY_KEYS.properties.list(filters),
    (page, limit) => propertyService.findAll({
      filters,
      limit,
      offset: page * limit,
      orderBy: 'createdAt',
      ascending: false
    }),
    limit,
    {
      ...cache.queryConfig,
      cacheStrategy,
      staleTime: cacheStrategy === CacheStrategy.STATIC ? 30 * 60 * 1000 : cache.queryConfig.staleTime
    }
  );

  // Query para estatísticas
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useSupabaseQuery(
    ['properties', 'stats', ...(filters ? [JSON.stringify(filters)] : [])],
    () => propertyService.getStats(filters),
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      staleTime: 5 * 60 * 1000
    }
  );

  // Mutation para criar propriedade com cache unificado
  const createMutation = cache.createMutation(
    async (data: any) => {
      const result = await propertyService.create(data);
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_CREATED, {
          property: result.data,
          userId: data.agentId
        });
      }
      return result;
    },
    {
      optimisticUpdate: (data) => ({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      onSuccess: async () => {
        toast({
          title: 'Propriedade criada',
          description: 'A propriedade foi adicionada com sucesso'
        });
        // Invalidar módulos relacionados
        await invalidateRelated('properties', ['dashboard', 'activities']);
      }
    }
  );

  // Mutation para atualizar propriedade
  const updateMutation = useSupabaseMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const result = await propertyService.update(id, data);
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_UPDATED, {
          property: result.data,
          userId: data.agentId
        });
      }
      return result;
    },
    {
      invalidateQueries: [['properties'], ['properties', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Propriedade atualizada',
          description: 'As alterações foram salvas com sucesso'
        });
      }
    }
  );

  // Mutation para deletar propriedade
  const deleteMutation = useSupabaseMutation(
    async (id: string) => {
      const result = await propertyService.delete(id);
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_DELETED, {
          propertyId: id
        });
      }
      return result;
    },
    {
      invalidateQueries: [['properties'], ['properties', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Propriedade removida',
          description: 'A propriedade foi removida com sucesso'
        });
      }
    }
  );

  // Mutation para upload de imagens
  const uploadImagesMutation = useSupabaseMutation(
    async ({ propertyId, files }: { propertyId: string; files: File[] }) => {
      const result = await propertyService.uploadImages(propertyId, files);
      return result;
    },
    {
      invalidateQueries: [['properties']],
      onSuccess: () => {
        toast({
          title: 'Imagens enviadas',
          description: 'As imagens foram adicionadas com sucesso'
        });
      }
    }
  );

  // Funções wrapper para as mutations
  const createProperty = useCallback(async (data: any) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateProperty = useCallback(async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteProperty = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const uploadImages = useCallback(async (propertyId: string, files: File[]) => {
    await uploadImagesMutation.mutateAsync({ propertyId, files });
  }, [uploadImagesMutation]);

  // Dados processados
  const properties = useMemo(() => data?.items, [data]);
  const totalCount = useMemo(() => data?.totalCount || 0, [data]);
  const totalPages = useMemo(() => data?.totalPages || 0, [data]);

  return {
    // Dados
    properties,
    totalCount,
    stats,
    
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
    createProperty,
    updateProperty,
    deleteProperty,
    uploadImages,
    
    // Utilidades
    refetch,
    refetchStats
  };
}

// ================================================================
// HOOK PARA PROPRIEDADE INDIVIDUAL
// ================================================================

export interface UsePropertyOptions {
  enableRealtime?: boolean;
}

export interface UsePropertyReturn {
  property: Property | undefined;
  isLoading: boolean;
  error: Error | null;
  update: (data: any) => Promise<void>;
  remove: () => Promise<void>;
  uploadImages: (files: File[]) => Promise<void>;
  refetch: () => void;
}

export function useProperty(
  id: string,
  options: UsePropertyOptions = {}
): UsePropertyReturn {
  const { enableRealtime = true } = options;

  // Query para buscar propriedade
  const {
    data: property,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['property', id],
    () => propertyService.findById(id),
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      enabled: !!id
    }
  );

  // Mutations
  const updateMutation = useSupabaseMutation(
    async (data: any) => {
      const result = await propertyService.update(id, data);
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_UPDATED, {
          property: result.data
        });
      }
      return result;
    },
    {
      invalidateQueries: [['property', id], ['properties']],
      onSuccess: () => {
        toast({
          title: 'Propriedade atualizada',
          description: 'As alterações foram salvas com sucesso'
        });
      }
    }
  );

  const deleteMutation = useSupabaseMutation(
    async () => {
      const result = await propertyService.delete(id);
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_DELETED, {
          propertyId: id
        });
      }
      return result;
    },
    {
      invalidateQueries: [['properties'], ['properties', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Propriedade removida',
          description: 'A propriedade foi removida com sucesso'
        });
      }
    }
  );

  const uploadImagesMutation = useSupabaseMutation(
    async (files: File[]) => {
      const result = await propertyService.uploadImages(id, files);
      return result;
    },
    {
      invalidateQueries: [['property', id]],
      onSuccess: () => {
        toast({
          title: 'Imagens enviadas',
          description: 'As imagens foram adicionadas com sucesso'
        });
      }
    }
  );

  const update = useCallback(async (data: any) => {
    await updateMutation.mutateAsync(data);
  }, [updateMutation]);

  const remove = useCallback(async () => {
    await deleteMutation.mutateAsync();
  }, [deleteMutation]);

  const uploadImages = useCallback(async (files: File[]) => {
    await uploadImagesMutation.mutateAsync(files);
  }, [uploadImagesMutation]);

  return {
    property,
    isLoading,
    error,
    update,
    remove,
    uploadImages,
    refetch
  };
}

// ================================================================
// HOOK PARA DASHBOARD DE PROPRIEDADES
// ================================================================

export interface UsePropertiesDashboardReturn {
  stats: PropertyStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePropertiesDashboard(): UsePropertiesDashboardReturn {
  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['properties', 'dashboard-stats'],
    () => propertyService.getStats(),
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
// HOOK PARA IMPORTAÇÃO VIVA REAL
// ================================================================

export interface UseImportFromVivaRealReturn {
  importProperty: (url: string) => Promise<void>;
  isImporting: boolean;
  error: Error | null;
}

export function useImportFromVivaReal(): UseImportFromVivaRealReturn {
  const importMutation = useSupabaseMutation(
    async (url: string) => {
      const result = await propertyService.importFromVivaReal(url);
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_CREATED, {
          property: result.data
        });
      }
      return result;
    },
    {
      invalidateQueries: [['properties'], ['properties', 'stats']],
      onSuccess: () => {
        toast({
          title: 'Propriedade importada',
          description: 'Os dados foram importados do Viva Real com sucesso'
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro na importação',
          description: error.message || 'Não foi possível importar a propriedade',
          variant: 'destructive'
        });
      }
    }
  );

  const importProperty = useCallback(async (url: string) => {
    await importMutation.mutateAsync(url);
  }, [importMutation]);

  return {
    importProperty,
    isImporting: importMutation.isPending,
    error: importMutation.error
  };
}

// ================================================================
// HOOK PARA GESTÃO COMPLETA (MANAGER)
// ================================================================

export function usePropertiesManager(options: UsePropertiesOptions = {}) {
  const properties = useProperties(options);
  const dashboard = usePropertiesDashboard();
  const vivaReal = useImportFromVivaReal();

  return {
    ...properties,
    dashboard,
    vivaReal
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default useProperties;