import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Search, X } from 'lucide-react';

interface AgendaFiltersProps {
  onFiltersChange?: (filters: AgendaFilters) => void;
}

export interface AgendaFilters {
  search: string;
  agentId: string;
  status: string;
  type: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const AgendaFilters: React.FC<AgendaFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<AgendaFilters>({
    search: '',
    agentId: '',
    status: '',
    type: '',
    dateRange: {
      start: null,
      end: null
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof AgendaFilters, value: string | Date | null) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    const newFilters = {
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [key]: value ? new Date(value) : null
      }
    };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: AgendaFilters = {
      search: '',
      agentId: '',
      status: '',
      type: '',
      dateRange: {
        start: null,
        end: null
      }
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const hasActiveFilters = filters.search || filters.agentId || filters.status || filters.type || filters.dateRange.start || filters.dateRange.end;

  return (
    <Card className="imobipro-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por título, cliente, propriedade..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Agente */}
            <div className="space-y-2">
              <Label htmlFor="agent">Agente</Label>
              <Select value={filters.agentId} onValueChange={(value) => handleFilterChange('agentId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os agentes</SelectItem>
                  <SelectItem value="agent1">João Silva</SelectItem>
                  <SelectItem value="agent2">Maria Santos</SelectItem>
                  <SelectItem value="agent3">Pedro Costa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="visit">Visita</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="negotiation">Negociação</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro por Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-sm">Data inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-sm">Data final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filtros Ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Busca: {filters.search}
                </Badge>
              )}
              {filters.agentId && (
                <Badge variant="secondary" className="text-xs">
                  Agente: {filters.agentId}
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="text-xs">
                  Status: {filters.status}
                </Badge>
              )}
              {filters.type && (
                <Badge variant="secondary" className="text-xs">
                  Tipo: {filters.type}
                </Badge>
              )}
              {filters.dateRange.start && (
                <Badge variant="secondary" className="text-xs">
                  De: {filters.dateRange.start.toLocaleDateString()}
                </Badge>
              )}
              {filters.dateRange.end && (
                <Badge variant="secondary" className="text-xs">
                  Até: {filters.dateRange.end.toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AgendaFilters; 