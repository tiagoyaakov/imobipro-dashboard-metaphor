import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Users, Settings } from "lucide-react";
import { AgendaCalendar, AgendaSidebar, AppointmentModal } from '@/components/agenda';
import { Appointment, AppointmentType, AppointmentStatus } from '@/types/agenda';

const Agenda = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Dados mockados para demonstração
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      title: 'Visita - Apartamento Centro',
      description: 'Visita ao apartamento no centro da cidade',
      type: AppointmentType.PROPERTY_VIEWING,
      status: AppointmentStatus.CONFIRMED,
      startTime: new Date('2024-12-01T09:00:00'),
      endTime: new Date('2024-12-01T10:00:00'),
      agentId: 'agent1',
      contactId: 'contact1',
      propertyId: 'prop1',
      notes: 'Cliente interessado em financiamento',
      autoAssigned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Reunião - Negociação Casa Jardins',
      description: 'Reunião para fechar negócio da casa',
      type: AppointmentType.NEGOTIATION,
      status: AppointmentStatus.SCHEDULED,
      startTime: new Date('2024-12-01T14:30:00'),
      endTime: new Date('2024-12-01T15:30:00'),
      agentId: 'agent2',
      contactId: 'contact2',
      propertyId: 'prop2',
      notes: 'Trazer documentação do financiamento',
      autoAssigned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Follow-up - Cobertura Vila Madalena',
      description: 'Acompanhamento pós-visita',
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.SCHEDULED,
      startTime: new Date('2024-12-02T10:00:00'),
      endTime: new Date('2024-12-02T11:00:00'),
      agentId: 'agent1',
      contactId: 'contact3',
      propertyId: 'prop3',
      notes: 'Cliente quer ver mais opções',
      autoAssigned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const handleAppointmentCreate = (appointment: Partial<Appointment>) => {
    console.log('Criar agendamento:', appointment);
    // TODO: Implementar criação no banco de dados
  };

  const handleAppointmentUpdate = (id: string, appointment: Partial<Appointment>) => {
    console.log('Atualizar agendamento:', id, appointment);
    // TODO: Implementar atualização no banco de dados
  };

  const handleAppointmentDelete = (id: string) => {
    console.log('Excluir agendamento:', id);
    // TODO: Implementar exclusão no banco de dados
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus compromissos e visitas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button className="bg-imobipro-blue hover:bg-imobipro-blue-dark">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário Principal */}
        <div className="lg:col-span-3">
          <AgendaCalendar
            appointments={mockAppointments}
            onAppointmentCreate={handleAppointmentCreate}
            onAppointmentUpdate={handleAppointmentUpdate}
            onAppointmentDelete={handleAppointmentDelete}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <AgendaSidebar
            appointments={mockAppointments}
            onAppointmentClick={handleAppointmentClick}
          />
        </div>
      </div>

      {/* Modal de Agendamento */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment || undefined}
        onCreate={handleAppointmentCreate}
        onUpdate={handleAppointmentUpdate}
        onDelete={handleAppointmentDelete}
      />
    </div>
  );
};

export default Agenda;
