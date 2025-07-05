import { useAuth } from '@clerk/react-router'
import { Navigate } from 'react-router-dom'
import LoadingSpinner from '@/components/common/LoadingSpinner'

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
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingSpinner 
          size="lg" 
          text="Carregando..." 
          className="py-12"
        />
      </div>
    )
  }

  // Se já está logado e deve redirecionar, redireciona para dashboard
  if (isSignedIn && redirectWhenAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
} 