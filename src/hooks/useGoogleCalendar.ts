/**
 * 🗓️ Google Calendar Hooks - ImobiPRO
 * 
 * React Query hooks para gerenciar integração Google Calendar
 * Funcionalidades:
 * - OAuth authentication management
 * - Events CRUD operations
 * - Sync management
 * - Webhook configuration
 * - Real-time status monitoring
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { googleCalendarService, GoogleCalendarEvent, CalendarSyncResult } from '@/services/googleCalendarService';
import { toast } from '@/hooks/use-toast';

// ============= QUERY KEYS =============

export const googleCalendarKeys = {
  all: ['google-calendar'] as const,
  credentials: (userId: string) => [...googleCalendarKeys.all, 'credentials', userId] as const,
  isConnected: (userId: string) => [...googleCalendarKeys.all, 'connected', userId] as const,
  events: (userId: string, options?: any) => [...googleCalendarKeys.all, 'events', userId, options] as const,
  calendars: (userId: string) => [...googleCalendarKeys.all, 'calendars', userId] as const,
  userInfo: (userId: string) => [...googleCalendarKeys.all, 'userInfo', userId] as const,
  syncStatus: (userId: string) => [...googleCalendarKeys.all, 'sync', userId] as const,
} as const;

// ============= AUTHENTICATION HOOKS =============

/**
 * Hook para verificar se o usuário tem Google Calendar conectado
 */
export function useGoogleCalendarConnection(userId: string) {
  return useQuery({
    queryKey: googleCalendarKeys.isConnected(userId),
    queryFn: () => googleCalendarService.isConnected(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para obter informações do usuário Google
 */
export function useGoogleUserInfo(userId: string) {
  return useQuery({
    queryKey: googleCalendarKeys.userInfo(userId),
    queryFn: () => googleCalendarService.getUserInfo(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para iniciar processo de OAuth
 */
export function useGoogleCalendarConnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const authUrl = await googleCalendarService.initiateOAuth(userId);
      
      // Redirecionar para URL de autorização
      window.location.href = authUrl;
      
      return authUrl;
    },
    onSuccess: () => {
      toast({
        title: "🔄 Redirecionando...",
        description: "Você será direcionado para autorizar o Google Calendar",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao conectar Google Calendar:', error);
      toast({
        title: "❌ Erro na conexão",
        description: "Falha ao iniciar autenticação Google Calendar",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para processar callback OAuth
 */
export function useGoogleCalendarCallback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      return await googleCalendarService.handleOAuthCallback(code, state);
    },
    onSuccess: (credentials, variables) => {
      const stateData = JSON.parse(atob(variables.state));
      const { userId } = stateData;

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: googleCalendarKeys.isConnected(userId) });
      queryClient.invalidateQueries({ queryKey: googleCalendarKeys.userInfo(userId) });
      queryClient.invalidateQueries({ queryKey: googleCalendarKeys.calendars(userId) });

      toast({
        title: "✅ Google Calendar conectado!",
        description: "Integração configurada com sucesso",
      });
    },
    onError: (error) => {
      console.error('❌ Erro no callback OAuth:', error);
      toast({
        title: "❌ Erro na autenticação",
        description: "Falha ao processar autorização Google Calendar",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para desconectar Google Calendar
 */
export function useGoogleCalendarDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await googleCalendarService.revokeCredentials(userId);
    },
    onSuccess: (_, userId) => {
      // Limpar cache relacionado
      queryClient.removeQueries({ queryKey: googleCalendarKeys.all });
      
      toast({
        title: "🔄 Google Calendar desconectado",
        description: "Integração removida com sucesso",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao desconectar:', error);
      toast({
        title: "❌ Erro na desconexão",
        description: "Falha ao remover integração Google Calendar",
        variant: "destructive",
      });
    },
  });
}

// ============= CALENDAR & EVENTS HOOKS =============

/**
 * Hook para listar calendários disponíveis
 */
export function useGoogleCalendars(userId: string) {
  return useQuery({
    queryKey: googleCalendarKeys.calendars(userId),
    queryFn: () => googleCalendarService.listCalendars(userId),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
}

/**
 * Hook para listar eventos do Google Calendar
 */
export function useGoogleCalendarEvents(
  userId: string,
  options: {
    calendarId?: string;
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}
) {
  return useQuery({
    queryKey: googleCalendarKeys.events(userId, options),
    queryFn: () => googleCalendarService.listEvents(userId, options),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
}

/**
 * Hook para criar evento no Google Calendar
 */
export function useCreateGoogleCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      event,
      calendarId = 'primary',
    }: {
      userId: string;
      event: GoogleCalendarEvent;
      calendarId?: string;
    }) => {
      return await googleCalendarService.createEvent(userId, event, calendarId);
    },
    onSuccess: (_, variables) => {
      // Invalidar lista de eventos
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.events(variables.userId),
      });

      toast({
        title: "✅ Evento criado",
        description: "Evento adicionado ao Google Calendar",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao criar evento:', error);
      toast({
        title: "❌ Erro ao criar evento",
        description: "Falha ao adicionar evento ao Google Calendar",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para atualizar evento no Google Calendar
 */
export function useUpdateGoogleCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      eventId,
      event,
      calendarId = 'primary',
    }: {
      userId: string;
      eventId: string;
      event: Partial<GoogleCalendarEvent>;
      calendarId?: string;
    }) => {
      return await googleCalendarService.updateEvent(userId, eventId, event, calendarId);
    },
    onSuccess: (_, variables) => {
      // Invalidar lista de eventos
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.events(variables.userId),
      });

      toast({
        title: "✅ Evento atualizado",
        description: "Evento modificado no Google Calendar",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao atualizar evento:', error);
      toast({
        title: "❌ Erro ao atualizar evento",
        description: "Falha ao modificar evento no Google Calendar",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para deletar evento do Google Calendar
 */
export function useDeleteGoogleCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      eventId,
      calendarId = 'primary',
    }: {
      userId: string;
      eventId: string;
      calendarId?: string;
    }) => {
      await googleCalendarService.deleteEvent(userId, eventId, calendarId);
    },
    onSuccess: (_, variables) => {
      // Invalidar lista de eventos
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.events(variables.userId),
      });

      toast({
        title: "✅ Evento removido",
        description: "Evento deletado do Google Calendar",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao deletar evento:', error);
      toast({
        title: "❌ Erro ao deletar evento",
        description: "Falha ao remover evento do Google Calendar",
        variant: "destructive",
      });
    },
  });
}

// ============= SYNC HOOKS =============

/**
 * Hook para sincronizar eventos entre ImobiPRO e Google Calendar
 */
export function useGoogleCalendarSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<CalendarSyncResult> => {
      return await googleCalendarService.syncEvents(userId);
    },
    onSuccess: (result, userId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: googleCalendarKeys.events(userId) });
      queryClient.invalidateQueries({ queryKey: ['agenda'] }); // Agenda hooks

      const { eventsCreated, eventsUpdated, eventsDeleted, errors } = result;
      
      if (result.success) {
        toast({
          title: "✅ Sincronização concluída",
          description: `${eventsCreated} criados, ${eventsUpdated} atualizados, ${eventsDeleted} removidos`,
        });
      } else {
        toast({
          title: "⚠️ Sincronização com erros",
          description: `${errors.length} erros encontrados. Verifique os logs.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('❌ Erro na sincronização:', error);
      toast({
        title: "❌ Erro na sincronização",
        description: "Falha ao sincronizar com Google Calendar",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para status de sincronização
 */
export function useGoogleCalendarSyncStatus(userId: string) {
  return useQuery({
    queryKey: googleCalendarKeys.syncStatus(userId),
    queryFn: async () => {
      // Buscar último registro de sincronização do banco
      // Por enquanto, retornamos um mock
      return {
        lastSyncAt: new Date(),
        eventsInSync: 0,
        pendingSync: 0,
        lastSyncResult: null as CalendarSyncResult | null,
      };
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// ============= WEBHOOK HOOKS =============

/**
 * Hook para configurar webhook do Google Calendar
 */
export function useSetupGoogleCalendarWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      calendarId = 'primary',
    }: {
      userId: string;
      calendarId?: string;
    }) => {
      return await googleCalendarService.setupWebhook(userId, calendarId);
    },
    onSuccess: (webhookConfig, variables) => {
      toast({
        title: "✅ Webhook configurado",
        description: "Notificações em tempo real ativadas",
      });

      // Invalidar status de conexão
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.isConnected(variables.userId),
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao configurar webhook:', error);
      toast({
        title: "❌ Erro no webhook",
        description: "Falha ao configurar notificações em tempo real",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para remover webhook do Google Calendar
 */
export function useRemoveGoogleCalendarWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      channelId,
    }: {
      userId: string;
      channelId: string;
    }) => {
      await googleCalendarService.removeWebhook(userId, channelId);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "🔄 Webhook removido",
        description: "Notificações em tempo real desativadas",
      });

      // Invalidar status de conexão
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.isConnected(variables.userId),
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao remover webhook:', error);
      toast({
        title: "❌ Erro ao remover webhook",
        description: "Falha ao desativar notificações",
        variant: "destructive",
      });
    },
  });
}

// ============= UTILITY HOOKS =============

/**
 * Hook composto para gerenciar Google Calendar (similar ao useAgendaManager)
 */
export function useGoogleCalendarManager(userId: string) {
  const isConnected = useGoogleCalendarConnection(userId);
  const userInfo = useGoogleUserInfo(userId);
  const calendars = useGoogleCalendars(userId);
  const events = useGoogleCalendarEvents(userId);
  
  const connect = useGoogleCalendarConnect();
  const disconnect = useGoogleCalendarDisconnect();
  const sync = useGoogleCalendarSync();
  
  const createEvent = useCreateGoogleCalendarEvent();
  const updateEvent = useUpdateGoogleCalendarEvent();
  const deleteEvent = useDeleteGoogleCalendarEvent();
  
  const setupWebhook = useSetupGoogleCalendarWebhook();
  const removeWebhook = useRemoveGoogleCalendarWebhook();

  return {
    // Status
    isConnected: isConnected.data || false,
    isLoading: isConnected.isLoading,
    userInfo: userInfo.data,
    calendars: calendars.data || [],
    events: events.data || [],
    
    // Actions
    connect: (userId: string) => connect.mutate(userId),
    disconnect: (userId: string) => disconnect.mutate(userId),
    sync: (userId: string) => sync.mutate(userId),
    
    // Events
    createEvent: createEvent.mutate,
    updateEvent: updateEvent.mutate,
    deleteEvent: deleteEvent.mutate,
    
    // Webhooks
    setupWebhook: setupWebhook.mutate,
    removeWebhook: removeWebhook.mutate,
    
    // Loading states
    isConnecting: connect.isPending,
    isDisconnecting: disconnect.isPending,
    isSyncing: sync.isPending,
    isCreatingEvent: createEvent.isPending,
    isUpdatingEvent: updateEvent.isPending,
    isDeletingEvent: deleteEvent.isPending,
    
    // Refetch functions
    refetchConnection: isConnected.refetch,
    refetchEvents: events.refetch,
    refetchCalendars: calendars.refetch,
  };
}

// ============= EXPORTAÇÃO =============

export default {
  // Authentication
  useGoogleCalendarConnection,
  useGoogleUserInfo,
  useGoogleCalendarConnect,
  useGoogleCalendarCallback,
  useGoogleCalendarDisconnect,
  
  // Calendar & Events
  useGoogleCalendars,
  useGoogleCalendarEvents,
  useCreateGoogleCalendarEvent,
  useUpdateGoogleCalendarEvent,
  useDeleteGoogleCalendarEvent,
  
  // Sync
  useGoogleCalendarSync,
  useGoogleCalendarSyncStatus,
  
  // Webhooks
  useSetupGoogleCalendarWebhook,
  useRemoveGoogleCalendarWebhook,
  
  // Manager
  useGoogleCalendarManager,
  
  // Keys
  googleCalendarKeys,
};

/**
 * ============= RESUMO DOS HOOKS =============
 * 
 * ✅ 15+ hooks especializados para Google Calendar
 * ✅ Gerenciamento completo de autenticação OAuth
 * ✅ CRUD completo de eventos com React Query
 * ✅ Sincronização bidirecional com loading states
 * ✅ Configuração de webhooks em tempo real
 * ✅ Hook manager unificado para facilitar uso
 * ✅ Query keys organizadas para cache management
 * ✅ Toast notifications integradas
 * ✅ Error handling robusto
 * ✅ Invalidação inteligente de cache
 * 
 * ============= PRÓXIMOS PASSOS =============
 * 
 * 1. ⚠️ Criar componentes UI para OAuth flow
 * 2. ⚠️ Implementar página de callback OAuth
 * 3. ⚠️ Integrar hooks com interface de agenda
 * 4. ⚠️ Configurar webhooks no servidor
 * 5. ⚠️ Implementar tratamento de conflitos
 */