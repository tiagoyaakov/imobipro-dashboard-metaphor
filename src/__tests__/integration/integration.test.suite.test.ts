/**
 * 🧪 Suite de Testes de Integração - Clerk Authentication
 * 
 * Esta suite executa todos os testes de integração para o sistema de autenticação
 * do ImobiPRO Dashboard usando Clerk.
 * 
 * Testes incluídos:
 * - Fluxo completo de autenticação
 * - Integração com APIs 
 * - Responsividade em diferentes dispositivos
 */

import { describe, beforeAll, afterAll } from 'vitest';

// Importar todos os testes de integração
import './auth-flow.integration.test';
import './api-integration.test';
import './responsive.integration.test';

describe('🚀 Suite Completa - Testes de Integração Clerk', () => {
  beforeAll(() => {
    console.log('🧪 Iniciando suite de testes de integração...');
    
    // Configurações globais para todos os testes
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    
    // Mock do matchMedia para testes de responsividade
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });
  });

  afterAll(() => {
    console.log('✅ Suite de testes de integração finalizada!');
  });
});

// Exportar funções utilitárias para outros testes
export * from '../../test-utils/integration-test-utils'; 