// =====================================================
// HOOK GOOGLE CALENDAR - IMOBIPRO DASHBOARD
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserWithGoogleCalendar } from '@/types/agenda';
import { 
  googleCalendarAuth, 
  generateAuthUrlWithValidation, 
  processAuthCallback 
} from '@/integrations/google-calendar/auth';
import { createGoogleCalendarClient } from '@/integrations/google-calendar/client';
import { createGoogleCalendarSync } from '@/integrations/google-calendar/sync';
import { createGoogleCalendarWebhooks } from '@/integrations/google-calendar/webhooks';
import type { 
  UseGoogleCalendarReturn,
  GoogleCalendarEvent,
  GoogleCalendar,
  GoogleCalendarWebhook,
  GoogleCalendarWebhookNotification
} from '@/types/agenda';

export const useGoogleCalendar = (): UseGoogleCalendarReturn => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se usuário tem Google Calendar conectado
  useEffect(() => {
    if (user && 'googleRefreshToken' in user && user.googleRefreshToken) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [user]);

  /**
   * Conectar Google Calendar
   * @returns URL de autorização
   */
  const connectGoogleCalendar = useCallback(async (): Promise<string> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { authUrl } = await generateAuthUrlWithValidation(user.id);
      return authUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao gerar URL de autenticação: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Processar callback de autenticação
   * @param code - Código de autorização
   */
  const handleAuthCallback = useCallback(async (code: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokens = await processAuthCallback(code, user.id);

      // TODO: Salvar tokens no banco de dados
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: {
      //     googleRefreshToken: tokens.refresh_token,
      //     googleAccessToken: tokens.access_token,
      //     googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      //   }
      // });

      setIsConnected(true);
      console.log('Google Calendar conectado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha na autenticação: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Desconectar Google Calendar
   */
  const disconnectGoogleCalendar = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setError(null);

    try {
      await googleCalendarAuth.revokeTokens();

      // TODO: Limpar tokens do banco de dados
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: {
      //     googleRefreshToken: null,
      //     googleAccessToken: null,
      //     googleTokenExpiry: null,
      //     googleCalendarId: null
      //   }
      // });

      setIsConnected(false);
      console.log('Google Calendar desconectado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao desconectar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Sincronizar agendamento com Google Calendar
   * @param appointmentId - ID do agendamento
   */
  const syncAppointment = useCallback(async (appointmentId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const sync = createGoogleCalendarSync(googleCalendarAuth);
      await sync.syncAppointmentToGoogle(appointmentId);
      console.log('Agendamento sincronizado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha na sincronização: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Listar calendários do usuário
   * @returns Lista de calendários
   */
  const listCalendars = useCallback(async (): Promise<GoogleCalendar[]> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGoogleCalendarClient(googleCalendarAuth);
      const calendars = await client.listCalendars();
      return calendars;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao listar calendários: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Listar eventos do calendário
   * @param calendarId - ID do calendário
   * @param params - Parâmetros de busca
   * @returns Lista de eventos
   */
  const listEvents = useCallback(async (
    calendarId: string = 'primary', 
    params: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      q?: string;
    } = {}
  ): Promise<GoogleCalendarEvent[]> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGoogleCalendarClient(googleCalendarAuth);
      const events = await client.listEvents(calendarId, params);
      return events;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao listar eventos: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Criar evento no Google Calendar
   * @param eventData - Dados do evento
   * @param calendarId - ID do calendário
   * @returns Evento criado
   */
  const createEvent = useCallback(async (
    eventData: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone?: string };
      end: { dateTime: string; timeZone?: string };
      attendees?: Array<{ email: string }>;
    },
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGoogleCalendarClient(googleCalendarAuth);
      const event = await client.createEvent(calendarId, eventData);
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao criar evento: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Atualizar evento no Google Calendar
   * @param eventId - ID do evento
   * @param eventData - Novos dados do evento
   * @param calendarId - ID do calendário
   * @returns Evento atualizado
   */
  const updateEvent = useCallback(async (
    eventId: string,
    eventData: Partial<GoogleCalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGoogleCalendarClient(googleCalendarAuth);
      const event = await client.updateEvent(calendarId, eventId, eventData);
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao atualizar evento: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Deletar evento do Google Calendar
   * @param eventId - ID do evento
   * @param calendarId - ID do calendário
   */
  const deleteEvent = useCallback(async (
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGoogleCalendarClient(googleCalendarAuth);
      await client.deleteEvent(calendarId, eventId);
      console.log('Evento deletado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao deletar evento: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Sincronização completa bidirecional
   * @param calendarId - ID do calendário
   * @returns Resumo da sincronização
   */
  const fullSync = useCallback(async (calendarId: string = 'primary') => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const sync = createGoogleCalendarSync(googleCalendarAuth);
      const result = await sync.fullSync(user.id, calendarId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha na sincronização completa: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Configurar webhook para sincronização em tempo real
   * @param webhookUrl - URL do webhook
   * @param calendarId - ID do calendário
   * @returns Dados do webhook configurado
   */
  const setupWebhook = useCallback(async (
    webhookUrl: string,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarWebhook> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const webhooks = createGoogleCalendarWebhooks(googleCalendarAuth);
      const webhook = await webhooks.setupWebhook(calendarId, webhookUrl, user.id);
      return webhook;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao configurar webhook: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Processar notificação de webhook
   * @param notification - Dados da notificação
   */
  const processWebhookNotification = useCallback(async (
    notification: GoogleCalendarWebhookNotification
  ): Promise<boolean> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    try {
      const webhooks = createGoogleCalendarWebhooks(googleCalendarAuth);
      const result = await webhooks.processWebhookNotification(notification, user.id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao processar webhook: ${errorMessage}`);
    }
  }, [user?.id, isConnected]);

  /**
   * Verificar disponibilidade de horário
   * @param startTime - Horário de início
   * @param endTime - Horário de fim
   * @param calendarId - ID do calendário
   * @returns true se disponível, false caso contrário
   */
  const checkAvailability = useCallback(async (
    startTime: string,
    endTime: string,
    calendarId: string = 'primary'
  ): Promise<boolean> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGoogleCalendarClient(googleCalendarAuth);
      const isAvailable = await client.checkAvailability(calendarId, startTime, endTime);
      return isAvailable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao verificar disponibilidade: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Obter estatísticas do calendário
   * @param timeMin - Data/hora mínima
   * @param timeMax - Data/hora máxima
   * @param calendarId - ID do calendário
   * @returns Estatísticas do calendário
   */
  const getCalendarStats = useCallback(async (
    timeMin: string,
    timeMax: string,
    calendarId: string = 'primary'
  ) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createGoogleCalendarClient(googleCalendarAuth);
      const stats = await client.getCalendarStats(calendarId, timeMin, timeMax);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao obter estatísticas: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connectGoogleCalendar,
    handleAuthCallback,
    syncAppointment,
    disconnectGoogleCalendar,
    listCalendars,
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    fullSync,
    setupWebhook,
    processWebhookNotification,
    checkAvailability,
    getCalendarStats,
    clearError
  };
};

// =====================================================
// HOOKS AUXILIARES
// =====================================================

/**
 * Hook para verificar status de conexão do Google Calendar
 */
export const useGoogleCalendarStatus = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      if (!user?.id) {
        setIsConnected(false);
        setIsChecking(false);
        return;
      }

      try {
        // TODO: Verificar se usuário tem tokens válidos
        // const userData = await prisma.user.findUnique({
        //   where: { id: user.id },
        //   select: { googleRefreshToken: true, googleTokenExpiry: true }
        // });

        // if (userData?.googleRefreshToken) {
        //   // Verificar se token não expirou
        //   if (!userData.googleTokenExpiry || new Date(userData.googleTokenExpiry) > new Date()) {
        //     setIsConnected(true);
        //   } else {
        //     setIsConnected(false);
        //   }
        // } else {
        //   setIsConnected(false);
        // }

        // Mock para teste
        setIsConnected(!!(user && 'googleRefreshToken' in user && user.googleRefreshToken));
      } catch (error) {
        console.error('Erro ao verificar status do Google Calendar:', error);
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, [user?.id, user && 'googleRefreshToken' in user ? user.googleRefreshToken : undefined]);

  return { isConnected, isChecking };
};

/**
 * Hook para sincronização automática
 */
export const useGoogleCalendarAutoSync = (enabled: boolean = true) => {
  const { user } = useAuth();
  const { isConnected } = useGoogleCalendarStatus();
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const performSync = useCallback(async () => {
    if (!user?.id || !isConnected || !enabled) {
      return;
    }

    setIsSyncing(true);
    try {
      const sync = createGoogleCalendarSync(googleCalendarAuth);
      await sync.fullSync(user.id);
      setLastSync(new Date());
    } catch (error) {
      console.error('Erro na sincronização automática:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, isConnected, enabled]);

  // Sincronização automática a cada 5 minutos
  useEffect(() => {
    if (!enabled || !isConnected) {
      return;
    }

    const interval = setInterval(performSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [performSync, enabled, isConnected]);

  return {
    lastSync,
    isSyncing,
    performSync
  };
}; 