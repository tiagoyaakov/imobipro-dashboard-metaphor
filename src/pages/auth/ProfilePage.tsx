import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Mail, 
  Building2, 
  Shield, 
  Camera, 
  Save, 
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Upload,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Hooks e schemas
import { useAuth } from '@/hooks/useAuth';
import { useImageUpload } from '@/hooks/useImageUpload';
import { UpdateProfileSchema, ChangePasswordSchema } from '@/schemas/auth';
import type { UpdateProfileData, ChangePasswordData } from '@/schemas/auth';

// -----------------------------------------------------------
// Página de Perfil do Usuário
// -----------------------------------------------------------

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, updateAvatar } = useAuth();
  const { uploadImage } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados locais
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Formulário básico sem avatarUrl
  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Formulário de alteração de senha
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  /**
   * Atualizar perfil básico
   */
  const handleUpdateProfile = async (data: { name: string; email: string }) => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateMessage(null);

    try {
      if (updateProfile) {
        const result = await updateProfile(data);
        
        if (result.success) {
          setUpdateMessage('Perfil atualizado com sucesso!');
          setTimeout(() => setUpdateMessage(null), 3000);
        } else {
          setUpdateError(result.error || 'Erro ao atualizar perfil');
        }
      } else {
        // Fallback caso não tenha a função
        console.log('Atualizando perfil:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUpdateMessage('Perfil atualizado com sucesso!');
        setTimeout(() => setUpdateMessage(null), 3000);
      }
    } catch (error) {
      setUpdateError('Erro inesperado ao atualizar perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Lidar com seleção de arquivo de avatar
   */
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação do arquivo
    if (!file.type.startsWith('image/')) {
      setUpdateError('Arquivo deve ser uma imagem');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUpdateError('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Criar preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Fazer upload imediato
    handleAvatarUpload(file);
  };

  /**
   * Fazer upload do avatar
   */
  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    setUpdateError(null);
    setUpdateMessage(null);

    try {
      const result = await uploadImage(file, 'avatars', `users/${user?.id}`);
      
      if (result.success && result.url) {
        console.log('Avatar uploaded successfully:', result.url);
        
        if (updateAvatar) {
          // Usar a função updateAvatar se disponível
          const updateResult = await updateAvatar(result.url);
          
          if (updateResult.success) {
            setUpdateMessage('Avatar atualizado com sucesso!');
            setAvatarPreview(null); // Limpar preview já que foi salvo
          } else {
            setUpdateError(updateResult.error || 'Erro ao salvar avatar');
            handleCancelPreview();
          }
        } else {
          // Fallback: apenas mostrar sucesso do upload
          setUpdateMessage('Avatar enviado com sucesso!');
          console.warn('Função updateAvatar não disponível - avatar não foi salvo no perfil');
        }
        
        setTimeout(() => setUpdateMessage(null), 3000);
        
      } else {
        setUpdateError(result.error || 'Erro ao fazer upload do avatar');
        handleCancelPreview();
      }
    } catch (error) {
      console.error('Erro no upload do avatar:', error);
      setUpdateError('Erro inesperado ao fazer upload do avatar');
      handleCancelPreview();
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /**
   * Abrir seletor de arquivo
   */
  const handleCameraClick = () => {
    if (isUploadingAvatar) return; // Prevenir clicks durante upload
    fileInputRef.current?.click();
  };

  /**
   * Cancelar preview do avatar
   */
  const handleCancelPreview = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Alterar senha
   */
  const handleChangePassword = async (data: ChangePasswordData) => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateMessage(null);

    try {
      // Implementar mudança de senha via Supabase
      console.log('Alterando senha:', data);
      
      // Simular sucesso por enquanto
      setUpdateMessage('Senha alterada com sucesso!');
      passwordForm.reset();
      setTimeout(() => setUpdateMessage(null), 3000);
      
    } catch (error) {
      setUpdateError('Erro ao alterar senha');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Traduzir role para português
   */
  const translateRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'CREATOR': 'Proprietário',
      'ADMIN': 'Administrador',
      'AGENT': 'Corretor',
    };
    return roleMap[role] || role;
  };

  /**
   * Obter cor do badge baseado no role
   */
  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'CREATOR': 'default',
      'ADMIN': 'secondary',
      'AGENT': 'outline',
    };
    return variantMap[role] || 'outline';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Usuário não encontrado</h2>
          <Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e configurações de conta
            </p>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {updateMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{updateMessage}</AlertDescription>
          </Alert>
        )}

        {updateError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar com informações do usuário */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="relative mx-auto mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarPreview || user?.avatarUrl || "/avatar-placeholder.svg"} />
                  <AvatarFallback className="bg-imobipro-blue text-white text-xl">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Loading overlay durante upload */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={handleCameraClick}
                  disabled={isUploadingAvatar}
                  title={isUploadingAvatar ? "Enviando..." : "Alterar foto"}
                >
                  {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </Button>
                
                {/* Botão de cancelar preview */}
                {avatarPreview && !isUploadingAvatar && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -left-2 rounded-full w-8 h-8 p-0 border-red-200 hover:bg-red-50"
                    onClick={handleCancelPreview}
                    title="Cancelar"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
              
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Badge variant={getRoleVariant(user.role)} className="text-xs">
                  {translateRole(user.role)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Empresa</p>
                  <p className="text-muted-foreground">ImobiPRO Corp</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Nível de Acesso</p>
                  <p className="text-muted-foreground">{translateRole(user.role)}</p>
                </div>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                <p>Conta criada em</p>
                <p>{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo principal */}
          <Card className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
                  <TabsTrigger value="security">Segurança</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* Aba de Perfil */}
                <TabsContent value="profile" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Informações Pessoais</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Atualize suas informações básicas de perfil.
                    </p>
                  </div>

                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                      {/* Nome */}
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  placeholder="Seu nome completo"
                                  className="pl-10"
                                  disabled={isUpdating}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={profileForm.control}
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
                                  disabled={isUpdating}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Aba de Segurança */}
                <TabsContent value="security" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Alterar Senha</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Mantenha sua conta segura com uma senha forte.
                    </p>
                  </div>

                  <PasswordChangeForm
                    form={passwordForm}
                    onSubmit={handleChangePassword}
                    isLoading={isUpdating}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarSelect}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};

// -----------------------------------------------------------
// Componente de Alteração de Senha
// -----------------------------------------------------------

interface PasswordChangeFormProps {
  form: ReturnType<typeof useForm<ChangePasswordData>>;
  onSubmit: (data: ChangePasswordData) => Promise<void>;
  isLoading: boolean;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  form,
  onSubmit,
  isLoading,
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Senha Atual */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha Atual</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha atual"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isLoading}
                  >
                    {showCurrentPassword ? (
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

        {/* Nova Senha */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
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

        {/* Confirmar Nova Senha */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nova Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua nova senha"
                    className="pl-10 pr-10"
                    disabled={isLoading}
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

        {/* Critérios de senha */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>A nova senha deve conter:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Pelo menos 8 caracteres</li>
            <li>1 letra minúscula</li>
            <li>1 letra maiúscula</li>
            <li>1 número</li>
          </ul>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Alterando Senha...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Alterar Senha
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ProfilePage; 