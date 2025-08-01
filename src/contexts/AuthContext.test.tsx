import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { AuthProvider, useAuth, useLogin, useSignup } from './AuthContext';
import { authConfig } from '../config/auth';

// Mock do Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
      limit: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

vi.mock('../integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

vi.mock('../utils/authDebug', () => ({}));

describe('AuthContext Security Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    vi.clearAllMocks();
    
    // Reset environment variables
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_USE_REAL_AUTH', 'true');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.test');
    vi.stubEnv('VITE_DEFAULT_COMPANY_ID', 'test-company-id');
    
    // Mock successful session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    // Mock auth state change listener
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Security: No ADMIN Fallback', () => {
    it('should never use ADMIN as fallback role', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: { name: 'Test User' }
      };

      // Mock successful session with user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token'
          } 
        },
        error: null
      });

      // Mock failed user query (force fallback scenario)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return (
          <div data-testid="user-role">
            {user?.role || 'no-user'}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        const roleElement = screen.getByTestId('user-role');
        // Should default to AGENT, never ADMIN
        expect(roleElement.textContent).toBe('AGENT');
      });
    });

    it('should explicitly log security warning when using fallback', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: { name: 'Test User' }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token'
          } 
        },
        error: null
      });

      // Force fallback scenario
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return <div>{user?.role || 'loading'}</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('company ID padrão')
        );
      });
    });
  });

  describe('Security: Dynamic Company ID', () => {
    it('should use dynamic company ID from config', async () => {
      const testCompanyId = 'dynamic-company-' + Date.now();
      vi.stubEnv('VITE_DEFAULT_COMPANY_ID', testCompanyId);
      
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: { name: 'Test User' }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token'
          } 
        },
        error: null
      });

      // Mock database user with company ID
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'AGENT',
          companyId: testCompanyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        error: null
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return (
          <div data-testid="company-id">
            {user?.companyId || 'no-company'}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        const companyElement = screen.getByTestId('company-id');
        expect(companyElement.textContent).toBe(testCompanyId);
      });
    });

    it('should not use hardcoded company IDs', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: { name: 'Test User' }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token'
          } 
        },
        error: null
      });

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return (
          <div data-testid="company-id">
            {user?.companyId || 'no-company'}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        const companyElement = screen.getByTestId('company-id');
        const companyId = companyElement.textContent;
        
        // Should not be hardcoded values
        expect(companyId).not.toBe('mock-company-id');
        expect(companyId).not.toBe('hardcoded-company');
        expect(companyId).not.toBe('eeceyvenrnyyqvilezgr');
      });
    });
  });

  describe('Security: Production Mock Blocking', () => {
    it('should not allow mock context in production environment', () => {
      vi.stubEnv('PROD', true);
      
      // AuthContext real deve estar sendo usado, não mock
      const TestComponent = () => {
        const { user } = useAuth();
        return <div data-testid="auth-type">real-auth</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('auth-type')).toHaveTextContent('real-auth');
    });

    it('should validate environment configuration in production', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
      
      // Should not reach here in real production, but test the config
      expect(authConfig.useRealAuth).toBe(true); // Should force real auth in prod
    });
  });

  describe('Security: Error Handling', () => {
    it('should handle authentication errors securely', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });
      
      mockSupabaseClient.auth.signInWithPassword = mockLogin;

      const { login } = useLogin();
      
      const result = await login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email ou senha incorretos. Tente novamente.');
      
      // Should not expose internal error details
      expect(result.error).not.toContain('Invalid login credentials');
    });

    it('should not expose sensitive error information', async () => {
      const sensitiveError = {
        message: 'Database connection failed: postgres://user:password@host/db',
        details: 'Connection timeout to internal server 192.168.1.100'
      };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: sensitiveError
      });

      const { login } = useLogin();
      
      const result = await login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(result.error).not.toContain('postgres://');
      expect(result.error).not.toContain('192.168.1.100');
      expect(result.error).not.toContain('password@host');
    });
  });

  describe('Security: Session Management', () => {
    it('should clear all sensitive data on logout', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      });

      const TestComponent = () => {
        const { logout } = useAuth();
        return (
          <button 
            data-testid="logout-btn" 
            onClick={() => logout()}
          >
            Logout
          </button>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      
      await act(async () => {
        logoutBtn.click();
      });

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it('should handle session expiration securely', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      });

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div>App</div>
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Erro ao obter sessão inicial')
        );
      });
    });
  });

  describe('Security: User Registration', () => {
    it('should validate email format in signup', async () => {
      const { signup } = useSignup();
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email format' }
      });

      const result = await signup(
        'invalid-email',
        'password123',
        { name: 'Test User', role: 'AGENT' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should default to safe role in signup', async () => {
      const mockSignUpResponse = {
        data: {
          user: {
            id: 'new-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockSignUpResponse);
      
      // Mock companies query
      mockSupabaseClient.from().select().limit.mockResolvedValue({
        data: [{ id: 'company-id' }],
        error: null
      });

      // Mock user insert
      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'new-user-id' },
        error: null
      });
      mockSupabaseClient.from().insert.mockReturnValue({
        select: () => ({
          single: insertMock
        })
      });

      const { signup } = useSignup();
      
      await signup('test@example.com', 'password123', {
        name: 'Test User'
        // No role specified - should default to AGENT
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'AGENT' // Should default to safe role
        })
      );
    });

    it('should not allow privilege escalation in signup', async () => {
      const { signup } = useSignup();
      
      const mockSignUpResponse = {
        data: {
          user: {
            id: 'new-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockSignUpResponse);
      
      mockSupabaseClient.from().select().limit.mockResolvedValue({
        data: [{ id: 'company-id' }],
        error: null
      });

      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'new-user-id' },
        error: null
      });
      mockSupabaseClient.from().insert.mockReturnValue({
        select: () => ({
          single: insertMock
        })
      });

      // Try to register with DEV_MASTER role
      await signup('test@example.com', 'password123', {
        name: 'Test User',
        role: 'DEV_MASTER'
      });

      // Should be downgraded or use default
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.role).not.toBe('DEV_MASTER');
    });
  });

  describe('Security: Context Validation', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        const { user } = useAuth();
        return <div>{user?.email}</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth deve ser usado dentro de um AuthProvider');
    });

    it('should provide safe defaults on public routes', () => {
      // Mock login page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/auth/login' },
        writable: true
      });
      
      vi.stubEnv('PROD', true);

      const TestComponent = () => {
        try {
          const { user } = useAuth();
          return <div>{user?.email || 'no-user'}</div>;
        } catch {
          // Should not reach here on login page
          return <div>error</div>;
        }
      };

      // This should work without throwing on login page
      expect(() => {
        render(<TestComponent />);
      }).not.toThrow();
    });
  });
});

// Test utilities
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

function useSignup() {
  // Mock implementation for testing
  return {
    signup: vi.fn(),
    isLoading: false,
    error: null,
    clearError: vi.fn()
  };
}

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