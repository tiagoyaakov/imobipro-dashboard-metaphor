import { BaseService } from './base.service'
import { supabase, type Tables } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// Tipos específicos para Property
export type Property = Tables['Property']['Row']
export type PropertyInsert = Tables['Property']['Insert']
export type PropertyUpdate = Tables['Property']['Update']

// Filtros específicos para propriedades
export interface PropertyFilters {
  status?: Property['status']
  type?: Property['propertyType']
  category?: Property['category']
  minPrice?: number
  maxPrice?: number
  city?: string
  neighborhood?: string
  bedrooms?: number
  bathrooms?: number
  minArea?: number
  maxArea?: number
  agentId?: string
  search?: string
}

// Estatísticas de propriedades
export interface PropertyStats {
  total: number
  available: number
  sold: number
  reserved: number
  avgPrice: number
  byType: Record<string, number>
  byCity: Record<string, number>
}

export class PropertyService extends BaseService<'Property'> {
  constructor() {
    super('Property', 'property')
  }

  // Override findAll para incluir relacionamentos
  async findAll(options?: any) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl),
          owner:PropertyOwner(id, name, email, phone)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters as PropertyFilters
        
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.type) query = query.eq('propertyType', filters.type)
        if (filters.category) query = query.eq('category', filters.category)
        if (filters.city) query = query.ilike('city', `%${filters.city}%`)
        if (filters.neighborhood) query = query.ilike('neighborhood', `%${filters.neighborhood}%`)
        if (filters.minPrice) query = query.gte('price', filters.minPrice)
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
        if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms)
        if (filters.bathrooms) query = query.eq('bathrooms', filters.bathrooms)
        if (filters.minArea) query = query.gte('area', filters.minArea)
        if (filters.maxArea) query = query.lte('area', filters.maxArea)
        if (filters.agentId) query = query.eq('agentId', filters.agentId)
        
        // Busca textual
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        query = query.order('createdAt', { ascending: false })
      }

      // Aplicar paginação
      if (options?.limit) {
        query = query.limit(options.limit)
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1)
        }
      }

      const { data, error, count } = await query

      if (error) throw this.handleError(error)

      return { data, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar por ID com relacionamentos
  async findById(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl),
          owner:PropertyOwner(id, name, email, phone),
          images:PropertyImage(id, url, alt, order, isMain),
          appointments:Appointment(id, date, status, contact:Contact(name, phone)),
          deals:Deal(id, stage, value, client:Contact(name))
        `)
        .eq('id', id)
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw this.handleError(error)

      // Emitir evento de visualização
      if (data) {
        EventBus.emit(SystemEvents.PROPERTY_VIEWED, { propertyId: id })
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar propriedades próximas
  async findNearby(lat: number, lon: number, radiusKm: number = 5) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('search_properties_by_location', {
        search_lat: lat,
        search_lon: lon,
        radius_km: radiusKm,
        company_id: profile.companyId
      })

      if (error) throw this.handleError(error)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: PropertyStats | null; error: Error | null }> {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de propriedades
      const { count: total } = await baseQuery

      // Por status
      const statusQueries = ['AVAILABLE', 'SOLD', 'RESERVED'].map(async (status) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', status)
        q = await this.applyRLS(q)
        const { count } = await q
        return { status, count: count || 0 }
      })

      const statusCounts = await Promise.all(statusQueries)
      const statusMap = Object.fromEntries(statusCounts.map(s => [s.status.toLowerCase(), s.count]))

      // Preço médio
      let avgQuery = supabase.from(this.tableName).select('price')
      avgQuery = await this.applyRLS(avgQuery)
      const { data: priceData } = await avgQuery
      const avgPrice = priceData?.length 
        ? priceData.reduce((sum, p) => sum + (p.price || 0), 0) / priceData.length 
        : 0

      // Por tipo
      const types = ['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OTHER']
      const typeQueries = types.map(async (type) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('propertyType', type)
        q = await this.applyRLS(q)
        const { count } = await q
        return { type, count: count || 0 }
      })

      const typeCounts = await Promise.all(typeQueries)
      const byType = Object.fromEntries(typeCounts.map(t => [t.type, t.count]))

      // Por cidade (top 5)
      let cityQuery = supabase.from(this.tableName).select('city')
      cityQuery = await this.applyRLS(cityQuery)
      const { data: cityData } = await cityQuery
      
      const cityCount: Record<string, number> = {}
      cityData?.forEach(p => {
        if (p.city) {
          cityCount[p.city] = (cityCount[p.city] || 0) + 1
        }
      })

      const byCity = Object.fromEntries(
        Object.entries(cityCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      )

      const stats: PropertyStats = {
        total: total || 0,
        available: statusMap.available || 0,
        sold: statusMap.sold || 0,
        reserved: statusMap.reserved || 0,
        avgPrice,
        byType,
        byCity
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Upload de imagens
  async uploadImage(propertyId: string, file: File, isMain = false) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Verificar se a propriedade existe e pertence ao usuário
      const { data: property } = await this.findById(propertyId)
      if (!property) throw new Error('Property not found')

      // Upload para Supabase Storage
      const fileName = `${propertyId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName)

      // Salvar referência no banco
      const { data: imageData, error: dbError } = await supabase
        .from('PropertyImage')
        .insert({
          id: crypto.randomUUID(),
          propertyId,
          url: publicUrl,
          alt: file.name,
          isMain,
          order: isMain ? 0 : 999,
          fileSize: file.size,
          mimeType: file.type,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Se for imagem principal, atualizar outras
      if (isMain) {
        await supabase
          .from('PropertyImage')
          .update({ isMain: false })
          .eq('propertyId', propertyId)
          .neq('id', imageData.id)
      }

      return { data: imageData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar do Viva Real
  async importFromVivaReal(vivaRealData: any) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Mapear dados do Viva Real para nosso formato
      const propertyData: PropertyInsert = {
        id: crypto.randomUUID(),
        title: vivaRealData.title || 'Imóvel importado',
        description: vivaRealData.description,
        address: vivaRealData.address?.street || '',
        number: vivaRealData.address?.streetNumber,
        neighborhood: vivaRealData.address?.neighborhood,
        city: vivaRealData.address?.city || '',
        state: vivaRealData.address?.state || '',
        zipCode: vivaRealData.address?.zipCode || '',
        country: 'Brasil',
        
        price: vivaRealData.pricingInfos?.price || 0,
        salePrice: vivaRealData.pricingInfos?.price,
        rentPrice: vivaRealData.pricingInfos?.monthlyRentalPrice,
        condominiumFee: vivaRealData.pricingInfos?.monthlyCondoFee,
        iptuPrice: vivaRealData.pricingInfos?.yearlyIptu,
        
        area: vivaRealData.usableAreas || vivaRealData.totalAreas || 0,
        usefulArea: vivaRealData.usableAreas,
        totalArea: vivaRealData.totalAreas,
        
        bedrooms: vivaRealData.bedrooms || 0,
        bathrooms: vivaRealData.bathrooms || 0,
        suites: vivaRealData.suites,
        parkingSpaces: vivaRealData.parkingSpaces || 0,
        
        propertyType: this.mapVivaRealType(vivaRealData.unitTypes?.[0]),
        status: 'AVAILABLE',
        listingType: vivaRealData.businessType === 'SALE' ? 'SALE' : 'RENT',
        source: 'VIVA_REAL',
        
        latitude: vivaRealData.address?.point?.lat,
        longitude: vivaRealData.address?.point?.lon,
        
        vivaRealId: vivaRealData.id,
        vivaRealListingId: vivaRealData.listingId,
        vivaRealUrl: vivaRealData.link?.href,
        
        images: vivaRealData.images?.map((img: any) => img.url) || [],
        amenities: vivaRealData.amenities || [],
        
        agentId: profile.id,
        companyId: profile.companyId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Criar propriedade
      const result = await this.create(propertyData)

      // Se sucesso, importar imagens
      if (result.data && vivaRealData.images?.length) {
        for (let i = 0; i < vivaRealData.images.length; i++) {
          const img = vivaRealData.images[i]
          await supabase.from('PropertyImage').insert({
            id: crypto.randomUUID(),
            propertyId: result.data.id,
            url: img.url,
            alt: img.name || `Imagem ${i + 1}`,
            isMain: i === 0,
            order: i,
            createdAt: new Date().toISOString()
          })
        }
      }

      return result
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Helpers privados
  private mapVivaRealType(type?: string): Property['propertyType'] {
    const typeMap: Record<string, Property['propertyType']> = {
      'APARTMENT': 'APARTMENT',
      'HOME': 'HOUSE',
      'CONDOMINIUM': 'APARTMENT',
      'COMMERCIAL': 'COMMERCIAL',
      'LAND': 'LAND',
      'FARM': 'LAND',
    }
    return typeMap[type || ''] || 'OTHER'
  }

  private async getCurrentUserProfile() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null

    const { data: profile } = await supabase
      .from('User')
      .select('*, Company(*)')
      .eq('id', data.user.id)
      .single()

    return profile
  }
}

// Exportar instância única
export const propertyService = new PropertyService()