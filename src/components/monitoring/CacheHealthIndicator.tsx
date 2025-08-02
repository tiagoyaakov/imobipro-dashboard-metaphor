import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  Clock,
  Database
} from 'lucide-react'
import { useCacheMetricsRealtime, useCacheSyncStatus, useCacheAlerts } from '@/hooks/cache'

interface CacheHealthIndicatorProps {
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
}

export function CacheHealthIndicator({ 
  size = 'md', 
  showDetails = false,
  className = '' 
}: CacheHealthIndicatorProps) {
  const metrics = useCacheMetricsRealtime()
  const syncStatus = useCacheSyncStatus()
  const { alerts } = useCacheAlerts()

  // Determinar status geral de saúde
  const getHealthStatus = () => {
    if (alerts.filter(a => a.type === 'error').length > 0) {
      return { 
        status: 'critical', 
        color: 'destructive', 
        icon: XCircle, 
        label: 'Crítico' 
      }
    }
    
    if (metrics.hitRate < 40 || metrics.avgResponseTime > 2000) {
      return { 
        status: 'warning', 
        color: 'secondary', 
        icon: AlertTriangle, 
        label: 'Atenção' 
      }
    }
    
    if (metrics.hitRate >= 80 && metrics.avgResponseTime < 1000) {
      return { 
        status: 'excellent', 
        color: 'default', 
        icon: CheckCircle, 
        label: 'Excelente' 
      }
    }
    
    return { 
      status: 'good', 
      color: 'secondary', 
      icon: Activity, 
      label: 'Bom' 
    }
  }

  const health = getHealthStatus()
  const HealthIcon = health.icon

  // Determinar tamanhos baseado na prop
  const sizes = {
    sm: { icon: 'h-3 w-3', text: 'text-xs' },
    md: { icon: 'h-4 w-4', text: 'text-sm' },
    lg: { icon: 'h-5 w-5', text: 'text-base' }
  }

  const currentSize = sizes[size]

  const tooltipContent = (
    <div className="space-y-2 p-2 max-w-xs">
      <div className="font-medium">Status do Cache</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Hit Rate:</span>
          <span className="ml-1 font-medium">{metrics.hitRate.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Tempo Médio:</span>
          <span className="ml-1 font-medium">{Math.round(metrics.avgResponseTime)}ms</span>
        </div>
        <div>
          <span className="text-muted-foreground">Requisições:</span>
          <span className="ml-1 font-medium">{metrics.totalRequests}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Sync:</span>
          <span className="ml-1 font-medium">
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      {alerts.length > 0 && (
        <div className="border-t pt-2">
          <div className="text-xs text-muted-foreground mb-1">
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}:
          </div>
          <div className="space-y-1">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="text-xs text-red-600">
                • {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-1 ${className}`}
            >
              <HealthIcon className={currentSize.icon} />
              <Badge variant={health.color as any} className={currentSize.text}>
                {health.label}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={`flex items-center space-x-4 p-3 rounded-lg border ${className}`}>
      <div className="flex items-center space-x-2">
        <HealthIcon className={`${currentSize.icon} text-${health.status === 'critical' ? 'red' : 
          health.status === 'warning' ? 'yellow' : 'green'}-500`} />
        <span className={`font-medium ${currentSize.text}`}>{health.label}</span>
      </div>

      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <Zap className="h-3 w-3 text-blue-500" />
          <span>{metrics.hitRate.toFixed(1)}%</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-purple-500" />
          <span>{Math.round(metrics.avgResponseTime)}ms</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Database className="h-3 w-3 text-green-500" />
          <span>{metrics.totalRequests}</span>
        </div>

        {!syncStatus.isOnline && (
          <Badge variant="destructive" className="text-xs">
            Offline
          </Badge>
        )}

        {alerts.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  )
}

// Hook para usar o indicador de saúde em outros componentes
export function useCacheHealth() {
  const metrics = useCacheMetricsRealtime()
  const syncStatus = useCacheSyncStatus()
  const { alerts } = useCacheAlerts()

  const status = React.useMemo(() => {
    if (alerts.filter(a => a.type === 'error').length > 0) {
      return 'critical'
    }
    
    if (metrics.hitRate < 40 || metrics.avgResponseTime > 2000) {
      return 'warning'
    }
    
    if (metrics.hitRate >= 80 && metrics.avgResponseTime < 1000) {
      return 'excellent'
    }
    
    return 'good'
  }, [metrics, alerts])

  return {
    status,
    metrics,
    syncStatus,
    alerts: alerts.length,
    isHealthy: status === 'excellent' || status === 'good',
    needsAttention: status === 'warning' || status === 'critical'
  }
}