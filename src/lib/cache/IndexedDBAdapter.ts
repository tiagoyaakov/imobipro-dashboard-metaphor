import { IPersistenceAdapter, CacheEntry } from './types';

/**
 * Adaptador IndexedDB para persistência local
 * Fornece armazenamento durável no navegador
 */
export class IndexedDBAdapter implements IPersistenceAdapter {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName = 'ImobiPROCache', storeName = 'cache', version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  /**
   * Inicializa o banco de dados
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar object store se não existir
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          
          // Índices para queries eficientes
          store.createIndex('strategy', 'strategy', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('tags', 'metadata.tags', { unique: false, multiEntry: true });
          store.createIndex('userId', 'metadata.userId', { unique: false });
          store.createIndex('companyId', 'metadata.companyId', { unique: false });
        }
      };
    });
  }

  /**
   * Obtém um item do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Verificar se expirou
        if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) {
          // Remover entrada expirada
          this.delete(key).catch(console.error);
          resolve(null);
          return;
        }

        resolve(entry.value);
      };
    });
  }

  /**
   * Armazena um item no cache
   */
  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // O valor já deve vir como CacheEntry do CacheManager
      const request = store.put(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Remove um item do cache
   */
  async delete(key: string): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Obtém todos os itens do cache
   */
  async getAll<T>(): Promise<Map<string, T>> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result as CacheEntry<T>[];
        const map = new Map<string, T>();
        
        const now = Date.now();
        entries.forEach(entry => {
          // Ignorar entradas expiradas
          if (entry.expiresAt === 0 || entry.expiresAt > now) {
            map.set(entry.key, entry.value);
          }
        });
        
        resolve(map);
      };
    });
  }

  /**
   * Remove múltiplos itens
   */
  async deleteMany(keys: string[]): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let completed = 0;
      let hasError = false;

      keys.forEach(key => {
        const request = store.delete(key);
        
        request.onerror = () => {
          hasError = true;
          reject(request.error);
        };
        
        request.onsuccess = () => {
          completed++;
          if (completed === keys.length && !hasError) {
            resolve();
          }
        };
      });

      // Caso não haja keys
      if (keys.length === 0) {
        resolve();
      }
    });
  }

  /**
   * Obtém o tamanho do cache
   */
  async size(): Promise<number> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Limpa entradas expiradas (garbage collection)
   */
  async cleanExpired(): Promise<number> {
    const db = await this.init();
    const now = Date.now();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      
      // Buscar apenas entradas com expiresAt > 0 e < now
      const range = IDBKeyRange.bound(1, now);
      const request = index.openCursor(range);
      
      let deletedCount = 0;

      request.onerror = () => reject(request.error);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          // Deletar entrada expirada
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  }

  /**
   * Busca por estratégia
   */
  async getByStrategy(strategy: string): Promise<string[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('strategy');
      const request = index.getAllKeys(strategy);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  /**
   * Busca por tags
   */
  async getByTags(tags: string[]): Promise<string[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('tags');
      
      const keys = new Set<string>();
      let completed = 0;

      tags.forEach(tag => {
        const request = index.getAllKeys(tag);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          (request.result as string[]).forEach(key => keys.add(key));
          completed++;
          
          if (completed === tags.length) {
            resolve(Array.from(keys));
          }
        };
      });

      // Caso não haja tags
      if (tags.length === 0) {
        resolve([]);
      }
    });
  }

  /**
   * Fecha a conexão com o banco
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Estima o tamanho em bytes do armazenamento
   */
  async estimateSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }
}