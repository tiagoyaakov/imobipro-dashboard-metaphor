import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateUserWithInviteParams {
  email: string;
  name: string;
  role: 'ADMIN' | 'AGENT';
  companyId: string;
  telefone?: string;
  avatarUrl?: string;
}

interface InviteResult {
  success: boolean;
  user_id?: string;
  email?: string;
  invite_token?: string;
  message?: string;
  error?: string;
}

export const useCreateUserWithInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateUserWithInviteParams) => {
      console.log('🔄 [useCreateUserWithInvite] Criando usuário com convite:', { 
        ...params, 
        email: '[HIDDEN]' 
      });

      // 1. Criar usuário com convite
      const { data: createResult, error: createError } = await supabase
        .rpc('create_user_with_invite', {
          user_email: params.email,
          user_name: params.name,
          user_role: params.role,
          user_company_id: params.companyId,
          user_telefone: params.telefone || null,
          user_avatar_url: params.avatarUrl || null,
        }) as { data: InviteResult | null; error: any };

      if (createError) {
        console.error('❌ [useCreateUserWithInvite] Erro ao criar usuário:', createError);
        throw new Error(createError.message);
      }

      if (!createResult?.success) {
        throw new Error(createResult?.error || 'Erro ao criar usuário');
      }

      // 2. Enviar email de convite usando Supabase Auth
      if (createResult.invite_token) {
        try {
          // Gerar URL de reset
          const resetUrl = `${window.location.origin}/reset-password?token=${createResult.invite_token}&type=invite`;
          
          // NOTA: Em produção, você deve configurar os templates de email no Supabase
          // Por enquanto, vamos mostrar o link para o usuário copiar
          
          console.log('✉️ [useCreateUserWithInvite] URL de convite:', resetUrl);
          
          // Simular envio de email (em produção, use um serviço real)
          toast({
            title: 'Usuário Criado com Sucesso!',
            description: (
              <div className="space-y-2">
                <p>Um convite foi preparado para {params.email}</p>
                <p className="text-xs">Link do convite:</p>
                <code className="text-xs bg-muted p-1 rounded block break-all">
                  {resetUrl}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Em produção, este link será enviado automaticamente por email.
                </p>
              </div>
            ),
            duration: 10000, // 10 segundos para copiar
          });
        } catch (emailError) {
          console.error('⚠️ [useCreateUserWithInvite] Erro ao processar convite:', emailError);
          // Não falhar a operação se o email não for enviado
        }
      }

      return createResult;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateUserWithInvite] Erro na mutation:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook para reenviar convite
export const useResendInvite = () => {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      console.log('📧 [useResendInvite] Reenviando convite para:', email);

      // Usar função do Supabase Auth para reenviar
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=invite`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Convite Reenviado',
        description: 'Um novo email foi enviado com o link de ativação.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao reenviar convite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};