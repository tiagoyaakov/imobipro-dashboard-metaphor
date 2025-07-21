import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ForgotPasswordForm, ForgotPasswordSuccess } from '@/components/auth/ForgotPasswordForm';

// -----------------------------------------------------------
// Página de Recuperação de Senha
// -----------------------------------------------------------

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  /**
   * Mostrar tela de sucesso após envio
   */
  const handleResetSuccess = (email: string) => {
    setResetEmail(email);
  };

  /**
   * Voltar para login
   */
  const handleBackToLogin = () => {
    navigate('/auth/login');
  };

  /**
   * Reenviar email de recuperação
   */
  const handleResendClick = () => {
    setResetEmail(null);
    // Volta para o formulário para reenviar
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
        {resetEmail ? (
          <ForgotPasswordSuccess
            email={resetEmail}
            onBackToLogin={handleBackToLogin}
            onResendClick={handleResendClick}
          />
        ) : (
          <ForgotPasswordForm
            onSuccess={handleResetSuccess}
            onBackClick={handleBackToLogin}
          />
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 