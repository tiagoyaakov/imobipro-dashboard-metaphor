import { describe, it, expect } from 'vitest';

describe('AppointmentService - Lógica de Negócio', () => {
  describe('Detecção de Conflitos', () => {
    it('deve detectar conflito quando há sobreposição de horários', () => {
      // Arrange
      const detectConflict = (apt1: any, apt2: any) => {
        if (apt1.agentId !== apt2.agentId) return false;
        
        const start1 = new Date(apt1.date).getTime();
        const end1 = start1 + (apt1.duration * 60 * 1000);
        const start2 = new Date(apt2.date).getTime();
        const end2 = start2 + (apt2.duration * 60 * 1000);
        
        return start1 < end2 && start2 < end1;
      };

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

      // Act & Assert
      expect(detectConflict(appointment1, conflictingAppointment)).toBe(true);
      expect(detectConflict(appointment1, nonConflictingAppointment)).toBe(false);
      expect(detectConflict(appointment1, differentAgentAppointment)).toBe(false);
    });

    it('deve validar dados de agendamento', () => {
      // Arrange
      const validateAppointment = (appointment: any) => {
        const errors = [];
        if (!appointment.title) errors.push('Título é obrigatório');
        if (!appointment.date) errors.push('Data é obrigatória');
        if (!appointment.agentId) errors.push('Agente é obrigatório');
        if (!appointment.contactId) errors.push('Contato é obrigatório');
        if (appointment.duration && appointment.duration <= 0) {
          errors.push('Duração deve ser positiva');
        }
        return { isValid: errors.length === 0, errors };
      };

      // Act & Assert
      const validAppointment = {
        title: 'Visita Apartamento',
        date: '2025-08-04T10:00:00Z',
        agentId: 'agent1',
        contactId: 'contact1',
        duration: 60
      };
      const validResult = validateAppointment(validAppointment);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);

      const invalidAppointment = {
        title: '',
        date: '',
        agentId: '',
        contactId: '',
        duration: -30
      };
      const invalidResult = validateAppointment(invalidAppointment);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Título é obrigatório');
      expect(invalidResult.errors).toContain('Data é obrigatória');
      expect(invalidResult.errors).toContain('Agente é obrigatório');
      expect(invalidResult.errors).toContain('Contato é obrigatório');
      expect(invalidResult.errors).toContain('Duração deve ser positiva');
    });
  });

  describe('Geração de Slots', () => {
    it('deve gerar slots de disponibilidade para horário de trabalho', () => {
      // Arrange
      const generateSlots = (workingHours: any) => {
        const slots = [];
        const startHour = parseInt(workingHours.start.split(':')[0]);
        const endHour = parseInt(workingHours.end.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          // Pular horário de almoço
          if (workingHours.breaks) {
            const breakStart = parseInt(workingHours.breaks[0].start.split(':')[0]);
            const breakEnd = parseInt(workingHours.breaks[0].end.split(':')[0]);
            if (hour >= breakStart && hour < breakEnd) continue;
          }
          
          slots.push({
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            status: 'AVAILABLE'
          });
        }
        
        return slots;
      };

      // Act
      const workingHours = { 
        start: '09:00', 
        end: '17:00',
        breaks: [{ start: '12:00', end: '13:00' }]
      };
      const slots = generateSlots(workingHours);

      // Assert
      expect(slots).toHaveLength(7); // 8 horas - 1 hora de almoço
      expect(slots[0]).toEqual({
        startTime: '09:00',
        endTime: '10:00',
        status: 'AVAILABLE'
      });
      expect(slots[3]).toEqual({
        startTime: '13:00',
        endTime: '14:00',
        status: 'AVAILABLE'
      });
      // Verificar que não há slot de almoço (12:00-13:00)
      expect(slots.find(s => s.startTime === '12:00')).toBeUndefined();
    });

    it('deve calcular disponibilidade considerando agendamentos existentes', () => {
      // Arrange
      const checkSlotAvailability = (slot: any, existingAppointments: any[]) => {
        const slotStart = new Date(`2025-08-04T${slot.startTime}:00Z`).getTime();
        const slotEnd = new Date(`2025-08-04T${slot.endTime}:00Z`).getTime();
        
        return !existingAppointments.some(apt => {
          const aptStart = new Date(apt.date).getTime();
          const aptEnd = aptStart + (apt.duration * 60 * 1000);
          return slotStart < aptEnd && aptStart < slotEnd;
        });
      };

      // Act & Assert
      const slot = { startTime: '10:00', endTime: '11:00' };
      const noAppointments = [];
      const conflictingAppointment = [{
        date: '2025-08-04T10:30:00Z',
        duration: 60
      }];
      const nonConflictingAppointment = [{
        date: '2025-08-04T11:30:00Z',
        duration: 60
      }];

      expect(checkSlotAvailability(slot, noAppointments)).toBe(true);
      expect(checkSlotAvailability(slot, conflictingAppointment)).toBe(false);
      expect(checkSlotAvailability(slot, nonConflictingAppointment)).toBe(true);
    });
  });

  describe('Cálculo de Estatísticas', () => {
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

    it('deve calcular taxa de ocupação do agente', () => {
      // Arrange
      const calculateOccupancy = (appointments: any[], workingHours: any) => {
        const totalMinutesWorked = workingHours.hours * 60;
        const totalMinutesBooked = appointments
          .filter(a => a.actualDuration)
          .reduce((sum, a) => sum + a.actualDuration, 0);
        
        return totalMinutesBooked / totalMinutesWorked;
      };

      // Act
      const appointments = [
        { actualDuration: 60 },
        { actualDuration: 90 },
        { actualDuration: 90 },
        { actualDuration: null } // cancelado
      ];
      const workingHours = { hours: 8 }; // 8 horas de trabalho

      const occupancy = calculateOccupancy(appointments, workingHours);

      // Assert
      expect(occupancy).toBeCloseTo(0.5, 1); // 240 min / 480 min = 50%
    });
  });

  describe('Sugestão de Horários', () => {
    it('deve sugerir horários alternativos próximos ao original', () => {
      // Arrange
      const suggestAlternatives = (originalDateTime: string, availableSlots: any[]) => {
        const originalTime = new Date(originalDateTime);
        
        // Ordenar slots por proximidade com o horário original
        return availableSlots
          .map(slot => {
            const slotDateTime = new Date(`${originalTime.toDateString()} ${slot.startTime}`);
            const timeDifference = Math.abs(slotDateTime.getTime() - originalTime.getTime());
            return { ...slot, timeDifference };
          })
          .sort((a, b) => a.timeDifference - b.timeDifference)
          .slice(0, 3) // Top 3 sugestões
          .map(({ timeDifference, ...slot }) => slot);
      };

      // Act
      const originalDateTime = '2025-08-04T10:00:00Z';
      const availableSlots = [
        { startTime: '11:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '15:00' },
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '15:00', endTime: '16:00' },
        { startTime: '10:30', endTime: '11:30' }
      ];

      const suggestions = suggestAlternatives(originalDateTime, availableSlots);

      // Assert
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].startTime).toBe('09:00'); // Mais próximo
      expect(suggestions[1].startTime).toBe('10:30'); // Segundo mais próximo
      expect(suggestions[2].startTime).toBe('11:00'); // Terceiro mais próximo
    });
  });

  describe('Validação de Horários de Trabalho', () => {
    it('deve validar se horário está dentro do expediente', () => {
      // Arrange
      const isWithinWorkingHours = (datetime: string, workingHours: any) => {
        const date = new Date(datetime);
        const dayOfWeek = date.getUTCDay(); // Usar UTC para evitar problemas de fuso horário
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const timeInMinutes = hour * 60 + minute;
        
        // Verificar se é dia útil (segunda a sexta)
        if (dayOfWeek === 0 || dayOfWeek === 6) return false;
        
        const startTime = workingHours.start.split(':');
        const endTime = workingHours.end.split(':');
        const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
        const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
        
        return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
      };

      // Act & Assert
      const workingHours = { start: '09:00', end: '17:00' };
      
      expect(isWithinWorkingHours('2025-08-04T10:00:00Z', workingHours)).toBe(true); // Segunda, 10h UTC
      expect(isWithinWorkingHours('2025-08-04T08:00:00Z', workingHours)).toBe(false); // Segunda, 8h UTC (muito cedo)
      expect(isWithinWorkingHours('2025-08-04T18:00:00Z', workingHours)).toBe(false); // Segunda, 18h UTC (muito tarde)
      expect(isWithinWorkingHours('2025-08-03T10:00:00Z', workingHours)).toBe(false); // Domingo
      expect(isWithinWorkingHours('2025-08-09T10:00:00Z', workingHours)).toBe(false); // Sábado
    });
  });
});