import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AgentSchedule, 
  AgentScheduleForm,
  AvailabilitySlot,
  AvailabilityFilters,
  DaySchedule,
  TimeSlot,
  DayAvailability,
  WeekAvailability
} from '@/types/agenda';

// =====================================================
// CONSTANTES PARA QUERY KEYS
// =====================================================

const SCHEDULE_KEYS = {
  all: ['agent-schedules'] as const,
  lists: () => [...SCHEDULE_KEYS.all, 'list'] as const,
  list: (filters: any) => [...SCHEDULE_KEYS.lists(), filters] as const,
  details: () => [...SCHEDULE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SCHEDULE_KEYS.details(), id] as const,
  agent: (agentId: string) => [...SCHEDULE_KEYS.all, 'agent', agentId] as const,
  availability: () => [...SCHEDULE_KEYS.all, 'availability'] as const,
  availabilitySlots: (filters: AvailabilityFilters) => [...SCHEDULE_KEYS.availability(), 'slots', filters] as const,
  weekAvailability: (agentId: string, weekStart: Date) => [...SCHEDULE_KEYS.availability(), 'week', agentId, weekStart] as const,
};

// =====================================================
// DADOS MOCKADOS
// =====================================================

const mockAgentSchedules: AgentSchedule[] = [
  {
    id: '1',
    agentId: 'agent1',
    monday: { start: '09:00', end: '18:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    tuesday: { start: '09:00', end: '18:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    wednesday: { start: '09:00', end: '18:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    thursday: { start: '09:00', end: '18:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    friday: { start: '09:00', end: '18:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    saturday: { start: '09:00', end: '14:00', available: true },
    sunday: { start: '00:00', end: '00:00', available: false },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    agentId: 'agent2',
    monday: { start: '08:00', end: '17:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    tuesday: { start: '08:00', end: '17:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    wednesday: { start: '08:00', end: '17:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    thursday: { start: '08:00', end: '17:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    friday: { start: '08:00', end: '17:00', available: true, breakStart: '12:00', breakEnd: '13:00' },
    saturday: { start: '00:00', end: '00:00', available: false },
    sunday: { start: '00:00', end: '00:00', available: false },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockAvailabilitySlots: AvailabilitySlot[] = [
  {
    id: '1',
    agentId: 'agent1',
    date: new Date('2024-12-01'),
    startTime: '09:00',
    endTime: '18:00',
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    agentId: 'agent1',
    date: new Date('2024-12-02'),
    startTime: '09:00',
    endTime: '18:00',
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

// Gerar slots de tempo para um dia
const generateTimeSlots = (start: string, end: string, interval: number = 30): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startTime = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  
  let currentTime = new Date(startTime);
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + interval * 60000);
    if (slotEnd > endTime) break;
    
    slots.push({
      start: currentTime.toTimeString().slice(0, 5),
      end: slotEnd.toTimeString().slice(0, 5),
      available: true
    });
    
    currentTime = slotEnd;
  }
  
  return slots;
};

// Verificar se um horário está dentro do intervalo de trabalho
const isWithinWorkingHours = (time: string, schedule: DaySchedule): boolean => {
  if (!schedule.available) return false;
  
  const timeDate = new Date(`2000-01-01T${time}`);
  const startDate = new Date(`2000-01-01T${schedule.start}`);
  const endDate = new Date(`2000-01-01T${schedule.end}`);
  
  return timeDate >= startDate && timeDate < endDate;
};

// Verificar se um horário está no intervalo de almoço
const isBreakTime = (time: string, schedule: DaySchedule): boolean => {
  if (!schedule.breakStart || !schedule.breakEnd) return false;
  
  const timeDate = new Date(`2000-01-01T${time}`);
  const breakStartDate = new Date(`2000-01-01T${schedule.breakStart}`);
  const breakEndDate = new Date(`2000-01-01T${schedule.breakEnd}`);
  
  return timeDate >= breakStartDate && timeDate < breakEndDate;
};

// =====================================================
// API FUNCTIONS (MOCKADAS)
// =====================================================

const scheduleApi = {
  // Buscar horários de trabalho
  getAgentSchedules: async (): Promise<AgentSchedule[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAgentSchedules;
  },

  // Buscar horário de um agente específico
  getAgentSchedule: async (agentId: string): Promise<AgentSchedule | null> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockAgentSchedules.find(s => s.agentId === agentId) || null;
  },

  // Criar/atualizar horário de trabalho
  upsertAgentSchedule: async (data: AgentScheduleForm): Promise<AgentSchedule> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const existingIndex = mockAgentSchedules.findIndex(s => s.agentId === data.agentId);
    const scheduleData: AgentSchedule = {
      id: existingIndex >= 0 ? mockAgentSchedules[existingIndex].id : Date.now().toString(),
      agentId: data.agentId,
      monday: data.monday,
      tuesday: data.tuesday,
      wednesday: data.wednesday,
      thursday: data.thursday,
      friday: data.friday,
      saturday: data.saturday,
      sunday: data.sunday,
      createdAt: existingIndex >= 0 ? mockAgentSchedules[existingIndex].createdAt : new Date(),
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      mockAgentSchedules[existingIndex] = scheduleData;
    } else {
      mockAgentSchedules.push(scheduleData);
    }

    return scheduleData;
  },

  // Buscar slots de disponibilidade
  getAvailabilitySlots: async (filters: AvailabilityFilters): Promise<AvailabilitySlot[]> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return mockAvailabilitySlots.filter(slot => {
      if (filters.agentId && slot.agentId !== filters.agentId) return false;
      if (filters.dateFrom && slot.date < filters.dateFrom) return false;
      if (filters.dateTo && slot.date > filters.dateTo) return false;
      if (filters.availableOnly && !slot.isAvailable) return false;
      return true;
    });
  },

  // Criar slot de disponibilidade
  createAvailabilitySlot: async (data: Omit<AvailabilitySlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<AvailabilitySlot> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newSlot: AvailabilitySlot = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockAvailabilitySlots.push(newSlot);
    return newSlot;
  },

  // Atualizar slot de disponibilidade
  updateAvailabilitySlot: async (id: string, data: Partial<AvailabilitySlot>): Promise<AvailabilitySlot> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const slotIndex = mockAvailabilitySlots.findIndex(s => s.id === id);
    if (slotIndex === -1) throw new Error('Slot não encontrado');

    const updatedSlot = {
      ...mockAvailabilitySlots[slotIndex],
      ...data,
      updatedAt: new Date()
    };

    mockAvailabilitySlots[slotIndex] = updatedSlot;
    return updatedSlot;
  }
};

// =====================================================
// HOOKS PRINCIPAIS
// =====================================================

// Hook para buscar horários de trabalho
export const useAgentSchedules = () => {
  return useQuery({
    queryKey: SCHEDULE_KEYS.lists(),
    queryFn: scheduleApi.getAgentSchedules,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para buscar horário de um agente específico
export const useAgentSchedule = (agentId: string) => {
  return useQuery({
    queryKey: SCHEDULE_KEYS.agent(agentId),
    queryFn: () => scheduleApi.getAgentSchedule(agentId),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para gerenciar horários de trabalho
export const useAgentScheduleManagement = () => {
  const queryClient = useQueryClient();

  const upsertMutation = useMutation({
    mutationFn: scheduleApi.upsertAgentSchedule,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.agent(data.agentId) });
    },
  });

  const upsertSchedule = async (data: AgentScheduleForm) => {
    try {
      return await upsertMutation.mutateAsync(data);
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      throw error;
    }
  };

  return {
    upsertSchedule,
    isLoading: upsertMutation.isPending,
    error: upsertMutation.error?.message || null
  };
};

// Hook para slots de disponibilidade
export const useAvailabilitySlots = (filters: AvailabilityFilters = {}) => {
  return useQuery({
    queryKey: SCHEDULE_KEYS.availabilitySlots(filters),
    queryFn: () => scheduleApi.getAvailabilitySlots(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para gerenciar slots de disponibilidade
export const useAvailabilitySlotManagement = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: scheduleApi.createAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.availability() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AvailabilitySlot> }) =>
      scheduleApi.updateAvailabilitySlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.availability() });
    },
  });

  const createSlot = async (data: Omit<AvailabilitySlot, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      return await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Erro ao criar slot:', error);
      throw error;
    }
  };

  const updateSlot = async (id: string, data: Partial<AvailabilitySlot>) => {
    try {
      return await updateMutation.mutateAsync({ id, data });
    } catch (error) {
      console.error('Erro ao atualizar slot:', error);
      throw error;
    }
  };

  return {
    createSlot,
    updateSlot,
    isLoading: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error?.message || updateMutation.error?.message || null
  };
};

// =====================================================
// HOOKS ESPECIALIZADOS
// =====================================================

// Hook para disponibilidade semanal
export const useWeekAvailability = (agentId: string, weekStart: Date) => {
  return useQuery({
    queryKey: SCHEDULE_KEYS.weekAvailability(agentId, weekStart),
    queryFn: async (): Promise<WeekAvailability> => {
      const schedule = await scheduleApi.getAgentSchedule(agentId);
      if (!schedule) {
        return {
          weekStart,
          days: []
        };
      }

      const days: DayAvailability[] = [];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        
        const dayName = dayNames[date.getDay()];
        const daySchedule = schedule[dayName];

        if (daySchedule && daySchedule.available) {
          const slots = generateTimeSlots(daySchedule.start, daySchedule.end);
          
          // Marcar slots de almoço como indisponíveis
          if (daySchedule.breakStart && daySchedule.breakEnd) {
            slots.forEach(slot => {
              if (isBreakTime(slot.start, daySchedule)) {
                slot.available = false;
              }
            });
          }

          days.push({
            date,
            slots
          });
        } else {
          days.push({
            date,
            slots: []
          });
        }
      }

      return {
        weekStart,
        days
      };
    },
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para verificar disponibilidade em um horário específico
export const useTimeSlotAvailability = (agentId: string, date: Date, time: string) => {
  return useQuery({
    queryKey: ['time-slot-availability', agentId, date.toISOString(), time],
    queryFn: async (): Promise<boolean> => {
      const schedule = await scheduleApi.getAgentSchedule(agentId);
      if (!schedule) return false;

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      const dayName = dayNames[date.getDay()];
      const daySchedule = schedule[dayName];

      if (!daySchedule || !daySchedule.available) return false;
      if (!isWithinWorkingHours(time, daySchedule)) return false;
      if (isBreakTime(time, daySchedule)) return false;

      return true;
    },
    enabled: !!agentId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// =====================================================
// UTILITÁRIOS
// =====================================================

// Função para gerar slots de tempo padrão
export const generateDefaultTimeSlots = (): TimeSlot[] => {
  return generateTimeSlots('09:00', '18:00', 30);
};

// Função para verificar conflitos de horário
export const checkTimeConflict = (
  startTime: string,
  endTime: string,
  existingSlots: TimeSlot[]
): boolean => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);

  return existingSlots.some(slot => {
    const slotStart = new Date(`2000-01-01T${slot.start}`);
    const slotEnd = new Date(`2000-01-01T${slot.end}`);
    
    return (start < slotEnd && end > slotStart);
  });
};

// Função para encontrar próximo horário disponível
export const findNextAvailableSlot = (
  agentId: string,
  date: Date,
  duration: number = 60
): string | null => {
  // Implementação simplificada - em produção seria mais complexa
  const schedule = mockAgentSchedules.find(s => s.agentId === agentId);
  if (!schedule) return null;

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const dayName = dayNames[date.getDay()];
  const daySchedule = schedule[dayName];

  if (!daySchedule || !daySchedule.available) return null;

  return daySchedule.start;
}; 

// =====================================================
// HOOK: GERENCIAMENTO DE HORÁRIOS DE TRABALHO
// =====================================================

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentSchedule, AgentScheduleForm, DaySchedule } from '@/types/agenda';

// API functions
const fetchAgentSchedule = async (agentId: string): Promise<AgentSchedule | null> => {
  const response = await fetch(`/api/agent-schedules/${agentId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Erro ao buscar horários do corretor');
  }
  return response.json();
};

const createAgentSchedule = async (data: AgentScheduleForm): Promise<AgentSchedule> => {
  const response = await fetch('/api/agent-schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Erro ao criar horários do corretor');
  }
  return response.json();
};

const updateAgentSchedule = async (agentId: string, data: Partial<AgentScheduleForm>): Promise<AgentSchedule> => {
  const response = await fetch(`/api/agent-schedules/${agentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Erro ao atualizar horários do corretor');
  }
  return response.json();
};

const deleteAgentSchedule = async (agentId: string): Promise<void> => {
  const response = await fetch(`/api/agent-schedules/${agentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erro ao deletar horários do corretor');
  }
};

// Hook principal para gerenciar horário de um agente específico
export const useAgentScheduleManager = (agentId?: string) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Query para buscar horários
  const {
    data: schedule,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['agent-schedule', agentId],
    queryFn: () => fetchAgentSchedule(agentId!),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar horários
  const createMutation = useMutation({
    mutationFn: createAgentSchedule,
    onSuccess: (data) => {
      queryClient.setQueryData(['agent-schedule', data.agentId], data);
      queryClient.invalidateQueries({ queryKey: ['agent-schedules'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Mutation para atualizar horários
  const updateMutation = useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: Partial<AgentScheduleForm> }) =>
      updateAgentSchedule(agentId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['agent-schedule', data.agentId], data);
      queryClient.invalidateQueries({ queryKey: ['agent-schedules'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Mutation para deletar horários
  const deleteMutation = useMutation({
    mutationFn: deleteAgentSchedule,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['agent-schedule', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-schedules'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Funções auxiliares
  const createSchedule = async (data: AgentScheduleForm) => {
    await createMutation.mutateAsync(data);
  };

  const updateSchedule = async (data: Partial<AgentScheduleForm>) => {
    if (!agentId) throw new Error('ID do corretor é obrigatório');
    await updateMutation.mutateAsync({ agentId, data });
  };

  const deleteSchedule = async () => {
    if (!agentId) throw new Error('ID do corretor é obrigatório');
    await deleteMutation.mutateAsync(agentId);
  };

  const clearError = () => setError(null);

  // Validação de horários
  const validateDaySchedule = (daySchedule: DaySchedule): boolean => {
    if (!daySchedule.available) return true;
    
    const start = daySchedule.start;
    const end = daySchedule.end;
    
    if (!start || !end) return false;
    
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    return startTime < endTime;
  };

  const validateSchedule = (schedule: AgentScheduleForm): string[] => {
    const errors: string[] = [];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    
    days.forEach(day => {
      const daySchedule = schedule[day];
      if (daySchedule && !validateDaySchedule(daySchedule)) {
        errors.push(`Horário inválido para ${day}`);
      }
    });
    
    return errors;
  };

  // Geração de horário padrão
  const generateDefaultSchedule = (): AgentScheduleForm => ({
    agentId: agentId || '',
    monday: { start: '09:00', end: '18:00', available: true },
    tuesday: { start: '09:00', end: '18:00', available: true },
    wednesday: { start: '09:00', end: '18:00', available: true },
    thursday: { start: '09:00', end: '18:00', available: true },
    friday: { start: '09:00', end: '18:00', available: true },
    saturday: { start: '09:00', end: '17:00', available: true },
    sunday: { start: '10:00', end: '16:00', available: false },
  });

  return {
    // Data
    schedule,
    isLoading,
    error,
    
    // Mutations
    createSchedule,
    updateSchedule,
    deleteSchedule,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Utils
    refetch,
    clearError,
    validateSchedule,
    generateDefaultSchedule,
  };
};

// Hook para listar todos os horários (admin)
export const useAllAgentSchedules = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const fetchAllSchedules = async (): Promise<AgentSchedule[]> => {
    const response = await fetch('/api/agent-schedules');
    if (!response.ok) {
      throw new Error('Erro ao buscar horários dos corretores');
    }
    return response.json();
  };

  const {
    data: schedules,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['agent-schedules'],
    queryFn: fetchAllSchedules,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const clearError = () => setError(null);

  return {
    schedules,
    isLoading,
    error,
    refetch,
    clearError,
  };
}; 