import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ChevronUp, ChevronDown } from 'lucide-react';
import { AppointmentStatus, AppointmentType } from '@/types/agenda';

interface AgendaFiltersProps {
  onFiltersChange?: (filters: any) => void;
}

const AgendaFilters: React.FC<AgendaFiltersProps> = ({ onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    agent: '',
    dateFrom: '',
    dateTo: ''
  });

  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length;

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      type: '',
      agent: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  return (
    <Card className="imobipro-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8 px-2"
              >
                <X className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-8 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Ocultar</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Mostrar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">
                Buscar
              </Label>
              <Input
                id="search"
                placeholder="Buscar por título, cliente ou propriedade..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Filtros em Grid Responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value={AppointmentStatus.SCHEDULED}>Agendado</SelectItem>
                    <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmado</SelectItem>
                    <SelectItem value={AppointmentStatus.COMPLETED}>Concluído</SelectItem>
                    <SelectItem value={AppointmentStatus.CANCELLED}>Cancelado</SelectItem>
                    <SelectItem value={AppointmentStatus.NO_SHOW}>Não Compareceu</SelectItem>
                    <SelectItem value={AppointmentStatus.RESCHEDULED}>Reagendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Tipo
                </Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value={AppointmentType.VIEWING}>Visita</SelectItem>
                    <SelectItem value={AppointmentType.MEETING}>Reunião</SelectItem>
                    <SelectItem value={AppointmentType.CALL}>Ligação</SelectItem>
                    <SelectItem value={AppointmentType.OTHER}>Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Agente */}
              <div className="space-y-2">
                <Label htmlFor="agent" className="text-sm font-medium">
                  Agente
                </Label>
                <Select value={filters.agent} onValueChange={(value) => handleFilterChange('agent', value)}>
                  <SelectTrigger className="text-sm">
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
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-sm font-medium">
                  Data Inicial
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-sm font-medium">
                  Data Final
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Filtros Ativos */}
            {activeFiltersCount > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="outline" className="text-xs">
                      Busca: {filters.search}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleFilterChange('search', '')}
                      />
                    </Badge>
                  )}
                  {filters.status && (
                    <Badge variant="outline" className="text-xs">
                      Status: {filters.status}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleFilterChange('status', '')}
                      />
                    </Badge>
                  )}
                  {filters.type && (
                    <Badge variant="outline" className="text-xs">
                      Tipo: {filters.type}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleFilterChange('type', '')}
                      />
                    </Badge>
                  )}
                  {filters.agent && (
                    <Badge variant="outline" className="text-xs">
                      Agente: {filters.agent}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleFilterChange('agent', '')}
                      />
                    </Badge>
                  )}
                  {filters.dateFrom && (
                    <Badge variant="outline" className="text-xs">
                      De: {filters.dateFrom}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleFilterChange('dateFrom', '')}
                      />
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="outline" className="text-xs">
                      Até: {filters.dateTo}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleFilterChange('dateTo', '')}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AgendaFilters; 