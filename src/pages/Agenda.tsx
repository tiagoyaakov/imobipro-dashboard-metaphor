import React, { useState } from 'react';
import { AgendaCalendar, AgendaSidebar, AppointmentModal } from '@/components/agenda';
import { Appointment, AppointmentType, AppointmentStatus } from '@/types/agenda';
import { useAppointments, useAgentSchedules } from '@/hooks';

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
    agentSchedules,
    isLoading: schedulesLoading,
    error: schedulesError
  } = useAgentSchedules();

  // Handlers para manipulação de appointments
  const handleAppointmentCreate = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createAppointment.mutateAsync(appointmentData);
      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Erro ao criar appointment:', error);
    }
  };

  const handleAppointmentUpdate = async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      await updateAppointment.mutateAsync({ id, ...appointmentData });
      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Erro ao atualizar appointment:', error);
    }
  };

  const handleAppointmentDelete = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
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
            {appointmentsError?.message || schedulesError?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <AgendaSidebar 
          appointments={appointments || []}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AgendaCalendar
          appointments={appointments || []}
          agentSchedules={agentSchedules || []}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          isLoading={isLoading}
        />
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
        isLoading={createAppointment.isPending || updateAppointment.isPending || deleteAppointment.isPending}
      />
    </div>
  );
}
