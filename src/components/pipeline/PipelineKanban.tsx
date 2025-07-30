// ===================================================================
// PIPELINE KANBAN COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Componente principal do Kanban para visualização do funil de vendas
// com drag & drop, filtros, métricas em tempo real e ações em lote

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Download,
  Settings,
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  Deal,
  DealStage,
  DealStatus,
  PipelineFilters,
  DEAL_STAGE_CONFIGS,
} from '@/types/pipeline';
import { usePipelineManager } from '@/hooks/usePipeline';
import { formatCurrency } from '@/services/pipelineService';
import { KanbanColumn, KanbanColumnSkeleton } from './KanbanColumn';
import { DealFormModal } from './DealFormModal';
import { DealDetailsModal } from './DealDetailsModal';
import { PipelineMetricsBar } from './PipelineMetricsBar';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface PipelineKanbanProps {
  agentId?: string;
  className?: string;
}

interface FilterState {
  search: string;
  agent: string;
  dateRange: string;
  minValue: string;
  maxValue: string;
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function PipelineKanban({ agentId, className = '' }: PipelineKanbanProps) {
  
  // ===================================================================
  // ESTADO LOCAL
  // ===================================================================
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    agent: agentId || '',
    dateRange: '',
    minValue: '',
    maxValue: '',
  });
  
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [creatingDealStage, setCreatingDealStage] = useState<DealStage | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ===================================================================
  // HOOKS DE DADOS
  // ===================================================================
  
  const pipelineFilters: PipelineFilters = useMemo(() => {
    const result: PipelineFilters = {};
    
    if (filters.search) result.searchTerm = filters.search;
    if (filters.agent) result.agentId = filters.agent;
    if (filters.minValue) result.minValue = parseFloat(filters.minValue);
    if (filters.maxValue) result.maxValue = parseFloat(filters.maxValue);
    
    return result;
  }, [filters]);
  
  const {
    deals,
    dealsByStage,
    metrics,
    isLoading,
    isError,
    error,
    createDeal,
    updateDeal,
    moveDeal,
    deleteDeal,
    isCreating,
    isUpdating,
    isMoving,
    isDeleting,
    refresh,
  } = usePipelineManager(filters.agent || undefined);

  // ===================================================================
  // DADOS COMPUTADOS
  // ===================================================================
  
  const filteredDealsByStage = useMemo(() => {
    if (!dealsByStage || !deals) return {};
    
    const filtered: Record<DealStage, Deal[]> = {} as Record<DealStage, Deal[]>;
    
    Object.entries(dealsByStage).forEach(([stage, stageDeals]) => {
      filtered[stage as DealStage] = stageDeals.filter(deal => {
        // Aplicar filtros locais
        if (filters.search && !deal.title.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        
        if (filters.minValue && deal.value < parseFloat(filters.minValue)) {
          return false;
        }
        
        if (filters.maxValue && deal.value > parseFloat(filters.maxValue)) {
          return false;
        }
        
        return true;
      });
    });
    
    return filtered;
  }, [dealsByStage, deals, filters]);

  const totalDealsShown = useMemo(() => {
    return Object.values(filteredDealsByStage).reduce((sum, deals) => sum + deals.length, 0);
  }, [filteredDealsByStage]);

  const totalValueShown = useMemo(() => {
    return Object.values(filteredDealsByStage)
      .flat()
      .reduce((sum, deal) => sum + deal.value, 0);
  }, [filteredDealsByStage]);

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  
  const handleDealMove = async (dealId: string, fromStage: DealStage, toStage: DealStage) => {
    try {
      await moveDeal({
        dealId,
        fromStage,
        toStage,
        reason: `Movido via Kanban de ${DEAL_STAGE_CONFIGS[fromStage].name} para ${DEAL_STAGE_CONFIGS[toStage].name}`,
      });
    } catch (error) {
      console.error('Erro ao mover deal:', error);
    }
  };

  const handleDealEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setIsFormModalOpen(true);
  };

  const handleDealView = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailsModalOpen(true);
  };

  const handleDealDelete = async (dealId: string) => {
    if (window.confirm('Tem certeza que deseja remover este deal?')) {
      try {
        await deleteDeal(dealId);
      } catch (error) {
        console.error('Erro ao deletar deal:', error);
      }
    }
  };

  const handleAddDeal = (stage: DealStage) => {
    setCreatingDealStage(stage);
    setEditingDeal(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (dealData: any) => {
    try {
      if (editingDeal) {
        await updateDeal(editingDeal.id, dealData);
      } else {
        await createDeal({
          ...dealData,
          stage: creatingDealStage || DealStage.LEAD_IN,
        });
      }
      setIsFormModalOpen(false);
      setEditingDeal(null);
      setCreatingDealStage(null);
    } catch (error) {
      console.error('Erro ao salvar deal:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      agent: agentId || '',
      dateRange: '',
      minValue: '',
      maxValue: '',
    });
  };

  // ===================================================================
  // RENDER HELPERS
  // ===================================================================
  
  const renderHeader = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe seus negócios através do funil de vendas
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atualizar dados</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          
          <Button size="sm" onClick={() => handleAddDeal(DealStage.LEAD_IN)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Deal
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Exportar dados
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                Relatório detalhado
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Filtros */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar deals..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Valor mínimo</label>
                <Input
                  type="number"
                  placeholder="R$ 0"
                  value={filters.minValue}
                  onChange={(e) => handleFilterChange('minValue', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Valor máximo</label>
                <Input
                  type="number"
                  placeholder="R$ 999.999"
                  value={filters.maxValue}
                  onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Barra de métricas */}
      {metrics && <PipelineMetricsBar metrics={metrics} />}
    </div>
  );

  const renderKanbanBoard = () => {
    if (isLoading) {
      return (
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {Object.values(DealStage).map(stage => (
            <KanbanColumnSkeleton key={stage} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar pipeline</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'Ocorreu um erro inesperado'}
          </p>
          <Button onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </Card>
      );
    }

    return (
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {Object.values(DealStage).map(stage => {
          const stageDeals = filteredDealsByStage[stage] || [];
          const stageTotalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
          
          return (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={stageDeals}
              totalValue={stageTotalValue}
              isLoading={isMoving}
              onDealMove={handleDealMove}
              onDealEdit={handleDealEdit}
              onDealDelete={handleDealDelete}
              onDealView={handleDealView}
              onAddDeal={handleAddDeal}
            />
          );
        })}
      </div>
    );
  };

  const renderSummaryBar = () => (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium">Total de Deals</span>
          </div>
          <p className="text-2xl font-bold">{totalDealsShown}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-medium">Valor Total</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalValueShown)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
            <span className="text-sm font-medium">Taxa de Conversão</span>
          </div>
          <p className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1)}%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5 text-orange-500 mr-2" />
            <span className="text-sm font-medium">Ciclo Médio</span>
          </div>
          <p className="text-2xl font-bold">{metrics?.averageCycleTime || 0} dias</p>
        </CardContent>
      </Card>
    </div>
  );

  // ===================================================================
  // RENDER PRINCIPAL
  // ===================================================================
  
  return (
    <div className={className}>
      {renderHeader()}
      {renderKanbanBoard()}
      {renderSummaryBar()}
      
      {/* Modais */}
      <DealFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        deal={editingDeal}
        initialStage={creatingDealStage}
        isLoading={isCreating || isUpdating}
      />
      
      <DealDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        deal={selectedDeal}
        onEdit={handleDealEdit}
        onDelete={handleDealDelete}
      />
    </div>
  );
}