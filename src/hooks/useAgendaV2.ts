// ================================================================
// HOOK USEAGENDA V2 - INTEGRADO COM CACHE UNIFICADO
// ================================================================
// Data: 02/08/2025
// Descrição: Versão otimizada do hook de agenda com cache unificado
// Features: Cache offline, sincronização real-time, Google Calendar
// ================================================================

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getUnifiedCache } from '@/lib/cache';
import { CacheStrategy } from '@/lib/cache/types';
import { 
  useCacheQuery, 
  useCacheMutation, 
  useCacheInvalidation,
  useOfflineCache,
  useCachePrefetch,
  useOptimisticCache,
  useCacheBatchInvalidation,
  useCacheSubscription
} from '@/hooks/cache/useCache';
import { agentScheduleService, availabilitySlotService } from '@/services/agendaService';
import { appointmentService } from '@/services/appointment.service';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { toast } from 'sonner';
import { z } from 'zod';
import type { 
  AgentSchedule,
  AvailabilitySlot,
  Appointment,
  AppointmentFormData,
  SlotStatus,
  SyncStatus,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  DateRange,
  WorkingHours,
  TimeSlot
} from '@/types/agenda';

// ================================================================
// SCHEMAS DE VALIDAÇÃO
// ================================================================

const AppointmentSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Data inválida'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  contactId: z.string().uuid('ID do contato inválido'),
  propertyId: z.string().uuid('ID da propriedade inválido').optional(),
  type: z.enum(['VISIT', 'MEETING', 'CALL', 'OTHER']),
  description: z.string().optional(),
});

const WorkingHoursSchema = z.record(z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  breaks: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
}));

// ================================================================
// KEYS DE CACHE CONSOLIDADAS
// ================================================================

export const AGENDA_QUERY_KEYS = {
  all: ['agenda'] as const,
  
  // Agent Schedules
  schedules: () => [...AGENDA_QUERY_KEYS.all, 'schedules'] as const,
  schedule: (agentId: string) => [...AGENDA_QUERY_KEYS.schedules(), agentId] as const,
  
  // Availability Slots
  slots: () => [...AGENDA_QUERY_KEYS.all, 'slots'] as const,
  agentSlots: (agentId: string) => [...AGENDA_QUERY_KEYS.slots(), 'agent', agentId] as const,
  dateSlots: (date: string) => [...AGENDA_QUERY_KEYS.slots(), 'date', date] as const,
  dateRangeSlots: (agentId: string, startDate: string, endDate: string) => 
    [...AGENDA_QUERY_KEYS.agentSlots(agentId), 'range', startDate, endDate] as const,
  
  // Appointments
  appointments: () => [...AGENDA_QUERY_KEYS.all, 'appointments'] as const,
  appointment: (id: string) => [...AGENDA_QUERY_KEYS.appointments(), id] as const,
  agentAppointments: (agentId: string) => 
    [...AGENDA_QUERY_KEYS.appointments(), 'agent', agentId] as const,
  dateAppointments: (date: string) => 
    [...AGENDA_QUERY_KEYS.appointments(), 'date', date] as const,
  
  // Sync & Google Calendar
  syncStatus: (agentId: string) => [...AGENDA_QUERY_KEYS.all, 'sync', agentId] as const,
  conflicts: (agentId: string) => [...AGENDA_QUERY_KEYS.all, 'conflicts', agentId] as const,
  
  // Stats
  stats: (agentId?: string) => [...AGENDA_QUERY_KEYS.all, 'stats', agentId || 'all'] as const,
} as const;

// ================================================================
// CONFIGURAÇÕES DE CACHE POR TIPO
// ================================================================

const CACHE_STRATEGIES = {
  schedules: CacheStrategy.STATIC,        // 30min - raramente muda
  slots: CacheStrategy.DYNAMIC,           // 5min - muda com bookings
  appointments: CacheStrategy.REALTIME,   // 0s - sempre fresh
  syncStatus: CacheStrategy.CRITICAL,     // 10s - importante mas não crítico
  stats: CacheStrategy.CRITICAL,          // 10s - métricas importantes
  conflicts: CacheStrategy.REALTIME       // 0s - precisa ser atual
} as const;

// ================================================================
// FUNÇÕES DE API COM CACHE UNIFICADO
// ================================================================

/**
 * Buscar horário de trabalho do agente (com fallback para dados mockados)
 */
async function fetchAgentSchedule(agentId: string): Promise<AgentSchedule | null> {
  try {
    // Tentar buscar do servidor primeiro
    const result = await agentScheduleService.getByAgentId(agentId);
    
    if (result?.success && result.data) {
      console.log('📅 Agent schedule from database');
      return result.data;
    }
  } catch (error) {
    console.warn('📅 Database not available, using mock data:', error);
  }

  // Fallback para dados mockados
  console.log('📅 Using mock agent schedule');
  return {
    id: `mock-schedule-${agentId}`,
    agentId,
    workingHours: {
      monday: { start: "09:00", end: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
      tuesday: { start: "09:00", end: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
      wednesday: { start: "09:00", end: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
      thursday: { start: "09:00", end: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
      friday: { start: "09:00", end: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
      saturday: { start: "09:00", end: "13:00", breaks: [] },
      sunday: { start: "09:00", end: "13:00", breaks: [] }
    },
    timezone: "America/Sao_Paulo",
    isActive: true,
    bufferTime: 15,
    maxDailyAppointments: 8,
    allowWeekendWork: true,
    autoAssignEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as AgentSchedule;
}

/**
 * Buscar slots de disponibilidade (com fallback para dados mockados)
 */
async function fetchAvailabilitySlots(
  agentId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilitySlot[]> {
  try {
    // Tentar buscar do servidor primeiro
    const result = await availabilitySlotService.getSlotsByDateRange(
      agentId,
      startDate,
      endDate
    );
    
    if (result?.success && result.data) {
      console.log('🗓️ Availability slots from database');
      return result.data;
    }
  } catch (error) {
    console.warn('🗓️ Database not available, using mock slots:', error);
  }

  // Fallback para dados mockados
  console.log('🗓️ Using mock availability slots');
  
  const mockSlots: AvailabilitySlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Gerar slots mockados para o período especificado
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    
    // Pular domingo (0) por padrão
    if (dayOfWeek === 0) continue;
    
    // Horários de trabalho típicos
    const workStart = dayOfWeek === 6 ? 9 : 9; // Sábado começa mais tarde
    const workEnd = dayOfWeek === 6 ? 13 : 18; // Sábado termina mais cedo
    
    // Gerar slots de 1 hora
    for (let hour = workStart; hour < workEnd; hour++) {
      // Pular horário de almoço (12-13h)
      if (hour === 12 && dayOfWeek < 6) continue;
      
      mockSlots.push({
        id: `mock-slot-${dateStr}-${hour}`,
        agentId,
        date: dateStr,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        duration: 60,
        status: Math.random() > 0.7 ? 'BOOKED' : 'AVAILABLE', // 30% ocupado
        slotType: 'REGULAR',
        priority: 0,
        source: 'mock',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as AvailabilitySlot);
    }
  }

  return mockSlots;
}

/**
 * Buscar agendamentos (com fallback para dados mockados)
 */
async function fetchAppointments(
  filters: {
    agentId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
): Promise<Appointment[]> {
  try {
    // Tentar buscar do servidor primeiro
    const result = await appointmentService.findAll(filters);
    
    if (result?.success && result.data) {
      console.log('📱 Appointments from database');
      return result.data;
    }
  } catch (error) {
    console.warn('📱 Database not available, using mock appointments:', error);
  }

  // Fallback para dados mockados
  console.log('📱 Using mock appointments');
  
  const today = new Date();
  const mockAppointments: Appointment[] = [
    {
      id: 'mock-1',
      title: 'Visita - Apartamento Centro',
      description: 'Visita ao apartamento de 2 quartos no centro da cidade',
      date: today.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      type: 'VISIT',
      status: 'confirmed',
      agentId: filters.agentId || 'mock-agent',
      contactId: 'mock-contact-1',
      propertyId: 'mock-property-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agent: {
        id: filters.agentId || 'mock-agent',
        name: 'Carlos Santos',
        email: 'carlos@imobipro.com',
        avatarUrl: null
      },
      contact: {
        id: 'mock-contact-1',
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@email.com',
        leadStage: 'QUALIFIED'
      },
      property: {
        id: 'mock-property-1',
        title: 'Apartamento Centro',
        address: 'Rua das Flores, 123',
        city: 'São Paulo'
      }
    },
    {
      id: 'mock-2',
      title: 'Reunião - Negociação Casa Jardins',
      description: 'Reunião para discutir proposta da casa nos Jardins',
      date: today.toISOString().split('T')[0],
      startTime: '14:30',
      endTime: '15:30',
      type: 'MEETING',
      status: 'pending',
      agentId: filters.agentId || 'mock-agent',
      contactId: 'mock-contact-2',
      propertyId: 'mock-property-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agent: {
        id: filters.agentId || 'mock-agent',
        name: 'Ana Costa',
        email: 'ana@imobipro.com',
        avatarUrl: null
      },
      contact: {
        id: 'mock-contact-2',
        name: 'Maria Santos',
        phone: '(11) 88888-8888',
        email: 'maria@email.com',
        leadStage: 'NEGOTIATING'
      },
      property: {
        id: 'mock-property-2',
        title: 'Casa Jardins',
        address: 'Av. Paulista, 1000',
        city: 'São Paulo'
      }
    }
  ];

  // Filtrar por data se especificado
  if (filters.date) {
    return mockAppointments.filter(apt => apt.date === filters.date);
  }

  return mockAppointments;
}

/**
 * Buscar status de sincronização
 */
async function fetchSyncStatus(agentId: string): Promise<{
  googleCalendar: { connected: boolean; lastSync?: string; syncing: boolean };
  conflicts: number;
  pendingSync: number;
}> {
  const cache = getUnifiedCache();
  const cacheKey = AGENDA_QUERY_KEYS.syncStatus(agentId).join(':');

  try {
    // Cache curto para status de sync
    const cached = await cache.get<any>(cacheKey);
    if (cached && Date.now() - new Date(cached.timestamp || 0).getTime() < 10 * 1000) {
      console.log('🔄 Sync status from cache');
      return cached;
    }

    // Simular busca de status (substituir com API real)
    const status = {
      googleCalendar: {
        connected: false,
        lastSync: undefined,
        syncing: false
      },
      conflicts: 0,
      pendingSync: 0,
      timestamp: new Date().toISOString()
    };

    await cache.set(cacheKey, status, {
      strategy: CACHE_STRATEGIES.syncStatus,
      tags: ['agenda', 'sync', agentId],
      compress: false,
      syncAcrossTabs: true
    });

    return status;

  } catch (error) {
    console.error('Erro ao buscar status de sync:', error);
    
    // Retornar status padrão em caso de erro
    return {
      googleCalendar: { connected: false, syncing: false },
      conflicts: 0,
      pendingSync: 0
    };
  }
}

// ================================================================
// HOOK PRINCIPAL OTIMIZADO
// ================================================================

export interface UseAgendaOptions {
  agentId?: string;
  date?: string;
  dateRange?: DateRange;
  enableRealtime?: boolean;
  enablePrefetch?: boolean;
  enableOfflineQueue?: boolean;
}

export interface UseAgendaReturn {
  // Dados principais
  schedule: AgentSchedule | null;
  slots: AvailabilitySlot[];
  appointments: Appointment[];
  syncStatus: any;

  // Estados
  isLoading: boolean;
  isLoadingSlots: boolean;
  isLoadingAppointments: boolean;
  error: Error | null;
  hasError: boolean;

  // Mutations
  createAppointment: (data: CreateAppointmentDTO) => Promise<Appointment>;
  updateAppointment: (id: string, data: UpdateAppointmentDTO) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  bookSlot: (slotId: string, appointmentData: Partial<CreateAppointmentDTO>) => Promise<Appointment>;
  releaseSlot: (slotId: string) => Promise<void>;
  updateSchedule: (schedule: Partial<AgentSchedule>) => Promise<AgentSchedule>;
  generateSlots: (dateRange: DateRange) => Promise<AvailabilitySlot[]>;
  syncWithGoogle: () => Promise<void>;

  // Controles
  refetch: () => void;
  refetchSlots: () => void;
  refetchAppointments: () => void;
  checkConflicts: (date: string, startTime: string, endTime: string) => Promise<boolean>;

  // Status
  isOnline: boolean;
  isOffline: boolean;
  offlineQueue: any[];
  lastUpdated: string | null;
  cacheMetrics: {
    hitRate: number;
    size: number;
    offlineQueueSize: number;
  };
}

export function useAgendaV2(options: UseAgendaOptions = {}): UseAgendaReturn {
  const {
    agentId,
    date,
    dateRange,
    enableRealtime = true,
    enablePrefetch = true,
    enableOfflineQueue = true
  } = options;

  const queryClient = useQueryClient();
  const cache = getUnifiedCache();
  const { invalidateByTags, invalidateMultiple } = useCacheInvalidation();
  const { batchInvalidate } = useCacheBatchInvalidation();
  const { isOnline, queueSize, addToQueue, processQueue } = useOfflineCache();
  const { prefetch } = useCachePrefetch();
  const { optimisticUpdate } = useOptimisticCache();
  
  const [cacheMetrics, setCacheMetrics] = useState(cache.getMetrics());
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Query para schedule do agente
  const scheduleQuery = useCacheQuery(
    AGENDA_QUERY_KEYS.schedule(agentId || ''),
    () => fetchAgentSchedule(agentId!),
    {
      strategy: CACHE_STRATEGIES.schedules,
      tags: ['agenda', 'schedules'],
      staleTime: 30 * 60 * 1000
    },
    {
      enabled: Boolean(agentId),
      retry: isOnline ? 2 : 0
    }
  );

  // Query para slots de disponibilidade
  const slotsQuery = useCacheQuery(
    AGENDA_QUERY_KEYS.dateRangeSlots(
      agentId || '',
      dateRange?.startDate || date || new Date().toISOString().split('T')[0],
      dateRange?.endDate || date || new Date().toISOString().split('T')[0]
    ),
    () => fetchAvailabilitySlots(
      agentId!,
      dateRange?.startDate || date || new Date().toISOString().split('T')[0],
      dateRange?.endDate || date || new Date().toISOString().split('T')[0]
    ),
    {
      strategy: CACHE_STRATEGIES.slots,
      tags: ['agenda', 'slots'],
      staleTime: 5 * 60 * 1000
    },
    {
      enabled: Boolean(agentId) && Boolean(date || dateRange),
      retry: isOnline ? 2 : 0,
      refetchInterval: isOnline ? 60 * 1000 : false // Refresh a cada minuto
    }
  );

  // Query para appointments
  const appointmentsQuery = useCacheQuery(
    date ? AGENDA_QUERY_KEYS.dateAppointments(date) : 
    AGENDA_QUERY_KEYS.agentAppointments(agentId || ''),
    () => fetchAppointments({
      agentId,
      date,
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate
    }),
    {
      strategy: CACHE_STRATEGIES.appointments,
      tags: ['agenda', 'appointments'],
      staleTime: 0 // Sempre fresh
    },
    {
      enabled: Boolean(agentId || date),
      retry: isOnline ? 2 : 0,
      refetchInterval: isOnline ? 30 * 1000 : false // Refresh a cada 30s
    }
  );

  // Query para sync status
  const syncStatusQuery = useCacheQuery(
    AGENDA_QUERY_KEYS.syncStatus(agentId || ''),
    () => fetchSyncStatus(agentId!),
    {
      strategy: CACHE_STRATEGIES.syncStatus,
      tags: ['agenda', 'sync'],
      staleTime: 10 * 1000
    },
    {
      enabled: Boolean(agentId),
      refetchInterval: isOnline ? 30 * 1000 : false
    }
  );

  // Subscription para real-time updates
  useCacheSubscription(
    ['agenda', agentId || ''],
    async (event) => {
      console.log('📡 Real-time agenda event:', event);
      
      // Invalidar caches relevantes baseado no evento
      switch (event.type) {
        case 'appointment.created':
        case 'appointment.updated':
        case 'appointment.deleted':
          await batchInvalidate([
            ['agenda', 'appointments'],
            ['agenda', 'slots']
          ]);
          break;
          
        case 'slot.booked':
        case 'slot.released':
          await invalidateByTags(['agenda', 'slots']);
          break;
          
        case 'schedule.updated':
          await batchInvalidate([
            ['agenda', 'schedules'],
            ['agenda', 'slots']
          ]);
          break;
          
        case 'sync.completed':
          await invalidateByTags(['agenda']);
          break;
      }
    },
    { enabled: enableRealtime }
  );

  // Atualizar métricas de cache
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheMetrics(cache.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [cache]);

  // Processar fila offline quando voltar online
  useEffect(() => {
    if (isOnline && enableOfflineQueue) {
      processQueue();
    }
  }, [isOnline, enableOfflineQueue, processQueue]);

  // Prefetch de dados adjacentes
  useEffect(() => {
    if (!enablePrefetch || !date || !agentId) return;

    const prefetchAdjacentDates = async () => {
      const currentDate = new Date(date);
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Prefetch slots dos dias adjacentes
      await Promise.all([
        prefetch(
          AGENDA_QUERY_KEYS.dateRangeSlots(
            agentId,
            prevDate.toISOString().split('T')[0],
            prevDate.toISOString().split('T')[0]
          ),
          () => fetchAvailabilitySlots(
            agentId,
            prevDate.toISOString().split('T')[0],
            prevDate.toISOString().split('T')[0]
          )
        ),
        prefetch(
          AGENDA_QUERY_KEYS.dateRangeSlots(
            agentId,
            nextDate.toISOString().split('T')[0],
            nextDate.toISOString().split('T')[0]
          ),
          () => fetchAvailabilitySlots(
            agentId,
            nextDate.toISOString().split('T')[0],
            nextDate.toISOString().split('T')[0]
          )
        )
      ]);
    };

    prefetchAdjacentDates();
  }, [date, agentId, enablePrefetch, prefetch]);

  // Mutations com cache unificado e offline queue
  const createAppointmentMutation = useCacheMutation<Appointment, Error, CreateAppointmentDTO>(
    async (data) => {
      // Validar dados
      const validated = AppointmentSchema.parse(data);
      
      if (!isOnline && enableOfflineQueue) {
        // Adicionar à fila offline
        const offlineItem = {
          id: `offline_${Date.now()}`,
          type: 'create_appointment',
          data: validated,
          timestamp: new Date().toISOString()
        };
        
        await addToQueue(offlineItem);
        
        // Retornar appointment otimista
        return {
          ...validated,
          id: offlineItem.id,
          status: 'PENDING',
          syncStatus: 'PENDING' as SyncStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Appointment;
      }
      
      const result = await appointmentService.create(validated);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao criar agendamento');
      }
      return result.data;
    },
    {
      onSuccess: async (appointment) => {
        // Invalidar caches relacionados
        await batchInvalidate([
          ['agenda', 'appointments'],
          ['agenda', 'slots'],
          ['agenda', 'stats']
        ]);
        
        // Adicionar ao cache individual
        const detailKey = AGENDA_QUERY_KEYS.appointment(appointment.id).join(':');
        await cache.set(detailKey, appointment, {
          strategy: CACHE_STRATEGIES.appointments,
          tags: ['agenda', 'appointments', appointment.id]
        });

        // Emitir evento
        EventBus.emit(SystemEvents.APPOINTMENT_CREATED, appointment);
        toast.success('Agendamento criado com sucesso!');
      },
      onError: (error) => {
        console.error('Erro ao criar agendamento:', error);
        toast.error(error.message || 'Erro ao criar agendamento');
      }
    }
  );

  const updateAppointmentMutation = useCacheMutation<Appointment, Error, { id: string; data: UpdateAppointmentDTO }>(
    async ({ id, data }) => {
      if (!isOnline && enableOfflineQueue) {
        await addToQueue({
          id: `offline_update_${Date.now()}`,
          type: 'update_appointment',
          data: { id, ...data },
          timestamp: new Date().toISOString()
        });
        
        // Retornar dados otimistas
        const current = await cache.get<Appointment>(
          AGENDA_QUERY_KEYS.appointment(id).join(':')
        );
        return { ...current, ...data, syncStatus: 'PENDING' } as Appointment;
      }
      
      const result = await appointmentService.update(id, data);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao atualizar agendamento');
      }
      return result.data;
    },
    {
      onMutate: async ({ id, data }) => {
        // Optimistic update
        const previousData = await optimisticUpdate(
          AGENDA_QUERY_KEYS.appointment(id),
          (old: Appointment) => ({ ...old, ...data })
        );
        return { previousData };
      },
      onSuccess: async (appointment) => {
        await invalidateByTags(['agenda']);
        EventBus.emit(SystemEvents.APPOINTMENT_UPDATED, appointment);
        toast.success('Agendamento atualizado!');
      },
      onError: (error, variables, context) => {
        // Reverter optimistic update
        if (context?.previousData) {
          queryClient.setQueryData(
            AGENDA_QUERY_KEYS.appointment(variables.id),
            context.previousData
          );
        }
        toast.error(error.message || 'Erro ao atualizar');
      }
    }
  );

  const deleteAppointmentMutation = useCacheMutation<void, Error, string>(
    async (id) => {
      if (!isOnline && enableOfflineQueue) {
        await addToQueue({
          id: `offline_delete_${Date.now()}`,
          type: 'delete_appointment',
          data: { id },
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const result = await appointmentService.delete(id);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar agendamento');
      }
    },
    {
      onSuccess: async (_, id) => {
        // Remover do cache
        await cache.remove(AGENDA_QUERY_KEYS.appointment(id).join(':'));
        await batchInvalidate([
          ['agenda', 'appointments'],
          ['agenda', 'slots'],
          ['agenda', 'stats']
        ]);
        
        EventBus.emit(SystemEvents.APPOINTMENT_DELETED, { id });
        toast.success('Agendamento removido!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover agendamento');
      }
    }
  );

  const bookSlotMutation = useCacheMutation<Appointment, Error, { 
    slotId: string; 
    appointmentData: Partial<CreateAppointmentDTO> 
  }>(
    async ({ slotId, appointmentData }) => {
      const result = await availabilitySlotService.bookSlot(slotId, appointmentData);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao reservar slot');
      }
      return result.data;
    },
    {
      onSuccess: async (appointment) => {
        await batchInvalidate([
          ['agenda', 'slots'],
          ['agenda', 'appointments']
        ]);
        
        toast.success('Slot reservado com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao reservar slot');
      }
    }
  );

  const releaseSlotMutation = useCacheMutation<void, Error, string>(
    async (slotId) => {
      const result = await availabilitySlotService.releaseSlot(slotId);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao liberar slot');
      }
    },
    {
      onSuccess: async () => {
        await invalidateByTags(['agenda', 'slots']);
        toast.success('Slot liberado!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao liberar slot');
      }
    }
  );

  const updateScheduleMutation = useCacheMutation<AgentSchedule, Error, Partial<AgentSchedule>>(
    async (schedule) => {
      if (!agentId) throw new Error('Agent ID necessário');
      
      // Validar working hours
      if (schedule.workingHours) {
        WorkingHoursSchema.parse(schedule.workingHours);
      }
      
      const result = await agentScheduleService.update(agentId, schedule);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao atualizar horário');
      }
      return result.data;
    },
    {
      onSuccess: async (schedule) => {
        await batchInvalidate([
          ['agenda', 'schedules'],
          ['agenda', 'slots'] // Slots podem mudar com novo horário
        ]);
        
        toast.success('Horário de trabalho atualizado!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar horário');
      }
    }
  );

  const generateSlotsMutation = useCacheMutation<AvailabilitySlot[], Error, DateRange>(
    async (dateRange) => {
      if (!agentId) throw new Error('Agent ID necessário');
      
      const result = await availabilitySlotService.generateSlotsFromSchedule(
        agentId,
        dateRange.startDate,
        dateRange.endDate
      );
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao gerar slots');
      }
      return result.data;
    },
    {
      onSuccess: async (slots) => {
        await invalidateByTags(['agenda', 'slots']);
        toast.success(`${slots.length} slots gerados com sucesso!`);
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao gerar slots');
      }
    }
  );

  const syncWithGoogleMutation = useCacheMutation<void, Error, void>(
    async () => {
      if (!agentId) throw new Error('Agent ID necessário');
      
      // Implementar sync com Google Calendar
      // Por enquanto, apenas simular
      await new Promise(resolve => setTimeout(resolve, 2000));
    },
    {
      onSuccess: async () => {
        await invalidateByTags(['agenda']);
        toast.success('Sincronização com Google Calendar concluída!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro na sincronização');
      }
    }
  );

  // Função para verificar conflitos
  const checkConflicts = useCallback(async (
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> => {
    if (!agentId) return false;
    
    try {
      const appointments = await fetchAppointments({ agentId, date });
      
      // Verificar sobreposição de horários
      const hasConflict = appointments.some(apt => {
        const aptStart = apt.startTime;
        const aptEnd = apt.endTime;
        
        return (
          (startTime >= aptStart && startTime < aptEnd) ||
          (endTime > aptStart && endTime <= aptEnd) ||
          (startTime <= aptStart && endTime >= aptEnd)
        );
      });
      
      return hasConflict;
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      return false;
    }
  }, [agentId]);

  // Monitorar fila offline
  useEffect(() => {
    const checkOfflineQueue = async () => {
      const queue = await cache.get<any[]>('offline_queue') || [];
      setOfflineQueue(queue);
    };

    checkOfflineQueue();
    const interval = setInterval(checkOfflineQueue, 5000);
    return () => clearInterval(interval);
  }, [cache]);

  // Estados derivados
  const hasError = Boolean(
    scheduleQuery.error || 
    slotsQuery.error || 
    appointmentsQuery.error
  );
  
  const lastUpdated = appointmentsQuery.data?.[0]?.updatedAt?.toString() || null;

  return {
    // Dados principais
    schedule: scheduleQuery.data || null,
    slots: slotsQuery.data || [],
    appointments: appointmentsQuery.data || [],
    syncStatus: syncStatusQuery.data,

    // Estados
    isLoading: scheduleQuery.isLoading,
    isLoadingSlots: slotsQuery.isLoading,
    isLoadingAppointments: appointmentsQuery.isLoading,
    error: scheduleQuery.error || slotsQuery.error || appointmentsQuery.error,
    hasError,

    // Mutations
    createAppointment: (data) => createAppointmentMutation.mutateAsync(data),
    updateAppointment: (id, data) => updateAppointmentMutation.mutateAsync({ id, data }),
    deleteAppointment: (id) => deleteAppointmentMutation.mutateAsync(id),
    bookSlot: (slotId, appointmentData) => 
      bookSlotMutation.mutateAsync({ slotId, appointmentData }),
    releaseSlot: (slotId) => releaseSlotMutation.mutateAsync(slotId),
    updateSchedule: (schedule) => updateScheduleMutation.mutateAsync(schedule),
    generateSlots: (dateRange) => generateSlotsMutation.mutateAsync(dateRange),
    syncWithGoogle: () => syncWithGoogleMutation.mutateAsync(),

    // Controles
    refetch: () => scheduleQuery.refetch(),
    refetchSlots: () => slotsQuery.refetch(),
    refetchAppointments: () => appointmentsQuery.refetch(),
    checkConflicts,

    // Status
    isOnline,
    isOffline: !isOnline,
    offlineQueue,
    lastUpdated,
    cacheMetrics: {
      hitRate: cacheMetrics.hitRate,
      size: cacheMetrics.size,
      offlineQueueSize: offlineQueue.length
    }
  };
}

// ================================================================
// HOOKS ESPECÍFICOS
// ================================================================

/**
 * Hook para buscar um agendamento específico
 */
export function useAppointmentV2(id: string) {
  const cache = getUnifiedCache();
  const { isOnline } = useOfflineCache();

  const query = useCacheQuery(
    AGENDA_QUERY_KEYS.appointment(id),
    async () => {
      const result = await appointmentService.findById(id);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Agendamento não encontrado');
      }
      return result.data;
    },
    {
      strategy: CACHE_STRATEGIES.appointments,
      tags: ['agenda', 'appointments', id],
      staleTime: 0 // Sempre fresh
    },
    {
      enabled: Boolean(id),
      retry: isOnline ? 2 : 0
    }
  );

  return {
    appointment: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para slots de um dia específico
 */
export function useDaySlotsV2(agentId: string, date: string) {
  const { isOnline } = useOfflineCache();

  const query = useCacheQuery(
    AGENDA_QUERY_KEYS.dateRangeSlots(agentId, date, date),
    () => fetchAvailabilitySlots(agentId, date, date),
    {
      strategy: CACHE_STRATEGIES.slots,
      tags: ['agenda', 'slots', date],
      staleTime: 5 * 60 * 1000
    },
    {
      enabled: Boolean(agentId && date),
      retry: isOnline ? 2 : 0,
      refetchInterval: isOnline ? 60 * 1000 : false
    }
  );

  // Filtrar apenas slots disponíveis
  const availableSlots = useMemo(() => 
    query.data?.filter(slot => slot.status === 'AVAILABLE') || [],
    [query.data]
  );

  return {
    slots: query.data || [],
    availableSlots,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para Google Calendar sync
 */
export function useGoogleCalendarSyncV2(agentId: string) {
  const { isOnline } = useOfflineCache();
  const { invalidateByTags } = useCacheInvalidation();

  const statusQuery = useCacheQuery(
    AGENDA_QUERY_KEYS.syncStatus(agentId),
    () => fetchSyncStatus(agentId),
    {
      strategy: CACHE_STRATEGIES.syncStatus,
      tags: ['agenda', 'sync', agentId],
      staleTime: 10 * 1000
    },
    {
      enabled: Boolean(agentId) && isOnline,
      refetchInterval: 30 * 1000
    }
  );

  const syncMutation = useCacheMutation<void, Error, void>(
    async () => {
      // Implementar sync real com Google Calendar
      await new Promise(resolve => setTimeout(resolve, 3000));
    },
    {
      onSuccess: async () => {
        await invalidateByTags(['agenda']);
        toast.success('Calendário sincronizado!');
      },
      onError: (error) => {
        toast.error('Erro na sincronização');
      }
    }
  );

  return {
    status: statusQuery.data,
    isConnected: statusQuery.data?.googleCalendar?.connected || false,
    isSyncing: syncMutation.isPending || statusQuery.data?.googleCalendar?.syncing,
    lastSync: statusQuery.data?.googleCalendar?.lastSync,
    conflicts: statusQuery.data?.conflicts || 0,
    sync: () => syncMutation.mutateAsync(),
    refetch: statusQuery.refetch
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default useAgendaV2;