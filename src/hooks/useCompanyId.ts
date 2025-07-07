import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar o companyId de um usuário a partir do seu userId.
 * @param userId - O ID do usuário (geralmente do Clerk).
 */
export const useCompanyId = (userId: string | undefined | null) => {
  return useQuery<{ company_id: string } | null, Error>({
    queryKey: ['companyId', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (error) {
        // Se o usuário não for encontrado, pode não ser um erro real,
        // mas sim um estado transitório durante o login/setup.
        if (error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
          console.error('Erro ao buscar company_id:', error.message);
          throw new Error(`Erro ao buscar ID da empresa: ${error.message}`);
        }
        return null;
      }
      
      return data;
    },
    enabled: !!userId, // A query só será executada se userId for fornecido
    staleTime: Infinity, // O companyId de um usuário raramente muda, então cacheamos para sempre.
  });
}; 