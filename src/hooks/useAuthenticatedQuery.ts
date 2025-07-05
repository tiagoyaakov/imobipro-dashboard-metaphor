import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'
import { useAuth } from '@clerk/react-router'
import { toast } from 'sonner'

// ================================================================
// HOOK PARA QUERIES AUTENTICADAS (GET)
// ================================================================
interface UseAuthenticatedQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number)[];
  url: string;
  fetchOptions?: RequestInit;
}

export function useAuthenticatedQuery<T>({
  queryKey,
  url,
  fetchOptions,
  ...queryOptions
}: UseAuthenticatedQueryOptions<T>) {
  const authenticatedFetch = useAuthenticatedFetch()
  const { isSignedIn } = useAuth()

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const response = await authenticatedFetch(url, fetchOptions)
      if (!response) {
        throw new Error('A resposta da requisição é nula.');
      }
      return response.json()
    },
    enabled: isSignedIn && (queryOptions.enabled ?? true),
    ...queryOptions,
  })
}

// ================================================================
// HOOK PARA MUTATIONS AUTENTICADAS (POST, PUT, DELETE)
// ================================================================
interface UseAuthenticatedMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  successMessage?: string;
  errorMessage?: string;
  invalidateQueryKeys?: (string | number)[][];
}

export function useAuthenticatedMutation<TData = unknown, TVariables = unknown>({
  url,
  method,
  successMessage,
  errorMessage,
  invalidateQueryKeys,
  ...mutationOptions
}: UseAuthenticatedMutationOptions<TData, TVariables>) {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(variables),
      });
      if (!response) {
        throw new Error('A resposta da requisição é nula.');
      }
      return response.json();
    },
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      if (invalidateQueryKeys) {
        invalidateQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      if (!errorMessage) {
        toast.error(error.message || 'Ocorreu um erro na operação.');
      } else {
        toast.error(errorMessage);
      }
      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
} 