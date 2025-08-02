import { EventBus } from '@/lib/event-bus'
import { getUnifiedCache } from '@/lib/cache/UnifiedCache'
import type { CacheMetrics as BaseCacheMetrics } from '@/lib/cache/types'

// Tipos para métricas de cache
export interface CacheMetrics {
  hitCount: number
  missCount: number
  hitRate: number
  missRate: number
  totalRequests: number
  cacheSize: number
  memoryUsage: number
  avgResponseTime: number
  errorCount: number
  evictionCount: number
  lastCleared: Date | null
  createdAt: Date
}

export interface CacheOperation {
  operation: 'get' | 'set' | 'delete' | 'clear' | 'evict'
  key: string
  hit: boolean
  responseTime: number
  size?: number
  timestamp: Date
  error?: string
}

export interface CachePattern {
  key: string
  accessCount: number
  lastAccessed: Date
  averageResponseTime: number
  hitRate: number
  category: 'hot' | 'warm' | 'cold'
}

export interface SyncStatus {
  isOnline: boolean
  lastSync: Date | null
  pendingOperations: number
  syncErrors: number
  tabsConnected: number
  broadcastChannelActive: boolean
}

export interface CacheOptimization {
  type: 'increase_ttl' | 'decrease_ttl' | 'remove_unused' | 'preload'
  key: string
  reason: string
  impact: 'high' | 'medium' | 'low'
}

export interface PerformanceReport {
  period: string
  metrics: CacheMetrics
  topPatterns: CachePattern[]
  optimizations: CacheOptimization[]
  issues: string[]
  recommendations: string[]
}

class CacheAnalyticsService {
  private operations: CacheOperation[] = []
  private patterns: Map<string, CachePattern> = new Map()
  private metrics: CacheMetrics
  private maxOperationsHistory = 1000
  private analysisInterval: NodeJS.Timeout | null = null

  constructor() {
    this.metrics = this.initializeMetrics()
    this.startAnalysis()
    this.setupEventListeners()
  }

  private initializeMetrics(): CacheMetrics {
    return {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      memoryUsage: 0,
      avgResponseTime: 0,
      errorCount: 0,
      evictionCount: 0,
      lastCleared: null,
      createdAt: new Date()
    }
  }

  private setupEventListeners() {
    // Escutar eventos de cache do EventBus
    EventBus.on('cache.get', (data) => this.recordOperation('get', data))
    EventBus.on('cache.set', (data) => this.recordOperation('set', data))
    EventBus.on('cache.delete', (data) => this.recordOperation('delete', data))
    EventBus.on('cache.clear', (data) => this.recordOperation('clear', data))
    EventBus.on('cache.evict', (data) => this.recordOperation('evict', data))
    EventBus.on('cache.error', (data) => this.recordError(data))
  }

  private recordOperation(
    operation: CacheOperation['operation'], 
    data: {
      key: string
      hit?: boolean
      responseTime: number
      size?: number
      error?: string
    }
  ) {
    const operationRecord: CacheOperation = {
      operation,
      key: data.key,
      hit: data.hit ?? false,
      responseTime: data.responseTime,
      size: data.size,
      timestamp: new Date(),
      error: data.error
    }

    // Adicionar à lista de operações
    this.operations.push(operationRecord)
    if (this.operations.length > this.maxOperationsHistory) {
      this.operations.shift()
    }

    // Atualizar métricas
    this.updateMetrics(operationRecord)

    // Atualizar padrões
    this.updatePatterns(operationRecord)

    // Emitir evento de métrica atualizada
    EventBus.emit('cache.metrics.updated', this.metrics)
  }

  private recordError(data: { key: string; error: string }) {
    this.metrics.errorCount++
    EventBus.emit('cache.error.recorded', data)
  }

  private updateMetrics(operation: CacheOperation) {
    this.metrics.totalRequests++

    if (operation.operation === 'get') {
      if (operation.hit) {
        this.metrics.hitCount++
      } else {
        this.metrics.missCount++
      }
    }

    if (operation.operation === 'evict') {
      this.metrics.evictionCount++
    }

    if (operation.operation === 'clear') {
      this.metrics.lastCleared = new Date()
    }

    // Calcular taxas
    const totalCacheRequests = this.metrics.hitCount + this.metrics.missCount
    if (totalCacheRequests > 0) {
      this.metrics.hitRate = (this.metrics.hitCount / totalCacheRequests) * 100
      this.metrics.missRate = (this.metrics.missCount / totalCacheRequests) * 100
    }

    // Calcular tempo médio de resposta
    const recentOperations = this.operations.slice(-100)
    const totalTime = recentOperations.reduce((sum, op) => sum + op.responseTime, 0)
    this.metrics.avgResponseTime = totalTime / recentOperations.length

    // Tentar obter métricas reais do cache
    try {
      const cache = getUnifiedCache()
      const realMetrics = cache.getMetrics()
      
      // Mesclar com métricas reais
      this.metrics.cacheSize = realMetrics.size || this.patterns.size
      this.metrics.memoryUsage = realMetrics.size || this.estimateMemoryUsage()
      
      // Usar métricas reais se disponíveis
      if (realMetrics.hits > 0 || realMetrics.misses > 0) {
        this.metrics.hitCount = realMetrics.hits
        this.metrics.missCount = realMetrics.misses
        this.metrics.hitRate = realMetrics.hitRate
        this.metrics.evictionCount = realMetrics.evictions
      }
    } catch (error) {
      // Usar estimativas
      this.metrics.memoryUsage = this.estimateMemoryUsage()
    }
  }

  private updatePatterns(operation: CacheOperation) {
    const pattern = this.patterns.get(operation.key) || {
      key: operation.key,
      accessCount: 0,
      lastAccessed: new Date(),
      averageResponseTime: 0,
      hitRate: 0,
      category: 'cold' as const
    }

    pattern.accessCount++
    pattern.lastAccessed = operation.timestamp

    // Calcular tempo médio de resposta para esta chave
    const keyOperations = this.operations.filter(op => op.key === operation.key)
    const totalTime = keyOperations.reduce((sum, op) => sum + op.responseTime, 0)
    pattern.averageResponseTime = totalTime / keyOperations.length

    // Calcular hit rate para esta chave
    const keyGets = keyOperations.filter(op => op.operation === 'get')
    const keyHits = keyGets.filter(op => op.hit)
    pattern.hitRate = keyGets.length > 0 ? (keyHits.length / keyGets.length) * 100 : 0

    // Classificar categoria baseada no padrão de acesso
    pattern.category = this.classifyPattern(pattern)

    this.patterns.set(operation.key, pattern)
  }

  private classifyPattern(pattern: CachePattern): 'hot' | 'warm' | 'cold' {
    const now = new Date()
    const hoursSinceLastAccess = (now.getTime() - pattern.lastAccessed.getTime()) / (1000 * 60 * 60)
    
    if (pattern.accessCount >= 10 && hoursSinceLastAccess < 1) {
      return 'hot'
    } else if (pattern.accessCount >= 5 && hoursSinceLastAccess < 24) {
      return 'warm'
    } else {
      return 'cold'
    }
  }

  private estimateMemoryUsage(): number {
    // Estimativa aproximada baseada no número de operações e tamanhos
    const baseSize = this.operations.length * 200 // bytes aproximados por operação
    const patternsSize = this.patterns.size * 100 // bytes aproximados por padrão
    return baseSize + patternsSize
  }

  private startAnalysis() {
    // Análise periódica a cada 5 minutos
    this.analysisInterval = setInterval(() => {
      this.performAnalysis()
    }, 5 * 60 * 1000)
  }

  private performAnalysis() {
    const optimizations = this.generateOptimizations()
    const issues = this.detectIssues()

    EventBus.emit('cache.analysis.completed', {
      optimizations,
      issues,
      metrics: this.metrics,
      patterns: Array.from(this.patterns.values())
    })
  }

  private generateOptimizations(): CacheOptimization[] {
    const optimizations: CacheOptimization[] = []

    // Analisar padrões para sugerir otimizações
    this.patterns.forEach(pattern => {
      // Chaves com alto hit rate - aumentar TTL
      if (pattern.hitRate > 90 && pattern.category === 'hot') {
        optimizations.push({
          type: 'increase_ttl',
          key: pattern.key,
          reason: `Alta taxa de hit (${pattern.hitRate.toFixed(1)}%) e acesso frequente`,
          impact: 'high'
        })
      }

      // Chaves frias com baixo hit rate - considerar remoção
      if (pattern.hitRate < 30 && pattern.category === 'cold') {
        optimizations.push({
          type: 'remove_unused',
          key: pattern.key,
          reason: `Baixa taxa de hit (${pattern.hitRate.toFixed(1)}%) e pouco acesso`,
          impact: 'medium'
        })
      }

      // Chaves com alto tempo de resposta - preload
      if (pattern.averageResponseTime > 1000 && pattern.category === 'warm') {
        optimizations.push({
          type: 'preload',
          key: pattern.key,
          reason: `Alto tempo de resposta (${pattern.averageResponseTime.toFixed(0)}ms)`,
          impact: 'medium'
        })
      }
    })

    return optimizations.slice(0, 10) // Limitar a 10 sugestões
  }

  private detectIssues(): string[] {
    const issues: string[] = []

    // Taxa de hit muito baixa
    if (this.metrics.hitRate < 50 && this.metrics.totalRequests > 100) {
      issues.push(`Taxa de hit baixa: ${this.metrics.hitRate.toFixed(1)}%`)
    }

    // Muitos erros
    if (this.metrics.errorCount > this.metrics.totalRequests * 0.1) {
      issues.push(`Alta taxa de erro: ${this.metrics.errorCount} erros em ${this.metrics.totalRequests} requisições`)
    }

    // Tempo de resposta alto
    if (this.metrics.avgResponseTime > 2000) {
      issues.push(`Tempo de resposta alto: ${this.metrics.avgResponseTime.toFixed(0)}ms`)
    }

    // Muitas evicções
    if (this.metrics.evictionCount > this.metrics.totalRequests * 0.2) {
      issues.push(`Muitas evicções: ${this.metrics.evictionCount}`)
    }

    return issues
  }

  // Métodos públicos
  public getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  public getPatterns(): CachePattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.accessCount - a.accessCount)
  }

  public getRecentOperations(limit = 50): CacheOperation[] {
    return this.operations.slice(-limit)
  }

  public getSyncStatus(): SyncStatus {
    try {
      const cache = getUnifiedCache()
      const stats = cache.getStats()
      
      return {
        isOnline: navigator.onLine,
        lastSync: stats.sync.lastSync ? new Date(stats.sync.lastSync) : null,
        pendingOperations: stats.offline.queueSize,
        syncErrors: stats.sync.failed,
        tabsConnected: 1, // Seria obtido do BroadcastChannel
        broadcastChannelActive: true
      }
    } catch (error) {
      return {
        isOnline: navigator.onLine,
        lastSync: null,
        pendingOperations: 0,
        syncErrors: 0,
        tabsConnected: 1,
        broadcastChannelActive: true
      }
    }
  }

  public generateReport(period = '24h'): PerformanceReport {
    const now = new Date()
    const startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)) // 24h atrás

    const periodOperations = this.operations.filter(
      op => op.timestamp >= startTime
    )

    const topPatterns = this.getPatterns()
      .filter(p => p.lastAccessed >= startTime)
      .slice(0, 10)

    return {
      period,
      metrics: this.getMetrics(),
      topPatterns,
      optimizations: this.generateOptimizations(),
      issues: this.detectIssues(),
      recommendations: this.generateRecommendations()
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.metrics.hitRate < 70) {
      recommendations.push('Considere aumentar o TTL das chaves mais acessadas')
    }

    if (this.metrics.avgResponseTime > 1000) {
      recommendations.push('Implemente preload para dados críticos')
    }

    if (this.patterns.size > 1000) {
      recommendations.push('Considere implementar LRU ou expiração automática')
    }

    const hotPatterns = Array.from(this.patterns.values())
      .filter(p => p.category === 'hot').length

    if (hotPatterns < 5) {
      recommendations.push('Identifique dados críticos para manter em cache permanentemente')
    }

    return recommendations
  }

  public reset() {
    this.operations = []
    this.patterns.clear()
    this.metrics = this.initializeMetrics()
    EventBus.emit('cache.analytics.reset')
  }

  public destroy() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
    EventBus.off('cache.*')
  }
}

// Singleton
export const CacheAnalytics = new CacheAnalyticsService()