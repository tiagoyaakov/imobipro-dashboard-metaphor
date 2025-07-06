import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { useSupabaseAuthenticatedClient } from '@/integrations/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Hook para queries Supabase autenticadas
export function useSupabaseQuery<T>(
  queryKey: unknown[],
  queryFn: (supabase: SupabaseClient<Database>) => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, unknown[]>, 'queryKey' | 'queryFn'>
) {
  const { isSignedIn } = useAuth()
  const getSupabase = useSupabaseAuthenticatedClient()

  const enabled = options?.enabled === undefined ? isSignedIn : options.enabled && isSignedIn

  return useQuery({
    queryKey,
    queryFn: async (): Promise<T> => {
      const supabase = await getSupabase()
      return queryFn(supabase)
    },
    ...options,
    enabled,
  })
}

// Hook para mutations Supabase autenticadas
export function useSupabaseMutation<TData, TVariables>(
  mutationFn: (supabase: SupabaseClient<Database>, variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  const getSupabase = useSupabaseAuthenticatedClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      const supabase = await getSupabase()
      return mutationFn(supabase, variables)
    },
    ...options,
  })
} 