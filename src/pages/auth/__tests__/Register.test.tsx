import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../Register';

// Mock do componente SignUp do Clerk
vi.mock('@clerk/react-router', () => ({
  SignUp: () => <div data-testid="clerk-signup">Componente SignUp do Clerk</div>,
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

const renderRegisterPage = () => {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
};

describe('RegisterPage', () => {
  it('deve renderizar o título da página corretamente', () => {
    renderRegisterPage();
    
    expect(screen.getByText('Crie sua Conta')).toBeInTheDocument();
  });

  it('deve renderizar a descrição da página', () => {
    renderRegisterPage();
    
    expect(screen.getByText('Preencha os campos abaixo para criar sua conta no ImobiPRO.')).toBeInTheDocument();
  });

  it('deve renderizar o cabeçalho de criação de conta', () => {
    renderRegisterPage();
    
    expect(screen.getByText('Criar uma conta')).toBeInTheDocument();
  });

  it('deve renderizar o subtítulo de instrução', () => {
    renderRegisterPage();
    
    expect(screen.getByText('Insira seus dados para se registrar')).toBeInTheDocument();
  });

  it('deve renderizar o componente SignUp do Clerk', () => {
    renderRegisterPage();
    
    expect(screen.getByTestId('clerk-signup')).toBeInTheDocument();
    expect(screen.getByText('Componente SignUp do Clerk')).toBeInTheDocument();
  });

  it('deve usar o PageTemplate com as props corretas', () => {
    renderRegisterPage();
    
    const pageTemplate = screen.getByTestId('page-template');
    expect(pageTemplate).toBeInTheDocument();
  });

  it('deve renderizar o link para login', () => {
    renderRegisterPage();
    
    expect(screen.getByText(/já tem uma conta/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /já tem uma conta\? faça o login/i })).toBeInTheDocument();
  });
}); 