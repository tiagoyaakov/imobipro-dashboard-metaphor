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
}

interface LocalPlantaoUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  color: string;
}

// Dados mockados para demonstração
const MOCK_CORRETORES: LocalPlantaoUser[] = [
  {
    id: "admin-1",
    name: "Administrador Sistema",
    email: "admin@imobipro.com",
    role: "ADMIN",
    color: "#000000",
  },
  {
    id: "corretor-1",
    name: "João Silva",
    email: "joao@imobipro.com",
    role: "AGENT",
    color: "#8B5CF6",
  },
  {
    id: "corretor-2",
    name: "Maria Santos",  
    email: "maria@imobipro.com",
    role: "AGENT",
    color: "#3B82F6",
  },
];

const generateMockEvents = (): LocalPlantaoEvent[] => {
  const events: LocalPlantaoEvent[] = [];
  const today = new Date();

  // Gerar eventos para os próximos 30 dias
  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    // 2-4 eventos por dia
    const eventsPerDay = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < eventsPerDay; i++) {
      const corretor = MOCK_CORRETORES[Math.floor(Math.random() * MOCK_CORRETORES.length)];
      const hour = 9 + Math.floor(Math.random() * 9); // 9h às 17h
      const duration = [30, 60, 90, 120][Math.floor(Math.random() * 4)]; // 30min a 2h

      const startDateTime = new Date(date);
      startDateTime.setHours(hour, 0, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      events.push({
        id: `event-${day}-${i}`,
        title: [
          "Visita ao imóvel - Apt. Centro",
          "Reunião com cliente - Casa Jardins",
          "Vistoria - Cobertura Zona Sul",
          "Assinatura de contrato",
          "Apresentação de proposta",
          "Follow-up com interessado"
        ][Math.floor(Math.random() * 6)],
        description: "Detalhes do agendamento...",
        startDateTime,
        endDateTime,
        corretorId: corretor.id,
        corretorName: corretor.name,
        corretorColor: corretor.color,
        status: day < 0 ? 'CONCLUIDO' : 'AGENDADO',
        location: "São Paulo, SP",
      });
    }
  }

  return events;
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
  // Estados locais completamente isolados
  const [events, setEvents] = useState<LocalPlantaoEvent[]>([]);
  const [corretores] = useState<LocalPlantaoUser[]>(MOCK_CORRETORES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorretorId, setSelectedCorretorId] = useState<string | undefined>();
  const [currentUser] = useState<LocalPlantaoUser>(MOCK_CORRETORES[0]); // Simular admin
  const isAdmin = currentUser.role === 'ADMIN';

  // Estados locais simplificados
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("calendar");

  // Carregar dados mockados na inicialização
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simular carregamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEvents(generateMockEvents());
        setError(null);
      } catch (err) {
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handlers simplificados
  const handleSelectEvent = (event: LocalPlantaoEvent) => {
    console.log("Evento selecionado:", event.title);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    console.log("Slot selecionado:", slotInfo.start);
  };

  const handleNewEvent = () => {
    console.log("Novo evento");
  };

  const clearError = () => {
    setError(null);
  };

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

        <Button onClick={handleNewEvent}>
          + Novo Evento
        </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-red-600">
              {events.filter(e => e.status === "CANCELADO").length}
            </div>
            <div className="text-sm text-muted-foreground">Cancelados</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}