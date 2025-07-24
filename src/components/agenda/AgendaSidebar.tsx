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
    <div className="space-y-3 p-3 overflow-y-auto h-full custom-scrollbar">
      {/* Resumo Compacto */}
      <Card className="imobipro-card shadow-sm">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Resumo</span>
              <Badge variant="outline" className="text-xs px-2 py-0">
                {stats.total} total
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.today}</div>
                <div className="text-xs text-muted-foreground">Hoje</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.confirmed}</div>
                <div className="text-xs text-muted-foreground">Confirmados</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Agendamentos - Ultra Compacto */}
      <Card className="imobipro-card shadow-sm">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Próximos</span>
              <Badge variant="outline" className="text-xs px-2 py-0">
                <Clock className="w-3 h-3 mr-1" />
                Hoje
              </Badge>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-4">
                <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Nenhum agendamento</p>
              </div>
            ) : (
              <div className="space-y-1">
                {todayAppointments.slice(0, 2).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-2 border border-border rounded cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => onAppointmentClick?.(appointment)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-foreground line-clamp-1">
                          {appointment.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {formatTime(appointment.startTime)}
                          </span>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)} ml-2`} />
                    </div>
                  </div>
                ))}
                {todayAppointments.length > 2 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs h-6">
                    +{todayAppointments.length - 2} mais
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas Importantes - Minimalista */}
      {stats.pending > 0 && (
        <Card className="imobipro-card shadow-sm border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  {stats.pending} pendente{stats.pending > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Aguardando confirmação
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgendaSidebar; 