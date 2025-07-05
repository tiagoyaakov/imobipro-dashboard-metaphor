import { useAuth } from '@clerk/react-router'
import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireEmailVerification?: boolean
  showUnauthorizedMessage?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/sign-in',
  requireEmailVerification = false,
  showUnauthorizedMessage = true
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
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingSpinner 
          size="lg" 
          text="Verificando autenticação..." 
          className="py-12"
        />
      </div>
    )
  }

  // Usuário não autenticado
  if (!isSignedIn) {
    if (showUnauthorizedMessage) {
      toast.error('Você precisa fazer login para acessar esta página')
    }
    return <Navigate 
      to={redirectTo} 
      state={{ from: location.pathname }} 
      replace 
    />
  }

  // Verificação adicional de email se necessário
  if (requireEmailVerification) {
    // Implementar verificação de email se necessário no futuro
    // const { user } = useUser()
    // if (!user?.emailAddresses[0]?.verification?.status === 'verified') {
    //   return <Navigate to="/verify-email" replace />
    // }
  }

  return <>{children}</>
} 