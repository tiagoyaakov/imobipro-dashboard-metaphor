import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContactService } from '@/services/contact.service';
import { BaseService } from '@/services/base.service';
import { supabase } from '@/integrations/supabase/client';
import { EventBus } from '@/lib/event-bus';
import type { 
  Contact, 
  ContactCategory, 
  ContactStatus, 
  LeadStage, 
  ContactFilters,
  LeadActivity,
  LeadSource 
} from '@/types/supabase';

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

describe('ContactService', () => {
  let contactService: ContactService;
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
    contactService = new ContactService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Operações CRUD Básicas', () => {
    it('deve buscar todos os contatos com filtros', async () => {
      // Arrange
      const mockContacts = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          category: 'LEAD',
          status: 'NEW',
          leadStage: 'NEW',
          leadScore: 75
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '11888888888',
          category: 'CLIENT',
          status: 'ACTIVE',
          leadStage: 'CONVERTED',
          leadScore: 95
        }
      ];
      
      mockSupabaseQuery.mockResolvedValue({
        data: mockContacts,
        error: null,
        count: 2
      });

      const filters: ContactFilters = {
        category: 'LEAD',
        leadStage: 'NEW'
      };

      // Act
      const result = await contactService.getAll(filters);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('category', 'LEAD');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('leadStage', 'NEW');
      expect(result.data).toEqual(mockContacts);
      expect(result.count).toBe(2);
    });

    it('deve buscar contato por ID', async () => {
      // Arrange
      const mockContact = {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        category: 'LEAD'
      };
      
      mockSupabaseQuery.mockResolvedValue({
        data: mockContact,
        error: null
      });

      // Act
      const result = await contactService.getById('1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockContact);
    });

    it('deve criar novo contato com scoring automático', async () => {
      // Arrange
      const newContact = {
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        phone: '11777777777',
        category: 'LEAD' as ContactCategory,
        status: 'NEW' as ContactStatus,
        leadStage: 'NEW' as LeadStage,
        company: 'TechCorp',
        budget: 500000
      };

      const mockCreatedContact = {
        ...newContact,
        id: '123',
        leadScore: 85, // Score calculado automaticamente
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockCreatedContact,
        error: null
      });

      // Act
      const result = await contactService.create(newContact);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newContact,
          leadScore: expect.any(Number)
        })
      );
      expect(result).toEqual(mockCreatedContact);
      expect(mockEventBus.emit).toHaveBeenCalledWith('contact:created', mockCreatedContact);
    });

    it('deve atualizar contato e recalcular score', async () => {
      // Arrange
      const updates = {
        company: 'NewCorp',
        budget: 800000,
        leadStage: 'QUALIFIED' as LeadStage
      };

      const mockUpdatedContact = {
        id: '1',
        name: 'João Silva',
        ...updates,
        leadScore: 90 // Score recalculado
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockUpdatedContact,
        error: null
      });

      // Act
      const result = await contactService.update('1', updates);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          leadScore: expect.any(Number)
        })
      );
      expect(result).toEqual(mockUpdatedContact);
      expect(mockEventBus.emit).toHaveBeenCalledWith('contact:updated', mockUpdatedContact);
    });
  });

  describe('Sistema de Lead Scoring', () => {
    it('deve calcular score alto para lead qualificado', () => {
      // Arrange
      const qualifiedLead = {
        email: 'test@email.com',
        phone: '11999999999',
        company: 'TechCorp',
        budget: 1000000,
        timeline: 'Em até 3 meses',
        leadSource: 'Indicação',
        interactionCount: 5,
        responseRate: 0.8
      };

      // Act
      const score = contactService.calculateLeadScore(qualifiedLead);

      // Assert
      expect(score).toBeGreaterThan(80); // Score alto
    });

    it('deve calcular score baixo para lead não qualificado', () => {
      // Arrange
      const unqualifiedLead = {
        email: null,
        phone: null,
        company: null,
        budget: null,
        timeline: null,
        leadSource: 'Site',
        interactionCount: 0,
        responseRate: 0
      };

      // Act
      const score = contactService.calculateLeadScore(unqualifiedLead);

      // Assert
      expect(score).toBeLessThan(30); // Score baixo
    });

    it('deve calcular score médio para lead parcialmente qualificado', () => {
      // Arrange
      const partialLead = {
        email: 'test@email.com',
        phone: '11999999999',
        company: null,
        budget: 300000,
        timeline: null,
        leadSource: 'Google',
        interactionCount: 2,
        responseRate: 0.5
      };

      // Act
      const score = contactService.calculateLeadScore(partialLead);

      // Assert
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThanOrEqual(70);
    });
  });

  describe('Segmentação de Contatos', () => {
    it('deve segmentar leads por score', async () => {
      // Arrange
      const mockContacts = [
        { id: '1', leadScore: 90, category: 'LEAD' },
        { id: '2', leadScore: 60, category: 'LEAD' },
        { id: '3', leadScore: 30, category: 'LEAD' },
        { id: '4', leadScore: 85, category: 'CLIENT' }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockContacts,
        error: null
      });

      // Act
      const segments = await contactService.getSegmentation();

      // Assert
      expect(segments).toEqual({
        hotLeads: 1,      // Score >= 80 e LEAD
        warmLeads: 1,     // Score 50-79 e LEAD
        coldLeads: 1,     // Score < 50 e LEAD
        clients: 1,       // Categoria CLIENT
        totalLeads: 3,
        totalClients: 1
      });
    });

    it('deve aplicar filtros de segmentação', async () => {
      // Arrange
      const criteria = {
        scoreMin: 70,
        scoreMax: 90,
        leadStages: ['QUALIFIED', 'INTERESTED'],
        hasEmail: true
      };

      mockSupabaseQuery.mockResolvedValue({
        data: [],
        error: null
      });

      // Act
      await contactService.getBySegmentation(criteria);

      // Assert
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('leadScore', 70);
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('leadScore', 90);
      expect(mockSupabaseQuery.in).toHaveBeenCalledWith('leadStage', ['QUALIFIED', 'INTERESTED']);
      expect(mockSupabaseQuery.neq).toHaveBeenCalledWith('email', null);
    });
  });

  describe('Histórico de Atividades', () => {
    it('deve registrar atividade ao criar contato', async () => {
      // Arrange
      const newContact = {
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        category: 'LEAD' as ContactCategory
      };

      const mockCreatedContact = {
        ...newContact,
        id: '123',
        leadScore: 50
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockCreatedContact,
        error: null
      });

      // Act
      await contactService.create(newContact);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('contact:created', mockCreatedContact);
    });

    it('deve registrar mudança de estágio', async () => {
      // Arrange
      const oldStage = 'NEW';
      const newStage = 'QUALIFIED';
      
      const updates = {
        leadStage: newStage as LeadStage
      };

      const mockUpdatedContact = {
        id: '1',
        name: 'João Silva',
        leadStage: newStage,
        leadScore: 75
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockUpdatedContact,
        error: null
      });

      // Act
      await contactService.update('1', updates);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('contact:updated', mockUpdatedContact);
      expect(mockEventBus.emit).toHaveBeenCalledWith('contact:stage:changed', {
        contactId: '1',
        oldStage,
        newStage,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Importação em Lote', () => {
    it('deve importar múltiplos contatos com validação', async () => {
      // Arrange
      const contactsData = [
        {
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          category: 'LEAD'
        },
        {
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '11888888888',
          category: 'CLIENT'
        },
        {
          name: '', // Inválido - sem nome
          email: 'invalid',
          phone: '123',
          category: 'LEAD'
        }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: [
          { id: '1', ...contactsData[0], leadScore: 60 },
          { id: '2', ...contactsData[1], leadScore: 80 }
        ],
        error: null
      });

      // Act
      const result = await contactService.bulkImport(contactsData);

      // Assert
      expect(result).toEqual({
        successful: 2,
        failed: 1,
        errors: [
          {
            index: 2,
            error: 'Nome é obrigatório'
          }
        ]
      });
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith([
        expect.objectContaining(contactsData[0]),
        expect.objectContaining(contactsData[1])
      ]);
    });

    it('deve validar dados antes da importação', () => {
      // Arrange
      const validContact = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999'
      };

      const invalidContact = {
        name: '',
        email: 'invalid-email',
        phone: '123'
      };

      // Act
      const validResult = contactService.validateContactData(validContact);
      const invalidResult = contactService.validateContactData(invalidContact);

      // Assert
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Nome é obrigatório');
      expect(invalidResult.errors).toContain('Email inválido');
      expect(invalidResult.errors).toContain('Telefone inválido');
    });
  });

  describe('Busca e Filtros', () => {
    it('deve buscar contatos por texto', async () => {
      // Arrange
      const filters: ContactFilters = {
        search: 'joão silva'
      };

      mockSupabaseQuery.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      // Act
      await contactService.getAll(filters);

      // Assert
      expect(mockSupabaseQuery.ilike).toHaveBeenCalledWith('name', '%joão%');
      expect(mockSupabaseQuery.ilike).toHaveBeenCalledWith('name', '%silva%');
    });

    it('deve filtrar por faixa de score', async () => {
      // Arrange
      const filters: ContactFilters = {
        scoreMin: 70,
        scoreMax: 90
      };

      mockSupabaseQuery.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      // Act
      await contactService.getAll(filters);

      // Assert
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('leadScore', 70);
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('leadScore', 90);
    });
  });

  describe('Estatísticas', () => {
    it('deve calcular estatísticas dos contatos', async () => {
      // Arrange
      const mockContacts = [
        { category: 'LEAD', leadStage: 'NEW', leadScore: 60 },
        { category: 'LEAD', leadStage: 'QUALIFIED', leadScore: 80 },
        { category: 'CLIENT', leadStage: 'CONVERTED', leadScore: 95 },
        { category: 'LEAD', leadStage: 'LOST', leadScore: 30 }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockContacts,
        error: null
      });

      // Act
      const stats = await contactService.getStats();

      // Assert
      expect(stats).toEqual({
        total: 4,
        leads: 3,
        clients: 1,
        averageScore: 66.25,
        conversion: {
          newLeads: 1,
          qualifiedLeads: 1,
          convertedLeads: 1,
          lostLeads: 1,
          conversionRate: 0.25 // 1 convertido de 4 total
        }
      });
    });
  });

  describe('Gerenciamento de Lead Stage Avançado', () => {
    it('deve mover lead para próximo estágio automaticamente', async () => {
      // Arrange
      const contactId = '1';
      const currentContact = {
        id: contactId,
        leadStage: 'NEW',
        leadScore: 60
      };

      const updatedContact = {
        ...currentContact,
        leadStage: 'CONTACTED',
        leadScore: 65 // Score pode aumentar com progressão
      };

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: currentContact, error: null }) // Get current
        .mockResolvedValueOnce({ data: updatedContact, error: null }); // Update

      // Act
      const result = await contactService.moveToNextStage(contactId);

      // Assert
      expect(result.leadStage).toBe('CONTACTED');
      expect(mockEventBus.emit).toHaveBeenCalledWith('lead:stage:changed', {
        contactId,
        oldStage: 'NEW',
        newStage: 'CONTACTED',
        score: 65
      });
    });

    it('deve validar transições de estágio válidas', () => {
      // Arrange & Act
      const validTransitions = [
        ['NEW', 'CONTACTED'],
        ['CONTACTED', 'QUALIFIED'],
        ['QUALIFIED', 'INTERESTED'],
        ['INTERESTED', 'NEGOTIATING'],
        ['NEGOTIATING', 'CONVERTED'],
        ['NEW', 'LOST'] // Pode perder em qualquer estágio
      ];

      const invalidTransitions = [
        ['NEW', 'CONVERTED'], // Não pode pular etapas
        ['QUALIFIED', 'NEW'], // Não pode retroceder
        ['CONVERTED', 'INTERESTED'] // Não pode sair de CONVERTED
      ];

      // Assert
      validTransitions.forEach(([from, to]) => {
        expect(contactService.isValidStageTransition(from as LeadStage, to as LeadStage))
          .toBe(true);
      });

      invalidTransitions.forEach(([from, to]) => {
        expect(contactService.isValidStageTransition(from as LeadStage, to as LeadStage))
          .toBe(false);
      });
    });
  });

  describe('Atividades e Histórico de Interações', () => {
    it('deve registrar atividade do lead', async () => {
      // Arrange
      const contactId = '1';
      const activity = {
        type: 'CALL',
        title: 'Ligação de Follow-up',
        description: 'Discutiu interesse em apartamento',
        outcome: 'Interessado',
        nextAction: 'Agendar visita',
        performedById: 'agent1'
      };

      const mockCreatedActivity = {
        ...activity,
        id: 'activity123',
        contactId,
        createdAt: new Date().toISOString()
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockCreatedActivity,
        error: null
      });

      // Act
      const result = await contactService.addActivity(contactId, activity);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('lead_activities');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        ...activity,
        contactId
      });
      expect(result).toEqual(mockCreatedActivity);
      expect(mockEventBus.emit).toHaveBeenCalledWith('lead:activity:added', mockCreatedActivity);
    });

    it('deve buscar histórico de atividades ordenado', async () => {
      // Arrange
      const contactId = '1';
      const mockActivities = [
        {
          id: '1',
          type: 'CALL',
          title: 'Primeira ligação',
          createdAt: '2025-08-01T10:00:00Z'
        },
        {
          id: '2',
          type: 'EMAIL',
          title: 'Email de follow-up',
          createdAt: '2025-08-02T15:30:00Z'
        },
        {
          id: '3',
          type: 'WHATSAPP',
          title: 'Mensagem WhatsApp',
          createdAt: '2025-08-03T09:15:00Z'
        }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockActivities,
        error: null
      });

      // Act
      const result = await contactService.getActivities(contactId);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('lead_activities');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('contactId', contactId);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('createdAt', { ascending: false });
      expect(result).toEqual(mockActivities);
    });

    it('deve calcular métricas de engajamento', async () => {
      // Arrange
      const contactId = '1';
      const mockActivities = [
        { type: 'CALL', outcome: 'Atendeu', createdAt: '2025-08-01T10:00:00Z' },
        { type: 'EMAIL', outcome: 'Abriu', createdAt: '2025-08-02T10:00:00Z' },
        { type: 'WHATSAPP', outcome: 'Respondeu', createdAt: '2025-08-03T10:00:00Z' },
        { type: 'CALL', outcome: 'Não atendeu', createdAt: '2025-08-04T10:00:00Z' }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockActivities,
        error: null
      });

      // Act
      const metrics = await contactService.getEngagementMetrics(contactId);

      // Assert
      expect(metrics).toEqual({
        totalActivities: 4,
        responseRate: 0.75, // 3 respostas de 4 tentativas
        lastActivity: '2025-08-04T10:00:00Z',
        daysSinceLastActivity: expect.any(Number),
        preferredChannel: 'CALL', // Mais frequente
        engagementLevel: 'HIGH' // >= 0.7 response rate
      });
    });
  });

  describe('Campanhas e Segmentação Avançada', () => {
    it('deve buscar contatos elegíveis para campanha', async () => {
      // Arrange
      const criteria = {
        leadStages: ['NEW', 'CONTACTED'],
        minScore: 50,
        maxScore: 80,
        lastActivityDaysAgo: 7,
        optInWhatsApp: true,
        hasEmail: true
      };

      const mockEligibleContacts = [
        { 
          id: '1', 
          leadStage: 'NEW', 
          leadScore: 60, 
          lastActivityAt: '2025-07-25T00:00:00Z',
          optInWhatsApp: true,
          email: 'test1@email.com'
        },
        { 
          id: '2', 
          leadStage: 'CONTACTED', 
          leadScore: 75, 
          lastActivityAt: '2025-07-20T00:00:00Z',
          optInWhatsApp: true,
          email: 'test2@email.com'
        }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockEligibleContacts,
        error: null
      });

      // Act
      const result = await contactService.getEligibleForCampaign(criteria);

      // Assert
      expect(result).toEqual(mockEligibleContacts);
      expect(mockSupabaseQuery.in).toHaveBeenCalledWith('leadStage', ['NEW', 'CONTACTED']);
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('leadScore', 50);
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('leadScore', 80);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('optInWhatsApp', true);
      expect(mockSupabaseQuery.neq).toHaveBeenCalledWith('email', null);
    });

    it('deve marcar contato como participante de campanha', async () => {
      // Arrange
      const contactId = '1';
      const campaignId = 'campaign123';
      const participationData = {
        campaignId,
        contactId,
        status: 'SENT',
        sentAt: new Date().toISOString()
      };

      mockSupabaseQuery.mockResolvedValue({
        data: participationData,
        error: null
      });

      // Act
      const result = await contactService.addToCampaign(contactId, campaignId);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('message_campaign_participation');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId,
          contactId
        })
      );
      expect(result).toEqual(participationData);
    });

    it('deve calcular ROI de campanhas por segmento', async () => {
      // Arrange
      const campaignId = 'campaign123';
      const mockParticipations = [
        { contactId: '1', status: 'DELIVERED', contact: { leadScore: 80, leadStage: 'QUALIFIED' }},
        { contactId: '2', status: 'READ', contact: { leadScore: 60, leadStage: 'CONTACTED' }},
        { contactId: '3', status: 'RESPONDED', contact: { leadScore: 90, leadStage: 'INTERESTED' }},
        { contactId: '4', status: 'FAILED', contact: { leadScore: 40, leadStage: 'NEW' }}
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockParticipations,
        error: null
      });

      // Act
      const roi = await contactService.getCampaignROI(campaignId);

      // Assert
      expect(roi).toEqual({
        totalSent: 4,
        delivered: 3, // DELIVERED, READ, RESPONDED
        read: 2, // READ, RESPONDED
        responded: 1, // RESPONDED
        failed: 1, // FAILED
        deliveryRate: 0.75, // 3/4
        readRate: 0.67, // 2/3 delivered
        responseRate: 0.5, // 1/2 read
        averageScoreResponded: 90,
        stageProgression: {
          'NEW': 1,
          'CONTACTED': 1,
          'QUALIFIED': 1,
          'INTERESTED': 1
        }
      });
    });
  });

  describe('Lead Scoring Avançado', () => {
    it('deve recalcular scores em lote por agente', async () => {
      // Arrange
      const agentId = 'agent1';
      const mockContacts = [
        { id: '1', email: 'test1@email.com', phone: '11999999999', budget: 300000, interactionCount: 3 },
        { id: '2', email: 'test2@email.com', phone: null, budget: 500000, interactionCount: 1 },
        { id: '3', email: null, phone: '11888888888', budget: 200000, interactionCount: 5 }
      ];

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: mockContacts, error: null }) // Get contacts
        .mockResolvedValue({ data: null, error: null }); // Update operations

      // Act
      const result = await contactService.recalculateScores(agentId);

      // Assert
      expect(result.processed).toBe(3);
      expect(result.updated).toBe(3);
      expect(mockSupabaseQuery.update).toHaveBeenCalledTimes(3);
      expect(mockEventBus.emit).toHaveBeenCalledWith('leads:scores:recalculated', {
        agentId,
        processed: 3,
        updated: 3
      });
    });

    it('deve identificar leads com score aumentando rapidamente', async () => {
      // Arrange
      const mockRecentScoreChanges = [
        { contactId: '1', oldScore: 40, newScore: 85, changeDate: '2025-08-03T10:00:00Z' },
        { contactId: '2', oldScore: 60, newScore: 70, changeDate: '2025-08-03T11:00:00Z' },
        { contactId: '3', oldScore: 30, newScore: 75, changeDate: '2025-08-03T12:00:00Z' }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockRecentScoreChanges,
        error: null
      });

      // Act
      const hotLeads = await contactService.getHotLeadsByScoreIncrease(7); // Last 7 days

      // Assert
      expect(hotLeads).toEqual([
        expect.objectContaining({ contactId: '1', scoreIncrease: 45 }),
        expect.objectContaining({ contactId: '3', scoreIncrease: 45 })
      ]);
    });
  });

  describe('Análise Comportamental', () => {
    it('deve identificar padrões de comportamento do lead', async () => {
      // Arrange
      const contactId = '1';
      const mockActivities = [
        { type: 'EMAIL', createdAt: '2025-08-01T09:00:00Z', outcome: 'Abriu' },
        { type: 'EMAIL', createdAt: '2025-08-01T14:00:00Z', outcome: 'Clicou' },
        { type: 'WHATSAPP', createdAt: '2025-08-02T10:30:00Z', outcome: 'Respondeu' },
        { type: 'CALL', createdAt: '2025-08-02T15:00:00Z', outcome: 'Atendeu' },
        { type: 'WEBSITE', createdAt: '2025-08-03T11:00:00Z', outcome: 'Visitou página de preços' }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockActivities,
        error: null
      });

      // Act
      const patterns = await contactService.analyzeBehaviorPatterns(contactId);

      // Assert
      expect(patterns).toEqual({
        preferredTimeSlots: ['09:00-12:00', '14:00-17:00'], // Manhã e tarde
        preferredChannels: ['EMAIL', 'WHATSAPP'], // Mais responsivos
        engagementTrend: 'INCREASING', // Atividade crescendo
        buyingSignals: [
          'Visitou página de preços',
          'Alta taxa de resposta',
          'Múltiplos canais de contato'
        ],
        riskFactors: [],
        nextBestAction: 'Agendar demonstração presencial'
      });
    });

    it('deve detectar leads em risco de abandono', async () => {
      // Arrange
      const agentId = 'agent1';
      const mockAtRiskContacts = [
        {
          id: '1',
          name: 'João Silva',
          lastActivityAt: '2025-07-01T00:00:00Z', // 1 mês atrás
          leadStage: 'QUALIFIED',
          leadScore: 80,
          interactionCount: 5,
          responseRate: 0.8
        },
        {
          id: '2', 
          name: 'Maria Santos',
          lastActivityAt: '2025-07-15T00:00:00Z', // 3 semanas atrás
          leadStage: 'INTERESTED', 
          leadScore: 75,
          interactionCount: 3,
          responseRate: 0.6
        }
      ];

      mockSupabaseQuery.mockResolvedValue({
        data: mockAtRiskContacts,
        error: null
      });

      // Act
      const atRiskLeads = await contactService.getLeadsAtRisk(agentId);

      // Assert
      expect(atRiskLeads).toEqual([
        expect.objectContaining({
          id: '1',
          riskFactors: expect.arrayContaining([
            'Sem atividade há mais de 14 dias',
            'Score alto mas sem progressão'
          ]),
          recommendedActions: expect.arrayContaining([
            'Ligação de reativação',
            'Oferta especial',
            'Reagendamento'
          ])
        }),
        expect.objectContaining({
          id: '2',
          riskFactors: expect.arrayContaining([
            'Sem atividade há mais de 14 dias'
          ])
        })
      ]);
    });
  });

  describe('Automações e Triggers', () => {
    it('deve emitir evento para hot lead identificado', async () => {
      // Arrange
      const newContact = {
        name: 'CEO Important',
        email: 'ceo@bigcorp.com',
        company: 'BigCorp Inc',
        budget: 2000000,
        leadSource: 'REFERRAL',
        timeline: 'Urgente'
      };

      const mockCreatedContact = {
        ...newContact,
        id: '123',
        leadScore: 98 // Score muito alto
      };

      mockSupabaseQuery.mockResolvedValue({
        data: mockCreatedContact,
        error: null
      });

      // Act
      await contactService.create(newContact);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('lead:hot_lead:identified', {
        contactId: '123',
        score: 98,
        factors: expect.arrayContaining([
          'high_budget',
          'company_info', 
          'referral_source',
          'urgent_timeline'
        ])
      });
    });

    it('deve emitir alerta para lead score em queda', async () => {
      // Arrange
      const contactId = '1';
      const oldScore = 85;
      const newScore = 55; // Queda significativa

      const updates = { leadScore: newScore, lastContactAt: new Date().toISOString() };
      const mockUpdatedContact = { id: contactId, leadScore: newScore };

      mockSupabaseQuery.mockResolvedValue({
        data: mockUpdatedContact,
        error: null
      });

      // Act
      await contactService.update(contactId, updates, oldScore);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('lead:score:significant_decrease', {
        contactId,
        oldScore,
        newScore,
        decrease: 30,
        possibleReasons: [
          'Sem interação recente',
          'Não respondeu às tentativas de contato',
          'Pode ter perdido interesse'
        ]
      });
    });

    it('deve agendar follow-up automático baseado no estágio', async () => {
      // Arrange
      const contactId = '1';
      const currentStage = 'CONTACTED';
      const nextStage = 'QUALIFIED';

      const mockContact = {
        id: contactId,
        leadStage: currentStage,
        leadScore: 70
      };

      const mockUpdatedContact = {
        ...mockContact,
        leadStage: nextStage,
        nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 dias
      };

      mockSupabaseQuery
        .mockResolvedValueOnce({ data: mockContact, error: null })
        .mockResolvedValueOnce({ data: mockUpdatedContact, error: null });

      // Act
      await contactService.moveToNextStage(contactId);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith('lead:followup:scheduled', {
        contactId,
        scheduledFor: expect.any(String),
        reason: 'Progressão para QUALIFIED',
        priority: 'NORMAL'
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao buscar contatos', async () => {
      // Arrange
      mockSupabaseQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error', details: 'Connection failed' }
      });

      // Act & Assert
      await expect(contactService.getAll())
        .rejects.toThrow('Database error: Connection failed');
    });

    it('deve tratar erro de validação', async () => {
      // Arrange
      const invalidContact = {
        name: '', // Nome obrigatório
        email: 'invalid-email',
        category: 'LEAD' as ContactCategory
      };

      // Act & Assert
      await expect(contactService.create(invalidContact))
        .rejects.toThrow('Dados inválidos');
    });

    it('deve tratar transição de estágio inválida', async () => {
      // Arrange
      const contactId = '1';
      const invalidStage = 'CONVERTED' as LeadStage;

      const currentContact = {
        id: contactId,
        leadStage: 'NEW'
      };

      mockSupabaseQuery.mockResolvedValue({
        data: currentContact,
        error: null
      });

      // Act & Assert
      await expect(contactService.updateStage(contactId, invalidStage))
        .rejects.toThrow('Transição de estágio inválida');
    });
  });

  describe('Integração com BaseService', () => {
    it('deve herdar validações de RLS do BaseService', () => {
      // Assert
      expect(contactService).toBeInstanceOf(ContactService);
      expect(BaseService).toHaveBeenCalledWith('contacts');
    });
  });
});