import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentScheduleService, availabilitySlotService, agendaUtils } from '@/services/agendaService';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

// Types
type AgentSchedule = Database['public']['Tables']['AgentSchedule']['Row'];
type AgentScheduleInsert = Database['public']['Tables']['AgentSchedule']['Insert'];
type AgentScheduleUpdate = Database['public']['Tables']['AgentSchedule']['Update'];

type AvailabilitySlot = Database['public']['Tables']['AvailabilitySlot']['Row'];
type AvailabilitySlotInsert = Database['public']['Tables']['AvailabilitySlot']['Insert'];
type AvailabilitySlotUpdate = Database['public']['Tables']['AvailabilitySlot']['Update'];

// Query Keys
export const agendaKeys = {
  all: ['agenda'] as const,
  schedules: () => [...agendaKeys.all, 'schedules'] as const,
  schedule: (agentId: string) => [...agendaKeys.schedules(), agentId] as const,
  slots: () => [...agendaKeys.all, 'slots'] as const,
  agentSlots: (agentId: string) => [...agendaKeys.slots(), 'agent', agentId] as const,
  dateRangeSlots: (agentId: string, startDate: string, endDate: string) => 
    [...agendaKeys.agentSlots(agentId), 'dateRange', startDate, endDate] as const,
  availableSlots: (agentId: string, date: string) => 
    [...agendaKeys.agentSlots(agentId), 'available', date] as const,
  nextAvailable: (agentId: string) => 
    [...agendaKeys.agentSlots(agentId), 'nextAvailable'] as const,
};

// ===== AGENT SCHEDULE HOOKS =====

/**
 * Hook para buscar agenda de um corretor específico
 */
export function useAgentSchedule(agentId: string) {
  return useQuery({
    queryKey: agendaKeys.schedule(agentId),
    queryFn: () => agentScheduleService.getByAgentId(agentId),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para criar ou atualizar agenda de corretor
 */
export function useUpsertAgentSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (schedule: AgentScheduleInsert) => {
      // Validate working hours before saving
      if (!agendaUtils.validateWorkingHours(schedule.workingHours)) {
        throw new Error('Horários de trabalho inválidos');
      }
      
      return agentScheduleService.upsert(schedule);
    },
    onSuccess: (data) => {
      // Invalidate and refetch schedule
      queryClient.invalidateQueries({ queryKey: agendaKeys.schedule(data.agentId) });
      queryClient.invalidateQueries({ queryKey: agendaKeys.schedules() });
      
      toast({
        title: 'Sucesso',
        description: 'Agenda do corretor salva com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar agenda de corretor
 */
export function useDeleteAgentSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: agentScheduleService.delete,
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.schedule(agentId) });
      queryClient.invalidateQueries({ queryKey: agendaKeys.schedules() });
      
      toast({
        title: 'Sucesso',
        description: 'Agenda do corretor removida com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ===== AVAILABILITY SLOT HOOKS =====

/**
 * Hook para buscar slots de disponibilidade por período
 */
export function useAvailabilitySlots(agentId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: agendaKeys.dateRangeSlots(agentId, startDate, endDate),
    queryFn: () => availabilitySlotService.getByAgentAndDateRange(agentId, startDate, endDate),
    enabled: !!agentId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook para buscar slots disponíveis em uma data específica
 */
export function useAvailableSlots(agentId: string, date: string) {
  return useQuery({
    queryKey: agendaKeys.availableSlots(agentId, date),
    queryFn: () => availabilitySlotService.getAvailableSlots(agentId, date),
    enabled: !!agentId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook para buscar o próximo slot disponível
 */
export function useNextAvailableSlot(agentId: string) {
  return useQuery({
    queryKey: agendaKeys.nextAvailable(agentId),
    queryFn: () => agendaUtils.getNextAvailableSlot(agentId),
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook para criar slot de disponibilidade
 */
export function useCreateAvailabilitySlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: availabilitySlotService.create,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: agendaKeys.agentSlots(data.agentId) });
      
      toast({
        title: 'Sucesso',
        description: 'Slot de disponibilidade criado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para criar múltiplos slots (batch)
 */
export function useCreateAvailabilitySlotsBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: availabilitySlotService.createBatch,
    onSuccess: (data) => {
      // Invalidate queries for all affected agents
      const affectedAgents = [...new Set(data.map(slot => slot.agentId))];
      affectedAgents.forEach(agentId => {
        queryClient.invalidateQueries({ queryKey: agendaKeys.agentSlots(agentId) });
      });
      
      toast({
        title: 'Sucesso',
        description: `${data.length} slots de disponibilidade criados com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para atualizar slot de disponibilidade
 */
export function useUpdateAvailabilitySlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ slotId, updates }: { slotId: string; updates: AvailabilitySlotUpdate }) =>
      availabilitySlotService.update(slotId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.agentSlots(data.agentId) });
      
      toast({
        title: 'Sucesso',
        description: 'Slot de disponibilidade atualizado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para reservar um slot
 */
export function useBookSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ slotId, appointmentId }: { slotId: string; appointmentId?: string }) =>
      availabilitySlotService.bookSlot(slotId, appointmentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.agentSlots(data.agentId) });
      
      toast({
        title: 'Sucesso',
        description: 'Slot reservado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para liberar um slot
 */
export function useReleaseSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: availabilitySlotService.releaseSlot,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.agentSlots(data.agentId) });
      
      toast({
        title: 'Sucesso',
        description: 'Slot liberado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar slot de disponibilidade
 */
export function useDeleteAvailabilitySlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: availabilitySlotService.delete,
    onSuccess: (_, slotId) => {
      // Need to invalidate all slot queries since we don't have agentId in return
      queryClient.invalidateQueries({ queryKey: agendaKeys.slots() });
      
      toast({
        title: 'Sucesso',
        description: 'Slot de disponibilidade removido com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para gerar slots automaticamente baseado na agenda
 */
export function useGenerateSlotsFromSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createBatch = useCreateAvailabilitySlotsBatch();

  return useMutation({
    mutationFn: async ({ agentId, date, duration = 60 }: { 
      agentId: string; 
      date: string; 
      duration?: number; 
    }) => {
      const slots = await availabilitySlotService.generateSlotsFromSchedule(agentId, date, duration);
      
      if (slots.length === 0) {
        throw new Error('Não há horários de trabalho configurados para esta data');
      }
      
      return availabilitySlotService.createBatch(slots);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.agentSlots(variables.agentId) });
      
      toast({
        title: 'Sucesso',
        description: `${data.length} slots gerados automaticamente para ${variables.date}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ===== UTILITY HOOKS =====

/**
 * Hook para verificar se um corretor está disponível em determinado horário
 */
export function useCheckAgentAvailability(agentId: string, date: string, time: string) {
  const { data: schedule } = useAgentSchedule(agentId);
  
  return {
    isAvailable: schedule ? agendaUtils.isAgentAvailable(schedule, date, time) : false,
    schedule
  };
}

/**
 * Hook personalizado para gerenciar estado de agenda completo
 */
export function useAgendaManager(agentId: string) {
  const schedule = useAgentSchedule(agentId);
  const upsertSchedule = useUpsertAgentSchedule();
  const deleteSchedule = useDeleteAgentSchedule();
  
  const generateSlots = useGenerateSlotsFromSchedule();
  const createSlot = useCreateAvailabilitySlot();
  const updateSlot = useUpdateAvailabilitySlot();
  const deleteSlot = useDeleteAvailabilitySlot();
  
  const bookSlot = useBookSlot();
  const releaseSlot = useReleaseSlot();

  return {
    // Schedule management
    schedule: schedule.data,
    isLoadingSchedule: schedule.isLoading,
    scheduleError: schedule.error,
    
    // Schedule actions
    saveSchedule: upsertSchedule.mutate,
    deleteSchedule: deleteSchedule.mutate,
    isSavingSchedule: upsertSchedule.isPending,
    
    // Slot management
    generateSlots: generateSlots.mutate,
    createSlot: createSlot.mutate,
    updateSlot: updateSlot.mutate,
    deleteSlot: deleteSlot.mutate,
    
    // Booking actions
    bookSlot: bookSlot.mutate,
    releaseSlot: releaseSlot.mutate,
    
    // Loading states
    isGeneratingSlots: generateSlots.isPending,
    isManipulatingSlots: createSlot.isPending || updateSlot.isPending || deleteSlot.isPending,
    isBookingSlot: bookSlot.isPending || releaseSlot.isPending,
  };
}