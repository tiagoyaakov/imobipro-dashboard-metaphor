import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, User, Building, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
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
      <div className="space-y-4 p-4">
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
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto h-full custom-scrollbar">
      {/* Estatísticas */}
      <Card className="imobipro-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.today}</div>
              <div className="text-xs text-muted-foreground">Hoje</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</div>
              <div className="text-xs text-muted-foreground">Confirmados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agendamentos de Hoje */}
      <Card className="imobipro-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4" />
            Hoje
            <Badge variant="secondary" className="ml-auto text-xs">
              {todayAppointments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {appointment.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {formatTime(appointment.startTime)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)}`} />
                      <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
              {todayAppointments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Ver mais ({todayAppointments.length - 3})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agendamentos de Amanhã */}
      <Card className="imobipro-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4" />
            Amanhã
            <Badge variant="secondary" className="ml-auto text-xs">
              {tomorrowAppointments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tomorrowAppointments.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum agendamento para amanhã</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tomorrowAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {appointment.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {formatTime(appointment.startTime)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)}`} />
                      <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
              {tomorrowAppointments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Ver mais ({tomorrowAppointments.length - 3})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lembretes */}
      <Card className="imobipro-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="w-4 h-4" />
            Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.pending > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  {stats.pending} agendamento{stats.pending > 1 ? 's' : ''} pendente{stats.pending > 1 ? 's' : ''} de confirmação
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
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