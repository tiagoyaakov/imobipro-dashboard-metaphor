import { SignIn } from '@clerk/react-router'
import { PageTemplate } from '@/components/common/PageTemplate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <PageTemplate
      title="Login - ImobiPRO Dashboard"
      description="Faça login para acessar o sistema de gestão imobiliária profissional"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20"
    >
      <div className="w-full max-w-md space-y-8 p-6">
        {/* Header com logo e texto */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">IP</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Bem-vindo de volta
            </h1>
            <p className="text-muted-foreground">
              Entre na sua conta para acessar o ImobiPRO Dashboard
            </p>
          </div>
        </div>

        {/* Card com SignIn */}
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Use suas credenciais para fazer login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignIn 
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "w-full",
                  formButtonPrimary: "w-full bg-primary text-primary-foreground hover:bg-primary/90",
                  formFieldInput: "w-full",
                  footerActionLink: "text-primary hover:text-primary/90"
                }
              }}
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4">
          <Separator />
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link 
              to="/sign-up" 
              className="text-primary hover:text-primary/90 font-medium underline-offset-4 hover:underline"
            >
              Criar conta
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Ao fazer login, você concorda com nossos{' '}
            <Link 
              to="/termos" 
              className="text-primary hover:text-primary/90 underline-offset-4 hover:underline"
            >
              Termos de Uso
            </Link>
            {' '}e{' '}
            <Link 
              to="/privacidade" 
              className="text-primary hover:text-primary/90 underline-offset-4 hover:underline"
            >
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </PageTemplate>
  )
} 