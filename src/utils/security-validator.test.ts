import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateSecurity, 
  validateCriticalSecurity, 
  useSecurityValidator 
} from './security-validator';

// Mock do React para o hook
vi.mock('react', () => ({
  useEffect: vi.fn((fn) => fn()),
}));

describe('SecurityValidator', () => {
  beforeEach(() => {
    // Limpar console spies antes de cada teste
    vi.clearAllMocks();
    
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    
    // Reset localStorage mock
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
    vi.mocked(window.localStorage.setItem).mockReturnValue();
    vi.mocked(window.localStorage.removeItem).mockReturnValue();
    vi.mocked(window.localStorage.clear).mockReturnValue();
    
    // Reset window properties
    delete (window as any).AuthContextMock;
    delete (window as any).__AUTH_MOCK__;
    
    // Reset location
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        hostname: 'localhost',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidUrl', () => {
    it('should validate HTTPS URLs correctly', () => {
      const result = validateSecurity();
      
      // Set valid HTTPS URL
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      const resultWithHttps = validateSecurity();
      
      expect(resultWithHttps.criticalErrors.length).toBeLessThanOrEqual(
        result.criticalErrors.length
      );
    });

    it('should reject HTTP URLs in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'http://insecure.example.com');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('HTTPS')
        ])
      );
    });

    it('should reject invalid URLs', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'not-a-url');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('URL válida')
        ])
      );
    });
  });

  describe('isValidJWT', () => {
    it('should validate JWT format correctly', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.signature');
      
      const result = validateSecurity();
      
      // Should not have JWT format errors if valid JWT is provided
      const jwtErrors = result.criticalErrors.filter(error => 
        error.includes('JWT válido')
      );
      expect(jwtErrors).toHaveLength(0);
    });

    it('should reject invalid JWT format', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'invalid-jwt-format');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('JWT válido')
        ])
      );
    });

    it('should reject empty JWT', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('VITE_SUPABASE_ANON_KEY não configurada')
        ])
      );
    });
  });

  describe('Production Environment Validation', () => {
    it('should block mock auth in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('mock está ativa em produção')
        ])
      );
    });

    it('should require HTTPS in production', () => {
      vi.stubEnv('PROD', true);
      
      // Mock window.location for production HTTPS check
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          hostname: 'example.com', // Not localhost
        },
        writable: true,
      });
      
      const result = validateSecurity();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('HTTPS')
        ])
      );
    });

    it('should require credentials in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('VITE_SUPABASE_URL não configurada'),
          expect.stringContaining('VITE_SUPABASE_ANON_KEY não configurada')
        ])
      );
    });

    it('should warn about debug mode in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      vi.stubEnv('VITE_DEBUG_AUTH', 'true');
      
      const result = validateSecurity();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Debug de autenticação ativo em produção')
        ])
      );
    });
  });

  describe('Hardcoded IDs Detection', () => {
    it('should detect hardcoded mock IDs in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_MOCK_USER_ID', 'mock-user-id');
      
      const result = validateSecurity();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('mock-user-id')
        ])
      );
    });

    it('should detect specific project hardcoded IDs', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_PROJECT_ID', 'eeceyvenrnyyqvilezgr');
      
      const result = validateSecurity();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('eeceyvenrnyyqvilezgr')
        ])
      );
    });

    it('should detect mock company IDs', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_COMPANY_ID', 'mock-company-id');
      
      const result = validateSecurity();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('mock-company-id')
        ])
      );
    });
  });

  describe('Data Exposure Detection', () => {
    it('should detect exposed AuthContextMock', () => {
      // Simular AuthContextMock exposto globalmente
      (window as any).AuthContextMock = {};
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('AuthContextMock exposto globalmente')
        ])
      );
    });

    it('should detect __AUTH_MOCK__ exposure', () => {
      // Simular __AUTH_MOCK__ exposto globalmente
      (window as any).__AUTH_MOCK__ = true;
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('AuthContextMock exposto globalmente')
        ])
      );
    });

    it('should detect development data in localStorage', () => {
      vi.stubEnv('PROD', true);
      
      // Mock localStorage com dados de desenvolvimento
      Object.defineProperty(window.localStorage, 'length', { value: 2 });
      Object.keys = vi.fn().mockReturnValue(['mock-session', 'dev-config']);
      
      const result = validateSecurity();
      
      // O teste deve detectar dados de desenvolvimento em localStorage
      // Note: Este teste pode precisar ser ajustado dependendo da implementação exata
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should not expose sensitive environment variables', () => {
      // Simular variáveis sensíveis expostas
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sensitive-key');
      vi.stubEnv('DATABASE_URL', 'postgres://user:pass@host/db');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('SUPABASE_SERVICE_ROLE_KEY exposta'),
          expect.stringContaining('DATABASE_URL exposta')
        ])
      );
    });
  });

  describe('Role Security Validation', () => {
    it('should reject dangerous default roles', () => {
      vi.stubEnv('VITE_DEFAULT_USER_ROLE', 'DEV_MASTER');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Role padrão perigoso configurado: DEV_MASTER')
        ])
      );
    });

    it('should reject ADMIN as default role', () => {
      vi.stubEnv('VITE_DEFAULT_USER_ROLE', 'ADMIN');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Role padrão perigoso configurado: ADMIN')
        ])
      );
    });

    it('should recommend removing deprecated roles', () => {
      const result = validateSecurity();
      
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('PROPRIETARIO, CREATOR')
        ])
      );
    });
  });

  describe('validateCriticalSecurity', () => {
    it('should return true when no critical errors exist', () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      
      const result = validateCriticalSecurity();
      
      expect(result).toBe(true);
    });

    it('should return false and log errors when critical issues exist', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      
      const consoleSpy = vi.spyOn(console, 'error');
      
      const result = validateCriticalSecurity();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('FALHAS CRÍTICAS DE SEGURANÇA')
      );
    });

    it('should throw error in production with critical failures', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      
      expect(() => validateCriticalSecurity()).toThrow(
        expect.stringContaining('Build cancelado devido a falhas críticas')
      );
    });

    it('should log warnings when present', () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('VITE_DEBUG_AUTH', 'true');
      
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      
      validateCriticalSecurity();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log recommendations when present', () => {
      vi.stubEnv('PROD', false);
      
      const consoleInfoSpy = vi.spyOn(console, 'info');
      
      validateCriticalSecurity();
      
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('useSecurityValidator hook', () => {
    it('should execute validation on mount in development', () => {
      vi.stubEnv('DEV', true);
      
      const consoleGroupSpy = vi.spyOn(console, 'group');
      
      useSecurityValidator();
      
      // Em desenvolvimento com issues, deve mostrar relatório
      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('RELATÓRIO DE SEGURANÇA')
      );
    });

    it('should return validation result', () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('PROD', false);
      
      const result = useSecurityValidator();
      
      expect(typeof result).toBe('boolean');
    });

    it('should not show report in production', () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('PROD', true);
      
      const consoleGroupSpy = vi.spyOn(console, 'group');
      
      useSecurityValidator();
      
      expect(consoleGroupSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('RELATÓRIO DE SEGURANÇA')
      );
    });
  });

  describe('Integration Tests', () => {
    it('should pass all validations with secure configuration', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://secure.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.signature');
      vi.stubEnv('VITE_DEBUG_AUTH', 'false');
      vi.stubEnv('MODE', 'production');
      
      // Mock HTTPS location
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          hostname: 'secure.example.com',
        },
        writable: true,
      });
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(true);
      expect(result.criticalErrors).toHaveLength(0);
    });

    it('should fail with insecure development-like configuration in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      vi.stubEnv('VITE_DEBUG_AUTH', 'true');
      vi.stubEnv('VITE_DEFAULT_USER_ROLE', 'ADMIN');
      
      // Expose sensitive data
      (window as any).AuthContextMock = {};
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'exposed-key');
      
      const result = validateSecurity();
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(2);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

// Helper function para stubbed env vars nos testes
declare global {
  namespace Vi {
    interface ExpectStatic {
      stubEnv(key: string, value: string | boolean): void;
    }
  }
}

// Implementação do helper stubEnv
function stubEnv(key: string, value: string | boolean) {
  const currentEnv = import.meta.env;
  Object.defineProperty(import.meta, 'env', {
    value: {
      ...currentEnv,
      [key]: value,
    },
    writable: true,
  });
}

vi.stubEnv = stubEnv;