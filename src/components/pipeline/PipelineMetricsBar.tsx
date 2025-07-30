// ===================================================================
// PIPELINE METRICS BAR COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Barra de métricas do pipeline com indicadores visuais, tendências
// e navegação rápida entre diferentes visualizações

import React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Clock,
  Users,
  Percent,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { PipelineMetrics, DealStage, DEAL_STAGE_CONFIGS } from '@/types/pipeline';
import { formatCurrency } from '@/services/pipelineService';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface PipelineMetricsBarProps {
  metrics: PipelineMetrics;
  showTrends?: boolean;
  isCompact?: boolean;
  className?: string;
}

interface MetricItemProps {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tooltip?: string;
  isCompact?: boolean;
}

// ===================================================================
// COMPONENTES AUXILIARES
// ===================================================================

function MetricItem({
  label,
  value,
  trend,
  icon: Icon,
  color,
  tooltip,
  isCompact = false,
}: MetricItemProps) {
  const renderTrend = () => {
    if (trend === undefined || trend === 0) return null;

    const isPositive = trend > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
    const trendBg = isPositive ? 'bg-green-50' : 'bg-red-50';

    return (
      <div className={`flex items-center space-x-1 ${trendBg} px-2 py-1 rounded-full`}>
        <TrendIcon className={`h-3 w-3 ${trendColor}`} />
        <span className={`text-xs font-medium ${trendColor}`}>
          {Math.abs(trend).toFixed(1)}%
        </span>
      </div>
    );
  };

  const content = (
    <div className={`flex items-center space-x-3 ${isCompact ? 'p-3' : 'p-4'}`}>
      <div 
        className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg flex items-center justify-center`}
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon 
          className={`${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`}
          style={{ color }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 truncate`}>
          {label}
        </p>
        <div className="flex items-center space-x-2">
          <p className={`${isCompact ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-gray-100`}>
            {value}
          </p>
          {!isCompact && renderTrend()}
        </div>
      </div>
      
      {isCompact && renderTrend()}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

function StageProgressBar({ metrics }: { metrics: PipelineMetrics }) {
  const stages = [
    DealStage.LEAD_IN,
    DealStage.QUALIFICATION,
    DealStage.PROPOSAL,
    DealStage.NEGOTIATION,
    DealStage.WON,
  ];

  const totalActiveDeals = stages.reduce((sum, stage) => {
    return sum + (metrics.dealsByStage[stage] || 0);
  }, 0);

  if (totalActiveDeals === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Distribuição por Estágio
        </span>
        <span className="text-xs text-gray-500">
          {totalActiveDeals} deals ativos
        </span>
      </div>
      
      <div className="flex rounded-lg overflow-hidden h-2 bg-gray-200 dark:bg-gray-700">
        {stages.map(stage => {
          const count = metrics.dealsByStage[stage] || 0;
          const percentage = totalActiveDeals > 0 ? (count / totalActiveDeals) * 100 : 0;
          const config = DEAL_STAGE_CONFIGS[stage];
          
          if (percentage === 0) return null;
          
          return (
            <TooltipProvider key={stage}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-full transition-all duration-300 cursor-pointer hover:opacity-80"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{config.name}</p>
                    <p className="text-sm">{count} deals ({percentage.toFixed(1)}%)</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(metrics.valueByStage[stage] || 0)}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        {stages.map(stage => {
          const count = metrics.dealsByStage[stage] || 0;
          if (count === 0) return null;
          
          const config = DEAL_STAGE_CONFIGS[stage];
          return (
            <span key={stage} className="flex items-center space-x-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span>{count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function PipelineMetricsBar({
  metrics,
  showTrends = true,
  isCompact = false,
  className = '',
}: PipelineMetricsBarProps) {
  
  // ===================================================================
  // CÁLCULOS E FORMATAÇÕES
  // ===================================================================
  
  const formattedTotalValue = formatCurrency(metrics.totalValue);
  const formattedAverageValue = formatCurrency(metrics.averageDealValue);
  const formattedMonthlyRevenue = formatCurrency(metrics.monthlyRevenue);
  const formattedProjectedRevenue = formatCurrency(metrics.projectedRevenue);
  
  const activeDeals = Object.values(metrics.dealsByStage).reduce((sum, count) => sum + count, 0) 
    - (metrics.dealsByStage[DealStage.WON] || 0) 
    - (metrics.dealsByStage[DealStage.LOST] || 0);

  // ===================================================================
  // DADOS DAS MÉTRICAS
  // ===================================================================
  
  const mainMetrics = [
    {
      label: 'Total de Deals',
      value: metrics.totalDeals,
      trend: showTrends ? metrics.trends.deals : undefined,
      icon: BarChart3,
      color: '#3B82F6',
      tooltip: `${metrics.totalDeals} deals no total`,
    },
    {
      label: 'Valor Total',
      value: formattedTotalValue,
      trend: showTrends ? metrics.trends.revenue : undefined,
      icon: DollarSign,
      color: '#10B981',
      tooltip: `Valor total de todos os deals: ${formattedTotalValue}`,
    },
    {
      label: 'Taxa de Conversão',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      trend: showTrends ? metrics.trends.conversion : undefined,
      icon: Target,
      color: '#8B5CF6',
      tooltip: `${metrics.conversionRate.toFixed(1)}% dos leads são convertidos`,
    },
    {
      label: 'Valor Médio',
      value: formattedAverageValue,
      icon: Percent,
      color: '#F59E0B',
      tooltip: `Valor médio por deal: ${formattedAverageValue}`,
    },
  ];

  const secondaryMetrics = [
    {
      label: 'Deals Ativos',
      value: activeDeals,
      icon: Users,
      color: '#06B6D4',
      tooltip: `${activeDeals} deals em andamento`,
    },
    {
      label: 'Ciclo Médio',
      value: `${metrics.averageCycleTime} dias`,
      icon: Clock,
      color: '#84CC16',
      tooltip: `Tempo médio do lead ao fechamento: ${metrics.averageCycleTime} dias`,
    },
    {
      label: 'Receita Mensal',
      value: formattedMonthlyRevenue,
      icon: Calendar,
      color: '#EF4444',
      tooltip: `Receita fechada este mês: ${formattedMonthlyRevenue}`,
    },
    {
      label: 'Receita Projetada',
      value: formattedProjectedRevenue,
      icon: TrendingUp,
      color: '#F97316',
      tooltip: `Receita projetada baseada na probabilidade: ${formattedProjectedRevenue}`,
    },
  ];

  // ===================================================================
  // RENDER CONDICIONAL - VERSÃO COMPACTA
  // ===================================================================
  
  if (isCompact) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
            {mainMetrics.map((metric, index) => (
              <MetricItem
                key={index}
                {...metric}
                isCompact={true}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ===================================================================
  // RENDER PRINCIPAL - VERSÃO COMPLETA
  // ===================================================================
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-0">
              <MetricItem {...metric} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas secundárias e progresso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Métricas secundárias */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
                {secondaryMetrics.map((metric, index) => (
                  <MetricItem
                    key={index}
                    {...metric}
                    isCompact={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de progresso dos estágios */}
        <Card>
          <CardContent className="p-4">
            <StageProgressBar metrics={metrics} />
          </CardContent>
        </Card>
      </div>

      {/* Alertas e insights */}
      {metrics.conversionRate < 10 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Taxa de conversão baixa
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Sua taxa de conversão está em {metrics.conversionRate.toFixed(1)}%. 
                  Considere revisar sua estratégia de qualificação de leads.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}