import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// -----------------------------------------------------------
// Tipos para o sistema de impersonation
// -----------------------------------------------------------

export interface ImpersonationSession {
  id: string;
  admin_user_id: string;
  impersonated_user_id: string;
  session_token: string;
  is_active: boolean;
  created_at: string;
  ended_at?: string;
}

export interface ImpersonatedUser {
  id: string;
  email: string;
  name: string;
  role: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  is_active: boolean;
  company_id: string;
  avatar_url?: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
}

export interface ImpersonationData {
  has_active_impersonation: boolean;
  impersonation?: ImpersonationSession;
  target_user?: ImpersonatedUser;
}

export interface StartImpersonationParams {
  targetUserId: string;
}

// -----------------------------------------------------------
// Hook principal para impersonation
// -----------------------------------------------------------

export const useImpersonation = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Query simplificada para impersonation (SEM RPC)
  const {
    data: impersonationData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['impersonation', 'active', 'simplified'],
    queryFn: async (): Promise<ImpersonationData> => {
      // Por enquanto, sempre retornar que não há impersonation ativa
      // até as funções RPC serem implementadas
      return { has_active_impersonation: false };
    },
    enabled: !!currentUser && currentUser.role === 'DEV_MASTER',
    staleTime: 30 * 1000, // 30 segundos
    retry: false, // Não fazer retry
  });

  // Mutation simplificada para iniciar impersonation (SEM RPC)
  const startImpersonationMutation = useMutation({
    mutationFn: async ({ targetUserId }: StartImpersonationParams) => {
      // Por enquanto, retornar erro informativo
      throw new Error('Funcionalidade temporariamente indisponível. Execute o arquivo sql_fixes/user_management_functions.sql no Supabase para habilitar.');
    },
    onSuccess: () => {
      // Por enquanto, nada
    },
    onError: (error: Error) => {
      console.error('❌ [startImpersonation] Erro na mutation:', error);
      toast({
        title: 'Erro ao Iniciar Impersonation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation simplificada para finalizar impersonation (SEM RPC)
  const endImpersonationMutation = useMutation({
    mutationFn: async () => {
      // Por enquanto, retornar erro informativo
      throw new Error('Funcionalidade temporariamente indisponível. Execute o arquivo sql_fixes/user_management_functions.sql no Supabase para habilitar.');
    },
    onSuccess: () => {
      // Por enquanto, nada
    },
    onError: (error: Error) => {
      console.error('❌ [endImpersonation] Erro na mutation:', error);
      toast({
        title: 'Erro ao Finalizar Impersonation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Estados derivados
  const isImpersonating = impersonationData?.has_active_impersonation || false;
  const impersonatedUser = impersonationData?.target_user;
  const canImpersonate = currentUser?.role === 'DEV_MASTER';
  const isStarting = startImpersonationMutation.isPending;
  const isEnding = endImpersonationMutation.isPending;

  return {
    // Estados
    isImpersonating,
    impersonatedUser,
    canImpersonate,
    isLoading,
    isStarting,
    isEnding,
    error,
    
    // Dados
    impersonationData,
    
    // Ações
    startImpersonation: startImpersonationMutation.mutateAsync,
    endImpersonation: endImpersonationMutation.mutateAsync,
    refetchStatus: refetch,
  };
};

// -----------------------------------------------------------
// Hook para buscar usuários disponíveis para impersonation
// -----------------------------------------------------------

export const useImpersonationTargets = () => {
  const { user: currentUser } = useAuth();

  return useQuery({
    queryKey: ['impersonation', 'targets'],
    queryFn: async (): Promise<ImpersonatedUser[]> => {
      // Apenas DEV_MASTER pode ver targets
      if (!currentUser || currentUser.role !== 'DEV_MASTER') {
        throw new Error('Apenas DEV_MASTER pode ver usuários para impersonation');
      }

      // DEV_MASTER pode impersonar ADMIN e AGENT
      const allowedRoles = ['ADMIN', 'AGENT'];

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
        .in('role', allowedRoles) // Filtrar por roles permitidos
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ [useImpersonationTargets] Erro ao buscar targets:', error);
        throw new Error('Erro ao carregar usuários disponíveis');
      }

      console.log('✅ [useImpersonationTargets] Targets carregados:', data?.length || 0);
      return data || [];
    },
    enabled: !!currentUser && currentUser.role === 'DEV_MASTER',
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// -----------------------------------------------------------
// Hook para obter o usuário efetivo (considerando impersonation)
// -----------------------------------------------------------

export const useEffectiveUser = () => {
  const { user: originalUser } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  // Retornar usuário impersonado se estiver ativo, senão o original
  const effectiveUser = isImpersonating && impersonatedUser 
    ? impersonatedUser 
    : originalUser;

  return {
    effectiveUser,
    originalUser,
    isImpersonating,
    impersonatedUser,
  };
}; 