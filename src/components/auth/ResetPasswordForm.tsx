import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, KeyRound, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { ResetPasswordSchema, type ResetPasswordFormData } from '../../schemas/auth/auth';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

const ResetPasswordForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  // Verificar se temos access_token e refresh_token na URL (tanto em query params quanto em hash)
  useEffect(() => {
    console.log('🔐 [ResetPassword] Verificando tokens na URL...');
    console.log('🔐 [ResetPassword] Current URL:', window.location.href);
    console.log('🔐 [ResetPassword] Hash:', window.location.hash);
    console.log('🔐 [ResetPassword] Search:', window.location.search);
    
    let accessToken = searchParams.get('access_token');
    let refreshToken = searchParams.get('refresh_token');
    
    // Se não encontrou nos query params, tentar no hash (formato padrão do Supabase)
    if (!accessToken || !refreshToken) {
      const hash = window.location.hash.substring(1); // Remove o #
      const hashParams = new URLSearchParams(hash);
      
      accessToken = hashParams.get('access_token');
      refreshToken = hashParams.get('refresh_token');
      
      console.log('🔐 [ResetPassword] Tokens do hash:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
    }
    
    if (!accessToken || !refreshToken) {
      console.error('🔐 [ResetPassword] Tokens não encontrados');
      setError('Link de redefinição inválido ou expirado. Solicite um novo link.');
      return;
    }
    
    console.log('🔐 [ResetPassword] Tokens encontrados, configurando sessão...');

    // Configurar sessão com os tokens da URL
    const setSession = async () => {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('🔐 [ResetPassword] Erro ao configurar sessão:', error);
          setError('Link de redefinição inválido ou expirado. Solicite um novo link.');
          return;
        }
        
        if (data?.session) {
          console.log('🔐 [ResetPassword] Sessão configurada com sucesso');
        } else {
          console.warn('🔐 [ResetPassword] Sessão configurada mas sem dados de sessão');
        }
        
      } catch (error) {
        console.error('🔐 [ResetPassword] Erro inesperado ao configurar sessão:', error);
        setError('Erro inesperado. Tente novamente.');
      }
    };

    setSession();
  }, [searchParams]);

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [ResetPassword] Tentando atualizar senha...');
      
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        console.error('🔐 [ResetPassword] Erro ao atualizar senha:', error);
        setError(error.message || 'Erro ao redefinir senha. Tente novamente.');
        return;
      }

      console.log('🔐 [ResetPassword] Senha atualizada com sucesso');
      setSuccess(true);
      
      toast.success('Senha redefinida com sucesso!', {
        description: 'Você será redirecionado para a página de login.',
      });

      // Fazer logout para forçar novo login
      await supabase.auth.signOut();
      console.log('🔐 [ResetPassword] Logout realizado, redirecionando...');
      
      // Redirecionar para login após sucesso
      setTimeout(() => {
        navigate('/auth/login', { 
          replace: true,
          state: { message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' }
        });
      }, 2000);

    } catch (error) {
      console.error('🔐 [ResetPassword] Erro inesperado:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar força da senha
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 4) return { strength, label: 'Média', color: 'bg-yellow-500' };
    return { strength, label: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password || '');

  if (success) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">
              Senha Redefinida!
            </h3>
            <p className="text-slate-400">
              Sua senha foi alterada com sucesso. Você será redirecionado para a página de login.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-400" />
          Nova Senha
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/20">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua nova senha"
                className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm">{errors.password.message}</p>
            )}
            
            {/* Indicador de força da senha */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-slate-600 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{passwordStrength.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Campo Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua nova senha"
                className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm; 