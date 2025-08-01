import { supabase, getCurrentUserProfile, type Tables, type Enums } from '@/lib/supabase-client'
import { EventBus } from '@/lib/event-bus'
import type { PostgrestError } from '@supabase/supabase-js'

// Tipos base para todas as entidades
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// Opções de query
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  ascending?: boolean
  filters?: Record<string, any>
}

// Resultado padronizado
export interface ServiceResult<T> {
  data: T | null
  error: Error | null
  count?: number
}

// Classe base para todos os serviços
export abstract class BaseService<
  TTable extends keyof Tables,
  TRow = Tables[TTable]['Row'],
  TInsert = Tables[TTable]['Insert'],
  TUpdate = Tables[TTable]['Update']
> {
  protected tableName: TTable
  protected eventPrefix: string

  constructor(tableName: TTable, eventPrefix?: string) {
    this.tableName = tableName
    this.eventPrefix = eventPrefix || tableName.toLowerCase()
  }

  // Helpers para RLS
  protected async applyRLS(query: any) {
    const profile = await getCurrentUserProfile()
    if (!profile) throw new Error('User not authenticated')

    // DEV_MASTER/CREATOR vê tudo (sem filtros adicionais)
    if (profile.role === 'CREATOR') {
      return query
    }

    // ADMIN vê apenas dados da própria empresa
    if (profile.role === 'ADMIN') {
      // Verificar se a tabela tem companyId
      if (this.hasCompanyId()) {
        return query.eq('companyId', profile.companyId)
      }
      // Para tabelas que têm agentId, buscar todos os agentes da empresa
      if (this.hasAgentId()) {
        const { data: companyUsers } = await supabase
          .from('User')
          .select('id')
          .eq('companyId', profile.companyId)
        
        const agentIds = companyUsers?.map(u => u.id) || []
        return query.in('agentId', agentIds)
      }
    }

    // AGENT vê apenas próprios dados
    if (profile.role === 'AGENT') {
      if (this.hasAgentId()) {
        return query.eq('agentId', profile.id)
      }
      // Para tabelas sem agentId mas com userId
      if (this.hasUserId()) {
        return query.eq('userId', profile.id)
      }
    }

    // Fallback seguro - não retorna nada
    return query.eq('id', 'never-match')
  }

  // Verificar campos da tabela
  protected hasCompanyId(): boolean {
    // Lista de tabelas que têm companyId
    const tablesWithCompanyId = ['Company', 'Property', 'WhatsAppConfig', 'ReportTemplate', 'ScheduledReport']
    return tablesWithCompanyId.includes(this.tableName)
  }

  protected hasAgentId(): boolean {
    // Lista de tabelas que têm agentId
    const tablesWithAgentId = ['Property', 'Contact', 'Appointment', 'Deal', 'Chat', 'AgentSchedule', 'AvailabilitySlot']
    return tablesWithAgentId.includes(this.tableName)
  }

  protected hasUserId(): boolean {
    // Lista de tabelas que têm userId
    const tablesWithUserId = ['Activity', 'Message']
    return tablesWithUserId.includes(this.tableName)
  }

  // CRUD Operations
  async findAll(options?: QueryOptions): Promise<ServiceResult<TRow[]>> {
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar opções
      if (options?.limit) query = query.limit(options.limit)
      if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      }

      // Aplicar filtros customizados
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { data, error, count } = await query

      if (error) throw this.handleError(error)

      return { data, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async findById(id: string): Promise<ServiceResult<TRow>> {
    try {
      let query = supabase.from(this.tableName).select('*').eq('id', id).single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw this.handleError(error)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async create(input: TInsert): Promise<ServiceResult<TRow>> {
    try {
      const profile = await getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Adicionar campos automáticos
      const dataWithDefaults = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Adicionar agentId/companyId se necessário
      if (this.hasAgentId() && !('agentId' in dataWithDefaults)) {
        (dataWithDefaults as any).agentId = profile.id
      }
      if (this.hasCompanyId() && !('companyId' in dataWithDefaults)) {
        (dataWithDefaults as any).companyId = profile.companyId
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(dataWithDefaults as any)
        .select()
        .single()

      if (error) throw this.handleError(error)

      // Emitir evento
      EventBus.emit(`${this.eventPrefix}.created`, { 
        id: data.id, 
        data,
        userId: profile.id,
        companyId: profile.companyId
      })

      // Registrar atividade
      await this.logActivity('CREATED', data.id)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async update(id: string, input: TUpdate): Promise<ServiceResult<TRow>> {
    try {
      const profile = await getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Verificar se tem permissão para atualizar
      const { data: existing } = await this.findById(id)
      if (!existing) throw new Error('Record not found')

      const dataWithTimestamp = {
        ...input,
        updatedAt: new Date().toISOString(),
      }

      let query = supabase
        .from(this.tableName)
        .update(dataWithTimestamp as any)
        .eq('id', id)
        .select()
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw this.handleError(error)

      // Emitir evento
      EventBus.emit(`${this.eventPrefix}.updated`, { 
        id, 
        data,
        changes: input,
        userId: profile.id,
        companyId: profile.companyId
      })

      // Registrar atividade
      await this.logActivity('UPDATED', id)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const profile = await getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Verificar se tem permissão para deletar
      const { data: existing } = await this.findById(id)
      if (!existing) throw new Error('Record not found')

      let query = supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { error } = await query

      if (error) throw this.handleError(error)

      // Emitir evento
      EventBus.emit(`${this.eventPrefix}.deleted`, { 
        id,
        userId: profile.id,
        companyId: profile.companyId
      })

      // Registrar atividade
      await this.logActivity('DELETED', id)

      return { data: true, error: null }
    } catch (error) {
      return { data: false, error: error as Error }
    }
  }

  // Método para batch operations
  async createMany(items: TInsert[]): Promise<ServiceResult<TRow[]>> {
    try {
      const profile = await getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      const itemsWithDefaults = items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(this.hasAgentId() && { agentId: profile.id }),
        ...(this.hasCompanyId() && { companyId: profile.companyId }),
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(itemsWithDefaults as any)
        .select()

      if (error) throw this.handleError(error)

      // Emitir eventos para cada item
      data?.forEach(item => {
        EventBus.emit(`${this.eventPrefix}.created`, { 
          id: item.id, 
          data: item,
          userId: profile.id,
          companyId: profile.companyId
        })
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Registrar atividade
  protected async logActivity(
    action: 'CREATED' | 'UPDATED' | 'DELETED',
    entityId: string
  ) {
    try {
      const profile = await getCurrentUserProfile()
      if (!profile) return

      const activityType = `${this.tableName.toUpperCase()}_${action}` as Enums['ActivityType']

      await supabase.from('Activity').insert({
        id: crypto.randomUUID(),
        type: activityType,
        description: `${action} ${this.tableName} ${entityId}`,
        entityId,
        entityType: this.tableName,
        userId: profile.id,
        createdAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  // Tratamento de erros
  protected handleError(error: PostgrestError): Error {
    console.error(`Error in ${this.tableName} service:`, error)

    // Tratar erros específicos do Postgres
    if (error.code === '23505') {
      return new Error('Registro duplicado')
    }
    if (error.code === '23503') {
      return new Error('Referência inválida')
    }
    if (error.code === '42501') {
      return new Error('Sem permissão para esta operação')
    }

    return new Error(error.message || 'Erro ao processar operação')
  }

  // Método para queries customizadas
  protected async customQuery<T = any>(
    queryBuilder: (query: any) => any
  ): Promise<ServiceResult<T>> {
    try {
      let query = supabase.from(this.tableName)
      query = await this.applyRLS(query)
      query = queryBuilder(query)

      const { data, error } = await query

      if (error) throw this.handleError(error)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}