
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Users, UserCheck, UserX, Filter, Search, Plus } from 'lucide-react';

// Hooks
import { useUsers, useUserStats, useUserPermissions } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';

// Components UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Components específicos
import { UserList } from '@/components/users/UserList';
import { UserStats } from '@/components/users/UserStats';
import { UserFilters } from '@/components/users/UserFilters';

// -----------------------------------------------------------
// Página Principal de Gestão de Usuários
// -----------------------------------------------------------

export const Usuarios: React.FC = () => {
  // Estados locais para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Hooks
  const { user: currentUser } = useAuth();
  const { canManageUsers } = useUserPermissions();
  const { data: users = [], isLoading, error } = useUsers();
  const stats = useUserStats();

  // Verificação de permissão de acesso
  if (!currentUser || !canManageUsers) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Filtrar usuários baseado nos critérios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Erro ao carregar usuários. Tente novamente.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários, funções e permissões do sistema
          </p>
        </div>
        
        {/* Botão adicionar usuário (futuro) */}
        <Button variant="outline" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
          <Badge variant="secondary" className="ml-2">Em breve</Badge>
        </Button>
      </div>

      {/* Estatísticas */}
      <UserStats 
        stats={stats}
        isLoading={isLoading}
      />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre e busque usuários por critérios específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por função */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todas as funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="CREATOR">Criador</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="AGENT">Corretor</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultados da busca */}
          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredUsers.length} de {users.length} usuários encontrados
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Liste e gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há usuários cadastrados no sistema'}
              </p>
            </div>
          ) : (
            <UserList 
              users={filteredUsers}
              currentUserId={currentUser.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota importante:</strong> Apenas usuários com função de Administrador ou Criador 
          podem gerenciar outros usuários. As alterações são registradas no log de auditoria 
          do sistema para fins de segurança.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Usuarios;
