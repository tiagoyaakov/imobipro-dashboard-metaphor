import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// -----------------------------------------------------------
// Tipos para o módulo de usuários
// -----------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CREATOR' | 'ADMIN' | 'AGENT';
  is_active: boolean;
  company_id: string;
  avatar_url?: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface UpdateUserRoleParams {
  userId: string;
  newRole: 'CREATOR' | 'ADMIN' | 'AGENT';
  reason?: string;
}

export interface ToggleUserStatusParams {
  userId: string;
  newStatus: boolean;
  reason?: string;
}

// -----------------------------------------------------------
// Hook principal para listar usuários
// -----------------------------------------------------------

export const useUsers = () => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['users', 'admin-management'],
    queryFn: async (): Promise<User[]> => {
      // Verificar se usuário atual tem permissão
      if (!currentUser || !['ADMIN', 'CREATOR'].includes(currentUser.role)) {
        throw new Error('Acesso negado. Apenas administradores podem visualizar usuários.');
      }

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
          telefone,
          created_at,
          updated_at,
          company:companies(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useUsers] Erro ao buscar usuários:', error);
        throw new Error('Erro ao carregar lista de usuários');
      }

      console.log('✅ [useUsers] Usuários carregados:', data?.length || 0);
      return data || [];
    },
    enabled: !!currentUser && ['ADMIN', 'CREATOR'].includes(currentUser.role),
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
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
      // Verificar permissões no frontend
      if (!currentUser || !['ADMIN', 'CREATOR'].includes(currentUser.role)) {
        throw new Error('Acesso negado');
      }

      if (userId === currentUser.id) {
        throw new Error('Você não pode alterar sua própria função');
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
// Hook para ativar/desativar usuário
// -----------------------------------------------------------

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, newStatus, reason }: ToggleUserStatusParams) => {
      // Verificar permissões no frontend
      if (!currentUser || !['ADMIN', 'CREATOR'].includes(currentUser.role)) {
        throw new Error('Acesso negado');
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
  const { user } = useAuth();

  return {
    canManageUsers: user?.role === 'ADMIN' || user?.role === 'CREATOR',
    canPromoteToAdmin: user?.role === 'CREATOR',
    canPromoteToCreator: false, // Apenas o sistema pode criar CREATOR
    isCurrentUserAdmin: user?.role === 'ADMIN' || user?.role === 'CREATOR',
    currentUserId: user?.id,
  };
};

// -----------------------------------------------------------
// Hook para estatísticas de usuários
// -----------------------------------------------------------

export const useUserStats = () => {
  const { data: users = [] } = useUsers();

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    byRole: {
      CREATOR: users.filter(u => u.role === 'CREATOR').length,
      ADMIN: users.filter(u => u.role === 'ADMIN').length,
      AGENT: users.filter(u => u.role === 'AGENT').length,
    },
    recentSignups: users.filter(u => {
      const daysDiff = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length,
  };

  return stats;
}; 