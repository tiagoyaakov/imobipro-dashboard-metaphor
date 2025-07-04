import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Roles necessárias para acessar esta rota
   * Se não especificado, apenas autenticação é necessária
   */
  requiredRoles?: string[];
  /**
   * Rota de fallback se não autorizado
   * Padrão: '/auth/login'
   */
  fallbackRoute?: string;
}

/**
 * Componente para proteger rotas que requerem autenticação
 * 
 * @param children - Componente filho a ser renderizado se autorizado
 * @param requiredRoles - Roles necessárias (opcional)
 * @param fallbackRoute - Rota de redirecionamento (padrão: /auth/login)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackRoute = '/auth/login'
}) => {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto inicializa a sessão
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    console.log('🔐 [ProtectedRoute] Redirecionando para login - usuário não autenticado');
    return (
      <Navigate 
        to={fallbackRoute} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Se está autenticado mas perfil ainda está carregando, mostrar loading
  if (!user && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Carregando perfil do usuário...</p>
        </div>
      </div>
    );
  }

  // Verificar roles se especificadas
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user.role === role);
    
    if (!hasRequiredRole) {
      console.log('🔐 [ProtectedRoute] Acesso negado - role insuficiente:', {
        userRole: user.role,
        requiredRoles,
        route: location.pathname
      });
      
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ from: location, requiredRoles }} 
          replace 
        />
      );
    }
  }

  // Usuário autenticado e autorizado
  console.log('🔐 [ProtectedRoute] Acesso autorizado:', {
    user: user.email,
    role: user.role,
    route: location.pathname
  });
  
  return <>{children}</>;
};

export default ProtectedRoute; 