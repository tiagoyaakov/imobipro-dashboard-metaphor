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
  usePropertiesV3,
  usePropertiesDashboardV3 
} from '@/hooks/usePropertiesV3';
import { useImportFromVivaRealV3 } from '@/hooks/usePropertiesV3';
import { usePermissions } from '@/hooks/security/usePermissions';
import { usePropertyV3 } from '@/hooks/usePropertiesV3';
import PropertyForm from '@/components/properties/PropertyForm';
import type { PropertyFormData } from '@/types/properties';
import { usePropertyExport } from '@/hooks/usePropertyExport';

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
  const { stats: metrics, isLoading } = usePropertiesDashboardV3();

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
  
  const { importProperty, isImporting, error: importError } = useImportFromVivaRealV3();

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
      
      // NOTA: useImportFromVivaRealV3 ainda é placeholder, aceita URL
      // TODO: Implementar importação completa no service quando necessário
      await importProperty('mock-json-import');
      
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
              disabled={!isValidJson || isImporting}
            >
              {isImporting ? 'Importando...' : 'Importar'}
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
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

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
  
  const { isAdmin, isDevMaster } = usePermissions();
  const canManage = isAdmin() || isDevMaster();

  const {
    properties,
    stats: metrics,
    totalCount,
    isLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage
  } = usePropertiesV3({
    filters: searchParams.filters,
    limit: searchParams.limit,
    page: searchParams.page
  });

  // ================================================
  // HANDLERS
  // ================================================
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    goToPage(1); // Reset page when search changes
  };

  const handleFiltersChange = (newFilters: PropertyFiltersType) => {
    setFilters(newFilters);
    goToPage(1); // Reset page when filters change
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedPropertyId(property.id);
    setIsDetailsOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    if (!canManage) return;
    setEditingProperty(property);
    setFormMode('edit');
    setIsFormOpen(true);
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
    if (!canManage) return;
    setEditingProperty(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  // ================================================
  // COMPUTED VALUES
  // ================================================
  
  const availableFilterOptions = useMemo(() => ({
    cities: Array.from(new Set(properties?.map(p => p.city) || [])),
    neighborhoods: properties?.reduce((acc, p) => {
      if (!acc[p.city]) acc[p.city] = [];
      // NOTA: neighborhood não existe no tipo Property - usando address por ora
      const neighborhood = p.address.split(',')[1]?.trim() || p.city;
      if (!acc[p.city].includes(neighborhood)) {
        acc[p.city].push(neighborhood);
      }
      return acc;
    }, {} as Record<string, string[]>) || {},
    agents: Array.from(new Set(
      properties
        ?.filter(p => p.agentId)
        .map(p => ({ id: p.agentId, name: `Agent ${p.agentId}` })) || []
    )),
    owners: [], // NOTA: owners não implementado no MVP ainda
  }), [properties]);

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  // Mapear Property (UI) → PropertyFormData
  const mapPropertyToForm = (p: Property): PropertyFormData => ({
    title: p.title,
    description: p.description || '',
    propertyType: p.propertyType as any,
    status: p.status as any,
    listingType: p.listingType as any,
    salePrice: p.salePrice,
    rentPrice: p.rentPrice,
    condominiumFee: p.condominiumFee,
    iptuPrice: p.iptuPrice,
    totalArea: p.totalArea,
    builtArea: p.builtArea,
    usefulArea: p.usefulArea,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    suites: p.suites,
    parkingSpaces: p.parkingSpaces,
    floors: p.floors,
    floor: p.floor,
    yearBuilt: p.yearBuilt,
    address: p.address,
    number: p.number,
    complement: p.complement,
    neighborhood: p.neighborhood,
    city: p.city,
    state: p.state,
    zipCode: p.zipCode,
    features: p.features || [],
    amenities: p.amenities || [],
    isFeatured: p.isFeatured,
    notes: p.notes || '',
  });

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
        
        {canManage && (
          <div className="flex items-center gap-3">
            <VivaRealImportDialog />
            
            <Button onClick={handleCreateProperty} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Propriedade
            </Button>
          </div>
        )}
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
            {totalCount && (
              <Badge variant="secondary" className="ml-1">
                {totalCount}
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
              ) : properties?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma propriedade encontrada</p>
                  <Button 
                    onClick={handleCreateProperty}
                    variant="outline" 
                    className="mt-4"
                    disabled={!canManage}
                  >
                    {canManage ? 'Adicionar primeira propriedade' : 'Sem permissões para adicionar'}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties?.slice(0, 6).map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      variant="compact"
                      onClick={handlePropertyClick}
                      onEdit={canManage ? handleEditProperty : undefined}
                      onDelete={canManage ? handleDeleteProperty : undefined}
                      showActions={canManage}
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
                    {totalCount || 0} propriedades encontradas
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
          ) : properties?.length === 0 ? (
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
              {properties?.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant={viewMode === 'list' ? 'list' : 'default'}
                  onClick={handlePropertyClick}
                  onEdit={canManage ? handleEditProperty : undefined}
                  onDelete={canManage ? handleDeleteProperty : undefined}
                  showStats={true}
                  showActions={canManage}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!hasPreviousPage}
                  onClick={previousPage}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  disabled={!hasNextPage}
                  onClick={nextPage}
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

      {/* Details Dialog */}
      {selectedPropertyId && (
        <PropertyDetailsDialog 
          id={selectedPropertyId} 
          open={isDetailsOpen} 
          onOpenChange={setIsDetailsOpen}
          canManage={canManage}
        />
      )}

      {/* Create/Edit Form Dialog */}
      {canManage && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formMode === 'create' ? 'Nova Propriedade' : 'Editar Propriedade'}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos obrigatórios e salve para {formMode === 'create' ? 'criar' : 'atualizar'}.
              </DialogDescription>
            </DialogHeader>

            <PropertyForm
              mode={formMode}
              defaultValues={editingProperty ? mapPropertyToForm(editingProperty) : undefined}
              onCancel={() => setIsFormOpen(false)}
              onSubmit={async (values) => {
                try {
                  if (formMode === 'create') {
                    await createProperty(values);
                  } else if (editingProperty) {
                    await updateProperty(editingProperty.id, values);
                  }
                  setIsFormOpen(false);
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PropriedadesPage;

// ================================================
// DETALHES DA PROPRIEDADE (Dialog)
// ================================================

interface PropertyDetailsDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}

const PropertyDetailsDialog: React.FC<PropertyDetailsDialogProps> = ({ id, open, onOpenChange, canManage }) => {
  const { property, isLoading, error } = usePropertyV3(id);
  const { exportPropertyPDF, exportPropertyXML } = usePropertyExport();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Propriedade</DialogTitle>
          <DialogDescription>
            Visualize todas as informações disponíveis deste imóvel.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-48 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-red-600">
                {error.message}
              </div>
            </CardContent>
          </Card>
        ) : property ? (
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{property.title}</h2>
                <p className="text-sm text-gray-500">
                  {property.address} — {property.neighborhood} — {property.city}/{property.state}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPropertyPDF(property)}
                >
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPropertyXML(property)}
                >
                  Exportar XML
                </Button>
              </div>
            </div>

            {/* Imagens */}
            {property.images && property.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {property.images.map(img => (
                  <img key={img.id} src={img.url} alt={property.title} className="w-full h-40 object-cover rounded" />
                ))}
              </div>
            )}

            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Tipo:</span> {property.propertyType}</div>
                  <div><span className="text-gray-500">Status:</span> {property.status}</div>
                  <div><span className="text-gray-500">Finalidade:</span> {property.listingType}</div>
                  <div><span className="text-gray-500">Área Total:</span> {property.totalArea ?? '-'} m²</div>
                  <div><span className="text-gray-500">Quartos:</span> {property.bedrooms}</div>
                  <div><span className="text-gray-500">Banheiros:</span> {property.bathrooms}</div>
                  <div><span className="text-gray-500">Vagas:</span> {property.parkingSpaces}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Valores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Venda:</span> {property.salePrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.salePrice) : '-'}</div>
                  <div><span className="text-gray-500">Aluguel:</span> {property.rentPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.rentPrice) : '-'}</div>
                  <div><span className="text-gray-500">Condomínio:</span> {property.condominiumFee ?? '-'}</div>
                  <div><span className="text-gray-500">IPTU:</span> {property.iptuPrice ?? '-'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Características */}
            {(property.features?.length || property.amenities?.length) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-xs">
                  {(property.features || []).map((f, i) => (
                    <Badge key={`f-${i}`} variant="outline">{f}</Badge>
                  ))}
                  {(property.amenities || []).map((a, i) => (
                    <Badge key={`a-${i}`} variant="secondary">{a}</Badge>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {/* Ações administrativas (editar/excluir) - futuro */}
            {canManage && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled>
                  Editar (em breve)
                </Button>
                <Button variant="destructive" disabled>
                  Excluir (em breve)
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
