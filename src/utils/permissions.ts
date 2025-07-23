import type { UserRole } from '@/integrations/supabase/types';

// -----------------------------------------------------------
// VALIDAÇÕES DE PERMISSÃO - ImobiPRO Dashboard
// -----------------------------------------------------------

/**
 * Verifica se um usuário pode criar outros usuários
 */
export const canCreateUsers = (userRole?: UserRole): boolean => {
  return userRole === 'DEV_MASTER' || userRole === 'ADMIN';
};

/**
 * Verifica se um usuário pode criar usuários com uma função específica
 */
export const canCreateUserWithRole = (
  adminRole?: UserRole, 
  targetRole?: UserRole
): boolean => {
  if (!adminRole || !targetRole) return false;

  switch (adminRole) {
    case 'DEV_MASTER':
      // DEV_MASTER pode criar ADMIN e AGENT (mas não outros DEV_MASTER)
      return targetRole !== 'DEV_MASTER';
    case 'ADMIN':
      // ADMIN pode criar apenas AGENT
      return targetRole === 'AGENT';
    default:
      return false;
  }
};

/**
 * Verifica se um usuário pode gerenciar outro usuário
 */
export const canManageUser = (
  adminRole?: UserRole, 
  targetRole?: UserRole
): boolean => {
  if (!adminRole || !targetRole) return false;

  switch (adminRole) {
    case 'DEV_MASTER':
      // DEV_MASTER pode gerenciar ADMIN e AGENT (mas não outros DEV_MASTER)
      return targetRole !== 'DEV_MASTER';
    case 'ADMIN':
      // ADMIN pode gerenciar apenas AGENT
      return targetRole === 'AGENT';
    default:
      return false;
  }
};

/**
 * Verifica se um usuário pode visualizar a lista de usuários
 */
export const canViewUsers = (userRole?: UserRole): boolean => {
  return userRole === 'DEV_MASTER' || userRole === 'ADMIN';
};

/**
 * Verifica se um usuário pode atualizar a função de outro usuário
 */
export const canUpdateUserRole = (
  adminRole?: UserRole, 
  targetRole?: UserRole
): boolean => {
  return canManageUser(adminRole, targetRole);
};

/**
 * Verifica se um usuário pode ativar/desativar outro usuário
 */
export const canToggleUserStatus = (
  adminRole?: UserRole, 
  targetRole?: UserRole
): boolean => {
  return canManageUser(adminRole, targetRole);
};

/**
 * Verifica se um usuário pode visualizar empresas
 */
export const canViewCompanies = (userRole?: UserRole): boolean => {
  return userRole === 'DEV_MASTER' || userRole === 'ADMIN';
};

/**
 * Obtém as opções de função disponíveis para criação baseadas no role do usuário atual
 */
export const getAvailableRolesForCreation = (adminRole?: UserRole): UserRole[] => {
  if (!adminRole) return [];

  switch (adminRole) {
    case 'DEV_MASTER':
      return ['ADMIN', 'AGENT'];
    case 'ADMIN':
      return ['AGENT'];
    default:
      return [];
  }
};

/**
 * Valida se um email é válido para criação de usuário
 */
export const validateUserEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Valida se um nome é válido para criação de usuário
 */
export const validateUserName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100;
};

/**
 * Valida se um telefone é válido (formato brasileiro)
 */
export const validateUserPhone = (phone: string): boolean => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos (com DDD)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

/**
 * Gera mensagem de erro para permissão negada
 */
export const getPermissionDeniedMessage = (
  action: string, 
  adminRole?: UserRole
): string => {
  const roleName = adminRole ? getRoleDisplayName(adminRole) : 'Usuário';
  return `${roleName} não tem permissão para ${action}.`;
};

/**
 * Obtém o nome de exibição de um role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    'DEV_MASTER': 'Dev Master',
    'ADMIN': 'Administrador',
    'AGENT': 'Corretor',
  };
  return roleNames[role] || role;
};

/**
 * Obtém a descrição de um role
 */
export const getRoleDescription = (role: UserRole): string => {
  const roleDescriptions: Record<UserRole, string> = {
    'DEV_MASTER': 'Administrador global do sistema com acesso total',
    'ADMIN': 'Administrador da imobiliária com gestão de corretores',
    'AGENT': 'Corretor com acesso às funcionalidades de vendas',
  };
  return roleDescriptions[role] || 'Função não definida';
}; 