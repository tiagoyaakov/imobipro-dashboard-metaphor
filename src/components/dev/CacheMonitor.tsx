/**
 * Monitor de Cache para Desenvolvimento
 * Exibe estatísticas e estado do cache em tempo real
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  BarChart3, 
  Database, 
  RefreshCw, 
  Trash2, 
  ChevronDown,
  Activity,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useCacheMonitor, useCacheManager } from '@/hooks/useUnifiedCache'
import { QUERY_KEYS } from '@/lib/cache-manager'
import { cn } from '@/lib/utils'

export function CacheMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { stats, logState, isHealthy } = useCacheMonitor()
  const cacheManager = useCacheManager()
  
  // Auto refresh a cada 2 segundos
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      // Força re-render para atualizar stats
      setIsOpen(prev => prev)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])
  
  // Só mostrar em desenvolvimento
  if (import.meta.env.PROD) return null
  
  const cacheUsagePercent = stats.totalQueries > 0 
    ? Math.round((stats.activeQueries / stats.totalQueries) * 100)
    : 0
    
  const stalePercent = stats.totalQueries > 0
    ? Math.round((stats.staleQueries / stats.totalQueries) * 100)
    : 0
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="shadow-lg border-2">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Cache Monitor
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isHealthy ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {isHealthy ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {isHealthy ? 'Healthy' : 'Issues'}
                </Badge>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-180"
                )} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Estatísticas Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Queries</p>
                  <p className="text-2xl font-bold">{stats.totalQueries}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Active Queries</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {stats.activeQueries}
                    {stats.activeQueries > 0 && (
                      <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                    )}
                  </p>
                </div>
              </div>
              
              {/* Barras de Progresso */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Cache Usage</span>
                    <span>{cacheUsagePercent}%</span>
                  </div>
                  <Progress value={cacheUsagePercent} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-yellow-600">Stale Queries</span>
                    <span>{stalePercent}%</span>
                  </div>
                  <Progress 
                    value={stalePercent} 
                    className="h-2"
                    // @ts-ignore - custom color
                    indicatorClassName="bg-yellow-500"
                  />
                </div>
              </div>
              
              {/* Informações Detalhadas */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stale Queries:</span>
                  <span className="font-medium">{stats.staleQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cache Size:</span>
                  <span className="font-medium">
                    {(stats.cacheSize / 1024).toFixed(2)} KB
                  </span>
                </div>
              </div>
              
              {/* Módulos Ativos */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Active Modules:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(QUERY_KEYS).map(module => (
                    <Badge key={module} variant="outline" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cacheManager.refreshAllQueries()}
                  className="flex-1"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh All
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logState()}
                  className="flex-1"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Log State
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Clear all cache?')) {
                      cacheManager.clearAllCache()
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Auto Refresh Toggle */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Auto Refresh</span>
                <Button
                  size="sm"
                  variant={autoRefresh ? "default" : "outline"}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="h-6 px-2 text-xs"
                >
                  {autoRefresh ? 'ON' : 'OFF'}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}