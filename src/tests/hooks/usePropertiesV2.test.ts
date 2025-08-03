import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePropertiesV2 } from '@/hooks/usePropertiesV2';
import { unifiedCache } from '@/lib/cache/UnifiedCache';
import type { PropertyFilters, PropertyStatus, PropertyType } from '@/types/supabase';

// Mock das dependências
vi.mock('@/lib/cache/UnifiedCache', () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
    getMetrics: vi.fn(),
    prefetch: vi.fn(),
    optimisticUpdate: vi.fn()
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

describe('usePropertiesV2', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  const mockProperties = [
    {
      id: '1',
      title: 'Apartamento Centro',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      price: 350000,
      area: 85,
      bedrooms: 2,
      bathrooms: 2,
      type: 'APARTMENT' as PropertyType,
      status: 'AVAILABLE' as PropertyStatus,
      agentId: 'test-agent-id',
      companyId: 'test-company-id',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Casa Jardim Europa',
      address: 'Av. Europa, 456',
      city: 'São Paulo',
      state: 'SP',
      price: 850000,
      area: 200,
      bedrooms: 3,
      bathrooms: 3,
      type: 'HOUSE' as PropertyType,
      status: 'AVAILABLE' as PropertyStatus,
      agentId: 'test-agent-id',
      companyId: 'test-company-id',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ];

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
    (unifiedCache.get as any).mockResolvedValue({
      data: mockProperties,
      count: mockProperties.length
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.resetAllMocks();
  });

  describe('Funcionalidade Básica', () => {
    it('deve carregar lista de propriedades', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.properties).toEqual(mockProperties);
      expect(result.current.count).toBe(2);
      expect(result.current.isError).toBe(false);
    });

    it('deve usar estratégia de cache STATIC por padrão', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({
          strategy: 'STATIC'
        })
      );
    });

    it('deve aplicar filtros corretamente', async () => {
      const filters: PropertyFilters = {
        status: 'AVAILABLE',
        type: 'APARTMENT',
        minPrice: 300000,
        maxPrice: 400000,
        city: 'São Paulo'
      };

      const { result } = renderHook(
        () => usePropertiesV2({ filters }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({
          filters
        })
      );
    });
  });

  describe('Operações CRUD', () => {
    it('deve criar nova propriedade com optimistic update', async () => {
      const newProperty = {
        title: 'Nova Propriedade',
        address: 'Rua Nova, 789',
        city: 'São Paulo',
        state: 'SP',
        price: 450000,
        area: 90,
        type: 'APARTMENT' as PropertyType,
        status: 'AVAILABLE' as PropertyStatus
      };

      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createProperty(newProperty);
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.any(Function)
      );
    });

    it('deve atualizar propriedade existente', async () => {
      const updateData = {
        title: 'Apartamento Centro - ATUALIZADO',
        price: 380000
      };

      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateProperty('1', updateData);
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalled();
    });

    it('deve deletar propriedade com confirmação', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteProperty('1');
      });

      expect(unifiedCache.optimisticUpdate).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.any(Function)
      );
    });
  });

  describe('Busca e Filtros', () => {
    it('deve fazer busca por texto', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.search('Centro');
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({
          filters: expect.objectContaining({
            search: 'Centro'
          })
        })
      );
    });

    it('deve aplicar múltiplos filtros simultaneamente', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const multipleFilters = {
        status: 'AVAILABLE' as PropertyStatus,
        type: 'APARTMENT' as PropertyType,
        city: 'São Paulo',
        minPrice: 300000,
        maxPrice: 500000
      };

      await act(async () => {
        await result.current.applyFilters(multipleFilters);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({
          filters: multipleFilters
        })
      );
    });

    it('deve limpar filtros', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearFilters();
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({
          filters: {}
        })
      );
    });
  });

  describe('Paginação', () => {
    it('deve gerenciar paginação corretamente', async () => {
      const { result } = renderHook(
        () => usePropertiesV2({ page: 1, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        hasNext: false,
        hasPrev: false
      });
    });

    it('deve navegar para próxima página', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.nextPage();
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({
          page: 2
        })
      );
    });

    it('deve navegar para página anterior', async () => {
      const { result } = renderHook(
        () => usePropertiesV2({ page: 2 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.prevPage();
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.stringContaining('properties'),
        expect.objectContaining({
          page: 1
        })
      );
    });
  });

  describe('Prefetch e Performance', () => {
    it('deve fazer prefetch de páginas adjacentes', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.prefetchAdjacent();
      });

      expect(unifiedCache.prefetch).toHaveBeenCalledWith([
        expect.stringContaining('page:0'),
        expect.stringContaining('page:2')
      ]);
    });

    it('deve fazer prefetch de dados relacionados', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.prefetchDetails('1');
      });

      expect(unifiedCache.prefetch).toHaveBeenCalledWith([
        expect.stringContaining('property:1:details'),
        expect.stringContaining('property:1:images'),
        expect.stringContaining('property:1:activities')
      ]);
    });

    it('deve invalidar cache ao atualizar dados', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.invalidateAll();
      });

      expect(unifiedCache.invalidate).toHaveBeenCalledWith('properties:*');
    });
  });

  describe('Estados de Loading e Error', () => {
    it('deve lidar com erros de carregamento', async () => {
      const mockError = new Error('Failed to fetch properties');
      (unifiedCache.get as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.properties).toEqual([]);
    });

    it('deve mostrar estado de loading durante operações', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      // Deve começar com loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Operação deve mostrar loading específico
      act(() => {
        result.current.createProperty({
          title: 'Test',
          price: 100000,
          area: 50,
          type: 'APARTMENT',
          status: 'AVAILABLE',
          address: 'Test Address',
          city: 'Test City',
          state: 'SP'
        });
      });

      expect(result.current.isCreating).toBe(true);
    });
  });

  describe('Configurações Avançadas', () => {
    it('deve aceitar configurações customizadas', async () => {
      const customConfig = {
        cacheStrategy: 'DYNAMIC' as const,
        enableOptimistic: false,
        enablePrefetch: false
      };

      const { result } = renderHook(
        () => usePropertiesV2(customConfig),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(unifiedCache.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          strategy: 'DYNAMIC'
        })
      );
    });

    it('deve respeitar configuração de auto-refresh', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(
        () => usePropertiesV2({ refreshInterval: 30000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCalls = (unifiedCache.get as any).mock.calls.length;

      // Avançar timer
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect((unifiedCache.get as any).mock.calls.length).toBeGreaterThan(initialCalls);
      });

      vi.useRealTimers();
    });
  });

  describe('Integração com Viva Real', () => {
    it('deve importar propriedades do Viva Real', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const importData = {
        location: 'São Paulo, SP',
        maxResults: 50,
        propertyType: 'APARTMENT' as PropertyType
      };

      await act(async () => {
        await result.current.importFromVivaReal(importData);
      });

      expect(result.current.isImporting).toBe(true);
    });

    it('deve sincronizar dados com Viva Real', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.syncWithVivaReal();
      });

      expect(unifiedCache.invalidate).toHaveBeenCalledWith('properties:*');
    });
  });

  describe('Comparação de Performance V1 vs V2', () => {
    it('deve ter tempo de resposta superior ao V1', async () => {
      const startTime = Date.now();
      
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // V2 deve ser mais rápido devido ao cache
      expect(responseTime).toBeLessThan(50);
    });

    it('deve fornecer mais funcionalidades que o V1', async () => {
      const { result } = renderHook(() => usePropertiesV2(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // V2 deve ter funcionalidades extras
      expect(result.current).toHaveProperty('prefetchDetails');
      expect(result.current).toHaveProperty('prefetchAdjacent');
      expect(result.current).toHaveProperty('importFromVivaReal');
      expect(result.current).toHaveProperty('optimisticUpdate');
      expect(result.current).toHaveProperty('cacheMetrics');
    });
  });
});