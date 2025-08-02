/**
 * Sistema de Cache Unificado - Tipos e Interfaces
 * Fornece tipos para o sistema de cache com suporte offline
 */

// Estratégias de cache disponíveis
export enum CacheStrategy {
  STATIC = 'STATIC',         // 30min - dados estáticos
  DYNAMIC = 'DYNAMIC',       // 30s - dados que mudam frequentemente
  REALTIME = 'REALTIME',     // 0s - sempre fresh
  CRITICAL = 'CRITICAL',     // 10s - alta prioridade
  HISTORICAL = 'HISTORICAL'  // 5min - dados históricos
}

// Configuração de tempo por estratégia (em ms)
export const CACHE_DURATIONS: Record<CacheStrategy, number> = {
  [CacheStrategy.STATIC]: 30 * 60 * 1000,      // 30 minutos
  [CacheStrategy.DYNAMIC]: 30 * 1000,          // 30 segundos
  [CacheStrategy.REALTIME]: 0,                 // Sem cache
  [CacheStrategy.CRITICAL]: 10 * 1000,         // 10 segundos
  [CacheStrategy.HISTORICAL]: 5 * 60 * 1000    // 5 minutos
};

// Interface para entrada de cache
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  strategy: CacheStrategy;
  version: string;
  metadata?: CacheMetadata;
}

// Metadados do cache
export interface CacheMetadata {
  source?: 'local' | 'remote' | 'offline';
  compressed?: boolean;
  encrypted?: boolean;
  size?: number;
  tags?: string[];
  userId?: string;
  companyId?: string;
}

// Opções de cache
export interface CacheOptions {
  strategy?: CacheStrategy;
  ttl?: number; // Time to live customizado
  tags?: string[];
  compress?: boolean;
  encrypt?: boolean;
  persist?: boolean;
  syncAcrossTabs?: boolean;
}

// Interface para gerenciador de cache
export interface ICacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  clearByStrategy(strategy: CacheStrategy): Promise<void>;
  clearByTags(tags: string[]): Promise<void>;
  has(key: string): Promise<boolean>;
  getMany<T>(keys: string[]): Promise<Map<string, T>>;
  setMany(entries: Map<string, any>, options?: CacheOptions): Promise<void>;
}

// Interface para adaptador de persistência
export interface IPersistenceAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll<T>(): Promise<Map<string, T>>;
  deleteMany(keys: string[]): Promise<void>;
  size(): Promise<number>;
}

// Interface para sincronização
export interface ISyncManager {
  sync(key: string): Promise<void>;
  syncAll(): Promise<void>;
  onUpdate(callback: (key: string, value: any) => void): () => void;
  broadcastUpdate(key: string, value: any): void;
}

// Fila offline
export interface OfflineQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

// Métricas de cache
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  hitRate: number;
}

// Eventos do cache
export type CacheEvent = 
  | { type: 'hit'; key: string }
  | { type: 'miss'; key: string }
  | { type: 'set'; key: string; size: number }
  | { type: 'delete'; key: string }
  | { type: 'evict'; key: string; reason: string }
  | { type: 'clear'; strategy?: CacheStrategy }
  | { type: 'sync'; key: string; direction: 'in' | 'out' };

// Callback para eventos
export type CacheEventCallback = (event: CacheEvent) => void;

// Configuração global do cache
export interface CacheConfig {
  maxSize?: number;          // Tamanho máximo em bytes
  enableCompression?: boolean;
  enableEncryption?: boolean;
  enableMetrics?: boolean;
  enableOfflineQueue?: boolean;
  syncInterval?: number;     // Intervalo de sincronização em ms
  garbageCollectionInterval?: number;
  version: string;
}

// Status de sincronização
export interface SyncStatus {
  lastSync: number;
  pending: number;
  failed: number;
  syncing: boolean;
}

// Resultado de operação em lote
export interface BatchOperationResult {
  successful: string[];
  failed: Array<{ key: string; error: Error }>;
  total: number;
}

// Hook de ciclo de vida
export interface CacheLifecycleHooks {
  beforeGet?: (key: string) => void | Promise<void>;
  afterGet?: <T>(key: string, value: T | null) => void | Promise<void>;
  beforeSet?: <T>(key: string, value: T) => void | Promise<void>;
  afterSet?: <T>(key: string, value: T) => void | Promise<void>;
  beforeDelete?: (key: string) => void | Promise<void>;
  afterDelete?: (key: string) => void | Promise<void>;
  onError?: (error: Error, operation: string) => void;
}