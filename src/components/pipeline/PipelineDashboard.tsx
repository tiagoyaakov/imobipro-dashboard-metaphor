// ===================================================================
// PIPELINE DASHBOARD COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Dashboard executivo do pipeline com métricas avançadas, gráficos
// e insights para gestão estratégica do funil de vendas

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Award,
} from 'lucide-react';
import { usePipelineDashboard } from '@/hooks/usePipeline';
import { DealStage, DEAL_STAGE_CONFIGS } from '@/types/pipeline';
import { formatCurrency } from '@/services/pipelineService';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface PipelineDashboardProps {
  agentId?: string;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}

// ===================================================================
// COMPONENTES AUXILIARES
// ===================================================================

function MetricCard({ title, value, trend, icon: Icon, color, description }: MetricCardProps) {
  const renderTrend = () => {
    if (trend === undefined || trend === 0) return null;

    const isPositive = trend > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className="flex items-center mt-2">
        <TrendIcon className={`h-4 w-4 mr-1 ${trendColor}`} />
        <span className={`text-sm font-medium ${trendColor}`}>
          {Math.abs(trend).toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500 ml-1">vs. período anterior</span>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {renderTrend()}
          </div>
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionFunnelChart({ metrics }: { metrics: any }) {
  const funnelData = [
    { stage: 'Lead Inicial', deals: metrics.dealsByStage[DealStage.LEAD_IN] || 0 },
    { stage: 'Qualificação', deals: metrics.dealsByStage[DealStage.QUALIFICATION] || 0 },
    { stage: 'Proposta', deals: metrics.dealsByStage[DealStage.PROPOSAL] || 0 },
    { stage: 'Negociação', deals: metrics.dealsByStage[DealStage.NEGOTIATION] || 0 },
    { stage: 'Fechado', deals: metrics.dealsByStage[DealStage.WON] || 0 },
  ];

  const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="stage" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="deals" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RevenueChart({ metrics }: { metrics: any }) {
  // Dados mock para demonstração - em produção viria de uma API
  const revenueData = [
    { month: 'Jan', revenue: 150000, projected: 180000 },
    { month: 'Fev', revenue: 230000, projected: 250000 },
    { month: 'Mar', revenue: 180000, projected: 200000 },
    { month: 'Abr', revenue: 290000, projected: 300000 },
    { month: 'Mai', revenue: 320000, projected: 350000 },
    { month: 'Jun', revenue: metrics.monthlyRevenue, projected: metrics.projectedRevenue },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={revenueData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Area 
          type="monotone" 
          dataKey="projected" 
          stackId="1" 
          stroke="#10B981" 
          fill="#10B98120" 
          name="Projetada"
        />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stackId="2" 
          stroke="#3B82F6" 
          fill="#3B82F620" 
          name="Realizada"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StageDistributionChart({ metrics }: { metrics: any }) {
  const pieData = Object.entries(metrics.dealsByStage).map(([stage, count]) => ({
    name: DEAL_STAGE_CONFIGS[stage as DealStage].name,
    value: count as number,
    color: DEAL_STAGE_CONFIGS[stage as DealStage].color,
  })).filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function PipelineDashboard({ agentId, className = '' }: PipelineDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  
  const { data, isLoading, error, refresh } = usePipelineDashboard(agentId);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar dashboard</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ocorreu um erro ao carregar os dados do dashboard
        </p>
        <Button onClick={refresh}>Tentar novamente</Button>
      </Card>
    );
  }

  const { metrics, dealsNeedingAttention, topDealsByValue, totalPipelineValue } = data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard do Pipeline</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Visão executiva do funil de vendas e métricas de performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={refresh}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Deals"
          value={metrics.totalDeals}
          trend={metrics.trends.deals}
          icon={BarChart3}
          color="#3B82F6"
          description={`${metrics.totalDeals} deals no pipeline`}
        />
        
        <MetricCard
          title="Valor Total"
          value={formatCurrency(metrics.totalValue)}
          trend={metrics.trends.revenue}
          icon={DollarSign}
          color="#10B981"
          description="Valor total em negociação"
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          trend={metrics.trends.conversion}
          icon={Target}
          color="#8B5CF6"
          description="Leads convertidos em vendas"
        />
        
        <MetricCard
          title="Ciclo de Vendas"
          value={`${metrics.averageCycleTime} dias`}
          icon={Clock}
          color="#F59E0B"
          description="Tempo médio de fechamento"
        />
      </div>

      {/* Alertas e insights */}
      {dealsNeedingAttention.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Deals que Precisam de Atenção
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              {dealsNeedingAttention.length} deals estão há mais tempo no mesmo estágio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dealsNeedingAttention.slice(0, 3).map(deal => (
                <div key={deal.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div>
                    <p className="font-medium">{deal.title}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(deal.value)}</p>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    {deal.daysInStage} dias
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos e análises */}
      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>
        
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              <CardDescription>
                Distribuição de deals por estágio do pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionFunnelChart metrics={metrics} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Receita Realizada vs Projetada</CardTitle>
              <CardDescription>
                Comparação entre receita realizada e projetada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart metrics={metrics} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Estágio</CardTitle>
              <CardDescription>
                Proporção de deals em cada estágio do pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StageDistributionChart metrics={metrics} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Top Deals por Valor
            </CardTitle>
            <CardDescription>
              Maiores negócios em andamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDealsByValue.slice(0, 5).map((deal, index) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-gray-500">
                        {DEAL_STAGE_CONFIGS[deal.currentStage].name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(deal.value)}</p>
                    <p className="text-sm text-gray-500">{deal.probability}% chance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pipeline Total</span>
              <span className="font-bold">{formatCurrency(totalPipelineValue)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Receita Projetada</span>
              <span className="font-bold text-green-600">{formatCurrency(metrics.projectedRevenue)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Deals Ativos</span>
              <span className="font-bold">{metrics.totalDeals - (metrics.dealsByStage[DealStage.WON] || 0) - (metrics.dealsByStage[DealStage.LOST] || 0)}</span>
            </div>
            
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso para Meta Mensal</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Performance vs. Meta:</p>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">No caminho para atingir a meta mensal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}