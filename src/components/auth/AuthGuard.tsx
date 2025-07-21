import React from 'react';
import { usePermissions } from './PrivateRoute';
import { AuthPermissionDenied } from './AuthErrorDisplay';

// -----------------------------------------------------------
// Componente de Guard de Autenticação
// -----------------------------------------------------------

interface AuthGuardProps {
  /** Conteúdo a ser renderizado se autorizado */
  children: React.ReactNode;
  /** Roles permitidas */
  allowedRoles?: Array<'CREATOR' | 'ADMIN' | 'AGENT'>;
  /** Comportamento quando não autorizado */
  fallback?: 'hide' | 'show-error' | React.ReactNode;
  /** Callback quando acesso negado */
  onAccessDenied?: () => void;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
  fallback = 'hide',
  onAccessDenied,
}) => {
  const { canAccess } = usePermissions();

  const hasAccess = canAccess(allowedRoles);

  // Se não tem acesso, executar callback se fornecido
  if (!hasAccess && onAccessDenied) {
    onAccessDenied();
  }

  // Se tem acesso, renderizar conteúdo
  if (hasAccess) {
    return <>{children}</>;
  }

  // Se não tem acesso, aplicar fallback
  if (fallback === 'hide') {
    return null;
  }

  if (fallback === 'show-error') {
    return <AuthPermissionDenied />;
  }

  // Fallback customizado
  if (React.isValidElement(fallback)) {
    return <>{fallback}</>;
  }

  return null;
};

// -----------------------------------------------------------
// Guards Específicos para UI
// -----------------------------------------------------------

interface RoleGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const CreatorOnly: React.FC<RoleGuardProps> = ({ children, fallback }) => (
  <AuthGuard allowedRoles={['CREATOR']} fallback={fallback}>
    {children}
  </AuthGuard>
);

export const AdminOnly: React.FC<RoleGuardProps> = ({ children, fallback }) => (
  <AuthGuard allowedRoles={['ADMIN', 'CREATOR']} fallback={fallback}>
    {children}
  </AuthGuard>
);

export const AgentOnly: React.FC<RoleGuardProps> = ({ children, fallback }) => (
  <AuthGuard allowedRoles={['AGENT', 'ADMIN', 'CREATOR']} fallback={fallback}>
    {children}
  </AuthGuard>
);

// -----------------------------------------------------------
// Componente de Verificação de Feature
// -----------------------------------------------------------

interface FeatureGuardProps {
  /** Nome da feature */
  feature: string;
  /** Conteúdo a ser renderizado se feature estiver habilitada */
  children: React.ReactNode;
  /** Fallback quando feature não disponível */
  fallback?: React.ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  // Mapa de features por role (pode ser expandido)
  const { isCreator, isAdmin, isAgent } = usePermissions();

  const featureAccess: Record<string, boolean> = {
    // Features de administração
    'user-management': isCreator || isAdmin,
    'system-settings': isCreator || isAdmin,
    'reports-advanced': isCreator || isAdmin,
    'billing': isCreator,
    
    // Features de agente
    'lead-management': isAgent || isAdmin || isCreator,
    'property-management': isAgent || isAdmin || isCreator,
    'client-communication': isAgent || isAdmin || isCreator,
    
    // Features gerais
    'dashboard': true,
    'profile': true,
    'notifications': true,
  };

  const hasAccess = featureAccess[feature] ?? false;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// -----------------------------------------------------------
// Hook para Controle de Features
// -----------------------------------------------------------

export const useFeatureAccess = () => {
  const { isCreator, isAdmin, isAgent } = usePermissions();

  const hasFeature = (feature: string): boolean => {
    const featureAccess: Record<string, boolean> = {
      // Features de administração
      'user-management': isCreator || isAdmin,
      'system-settings': isCreator || isAdmin,
      'reports-advanced': isCreator || isAdmin,
      'billing': isCreator,
      'company-settings': isCreator || isAdmin,
      
      // Features de agente
      'lead-management': isAgent || isAdmin || isCreator,
      'property-management': isAgent || isAdmin || isCreator,
      'client-communication': isAgent || isAdmin || isCreator,
      'appointment-scheduling': isAgent || isAdmin || isCreator,
      
      // Features de CRM
      'crm-automation': isAdmin || isCreator,
      'crm-analytics': isAdmin || isCreator,
      'lead-scoring': isAdmin || isCreator,
      
      // Features gerais
      'dashboard': true,
      'profile': true,
      'notifications': true,
      'help': true,
    };

    return featureAccess[feature] ?? false;
  };

  return {
    hasFeature,
    features: {
      // Administração
      canManageUsers: hasFeature('user-management'),
      canManageSystem: hasFeature('system-settings'),
      canViewAdvancedReports: hasFeature('reports-advanced'),
      canManageBilling: hasFeature('billing'),
      canManageCompany: hasFeature('company-settings'),
      
      // Operações
      canManageLeads: hasFeature('lead-management'),
      canManageProperties: hasFeature('property-management'),
      canCommunicateWithClients: hasFeature('client-communication'),
      canScheduleAppointments: hasFeature('appointment-scheduling'),
      
      // CRM Avançado
      canUseCrmAutomation: hasFeature('crm-automation'),
      canViewCrmAnalytics: hasFeature('crm-analytics'),
      canUseLeadScoring: hasFeature('lead-scoring'),
    }
  };
};

// -----------------------------------------------------------
// Componente de Menu Condicional
// -----------------------------------------------------------

interface ConditionalMenuItemProps {
  /** Roles permitidas para ver o item */
  allowedRoles?: Array<'CREATOR' | 'ADMIN' | 'AGENT'>;
  /** Feature necessária */
  requiredFeature?: string;
  /** Conteúdo do item de menu */
  children: React.ReactNode;
}

export const ConditionalMenuItem: React.FC<ConditionalMenuItemProps> = ({
  allowedRoles,
  requiredFeature,
  children,
}) => {
  const { canAccess } = usePermissions();
  const { hasFeature } = useFeatureAccess();

  // Verificar permissão de role
  const hasRoleAccess = canAccess(allowedRoles);

  // Verificar feature se especificada
  const hasFeatureAccess = requiredFeature ? hasFeature(requiredFeature) : true;

  // Mostrar item apenas se tiver ambos os acessos
  if (hasRoleAccess && hasFeatureAccess) {
    return <>{children}</>;
  }

  return null;
};

export default AuthGuard; 