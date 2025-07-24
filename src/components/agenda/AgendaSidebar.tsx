import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, User, Building, TrendingUp, AlertCircle } from 'lucide-react';
import { Appointment } from '@/types/agenda';

interface AgendaSidebarProps {
  appointments?: Appointment[];
  selectedDate?: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
}

const AgendaSidebar: React.FC<AgendaSidebarProps> = ({
  appointments = [],
  selectedDate,
  onAppointmentClick
}) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filtrar agendamentos por data
  const todayAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate.toDateString() === today.toDateString();
  });

  const tomorrowAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate.toDateString() === tomorrow.toDateString();
  });

  // Estatísticas
  const stats = {
    total: appointments.length,
    today: todayAppointments.length,
    tomorrow: tomorrowAppointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.today}</div>
              <div className="text-sm text-muted-foreground">Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.confirmed}</div>
              <div className="text-sm text-muted-foreground">Confirmados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agendamentos de Hoje */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum agendamento para hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-foreground line-clamp-1">
                      {appointment.title}
                    </h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(appointment.status)}`}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </div>
                  
                  {appointment.clientName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {appointment.clientName}
                    </div>
                  )}
                  
                  {appointment.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{appointment.location}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {todayAppointments.length > 5 && (
                <Button variant="outline" size="sm" className="w-full">
                  Ver mais ({todayAppointments.length - 5})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agendamentos de Amanhã */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Amanhã
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tomorrowAppointments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum agendamento para amanhã</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tomorrowAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-foreground line-clamp-1">
                      {appointment.title}
                    </h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(appointment.status)}`}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTime(appointment.startTime)}
                  </div>
                  
                  {appointment.clientName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {appointment.clientName}
                    </div>
                  )}
                </div>
              ))}
              
              {tomorrowAppointments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full">
                  Ver mais ({tomorrowAppointments.length - 3})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lembretes */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">3 agendamentos pendentes</p>
                <p className="text-xs text-muted-foreground">Requerem confirmação</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Sincronização Google Calendar</p>
                <p className="text-xs text-muted-foreground">Atualizada há 5 minutos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaSidebar; 