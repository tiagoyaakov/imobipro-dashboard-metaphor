// ================================================
// PÁGINA: Propriedades
// ================================================
// Data: 30/01/2025
// Descrição: Página principal do módulo de propriedades
// Funcionalidades: Listagem, filtros, dashboard, importação Viva Real
// ================================================

import React, { useState, useMemo } from 'react';
import { Plus, LayoutGrid, List, Download, Upload, BarChart3, Search, Filter, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Componentes do módulo
import PropertyCard from '@/components/properties/PropertyCard';
import PropertyFilters from '@/components/properties/PropertyFilters';

// Hooks
import { 
  usePropertiesManager,
  usePropertiesDashboard,
  useImportFromVivaReal 
} from '@/hooks/useProperties';

// Types
import type { 
  Property, 
  PropertyFilters as PropertyFiltersType,
  PropertySearchParams,
  VivaRealProperty 
} from '@/types/properties';

// ================================================
// COMPONENTES AUXILIARES
// ================================================

const DashboardStats: React.FC = () => {
  const { metrics, isLoading } = usePropertiesDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const stats = [
    {
      title: 'Total de Propriedades',
      value: metrics.totalProperties.toLocaleString(),
      description: `${metrics.activeProperties} ativas`,
      color: 'text-blue-600',
    },
    {
      title: 'À Venda',
      value: metrics.availableForSale.toLocaleString(),
      description: `Preço médio: ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(metrics.averageSalePrice)}`,
      color: 'text-green-600',
    },
    {
      title: 'Para Alugar',
      value: metrics.availableForRent.toLocaleString(),
      description: `Preço médio: ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(metrics.averageRentPrice)}`,
      color: 'text-purple-600',
    },
    {
      title: 'Negociações',
      value: (metrics.soldThisMonth + metrics.rentedThisMonth).toLocaleString(),
      description: `${metrics.soldThisMonth} vendas, ${metrics.rentedThisMonth} aluguéis`,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const VivaRealImportDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonData, setJsonData] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState(false);
  
  const importMutation = useImportFromVivaReal();

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    try {
      const parsed = JSON.parse(value);
      setIsValidJson(Array.isArray(parsed) && parsed.length > 0);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonData(content);
        handleJsonChange(content);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    try {
      const data: VivaRealProperty[] = JSON.parse(jsonData);
      
      await importMutation.mutateAsync({
        jsonData: data,
        options: {
          syncImages: true,
          updateExisting: true,
          onProgress: (progress, message) => {
            toast.info(`${progress}% - ${message}`);
          }
        }
      });
      
      setIsOpen(false);
      setJsonData('');
    } catch (error) {
      toast.error('Erro ao processar arquivo JSON');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Viva Real
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Propriedades do Viva Real</DialogTitle>
          <DialogDescription>
            Faça upload do arquivo JSON ou cole o conteúdo abaixo para importar propriedades.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload de Arquivo JSON
            </label>
            <Input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>
          
          <div className="text-center text-gray-500">ou</div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Cole o JSON aqui
            </label>
            <textarea
              className="w-full h-64 p-3 border rounded-md font-mono text-sm"
              placeholder="Cole o conteúdo JSON do arquivo do Viva Real..."
              value={jsonData}
              onChange={(e) => handleJsonChange(e.target.value)}
            />
          </div>
          
          {jsonData && (
            <div className="flex items-center gap-2">
              <Badge variant={isValidJson ? "default" : "destructive"}>
                {isValidJson ? "JSON Válido" : "JSON Inválido"}
              </Badge>
              {isValidJson && (
                <span className="text-sm text-gray-600">
                  {JSON.parse(jsonData).length} propriedades encontradas
                </span>
              )}
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!isValidJson || importMutation.isPending}
            >
              {importMutation.isPending ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ================================================
// COMPONENTE PRINCIPAL
// ================================================

const PropriedadesPage: React.FC = () => {
  // ================================================
  // ESTADO LOCAL
  // ================================================
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ================================================
  // PARÂMETROS DE BUSCA
  // ================================================
  
  const searchParams: PropertySearchParams = useMemo(() => ({
    query: searchQuery || undefined,
    filters,
    sortBy,
    sortOrder,
    page: currentPage,
    limit: 20,
  }), [searchQuery, filters, sortBy, sortOrder, currentPage]);

  // ================================================
  // HOOKS
  // ================================================
  
  const {
    properties,
    metrics,
    owners,
    isLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
  } = usePropertiesManager(searchParams);

  // ================================================
  // HANDLERS
  // ================================================
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset page when search changes
  };

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset page when filters change
  };

  const handlePropertyClick = (property: Property) => {
    // TODO: Navigate to property details page
    console.log('View property:', property.id);
  };

  const handleEditProperty = (property: Property) => {
    // TODO: Open edit dialog/form
    console.log('Edit property:', property.id);
  };

  const handleDeleteProperty = async (property: Property) => {
    if (window.confirm(`Tem certeza que deseja excluir "${property.title}"?`)) {
      try {
        deleteProperty(property.id);
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const handleCreateProperty = () => {
    // TODO: Open create dialog/form
    console.log('Create new property');
  };

  // ================================================
  // COMPUTED VALUES
  // ================================================
  
  const availableFilterOptions = useMemo(() => ({
    cities: Array.from(new Set(properties?.properties?.map(p => p.city) || [])),
    neighborhoods: properties?.properties?.reduce((acc, p) => {
      if (!acc[p.city]) acc[p.city] = [];
      if (!acc[p.city].includes(p.neighborhood)) {
        acc[p.city].push(p.neighborhood);
      }
      return acc;
    }, {} as Record<string, string[]>) || {},
    agents: Array.from(new Set(
      properties?.properties
        ?.filter(p => p.agent)
        .map(p => ({ id: p.agent!.id, name: p.agent!.name })) || []
    )),
    owners: owners || [],
  }), [properties, owners]);

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  // ================================================
  // RENDER
  // ================================================

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Erro ao carregar propriedades</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Propriedades
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seu portfólio de imóveis
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <VivaRealImportDialog />
          
          <Button onClick={handleCreateProperty} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Propriedade
          </Button>
        </div>
      </div>

      {/* Dashboard e Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-2">
            <ScanText className="h-4 w-4" />
            Propriedades
            {properties?.totalCount && (
              <Badge variant="secondary" className="ml-1">
                {properties.totalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Análises
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats />
          
          {/* Recent Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Propriedades Recentes</CardTitle>
              <CardDescription>
                Últimas propriedades adicionadas ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : properties?.properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma propriedade encontrada</p>
                  <Button 
                    onClick={handleCreateProperty} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Adicionar primeira propriedade
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties?.properties.slice(0, 6).map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      variant="compact"
                      onClick={handlePropertyClick}
                      onEdit={handleEditProperty}
                      onDelete={handleDeleteProperty}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          {/* Filters and Controls */}
          <div className="space-y-4">
            <PropertyFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearchChange}
              searchQuery={searchQuery}
              availableOptions={availableFilterOptions}
            />
            
            {/* View controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Badge variant="outline">
                    {properties?.totalCount || 0} propriedades encontradas
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Properties Grid/List */}
          {isLoading ? (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : properties?.properties.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">Nenhuma propriedade encontrada</p>
                  <p className="text-sm mt-1">
                    {hasActiveFilters 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece adicionando sua primeira propriedade'
                    }
                  </p>
                  <div className="mt-6 flex gap-3 justify-center">
                    {hasActiveFilters && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setFilters({});
                          setSearchQuery('');
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                    <Button onClick={handleCreateProperty}>
                      Nova Propriedade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {properties.properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant={viewMode === 'list' ? 'list' : property.isFeatured ? 'featured' : 'default'}
                  onClick={handlePropertyClick}
                  onEdit={handleEditProperty}
                  onDelete={handleDeleteProperty}
                  showStats={true}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {properties && properties.totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!properties.hasPreviousPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, properties.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  disabled={!properties.hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Análises Avançadas</CardTitle>
              <CardDescription>
                Métricas detalhadas sobre seu portfólio de propriedades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Em desenvolvimento...</p>
                <p className="text-sm text-gray-400 mt-1">
                  Gráficos e análises avançadas em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropriedadesPage;
