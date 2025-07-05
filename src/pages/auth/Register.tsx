import { SignUp } from '@clerk/react-router'
import PageTemplate from '@/components/common/PageTemplate'
import { Link } from 'react-router-dom'

export default function RegisterPage() {
  return (
    <PageTemplate
      title="Crie sua Conta"
      description="Preencha os campos abaixo para criar sua conta no ImobiPRO."
      className="container flex h-screen w-screen flex-col items-center justify-center"
    >
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Criar uma conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Insira seus dados para se registrar
          </p>
        </div>
        
        <SignUp 
          path="/register" 
          routing="path" 
          signInUrl="/login" 
        />

        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="hover:text-brand underline underline-offset-4"
          >
            Já tem uma conta? Faça o login
          </Link>
        </p>
      </div>
    </PageTemplate>
  )
} 