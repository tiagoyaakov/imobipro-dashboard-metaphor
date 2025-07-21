import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupForm, SignupSuccess } from '@/components/auth/SignupForm';

// -----------------------------------------------------------
// Página de Registro
// -----------------------------------------------------------

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [signupEmail, setSignupEmail] = useState<string | null>(null);

  /**
   * Mostrar tela de sucesso após registro
   */
  const handleSignupSuccess = () => {
    // Em um cenário real, o email viria do resultado do signup
    // Por enquanto, vamos simular
    setSignupEmail('usuario@exemplo.com');
  };

  /**
   * Navegar para página de login
   */
  const handleLoginClick = () => {
    navigate('/auth/login');
  };

  /**
   * Voltar para login após ver tela de sucesso
   */
  const handleBackToLogin = () => {
    setSignupEmail(null);
    navigate('/auth/login');
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

        {/* Mostrar formulário ou tela de sucesso */}
        {signupEmail ? (
          <SignupSuccess
            email={signupEmail}
            onBackToLogin={handleBackToLogin}
          />
        ) : (
          <SignupForm
            onSuccess={handleSignupSuccess}
            onLoginClick={handleLoginClick}
            showBackToDashboard={true}
          />
        )}
      </div>
    </div>
  );
};

export default SignupPage; 