// =====================================================
// CLIENTE GOOGLE CALENDAR API - IMOBIPRO DASHBOARD
// =====================================================

import { google } from 'googleapis';
import { GoogleCalendarAuth } from './auth';
import type { 
  GoogleCalendarEvent, 
  GoogleCalendarDateTime, 
  GoogleCalendarAttendee, 
  GoogleCalendarReminders,
  GoogleCalendar,
  GoogleCalendarList
} from '@/types/agenda';

export class GoogleCalendarClient {
  private calendar: any;
  private auth: GoogleCalendarAuth;

  constructor(auth: GoogleCalendarAuth) {
    this.auth = auth;
    this.calendar = google.calendar({
      version: 'v3',
      auth: auth.getOAuth2Client()
    });
  }

  /**
   * Criar evento no Google Calendar
   * @param calendarId - ID do calendário (use 'primary' para calendário principal)
   * @param eventData - Dados do evento
   * @returns Evento criado
   */
  async createEvent(calendarId: string, eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: GoogleCalendarDateTime;
    end: GoogleCalendarDateTime;
    attendees?: GoogleCalendarAttendee[];
    reminders?: GoogleCalendarReminders;
    transparency?: 'opaque' | 'transparent';
  }): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventData,
        sendUpdates: 'all' // Enviar notificações para participantes
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw new Error('Falha ao criar evento no Google Calendar');
    }
  }

  /**
   * Buscar eventos do calendário
   * @param calendarId - ID do calendário
   * @param params - Parâmetros de busca
   * @returns Lista de eventos
   */
  async listEvents(calendarId: string, params: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: string;
    q?: string; // Busca por texto
  } = {}): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        ...params,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      throw new Error('Falha ao buscar eventos do Google Calendar');
    }
  }

  /**
   * Obter evento específico
   * @param calendarId - ID do calendário
   * @param eventId - ID do evento
   * @returns Evento
   */
  async getEvent(calendarId: string, eventId: string): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao obter evento:', error);
      throw new Error('Falha ao obter evento do Google Calendar');
    }
  }

  /**
   * Atualizar evento existente
   * @param calendarId - ID do calendário
   * @param eventId - ID do evento
   * @param eventData - Novos dados do evento
   * @returns Evento atualizado
   */
  async updateEvent(calendarId: string, eventId: string, eventData: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
        sendUpdates: 'all'
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw new Error('Falha ao atualizar evento no Google Calendar');
    }
  }

  /**
   * Deletar evento
   * @param calendarId - ID do calendário
   * @param eventId - ID do evento
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw new Error('Falha ao deletar evento do Google Calendar');
    }
  }

  /**
   * Buscar calendários do usuário
   * @returns Lista de calendários
   */
  async listCalendars(): Promise<GoogleCalendar[]> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao listar calendários:', error);
      throw new Error('Falha ao buscar calendários do Google Calendar');
    }
  }

  /**
   * Obter calendário específico
   * @param calendarId - ID do calendário
   * @returns Calendário
   */
  async getCalendar(calendarId: string): Promise<GoogleCalendar> {
    try {
      const response = await this.calendar.calendars.get({
        calendarId
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao obter calendário:', error);
      throw new Error('Falha ao obter calendário do Google Calendar');
    }
  }

  /**
   * Criar calendário personalizado
   * @param calendarData - Dados do calendário
   * @returns Calendário criado
   */
  async createCalendar(calendarData: {
    summary: string;
    description?: string;
    location?: string;
    timeZone?: string;
  }): Promise<GoogleCalendar> {
    try {
      const response = await this.calendar.calendars.insert({
        requestBody: calendarData
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar calendário:', error);
      throw new Error('Falha ao criar calendário no Google Calendar');
    }
  }

  /**
   * Atualizar calendário
   * @param calendarId - ID do calendário
   * @param calendarData - Novos dados do calendário
   * @returns Calendário atualizado
   */
  async updateCalendar(calendarId: string, calendarData: Partial<GoogleCalendar>): Promise<GoogleCalendar> {
    try {
      const response = await this.calendar.calendars.update({
        calendarId,
        requestBody: calendarData
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar calendário:', error);
      throw new Error('Falha ao atualizar calendário no Google Calendar');
    }
  }

  /**
   * Deletar calendário
   * @param calendarId - ID do calendário
   */
  async deleteCalendar(calendarId: string): Promise<void> {
    try {
      await this.calendar.calendars.delete({
        calendarId
      });
    } catch (error) {
      console.error('Erro ao deletar calendário:', error);
      throw new Error('Falha ao deletar calendário do Google Calendar');
    }
  }

  /**
   * Configurar webhook para um calendário
   * @param calendarId - ID do calendário
   * @param webhookData - Dados do webhook
   * @returns Dados do webhook configurado
   */
  async setupWebhook(calendarId: string, webhookData: {
    id: string;
    type: 'web_hook';
    address: string;
    params?: {
      ttl?: string;
    };
  }): Promise<any> {
    try {
      const response = await this.calendar.events.watch({
        calendarId,
        requestBody: webhookData
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      throw new Error('Falha ao configurar webhook do Google Calendar');
    }
  }

  /**
   * Parar webhook
   * @param calendarId - ID do calendário
   * @param resourceId - ID do recurso do webhook
   */
  async stopWebhook(calendarId: string, resourceId: string): Promise<void> {
    try {
      await this.calendar.events.stop({
        calendarId,
        requestBody: {
          id: resourceId
        }
      });
    } catch (error) {
      console.error('Erro ao parar webhook:', error);
      throw new Error('Falha ao parar webhook do Google Calendar');
    }
  }

  /**
   * Buscar eventos por texto
   * @param calendarId - ID do calendário
   * @param query - Texto para busca
   * @param params - Parâmetros adicionais
   * @returns Lista de eventos encontrados
   */
  async searchEvents(calendarId: string, query: string, params: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  } = {}): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        q: query,
        ...params,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      throw new Error('Falha ao buscar eventos no Google Calendar');
    }
  }

  /**
   * Obter eventos recorrentes
   * @param calendarId - ID do calendário
   * @param eventId - ID do evento recorrente
   * @param params - Parâmetros de busca
   * @returns Lista de instâncias do evento recorrente
   */
  async getRecurringEventInstances(calendarId: string, eventId: string, params: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  } = {}): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.instances({
        calendarId,
        eventId,
        ...params
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter instâncias de evento recorrente:', error);
      throw new Error('Falha ao obter instâncias de evento recorrente');
    }
  }

  /**
   * Verificar disponibilidade de horário
   * @param calendarId - ID do calendário
   * @param startTime - Horário de início
   * @param endTime - Horário de fim
   * @returns true se disponível, false caso contrário
   */
  async checkAvailability(calendarId: string, startTime: string, endTime: string): Promise<boolean> {
    try {
      const events = await this.listEvents(calendarId, {
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true
      });

      // Se não há eventos no período, está disponível
      return events.length === 0;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      throw new Error('Falha ao verificar disponibilidade no Google Calendar');
    }
  }

  /**
   * Obter estatísticas do calendário
   * @param calendarId - ID do calendário
   * @param timeMin - Data/hora mínima
   * @param timeMax - Data/hora máxima
   * @returns Estatísticas do calendário
   */
  async getCalendarStats(calendarId: string, timeMin: string, timeMax: string): Promise<{
    totalEvents: number;
    confirmedEvents: number;
    cancelledEvents: number;
    tentativeEvents: number;
    averageEventDuration: number;
  }> {
    try {
      const events = await this.listEvents(calendarId, {
        timeMin,
        timeMax,
        singleEvents: true
      });

      const stats = {
        totalEvents: events.length,
        confirmedEvents: events.filter(e => e.status === 'confirmed').length,
        cancelledEvents: events.filter(e => e.status === 'cancelled').length,
        tentativeEvents: events.filter(e => e.status === 'tentative').length,
        averageEventDuration: 0
      };

      // Calcular duração média dos eventos
      if (events.length > 0) {
        const totalDuration = events.reduce((total, event) => {
          if (event.start?.dateTime && event.end?.dateTime) {
            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);
            return total + (end.getTime() - start.getTime());
          }
          return total;
        }, 0);

        stats.averageEventDuration = totalDuration / events.length;
      }

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas do calendário:', error);
      throw new Error('Falha ao obter estatísticas do Google Calendar');
    }
  }
}

// =====================================================
// UTILITÁRIOS DO CLIENTE
// =====================================================

/**
 * Criar instância do cliente com autenticação
 * @param auth - Instância de autenticação
 * @returns Cliente do Google Calendar
 */
export function createGoogleCalendarClient(auth: GoogleCalendarAuth): GoogleCalendarClient {
  return new GoogleCalendarClient(auth);
}

/**
 * Validar dados de evento antes de enviar
 * @param eventData - Dados do evento
 * @returns true se válido, false caso contrário
 */
export function validateEventData(eventData: any): boolean {
  if (!eventData.summary || !eventData.start || !eventData.end) {
    return false;
  }

  // Validar formato de data/hora
  const start = eventData.start.dateTime || eventData.start.date;
  const end = eventData.end.dateTime || eventData.end.date;

  if (!start || !end) {
    return false;
  }

  // Verificar se end > start
  const startDate = new Date(start);
  const endDate = new Date(end);

  return endDate > startDate;
}

/**
 * Formatar dados de evento para envio
 * @param eventData - Dados do evento
 * @returns Dados formatados
 */
export function formatEventData(eventData: any): GoogleCalendarEvent {
  return {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: eventData.start.dateTime,
      timeZone: eventData.start.timeZone || 'America/Sao_Paulo'
    },
    end: {
      dateTime: eventData.end.dateTime,
      timeZone: eventData.end.timeZone || 'America/Sao_Paulo'
    },
    attendees: eventData.attendees,
    reminders: eventData.reminders,
    transparency: eventData.transparency || 'opaque'
  };
}

// =====================================================
// TIPOS DE ERRO
// =====================================================

export class GoogleCalendarClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GoogleCalendarClientError';
  }
}

export class EventCreationError extends GoogleCalendarClientError {
  constructor(details?: any) {
    super('Falha ao criar evento no Google Calendar', 'EVENT_CREATION_FAILED', details);
    this.name = 'EventCreationError';
  }
}

export class EventUpdateError extends GoogleCalendarClientError {
  constructor(details?: any) {
    super('Falha ao atualizar evento no Google Calendar', 'EVENT_UPDATE_FAILED', details);
    this.name = 'EventUpdateError';
  }
}

export class EventDeletionError extends GoogleCalendarClientError {
  constructor(details?: any) {
    super('Falha ao deletar evento do Google Calendar', 'EVENT_DELETION_FAILED', details);
    this.name = 'EventDeletionError';
  }
}

export class CalendarAccessError extends GoogleCalendarClientError {
  constructor(details?: any) {
    super('Falha ao acessar calendário do Google Calendar', 'CALENDAR_ACCESS_FAILED', details);
    this.name = 'CalendarAccessError';
  }
} 