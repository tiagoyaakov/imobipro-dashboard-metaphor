// ================================================
// COMPONENTE: PropertyCard
// ================================================
// Data: 30/01/2025
// Descrição: Card de propriedade com informações principais
// Funcionalidades: Exibição, ações, responsivo, múltiplas variantes
// ================================================

import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  HeartIcon,
  ShareIcon,
  MapPinIcon,
  BedIcon,
  BathIcon,
  CarIcon,
  RulerIcon,
  CalendarIcon,
  EyeIcon,
  StarIcon,
  ImageIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Property,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  LISTING_TYPE_LABELS,
} from '@/types/properties';

// ================================================
// INTERFACES
// ================================================

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'compact' | 'featured' | 'list';
  showActions?: boolean;
  showOwner?: boolean;
  showAgent?: boolean;
  showPrices?: boolean;
  showFeatures?: boolean;
  showStats?: boolean;
  maxFeatures?: number;
  onClick?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onFavorite?: (property: Property) => void;
  onShare?: (property: Property) => void;
  className?: string;
}

// ================================================
// COMPONENTE PRINCIPAL
// ================================================

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  variant = 'default',
  showActions = true,
  showOwner = true,
  showAgent = true,
  showPrices = true,
  showFeatures = true,
  showStats = false,
  maxFeatures = 4,
  onClick,
  onEdit,
  onDelete,
  onFavorite,
  onShare,
  className,
}) => {
  // ================================================
  // COMPUTED VALUES
  // ================================================

  const mainImage = property.images?.find(img => img.isMain) || property.images?.[0];
  const imageUrl = mainImage?.url || '/placeholder-property.jpg';
  
  const displayPrice = property.listingType === 'SALE' ? property.salePrice : 
                     property.listingType === 'RENT' ? property.rentPrice :
                     property.salePrice || property.rentPrice;

  const priceLabel = property.listingType === 'SALE' ? 'Venda' :
                    property.listingType === 'RENT' ? 'Aluguel' :
                    property.salePrice && property.rentPrice ? 'Venda/Aluguel' :
                    property.salePrice ? 'Venda' : 'Aluguel';

  const formatPrice = (price?: number) => {
    if (!price) return 'Preço sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (area?: number) => {
    if (!area) return null;
    return `${area.toFixed(0)}m²`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'SOLD': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'RENTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'OFF_MARKET': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // ================================================
  // HANDLERS
  // ================================================

  const handleCardClick = (e: React.MouseEvent) => {
    // Não disparar onClick se clicou em um botão ou dropdown
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
      return;
    }
    onClick?.(property);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // ================================================
  // COMPONENTES AUXILIARES
  // ================================================

  const PropertyImage = () => (
    <div className="relative">
      <div className={cn(
        "relative overflow-hidden rounded-t-lg bg-gray-100",
        variant === 'compact' ? "h-40" : "h-48",
        variant === 'list' ? "w-32 h-24 rounded-lg" : ""
      )}>
        <img
          src={imageUrl}
          alt={property.title}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay com informações */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Badges no canto superior */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge className={cn("text-xs", getStatusColor(property.status))}>
            {PROPERTY_STATUS_LABELS[property.status]}
          </Badge>
          
          {property.isFeatured && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              <StarIcon className="h-3 w-3 mr-1" />
              Destaque
            </Badge>
          )}
          
          {property.source === 'VIVA_REAL' && (
            <Badge variant="outline" className="bg-white/90 text-xs">
              Viva Real
            </Badge>
          )}
        </div>

        {/* Stats no canto superior direito */}
        {showStats && (
          <div className="absolute top-2 right-2 flex gap-1">
            {property.viewCount > 0 && (
              <Badge variant="outline" className="bg-white/90 text-xs">
                <EyeIcon className="h-3 w-3 mr-1" />
                {property.viewCount}
              </Badge>
            )}
            
            {property.images && property.images.length > 1 && (
              <Badge variant="outline" className="bg-white/90 text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                {property.images.length}
              </Badge>
            )}
          </div>
        )}

        {/* Preço no canto inferior esquerdo */}
        {showPrices && displayPrice && (
          <div className="absolute bottom-2 left-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-md px-2 py-1">
              <p className="text-sm font-bold text-gray-900">
                {formatPrice(displayPrice)}
              </p>
              <p className="text-xs text-gray-600">{priceLabel}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const PropertyInfo = () => (
    <div className="space-y-3">
      {/* Título e localização */}
      <div>
        <h3 className={cn(
          "font-semibold text-gray-900 dark:text-white line-clamp-2",
          variant === 'compact' ? "text-sm" : "text-base"
        )}>
          {property.title}
        </h3>
        
        <div className="flex items-center gap-1 mt-1 text-gray-600 dark:text-gray-400">
          <MapPinIcon className="h-3 w-3 flex-shrink-0" />
          <span className={cn(
            "text-xs line-clamp-1",
            variant === 'compact' ? "text-xs" : "text-sm"
          )}>
            {property.neighborhood}, {property.city}
          </span>
        </div>
      </div>

      {/* Características principais */}
      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
        {property.bedrooms > 0 && (
          <div className="flex items-center gap-1">
            <BedIcon className="h-4 w-4" />
            <span className="text-sm">{property.bedrooms}</span>
          </div>
        )}
        
        {property.bathrooms > 0 && (
          <div className="flex items-center gap-1">
            <BathIcon className="h-4 w-4" />
            <span className="text-sm">{property.bathrooms}</span>
          </div>
        )}
        
        {property.parkingSpaces > 0 && (
          <div className="flex items-center gap-1">
            <CarIcon className="h-4 w-4" />
            <span className="text-sm">{property.parkingSpaces}</span>
          </div>
        )}
        
        {property.totalArea && (
          <div className="flex items-center gap-1">
            <RulerIcon className="h-4 w-4" />
            <span className="text-sm">{formatArea(property.totalArea)}</span>
          </div>
        )}
      </div>

      {/* Features */}
      {showFeatures && property.features && property.features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {property.features.slice(0, maxFeatures).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {property.features.length > maxFeatures && (
            <Badge variant="outline" className="text-xs">
              +{property.features.length - maxFeatures}
            </Badge>
          )}
        </div>
      )}

      {/* Preços (se não mostrou na imagem) */}
      {showPrices && !displayPrice && (
        <div className="space-y-1">
          {property.salePrice && (
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(property.salePrice)}
              <span className="text-sm font-normal text-gray-600 ml-1">venda</span>
            </p>
          )}
          {property.rentPrice && (
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
              {formatPrice(property.rentPrice)}
              <span className="text-sm font-normal text-gray-600 ml-1">aluguel</span>
            </p>
          )}
        </div>
      )}
    </div>
  );

  const PropertyFooter = () => (
    <div className="space-y-3">
      {/* Proprietário e Corretor */}
      {(showOwner || showAgent) && (
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          {showOwner && property.owner && (
            <div className="flex items-center gap-1">
              <span>Proprietário:</span>
              <span className="font-medium">{property.owner.name}</span>
            </div>
          )}
          
          {showAgent && property.agent && (
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src="" alt={property.agent.name} />
                <AvatarFallback className="text-xs">
                  {property.agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{property.agent.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Data de criação */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <CalendarIcon className="h-3 w-3" />
        <span>
          Criado em {new Date(property.createdAt).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );

  const ActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onClick?.(property)}>
          <ExternalLinkIcon className="h-4 w-4 mr-2" />
          Ver Detalhes
        </DropdownMenuItem>
        
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(property)}>
            <EditIcon className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        )}
        
        {onShare && (
          <DropdownMenuItem onClick={() => onShare(property)}>
            <ShareIcon className="h-4 w-4 mr-2" />
            Compartilhar
          </DropdownMenuItem>
        )}
        
        {onFavorite && (
          <DropdownMenuItem onClick={() => onFavorite(property)}>
            <HeartIcon className="h-4 w-4 mr-2" />
            Favoritar
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {onDelete && (
          <DropdownMenuItem 
            onClick={() => onDelete(property)}
            className="text-red-600 focus:text-red-600"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ================================================
  // RENDER POR VARIANTE
  // ================================================

  if (variant === 'list') {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200",
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <PropertyImage />
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <PropertyInfo />
                {showActions && <ActionsMenu />}
              </div>
              
              <PropertyFooter />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden",
          className
        )}
        onClick={handleCardClick}
      >
        <PropertyImage />
        
        <CardContent className="p-3">
          <PropertyInfo />
        </CardContent>
        
        {showActions && (
          <CardFooter className="p-3 pt-0 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {PROPERTY_TYPE_LABELS[property.propertyType]}
            </div>
            <ActionsMenu />
          </CardFooter>
        )}
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden border-2 border-amber-200 dark:border-amber-800",
          className
        )}
        onClick={handleCardClick}
      >
        <PropertyImage />
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                  <StarIcon className="h-3 w-3 mr-1" />
                  Propriedade em Destaque
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{PROPERTY_TYPE_LABELS[property.propertyType]}</p>
            </div>
            {showActions && <ActionsMenu />}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <PropertyInfo />
        </CardContent>
        
        <CardFooter className="pt-4">
          <PropertyFooter />
        </CardFooter>
      </Card>
    );
  }

  // Variant 'default'
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden",
        className
      )}
      onClick={handleCardClick}
    >
      <PropertyImage />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{PROPERTY_TYPE_LABELS[property.propertyType]}</p>
          </div>
          {showActions && <ActionsMenu />}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <PropertyInfo />
      </CardContent>
      
      <CardFooter className="pt-4">
        <PropertyFooter />
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;