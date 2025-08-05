// ================================================================
// HOOK USEAGENDA V2 - VERSÃO SIMPLIFICADA FUNCIONAL
// ================================================================
// Data: 05/08/2025
// Descrição: Versão simplificada que funciona apenas com dados locais
// Status: Funcional sem dependências complexas
// ================================================================

import { useState, useEffect, useCallback } from 'react';

// ================================================================
// TIPOS BÁSICOS
// ================================================================

interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'VISIT' | 'MEETING' | 'CALL' | 'OTHER';
  status: 'confirmed' | 'pending' | 'cancelled';
  agentId: string;
  contactId: string;
  propertyId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AvailabilitySlot {
  id: string;
  agentId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  slotType: 'REGULAR' | 'URGENT' | 'BREAK';
}

interface AgentSchedule {
  id: string;
  agentId: string;
  workingHours: Record<string, { start: string; end: string; breaks?: Array<{ start: string; end: string }> }>;
  timezone: string;
  isActive: boolean;
  bufferTime: number;
  maxDailyAppointments: number;
  allowWeekendWork: boolean;
}

// ================================================================
// DADOS MOCKADOS LOCAIS
// ================================================================

const generateMockAppointments = (agentId?: string): Appointment[] => {
  const today = new Date();
  
  return [
    {
      id: 'mock-1',
      title: 'Visita - Apartamento Centro',
      description: 'Visita ao apartamento de 2 quartos',
      date: today.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      type: 'VISIT',
      status: 'confirmed',
      agentId: agentId || 'mock-agent',
      contactId: 'mock-contact-1',
      propertyId: 'mock-property-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      title: 'Reunião - Negociação Casa',
      description: 'Reunião para discutir proposta',
      date: today.toISOString().split('T')[0],
      startTime: '14:30',
      endTime: '15:30',
      type: 'MEETING',
      status: 'pending',
      agentId: agentId || 'mock-agent',
      contactId: 'mock-contact-2',
      propertyId: 'mock-property-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
};

const generateMockSlots = (agentId: string, startDate: string, endDate: string): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    
    // Pular domingo
    if (dayOfWeek === 0) continue;
    
    // Horários de trabalho
    const workStart = dayOfWeek === 6 ? 9 : 9;
    const workEnd = dayOfWeek === 6 ? 13 : 18;
    
    for (let hour = workStart; hour < workEnd; hour++) {
      // Pular almoço
      if (hour === 12 && dayOfWeek < 6) continue;
      
      slots.push({
        id: `slot-${dateStr}-${hour}`,
        agentId,
        date: dateStr,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        duration: 60,
        status: Math.random() > 0.7 ? 'BOOKED' : 'AVAILABLE',
        slotType: 'REGULAR',
      });
    }
  }
  
  return slots;
};

const generateMockSchedule = (agentId: string): AgentSchedule => {
  return {
    id: `schedule-${agentId}`,
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
  };
};

// ================================================================
// HOOK PRINCIPAL
// ================================================================

interface UseAgendaV2Options {
  agentId?: string;
  date?: string;
  enableRealtime?: boolean;
  enableOfflineQueue?: boolean;
}

const useAgendaV2 = (options: UseAgendaV2Options = {}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [schedule, setSchedule] = useState<AgentSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('📅 Loading agenda data...');
        
        // Simular delay de carregamento
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const agentId = options.agentId || 'default-agent';
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Carregar dados mockados
        const mockAppointments = generateMockAppointments(agentId);
        const mockSlots = generateMockSlots(agentId, today, nextWeek);
        const mockSchedule = generateMockSchedule(agentId);
        
        setAppointments(mockAppointments);
        setSlots(mockSlots);
        setSchedule(mockSchedule);
        
        console.log('📅 Agenda data loaded:', {
          appointments: mockAppointments.length,
          slots: mockSlots.length,
          schedule: mockSchedule.id
        });
        
      } catch (err) {
        console.error('❌ Error loading agenda data:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [options.agentId, options.date]);

  // Funções de manipulação
  const createAppointment = useCallback(async (appointmentData: Partial<Appointment>) => {
    setIsLoading(true);
    try {
      console.log('📅 Creating appointment:', appointmentData);
      
      const newAppointment: Appointment = {
        id: `appointment-${Date.now()}`,
        title: appointmentData.title || 'Novo Agendamento',
        description: appointmentData.description,
        date: appointmentData.date || new Date().toISOString().split('T')[0],
        startTime: appointmentData.startTime || '09:00',
        endTime: appointmentData.endTime || '10:00',
        type: appointmentData.type || 'VISIT',
        status: appointmentData.status || 'pending',
        agentId: appointmentData.agentId || options.agentId || 'default-agent',
        contactId: appointmentData.contactId || 'unknown-contact',
        propertyId: appointmentData.propertyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setAppointments(prev => [...prev, newAppointment]);
      console.log('✅ Appointment created:', newAppointment.id);
      
      return { success: true, data: newAppointment };
    } catch (err) {
      console.error('❌ Error creating appointment:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    } finally {
      setIsLoading(false);
    }
  }, [options.agentId]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    setIsLoading(true);
    try {
      console.log('📅 Updating appointment:', id, updates);
      
      setAppointments(prev => prev.map(apt => 
        apt.id === id 
          ? { ...apt, ...updates, updatedAt: new Date().toISOString() }
          : apt
      ));
      
      console.log('✅ Appointment updated:', id);
      return { success: true };
    } catch (err) {
      console.error('❌ Error updating appointment:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      console.log('📅 Deleting appointment:', id);
      
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      
      console.log('✅ Appointment deleted:', id);
      return { success: true };
    } catch (err) {
      console.error('❌ Error deleting appointment:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bookSlot = useCallback(async (slotId: string) => {
    console.log('📅 Booking slot:', slotId);
    
    setSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { ...slot, status: 'BOOKED' as const }
        : slot
    ));
    
    return { success: true };
  }, []);

  const syncWithGoogle = useCallback(async () => {
    console.log('📅 Sync with Google Calendar (mock)');
    return { success: true, message: 'Sincronização simulada com sucesso' };
  }, []);

  return {
    // Dados
    appointments,
    slots,
    schedule,
    
    // Estados
    isLoading,
    error,
    
    // Funções
    createAppointment,
    updateAppointment,
    deleteAppointment,
    bookSlot,
    syncWithGoogle,
    
    // Funções utilitárias
    refetch: () => {
      console.log('📅 Refetching data...');
      // Reload data
    },
    
    // Compatibilidade
    isOnline: true,
    hasError: !!error,
  };
};

export default useAgendaV2;