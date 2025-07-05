import { SignIn } from '@clerk/react-router'
import PageTemplate from '@/components/common/PageTemplate'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <PageTemplate
      title="Acesso ao Painel"
      description="Faça login para gerenciar suas propriedades e contatos."
      className="container flex h-screen w-screen flex-col items-center justify-center"
    >
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite suas credenciais para acessar sua conta
          </p>
        </div>

        <SignIn 
          path="/login" 
          routing="path" 
          signUpUrl="/register"
        />

        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            to="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Não tem uma conta? Registre-se
          </Link>
        </p>
      </div>
    </PageTemplate>
  )
} 