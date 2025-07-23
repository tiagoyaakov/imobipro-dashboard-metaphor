import React, { useState } from 'react';
import { UserCheck, Users, Crown, Home, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';

// Hooks
import { useImpersonation, useImpersonationTargets } from '@/hooks/useImpersonation';

// Components UI
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// -----------------------------------------------------------
// Componente Principal do Botão de Impersonation
// -----------------------------------------------------------

export const ImpersonationButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Hooks
  const {
    isImpersonating,
    impersonatedUser,
    canImpersonate,
    isStarting,
    isEnding,
    startImpersonation,
    endImpersonation,
  } = useImpersonation();

  const { 
    data: availableUsers = [], 
    isLoading: isLoadingUsers 
  } = useImpersonationTargets();

  // Não mostrar se não for admin
  if (!canImpersonate) {
    return null;
  }

  // Função para obter ícone do role
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PROPRIETARIO':
        return <Home className="h-3 w-3 text-yellow-600" />;
      case 'ADMIN':
        return <Crown className="h-3 w-3 text-blue-600" />;
      default:
        return <User className="h-3 w-3 text-gray-600" />;
    }
  };

  // Função para obter texto do role
  const getRoleText = (role: string) => {
    switch (role) {
      case 'PROPRIETARIO':
        return 'Proprietário';
      case 'ADMIN':
        return 'Administrador';
      default:
        return 'Corretor';
    }
  };

  // Função para iniciar impersonation
  const handleStartImpersonation = async () => {
    if (!selectedUserId) return;

    try {
      await startImpersonation({ targetUserId: selectedUserId });
      setIsModalOpen(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Erro ao iniciar impersonation:', error);
    }
  };

  // Função para finalizar impersonation
  const handleEndImpersonation = async () => {
    try {
      await endImpersonation();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao finalizar impersonation:', error);
    }
  };

  // Usuário selecionado para exibir informações
  const selectedUser = availableUsers.find(user => user.id === selectedUserId);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isImpersonating ? "secondary" : "ghost"}
          size="sm"
          className={`relative ${isImpersonating ? 'bg-orange-100 hover:bg-orange-200 text-orange-800' : ''}`}
        >
          {isImpersonating ? (
            <>
              <EyeOff className="h-4 w-4" />
              <Badge 
                variant="secondary" 
                className="ml-2 bg-orange-200 text-orange-800 text-xs"
              >
                Testando
              </Badge>
            </>
          ) : (
            <Eye className="h-4 w-4" />
          )}
          
          {/* Indicador de atividade */}
          {isImpersonating && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Teste de Usuário
          </DialogTitle>
          <DialogDescription>
            {isImpersonating
              ? 'Você está testando o sistema como outro usuário. Clique em "Voltar ao Normal" para retornar.'
              : 'Teste o sistema assumindo temporariamente a visão de outros usuários.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado atual */}
          {isImpersonating && impersonatedUser && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Testando como:
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={impersonatedUser.avatar_url} />
                    <AvatarFallback className="bg-orange-200 text-orange-800">
                      {impersonatedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium text-sm">{impersonatedUser.name}</p>
                    <p className="text-xs text-muted-foreground">{impersonatedUser.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getRoleIcon(impersonatedUser.role)}
                      <span className="text-xs">{getRoleText(impersonatedUser.role)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleEndImpersonation}
                  disabled={isEnding}
                  className="w-full mt-3"
                  variant="outline"
                >
                  {isEnding ? 'Finalizando...' : 'Voltar ao Normal'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Seleção de usuário */}
          {!isImpersonating && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecionar Usuário</label>
                
                {isLoadingUsers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um usuário para testar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Proprietários */}
                        <div className="px-2 py-1.5">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Proprietários
                          </p>
                        </div>
                        {availableUsers
                          .filter(user => user.role === 'PROPRIETARIO')
                          .map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <Home className="h-3 w-3 text-yellow-600" />
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({user.email})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        
                        <Separator className="my-1" />
                        
                        {/* Corretores */}
                        <div className="px-2 py-1.5">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Corretores
                          </p>
                        </div>
                        {availableUsers
                          .filter(user => user.role === 'AGENT')
                          .map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-gray-600" />
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({user.email})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {/* Preview do usuário selecionado */}
                    {selectedUser && (
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={selectedUser.avatar_url} />
                              <AvatarFallback>
                                {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <p className="font-medium text-sm">{selectedUser.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {getRoleIcon(selectedUser.role)}
                                <span className="text-xs">{getRoleText(selectedUser.role)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>

              {/* Botão de iniciar */}
              <Button
                onClick={handleStartImpersonation}
                disabled={!selectedUserId || isStarting}
                className="w-full"
              >
                {isStarting ? 'Iniciando...' : 'Iniciar Teste'}
              </Button>
            </>
          )}

          {/* Aviso importante */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Aviso:</strong> Durante o teste, você verá o sistema exatamente como o usuário selecionado o veria, 
              incluindo suas permissões, dados e restrições. Todas as ações são registradas no log de auditoria.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImpersonationButton; 