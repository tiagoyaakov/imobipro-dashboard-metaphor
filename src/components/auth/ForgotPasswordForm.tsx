import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { useAuth } from '@/contexts/AuthContext';
import { ForgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/auth/auth';

// -----------------------------------------------------------
// Componente de formulário de recuperação de senha
// -----------------------------------------------------------

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
  const { resetPassword, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Configuração do formulário
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  /**
   * Manipula o envio do formulário
   */
  const handleSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null);
      setSuccess(null);
      
      console.log('🔐 [ForgotPassword] Iniciando recuperação para:', data.email);
      
      const result = await resetPassword(data.email);
      
      console.log('🔐 [ForgotPassword] Resultado da recuperação:', result);
      
      if (result.success) {
        setSuccess(
          'Email de recuperação enviado com sucesso! ' +
          'Verifique sua caixa de entrada (incluindo spam) e clique no link para redefinir sua senha.'
        );
        onSuccess?.();
        
        // Limpar o formulário após sucesso
        form.reset();
      } else {
        setError(result.error || 'Erro ao enviar email de recuperação');
      }
    } catch (err) {
      console.error('🔐 [ForgotPassword] Erro inesperado na recuperação:', err);
      setError('Erro interno. Tente novamente.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-slate-100">
          Recuperar Senha
        </CardTitle>
        <CardDescription className="text-center text-slate-300">
          Digite seu email para receber as instruções de recuperação
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Campo Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      disabled={isLoading}
                      className="transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mensagem de erro */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Mensagem de sucesso */}
            {success && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <AlertDescription className="text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Botão de envio */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !!success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar email de recuperação
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {/* Link para voltar ao login */}
        <Link 
          to="/auth/login" 
          className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para o login
        </Link>

        {/* Link para registro */}
        <div className="text-sm text-slate-400">
          Não tem uma conta?{' '}
          <Link 
            to="/auth/register" 
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ForgotPasswordForm; 