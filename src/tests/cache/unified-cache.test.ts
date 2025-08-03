// ================================================================
// TESTES DO SISTEMA DE CACHE UNIFICADO
// ================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UnifiedCache } from '@/lib/cache/UnifiedCache';
import { CacheStrategy } from '@/lib/cache/types';
import { IndexedDBAdapter } from '@/lib/cache/IndexedDBAdapter';

// Mock IndexedDB
vi.mock('@/lib/cache/IndexedDBAdapter');

describe('UnifiedCache', () => {
  let cache: UnifiedCache;
  let mockIndexedDB: jest.Mocked<IndexedDBAdapter>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock IndexedDB
    mockIndexedDB = {
      init: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      getAllKeys: vi.fn().mockResolvedValue([]),
      getSize: vi.fn().mockResolvedValue(0),
      cleanup: vi.fn().mockResolvedValue(undefined),
    } as any;

    // Create cache instance
    cache = new UnifiedCache({
      enableCompression: true,
      enableEncryption: false,
      persistToIndexedDB: true,
      syncAcrossTabs: false,
      maxMemorySize: 10 * 1024 * 1024, // 10MB
    });

    // Inject mock
    (cache as any).indexedDB = mockIndexedDB;
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get value with default strategy', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await cache.set(key, value);
      const result = await cache.get(key);

      expect(result).toEqual(value);
    });

    it('should respect TTL for different strategies', async () => {
      const testCases = [
        { strategy: CacheStrategy.STATIC, ttl: 1800000 }, // 30 min
        { strategy: CacheStrategy.DYNAMIC, ttl: 300000 }, // 5 min
        { strategy: CacheStrategy.REALTIME, ttl: 0 }, // No cache
        { strategy: CacheStrategy.CRITICAL, ttl: 10000 }, // 10 sec
        { strategy: CacheStrategy.HISTORICAL, ttl: 3600000 }, // 1 hour
      ];

      for (const { strategy, ttl } of testCases) {
        const key = `test-${strategy}`;
        const value = { data: strategy };

        await cache.set(key, value, { strategy });
        
        if (strategy === CacheStrategy.REALTIME) {
          // REALTIME should not cache
          const result = await cache.get(key);
          expect(result).toBeNull();
        } else {
          // Other strategies should cache
          const result = await cache.get(key);
          expect(result).toEqual(value);
        }
      }
    });

    it('should handle tags correctly', async () => {
      const key1 = 'item-1';
      const key2 = 'item-2';
      const key3 = 'item-3';
      const tag = 'test-tag';

      await cache.set(key1, { id: 1 }, { tags: [tag] });
      await cache.set(key2, { id: 2 }, { tags: [tag] });
      await cache.set(key3, { id: 3 }, { tags: ['other-tag'] });

      // Invalidate by tag
      await cache.invalidateByTags([tag]);

      expect(await cache.get(key1)).toBeNull();
      expect(await cache.get(key2)).toBeNull();
      expect(await cache.get(key3)).toEqual({ id: 3 });
    });

    it('should handle pattern invalidation', async () => {
      await cache.set('user:1', { id: 1 });
      await cache.set('user:2', { id: 2 });
      await cache.set('post:1', { id: 1 });

      await cache.invalidateByPattern('user:*');

      expect(await cache.get('user:1')).toBeNull();
      expect(await cache.get('user:2')).toBeNull();
      expect(await cache.get('post:1')).toEqual({ id: 1 });
    });
  });

  describe('Offline Queue', () => {
    it('should queue operations when offline', async () => {
      const operation = {
        id: 'op-1',
        type: 'CREATE' as const,
        resource: 'appointments',
        data: { title: 'Test' },
        timestamp: Date.now(),
      };

      await cache.addToOfflineQueue(operation);
      const queue = await cache.getOfflineQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject(operation);
    });

    it('should process offline queue', async () => {
      const operations = [
        {
          id: 'op-1',
          type: 'CREATE' as const,
          resource: 'appointments',
          data: { title: 'Test 1' },
          timestamp: Date.now(),
        },
        {
          id: 'op-2',
          type: 'UPDATE' as const,
          resource: 'appointments',
          data: { title: 'Test 2' },
          timestamp: Date.now(),
        },
      ];

      for (const op of operations) {
        await cache.addToOfflineQueue(op);
      }

      const processor = vi.fn().mockResolvedValue(true);
      await cache.processOfflineQueue(processor);

      expect(processor).toHaveBeenCalledTimes(2);
      expect(await cache.getOfflineQueue()).toHaveLength(0);
    });

    it('should handle failed queue processing', async () => {
      const operation = {
        id: 'op-1',
        type: 'CREATE' as const,
        resource: 'appointments',
        data: { title: 'Test' },
        timestamp: Date.now(),
      };

      await cache.addToOfflineQueue(operation);

      const processor = vi.fn().mockRejectedValue(new Error('Failed'));
      await cache.processOfflineQueue(processor);

      // Operation should still be in queue
      const queue = await cache.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });
  });

  describe('Memory Management', () => {
    it('should evict least recently used items when memory limit reached', async () => {
      // Set a very small memory limit
      cache = new UnifiedCache({
        maxMemorySize: 1000, // 1KB
      });

      // Add items until memory is full
      for (let i = 0; i < 10; i++) {
        await cache.set(`key-${i}`, { data: 'x'.repeat(200) }); // ~200 bytes each
      }

      // Earlier items should be evicted
      expect(await cache.get('key-0')).toBeNull();
      expect(await cache.get('key-1')).toBeNull();
      
      // Recent items should still exist
      expect(await cache.get('key-9')).toBeTruthy();
    });
  });

  describe('Compression', () => {
    it('should compress and decompress data correctly', async () => {
      const largeData = {
        text: 'x'.repeat(10000), // 10KB of repeated text
        nested: {
          array: Array(100).fill({ value: 'test' }),
        },
      };

      await cache.set('large-data', largeData);
      const result = await cache.get('large-data');

      expect(result).toEqual(largeData);
      
      // Verify compression happened (check internal cache)
      const metrics = cache.getMetrics();
      expect(metrics.size).toBeLessThan(JSON.stringify(largeData).length);
    });
  });

  describe('Event System', () => {
    it('should emit events on cache operations', async () => {
      const events: any[] = [];
      
      cache.on('cache:hit', (event) => events.push({ type: 'hit', ...event }));
      cache.on('cache:miss', (event) => events.push({ type: 'miss', ...event }));
      cache.on('cache:set', (event) => events.push({ type: 'set', ...event }));
      cache.on('cache:invalidate', (event) => events.push({ type: 'invalidate', ...event }));

      // Set value
      await cache.set('test', { value: 1 });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('set');

      // Get existing value (hit)
      await cache.get('test');
      expect(events).toHaveLength(2);
      expect(events[1].type).toBe('hit');

      // Get non-existing value (miss)
      await cache.get('non-existing');
      expect(events).toHaveLength(3);
      expect(events[2].type).toBe('miss');

      // Invalidate
      await cache.invalidate('test');
      expect(events).toHaveLength(4);
      expect(events[3].type).toBe('invalidate');
    });
  });

  describe('Metrics', () => {
    it('should track cache metrics correctly', async () => {
      // Initial metrics
      let metrics = cache.getMetrics();
      expect(metrics.hitRate).toBe(0);
      expect(metrics.size).toBe(0);
      expect(metrics.itemCount).toBe(0);

      // Add items
      await cache.set('key1', { value: 1 });
      await cache.set('key2', { value: 2 });

      // Some hits and misses
      await cache.get('key1'); // hit
      await cache.get('key1'); // hit
      await cache.get('key3'); // miss
      await cache.get('key4'); // miss

      metrics = cache.getMetrics();
      expect(metrics.hitRate).toBe(0.5); // 2 hits, 2 misses
      expect(metrics.itemCount).toBe(2);
      expect(metrics.totalHits).toBe(2);
      expect(metrics.totalMisses).toBe(2);
    });
  });

  describe('Garbage Collection', () => {
    it('should clean up expired items', async () => {
      // Set item with very short TTL
      await cache.set('expired', { value: 1 }, { 
        strategy: CacheStrategy.CRITICAL // 10 second TTL
      });

      // Mock time passing
      vi.advanceTimersByTime(11000); // 11 seconds

      // Run garbage collection
      await cache.garbageCollect();

      // Item should be gone
      expect(await cache.get('expired')).toBeNull();
    });
  });
});