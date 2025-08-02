import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  Activity,
  Database,
  Wifi,
  WifiOff,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  Users,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Eye,
  Settings
} from 'lucide-react'
import { 
  useCacheMonitoring, 
  useCacheAlerts, 
  useCacheSyncStatus,
  useCachePatterns 
} from '@/hooks/cache/useCacheMonitoring'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Cores para gráficos
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#6366F1'
}

const PIE_COLORS = [COLORS.success, COLORS.error, COLORS.warning, COLORS.info]

interface CacheMonitorProps {
  className?: string
  defaultTab?: 'overview' | 'patterns' | 'sync' | 'performance'
}

export function CacheMonitor({ className, defaultTab = 'overview' }: CacheMonitorProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const {
    metrics,
    patterns,
    syncStatus,
    isLoading,
    error,
    lastUpdated,
    refreshMetrics,
    generateReport,
    resetAnalytics,
    exportData
  } = useCacheMonitoring()

  const { alerts, clearAlerts } = useCacheAlerts()
  const topPatterns = useCachePatterns(10)

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cache-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getHealthStatus = () => {
    if (metrics.hitRate >= 80) return { status: 'excellent', color: COLORS.success, icon: CheckCircle }
    if (metrics.hitRate >= 60) return { status: 'good', color: COLORS.warning, icon: Activity }
    if (metrics.hitRate >= 40) return { status: 'fair', color: COLORS.warning, icon: AlertTriangle }
    return { status: 'poor', color: COLORS.error, icon: XCircle }
  }

  const health = getHealthStatus()

  // Dados para gráficos
  const hitMissData = [
    { name: 'Hits', value: metrics.hitCount, color: COLORS.success },
    { name: 'Misses', value: metrics.missCount, color: COLORS.error }
  ]

  const patternCategoryData = [
    { 
      name: 'Hot', 
      value: patterns.filter(p => p.category === 'hot').length,
      color: COLORS.error 
    },
    { 
      name: 'Warm', 
      value: patterns.filter(p => p.category === 'warm').length,
      color: COLORS.warning 
    },
    { 
      name: 'Cold', 
      value: patterns.filter(p => p.category === 'cold').length,
      color: COLORS.info 
    }
  ]

  const performanceData = topPatterns.slice(0, 8).map(pattern => ({
    key: pattern.key.length > 20 ? pattern.key.substring(0, 20) + '...' : pattern.key,
    hitRate: pattern.hitRate,
    responseTime: pattern.averageResponseTime,
    accessCount: pattern.accessCount
  }))

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header com resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Hit</p>
                <p className="text-2xl font-bold" style={{ color: health.color }}>
                  {metrics.hitRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: `${health.color}20` }}>
                <health.icon className="h-5 w-5" style={{ color: health.color }} />
              </div>
            </div>
            <Progress value={metrics.hitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requisições Total</p>
                <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.hitCount} hits • {metrics.missCount} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{Math.round(metrics.avgResponseTime)}ms</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-1">
              {metrics.avgResponseTime <= 1000 ? (
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              )}
              <p className="text-xs text-muted-foreground">
                {metrics.avgResponseTime <= 1000 ? 'Excelente' : 'Atenção necessária'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center mt-1">
                  {syncStatus.isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-600">Offline</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {syncStatus.tabsConnected} tab{syncStatus.tabsConnected !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {syncStatus.pendingOperations} pendentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                Alertas ({alerts.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAlerts}>
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, index) => (
                <Alert key={index} className="py-2">
                  <AlertDescription className="text-sm">
                    <div className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isLoading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={resetAnalytics} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}
          </p>
        )}
      </div>

      {/* Conteúdo principal em tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Padrões
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico Hit/Miss */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hit vs Miss Rate</CardTitle>
                <CardDescription>
                  Distribuição de hits e misses do cache
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={hitMissData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {hitMissData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value.toLocaleString(), '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Estatísticas detalhadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas Detalhadas</CardTitle>
                <CardDescription>
                  Métricas detalhadas do cache
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Memória</span>
                      <span className="text-sm">{formatBytes(metrics.memoryUsage)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Evicções</span>
                      <span className="text-sm">{metrics.evictionCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Erros</span>
                      <span className="text-sm text-red-600">{metrics.errorCount}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Chaves</span>
                      <span className="text-sm">{patterns.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taxa Miss</span>
                      <span className="text-sm">{metrics.missRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Criado</span>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(metrics.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribuição por categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Padrões por Categoria</CardTitle>
                <CardDescription>
                  Classificação de chaves por padrão de acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={patternCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista de padrões */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Padrões</CardTitle>
                <CardDescription>
                  Chaves mais acessadas no cache
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {topPatterns.map((pattern, index) => (
                      <div key={pattern.key} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            #{index + 1} {pattern.key}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={
                              pattern.category === 'hot' ? 'destructive' :
                              pattern.category === 'warm' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {pattern.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {pattern.accessCount} acessos
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {pattern.hitRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(pattern.averageResponseTime)}ms
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status de sincronização */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status de Sincronização</CardTitle>
                <CardDescription>
                  Estado atual da sincronização entre tabs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center">
                    {syncStatus.isOnline ? (
                      <Wifi className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <p className="font-medium">Conectividade</p>
                      <p className="text-sm text-muted-foreground">
                        {syncStatus.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
                    {syncStatus.isOnline ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium">Tabs Conectadas</p>
                      <p className="text-sm text-muted-foreground">
                        {syncStatus.tabsConnected} aba{syncStatus.tabsConnected !== 1 ? 's' : ''} ativa{syncStatus.tabsConnected !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {syncStatus.tabsConnected}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-purple-500 mr-3" />
                    <div>
                      <p className="font-medium">Operações Pendentes</p>
                      <p className="text-sm text-muted-foreground">
                        Na fila offline
                      </p>
                    </div>
                  </div>
                  <Badge variant={syncStatus.pendingOperations > 0 ? 'destructive' : 'secondary'}>
                    {syncStatus.pendingOperations}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de sincronização */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico</CardTitle>
                <CardDescription>
                  Últimas atividades de sincronização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Última sincronização</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {syncStatus.lastSync ? 
                        formatDistanceToNow(syncStatus.lastSync, { addSuffix: true, locale: ptBR }) :
                        'Nunca'
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm">Erros de sincronização</span>
                    </div>
                    <Badge variant={syncStatus.syncErrors > 0 ? 'destructive' : 'secondary'}>
                      {syncStatus.syncErrors}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm">Broadcast Channel</span>
                    </div>
                    <Badge variant={syncStatus.broadcastChannelActive ? 'default' : 'destructive'}>
                      {syncStatus.broadcastChannelActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance por Chave</CardTitle>
              <CardDescription>
                Análise de performance das principais chaves do cache
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="key" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'hitRate') return [`${Number(value).toFixed(1)}%`, 'Taxa de Hit']
                      if (name === 'responseTime') return [`${Number(value).toFixed(0)}ms`, 'Tempo de Resposta']
                      if (name === 'accessCount') return [value, 'Acessos']
                      return [value, name]
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hitRate" fill={COLORS.success} name="Taxa de Hit (%)" />
                  <Bar yAxisId="right" dataKey="responseTime" fill={COLORS.warning} name="Tempo de Resposta (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}