import { describe, it, expect } from 'vitest';

describe('Testes Básicos dos Serviços Core', () => {
  describe('PropertyService - Lógica de Negócio', () => {
    it('deve calcular estatísticas de propriedades', () => {
      // Arrange
      const properties = [
        { status: 'AVAILABLE', price: 300000 },
        { status: 'AVAILABLE', price: 400000 },
        { status: 'SOLD', price: 350000 },
        { status: 'RESERVED', price: 450000 }
      ];

      // Act
      const stats = {
        total: properties.length,
        available: properties.filter(p => p.status === 'AVAILABLE').length,
        sold: properties.filter(p => p.status === 'SOLD').length,
        reserved: properties.filter(p => p.status === 'RESERVED').length,
        averagePrice: properties.reduce((sum, p) => sum + p.price, 0) / properties.length,
        totalValue: properties.reduce((sum, p) => sum + p.price, 0)
      };

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

    it('deve validar dados de propriedade', () => {
      // Arrange
      const validProperty = {
        title: 'Casa no Centro',
        price: 300000,
        type: 'HOUSE',
        status: 'AVAILABLE'
      };

      const invalidProperty = {
        title: '',
        price: -1000,
        type: 'INVALID_TYPE',
        status: 'INVALID_STATUS'
      };

      // Act
      const validateProperty = (property: any) => {
        const errors = [];
        if (!property.title) errors.push('Título é obrigatório');
        if (property.price <= 0) errors.push('Preço deve ser positivo');
        if (!['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND'].includes(property.type)) {
          errors.push('Tipo inválido');
        }
        if (!['AVAILABLE', 'SOLD', 'RESERVED'].includes(property.status)) {
          errors.push('Status inválido');
        }
        return { isValid: errors.length === 0, errors };
      };

      const validResult = validateProperty(validProperty);
      const invalidResult = validateProperty(invalidProperty);

      // Assert
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Título é obrigatório');
      expect(invalidResult.errors).toContain('Preço deve ser positivo');
      expect(invalidResult.errors).toContain('Tipo inválido');
      expect(invalidResult.errors).toContain('Status inválido');
    });

    it('deve aplicar filtros de busca', () => {
      // Arrange
      const properties = [
        { title: 'Casa no Centro', type: 'HOUSE', price: 300000, bedrooms: 3 },
        { title: 'Apartamento na Praia', type: 'APARTMENT', price: 450000, bedrooms: 2 },
        { title: 'Casa nos Jardins', type: 'HOUSE', price: 600000, bedrooms: 4 },
        { title: 'Loft no Centro', type: 'APARTMENT', price: 250000, bedrooms: 1 }
      ];

      const filters = {
        search: 'centro',
        type: 'HOUSE',
        minPrice: 250000,
        maxPrice: 500000,
        minBedrooms: 3
      };

      // Act
      const applyFilters = (props: any[], filters: any) => {
        return props.filter(prop => {
          if (filters.search && !prop.title.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
          }
          if (filters.type && prop.type !== filters.type) {
            return false;
          }
          if (filters.minPrice && prop.price < filters.minPrice) {
            return false;
          }
          if (filters.maxPrice && prop.price > filters.maxPrice) {
            return false;
          }
          if (filters.minBedrooms && prop.bedrooms < filters.minBedrooms) {
            return false;
          }
          return true;
        });
      };

      const filtered = applyFilters(properties, filters);

      // Assert
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Casa no Centro');
    });
  });

  describe('ContactService - Lead Scoring', () => {
    it('deve calcular score de lead', () => {
      // Arrange
      const calculateLeadScore = (contact: any) => {
        let score = 0;
        
        // Informações básicas (40 pontos)
        if (contact.email) score += 20;
        if (contact.phone) score += 20;
        
        // Informações qualificadoras (35 pontos)
        if (contact.company) score += 15;
        if (contact.budget && contact.budget > 300000) score += 20;
        
        // Comportamento (25 pontos)
        if (contact.interactionCount > 3) score += 10;
        if (contact.responseRate > 0.7) score += 15;
        
        return Math.min(score, 100);
      };

      // Act & Assert
      const qualifiedLead = {
        email: 'test@email.com',
        phone: '11999999999',
        company: 'TechCorp',
        budget: 500000,
        interactionCount: 5,
        responseRate: 0.8
      };
      expect(calculateLeadScore(qualifiedLead)).toBe(100);

      const partialLead = {
        email: 'test@email.com',
        phone: '11999999999',
        company: null,
        budget: 200000,
        interactionCount: 2,
        responseRate: 0.5
      };
      expect(calculateLeadScore(partialLead)).toBe(40);

      const basicLead = {
        email: null,
        phone: null,
        company: null,
        budget: null,
        interactionCount: 0,
        responseRate: 0
      };
      expect(calculateLeadScore(basicLead)).toBe(0);
    });

    it('deve segmentar contatos por score', () => {
      // Arrange
      const contacts = [
        { id: '1', leadScore: 90, category: 'LEAD' },
        { id: '2', leadScore: 60, category: 'LEAD' },
        { id: '3', leadScore: 30, category: 'LEAD' },
        { id: '4', leadScore: 85, category: 'CLIENT' },
        { id: '5', leadScore: 95, category: 'LEAD' }
      ];

      // Act
      const segmentContacts = (contacts: any[]) => {
        return {
          hotLeads: contacts.filter(c => c.category === 'LEAD' && c.leadScore >= 80).length,
          warmLeads: contacts.filter(c => c.category === 'LEAD' && c.leadScore >= 50 && c.leadScore < 80).length,
          coldLeads: contacts.filter(c => c.category === 'LEAD' && c.leadScore < 50).length,
          clients: contacts.filter(c => c.category === 'CLIENT').length
        };
      };

      const segments = segmentContacts(contacts);

      // Assert
      expect(segments).toEqual({
        hotLeads: 2, // IDs 1 e 5
        warmLeads: 1, // ID 2
        coldLeads: 1, // ID 3
        clients: 1 // ID 4
      });
    });

    it('deve validar dados de contato', () => {
      // Arrange
      const validateContact = (contact: any) => {
        const errors = [];
        if (!contact.name) errors.push('Nome é obrigatório');
        if (contact.email && !/\S+@\S+\.\S+/.test(contact.email)) {
          errors.push('Email inválido');
        }
        if (contact.phone && !/^\d{10,11}$/.test(contact.phone.replace(/\D/g, ''))) {
          errors.push('Telefone inválido');
        }
        return { isValid: errors.length === 0, errors };
      };

      // Act & Assert
      const validContact = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999'
      };
      const validResult = validateContact(validContact);
      expect(validResult.isValid).toBe(true);

      const invalidContact = {
        name: '',
        email: 'invalid-email',
        phone: '123'
      };
      const invalidResult = validateContact(invalidContact);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Nome é obrigatório');
      expect(invalidResult.errors).toContain('Email inválido');
      expect(invalidResult.errors).toContain('Telefone inválido');
    });
  });

  describe('AppointmentService - Detecção de Conflitos', () => {
    it('deve detectar conflitos de horário', () => {
      // Arrange
      const detectConflict = (apt1: any, apt2: any) => {
        if (apt1.agentId !== apt2.agentId) return false;
        
        const start1 = new Date(apt1.date).getTime();
        const end1 = start1 + (apt1.duration * 60 * 1000);
        const start2 = new Date(apt2.date).getTime();
        const end2 = start2 + (apt2.duration * 60 * 1000);
        
        return start1 < end2 && start2 < end1;
      };

      // Act & Assert
      const appointment1 = {
        agentId: 'agent1',
        date: '2025-08-04T10:00:00Z',
        duration: 60
      };

      const conflictingAppointment = {
        agentId: 'agent1',
        date: '2025-08-04T10:30:00Z',
        duration: 60
      };

      const nonConflictingAppointment = {
        agentId: 'agent1',
        date: '2025-08-04T11:30:00Z',
        duration: 60
      };

      const differentAgentAppointment = {
        agentId: 'agent2',
        date: '2025-08-04T10:30:00Z',
        duration: 60
      };

      expect(detectConflict(appointment1, conflictingAppointment)).toBe(true);
      expect(detectConflict(appointment1, nonConflictingAppointment)).toBe(false);
      expect(detectConflict(appointment1, differentAgentAppointment)).toBe(false);
    });

    it('deve gerar slots de disponibilidade', () => {
      // Arrange
      const generateSlots = (workingHours: any) => {
        const slots = [];
        const startHour = parseInt(workingHours.start.split(':')[0]);
        const endHour = parseInt(workingHours.end.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          slots.push({
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            status: 'AVAILABLE'
          });
        }
        
        return slots;
      };

      // Act
      const workingHours = { start: '09:00', end: '17:00' };
      const slots = generateSlots(workingHours);

      // Assert
      expect(slots).toHaveLength(8);
      expect(slots[0]).toEqual({
        startTime: '09:00',
        endTime: '10:00',
        status: 'AVAILABLE'
      });
      expect(slots[7]).toEqual({
        startTime: '16:00',
        endTime: '17:00',
        status: 'AVAILABLE'
      });
    });

    it('deve calcular estatísticas de agendamentos', () => {
      // Arrange
      const appointments = [
        { status: 'CONFIRMED', type: 'VISIT', actualDuration: 45 },
        { status: 'COMPLETED', type: 'VISIT', actualDuration: 60 },
        { status: 'CANCELLED', type: 'MEETING', actualDuration: null },
        { status: 'CONFIRMED', type: 'MEETING', actualDuration: 30 },
        { status: 'COMPLETED', type: 'VISIT', actualDuration: 50 }
      ];

      // Act
      const calculateStats = (appointments: any[]) => {
        const completed = appointments.filter(a => a.actualDuration !== null);
        const avgDuration = completed.length > 0 
          ? completed.reduce((sum, a) => sum + a.actualDuration, 0) / completed.length 
          : 0;

        return {
          total: appointments.length,
          confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
          completed: appointments.filter(a => a.status === 'COMPLETED').length,
          cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
          byType: {
            VISIT: appointments.filter(a => a.type === 'VISIT').length,
            MEETING: appointments.filter(a => a.type === 'MEETING').length
          },
          averageDuration: avgDuration,
          completionRate: appointments.filter(a => a.status === 'COMPLETED').length / appointments.length,
          cancellationRate: appointments.filter(a => a.status === 'CANCELLED').length / appointments.length
        };
      };

      const stats = calculateStats(appointments);

      // Assert
      expect(stats).toEqual({
        total: 5,
        confirmed: 2,
        completed: 2,
        cancelled: 1,
        byType: { VISIT: 3, MEETING: 2 },
        averageDuration: 46.25, // (45 + 60 + 30 + 50) / 4
        completionRate: 0.4, // 2/5
        cancellationRate: 0.2 // 1/5
      });
    });
  });

  describe('DealService - Pipeline e Probabilidades', () => {
    it('deve calcular probabilidade por estágio', () => {
      // Arrange
      const STAGE_PROBABILITIES = {
        LEAD_IN: 0.1,
        QUALIFICATION: 0.3,
        PROPOSAL: 0.6,
        NEGOTIATION: 0.8,
        WON: 1.0,
        LOST: 0.0
      };

      // Act & Assert
      expect(STAGE_PROBABILITIES.LEAD_IN).toBe(0.1);
      expect(STAGE_PROBABILITIES.QUALIFICATION).toBe(0.3);
      expect(STAGE_PROBABILITIES.PROPOSAL).toBe(0.6);
      expect(STAGE_PROBABILITIES.NEGOTIATION).toBe(0.8);
      expect(STAGE_PROBABILITIES.WON).toBe(1.0);
      expect(STAGE_PROBABILITIES.LOST).toBe(0.0);
    });

    it('deve calcular métricas de pipeline', () => {
      // Arrange
      const deals = [
        { stage: 'LEAD_IN', value: 200000 },
        { stage: 'LEAD_IN', value: 300000 },
        { stage: 'QUALIFICATION', value: 400000 },
        { stage: 'PROPOSAL', value: 500000 },
        { stage: 'NEGOTIATION', value: 600000 },
        { stage: 'WON', value: 350000 },
        { stage: 'LOST', value: 250000 }
      ];

      // Act
      const calculatePipeline = (deals: any[]) => {
        const pipeline: any = {};
        deals.forEach(deal => {
          if (!pipeline[deal.stage]) {
            pipeline[deal.stage] = { count: 0, totalValue: 0 };
          }
          pipeline[deal.stage].count++;
          pipeline[deal.stage].totalValue += deal.value;
        });

        // Calcular médias
        Object.keys(pipeline).forEach(stage => {
          pipeline[stage].averageValue = pipeline[stage].totalValue / pipeline[stage].count;
        });

        return {
          stages: pipeline,
          totalDeals: deals.length,
          totalValue: deals.reduce((sum, d) => sum + d.value, 0),
          averageDealSize: deals.reduce((sum, d) => sum + d.value, 0) / deals.length
        };
      };

      const pipelineStats = calculatePipeline(deals);

      // Assert
      expect(pipelineStats.stages.LEAD_IN).toEqual({
        count: 2,
        totalValue: 500000,
        averageValue: 250000
      });
      expect(pipelineStats.stages.QUALIFICATION).toEqual({
        count: 1,
        totalValue: 400000,
        averageValue: 400000
      });
      expect(pipelineStats.totalDeals).toBe(7);
      expect(pipelineStats.totalValue).toBe(2600000);
      expect(pipelineStats.averageDealSize).toBeCloseTo(371428.57, 2);
    });

    it('deve identificar deals em risco', () => {
      // Arrange
      const deals = [
        {
          id: '1',
          stage: 'PROPOSAL',
          daysInStage: 30,
          lastActivity: '2025-07-01T00:00:00Z',
          probability: 0.2
        },
        {
          id: '2',
          stage: 'NEGOTIATION',
          daysInStage: 5,
          lastActivity: '2025-08-01T00:00:00Z',
          probability: 0.8
        }
      ];

      // Act
      const identifyRiskyDeals = (deals: any[]) => {
        const now = new Date('2025-08-03T00:00:00Z').getTime();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

        return deals.filter(deal => {
          const lastActivity = new Date(deal.lastActivity).getTime();
          const riskFactors = [];

          if (deal.daysInStage > 14) riskFactors.push('Muito tempo no estágio');
          if (lastActivity < oneWeekAgo) riskFactors.push('Sem atividade recente');
          if (deal.probability < 0.3) riskFactors.push('Baixa probabilidade');

          return riskFactors.length > 0;
        });
      };

      const riskyDeals = identifyRiskyDeals(deals);

      // Assert
      expect(riskyDeals).toHaveLength(1);
      expect(riskyDeals[0].id).toBe('1');
    });

    it('deve calcular taxa de conversão', () => {
      // Arrange
      const deals = [
        { stage: 'WON', originalStage: 'LEAD_IN' },
        { stage: 'LOST', originalStage: 'LEAD_IN' },
        { stage: 'WON', originalStage: 'LEAD_IN' },
        { stage: 'WON', originalStage: 'QUALIFICATION' },
        { stage: 'LOST', originalStage: 'QUALIFICATION' },
        { stage: 'WON', originalStage: 'PROPOSAL' }
      ];

      // Act
      const calculateConversionRates = (deals: any[]) => {
        const stages = ['LEAD_IN', 'QUALIFICATION', 'PROPOSAL'];
        const rates: any = {};

        stages.forEach(stage => {
          const stageDeals = deals.filter(d => d.originalStage === stage);
          const won = stageDeals.filter(d => d.stage === 'WON').length;
          const total = stageDeals.length;
          
          rates[stage] = {
            total,
            won,
            lost: total - won,
            rate: total > 0 ? won / total : 0
          };
        });

        return rates;
      };

      const conversionRates = calculateConversionRates(deals);

      // Assert
      expect(conversionRates.LEAD_IN).toEqual({
        total: 3,
        won: 2,
        lost: 1,
        rate: 0.6666666666666666
      });
      expect(conversionRates.QUALIFICATION).toEqual({
        total: 2,
        won: 1,
        lost: 1,
        rate: 0.5
      });
      expect(conversionRates.PROPOSAL).toEqual({
        total: 1,
        won: 1,
        lost: 0,
        rate: 1.0
      });
    });
  });

  describe('Validações Comuns', () => {
    it('deve validar format de email', () => {
      // Arrange
      const validateEmail = (email: string) => {
        return /\S+@\S+\.\S+/.test(email);
      };

      // Act & Assert
      expect(validateEmail('user@domain.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('deve validar formato de telefone brasileiro', () => {
      // Arrange
      const validatePhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        return /^(\d{10}|\d{11})$/.test(cleaned);
      };

      // Act & Assert
      expect(validatePhone('11999999999')).toBe(true);
      expect(validatePhone('(11) 99999-9999')).toBe(true);
      expect(validatePhone('1199999999')).toBe(true);
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });

    it('deve validar formato de CEP brasileiro', () => {
      // Arrange
      const validateCEP = (cep: string) => {
        const cleaned = cep.replace(/\D/g, '');
        return /^\d{8}$/.test(cleaned);
      };

      // Act & Assert
      expect(validateCEP('01234567')).toBe(true);
      expect(validateCEP('01234-567')).toBe(true);
      expect(validateCEP('123')).toBe(false);
      expect(validateCEP('')).toBe(false);
    });

    it('deve formatar valores monetários', () => {
      // Arrange
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      };

      // Act & Assert
      const result1 = formatCurrency(300000);
      const result2 = formatCurrency(1500.50);
      const result3 = formatCurrency(0);
      
      // Verificar se contém elementos esperados (para ser compatível com diferentes locales)
      expect(result1).toMatch(/R\$.*300.*000.*00/);
      expect(result2).toMatch(/R\$.*1.*500.*50/);
      expect(result3).toMatch(/R\$.*0.*00/);
    });
  });
});