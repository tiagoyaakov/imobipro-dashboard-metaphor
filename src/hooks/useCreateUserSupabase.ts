import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateUserParams {
  email: string;
  name: string;
  role: 'ADMIN' | 'AGENT';
  companyId: string;
  telefone?: string;
  avatarUrl?: string;
}

/**
 * Hook para criar usuário usando Supabase Auth nativo
 * Este hook integra com o sistema de email do Supabase
 */
export const useCreateUserSupabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      console.log('🔄 [useCreateUserSupabase] Criando usuário:', { 
        ...params, 
        email: '[HIDDEN]' 
      });

      // 1. Criar usuário no banco usando a função SQL
      const { data: createResult, error: createError } = await supabase
        .rpc('create_user_and_send_invite', {
          user_email: params.email,
          user_name: params.name,
          user_role: params.role,
          user_company_id: params.companyId,
          user_telefone: params.telefone || null,
          user_avatar_url: params.avatarUrl || null,
        });

      if (createError) {
        console.error('❌ [useCreateUserSupabase] Erro ao criar usuário:', createError);
        throw new Error(createError.message);
      }

      if (!createResult?.success) {
        throw new Error(createResult?.error || 'Erro ao criar usuário');
      }

      // 2. Enviar email de convite usando Supabase Auth Admin API
      // NOTA: Isso requer a API Key de serviço (server-side)
      // Em produção, você deve fazer isso através de uma Edge Function
      
      try {
        // Para ambiente de desenvolvimento, vamos gerar a URL manualmente
        const resetUrl = await generatePasswordResetLink(params.email);
        
        // Mostrar informações para o usuário
        toast({
          title: 'Usuário Criado com Sucesso!',
          description: (
            <div className="space-y-2">
              <p>Usuário {params.name} foi criado.</p>
              <div className="bg-muted p-2 rounded text-xs">
                <p className="font-semibold mb-1">⚠️ Ação necessária:</p>
                <p>Em produção, o email será enviado automaticamente.</p>
                <p className="mt-2">Por enquanto, use este link:</p>
                <code className="block mt-1 break-all bg-background p-1 rounded">
                  {resetUrl}
                </code>
              </div>
            </div>
          ),
          duration: 15000, // 15 segundos
        });
      } catch (emailError) {
        console.warn('⚠️ [useCreateUserSupabase] Email não enviado:', emailError);
        // Não falhar a operação se o email não for enviado
        toast({
          title: 'Usuário Criado',
          description: 'Usuário criado, mas o email de convite deve ser enviado manualmente.',
          variant: 'default',
        });
      }

      return createResult;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateUserSupabase] Erro na mutation:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Gera link de reset de senha para desenvolvimento
 * Em produção, use Edge Functions
 */
async function generatePasswordResetLink(email: string): Promise<string> {
  // Gerar link de reset usando Supabase Auth
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('Erro ao gerar link:', error);
    // Fallback para link manual
    return `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`;
  }

  // O Supabase não retorna o link diretamente por segurança
  // Em dev, vamos criar um link simulado
  return `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&info=check-email`;
}

/**
 * Hook para reenviar email de convite
 */
export const useResendInviteSupabase = () => {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      console.log('📧 [useResendInviteSupabase] Reenviando convite para:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Email Enviado',
        description: 'Um email foi enviado com instruções para criar a senha.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};