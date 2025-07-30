// ================================================
// HOOKS REACT QUERY - MÓDULO PROPRIEDADES
// ================================================
// Data: 30/01/2025
// Descrição: Hooks personalizados para gestão de propriedades
// Funcionalidades: CRUD, filtros, busca, métricas, cache inteligente
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { propertiesService } from '@/services/propertiesService';
import { vivaRealService } from '@/services/vivaRealService';
import type {
  Property,
  PropertyOwner,
  PropertyImage,
  PropertyFormData,
  PropertyOwnerFormData,
  PropertySearchParams,
  PropertySearchResult,
  PropertyMetrics,
  PropertySyncLog,
  VivaRealProperty,
  VivaRealSyncOptions,
} from '@/types/properties';

// ================================================
// QUERY KEYS
// ================================================

export const PROPERTIES_QUERY_KEYS = {
  all: ['properties'] as const,
  lists: () => [...PROPERTIES_QUERY_KEYS.all, 'list'] as const,
  list: (params: PropertySearchParams) => [...PROPERTIES_QUERY_KEYS.lists(), params] as const,
  details: () => [...PROPERTIES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROPERTIES_QUERY_KEYS.details(), id] as const,
  metrics: () => [...PROPERTIES_QUERY_KEYS.all, 'metrics'] as const,
  owners: () => ['property-owners'] as const,
  syncLogs: () => ['property-sync-logs'] as const,
  vivaRealStats: () => ['viva-real-stats'] as const,
} as const;

// ================================================
// HOOKS PARA BUSCA E LISTAGEM
// ================================================

/**
 * Hook para buscar propriedades com filtros e paginação
 */
export const useProperties = (params: PropertySearchParams = {}) => {
  return useQuery({
    queryKey: PROPERTIES_QUERY_KEYS.list(params),
    queryFn: () => propertiesService.getProperties(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para buscar propriedade específica por ID
 */
export const useProperty = (id: string | undefined) => {
  return useQuery({
    queryKey: PROPERTIES_QUERY_KEYS.detail(id || ''),
    queryFn: () => id ? propertiesService.getPropertyById(id) : null,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para buscar propriedades por localização
 */
export const usePropertiesByLocation = (
  latitude: number | undefined,
  longitude: number | undefined,
  radiusKm: number = 5
) => {
  return useQuery({
    queryKey: [...PROPERTIES_QUERY_KEYS.all, 'location', latitude, longitude, radiusKm],
    queryFn: () => 
      latitude && longitude 
        ? propertiesService.searchPropertiesByLocation(latitude, longitude, radiusKm)
        : [],
    enabled: !!(latitude && longitude),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para métricas de propriedades
 */
export const usePropertyMetrics = () => {
  return useQuery({
    queryKey: PROPERTIES_QUERY_KEYS.metrics(),
    queryFn: () => propertiesService.getPropertyMetrics(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
};

// ================================================
// HOOKS PARA PROPRIETÁRIOS
// ================================================

/**
 * Hook para buscar proprietários
 */
export const usePropertyOwners = () => {
  return useQuery({
    queryKey: PROPERTIES_QUERY_KEYS.owners(),
    queryFn: () => propertiesService.getPropertyOwners(),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

// ================================================
// HOOKS PARA VIVA REAL
// ================================================

/**
 * Hook para logs de sincronização
 */
export const useSyncLogs = (limit: number = 50) => {
  return useQuery({
    queryKey: [...PROPERTIES_QUERY_KEYS.syncLogs(), limit],
    queryFn: () => vivaRealService.getSyncLogs(limit),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para estatísticas do Viva Real
 */
export const useVivaRealStats = () => {
  return useQuery({
    queryKey: PROPERTIES_QUERY_KEYS.vivaRealStats(),
    queryFn: () => vivaRealService.getSyncStats(),
    staleTime: 5 * 60 * 1000,
  });
};

// ================================================
// HOOKS DE MUTAÇÃO - PROPRIEDADES
// ================================================

/**
 * Hook para criar propriedade
 */
export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PropertyFormData) => propertiesService.createProperty(data),
    onSuccess: (newProperty) => {
      // Invalidar listagens
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.metrics() });
      
      // Adicionar ao cache de detalhes
      queryClient.setQueryData(PROPERTIES_QUERY_KEYS.detail(newProperty.id), newProperty);
      
      toast.success('Propriedade criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar propriedade: ${error.message}`);
    },
  });
};

/**
 * Hook para atualizar propriedade
 */
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyFormData> }) =>
      propertiesService.updateProperty(id, data),
    onSuccess: (updatedProperty) => {
      // Atualizar cache de detalhes
      queryClient.setQueryData(PROPERTIES_QUERY_KEYS.detail(updatedProperty.id), updatedProperty);
      
      // Invalidar listagens
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.metrics() });
      
      toast.success('Propriedade atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar propriedade: ${error.message}`);
    },
  });
};

/**
 * Hook para excluir propriedade
 */
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => propertiesService.deleteProperty(id),
    onSuccess: (_, deletedId) => {
      // Remover do cache de detalhes
      queryClient.removeQueries({ queryKey: PROPERTIES_QUERY_KEYS.detail(deletedId) });
      
      // Invalidar listagens
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.metrics() });
      
      toast.success('Propriedade excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir propriedade: ${error.message}`);
    },
  });
};

// ================================================
// HOOKS DE MUTAÇÃO - PROPRIETÁRIOS
// ================================================

/**
 * Hook para criar proprietário
 */
export const useCreatePropertyOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PropertyOwnerFormData) => propertiesService.createPropertyOwner(data),
    onSuccess: (newOwner) => {
      // Invalidar lista de proprietários
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.owners() });
      
      toast.success('Proprietário criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar proprietário: ${error.message}`);
    },
  });
};

// ================================================
// HOOKS DE MUTAÇÃO - IMAGENS
// ================================================

/**
 * Hook para upload de imagem
 */
export const useUploadPropertyImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      propertyId, 
      file, 
      metadata 
    }: { 
      propertyId: string; 
      file: File; 
      metadata?: Partial<PropertyImage> 
    }) => propertiesService.uploadPropertyImage(propertyId, file, metadata),
    onSuccess: (_, { propertyId }) => {
      // Invalidar detalhes da propriedade para recarregar imagens
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.detail(propertyId) });
      
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    },
  });
};

/**
 * Hook para excluir imagem
 */
export const useDeletePropertyImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, propertyId }: { imageId: string; propertyId: string }) => 
      propertiesService.deletePropertyImage(imageId),
    onSuccess: (_, { propertyId }) => {
      // Invalidar detalhes da propriedade para recarregar imagens
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.detail(propertyId) });
      
      toast.success('Imagem excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir imagem: ${error.message}`);
    },
  });
};

// ================================================
// HOOKS DE MUTAÇÃO - VIVA REAL
// ================================================

/**
 * Hook para importar do Viva Real
 */
export const useImportFromVivaReal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      jsonData, 
      options 
    }: { 
      jsonData: VivaRealProperty[]; 
      options?: VivaRealSyncOptions 
    }) => vivaRealService.importFromJsonFile(jsonData, options),
    onSuccess: (result) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.metrics() });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.syncLogs() });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.vivaRealStats() });
      
      toast.success(
        `Importação concluída! ${result.success} propriedades importadas${
          result.failed > 0 ? `, ${result.failed} falharam` : ''
        }`
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });
};

/**
 * Hook para sincronizar propriedade específica
 */
export const useSyncProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vivaRealProperty: VivaRealProperty) => 
      vivaRealService.syncProperty(vivaRealProperty),
    onSuccess: (property) => {
      // Atualizar cache
      queryClient.setQueryData(PROPERTIES_QUERY_KEYS.detail(property.id), property);
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEYS.syncLogs() });
      
      toast.success('Propriedade sincronizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });
};

// ================================================
// HOOKS COMPOSTOS PARA UI
// ================================================

/**
 * Hook composto para gerenciamento completo de propriedades
 */
export const usePropertiesManager = (searchParams: PropertySearchParams = {}) => {
  const propertiesQuery = useProperties(searchParams);
  const metricsQuery = usePropertyMetrics();
  const ownersQuery = usePropertyOwners();
  
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();
  
  return {
    // Queries
    properties: propertiesQuery.data,
    metrics: metricsQuery.data,
    owners: ownersQuery.data,
    
    // Estados de loading
    isLoading: propertiesQuery.isLoading,
    isLoadingMetrics: metricsQuery.isLoading,
    isLoadingOwners: ownersQuery.isLoading,
    
    // Estados de erro
    error: propertiesQuery.error,
    metricsError: metricsQuery.error,
    ownersError: ownersQuery.error,
    
    // Mutations
    createProperty: createMutation.mutate,
    updateProperty: updateMutation.mutate,
    deleteProperty: deleteMutation.mutate,
    
    // Estados das mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Refetch functions
    refetchProperties: propertiesQuery.refetch,
    refetchMetrics: metricsQuery.refetch,
    refetchOwners: ownersQuery.refetch,
  };
};

/**
 * Hook para dashboard de propriedades
 */
export const usePropertiesDashboard = () => {
  const metrics = usePropertyMetrics();
  const recentProperties = useProperties({ 
    sortBy: 'createdAt', 
    sortOrder: 'desc', 
    limit: 10 
  });
  const vivaRealStats = useVivaRealStats();
  
  return {
    metrics: metrics.data,
    recentProperties: recentProperties.data?.properties || [],
    vivaRealStats: vivaRealStats.data,
    
    isLoading: metrics.isLoading || recentProperties.isLoading || vivaRealStats.isLoading,
    
    error: metrics.error || recentProperties.error || vivaRealStats.error,
    
    refetch: () => {
      metrics.refetch();
      recentProperties.refetch();
      vivaRealStats.refetch();
    },
  };
};

/**
 * Hook para formulário de propriedade com validação
 */
export const usePropertyForm = (propertyId?: string) => {
  const propertyQuery = useProperty(propertyId);
  const ownersQuery = usePropertyOwners();
  
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  
  const handleSubmit = async (data: PropertyFormData) => {
    try {
      if (propertyId) {
        await updateMutation.mutateAsync({ id: propertyId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error já tratado nos hooks de mutation
      throw error;
    }
  };
  
  return {
    property: propertyQuery.data,
    owners: ownersQuery.data,
    
    isLoading: propertyQuery.isLoading || ownersQuery.isLoading,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    
    error: propertyQuery.error || ownersQuery.error,
    
    handleSubmit,
    
    refetch: () => {
      propertyQuery.refetch();
      ownersQuery.refetch();
    },
  };
};

/**
 * Hook para gerenciamento de imagens
 */
export const usePropertyImages = (propertyId: string) => {
  const propertyQuery = useProperty(propertyId);
  
  const uploadMutation = useUploadPropertyImage();
  const deleteMutation = useDeletePropertyImage();
  
  const handleUpload = (file: File, metadata?: Partial<PropertyImage>) => {
    return uploadMutation.mutateAsync({ propertyId, file, metadata });
  };
  
  const handleDelete = (imageId: string) => {
    return deleteMutation.mutateAsync({ imageId, propertyId });
  };
  
  return {
    images: propertyQuery.data?.images || [],
    
    isLoading: propertyQuery.isLoading,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    error: propertyQuery.error,
    
    handleUpload,
    handleDelete,
    
    refetch: propertyQuery.refetch,
  };
};

// ================================================
// EXPORT DEFAULT
// ================================================

export default {
  useProperties,
  useProperty,
  usePropertiesByLocation,
  usePropertyMetrics,
  usePropertyOwners,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  useCreatePropertyOwner,
  useUploadPropertyImage,
  useDeletePropertyImage,
  useImportFromVivaReal,
  useSyncProperty,
  usePropertiesManager,
  usePropertiesDashboard,
  usePropertyForm,
  usePropertyImages,
  useSyncLogs,
  useVivaRealStats,
};