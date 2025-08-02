# Sistema de Monitoramento de Cache

Sistema completo de monitoramento e analytics para o cache unificado do ImobiPRO Dashboard.

## Componentes

### CacheMonitor
Componente principal de monitoramento com interface completa.

```tsx
import { CacheMonitor } from '@/components/monitoring'

// Uso básico
<CacheMonitor />

// Com configurações
<CacheMonitor 
  defaultTab="performance" 
  className="custom-class" 
/>
```

**Props:**
- `className?: string` - Classes CSS customizadas
- `defaultTab?: 'overview' | 'patterns' | 'sync' | 'performance'` - Tab inicial

**Recursos:**
- Dashboard com métricas em tempo real
- Gráficos de performance (Recharts)
- Análise de padrões de acesso
- Status de sincronização entre tabs
- Sistema de alertas
- Exportação de dados

### CacheHealthIndicator
Indicador compacto de saúde do cache.

```tsx
import { CacheHealthIndicator } from '@/components/monitoring'

// Indicador simples
<CacheHealthIndicator />

// Com detalhes expandidos
<CacheHealthIndicator 
  size="lg" 
  showDetails={true} 
/>
```

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Tamanho do indicador
- `showDetails?: boolean` - Mostrar detalhes expandidos
- `className?: string` - Classes CSS customizadas

## Hooks

### useCacheMonitoring
Hook principal para monitoramento completo.

```tsx
import { useCacheMonitoring } from '@/hooks/cache'

const {
  metrics,
  patterns,
  syncStatus,
  isLoading,
  error,
  refreshMetrics,
  generateReport,
  resetAnalytics,
  exportData
} = useCacheMonitoring()
```

### useCacheMetricsRealtime
Hook para métricas em tempo real.

```tsx
import { useCacheMetricsRealtime } from '@/hooks/cache'

const metrics = useCacheMetricsRealtime()
// metrics.hitRate, metrics.avgResponseTime, etc.
```

### useCachePatterns
Hook para padrões de acesso.

```tsx
import { useCachePatterns } from '@/hooks/cache'

const patterns = useCachePatterns(10) // Top 10 padrões
```

### useCacheSyncStatus
Hook para status de sincronização.

```tsx
import { useCacheSyncStatus } from '@/hooks/cache'

const syncStatus = useCacheSyncStatus()
// syncStatus.isOnline, syncStatus.tabsConnected, etc.
```

### useCacheAlerts
Hook para alertas de performance.

```tsx
import { useCacheAlerts } from '@/hooks/cache'

const { alerts, clearAlerts } = useCacheAlerts()
```

### useCacheHealth
Hook para status de saúde geral.

```tsx
import { useCacheHealth } from '@/components/monitoring'

const { 
  status, 
  isHealthy, 
  needsAttention 
} = useCacheHealth()
```

## Serviços

### CacheAnalytics
Serviço principal de analytics.

```tsx
import { CacheAnalytics } from '@/services/cache/CacheAnalytics'

// Obter métricas
const metrics = CacheAnalytics.getMetrics()

// Gerar relatório
const report = CacheAnalytics.generateReport('24h')

// Reset completo
CacheAnalytics.reset()
```

## Integração com EventBus

O sistema utiliza o EventBus para comunicação:

```tsx
import { EventBus } from '@/lib/event-bus'

// Registrar operação de cache
EventBus.emit('cache.get', {
  key: 'user:123',
  hit: true,
  responseTime: 45
})

// Registrar erro
EventBus.emit('cache.error', {
  key: 'api:endpoint',
  error: 'Connection timeout'
})
```

## Tipos de Dados

### CacheMetrics
```typescript
interface CacheMetrics {
  hitCount: number
  missCount: number
  hitRate: number
  totalRequests: number
  avgResponseTime: number
  memoryUsage: number
  errorCount: number
  evictionCount: number
}
```

### CachePattern
```typescript
interface CachePattern {
  key: string
  accessCount: number
  lastAccessed: Date
  averageResponseTime: number
  hitRate: number
  category: 'hot' | 'warm' | 'cold'
}
```

### SyncStatus
```typescript
interface SyncStatus {
  isOnline: boolean
  lastSync: Date | null
  pendingOperations: number
  syncErrors: number
  tabsConnected: number
  broadcastChannelActive: boolean
}
```

## Recursos Avançados

### Análise Automática
- Executa a cada 5 minutos
- Identifica padrões de uso
- Sugere otimizações
- Detecta problemas automaticamente

### Alertas Inteligentes
- Hit rate baixo (< 50%)
- Tempo de resposta alto (> 2s)
- Muitos erros de cache
- Problemas de sincronização

### Otimizações Sugeridas
- Aumentar TTL para chaves "hot"
- Remover chaves "cold" com baixo hit rate
- Preload para dados com alto tempo de resposta
- Ajustes de estratégia de cache

### Relatórios
- Performance por período
- Top padrões de acesso
- Sugestões de otimização
- Exportação em JSON

## Exemplo de Integração Completa

```tsx
import { CacheMonitor, CacheHealthIndicator } from '@/components/monitoring'
import { useCacheHealth } from '@/components/monitoring'

function MyDashboard() {
  const { needsAttention } = useCacheHealth()

  return (
    <div>
      {/* Indicador no header */}
      <header>
        <CacheHealthIndicator size="sm" />
      </header>

      {/* Alerta se precisar atenção */}
      {needsAttention && (
        <div className="alert">
          Cache precisa de atenção!
        </div>
      )}

      {/* Monitor completo */}
      <CacheMonitor defaultTab="overview" />
    </div>
  )
}
```

## Configuração

O sistema funciona automaticamente com o cache unificado existente. Para personalizar:

```tsx
import { CacheAnalytics } from '@/services/cache/CacheAnalytics'

// Configurar limites
CacheAnalytics.maxOperationsHistory = 2000

// Event listeners customizados
EventBus.on('cache.*', (data) => {
  // Processar eventos de cache
})
```