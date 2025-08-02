import { CacheManager } from './CacheManager';
import { SyncManager } from './SyncManager';
import { 
  CacheStrategy, 
  CacheOptions, 
  CacheConfig,
  CacheMetrics,
  CacheEventCallback,
  SyncStatus,
  OfflineQueueItem
} from './types';

/**
 * Sistema de Cache Unificado
 * Combina cache em memória, persistência e sincronização entre tabs
 */
export class UnifiedCache {
  private cacheManager: CacheManager;
  private syncManager: SyncManager;
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncStatus: SyncStatus = {
    lastSync: 0,
    pending: 0,
    failed: 0,
    syncing: false
  };

  constructor(config?: Partial<CacheConfig>) {
    // Inicializar gerenciadores
    this.cacheManager = new CacheManager(config);
    this.syncManager = new SyncManager();

    // Configurar sincronização
    this.setupSync();
    
    // Monitorar status online/offline
    this.setupOnlineMonitoring();
  }

  /**
   * API Pública - Cache Operations
   */
  
  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    // Armazenar no cache local
    await this.cacheManager.set(key, value, options);

    // Sincronizar se configurado
    if (options.syncAcrossTabs !== false) {
      await this.syncManager.sync(key, value);
    }

    // Se offline e é operação crítica, adicionar à fila
    if (!this.isOnline && options.strategy === CacheStrategy.CRITICAL) {
      this.addToOfflineQueue('update', key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.delete(key);
    await this.syncManager.sync(key, undefined);
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
    await this.syncManager.syncAll();
  }

  async has(key: string): Promise<boolean> {
    return this.cacheManager.has(key);
  }

  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    return this.cacheManager.getMany<T>(keys);
  }

  async setMany(
    entries: Map<string, any>, 
    options: CacheOptions = {}
  ): Promise<void> {
    await this.cacheManager.setMany(entries, options);
    
    // Sincronizar todas as entradas
    if (options.syncAcrossTabs !== false) {
      for (const [key, value] of entries) {
        await this.syncManager.sync(key, value);
      }
    }
  }

  /**
   * API de Estratégias
   */
  
  async clearByStrategy(strategy: CacheStrategy): Promise<void> {
    await this.cacheManager.clearByStrategy(strategy);
  }

  async clearByTags(tags: string[]): Promise<void> {
    await this.cacheManager.clearByTags(tags);
  }

  /**
   * API de Métricas e Monitoramento
   */
  
  getMetrics(): CacheMetrics {
    return this.cacheManager.getMetrics();
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  addEventListener(callback: CacheEventCallback): () => void {
    return this.cacheManager.addEventListener(callback);
  }

  /**
   * API de Configuração
   */
  
  setLifecycleHooks(hooks: any): void {
    this.cacheManager.setLifecycleHooks(hooks);
  }

  async runGarbageCollection(): Promise<number> {
    return this.cacheManager.runGarbageCollection();
  }

  /**
   * Métodos Específicos do Sistema Unificado
   */
  
  /**
   * Invalida cache e propaga para outras tabs
   */
  async invalidate(pattern: string | RegExp): Promise<void> {
    const keys: string[] = [];
    
    // Coletar chaves que correspondem ao padrão
    for (const [key] of await this.cacheManager.getMany([])) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        keys.push(key);
      }
    }

    // Deletar todas as chaves correspondentes
    for (const key of keys) {
      await this.delete(key);
    }
  }

  /**
   * Atualiza cache com merge de dados
   */
  async update<T>(
    key: string, 
    updater: (current: T | null) => T,
    options: CacheOptions = {}
  ): Promise<T> {
    const current = await this.get<T>(key);
    const updated = updater(current);
    await this.set(key, updated, options);
    return updated;
  }

  /**
   * Cache com fallback para fonte de dados
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Tentar obter do cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Buscar da fonte
    try {
      const fresh = await fetcher();
      await this.set(key, fresh, options);
      return fresh;
    } catch (error) {
      // Se offline, tentar cache expirado
      if (!this.isOnline) {
        const stale = await this.getStale<T>(key);
        if (stale !== null) {
          console.warn('Using stale cache due to offline status');
          return stale;
        }
      }
      throw error;
    }
  }

  /**
   * Configuração de Sincronização
   */
  
  private setupSync(): void {
    // Escutar atualizações de outras tabs
    this.syncManager.onUpdate(async (key, value) => {
      // Atualizar cache local sem propagar novamente
      const options: CacheOptions = { syncAcrossTabs: false };
      
      if (value === undefined) {
        await this.cacheManager.delete(key);
      } else {
        await this.cacheManager.set(key, value, options);
      }
    });
  }

  private setupOnlineMonitoring(): void {
    // Monitorar mudanças de conectividade
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Gerenciamento de Fila Offline
   */
  
  private addToOfflineQueue(
    operation: 'create' | 'update' | 'delete',
    resource: string,
    data?: any
  ): void {
    const item: OfflineQueueItem = {
      id: `${Date.now()}_${Math.random()}`,
      operation,
      resource,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    this.offlineQueue.push(item);
    this.syncStatus.pending++;
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    this.syncStatus.syncing = true;
    const failed: OfflineQueueItem[] = [];

    for (const item of this.offlineQueue) {
      try {
        // Processar item (seria integrado com backend)
        await this.processQueueItem(item);
        this.syncStatus.pending--;
      } catch (error) {
        item.retries++;
        if (item.retries < item.maxRetries) {
          failed.push(item);
        } else {
          this.syncStatus.failed++;
          this.syncStatus.pending--;
        }
      }
    }

    this.offlineQueue = failed;
    this.syncStatus.lastSync = Date.now();
    this.syncStatus.syncing = false;
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    // Implementação dependeria da integração com backend
    console.log('Processing offline queue item:', item);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Métodos Auxiliares
   */
  
  private async getStale<T>(key: string): Promise<T | null> {
    // Implementação para obter cache expirado
    // Seria necessário modificar CacheManager para suportar isso
    return null;
  }

  /**
   * Estatísticas Avançadas
   */
  
  getStats(): {
    cache: CacheMetrics;
    sync: SyncStatus & { method: string; isLeader: boolean };
    offline: { queueSize: number; isOnline: boolean };
  } {
    const syncStats = this.syncManager.getSyncStats();
    
    return {
      cache: this.getMetrics(),
      sync: {
        ...this.syncStatus,
        method: syncStats.syncMethod,
        isLeader: syncStats.isLeader
      },
      offline: {
        queueSize: this.offlineQueue.length,
        isOnline: this.isOnline
      }
    };
  }

  /**
   * Destrutor
   */
  
  destroy(): void {
    this.cacheManager.destroy();
    this.syncManager.destroy();
    this.offlineQueue = [];
  }
}

// Singleton para uso global
let unifiedCacheInstance: UnifiedCache | null = null;

export function getUnifiedCache(config?: Partial<CacheConfig>): UnifiedCache {
  if (!unifiedCacheInstance) {
    unifiedCacheInstance = new UnifiedCache(config);
  }
  return unifiedCacheInstance;
}

export function resetUnifiedCache(): void {
  if (unifiedCacheInstance) {
    unifiedCacheInstance.destroy();
    unifiedCacheInstance = null;
  }
}