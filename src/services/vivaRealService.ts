// ================================================
// SERVIÇO VIVA REAL - IMOBIPRO
// ================================================
// Data: 30/01/2025
// Descrição: Integração completa com dados do Viva Real
// Funcionalidades: Importação, sincronização, mapeamento de dados
// ================================================

import { supabase } from '@/lib/supabase';
import type {
  Property,
  PropertyFormData,
  PropertyVivaRealData,
  PropertySyncLog,
  VivaRealProperty,
  VivaRealSyncOptions,
  PropertyCategory,
  PropertyType,
  PropertySource,
} from '@/types/properties';

// ================================================
// MAPEAMENTOS DE DADOS VIVA REAL
// ================================================

/**
 * Mapeamento de tipos de categoria do Viva Real para nosso enum
 */
const CATEGORY_MAPPING: Record<string, PropertyCategory> = {
  'Residential': 'RESIDENTIAL',
  'Commercial': 'COMMERCIAL',
  'Industrial': 'INDUSTRIAL',
  'Rural': 'RURAL',
};

/**
 * Mapeamento de tipos de imóvel do Viva Real para nosso enum
 */
const PROPERTY_TYPE_MAPPING: Record<string, PropertyType> = {
  'Apartment': 'APARTMENT',
  'House': 'HOUSE',
  'Commercial Building': 'COMMERCIAL_BUILDING',
  'Office': 'OFFICE',
  'Retail': 'RETAIL',
  'Warehouse': 'WAREHOUSE',
  'Land': 'LAND',
  'Studio': 'STUDIO',
  'Penthouse': 'PENTHOUSE',
  'Duplex': 'DUPLEX',
  'Loft': 'LOFT',
  'Farm': 'FARM',
};

/**
 * Mapeamento de features do Viva Real para português
 */
const FEATURES_MAPPING: Record<string, string> = {
  "Maid's Quarters": "Dependência de Empregada",
  "Kitchen": "Cozinha",
  "Parking Garage": "Garagem",
  "Dinner Room": "Sala de Jantar",
  "Balcony": "Varanda",
  "Gym": "Academia",
  "Gourmet Area": "Área Gourmet",
  "BBQ": "Churrasqueira",
  "Elevator": "Elevador",
  "Pool": "Piscina",
  "Playground": "Playground",
  "Media Room": "Sala de Cinema",
  "Party Room": "Salão de Festas",
  "Garden": "Jardim",
  "Security System": "Sistema de Segurança",
  "Air Conditioning": "Ar Condicionado",
  "Furnished": "Mobiliado",
  "Laundry Room": "Lavanderia",
  "Storage": "Depósito",
  "Office": "Escritório",
  "Walk-in Closet": "Closet",
};

// ================================================
// CLASSE PRINCIPAL DO SERVIÇO
// ================================================

class VivaRealService {

  // ================================================
  // IMPORTAÇÃO DE DADOS
  // ================================================

  /**
   * Importar propriedades do arquivo JSON do Viva Real
   */
  async importFromJsonFile(
    jsonData: VivaRealProperty[],
    options: VivaRealSyncOptions = {}
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const {
      syncImages = true,
      updateExisting = false,
      onProgress,
      onError,
      onSuccess
    } = options;

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter dados da empresa
      const { data: userData } = await supabase
        .from('User')
        .select('companyId')
        .eq('id', user.id)
        .single();

      if (!userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Log de início da sincronização
      const syncLogId = await this.createSyncLog({
        source: 'VIVA_REAL',
        operation: 'CREATE',
        status: 'SUCCESS',
        recordsProcessed: jsonData.length,
      });

      // Processar cada propriedade
      for (let i = 0; i < jsonData.length; i++) {
        const vivaRealProperty = jsonData[i];
        
        try {
          // Reportar progresso
          if (onProgress) {
            const progress = Math.round((i / jsonData.length) * 100);
            onProgress(progress, `Processando propriedade ${i + 1} de ${jsonData.length}`);
          }

          // Converter dados do Viva Real para nosso formato
          const propertyData = this.mapVivaRealToProperty(vivaRealProperty, userData.companyId, user.id);

          // Verificar se propriedade já existe
          const existingProperty = await this.findExistingProperty(vivaRealProperty.listing_id);

          if (existingProperty && !updateExisting) {
            console.log(`Propriedade ${vivaRealProperty.listing_id} já existe, pulando...`);
            continue;
          }

          let property: Property;

          if (existingProperty && updateExisting) {
            // Atualizar propriedade existente
            property = await this.updateExistingProperty(existingProperty.id, propertyData);
          } else {
            // Criar nova propriedade
            property = await this.createNewProperty(propertyData);
          }

          // Sincronizar imagens se solicitado
          if (syncImages && vivaRealProperty.imagens && vivaRealProperty.imagens.length > 0) {
            await this.syncPropertyImages(property.id, vivaRealProperty.imagens);
          }

          // Salvar dados específicos do Viva Real
          await this.saveVivaRealData(property.id, vivaRealProperty);

          successCount++;

        } catch (error) {
          failedCount++;
          const errorMessage = `Erro na propriedade ${vivaRealProperty.listing_id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          errors.push(errorMessage);
          
          if (onError) {
            onError(errorMessage);
          }
          
          console.error('Erro ao processar propriedade:', error);
        }
      }

      // Atualizar log de sincronização
      await this.updateSyncLog(syncLogId, {
        recordsSuccess: successCount,
        recordsFailed: failedCount,
        errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
      });

      if (onSuccess) {
        onSuccess(successCount);
      }

      return { success: successCount, failed: failedCount, errors };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na importação';
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw new Error(`Erro na importação: ${errorMessage}`);
    }
  }

  /**
   * Sincronizar propriedade específica com dados do Viva Real
   */
  async syncProperty(vivaRealProperty: VivaRealProperty): Promise<Property> {
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

      // Converter dados
      const propertyData = this.mapVivaRealToProperty(vivaRealProperty, userData.companyId, user.id);

      // Verificar se existe
      const existingProperty = await this.findExistingProperty(vivaRealProperty.listing_id);

      let property: Property;

      if (existingProperty) {
        property = await this.updateExistingProperty(existingProperty.id, propertyData);
      } else {
        property = await this.createNewProperty(propertyData);
      }

      // Sincronizar imagens
      if (vivaRealProperty.imagens && vivaRealProperty.imagens.length > 0) {
        await this.syncPropertyImages(property.id, vivaRealProperty.imagens);
      }

      // Salvar dados específicos do Viva Real
      await this.saveVivaRealData(property.id, vivaRealProperty);

      return property;

    } catch (error) {
      console.error('Erro ao sincronizar propriedade:', error);
      throw error;
    }
  }

  // ================================================
  // MÉTODOS DE MAPEAMENTO
  // ================================================

  /**
   * Mapear dados do Viva Real para nosso formato
   */
  private mapVivaRealToProperty(
    vivaReal: VivaRealProperty, 
    companyId: string, 
    agentId: string
  ): PropertyFormData {
    // Mapear categoria
    const category = CATEGORY_MAPPING[vivaReal.tipo_categoria] || 'RESIDENTIAL';
    
    // Mapear tipo de propriedade
    const propertyType = PROPERTY_TYPE_MAPPING[vivaReal.tipo_imovel] || 'APARTMENT';

    // Mapear features
    const features = vivaReal.features ? vivaReal.features.map(feature => 
      FEATURES_MAPPING[feature] || feature
    ) : [];

    // Extrair área numérica
    const totalArea = vivaReal.tamanho_m2 ? parseFloat(vivaReal.tamanho_m2) : undefined;

    // Processar preço
    const salePrice = vivaReal.preco ? parseInt(vivaReal.preco.replace(/\D/g, '')) : undefined;

    // Gerar título se não existir
    const title = this.generatePropertyTitle(vivaReal);

    return {
      // Informações básicas
      title,
      description: this.cleanDescription(vivaReal.descricao),
      category,
      propertyType,
      status: 'AVAILABLE',
      listingType: 'SALE', // Assumir venda por padrão
      condition: 'GOOD',

      // Preços
      salePrice,
      currencySymbol: 'R$',

      // Dimensões e características
      totalArea,
      bedrooms: vivaReal.quartos || 0,
      bathrooms: vivaReal.banheiros || 0,
      suites: vivaReal.suite || 0,
      parkingSpaces: vivaReal.garagem || 0,
      floors: 1,
      floor: vivaReal.andar,
      yearBuilt: vivaReal.ano_construcao,

      // Localização
      address: vivaReal.endereco || 'Endereço não informado',
      number: vivaReal.numero || '',
      complement: vivaReal.complemento || '',
      neighborhood: vivaReal.bairro || 'Bairro não informado',
      city: vivaReal.cidade || 'Cidade não informada',
      state: this.normalizeState(vivaReal.cidade),
      zipCode: vivaReal.cep || '',
      country: 'Brasil',

      // Features
      features,
      amenities: [],

      // Metadados
      isFeatured: false,
      notes: `Importado do Viva Real - ID: ${vivaReal.listing_id}`,
    };
  }

  /**
   * Gerar título da propriedade baseado nos dados
   */
  private generatePropertyTitle(vivaReal: VivaRealProperty): string {
    const type = PROPERTY_TYPE_MAPPING[vivaReal.tipo_imovel] || vivaReal.tipo_imovel;
    const typeLabel = type === 'APARTMENT' ? 'Apartamento' : 
                     type === 'HOUSE' ? 'Casa' : 
                     type === 'COMMERCIAL_BUILDING' ? 'Comercial' : 'Imóvel';
    
    const bedrooms = vivaReal.quartos > 0 ? `${vivaReal.quartos} qts` : '';
    const area = vivaReal.tamanho_m2 ? `${vivaReal.tamanho_m2}m²` : '';
    const neighborhood = vivaReal.bairro ? `- ${vivaReal.bairro}` : '';
    const city = vivaReal.cidade ? `- ${vivaReal.cidade}` : '';

    return `${typeLabel} ${bedrooms} ${area} ${neighborhood} ${city}`.trim().replace(/\s+/g, ' ');
  }

  /**
   * Limpar descrição HTML
   */
  private cleanDescription(description?: string): string {
    if (!description) return '';
    
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&lt;/g, '<')   // Decode HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')    // Remove multiple spaces
      .trim();
  }

  /**
   * Normalizar estado baseado na cidade
   */
  private normalizeState(city?: string): string {
    if (!city) return 'MS'; // Padrão Mato Grosso do Sul
    
    // Mapeamento de cidades conhecidas para estados
    const cityStateMap: Record<string, string> = {
      'Campo Grande': 'MS',
      'Dourados': 'MS',
      'Três Lagoas': 'MS',
      'Corumbá': 'MS',
      'Ponta Porã': 'MS',
    };

    return cityStateMap[city] || 'MS';
  }

  // ================================================
  // MÉTODOS DE PERSISTÊNCIA
  // ================================================

  /**
   * Verificar se propriedade já existe
   */
  private async findExistingProperty(vivaRealListingId: string): Promise<Property | null> {
    try {
      const { data, error } = await supabase
        .from('Property')
        .select('*')
        .eq('vivaRealListingId', vivaRealListingId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar propriedade existente:', error);
      return null;
    }
  }

  /**
   * Criar nova propriedade
   */
  private async createNewProperty(propertyData: PropertyFormData): Promise<Property> {
    try {
      const { data, error } = await supabase
        .from('Property')
        .insert({
          ...propertyData,
          source: 'VIVA_REAL' as PropertySource,
          isActive: true,
          viewCount: 0,
          favoriteCount: 0,
          isDevelopmentUnit: false,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Erro ao criar propriedade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar propriedade:', error);
      throw error;
    }
  }

  /**
   * Atualizar propriedade existente
   */
  private async updateExistingProperty(propertyId: string, propertyData: PropertyFormData): Promise<Property> {
    try {
      const { data, error } = await supabase
        .from('Property')
        .update({
          ...propertyData,
          lastSyncAt: new Date().toISOString(),
        })
        .eq('id', propertyId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar propriedade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar propriedade:', error);
      throw error;
    }
  }

  /**
   * Sincronizar imagens da propriedade
   */
  private async syncPropertyImages(propertyId: string, imageUrls: string[]): Promise<void> {
    try {
      // Limpar imagens existentes do Viva Real
      await supabase
        .from('PropertyImage')
        .delete()
        .eq('propertyId', propertyId)
        .like('url', '%googleusercontent.com%');

      // Inserir novas imagens
      const imageData = imageUrls.map((url, index) => ({
        propertyId,
        url,
        alt: `Imagem ${index + 1}`,
        order: index,
        isMain: index === 0,
        isActive: true,
      }));

      const { error } = await supabase
        .from('PropertyImage')
        .insert(imageData);

      if (error) {
        console.error('Erro ao sincronizar imagens:', error);
        // Não lançar erro para não interromper o processo
      }
    } catch (error) {
      console.error('Erro ao sincronizar imagens:', error);
    }
  }

  /**
   * Salvar dados específicos do Viva Real
   */
  private async saveVivaRealData(propertyId: string, vivaReal: VivaRealProperty): Promise<void> {
    try {
      const vivaRealData = {
        propertyId,
        listingId: vivaReal.listing_id,
        thumbnails: vivaReal.imagens || [],
        originalData: vivaReal,
        lastSyncAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('PropertyVivaRealData')
        .upsert(vivaRealData, { onConflict: 'propertyId' });

      if (error) {
        console.error('Erro ao salvar dados Viva Real:', error);
      }
    } catch (error) {
      console.error('Erro ao salvar dados Viva Real:', error);
    }
  }

  // ================================================
  // LOGS DE SINCRONIZAÇÃO
  // ================================================

  /**
   * Criar log de sincronização
   */
  private async createSyncLog(logData: Partial<PropertySyncLog>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('PropertySyncLog')
        .insert({
          source: logData.source || 'VIVA_REAL',
          operation: logData.operation || 'CREATE',
          status: 'SUCCESS',
          recordsProcessed: logData.recordsProcessed || 0,
          recordsSuccess: 0,
          recordsFailed: 0,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Erro ao criar log de sync:', error);
      return '';
    }
  }

  /**
   * Atualizar log de sincronização
   */
  private async updateSyncLog(logId: string, updateData: Partial<PropertySyncLog>): Promise<void> {
    try {
      const { error } = await supabase
        .from('PropertySyncLog')
        .update(updateData)
        .eq('id', logId);

      if (error) {
        console.error('Erro ao atualizar log de sync:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar log de sync:', error);
    }
  }

  // ================================================
  // MÉTODOS UTILITÁRIOS
  // ================================================

  /**
   * Obter logs de sincronização
   */
  async getSyncLogs(limit: number = 50): Promise<PropertySyncLog[]> {
    try {
      const { data, error } = await supabase
        .from('PropertySyncLog')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao buscar logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de sincronização
   */
  async getSyncStats(): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalPropertiesImported: number;
    lastSyncDate?: string;
  }> {
    try {
      const { data: logs, error } = await supabase
        .from('PropertySyncLog')
        .select('*')
        .eq('source', 'VIVA_REAL');

      if (error) {
        throw error;
      }

      const totalSyncs = logs?.length || 0;
      const successfulSyncs = logs?.filter(log => log.status === 'SUCCESS').length || 0;
      const failedSyncs = logs?.filter(log => log.status === 'FAILED').length || 0;
      const totalPropertiesImported = logs?.reduce((sum, log) => sum + (log.recordsSuccess || 0), 0) || 0;
      const lastSyncDate = logs?.[0]?.createdAt;

      return {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        totalPropertiesImported,
        lastSyncDate,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}

// ================================================
// INSTÂNCIA SINGLETON
// ================================================

export const vivaRealService = new VivaRealService();
export default vivaRealService;