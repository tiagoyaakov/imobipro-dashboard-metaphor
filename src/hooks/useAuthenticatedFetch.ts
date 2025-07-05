import { useAuth } from '@clerk/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner'

interface AuthenticatedFetchOptions extends RequestInit {
  showErrorToast?: boolean
  retries?: number
}

export function useAuthenticatedFetch() {
  const { getToken, isSignedIn } = useAuth()

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: AuthenticatedFetchOptions = {}
  ) => {
    const { 
      showErrorToast = true, 
      retries = 3, 
      ...fetchOptions 
    } = options

    if (!isSignedIn) {
      throw new Error('Usuário não autenticado')
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const token = await getToken()
        
        if (!token) {
          throw new Error('Não foi possível obter o token de autenticação.')
        }

        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
            Authorization: `Bearer ${token}`
          }
        })

        // Success - return response
        if (response.ok) {
          return response
        }

        // Handle specific HTTP errors
        if (response.status === 401) {
          // Token expired or invalid, try to refresh on next attempt
          if (attempt < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
            continue
          }
          throw new Error('Sessão expirada. Faça login novamente.')
        }

        if (response.status === 403) {
          throw new Error('Você não tem permissão para acessar este recurso.')
        }

        if (response.status === 404) {
          throw new Error('Recurso não encontrado.')
        }

        if (response.status >= 500) {
          throw new Error('Erro interno do servidor. Tente novamente mais tarde.')
        }

        // Generic error for other status codes
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`)

      } catch (error) {
        // If it's the last attempt, throw the error
        if (attempt === retries - 1) {
          if (showErrorToast) {
            toast.error(error instanceof Error ? error.message : 'Erro desconhecido na requisição.')
          }
          throw error
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
    // This part should not be reachable, but typescript needs a return here
    throw new Error('A requisição falhou após todas as tentativas.');
  }, [getToken, isSignedIn])

  return authenticatedFetch
} 