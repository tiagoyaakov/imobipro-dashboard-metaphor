// =====================================================
// SINCRONIZAÇÃO GOOGLE CALENDAR - IMOBIPRO DASHBOARD
// =====================================================

import { GoogleCalendarClient } from './client';
import { GoogleCalendarAuth } from './auth';
import type { 
  Appointment, 
  GoogleCalendarEvent, 
  GoogleCalendarDateTime,
  GoogleCalendarAttendee,
  GoogleCalendarReminders
} from '@/types/agenda';

export class GoogleCalendarSync {
  private client: GoogleCalendarClient;
  private auth: GoogleCalendarAuth;

  constructor(client: GoogleCalendarClient, auth: GoogleCalendarAuth) {
    this.client = client;
    this.auth = auth;
  }

  /**
   * Sincronizar agendamento do banco para Google Calendar
   * @param appointmentId - ID do agendamento
   * @returns true se sincronizado com sucesso
   */
  async syncAppointmentToGoogle(appointmentId: string): Promise<boolean> {
    try {
      // TODO: Buscar agendamento do banco de dados
      // const appointment = await prisma.appointment.findUnique({
      //   where: { id: appointmentId },
      //   include: {
      //     agent: true,
      //     contact: true,
      //     property: true
      //   }
      // });

      // Mock data para teste
      const appointment: Appointment = {
        id: appointmentId,
        title: 'Agendamento Teste',
        description: 'Descrição do agendamento',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hora depois
        status: 'CONFIRMED' as any,
        type: 'PROPERTY_VIEWING' as any,
        notes: 'Observações do agendamento',
        agentId: 'agent-id',
        contactId: 'contact-id',
        propertyId: 'property-id',
        autoAssigned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!appointment || appointment.googleCalendarEventId) {
        console.log('Agendamento já sincronizado ou não encontrado');
        return false;
      }

      const eventData = this.convertAppointmentToGoogleEvent(appointment);
      const googleEvent = await this.client.createEvent('primary', eventData);

      // TODO: Atualizar agendamento com ID do evento Google
      // await prisma.appointment.update({
      //   where: { id: appointmentId },
      //   data: { googleCalendarEventId: googleEvent.id }
      // });

      console.log('Agendamento sincronizado com Google Calendar:', googleEvent.id);
      return true;

    } catch (error) {
      console.error('Erro na sincronização para Google Calendar:', error);
      throw new Error('Falha na sincronização com Google Calendar');
    }
  }

  /**
   * Sincronizar eventos do Google Calendar para o banco
   * @param userId - ID do usuário
   * @param calendarId - ID do calendário (padrão: 'primary')
   * @returns Número de eventos sincronizados
   */
  async syncFromGoogleCalendar(userId: string, calendarId: string = 'primary'): Promise<number> {
    try {
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30); // Próximos 30 dias

      const events = await this.client.listEvents(calendarId, {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString()
      });

      let syncedCount = 0;

      for (const event of events) {
        // TODO: Verificar se já existe no banco
        // const existingAppointment = await prisma.appointment.findFirst({
        //   where: { googleCalendarEventId: event.id }
        // });

        // if (!existingAppointment) {
        //   // Criar novo agendamento baseado no evento Google
        //   await prisma.appointment.create({
        //     data: {
        //       title: event.summary,
        //       notes: event.description,
        //       startTime: new Date(event.start.dateTime || event.start.date!),
        //       endTime: new Date(event.end.dateTime || event.end.date!),
        //       googleCalendarEventId: event.id,
        //       agentId: userId, // Assumir que é do usuário logado
        //       status: 'CONFIRMED',
        //       type: 'OTHER'
        //     }
        //   });
        //   syncedCount++;
        // }

        // Mock para teste
        if (event.id && !event.id.includes('existing')) {
          syncedCount++;
        }
      }

      console.log(`${syncedCount} eventos sincronizados do Google Calendar`);
      return syncedCount;

    } catch (error) {
      console.error('Erro na sincronização do Google Calendar:', error);
      throw new Error('Falha na sincronização do Google Calendar');
    }
  }

  /**
   * Atualizar evento no Google Calendar quando agendamento for modificado
   * @param appointmentId - ID do agendamento
   * @returns true se atualizado com sucesso
   */
  async updateGoogleEventFromAppointment(appointmentId: string): Promise<boolean> {
    try {
      // TODO: Buscar agendamento do banco
      // const appointment = await prisma.appointment.findUnique({
      //   where: { id: appointmentId },
      //   include: {
      //     agent: true,
      //     contact: true,
      //     property: true
      //   }
      // });

      // Mock data
      const appointment: Appointment = {
        id: appointmentId,
        title: 'Agendamento Atualizado',
        description: 'Descrição atualizada',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        status: 'CONFIRMED' as any,
        type: 'PROPERTY_VIEWING' as any,
        notes: 'Observações atualizadas',
        agentId: 'agent-id',
        contactId: 'contact-id',
        propertyId: 'property-id',
        googleCalendarEventId: 'google-event-id',
        autoAssigned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!appointment || !appointment.googleCalendarEventId) {
        console.log('Agendamento não tem evento Google associado');
        return false;
      }

      const eventData = this.convertAppointmentToGoogleEvent(appointment);
      await this.client.updateEvent('primary', appointment.googleCalendarEventId, eventData);

      console.log('Evento Google Calendar atualizado');
      return true;

    } catch (error) {
      console.error('Erro ao atualizar evento no Google Calendar:', error);
      throw new Error('Falha ao atualizar evento no Google Calendar');
    }
  }

  /**
   * Deletar evento do Google Calendar quando agendamento for cancelado
   * @param appointmentId - ID do agendamento
   * @returns true se deletado com sucesso
   */
  async deleteGoogleEventFromAppointment(appointmentId: string): Promise<boolean> {
    try {
      // TODO: Buscar agendamento do banco
      // const appointment = await prisma.appointment.findUnique({
      //   where: { id: appointmentId }
      // });

      // Mock data
      const appointment: Appointment = {
        id: appointmentId,
        title: 'Agendamento Cancelado',
        description: 'Descrição',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        status: 'CANCELLED' as any,
        type: 'PROPERTY_VIEWING' as any,
        notes: 'Cancelado',
        agentId: 'agent-id',
        contactId: 'contact-id',
        propertyId: 'property-id',
        googleCalendarEventId: 'google-event-id',
        autoAssigned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!appointment || !appointment.googleCalendarEventId) {
        console.log('Agendamento não tem evento Google associado');
        return false;
      }

      await this.client.deleteEvent('primary', appointment.googleCalendarEventId);

      // TODO: Limpar ID do evento Google no banco
      // await prisma.appointment.update({
      //   where: { id: appointmentId },
      //   data: { googleCalendarEventId: null }
      // });

      console.log('Evento Google Calendar deletado');
      return true;

    } catch (error) {
      console.error('Erro ao deletar evento no Google Calendar:', error);
      throw new Error('Falha ao deletar evento no Google Calendar');
    }
  }

  /**
   * Sincronização completa bidirecional
   * @param userId - ID do usuário
   * @param calendarId - ID do calendário
   * @returns Resumo da sincronização
   */
  async fullSync(userId: string, calendarId: string = 'primary'): Promise<{
    toGoogle: number;
    fromGoogle: number;
    errors: string[];
  }> {
    const result = {
      toGoogle: 0,
      fromGoogle: 0,
      errors: [] as string[]
    };

    try {
      // Sincronizar do banco para Google
      // TODO: Buscar agendamentos não sincronizados
      // const unsyncedAppointments = await prisma.appointment.findMany({
      //   where: {
      //     agentId: userId,
      //     googleCalendarEventId: null,
      //     status: { not: 'CANCELLED' }
      //   }
      // });

      // for (const appointment of unsyncedAppointments) {
      //   try {
      //     await this.syncAppointmentToGoogle(appointment.id);
      //     result.toGoogle++;
      //   } catch (error) {
      //     result.errors.push(`Erro ao sincronizar agendamento ${appointment.id}: ${error}`);
      //   }
      // }

      // Sincronizar do Google para banco
      try {
        result.fromGoogle = await this.syncFromGoogleCalendar(userId, calendarId);
      } catch (error) {
        result.errors.push(`Erro na sincronização do Google: ${error}`);
      }

      console.log('Sincronização completa realizada:', result);
      return result;

    } catch (error) {
      console.error('Erro na sincronização completa:', error);
      throw new Error('Falha na sincronização completa');
    }
  }

  /**
   * Converter agendamento para evento do Google Calendar
   * @param appointment - Agendamento do banco
   * @returns Evento do Google Calendar
   */
  private convertAppointmentToGoogleEvent(appointment: Appointment): {
    summary: string;
    description?: string;
    start: GoogleCalendarDateTime;
    end: GoogleCalendarDateTime;
    attendees?: GoogleCalendarAttendee[];
    reminders?: GoogleCalendarReminders;
  } {
    const summary = appointment.title || `Agendamento - ${appointment.type}`;
    
    let description = '';
    if (appointment.description) description += appointment.description + '\n\n';
    if (appointment.notes) description += `Observações: ${appointment.notes}\n`;
    if (appointment.property) description += `Propriedade: ${appointment.property.title}\n`;
    if (appointment.contact) description += `Cliente: ${appointment.contact.name}\n`;
    if (appointment.agent) description += `Corretor: ${appointment.agent.name}`;

    const start: GoogleCalendarDateTime = {
      dateTime: appointment.startTime.toISOString(),
      timeZone: 'America/Sao_Paulo'
    };

    const end: GoogleCalendarDateTime = {
      dateTime: appointment.endTime.toISOString(),
      timeZone: 'America/Sao_Paulo'
    };

    const attendees: GoogleCalendarAttendee[] = [];
    
    // TODO: Adicionar emails reais dos participantes
    // if (appointment.agent?.email) {
    //   attendees.push({ email: appointment.agent.email });
    // }
    // if (appointment.contact?.email) {
    //   attendees.push({ email: appointment.contact.email });
    // }

    const reminders: GoogleCalendarReminders = {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 30 } // 30 min antes
      ]
    };

    return {
      summary,
      description: description.trim() || undefined,
      start,
      end,
      attendees: attendees.length > 0 ? attendees : undefined,
      reminders
    };
  }

  /**
   * Converter evento do Google Calendar para agendamento
   * @param event - Evento do Google Calendar
   * @param agentId - ID do agente
   * @returns Dados do agendamento
   */
  private convertGoogleEventToAppointment(event: GoogleCalendarEvent, agentId: string): {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
    type: any;
    status: any;
  } {
    const title = event.summary || 'Evento do Google Calendar';
    const description = event.description;
    
    const startTime = new Date(event.start.dateTime || event.start.date!);
    const endTime = new Date(event.end.dateTime || event.end.date!);

    // Determinar tipo baseado no título ou descrição
    let type = 'OTHER';
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description?.toLowerCase() || '';

    if (lowerTitle.includes('visita') || lowerTitle.includes('imóvel') || lowerDesc.includes('imóvel')) {
      type = 'PROPERTY_VIEWING';
    } else if (lowerTitle.includes('reunião') || lowerTitle.includes('cliente')) {
      type = 'CLIENT_MEETING';
    } else if (lowerTitle.includes('negociação') || lowerTitle.includes('proposta')) {
      type = 'NEGOTIATION';
    } else if (lowerTitle.includes('documento') || lowerTitle.includes('assinatura')) {
      type = 'DOCUMENT_SIGNING';
    } else if (lowerTitle.includes('follow') || lowerTitle.includes('acompanhamento')) {
      type = 'FOLLOW_UP';
    }

    // Determinar status
    let status = 'SCHEDULED';
    if (event.status === 'confirmed') {
      status = 'CONFIRMED';
    } else if (event.status === 'cancelled') {
      status = 'CANCELLED';
    } else if (event.status === 'tentative') {
      status = 'SCHEDULED';
    }

    return {
      title,
      description,
      startTime,
      endTime,
      notes: description,
      type,
      status
    };
  }

  /**
   * Verificar conflitos de sincronização
   * @param appointmentId - ID do agendamento
   * @returns Lista de conflitos encontrados
   */
  async checkSyncConflicts(appointmentId: string): Promise<string[]> {
    const conflicts: string[] = [];

    try {
      // TODO: Implementar verificação de conflitos
      // - Verificar se horário está disponível no Google Calendar
      // - Verificar se há eventos sobrepostos
      // - Verificar se agendamento foi modificado em ambas as fontes

      console.log('Verificação de conflitos realizada');
      return conflicts;

    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      conflicts.push('Erro ao verificar conflitos de sincronização');
      return conflicts;
    }
  }

  /**
   * Resolver conflitos de sincronização
   * @param appointmentId - ID do agendamento
   * @param resolution - Estratégia de resolução ('local' | 'google' | 'manual')
   * @returns true se resolvido com sucesso
   */
  async resolveSyncConflicts(appointmentId: string, resolution: 'local' | 'google' | 'manual'): Promise<boolean> {
    try {
      switch (resolution) {
        case 'local':
          // Usar dados locais e sobrescrever Google Calendar
          await this.updateGoogleEventFromAppointment(appointmentId);
          break;
        
        case 'google':
          // Usar dados do Google Calendar e sobrescrever local
          // TODO: Implementar sincronização do Google para local
          break;
        
        case 'manual':
          // Requer intervenção manual
          console.log('Resolução manual necessária para agendamento:', appointmentId);
          return false;
      }

      console.log('Conflitos resolvidos para agendamento:', appointmentId);
      return true;

    } catch (error) {
      console.error('Erro ao resolver conflitos:', error);
      return false;
    }
  }
}

// =====================================================
// UTILITÁRIOS DE SINCRONIZAÇÃO
// =====================================================

/**
 * Criar instância de sincronização
 * @param auth - Instância de autenticação
 * @returns Instância de sincronização
 */
export function createGoogleCalendarSync(auth: GoogleCalendarAuth): GoogleCalendarSync {
  const client = new GoogleCalendarClient(auth);
  return new GoogleCalendarSync(client, auth);
}

/**
 * Verificar se sincronização está disponível
 * @param userId - ID do usuário
 * @returns true se disponível, false caso contrário
 */
export async function isSyncAvailable(userId: string): Promise<boolean> {
  try {
    // TODO: Verificar se usuário tem tokens do Google Calendar
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: { googleRefreshToken: true }
    // });
    
    // return !!user?.googleRefreshToken;
    
    // Mock para teste
    return true;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de sincronização:', error);
    return false;
  }
}

// =====================================================
// TIPOS DE ERRO
// =====================================================

export class GoogleCalendarSyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GoogleCalendarSyncError';
  }
}

export class SyncConflictError extends GoogleCalendarSyncError {
  constructor(details?: any) {
    super('Conflito de sincronização detectado', 'SYNC_CONFLICT', details);
    this.name = 'SyncConflictError';
  }
}

export class SyncFailedError extends GoogleCalendarSyncError {
  constructor(details?: any) {
    super('Falha na sincronização', 'SYNC_FAILED', details);
    this.name = 'SyncFailedError';
  }
} 