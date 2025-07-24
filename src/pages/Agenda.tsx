import React, { useState, useMemo } from 'react';
import { AgendaCalendar, AgendaSidebar, AppointmentModal } from '@/components/agenda';
import { Appointment, AppointmentType, AppointmentStatus } from '@/types/agenda';
import { useAppointments, useAgentSchedules, useGoogleCalendarStatus } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Settings,
  RefreshCw,
  BarChart3
} from 'lucide-react';

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Hooks para gerenciamento de dados
  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    createAppointment,
    updateAppointment,
    deleteAppointment
  } = useAppointments();

  const {
    data: agentSchedulesData,
    isLoading: schedulesLoading,
    error: schedulesError
  } = useAgentSchedules();

  const agentSchedules = agentSchedulesData || [];

  // Status do Google Calendar
  const { isConnected: googleCalendarConnected, isChecking: googleCalendarChecking } = useGoogleCalendarStatus();

  // Métricas da agenda - seguindo padrão CRM
  const metrics = useMemo(() => {
    if (!appointments) {
      return {
        totalAppointments: 0,
        todayAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    }).length;
    
    const confirmedAppointments = appointments.filter(apt => 
      apt.status === AppointmentStatus.CONFIRMED
    ).length;
    
    const completedAppointments = appointments.filter(apt => 
      apt.status === AppointmentStatus.COMPLETED
    ).length;
    
    return {
      totalAppointments: appointments.length,
      todayAppointments,
      confirmedAppointments,
      completedAppointments
    };
  }, [appointments]);

  // Handlers para manipulação de appointments
  const handleAppointmentCreate = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createAppointment(appointmentData);
      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Erro ao criar appointment:', error);
    }
  };

  const handleAppointmentUpdate = async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      await updateAppointment(id, appointmentData);
      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Erro ao atualizar appointment:', error);
    }
  };

  const handleAppointmentDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Erro ao deletar appointment:', error);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
  };

  // Estados de loading e erro
  const isLoading = appointmentsLoading || schedulesLoading;
  const hasError = appointmentsError || schedulesError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Erro ao carregar agenda
          </h3>
          <p className="text-gray-600">
            {appointmentsError?.toString() || schedulesError?.toString() || 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Seguindo padrão CRM */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie agendamentos e sincronize com Google Calendar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>
      
      {/* Métricas Principais - Minimalistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-xl font-bold">
                  {isLoading ? '...' : metrics.totalAppointments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  agendamentos
                </p>
              </div>
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                <p className="text-xl font-bold">
                  {isLoading ? '...' : metrics.todayAppointments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  agendados
                </p>
              </div>
              <Clock className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmados</p>
                <p className="text-xl font-bold">
                  {isLoading ? '...' : metrics.confirmedAppointments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  este mês
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-xl font-bold">
                  {isLoading ? '...' : metrics.completedAppointments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  finalizados
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      {/* Layout Principal - Calendário como Foco */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário - 75% do espaço */}
        <div className="lg:col-span-3">
          <AgendaCalendar
            appointments={appointments || []}
            agentSchedules={agentSchedules || []}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            isLoading={isLoading}
          />
        </div>
        
        {/* Sidebar Compacta - 25% do espaço */}
        <div className="lg:col-span-1">
          <AgendaSidebar 
            appointments={appointments || []}
            isLoading={isLoading}
            onAppointmentClick={handleEventClick}
          />
        </div>
      </div>

      {/* Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
        onCreate={handleAppointmentCreate}
        onUpdate={handleAppointmentUpdate}
        onDelete={handleAppointmentDelete}
        isLoading={false}
      />
      
      {/* Status da Integração - Dinâmico */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            GOOGLE CALENDAR
          </Badge>
          {googleCalendarChecking ? (
            <Badge variant="outline">
              Verificando...
            </Badge>
          ) : googleCalendarConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Conectado
            </Badge>
          ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              Desconectado
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {googleCalendarChecking 
            ? 'Verificando status da conexão...'
            : googleCalendarConnected 
              ? 'Agendamentos sincronizados automaticamente com Google Calendar.'
              : 'Configure a integração com Google Calendar para sincronização automática.'
          }
          {isLoading && ' Carregando dados...'}
        </p>
      </div>
    </div>
  );
}
