import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader';

// Mock simples do Clerk
vi.mock('@clerk/react-router', () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      id: 'user_123',
      firstName: 'João',
      lastName: 'Silva',
      imageUrl: 'https://example.com/avatar.jpg',
      primaryEmailAddress: { emailAddress: 'joao@example.com' },
      fullName: 'João Silva',
      unsafeMetadata: {}
    }
  }),
  useClerk: () => ({
    signOut: vi.fn()
  }),
}));

// Mock do React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useNavigate: () => vi.fn(),
  };
});

// Mock do Sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock dos ícones do Lucide
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Settings: () => <div>Settings</div>,
  LogOut: () => <div>LogOut</div>,
  User: () => <div>User</div>,
  Phone: () => <div>Phone</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('DashboardHeader', () => {
  it('deve renderizar o campo de busca', () => {
    renderWithRouter(<DashboardHeader />);

    const searchInput = screen.getByPlaceholderText('Buscar propriedades, clientes...');
    expect(searchInput).toBeInTheDocument();
  });

  it('deve renderizar o ícone de busca', () => {
    renderWithRouter(<DashboardHeader />);

    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('deve renderizar o botão de notificações', () => {
    renderWithRouter(<DashboardHeader />);

    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('deve renderizar o título ImobiPRO', () => {
    renderWithRouter(<DashboardHeader />);

    expect(screen.getByText('ImobiPRO')).toBeInTheDocument();
  });

  it('deve ter a estrutura HTML correta', () => {
    const { container } = renderWithRouter(<DashboardHeader />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });
}); 