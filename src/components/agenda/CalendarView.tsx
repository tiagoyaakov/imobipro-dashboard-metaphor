import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock, 
  User,
  MapPin,
  Eye,
  Plus,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  clientPhone?: string;
  agentName: string;
  startTime: Date;
  endTime: Date;
  type: 'visit' | 'meeting' | 'call' | 'inspection';
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  location?: string;
  propertyId?: string;
  color?: string;
}

interface CalendarViewProps {
  appointments: Appointment[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onCreateAppointment?: (date: Date) => void;
  className?: string;
}

type ViewMode = 'month' | 'week' | 'day';

const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate = new Date(),
  onDateSelect,
  onAppointmentClick,
  onCreateAppointment,
  className
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const appointmentTypeColors = {
    visit: 'bg-imobipro-blue text-white',
    meeting: 'bg-imobipro-success text-white',
    call: 'bg-imobipro-warning text-white',
    inspection: 'bg-purple-500 text-white'
  };

  const appointmentStatusColors = {
    confirmed: 'border-green-500 bg-green-50 dark:bg-green-950',
    pending: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    cancelled: 'border-red-500 bg-red-50 dark:bg-red-950',
    completed: 'border-gray-500 bg-gray-50 dark:bg-gray-950'
  };

  // Filtrar appointments do dia selecionado
  const dayAppointments = useMemo(() => {
    const dateStr = currentDate.toDateString();
    return appointments.filter(apt => 
      apt.startTime.toDateString() === dateStr
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [appointments, currentDate]);

  // Verificar se um dia tem appointments
  const getDayAppointments = (date: Date) => {
    const dateStr = date.toDateString();
    return appointments.filter(apt => 
      apt.startTime.toDateString() === dateStr
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAppointmentDuration = (appointment: Appointment) => {
    const diff = appointment.endTime.getTime() - appointment.startTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
    return `${minutes}min`;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
    onDateSelect?.(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      onDateSelect?.(date);
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <div
      key={appointment.id}
      className={cn(
        "p-3 border-l-4 rounded-lg cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        appointmentStatusColors[appointment.status],
        "focus:outline-none focus:ring-2 focus:ring-imobipro-blue focus:ring-offset-2"
      )}
      onClick={() => onAppointmentClick?.(appointment)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAppointmentClick?.(appointment);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Compromisso: ${appointment.title} às ${formatTime(appointment.startTime)}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-foreground truncate">
          {appointment.title}
        </h4>
        <Badge 
          className={cn("text-xs ml-2 flex-shrink-0", appointmentTypeColors[appointment.type])}
          variant="secondary"
        >
          {appointment.type === 'visit' && 'Visita'}
          {appointment.type === 'meeting' && 'Reunião'}
          {appointment.type === 'call' && 'Ligação'}
          {appointment.type === 'inspection' && 'Vistoria'}
        </Badge>
      </div>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            <span className="ml-1 text-xs">({getAppointmentDuration(appointment)})</span>
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate">{appointment.clientName}</span>
        </div>
        
        {appointment.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{appointment.location}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-imobipro-blue" />
            <h2 className="text-xl font-semibold text-foreground">
              {currentDate.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric',
                ...(viewMode === 'day' && { day: 'numeric' })
              })}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="month" className="text-xs sm:text-sm">
                Mês
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs sm:text-sm">
                Semana
              </TabsTrigger>
              <TabsTrigger value="day" className="text-xs sm:text-sm">
                Dia
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
                aria-label="Período anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                aria-label="Próximo período"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendário */}
          <Card className="lg:col-span-8 imobipro-card">
            <CardContent className="p-4">
              <TabsContent value="month" className="m-0">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={handleDateSelect}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  className="w-full"
                  modifiers={{
                    appointment: (date) => getDayAppointments(date).length > 0
                  }}
                  modifiersStyles={{
                    appointment: { 
                      backgroundColor: 'hsl(var(--imobipro-blue) / 0.1)',
                      color: 'hsl(var(--imobipro-blue))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="week" className="m-0">
                <div className="text-center text-muted-foreground py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Visualização semanal em desenvolvimento</p>
                </div>
              </TabsContent>
              
              <TabsContent value="day" className="m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {currentDate.toLocaleDateString('pt-BR', { 
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => onCreateAppointment?.(currentDate)}
                      className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agendar
                    </Button>
                  </div>
                  
                  {dayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum compromisso agendado para este dia</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayAppointments.map(renderAppointmentCard)}
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Card>

          {/* Painel lateral - Compromissos do dia */}
          <Card className="lg:col-span-4 imobipro-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Compromissos do Dia
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {dayAppointments.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentDate.toLocaleDateString('pt-BR', { 
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] px-4">
                {dayAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Dia livre de compromissos</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => onCreateAppointment?.(currentDate)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Criar agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {dayAppointments.map(renderAppointmentCard)}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default CalendarView;