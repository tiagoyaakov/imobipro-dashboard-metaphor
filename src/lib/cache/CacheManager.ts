import {
  ICacheManager,
  CacheEntry,
  CacheOptions,
  CacheStrategy,
  CACHE_DURATIONS,
  CacheMetrics,
  CacheEvent,
  CacheEventCallback,
  CacheConfig,
  CacheLifecycleHooks,
  BatchOperationResult
} from './types';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { compress, decompress } from './utils/compression';
import { encrypt, decrypt } from './utils/encryption';

/**
 * Gerenciador de Cache Unificado
 * Fornece cache em memória com persistência opcional via IndexedDB
 */
export class CacheManager implements ICacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private persistenceAdapter: IndexedDBAdapter | null = null;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private eventListeners: Set<CacheEventCallback> = new Set();
  private lifecycleHooks: CacheLifecycleHooks = {};
  private gcInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB padrão
      enableCompression: true,
      enableEncryption: false,
      enableMetrics: true,
      enableOfflineQueue: true,
      syncInterval: 5 * 60 * 1000, // 5 minutos
      garbageCollectionInterval: 10 * 60 * 1000, // 10 minutos
      version: '1.0.0',
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      hitRate: 0
    };

    // Inicializar persistência se disponível
    if (typeof window !== 'undefined' && window.indexedDB) {
      this.persistenceAdapter = new IndexedDBAdapter();
    }

    // Iniciar garbage collection
    this.startGarbageCollection();
  }

  /**
   * Obtém um item do cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.lifecycleHooks.beforeGet?.(key);

    // Verificar memória primeiro
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (this.isExpired(memoryEntry)) {
        this.memoryCache.delete(key);
      } else {
        this.recordHit(key);
        const value = await this.decodeValue<T>(memoryEntry);
        await this.lifecycleHooks.afterGet?.(key, value);
        return value;
      }
    }

    // Tentar persistência se disponível
    if (this.persistenceAdapter) {
      try {
        const persistedEntry = await this.persistenceAdapter.get<CacheEntry>(key);
        if (persistedEntry && !this.isExpired(persistedEntry)) {
          // Restaurar para memória
          this.memoryCache.set(key, persistedEntry);
          this.recordHit(key);
          const value = await this.decodeValue<T>(persistedEntry);
          await this.lifecycleHooks.afterGet?.(key, value);
          return value;
        }
      } catch (error) {
        console.error('Cache persistence error:', error);
      }
    }

    this.recordMiss(key);
    await this.lifecycleHooks.afterGet?.(key, null);
    return null;
  }

  /**
   * Armazena um item no cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    await this.lifecycleHooks.beforeSet?.(key, value);

    const strategy = options.strategy || CacheStrategy.DYNAMIC;
    const ttl = options.ttl || CACHE_DURATIONS[strategy];
    
    // Criar entrada de cache
    const entry: CacheEntry<T> = {
      key,
      value: await this.encodeValue(value, options),
      timestamp: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : 0,
      strategy,
      version: this.config.version,
      metadata: {
        tags: options.tags,
        compressed: options.compress ?? this.config.enableCompression,
        encrypted: options.encrypt ?? this.config.enableEncryption,
        size: this.estimateSize(value)
      }
    };

    // Verificar tamanho antes de adicionar
    await this.ensureSpace(entry.metadata?.size || 0);

    // Armazenar na memória
    this.memoryCache.set(key, entry);

    // Persistir se necessário
    if (options.persist !== false && this.persistenceAdapter) {
      try {
        await this.persistenceAdapter.set(key, entry);
      } catch (error) {
        console.error('Cache persistence error:', error);
      }
    }

    this.recordSet(key, entry.metadata?.size || 0);
    await this.lifecycleHooks.afterSet?.(key, value);
  }

  /**
   * Remove um item do cache
   */
  async delete(key: string): Promise<void> {
    await this.lifecycleHooks.beforeDelete?.(key);

    this.memoryCache.delete(key);
    
    if (this.persistenceAdapter) {
      try {
        await this.persistenceAdapter.delete(key);
      } catch (error) {
        console.error('Cache persistence error:', error);
      }
    }

    this.recordDelete(key);
    await this.lifecycleHooks.afterDelete?.(key);
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.persistenceAdapter) {
      try {
        await this.persistenceAdapter.clear();
      } catch (error) {
        console.error('Cache persistence error:', error);
      }
    }

    this.emitEvent({ type: 'clear' });
    this.resetMetrics();
  }

  /**
   * Limpa cache por estratégia
   */
  async clearByStrategy(strategy: CacheStrategy): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.memoryCache) {
      if (entry.strategy === strategy) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    this.emitEvent({ type: 'clear', strategy });
  }

  /**
   * Limpa cache por tags
   */
  async clearByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.memoryCache) {
      const entryTags = entry.metadata?.tags || [];
      if (tags.some(tag => entryTags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async has(key: string): Promise<boolean> {
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      if (!this.isExpired(entry)) {
        return true;
      }
      this.memoryCache.delete(key);
    }

    if (this.persistenceAdapter) {
      try {
        const entry = await this.persistenceAdapter.get<CacheEntry>(key);
        return entry !== null && !this.isExpired(entry);
      } catch (error) {
        console.error('Cache persistence error:', error);
      }
    }

    return false;
  }

  /**
   * Obtém múltiplos itens
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Armazena múltiplos itens
   */
  async setMany(entries: Map<string, any>, options: CacheOptions = {}): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, options);
    }
  }

  /**
   * Configurar lifecycle hooks
   */
  setLifecycleHooks(hooks: CacheLifecycleHooks): void {
    this.lifecycleHooks = { ...this.lifecycleHooks, ...hooks };
  }

  /**
   * Adicionar listener de eventos
   */
  addEventListener(callback: CacheEventCallback): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  /**
   * Obter métricas
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Resetar métricas
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      hitRate: 0
    };
  }

  /**
   * Executar garbage collection manualmente
   */
  async runGarbageCollection(): Promise<number> {
    let cleaned = 0;

    // Limpar entradas expiradas da memória
    for (const [key, entry] of this.memoryCache) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // Limpar persistência
    if (this.persistenceAdapter) {
      try {
        const persistenceCleaned = await this.persistenceAdapter.cleanExpired();
        cleaned += persistenceCleaned;
      } catch (error) {
        console.error('GC persistence error:', error);
      }
    }

    return cleaned;
  }

  /**
   * Verificações privadas
   */
  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt > 0 && entry.expiresAt < Date.now();
  }

  private async encodeValue<T>(value: T, options: CacheOptions): Promise<T> {
    let encoded = value;

    // Comprimir se necessário
    if (options.compress ?? this.config.enableCompression) {
      encoded = await compress(encoded) as T;
    }

    // Criptografar se necessário
    if (options.encrypt ?? this.config.enableEncryption) {
      encoded = await encrypt(encoded) as T;
    }

    return encoded;
  }

  private async decodeValue<T>(entry: CacheEntry): Promise<T> {
    let value = entry.value;

    // Descriptografar se necessário
    if (entry.metadata?.encrypted) {
      value = await decrypt(value);
    }

    // Descomprimir se necessário
    if (entry.metadata?.compressed) {
      value = await decompress(value);
    }

    return value as T;
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Aproximação em bytes
    } catch {
      return 0;
    }
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.calculateTotalSize();
    
    if (currentSize + requiredSize > this.config.maxSize!) {
      // Evict LRU (Least Recently Used)
      const sortedEntries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      let freedSpace = 0;
      for (const [key, entry] of sortedEntries) {
        if (freedSpace >= requiredSize) break;
        
        const size = entry.metadata?.size || 0;
        this.memoryCache.delete(key);
        freedSpace += size;
        this.recordEviction(key, 'size_limit');
      }
    }
  }

  private calculateTotalSize(): number {
    let total = 0;
    for (const entry of this.memoryCache.values()) {
      total += entry.metadata?.size || 0;
    }
    return total;
  }

  private startGarbageCollection(): void {
    if (this.config.garbageCollectionInterval && this.config.garbageCollectionInterval > 0) {
      this.gcInterval = setInterval(() => {
        this.runGarbageCollection().catch(console.error);
      }, this.config.garbageCollectionInterval);
    }
  }

  /**
   * Métodos de métricas
   */
  private recordHit(key: string): void {
    if (this.config.enableMetrics) {
      this.metrics.hits++;
      this.updateHitRate();
      this.emitEvent({ type: 'hit', key });
    }
  }

  private recordMiss(key: string): void {
    if (this.config.enableMetrics) {
      this.metrics.misses++;
      this.updateHitRate();
      this.emitEvent({ type: 'miss', key });
    }
  }

  private recordSet(key: string, size: number): void {
    if (this.config.enableMetrics) {
      this.metrics.sets++;
      this.metrics.size = this.calculateTotalSize();
      this.emitEvent({ type: 'set', key, size });
    }
  }

  private recordDelete(key: string): void {
    if (this.config.enableMetrics) {
      this.metrics.deletes++;
      this.metrics.size = this.calculateTotalSize();
      this.emitEvent({ type: 'delete', key });
    }
  }

  private recordEviction(key: string, reason: string): void {
    if (this.config.enableMetrics) {
      this.metrics.evictions++;
      this.emitEvent({ type: 'evict', key, reason });
    }
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  private emitEvent(event: CacheEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Cache event listener error:', error);
      }
    }
  }

  /**
   * Destrutor
   */
  destroy(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }

    if (this.persistenceAdapter) {
      this.persistenceAdapter.close();
    }

    this.memoryCache.clear();
    this.eventListeners.clear();
  }
}