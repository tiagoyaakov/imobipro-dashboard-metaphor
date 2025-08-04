import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

// Schema de validação
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'A senha deve conter: letra maiúscula, minúscula, número e caractere especial'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Validar token ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          title: 'Link inválido',
          description: 'Token não encontrado na URL',
          variant: 'destructive',
        });
        setIsValidating(false);
        return;
      }

      try {
        // Para convites de novos usuários
        if (type === 'invite') {
          // Validar token de convite (implementar chamada à função SQL)
          setTokenValid(true);
          setUserEmail('usuario@exemplo.com'); // Obter do banco
        } else {
          // Para reset de senha normal
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

          if (error) throw error;
          setTokenValid(true);
        }
      } catch (error: any) {
        console.error('Erro ao validar token:', error);
        toast({
          title: 'Token inválido',
          description: 'Este link expirou ou é inválido',
          variant: 'destructive',
        });
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, type]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      if (type === 'invite' && token) {
        // Usar função SQL para definir senha do convite
        const { data: result, error } = await supabase.rpc('validate_invite_token', {
          token: token,
          new_password: data.password,
        });

        if (error) throw error;

        if (result && result.success) {
          toast({
            title: 'Senha criada com sucesso!',
            description: 'Você será redirecionado para o login',
          });

          // Aguardar 2 segundos e redirecionar
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          throw new Error(result?.error || 'Erro ao criar senha');
        }
      } else {
        // Reset de senha normal do Supabase
        const { error } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (error) throw error;

        toast({
          title: 'Senha alterada com sucesso!',
          description: 'Você será redirecionado para o dashboard',
        });

        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao definir senha:', error);
      toast({
        title: 'Erro ao definir senha',
        description: error.message || 'Ocorreu um erro ao processar sua solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Estados de carregamento
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-imobipro-blue-dark/5">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validando link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-imobipro-blue-dark/5">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este link expirou ou é inválido. Solicite um novo link de redefinição de senha.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full mt-4"
              onClick={() => navigate('/login')}
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-imobipro-blue-dark/5">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {type === 'invite' ? 'Criar Senha' : 'Redefinir Senha'}
          </CardTitle>
          <CardDescription className="text-center">
            {type === 'invite' 
              ? `Bem-vindo! Crie uma senha segura para acessar sua conta.`
              : 'Digite sua nova senha abaixo'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo de senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  {...form.register('password')}
                  className={`pl-10 ${form.formState.errors.password ? 'border-destructive' : ''}`}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmar senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  {...form.register('confirmPassword')}
                  className={`pl-10 ${form.formState.errors.confirmPassword ? 'border-destructive' : ''}`}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Requisitos de senha */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Requisitos da senha:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  <li>Mínimo 8 caracteres</li>
                  <li>Pelo menos uma letra maiúscula</li>
                  <li>Pelo menos uma letra minúscula</li>
                  <li>Pelo menos um número</li>
                  <li>Pelo menos um caractere especial (@$!%*?&)</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Botão de submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Definindo senha...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Definir Senha
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;