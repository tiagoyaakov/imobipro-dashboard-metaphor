import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffectiveUser } from './useImpersonation';
import { toast } from '@/hooks/use-toast';
import type { UserRole } from '@/integrations/supabase/types';
// Removendo import do AuthContextMock - não é mais necessário no contexto real
import { 
  canCreateUsers, 
  canCreateUserWithRole, 
  canViewUsers, 
  canUpdateUserRole, 
  canToggleUserStatus,
  canViewCompanies,
  getAvailableRolesForCreation
} from '@/utils/permissions';

// -----------------------------------------------------------
// Tipos para o módulo de usuários
// -----------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  isActive: boolean;
  companyId: string;
  avatarUrl?: string;
  telefone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRoleParams {
  userId: string;
  newRole: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  reason?: string;
}

export interface ToggleUserStatusParams {
  userId: string;
  newStatus: boolean;
  reason?: string;
}

export interface CreateUserParams {
  email: string;
  name: string;
  role: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  companyId: string;
  avatarUrl?: string;
  telefone?: string;
}

// -----------------------------------------------------------
// Hook principal para listar usuários
// -----------------------------------------------------------

export const useUsers = () => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['users', 'management', currentUser?.role],
    queryFn: async (): Promise<User[]> => {
      // Verificar se usuário atual tem permissão (DEV_MASTER ou ADMIN)
      if (!currentUser || !['DEV_MASTER', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('Acesso negado. Apenas DEV_MASTER e Administradores podem visualizar usuários.');
      }

      console.log('🔄 [useUsers] Buscando usuários para role:', currentUser.role);

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          is_active,
          company_id,
          avatar_url,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useUsers] Erro ao buscar usuários:', error);
        throw new Error('Erro ao carregar lista de usuários');
      }

      console.log('✅ [useUsers] Usuários carregados:', data?.length || 0);
      
      // Mapear dados do banco (snake_case) para interface (camelCase)
      const mappedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role === 'CREATOR' ? 'DEV_MASTER' : user.role as 'DEV_MASTER' | 'ADMIN' | 'AGENT',
        isActive: user.is_active,
        companyId: user.company_id,
        avatarUrl: user.avatar_url,
        telefone: null, // Não está no select, será null
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));
      
      // Filtrar usuários baseado na hierarquia
      let filteredUsers = mappedUsers;
      
      // Se for ADMIN, filtrar para não mostrar DEV_MASTER
      if (currentUser.role === 'ADMIN') {
        filteredUsers = filteredUsers.filter(user => user.role !== 'DEV_MASTER');
        console.log('🔍 [useUsers] Usuários filtrados para ADMIN:', filteredUsers.length);
      }
      
      return filteredUsers;
    },
    enabled: !!currentUser && ['DEV_MASTER', 'ADMIN'].includes(currentUser.role),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos (substituindo cacheTime)
    retry: 2,
    retryDelay: 1000,
  });
};

// -----------------------------------------------------------
// Hook para atualizar função do usuário
// -----------------------------------------------------------

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, newRole, reason }: UpdateUserRoleParams) => {
      // Verificar permissões no frontend (DEV_MASTER ou ADMIN)
      if (!currentUser || !['DEV_MASTER', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('Acesso negado. Apenas DEV_MASTER e Administradores podem alterar funções.');
      }

      if (userId === currentUser.id) {
        throw new Error('Você não pode alterar sua própria função');
      }

      // Verificar hierarquia de permissões
      if (currentUser.role === 'ADMIN') {
        if (newRole === 'DEV_MASTER') {
          throw new Error('Administradores não podem promover usuários para DEV_MASTER');
        }
        if (newRole === 'ADMIN') {
          throw new Error('Administradores não podem criar outros Administradores');
        }
      }
      
      if (currentUser.role === 'DEV_MASTER' && newRole === 'DEV_MASTER') {
        throw new Error('DEV_MASTER não pode criar outros usuários DEV_MASTER');
      }

      console.log('🔄 [useUpdateUserRole] Atualizando função:', { userId, newRole, reason });

      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole,
        reason: reason || null,
      });

      if (error) {
        console.error('❌ [useUpdateUserRole] Erro na função RPC:', error);
        throw new Error(error.message || 'Erro ao atualizar função do usuário');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao atualizar função');
      }

      console.log('✅ [useUpdateUserRole] Função atualizada com sucesso:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Mostrar toast de sucesso
      toast({
        title: 'Função Atualizada',
        description: `Usuário promovido para ${variables.newRole} com sucesso.`,
      });

      console.log('🎉 [useUpdateUserRole] Cache invalidado e toast exibido');
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdateUserRole] Erro na mutation:', error);
      toast({
        title: 'Erro ao Atualizar Função',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// -----------------------------------------------------------
// Hook para criar novo usuário
// -----------------------------------------------------------

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      // Verificar permissões no frontend
      if (!currentUser || (currentUser.role !== 'DEV_MASTER' && currentUser.role !== 'ADMIN')) {
        throw new Error('Acesso negado. Apenas DEV_MASTER e ADMIN podem criar usuários.');
      }

      // Validar hierarquia de permissões
      if (currentUser.role === 'ADMIN' && params.role !== 'AGENT') {
        throw new Error('Administradores podem criar apenas Corretores.');
      }

      if (currentUser.role === 'DEV_MASTER' && params.role === 'DEV_MASTER') {
        throw new Error('DEV_MASTER não pode criar outros usuários DEV_MASTER.');
      }

      console.log('🔄 [useCreateUser] Criando usuário:', params);

      const { data, error } = await supabase.rpc('create_user', {
        user_email: params.email,
        user_name: params.name,
        user_role: params.role,
        user_company_id: params.companyId,
        user_telefone: params.telefone || null,
        user_avatar_url: params.avatarUrl || null,
      });

      if (error) {
        console.error('❌ [useCreateUser] Erro na função RPC:', error);
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao criar usuário');
      }

      console.log('✅ [useCreateUser] Usuário criado com sucesso:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Mostrar toast de sucesso
      toast({
        title: 'Usuário Criado',
        description: `Usuário ${variables.name} criado com sucesso.`,
      });

      console.log('🎉 [useCreateUser] Cache invalidado e toast exibido');
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateUser] Erro na mutation:', error);
      toast({
        title: 'Erro ao Criar Usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// -----------------------------------------------------------
// Hook para ativar/desativar usuário
// -----------------------------------------------------------

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, newStatus, reason }: ToggleUserStatusParams) => {
      // Verificar permissões no frontend (DEV_MASTER ou ADMIN)
      if (!currentUser || !['DEV_MASTER', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('Acesso negado. Apenas DEV_MASTER e Administradores podem alterar status.');
      }

      if (userId === currentUser.id) {
        throw new Error('Você não pode alterar seu próprio status');
      }

      console.log('🔄 [useToggleUserStatus] Alterando status:', { userId, newStatus, reason });

      const { data, error } = await supabase.rpc('toggle_user_status', {
        target_user_id: userId,
        new_status: newStatus,
        reason: reason || null,
      });

      if (error) {
        console.error('❌ [useToggleUserStatus] Erro na função RPC:', error);
        throw new Error(error.message || 'Erro ao alterar status do usuário');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao alterar status');
      }

      console.log('✅ [useToggleUserStatus] Status alterado com sucesso:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Mostrar toast de sucesso
      const statusText = variables.newStatus ? 'ativado' : 'desativado';
      toast({
        title: 'Status Atualizado',
        description: `Usuário ${statusText} com sucesso.`,
      });

      console.log('🎉 [useToggleUserStatus] Cache invalidado e toast exibido');
    },
    onError: (error: Error) => {
      console.error('❌ [useToggleUserStatus] Erro na mutation:', error);
      toast({
        title: 'Erro ao Alterar Status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// -----------------------------------------------------------
// Hook para verificar permissões do usuário atual
// -----------------------------------------------------------

export const useUserPermissions = () => {
  const { user: originalUser } = useAuth();
  const { effectiveUser } = useEffectiveUser();

  // Para gestão de usuários, sempre usar o usuário original (admin)
  // Para outras permissões, usar o usuário efetivo (impersonado se ativo)
  const userForManagement = originalUser;
  const userForPermissions = effectiveUser || originalUser;

  return {
    // Permissões de gestão (baseadas no usuário original)
    canManageUsers: canViewUsers(userForManagement?.role),
    canCreateUsers: canCreateUsers(userForManagement?.role),
    canViewUsers: canViewUsers(userForManagement?.role),
    canUpdateUserRole: (targetRole?: UserRole) => canUpdateUserRole(userForManagement?.role, targetRole),
    canToggleUserStatus: (targetRole?: UserRole) => canToggleUserStatus(userForManagement?.role, targetRole),
    canViewCompanies: canViewCompanies(userForManagement?.role),
    canPromoteToAdmin: userForManagement?.role === 'DEV_MASTER', // Apenas DEV_MASTER pode promover a ADMIN
    canManageAgents: userForManagement?.role === 'ADMIN', // ADMIN pode gerenciar AGENT
    
    // Permissões do usuário efetivo (podem ser impersonadas)
    isCurrentUserDevMaster: userForPermissions?.role === 'DEV_MASTER',
    isCurrentUserAdmin: userForPermissions?.role === 'ADMIN',
    isCurrentUserAgent: userForPermissions?.role === 'AGENT',
    
    // IDs
    currentUserId: userForPermissions?.id,
    originalUserId: originalUser?.id, // ID do admin original
    
    // Hierarquia
    currentUserRole: userForPermissions?.role as UserRole,
    originalUserRole: originalUser?.role as UserRole,
    
    // Helpers
    hasAdminPermissions: userForPermissions?.role === 'DEV_MASTER' || userForPermissions?.role === 'ADMIN',
    canManageOtherUser: (targetUser: { role: UserRole } | null) => {
      if (!userForManagement || !targetUser) return false;
      
      // DEV_MASTER pode gerenciar qualquer usuário
      if (userForManagement.role === 'DEV_MASTER') return true;
      
      // ADMIN pode gerenciar apenas AGENT
      if (userForManagement.role === 'ADMIN') {
        return targetUser.role === 'AGENT';
      }
      
      // AGENT não pode gerenciar ninguém
      return false;
    },
    getAvailableRolesForCreation: () => getAvailableRolesForCreation(userForManagement?.role),
  };
};

// -----------------------------------------------------------
// Hook para estatísticas de usuários
// -----------------------------------------------------------

export const useUserStats = () => {
  const { data: users = [] } = useUsers();

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    byRole: {
      DEV_MASTER: users.filter(u => u.role === 'DEV_MASTER').length,
      ADMIN: users.filter(u => u.role === 'ADMIN').length,
      AGENT: users.filter(u => u.role === 'AGENT').length,
    },
    recentSignups: users.filter(u => {
      const daysDiff = Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length,
  };

  return stats;
}; 

// -----------------------------------------------------------
// Hook para buscar empresas disponíveis
// -----------------------------------------------------------

export const useCompanies = () => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Array<{ id: string; name: string }>> => {
      // Verificar se usuário atual tem permissão
      if (!currentUser || (currentUser.role !== 'DEV_MASTER' && currentUser.role !== 'ADMIN')) {
        throw new Error('Acesso negado. Apenas DEV_MASTER e ADMIN podem visualizar empresas.');
      }

      const { data, error } = await supabase.rpc('get_available_companies');

      if (error) {
        console.error('❌ [useCompanies] Erro ao buscar empresas:', error);
        throw new Error('Erro ao carregar lista de empresas');
      }

      console.log('✅ [useCompanies] Empresas carregadas:', data?.length || 0);
      return data || [];
    },
    enabled: !!currentUser && (currentUser.role === 'DEV_MASTER' || currentUser.role === 'ADMIN'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: 1000,
  });
};