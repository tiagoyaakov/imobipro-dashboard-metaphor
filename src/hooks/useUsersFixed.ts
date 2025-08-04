import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { UserRole } from '@/integrations/supabase/types';

// -----------------------------------------------------------
// HOOK CORRIGIDO PARA USUÁRIOS - SEM DEPENDÊNCIA DE RPC
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

// -----------------------------------------------------------
// Hook principal para listar usuários (SEM RPC)
// -----------------------------------------------------------

export const useUsersFixed = () => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['users', 'management', 'fixed', currentUser?.role],
    queryFn: async (): Promise<User[]> => {
      // Verificar se usuário atual tem permissão (DEV_MASTER ou ADMIN)
      if (!currentUser || !['DEV_MASTER', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('Acesso negado. Apenas DEV_MASTER e Administradores podem visualizar usuários.');
      }

      console.log('🔄 [useUsersFixed] Buscando usuários para role:', currentUser.role);

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
        console.error('❌ [useUsersFixed] Erro ao buscar usuários:', error);
        throw new Error(`Erro ao carregar lista de usuários: ${error.message}`);
      }

      console.log('✅ [useUsersFixed] Usuários carregados:', data?.length || 0);
      
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
        console.log('🔍 [useUsersFixed] Usuários filtrados para ADMIN:', filteredUsers.length);
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
// Hook para estatísticas de usuários (SEM RPC)
// -----------------------------------------------------------

export const useUserStatsFixed = () => {
  const { data: users = [] } = useUsersFixed();

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
// Hook para permissões simplificado (SEM RPC)
// -----------------------------------------------------------

export const useUserPermissionsFixed = () => {
  const { user: currentUser } = useAuth();

  return {
    // Permissões básicas
    canManageUsers: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
    canCreateUsers: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
    canViewUsers: currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN',
    
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

// -----------------------------------------------------------
// Hooks de mutação placeholder (retornam erro informativo)
// -----------------------------------------------------------

export const useUpdateUserRoleFixed = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error('Funcionalidade temporariamente indisponível. Execute o arquivo sql_fixes/user_management_functions.sql no Supabase para habilitar.');
    },
    onError: (error: Error) => {
      toast({
        title: 'Funcionalidade Indisponível',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCreateUserFixed = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error('Funcionalidade temporariamente indisponível. Execute o arquivo sql_fixes/user_management_functions.sql no Supabase para habilitar.');
    },
    onError: (error: Error) => {
      toast({
        title: 'Funcionalidade Indisponível',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useToggleUserStatusFixed = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error('Funcionalidade temporariamente indisponível. Execute o arquivo sql_fixes/user_management_functions.sql no Supabase para habilitar.');
    },
    onError: (error: Error) => {
      toast({
        title: 'Funcionalidade Indisponível', 
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCompaniesFixed = () => {
  return useQuery({
    queryKey: ['companies', 'fixed'],
    queryFn: async () => {
      throw new Error('Funcionalidade temporariamente indisponível. Execute o arquivo sql_fixes/user_management_functions.sql no Supabase para habilitar.');
    },
    enabled: false, // Desabilitar por enquanto
    retry: false,
  });
};