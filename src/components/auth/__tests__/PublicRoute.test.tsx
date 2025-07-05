import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicRoute } from '../PublicRoute';

// Mock do hook useAuth do Clerk
const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@clerk/react-router', async () => {
  const original = await vi.importActual<typeof import('@clerk/react-router')>('@clerk/react-router');
  return {
    ...original,
    useAuth: useAuthMock,
  };
});

const TestComponent = () => <div>Conteúdo Público</div>;
const DashboardComponent = () => <div>Página do Dashboard</div>;

const renderComponent = (isLoaded: boolean, isSignedIn: boolean) => {
  useAuthMock.mockReturnValue({ isLoaded, isSignedIn });
  
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <TestComponent />
            </PublicRoute>
          }
        />
        <Route path="/dashboard" element={<DashboardComponent />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('PublicRoute', () => {
  it('deve renderizar o fallback de carregamento enquanto o estado de autenticação está sendo carregado', () => {
    renderComponent(false, false);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('deve renderizar o componente filho se o usuário NÃO estiver autenticado', () => {
    renderComponent(true, false);
    expect(screen.getByText('Conteúdo Público')).toBeInTheDocument();
  });

  it('deve redirecionar para o dashboard se o usuário ESTIVER autenticado', async () => {
    renderComponent(true, true);
    
    await waitFor(() => {
      expect(screen.getByText('Página do Dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Conteúdo Público')).not.toBeInTheDocument();
  });
}); 