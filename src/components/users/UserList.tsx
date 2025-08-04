import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Crown,
  Home,
  Shield,
  User,
  UserCheck,
  UserX,
  Settings,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

// Types
import type { User as UserType } from '@/hooks/useUsersReal';

// Hooks
import { useUpdateUserRoleReal as useUpdateUserRole, useToggleUserStatusReal as useToggleUserStatus, useUserPermissionsReal as useUserPermissions } from '@/hooks/useUsersReal';

// Components UI
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// -----------------------------------------------------------
// Interface para os props
// -----------------------------------------------------------

interface UserListProps {
  users: UserType[];
  currentUserId: string;
}

interface UserActionDialogState {
  isOpen: boolean;
  type: 'role' | 'status' | null;
  user: UserType | null;
  newRole?: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  newStatus?: boolean;
  reason?: string;
}

// -----------------------------------------------------------
// Componente de Lista de Usuários
// -----------------------------------------------------------

export const UserList: React.FC<UserListProps> = ({ users, currentUserId }) => {
  // States para diálogos
  const [dialogState, setDialogState] = useState<UserActionDialogState>({
    isOpen: false,
    type: null,
    user: null,
  });

  // Hooks
  const permissions = useUserPermissions();
  const updateRoleMutation = useUpdateUserRole();
  const toggleStatusMutation = useToggleUserStatus();

  // Função para obter ícone da função
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DEV_MASTER':
        return <Crown className="h-4 w-4 text-red-600" />;
      case 'ADMIN':
        return <Home className="h-4 w-4 text-blue-600" />;
      case 'AGENT':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  // Função para obter texto da função
  const getRoleText = (role: string) => {
    switch (role) {
      case 'DEV_MASTER':
        return 'Dev Master';
      case 'ADMIN':
        return 'Administrador';
      case 'AGENT':
        return 'Corretor';
      default:
        return 'Corretor';
    }
  };

  // Função para obter cor do badge da função
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'DEV_MASTER':
        return 'destructive' as const;
      case 'ADMIN':
        return 'secondary' as const;
      case 'AGENT':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  // Abrir diálogo de alteração de função
  const openRoleDialog = (user: UserType) => {
    setDialogState({
      isOpen: true,
      type: 'role',
      user,
      newRole: user.role,
      reason: '',
    });
  };

  // Abrir diálogo de alteração de status
  const openStatusDialog = (user: UserType) => {
    setDialogState({
      isOpen: true,
      type: 'status',
      user,
      newStatus: !user.isActive,
      reason: '',
    });
  };

  // Fechar diálogo
  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      type: null,
      user: null,
    });
  };

  // Confirmar ação
  const confirmAction = async () => {
    const { type, user, newRole, newStatus, reason } = dialogState;
    
    if (!user) return;

    try {
      if (type === 'role' && newRole) {
        await updateRoleMutation.mutateAsync({
          userId: user.id,
          newRole,
          reason,
        });
      } else if (type === 'status' && newStatus !== undefined) {
        await toggleStatusMutation.mutateAsync({
          userId: user.id,
          newStatus,
          reason,
        });
      }
      
      closeDialog();
    } catch (error) {
      // Erro será tratado pelos hooks
      console.error('Erro ao executar ação:', error);
    }
  };

  // Verificar se usuário pode alterar função
  const canChangeRole = (targetUser: UserType) => {
    if (targetUser.id === currentUserId) return false;
    // Apenas admin pode alterar qualquer função
    return permissions.canManageUsers;
  };

  // Verificar se usuário pode alterar status
  const canChangeStatus = (targetUser: UserType) => {
    if (targetUser.id === currentUserId) return false;
    return permissions.canManageUsers;
  };

  const isLoading = updateRoleMutation.isPending || toggleStatusMutation.isPending;

  return (
    <>
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="transition-all hover:shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Informações do usuário */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={user.avatarUrl} 
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-primary/10">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {user.name}
                      </h3>
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Cadastrado em {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      {user.companyId && (
                        <>
                          <span>•</span>
                          <span>ID: {user.companyId.slice(0, 8)}...</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status e ações */}
                <div className="flex items-center space-x-3">
                  {/* Badge da função */}
                  <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                    {getRoleIcon(user.role)}
                    {getRoleText(user.role)}
                  </Badge>

                  {/* Badge do status */}
                  <Badge 
                    variant={user.isActive ? "default" : "secondary"} 
                    className={`gap-1 ${user.isActive 
                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    {user.isActive ? (
                      <UserCheck className="h-3 w-3" />
                    ) : (
                      <UserX className="h-3 w-3" />
                    )}
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>

                  {/* Menu de ações */}
                  {permissions.canManageUsers && user.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => openRoleDialog(user)}
                          disabled={!canChangeRole(user)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Alterar Função
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => openStatusDialog(user)}
                          disabled={!canChangeStatus(user)}
                        >
                          {user.isActive ? (
                            <UserX className="mr-2 h-4 w-4" />
                          ) : (
                            <UserCheck className="mr-2 h-4 w-4" />
                          )}
                          {user.isActive ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Histórico
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de confirmação */}
      <AlertDialog open={dialogState.isOpen} onOpenChange={closeDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {dialogState.type === 'role' ? 'Alterar Função' : 'Alterar Status'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'role' 
                ? `Você está prestes a alterar a função de ${dialogState.user?.name}.`
                : `Você está prestes a ${dialogState.newStatus ? 'ativar' : 'desativar'} ${dialogState.user?.name}.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {dialogState.type === 'role' && (
              <div className="space-y-2">
                <Label>Nova Função</Label>
                <Select
                  value={dialogState.newRole}
                  onValueChange={(value: 'DEV_MASTER' | 'ADMIN' | 'AGENT') => {
                    setDialogState(prev => ({ ...prev, newRole: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Corretor</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    {permissions.isCurrentUserDevMaster && (
                      <SelectItem value="DEV_MASTER">Dev Master</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo (Opcional)</Label>
              <Textarea
                placeholder="Descreva o motivo desta alteração..."
                value={dialogState.reason || ''}
                onChange={(e) => {
                  setDialogState(prev => ({ ...prev, reason: e.target.value }));
                }}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserList; 