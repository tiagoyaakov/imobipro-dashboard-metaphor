import { BaseService } from './base.service'
import { supabase, type Tables } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// Tipos específicos para Appointment
export type Appointment = Tables['Appointment']['Row']
export type AppointmentInsert = Tables['Appointment']['Insert']
export type AppointmentUpdate = Tables['Appointment']['Update']

// Filtros específicos para agendamentos
export interface AppointmentFilters {
  status?: Appointment['status']
  type?: Appointment['type']
  priority?: Appointment['priority']
  source?: Appointment['source']
  agentId?: string
  contactId?: string
  propertyId?: string
  dateFrom?: string
  dateTo?: string
  syncStatus?: Appointment['syncStatus']
  search?: string
}

// Estatísticas de agendamentos
export interface AppointmentStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  byPriority: Record<string, number>
  avgDuration: number
  completionRate: number
  cancelationRate: number
  reschedulingRate: number
}

// Slot de disponibilidade
export interface AvailabilitySlot {
  date: string
  startTime: string
  endTime: string
  duration: number
  agentId: string
  status: Tables['AvailabilitySlot']['Row']['status']
  slotType: Tables['AvailabilitySlot']['Row']['slotType']
}

// Conflito de agendamento
export interface AppointmentConflict {
  type: Tables['AppointmentConflictLog']['Row']['conflictType']
  conflictingAppointments: Appointment[]
  suggestedSlots?: AvailabilitySlot[]
}

class AppointmentServiceClass extends BaseService<'Appointment'> {
  constructor() {
    super('Appointment', 'appointment')
  }

  // Override findAll para incluir relacionamentos
  async findAll(options?: any) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          agent:User!agentId(id, name, email, avatarUrl),
          contact:Contact!contactId(id, name, phone, email, leadStage),
          property:Property(id, title, address, city),
          availabilitySlot:AvailabilitySlot(id, date, startTime, endTime)
        `, { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters as AppointmentFilters
        
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.type) query = query.eq('type', filters.type)
        if (filters.priority) query = query.eq('priority', filters.priority)
        if (filters.source) query = query.eq('source', filters.source)
        if (filters.agentId) query = query.eq('agentId', filters.agentId)
        if (filters.contactId) query = query.eq('contactId', filters.contactId)
        if (filters.propertyId) query = query.eq('propertyId', filters.propertyId)
        if (filters.syncStatus) query = query.eq('syncStatus', filters.syncStatus)
        
        // Filtros de data
        if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
        if (filters.dateTo) query = query.lte('date', filters.dateTo)
        
        // Busca textual
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: data e prioridade
        query = query
          .order('date', { ascending: true })
          .order('priority', { ascending: false })
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

  // Buscar agendamentos do dia
  async getTodayAppointments(agentId?: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.findAll({
      filters: {
        dateFrom: today.toISOString(),
        dateTo: tomorrow.toISOString(),
        ...(agentId && { agentId })
      },
      orderBy: 'date',
      ascending: true
    })
  }

  // Buscar slots disponíveis
  async getAvailableSlots(
    agentId: string,
    date: string,
    duration: number = 60
  ): Promise<{ data: AvailabilitySlot[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('AvailabilitySlot')
        .select('*')
        .eq('agentId', agentId)
        .eq('date', date)
        .eq('status', 'AVAILABLE')
        .gte('duration', duration)
        .order('startTime', { ascending: true })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Verificar conflitos
  async checkConflicts(
    agentId: string,
    date: string,
    startTime: string,
    duration: number
  ): Promise<{ data: AppointmentConflict | null; error: Error | null }> {
    try {
      // Converter para timestamps para comparação
      const appointmentStart = new Date(`${date}T${startTime}`)
      const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000)

      // Buscar agendamentos do agente no mesmo dia
      const { data: appointments, error } = await supabase
        .from('Appointment')
        .select('*')
        .eq('agentId', agentId)
        .eq('date', date)
        .in('status', ['CONFIRMED', 'PENDING'])

      if (error) throw error

      // Verificar conflitos
      const conflicts = appointments?.filter(apt => {
        const aptStart = new Date(`${apt.date}T${apt.startTime || '00:00'}`)
        const aptEnd = new Date(aptStart.getTime() + (apt.estimatedDuration || 60) * 60000)

        return (
          (appointmentStart >= aptStart && appointmentStart < aptEnd) ||
          (appointmentEnd > aptStart && appointmentEnd <= aptEnd) ||
          (appointmentStart <= aptStart && appointmentEnd >= aptEnd)
        )
      }) || []

      if (conflicts.length === 0) {
        return { data: null, error: null }
      }

      // Buscar slots alternativos
      const { data: alternativeSlots } = await this.getAvailableSlots(agentId, date, duration)

      const conflict: AppointmentConflict = {
        type: 'TIME_OVERLAP',
        conflictingAppointments: conflicts,
        suggestedSlots: alternativeSlots?.slice(0, 3) || []
      }

      return { data: conflict, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Criar agendamento com validação
  async createWithValidation(input: AppointmentInsert) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Verificar conflitos
      const { data: conflict } = await this.checkConflicts(
        input.agentId,
        input.date,
        input.startTime || '00:00',
        input.estimatedDuration || 60
      )

      if (conflict) {
        throw new Error(`Conflito de horário detectado: ${conflict.conflictingAppointments.length} agendamentos conflitantes`)
      }

      // Criar agendamento
      const result = await this.create(input)

      if (result.data) {
        // Marcar slot como ocupado
        if (input.availabilitySlotId) {
          await supabase
            .from('AvailabilitySlot')
            .update({ 
              status: 'BOOKED',
              appointmentId: result.data.id 
            })
            .eq('id', input.availabilitySlotId)
        }

        // Emitir evento
        EventBus.emit(SystemEvents.APPOINTMENT_CREATED, {
          appointmentId: result.data.id,
          agentId: input.agentId,
          contactId: input.contactId,
          date: input.date
        })

        // Registrar atividade no contato
        await this.logContactActivity(input.contactId, {
          type: 'MEETING',
          title: 'Agendamento criado',
          appointmentId: result.data.id
        })

        // Enviar notificação (se configurado)
        if (input.confirmationSent === false) {
          await this.sendConfirmation(result.data.id)
        }
      }

      return result
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar status do agendamento
  async updateStatus(id: string, status: Appointment['status'], notes?: string) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Buscar agendamento atual
      const { data: appointment } = await this.findById(id)
      if (!appointment) throw new Error('Appointment not found')

      const oldStatus = appointment.status

      // Atualizar status
      const { data, error } = await this.update(id, {
        status,
        ...(status === 'COMPLETED' && { 
          actualDuration: appointment.estimatedDuration,
          completedAt: new Date().toISOString()
        })
      })

      if (error) throw error

      // Liberar slot se cancelado
      if (status === 'CANCELED' && appointment.availabilitySlotId) {
        await supabase
          .from('AvailabilitySlot')
          .update({ 
            status: 'AVAILABLE',
            appointmentId: null 
          })
          .eq('id', appointment.availabilitySlotId)
      }

      // Emitir evento
      const eventMap = {
        CANCELED: SystemEvents.APPOINTMENT_CANCELED,
        COMPLETED: SystemEvents.APPOINTMENT_COMPLETED,
        CONFIRMED: SystemEvents.APPOINTMENT_UPDATED,
        PENDING: SystemEvents.APPOINTMENT_UPDATED
      }

      EventBus.emit(eventMap[status], {
        appointmentId: id,
        oldStatus,
        newStatus: status,
        userId: profile.id
      })

      // Registrar atividade no contato
      await this.logContactActivity(appointment.contactId, {
        type: status === 'COMPLETED' ? 'MEETING' : 'NOTE',
        title: `Agendamento ${this.getStatusLabel(status)}`,
        description: notes,
        appointmentId: id
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Remarcar agendamento
  async reschedule(
    id: string,
    newDate: string,
    newStartTime?: string,
    reason?: string
  ) {
    try {
      const { data: appointment } = await this.findById(id)
      if (!appointment) throw new Error('Appointment not found')

      // Verificar conflitos no novo horário
      const { data: conflict } = await this.checkConflicts(
        appointment.agentId,
        newDate,
        newStartTime || appointment.startTime || '00:00',
        appointment.estimatedDuration
      )

      if (conflict) {
        throw new Error('Novo horário tem conflito')
      }

      // Atualizar agendamento
      const { data, error } = await this.update(id, {
        date: newDate,
        ...(newStartTime && { startTime: newStartTime }),
        reschedulingCount: appointment.reschedulingCount + 1,
        lastRescheduledAt: new Date().toISOString()
      })

      if (error) throw error

      // Registrar atividade
      await this.logContactActivity(appointment.contactId, {
        type: 'NOTE',
        title: 'Agendamento remarcado',
        description: reason,
        appointmentId: id,
        metadata: {
          oldDate: appointment.date,
          newDate,
          reason
        }
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Sincronizar com Google Calendar
  async syncWithGoogleCalendar(appointmentId: string) {
    try {
      const { data: appointment } = await this.findById(appointmentId)
      if (!appointment) throw new Error('Appointment not found')

      // Marcar como sincronizando
      await this.update(appointmentId, {
        syncStatus: 'SYNCING',
        lastSyncAt: new Date().toISOString()
      })

      // TODO: Implementar integração real com Google Calendar
      // Por enquanto, simular sucesso
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Atualizar status de sincronização
      const { data, error } = await this.update(appointmentId, {
        syncStatus: 'SYNCED',
        googleCalendarEventId: `gcal_${appointmentId}`,
        syncAttempts: appointment.syncAttempts + 1
      })

      if (error) throw error

      // Registrar log de sincronização
      await supabase.from('CalendarSyncLog').insert({
        id: crypto.randomUUID(),
        appointmentId,
        operation: 'CREATE',
        direction: 'TO_GOOGLE',
        status: 'SUCCESS',
        googleEventId: `gcal_${appointmentId}`,
        createdAt: new Date().toISOString()
      })

      return { data, error: null }
    } catch (error) {
      // Registrar falha
      await this.update(appointmentId, {
        syncStatus: 'FAILED',
        syncError: error.message,
        syncAttempts: (await this.findById(appointmentId)).data?.syncAttempts + 1
      })

      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ data: AppointmentStats | null; error: Error | null }> {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) throw new Error('User not authenticated')

      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de agendamentos
      const { count: total } = await baseQuery

      // Hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      let todayQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('date', today.toISOString())
        .lt('date', tomorrow.toISOString())
      todayQuery = await this.applyRLS(todayQuery)
      const { count: todayCount } = await todayQuery

      // Esta semana
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      let weekQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('date', weekStart.toISOString())
        .lt('date', weekEnd.toISOString())
      weekQuery = await this.applyRLS(weekQuery)
      const { count: weekCount } = await weekQuery

      // Este mês
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      let monthQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString())
      monthQuery = await this.applyRLS(monthQuery)
      const { count: monthCount } = await monthQuery

      // Por status
      const statuses = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELED']
      const statusQueries = statuses.map(async (status) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', status)
        q = await this.applyRLS(q)
        const { count } = await q
        return { status, count: count || 0 }
      })

      const statusCounts = await Promise.all(statusQueries)
      const byStatus = Object.fromEntries(statusCounts.map(s => [s.status, s.count]))

      // Por tipo
      const types = ['VISIT', 'MEETING', 'CALL', 'OTHER']
      const typeQueries = types.map(async (type) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('type', type)
        q = await this.applyRLS(q)
        const { count } = await q
        return { type, count: count || 0 }
      })

      const typeCounts = await Promise.all(typeQueries)
      const byType = Object.fromEntries(typeCounts.map(t => [t.type, t.count]))

      // Por prioridade
      const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
      const priorityQueries = priorities.map(async (priority) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('priority', priority)
        q = await this.applyRLS(q)
        const { count } = await q
        return { priority, count: count || 0 }
      })

      const priorityCounts = await Promise.all(priorityQueries)
      const byPriority = Object.fromEntries(priorityCounts.map(p => [p.priority, p.count]))

      // Duração média (apenas concluídos)
      let durationQuery = supabase.from(this.tableName)
        .select('actualDuration, estimatedDuration')
        .eq('status', 'COMPLETED')
      durationQuery = await this.applyRLS(durationQuery)
      const { data: durationData } = await durationQuery

      const avgDuration = durationData?.length
        ? durationData.reduce((sum, apt) => sum + (apt.actualDuration || apt.estimatedDuration || 60), 0) / durationData.length
        : 60

      // Taxas
      const completionRate = total ? (byStatus.COMPLETED / total) * 100 : 0
      const cancelationRate = total ? (byStatus.CANCELED / total) * 100 : 0

      // Taxa de remarcação
      let rescheduledQuery = supabase.from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gt('reschedulingCount', 0)
      rescheduledQuery = await this.applyRLS(rescheduledQuery)
      const { count: rescheduledCount } = await rescheduledQuery
      const reschedulingRate = total ? ((rescheduledCount || 0) / total) * 100 : 0

      const stats: AppointmentStats = {
        total: total || 0,
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        thisMonth: monthCount || 0,
        byStatus,
        byType,
        byPriority,
        avgDuration,
        completionRate,
        cancelationRate,
        reschedulingRate
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Helpers privados
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

  private getStatusLabel(status: Appointment['status']): string {
    const labels = {
      CONFIRMED: 'confirmado',
      PENDING: 'pendente',
      COMPLETED: 'concluído',
      CANCELED: 'cancelado'
    }
    return labels[status] || status.toLowerCase()
  }

  private async logContactActivity(contactId: string, activity: any) {
    try {
      const profile = await this.getCurrentUserProfile()
      if (!profile) return

      await supabase.from('LeadActivity').insert({
        id: crypto.randomUUID(),
        contactId,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        metadata: activity.metadata,
        appointmentId: activity.appointmentId,
        performedById: profile.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging contact activity:', error)
    }
  }

  private async sendConfirmation(appointmentId: string) {
    try {
      // TODO: Implementar envio real de confirmação
      await this.update(appointmentId, {
        confirmationSent: true,
        confirmationSentAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error sending confirmation:', error)
    }
  }
}

// Exportar instância única
export const appointmentService = new AppointmentServiceClass()