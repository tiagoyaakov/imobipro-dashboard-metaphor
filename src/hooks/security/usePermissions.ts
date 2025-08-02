import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

/**
 * Hook para validação de permissões no frontend
 * Complementa as políticas RLS do backend
 */
export function usePermissions() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Verificar se é DEV_MASTER
  const isDevMaster = useCallback(() => {
    return user?.role === 'DEV_MASTER';
  }, [user?.role]);

  // Verificar se é ADMIN (inclui DEV_MASTER)
  const isAdmin = useCallback(() => {
    return user?.role === 'DEV_MASTER' || user?.role === 'ADMIN';
  }, [user?.role]);

  // Verificar se é AGENT
  const isAgent = useCallback(() => {
    return user?.role === 'AGENT';
  }, [user?.role]);

  // Verificar se tem permissão específica
  const hasPermission = useCallback((permission: PermissionType): boolean => {
    if (!user) return false;

    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions.includes(permission);
  }, [user]);

  // Verificar se pode acessar dados de outro usuário
  const canAccessUser = useCallback((targetUserId: string): boolean => {
    if (!user) return false;

    // DEV_MASTER pode acessar todos
    if (isDevMaster()) return true;

    // ADMIN pode acessar usuários da mesma empresa
    if (isAdmin()) {
      // Aqui seria ideal verificar se o targetUser pertence à mesma empresa
      // Por ora, retornamos true para ADMIN
      return true;
    }

    // AGENT só pode acessar seus próprios dados
    return user.id === targetUserId;
  }, [user, isDevMaster, isAdmin]);

  // Verificar se pode editar recurso
  const canEdit = useCallback((resource: ResourceType, ownerId?: string): boolean => {
    if (!user) return false;

    switch (resource) {
      case 'company':
        return isDevMaster() || (isAdmin() && user.company_id === ownerId);
      
      case 'user':
        return isDevMaster() || (isAdmin() && ownerId !== user.id);
      
      case 'property':
      case 'contact':
      case 'appointment':
      case 'deal':
        return ownerId === user.id || isAdmin();
      
      case 'chat':
      case 'message':
        return ownerId === user.id || isAdmin();
      
      case 'report':
      case 'workflow':
        return isAdmin();
      
      default:
        return false;
    }
  }, [user, isDevMaster, isAdmin]);

  // Verificar se pode deletar recurso
  const canDelete = useCallback((resource: ResourceType, ownerId?: string): boolean => {
    if (!user) return false;

    switch (resource) {
      case 'company':
      case 'user':
        return isDevMaster();
      
      case 'property':
      case 'deal':
      case 'chat':
        return isAdmin();
      
      case 'contact':
      case 'appointment':
        return ownerId === user.id || isAdmin();
      
      default:
        return false;
    }
  }, [user, isDevMaster, isAdmin]);

  // Validar ação com feedback visual
  const validateAction = useCallback((
    permission: PermissionType | (() => boolean),
    options?: {
      errorMessage?: string;
      successCallback?: () => void;
    }
  ): boolean => {
    const hasAccess = typeof permission === 'function' 
      ? permission() 
      : hasPermission(permission);

    if (!hasAccess) {
      toast({
        title: "Acesso Negado",
        description: options?.errorMessage || "Você não tem permissão para realizar esta ação.",
        variant: "destructive",
      });
      return false;
    }

    options?.successCallback?.();
    return true;
  }, [hasPermission, toast]);

  // Hook para proteger componentes
  const protectComponent = useCallback((
    permission: PermissionType | (() => boolean),
    fallback?: React.ReactNode
  ): {
    hasAccess: boolean;
    fallback: React.ReactNode;
  } => {
    const hasAccess = typeof permission === 'function' 
      ? permission() 
      : hasPermission(permission);

    return {
      hasAccess,
      fallback: fallback || null
    };
  }, [hasPermission]);

  return {
    // Estado do usuário
    user,
    role: user?.role,
    
    // Verificações de role
    isDevMaster,
    isAdmin,
    isAgent,
    
    // Verificações de permissão
    hasPermission,
    canAccessUser,
    canEdit,
    canDelete,
    
    // Validações com feedback
    validateAction,
    protectComponent,
  };
}

// Tipos de permissão
export type PermissionType = 
  | 'companies.create'
  | 'companies.read'
  | 'companies.update'
  | 'companies.delete'
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'users.impersonate'
  | 'properties.create'
  | 'properties.read'
  | 'properties.update'
  | 'properties.delete'
  | 'contacts.create'
  | 'contacts.read'
  | 'contacts.update'
  | 'contacts.delete'
  | 'appointments.create'
  | 'appointments.read'
  | 'appointments.update'
  | 'appointments.delete'
  | 'deals.create'
  | 'deals.read'
  | 'deals.update'
  | 'deals.delete'
  | 'reports.create'
  | 'reports.read'
  | 'reports.update'
  | 'reports.delete'
  | 'settings.access'
  | 'settings.update';

// Tipos de recurso
export type ResourceType = 
  | 'company'
  | 'user'
  | 'property'
  | 'contact'
  | 'appointment'
  | 'deal'
  | 'chat'
  | 'message'
  | 'report'
  | 'workflow';

// Mapeamento de permissões por role
const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  DEV_MASTER: [
    // Acesso total
    'companies.create', 'companies.read', 'companies.update', 'companies.delete',
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.impersonate',
    'properties.create', 'properties.read', 'properties.update', 'properties.delete',
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
    'appointments.create', 'appointments.read', 'appointments.update', 'appointments.delete',
    'deals.create', 'deals.read', 'deals.update', 'deals.delete',
    'reports.create', 'reports.read', 'reports.update', 'reports.delete',
    'settings.access', 'settings.update',
  ],
  
  ADMIN: [
    // Gestão da empresa
    'companies.read', 'companies.update',
    'users.create', 'users.read', 'users.update', 'users.impersonate',
    'properties.create', 'properties.read', 'properties.update', 'properties.delete',
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
    'appointments.create', 'appointments.read', 'appointments.update', 'appointments.delete',
    'deals.create', 'deals.read', 'deals.update', 'deals.delete',
    'reports.create', 'reports.read', 'reports.update', 'reports.delete',
    'settings.access', 'settings.update',
  ],
  
  AGENT: [
    // Operações básicas
    'companies.read',
    'users.read',
    'properties.create', 'properties.read', 'properties.update',
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
    'appointments.create', 'appointments.read', 'appointments.update', 'appointments.delete',
    'deals.create', 'deals.read', 'deals.update',
    'reports.read',
  ],
};