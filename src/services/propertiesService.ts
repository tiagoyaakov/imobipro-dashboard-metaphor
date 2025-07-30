// ================================================
// SERVIÇO DE PROPRIEDADES - IMOBIPRO
// ================================================
// Data: 30/01/2025
// Descrição: Serviço completo para gestão de propriedades
// Funcionalidades: CRUD, filtros, busca, métricas, validação
// ================================================

import { supabase } from '@/lib/supabase';
import type {
  Property,
  PropertyOwner,
  PropertyImage,
  PropertyVivaRealData,
  PropertySyncLog,
  PropertyAppointment,
  PropertyFormData,
  PropertyOwnerFormData,
  PropertyFilters,
  PropertySearchParams,
  PropertySearchResult,
  PropertyMetrics,
  PropertyAnalytics,
  PropertyValidationResult,
  PropertyValidationError,
} from '@/types/properties';

// ================================================
// CLASSE PRINCIPAL DO SERVIÇO
// ================================================

class PropertiesService {
  
  // ================================================
  // CRUD - PROPRIEDADES
  // ================================================

  /**
   * Buscar todas as propriedades da empresa com filtros opcionais
   */
  async getProperties(params: PropertySearchParams = {}): Promise<PropertySearchResult> {
    try {
      const {
        query,
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = params;

      let queryBuilder = supabase
        .from('Property')
        .select(`
          *,
          owner:PropertyOwner(*),
          agent:User(id, name, email),
          images:PropertyImage(*),
          vivaRealData:PropertyVivaRealData(*),
          _count:PropertyAppointment(count)
        `)
        .eq('isActive', true);

      // Aplicar filtros de texto
      if (query) {
        queryBuilder = queryBuilder.or(`
          title.ilike.%${query}%,
          description.ilike.%${query}%,
          address.ilike.%${query}%,
          neighborhood.ilike.%${query}%,
          city.ilike.%${query}%
        `);
      }

      // Aplicar filtros específicos
      queryBuilder = this.applyFilters(queryBuilder, filters);

      // Aplicar ordenação
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      queryBuilder = queryBuilder.range(from, to);

      const { data: properties, error, count } = await queryBuilder;

      if (error) {
        console.error('Error fetching properties:', error);
        throw new Error(`Erro ao buscar propriedades: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        properties: properties || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      console.error('Error in getProperties:', error);
      throw error;
    }
  }

  /**
   * Buscar propriedade por ID
   */
  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const { data, error } = await supabase
        .from('Property')
        .select(`
          *,
          owner:PropertyOwner(*),
          agent:User(id, name, email),
          images:PropertyImage(*),
          vivaRealData:PropertyVivaRealData(*),
          appointments:PropertyAppointment(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Erro ao buscar propriedade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      throw error;
    }
  }

  /**
   * Criar nova propriedade
   */
  async createProperty(propertyData: PropertyFormData): Promise<Property> {
    try {
      // Validar dados
      const validation = this.validatePropertyData(propertyData);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Obter dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter companyId do usuário
      const { data: userData } = await supabase
        .from('User')
        .select('companyId')
        .eq('id', user.id)
        .single();

      if (!userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Preparar dados para inserção
      const insertData = {
        ...propertyData,
        companyId: userData.companyId,
        agentId: user.id,
        isActive: true,
        viewCount: 0,
        favoriteCount: 0,
        source: 'MANUAL',
        isDevelopmentUnit: false,
      };

      // Criar proprietário se fornecido
      if (propertyData.ownerData && !propertyData.ownerId) {
        const owner = await this.createPropertyOwner(propertyData.ownerData);
        insertData.ownerId = owner.id;
      }

      const { data, error } = await supabase
        .from('Property')
        .insert(insertData)
        .select(`
          *,
          owner:PropertyOwner(*),
          agent:User(id, name, email),
          images:PropertyImage(*)
        `)
        .single();

      if (error) {
        throw new Error(`Erro ao criar propriedade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createProperty:', error);
      throw error;
    }
  }

  /**
   * Atualizar propriedade
   */
  async updateProperty(id: string, updateData: Partial<PropertyFormData>): Promise<Property> {
    try {
      // Validar dados se fornecidos
      if (Object.keys(updateData).length > 0) {
        const validation = this.validatePropertyData(updateData);
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      const { data, error } = await supabase
        .from('Property')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          owner:PropertyOwner(*),
          agent:User(id, name, email),
          images:PropertyImage(*)
        `)
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar propriedade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateProperty:', error);
      throw error;
    }
  }

  /**
   * Excluir propriedade (soft delete)
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Property')
        .update({ isActive: false })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao excluir propriedade: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteProperty:', error);
      throw error;
    }
  }

  // ================================================
  // CRUD - PROPRIETÁRIOS
  // ================================================

  /**
   * Buscar todos os proprietários
   */
  async getPropertyOwners(): Promise<PropertyOwner[]> {
    try {
      const { data, error } = await supabase
        .from('PropertyOwner')
        .select('*')
        .eq('isActive', true)
        .order('name');

      if (error) {
        throw new Error(`Erro ao buscar proprietários: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPropertyOwners:', error);
      throw error;
    }
  }

  /**
   * Criar proprietário
   */
  async createPropertyOwner(ownerData: PropertyOwnerFormData): Promise<PropertyOwner> {
    try {
      const { data, error } = await supabase
        .from('PropertyOwner')
        .insert({
          ...ownerData,
          isActive: true,
          country: ownerData.country || 'Brasil',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar proprietário: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createPropertyOwner:', error);
      throw error;
    }
  }

  // ================================================
  // GESTÃO DE IMAGENS
  // ================================================

  /**
   * Fazer upload de imagem da propriedade
   */
  async uploadPropertyImage(
    propertyId: string,
    file: File,
    metadata: Partial<PropertyImage> = {}
  ): Promise<PropertyImage> {
    try {
      // Upload do arquivo para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      // Salvar metadados no banco
      const { data, error } = await supabase
        .from('PropertyImage')
        .insert({
          propertyId,
          url: urlData.publicUrl,
          alt: metadata.alt || file.name,
          title: metadata.title,
          description: metadata.description,
          order: metadata.order || 0,
          isMain: metadata.isMain || false,
          isActive: true,
          width: metadata.width,
          height: metadata.height,
          fileSize: file.size,
          mimeType: file.type,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao salvar imagem: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in uploadPropertyImage:', error);
      throw error;
    }
  }

  /**
   * Excluir imagem da propriedade
   */
  async deletePropertyImage(imageId: string): Promise<void> {
    try {
      // Buscar dados da imagem
      const { data: image, error: fetchError } = await supabase
        .from('PropertyImage')
        .select('url')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar imagem: ${fetchError.message}`);
      }

      // Extrair nome do arquivo da URL
      const urlParts = image.url.split('/');
      const fileName = urlParts.slice(-2).join('/'); // propertyId/filename

      // Excluir arquivo do storage
      const { error: deleteFileError } = await supabase.storage
        .from('property-images')
        .remove([fileName]);

      if (deleteFileError) {
        console.warn('Erro ao excluir arquivo do storage:', deleteFileError);
      }

      // Excluir registro do banco
      const { error } = await supabase
        .from('PropertyImage')
        .delete()
        .eq('id', imageId);

      if (error) {
        throw new Error(`Erro ao excluir imagem: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deletePropertyImage:', error);
      throw error;
    }
  }

  // ================================================
  // MÉTRICAS E ANALYTICS
  // ================================================

  /**
   * Obter métricas da empresa
   */
  async getPropertyMetrics(): Promise<PropertyMetrics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar propriedades da empresa
      const { data: properties } = await supabase
        .from('Property')
        .select('*')
        .eq('isActive', true);

      if (!properties) {
        throw new Error('Erro ao buscar propriedades para métricas');
      }

      // Calcular métricas
      const totalProperties = properties.length;
      const activeProperties = properties.filter(p => p.status === 'AVAILABLE').length;
      const featuredProperties = properties.filter(p => p.isFeatured).length;
      const availableForSale = properties.filter(p => 
        p.listingType === 'SALE' || p.listingType === 'BOTH'
      ).length;
      const availableForRent = properties.filter(p => 
        p.listingType === 'RENT' || p.listingType === 'BOTH'
      ).length;

      // Vendas/aluguéis do mês atual
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const soldThisMonth = properties.filter(p => 
        p.status === 'SOLD' && new Date(p.updatedAt) >= currentMonth
      ).length;
      const rentedThisMonth = properties.filter(p => 
        p.status === 'RENTED' && new Date(p.updatedAt) >= currentMonth
      ).length;

      // Preços médios
      const saleProperties = properties.filter(p => p.salePrice);
      const rentProperties = properties.filter(p => p.rentPrice);
      const averageSalePrice = saleProperties.length > 0 
        ? saleProperties.reduce((sum, p) => sum + (p.salePrice || 0), 0) / saleProperties.length
        : 0;
      const averageRentPrice = rentProperties.length > 0
        ? rentProperties.reduce((sum, p) => sum + (p.rentPrice || 0), 0) / rentProperties.length
        : 0;

      // Views e favoritos totais
      const totalViews = properties.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const totalFavorites = properties.reduce((sum, p) => sum + (p.favoriteCount || 0), 0);

      // Distribuição por tipo
      const propertiesByType = properties.reduce((acc, p) => {
        acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Distribuição por status
      const propertiesByStatus = properties.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Distribuição por cidade
      const propertiesByCity = properties.reduce((acc, p) => {
        acc[p.city] = (acc[p.city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalProperties,
        activeProperties,
        featuredProperties,
        availableForSale,
        availableForRent,
        soldThisMonth,
        rentedThisMonth,
        averageSalePrice,
        averageRentPrice,
        totalViews,
        totalFavorites,
        propertiesByType,
        propertiesByStatus,
        propertiesByCity,
        recentActivity: [], // TODO: Implementar histórico de atividades
      };
    } catch (error) {
      console.error('Error in getPropertyMetrics:', error);
      throw error;
    }
  }

  // ================================================
  // BUSCA POR LOCALIZAÇÃO
  // ================================================

  /**
   * Buscar propriedades por proximidade
   */
  async searchPropertiesByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<Property[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: userData } = await supabase
        .from('User')
        .select('companyId')
        .eq('id', user.id)
        .single();

      if (!userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      const { data, error } = await supabase
        .rpc('search_properties_by_location', {
          search_lat: latitude,
          search_lon: longitude,
          radius_km: radiusKm,
          company_id: userData.companyId
        });

      if (error) {
        throw new Error(`Erro na busca por localização: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchPropertiesByLocation:', error);
      throw error;
    }
  }

  // ================================================
  // MÉTODOS AUXILIARES
  // ================================================

  /**
   * Aplicar filtros na query
   */
  private applyFilters(queryBuilder: any, filters: PropertyFilters) {
    // Filtros de categoria
    if (filters.category && filters.category.length > 0) {
      queryBuilder = queryBuilder.in('category', filters.category);
    }

    // Filtros de tipo
    if (filters.propertyType && filters.propertyType.length > 0) {
      queryBuilder = queryBuilder.in('propertyType', filters.propertyType);
    }

    // Filtros de status
    if (filters.status && filters.status.length > 0) {
      queryBuilder = queryBuilder.in('status', filters.status);
    }

    // Filtros de preço de venda
    if (filters.minSalePrice) {
      queryBuilder = queryBuilder.gte('salePrice', filters.minSalePrice);
    }
    if (filters.maxSalePrice) {
      queryBuilder = queryBuilder.lte('salePrice', filters.maxSalePrice);
    }

    // Filtros de preço de aluguel
    if (filters.minRentPrice) {
      queryBuilder = queryBuilder.gte('rentPrice', filters.minRentPrice);
    }
    if (filters.maxRentPrice) {
      queryBuilder = queryBuilder.lte('rentPrice', filters.maxRentPrice);
    }

    // Filtros de quartos
    if (filters.minBedrooms) {
      queryBuilder = queryBuilder.gte('bedrooms', filters.minBedrooms);
    }
    if (filters.maxBedrooms) {
      queryBuilder = queryBuilder.lte('bedrooms', filters.maxBedrooms);
    }

    // Filtros de banheiros
    if (filters.minBathrooms) {
      queryBuilder = queryBuilder.gte('bathrooms', filters.minBathrooms);
    }
    if (filters.maxBathrooms) {
      queryBuilder = queryBuilder.lte('bathrooms', filters.maxBathrooms);
    }

    // Filtros de localização
    if (filters.city) {
      queryBuilder = queryBuilder.eq('city', filters.city);
    }
    if (filters.neighborhood && filters.neighborhood.length > 0) {
      queryBuilder = queryBuilder.in('neighborhood', filters.neighborhood);
    }
    if (filters.state) {
      queryBuilder = queryBuilder.eq('state', filters.state);
    }

    // Filtros especiais
    if (filters.isFeatured !== undefined) {
      queryBuilder = queryBuilder.eq('isFeatured', filters.isFeatured);
    }
    if (filters.agentId) {
      queryBuilder = queryBuilder.eq('agentId', filters.agentId);
    }
    if (filters.ownerId) {
      queryBuilder = queryBuilder.eq('ownerId', filters.ownerId);
    }

    return queryBuilder;
  }

  /**
   * Validar dados da propriedade
   */
  private validatePropertyData(data: Partial<PropertyFormData>): PropertyValidationResult {
    const errors: PropertyValidationError[] = [];

    // Validações obrigatórias
    if (data.title && data.title.trim().length < 3) {
      errors.push({
        field: 'title',
        message: 'Título deve ter pelo menos 3 caracteres',
        code: 'TITLE_TOO_SHORT'
      });
    }

    if (data.address && data.address.trim().length < 5) {
      errors.push({
        field: 'address',
        message: 'Endereço deve ter pelo menos 5 caracteres',
        code: 'ADDRESS_TOO_SHORT'
      });
    }

    if (data.neighborhood && data.neighborhood.trim().length < 2) {
      errors.push({
        field: 'neighborhood',
        message: 'Bairro deve ter pelo menos 2 caracteres',
        code: 'NEIGHBORHOOD_TOO_SHORT'
      });
    }

    if (data.city && data.city.trim().length < 2) {
      errors.push({
        field: 'city',
        message: 'Cidade deve ter pelo menos 2 caracteres',
        code: 'CITY_TOO_SHORT'
      });
    }

    // Validações de preço
    if (data.salePrice && data.salePrice < 0) {
      errors.push({
        field: 'salePrice',
        message: 'Preço de venda deve ser positivo',
        code: 'NEGATIVE_SALE_PRICE'
      });
    }

    if (data.rentPrice && data.rentPrice < 0) {
      errors.push({
        field: 'rentPrice',
        message: 'Preço de aluguel deve ser positivo',
        code: 'NEGATIVE_RENT_PRICE'
      });
    }

    // Validações de características
    if (data.bedrooms !== undefined && data.bedrooms < 0) {
      errors.push({
        field: 'bedrooms',
        message: 'Número de quartos não pode ser negativo',
        code: 'NEGATIVE_BEDROOMS'
      });
    }

    if (data.bathrooms !== undefined && data.bathrooms < 0) {
      errors.push({
        field: 'bathrooms',
        message: 'Número de banheiros não pode ser negativo',
        code: 'NEGATIVE_BATHROOMS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ================================================
// INSTÂNCIA SINGLETON
// ================================================

export const propertiesService = new PropertiesService();
export default propertiesService;