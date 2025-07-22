import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupForm, SignupSuccess } from '@/components/auth/SignupForm';
import { useAuth } from '@/hooks/useAuth';

// -----------------------------------------------------------
// Página de Registro
// -----------------------------------------------------------

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Redirecionar para dashboard se usuário já está autenticado
   */
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('🔐 [SignupPage] Usuário autenticado após signup, redirecionando para dashboard');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  /**
   * Lidar com sucesso do registro
   */
  const handleSignupSuccess = (email: string) => {
    console.log('🎉 [SignupPage] Signup bem-sucedido para:', email);
    setSignupEmail(email);
    setShowSuccess(true);
    
    // Aguardar um momento para o auth state ser atualizado
    // Se após 3 segundos não houve redirecionamento automático,
    // significa que precisa confirmar email
    setTimeout(() => {
      if (!isAuthenticated) {
        console.log('📧 [SignupPage] Aguardando confirmação de email');
      }
    }, 3000);
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
    setShowSuccess(false);
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
        {showSuccess && signupEmail ? (
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