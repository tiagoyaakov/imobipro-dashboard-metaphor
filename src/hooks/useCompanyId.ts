import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getSupabaseClient } from '@/integrations/supabase/client';

/**
 * Hook para buscar o company_id de um usuário a partir do seu userId.
 * Utiliza o token de autenticação do Clerk para se comunicar com o Supabase.
 *
 * @param userId - O ID do usuário (geralmente do Clerk).
 */
export const useCompanyId = (userId: string | undefined | null) => {
  const { getToken } = useAuth();

  return useQuery<{ company_id: string } | null, Error>({
    queryKey: ['companyId', userId],
    queryFn: async () => {
      if (!userId) return null;

      const supabase = getSupabaseClient(getToken);

      const { data, error } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 (0 rows) não é um erro, apenas indica que o usuário pode não ter sido criado no DB ainda.
        if (error.code !== 'PGRST116') {
          console.error('Erro ao buscar company_id:', error.message);
          throw new Error(`Erro ao buscar ID da empresa: ${error.message}`);
        }
        return null;
      }

      return data;
    },
    enabled: !!userId, // A query só será executada se o userId for fornecido.
    staleTime: Infinity, // O company_id de um usuário raramente muda, então cacheamos para sempre.
  });
}; 