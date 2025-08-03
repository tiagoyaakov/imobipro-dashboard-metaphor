import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useAgendaV2 } from '@/hooks/useAgendaV2';
import { unifiedCache } from '@/lib/cache/UnifiedCache';
import { mockWrapper } from '@/tests/utils/test-wrapper';
import type { AppointmentFilters, AppointmentStatus, AppointmentType } from '@/types/supabase';

// Mock das dependências
vi.mock('@/lib/cache/UnifiedCache', () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
    getMetrics: vi.fn(),
    prefetch: vi.fn(),
    optimisticUpdate: vi.fn(),
    getOfflineQueue: vi.fn(),
    addToOfflineQueue: vi.fn()
  }
}));

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'test-agent-id',
      role: 'AGENT',
      companyId: 'test-company-id'
    },
    isAuthenticated: true
  })
}));

describe('useAgendaV2', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  const mockAppointments = [
    {
      id: '1',
      title: 'Visita Apartamento Centro',
      description: 'Visita com cliente interessado',
      date: '2025-08-04T10:00:00Z',
      type: 'VISIT' as AppointmentType,
      status: 'CONFIRMED' as AppointmentStatus,
      agentId: 'test-agent-id',
      contactId: 'contact-1',
      propertyId: 'property-1',
      estimatedDuration: 60,
      createdAt: '2025-08-01T00:00:00Z',
      updatedAt: '2025-08-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Reunião Cliente Silva',
      description: 'Discussão sobre proposta',
      date: '2025-08-04T14:00:00Z',
      type: 'MEETING' as AppointmentType,
      status: 'PENDING' as AppointmentStatus,
      agentId: 'test-agent-id',
      contactId: 'contact-2',
      estimatedDuration: 90,
      createdAt: '2025-08-01T00:00:00Z',
      updatedAt: '2025-08-01T00:00:00Z'
    }
  ];

  const mockAvailableSlots = [
    {
      id: 'slot-1',
      agentId: 'test-agent-id',
      date: '2025-08-04',
      startTime: '09:00',
      endTime: '10:00',
      status: 'AVAILABLE',
      slotType: 'REGULAR'
    },
    {
      id: 'slot-2',
      agentId: 'test-agent-id',
      date: '2025-08-04',
      startTime: '11:00',
      endTime: '12:00',
      status: 'AVAILABLE',
      slotType: 'REGULAR'
    }
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Usar wrapper simples sem JSX
    wrapper = mockWrapper;

    vi.clearAllMocks();
    
    // Mock padrão para agendamentos
    (unifiedCache.get as any).mockImplementation((key: string) => {
      if (key.includes('appointments')) {
        return Promise.resolve({
          data: mockAppointments,
          count: mockAppointments.length
        });
      }
      if (key.includes('available-slots')) {
        return Promise.resolve({
          data: mockAvailableSlots,
          count: mockAvailableSlots.length
        });
      }
      return Promise.resolve({ data: [], count: 0 });
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.resetAllMocks();
  });

  describe('Funcionalidade Básica', () => {
    it('deve carregar agendamentos do agente', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointments).toEqual(mockAppointments);
      expect(result.current.count).toBe(2);
      expect(result.current.isError).toBe(false);
    });

    it('deve usar estratégia de cache CRITICAL por padrão', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.objectContaining({
          strategy: 'CRITICAL'
        })
      );
    });

    it('deve carregar slots disponíveis', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loadAvailableSlots('2025-08-04');
      });

      expect(result.current.availableSlots).toEqual(mockAvailableSlots);
    });
  });

  describe('Operações CRUD Offline-First', () => {
    it('deve criar agendamento com suporte offline', async () => {
      const newAppointment = {
        title: 'Nova Visita',
        description: 'Cliente novo',
        date: '2025-08-05T10:00:00Z',
        type: 'VISIT' as AppointmentType,
        status: 'CONFIRMED' as AppointmentStatus,
        contactId: 'contact-3',
        propertyId: 'property-2',
        estimatedDuration: 60
      };

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createAppointment(newAppointment);
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.any(Function)
      );
    });

    it('deve adicionar à fila offline quando sem internet', async () => {
      // Simular erro de rede
      (unifiedCache.optimisticUpdate as any).mockRejectedValue(new Error('Network error'));

      const newAppointment = {
        title: 'Agendamento Offline',
        date: '2025-08-05T15:00:00Z',
        type: 'MEETING' as AppointmentType,
        contactId: 'contact-4',
        estimatedDuration: 45
      };

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createAppointment(newAppointment);
      });

      expect(unifiedCache.addToOfflineQueue).toHaveBeenCalledWith({
        operation: 'CREATE',
        entity: 'appointment',
        data: newAppointment,
        timestamp: expect.any(Number)
      });
    });

    it('deve atualizar agendamento com verificação de conflitos', async () => {
      const updateData = {
        title: 'Visita ATUALIZADA',
        date: '2025-08-04T11:00:00Z'
      };

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateAppointment('1', updateData);
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalled();
    });

    it('deve cancelar agendamento com notificação', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelAppointment('1', 'Cliente cancelou');
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.any(Function)
      );
    });
  });

  describe('Detecção e Resolução de Conflitos', () => {
    it('deve detectar conflito de horário', async () => {
      const conflictingAppointment = {
        title: 'Agendamento Conflitante',
        date: '2025-08-04T10:30:00Z', // Sobrepõe com appointment id:1
        type: 'VISIT' as AppointmentType,
        contactId: 'contact-5',
        estimatedDuration: 60
      };

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const hasConflict = await result.current.checkConflict(conflictingAppointment);

      expect(hasConflict).toBe(true);
    });

    it('deve sugerir horários alternativos', async () => {
      const conflictedAppointment = {
        date: '2025-08-04T10:30:00Z',
        estimatedDuration: 60
      };

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.suggestAlternatives(conflictedAppointment);
      });

      expect(result.current.suggestions).toBeInstanceOf(Array);
      expect(result.current.suggestions.length).toBeGreaterThan(0);
    });

    it('deve resolver conflito automaticamente', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resolveConflict('1', '2', 'AUTO_RESOLVE');
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalled();
    });
  });

  describe('Sincronização com Google Calendar', () => {
    it('deve marcar para sincronização com Google Calendar', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.syncWithGoogleCalendar('1');
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalledWith(
        expect.stringContaining('appointments:1'),
        expect.any(Function)
      );
    });

    it('deve lidar com erros de sincronização', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSyncError('1', 'Invalid credentials');
      });

      expect(result.current.syncErrors).toContain('1');
    });
  });

  describe('Geração e Gestão de Slots', () => {
    it('deve gerar slots automáticos para agente', async () => {
      const workingHours = {
        start: '09:00',
        end: '17:00',
        breaks: [{ start: '12:00', end: '13:00' }]
      };

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.generateSlots('2025-08-05', workingHours);
      });

      expect(unifiedCache.set).toHaveBeenCalledWith(
        expect.stringContaining('slots'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('deve bloquear slot específico', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.blockSlot('slot-1', 'Bloqueio manual');
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalled();
    });

    it('deve liberar slot bloqueado', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.unblockSlot('slot-1');
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalled();
    });
  });

  describe('Filtros e Busca', () => {
    it('deve filtrar agendamentos por data', async () => {
      const filters: AppointmentFilters = {
        dateStart: '2025-08-04',
        dateEnd: '2025-08-04'
      };

      const { result } = renderHook(
        () => useAgendaV2({ filters }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.objectContaining({
          filters
        })
      );
    });

    it('deve filtrar por status e tipo', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.filterBy({
          status: 'CONFIRMED',
          type: 'VISIT'
        });
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.objectContaining({
          filters: {
            status: 'CONFIRMED',
            type: 'VISIT'
          }
        })
      );
    });

    it('deve buscar por texto', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.search('Centro');
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.objectContaining({
          filters: {
            search: 'Centro'
          }
        })
      );
    });
  });

  describe('Funcionalidades Offline', () => {
    it('deve funcionar offline com cache local', async () => {
      // Simular modo offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Deve carregar dados do cache
      expect(result.current.appointments).toEqual(mockAppointments);
      expect(result.current.isOffline).toBe(true);
    });

    it('deve mostrar fila offline', async () => {
      const mockOfflineQueue = [
        {
          id: '1',
          operation: 'CREATE',
          entity: 'appointment',
          data: { title: 'Offline Appointment' },
          timestamp: Date.now()
        }
      ];

      (unifiedCache.getOfflineQueue as any).mockReturnValue(mockOfflineQueue);

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.offlineQueue).toEqual(mockOfflineQueue);
    });

    it('deve sincronizar fila offline quando voltar online', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simular volta online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });

      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(unifiedCache.get).toHaveBeenCalledWith(
          expect.stringContaining('offline-queue'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Estatísticas e Métricas', () => {
    it('deve calcular estatísticas de agendamentos', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loadStats();
      });

      expect(result.current.stats).toEqual({
        total: expect.any(Number),
        confirmed: expect.any(Number),
        completed: expect.any(Number),
        cancelled: expect.any(Number),
        byType: expect.any(Object),
        averageDuration: expect.any(Number),
        completionRate: expect.any(Number)
      });
    });

    it('deve calcular taxa de ocupação', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.calculateOccupancy('2025-08-04');
      });

      expect(result.current.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(result.current.occupancyRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Remarcação Inteligente', () => {
    it('deve remarcar agendamento automaticamente', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.reschedule('1', '2025-08-05T10:00:00Z', 'Cliente solicitou');
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.any(Function)
      );
    });

    it('deve encontrar próximo slot disponível', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const nextSlot = await result.current.findNextAvailableSlot(60);

      expect(nextSlot).toHaveProperty('startTime');
      expect(nextSlot).toHaveProperty('endTime');
    });
  });

  describe('Performance e Cache', () => {
    it('deve ter performance superior ao V1', async () => {
      const startTime = Date.now();
      
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // V2 deve ser mais rápido devido ao cache
      expect(responseTime).toBeLessThan(100);
    });

    it('deve fornecer métricas de cache', async () => {
      const mockCacheMetrics = {
        hitRate: 0.92,
        size: '1.8MB',
        operations: 845
      };

      (unifiedCache.getMetrics as any).mockReturnValue(mockCacheMetrics);

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cacheMetrics).toEqual(mockCacheMetrics);
    });
  });
});