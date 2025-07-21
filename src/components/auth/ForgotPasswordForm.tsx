import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Hooks e schemas
import { usePasswordReset } from '@/hooks/useAuth';
import { ForgotPasswordSchema, ForgotPasswordData } from '@/schemas/auth';

// -----------------------------------------------------------
// Componente de Formulário de Recuperação de Senha
// -----------------------------------------------------------

interface ForgotPasswordFormProps {
  /** Callback chamado após envio bem-sucedido */
  onSuccess?: (email: string) => void;
  /** Callback chamado quando usuário clica em "Voltar" */
  onBackClick?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onBackClick,
}) => {
  // Hook de recuperação de senha
  const { resetPassword, isLoading, error, clearError } = usePasswordReset();

  // Configuração do formulário
  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  /**
   * Handler para submissão do formulário
   */
  const onSubmit = async (data: ForgotPasswordData) => {
    clearError();
    
    const result = await resetPassword(data.email);
    
    if (result.success) {
      onSuccess?.(data.email);
    }
    // Erro será mostrado automaticamente via error state
  };

  /**
   * Limpar erro quando usuário começar a digitar
   */
  const handleInputChange = () => {
    if (error) {
      clearError();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Recuperar Senha
        </CardTitle>
        <CardDescription className="text-center">
          Digite seu email para receber instruções de recuperação
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Campo Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        disabled={isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          handleInputChange();
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exibir erro geral */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Informação sobre o processo */}
            <div className="text-xs text-muted-foreground">
              <p>
                Enviaremos um link para redefinir sua senha. 
                Verifique sua caixa de entrada e pasta de spam.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Botão de Enviar */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </Button>

            {/* Link para voltar */}
            <div className="text-center">
              {onBackClick ? (
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={onBackClick}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Login
                </Button>
              ) : (
                <Link to="/auth/login" className="text-primary hover:underline inline-flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Login
                </Link>
              )}
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

// -----------------------------------------------------------
// Componente de Sucesso no Envio
// -----------------------------------------------------------

interface ForgotPasswordSuccessProps {
  email: string;
  onBackToLogin?: () => void;
  onResendClick?: () => void;
}

export const ForgotPasswordSuccess: React.FC<ForgotPasswordSuccessProps> = ({
  email,
  onBackToLogin,
  onResendClick,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-green-600">
          Email Enviado!
        </CardTitle>
        <CardDescription className="text-center">
          Verifique sua caixa de entrada
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Enviamos instruções de recuperação para:
          </p>
          
          <p className="font-medium text-primary mb-4">
            {email}
          </p>
          
          <p className="text-xs text-muted-foreground mb-4">
            Clique no link do email para redefinir sua senha.
            O link expira em 1 hora por segurança.
          </p>

          <p className="text-xs text-muted-foreground">
            Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <Button
          onClick={onBackToLogin}
          variant="outline"
          className="w-full"
        >
          Voltar para Login
        </Button>
        
        {onResendClick && (
          <Button
            onClick={onResendClick}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Reenviar Email
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// -----------------------------------------------------------
// Componente de Redefinição de Senha
// -----------------------------------------------------------

interface ResetPasswordFormProps {
  /** Token de recuperação da URL */
  token?: string;
  /** Callback chamado após redefinição bem-sucedida */
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onSuccess,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Configuração do formulário
  const form = useForm({
    resolver: zodResolver(ForgotPasswordSchema), // Reutilizando schema temporariamente
    defaultValues: {
      email: '', // Será usado como password
    },
  });

  const onSubmit = async (data: any) => {
    // Implementação será feita quando tivermos o endpoint do Supabase
    console.log('Reset password:', { token, ...data });
    onSuccess?.();
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-destructive">
            Link Inválido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Este link de recuperação é inválido ou expirou.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/auth/forgot-password">
              Solicitar Novo Link
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Nova Senha
        </CardTitle>
        <CardDescription className="text-center">
          Digite sua nova senha
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Implementação dos campos de senha */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>A nova senha deve conter:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Pelo menos 8 caracteres</li>
                <li>1 letra minúscula</li>
                <li>1 letra maiúscula</li>
                <li>1 número</li>
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ForgotPasswordForm; 