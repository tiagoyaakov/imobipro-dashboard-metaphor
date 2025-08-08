import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-client';
import { AuthLoadingSpinner } from '@/components/auth/AuthLoadingSpinner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro no callback de autenticação:', error);
          navigate('/auth/login?error=callback_error');
          return;
        }

        if (data?.session) {
          console.log('Usuário autenticado com sucesso via callback');
          navigate('/');
        } else {
          console.log('Nenhuma sessão encontrada, redirecionando para login');
          navigate('/auth/login');
        }
      } catch (error) {
        console.error('Erro inesperado no callback:', error);
        navigate('/auth/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <AuthLoadingSpinner />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Processando autenticação...
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Aguarde enquanto verificamos suas credenciais.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage; 