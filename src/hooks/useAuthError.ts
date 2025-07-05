import { useCallback } from 'react'
import { toast } from 'sonner'
import { useClerk } from '@clerk/react-router'
import { useNavigate } from 'react-router-dom';

interface ClerkError {
  code: string;
  message: string;
  longMessage?: string;
}

interface ClerkErrorResponse {
  errors: ClerkError[];
}

export function useAuthError() {
  const { signOut } = useClerk()
  const navigate = useNavigate();

  const handleAuthError = useCallback((error: unknown) => {
    // Log do erro completo para depuração
    console.error('🔐 Auth Error:', error)

    const clerkError = (error as ClerkErrorResponse)?.errors?.[0];

    if (clerkError) {
      const errorMessages: Record<string, string> = {
        'form_identifier_not_found': 'O e-mail ou nome de usuário fornecido não foi encontrado.',
        'form_password_incorrect': 'A senha está incorreta. Verifique e tente novamente.',
        'form_password_pwned': 'Esta senha foi encontrada em uma violação de dados. Por segurança, por favor, use uma senha diferente.',
        'form_username_invalid_length': 'O nome de usuário deve ter entre 3 e 30 caracteres.',
        'form_password_length_too_short': 'A senha deve ter pelo menos 8 caracteres.',
        'session_token_and_uat_claim_check_failed': 'Sua sessão é inválida. Por favor, faça login novamente.',
        'clerk_js_load_failed': 'Não foi possível carregar o sistema de autenticação. Verifique sua conexão com a internet.',
        'identification_claim_exists': 'Já existe uma conta com este e-mail ou nome de usuário.',
        'user_not_found': 'Usuário não encontrado.',
        'session_not_found': 'Sessão não encontrada. Por favor, faça login.',
      }

      const message = errorMessages[clerkError.code] || 'Ocorreu um erro na autenticação. Tente novamente mais tarde.'
      toast.error(message, {
        description: clerkError.longMessage,
      })
      
      return
    }

    // Tratamento de erros de rede ou outros erros genéricos
    if (error instanceof Error) {
      if (error.name === 'NetworkError' || !navigator.onLine) {
        toast.error('Erro de conexão', {
          description: 'Não foi possível se conectar ao servidor. Verifique sua conexão com a internet.',
        })
        return
      }
      toast.error('Erro inesperado', {
        description: error.message,
      })
      return
    }

    // Fallback para erros desconhecidos
    toast.error('Ocorreu um erro desconhecido. Por favor, contate o suporte.')
  }, [])

  const handleSignOut = useCallback(async (redirectUrl = '/sign-in') => {
    try {
      await signOut(() => navigate(redirectUrl));
      toast.success('Você foi desconectado com sucesso.')
    } catch (error) {
      handleAuthError(error)
    }
  }, [signOut, navigate, handleAuthError])

  return { handleAuthError, handleSignOut }
} 