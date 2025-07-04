import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
  /**
   * Rota de redirecionamento para usuários autenticados
   * Padrão: '/dashboard'
   */
  redirectTo?: string;
  /**
   * Se true, permite acesso mesmo para usuários autenticados
   * Útil para páginas como "Sobre", "Contato", etc.
   */
  allowAuthenticated?: boolean;
}

/**
 * Componente para rotas públicas que redirecionam usuários autenticados
 * 
 * @param children - Componente filho a ser renderizado
 * @param redirectTo - Rota de redirecionamento para usuários autenticados (padrão: /dashboard)
 * @param allowAuthenticated - Se permite acesso de usuários autenticados (padrão: false)
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/dashboard',
  allowAuthenticated = false
}) => {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto inicializa a sessão
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se permite usuários autenticados, renderizar sempre
  if (allowAuthenticated) {
    return <>{children}</>;
  }

  // Redirecionar usuários autenticados para área restrita
  if (isAuthenticated && user) {
    console.log('🔐 [PublicRoute] Redirecionando usuário autenticado:', {
      user: user.email,
      from: location.pathname,
      to: redirectTo
    });
    
    // Verificar se há uma rota de origem para redirecionamento
    const from = location.state?.from;
    const destination = from?.pathname || redirectTo;
    
    return (
      <Navigate 
        to={destination} 
        replace 
      />
    );
  }

  // Usuário não autenticado pode acessar a rota pública
  console.log('🔐 [PublicRoute] Acesso público autorizado:', location.pathname);
  return <>{children}</>;
};

export default PublicRoute; 