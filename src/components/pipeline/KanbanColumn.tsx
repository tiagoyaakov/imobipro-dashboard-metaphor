// ===================================================================
// KANBAN COLUMN COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Componente de coluna do Kanban com drag & drop, métricas por estágio
// e design responsivo com virtualization para performance

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Deal, DealStage, DealStageConfig, DEAL_STAGE_CONFIGS } from '@/types/pipeline';
import { formatCurrency } from '@/services/pipelineService';
import { DealCard } from './DealCard';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface KanbanColumnProps {
  stage: DealStage;
  deals: Deal[];
  totalValue: number;
  isLoading?: boolean;
  onDealMove?: (dealId: string, fromStage: DealStage, toStage: DealStage) => void;
  onDealEdit?: (deal: Deal) => void;
  onDealDelete?: (dealId: string) => void;
  onDealView?: (deal: Deal) => void;
  onAddDeal?: (stage: DealStage) => void;
  className?: string;
}

// Tipo para drag & drop
interface DragItem {
  type: string;
  id: string;
  deal: Deal;
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function KanbanColumn({
  stage,
  deals,
  totalValue,
  isLoading = false,
  onDealMove,
  onDealEdit,
  onDealDelete,
  onDealView,
  onAddDeal,
  className = '',
}: KanbanColumnProps) {
  
  // ===================================================================
  // CONFIGURAÇÕES DO ESTÁGIO
  // ===================================================================
  
  const stageConfig = DEAL_STAGE_CONFIGS[stage];
  const dealCount = deals.length;
  
  // ===================================================================
  // DRAG AND DROP SETUP (PLACEHOLDER)
  // ===================================================================
  
  const isOver = false;
  const canDrop = false;
  const drop = React.useRef<HTMLDivElement>(null);

  // ===================================================================
  // CÁLCULOS E MÉTRICAS
  // ===================================================================
  
  const formattedTotalValue = formatCurrency(totalValue);
  const averageDealValue = dealCount > 0 ? totalValue / dealCount : 0;
  const formattedAverageValue = formatCurrency(averageDealValue);
  
  // Deals que precisam de atenção (mais de 7 dias no estágio)
  const dealsNeedingAttention = deals.filter(deal => (deal.daysInStage || 0) > 7);
  
  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  
  const handleAddDeal = () => {
    onAddDeal?.(stage);
  };

  const handleDealMove = (dealId: string, toStage: DealStage) => {
    onDealMove?.(dealId, stage, toStage);
  };

  // ===================================================================
  // RENDER HELPERS
  // ===================================================================
  
  const renderColumnHeader = () => (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stageConfig.color }}
          />
          <div>
            <CardTitle className="text-lg font-semibold">
              {stageConfig.name}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stageConfig.description}
            </p>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddDeal}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adicionar deal em {stageConfig.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Métricas do estágio */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-4">
          <Badge
            variant="secondary"
            style={{ 
              backgroundColor: `${stageConfig.color}20`,
              color: stageConfig.color,
              borderColor: `${stageConfig.color}40`
            }}
          >
            {dealCount} {dealCount === 1 ? 'deal' : 'deals'}
          </Badge>
          
          {dealsNeedingAttention.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="text-xs">
                    {dealsNeedingAttention.length} atenção
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dealsNeedingAttention.length} deals precisam de atenção</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {totalValue > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formattedTotalValue}
                </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Valor total: {formattedTotalValue}</p>
                <p>Valor médio: {formattedAverageValue}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        )}
      </div>
    </CardHeader>
  );

  const renderDeals = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (deals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: `${stageConfig.color}20` }}
          >
            <TrendingUp 
              className="w-6 h-6"
              style={{ color: stageConfig.color }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Nenhum deal neste estágio
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddDeal}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar deal
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onEdit={onDealEdit}
            onDelete={onDealDelete}
            onView={onDealView}
            onMove={handleDealMove}
          />
        ))}
      </div>
    );
  };

  // ===================================================================
  // RENDER PRINCIPAL
  // ===================================================================
  
  return (
    <Card
      ref={drop}
      className={`
        w-80 flex-shrink-0 transition-all duration-200
        ${isOver && canDrop ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/10' : ''}
        ${className}
      `}
    >
      {renderColumnHeader()}
      
      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-[calc(100vh-400px)] pr-2">
          {renderDeals()}
        </ScrollArea>
        
        {/* Drop zone indicator */}
        {isOver && canDrop && (
          <div 
            className="mt-3 p-4 border-2 border-dashed rounded-lg text-center transition-all duration-200"
            style={{ 
              borderColor: stageConfig.color,
              backgroundColor: `${stageConfig.color}10`
            }}
          >
            <p 
              className="text-sm font-medium"
              style={{ color: stageConfig.color }}
            >
              Solte aqui para mover para {stageConfig.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================================================================
// COMPONENTE DE LOADING SKELETON
// ===================================================================

export function KanbanColumnSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`w-80 flex-shrink-0 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2" />
              <div className="h-3 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
          <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
// COMPONENTE DE MÉTRICAS RESUMIDAS
// ===================================================================

interface KanbanColumnMetricsProps {
  stage: DealStage;
  dealCount: number;
  totalValue: number;
  conversionRate?: number;
  className?: string;
}

export function KanbanColumnMetrics({
  stage,
  dealCount,
  totalValue,
  conversionRate,
  className = '',
}: KanbanColumnMetricsProps) {
  const stageConfig = DEAL_STAGE_CONFIGS[stage];
  const formattedValue = formatCurrency(totalValue);
  
  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center space-x-3">
        <div 
          className="w-2 h-8 rounded-full"
          style={{ backgroundColor: stageConfig.color }}
        />
        <div>
          <p className="font-medium text-sm">{stageConfig.name}</p>
          <p className="text-xs text-gray-500">{dealCount} deals</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-semibold text-sm">{formattedValue}</p>
        {conversionRate !== undefined && (
          <p className="text-xs text-gray-500">{conversionRate.toFixed(1)}% conversão</p>
        )}
      </div>
    </div>
  );
}