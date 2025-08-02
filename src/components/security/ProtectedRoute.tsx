import { Navigate } from 'react-router-dom';
import { usePermissions, PermissionType } from '@/hooks/security/usePermissions';
import { UserRole } from '@/types/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldOff } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: PermissionType | PermissionType[];
  customCheck?: () => boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Componente para proteger rotas com base em roles e permissões
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  customCheck,
  fallback,
  redirectTo = '/dashboard'
}: ProtectedRouteProps) {
  const { role, hasPermission } = usePermissions();

  // Verificar role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !roles.includes(role)) {
      return fallback || <Navigate to={redirectTo} replace />;
    }
  }

  // Verificar permissões
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasAllPermissions = permissions.every(p => hasPermission(p));
    
    if (!hasAllPermissions) {
      return fallback || <Navigate to={redirectTo} replace />;
    }
  }

  // Verificação customizada
  if (customCheck && !customCheck()) {
    return fallback || <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

interface ProtectedActionProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: PermissionType | PermissionType[];
  customCheck?: () => boolean;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Componente para proteger ações/elementos com base em permissões
 */
export function ProtectedAction({
  children,
  requiredRole,
  requiredPermission,
  customCheck,
  fallback,
  showError = false
}: ProtectedActionProps) {
  const { role, hasPermission } = usePermissions();

  let hasAccess = true;

  // Verificar role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    hasAccess = hasAccess && (!!role && roles.includes(role));
  }

  // Verificar permissões
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    hasAccess = hasAccess && permissions.every(p => hasPermission(p));
  }

  // Verificação customizada
  if (customCheck) {
    hasAccess = hasAccess && customCheck();
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <ShieldOff className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar este conteúdo.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</> || null;
  }

  return <>{children}</>;
}

interface ConditionalRenderProps {
  if: boolean | (() => boolean);
  children: React.ReactNode;
  else?: React.ReactNode;
}

/**
 * Componente utilitário para renderização condicional
 */
export function ConditionalRender({ if: condition, children, else: elseContent }: ConditionalRenderProps) {
  const shouldRender = typeof condition === 'function' ? condition() : condition;
  return <>{shouldRender ? children : elseContent}</>;
}