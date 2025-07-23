import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// -----------------------------------------------------------
// Interface para filtros
// -----------------------------------------------------------

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  filteredResults: number;
}

// -----------------------------------------------------------
// Componente de Filtros de Usuários
// -----------------------------------------------------------

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  totalResults,
  filteredResults,
}) => {
  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

  return (
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
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por função */}
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todas as funções" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              <SelectItem value="DEV_MASTER">Dev Master</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="AGENT">Corretor</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por status */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {filteredResults} de {totalResults} usuários encontrados
              </p>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  Filtros ativos
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-1"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserFilters; 