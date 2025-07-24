import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Appointment, 
  CreateAppointmentForm, 
  UpdateAppointmentForm, 
  AppointmentFilters,
  AppointmentResponse,
  AppointmentsResponse,
  UseAppointmentsReturn
} from '@/types/agenda';

// =====================================================
// CONSTANTES PARA QUERY KEYS
// =====================================================

const APPOINTMENT_KEYS = {
  all: ['appointments'] as const,
  lists: () => [...APPOINTMENT_KEYS.all, 'list'] as const,
  list: (filters: AppointmentFilters) => [...APPOINTMENT_KEYS.lists(), filters] as const,
  details: () => [...APPOINTMENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...APPOINTMENT_KEYS.details(), id] as const,
  agent: (agentId: string) => [...APPOINTMENT_KEYS.all, 'agent', agentId] as const,
  contact: (contactId: string) => [...APPOINTMENT_KEYS.all, 'contact', contactId] as const,
  property: (propertyId: string) => [...APPOINTMENT_KEYS.all, 'property', propertyId] as const,
  dateRange: (start: Date, end: Date) => [...APPOINTMENT_KEYS.all, 'dateRange', start, end] as const,
  today: () => [...APPOINTMENT_KEYS.all, 'today'] as const,
  upcoming: () => [...APPOINTMENT_KEYS.all, 'upcoming'] as const,
  pending: () => [...APPOINTMENT_KEYS.all, 'pending'] as const,
  confirmed: () => [...APPOINTMENT_KEYS.all, 'confirmed'] as const,
  completed: () => [...APPOINTMENT_KEYS.all, 'completed'] as const,
};

// =====================================================
// FUNÇÕES DE API (MOCKADAS POR ENQUANTO)
// =====================================================

// Mock de dados para demonstração
const mockAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Visita - Apartamento Centro',
    description: 'Visita ao apartamento no centro da cidade',
    type: 'PROPERTY_VIEWING' as const,
    status: 'CONFIRMED' as const,
    startTime: new Date('2024-12-01T09:00:00'),
    endTime: new Date('2024-12-01T10:00:00'),
    agentId: 'agent1',
    contactId: 'contact1',
    propertyId: 'prop1',
    notes: 'Cliente interessado em financiamento',
    autoAssigned: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Reunião - Negociação Casa Jardins',
    description: 'Reunião para fechar negócio da casa',
    type: 'NEGOTIATION' as const,
    status: 'SCHEDULED' as const,
    startTime: new Date('2024-12-01T14:30:00'),
    endTime: new Date('2024-12-01T15:30:00'),
    agentId: 'agent2',
    contactId: 'contact2',
    propertyId: 'prop2',
    notes: 'Trazer documentação do financiamento',
    autoAssigned: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Follow-up - Cobertura Vila Madalena',
    description: 'Acompanhamento pós-visita',
    type: 'FOLLOW_UP' as const,
    status: 'SCHEDULED' as const,
    startTime: new Date('2024-12-02T10:00:00'),
    endTime: new Date('2024-12-02T11:00:00'),
    agentId: 'agent1',
    contactId: 'contact3',
    propertyId: 'prop3',
    notes: 'Cliente quer ver mais opções',
    autoAssigned: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Função para filtrar agendamentos
const filterAppointments = (appointments: Appointment[], filters: AppointmentFilters): Appointment[] => {
  return appointments.filter(appointment => {
    // Filtro por agente
    if (filters.agentId && appointment.agentId !== filters.agentId) {
      return false;
    }

    // Filtro por contato
    if (filters.contactId && appointment.contactId !== filters.contactId) {
      return false;
    }

    // Filtro por propriedade
    if (filters.propertyId && appointment.propertyId !== filters.propertyId) {
      return false;
    }

    // Filtro por status
    if (filters.status && filters.status.length > 0 && !filters.status.includes(appointment.status)) {
      return false;
    }

    // Filtro por tipo
    if (filters.type && filters.type.length > 0 && !filters.type.includes(appointment.type)) {
      return false;
    }

    // Filtro por período
    if (filters.dateFrom && appointment.startTime < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && appointment.startTime > filters.dateTo) {
      return false;
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        appointment.title.toLowerCase().includes(searchLower) ||
        appointment.description?.toLowerCase().includes(searchLower) ||
        appointment.notes?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
};

// API Functions (mockadas)
const appointmentApi = {
  // Buscar agendamentos
  getAppointments: async (filters: AppointmentFilters = {}): Promise<AppointmentsResponse> => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const filteredAppointments = filterAppointments(mockAppointments, filters);
    
    return {
      success: true,
      data: filteredAppointments,
      total: filteredAppointments.length,
      page: 1,
      limit: 50
    };
  },

  // Buscar agendamento por ID
  getAppointment: async (id: string): Promise<AppointmentResponse> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const appointment = mockAppointments.find(a => a.id === id);
    
    if (!appointment) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      };
    }

    return {
      success: true,
      data: appointment
    };
  },

  // Criar agendamento
  createAppointment: async (data: CreateAppointmentForm): Promise<AppointmentResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      status: 'SCHEDULED',
      agentId: data.agentId,
      contactId: data.contactId,
      propertyId: data.propertyId,
      notes: data.notes,
      autoAssigned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Adicionar ao mock (em produção seria salvo no banco)
    mockAppointments.push(newAppointment);

    return {
      success: true,
      data: newAppointment
    };
  },

  // Atualizar agendamento
  updateAppointment: async (id: string, data: UpdateAppointmentForm): Promise<AppointmentResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const appointmentIndex = mockAppointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      };
    }

    const updatedAppointment = {
      ...mockAppointments[appointmentIndex],
      ...data,
      updatedAt: new Date()
    };

    mockAppointments[appointmentIndex] = updatedAppointment;

    return {
      success: true,
      data: updatedAppointment
    };
  },

  // Excluir agendamento
  deleteAppointment: async (id: string): Promise<AppointmentResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const appointmentIndex = mockAppointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      };
    }

    const deletedAppointment = mockAppointments[appointmentIndex];
    mockAppointments.splice(appointmentIndex, 1);

    return {
      success: true,
      data: deletedAppointment
    };
  }
};

// =====================================================
// HOOK PRINCIPAL useAppointments
// =====================================================

export const useAppointments = (filters: AppointmentFilters = {}): UseAppointmentsReturn => {
  const queryClient = useQueryClient();

  // Query para buscar agendamentos
  const {
    data: appointmentsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: APPOINTMENT_KEYS.list(filters),
    queryFn: () => appointmentApi.getAppointments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar agendamento
  const createMutation = useMutation({
    mutationFn: appointmentApi.createAppointment,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.today() });
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.upcoming() });
    },
  });

  // Mutation para atualizar agendamento
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentForm }) =>
      appointmentApi.updateAppointment(id, data),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.today() });
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.upcoming() });
    },
  });

  // Mutation para excluir agendamento
  const deleteMutation = useMutation({
    mutationFn: appointmentApi.deleteAppointment,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.today() });
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.upcoming() });
    },
  });

  // Funções expostas
  const createAppointment = async (data: CreateAppointmentForm) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  };

  const updateAppointment = async (id: string, data: UpdateAppointmentForm) => {
    try {
      await updateMutation.mutateAsync({ id, data });
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      throw error;
    }
  };

  return {
    appointments: appointmentsData?.data || [],
    isLoading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: error?.message || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || null,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch
  };
};

// =====================================================
// HOOKS ESPECIALIZADOS
// =====================================================

// Hook para buscar agendamento específico
export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.detail(id),
    queryFn: () => appointmentApi.getAppointment(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para agendamentos de hoje
export const useTodayAppointments = () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return useQuery({
    queryKey: APPOINTMENT_KEYS.today(),
    queryFn: () => appointmentApi.getAppointments({
      dateFrom: startOfDay,
      dateTo: endOfDay
    }),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Hook para agendamentos futuros
export const useUpcomingAppointments = (days: number = 7) => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  return useQuery({
    queryKey: APPOINTMENT_KEYS.upcoming(),
    queryFn: () => appointmentApi.getAppointments({
      dateFrom: today,
      dateTo: endDate
    }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para agendamentos por agente
export const useAgentAppointments = (agentId: string) => {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.agent(agentId),
    queryFn: () => appointmentApi.getAppointments({ agentId }),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para agendamentos por contato
export const useContactAppointments = (contactId: string) => {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.contact(contactId),
    queryFn: () => appointmentApi.getAppointments({ contactId }),
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para agendamentos por propriedade
export const usePropertyAppointments = (propertyId: string) => {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.property(propertyId),
    queryFn: () => appointmentApi.getAppointments({ propertyId }),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para agendamentos pendentes
export const usePendingAppointments = () => {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.pending(),
    queryFn: () => appointmentApi.getAppointments({ status: ['SCHEDULED'] }),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para agendamentos confirmados
export const useConfirmedAppointments = () => {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.confirmed(),
    queryFn: () => appointmentApi.getAppointments({ status: ['CONFIRMED'] }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para agendamentos concluídos
export const useCompletedAppointments = () => {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.completed(),
    queryFn: () => appointmentApi.getAppointments({ status: ['COMPLETED'] }),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// =====================================================
// UTILITÁRIOS
// =====================================================

// Função para invalidar todas as queries de agendamentos
export const invalidateAppointmentQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
};

// Função para pré-carregar agendamentos
export const prefetchAppointments = async (queryClient: any, filters: AppointmentFilters = {}) => {
  await queryClient.prefetchQuery({
    queryKey: APPOINTMENT_KEYS.list(filters),
    queryFn: () => appointmentApi.getAppointments(filters),
  });
}; 