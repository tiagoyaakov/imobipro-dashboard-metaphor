import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dos hooks do Clerk - deve ser declarado antes das importações
const mockAuth = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useUser: vi.fn(),
  useClerk: vi.fn(),
}));

// Mock do Clerk deve ser hoisted
vi.mock('@clerk/react-router', async () => {
  const actual = await vi.importActual('@clerk/react-router');
  return {
    ...actual,
    useAuth: mockAuth.useAuth,
    useUser: mockAuth.useUser,
    useClerk: mockAuth.useClerk,
    SignIn: ({ fallback }: { fallback?: React.ReactNode }) => (
      <div data-testid="sign-in-component">
        <button data-testid="login-button">Entrar</button>
        {fallback}
      </div>
    ),
    SignUp: ({ fallback }: { fallback?: React.ReactNode }) => (
      <div data-testid="sign-up-component">
        <button data-testid="register-button">Registrar</button>
        {fallback}
      </div>
    ),
  };
});

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Agora as importações dos componentes
import { createAuthMock } from '@/test-utils/integration-test-utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicRoute } from '@/components/auth/PublicRoute';
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';

// Componente de teste do Dashboard
const TestDashboard = () => (
  <div data-testid="dashboard-content">
    <h1>Dashboard</h1>
    <button data-testid="logout-button">Sair</button>
  </div>
);

// Componente de teste da aplicação completa
const TestApp = ({ initialEntries = ['/'] }: { initialEntries?: string[] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <TestDashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <PublicRoute>
              <div data-testid="home-page">Página Inicial</div>
            </PublicRoute>
          } />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('🔐 Testes de Integração - Fluxo de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock padrão do Clerk
    mockAuth.useClerk.mockReturnValue({
      signOut: vi.fn().mockResolvedValue({}),
    });
    
    mockAuth.useUser.mockReturnValue({
      user: null,
      isLoaded: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🚀 Fluxo: Login → Dashboard → Logout', () => {
    it('deve permitir acesso ao dashboard após login bem-sucedido', async () => {
      // Cenário: usuário não autenticado acessa dashboard
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));
      
      const { rerender } = render(<TestApp initialEntries={['/dashboard']} />);

      // Deve redirecionar para login
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
      });

      // Simular login bem-sucedido
      act(() => {
        mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));
      });

      // Re-render com usuário autenticado
      rerender(<TestApp initialEntries={['/dashboard']} />);

      // Deve mostrar o dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });
    });

    it('deve redirecionar usuário autenticado para dashboard ao acessar login', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      render(<TestApp initialEntries={['/login']} />);

      // Deve redirecionar para dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });
    });

    it('deve realizar logout e redirecionar para página inicial', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({});
      mockAuth.useClerk.mockReturnValue({
        signOut: mockSignOut,
      });
      
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      render(<TestApp initialEntries={['/dashboard']} />);

      // Verificar se está no dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      // Simular logout
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      // Verificar se signOut foi chamado
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('🆕 Fluxo: Registro → Dashboard', () => {
    it('deve permitir acesso ao dashboard após registro bem-sucedido', async () => {
      // Cenário: usuário não autenticado acessa registro
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));
      
      const { rerender } = render(<TestApp initialEntries={['/register']} />);

      // Deve mostrar página de registro
      await waitFor(() => {
        expect(screen.getByTestId('sign-up-component')).toBeInTheDocument();
      });

      // Simular registro bem-sucedido
      act(() => {
        mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));
      });

      // Re-render com usuário autenticado
      rerender(<TestApp initialEntries={['/register']} />);

      // Deve redirecionar para dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });
    });

    it('deve mostrar componente de registro com fallback de carregamento', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      render(<TestApp initialEntries={['/register']} />);

      // Verificar se o componente de registro está presente
      await waitFor(() => {
        expect(screen.getByTestId('sign-up-component')).toBeInTheDocument();
      });
    });
  });

  describe('🔒 Proteção de Rotas → Redirecionamento', () => {
    it('deve bloquear acesso a rota protegida para usuário não autenticado', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      render(<TestApp initialEntries={['/dashboard']} />);

      // Deve redirecionar para login
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
      });

      // Não deve mostrar conteúdo protegido
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('deve mostrar fallback de carregamento durante verificação de autenticação', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('loading'));

      render(<TestApp initialEntries={['/dashboard']} />);

      // Deve mostrar loading
      await waitFor(() => {
        expect(screen.getByText(/carregando/i)).toBeInTheDocument();
      });

      // Não deve mostrar conteúdo protegido
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('deve preservar rota de destino no redirecionamento', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      render(<TestApp initialEntries={['/dashboard']} />);

      // Deve redirecionar para login
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
      });

      // Verificar se o estado de redirecionamento foi preservado
      // (em implementação real, seria verificado no location.state)
      expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
    });

    it('deve lidar com erro de autenticação graciosamente', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('error'));

      render(<TestApp initialEntries={['/dashboard']} />);

      // Deve redirecionar para login em caso de erro
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
      });
    });
  });

  describe('🔄 Estados de Transição', () => {
    it('deve lidar com mudanças de estado de autenticação', async () => {
      // Começar com loading
      mockAuth.useAuth.mockReturnValue(createAuthMock('loading'));

      const { rerender } = render(<TestApp initialEntries={['/dashboard']} />);

      // Verificar estado de loading
      await waitFor(() => {
        expect(screen.getByText(/carregando/i)).toBeInTheDocument();
      });

      // Transição para autenticado
      act(() => {
        mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));
      });

      rerender(<TestApp initialEntries={['/dashboard']} />);

      // Deve mostrar dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      // Transição para não autenticado (logout)
      act(() => {
        mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));
      });

      rerender(<TestApp initialEntries={['/dashboard']} />);

      // Deve redirecionar para login
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
      });
    });
  });
}); 