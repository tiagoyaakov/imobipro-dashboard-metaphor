import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'

export function useAuthenticatedQuery<T>(
  queryKey: unknown[],
  queryFn: (token: string | null) => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, unknown[]>, 'queryKey' | 'queryFn'>
) {
  const { getToken, isSignedIn } = useAuth()

  const enabled = options?.enabled === undefined ? isSignedIn : options.enabled && isSignedIn

  return useQuery({
    queryKey,
    queryFn: async (): Promise<T> => {
      const token = await getToken()
      
      return queryFn(token)
    },
    ...options,
    enabled, // A query só será executada se o usuário estiver logado
  })
} 