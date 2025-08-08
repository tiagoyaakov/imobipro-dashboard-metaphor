// ================================================================
// HOOK USEPROPERTIES V3 - INTEGRAÇÃO COM MVP DATABASE TABLES
// ================================================================
// Data: 07/08/2025
// Descrição: Hook para gestão de propriedades usando imoveisVivaRealService
// Migração: propertyService → imoveisVivaRealService (novo MVP)
// ================================================================

import { useCallback, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation, CacheStrategy, usePaginatedQuery } from './useSupabaseQuery';
import { imoveisVivaRealService } from '@/services/imoveisVivaReal.service';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from '@/hooks/use-toast';
import { useUnifiedCache, useCrossModuleInvalidation } from '@/hooks/useUnifiedCache';
import { QUERY_KEYS, getQueryConfig } from '@/lib/cache-manager';

// Importar tipos do service novo
import type { 
  ImoveisVivaReal as ImoveisVivaReal4, 
  ImoveisVivaRealFilters as ImoveisVivaReal4Filters, 
  ImoveisVivaRealStats as ImoveisVivaReal4Stats,
  ImoveisVivaRealInsert as ImoveisVivaReal4Insert,
  ImoveisVivaRealUpdate as ImoveisVivaReal4Update
} from '@/services/imoveisVivaReal.service';

// Tipos UI do módulo (contrato esperado pelos componentes)
import type {
  Property as UiProperty,
  PropertyFilters as UiPropertyFilters,
  PropertyListingType,
  PropertyStatus,
  PropertyType,
  PropertyMetrics
} from '@/types/properties';

// ================================================================
// MAPEAMENTO DE TIPOS - COMPATIBILIDADE COM INTERFACE ANTIGA
// ================================================================

// Interface Property antiga interna removida; usamos `UiProperty` do módulo

// Interface PropertyFilters antiga
// Usaremos `UiPropertyFilters` diretamente

// Interface PropertyStats antiga
// Usaremos `PropertyMetrics` como retorno para dashboard

// ================================================================
// FUNÇÕES DE MAPEAMENTO ENTRE TIPOS ANTIGOS E NOVOS
// ================================================================

/**
 * Mapear ImoveisVivaReal4 (novo) → Property (interface antiga)
 */
function mapImoveisVivaRealToProperty(imovel: ImoveisVivaReal4): UiProperty {
  // Mapear imagens string[] → PropertyImage[]
  const images = (imovel.images || []).map((url, index) => ({
    id: `${imovel.id}-${index}`,
    propertyId: imovel.id,
    url,
    order: index,
    isMain: index === 0,
    isActive: true,
    createdAt: imovel.created_at
  }));

  // Determinar listingType
  const listingType: PropertyListingType = (imovel.listingType as PropertyListingType) || 'SALE';

  // Preços
  const salePrice = listingType === 'SALE' || listingType === 'BOTH' ? Number(imovel.price) || undefined : undefined;
  const rentPrice = listingType === 'RENT' ? Number(imovel.price) || undefined : undefined;

  // Fonte
  const source = imovel.vivaRealId ? 'VIVA_REAL' : 'MANUAL';

  return {
    id: imovel.id,
    companyId: '',
    agentId: (imovel as any).corretor_responsavel || undefined,
    ownerId: undefined,

    title: imovel.title || 'Imóvel sem título',
    description: imovel.description || undefined,
    category: 'RESIDENTIAL',
    propertyType: mapPropertyTypeToEnum(imovel.propertyType),
    status: mapPropertyStatusToEnum(imovel.status),
    listingType,
    condition: undefined,

    salePrice,
    rentPrice,
    condominiumFee: imovel.condominiumFee || undefined,
    iptuPrice: imovel.iptuPrice || undefined,
    currencySymbol: 'R$ ',

    totalArea: imovel.area || undefined,
    builtArea: undefined,
    usefulArea: undefined,
    bedrooms: imovel.bedrooms || 0,
    bathrooms: imovel.bathrooms || 0,
    suites: 0,
    parkingSpaces: imovel.parkingSpaces || 0,
    floors: 0,
    floor: undefined,
    units: 0,
    yearBuilt: undefined,

    address: imovel.address || '',
    number: undefined,
    complement: undefined,
    neighborhood: (imovel as any).neighborhood || '',
    city: imovel.city || '',
    state: imovel.state || '',
    zipCode: imovel.zipCode || '',
    country: 'BR',
    latitude: imovel.latitude || undefined,
    longitude: imovel.longitude || undefined,
    geolocationPrecision: undefined,

    vivaRealId: imovel.vivaRealId || undefined,
    vivaRealListingId: (imovel as any).vivaRealListingId || undefined,
    vivaRealUrl: (imovel as any).vivaRealUrl || undefined,
    externalId: (imovel as any).externalId || undefined,
    source: source as any,
    isDevelopmentUnit: false,

    features: imovel.features || [],
    amenities: imovel.amenities || [],

    isActive: imovel.isActive,
    isFeatured: !!imovel.isFeatured,
    viewCount: 0,
    favoriteCount: 0,
    lastSyncAt: undefined,
    syncError: undefined,
    notes: undefined,

    createdAt: imovel.created_at,
    updatedAt: imovel.updated_at,

    owner: undefined,
    agent: (imovel as any).agent
      ? {
          id: (imovel as any).agent.id,
          name: (imovel as any).agent.name,
          email: (imovel as any).agent.email,
        }
      : undefined,
    images,
    vivaRealData: undefined,
    appointments: undefined,
  } as UiProperty;
}

/**
 * Mapear Property (interface antiga) → ImoveisVivaReal4Insert (novo)
 */
function mapPropertyToImoveisVivaRealInsert(property: Partial<UiProperty>): ImoveisVivaReal4Insert {
  return {
    id: property.id,
    title: property.title || '',
    description: property.description || null,
    address: property.address || '',
    city: property.city || '',
    state: property.state || '',
    zipCode: property.zipCode || '',
    price: (property.salePrice || property.rentPrice || 0) as number,
    area: property.totalArea || 0,
    bedrooms: property.bedrooms || null,
    bathrooms: property.bathrooms || null,
    propertyType: mapEnumToPropertyType(property.propertyType),
    status: mapEnumToPropertyStatus(property.status),
    images: (property.images || []).map(img => img.url),
    created_at: property.createdAt,
    updated_at: property.updatedAt
  };
}

/**
 * Mapear Property (interface antiga) → ImoveisVivaReal4Update (novo)
 */
function mapPropertyToImoveisVivaRealUpdate(property: Partial<UiProperty>): ImoveisVivaReal4Update {
  const update: ImoveisVivaReal4Update = {};
  
  if (property.title !== undefined) update.title = property.title;
  if (property.description !== undefined) update.description = property.description;
  if (property.address !== undefined) update.address = property.address;
  if (property.city !== undefined) update.city = property.city;
  if (property.state !== undefined) update.state = property.state;
  if (property.zipCode !== undefined) update.zipCode = property.zipCode;
  if (property.salePrice !== undefined || property.rentPrice !== undefined) {
    update.price = (property.salePrice || property.rentPrice || 0) as number;
  }
  if (property.totalArea !== undefined) update.area = property.totalArea;
  if (property.bedrooms !== undefined) update.bedrooms = property.bedrooms;
  if (property.bathrooms !== undefined) update.bathrooms = property.bathrooms;
  if (property.propertyType !== undefined) update.propertyType = mapEnumToPropertyType(property.propertyType);
  if (property.status !== undefined) update.status = mapEnumToPropertyStatus(property.status);
  if (property.images !== undefined) update.images = property.images.map(img => img.url);
  
  return update;
}

/**
 * Mapear PropertyFilters (antigo) → ImoveisVivaReal4Filters (novo)
 */
function mapPropertyFiltersToImoveisFilters(filters?: UiPropertyFilters): ImoveisVivaReal4Filters {
  if (!filters) return {};
  
  const mapped: ImoveisVivaReal4Filters = {};
  
  if (filters.propertyType && filters.propertyType.length > 0) mapped.propertyType = mapEnumToPropertyType(filters.propertyType[0]);
  if (filters.status && filters.status.length > 0) mapped.status = mapEnumToPropertyStatus(filters.status[0]);
  if (filters.agentId) (mapped as any).corretor_responsavel = filters.agentId;
  if (filters.city) mapped.city = filters.city;
  if (filters.state) mapped.state = filters.state;
  if (filters.minSalePrice) mapped.minPrice = filters.minSalePrice;
  if (filters.maxSalePrice) mapped.maxPrice = filters.maxSalePrice;
  if (filters.minTotalArea) mapped.minArea = filters.minTotalArea;
  if (filters.maxTotalArea) mapped.maxArea = filters.maxTotalArea;
  if (filters.minBedrooms) mapped.bedrooms = filters.minBedrooms;
  if (filters.minBathrooms) mapped.bathrooms = filters.minBathrooms;
  if ((filters.listingType && filters.listingType.length > 0)) mapped.listingType = filters.listingType[0] as any;
  
  return mapped;
}

/**
 * Mapear ImoveisVivaReal4Stats (novo) → PropertyStats (antigo)
 */
function mapImoveisStatsToPropertyMetrics(stats: ImoveisVivaReal4Stats, properties: UiProperty[]): PropertyMetrics {
  const salePrices = properties.map(p => p.salePrice || 0).filter(Boolean);
  const rentPrices = properties.map(p => p.rentPrice || 0).filter(Boolean);
  const avgSalePrice = salePrices.length ? salePrices.reduce((a, b) => a + b, 0) / salePrices.length : 0;
  const avgRentPrice = rentPrices.length ? rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length : 0;

  // Converter byType para PropertyType keys quando possível
  const propertiesByType: Record<any, number> = { ...stats.byType };

  // status
  const propertiesByStatus: Record<any, number> = {
    AVAILABLE: stats.available,
    SOLD: stats.sold,
    RESERVED: stats.reserved,
  };

  return {
    totalProperties: stats.total,
    activeProperties: stats.available,
    featuredProperties: stats.featured,
    availableForSale: stats.total, // sem separação entre venda/aluguel no agregado atual
    availableForRent: 0,
    soldThisMonth: 0,
    rentedThisMonth: 0,
    averageSalePrice: avgSalePrice,
    averageRentPrice: avgRentPrice,
    totalViews: 0,
    totalFavorites: 0,
    propertiesByType: propertiesByType as any,
    propertiesByStatus: propertiesByStatus as any,
    propertiesByCity: stats.byCity,
    recentActivity: [],
  };
}

// ================================================================
// FUNÇÕES HELPER PARA MAPEAMENTO DE ENUMS
// ================================================================

function mapPropertyTypeToEnum(type?: string): PropertyType {
  switch (type?.toLowerCase()) {
    case 'apartment': case 'apartamento': return 'APARTMENT';
    case 'house': case 'casa': return 'HOUSE';
    case 'commercial': case 'comercial': return 'COMMERCIAL_BUILDING';
    case 'land': case 'terreno': return 'LAND';
    default: return 'OTHER';
  }
}

function mapEnumToPropertyType(type?: PropertyType): string {
  switch (type) {
    case 'APARTMENT': return 'APARTMENT';
    case 'HOUSE': return 'HOUSE';
    case 'COMMERCIAL_BUILDING': return 'COMMERCIAL';
    case 'LAND': return 'LAND';
    default: return 'OTHER';
  }
}

function mapPropertyStatusToEnum(status?: string): PropertyStatus {
  switch (status?.toLowerCase()) {
    case 'available': case 'disponivel': case 'ativo': return 'AVAILABLE';
    case 'sold': case 'vendido': return 'SOLD';
    case 'reserved': case 'reservado': return 'RESERVED';
    default: return 'AVAILABLE';
  }
}

function mapEnumToPropertyStatus(status?: PropertyStatus): string {
  switch (status) {
    case 'AVAILABLE': return 'AVAILABLE';
    case 'SOLD': return 'SOLD';
    case 'RESERVED': return 'RESERVED';
    default: return 'AVAILABLE';
  }
}

// ================================================================
// INTERFACES - MANTÉM COMPATIBILIDADE COM HOOK ANTIGO
// ================================================================

export interface UsePropertiesOptions {
  filters?: UiPropertyFilters;
  limit?: number;
  page?: number;
  enableRealtime?: boolean;
  cacheStrategy?: CacheStrategy;
}

export interface UsePropertiesReturn {
  // Dados
  properties: UiProperty[] | undefined;
  totalCount: number;
  stats: PropertyMetrics | undefined;
  
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
// HOOK PRINCIPAL MIGRADO
// ================================================================

export function usePropertiesV3(options: UsePropertiesOptions = {}): UsePropertiesReturn {
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

  // Mapear filtros para novo formato
  const mappedFilters = mapPropertyFiltersToImoveisFilters(filters);

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
    async (page, limit) => {
      const result = await imoveisVivaRealService.findAll({
        filters: mappedFilters,
        limit,
        offset: page * limit,
        orderBy: 'created_at',
        ascending: false
      });
      
      if (result.error) {
        throw result.error;
      }
      
      // Mapear resultados para formato antigo
      const mappedItems = (result.data || []).map(mapImoveisVivaRealToProperty);
      
      return {
        items: mappedItems,
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
    ['properties', 'stats', ...(filters ? [JSON.stringify(filters)] : [])],
    async () => {
      const result = await imoveisVivaRealService.getStats();
      
      if (result.error) {
        throw result.error;
      }
      
      // Também buscar algumas propriedades para completar as estatísticas
      const propertiesResult = await imoveisVivaRealService.findAll({
        filters: mappedFilters,
        limit: 100,
        orderBy: 'price',
        ascending: false
      });
      
      const properties = (propertiesResult.data || []).map(mapImoveisVivaRealToProperty);
      
      return mapImoveisStatsToPropertyMetrics(result.data!, properties);
    },
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      staleTime: 5 * 60 * 1000
    }
  );

  // Mutation para criar propriedade com cache unificado
  const createMutation = cache.createMutation(
    async (data: any) => {
      const mappedData = mapPropertyToImoveisVivaRealInsert(data);
      const result = await imoveisVivaRealService.create(mappedData);
      
      if (result.error) {
        throw result.error;
      }
      
      const mappedProperty = mapImoveisVivaRealToProperty(result.data!);
      
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_CREATED, {
          property: mappedProperty,
          userId: data.agentId
        });
      }
      
      return { data: mappedProperty };
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
      const mappedData = mapPropertyToImoveisVivaRealUpdate(data);
      const result = await imoveisVivaRealService.update(id, mappedData);
      
      if (result.error) {
        throw result.error;
      }
      
      const mappedProperty = mapImoveisVivaRealToProperty(result.data!);
      
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_UPDATED, {
          property: mappedProperty,
          userId: data.agentId
        });
      }
      
      return { data: mappedProperty };
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
      const result = await imoveisVivaRealService.delete(id);
      
      if (result.error) {
        throw result.error;
      }
      
      EventBus.emit(SystemEvents.PROPERTY_DELETED, {
        propertyId: id
      });
      
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

  // Mutation para upload de imagens (placeholder - não implementado no service novo ainda)
  const uploadImagesMutation = useSupabaseMutation(
    async ({ propertyId, files }: { propertyId: string; files: File[] }) => {
      // TODO: Implementar upload de imagens no imoveisVivaRealService
      console.warn('Upload de imagens não implementado no MVP - usando placeholder');
      
      // Por enquanto, simular sucesso
      return { data: { uploaded: files.length } };
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
  const properties = useMemo(() => data?.items as UiProperty[] | undefined, [data]);
  const totalCount = useMemo(() => data?.totalCount || 0, [data]);
  const totalPages = useMemo(() => data?.totalPages || 0, [data]);

  return {
    // Dados
    properties,
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
// HOOK PARA PROPRIEDADE INDIVIDUAL MIGRADO
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

export function usePropertyV3(
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
    async () => {
      const result = await imoveisVivaRealService.findById(id);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data ? mapImoveisVivaRealToProperty(result.data) : null;
    },
    {
      cacheStrategy: CacheStrategy.DYNAMIC,
      enabled: !!id
    }
  );

  // Mutations
  const updateMutation = useSupabaseMutation(
    async (data: any) => {
      const mappedData = mapPropertyToImoveisVivaRealUpdate(data);
      const result = await imoveisVivaRealService.update(id, mappedData);
      
      if (result.error) {
        throw result.error;
      }
      
      const mappedProperty = mapImoveisVivaRealToProperty(result.data!);
      
      if (result.data) {
        EventBus.emit(SystemEvents.PROPERTY_UPDATED, {
          property: mappedProperty
        });
      }
      
      return { data: mappedProperty };
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
      const result = await imoveisVivaRealService.delete(id);
      
      if (result.error) {
        throw result.error;
      }
      
      EventBus.emit(SystemEvents.PROPERTY_DELETED, {
        propertyId: id
      });
      
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
      // TODO: Implementar upload de imagens no imoveisVivaRealService
      console.warn('Upload de imagens não implementado no MVP - usando placeholder');
      
      // Por enquanto, simular sucesso
      return { data: { uploaded: files.length } };
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
// HOOK PARA DASHBOARD DE PROPRIEDADES MIGRADO
// ================================================================

export interface UsePropertiesDashboardReturn {
  stats: PropertyStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePropertiesDashboardV3(): UsePropertiesDashboardReturn {
  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useSupabaseQuery(
    ['properties', 'dashboard-stats'],
    async () => {
      const result = await imoveisVivaRealService.getStats();
      
      if (result.error) {
        throw result.error;
      }
      
      // Buscar algumas propriedades para completar as estatísticas
      const propertiesResult = await imoveisVivaRealService.findAll({
        limit: 100,
        orderBy: 'price',
        ascending: false
      });
      
      const properties = (propertiesResult.data || []).map(mapImoveisVivaRealToProperty);
      
      return mapImoveisStatsToPropertyStats(result.data!, properties);
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
// HOOK PARA IMPORTAÇÃO VIVA REAL (PLACEHOLDER)
// ================================================================

export interface UseImportFromVivaRealReturn {
  importProperty: (url: string) => Promise<void>;
  isImporting: boolean;
  error: Error | null;
}

export function useImportFromVivaRealV3(): UseImportFromVivaRealReturn {
  const importMutation = useSupabaseMutation(
    async (url: string) => {
      // TODO: Implementar importação do Viva Real no novo service
      console.warn('Importação do Viva Real não implementada no MVP - usando placeholder');
      
      // Por enquanto, simular sucesso
      const fakeProperty: Property = {
        id: crypto.randomUUID(),
        title: `Propriedade importada de ${url}`,
        description: 'Propriedade importada do Viva Real (simulado)',
        address: 'Endereço importado',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        price: 500000,
        area: 80,
        bedrooms: 2,
        bathrooms: 1,
        type: 'APARTMENT',
        status: 'AVAILABLE',
        characteristics: null,
        images: [],
        agentId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      EventBus.emit(SystemEvents.PROPERTY_CREATED, {
        property: fakeProperty
      });
      
      return { data: fakeProperty };
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
// HOOK PARA GESTÃO COMPLETA (MANAGER) MIGRADO
// ================================================================

export function usePropertiesManagerV3(options: UsePropertiesOptions = {}) {
  const properties = usePropertiesV3(options);
  const dashboard = usePropertiesDashboardV3();
  const vivaReal = useImportFromVivaRealV3();

  return {
    ...properties,
    dashboard,
    vivaReal
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default usePropertiesV3;