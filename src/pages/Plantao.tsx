// Página principal do módulo Plantão - Versão 100% autocontida e isolada
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer, View, Messages } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

// Types locais para evitar dependências externas
interface LocalPlantaoEvent {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  corretorId: string;
  corretorName: string;
  corretorColor: string;
  status: 'AGENDADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO';
  location?: string;
  source?: 'GOOGLE_CALENDAR' | 'IMOBIPRO' | 'IMPORTED';
}

interface LocalPlantaoUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  color: string;
}

// Import dinâmico seguro para services
const getPlantaoService = async () => {
  try {
    const { PlantaoService } = await import("@/services/plantaoService");
    return PlantaoService;
  } catch (error) {
    console.error("Erro ao carregar PlantaoService:", error);
    return null;
  }
};

const getGoogleCalendarService = async () => {
  try {
    const { googleCalendarService } = await import("@/services/googleCalendarService");
    return googleCalendarService;
  } catch (error) {
    console.error("Erro ao carregar GoogleCalendarService:", error);
    return null;
  }
};

// Componente de calendário local integrado
interface LocalPlantaoCalendarProps {
  events: LocalPlantaoEvent[];
  corretores: LocalPlantaoUser[];
  currentView: View;
  onViewChange: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: LocalPlantaoEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  isAdmin: boolean;
  selectedCorretorId?: string;
}

function LocalPlantaoCalendar({
  events,
  corretores,
  currentView,
  onViewChange,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
  isAdmin,
  selectedCorretorId,
}: LocalPlantaoCalendarProps) {
  // Converter eventos para formato do react-big-calendar
  const calendarEvents = useMemo(() => {
    console.log(`📅 LocalPlantaoCalendar renderizando ${events.length} eventos`);
    
    return events.map(event => ({
      ...event,
      id: event.id,
      title: event.title,
      start: new Date(event.startDateTime),
      end: new Date(event.endDateTime),
      resource: event,
    }));
  }, [events]);

  // Estilizar eventos com base no corretor (cores diferentes)
  const eventStyleGetter = useCallback((event: any) => {
    const plantaoEvent = event.resource as LocalPlantaoEvent;
    const backgroundColor = plantaoEvent.corretorColor || "#3B82F6";
    
    // Se um corretor específico estiver selecionado e não for o dono do evento, deixar opaco
    const isOtherCorretor = selectedCorretorId && plantaoEvent.corretorId !== selectedCorretorId;
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: isOtherCorretor ? 0.3 : 1,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "13px",
        cursor: "pointer",
      },
    };
  }, [selectedCorretorId]);

  // Componente customizado para eventos
  const EventComponent = ({ event }: { event: any }) => {
    const plantaoEvent = event.resource as LocalPlantaoEvent;
    const corretor = corretores.find(c => c.id === plantaoEvent.corretorId);
    
    return (
      <div className="p-1">
        <div className="font-medium text-xs">{event.title}</div>
        {isAdmin && corretor && (
          <div className="text-xs opacity-80">{corretor.name}</div>
        )}
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
  // Estados locais
  const [events, setEvents] = useState<LocalPlantaoEvent[]>([]);
  const [corretores, setCorretores] = useState<LocalPlantaoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorretorId, setSelectedCorretorId] = useState<string | undefined>();
  const [currentUser, setCurrentUser] = useState<LocalPlantaoUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  const isAdmin = currentUser?.role === 'ADMIN';

  // Estados do calendário
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Carregar corretores do banco de dados
  const loadCorretores = useCallback(async () => {
    try {
      const service = await getPlantaoService();
      if (service) {
        const users = await service.getCorretores();
        setCorretores(users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          color: user.color
        })));
        
        // Definir usuário atual (simulando autenticação)
        const adminUser = users.find(u => u.role === 'ADMIN') || users[0];
        setCurrentUser({
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          color: adminUser.color
        });
      }
    } catch (err) {
      console.error("Erro ao carregar corretores:", err);
    }
  }, []);

  // Carregar eventos do banco de dados e Google Calendar
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando eventos do banco de dados...');
      
      const service = await getPlantaoService();
      if (service) {
        const response = await service.getEvents({});
        console.log(`📅 ${response.events.length} eventos carregados do banco`);
        
        // Converter eventos para formato local
        const localEvents: LocalPlantaoEvent[] = response.events.map(evt => ({
          id: evt.id,
          title: evt.title,
          description: evt.description,
          startDateTime: new Date(evt.startDateTime),
          endDateTime: new Date(evt.endDateTime),
          corretorId: evt.corretorId,
          corretorName: evt.corretorName,
          corretorColor: evt.corretorColor,
          status: evt.status as any,
          location: evt.location,
          source: evt.source === 'GOOGLE_CALENDAR' ? 'GOOGLE_CALENDAR' : 'IMOBIPRO'
        }));
        
        setEvents(localEvents);
        setError(null);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setError("Erro ao carregar eventos do calendário");
    } finally {
      setLoading(false);
    }
  }, []);

  // Sincronizar com Google Calendar
  const syncWithGoogle = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      console.log('🔄 Iniciando sincronização com Google Calendar...');
      
      const googleService = await getGoogleCalendarService();
      const plantaoService = await getPlantaoService();
      
      if (googleService && plantaoService) {
        // Importar eventos do Google Calendar
        const report = await googleService.syncFromGoogle("primary", async (googleEvent) => {
          try {
            // Converter evento do Google para formato local
            const localEvent = {
              title: googleEvent.title || 'Evento sem título',
              description: googleEvent.description,
              startDateTime: googleEvent.startDateTime,
              endDateTime: googleEvent.endDateTime,
              corretorId: currentUser?.id || 'unknown',
              location: googleEvent.location,
              source: 'GOOGLE_CALENDAR' as const
            };
            
            // Adicionar ao cache local
            await plantaoService.addEventToCache({
              ...localEvent,
              id: `google-${googleEvent.id}`,
              corretorName: currentUser?.name || 'Usuário',
              corretorColor: currentUser?.color || '#3B82F6',
              status: 'AGENDADO'
            });
            
            console.log(`✅ Evento importado: ${localEvent.title}`);
            return true;
          } catch (error) {
            console.error("Erro ao processar evento:", error);
            return false;
          }
        });
        
        if (report.success) {
          console.log(`✅ Sincronização concluída: ${report.created} eventos importados`);
          setSyncStatus('synced');
          // Recarregar eventos após sincronização
          await loadEvents();
        } else {
          setSyncStatus('error');
          setError('Erro na sincronização com Google Calendar');
        }
      }
    } catch (err) {
      console.error("Erro na sincronização:", err);
      setSyncStatus('error');
      setError('Falha na sincronização com Google Calendar');
    }
  }, [currentUser, loadEvents]);

  // Carregar dados na inicialização
  useEffect(() => {
    const initializeData = async () => {
      await loadCorretores();
    };
    initializeData();
  }, [loadCorretores]);

  // Carregar eventos quando o usuário atual estiver definido
  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser, loadEvents]);

  // Handlers
  const handleSelectEvent = useCallback((event: LocalPlantaoEvent) => {
    console.log("Evento selecionado:", event.title);
  }, []);

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    console.log("Slot selecionado:", slotInfo.start);
  }, []);

  const handleNewEvent = useCallback(() => {
    console.log("Novo evento");
  }, []);

  const handleSyncFromGoogle = useCallback(async () => {
    await syncWithGoogle();
  }, [syncWithGoogle]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Renderizar loading
  if (loading && events.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando calendário...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header simples */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plantão</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistema de agendamento de plantões
        </p>
      </div>

      {/* Alertas de erro */}
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

      {/* Controles simples */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select 
            value={selectedCorretorId || ''}
            onChange={(e) => setSelectedCorretorId(e.target.value || undefined)}
            className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="">Todos os corretores</option>
            {corretores.filter(c => c.role === 'AGENT').map(corretor => (
              <option key={corretor.id} value={corretor.id}>
                {corretor.name}
              </option>
            ))}
          </select>
          
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
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncFromGoogle}
            disabled={syncStatus === 'syncing'}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            {syncStatus === 'syncing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sincronizando...
              </>
            ) : (
              <>
                📥 Importar do Google
              </>
            )}
          </Button>
          
          <Button onClick={handleNewEvent}>
            + Novo Evento
          </Button>
        </div>
      </div>

      {/* Calendário principal integrado */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[700px]">
            <LocalPlantaoCalendar
              events={events}
              corretores={corretores}
              currentView={currentView}
              onViewChange={setCurrentView}
              onNavigate={setCurrentDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              isAdmin={isAdmin}
              selectedCorretorId={selectedCorretorId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{events.length}</div>
            <div className="text-sm text-muted-foreground">Total de Eventos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === "CONFIRMADO").length}
            </div>
            <div className="text-sm text-muted-foreground">Confirmados</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {events.filter(e => e.status === "AGENDADO").length}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.source === "GOOGLE_CALENDAR").length}
            </div>
            <div className="text-sm text-muted-foreground">Google Calendar</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {events.filter(e => e.source === "IMOBIPRO").length}
            </div>
            <div className="text-sm text-muted-foreground">ImobiPRO</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}