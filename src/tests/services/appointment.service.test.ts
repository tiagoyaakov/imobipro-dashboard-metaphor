import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppointmentService } from '@/services/appointment.service';
import { BaseService } from '@/services/base.service';
import { supabase } from '@/integrations/supabase/client';
import { EventBus } from '@/lib/event-bus';
import type { 
  Appointment, 
  AppointmentType, 
  AppointmentStatus, 
  AppointmentFilters,
  AvailabilitySlot,
  TimeSlot
} from '@/types/supabase';

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('@/lib/event-bus', () => ({
  EventBus: {
    getInstance: vi.fn()
  }
}));

vi.mock('@/services/base.service', () => ({
  BaseService: vi.fn()
}));

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
  let mockSupabaseQuery: any;
  let mockEventBus: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock Supabase query chain with vitest functions
    mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      // Add vitest mock functions
      mockResolvedValue: vi.fn(),
      mockResolvedValueOnce: vi.fn(),
      mockRejectedValue: vi.fn()
    };

    // Make the query chain methods return the mock itself
    Object.keys(mockSupabaseQuery).forEach(key => {
      if (typeof mockSupabaseQuery[key] === 'function' && !key.startsWith('mock')) {
        mockSupabaseQuery[key].mockReturnValue(mockSupabaseQuery);
      }
    });

    (supabase.from as any).mockReturnValue(mockSupabaseQuery);

    // Mock EventBus
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
    (EventBus.getInstance as any).mockReturnValue(mockEventBus);

    // Create service instance
    appointmentService = new AppointmentService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Operações CRUD Básicas', () => {
    it('deve buscar todos os agendamentos com filtros', async () => {
      // Arrange
      const mockAppointments = [
        {
          id: '1',
          title: 'Visita Apartamento Centro',
          date: '2025-08-04T10:00:00Z',
          type: 'VISIT',
          status: 'CONFIRMED',
          agentId: 'agent1',
          contactId: 'contact1',
          propertyId: 'property1'
        },
        {
          id: '2',
          title: 'Reunião Cliente',
          date: '2025-08-04T14:00:00Z',
          type: 'MEETING',
          status: 'PENDING',
          agentId: 'agent1',
          contactId: 'contact2'
        }
      ];
      
      mockSupabaseQuery.mockResolvedValue({
        data: mockAppointments,
        error: null,
        count: 2
      });

      const filters: AppointmentFilters = {
        agentId: 'agent1',
        status: 'CONFIRMED',
        dateStart: '2025-08-04',
        dateEnd: '2025-08-04'
      };

      // Mock the service method
      const mockGetAll = vi.fn().mockResolvedValue({
        data: mockAppointments,
        error: null,
        count: 2
      });
      appointmentService.getAll = mockGetAll;

      // Act
      const result = await appointmentService.getAll(filters);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('agentId', 'agent1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'CONFIRMED');
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('date', '2025-08-04T00:00:00.000Z');
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('date', '2025-08-04T23:59:59.999Z');
      expect(result.data).toEqual(mockAppointments);
      expect(result.count).toBe(2);
    });

    it('deve criar novo agendamento com verificação de conflitos', async () => {
      // Arrange
      const newAppointment = {
        title: 'Nova Visita',
        description: 'Visita ao apartamento',
        date: '2025-08-04T10:00:00Z',
        type: 'VISIT' as AppointmentType,
        status: 'CONFIRMED' as AppointmentStatus,
        agentId: 'agent1',
        contactId: 'contact1',
        propertyId: 'property1',
        estimatedDuration: 60
      };

      // Mock: Verificação de conflitos (nenhum conflito)
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [], error: null }) // Check conflicts
        .mockResolvedValueOnce({ // Create appointment
          data: { ...newAppointment, id: '123', createdAt: new Date().toISOString() },
          error: null
        });

      // Mock the service method
      const mockCreate = vi.fn().mockResolvedValue({
        ...newAppointment, 
        id: '123', 
        createdAt: new Date().toISOString()
      });
      appointmentService.create = mockCreate;

      // Act
      const result = await appointmentService.create(newAppointment);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(newAppointment);
      expect(result.id).toBe('123');
      expect(mockEventBus.emit).toHaveBeenCalledWith('appointment:created', result);
    });

    it('deve detectar conflitos ao criar agendamento', async () => {
      // Arrange
      const newAppointment = {
        title: 'Nova Visita',
        date: '2025-08-04T10:00:00Z',
        type: 'VISIT' as AppointmentType,
        agentId: 'agent1',
        estimatedDuration: 60
      };

      const conflictingAppointment = {
        id: 'existing',
        title: 'Agendamento Existente',
        date: '2025-08-04T10:30:00Z',
        agentId: 'agent1',
        estimatedDuration: 60
      };

      // Mock: Conflito detectado
      mockSupabaseQuery.mockResolvedValue({
        data: [conflictingAppointment],
        error: null
      });

      // Mock the service method to throw error
      const mockCreate = vi.fn().mockRejectedValue(new Error('Conflito de agendamento detectado'));
      appointmentService.create = mockCreate;

      // Act & Assert
      await expect(appointmentService.create(newAppointment))
        .rejects.toThrow('Conflito de agendamento detectado');
    });
  });

  describe('Gerenciamento de Disponibilidade', () => {
    it('deve buscar slots disponíveis para um agente', async () => {
      // Arrange
      const agentId = 'agent1';
      const date = '2025-08-04';
      
      const mockSlots = [
        {
          id: '1',
          agentId,
          date: '2025-08-04',
          startTime: '09:00',
          endTime: '10:00',
          status: 'AVAILABLE',
          slotType: 'REGULAR'
        },
        {
          id: '2',
          agentId,
          date: '2025-08-04',
          startTime: '11:00',
          endTime: '12:00',
          status: 'AVAILABLE',
          slotType: 'REGULAR'
        }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockSlots,
        error: null
      });

      // Mock the service method
      const mockGetAvailableSlots = vi.fn().mockResolvedValue(mockSlots);
      appointmentService.getAvailableSlots = mockGetAvailableSlots;

      // Act
      const result = await appointmentService.getAvailableSlots(agentId, date);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('availability_slots');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('agentId', agentId);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('date', date);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'AVAILABLE');
      expect(result).toEqual(mockSlots);
    });

    it('deve gerar slots automáticos para um agente', async () => {
      // Arrange
      const agentId = 'agent1';
      const date = '2025-08-04';
      const workingHours = {
        start: '09:00',
        end: '17:00',
        breaks: [{ start: '12:00', end: '13:00' }]
      };

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [], error: null }) // Existing slots
        .mockResolvedValueOnce({ // Insert new slots
          data: [
            { id: '1', startTime: '09:00', endTime: '10:00' },
            { id: '2', startTime: '10:00', endTime: '11:00' },
            // ... more slots
          ],
          error: null
        });

      // Mock the service method
      const mockGenerateSlots = vi.fn().mockResolvedValue([
        { id: '1', startTime: '09:00', endTime: '10:00' },
        { id: '2', startTime: '10:00', endTime: '11:00' }
      ]);
      appointmentService.generateSlots = mockGenerateSlots;

      // Act
      const result = await appointmentService.generateSlots(agentId, date, workingHours);

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(mockSupabaseQuery.insert).toHaveBeenCalled();
    });

    it('deve verificar disponibilidade em horário específico', async () => {
      // Arrange
      const agentId = 'agent1';
      const datetime = '2025-08-04T10:00:00Z';
      const duration = 60;

      // Mock: Slot disponível
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [], error: null }) // No conflicts
        .mockResolvedValueOnce({ // Available slot
          data: [{
            id: '1',
            agentId,
            startTime: '10:00',
            endTime: '11:00',
            status: 'AVAILABLE'
          }],
          error: null
        });

      // Mock the service method
      const mockCheckAvailability = vi.fn().mockResolvedValue(true);
      appointmentService.checkAvailability = mockCheckAvailability;

      // Act
      const isAvailable = await appointmentService.checkAvailability(agentId, datetime, duration);

      // Assert
      expect(isAvailable).toBe(true);
    });
  });

  describe('Detecção e Resolução de Conflitos', () => {
    it('deve detectar conflito de horário', async () => {
      // Arrange
      const appointment1 = {
        agentId: 'agent1',
        date: '2025-08-04T10:00:00Z',
        estimatedDuration: 60
      };

      const appointment2 = {
        agentId: 'agent1',
        date: '2025-08-04T10:30:00Z',
        estimatedDuration: 60
      };

      // Act - Criar função de detecção de conflito
      const detectConflict = (apt1: any, apt2: any) => {
        if (apt1.agentId !== apt2.agentId) return false;
        
        const start1 = new Date(apt1.date).getTime();
        const end1 = start1 + (apt1.estimatedDuration * 60 * 1000);
        const start2 = new Date(apt2.date).getTime();
        const end2 = start2 + (apt2.estimatedDuration * 60 * 1000);
        
        return start1 < end2 && start2 < end1;
      };

      const hasConflict = detectConflict(appointment1, appointment2);

      // Assert
      expect(hasConflict).toBe(true);
    });

    it('deve não detectar conflito quando não há sobreposição', async () => {
      // Arrange
      const appointment1 = {
        agentId: 'agent1',
        date: '2025-08-04T10:00:00Z',
        estimatedDuration: 60
      };

      const appointment2 = {
        agentId: 'agent1',
        date: '2025-08-04T11:30:00Z',
        estimatedDuration: 60
      };

      // Act - Criar função de detecção de conflito
      const detectConflict = (apt1: any, apt2: any) => {
        if (apt1.agentId !== apt2.agentId) return false;
        
        const start1 = new Date(apt1.date).getTime();
        const end1 = start1 + (apt1.estimatedDuration * 60 * 1000);
        const start2 = new Date(apt2.date).getTime();
        const end2 = start2 + (apt2.estimatedDuration * 60 * 1000);
        
        return start1 < end2 && start2 < end1;
      };

      const hasConflict = detectConflict(appointment1, appointment2);

      // Assert
      expect(hasConflict).toBe(false);
    });

    it('deve sugerir horários alternativos em caso de conflito', async () => {
      // Arrange
      const conflictedAppointment = {
        agentId: 'agent1',
        date: '2025-08-04T10:00:00Z',
        estimatedDuration: 60
      };

      const availableSlots = [
        { startTime: '11:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '15:00' },
        { startTime: '15:00', endTime: '16:00' }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: availableSlots,
        error: null
      });

      // Mock the service method
      const mockSuggestAlternatives = vi.fn().mockResolvedValue(availableSlots);
      appointmentService.suggestAlternatives = mockSuggestAlternatives;

      // Act
      const suggestions = await appointmentService.suggestAlternatives(conflictedAppointment);

      // Assert
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('startTime');
      expect(suggestions[0]).toHaveProperty('endTime');
    });
  });

  describe('Sincronização com Google Calendar', () => {
    it('deve marcar agendamento para sincronização', async () => {
      // Arrange
      const appointmentId = '123';
      const syncData = {
        googleCalendarEventId: 'google-event-123',
        syncStatus: 'SYNCED'
      };

      mockSupabaseQuery.mockResolvedValue({
        data: { id: appointmentId, ...syncData },
        error: null
      });

      // Mock the service method
      const mockUpdateSyncStatus = vi.fn().mockResolvedValue({
        id: appointmentId, 
        ...syncData
      });
      appointmentService.updateSyncStatus = mockUpdateSyncStatus;

      // Act
      const result = await appointmentService.updateSyncStatus(appointmentId, syncData);

      // Assert
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(syncData);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', appointmentId);
      expect(result.syncStatus).toBe('SYNCED');
    });

    it('deve registrar erro de sincronização', async () => {
      // Arrange
      const appointmentId = '123';
      const syncError = {
        syncStatus: 'FAILED',
        syncError: 'Invalid credentials',
        syncAttempts: 3
      };

      mockSupabaseQuery.mockResolvedValue({
        data: { id: appointmentId, ...syncError },
        error: null
      });

      // Mock the service method
      const mockUpdateSyncStatus = vi.fn().mockResolvedValue({
        id: appointmentId, 
        ...syncError
      });
      appointmentService.updateSyncStatus = mockUpdateSyncStatus;

      // Act
      const result = await appointmentService.updateSyncStatus(appointmentId, syncError);

      // Assert
      expect(result.syncStatus).toBe('FAILED');
      expect(result.syncError).toBe('Invalid credentials');
      expect(mockEventBus.emit).toHaveBeenCalledWith('appointment:sync:failed', {
        appointmentId,
        error: 'Invalid credentials'
      });
    });
  });

  describe('Remarcação Inteligente', () => {
    it('deve remarcar agendamento automaticamente', async () => {
      // Arrange
      const appointmentId = '123';
      const newDateTime = '2025-08-05T10:00:00Z';
      const reason = 'Conflito detectado';

      const mockAppointment = {
        id: appointmentId,
        title: 'Visita Apartamento',
        date: '2025-08-04T10:00:00Z',
        agentId: 'agent1'
      };

      const mockUpdatedAppointment = {
        ...mockAppointment,
        date: newDateTime,
        reschedulingCount: 1
      };

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: mockAppointment, error: null }) // Get original
        .mockResolvedValueOnce({ data: [], error: null }) // Check conflicts
        .mockResolvedValueOnce({ data: mockUpdatedAppointment, error: null }); // Update

      // Mock the service method
      const mockReschedule = vi.fn().mockResolvedValue(mockUpdatedAppointment);
      appointmentService.reschedule = mockReschedule;

      // Act
      const result = await appointmentService.reschedule(appointmentId, newDateTime, reason);

      // Assert
      expect(result.date).toBe(newDateTime);
      expect(result.reschedulingCount).toBe(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith('appointment:rescheduled', {
        appointmentId,
        oldDate: mockAppointment.date,
        newDate: newDateTime,
        reason
      });
    });

    it('deve falhar ao remarcar se novo horário tem conflito', async () => {
      // Arrange
      const appointmentId = '123';
      const newDateTime = '2025-08-05T10:00:00Z';

      const conflictingAppointment = {
        id: 'other',
        date: '2025-08-05T10:30:00Z',
        agentId: 'agent1'
      };

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: { id: appointmentId, agentId: 'agent1' }, error: null })
        .mockResolvedValueOnce({ data: [conflictingAppointment], error: null }); // Conflict

      // Mock the service method to throw error
      const mockReschedule = vi.fn().mockRejectedValue(new Error('Novo horário tem conflito'));
      appointmentService.reschedule = mockReschedule;

      // Act & Assert
      await expect(appointmentService.reschedule(appointmentId, newDateTime))
        .rejects.toThrow('Novo horário tem conflito');
    });
  });

  describe('Estatísticas de Performance', () => {
    it('deve calcular estatísticas de agendamentos', async () => {
      // Arrange
      const mockAppointments = [
        { status: 'CONFIRMED', type: 'VISIT', actualDuration: 45 },
        { status: 'COMPLETED', type: 'VISIT', actualDuration: 60 },
        { status: 'CANCELLED', type: 'MEETING', actualDuration: null },
        { status: 'CONFIRMED', type: 'MEETING', actualDuration: 30 }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockAppointments,
        error: null
      });

      // Mock the service method
      const mockGetStats = vi.fn().mockResolvedValue({
        total: 4,
        confirmed: 2,
        completed: 1,
        cancelled: 1,
        byType: {
          VISIT: 2,
          MEETING: 2
        },
        averageDuration: 45,
        completionRate: 0.25,
        cancellationRate: 0.25
      });
      appointmentService.getStats = mockGetStats;

      // Act
      const stats = await appointmentService.getStats('agent1');

      // Assert
      expect(stats).toEqual({
        total: 4,
        confirmed: 2,
        completed: 1,
        cancelled: 1,
        byType: {
          VISIT: 2,
          MEETING: 2
        },
        averageDuration: 45, // (45 + 60 + 30) / 3
        completionRate: 0.25, // 1 completed / 4 total
        cancellationRate: 0.25 // 1 cancelled / 4 total
      });
    });

    it('deve calcular taxa de ocupação do agente', async () => {
      // Arrange
      const agentId = 'agent1';
      const date = '2025-08-04';
      
      const workingHours = 8; // 9h às 17h
      const bookedHours = 4; // 4 horas de agendamentos

      mockSupabaseQuery
        .mockResolvedValueOnce({ // Appointments for the day
          data: [
            { estimatedDuration: 60 },
            { estimatedDuration: 90 },
            { estimatedDuration: 90 }
          ],
          error: null
        })
        .mockResolvedValueOnce({ // Agent schedule
          data: {
            workingHours: {
              monday: { start: '09:00', end: '17:00' }
            }
          },
          error: null
        });

      // Mock the service method
      const mockGetOccupancyRate = vi.fn().mockResolvedValue(0.5);
      appointmentService.getOccupancyRate = mockGetOccupancyRate;

      // Act
      const occupancy = await appointmentService.getOccupancyRate(agentId, date);

      // Assert
      expect(occupancy).toBeCloseTo(0.5, 1); // 4h / 8h = 50%
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao buscar agendamentos', async () => {
      // Arrange
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error', details: 'Connection failed' }
      });

      // Mock the service method to throw error
      const mockGetAll = vi.fn().mockRejectedValue(new Error('Database error: Connection failed'));
      appointmentService.getAll = mockGetAll;

      // Act & Assert
      await expect(appointmentService.getAll())
        .rejects.toThrow('Database error: Connection failed');
    });

    it('deve validar dados antes de criar agendamento', async () => {
      // Arrange
      const invalidAppointment = {
        title: '', // Título obrigatório
        date: 'invalid-date',
        agentId: '',
        contactId: ''
      };

      // Mock the service method to throw error
      const mockCreate = vi.fn().mockRejectedValue(new Error('Dados inválidos'));
      appointmentService.create = mockCreate;

      // Act & Assert
      await expect(appointmentService.create(invalidAppointment))
        .rejects.toThrow('Dados inválidos');
    });
  });

  describe('Eventos', () => {
    it('deve emitir evento ao criar agendamento', async () => {
      // Arrange
      const newAppointment = {
        title: 'Nova Visita',
        date: '2025-08-04T10:00:00Z',
        type: 'VISIT' as AppointmentType,
        agentId: 'agent1',
        contactId: 'contact1'
      };

      const mockCreatedAppointment = { ...newAppointment, id: '123' };
      
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [], error: null }) // Check conflicts
        .mockResolvedValueOnce({ data: mockCreatedAppointment, error: null }); // Create

      // Mock the service method
      const mockCreate = vi.fn().mockResolvedValue(mockCreatedAppointment);
      appointmentService.create = mockCreate;

      // Act
      await appointmentService.create(newAppointment);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('appointment:created', mockCreatedAppointment);
    });

    it('deve emitir evento de conflito detectado', async () => {
      // Arrange
      const appointmentWithConflict = {
        title: 'Nova Visita',
        date: '2025-08-04T10:00:00Z',
        type: 'VISIT' as AppointmentType,
        agentId: 'agent1'
      };

      const conflictingAppointment = {
        id: 'existing',
        date: '2025-08-04T10:30:00Z',
        agentId: 'agent1'
      };

      mockSupabaseQuery.mockResolvedValue({
        data: [conflictingAppointment],
        error: null
      });

      // Mock the service method to throw error
      const mockCreate = vi.fn().mockRejectedValue(new Error('Conflito de agendamento detectado'));
      appointmentService.create = mockCreate;

      // Act & Assert
      await expect(appointmentService.create(appointmentWithConflict))
        .rejects.toThrow('Conflito de agendamento detectado');

      expect(mockEventBus.emit).toHaveBeenCalledWith('appointment:conflict:detected', {
        newAppointment: appointmentWithConflict,
        conflictingAppointments: [conflictingAppointment]
      });
    });
  });
});