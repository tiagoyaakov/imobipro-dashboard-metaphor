import { useState, useEffect, useCallback } from 'react'
import { CacheAnalytics, type CacheMetrics, type CachePattern, type SyncStatus, type PerformanceReport } from '@/services/cache/CacheAnalytics'
import { useEventBus } from '@/lib/event-bus'

interface CacheMonitoringState {
  metrics: CacheMetrics
  patterns: CachePattern[]
  syncStatus: SyncStatus
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface CacheMonitoringActions {
  refreshMetrics: () => void
  generateReport: (period?: string) => PerformanceReport
  resetAnalytics: () => void
  exportData: () => string
}

export function useCacheMonitoring(): CacheMonitoringState & CacheMonitoringActions {
  const [state, setState] = useState<CacheMonitoringState>({
    metrics: CacheAnalytics.getMetrics(),
    patterns: CacheAnalytics.getPatterns(),
    syncStatus: CacheAnalytics.getSyncStatus(),
    isLoading: false,
    error: null,
    lastUpdated: null
  })

  // Atualizar métricas quando houver mudanças
  useEventBus('cache.metrics.updated', (newMetrics: CacheMetrics) => {
    setState(prev => ({
      ...prev,
      metrics: newMetrics,
      lastUpdated: new Date(),
      error: null
    }))
  })

  // Escutar análises completas
  useEventBus('cache.analysis.completed', (analysisData) => {
    setState(prev => ({
      ...prev,
      patterns: analysisData.patterns,
      lastUpdated: new Date()
    }))
  })

  // Escutar erros de cache
  useEventBus('cache.error.recorded', (errorData) => {
    setState(prev => ({
      ...prev,
      error: `Erro no cache: ${errorData.error}`,
      lastUpdated: new Date()
    }))
  })

  // Atualizar status de sincronização periodicamente
  useEffect(() => {
    const updateSyncStatus = () => {
      setState(prev => ({
        ...prev,
        syncStatus: CacheAnalytics.getSyncStatus()
      }))
    }

    // Atualizar imediatamente
    updateSyncStatus()

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateSyncStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  // Atualizar padrões periodicamente
  useEffect(() => {
    const updatePatterns = () => {
      setState(prev => ({
        ...prev,
        patterns: CacheAnalytics.getPatterns()
      }))
    }

    // Atualizar a cada 30 segundos
    const interval = setInterval(updatePatterns, 30000)

    return () => clearInterval(interval)
  }, [])

  const refreshMetrics = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const newMetrics = CacheAnalytics.getMetrics()
      const newPatterns = CacheAnalytics.getPatterns()
      const newSyncStatus = CacheAnalytics.getSyncStatus()

      setState(prev => ({
        ...prev,
        metrics: newMetrics,
        patterns: newPatterns,
        syncStatus: newSyncStatus,
        isLoading: false,
        lastUpdated: new Date()
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar métricas'
      }))
    }
  }, [])

  const generateReport = useCallback((period = '24h'): PerformanceReport => {
    return CacheAnalytics.generateReport(period)
  }, [])

  const resetAnalytics = useCallback(() => {
    CacheAnalytics.reset()
    setState(prev => ({
      ...prev,
      metrics: CacheAnalytics.getMetrics(),
      patterns: [],
      error: null,
      lastUpdated: new Date()
    }))
  }, [])

  const exportData = useCallback((): string => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics: state.metrics,
      patterns: state.patterns,
      syncStatus: state.syncStatus,
      recentOperations: CacheAnalytics.getRecentOperations(100),
      report: generateReport()
    }

    return JSON.stringify(exportData, null, 2)
  }, [state, generateReport])

  return {
    ...state,
    refreshMetrics,
    generateReport,
    resetAnalytics,
    exportData
  }
}

// Hook específico para métricas em tempo real
export function useCacheMetricsRealtime() {
  const [metrics, setMetrics] = useState<CacheMetrics>(CacheAnalytics.getMetrics())

  useEventBus('cache.metrics.updated', (newMetrics: CacheMetrics) => {
    setMetrics(newMetrics)
  })

  return metrics
}

// Hook para padrões de cache
export function useCachePatterns(limit = 10) {
  const [patterns, setPatterns] = useState<CachePattern[]>([])

  useEffect(() => {
    const updatePatterns = () => {
      setPatterns(CacheAnalytics.getPatterns().slice(0, limit))
    }

    updatePatterns()
    const interval = setInterval(updatePatterns, 10000) // Atualizar a cada 10s

    return () => clearInterval(interval)
  }, [limit])

  useEventBus('cache.analysis.completed', (analysisData) => {
    setPatterns(analysisData.patterns.slice(0, limit))
  })

  return patterns
}

// Hook para status de sincronização
export function useCacheSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(CacheAnalytics.getSyncStatus())

  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(CacheAnalytics.getSyncStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 2000) // Atualizar a cada 2s

    // Escutar mudanças de conectividade
    const handleOnline = () => updateStatus()
    const handleOffline = () => updateStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return syncStatus
}

// Hook para alertas de performance
export function useCacheAlerts() {
  const [alerts, setAlerts] = useState<Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: Date
  }>>([])

  useEventBus('cache.analysis.completed', (analysisData) => {
    const newAlerts = []

    // Alertas baseados em issues
    analysisData.issues.forEach((issue: string) => {
      newAlerts.push({
        type: 'warning' as const,
        message: issue,
        timestamp: new Date()
      })
    })

    // Alertas baseados em métricas
    if (analysisData.metrics.hitRate < 30) {
      newAlerts.push({
        type: 'error' as const,
        message: 'Taxa de hit crítica: considere revisar a estratégia de cache',
        timestamp: new Date()
      })
    }

    if (analysisData.metrics.avgResponseTime > 3000) {
      newAlerts.push({
        type: 'error' as const,
        message: 'Tempo de resposta muito alto: possível problema de performance',
        timestamp: new Date()
      })
    }

    // Manter apenas os últimos 10 alertas
    setAlerts(prev => [...newAlerts, ...prev].slice(0, 10))
  })

  useEventBus('cache.error.recorded', (errorData) => {
    setAlerts(prev => [{
      type: 'error' as const,
      message: `Erro de cache: ${errorData.error}`,
      timestamp: new Date()
    }, ...prev].slice(0, 10))
  })

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  return { alerts, clearAlerts }
}