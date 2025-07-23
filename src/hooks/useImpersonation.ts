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

  // Query para verificar impersonation ativa
  const {
    data: impersonationData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['impersonation', 'active'],
    queryFn: async (): Promise<ImpersonationData> => {
      // Apenas DEV_MASTER e ADMIN podem ter impersonations
      if (!currentUser || (currentUser.role !== 'DEV_MASTER' && currentUser.role !== 'ADMIN')) {
        return { has_active_impersonation: false };
      }

      const { data, error } = await supabase.rpc('get_active_impersonation');

      if (error) {
        console.error('❌ [useImpersonation] Erro ao verificar impersonation:', error);
        throw new Error('Erro ao verificar impersonation ativa');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao verificar impersonation');
      }

      console.log('✅ [useImpersonation] Status verificado:', {
        hasActive: data.has_active_impersonation,
        targetUser: data.target_user?.email
      });

      return {
        has_active_impersonation: data.has_active_impersonation,
        impersonation: data.impersonation,
        target_user: data.target_user
      };
    },
    enabled: !!currentUser && (currentUser.role === 'DEV_MASTER' || currentUser.role === 'ADMIN'),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Verificar a cada minuto
    retry: 2,
  });

  // Mutation para iniciar impersonation
  const startImpersonationMutation = useMutation({
    mutationFn: async ({ targetUserId }: StartImpersonationParams) => {
      if (!currentUser || (currentUser.role !== 'DEV_MASTER' && currentUser.role !== 'ADMIN')) {
        throw new Error('Apenas administradores podem usar impersonation');
      }

      console.log('🔄 [startImpersonation] Iniciando impersonation:', { targetUserId });

      const { data, error } = await supabase.rpc('start_user_impersonation', {
        target_user_id: targetUserId,
      });

      if (error) {
        console.error('❌ [startImpersonation] Erro na função RPC:', error);
        throw new Error(error.message || 'Erro ao iniciar impersonation');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao iniciar impersonation');
      }

      console.log('✅ [startImpersonation] Impersonation iniciada:', data);
      return data;
    },
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['impersonation'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      // Toast de sucesso
      toast({
        title: 'Impersonation Iniciada',
        description: `Agora você está visualizando como: ${data.target_user.name}`,
        duration: 5000,
      });

      console.log('🎉 [startImpersonation] Cache invalidado e toast exibido');
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

  // Mutation para finalizar impersonation
  const endImpersonationMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || (currentUser.role !== 'DEV_MASTER' && currentUser.role !== 'ADMIN')) {
        throw new Error('Apenas administradores podem finalizar impersonation');
      }

      console.log('🔄 [endImpersonation] Finalizando impersonation');

      const { data, error } = await supabase.rpc('end_user_impersonation');

      if (error) {
        console.error('❌ [endImpersonation] Erro na função RPC:', error);
        throw new Error(error.message || 'Erro ao finalizar impersonation');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao finalizar impersonation');
      }

      console.log('✅ [endImpersonation] Impersonation finalizada:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['impersonation'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      // Toast de sucesso
      toast({
        title: 'Voltou ao Normal',
        description: 'Impersonation finalizada. Você está de volta ao seu perfil de administrador.',
      });

      console.log('🎉 [endImpersonation] Cache invalidado e toast exibido');
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
  const canImpersonate = currentUser?.role === 'DEV_MASTER' || currentUser?.role === 'ADMIN';
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
      // Apenas DEV_MASTER e ADMINs podem ver targets
      if (!currentUser || (currentUser.role !== 'DEV_MASTER' && currentUser.role !== 'ADMIN')) {
        throw new Error('Apenas administradores podem ver usuários para impersonation');
      }

      // Determinar quais roles podem ser impersonados baseado no usuário atual
      let allowedRoles: string[] = [];
      if (currentUser.role === 'DEV_MASTER') {
        allowedRoles = ['ADMIN', 'AGENT']; // DEV_MASTER pode impersonar ADMIN e AGENT
      } else if (currentUser.role === 'ADMIN') {
        allowedRoles = ['AGENT']; // ADMIN pode impersonar apenas AGENT
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
    enabled: !!currentUser && (currentUser.role === 'DEV_MASTER' || currentUser.role === 'ADMIN'),
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