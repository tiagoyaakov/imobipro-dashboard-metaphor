// Componente de calendário para o módulo Plantão
import React, { useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, View, Messages } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { PlantaoEvent, PlantaoUser } from "@/types/plantao";
import { cn } from "@/lib/utils";

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

interface PlantaoCalendarProps {
  events: PlantaoEvent[];
  corretores: PlantaoUser[];
  currentView: View;
  onViewChange: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: PlantaoEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  isAdmin: boolean;
  selectedCorretorId?: string;
}

export function PlantaoCalendar({
  events,
  corretores,
  currentView,
  onViewChange,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
  isAdmin,
  selectedCorretorId,
}: PlantaoCalendarProps) {
  // Converter eventos para formato do react-big-calendar
  const calendarEvents = useMemo(() => {
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
    const plantaoEvent = event.resource as PlantaoEvent;
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
    const plantaoEvent = event.resource as PlantaoEvent;
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

// Importar useCallback no topo do arquivo
import { useCallback } from "react";