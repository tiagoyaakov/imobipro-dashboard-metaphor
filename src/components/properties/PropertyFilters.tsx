// ================================================
// COMPONENTE: PropertyFilters
// ================================================
// Data: 30/01/2025
// Descrição: Filtros avançados para propriedades
// Funcionalidades: Busca, filtros por categoria, preço, localização
// ================================================

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  FilterIcon, 
  SearchIcon, 
  XIcon,
  MapPinIcon,
  HomeIcon,
  DollarSignIcon,
  BedIcon,
  BathIcon,
  CarIcon,
  CalendarIcon
} from 'lucide-react';
import {
  PropertyFilters as PropertyFiltersType,
  PropertyCategory,
  PropertyType,
  PropertyStatus,
  PropertyListingType,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  BRAZILIAN_STATES,
} from '@/types/properties';

// ================================================
// INTERFACES
// ================================================

interface PropertyFiltersProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  onSearch: (query: string) => void;
  searchQuery?: string;
  availableOptions?: {
    cities?: string[];
    neighborhoods?: Record<string, string[]>;
    agents?: { id: string; name: string }[];
    owners?: { id: string; name: string }[];
  };
  className?: string;
}

// ================================================
// COMPONENTE PRINCIPAL
// ================================================

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  searchQuery = '',
  availableOptions = {},
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // ================================================
  // CONTADORES DE FILTROS ATIVOS
  // ================================================

  const getActiveFiltersCount = (): number => {
    let count = 0;
    
    if (filters.category && filters.category.length > 0) count++;
    if (filters.propertyType && filters.propertyType.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.listingType && filters.listingType.length > 0) count++;
    if (filters.minSalePrice || filters.maxSalePrice) count++;
    if (filters.minRentPrice || filters.maxRentPrice) count++;
    if (filters.minBedrooms || filters.maxBedrooms) count++;
    if (filters.minBathrooms || filters.maxBathrooms) count++;
    if (filters.city) count++;
    if (filters.neighborhood && filters.neighborhood.length > 0) count++;
    if (filters.state) count++;
    if (filters.isFeatured !== undefined) count++;
    if (filters.agentId) count++;
    if (filters.ownerId) count++;
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // ================================================
  // HANDLERS
  // ================================================

  const handleFilterChange = (key: keyof PropertyFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleMultiSelectChange = (key: keyof PropertyFiltersType, value: string, checked: boolean) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    handleFilterChange(key, newValues.length > 0 ? newValues : undefined);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const handleClearFilters = () => {
    onFiltersChange({});
    setLocalSearch('');
    onSearch('');
  };

  const handlePriceRangeChange = (type: 'sale' | 'rent', range: [number, number]) => {
    if (type === 'sale') {
      handleFilterChange('minSalePrice', range[0] > 0 ? range[0] : undefined);
      handleFilterChange('maxSalePrice', range[1] < 5000000 ? range[1] : undefined);
    } else {
      handleFilterChange('minRentPrice', range[0] > 0 ? range[0] : undefined);
      handleFilterChange('maxRentPrice', range[1] < 10000 ? range[1] : undefined);
    }
  };

  // ================================================
  // COMPONENTES AUXILIARES
  // ================================================

  const SearchBar = () => (
    <form onSubmit={handleSearchSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar propriedades..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit" variant="outline" size="icon">
        <SearchIcon className="h-4 w-4" />
      </Button>
    </form>
  );

  const CategoryFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Categoria</Label>
      <div className="space-y-2">
        {Object.entries(PROPERTY_CATEGORY_LABELS).map(([value, label]) => (
          <div key={value} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${value}`}
              checked={(filters.category || []).includes(value as PropertyCategory)}
              onCheckedChange={(checked) =>
                handleMultiSelectChange('category', value, checked as boolean)
              }
            />
            <Label htmlFor={`category-${value}`} className="text-sm">
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  const PropertyTypeFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Tipo de Propriedade</Label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
          <div key={value} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${value}`}
              checked={(filters.propertyType || []).includes(value as PropertyType)}
              onCheckedChange={(checked) =>
                handleMultiSelectChange('propertyType', value, checked as boolean)
              }
            />
            <Label htmlFor={`type-${value}`} className="text-xs">
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  const StatusFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Status</Label>
      <div className="space-y-2">
        {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
          <div key={value} className="flex items-center space-x-2">
            <Checkbox
              id={`status-${value}`}
              checked={(filters.status || []).includes(value as PropertyStatus)}
              onCheckedChange={(checked) =>
                handleMultiSelectChange('status', value, checked as boolean)
              }
            />
            <Label htmlFor={`status-${value}`} className="text-sm">
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  const ListingTypeFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Finalidade</Label>
      <div className="space-y-2">
        {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
          <div key={value} className="flex items-center space-x-2">
            <Checkbox
              id={`listing-${value}`}
              checked={(filters.listingType || []).includes(value as PropertyListingType)}
              onCheckedChange={(checked) =>
                handleMultiSelectChange('listingType', value, checked as boolean)
              }
            />
            <Label htmlFor={`listing-${value}`} className="text-sm">
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  const PriceFilters = () => (
    <div className="space-y-6">
      {/* Preço de Venda */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <DollarSignIcon className="h-4 w-4" />
          Preço de Venda
        </Label>
        <div className="px-3">
          <Slider
            value={[
              filters.minSalePrice || 0,
              filters.maxSalePrice || 5000000
            ]}
            onValueChange={(value) => handlePriceRangeChange('sale', value as [number, number])}
            max={5000000}
            min={0}
            step={50000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>R$ {((filters.minSalePrice || 0) / 1000).toFixed(0)}k</span>
            <span>R$ {((filters.maxSalePrice || 5000000) / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* Preço de Aluguel */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Preço de Aluguel</Label>
        <div className="px-3">
          <Slider
            value={[
              filters.minRentPrice || 0,
              filters.maxRentPrice || 10000
            ]}
            onValueChange={(value) => handlePriceRangeChange('rent', value as [number, number])}
            max={10000}
            min={0}
            step={200}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>R$ {filters.minRentPrice || 0}</span>
            <span>R$ {filters.maxRentPrice || 10000}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const CharacteristicsFilter = () => (
    <div className="space-y-4">
      {/* Quartos */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <BedIcon className="h-4 w-4" />
          Quartos
        </Label>
        <div className="flex gap-2">
          <Select
            value={filters.minBedrooms?.toString() || ''}
            onValueChange={(value) => handleFilterChange('minBedrooms', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer</SelectItem>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>{num}+</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.maxBedrooms?.toString() || ''}
            onValueChange={(value) => handleFilterChange('maxBedrooms', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Max" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer</SelectItem>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Banheiros */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <BathIcon className="h-4 w-4" />
          Banheiros
        </Label>
        <div className="flex gap-2">
          <Select
            value={filters.minBathrooms?.toString() || ''}
            onValueChange={(value) => handleFilterChange('minBathrooms', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer</SelectItem>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>{num}+</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.maxBathrooms?.toString() || ''}
            onValueChange={(value) => handleFilterChange('maxBathrooms', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Max" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer</SelectItem>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vagas de Garagem */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CarIcon className="h-4 w-4" />
          Vagas de Garagem
        </Label>
        <Select
          value={filters.minParkingSpaces?.toString() || ''}
          onValueChange={(value) => handleFilterChange('minParkingSpaces', value ? parseInt(value) : undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Qualquer quantidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Qualquer</SelectItem>
            {[1, 2, 3, 4, 5].map(num => (
              <SelectItem key={num} value={num.toString()}>{num}+ vagas</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const LocationFilter = () => (
    <div className="space-y-4">
      {/* Estado */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPinIcon className="h-4 w-4" />
          Estado
        </Label>
        <Select
          value={filters.state || ''}
          onValueChange={(value) => handleFilterChange('state', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os estados</SelectItem>
            {BRAZILIAN_STATES.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cidade */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cidade</Label>
        <Select
          value={filters.city || ''}
          onValueChange={(value) => handleFilterChange('city', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as cidades</SelectItem>
            {(availableOptions.cities || []).map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bairro */}
      {filters.city && availableOptions.neighborhoods?.[filters.city] && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Bairro</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableOptions.neighborhoods[filters.city].map(neighborhood => (
              <div key={neighborhood} className="flex items-center space-x-2">
                <Checkbox
                  id={`neighborhood-${neighborhood}`}
                  checked={(filters.neighborhood || []).includes(neighborhood)}
                  onCheckedChange={(checked) =>
                    handleMultiSelectChange('neighborhood', neighborhood, checked as boolean)
                  }
                />
                <Label htmlFor={`neighborhood-${neighborhood}`} className="text-sm">
                  {neighborhood}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const SpecialFilters = () => (
    <div className="space-y-4">
      {/* Propriedades em Destaque */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="featured"
          checked={filters.isFeatured === true}
          onCheckedChange={(checked) =>
            handleFilterChange('isFeatured', checked ? true : undefined)
          }
        />
        <Label htmlFor="featured" className="text-sm">
          Apenas propriedades em destaque
        </Label>
      </div>

      {/* Corretor */}
      {availableOptions.agents && availableOptions.agents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Corretor</Label>
          <Select
            value={filters.agentId || ''}
            onValueChange={(value) => handleFilterChange('agentId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os corretores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os corretores</SelectItem>
              {availableOptions.agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Proprietário */}
      {availableOptions.owners && availableOptions.owners.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Proprietário</Label>
          <Select
            value={filters.ownerId || ''}
            onValueChange={(value) => handleFilterChange('ownerId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os proprietários" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os proprietários</SelectItem>
              {availableOptions.owners.map(owner => (
                <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  // ================================================
  // RENDER
  // ================================================

  return (
    <div className={className}>
      {/* Search Bar - sempre visível */}
      <div className="mb-4">
        <SearchBar />
      </div>

      {/* Filtros compactos - Desktop */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2"
          >
            <FilterIcon className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Botão de filtros - Mobile */}
      <div className="lg:hidden mb-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle>Filtros de Propriedades</SheetTitle>
              <SheetDescription>
                Use os filtros abaixo para refinar sua busca
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <Accordion type="multiple" defaultValue={['category', 'price', 'location']}>
                <AccordionItem value="category">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <HomeIcon className="h-4 w-4" />
                      Tipo e Categoria
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <CategoryFilter />
                    <PropertyTypeFilter />
                    <StatusFilter />
                    <ListingTypeFilter />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <DollarSignIcon className="h-4 w-4" />
                      Preços
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <PriceFilters />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="characteristics">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <BedIcon className="h-4 w-4" />
                      Características
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CharacteristicsFilter />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="location">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      Localização
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <LocationFilter />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="special">
                  <AccordionTrigger>Filtros Especiais</AccordionTrigger>
                  <AccordionContent>
                    <SpecialFilters />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1"
              >
                Limpar
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Aplicar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Panel de filtros - Desktop */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-96 hidden lg:block">
          <SheetHeader>
            <SheetTitle>Filtros Avançados</SheetTitle>
            <SheetDescription>
              Refine sua busca com filtros específicos
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            <Accordion type="multiple" defaultValue={['category', 'price', 'location']}>
              <AccordionItem value="category">
                <AccordionTrigger>Tipo e Categoria</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <CategoryFilter />
                  <PropertyTypeFilter />
                  <StatusFilter />
                  <ListingTypeFilter />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="price">
                <AccordionTrigger>Preços</AccordionTrigger>
                <AccordionContent>
                  <PriceFilters />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="characteristics">
                <AccordionTrigger>Características</AccordionTrigger>
                <AccordionContent>
                  <CharacteristicsFilter />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location">
                <AccordionTrigger>Localização</AccordionTrigger>
                <AccordionContent>
                  <LocationFilter />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="special">
                <AccordionTrigger>Filtros Especiais</AccordionTrigger>
                <AccordionContent>
                  <SpecialFilters />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1"
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PropertyFilters;