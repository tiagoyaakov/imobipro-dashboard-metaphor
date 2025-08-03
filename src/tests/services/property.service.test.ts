import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Property, PropertyType, PropertyStatus, PropertyFilters } from '@/types/supabase';

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn()
    }
  }
}));

vi.mock('@/lib/event-bus', () => ({
  EventBus: {
    getInstance: vi.fn()
  }
}));

vi.mock('@/services/base.service', () => ({
  BaseService: vi.fn()
}));

describe('PropertyService', () => {
  let propertyService: PropertyService;
  let mockSupabaseQuery: any;
  let mockEventBus: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock Supabase query chain
    mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis()
    };

    (supabase.from as any).mockReturnValue(mockSupabaseQuery);

    // Mock EventBus
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
    (EventBus.getInstance as any).mockReturnValue(mockEventBus);

    // Create service instance
    propertyService = new PropertyService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Operações CRUD Básicas', () => {
    it('deve buscar todas as propriedades com filtros', async () => {
      // Arrange
      const mockProperties = [
        {
          id: '1',
          title: 'Casa no Centro',
          type: 'HOUSE',
          status: 'AVAILABLE',
          price: 300000,
          bedrooms: 3,
          bathrooms: 2
        },
        {
          id: '2',
          title: 'Apartamento na Praia',
          type: 'APARTMENT',
          status: 'AVAILABLE',
          price: 450000,
          bedrooms: 2,
          bathrooms: 1
        }
      ];
      
      mockSupabaseQuery.mockResolvedValue({
        data: mockProperties,
        error: null,
        count: 2
      });

      const filters: PropertyFilters = {
        status: 'AVAILABLE',
        minPrice: 200000,
        maxPrice: 500000
      };

      // Act
      const result = await propertyService.getAll(filters);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('properties');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'AVAILABLE');
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('price', 200000);
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('price', 500000);
      expect(result.data).toEqual(mockProperties);
      expect(result.count).toBe(2);
    });

    it('deve buscar propriedade por ID', async () => {
      // Arrange
      const mockProperty = {
        id: '1',
        title: 'Casa no Centro',
        type: 'HOUSE',
        status: 'AVAILABLE'
      };
      
      mockSupabaseQuery.mockResolvedValue({
        data: mockProperty,
        error: null
      });

      // Act
      const result = await propertyService.getById('1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('properties');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockProperty);
    });

    it('deve criar nova propriedade', async () => {
      // Arrange
      const newProperty = {
        title: 'Nova Casa',
        description: 'Casa nova no centro',
        type: 'HOUSE' as PropertyType,
        status: 'AVAILABLE' as PropertyStatus,
        price: 350000,
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        bedrooms: 3,
        bathrooms: 2,
        area: 120.5
      };

      const mockCreatedProperty = {
        ...newProperty,
        id: '123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockCreatedProperty,
        error: null
      });

      // Act
      const result = await propertyService.create(newProperty);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('properties');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(newProperty);
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedProperty);
      expect(mockEventBus.emit).toHaveBeenCalledWith('property:created', mockCreatedProperty);
    });

    it('deve atualizar propriedade existente', async () => {
      // Arrange
      const updates = {
        title: 'Casa Atualizada',
        price: 380000
      };

      const mockUpdatedProperty = {
        id: '1',
        title: 'Casa Atualizada',
        price: 380000,
        type: 'HOUSE',
        status: 'AVAILABLE'
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockUpdatedProperty,
        error: null
      });

      // Act
      const result = await propertyService.update('1', updates);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('properties');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(updates);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedProperty);
      expect(mockEventBus.emit).toHaveBeenCalledWith('property:updated', mockUpdatedProperty);
    });

    it('deve deletar propriedade', async () => {
      // Arrange
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: null
      });

      // Act
      const result = await propertyService.delete('1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('properties');
      expect(mockSupabaseQuery.delete).toHaveBeenCalled();
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalledWith('property:deleted', { id: '1' });
    });
  });

  describe('Busca e Filtros', () => {
    it('deve aplicar filtros de texto na busca', async () => {
      // Arrange
      const filters: PropertyFilters = {
        search: 'casa centro'
      };

      mockSupabaseQuery.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      // Act
      await propertyService.getAll(filters);

      // Assert
      expect(mockSupabaseQuery.ilike).toHaveBeenCalledWith('title', '%casa%');
      expect(mockSupabaseQuery.ilike).toHaveBeenCalledWith('title', '%centro%');
    });

    it('deve aplicar filtros de tipo de propriedade', async () => {
      // Arrange
      const filters: PropertyFilters = {
        types: ['HOUSE', 'APARTMENT']
      };

      mockSupabaseQuery.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      // Act
      await propertyService.getAll(filters);

      // Assert
      expect(mockSupabaseQuery.in).toHaveBeenCalledWith('type', ['HOUSE', 'APARTMENT']);
    });

    it('deve aplicar filtros de quartos e banheiros', async () => {
      // Arrange
      const filters: PropertyFilters = {
        minBedrooms: 2,
        maxBedrooms: 4,
        minBathrooms: 1
      };

      mockSupabaseQuery.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      // Act
      await propertyService.getAll(filters);

      // Assert
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('bedrooms', 2);
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('bedrooms', 4);
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('bathrooms', 1);
    });
  });

  describe('Estatísticas', () => {
    it('deve calcular estatísticas das propriedades', async () => {
      // Arrange
      const mockProperties = [
        { status: 'AVAILABLE', price: 300000 },
        { status: 'AVAILABLE', price: 400000 },
        { status: 'SOLD', price: 350000 },
        { status: 'RESERVED', price: 450000 }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockProperties,
        error: null
      });

      // Act
      const stats = await propertyService.getStats();

      // Assert
      expect(stats).toEqual({
        total: 4,
        available: 2,
        sold: 1,
        reserved: 1,
        averagePrice: 375000,
        totalValue: 1500000
      });
    });

    it('deve retornar estatísticas vazias quando não há propriedades', async () => {
      // Arrange
      mockSupabaseQuery.mockResolvedValue({
        data: [],
        error: null
      });

      // Act
      const stats = await propertyService.getStats();

      // Assert
      expect(stats).toEqual({
        total: 0,
        available: 0,
        sold: 0,
        reserved: 0,
        averagePrice: 0,
        totalValue: 0
      });
    });
  });

  describe('Upload de Imagens', () => {
    it('deve fazer upload de imagens para o storage', async () => {
      // Arrange
      const files = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.jpg', { type: 'image/jpeg' })
      ];

      const mockStorageBucket = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'properties/123/image1.jpg' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.url/image1.jpg' }
        })
      };

      (supabase.storage.from as any).mockReturnValue(mockStorageBucket);

      // Act
      const result = await propertyService.uploadImages('123', files);

      // Assert
      expect(supabase.storage.from).toHaveBeenCalledWith('property-images');
      expect(mockStorageBucket.upload).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        'https://storage.url/image1.jpg',
        'https://storage.url/image1.jpg'
      ]);
    });

    it('deve tratar erros no upload de imagens', async () => {
      // Arrange
      const files = [new File(['image1'], 'image1.jpg', { type: 'image/jpeg' })];

      const mockStorageBucket = {
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' }
        })
      };

      (supabase.storage.from as any).mockReturnValue(mockStorageBucket);

      // Act & Assert
      await expect(propertyService.uploadImages('123', files))
        .rejects.toThrow('Upload failed');
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao buscar propriedades', async () => {
      // Arrange
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error', details: 'Connection failed' }
      });

      // Act & Assert
      await expect(propertyService.getAll())
        .rejects.toThrow('Database error: Connection failed');
    });

    it('deve tratar erro ao criar propriedade', async () => {
      // Arrange
      const newProperty = {
        title: 'Nova Casa',
        type: 'HOUSE' as PropertyType,
        status: 'AVAILABLE' as PropertyStatus,
        price: 350000
      };

      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: { message: 'Validation error', details: 'Missing required fields' }
      });

      // Act & Assert
      await expect(propertyService.create(newProperty))
        .rejects.toThrow('Validation error: Missing required fields');
    });
  });

  describe('Eventos', () => {
    it('deve emitir evento ao criar propriedade', async () => {
      // Arrange
      const newProperty = {
        title: 'Nova Casa',
        type: 'HOUSE' as PropertyType,
        status: 'AVAILABLE' as PropertyStatus,
        price: 350000
      };

      const mockCreatedProperty = { ...newProperty, id: '123' };
      mockSupabaseQuery.mockResolvedValue({
        data: mockCreatedProperty,
        error: null
      });

      // Act
      await propertyService.create(newProperty);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('property:created', mockCreatedProperty);
    });

    it('deve emitir evento ao atualizar propriedade', async () => {
      // Arrange
      const updates = { title: 'Casa Atualizada' };
      const mockUpdatedProperty = { id: '1', ...updates };
      
      mockSupabaseQuery.mockResolvedValue({
        data: mockUpdatedProperty,
        error: null
      });

      // Act
      await propertyService.update('1', updates);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('property:updated', mockUpdatedProperty);
    });

    it('deve emitir evento ao deletar propriedade', async () => {
      // Arrange
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: null
      });

      // Act
      await propertyService.delete('1');

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('property:deleted', { id: '1' });
    });
  });

  describe('Integração com BaseService', () => {
    it('deve herdar validações de RLS do BaseService', () => {
      // Assert
      expect(propertyService).toBeInstanceOf(PropertyService);
      expect(BaseService).toHaveBeenCalledWith('properties');
    });
  });
});