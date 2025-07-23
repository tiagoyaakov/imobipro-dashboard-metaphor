import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthInitializingSpinner, AuthVerifyingSpinner } from './AuthLoadingSpinner';
import type { UserRole } from '@/integrations/supabase/types';

// -----------------------------------------------------------
// Componente de Rota Privada
// -----------------------------------------------------------

interface PrivateRouteProps {
  /** Componente a ser renderizado se autenticado */
  children: React.ReactNode;
  /** Roles permitidas (opcional - se não especificado, qualquer usuário autenticado pode acessar) */
  allowedRoles?: UserRole[];
  /** Rota para redirecionamento se não autenticado */
  redirectTo?: string;
  /** Se true, mostra loading enquanto verifica autenticação */
  showLoading?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/auth/login',
  showLoading = true,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading && showLoading) {
    return <AuthVerifyingSpinner />;
  }

  // Se não está autenticado, redirecionar para login
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Se tem roles específicas, verificar permissão
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.includes(user.role as UserRole);
    
    if (!hasPermission) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ 
            from: location.pathname,
            requiredRoles: allowedRoles,
            userRole: user.role 
          }} 
          replace 
        />
      );
    }
  }

  // Usuário autenticado e com permissão
  return <>{children}</>;
};

// -----------------------------------------------------------
// Componente de Rota Pública (só para não autenticados)
// -----------------------------------------------------------

interface PublicRouteProps {
  /** Componente a ser renderizado se não autenticado */
  children: React.ReactNode;
  /** Rota para redirecionamento se já estiver autenticado */
  redirectTo?: string;
  /** Se true, mostra loading enquanto verifica autenticação */
  showLoading?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/',
  showLoading = true,
}) => {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading && showLoading) {
    return <AuthInitializingSpinner />;
  }

  // Se já está autenticado, redirecionar
  if (isAuthenticated) {
    // Verificar se veio de uma rota específica
    const from = location.state?.from || redirectTo;
    return <Navigate to={from} replace />;
  }

  // Usuário não autenticado, mostrar conteúdo público
  return <>{children}</>;
};

// -----------------------------------------------------------
// HOC para Proteção de Rotas
// -----------------------------------------------------------

interface WithAuthGuardOptions {
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ComponentType;
}

/**
 * HOC para adicionar proteção de autenticação a um componente
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthGuardOptions = {}
) {
  const AuthGuardedComponent: React.FC<P> = (props) => {
    const { allowedRoles, redirectTo, fallback: Fallback } = options;

    return (
      <PrivateRoute
        allowedRoles={allowedRoles}
        redirectTo={redirectTo}
        showLoading={!Fallback}
      >
        {Fallback ? (
          <React.Suspense fallback={<Fallback />}>
            <Component {...props} />
          </React.Suspense>
        ) : (
          <Component {...props} />
        )}
      </PrivateRoute>
    );
  };

  // Preservar nome do componente para debugging
  AuthGuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;

  return AuthGuardedComponent;
}

// -----------------------------------------------------------
// Guards Específicos por Role
// -----------------------------------------------------------

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PrivateRoute allowedRoles={['ADMIN', 'DEV_MASTER']}>
    {children}
  </PrivateRoute>
);

export const DevMasterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PrivateRoute allowedRoles={['DEV_MASTER']}>
    {children}
  </PrivateRoute>
);

export const AgentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PrivateRoute allowedRoles={['AGENT', 'ADMIN', 'DEV_MASTER']}>
    {children}
  </PrivateRoute>
);

// -----------------------------------------------------------
// Hook para Verificação de Permissões
// -----------------------------------------------------------

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (role: UserRole) => {
    return isAuthenticated && user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return isAuthenticated && user?.role && roles.includes(user.role as UserRole);
  };

  const canAccess = (allowedRoles?: UserRole[]) => {
    if (!isAuthenticated || !user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role as UserRole);
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    canAccess,
    isDevMaster: hasRole('DEV_MASTER'),
    isAdmin: hasRole('ADMIN'),
    isAgent: hasRole('AGENT'),
    canManageUsers: hasAnyRole(['DEV_MASTER', 'ADMIN']),
    canManageSettings: hasAnyRole(['DEV_MASTER', 'ADMIN']),
    canViewReports: hasAnyRole(['DEV_MASTER', 'ADMIN']),
  };
};

export default PrivateRoute; 