import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, User, Building, TrendingUp, AlertCircle } from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/types/agenda';

interface AgendaSidebarProps {
  appointments?: Appointment[];
  selectedDate?: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
  isLoading?: boolean;
}

const AgendaSidebar: React.FC<AgendaSidebarProps> = ({
  appointments = [],
  selectedDate,
  onAppointmentClick,
  isLoading = false
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
    pending: appointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length,
    confirmed: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
    completed: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-500';
      case AppointmentStatus.SCHEDULED:
        return 'bg-yellow-500';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-500';
      case AppointmentStatus.COMPLETED:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'Confirmado';
      case AppointmentStatus.SCHEDULED:
        return 'Agendado';
      case AppointmentStatus.CANCELLED:
        return 'Cancelado';
      case AppointmentStatus.COMPLETED:
        return 'Concluído';
      case AppointmentStatus.NO_SHOW:
        return 'Não Compareceu';
      case AppointmentStatus.RESCHEDULED:
        return 'Reagendado';
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="imobipro-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1">
                        {appointment.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTime(appointment.startTime)}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(appointment.status)}`}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              {todayAppointments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full">
                  Ver mais ({todayAppointments.length - 3})
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
            <p className="text-muted-foreground text-sm">Nenhum agendamento para amanhã</p>
          ) : (
            <div className="space-y-3">
              {tomorrowAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1">
                        {appointment.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTime(appointment.startTime)}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(appointment.status)}`}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
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
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                3 agendamentos pendentes de confirmação
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Reunião de equipe em 30 minutos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaSidebar; 