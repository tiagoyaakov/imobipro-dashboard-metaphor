// ================================================================
// COMPONENTE LISTA DE CLIENTES - ABA CLIENTES
// ================================================================
// Data: 07/08/2025
// Descrição: Lista tabular de clientes com controle de acesso por role
// Features: Filtros, busca, paginação, ações, permissões RLS
// ================================================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Phone,
  Mail,
  Calendar,
  Star,
  Trash2,
  Download,
  FileText,
  MessageSquare
} from 'lucide-react';
import { 
  STATUS_CLIENTE_CONFIG,
  type StatusCliente, 
  type ClienteKanbanCard,
  type ClientesListProps,
  type ClienteFilters
} from '@/types/clientes';
import { cn } from '@/lib/utils';

// Props do componente
interface ClientesListViewProps extends ClientesListProps {
  filters?: ClienteFilters;
  onFilterChange?: (filters: ClienteFilters) => void;
}

const ClientesList: React.FC<ClientesListViewProps> = ({ 
  clientes, 
  onEdit, 
  onView, 
  onDelete,
  isLoading = false,
  currentUserRole = 'AGENT',
  currentUserId,
  filters = {},
  onFilterChange
}) => {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState<StatusCliente | 'all'>('all');
  const [sortBy, setSortBy] = useState<'nome' | 'score_lead' | 'created_at' | 'ultima_interacao'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrar clientes baseado nas permissões e filtros locais
  const filteredClientes = useMemo(() => {
    let filtered = [...clientes];

    // Aplicar RLS baseado no role
    if (currentUserRole === 'AGENT' && currentUserId) {
      filtered = filtered.filter(cliente => cliente.funcionario === currentUserId);
    }

    // Aplicar busca
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(cliente => 
        cliente.nome.toLowerCase().includes(searchLower) ||
        cliente.telefone.includes(search) ||
        (cliente.email && cliente.email.toLowerCase().includes(searchLower)) ||
        (cliente.empresa && cliente.empresa.toLowerCase().includes(searchLower))
      );
    }

    // Aplicar filtro de status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cliente => cliente.status === selectedStatus);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'nome': {
          comparison = a.nome.localeCompare(b.nome);
          break;
        }
        case 'score_lead': {
          const scoreA = a.score_lead;
          const scoreB = b.score_lead;
          comparison = scoreA - scoreB;
          break;
        }
        case 'created_at': {
          const createdA = new Date(a.created_at).getTime();
          const createdB = new Date(b.created_at).getTime();
          comparison = createdA - createdB;
          break;
        }
        case 'ultima_interacao': {
          const dateA = a.ultima_interacao ? new Date(a.ultima_interacao).getTime() : 0;
          const dateB = b.ultima_interacao ? new Date(b.ultima_interacao).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        default: {
          comparison = 0;
        }
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [clientes, currentUserRole, currentUserId, search, selectedStatus, sortBy, sortOrder]);

  // Estatísticas dos clientes filtrados
  const stats = useMemo(() => {
    const total = filteredClientes.length;
    const avgScore = total > 0 
      ? Math.round(filteredClientes.reduce((sum, c) => sum + c.score_lead, 0) / total)
      : 0;
    
    const byStatus = filteredClientes.reduce((acc, cliente) => {
      acc[cliente.status] = (acc[cliente.status] || 0) + 1;
      return acc;
    }, {} as Record<StatusCliente, number>);

    const qualified = byStatus.qualificados || 0;
    const converted = byStatus.convertidos || 0;
    
    return { total, avgScore, byStatus, qualified, converted };
  }, [filteredClientes]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearch(value);
    onFilterChange?.({ ...filters, search: value || undefined });
  };

  const handleStatusFilter = (status: StatusCliente | 'all') => {
    setSelectedStatus(status);
    onFilterChange?.({ ...filters, status: status === 'all' ? undefined : status });
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Função para obter iniciais do nome
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Função para cor do score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Lista de Clientes</CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.avgScore}</div>
              <div className="text-xs text-muted-foreground">Score Médio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.qualified}</div>
              <div className="text-xs text-muted-foreground">Qualificados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
              <div className="text-xs text-muted-foreground">Convertidos</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros e busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, telefone, email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por status */}
            <Select value={selectedStatus} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <Separator />
                {Object.entries(STATUS_CLIENTE_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center">
                      <div className={cn("w-2 h-2 rounded-full mr-2", config.bgColor)} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de clientes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('nome')}
                  >
                    Cliente
                    {sortBy === 'nome' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('score_lead')}
                  >
                    Score
                    {sortBy === 'score_lead' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('ultima_interacao')}
                  >
                    Última Interação
                    {sortBy === 'ultima_interacao' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    Criado
                    {sortBy === 'created_at' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium mb-2">Nenhum cliente encontrado</p>
                        <p className="text-xs">
                          {search || selectedStatus !== 'all' 
                            ? 'Ajuste os filtros para ver mais resultados'
                            : 'Comece criando seu primeiro cliente'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => {
                    const statusConfig = STATUS_CLIENTE_CONFIG[cliente.status];
                    
                    return (
                      <TableRow key={cliente.id} className="hover:bg-muted/50">
                        {/* Cliente */}
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs font-medium">
                                {getInitials(cliente.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{cliente.nome}</p>
                              {cliente.empresa && (
                                <p className="text-xs text-muted-foreground">{cliente.empresa}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", statusConfig.color, statusConfig.bgColor)}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Contato */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Phone className="w-3 h-3 mr-1" />
                              {cliente.telefone}
                            </div>
                            {cliente.email && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Mail className="w-3 h-3 mr-1" />
                                {cliente.email}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Score */}
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs font-medium", getScoreColor(cliente.score_lead))}
                            >
                              {cliente.score_lead}
                            </Badge>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i}
                                  className={cn(
                                    "w-3 h-3",
                                    i < Math.floor(cliente.score_lead / 20) 
                                      ? "text-yellow-400 fill-current" 
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        </TableCell>

                        {/* Origem */}
                        <TableCell>
                          {cliente.origem_lead && (
                            <Badge variant="outline" className="text-xs">
                              {cliente.origem_lead}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Última Interação */}
                        <TableCell>
                          {cliente.ultima_interacao ? (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(cliente.ultima_interacao).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Criado */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </TableCell>

                        {/* Ações */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onView(cliente)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(cliente)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Phone className="w-4 h-4 mr-2" />
                                Ligar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <FileText className="w-4 h-4 mr-2" />
                                Relatório
                              </DropdownMenuItem>
                              {onDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => onDelete(cliente.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda de permissões */}
      {currentUserRole === 'AGENT' && (
        <Card>
          <CardContent className="p-3 bg-blue-50">
            <p className="text-sm text-blue-800">
              <strong>Modo Corretor:</strong> Visualizando apenas seus clientes atribuídos. 
              Administradores podem ver todos os clientes da empresa.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientesList;