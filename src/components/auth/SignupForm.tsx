import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks e schemas
import { useSignup } from '@/hooks/useAuth';
import { SignupFormSchema, SignupFormData } from '@/schemas/auth';

// -----------------------------------------------------------
// Componente de Formulário de Registro
// -----------------------------------------------------------

interface SignupFormProps {
  /** Callback chamado após registro bem-sucedido */
  onSuccess?: (email: string) => void;
  /** Callback chamado quando usuário clica em "Já tenho conta" */
  onLoginClick?: () => void;
  /** Se true, mostra link para voltar ao dashboard */
  showBackToDashboard?: boolean;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onLoginClick,
  showBackToDashboard = false,
}) => {
  // Estados locais
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Hook de autenticação
  const { signup, isLoading, error, clearError } = useSignup();

  // Configuração do formulário
  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'AGENT',
    },
  });

  /**
   * Handler para submissão do formulário
   */
  const onSubmit = async (data: SignupFormData) => {
    clearError();
    
    const result = await signup(data.email, data.password, {
      name: data.name,
      role: data.role,
      companyId: data.companyId,
    });
    
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
          Criar Conta
        </CardTitle>
        <CardDescription className="text-center">
          Preencha os dados para criar sua conta no ImobiPRO
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Campo Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="text"
                        placeholder="Seu nome completo"
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

            {/* Campo Função */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AGENT">Corretor</SelectItem>
                      <SelectItem value="CREATOR">Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
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
                        placeholder="Crie uma senha forte"
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

            {/* Campo Confirmar Senha */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Digite a senha novamente"
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
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

            {/* Informação sobre critérios de senha */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>A senha deve conter:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Pelo menos 8 caracteres</li>
                <li>1 letra minúscula</li>
                <li>1 letra maiúscula</li>
                <li>1 número</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Botão de Registro */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>

            {/* Links adicionais */}
            <div className="flex flex-col space-y-2 text-center text-sm">
              {/* Link para fazer login */}
              <div>
                Já tem uma conta?{' '}
                {onLoginClick ? (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={onLoginClick}
                  >
                    Fazer login
                  </Button>
                ) : (
                  <Link to="/auth/login" className="text-primary hover:underline">
                    Fazer login
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
// Componente de Sucesso no Registro
// -----------------------------------------------------------

interface SignupSuccessProps {
  email: string;
  onBackToLogin?: () => void;
}

export const SignupSuccess: React.FC<SignupSuccessProps> = ({
  email,
  onBackToLogin,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-green-600">
          Conta Criada com Sucesso!
        </CardTitle>
        <CardDescription className="text-center">
          Verifique seu email para ativar sua conta
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Enviamos um email de confirmação para:
          </p>
          
          <p className="font-medium text-primary mb-4">
            {email}
          </p>
          
          <p className="text-xs text-muted-foreground">
            Clique no link do email para ativar sua conta e fazer login.
            Se não receber o email em alguns minutos, verifique sua pasta de spam.
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onBackToLogin}
          variant="outline"
          className="w-full"
        >
          Voltar para Login
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SignupForm; 