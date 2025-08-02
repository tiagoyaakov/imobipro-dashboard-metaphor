/**
 * Sistema de Cache Unificado
 * Gerencia cache centralizado para todos os módulos usando React Query
 */

import { QueryClient } from '@tanstack/react-query'
import { EventBus } from './event-bus'

// Configurações de cache por módulo
export const CACHE_CONFIG = {
  // Tempos de cache (ms)
  staleTime: {
    default: 1000 * 60 * 5, // 5 minutos
    properties: 1000 * 60 * 10, // 10 minutos (mudam menos)
    contacts: 1000 * 60 * 5, // 5 minutos
    appointments: 1000 * 60 * 2, // 2 minutos (mais dinâmico)
    deals: 1000 * 60 * 5, // 5 minutos
    activities: 1000 * 60 * 15, // 15 minutos (log histórico)
    dashboard: 1000 * 60 * 1, // 1 minuto (tempo real)
    reports: 1000 * 60 * 30, // 30 minutos (processamento pesado)
  },
  
  // Tempos de revalidação (ms)
  cacheTime: {
    default: 1000 * 60 * 30, // 30 minutos
    properties: 1000 * 60 * 60, // 1 hora
    contacts: 1000 * 60 * 30, // 30 minutos
    appointments: 1000 * 60 * 15, // 15 minutos
    deals: 1000 * 60 * 30, // 30 minutos
    activities: 1000 * 60 * 60 * 2, // 2 horas
    dashboard: 1000 * 60 * 5, // 5 minutos
    reports: 1000 * 60 * 60 * 4, // 4 horas
  },
  
  // Configurações de retry
  retry: {
    default: 3,
    critical: 5, // Para operações críticas
    background: 1, // Para atualizações em background
  },
  
  // Configurações de refetch
  refetch: {
    onWindowFocus: true,
    onReconnect: true,
    interval: {
      dashboard: 1000 * 30, // 30 segundos
      appointments: 1000 * 60, // 1 minuto
      default: false, // Sem refetch automático
    },
  },
}

// Query keys padronizadas
export const QUERY_KEYS = {
  // Properties
  properties: {
    all: ['properties'] as const,
    lists: () => [...QUERY_KEYS.properties.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.properties.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.properties.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.properties.details(), id] as const,
  },
  
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...QUERY_KEYS.contacts.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.contacts.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.contacts.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.contacts.details(), id] as const,
  },
  
  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...QUERY_KEYS.appointments.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.appointments.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.appointments.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.appointments.details(), id] as const,
    byDate: (date: string) => [...QUERY_KEYS.appointments.all, 'byDate', date] as const,
  },
  
  // Deals
  deals: {
    all: ['deals'] as const,
    lists: () => [...QUERY_KEYS.deals.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.deals.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.deals.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.deals.details(), id] as const,
    byStage: (stage: string) => [...QUERY_KEYS.deals.all, 'byStage', stage] as const,
  },
  
  // Activities
  activities: {
    all: ['activities'] as const,
    lists: () => [...QUERY_KEYS.activities.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.activities.lists(), { filters }] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    metrics: () => [...QUERY_KEYS.dashboard.all, 'metrics'] as const,
    charts: () => [...QUERY_KEYS.dashboard.all, 'charts'] as const,
    recent: () => [...QUERY_KEYS.dashboard.all, 'recent'] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    profile: () => [...QUERY_KEYS.users.all, 'profile'] as const,
    team: () => [...QUERY_KEYS.users.all, 'team'] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    templates: () => [...QUERY_KEYS.reports.all, 'templates'] as const,
    scheduled: () => [...QUERY_KEYS.reports.all, 'scheduled'] as const,
    history: () => [...QUERY_KEYS.reports.all, 'history'] as const,
  },
}

// Classe do gerenciador de cache
export class CacheManager {
  private queryClient: QueryClient
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
    this.setupEventListeners()
  }
  
  // Configurar listeners de eventos
  private setupEventListeners() {
    // Properties
    EventBus.on('property.created', () => this.invalidateProperties())
    EventBus.on('property.updated', ({ id }) => this.invalidateProperty(id))
    EventBus.on('property.deleted', ({ id }) => this.invalidateProperty(id))
    
    // Contacts
    EventBus.on('contact.created', () => this.invalidateContacts())
    EventBus.on('contact.updated', ({ id }) => this.invalidateContact(id))
    EventBus.on('contact.deleted', ({ id }) => this.invalidateContact(id))
    
    // Appointments
    EventBus.on('appointment.created', () => this.invalidateAppointments())
    EventBus.on('appointment.updated', ({ id }) => this.invalidateAppointment(id))
    EventBus.on('appointment.deleted', ({ id }) => this.invalidateAppointment(id))
    
    // Deals
    EventBus.on('deal.created', () => this.invalidateDeals())
    EventBus.on('deal.updated', ({ id }) => this.invalidateDeal(id))
    EventBus.on('deal.deleted', ({ id }) => this.invalidateDeal(id))
    
    // Global sync events
    EventBus.on('global.sync.requested', () => this.syncAllModules())
    EventBus.on('global.refresh.requested', () => this.refreshAllQueries())
  }
  
  // Invalidação por módulo
  async invalidateProperties() {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.properties.all })
    await this.invalidateDashboard() // Dashboard depende de properties
  }
  
  async invalidateProperty(id: string) {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.properties.detail(id) })
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.properties.lists() })
  }
  
  async invalidateContacts() {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts.all })
    await this.invalidateDashboard()
  }
  
  async invalidateContact(id: string) {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts.detail(id) })
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts.lists() })
  }
  
  async invalidateAppointments() {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all })
    await this.invalidateDashboard()
  }
  
  async invalidateAppointment(id: string) {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.detail(id) })
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.lists() })
  }
  
  async invalidateDeals() {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deals.all })
    await this.invalidateDashboard()
  }
  
  async invalidateDeal(id: string) {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deals.detail(id) })
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deals.lists() })
  }
  
  async invalidateDashboard() {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
  }
  
  // Sincronização global
  async syncAllModules() {
    const modules = [
      QUERY_KEYS.properties.all,
      QUERY_KEYS.contacts.all,
      QUERY_KEYS.appointments.all,
      QUERY_KEYS.deals.all,
      QUERY_KEYS.activities.all,
      QUERY_KEYS.dashboard.all,
    ]
    
    await Promise.all(
      modules.map(queryKey => 
        this.queryClient.invalidateQueries({ queryKey })
      )
    )
  }
  
  // Refresh forçado
  async refreshAllQueries() {
    await this.queryClient.refetchQueries()
  }
  
  // Prefetch de dados
  async prefetchProperty(id: string, fetcher: () => Promise<any>) {
    await this.queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.properties.detail(id),
      queryFn: fetcher,
      staleTime: CACHE_CONFIG.staleTime.properties,
    })
  }
  
  async prefetchContact(id: string, fetcher: () => Promise<any>) {
    await this.queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.contacts.detail(id),
      queryFn: fetcher,
      staleTime: CACHE_CONFIG.staleTime.contacts,
    })
  }
  
  // Otimistic updates
  setOptimisticProperty(id: string, data: any) {
    this.queryClient.setQueryData(QUERY_KEYS.properties.detail(id), data)
  }
  
  setOptimisticContact(id: string, data: any) {
    this.queryClient.setQueryData(QUERY_KEYS.contacts.detail(id), data)
  }
  
  // Cache manual
  setPropertyCache(id: string, data: any) {
    this.queryClient.setQueryData(
      QUERY_KEYS.properties.detail(id),
      data,
      { updatedAt: Date.now() }
    )
  }
  
  setContactCache(id: string, data: any) {
    this.queryClient.setQueryData(
      QUERY_KEYS.contacts.detail(id),
      data,
      { updatedAt: Date.now() }
    )
  }
  
  // Limpar cache
  clearModuleCache(module: keyof typeof QUERY_KEYS) {
    this.queryClient.removeQueries({ queryKey: QUERY_KEYS[module].all })
  }
  
  clearAllCache() {
    this.queryClient.clear()
  }
  
  // Utilitários
  getCacheStats() {
    const cache = this.queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cacheSize: JSON.stringify(queries).length, // Aproximado em bytes
    }
  }
  
  // Debug helpers
  logCacheState() {
    console.group('🗄️ Cache State')
    console.log('Stats:', this.getCacheStats())
    console.log('All Queries:', this.queryClient.getQueryCache().getAll())
    console.groupEnd()
  }
}

// Instância singleton
let cacheManagerInstance: CacheManager | null = null

export function getCacheManager(queryClient: QueryClient): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(queryClient)
  }
  return cacheManagerInstance
}

// Hook para usar o cache manager
import { useQueryClient } from '@tanstack/react-query'

export function useCacheManager() {
  const queryClient = useQueryClient()
  return getCacheManager(queryClient)
}

// Configurações padrão para queries
export function getQueryConfig(module: keyof typeof CACHE_CONFIG.staleTime) {
  return {
    staleTime: CACHE_CONFIG.staleTime[module] || CACHE_CONFIG.staleTime.default,
    cacheTime: CACHE_CONFIG.cacheTime[module] || CACHE_CONFIG.cacheTime.default,
    retry: CACHE_CONFIG.retry.default,
    refetchOnWindowFocus: CACHE_CONFIG.refetch.onWindowFocus,
    refetchOnReconnect: CACHE_CONFIG.refetch.onReconnect,
    refetchInterval: CACHE_CONFIG.refetch.interval[module] || CACHE_CONFIG.refetch.interval.default,
  }
}