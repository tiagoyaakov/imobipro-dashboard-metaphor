import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Hooks e schemas
import { useLogin } from '@/hooks/useAuth';
import { LoginFormSchema, LoginFormData } from '@/schemas/auth';

// -----------------------------------------------------------
// Componente de Formulário de Login
// -----------------------------------------------------------

interface LoginFormProps {
  /** Callback chamado após login bem-sucedido */
  onSuccess?: () => void;
  /** Callback chamado quando usuário clica em "Criar conta" */
  onSignupClick?: () => void;
  /** Se true, mostra link para voltar ao dashboard */
  showBackToDashboard?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSignupClick,
  showBackToDashboard = false,
}) => {
  // Estados locais
  const [showPassword, setShowPassword] = useState(false);

  // Hook de autenticação
  const { login, isLoading, error, clearError } = useLogin();

  // Configuração do formulário
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Handler para submissão do formulário
   */
  const onSubmit = async (data: LoginFormData) => {
    clearError();
    
    const result = await login(data);
    
    if (result.success) {
      onSuccess?.();
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
          Entrar no ImobiPRO
        </CardTitle>
        <CardDescription className="text-center">
          Digite suas credenciais para acessar sua conta
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

            {/* Campo Senha */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha"
                        className="pl-10 pr-10"
                        disabled={isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          handleInputChange();
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
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

            {/* Link para recuperar senha */}
            <div className="text-right">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            {/* Links adicionais */}
            <div className="flex flex-col space-y-2 text-center text-sm">
              {/* Link para criar conta */}
              <div>
                Não tem uma conta?{' '}
                {onSignupClick ? (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={onSignupClick}
                  >
                    Criar conta
                  </Button>
                ) : (
                  <Link to="/auth/signup" className="text-primary hover:underline">
                    Criar conta
                  </Link>
                )}
              </div>

              {/* Link para voltar ao dashboard (se aplicável) */}
              {showBackToDashboard && (
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Voltar ao Dashboard
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
// Variante compacta para modais
// -----------------------------------------------------------

interface LoginModalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onSignupClick?: () => void;
}

export const LoginModalForm: React.FC<LoginModalFormProps> = ({
  onSuccess,
  onCancel,
  onSignupClick,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const result = await login(data);
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Senha */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botões */}
        <div className="flex flex-col space-y-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <div className="flex justify-between text-sm">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto"
              onClick={onSignupClick}
            >
              Criar conta
            </Button>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm; 