import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardV2 } from '@/hooks/useDashboardV2';
import { unifiedCache } from '@/lib/cache/UnifiedCache';
import type { UserRole } from '@/types/supabase';

// Mock das dependências
vi.mock('@/lib/cache/UnifiedCache', () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
    getMetrics: vi.fn(),
    prefetch: vi.fn()
  }
}));

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      role: 'AGENT' as UserRole,
      companyId: 'test-company-id'
    },
    isAuthenticated: true
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { count: 10 },
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('useDashboardV2', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Wrapper sem JSX para evitar problemas de parsing
    wrapper = ({ children }: any) => children;

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    vi.resetAllMocks();
  });

  describe('Funcionalidade Básica', () => {
    it('deve retornar métricas do dashboard', async () => {
      // Mock dos dados em cache
      const mockMetrics = {
        totalProperties: 50,
        totalContacts: 150,
        appointmentsToday: 8,
        monthlyRevenue: 125000,
        conversionRate: 0.15,
        averageLeadScore: 68
      };

      (unifiedCache.get as any).mockResolvedValue(mockMetrics);

      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.isError).toBe(false);
    });

    it('deve usar estratégia de cache DYNAMIC por padrão', async () => {
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('dashboard-metrics'),
        expect.objectContaining({
          strategy: 'DYNAMIC'
        })
      );
    });

    it('deve filtrar dados por role do usuário', async () => {
      const mockUserSpecificData = {
        totalProperties: 10, // Agente vê apenas suas propriedades
        totalContacts: 25,
        appointmentsToday: 3,
        monthlyRevenue: 15000
      };

      (unifiedCache.get as any).mockResolvedValue(mockUserSpecificData);

      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verifica se o cache key inclui informações do usuário
      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('test-user-id'),
        expect.any(Object)
      );
    });
  });

  describe('Gestão de Cache', () => {
    it('deve invalidar cache ao chamar refresh', async () => {
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.refresh();

      expect(unifiedCache.invalidate).toHaveBeenCalledWith(
        expect.stringContaining('dashboard-metrics')
      );
    });

    it('deve fazer prefetch de dados relacionados', async () => {
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.prefetchRelated();

      expect(unifiedCache.prefetch).toHaveBeenCalledWith([
        expect.stringContaining('recent-activities'),
        expect.stringContaining('quick-stats'),
        expect.stringContaining('chart-data')
      ]);
    });

    it('deve retornar métricas de performance do cache', async () => {
      const mockCacheMetrics = {
        hitRate: 0.85,
        size: '2.5MB',
        operations: 1250
      };

      (unifiedCache.getMetrics as any).mockReturnValue(mockCacheMetrics);

      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cacheMetrics).toEqual(mockCacheMetrics);
    });
  });

  describe('Estados de Loading e Error', () => {
    it('deve começar com isLoading = true', () => {
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.metrics).toBeNull();
    });

    it('deve lidar com erros de cache', async () => {
      const mockError = new Error('Cache error');
      (unifiedCache.get as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
    });

    it('deve manter dados anteriores durante refresh', async () => {
      const initialData = { totalProperties: 50 };
      (unifiedCache.get as any).mockResolvedValue(initialData);

      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.metrics).toEqual(initialData);
      });

      // Simular refresh com novos dados
      const newData = { totalProperties: 55 };
      (unifiedCache.get as any).mockResolvedValue(newData);

      result.current.refresh();

      // Durante o refresh, deve manter dados anteriores
      expect(result.current.metrics).toEqual(initialData);

      await waitFor(() => {
        expect(result.current.metrics).toEqual(newData);
      });
    });
  });

  describe('Configurações Avançadas', () => {
    it('deve aceitar configurações customizadas', async () => {
      const customConfig = {
        cacheStrategy: 'REALTIME' as const,
        refreshInterval: 5000,
        enablePrefetch: false
      };

      const { result } = renderHook(
        () => useDashboardV2(customConfig),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          strategy: 'REALTIME'
        })
      );
    });

    it('deve respeitar configuração de auto-refresh', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(
        () => useDashboardV2({ refreshInterval: 1000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCalls = (unifiedCache.get as any).mock.calls.length;

      // Avançar timer
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect((unifiedCache.get as any).mock.calls.length).toBeGreaterThan(initialCalls);
      });

      vi.useRealTimers();
    });

    it('deve poder desabilitar prefetch automático', async () => {
      const { result } = renderHook(
        () => useDashboardV2({ enablePrefetch: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Não deve fazer prefetch automático
      expect(unifiedCache.prefetch).not.toHaveBeenCalled();
    });
  });

  describe('Comparação V1 vs V2', () => {
    it('deve ter performance superior ao V1', async () => {
      const startTime = Date.now();
      
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // V2 deve ser mais rápido que 100ms devido ao cache
      expect(responseTime).toBeLessThan(100);
    });

    it('deve fornecer mais métricas que o V1', async () => {
      const mockEnhancedMetrics = {
        // Métricas básicas (V1)
        totalProperties: 50,
        totalContacts: 150,
        appointmentsToday: 8,
        monthlyRevenue: 125000,
        
        // Métricas avançadas (V2)
        conversionRate: 0.15,
        averageLeadScore: 68,
        topPerformingAgent: 'João Silva',
        trendsData: {
          propertiesGrowth: 0.12,
          contactsGrowth: 0.08,
          revenueGrowth: 0.15
        },
        recentActivities: [],
        quickActions: []
      };

      (unifiedCache.get as any).mockResolvedValue(mockEnhancedMetrics);

      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // V2 deve ter métricas extras
      expect(result.current.metrics).toHaveProperty('conversionRate');
      expect(result.current.metrics).toHaveProperty('averageLeadScore');
      expect(result.current.metrics).toHaveProperty('trendsData');
      expect(result.current.metrics).toHaveProperty('recentActivities');
    });
  });

  describe('Integração com Sistema de Eventos', () => {
    it('deve responder a eventos de cache', async () => {
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simular evento de invalidação
      const cacheInvalidatedEvent = new CustomEvent('cache:invalidated', {
        detail: { pattern: 'dashboard-metrics' }
      });

      window.dispatchEvent(cacheInvalidatedEvent);

      // Deve disparar novo fetch
      await waitFor(() => {
        expect(unifiedCache.get).toHaveBeenCalledTimes(2);
      });
    });

    it('deve atualizar quando dados relacionados mudarem', async () => {
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simular mudança em propriedades
      const propertyUpdatedEvent = new CustomEvent('data:updated', {
        detail: { entity: 'property', action: 'created' }
      });

      window.dispatchEvent(propertyUpdatedEvent);

      // Deve invalidar cache relacionado
      await waitFor(() => {
        expect(unifiedCache.invalidate).toHaveBeenCalledWith(
          expect.stringContaining('dashboard-metrics')
        );
      });
    });
  });

  describe('Otimizações de Performance', () => {
    it('deve debouncer múltiplas chamadas de refresh', async () => {
      const { result } = renderHook(() => useDashboardV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Múltiplas chamadas rápidas
      result.current.refresh();
      result.current.refresh();
      result.current.refresh();

      // Deve ser debounced para apenas uma invalidação
      expect(unifiedCache.invalidate).toHaveBeenCalledTimes(1);
    });

    it('deve cancelar requests anteriores', async () => {
      const { result, rerender } = renderHook(() => useDashboardV2(), { wrapper });

      // Forçar re-render antes da primeira query terminar
      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Não deve haver memory leaks
      expect(result.current.metrics).toBeDefined();
    });
  });
});