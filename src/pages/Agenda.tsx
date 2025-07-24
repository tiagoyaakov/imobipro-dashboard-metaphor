import React, { useState } from 'react';
import { AgendaCalendar, AgendaSidebar, AppointmentModal } from '@/components/agenda';
import { Appointment, AppointmentType, AppointmentStatus } from '@/types/agenda';
import { useAppointments, useAgentSchedules } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="flex h-full bg-background">
      {/* Sidebar - Responsiva */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        z-40 lg:z-auto
        w-80 lg:w-80
        h-full
        bg-card border-r border-border
        transition-transform duration-300 ease-in-out
        lg:transition-none
        shadow-lg lg:shadow-none
      `}>
        <AgendaSidebar 
          appointments={appointments || []}
          isLoading={isLoading}
          onAppointmentClick={handleEventClick}
        />
      </div>

      {/* Overlay para mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content - Foco no Calendário */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header com toggle da sidebar */}
        <div className="lg:hidden p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="text-sm">Menu</span>
            </Button>
            <h1 className="text-lg font-semibold">Agenda</h1>
            <div className="w-10" /> {/* Spacer para centralizar título */}
          </div>
        </div>

        {/* Conteúdo Principal - Calendário */}
        <div className="flex-1 p-4 lg:p-6">
          <AgendaCalendar
            appointments={appointments || []}
            agentSchedules={agentSchedules || []}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            isLoading={isLoading}
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
    </div>
  );
}
