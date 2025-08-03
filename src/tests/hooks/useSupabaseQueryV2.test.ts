// ================================================================
// TESTES DO HOOK useSupabaseQueryV2
// ================================================================

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSupabaseQueryV2 } from '@/hooks/useSupabaseQueryV2';
import { UnifiedCache } from '@/lib/cache/UnifiedCache';
import { CacheStrategy } from '@/lib/cache/types';
import React from 'react';

// Mock UnifiedCache
vi.mock('@/lib/cache/UnifiedCache');

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [{ id: 1, name: 'Test' }],
          error: null,
        })),
      })),
    })),
  },
}));

describe('useSupabaseQueryV2', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let mockCache: jest.Mocked<UnifiedCache>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Create wrapper
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Setup mock cache
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
      invalidateByTags: vi.fn().mockResolvedValue(undefined),
      invalidateByPattern: vi.fn().mockResolvedValue(undefined),
      getMetrics: vi.fn().mockReturnValue({
        hitRate: 0.5,
        size: 1000,
        itemCount: 10,
      }),
    } as any;

    // Mock UnifiedCache.getInstance
    (UnifiedCache as any).getInstance = vi.fn().mockReturnValue(mockCache);
  });

  describe('Basic Query', () => {
    it('should fetch data successfully', async () => {
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'data'],
          queryFn: async () => ({ id: 1, name: 'Test' }),
          enabled: true,
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    });

    it('should use cache when available', async () => {
      const cachedData = { id: 2, name: 'Cached' };
      mockCache.get.mockResolvedValueOnce(cachedData);

      const queryFn = vi.fn();
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'cached'],
          queryFn,
          cacheStrategy: CacheStrategy.STATIC,
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(cachedData);
      expect(queryFn).not.toHaveBeenCalled();
    });

    it('should handle different cache strategies', async () => {
      const strategies = [
        CacheStrategy.STATIC,
        CacheStrategy.DYNAMIC,
        CacheStrategy.CRITICAL,
        CacheStrategy.HISTORICAL,
      ];

      for (const strategy of strategies) {
        const { result } = renderHook(
          () => useSupabaseQueryV2({
            queryKey: ['test', strategy],
            queryFn: async () => ({ strategy }),
            cacheStrategy: strategy,
          }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockCache.set).toHaveBeenCalledWith(
          expect.stringContaining('test'),
          expect.any(Object),
          expect.objectContaining({ strategy })
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle query errors', async () => {
      const error = new Error('Query failed');
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'error'],
          queryFn: async () => {
            throw error;
          },
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should use fallback data on error when specified', async () => {
      const fallbackData = { id: 0, name: 'Fallback' };
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'fallback'],
          queryFn: async () => {
            throw new Error('Failed');
          },
          fallbackData,
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(fallbackData);
      });
    });
  });

  describe('Offline Support', () => {
    it('should return cached data when offline', async () => {
      const cachedData = { id: 3, name: 'Offline' };
      mockCache.get.mockResolvedValueOnce(cachedData);

      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'offline'],
          queryFn: async () => {
            throw new Error('Network error');
          },
          enableOffline: true,
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(cachedData);
      expect(result.current.isOffline).toBe(true);
    });
  });

  describe('Cache Tags', () => {
    it('should set cache with tags', async () => {
      const tags = ['user:1', 'company:2'];
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'tags'],
          queryFn: async () => ({ id: 1 }),
          cacheTags: tags,
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ tags })
      );
    });
  });

  describe('Mutations', () => {
    it('should invalidate cache after mutation', async () => {
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'mutation'],
          queryFn: async () => ({ id: 1 }),
          invalidateOnMutation: true,
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Simulate mutation
      queryClient.invalidateQueries({ queryKey: ['test', 'mutation'] });

      await waitFor(() => {
        expect(mockCache.invalidate).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time strategy', async () => {
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'realtime'],
          queryFn: async () => ({ id: 1, value: Math.random() }),
          cacheStrategy: CacheStrategy.REALTIME,
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // REALTIME strategy should not cache
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    it('should expose cache metrics', async () => {
      const { result } = renderHook(
        () => useSupabaseQueryV2({
          queryKey: ['test', 'metrics'],
          queryFn: async () => ({ id: 1 }),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.cacheMetrics).toEqual({
        hitRate: 0.5,
        size: 1000,
        itemCount: 10,
      });
    });
  });
});