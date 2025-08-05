// Página do módulo Plantão - Sincronização com Google Calendar
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer, View, Messages } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Loader2, AlertCircle, Globe, CheckCircle, LogOut, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { useToast } from "@/hooks/use-toast";

// Configurar moment para português brasileiro
moment.locale("pt-br");

// Criar localizer
const localizer = momentLocalizer(moment);

// Mensagens em português
const messages: Messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há eventos neste período",
  showMore: (total) => `+${total} mais`,
};

// Types locais
interface PlantaoEvent {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  source: 'GOOGLE_CALENDAR';
  googleEventId?: string;
  color?: string;
}

// Componente de calendário
interface PlantaoCalendarProps {
  events: PlantaoEvent[];
  currentView: View;
  onViewChange: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: PlantaoEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
}

function PlantaoCalendar({
  events,
  currentView,
  onViewChange,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
}: PlantaoCalendarProps) {
  // Converter eventos para formato do react-big-calendar
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDateTime),
      end: new Date(event.endDateTime),
      resource: event,
    }));
  }, [events]);

  // Estilizar eventos
  const eventStyleGetter = useCallback((event: any) => {
    const plantaoEvent = event.resource as PlantaoEvent;
    const backgroundColor = plantaoEvent.color || "#3B82F6";
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 1,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "13px",
        cursor: "pointer",
      },
    };
  }, []);

  // Componente customizado para eventos
  const EventComponent = ({ event }: { event: any }) => {
    const plantaoEvent = event.resource as PlantaoEvent;
    
    return (
      <div className="p-1">
        <div className="font-medium text-xs">{event.title}</div>
        {plantaoEvent.location && (
          <div className="text-xs opacity-70">{plantaoEvent.location}</div>
        )}
      </div>
    );
  };

  // Formatar título da toolbar
  const formats = {
    monthHeaderFormat: "MMMM YYYY",
    weekHeaderFormat: "DD MMMM",
    dayHeaderFormat: "dddd, DD MMMM",
    agendaDateFormat: "DD/MM",
    agendaTimeFormat: "HH:mm",
    agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format("DD/MM")} - ${moment(end).format("DD/MM")}`,
  };

  return (
    <div className="h-full bg-background rounded-lg shadow-sm">
      <style jsx="true" global="true">{`
        .rbc-calendar {
          font-family: inherit;
          background: transparent;
        }
        
        .rbc-header {
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          padding: 10px 3px;
          font-weight: 600;
          font-size: 14px;
          color: hsl(var(--foreground));
        }
        
        .rbc-today {
          background-color: hsl(var(--accent) / 0.1);
        }
        
        .rbc-off-range-bg {
          background: hsl(var(--muted) / 0.5);
        }
        
        .rbc-date-cell {
          padding: 4px;
          font-size: 13px;
        }
        
        .rbc-event {
          padding: 2px 5px;
          font-size: 12px;
        }
        
        .rbc-event-label {
          display: none;
        }
        
        .rbc-toolbar {
          background: hsl(var(--muted));
          border-radius: 8px 8px 0 0;
          padding: 12px;
          margin-bottom: 0;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .rbc-toolbar button {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          padding: 6px 12px;
          margin: 0 2px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .rbc-toolbar button:hover {
          background: hsl(var(--accent));
          border-color: hsl(var(--accent));
        }
        
        .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
        
        .rbc-toolbar-label {
          font-weight: 600;
          font-size: 16px;
          color: hsl(var(--foreground));
        }
        
        .rbc-month-view {
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid hsl(var(--border));
        }
        
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid hsl(var(--border));
        }
        
        .rbc-agenda-view {
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        
        .rbc-agenda-table {
          background: hsl(var(--background));
        }
        
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          padding: 8px;
          font-size: 13px;
        }
        
        .rbc-agenda-event-cell {
          padding: 8px;
        }
        
        .rbc-show-more {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          margin: 2px;
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        messages={messages}
        formats={formats}
        view={currentView}
        onView={onViewChange}
        onNavigate={onNavigate}
        onSelectEvent={(event) => onSelectEvent(event.resource)}
        onSelectSlot={onSelectSlot}
        selectable={true}
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent,
        }}
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        step={30}
        showMultiDayTimes
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 21, 0, 0)}
      />
    </div>
  );
}

export default function Plantao() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Google OAuth hooks
  const { 
    isConnected: googleConnected, 
    isConnecting: googleConnecting,
    tokens: googleTokens,
    connectToGoogle, 
    disconnectFromGoogle 
  } = useGoogleOAuth();
  
  // Google Calendar Sync
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
  
  // Estados do calendário
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Email da conta Google conectada
  const googleAccountEmail = googleTokens?.email || user?.email;

  // Carregar eventos do Google Calendar
  const loadGoogleCalendarEvents = useCallback(async () => {
    if (!googleConnected) return;
    
    try {
      setSyncing(true);
      setError(null);
      
      const syncedEvents: PlantaoEvent[] = [];
      
      // Sincronizar com Google Calendar
      const result = await syncFromGoogle(async (googleEvent) => {
        const plantaoEvent: PlantaoEvent = {
          id: googleEvent.id,
          title: googleEvent.title || 'Evento sem título',
          description: googleEvent.description,
          startDateTime: googleEvent.startDateTime,
          endDateTime: googleEvent.endDateTime,
          location: googleEvent.location,
          source: 'GOOGLE_CALENDAR',
          googleEventId: googleEvent.id,
          color: googleEvent.colorId ? getColorFromGoogleColorId(googleEvent.colorId) : '#3B82F6'
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

  // Função auxiliar para mapear cores do Google Calendar
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
    return colorMap[colorId] || '#3B82F6';
  };

  // Verificar autenticação
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

  // Carregar eventos quando conectar ao Google
  useEffect(() => {
    if (googleConnected) {
      loadGoogleCalendarEvents();
    } else {
      setEvents([]);
    }
  }, [googleConnected, loadGoogleCalendarEvents]);

  // Handlers
  const handleSelectEvent = useCallback((event: PlantaoEvent) => {
    console.log("Evento selecionado:", event.title);
    toast({
      title: event.title,
      description: `${moment(event.startDateTime).format('DD/MM/YYYY HH:mm')} - ${moment(event.endDateTime).format('HH:mm')}`,
    });
  }, [toast]);

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    console.log("Slot selecionado:", slotInfo.start);
    toast({
      title: "Criar evento",
      description: "Para criar eventos, use o Google Calendar",
    });
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
      {/* Header com conexão Google */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plantão</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sincronização com Google Calendar
          </p>
        </div>
        
        {/* Google Account Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  googleConnected 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    Google Calendar
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

      {/* Alertas */}
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

      {/* Aviso quando não conectado */}
      {!googleConnected && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Conecte sua conta Google para visualizar e sincronizar seus eventos do calendário.
          </AlertDescription>
        </Alert>
      )}

      {/* Controles do calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('month')}
          >
            Mês
          </Button>
          <Button
            variant={currentView === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('week')}
          >
            Semana
          </Button>
          <Button
            variant={currentView === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('day')}
          >
            Dia
          </Button>
          <Button
            variant={currentView === 'agenda' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('agenda')}
          >
            Agenda
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {googleConnected && events.length > 0 && (
            <span>{events.length} eventos sincronizados</span>
          )}
        </div>
      </div>

      {/* Calendário principal */}
      {googleConnected ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[700px]">
              <PlantaoCalendar
                events={events}
                currentView={currentView}
                onViewChange={setCurrentView}
                onNavigate={setCurrentDate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="h-[700px] flex items-center justify-center">
          <CardContent className="text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calendário não conectado</h3>
            <p className="text-muted-foreground mb-4">
              Conecte sua conta Google para visualizar seus eventos
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

      {/* Estatísticas quando conectado */}
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
                  return e.startDateTime >= today && e.startDateTime < tomorrow;
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
                  return e.startDateTime >= today && e.startDateTime < nextWeek;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Próximos 7 dias</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {events.filter(e => {
                  const today = new Date();
                  const thisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  return e.startDateTime >= today && e.startDateTime <= thisMonth;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Este mês</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}