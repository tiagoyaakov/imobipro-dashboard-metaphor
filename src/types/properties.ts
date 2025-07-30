// ================================================
// TIPOS TYPESCRIPT - MÓDULO PROPRIEDADES
// ================================================
// Data: 30/01/2025
// Descrição: Definições de tipos para o módulo de propriedades
// Baseado em: Dados Viva Real e estrutura do banco de dados
// ================================================

// ================================================
// ENUMS
// ================================================

export enum PropertyCategory {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL', 
  INDUSTRIAL = 'INDUSTRIAL',
  RURAL = 'RURAL',
  MIXED_USE = 'MIXED_USE'
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  COMMERCIAL_BUILDING = 'COMMERCIAL_BUILDING',
  OFFICE = 'OFFICE',
  RETAIL = 'RETAIL',
  WAREHOUSE = 'WAREHOUSE',
  LAND = 'LAND',
  STUDIO = 'STUDIO',
  PENTHOUSE = 'PENTHOUSE',
  DUPLEX = 'DUPLEX',
  LOFT = 'LOFT',
  FARM = 'FARM',
  OTHER = 'OTHER'
}

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  OFF_MARKET = 'OFF_MARKET',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  MAINTENANCE = 'MAINTENANCE'
}

export enum PropertySource {
  MANUAL = 'MANUAL',
  VIVA_REAL = 'VIVA_REAL',
  ZAP = 'ZAP',
  OLX = 'OLX',
  API_IMPORT = 'API_IMPORT',
  BULK_IMPORT = 'BULK_IMPORT'
}

export enum PropertyListingType {
  SALE = 'SALE',
  RENT = 'RENT',
  BOTH = 'BOTH'
}

export enum PropertyCondition {
  NEW = 'NEW',
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  NEEDS_RENOVATION = 'NEEDS_RENOVATION'
}

// ================================================
// INTERFACES PRINCIPAIS
// ================================================

export interface PropertyOwner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  properties?: Property[];
}

export interface Property {
  id: string;
  companyId: string;
  agentId?: string;
  ownerId?: string;
  
  // Informações básicas
  title: string;
  description?: string;
  category: PropertyCategory;
  propertyType: PropertyType;
  status: PropertyStatus;
  listingType: PropertyListingType;
  condition?: PropertyCondition;
  
  // Preços
  salePrice?: number;
  rentPrice?: number;
  condominiumFee?: number;
  iptuPrice?: number;
  currencySymbol?: string;
  
  // Dimensões e características
  totalArea?: number;
  builtArea?: number;
  usefulArea?: number;
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parkingSpaces: number;
  floors: number;
  floor?: number;
  units: number;
  yearBuilt?: number;
  
  // Localização
  address: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  geolocationPrecision?: string;
  
  // Integração Viva Real
  vivaRealId?: string;
  vivaRealListingId?: string;
  vivaRealUrl?: string;
  externalId?: string;
  source: PropertySource;
  isDevelopmentUnit: boolean;
  
  // Features e amenidades
  features: string[];
  amenities: string[];
  
  // Metadados
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  favoriteCount: number;
  lastSyncAt?: string;
  syncError?: string;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  owner?: PropertyOwner;
  agent?: {
    id: string;
    name: string;
    email: string;
  };
  images?: PropertyImage[];
  vivaRealData?: PropertyVivaRealData;
  appointments?: PropertyAppointment[];
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
  description?: string;
  order: number;
  isMain: boolean;
  isActive: boolean;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export interface PropertyVivaRealData {
  id: string;
  propertyId: string;
  listingId?: string;
  developmentId?: string;
  unitId?: string;
  buildingId?: string;
  zoneName?: string;
  stateNormalized?: string;
  thumbnails: string[];
  originalData?: Record<string, any>;
  vivaRealViews: number;
  vivaRealLeads: number;
  vivaRealFavorites: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertySyncLog {
  id: string;
  propertyId?: string;
  source: PropertySource;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'FETCH';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errorMessage?: string;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
  executionTime?: number;
  createdAt: string;
}

export interface PropertyAppointment {
  id: string;
  propertyId: string;
  appointmentId: string;
  visitType?: string;
  notes?: string;
  createdAt: string;
  
  // Relacionamentos
  property?: Property;
  appointment?: {
    id: string;
    scheduledFor: string;
    type: string;
    status: string;
  };
}

// ================================================
// TIPOS PARA FORMULÁRIOS E UI
// ================================================

export interface PropertyFormData {
  // Informações básicas
  title: string;
  description?: string;
  category: PropertyCategory;
  propertyType: PropertyType;
  status: PropertyStatus;
  listingType: PropertyListingType;
  condition?: PropertyCondition;
  
  // Preços
  salePrice?: number;
  rentPrice?: number;
  condominiumFee?: number;
  iptuPrice?: number;
  
  // Dimensões
  totalArea?: number;
  builtArea?: number;
  usefulArea?: number;
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parkingSpaces: number;
  floors: number;
  floor?: number;
  yearBuilt?: number;
  
  // Localização
  address: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Features
  features: string[];
  amenities: string[];
  
  // Proprietário
  ownerId?: string;
  ownerData?: Omit<PropertyOwner, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>;
  
  // Metadados
  isFeatured: boolean;
  notes?: string;
}

export interface PropertyOwnerFormData {
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

// ================================================
// TIPOS PARA FILTROS E BUSCA
// ================================================

export interface PropertyFilters {
  // Filtros básicos
  category?: PropertyCategory[];
  propertyType?: PropertyType[];
  status?: PropertyStatus[];
  listingType?: PropertyListingType[];
  
  // Filtros de preço
  minSalePrice?: number;
  maxSalePrice?: number;
  minRentPrice?: number;
  maxRentPrice?: number;
  
  // Filtros de características
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minParkingSpaces?: number;
  hasBalcony?: boolean;
  
  // Filtros de localização
  city?: string;
  neighborhood?: string[];
  state?: string;
  
  // Filtros de área
  minTotalArea?: number;
  maxTotalArea?: number;
  minBuiltArea?: number;
  maxBuiltArea?: number;
  
  // Filtros especiais
  isFeatured?: boolean;
  hasImages?: boolean;
  source?: PropertySource[];
  agentId?: string;
  ownerId?: string;
  
  // Features específicas
  features?: string[];
  amenities?: string[];
  
  // Filtros de data
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  
  // Busca por proximidade
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface PropertySearchParams {
  query?: string;
  filters?: PropertyFilters;
  sortBy?: 'createdAt' | 'updatedAt' | 'price' | 'area' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PropertySearchResult {
  properties: Property[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ================================================
// TIPOS PARA INTEGRAÇÕES
// ================================================

export interface VivaRealProperty {
  idx: number;
  id: number;
  listing_id: string;
  imagens: string[];
  tipo_categoria: string;
  tipo_imovel: string;
  descricao: string;
  preco: string;
  tamanho_m2: string;
  quartos: number;
  banheiros: number;
  ano_construcao: number;
  suite: number;
  garagem: number;
  features: string[];
  andar?: number;
  blocos?: number;
  cidade: string;
  bairro: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  cep: string;
}

export interface VivaRealSyncOptions {
  syncImages?: boolean;
  updateExisting?: boolean;
  onProgress?: (progress: number, message: string) => void;
  onError?: (error: string) => void;
  onSuccess?: (count: number) => void;
}

// ================================================
// TIPOS PARA DASHBOARD E MÉTRICAS
// ================================================

export interface PropertyMetrics {
  totalProperties: number;
  activeProperties: number;
  featuredProperties: number;
  availableForSale: number;
  availableForRent: number;
  soldThisMonth: number;
  rentedThisMonth: number;
  averageSalePrice: number;
  averageRentPrice: number;
  totalViews: number;
  totalFavorites: number;
  propertiesByType: Record<PropertyType, number>;
  propertiesByStatus: Record<PropertyStatus, number>;
  propertiesByCity: Record<string, number>;
  recentActivity: {
    created: number;
    updated: number;
    viewed: number;
  }[];
}

export interface PropertyAnalytics {
  viewsPerProperty: {
    propertyId: string;
    title: string;
    views: number;
  }[];
  favoritesPerProperty: {
    propertyId: string; 
    title: string;
    favorites: number;
  }[];
  performanceByAgent: {
    agentId: string;
    agentName: string;
    totalProperties: number;
    activeListing: number;
    soldCount: number;
    rentedCount: number;
  }[];
  priceRangeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

// ================================================
// TIPOS PARA COMPONENTES
// ================================================

export interface PropertyListItemProps {
  property: Property;
  onClick?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onFavorite?: (property: Property) => void;
  showActions?: boolean;
  showOwner?: boolean;
  showAgent?: boolean;
}

export interface PropertyCardProps extends PropertyListItemProps {
  variant?: 'default' | 'compact' | 'featured';
  showPrices?: boolean;
  showFeatures?: boolean;
  maxFeatures?: number;
}

export interface PropertyFilterProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onReset: () => void;
  availableFilters?: {
    categories?: PropertyCategory[];
    types?: PropertyType[];
    cities?: string[];
    neighborhoods?: string[];
    agents?: { id: string; name: string }[];
    owners?: { id: string; name: string }[];
  };
}

// ================================================
// CONSTANTES E HELPERS
// ================================================

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  [PropertyCategory.RESIDENTIAL]: 'Residencial',
  [PropertyCategory.COMMERCIAL]: 'Comercial',
  [PropertyCategory.INDUSTRIAL]: 'Industrial',
  [PropertyCategory.RURAL]: 'Rural',
  [PropertyCategory.MIXED_USE]: 'Uso Misto'
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartamento',
  [PropertyType.HOUSE]: 'Casa',
  [PropertyType.COMMERCIAL_BUILDING]: 'Prédio Comercial',
  [PropertyType.OFFICE]: 'Escritório',
  [PropertyType.RETAIL]: 'Loja',
  [PropertyType.WAREHOUSE]: 'Galpão',
  [PropertyType.LAND]: 'Terreno',
  [PropertyType.STUDIO]: 'Studio',
  [PropertyType.PENTHOUSE]: 'Cobertura',
  [PropertyType.DUPLEX]: 'Duplex',
  [PropertyType.LOFT]: 'Loft',
  [PropertyType.FARM]: 'Fazenda',
  [PropertyType.OTHER]: 'Outro'
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  [PropertyStatus.AVAILABLE]: 'Disponível',
  [PropertyStatus.RESERVED]: 'Reservado',
  [PropertyStatus.SOLD]: 'Vendido',
  [PropertyStatus.RENTED]: 'Alugado',
  [PropertyStatus.OFF_MARKET]: 'Fora do Mercado',
  [PropertyStatus.UNDER_CONSTRUCTION]: 'Em Construção',
  [PropertyStatus.MAINTENANCE]: 'Manutenção'
};

export const PROPERTY_CONDITION_LABELS: Record<PropertyCondition, string> = {
  [PropertyCondition.NEW]: 'Novo',
  [PropertyCondition.EXCELLENT]: 'Excelente',
  [PropertyCondition.GOOD]: 'Bom',
  [PropertyCondition.FAIR]: 'Regular',
  [PropertyCondition.NEEDS_RENOVATION]: 'Precisa Reforma'
};

export const LISTING_TYPE_LABELS: Record<PropertyListingType, string> = {
  [PropertyListingType.SALE]: 'Venda',
  [PropertyListingType.RENT]: 'Aluguel',
  [PropertyListingType.BOTH]: 'Venda e Aluguel'
};

// Features comuns baseadas nos dados do Viva Real
export const COMMON_FEATURES = [
  'Maid\'s Quarters', 'Kitchen', 'Parking Garage', 'Dinner Room', 
  'Balcony', 'Gym', 'Gourmet Area', 'BBQ', 'Elevator', 'Pool', 
  'Playground', 'Media Room', 'Party Room', 'Garden', 'Furnished',
  'Air Conditioning', 'Heating', 'Security System', 'Intercom',
  'Laundry Room', 'Storage', 'Office', 'Walk-in Closet'
];

export const COMMON_AMENITIES = [
  'Piscina', 'Academia', 'Churrasqueira', 'Playground', 'Salão de Festas',
  'Portaria 24h', 'CCTV', 'Elevador', 'Jardim', 'Quadra Poliesportiva',
  'Sauna', 'Spa', 'Coworking', 'Bicicletário', 'Pet Place', 'Lavanderia',
  'Espaço Gourmet', 'Redário', 'Espaço Zen', 'Quiosque'
];

// Estados brasileiros
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// ================================================
// TIPOS PARA VALIDAÇÃO
// ================================================

export interface PropertyValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PropertyValidationResult {
  isValid: boolean;
  errors: PropertyValidationError[];
  warnings?: PropertyValidationError[];
}

// ================================================
// EXPORT DEFAULT
// ================================================

export default {
  PropertyCategory,
  PropertyType,
  PropertyStatus,
  PropertySource,
  PropertyListingType,
  PropertyCondition,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_CONDITION_LABELS,
  LISTING_TYPE_LABELS,
  COMMON_FEATURES,
  COMMON_AMENITIES,
  BRAZILIAN_STATES
};