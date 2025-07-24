// =====================================================
// WEBHOOKS GOOGLE CALENDAR - IMOBIPRO DASHBOARD
// =====================================================

import { GoogleCalendarClient } from './client';
import { GoogleCalendarAuth } from './auth';
import { GoogleCalendarSync } from './sync';
import type { 
  GoogleCalendarWebhook, 
  GoogleCalendarWebhookNotification,
  GoogleCalendarEvent 
} from '@/types/agenda';

export class GoogleCalendarWebhooks {
  private client: GoogleCalendarClient;
  private auth: GoogleCalendarAuth;
  private sync: GoogleCalendarSync;

  constructor(client: GoogleCalendarClient, auth: GoogleCalendarAuth, sync: GoogleCalendarSync) {
    this.client = client;
    this.auth = auth;
    this.sync = sync;
  }

  /**
   * Configurar webhook para um calendário
   * @param calendarId - ID do calendário
   * @param webhookUrl - URL do webhook
   * @param userId - ID do usuário
   * @returns Dados do webhook configurado
   */
  async setupWebhook(calendarId: string, webhookUrl: string, userId: string): Promise<GoogleCalendarWebhook> {
    try {
      const webhookId = `imobipro-${calendarId}-${userId}-${Date.now()}`;
      
      const response = await this.client.setupWebhook(calendarId, {
        id: webhookId,
        type: 'web_hook',
        address: webhookUrl,
        params: {
          ttl: '86400' // 24 horas
        }
      });

      const webhookData: GoogleCalendarWebhook = {
        id: webhookId,
        calendarId,
        webhookUrl,
        resourceId: response.resourceId,
        expiration: new Date(response.expiration),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TODO: Salvar informações do webhook no banco
      // await prisma.googleCalendarWebhook.create({
      //   data: webhookData
      // });

      console.log('Webhook configurado com sucesso:', webhookId);
      return webhookData;

    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      throw new Error('Falha ao configurar webhook do Google Calendar');
    }
  }

  /**
   * Processar notificação de webhook
   * @param notification - Dados da notificação
   * @param userId - ID do usuário
   * @returns true se processado com sucesso
   */
  async processWebhookNotification(notification: GoogleCalendarWebhookNotification, userId: string): Promise<boolean> {
    try {
      console.log('Processando notificação de webhook:', notification);

      const { resourceId, resourceUri } = notification;

      // Buscar eventos atualizados
      const events = await this.client.listEvents('primary', {
        timeMin: new Date().toISOString(),
        maxResults: 10
      });

      // Sincronizar eventos atualizados
      for (const event of events) {
        await this.syncEventToDatabase(event, userId);
      }

      console.log('Notificação de webhook processada com sucesso');
      return true;

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw new Error('Falha ao processar notificação de webhook');
    }
  }

  /**
   * Renovar webhook expirado
   * @param webhookId - ID do webhook
   * @param calendarId - ID do calendário
   * @param webhookUrl - URL do webhook
   * @param userId - ID do usuário
   * @returns Novos dados do webhook
   */
  async renewWebhook(webhookId: string, calendarId: string, webhookUrl: string, userId: string): Promise<GoogleCalendarWebhook> {
    try {
      // Parar webhook antigo
      await this.stopWebhook(webhookId, calendarId);

      // Configurar novo webhook
      const newWebhook = await this.setupWebhook(calendarId, webhookUrl, userId);

      console.log('Webhook renovado com sucesso:', webhookId);
      return newWebhook;

    } catch (error) {
      console.error('Erro ao renovar webhook:', error);
      throw new Error('Falha ao renovar webhook do Google Calendar');
    }
  }

  /**
   * Parar webhook
   * @param webhookId - ID do webhook
   * @param calendarId - ID do calendário
   */
  async stopWebhook(webhookId: string, calendarId: string): Promise<void> {
    try {
      // TODO: Buscar resourceId do webhook no banco
      // const webhook = await prisma.googleCalendarWebhook.findUnique({
      //   where: { id: webhookId }
      // });

      // if (webhook) {
      //   await this.client.stopWebhook(calendarId, webhook.resourceId);
      //   
      //   // Deletar webhook do banco
      //   await prisma.googleCalendarWebhook.delete({
      //     where: { id: webhookId }
      //   });
      // }

      // Mock para teste
      console.log('Webhook parado:', webhookId);

    } catch (error) {
      console.error('Erro ao parar webhook:', error);
      throw new Error('Falha ao parar webhook do Google Calendar');
    }
  }

  /**
   * Listar webhooks ativos
   * @param userId - ID do usuário
   * @returns Lista de webhooks ativos
   */
  async listActiveWebhooks(userId: string): Promise<GoogleCalendarWebhook[]> {
    try {
      // TODO: Buscar webhooks do usuário no banco
      // const webhooks = await prisma.googleCalendarWebhook.findMany({
      //   where: {
      //     calendarId: { contains: userId }
      //   }
      // });

      // Filtrar webhooks expirados
      // const activeWebhooks = webhooks.filter(webhook => 
      //   new Date(webhook.expiration) > new Date()
      // );

      // Mock para teste
      const activeWebhooks: GoogleCalendarWebhook[] = [];

      return activeWebhooks;

    } catch (error) {
      console.error('Erro ao listar webhooks ativos:', error);
      throw new Error('Falha ao listar webhooks ativos');
    }
  }

  /**
   * Verificar status dos webhooks
   * @param userId - ID do usuário
   * @returns Status dos webhooks
   */
  async checkWebhookStatus(userId: string): Promise<{
    active: number;
    expired: number;
    total: number;
  }> {
    try {
      const webhooks = await this.listActiveWebhooks(userId);
      const now = new Date();

      const active = webhooks.filter(w => new Date(w.expiration) > now).length;
      const expired = webhooks.filter(w => new Date(w.expiration) <= now).length;

      return {
        active,
        expired,
        total: webhooks.length
      };

    } catch (error) {
      console.error('Erro ao verificar status dos webhooks:', error);
      throw new Error('Falha ao verificar status dos webhooks');
    }
  }

  /**
   * Sincronizar evento específico para o banco de dados
   * @param event - Evento do Google Calendar
   * @param userId - ID do usuário
   */
  private async syncEventToDatabase(event: GoogleCalendarEvent, userId: string): Promise<void> {
    try {
      // TODO: Verificar se evento já existe no banco
      // const existingAppointment = await prisma.appointment.findFirst({
      //   where: { googleCalendarEventId: event.id }
      // });

      // if (!existingAppointment) {
      //   // Criar novo agendamento
      //   const appointmentData = this.sync.convertGoogleEventToAppointment(event, userId);
      //   
      //   await prisma.appointment.create({
      //     data: {
      //       ...appointmentData,
      //       googleCalendarEventId: event.id,
      //       agentId: userId
      //     }
      //   });
      // } else {
      //   // Atualizar agendamento existente
      //   const appointmentData = this.sync.convertGoogleEventToAppointment(event, userId);
      //   
      //   await prisma.appointment.update({
      //     where: { id: existingAppointment.id },
      //     data: appointmentData
      //   });
      // }

      console.log('Evento sincronizado para banco:', event.id);

    } catch (error) {
      console.error('Erro ao sincronizar evento para banco:', error);
      throw new Error('Falha ao sincronizar evento para banco de dados');
    }
  }

  /**
   * Validar assinatura do webhook (segurança)
   * @param payload - Payload da requisição
   * @param signature - Assinatura do webhook
   * @returns true se válido, false caso contrário
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      // TODO: Implementar validação de assinatura
      // Verificar se a requisição realmente veio do Google
      // Usar HMAC-SHA256 com o client secret

      // Por enquanto, aceitar todas as requisições
      return true;

    } catch (error) {
      console.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }

  /**
   * Processar diferentes tipos de notificação
   * @param notification - Dados da notificação
   * @param userId - ID do usuário
   */
  async processNotificationByType(notification: GoogleCalendarWebhookNotification, userId: string): Promise<void> {
    try {
      const { resourceUri } = notification;

      // Extrair informações da URI do recurso
      const calendarId = this.extractCalendarIdFromUri(resourceUri);
      const eventId = this.extractEventIdFromUri(resourceUri);

      if (eventId) {
        // Notificação específica de evento
        await this.processEventNotification(eventId, calendarId, userId);
      } else {
        // Notificação geral do calendário
        await this.processCalendarNotification(calendarId, userId);
      }

    } catch (error) {
      console.error('Erro ao processar notificação por tipo:', error);
      throw new Error('Falha ao processar notificação por tipo');
    }
  }

  /**
   * Processar notificação de evento específico
   * @param eventId - ID do evento
   * @param calendarId - ID do calendário
   * @param userId - ID do usuário
   */
  private async processEventNotification(eventId: string, calendarId: string, userId: string): Promise<void> {
    try {
      const event = await this.client.getEvent(calendarId, eventId);
      await this.syncEventToDatabase(event, userId);

    } catch (error) {
      console.error('Erro ao processar notificação de evento:', error);
      throw new Error('Falha ao processar notificação de evento');
    }
  }

  /**
   * Processar notificação geral do calendário
   * @param calendarId - ID do calendário
   * @param userId - ID do usuário
   */
  private async processCalendarNotification(calendarId: string, userId: string): Promise<void> {
    try {
      // Sincronizar todos os eventos recentes
      await this.sync.syncFromGoogleCalendar(userId, calendarId);

    } catch (error) {
      console.error('Erro ao processar notificação do calendário:', error);
      throw new Error('Falha ao processar notificação do calendário');
    }
  }

  /**
   * Extrair ID do calendário da URI do recurso
   * @param resourceUri - URI do recurso
   * @returns ID do calendário
   */
  private extractCalendarIdFromUri(resourceUri: string): string {
    try {
      // Exemplo: https://www.googleapis.com/calendar/v3/calendars/primary/events
      const match = resourceUri.match(/\/calendars\/([^\/]+)/);
      return match ? match[1] : 'primary';
    } catch (error) {
      console.error('Erro ao extrair ID do calendário:', error);
      return 'primary';
    }
  }

  /**
   * Extrair ID do evento da URI do recurso
   * @param resourceUri - URI do recurso
   * @returns ID do evento ou null
   */
  private extractEventIdFromUri(resourceUri: string): string | null {
    try {
      // Exemplo: https://www.googleapis.com/calendar/v3/calendars/primary/events/eventId
      const match = resourceUri.match(/\/events\/([^\/\?]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Erro ao extrair ID do evento:', error);
      return null;
    }
  }

  /**
   * Configurar webhooks para todos os calendários do usuário
   * @param userId - ID do usuário
   * @param webhookUrl - URL base do webhook
   * @returns Lista de webhooks configurados
   */
  async setupWebhooksForAllCalendars(userId: string, webhookUrl: string): Promise<GoogleCalendarWebhook[]> {
    try {
      const calendars = await this.client.listCalendars();
      const webhooks: GoogleCalendarWebhook[] = [];

      for (const calendar of calendars) {
        if (calendar.accessRole === 'owner' || calendar.accessRole === 'writer') {
          const webhook = await this.setupWebhook(calendar.id, webhookUrl, userId);
          webhooks.push(webhook);
        }
      }

      console.log(`${webhooks.length} webhooks configurados para ${calendars.length} calendários`);
      return webhooks;

    } catch (error) {
      console.error('Erro ao configurar webhooks para todos os calendários:', error);
      throw new Error('Falha ao configurar webhooks para todos os calendários');
    }
  }

  /**
   * Limpar webhooks expirados
   * @param userId - ID do usuário
   * @returns Número de webhooks removidos
   */
  async cleanupExpiredWebhooks(userId: string): Promise<number> {
    try {
      const webhooks = await this.listActiveWebhooks(userId);
      const now = new Date();
      let removedCount = 0;

      for (const webhook of webhooks) {
        if (new Date(webhook.expiration) <= now) {
          await this.stopWebhook(webhook.id, webhook.calendarId);
          removedCount++;
        }
      }

      console.log(`${removedCount} webhooks expirados removidos`);
      return removedCount;

    } catch (error) {
      console.error('Erro ao limpar webhooks expirados:', error);
      throw new Error('Falha ao limpar webhooks expirados');
    }
  }
}

// =====================================================
// UTILITÁRIOS DE WEBHOOK
// =====================================================

/**
 * Criar instância de webhooks
 * @param auth - Instância de autenticação
 * @returns Instância de webhooks
 */
export function createGoogleCalendarWebhooks(auth: GoogleCalendarAuth): GoogleCalendarWebhooks {
  const client = new GoogleCalendarClient(auth);
  const sync = new GoogleCalendarSync(client, auth);
  return new GoogleCalendarWebhooks(client, auth, sync);
}

/**
 * Gerar URL do webhook
 * @param baseUrl - URL base da aplicação
 * @param userId - ID do usuário
 * @returns URL completa do webhook
 */
export function generateWebhookUrl(baseUrl: string, userId: string): string {
  return `${baseUrl}/api/google-calendar/webhook?userId=${userId}`;
}

/**
 * Verificar se webhook está ativo
 * @param webhook - Dados do webhook
 * @returns true se ativo, false caso contrário
 */
export function isWebhookActive(webhook: GoogleCalendarWebhook): boolean {
  return new Date(webhook.expiration) > new Date();
}

/**
 * Calcular tempo restante do webhook
 * @param webhook - Dados do webhook
 * @returns Tempo restante em milissegundos
 */
export function getWebhookTimeRemaining(webhook: GoogleCalendarWebhook): number {
  return new Date(webhook.expiration).getTime() - new Date().getTime();
}

// =====================================================
// TIPOS DE ERRO
// =====================================================

export class GoogleCalendarWebhookError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GoogleCalendarWebhookError';
  }
}

export class WebhookSetupError extends GoogleCalendarWebhookError {
  constructor(details?: any) {
    super('Falha ao configurar webhook', 'WEBHOOK_SETUP_FAILED', details);
    this.name = 'WebhookSetupError';
  }
}

export class WebhookValidationError extends GoogleCalendarWebhookError {
  constructor(details?: any) {
    super('Falha na validação do webhook', 'WEBHOOK_VALIDATION_FAILED', details);
    this.name = 'WebhookValidationError';
  }
}

export class WebhookProcessingError extends GoogleCalendarWebhookError {
  constructor(details?: any) {
    super('Falha no processamento do webhook', 'WEBHOOK_PROCESSING_FAILED', details);
    this.name = 'WebhookProcessingError';
  }
} 