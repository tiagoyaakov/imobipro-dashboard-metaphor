/**
 * Sistema de Cache Unificado - Exports
 */

// Tipos
export * from './types';

// Classes principais
export { CacheManager } from './CacheManager';
export { SyncManager } from './SyncManager';
export { IndexedDBAdapter } from './IndexedDBAdapter';

// Sistema unificado
export { 
  UnifiedCache, 
  getUnifiedCache, 
  resetUnifiedCache 
} from './UnifiedCache';

// Utilitários
export { compress, decompress, estimateCompressionRatio } from './utils/compression';
export { encrypt, decrypt, hashData, isEncryptionSupported } from './utils/encryption';

// Estratégias de cache padrão para uso comum
export { CACHE_DURATIONS, CacheStrategy } from './types';