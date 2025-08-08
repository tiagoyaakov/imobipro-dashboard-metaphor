import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

// -----------------------------------------------------------
// Página de Login
// -----------------------------------------------------------

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Redirecionar para dashboard após login bem-sucedido
   */
  const { user } = useAuth();

  const handleLoginSuccess = () => {
    const role = user?.role;
    if (role === 'DEV_MASTER' || role === 'ADMIN') {
      navigate('/', { replace: true });
    } else {
      navigate('/clientes', { replace: true });
    }
  };

  /**
   * Navegar para página de registro
   */
  const handleSignupClick = () => {
    navigate('/auth/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Container principal */}
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            ImobiPRO
          </h1>
          <p className="text-muted-foreground">
            Sistema de Gestão Imobiliária
          </p>
        </div>

        {/* Formulário de Login */}
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSignupClick={handleSignupClick}
          showBackToDashboard={true}
        />
      </div>
    </div>
  );
};

export default LoginPage; 