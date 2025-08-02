// ================================================================
// PÁGINA DE TESTE - COMPARAÇÃO PROPERTIES V1 VS V2
// ================================================================
// Data: 02/08/2025
// Descrição: Página para testar e comparar as versões do useProperties
// Features: Comparação de performance, cache metrics, CRUD operations
// ================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home,
  Clock, 
  Database, 
  RefreshCw, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Wifi,
  WifiOff,
  Plus,
  Edit,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

// Hooks das duas versões
import useProperties from '@/hooks/useProperties'; // V1
import usePropertiesV2 from '@/hooks/usePropertiesV2'; // V2

// Componentes de monitoramento
import { CacheHealthIndicator } from '@/components/monitoring';

// Componentes de propriedades
import PropertyCard from '@/components/properties/PropertyCard';

// Tipos
import type { PropertyFilters, PropertyStatus, PropertyType } from '@/types/property';

export default function PropertiesTest() {
  const [useV2, setUseV2] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [page, setPage] = useState(1);
  
  // Hook V1 (Original)
  const v1 = useProperties({ 
    filters,
    page,
    limit: 12
  });
  
  // Hook V2 (Com Cache Unificado)
  const v2 = usePropertiesV2({ 
    filters,
    page,
    limit: 12,
    enableRealtime: true,
    enablePrefetch: true
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

  // Handlers de filtros
  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setFilters(prev => ({ ...prev, status: undefined }));
    } else {
      setFilters(prev => ({ ...prev, status: status as PropertyStatus }));
    }
    setPage(1); // Reset para primeira página
  };

  const handleTypeFilter = (type: string) => {
    if (type === 'all') {
      setFilters(prev => ({ ...prev, type: undefined }));
    } else {
      setFilters(prev => ({ ...prev, type: type as PropertyType }));
    }
    setPage(1);
  };

  const handleSearchFilter = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPage(1);
  };

  // Mock de criação de propriedade
  const handleCreateProperty = async () => {
    try {
      await currentVersion.createProperty({
        title: 'Nova Propriedade Teste',
        description: 'Propriedade criada para teste',
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        price: 500000,
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        type: 'APARTMENT',
        status: 'AVAILABLE'
      });
    } catch (error) {
      console.error('Erro ao criar propriedade:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Properties Test Environment</h1>
          <p className="text-muted-foreground mt-1">
            Compare as versões do useProperties com e sem cache unificado
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Indicador de saúde do cache (só aparece em V2) */}
          {useV2 && <CacheHealthIndicator size="md" showDetails />}
          
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
            Usando Properties <strong>{useV2 ? 'V2' : 'V1'}</strong> - 
            {useV2 
              ? ' Com Cache Unificado, Prefetch Automático e Optimistic Updates' 
              : ' Versão Original com Cache Híbrido'}
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
            {useV2 && !currentVersion.isOnline && ' Usando cache local para navegação'}
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
            <div className="grid gap-4 md:grid-cols-5">
              {/* Hit Rate (V2 only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hit Rate</span>
                  <Badge variant={useV2 ? "default" : "secondary"}>
                    {useV2 ? `${v2.cacheMetrics.hitRate.toFixed(1)}%` : 'N/A'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Taxa de cache hits
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
                  Tamanho do cache
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

              {/* Total Properties */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <Badge variant="outline">
                    {currentVersion.totalProperties}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Propriedades totais
                </div>
              </div>

              {/* Pages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Páginas</span>
                  <Badge variant="outline">
                    {currentVersion.totalPages}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total de páginas
                </div>
              </div>
            </div>

            {/* Benefícios V2 */}
            {useV2 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium mb-4">Recursos Exclusivos V2</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Prefetch automático de páginas adjacentes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Cache individual por propriedade</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Optimistic updates em edições</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Compressão automática para listas grandes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Invalidação inteligente por tags</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        {/* Tab Propriedades */}
        <TabsContent value="properties" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* Busca */}
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Buscar por título ou endereço..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearchFilter(e.target.value)}
                  />
                </div>

                {/* Status */}
                <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="AVAILABLE">Disponível</SelectItem>
                    <SelectItem value="SOLD">Vendido</SelectItem>
                    <SelectItem value="RESERVED">Reservado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Tipo */}
                <Select value={filters.type || 'all'} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="APARTMENT">Apartamento</SelectItem>
                    <SelectItem value="HOUSE">Casa</SelectItem>
                    <SelectItem value="COMMERCIAL">Comercial</SelectItem>
                    <SelectItem value="LAND">Terreno</SelectItem>
                  </SelectContent>
                </Select>

                {/* Botões de ação */}
                <Button
                  variant="outline"
                  onClick={() => currentVersion.refetch()}
                  disabled={currentVersion.isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${currentVersion.isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>

                <Button onClick={handleCreateProperty}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Propriedade
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Propriedades */}
          {currentVersion.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : currentVersion.properties.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma propriedade encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {currentVersion.properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {currentVersion.currentPage} de {currentVersion.totalPages} 
                  ({currentVersion.totalProperties} propriedades)
                </p>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={currentVersion.previousPage}
                    disabled={!currentVersion.hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  {/* Páginas numeradas */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, currentVersion.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentVersion.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => currentVersion.goToPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={currentVersion.nextPage}
                    disabled={!currentVersion.hasNextPage}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Erros */}
          {currentVersion.hasError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar propriedades: {currentVersion.error?.message}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab Estatísticas */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Stats gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                {currentVersion.isLoadingStats ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : currentVersion.stats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de Propriedades</span>
                      <span className="font-medium">{currentVersion.stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Disponíveis</span>
                      <span className="font-medium text-green-600">
                        {currentVersion.stats.byStatus?.AVAILABLE || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vendidas</span>
                      <span className="font-medium text-blue-600">
                        {currentVersion.stats.byStatus?.SOLD || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reservadas</span>
                      <span className="font-medium text-orange-600">
                        {currentVersion.stats.byStatus?.RESERVED || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Preço Médio</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(currentVersion.stats.averagePrice || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
                )}
              </CardContent>
            </Card>

            {/* Dashboard Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dashboard Stats</CardTitle>
              </CardHeader>
              <CardContent>
                {currentVersion.isLoadingDashboard ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : currentVersion.dashboardStats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-medium">{currentVersion.dashboardStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Disponíveis</span>
                      <span className="font-medium">{currentVersion.dashboardStats.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vendidas</span>
                      <span className="font-medium">{currentVersion.dashboardStats.sold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Adicionadas Recentemente</span>
                      <span className="font-medium">{currentVersion.dashboardStats.recentlyAdded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Preço Médio</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(currentVersion.dashboardStats.averagePrice || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Refresh Stats */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => currentVersion.refetchStats()}
              disabled={currentVersion.isLoadingStats}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${currentVersion.isLoadingStats ? 'animate-spin' : ''}`} />
              Atualizar Estatísticas
            </Button>
          </div>
        </TabsContent>

        {/* Tab Operações */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar Operações CRUD</CardTitle>
              <CardDescription>
                Teste as operações de criação, atualização e deleção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Criar Propriedade</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Cria uma nova propriedade de teste com dados mockados
                </p>
                <Button onClick={handleCreateProperty}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Propriedade Teste
                </Button>
              </div>

              {/* Update */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Atualizar Propriedade</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione uma propriedade da lista para testar a atualização
                </p>
                <Button disabled variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Selecione uma Propriedade
                </Button>
              </div>

              {/* Delete */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Deletar Propriedade</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione uma propriedade da lista para testar a deleção
                </p>
                <Button disabled variant="outline" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Selecione uma Propriedade
                </Button>
              </div>

              {/* Upload */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Upload de Imagens</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Teste o upload de imagens para uma propriedade
                </p>
                <Button disabled variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecione uma Propriedade
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cache Operations (V2 only) */}
          {useV2 && (
            <Card>
              <CardHeader>
                <CardTitle>Operações de Cache</CardTitle>
                <CardDescription>
                  Funcionalidades exclusivas do cache unificado V2
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prefetch */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Prefetch de Página</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Carrega uma página em background antes do usuário navegar
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      placeholder="Número da página"
                      className="w-32"
                      min={1}
                      max={v2.totalPages}
                    />
                    <Button 
                      variant="outline"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const pageNum = parseInt(input.value);
                        if (pageNum && pageNum > 0 && pageNum <= v2.totalPages) {
                          v2.prefetchPage(pageNum);
                          input.value = '';
                        }
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Prefetch
                    </Button>
                  </div>
                </div>

                {/* Cache Info */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Informações do Cache</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hit Rate</span>
                      <p className="font-medium">{v2.cacheMetrics.hitRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tamanho</span>
                      <p className="font-medium">{formatBytes(v2.cacheMetrics.size)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fila Offline</span>
                      <p className="font-medium">{v2.cacheMetrics.offlineQueueSize} ops</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                  version: useV2 ? 'V2 (Cache Unificado)' : 'V1 (Híbrido)',
                  currentPage,
                  totalPages: currentVersion.totalPages,
                  totalProperties: currentVersion.totalProperties,
                  propertiesInPage: currentVersion.properties.length,
                  filters,
                  isOnline: currentVersion.isOnline,
                  isOffline: useV2 ? v2.isOffline : !currentVersion.isOnline,
                  lastUpdated: currentVersion.lastUpdated,
                  loadingStates: {
                    properties: currentVersion.isLoading,
                    stats: currentVersion.isLoadingStats,
                    dashboard: currentVersion.isLoadingDashboard
                  },
                  errors: {
                    main: currentVersion.error?.message || null,
                    hasError: currentVersion.hasError
                  },
                  ...(useV2 && {
                    cacheMetrics: v2.cacheMetrics,
                    features: {
                      prefetch: true,
                      optimisticUpdates: true,
                      offlineSupport: true,
                      crossTabSync: true,
                      compression: true,
                      tagBasedInvalidation: true,
                      strategies: {
                        list: 'DYNAMIC (5min)',
                        detail: 'DYNAMIC (5min)',
                        stats: 'STATIC (30min)',
                        dashboard: 'CRITICAL (10s)',
                        images: 'HISTORICAL (1h)'
                      }
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