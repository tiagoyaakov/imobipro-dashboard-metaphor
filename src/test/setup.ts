import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'

// Mock do crypto se não estiver disponível (ambientes de teste)
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  } as Crypto;
}

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    hostname: 'localhost',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock console para testes mais limpos (opcional)
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Configurar variáveis de ambiente padrão para testes
Object.defineProperty(import.meta, 'env', {
  value: {
    PROD: false,
    DEV: true,
    MODE: 'test',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ.test',
    VITE_USE_REAL_AUTH: 'false',
    VITE_DEBUG_AUTH: 'false',
    VITE_DEFAULT_COMPANY_ID: 'test-company-id',
    ...import.meta.env
  },
  writable: true,
});

// Configurar ResizeObserver mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Configurar IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Configurar fetch mock básico
global.fetch = vi.fn();

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock do IndexedDB
const indexedDBMock = {
  open: vi.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn(),
          put: vi.fn(),
          get: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
          delete: vi.fn(),
          clear: vi.fn(),
          getAllKeys: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
        }),
      }),
    },
  }),
  deleteDatabase: vi.fn(),
};
Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// Mock do BroadcastChannel
class BroadcastChannelMock {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  constructor(name: string) {
    this.name = name;
  }
  
  postMessage = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
}
global.BroadcastChannel = BroadcastChannelMock as any;

// Mock do crypto.subtle
Object.defineProperty(global.crypto, 'subtle', {
  value: {
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    generateKey: vi.fn().mockResolvedValue({}),
    importKey: vi.fn().mockResolvedValue({}),
    exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  },
});

// Mock do performance.now
performance.now = vi.fn(() => Date.now());

// Mock de variáveis de ambiente adicionais
Object.defineProperty(import.meta.env, 'VITE_N8N_WEBHOOK_URL', {
  value: 'https://test.n8n.webhook',
  writable: true,
});

// Configuração de cleanup automático
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

export {};