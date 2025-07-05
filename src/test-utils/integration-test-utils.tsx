import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ClerkProvider } from '@clerk/react-router';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Tipos específicos para mocks
interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: Array<{
    emailAddress: string;
    verification: { status: string };
  }>;
  primaryEmailAddressId: string;
}

interface MockSession {
  id: string;
  status: string;
  lastActiveAt: Date;
}

interface MockClerkState {
  user: MockUser | null;
  session: MockSession | null;
  organization: null;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  getToken: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
}

// Mock completo do Clerk para testes de integração
export const createMockClerk = (overrides: Partial<MockClerkState> = {}): MockClerkState => ({
  user: {
    id: 'user_test_123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{
      emailAddress: 'test@example.com',
      verification: { status: 'verified' }
    }],
    primaryEmailAddressId: 'email_test_123',
    ...overrides.user
  },
  session: {
    id: 'session_test_123',
    status: 'active',
    lastActiveAt: new Date(),
    ...overrides.session
  },
  organization: null,
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_test_123',
  sessionId: 'session_test_123',
  getToken: vi.fn().mockResolvedValue('mock_jwt_token'),
  signOut: vi.fn().mockResolvedValue({}),
  ...overrides
});

// Mock do sistema de autenticação para diferentes cenários
export const createAuthMock = (scenario: 'loading' | 'authenticated' | 'unauthenticated' | 'error') => {
  switch (scenario) {
    case 'loading':
      return {
        isLoaded: false,
        isSignedIn: false,
        userId: null,
        user: null,
        session: null,
        getToken: vi.fn().mockResolvedValue(null)
      };
    case 'authenticated':
      return createMockClerk();
    case 'unauthenticated':
      return {
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        user: null,
        session: null,
        getToken: vi.fn().mockRejectedValue(new Error('Usuário não autenticado'))
      };
    case 'error':
      return {
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        user: null,
        session: null,
        getToken: vi.fn().mockRejectedValue(new Error('Erro na autenticação'))
      };
  }
};

// QueryClient customizado para testes de integração
const createIntegrationTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface IntegrationTestWrapperProps {
  children: React.ReactNode;
  authScenario?: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  initialEntries?: string[];
  mockApiResponses?: Record<string, unknown>;
}

// Wrapper para testes de integração com mock de API
export function IntegrationTestWrapper({
  children,
  authScenario = 'authenticated',
  initialEntries = ['/'],
  mockApiResponses = {}
}: IntegrationTestWrapperProps) {
  const queryClient = createIntegrationTestQueryClient();
  const publishableKey = "pk_test_integration_test_key";

  // Mock fetch para APIs
  const originalFetch = global.fetch;
  global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const mockResponse = mockApiResponses[url];
    if (mockResponse) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers(),
      });
    }
    return originalFetch(url, options);
  });

  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ClerkProvider 
        publishableKey={publishableKey} 
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    </MemoryRouter>
  );
}

// Função de renderização para testes de integração
export function renderWithIntegration(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & IntegrationTestWrapperProps
) {
  const { authScenario, initialEntries, mockApiResponses, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <IntegrationTestWrapper 
        authScenario={authScenario}
        initialEntries={initialEntries}
        mockApiResponses={mockApiResponses}
      >
        {children}
      </IntegrationTestWrapper>
    ),
    ...renderOptions,
  });
}

// Utilitário para simular delays em testes
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock de servidor para testes de API
export const mockServer = {
  handlers: new Map(),
  
  mockResponse(url: string, response: unknown, options: { status?: number; delay?: number } = {}) {
    this.handlers.set(url, {
      response,
      status: options.status || 200,
      delay: options.delay || 0
    });
  },
  
  clearMocks() {
    this.handlers.clear();
  }
};

// Utilitário para testar responsividade
export const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  window.dispatchEvent(new Event('resize'));
};

// Presets de viewport para testes de responsividade
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 }
}; 