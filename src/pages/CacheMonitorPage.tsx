import React from 'react'
import { CacheMonitor } from '@/components/monitoring/CacheMonitor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Database, 
  Settings, 
  TestTube, 
  Zap,
  Info,
  RefreshCw
} from 'lucide-react'
import { getUnifiedCache } from '@/lib/cache/UnifiedCache'
import { EventBus } from '@/lib/event-bus'
import { useState } from 'react'

export default function CacheMonitorPage() {
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false)

  // Função para gerar dados de teste
  const generateTestData = async () => {
    setIsGeneratingTestData(true)
    
    try {
      const cache = getUnifiedCache()
      
      // Simular operações de cache variadas
      const testOperations = [
        // Operações de GET (hit e miss)
        { key: 'user:123', hit: true, responseTime: 45 },
        { key: 'user:456', hit: false, responseTime: 120 },
        { key: 'properties:list', hit: true, responseTime: 80 },
        { key: 'contacts:recent', hit: true, responseTime: 35 },
        { key: 'deals:pipeline', hit: false, responseTime: 200 },
        { key: 'appointments:today', hit: true, responseTime: 60 },
        { key: 'reports:weekly', hit: false, responseTime: 300 },
        { key: 'analytics:dashboard', hit: true, responseTime: 25 },
        
        // Operações de SET
        { key: 'user:789', operation: 'set', responseTime: 15, size: 1024 },
        { key: 'properties:featured', operation: 'set', responseTime: 30, size: 2048 },
        { key: 'notifications:unread', operation: 'set', responseTime: 20, size: 512 },
      ]

      // Executar operações com delay para simular uso real
      for (const op of testOperations) {
        const operation = op.operation || 'get'
        
        // Emitir evento para analytics
        EventBus.emit(`cache.${operation}`, {
          key: op.key,
          hit: op.hit,
          responseTime: op.responseTime,
          size: op.size
        })

        // Pequeno delay entre operações
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Simular alguns erros
      EventBus.emit('cache.error', {
        key: 'external:api',
        error: 'Connection timeout'
      })

      // Simular evicção
      EventBus.emit('cache.evict', {
        key: 'old:data',
        responseTime: 5
      })

      // Adicionar dados reais ao cache para demonstração
      await cache.set('demo:metrics', {
        timestamp: new Date(),
        value: Math.random() * 1000
      }, { strategy: 'cache-first' as any })

      await cache.set('demo:user-preferences', {
        theme: 'dark',
        language: 'pt-BR',
        notifications: true
      }, { ttl: 3600000 }) // 1 hora

      console.log('Dados de teste gerados com sucesso!')
      
    } catch (error) {
      console.error('Erro ao gerar dados de teste:', error)
    } finally {
      setIsGeneratingTestData(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cache Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Sistema de monitoramento e analytics do cache unificado
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
            <Badge variant="secondary" className="flex items-center">
              <Database className="h-3 w-3 mr-1" />
              Unified Cache
            </Badge>
          </div>
        </div>

        {/* Informações e controles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Sobre o Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  O sistema de monitoramento de cache oferece insights em tempo real sobre 
                  performance, padrões de uso e sincronização entre tabs.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Recursos:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Métricas de hit/miss rate</li>
                      <li>• Análise de padrões de acesso</li>
                      <li>• Monitoramento de sincronização</li>
                      <li>• Alertas de performance</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Analytics:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Sugestões de otimização</li>
                      <li>• Relatórios de performance</li>
                      <li>• Detecção de problemas</li>
                      <li>• Exportação de dados</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Ferramentas de Teste
              </CardTitle>
              <CardDescription>
                Gere dados de teste para demonstração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={generateTestData}
                disabled={isGeneratingTestData}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingTestData ? 'animate-spin' : ''}`} />
                {isGeneratingTestData ? 'Gerando...' : 'Gerar Dados de Teste'}
              </Button>
              
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Isso irá simular operações de cache para demonstrar 
                  as funcionalidades de monitoramento.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Monitor Principal */}
        <CacheMonitor defaultTab="overview" />

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Configurações Avançadas
            </CardTitle>
            <CardDescription>
              Configurações do sistema de cache e monitoramento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cache" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cache">Cache</TabsTrigger>
                <TabsTrigger value="sync">Sincronização</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cache" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tamanho Máximo</label>
                    <p className="text-sm text-muted-foreground">50MB (configurado)</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compressão</label>
                    <p className="text-sm text-muted-foreground">Habilitada</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Persistência</label>
                    <p className="text-sm text-muted-foreground">IndexedDB</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Garbage Collection</label>
                    <p className="text-sm text-muted-foreground">10 minutos</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sync" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Método</label>
                    <p className="text-sm text-muted-foreground">BroadcastChannel</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo</label>
                    <p className="text-sm text-muted-foreground">5 minutos</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tabs Conectadas</label>
                    <p className="text-sm text-muted-foreground">1 ativa</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fila Offline</label>
                    <p className="text-sm text-muted-foreground">Habilitada</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Coleta de Métricas</label>
                    <p className="text-sm text-muted-foreground">Habilitada</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Histórico</label>
                    <p className="text-sm text-muted-foreground">1000 operações</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Análise Automática</label>
                    <p className="text-sm text-muted-foreground">5 minutos</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alertas</label>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}