// ================================================================
// PÁGINA DE TESTE - COMPARAÇÃO DASHBOARD V1 VS V2
// ================================================================
// Data: 02/08/2025
// Descrição: Página para testar e comparar as versões do Dashboard
// Features: Comparação lado a lado, métricas de performance
// ================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  RefreshCw, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Wifi,
  WifiOff
} from 'lucide-react';

// Hooks das duas versões
import useDashboard from '@/hooks/useDashboard'; // V1
import useDashboardV2 from '@/hooks/useDashboardV2'; // V2

// Componentes de monitoramento
// import { CacheHealthIndicator } from '@/components/monitoring';

// Componentes originais do Dashboard - comentados temporariamente para build
// import MetricCard from '@/components/dashboard/MetricCard';
// import ActivityFeed from '@/components/dashboard/ActivityFeed';
// import SalesChart from '@/components/dashboard/SalesChart';

export default function DashboardTest() {
  const [useV2, setUseV2] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('6months');
  
  // Hook V1 (Original)
  const v1 = useDashboard({ 
    chartPeriod, 
    enableRealtime: true 
  });
  
  // Hook V2 (Com Cache Unificado)
  const v2 = useDashboardV2({ 
    chartPeriod, 
    enableRealtime: true,
    enableCache: true 
  });

  const currentVersion = useV2 ? v2 : v1;

  // Função para formatar bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Test Environment</h1>
          <p className="text-muted-foreground mt-1">
            Compare as versões do Dashboard com e sem cache unificado
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Indicador de saúde do cache (só aparece em V2) */}
          {/* useV2 && <CacheHealthIndicator size="md" showDetails /> */}
          
          {/* Switch de versão */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="version-switch">Usar V2 (Cache Unificado)</Label>
            <Switch
              id="version-switch"
              checked={useV2}
              onCheckedChange={setUseV2}
            />
          </div>

          {/* Toggle comparação */}
          <Button
            variant="outline"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? 'Ocultar' : 'Mostrar'} Comparação
          </Button>
        </div>
      </div>

      {/* Alertas e Status */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status da versão */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Usando Dashboard <strong>{useV2 ? 'V2' : 'V1'}</strong> - 
            {useV2 ? ' Com Cache Unificado, Sincronização Cross-Tab e Suporte Offline' : ' Versão Original com React Query'}
          </AlertDescription>
        </Alert>

        {/* Status de conexão */}
        <Alert variant={currentVersion.isOnline ? "default" : "destructive"}>
          {currentVersion.isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription>
            {currentVersion.isOnline ? 'Conectado' : 'Offline'} - 
            {useV2 && !currentVersion.isOnline && ' Usando dados do cache offline'}
          </AlertDescription>
        </Alert>
      </div>

      {/* Comparação de Performance */}
      {showComparison && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Performance</CardTitle>
            <CardDescription>
              Métricas comparativas entre V1 e V2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {/* Hit Rate (V2 only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hit Rate</span>
                  <Badge variant={useV2 ? "default" : "secondary"}>
                    {useV2 ? `${v2.cacheMetrics.hitRate.toFixed(1)}%` : 'N/A'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Taxa de acerto do cache
                </div>
              </div>

              {/* Cache Size (V2 only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache Size</span>
                  <Badge variant={useV2 ? "default" : "secondary"}>
                    {useV2 ? formatBytes(v2.cacheMetrics.size) : 'N/A'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tamanho total do cache
                </div>
              </div>

              {/* Offline Queue (V2 only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fila Offline</span>
                  <Badge variant={useV2 && v2.cacheMetrics.offlineQueueSize > 0 ? "destructive" : "secondary"}>
                    {useV2 ? v2.cacheMetrics.offlineQueueSize : 'N/A'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Operações pendentes
                </div>
              </div>

              {/* Last Update */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Atualização</span>
                  <Badge variant="outline">
                    {currentVersion.lastUpdated 
                      ? new Date(currentVersion.lastUpdated).toLocaleTimeString('pt-BR')
                      : 'Nunca'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Dados atualizados
                </div>
              </div>
            </div>

            {/* Comparação direta V1 vs V2 */}
            {useV2 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium mb-4">Benefícios do Cache Unificado (V2)</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Redução de requisições ao servidor em {v2.cacheMetrics.hitRate.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Sincronização automática entre abas do navegador</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Funciona offline com dados em cache</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Compressão automática de dados históricos</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        {/* Tab Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Controles de período */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label>Período dos gráficos:</Label>
              <select 
                value={chartPeriod} 
                onChange={(e) => setChartPeriod(e.target.value)}
                className="rounded-md border px-3 py-1"
              >
                <option value="7days">7 dias</option>
                <option value="30days">30 dias</option>
                <option value="3months">3 meses</option>
                <option value="6months">6 meses</option>
                <option value="1year">1 ano</option>
              </select>
            </div>

            <Button
              variant="outline"
              onClick={() => currentVersion.refetchAll()}
              disabled={currentVersion.isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${currentVersion.isLoading ? 'animate-spin' : ''}`} />
              Atualizar Tudo
            </Button>
          </div>

          {/* Métricas principais - comentado temporariamente para build */}
          {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {currentVersion.stats && (
              <>
                <MetricCard
                  title="Total de Imóveis"
                  value={currentVersion.stats.totalProperties.value}
                  change={currentVersion.stats.totalProperties.change}
                  trend={currentVersion.stats.totalProperties.trend}
                  icon={currentVersion.isLoadingStats ? RefreshCw : undefined}
                />
                <MetricCard
                  title="Clientes Ativos"
                  value={currentVersion.stats.activeClients.value}
                  change={currentVersion.stats.activeClients.change}
                  trend={currentVersion.stats.activeClients.trend}
                  icon={currentVersion.isLoadingStats ? RefreshCw : undefined}
                />
                <MetricCard
                  title="Visitas da Semana"
                  value={currentVersion.stats.weeklyAppointments.value}
                  change={currentVersion.stats.weeklyAppointments.change}
                  trend={currentVersion.stats.weeklyAppointments.trend}
                  icon={currentVersion.isLoadingStats ? RefreshCw : undefined}
                />
                <MetricCard
                  title="Receita Mensal"
                  value={currentVersion.stats.monthlyRevenue.formatted}
                  change={currentVersion.stats.monthlyRevenue.change}
                  trend={currentVersion.stats.monthlyRevenue.trend}
                  icon={currentVersion.isLoadingStats ? RefreshCw : undefined}
                />
              </>
            )}
          </div> */}

          {/* Gráficos e atividades */}
          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Vendas e Propriedades</CardTitle>
                <CardDescription>
                  Evolução no período de {chartPeriod}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Comentado temporariamente para build */}
                {/* {currentVersion.chartData ? (
                  <SalesChart data={currentVersion.chartData} />
                ) : ( */}
                  <div className="h-[300px] flex items-center justify-center">
                    {currentVersion.isLoadingCharts ? (
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-muted-foreground">Componente temporariamente desabilitado para build</span>
                    )}
                  </div>
                {/* )} */}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Últimas ações no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Comentado temporariamente para build */}
                {/* {currentVersion.activities ? (
                  <ActivityFeed activities={currentVersion.activities} />
                ) : ( */}
                  <div className="h-[300px] flex items-center justify-center">
                    {currentVersion.isLoadingActivities ? (
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-muted-foreground">Componente temporariamente desabilitado para build</span>
                    )}
                  </div>
                {/* )} */}
              </CardContent>
            </Card>
          </div>

          {/* Erros */}
          {currentVersion.hasError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar dados: 
                {currentVersion.statsError?.message || 
                 currentVersion.chartsError?.message || 
                 currentVersion.activitiesError?.message}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab Métricas */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Loading States */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estados de Carregamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Estatísticas</span>
                  <Badge variant={currentVersion.isLoadingStats ? "default" : "secondary"}>
                    {currentVersion.isLoadingStats ? 'Carregando' : 'Pronto'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gráficos</span>
                  <Badge variant={currentVersion.isLoadingCharts ? "default" : "secondary"}>
                    {currentVersion.isLoadingCharts ? 'Carregando' : 'Pronto'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Atividades</span>
                  <Badge variant={currentVersion.isLoadingActivities ? "default" : "secondary"}>
                    {currentVersion.isLoadingActivities ? 'Carregando' : 'Pronto'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* V2 Cache Metrics */}
            {useV2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Métricas do Cache</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Acerto</span>
                    <span className="text-sm font-medium">{v2.cacheMetrics.hitRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tamanho</span>
                    <span className="text-sm font-medium">{formatBytes(v2.cacheMetrics.size)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fila Offline</span>
                    <span className="text-sm font-medium">{v2.cacheMetrics.offlineQueueSize} ops</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status da Conexão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={currentVersion.isOnline ? "default" : "destructive"}>
                    {currentVersion.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Última Sync</span>
                  <span className="text-sm font-medium">
                    {currentVersion.lastUpdated 
                      ? new Date(currentVersion.lastUpdated).toLocaleTimeString('pt-BR')
                      : 'N/A'}
                  </span>
                </div>
                {useV2 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Modo</span>
                    <span className="text-sm font-medium">
                      {v2.isOffline ? 'Cache Offline' : 'Tempo Real'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Debug */}
        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Informações técnicas para desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify({
                  version: useV2 ? 'V2 (Cache Unificado)' : 'V1 (Original)',
                  isOnline: currentVersion.isOnline,
                  isOffline: useV2 ? v2.isOffline : !currentVersion.isOnline,
                  lastUpdated: currentVersion.lastUpdated,
                  chartPeriod,
                  loadingStates: {
                    stats: currentVersion.isLoadingStats,
                    charts: currentVersion.isLoadingCharts,
                    activities: currentVersion.isLoadingActivities,
                    overall: currentVersion.isLoading
                  },
                  errors: {
                    stats: currentVersion.statsError?.message || null,
                    charts: currentVersion.chartsError?.message || null,
                    activities: currentVersion.activitiesError?.message || null,
                    hasError: currentVersion.hasError
                  },
                  ...(useV2 && {
                    cacheMetrics: v2.cacheMetrics,
                    features: {
                      offlineSupport: true,
                      crossTabSync: true,
                      compression: true,
                      encryption: false,
                      strategies: ['CRITICAL', 'STATIC', 'REALTIME', 'HISTORICAL']
                    }
                  })
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}