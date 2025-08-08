import { supabase } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'
import { env } from '@/lib/utils'

// ========================================
// TIPOS PARA NOVA TABELA imoveisvivareal4
// ========================================

// Tipos básicos para imoveisvivareal4 (temporário até regenerar Supabase types)
export interface ImoveisVivaReal {
  id: string
  title: string
  description?: string | null
  address: string
  city: string
  state: string
  zipCode?: string | null
  price: number
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpaces?: number | null
  propertyType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'OTHER'
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED'
  listingType: 'SALE' | 'RENT' | 'BOTH'
  images?: string[] | null
  corretor_responsavel?: string | null  // Corretor responsável (ID do User)
  vivaRealId?: string | null
  vivaRealListingId?: string | null  
  vivaRealUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  amenities?: string[] | null
  features?: string[] | null
  neighborhood?: string | null
  condominiumFee?: number | null
  iptuPrice?: number | null
  isActive: boolean
  isFeatured?: boolean | null
  created_at: string
  updated_at: string
}

export interface ImoveisVivaRealInsert {
  id?: string
  title: string
  description?: string | null
  address: string
  city: string
  state: string
  zipCode?: string | null
  price: number
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpaces?: number | null
  propertyType?: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'OTHER'
  status?: 'AVAILABLE' | 'SOLD' | 'RESERVED'
  listingType?: 'SALE' | 'RENT' | 'BOTH'
  images?: string[] | null
  corretor_responsavel?: string | null
  vivaRealId?: string | null
  vivaRealListingId?: string | null  
  vivaRealUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  amenities?: string[] | null
  features?: string[] | null
  neighborhood?: string | null
  condominiumFee?: number | null
  iptuPrice?: number | null
  isActive?: boolean
  isFeatured?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface ImoveisVivaRealUpdate {
  title?: string
  description?: string | null
  address?: string
  city?: string
  state?: string
  zipCode?: string | null
  price?: number
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpaces?: number | null
  propertyType?: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'OTHER'
  status?: 'AVAILABLE' | 'SOLD' | 'RESERVED'
  listingType?: 'SALE' | 'RENT' | 'BOTH'
  images?: string[] | null
  corretor_responsavel?: string | null
  vivaRealId?: string | null
  vivaRealListingId?: string | null  
  vivaRealUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  amenities?: string[] | null
  features?: string[] | null
  neighborhood?: string | null
  condominiumFee?: number | null
  iptuPrice?: number | null
  isActive?: boolean
  isFeatured?: boolean | null
  updated_at?: string
}

// ========================================
// INTERFACES
// ========================================

// Filtros específicos para imoveisvivareal4
export interface ImoveisVivaRealFilters {
  status?: ImoveisVivaReal['status']
  propertyType?: ImoveisVivaReal['propertyType']
  listingType?: ImoveisVivaReal['listingType']
  minPrice?: number
  maxPrice?: number
  city?: string
  neighborhood?: string
  bedrooms?: number
  bathrooms?: number
  minArea?: number
  maxArea?: number
  corretor_responsavel?: string
  search?: string
  isFeatured?: boolean
  isActive?: boolean
}

// Estatísticas de propriedades
export interface ImoveisVivaRealStats {
  total: number
  available: number
  sold: number
  reserved: number
  avgPrice: number
  byType: Record<string, number>
  byCity: Record<string, number>
  byAgent: Record<string, number>
  featured: number
}

// ========================================
// SERVICE CLASS  
// ========================================

export class ImoveisVivaRealService {
  private tableName = 'imoveisvivareal4'
  
  constructor() {}

  // Aplicar RLS baseado no usuário logado
  private async applyRLS(query: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Buscar perfil do usuário para aplicar RLS
    const { data: profile } = await supabase
      .from('User')
      .select('id, role, companyId')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('User profile not found')

    // Aplicar filtros baseados no role
    if (profile.role === 'DEV_MASTER') {
      // DEV_MASTER vê todos
      return query
    } else if (profile.role === 'ADMIN') {
      // ADMIN vê todos da sua empresa
      const { data: companyUsers } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', profile.companyId)
      
      const agentIds = companyUsers?.map(u => u.id) || []
      return query.in('corretor_responsavel', agentIds)
    } else if (profile.role === 'AGENT') {
      // AGENT vê apenas próprias propriedades
      return query.eq('corretor_responsavel', profile.id)
    }

    return query
  }

  // Buscar todas as propriedades com filtros
  async findAll(options?: {
    filters?: ImoveisVivaRealFilters
    orderBy?: string
    ascending?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      const useProxy = (import.meta as any)?.env?.VITE_USE_API_PROPERTIES === 'true'
        || (typeof window !== 'undefined' && window.location?.hostname?.includes('vercel.app'))

      if (useProxy) {
        const params = new URLSearchParams()
        if (options?.filters?.status) params.set('status', String(options.filters.status))
        if (options?.filters?.propertyType) params.set('propertyType', String(options.filters.propertyType))
        if (options?.filters?.listingType) params.set('listingType', String(options.filters.listingType))
        if (options?.filters?.city) params.set('city', String(options.filters.city))
        if (options?.filters?.minPrice != null) params.set('minPrice', String(options.filters.minPrice))
        if (options?.filters?.maxPrice != null) params.set('maxPrice', String(options.filters.maxPrice))
        if (options?.filters?.bedrooms != null) params.set('minBedrooms', String(options.filters.bedrooms))
        if (options?.filters?.search) params.set('search', String(options.filters.search))
        const page = options?.offset && options?.limit ? Math.floor(options.offset / options.limit) + 1 : 1
        params.set('page', String(page))
        params.set('limit', String(options?.limit || 20))

        const res = await fetch(`/api/properties?${params.toString()}`, { method: 'GET' })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`API /api/properties ${res.status}: ${txt}`)
        }
        const json = await res.json()
        return { data: json.items, error: null, count: json.total }
      }

      // Remover join com tabela User para evitar 403 por RLS em produção
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters
        
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.propertyType) query = query.eq('propertyType', filters.propertyType)
        if (filters.listingType) query = query.eq('listingType', filters.listingType)
        if (filters.city) query = query.ilike('city', `%${filters.city}%`)
        if (filters.neighborhood) query = query.ilike('neighborhood', `%${filters.neighborhood}%`)
        if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice)
        if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice)
        if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms)
        if (filters.bathrooms) query = query.eq('bathrooms', filters.bathrooms)
        if (filters.minArea !== undefined) query = query.gte('area', filters.minArea)
        if (filters.maxArea !== undefined) query = query.lte('area', filters.maxArea)
        if (filters.corretor_responsavel) query = query.eq('corretor_responsavel', filters.corretor_responsavel)
        if (filters.isFeatured !== undefined) query = query.eq('isFeatured', filters.isFeatured)
        if (filters.isActive !== undefined) query = query.eq('isActive', filters.isActive)
        
        // Busca textual
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%,description.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: destaque, data de criação
        query = query
          .order('isFeatured', { ascending: false })
          .order('created_at', { ascending: false })
      }

      // Aplicar paginação
      if (options?.limit) {
        query = query.limit(options.limit)
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1)
        }
      }

      const { data, error, count } = await query

      if (error) throw error

      return { data, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar por ID
  async findById(id: string) {
    try {
      const useProxy = (import.meta as any)?.env?.VITE_USE_API_PROPERTIES === 'true'
        || (typeof window !== 'undefined' && window.location?.hostname?.includes('vercel.app'))

      if (useProxy) {
        const res = await fetch(`/api/properties/${id}`, { method: 'GET' })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`API /api/properties/${id} ${res.status}: ${txt}`)
        }
        const json = await res.json()
        return { data: json, error: null }
      }

      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      // Emitir evento de visualização
      if (data) {
        EventBus.emit(SystemEvents.PROPERTY_VIEWED, { propertyId: id })
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Criar nova propriedade
  async create(propriedade: ImoveisVivaRealInsert) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const propriedadeWithDefaults: ImoveisVivaRealInsert = {
        ...propriedade,
        id: propriedade.id || crypto.randomUUID(),
        propertyType: propriedade.propertyType || 'OTHER',
        status: propriedade.status || 'AVAILABLE',
        listingType: propriedade.listingType || 'SALE',
        corretor_responsavel: propriedade.corretor_responsavel || user.id,
        isActive: propriedade.isActive !== undefined ? propriedade.isActive : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(propriedadeWithDefaults)
        .select()
        .single()

      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.PROPERTY_CREATED, {
        propertyId: data.id,
        userId: user.id
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar propriedade
  async update(id: string, updates: ImoveisVivaRealUpdate) {
    try {
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      let query = supabase
        .from(this.tableName)
        .update(updatesWithTimestamp)
        .eq('id', id)
        .select()
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.PROPERTY_UPDATED, {
        propertyId: id
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Deletar propriedade
  async delete(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { error } = await query

      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.PROPERTY_DELETED, {
        propertyId: id
      })

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Buscar propriedades próximas (usando coordenadas)
  async findNearby(lat: number, lon: number, radiusKm: number = 5) {
    try {
      // Fórmula simples de distância (Haversine aproximada)
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!corretor_responsavel(id, name, email, avatarUrl)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('isActive', true)

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      // Filtrar por distância no frontend (para simplificar)
      const nearby = data?.filter(property => {
        if (!property.latitude || !property.longitude) return false
        
        const distance = this.calculateDistance(
          lat, lon,
          property.latitude, property.longitude
        )
        
        return distance <= radiusKm
      }) || []

      return { data: nearby, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: ImoveisVivaRealStats | null; error: Error | null }> {
    try {
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

      // Propriedades em destaque
      let featuredQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('isFeatured', true)
      featuredQuery = await this.applyRLS(featuredQuery)
      const { count: featured } = await featuredQuery

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

      // Por corretor (top 5)
      let agentQuery = supabase.from(this.tableName).select('corretor_responsavel')
      agentQuery = await this.applyRLS(agentQuery)
      const { data: agentData } = await agentQuery
      
      const agentCount: Record<string, number> = {}
      agentData?.forEach(p => {
        if (p.corretor_responsavel) {
          agentCount[p.corretor_responsavel] = (agentCount[p.corretor_responsavel] || 0) + 1
        }
      })

      const byAgent = Object.fromEntries(
        Object.entries(agentCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      )

      const stats: ImoveisVivaRealStats = {
        total: total || 0,
        available: statusMap.available || 0,
        sold: statusMap.sold || 0,
        reserved: statusMap.reserved || 0,
        avgPrice,
        byType,
        byCity,
        byAgent,
        featured: featured || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar do Viva Real (método mantido para compatibilidade)
  async importFromVivaReal(vivaRealData: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Mapear dados do Viva Real para nossa nova estrutura
      const propertyData: ImoveisVivaRealInsert = {
        id: crypto.randomUUID(),
        title: vivaRealData.title || 'Imóvel importado',
        description: vivaRealData.description,
        address: vivaRealData.address?.street || '',
        city: vivaRealData.address?.city || '',
        state: vivaRealData.address?.state || '',
        zipCode: vivaRealData.address?.zipCode,
        neighborhood: vivaRealData.address?.neighborhood,
        
        price: vivaRealData.pricingInfos?.price || 0,
        condominiumFee: vivaRealData.pricingInfos?.monthlyCondoFee,
        iptuPrice: vivaRealData.pricingInfos?.yearlyIptu,
        
        area: vivaRealData.usableAreas || vivaRealData.totalAreas,
        bedrooms: vivaRealData.bedrooms,
        bathrooms: vivaRealData.bathrooms,
        parkingSpaces: vivaRealData.parkingSpaces,
        
        propertyType: this.mapVivaRealType(vivaRealData.unitTypes?.[0]),
        status: 'AVAILABLE',
        listingType: vivaRealData.businessType === 'SALE' ? 'SALE' : 'RENT',
        
        latitude: vivaRealData.address?.point?.lat,
        longitude: vivaRealData.address?.point?.lon,
        
        vivaRealId: vivaRealData.id,
        vivaRealListingId: vivaRealData.listingId,
        vivaRealUrl: vivaRealData.link?.href,
        
        images: vivaRealData.images?.map((img: any) => img.url) || [],
        amenities: vivaRealData.amenities || [],
        features: vivaRealData.features || [],
        
        corretor_responsavel: user.id,
        isActive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Criar propriedade
      const result = await this.create(propertyData)

      return result
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar propriedades em lote
  async importPropriedades(propriedades: ImoveisVivaRealInsert[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Preparar propriedades com defaults
      const propriedadesWithDefaults = propriedades.map(prop => ({
        ...prop,
        id: prop.id || crypto.randomUUID(),
        propertyType: prop.propertyType || 'OTHER',
        status: prop.status || 'AVAILABLE',
        listingType: prop.listingType || 'SALE',
        corretor_responsavel: prop.corretor_responsavel || user.id,
        isActive: prop.isActive !== undefined ? prop.isActive : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(propriedadesWithDefaults)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Helpers privados
  private mapVivaRealType(type?: string): ImoveisVivaReal['propertyType'] {
    const typeMap: Record<string, ImoveisVivaReal['propertyType']> = {
      'APARTMENT': 'APARTMENT',
      'HOME': 'HOUSE',
      'CONDOMINIUM': 'APARTMENT',
      'COMMERCIAL': 'COMMERCIAL',
      'LAND': 'LAND',
      'FARM': 'LAND',
    }
    return typeMap[type || ''] || 'OTHER'
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }
}

// Exportar instância única
export const imoveisVivaRealService = new ImoveisVivaRealService()