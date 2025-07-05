import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock do hook useAuth do Clerk
const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@clerk/react-router', async () => {
  const original = await vi.importActual<typeof import('@clerk/react-router')>('@clerk/react-router');
  return {
    ...original,
    useAuth: useAuthMock,
  };
});

const TestComponent = () => <div>Conteúdo Protegido</div>;
const LoginComponent = () => <div>Página de Login</div>;

const renderComponent = (isLoaded: boolean, isSignedIn: boolean) => {
  useAuthMock.mockReturnValue({ isLoaded, isSignedIn });
  
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginComponent />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('deve renderizar o fallback de carregamento enquanto o estado de autenticação está sendo carregado', () => {
    renderComponent(false, false);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
  });

  it('deve renderizar o componente filho se o usuário estiver autenticado', () => {
    renderComponent(true, true);
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
  });

  it('deve redirecionar para a página de login se o usuário não estiver autenticado', async () => {
    renderComponent(true, false);
    
    await waitFor(() => {
      expect(screen.getByText('Página de Login')).toBeInTheDocument();
    });
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
  });
}); 