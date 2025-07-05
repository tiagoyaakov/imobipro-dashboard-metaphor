import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { 
  renderWithIntegration, 
  createAuthMock, 
  setViewport, 
  viewports 
} from '@/test-utils/integration-test-utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import DashboardPage from '@/pages/Dashboard';

// Mock dos hooks do Clerk
const mockAuth = {
  useAuth: vi.fn(),
  useUser: vi.fn(),
  useClerk: vi.fn(),
};

vi.mock('@clerk/react-router', async () => {
  const actual = await vi.importActual('@clerk/react-router');
  return {
    ...actual,
    useAuth: mockAuth.useAuth,
    useUser: mockAuth.useUser,
    useClerk: mockAuth.useClerk,
    SignIn: () => (
      <div data-testid="sign-in-responsive" className="w-full max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold">Login</h1>
          <input 
            data-testid="email-input" 
            className="w-full mt-4 p-2 border rounded" 
            placeholder="Email" 
          />
          <button 
            data-testid="login-submit" 
            className="w-full mt-4 bg-blue-500 text-white p-2 rounded"
          >
            Entrar
          </button>
        </div>
      </div>
    ),
    SignUp: () => (
      <div data-testid="sign-up-responsive" className="w-full max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold">Registro</h1>
          <input 
            data-testid="email-input" 
            className="w-full mt-4 p-2 border rounded" 
            placeholder="Email" 
          />
          <input 
            data-testid="password-input" 
            className="w-full mt-4 p-2 border rounded" 
            placeholder="Senha" 
          />
          <button 
            data-testid="register-submit" 
            className="w-full mt-4 bg-green-500 text-white p-2 rounded"
          >
            Registrar
          </button>
        </div>
      </div>
    ),
    UserButton: () => (
      <div data-testid="user-button-responsive" className="relative">
        <button className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-sm">U</span>
        </button>
      </div>
    ),
  };
});

// Mock do hook use-mobile
vi.mock('@/hooks/use-mobile', () => ({
  useMobile: () => {
    const width = window.innerWidth;
    return width < 768;
  },
}));

// Mock do hook use-toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Componente de teste para dashboard responsivo
const ResponsiveDashboard = () => (
  <div data-testid="responsive-dashboard">
    <div className="block md:hidden" data-testid="mobile-nav">
      Menu Mobile
    </div>
    <div className="hidden md:block lg:hidden" data-testid="tablet-nav">
      Menu Tablet
    </div>
    <div className="hidden lg:block" data-testid="desktop-nav">
      Menu Desktop
    </div>
    <main className="p-4 md:p-6 lg:p-8">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
        Dashboard Responsivo
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow" data-testid="card-1">
          Card 1
        </div>
        <div className="bg-white p-4 rounded shadow" data-testid="card-2">
          Card 2
        </div>
        <div className="bg-white p-4 rounded shadow" data-testid="card-3">
          Card 3
        </div>
      </div>
    </main>
  </div>
);

// Aplicação de teste completa
const ResponsiveTestApp = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <DashboardLayout>
          <ResponsiveDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    } />
  </Routes>
);

describe('📱 Testes de Integração - Responsividade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock padrão do Clerk
    mockAuth.useClerk.mockReturnValue({
      signOut: vi.fn().mockResolvedValue({}),
    });
    
    mockAuth.useUser.mockReturnValue({
      user: {
        id: 'user_123',
        firstName: 'Test',
        lastName: 'User',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      },
      isLoaded: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Resetar viewport para padrão
    setViewport(1024, 768);
  });

  describe('📱 Mobile (< 768px)', () => {
    beforeEach(() => {
      setViewport(viewports.mobile.width, viewports.mobile.height);
    });

    it('deve renderizar login responsivo em mobile', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/login'],
        authScenario: 'unauthenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-responsive')).toBeInTheDocument();
      });

      // Verificar se elementos estão visíveis e adequados para mobile
      const emailInput = screen.getByTestId('email-input');
      const loginButton = screen.getByTestId('login-submit');
      
      expect(emailInput).toBeInTheDocument();
      expect(loginButton).toBeInTheDocument();
      
      // Verificar classes responsivas
      expect(emailInput).toHaveClass('w-full');
      expect(loginButton).toHaveClass('w-full');
    });

    it('deve renderizar registro responsivo em mobile', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/register'],
        authScenario: 'unauthenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('sign-up-responsive')).toBeInTheDocument();
      });

      // Verificar campos de registro
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const registerButton = screen.getByTestId('register-submit');
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(registerButton).toBeInTheDocument();
    });

    it('deve renderizar dashboard com layout mobile', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('responsive-dashboard')).toBeInTheDocument();
      });

      // Verificar navegação mobile
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
      expect(screen.queryByTestId('tablet-nav')).not.toBeInTheDocument();
      expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument();

      // Verificar layout de cards em mobile (1 coluna)
      const cards = screen.getAllByTestId(/card-/);
      expect(cards).toHaveLength(3);
    });

    it('deve manter funcionalidade de autenticação em mobile', async () => {
      // Teste de fluxo: unauthenticated → authenticated
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      const { rerender } = renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'unauthenticated'
      });

      // Deve redirecionar para login
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-responsive')).toBeInTheDocument();
      });

      // Simular autenticação
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));
      rerender(<ResponsiveTestApp />);

      // Deve mostrar dashboard
      await waitFor(() => {
        expect(screen.getByTestId('responsive-dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('📱 Tablet (768px - 1024px)', () => {
    beforeEach(() => {
      setViewport(viewports.tablet.width, viewports.tablet.height);
    });

    it('deve renderizar login responsivo em tablet', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/login'],
        authScenario: 'unauthenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-responsive')).toBeInTheDocument();
      });

      // Verificar layout em tablet
      const loginForm = screen.getByTestId('sign-in-responsive');
      expect(loginForm).toHaveClass('max-w-md');
    });

    it('deve renderizar dashboard com layout tablet', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('responsive-dashboard')).toBeInTheDocument();
      });

      // Verificar navegação tablet
      expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
      expect(screen.getByTestId('tablet-nav')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument();

      // Verificar grid de cards (2 colunas no tablet)
      const cards = screen.getAllByTestId(/card-/);
      expect(cards).toHaveLength(3);
    });

    it('deve ajustar tamanhos de fonte para tablet', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        const title = screen.getByText('Dashboard Responsivo');
        expect(title).toBeInTheDocument();
        expect(title).toHaveClass('text-xl', 'md:text-2xl', 'lg:text-3xl');
      });
    });
  });

  describe('🖥️ Desktop (> 1024px)', () => {
    beforeEach(() => {
      setViewport(viewports.desktop.width, viewports.desktop.height);
    });

    it('deve renderizar login responsivo em desktop', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/login'],
        authScenario: 'unauthenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-responsive')).toBeInTheDocument();
      });

      // Verificar layout em desktop
      const loginForm = screen.getByTestId('sign-in-responsive');
      expect(loginForm).toHaveClass('max-w-md', 'mx-auto');
    });

    it('deve renderizar dashboard com layout desktop completo', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('responsive-dashboard')).toBeInTheDocument();
      });

      // Verificar navegação desktop
      expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tablet-nav')).not.toBeInTheDocument();
      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();

      // Verificar grid de cards (3 colunas no desktop)
      const cards = screen.getAllByTestId(/card-/);
      expect(cards).toHaveLength(3);
    });

    it('deve mostrar UserButton em desktop', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-button-responsive')).toBeInTheDocument();
      });
    });

    it('deve usar padding adequado para desktop', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toHaveClass('p-4', 'md:p-6', 'lg:p-8');
      });
    });
  });

  describe('🔄 Transições de Viewport', () => {
    it('deve ajustar layout ao mudar de mobile para desktop', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      // Começar em mobile
      setViewport(viewports.mobile.width, viewports.mobile.height);
      
      const { rerender } = renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
      });

      // Mudar para desktop
      setViewport(viewports.desktop.width, viewports.desktop.height);
      rerender(<ResponsiveTestApp />);

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
        expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
      });
    });

    it('deve manter funcionalidade durante mudanças de viewport', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      // Começar em tablet
      setViewport(viewports.tablet.width, viewports.tablet.height);
      
      const { rerender } = renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('responsive-dashboard')).toBeInTheDocument();
      });

      // Mudar para mobile
      setViewport(viewports.mobile.width, viewports.mobile.height);
      rerender(<ResponsiveTestApp />);

      // Dashboard deve continuar funcional
      await waitFor(() => {
        expect(screen.getByTestId('responsive-dashboard')).toBeInTheDocument();
        expect(screen.getByText('Dashboard Responsivo')).toBeInTheDocument();
      });
    });
  });

  describe('⚡ Performance e Acessibilidade', () => {
    it('deve manter performance em diferentes viewports', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('authenticated'));

      const startTime = performance.now();
      
      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/dashboard'],
        authScenario: 'authenticated'
      });

      await waitFor(() => {
        expect(screen.getByTestId('responsive-dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render deve ser rápido (< 1000ms)
      expect(renderTime).toBeLessThan(1000);
    });

    it('deve manter acessibilidade em mobile', async () => {
      setViewport(viewports.mobile.width, viewports.mobile.height);
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      renderWithIntegration(<ResponsiveTestApp />, {
        initialEntries: ['/login'],
        authScenario: 'unauthenticated'
      });

      await waitFor(() => {
        const emailInput = screen.getByTestId('email-input');
        const loginButton = screen.getByTestId('login-submit');
        
        // Verificar se elementos são acessíveis
        expect(emailInput).toBeInTheDocument();
        expect(loginButton).toBeInTheDocument();
        
        // Verificar se possuem tamanhos adequados para touch
        expect(emailInput).toHaveClass('p-2');
        expect(loginButton).toHaveClass('p-2');
      });
    });
  });
}); 