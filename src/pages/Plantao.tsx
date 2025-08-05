// Página do módulo Plantão - Migração para FullCalendar v6+ com Google Calendar
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import FullCalendar from '@fullcalendar/react';
import { CalendarApi, EventContentArg, EventApi, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Loader2, AlertCircle, Globe, CheckCircle, LogOut, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { useToast } from "@/hooks/use-toast";

// Types locais compatíveis com FullCalendar
interface PlantaoEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  source: 'GOOGLE_CALENDAR' | 'IMOBIPRO';
  googleEventId?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    [key: string]: any;
  };
}

// Componente de calendário FullCalendar
interface PlantaoCalendarProps {
  events: PlantaoEvent[];
  googleApiKey?: string;
  googleCalendarId?: string;
  onEventClick: (eventInfo: EventClickArg) => void;
  onDateSelect: (selectInfo: DateSelectArg) => void;
  loading?: boolean;
}

function PlantaoCalendar({
  events,
  googleApiKey = '',
  googleCalendarId = '',
  onEventClick,
  onDateSelect,
  loading = false,
}: PlantaoCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Configurações do FullCalendar
  const calendarOptions = useMemo(() => ({
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin,
      listPlugin,
      googleCalendarPlugin
    ],
    
    // Configurações básicas
    initialView: 'dayGridMonth',
    locale: ptBrLocale,
    timeZone: 'America/Sao_Paulo',
    height: 'auto',
    
    // Header personalizado
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    
    // Configurações visuais
    nowIndicator: true,
    navLinks: true,
    editable: false, // Desabilitar edição direta no calendário
    selectable: true,
    selectMirror: true,
    dayMaxEvents: 3,
    
    // Configurações de horário
    slotMinTime: '07:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:30:00',
    scrollTime: '09:00:00',
    
    // Configurações específicas de views
    views: {
      dayGridMonth: {
        dayMaxEvents: 3,
        moreLinkClick: 'popover'
      },
      timeGridWeek: {
        allDaySlot: true,
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      },
      timeGridDay: {
        allDaySlot: true
      },
      listWeek: {
        listDayFormat: {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        }
      }
    },
    
    // Textos personalizados
    buttonText: {
      today: 'Hoje',
      month: 'Mês',
      week: 'Semana',
      day: 'Dia',
      list: 'Lista'
    },
    
    // Formatação de datas
    titleFormat: {
      year: 'numeric',
      month: 'long'
    },
    
    // Google Calendar integração
    googleCalendarApiKey: googleApiKey,
    
    // Event Sources - Separar eventos locais do Google Calendar
    eventSources: [
      // Eventos locais do ImobiPRO
      {
        events: events,
        color: '#3B82F6',
        textColor: '#ffffff'
      },
      // Google Calendar (se configurado)
      ...(googleApiKey && googleCalendarId ? [{
        googleCalendarId: googleCalendarId,
        color: '#10B981',
        textColor: '#ffffff',
        className: 'google-calendar-event'
      }] : [])
    ],
    
    // Event handlers
    eventClick: onEventClick,
    select: onDateSelect,
    
    // Loading state
    loading: (isLoading: boolean) => {
      console.log('FullCalendar loading state:', isLoading);
    },
    
    // Customização de eventos
    eventContent: (eventInfo: EventContentArg) => {
      const { event } = eventInfo;
      const isGoogle = event.classNames.includes('google-calendar-event');
      const startTime = eventInfo.timeText;
      
      return {
        html: `
          <div class="fc-event-content-custom">
            <div class="fc-event-time-custom">${startTime}</div>
            <div class="fc-event-title-custom">
              ${isGoogle ? '📅 ' : '🏢 '}${event.title}
            </div>
            ${event.extendedProps?.location ? `<div class="fc-event-location-custom">📍 ${event.extendedProps.location}</div>` : ''}
          </div>
        `
      };
    },
    
    // Configurações de estilo
    eventClassNames: (eventInfo: any) => {
      const classes = ['custom-event'];
      if (eventInfo.event.classNames?.includes('google-calendar-event')) {
        classes.push('google-event');
      } else {
        classes.push('imobipro-event');
      }
      return classes;
    },
    
    // Configurações avançadas
    eventDisplay: 'block',
    displayEventTime: true,
    displayEventEnd: false,
    
    // Business Hours (horário comercial)
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Segunda a Sexta
      startTime: '09:00',
      endTime: '18:00',
    },
    
    // Configurações de seleção
    selectConstraint: 'businessHours',
    
    // Configurações adicionais
    aspectRatio: 1.8,
    expandRows: true,
    handleWindowResize: true,
    
  }), [events, googleApiKey, googleCalendarId, onEventClick, onDateSelect]);

  // Métodos da API do calendário
  const getCalendarApi = useCallback((): CalendarApi | null => {
    return calendarRef.current?.getApi() || null;
  }, []);

  const refreshEvents = useCallback(() => {
    const api = getCalendarApi();
    if (api) {
      api.refetchEvents();
    }
  }, [getCalendarApi]);

  const changeView = useCallback((viewName: string) => {
    const api = getCalendarApi();
    if (api) {
      api.changeView(viewName);
    }
  }, [getCalendarApi]);

  const goToDate = useCallback((date: Date) => {
    const api = getCalendarApi();
    if (api) {
      api.gotoDate(date);
    }
  }, [getCalendarApi]);

  // Estilos customizados para FullCalendar
  useEffect(() => {
    // Adicionar estilos CSS customizados
    const style = document.createElement('style');
    style.textContent = `
      /* FullCalendar Custom Styles para ImobiPRO */
      .fc {
        font-family: inherit;
      }
      
      .fc-theme-standard .fc-scrollgrid {
        border: 1px solid hsl(var(--border));
        border-radius: 8px;
      }
      
      .fc-theme-standard th,
      .fc-theme-standard td {
        border-color: hsl(var(--border));
      }
      
      .fc-theme-standard .fc-scrollgrid thead th {
        background: hsl(var(--muted));
        color: hsl(var(--foreground));
        font-weight: 600;
        font-size: 14px;
        padding: 12px 8px;
      }
      
      .fc-button-primary:not(:disabled) {
        background: hsl(var(--primary));
        border-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        border-radius: 6px;
      }
      
      .fc-button-primary:hover:not(:disabled) {
        background: hsl(var(--primary) / 0.9);
        border-color: hsl(var(--primary) / 0.9);
      }
      
      .fc-today-button:disabled {
        background: hsl(var(--muted));
        border-color: hsl(var(--border));
        color: hsl(var(--muted-foreground));
      }
      
      .fc-daygrid-day.fc-day-today {
        background: hsl(var(--accent) / 0.1);
      }
      
      .fc-daygrid-day:hover {
        background: hsl(var(--accent) / 0.05);
      }
      
      .fc-event-content-custom {
        padding: 2px 4px;
        font-size: 12px;
        line-height: 1.2;
      }
      
      .fc-event-time-custom {
        font-weight: 500;
        margin-bottom: 1px;
      }
      
      .fc-event-title-custom {
        font-weight: 600;
        margin-bottom: 1px;
      }
      
      .fc-event-location-custom {
        font-size: 10px;
        opacity: 0.8;
      }
      
      .custom-event.google-event {
        background: #10B981 !important;
        border-color: #059669 !important;
      }
      
      .custom-event.imobipro-event {
        background: #3B82F6 !important;
        border-color: #2563EB !important;
      }
      
      .fc-event:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        transition: all 0.2s ease;
      }
      
      .fc-more-link {
        background: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: 500;
      }
      
      .fc-popover {
        border: 1px solid hsl(var(--border));
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        background: hsl(var(--background));
      }
      
      .fc-popover-header {
        background: hsl(var(--muted));
        color: hsl(var(--foreground));
        border-bottom: 1px solid hsl(var(--border));
        font-weight: 600;
      }
      
      .fc-list {
        border-radius: 8px;
        overflow: hidden;
      }
      
      .fc-list-day {
        background: hsl(var(--muted) / 0.5);
      }
      
      .fc-list-day-text {
        color: hsl(var(--foreground));
        font-weight: 600;
      }
      
      .fc-list-event:hover {
        background: hsl(var(--accent) / 0.1);
      }
      
      /* Loading state */
      .fc-loading {
        opacity: 0.6;
        pointer-events: none;
      }
      
      /* Dark mode adjustments */
      .dark .fc-event {
        color: white;
      }
      
      .dark .fc-list-event-title a {
        color: hsl(var(--foreground));
      }
      
      .dark .fc-list-event-time {
        color: hsl(var(--muted-foreground));
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Carregando eventos...</p>
          </div>
        </div>
      )}
      
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <FullCalendar
          ref={calendarRef}
          {...calendarOptions}
        />
      </div>
    </div>
  );
}

export default function Plantao() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Google OAuth hooks (mantidos do código original)
  const { 
    isConnected: googleConnected, 
    isConnecting: googleConnecting,
    tokens: googleTokens,
    connectToGoogle, 
    disconnectFromGoogle 
  } = useGoogleOAuth();
  
  // Google Calendar Sync (mantido do código original)
  const { 
    syncFromGoogle, 
    syncStatus,
    getSyncStats 
  } = useGoogleCalendarSync();
  
  // Estados
  const [events, setEvents] = useState<PlantaoEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email da conta Google conectada (mantido do código original)
  const googleAccountEmail = googleTokens?.email || user?.email;

  // Configurações do Google Calendar
  const googleApiKey = process.env.VITE_GOOGLE_CALENDAR_API_KEY || '';
  const googleCalendarId = googleTokens?.calendarId || 'primary';

  // Carregar eventos do Google Calendar (adaptado para FullCalendar)
  const loadGoogleCalendarEvents = useCallback(async () => {
    if (!googleConnected) return;
    
    try {
      setSyncing(true);
      setError(null);
      
      const syncedEvents: PlantaoEvent[] = [];
      
      // Sincronizar com Google Calendar
      const result = await syncFromGoogle(async (googleEvent) => {
        const plantaoEvent: PlantaoEvent = {
          id: googleEvent.id || `google_${Date.now()}`,
          title: googleEvent.title || 'Evento sem título',
          description: googleEvent.description,
          start: new Date(googleEvent.startDateTime),
          end: new Date(googleEvent.endDateTime),
          location: googleEvent.location,
          source: 'GOOGLE_CALENDAR',
          googleEventId: googleEvent.id,
          color: googleEvent.colorId ? getColorFromGoogleColorId(googleEvent.colorId) : '#10B981',
          backgroundColor: googleEvent.colorId ? getColorFromGoogleColorId(googleEvent.colorId) : '#10B981',
          borderColor: '#059669',
          textColor: '#ffffff',
          extendedProps: {
            description: googleEvent.description,
            location: googleEvent.location,
            source: 'GOOGLE_CALENDAR'
          }
        };
        
        syncedEvents.push(plantaoEvent);
        return true;
      });
      
      if (result.success) {
        setEvents(syncedEvents);
        toast({
          title: "Sincronização concluída",
          description: `${syncedEvents.length} eventos sincronizados do Google Calendar`,
        });
      } else {
        throw new Error(result.error || 'Erro na sincronização');
      }
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
      setError("Erro ao sincronizar com Google Calendar");
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Google Calendar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }, [googleConnected, syncFromGoogle, toast]);

  // Função auxiliar para mapear cores do Google Calendar (mantida)
  const getColorFromGoogleColorId = (colorId: string): string => {
    const colorMap: { [key: string]: string } = {
      '1': '#7986CB', // Lavender
      '2': '#33B679', // Sage
      '3': '#8E24AA', // Grape
      '4': '#E67C73', // Flamingo
      '5': '#F6BF26', // Banana
      '6': '#F4511E', // Tangerine
      '7': '#039BE5', // Peacock
      '8': '#616161', // Graphite
      '9': '#3F51B5', // Blueberry
      '10': '#0B8043', // Basil
      '11': '#D50000', // Tomato
    };
    return colorMap[colorId] || '#10B981';
  };

  // Verificar autenticação (mantido)
  if (!isAuthenticated || authLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Carregar eventos quando conectar ao Google (mantido)
  useEffect(() => {
    if (googleConnected) {
      loadGoogleCalendarEvents();
    } else {
      setEvents([]);
    }
  }, [googleConnected, loadGoogleCalendarEvents]);

  // Handlers para FullCalendar
  const handleEventClick = useCallback((eventInfo: EventClickArg) => {
    const event = eventInfo.event;
    const isGoogle = event.classNames.includes('google-calendar-event');
    
    console.log("Evento clicado:", event.title);
    toast({
      title: event.title,
      description: `${event.start?.toLocaleString('pt-BR')} - ${event.end?.toLocaleString('pt-BR')}${isGoogle ? ' (Google Calendar)' : ' (ImobiPRO)'}`,
    });
  }, [toast]);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    console.log("Data selecionada:", selectInfo.startStr, "-", selectInfo.endStr);
    toast({
      title: "Criar evento",
      description: "Para criar eventos, use o Google Calendar ou a interface do ImobiPRO",
    });
    
    // Limpar seleção
    selectInfo.view.calendar.unselect();
  }, [toast]);

  const handleGoogleConnection = useCallback(async () => {
    if (googleConnected) {
      await disconnectFromGoogle();
      setEvents([]);
    } else {
      await connectToGoogle();
    }
  }, [googleConnected, connectToGoogle, disconnectFromGoogle]);

  const handleRefresh = useCallback(async () => {
    await loadGoogleCalendarEvents();
  }, [loadGoogleCalendarEvents]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com conexão Google (mantido) */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plantão</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sincronização com Google Calendar - FullCalendar v6+
          </p>
        </div>
        
        {/* Google Account Status (mantido com pequenos ajustes) */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  googleConnected 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    Google Calendar (FullCalendar v6+)
                    {googleConnected && (
                      <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {googleConnected 
                      ? `Conectado: ${googleAccountEmail}` 
                      : 'Conecte sua conta Google para sincronizar eventos'
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {googleConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Atualizar
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant={googleConnected ? "outline" : "default"}
                  size="sm"
                  onClick={handleGoogleConnection}
                  disabled={googleConnecting}
                  className={googleConnected 
                    ? "text-red-600 border-red-200 hover:bg-red-50" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  }
                >
                  {googleConnecting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Conectando...
                    </>
                  ) : googleConnected ? (
                    <>
                      <LogOut className="h-3 w-3 mr-1" />
                      Desconectar
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Conectar Google
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas (mantidos) */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button 
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Fechar
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso quando não conectado (mantido) */}
      {!googleConnected && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Conecte sua conta Google para visualizar e sincronizar seus eventos do calendário com FullCalendar v6+.
          </AlertDescription>
        </Alert>
      )}

      {/* Calendário principal com FullCalendar */}
      {googleConnected ? (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <PlantaoCalendar
              events={events}
              googleApiKey={googleApiKey}
              googleCalendarId={googleCalendarId}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              loading={syncing}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="h-[700px] flex items-center justify-center">
          <CardContent className="text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calendário não conectado</h3>
            <p className="text-muted-foreground mb-4">
              Conecte sua conta Google para visualizar seus eventos com FullCalendar v6+
            </p>
            <Button onClick={handleGoogleConnection} disabled={googleConnecting}>
              {googleConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Conectar Google Calendar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas quando conectado (mantidas com ajustes) */}
      {googleConnected && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{events.length}</div>
              <div className="text-sm text-muted-foreground">Total de Eventos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {events.filter(e => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return e.start >= today && e.start < tomorrow;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Eventos Hoje</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => {
                  const today = new Date();
                  const nextWeek = new Date(today);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  return e.start >= today && e.start < nextWeek;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Próximos 7 dias</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {events.filter(e => e.source === 'GOOGLE_CALENDAR').length}
              </div>
              <div className="text-sm text-muted-foreground">Google Calendar</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Indicadores de fonte de eventos */}
      {googleConnected && events.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Legenda dos Eventos</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">📅 Google Calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">🏢 ImobiPRO</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}