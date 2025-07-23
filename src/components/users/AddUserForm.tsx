import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Building2, Phone, Mail, UserPlus, Loader2 } from 'lucide-react';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useCreateUser } from '@/hooks/useUsers';

// Schemas
import { 
  createUserSchema, 
  type CreateUserFormData,
  getRoleOptionsByUser,
  formatPhoneNumber,
  userFormErrorMessages
} from '@/schemas/user';

// Components UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// -----------------------------------------------------------
// Interface para props do componente
// -----------------------------------------------------------

interface AddUserFormProps {
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
  companies?: Array<{ id: string; name: string }>;
}

// -----------------------------------------------------------
// Componente de Formulário para Adicionar Usuário
// -----------------------------------------------------------

export const AddUserForm: React.FC<AddUserFormProps> = ({
  onSuccess,
  onCancel,
  companies = []
}) => {
  const { user: currentUser } = useAuth();
  const createUserMutation = useCreateUser();
  
  // Estado para controlar formatação do telefone
  const [phoneValue, setPhoneValue] = useState('');

  // Configuração do formulário
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'AGENT', // Valor padrão mais seguro
      company_id: '',
      telefone: '',
      avatar_url: '',
    },
    mode: 'onChange', // Validação em tempo real
  });

  // Obter opções de função baseadas na hierarquia do usuário atual
  const roleOptions = getRoleOptionsByUser(currentUser?.role || 'AGENT');

  // Handler para formatação do telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setPhoneValue(formatted);
    form.setValue('telefone', formatted);
  };

  // Handler para envio do formulário
  const onSubmit = async (data: CreateUserFormData) => {
    try {
      console.log('🔄 [AddUserForm] Enviando dados:', data);
      
      const result = await createUserMutation.mutateAsync({
        email: data.email,
        name: data.name,
        role: data.role,
        company_id: data.company_id,
        telefone: data.telefone || undefined,
        avatar_url: data.avatar_url || undefined,
      });

      console.log('✅ [AddUserForm] Usuário criado:', result);
      
      // Limpar formulário
      form.reset();
      setPhoneValue('');
      
      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess(result.user);
      }
      
    } catch (error) {
      console.error('❌ [AddUserForm] Erro ao criar usuário:', error);
      // Erro será tratado pelo hook useCreateUser
    }
  };

  // Handler para cancelar
  const handleCancel = () => {
    form.reset();
    setPhoneValue('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Adicionar Novo Usuário
        </CardTitle>
        <CardDescription>
          Preencha os dados do novo usuário. Apenas campos obrigatórios são necessários.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Básicas
            </h3>
            
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome Completo *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite o nome completo"
                {...form.register('name')}
                className={form.formState.errors.name ? 'border-destructive' : ''}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  {...form.register('email')}
                  className={`pl-10 ${form.formState.errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  className={`pl-10 ${form.formState.errors.telefone ? 'border-destructive' : ''}`}
                />
              </div>
              {form.formState.errors.telefone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.telefone.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Configurações do Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Configurações do Sistema
            </h3>
            
            {/* Função */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Função *
              </Label>
              <Select
                value={form.watch('role')}
                onValueChange={(value) => form.setValue('role', value as any)}
              >
                <SelectTrigger className={form.formState.errors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company_id" className="text-sm font-medium">
                Empresa *
              </Label>
              <Select
                value={form.watch('company_id')}
                onValueChange={(value) => form.setValue('company_id', value)}
              >
                <SelectTrigger className={form.formState.errors.company_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.company_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.company_id.message}
                </p>
              )}
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatar_url" className="text-sm font-medium">
                URL do Avatar
              </Label>
              <Input
                id="avatar_url"
                type="url"
                placeholder="https://exemplo.com/avatar.jpg"
                {...form.register('avatar_url')}
                className={form.formState.errors.avatar_url ? 'border-destructive' : ''}
              />
              {form.formState.errors.avatar_url && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.avatar_url.message}
                </p>
              )}
            </div>
          </div>

          {/* Informações de Permissão */}
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>Permissões:</strong> {currentUser?.role === 'DEV_MASTER' 
                ? 'Você pode criar Administradores e Corretores'
                : 'Você pode criar apenas Corretores'
              }
            </AlertDescription>
          </Alert>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createUserMutation.isPending}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={createUserMutation.isPending || !form.formState.isValid}
              className="min-w-[120px]"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuário
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddUserForm; 