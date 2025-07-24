import React, { useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Plus } from 'lucide-react';
import { FullCalendarEvent, Appointment } from '@/types/agenda';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import AppointmentModal from './AppointmentModal';
import AgendaFilters from './AgendaFilters';

interface AgendaCalendarProps {
  appointments?: Appointment[];
  onAppointmentCreate?: (appointment: Partial<Appointment>) => void;
  onAppointmentUpdate?: (id: string, appointment: Partial<Appointment>) => void;
  onAppointmentDelete?: (id: string) => void;
}

const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  appointments = [],
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(null);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  
  const { 
    isConnected, 
    calendars, 
    events: googleEvents,
    connect,
    disconnect 
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
      clientName: appointment.clientName,
      propertyId: appointment.propertyId,
      agentId: appointment.agentId,
      description: appointment.description,
      location: appointment.location
    },
    backgroundColor: getEventColor(appointment.status),
    borderColor: getEventColor(appointment.status),
    textColor: '#ffffff'
  }));

  // Função para obter cor baseada no status
  function getEventColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return '#10b981'; // green
      case 'pending':
        return '#f59e0b'; // yellow
      case 'cancelled':
        return '#ef4444'; // red
      case 'completed':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  }

  // Handlers do FullCalendar
  const handleDateSelect = useCallback((selectInfo: { start: Date }) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  const handleEventClick = useCallback((clickInfo: { event: FullCalendarEvent }) => {
    setSelectedEvent(clickInfo.event);
    setIsModalOpen(true);
  }, []);

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
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={view === 'dayGridMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('dayGridMonth')}
            >
              Mês
            </Button>
            <Button
              variant={view === 'timeGridWeek' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeGridWeek')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'timeGridDay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeGridDay')}
            >
              Dia
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              <Calendar className="w-3 h-3 mr-1" />
              {isConnected ? 'Google Calendar Conectado' : 'Google Calendar Desconectado'}
            </Badge>
            {!isConnected && (
              <Button size="sm" onClick={connect}>
                Conectar
              </Button>
            )}
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Filtros */}
      <AgendaFilters />

      {/* Calendário */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin]}
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
          startTime: selectedEvent.start,
          endTime: selectedEvent.end,
          type: selectedEvent.extendedProps.type,
          status: selectedEvent.extendedProps.status,
          clientName: selectedEvent.extendedProps.clientName,
          propertyId: selectedEvent.extendedProps.propertyId,
          agentId: selectedEvent.extendedProps.agentId,
          description: selectedEvent.extendedProps.description,
          location: selectedEvent.extendedProps.location
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