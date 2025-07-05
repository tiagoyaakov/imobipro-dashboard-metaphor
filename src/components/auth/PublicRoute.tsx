import { useAuth } from '@clerk/react-router'
import { Navigate } from 'react-router-dom'
import PageLoadingFallback from '@/components/common/PageLoadingFallback'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
  redirectWhenAuthenticated?: boolean
}

export function PublicRoute({ 
  children, 
  redirectTo = '/dashboard',
  redirectWhenAuthenticated = true
}: PublicRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()

  // Aguardar carregamento do Clerk
  if (!isLoaded) {
    return (
      <PageLoadingFallback 
        variant="auth"
        className="min-h-screen"
      />
    )
  }

  // Se já está logado e deve redirecionar, redireciona para dashboard
  if (isSignedIn && redirectWhenAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
} 