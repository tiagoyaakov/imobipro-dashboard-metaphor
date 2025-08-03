import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useDashboardV2 } from '@/hooks/useDashboardV2';
import { usePropertiesV2 } from '@/hooks/usePropertiesV2';
import { useAgendaV2 } from '@/hooks/useAgendaV2';
import { unifiedCache } from '@/lib/cache/UnifiedCache';
import { EventBus } from '@/lib/event-bus';
import { mockWrapper } from '@/tests/utils/test-wrapper';

// Mock das dependências
vi.mock('@/lib/cache/UnifiedCache', () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
    getMetrics: vi.fn(),
    prefetch: vi.fn(),
    optimisticUpdate: vi.fn(),
    clear: vi.fn(),
    cleanup: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
}));

vi.mock('@/lib/event-bus', () => ({
  EventBus: {
    getInstance: vi.fn(() => ({
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    }))
  }
}));

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      role: 'AGENT',
      companyId: 'test-company-id'
    },
    isAuthenticated: true
  })
}));

describe('Cache System Integration Tests', () => {
  let queryClient: QueryClient;
  let wrapper: any;
  let eventBus: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Usar wrapper simples sem JSX
    wrapper = mockWrapper;

    eventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };

    (EventBus.getInstance as any).mockReturnValue(eventBus);

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    vi.resetAllMocks();
  });

  describe('Cross-Hook Data Synchronization', () => {
    it('deve sincronizar dados entre Dashboard e Properties', async () => {
      // Mock de dados para properties
      const mockProperties = [
        { id: '1', title: 'Apt 1', price: 300000, status: 'AVAILABLE' },
        { id: '2', title: 'Casa 1', price: 500000, status: 'SOLD' }
      ];

      // Mock de dados para dashboard
      const mockDashboardData = {
        totalProperties: 2,
        availableProperties: 1,
        soldProperties: 1,
        totalValue: 800000
      };

      (unifiedCache.get as any).mockImplementation((key: string) => {
        if (key.includes('properties')) {
          return Promise.resolve({ data: mockProperties, count: 2 });
        }
        if (key.includes('dashboard')) {
          return Promise.resolve(mockDashboardData);
        }
        return Promise.resolve({ data: [], count: 0 });
      });

      // Renderizar ambos os hooks
      const { result: dashboardResult } = renderHook(() => useDashboardV2(), { wrapper });
      const { result: propertiesResult } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(dashboardResult.current.isLoading).toBe(false);
        expect(propertiesResult.current.isLoading).toBe(false);
      });

      // Criar nova propriedade
      await act(async () => {
        await propertiesResult.current.createProperty({
          title: 'Nova Propriedade',
          price: 400000,
          area: 80,
          type: 'APARTMENT',
          status: 'AVAILABLE',
          address: 'Rua Nova, 123',
          city: 'São Paulo',
          state: 'SP'
        });
      });

      // Dashboard deve invalidar seu cache quando propriedades mudarem
      expect(unifiedCache.invalidate).toHaveBeenCalledWith(
        expect.stringContaining('dashboard')
      );
    });

    it('deve propagar mudanças de agendamentos para dashboard', async () => {
      const mockAppointments = [
        { id: '1', title: 'Visita 1', date: '2025-08-04T10:00:00Z', status: 'CONFIRMED' },
        { id: '2', title: 'Visita 2', date: '2025-08-04T14:00:00Z', status: 'PENDING' }
      ];

      (unifiedCache.get as any).mockImplementation((key: string) => {
        if (key.includes('appointments')) {
          return Promise.resolve({ data: mockAppointments, count: 2 });
        }
        if (key.includes('dashboard')) {
          return Promise.resolve({ appointmentsToday: 2, confirmedToday: 1 });
        }
        return Promise.resolve({ data: [], count: 0 });
      });

      const { result: agendaResult } = renderHook(() => useAgendaV2(), { wrapper });
      const { result: dashboardResult } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(agendaResult.current.isLoading).toBe(false);
        expect(dashboardResult.current.isLoading).toBe(false);
      });

      // Criar novo agendamento
      await act(async () => {
        await agendaResult.current.createAppointment({
          title: 'Nova Visita',
          date: '2025-08-04T16:00:00Z',
          type: 'VISIT',
          status: 'CONFIRMED',
          contactId: 'contact-1',
          estimatedDuration: 60
        });
      });

      // Dashboard deve ser notificado da mudança
      expect(unifiedCache.invalidate).toHaveBeenCalledWith(
        expect.stringContaining('dashboard')
      );
    });
  });

  describe('Event-Driven Cache Invalidation', () => {
    it('deve invalidar caches relacionados quando evento é emitido', async () => {
      const { result: dashboardResult } = renderHook(() => useDashboardV2(), { wrapper });
      const { result: propertiesResult } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(dashboardResult.current.isLoading).toBe(false);
        expect(propertiesResult.current.isLoading).toBe(false);
      });

      // Emitir evento de mudança de dados
      eventBus.emit('data:changed', {
        entity: 'property',
        action: 'created',
        id: 'new-property-id'
      });

      // Verificar se os caches relacionados foram invalidados
      expect(unifiedCache.invalidate).toHaveBeenCalledWith('properties:*');
      expect(unifiedCache.invalidate).toHaveBeenCalledWith('dashboard:*');
    });

    it('deve responder a eventos de conectividade', async () => {
      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simular perda de conexão
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      // Simular volta da conexão
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });

      // Deve sincronizar dados pendentes
      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('offline-queue'),
        expect.any(Object)
      );
    });
  });

  describe('Memory Management and Performance', () => {
    it('deve gerenciar memória adequadamente', async () => {
      // Renderizar múltiplos hooks
      const hooks = [
        renderHook(() => useDashboardV2(), { wrapper }),
        renderHook(() => usePropertiesV2(), { wrapper }),
        renderHook(() => useAgendaV2(), { wrapper })
      ];

      // Aguardar carregamento
      for (const hook of hooks) {
        await waitFor(() => {
          expect(hook.result.current.isLoading).toBe(false);
        });
      }

      // Simular cleanup
      hooks.forEach(hook => hook.unmount());

      // Cache deve fazer cleanup automático
      expect(unifiedCache.cleanup).toHaveBeenCalled();
    });

    it('deve manter performance consistente com múltiplas queries', async () => {
      const startTime = Date.now();

      // Renderizar múltiplos hooks simultaneamente
      const hooks = await Promise.all([
        renderHook(() => useDashboardV2(), { wrapper }),
        renderHook(() => usePropertiesV2(), { wrapper }),
        renderHook(() => useAgendaV2(), { wrapper })
      ]);

      // Aguardar todos carregarem
      await Promise.all(
        hooks.map(hook => 
          waitFor(() => expect(hook.result.current.isLoading).toBe(false))
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance deve ser aceitável mesmo com múltiplas queries
      expect(totalTime).toBeLessThan(200);
    });
  });

  describe('Cache Strategy Coordination', () => {
    it('deve usar estratégias apropriadas por tipo de dados', async () => {
      // Dashboard - DYNAMIC (muda frequentemente)
      const { result: dashboardResult } = renderHook(() => useDashboardV2(), { wrapper });
      
      // Properties - STATIC (muda pouco)
      const { result: propertiesResult } = renderHook(() => usePropertiesV2(), { wrapper });
      
      // Agenda - CRITICAL (importante para negócio)
      const { result: agendaResult } = renderHook(() => useAgendaV2(), { wrapper });

      await waitFor(() => {
        expect(dashboardResult.current.isLoading).toBe(false);
        expect(propertiesResult.current.isLoading).toBe(false);
        expect(agendaResult.current.isLoading).toBe(false);
      });

      // Verificar estratégias corretas
      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('dashboard'),
        expect.objectContaining({ strategy: 'DYNAMIC' })
      );

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({ strategy: 'STATIC' })
      );

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.objectContaining({ strategy: 'CRITICAL' })
      );
    });

    it('deve priorizar dados críticos em situações de alta carga', async () => {
      // Simular alta carga no cache
      (unifiedCache.getMetrics as any).mockReturnValue({
        hitRate: 0.45, // Low hit rate indica alta carga
        size: '95MB',   // Próximo do limite
        operations: 50000
      });

      const { result: agendaResult } = renderHook(() => useAgendaV2(), { wrapper });
      const { result: propertiesResult } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(agendaResult.current.isLoading).toBe(false);
        expect(propertiesResult.current.isLoading).toBe(false);
      });

      // Dados críticos (agenda) devem ter prioridade
      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('appointments'),
        expect.objectContaining({ 
          strategy: 'CRITICAL',
          priority: expect.any(Number)
        })
      );
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('deve lidar com falhas de cache graciosamente', async () => {
      // Simular erro no cache
      (unifiedCache.get as any).mockRejectedValue(new Error('Cache unavailable'));

      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Deve mostrar erro mas não quebrar a aplicação
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });

    it('deve implementar fallback quando cache falha', async () => {
      // Primeira tentativa falha
      (unifiedCache.get as any)
        .mockRejectedValueOnce(new Error('Cache error'))
        .mockResolvedValueOnce({ data: [], count: 0 }); // Fallback

      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Deve ter tentado fallback
      expect(unifiedCache.get).toHaveBeenCalledTimes(2);
      expect(result.current.properties).toEqual([]);
    });

    it('deve se recuperar de erros de rede', async () => {
      // Simular erro de rede seguido de sucesso
      (unifiedCache.get as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ 
          data: [{ id: '1', title: 'Recovered Data' }], 
          count: 1 
        });

      const { result } = renderHook(() => useAgendaV2(), { wrapper });

      // Primeiro deve falhar
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Retry deve funcionar
      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(false);
        expect(result.current.appointments).toHaveLength(1);
      });
    });
  });

  describe('Data Consistency Across Hooks', () => {
    it('deve manter consistência de dados entre hooks', async () => {
      const sharedPropertyData = [
        { id: '1', title: 'Propriedade Compartilhada', status: 'AVAILABLE' }
      ];

      (unifiedCache.get as any).mockResolvedValue({
        data: sharedPropertyData,
        count: 1
      });

      // Múltiplos hooks acessando os mesmos dados
      const { result: propertiesResult } = renderHook(() => usePropertiesV2(), { wrapper });
      const { result: dashboardResult } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(propertiesResult.current.isLoading).toBe(false);
        expect(dashboardResult.current.isLoading).toBe(false);
      });

      // Atualizar dados via properties
      await act(async () => {
        await propertiesResult.current.updateProperty('1', { 
          status: 'SOLD' 
        });
      });

      // Dashboard deve refletir a mudança
      expect(unifiedCache.invalidate).toHaveBeenCalledWith(
        expect.stringContaining('dashboard')
      );
    });
  });
});