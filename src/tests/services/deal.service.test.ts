import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DealService } from '@/services/deal.service';
import { BaseService } from '@/services/base.service';
import { supabase } from '@/integrations/supabase/client';
import { EventBus } from '@/lib/event-bus';
import type { Deal, DealStage, DealFilters, DealMetrics } from '@/types/supabase';

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
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

describe('DealService', () => {
  let dealService: DealService;
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
    dealService = new DealService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Operações CRUD Básicas', () => {
    it('deve buscar todos os negócios com filtros', async () => {
      // Arrange
      const mockDeals = [
        {
          id: '1',
          title: 'Venda Apartamento Centro',
          value: 450000,
          stage: 'PROPOSAL',
          status: 'ACTIVE',
          expectedCloseDate: '2025-08-15T00:00:00Z',
          probability: 0.7,
          propertyId: 'property1',
          clientId: 'contact1',
          agentId: 'agent1'
        },
        {
          id: '2',
          title: 'Locação Casa Jardins',
          value: 3500,
          stage: 'NEGOTIATION',
          status: 'ACTIVE',
          expectedCloseDate: '2025-08-10T00:00:00Z',
          probability: 0.9,
          propertyId: 'property2',
          clientId: 'contact2',
          agentId: 'agent1'
        }
      ];
      
      mockSupabaseQuery.mockResolvedValue({
        data: mockDeals,
        error: null,
        count: 2
      });

      const filters: DealFilters = {
        agentId: 'agent1',
        stage: 'PROPOSAL',
        minValue: 400000,
        status: 'ACTIVE'
      };

      // Act
      const result = await dealService.getAll(filters);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('agentId', 'agent1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('stage', 'PROPOSAL');
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('value', 400000);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'ACTIVE');
      expect(result.data).toEqual(mockDeals);
      expect(result.count).toBe(2);
    });

    it('deve criar novo negócio com probabilidade automática', async () => {
      // Arrange
      const newDeal = {
        title: 'Nova Venda',
        value: 350000,
        stage: 'LEAD_IN' as DealStage,
        status: 'ACTIVE',
        expectedCloseDate: '2025-09-01T00:00:00Z',
        propertyId: 'property1',
        clientId: 'contact1',
        agentId: 'agent1'
      };

      const mockCreatedDeal = {
        ...newDeal,
        id: '123',
        probability: 0.2, // Probabilidade calculada automaticamente para LEAD_IN
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockCreatedDeal,
        error: null
      });

      // Act
      const result = await dealService.create(newDeal);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newDeal,
          probability: expect.any(Number)
        })
      );
      expect(result).toEqual(mockCreatedDeal);
      expect(mockEventBus.emit).toHaveBeenCalledWith('deal:created', mockCreatedDeal);
    });

    it('deve atualizar estágio do negócio e recalcular probabilidade', async () => {
      // Arrange
      const dealId = '1';
      const updates = {
        stage: 'NEGOTIATION' as DealStage
      };

      const mockUpdatedDeal = {
        id: dealId,
        title: 'Venda Apartamento',
        stage: 'NEGOTIATION',
        probability: 0.8, // Probabilidade recalculada
        value: 450000
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockUpdatedDeal,
        error: null
      });

      // Act
      const result = await dealService.update(dealId, updates);

      // Assert
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'NEGOTIATION',
          probability: expect.any(Number)
        })
      );
      expect(result).toEqual(mockUpdatedDeal);
      expect(mockEventBus.emit).toHaveBeenCalledWith('deal:updated', mockUpdatedDeal);
      expect(mockEventBus.emit).toHaveBeenCalledWith('deal:stage:changed', {
        dealId,
        newStage: 'NEGOTIATION',
        probability: 0.8
      });
    });
  });

  describe('Pipeline de Vendas', () => {
    it('deve buscar pipeline por agente', async () => {
      // Arrange
      const agentId = 'agent1';
      const mockPipelineData = [
        { stage: 'LEAD_IN', count: 5, totalValue: 1000000 },
        { stage: 'QUALIFICATION', count: 3, totalValue: 750000 },
        { stage: 'PROPOSAL', count: 2, totalValue: 600000 },
        { stage: 'NEGOTIATION', count: 1, totalValue: 400000 }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: [
          { stage: 'LEAD_IN', value: 200000 },
          { stage: 'LEAD_IN', value: 300000 },
          { stage: 'LEAD_IN', value: 500000 },
          { stage: 'QUALIFICATION', value: 250000 },
          { stage: 'QUALIFICATION', value: 500000 },
          { stage: 'PROPOSAL', value: 300000 },
          { stage: 'PROPOSAL', value: 300000 },
          { stage: 'NEGOTIATION', value: 400000 }
        ],
        error: null
      });

      // Act
      const pipeline = await dealService.getPipeline(agentId);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('agentId', agentId);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'ACTIVE');
      
      expect(pipeline).toEqual({
        stages: {
          LEAD_IN: { count: 3, totalValue: 1000000, averageValue: 333333.33 },
          QUALIFICATION: { count: 2, totalValue: 750000, averageValue: 375000 },
          PROPOSAL: { count: 2, totalValue: 600000, averageValue: 300000 },
          NEGOTIATION: { count: 1, totalValue: 400000, averageValue: 400000 },
          WON: { count: 0, totalValue: 0, averageValue: 0 },
          LOST: { count: 0, totalValue: 0, averageValue: 0 }
        },
        totalDeals: 8,
        totalValue: 2750000,
        averageDealSize: 343750
      });
    });

    it('deve mover negócio para próximo estágio', async () => {
      // Arrange
      const dealId = '1';
      const currentStage = 'PROPOSAL';
      const nextStage = 'NEGOTIATION';

      const mockDeal = {
        id: dealId,
        stage: currentStage,
        probability: 0.6
      };

      const mockUpdatedDeal = {
        ...mockDeal,
        stage: nextStage,
        probability: 0.8
      };

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: mockDeal, error: null }) // Get current
        .mockResolvedValueOnce({ data: mockUpdatedDeal, error: null }); // Update

      // Act
      const result = await dealService.moveToNextStage(dealId);

      // Assert
      expect(result.stage).toBe(nextStage);
      expect(result.probability).toBe(0.8);
      expect(mockEventBus.emit).toHaveBeenCalledWith('deal:stage:changed', {
        dealId,
        oldStage: currentStage,
        newStage: nextStage,
        probability: 0.8
      });
    });

    it('deve calcular tempo médio no estágio', async () => {
      // Arrange
      const stage = 'PROPOSAL';
      const mockStageHistory = [
        {
          dealId: '1',
          enteredAt: '2025-08-01T00:00:00Z',
          leftAt: '2025-08-05T00:00:00Z'
        },
        {
          dealId: '2',
          enteredAt: '2025-08-02T00:00:00Z',
          leftAt: '2025-08-04T00:00:00Z'
        },
        {
          dealId: '3',
          enteredAt: '2025-08-03T00:00:00Z',
          leftAt: null // Still in stage
        }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockStageHistory,
        error: null
      });

      // Act
      const avgTime = await dealService.getAverageTimeInStage(stage);

      // Assert
      expect(avgTime).toBe(3); // (4 days + 2 days) / 2 = 3 days average
    });
  });

  describe('Previsão de Fechamento com IA', () => {
    it('deve calcular probabilidade baseada em fatores', () => {
      // Arrange
      const dealData = {
        stage: 'NEGOTIATION',
        value: 500000,
        daysInStage: 5,
        contactScore: 85,
        propertyType: 'APARTMENT',
        agentExperience: 3,
        marketConditions: 'good',
        clientBudget: 600000,
        competitionLevel: 'medium'
      };

      // Act
      const probability = dealService.calculateProbability(dealData);

      // Assert
      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThanOrEqual(1);
      expect(probability).toBeGreaterThan(0.7); // Should be high for good conditions
    });

    it('deve calcular data esperada de fechamento', () => {
      // Arrange
      const deal = {
        stage: 'PROPOSAL',
        createdAt: '2025-08-01T00:00:00Z',
        value: 400000,
        probability: 0.7
      };

      const historicalData = {
        averageTimeInStage: {
          PROPOSAL: 7, // days
          NEGOTIATION: 5
        },
        conversionRate: 0.6
      };

      // Act
      const expectedDate = dealService.calculateExpectedCloseDate(deal, historicalData);

      // Assert
      expect(expectedDate).toBeInstanceOf(Date);
      expect(expectedDate.getTime()).toBeGreaterThan(new Date('2025-08-01').getTime());
    });

    it('deve identificar negócios em risco', async () => {
      // Arrange
      const mockDeals = [
        {
          id: '1',
          stage: 'PROPOSAL',
          daysInStage: 14, // Muito tempo
          lastActivity: '2025-07-20T00:00:00Z', // Sem atividade recente
          probability: 0.3, // Baixa probabilidade
          expectedCloseDate: '2025-08-01T00:00:00Z' // Data passou
        },
        {
          id: '2',
          stage: 'NEGOTIATION',
          daysInStage: 3,
          lastActivity: '2025-08-02T00:00:00Z',
          probability: 0.8,
          expectedCloseDate: '2025-08-10T00:00:00Z'
        }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockDeals,
        error: null
      });

      // Act
      const riskyDeals = await dealService.getDealsAtRisk();

      // Assert
      expect(riskyDeals).toContain(
        expect.objectContaining({
          id: '1',
          riskFactors: expect.arrayContaining([
            'Muito tempo no estágio',
            'Sem atividade recente',
            'Baixa probabilidade',
            'Data esperada passou'
          ])
        })
      );
      expect(riskyDeals).not.toContain(
        expect.objectContaining({ id: '2' })
      );
    });
  });

  describe('Métricas de Conversão', () => {
    it('deve calcular taxa de conversão por estágio', async () => {
      // Arrange
      const mockDeals = [
        { stage: 'LEAD_IN', finalStage: 'WON' },
        { stage: 'LEAD_IN', finalStage: 'LOST' },
        { stage: 'LEAD_IN', finalStage: 'WON' },
        { stage: 'QUALIFICATION', finalStage: 'WON' },
        { stage: 'QUALIFICATION', finalStage: 'LOST' },
        { stage: 'PROPOSAL', finalStage: 'WON' }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockDeals,
        error: null
      });

      // Act
      const conversionRates = await dealService.getConversionRates();

      // Assert
      expect(conversionRates).toEqual({
        LEAD_IN: {
          total: 3,
          won: 2,
          lost: 1,
          rate: 0.67
        },
        QUALIFICATION: {
          total: 2,
          won: 1,
          lost: 1,
          rate: 0.5
        },
        PROPOSAL: {
          total: 1,
          won: 1,
          lost: 0,
          rate: 1.0
        },
        overall: {
          total: 6,
          won: 4,
          lost: 2,
          rate: 0.67
        }
      });
    });

    it('deve calcular métricas de performance do agente', async () => {
      // Arrange
      const agentId = 'agent1';
      const period = { start: '2025-08-01', end: '2025-08-31' };

      const mockDeals = [
        { value: 400000, stage: 'WON', closedAt: '2025-08-15T00:00:00Z' },
        { value: 300000, stage: 'WON', closedAt: '2025-08-20T00:00:00Z' },
        { value: 500000, stage: 'LOST', closedAt: '2025-08-25T00:00:00Z' },
        { value: 200000, stage: 'PROPOSAL', closedAt: null }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockDeals,
        error: null
      });

      // Act
      const metrics = await dealService.getAgentMetrics(agentId, period);

      // Assert
      expect(metrics).toEqual({
        totalDeals: 4,
        wonDeals: 2,
        lostDeals: 1,
        activeDeals: 1,
        totalValue: 1400000,
        wonValue: 700000,
        lostValue: 500000,
        activeValue: 200000,
        conversionRate: 0.67, // 2 won / 3 closed
        averageDealSize: 350000,
        averageWonDealSize: 350000
      });
    });
  });

  describe('Análise de Tendências', () => {
    it('deve analisar tendências mensais', async () => {
      // Arrange
      const mockMonthlyData = [
        { month: '2025-06', deals: 10, value: 2000000, won: 6 },
        { month: '2025-07', deals: 12, value: 2400000, won: 8 },
        { month: '2025-08', deals: 15, value: 3000000, won: 10 }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: [
          // June deals
          ...Array(10).fill({ createdAt: '2025-06-15', value: 200000 }),
          // July deals
          ...Array(12).fill({ createdAt: '2025-07-15', value: 200000 }),
          // August deals
          ...Array(15).fill({ createdAt: '2025-08-15', value: 200000 })
        ],
        error: null
      });

      // Act
      const trends = await dealService.getTrends('monthly', 3);

      // Assert
      expect(trends).toEqual({
        periods: ['2025-06', '2025-07', '2025-08'],
        dealCount: [10, 12, 15],
        totalValue: [2000000, 2400000, 3000000],
        averageValue: [200000, 200000, 200000],
        growth: {
          dealCount: 0.5, // 50% growth
          totalValue: 0.5,
          averageValue: 0
        }
      });
    });

    it('deve identificar padrões sazonais', async () => {
      // Arrange
      const mockSeasonalData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        dealCount: Math.floor(Math.random() * 20) + 10,
        value: Math.floor(Math.random() * 1000000) + 500000
      }));

      mockSupabaseQuery.mockResolvedValue({
        data: mockSeasonalData.map(d => ({
          createdAt: `2025-${d.month.toString().padStart(2, '0')}-15`,
          value: d.value
        })),
        error: null
      });

      // Act
      const patterns = await dealService.getSeasonalPatterns();

      // Assert
      expect(patterns).toHaveProperty('bestMonth');
      expect(patterns).toHaveProperty('worstMonth');
      expect(patterns).toHaveProperty('averageByMonth');
      expect(patterns.averageByMonth).toHaveLength(12);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao buscar negócios', async () => {
      // Arrange
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error', details: 'Connection failed' }
      });

      // Act & Assert
      await expect(dealService.getAll())
        .rejects.toThrow('Database error: Connection failed');
    });

    it('deve validar dados antes de criar negócio', async () => {
      // Arrange
      const invalidDeal = {
        title: '', // Título obrigatório
        value: -1000, // Valor inválido
        stage: 'INVALID_STAGE' as DealStage,
        agentId: '',
        clientId: ''
      };

      // Act & Assert
      await expect(dealService.create(invalidDeal))
        .rejects.toThrow('Dados inválidos');
    });
  });

  describe('Eventos e Histórico', () => {
    it('deve registrar histórico de mudanças de estágio', async () => {
      // Arrange
      const dealId = '1';
      const oldStage = 'PROPOSAL';
      const newStage = 'NEGOTIATION';

      const mockDeal = {
        id: dealId,
        stage: oldStage
      };

      const mockUpdatedDeal = {
        ...mockDeal,
        stage: newStage,
        probability: 0.8
      };

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: mockDeal, error: null })
        .mockResolvedValueOnce({ data: mockUpdatedDeal, error: null })
        .mockResolvedValueOnce({ data: null, error: null }); // Insert history

      // Act
      await dealService.update(dealId, { stage: newStage });

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('deal:stage:changed', {
        dealId,
        oldStage,
        newStage,
        probability: 0.8
      });
    });

    it('deve emitir alerta para negócios em risco', async () => {
      // Arrange
      const riskyDeal = {
        id: '1',
        title: 'Deal em Risco',
        daysInStage: 30,
        lastActivity: '2025-07-01T00:00:00Z',
        probability: 0.2
      };

      // Act
      dealService.checkDealRisk(riskyDeal);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('deal:risk:high', {
        dealId: riskyDeal.id,
        riskLevel: 'HIGH',
        factors: expect.arrayContaining([
          'Muito tempo no estágio',
          'Sem atividade recente',
          'Baixa probabilidade'
        ])
      });
    });
  });
});