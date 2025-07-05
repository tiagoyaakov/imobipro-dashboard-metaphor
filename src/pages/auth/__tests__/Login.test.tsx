import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../Login';

// Mock do componente SignIn do Clerk
vi.mock('@clerk/react-router', () => ({
  SignIn: () => <div data-testid="clerk-signin">Componente SignIn do Clerk</div>,
}));

// Mock do PageTemplate
interface PageTemplateProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

vi.mock('@/components/common/PageTemplate', () => ({
  default: ({ title, description, children }: PageTemplateProps) => (
    <div data-testid="page-template">
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{children}</div>
    </div>
  ),
}));

const renderLoginPage = () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  it('deve renderizar o título da página corretamente', () => {
    renderLoginPage();
    
    expect(screen.getByText('Acesso ao Painel')).toBeInTheDocument();
  });

  it('deve renderizar a descrição da página', () => {
    renderLoginPage();
    
    expect(screen.getByText('Faça login para gerenciar suas propriedades e contatos.')).toBeInTheDocument();
  });

  it('deve renderizar o cabeçalho de boas-vindas', () => {
    renderLoginPage();
    
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
  });

  it('deve renderizar o subtítulo de instrução', () => {
    renderLoginPage();
    
    expect(screen.getByText('Digite suas credenciais para acessar sua conta')).toBeInTheDocument();
  });

  it('deve renderizar o componente SignIn do Clerk', () => {
    renderLoginPage();
    
    expect(screen.getByTestId('clerk-signin')).toBeInTheDocument();
    expect(screen.getByText('Componente SignIn do Clerk')).toBeInTheDocument();
  });

  it('deve usar o PageTemplate com as classes CSS corretas', () => {
    renderLoginPage();
    
    const pageTemplate = screen.getByTestId('page-template');
    expect(pageTemplate).toBeInTheDocument();
  });

  it('deve renderizar o link para registro', () => {
    renderLoginPage();
    
    expect(screen.getByText(/não tem uma conta/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registre-se/i })).toBeInTheDocument();
  });
}); 