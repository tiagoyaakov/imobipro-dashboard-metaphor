import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { UserRole } from '@/integrations/supabase/types';

// -----------------------------------------------------------
// HOOKS REAIS PARA USUÁRIOS - USA FUNÇÕES RPC DO SUPABASE
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

export interface Company {
  id: string;
  name: string;
}

export interface CreateUserParams {
  email: string;
  name: string;
  role: 'ADMIN' | 'AGENT';
  companyId: string;
  telefone?: string;
  avatarUrl?: string;
}

// -----------------------------------------------------------
// Hook para buscar empresas disponíveis (USA RPC)
// -----------------------------------------------------------

export const useCompaniesReal = () => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['companies', 'rpc'],
    queryFn: async (): Promise<Company[]> => {
      console.log('🔄 [useCompaniesReal] Buscando empresas via RPC...');

      // Chamar função RPC get_available_companies
      const { data, error } = await supabase.rpc('get_available_companies');

      if (error) {
        console.error('❌ [useCompaniesReal] Erro ao buscar empresas:', error);
        throw new Error(`Erro ao carregar empresas: ${error.message}`);
      }

      console.log('✅ [useCompaniesReal] Empresas carregadas:', data?.length || 0);
      return data || [];
    },
    enabled: !!currentUser && ['DEV_MASTER', 'ADMIN'].includes(currentUser.role),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: 1000,
  });
};

// -----------------------------------------------------------
// Hook para criar usuário (USA RPC)
// -----------------------------------------------------------

export const useCreateUserReal = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      console.log('🔄 [useCreateUserReal] Criando usuário:', { ...params, email: '[HIDDEN]' });

      // Chamar função RPC create_user
      const { data, error } = await supabase.rpc('create_user', {
        user_email: params.email,
        user_name: params.name,
        user_role: params.role,
        user_company_id: params.companyId,
        user_telefone: params.telefone || null,
        user_avatar_url: params.avatarUrl || null,
      });

      if (error) {
        console.error('❌ [useCreateUserReal] Erro RPC:', error);
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      }

      // Verificar se a função retornou erro
      if (data && !data.success) {
        console.error('❌ [useCreateUserReal] Erro na função:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ [useCreateUserReal] Usuário criado:', data);
      return data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast({
        title: 'Usuário Criado',
        description: `Usuário criado com sucesso! ID: ${data.user_id}`,
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateUserReal] Erro na mutation:', error);
      toast({
        title: 'Erro ao Criar Usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// -----------------------------------------------------------
// Hook para atualizar role de usuário (USA RPC)
// -----------------------------------------------------------

export const useUpdateUserRoleReal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newRole, reason }: { userId: string; newRole: string; reason?: string }) => {
      console.log('🔄 [useUpdateUserRoleReal] Atualizando role:', { userId, newRole });

      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole,
        reason: reason || null,
      });

      if (error) {
        console.error('❌ [useUpdateUserRoleReal] Erro RPC:', error);
        throw new Error(`Erro ao atualizar função: ${error.message}`);
      }

      if (data && !data.success) {
        console.error('❌ [useUpdateUserRoleReal] Erro na função:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ [useUpdateUserRoleReal] Role atualizada:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Função Atualizada',
        description: 'Função do usuário atualizada com sucesso!',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Atualizar Função',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// -----------------------------------------------------------
// Hook para ativar/desativar usuário (USA RPC)
// -----------------------------------------------------------

export const useToggleUserStatusReal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newStatus, reason }: { userId: string; newStatus: boolean; reason?: string }) => {
      console.log('🔄 [useToggleUserStatusReal] Alterando status:', { userId, newStatus });

      const { data, error } = await supabase.rpc('toggle_user_status', {
        target_user_id: userId,
        new_status: newStatus,
        reason: reason || null,
      });

      if (error) {
        console.error('❌ [useToggleUserStatusReal] Erro RPC:', error);
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }

      if (data && !data.success) {
        console.error('❌ [useToggleUserStatusReal] Erro na função:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ [useToggleUserStatusReal] Status alterado:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Status Atualizado',
        description: 'Status do usuário atualizado com sucesso!',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Atualizar Status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// -----------------------------------------------------------
// Hook principal para listar usuários (MANTÉM O EXISTENTE)
// -----------------------------------------------------------

export const useUsersReal = () => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['users', 'management', 'real', currentUser?.role],
    queryFn: async (): Promise<User[]> => {
      // Verificar se usuário atual tem permissão (DEV_MASTER ou ADMIN)
      if (!currentUser || !['DEV_MASTER', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('Acesso negado. Apenas DEV_MASTER e Administradores podem visualizar usuários.');
      }

      console.log('🔄 [useUsersReal] Buscando usuários para role:', currentUser.role);

      // Query simples usando apenas SELECT direto na tabela
      const { data, error } = await supabase
        .from('User')
        .select(`
          id,
          email,
          name,
          role,
          isActive,
          companyId,
          avatarUrl,
          telefone,
          createdAt,
          updatedAt
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('❌ [useUsersReal] Erro ao buscar usuários:', error);
        throw new Error(`Erro ao carregar lista de usuários: ${error.message}`);
      }

      console.log('✅ [useUsersReal] Usuários carregados:', data?.length || 0);
      
      // Mapear dados do banco para interface (já em camelCase)
      const mappedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role === 'CREATOR' ? 'DEV_MASTER' : user.role as 'DEV_MASTER' | 'ADMIN' | 'AGENT',
        isActive: user.isActive,
        companyId: user.companyId,
        avatarUrl: user.avatarUrl,
        telefone: user.telefone || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      
      // Filtrar usuários baseado na hierarquia
      let filteredUsers = mappedUsers;
      
      // Se for ADMIN, filtrar para não mostrar DEV_MASTER
      if (currentUser.role === 'ADMIN') {
        filteredUsers = filteredUsers.filter(user => user.role !== 'DEV_MASTER');
        console.log('🔍 [useUsersReal] Usuários filtrados para ADMIN:', filteredUsers.length);
      }
      
      return filteredUsers;
    },
    enabled: !!currentUser && ['DEV_MASTER', 'ADMIN'].includes(currentUser.role),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    retryDelay: 1000,
  });
};

// -----------------------------------------------------------
// Hook para estatísticas de usuários
// -----------------------------------------------------------

export const useUserStatsReal = () => {
  const { data: users = [] } = useUsersReal();

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
// Hook para excluir usuário permanentemente (USA RPC)
// -----------------------------------------------------------

export const useDeleteUserReal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      console.log('🔄 [useDeleteUserReal] Excluindo usuário:', { userId, reason: reason ? '[PROVIDED]' : '[NONE]' });

      const { data, error } = await supabase.rpc('delete_user', {
        target_user_id: userId,
        reason: reason || null,
      });

      if (error) {
        console.error('❌ [useDeleteUserReal] Erro RPC:', error);
        throw new Error(`Erro ao excluir usuário: ${error.message}`);
      }

      if (data && !data.success) {
        console.error('❌ [useDeleteUserReal] Erro na função:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ [useDeleteUserReal] Usuário excluído:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário Excluído',
        description: `${data.deleted_user?.name || 'Usuário'} foi excluído permanentemente do sistema.`,
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Excluir Usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// -----------------------------------------------------------
// Hook para permissões
// -----------------------------------------------------------

export const useUserPermissionsReal = () => {
  const { user: currentUser } = useAuth();

  return {
    // Permissões básicas
    canManageUsers: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
    canCreateUsers: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
    canViewUsers: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
    canDeleteUsers: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
    
    // Status do usuário atual
    isDevMaster: currentUser?.role === 'DEV_MASTER',
    isAdmin: currentUser?.role === 'ADMIN',
    isAgent: currentUser?.role === 'AGENT',
    
    // Hierarquia
    currentUserRole: currentUser?.role as UserRole,
    currentUserId: currentUser?.id,
    
    // Helpers
    hasAdminPermissions: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
  };
};