import { useAuth } from '@clerk/react-router'
import { Navigate, useLocation } from 'react-router-dom'
import PageLoadingFallback from '@/components/common/PageLoadingFallback'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Analytics de acesso a rotas protegidas
    if (isLoaded && isSignedIn && userId) {
      console.log(`📊 Usuário ${userId} acessou rota protegida: ${location.pathname}`)
    }
  }, [isLoaded, isSignedIn, userId, location.pathname])

  // Aguardar carregamento do Clerk
  if (!isLoaded) {
    return <PageLoadingFallback />
  }

  // Usuário não autenticado
  if (!isSignedIn) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
} 