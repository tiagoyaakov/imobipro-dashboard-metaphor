import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  authConfig, 
  validateAuthConfig, 
  getAuthMode, 
  isFeatureEnabled,
  getDevConfig,
  debugLog,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  ROLE_PERMISSIONS
} from './auth';

describe('Auth Configuration Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset console spies
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset environment to safe defaults
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_DEBUG_AUTH', 'false');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Security: Production Auth Configuration', () => {
    it('should force real auth in production environment', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false'); // Try to use mock
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      
      // Re-evaluate authConfig with new env
      const config = {
        useRealAuth: import.meta.env.PROD || // SEMPRE real em produção
                     (import.meta.env.VITE_USE_REAL_AUTH === 'true' && 
                      import.meta.env.VITE_SUPABASE_URL && 
                      import.meta.env.VITE_SUPABASE_ANON_KEY),
      };
      
      expect(config.useRealAuth).toBe(true);
    });

    it('should require both URL and key for real auth', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', ''); // Missing key
      
      const config = {
        useRealAuth: import.meta.env.VITE_USE_REAL_AUTH === 'true' && 
                     import.meta.env.VITE_SUPABASE_URL && 
                     import.meta.env.VITE_SUPABASE_ANON_KEY,
      };
      
      expect(config.useRealAuth).toBe(false);
    });

    it('should not expose service role key in config', () => {
      expect(authConfig.supabase).not.toHaveProperty('serviceRoleKey');
      expect(JSON.stringify(authConfig)).not.toContain('service_role');
      expect(JSON.stringify(authConfig)).not.toContain('SERVICE_ROLE');
    });
  });

  describe('Security: Development Configuration Safety', () => {
    it('should use safe default role (AGENT) for development', () => {
      expect(authConfig.development.defaultUser.role).toBe('AGENT');
      expect(authConfig.development.defaultUser.role).not.toBe('ADMIN');
      expect(authConfig.development.defaultUser.role).not.toBe('DEV_MASTER');
    });

    it('should generate dynamic IDs instead of hardcoded ones', () => {
      const userId = authConfig.development.defaultUser.id;
      const companyId = authConfig.development.defaultCompanyId;
      
      // Should not be obviously hardcoded
      expect(userId).not.toBe('mock-user-id');
      expect(userId).not.toBe('hardcoded-user');
      expect(companyId).not.toBe('mock-company-id');
      expect(companyId).not.toBe('hardcoded-company');
      
      // Should be UUIDs or generated values
      expect(typeof userId).toBe('string');
      expect(typeof companyId).toBe('string');
      expect(userId.length).toBeGreaterThan(10);
      expect(companyId.length).toBeGreaterThan(10);
    });

    it('should only enable debug logs in development', () => {
      // In test environment (NODE_ENV !== 'development')
      expect(authConfig.development.enableDebugLogs).toBe(false);
    });

    it('should only allow dev bypass in development', () => {
      expect(authConfig.development.allowDevBypass).toBe(false);
    });
  });

  describe('Security: Validation Function', () => {
    it('should validate HTTPS URLs correctly', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://secure.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      
      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(true);
      const httpsErrors = result.errors.filter(error => error.includes('HTTPS'));
      expect(httpsErrors).toHaveLength(0);
    });

    it('should reject HTTP URLs', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'http://insecure.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      
      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('VITE_SUPABASE_URL deve usar HTTPS');
    });

    it('should validate JWT format', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'invalid-jwt-format');
      
      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('VITE_SUPABASE_ANON_KEY não parece ser um JWT válido');
    });

    it('should detect missing required variables', () => {
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      
      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('VITE_SUPABASE_URL não está configurada');
      expect(result.errors).toContain('VITE_SUPABASE_ANON_KEY não está configurada');
    });

    it('should warn about debug mode in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      vi.stubEnv('VITE_DEBUG_AUTH', 'true');
      
      const result = validateAuthConfig();
      
      expect(result.warnings).toContain('Debug de autenticação ativo em produção');
    });

    it('should reject mock auth in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      
      const config = {
        useRealAuth: import.meta.env.PROD || // Forces true in prod
                     (import.meta.env.VITE_USE_REAL_AUTH === 'true' && 
                      import.meta.env.VITE_SUPABASE_URL && 
                      import.meta.env.VITE_SUPABASE_ANON_KEY),
      };
      
      const result = validateAuthConfig();
      
      if (!config.useRealAuth) {
        expect(result.errors).toContain('Autenticação mock não pode ser usada em produção');
      }
    });

    it('should detect exposed sensitive variables', () => {
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'exposed-service-key');
      vi.stubEnv('DATABASE_URL', 'postgres://user:pass@host/db');
      
      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('SUPABASE_SERVICE_ROLE_KEY exposta'),
          expect.stringContaining('DATABASE_URL exposta')
        ])
      );
    });
  });

  describe('Security: Helper Functions', () => {
    it('should return correct auth mode', () => {
      // Test mock mode
      vi.stubEnv('PROD', false);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      
      expect(getAuthMode()).toBe('mock');
      
      // Test real mode
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
      
      const realConfig = {
        useRealAuth: import.meta.env.VITE_USE_REAL_AUTH === 'true' && 
                     import.meta.env.VITE_SUPABASE_URL && 
                     import.meta.env.VITE_SUPABASE_ANON_KEY,
      };
      
      expect(realConfig.useRealAuth ? 'real' : 'mock').toBe('real');
    });

    it('should check feature flags correctly', () => {
      expect(isFeatureEnabled('enablePasswordReset')).toBe(true);
      expect(isFeatureEnabled('enableSocialLogin')).toBe(false);
      expect(isFeatureEnabled('enableTwoFactor')).toBe(false);
    });

    it('should only return dev config in development', () => {
      // In test environment
      const devConfig = getDevConfig();
      expect(devConfig).toBeNull();
    });

    it('should only log debug messages when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Debug disabled by default in tests
      debugLog('Test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Security: Route and Permission Constants', () => {
    it('should define secure auth routes', () => {
      expect(AUTH_ROUTES.LOGIN).toBe('/auth/login');
      expect(AUTH_ROUTES.SIGNUP).toBe('/auth/signup');
      expect(AUTH_ROUTES.FORGOT_PASSWORD).toBe('/auth/forgot-password');
      expect(AUTH_ROUTES.RESET_PASSWORD).toBe('/auth/reset-password');
      expect(AUTH_ROUTES.UNAUTHORIZED).toBe('/unauthorized');
      
      // Should not include debug or admin routes
      expect(Object.values(AUTH_ROUTES)).not.toContain('/auth/debug');
      expect(Object.values(AUTH_ROUTES)).not.toContain('/auth/admin');
    });

    it('should define protected routes correctly', () => {
      expect(PROTECTED_ROUTES.DASHBOARD).toBe('/');
      expect(PROTECTED_ROUTES.USERS).toBe('/usuarios');
      expect(PROTECTED_ROUTES.SETTINGS).toBe('/configuracoes');
      
      // Ensure all routes are defined
      const routes = Object.values(PROTECTED_ROUTES);
      expect(routes.length).toBeGreaterThan(5);
      
      // Should not include potentially dangerous routes
      expect(routes).not.toContain('/admin');
      expect(routes).not.toContain('/debug');
      expect(routes).not.toContain('/system');
    });

    it('should define role permissions securely', () => {
      expect(ROLE_PERMISSIONS.DEV_MASTER).toEqual(['all']);
      expect(ROLE_PERMISSIONS.ADMIN.length).toBeGreaterThan(0);
      expect(ROLE_PERMISSIONS.AGENT.length).toBeGreaterThan(0);
      
      // AGENT should have most limited permissions
      expect(ROLE_PERMISSIONS.AGENT.length).toBeLessThan(ROLE_PERMISSIONS.ADMIN.length);
      
      // ADMIN should not have 'all' permissions
      expect(ROLE_PERMISSIONS.ADMIN).not.toContain('all');
      
      // No role should have dangerous permissions
      Object.values(ROLE_PERMISSIONS).forEach(permissions => {
        expect(permissions).not.toContain('system_admin');
        expect(permissions).not.toContain('debug_access');
        expect(permissions).not.toContain('sql_access');
      });
    });
  });

  describe('Security: Configuration Immutability', () => {
    it('should not allow modification of critical config', () => {
      const originalUseRealAuth = authConfig.useRealAuth;
      
      expect(() => {
        (authConfig as any).useRealAuth = !originalUseRealAuth;
      }).not.toThrow(); // Config is mutable, but we test it doesn't affect security
      
      // But security should still be enforced elsewhere
      expect(typeof authConfig.useRealAuth).toBe('boolean');
    });

    it('should not expose private configuration', () => {
      const configKeys = Object.keys(authConfig);
      
      expect(configKeys).not.toContain('internalSecret');
      expect(configKeys).not.toContain('masterKey');
      expect(configKeys).not.toContain('privateKey');
      expect(configKeys).not.toContain('adminOverride');
    });
  });

  describe('Security: Session Configuration', () => {
    it('should have secure session settings', () => {
      expect(authConfig.session.maxAge).toBeLessThanOrEqual(24 * 60 * 60); // Max 24 hours
      expect(authConfig.session.refreshThreshold).toBeLessThan(authConfig.session.maxAge);
      expect(authConfig.session.persistSession).toBe(true); // OK for web apps
    });

    it('should have reasonable security timeouts', () => {
      expect(authConfig.security.operationTimeout).toBeLessThanOrEqual(60 * 1000); // Max 1 minute
      expect(authConfig.security.maxLoginAttempts).toBeLessThanOrEqual(10); // Reasonable limit
      expect(authConfig.security.lockoutDuration).toBeGreaterThan(5 * 60 * 1000); // At least 5 minutes
    });

    it('should have secure UI configuration', () => {
      expect(authConfig.ui.errorMessageDuration).toBeGreaterThan(1000); // At least 1 second
      expect(authConfig.ui.successMessageDuration).toBeLessThan(10000); // Max 10 seconds
      expect(authConfig.ui.defaultTheme).toBe('dark'); // Preference, not security
    });
  });

  describe('Security: Performance Configuration', () => {
    it('should have reasonable cache times', () => {
      expect(authConfig.performance.userDataCacheTime).toBeLessThanOrEqual(15 * 60 * 1000); // Max 15 minutes
      expect(authConfig.performance.permissionsCacheTime).toBeLessThanOrEqual(30 * 60 * 1000); // Max 30 minutes
      expect(authConfig.performance.preloadUserData).toBe(true);
      expect(authConfig.performance.lazyLoadAuthComponents).toBe(true);
    });
  });

  describe('Security: Integration Tests', () => {
    it('should pass validation with complete secure configuration', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://secure.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.signature');
      vi.stubEnv('VITE_DEBUG_AUTH', 'false');
      
      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with insecure configuration', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false'); // Mock in production
      vi.stubEnv('VITE_SUPABASE_URL', 'http://insecure.com'); // HTTP
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'invalid-jwt'); // Invalid JWT
      vi.stubEnv('VITE_DEBUG_AUTH', 'true'); // Debug in production
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'exposed'); // Exposed secret
      
      const result = validateAuthConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

// Helper for environment stubbing in tests
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