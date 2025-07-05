import { useAuth } from '@clerk/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner';

/**
 * Hook customizado para obter o token de autenticação JWT
 * configurado para o template do Supabase no Clerk.
 * 
 * Este hook é essencial para a futura integração com o Supabase,
 * garantindo que as requisições ao backend do Supabase sejam
 * devidamente autenticadas com o token gerado pelo Clerk.
 * 
 * **Pré-requisito**: É necessário ter um JWT Template chamado 'supabase'
 * criado no dashboard do Clerk.
 * 
 * @returns Um objeto contendo a função `getSupabaseToken`.
 */
export function useSupabaseToken() {
  const { getToken, isSignedIn } = useAuth()

  const getSupabaseToken = useCallback(async () => {
    if (!isSignedIn) {
      toast.error("Usuário não autenticado", {
        description: "Não é possível obter o token do Supabase sem uma sessão ativa."
      });
      return null;
    }

    try {
      // O template 'supabase' deve ser configurado no Clerk Dashboard
      const supabaseToken = await getToken({ template: 'supabase' });
      
      if (!supabaseToken) {
        throw new Error('O token retornado para o Supabase é nulo.');
      }

      return supabaseToken;

    } catch (error) {
      console.error('🔐 Erro ao obter token para o Supabase:', error);
      toast.error("Erro de Autenticação", {
        description: "Não foi possível obter o token para comunicação com o banco de dados. Verifique a configuração do JWT Template no Clerk."
      });
      return null;
    }
  }, [getToken, isSignedIn])

  return { getSupabaseToken }
} 