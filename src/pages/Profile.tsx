import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Camera, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { ProfileSchema, ChangePasswordSchema, type ProfileFormData, type ChangePasswordFormData } from '../schemas/auth/profile';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
// Layout próprio para a página de perfil - removido PageTemplate

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Formulário de perfil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
    watch: watchProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    },
  });

  // Formulário de alteração de senha
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch: watchPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const avatarUrl = watchProfile('avatar');
  const newPassword = watchPassword('newPassword');

  // Função para atualizar perfil
  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    setProfileError(null);

    try {
      // Atualizar dados do usuário no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: data.name,
          phone: data.phone,
          avatar: data.avatar,
        }
      });

      if (authError) {
        console.error('Erro ao atualizar usuário no Auth:', authError);
        setProfileError(authError.message || 'Erro ao atualizar perfil');
        return;
      }

      // Atualizar dados na tabela users se existir
      if (user?.id) {
        const { error: dbError } = await supabase
          .from('users')
          .update({
            name: data.name,
            phone: data.phone,
            avatar: data.avatar,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (dbError) {
          console.warn('Aviso: Erro ao atualizar na tabela users:', dbError);
          // Não bloquear o sucesso por erro na tabela, pois o Auth foi atualizado
        }
      }

      // Atualizar contexto local
      await refreshUser();

      toast.success('Perfil atualizado com sucesso!');

    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error);
      setProfileError('Erro inesperado. Tente novamente.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Função para alterar senha
  const onChangePassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    setPasswordError(null);

    try {
      // Primeiro, verificar se a senha atual está correta tentando fazer login
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      });

      if (verifyError) {
        setPasswordError('Senha atual incorreta');
        return;
      }

      // Se chegou aqui, a senha atual está correta, então atualizar
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        console.error('Erro ao alterar senha:', updateError);
        setPasswordError(updateError.message || 'Erro ao alterar senha');
        return;
      }

      resetPasswordForm();
      toast.success('Senha alterada com sucesso!');

    } catch (error) {
      console.error('Erro inesperado ao alterar senha:', error);
      setPasswordError('Erro inesperado. Tente novamente.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Função para upload de avatar (placeholder - implementar com Supabase Storage depois)
  const handleAvatarUpload = () => {
    toast.info('Upload de avatar será implementado em breve!');
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

  const passwordStrength = getPasswordStrength(newPassword || '');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais e configurações de conta</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do perfil */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatar || avatarUrl} alt={user?.name} />
                  <AvatarFallback className="text-xl">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={handleAvatarUpload}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {user?.role === 'ADMIN' ? 'Administrador' : 
                     user?.role === 'AGENT' ? 'Corretor' : 'Usuário'}
                  </Badge>
                  {user?.isActive && <Badge variant="default">Ativo</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de configurações */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          {/* Tab: Informações Pessoais */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileError && (
                  <Alert className="mb-6 bg-red-500/10 border-red-500/20">
                    <AlertDescription className="text-red-400">
                      {profileError}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-6">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...registerProfile('name')}
                        id="name"
                        placeholder="Seu nome completo"
                        className="pl-10"
                        disabled={isUpdatingProfile}
                      />
                    </div>
                    {profileErrors.name && (
                      <p className="text-red-400 text-sm">{profileErrors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...registerProfile('email')}
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        disabled={true} // Email não pode ser alterado
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado por motivos de segurança
                    </p>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...registerProfile('phone')}
                        id="phone"
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        disabled={isUpdatingProfile}
                      />
                    </div>
                    {profileErrors.phone && (
                      <p className="text-red-400 text-sm">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  {/* Avatar URL */}
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL (opcional)</Label>
                    <Input
                      {...registerProfile('avatar')}
                      id="avatar"
                      placeholder="https://exemplo.com/avatar.jpg"
                      disabled={isUpdatingProfile}
                    />
                    {profileErrors.avatar && (
                      <p className="text-red-400 text-sm">{profileErrors.avatar.message}</p>
                    )}
                  </div>

                  <Separator />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUpdatingProfile}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Segurança */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent>
                {passwordError && (
                  <Alert className="mb-6 bg-red-500/10 border-red-500/20">
                    <AlertDescription className="text-red-400">
                      {passwordError}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-6">
                  {/* Senha Atual */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...registerPassword('currentPassword')}
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha atual"
                        className="pl-10 pr-10"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isChangingPassword}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-red-400 text-sm">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...registerPassword('newPassword')}
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Digite sua nova senha"
                        className="pl-10 pr-10"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isChangingPassword}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-red-400 text-sm">{passwordErrors.newPassword.message}</p>
                    )}
                    
                    {/* Indicador de força da senha */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 bg-muted rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...registerPassword('confirmNewPassword')}
                        id="confirmNewPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirme sua nova senha"
                        className="pl-10 pr-10"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isChangingPassword}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirmNewPassword && (
                      <p className="text-red-400 text-sm">{passwordErrors.confirmNewPassword.message}</p>
                    )}
                  </div>

                  <Separator />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isChangingPassword}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile; 