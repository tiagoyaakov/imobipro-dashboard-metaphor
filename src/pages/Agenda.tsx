import React, { useState } from 'react';
import { AgendaCalendar, AgendaSidebar, AppointmentModal } from '@/components/agenda';
import { Appointment, AppointmentType, AppointmentStatus } from '@/types/agenda';
import { useAppointments, useAgentSchedules } from '@/hooks';

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Responsivo */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        z-40 lg:z-auto
        w-80 lg:w-80
        h-full
        bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700
        transition-transform duration-300 ease-in-out
        lg:transition-none
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
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header com toggle da sidebar */}
        <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Menu</span>
          </button>
        </div>

        <div className="flex-1 p-4 lg:p-6">
          <AgendaCalendar
            appointments={appointments || []}
            agentSchedules={agentSchedules}
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
        isLoading={false} // Removido isPending pois não existe nas funções
      />
    </div>
  );
}
