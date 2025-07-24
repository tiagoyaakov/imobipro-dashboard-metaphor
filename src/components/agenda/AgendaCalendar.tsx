import React, { useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
// import googleCalendarPlugin from '@fullcalendar/google-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Plus, Filter, Settings } from 'lucide-react';
import { FullCalendarEvent, Appointment, AppointmentStatus, AgentSchedule } from '@/types/agenda';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import AppointmentModal from './AppointmentModal';
import AgendaFilters from './AgendaFilters';

interface AgendaCalendarProps {
  appointments?: Appointment[];
  agentSchedules?: AgentSchedule[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (appointment: Appointment) => void;
  onAppointmentCreate?: (appointment: Partial<Appointment>) => void;
  onAppointmentUpdate?: (id: string, appointment: Partial<Appointment>) => void;
  onAppointmentDelete?: (id: string) => void;
  isLoading?: boolean;
}

const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  appointments = [],
  agentSchedules = [],
  onDateSelect,
  onEventClick,
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete,
  isLoading = false
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(null);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    isConnected, 
    isLoading: googleLoading,
    error: googleError,
    connectGoogleCalendar,
    disconnectGoogleCalendar
  } = useGoogleCalendar();

  // Converter appointments para eventos do FullCalendar
  const calendarEvents = appointments.map(appointment => ({
    id: appointment.id,
    title: appointment.title,
    start: appointment.startTime,
    end: appointment.endTime,
    extendedProps: {
      type: appointment.type,
      status: appointment.status,
      contactId: appointment.contactId,
      propertyId: appointment.propertyId,
      agentId: appointment.agentId,
      notes: appointment.notes
    },
    backgroundColor: getEventColor(appointment.status),
    borderColor: getEventColor(appointment.status),
    textColor: '#ffffff'
  }));

  // Função para obter cor baseada no status
  function getEventColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return '#10b981'; // green
      case AppointmentStatus.SCHEDULED:
        return '#f59e0b'; // yellow
      case AppointmentStatus.CANCELLED:
        return '#ef4444'; // red
      case AppointmentStatus.COMPLETED:
        return '#3b82f6'; // blue
      case AppointmentStatus.NO_SHOW:
        return '#6b7280'; // gray
      case AppointmentStatus.RESCHEDULED:
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  }

  // Handlers do FullCalendar
  const handleDateSelect = useCallback((selectInfo: { start: Date }) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    if (onDateSelect) {
      onDateSelect(selectInfo.start);
    } else {
      setIsModalOpen(true);
    }
  }, [onDateSelect]);

  const handleEventClick = useCallback((clickInfo: { event: FullCalendarEvent }) => {
    const appointment = appointments.find(a => a.id === clickInfo.event.id);
    if (appointment && onEventClick) {
      onEventClick(appointment);
    } else {
      setSelectedEvent(clickInfo.event);
      setIsModalOpen(true);
    }
  }, [appointments, onEventClick]);

  const handleEventDrop = useCallback((dropInfo: { event: FullCalendarEvent }) => {
    const event = dropInfo.event;
    const appointment = appointments.find(a => a.id === event.id);
    
    if (appointment && onAppointmentUpdate) {
      onAppointmentUpdate(event.id, {
        startTime: event.start instanceof Date ? event.start : new Date(event.start),
        endTime: event.end instanceof Date ? event.end : new Date(event.end)
      });
    }
  }, [appointments, onAppointmentUpdate]);

  const handleEventResize = useCallback((resizeInfo: { event: FullCalendarEvent }) => {
    const event = resizeInfo.event;
    const appointment = appointments.find(a => a.id === event.id);
    
    if (appointment && onAppointmentUpdate) {
      onAppointmentUpdate(event.id, {
        startTime: event.start instanceof Date ? event.start : new Date(event.start),
        endTime: event.end instanceof Date ? event.end : new Date(event.end)
      });
    }
  }, [appointments, onAppointmentUpdate]);

  return (
    <div className="space-y-3">
      {/* Header Compacto - Controles Essenciais */}
      <div className="flex items-center justify-between">
        {/* Controles de Visualização - Compactos */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant={view === 'dayGridMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('dayGridMonth')}
              className="text-xs px-2"
            >
              Mês
            </Button>
            <Button
              variant={view === 'timeGridWeek' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeGridWeek')}
              className="text-xs px-2"
            >
              Semana
            </Button>
            <Button
              variant={view === 'timeGridDay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeGridDay')}
              className="text-xs px-2"
            >
              Dia
            </Button>
          </div>
        </div>

        {/* Status Google Calendar - Muito Compacto */}
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs px-2 py-1">
            <Calendar className="w-3 h-3 mr-1" />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
          {!isConnected && (
            <Button size="sm" onClick={connectGoogleCalendar} className="text-xs px-2">
              Conectar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros Colapsáveis - Só aparece quando solicitado */}
      {showFilters && (
        <div className="transition-all duration-300 ease-in-out">
          <AgendaFilters />
        </div>
      )}

      {/* Calendário - Elemento Principal com Máximo Espaço */}
      <Card className="imobipro-card shadow-sm">
        <CardContent className="p-3">
          {/* Header do calendário minimalista */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">Calendário de Agendamentos</h3>
              {isLoading && (
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs px-2 h-7"
              >
                <Filter className="w-3 h-3 mr-1" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Calendário com altura otimizada */}
          <div className="h-[550px] lg:h-[650px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              initialView={view}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={calendarEvents}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              height="100%"
              locale="pt-br"
              buttonText={{
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia'
              }}
              eventDisplay="block"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              slotDuration="00:30:00"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
              views={{
                dayGridMonth: {
                  dayMaxEvents: 4,
                  eventDisplay: 'block',
                  dayMaxEventRows: 4
                },
                timeGridWeek: {
                  slotMinWidth: 60,
                  dayMaxEvents: 8
                },
                timeGridDay: {
                  slotMinWidth: 80,
                  dayMaxEvents: 15
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de Agendamento */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        appointment={selectedEvent ? {
          id: selectedEvent.id,
          title: selectedEvent.title,
          startTime: selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start),
          endTime: selectedEvent.end instanceof Date ? selectedEvent.end : new Date(selectedEvent.end),
          type: selectedEvent.extendedProps.type,
          status: selectedEvent.extendedProps.status,
          propertyId: selectedEvent.extendedProps.propertyId,
          agentId: selectedEvent.extendedProps.agentId,
          notes: selectedEvent.extendedProps.notes
        } : undefined}
        selectedDate={selectedDate}
        onCreate={onAppointmentCreate}
        onUpdate={onAppointmentUpdate}
        onDelete={onAppointmentDelete}
      />
    </div>
  );
};

export default AgendaCalendar; 