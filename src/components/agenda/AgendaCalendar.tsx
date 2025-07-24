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
    <div className="space-y-4">
      {/* Header com controles - Responsivo */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Controles principais */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Botões de visualização */}
          <div className="flex gap-1">
            <Button
              variant={view === 'dayGridMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('dayGridMonth')}
              className="text-xs sm:text-sm"
            >
              Mês
            </Button>
            <Button
              variant={view === 'timeGridWeek' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeGridWeek')}
              className="text-xs sm:text-sm"
            >
              Semana
            </Button>
            <Button
              variant={view === 'timeGridDay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeGridDay')}
              className="text-xs sm:text-sm"
            >
              Dia
            </Button>
          </div>
          
          {/* Status Google Calendar */}
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">
                {isConnected ? 'Google Calendar Conectado' : 'Google Calendar Desconectado'}
              </span>
              <span className="sm:hidden">
                {isConnected ? 'Google Conectado' : 'Google Desconectado'}
              </span>
            </Badge>
            {!isConnected && (
              <Button size="sm" onClick={connectGoogleCalendar} className="text-xs">
                Conectar
              </Button>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs sm:text-sm"
          >
            <Filter className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Filtros - Colapsável */}
      {showFilters && (
        <div className="transition-all duration-300 ease-in-out">
          <AgendaFilters />
        </div>
      )}

      {/* Calendário */}
      <Card className="imobipro-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Agenda
            {isLoading && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] lg:h-[600px] xl:h-[700px]">
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
              // Responsividade
              aspectRatio={1.35}
              expandRows={true}
              // Estilos customizados
              eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
              dayCellClassNames="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              // Configurações para mobile
              views={{
                dayGridMonth: {
                  dayMaxEvents: window.innerWidth < 768 ? 2 : 4,
                },
                timeGridWeek: {
                  slotMinWidth: window.innerWidth < 768 ? 60 : 80,
                },
                timeGridDay: {
                  slotMinWidth: window.innerWidth < 768 ? 60 : 80,
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