import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar as CalendarIcon, Users, Settings } from "lucide-react";

// Importar os novos componentes da agenda
import {
  CalendarView,
  BookingWizard,
  AgentAvailability,
  SyncStatus,
  NotificationSystem,
  useSyncStatus,
  useNotifications,
  type Appointment,
  type Agent,
  type AgentAvailabilityData,
  type BookingData,
  type TimeSlotOption
} from "@/components/agenda";

// Importar componente Google Calendar Integration
import GoogleCalendarIntegration from "@/components/agenda/GoogleCalendarIntegration";
import { useAuth } from "@/hooks/useAuth";

const Agenda = () => {
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Hooks para gerenciar estado
  const { user } = useAuth();
  const { syncStatus, setSyncStatus } = useSyncStatus();
  const { notifications, addNotification, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  // Dados mockados para demonstração
  const mockAppointments: Appointment[] = [
    {
      id: "1",
      title: "Visita - Apartamento Centro",
      clientName: "João Silva",
      clientPhone: "(11) 99999-9999",
      agentName: "Carlos Santos",
      startTime: new Date(2024, 11, 15, 9, 0),
      endTime: new Date(2024, 11, 15, 10, 0),
      type: "visit",
      status: "confirmed",
      location: "Rua das Flores, 123 - Centro",
      color: "#0EA5E9"
    },
    {
      id: "2",
      title: "Reunião - Negociação Casa Jardins",
      clientName: "Maria Santos",
      clientPhone: "(11) 88888-8888",
      agentName: "Ana Costa",
      startTime: new Date(2024, 11, 15, 14, 30),
      endTime: new Date(2024, 11, 15, 15, 30),
      type: "meeting",
      status: "pending",
      location: "Casa dos Jardins - Av. Paulista, 1000"
    }
  ];

  const mockAgents: Agent[] = [
    {
      id: "1",
      name: "Carlos Santos",
      isAvailable: true,
      rating: 4.8,
      specialties: ["Apartamentos", "Centro"]
    },
    {
      id: "2",
      name: "Ana Costa",
      isAvailable: true,
      rating: 4.9,
      specialties: ["Casas", "Jardins"]
    },
    {
      id: "3",
      name: "Pedro Silva",
      isAvailable: false,
      rating: 4.7,
      specialties: ["Comercial", "Lofts"]
    }
  ];

  const mockAgentAvailability: AgentAvailabilityData = {
    id: "1",
    agentId: "1",
    agentName: "Carlos Santos",
    maxDailyAppointments: 8,
    appointmentDuration: 60,
    bufferTime: 15,
    autoAssign: true,
    workingDays: [
      {
        dayOfWeek: 1, // Monday
        isActive: true,
        timeSlots: [
          { id: "1", startTime: "09:00", endTime: "12:00" },
          { id: "2", startTime: "14:00", endTime: "18:00" }
        ]
      },
      {
        dayOfWeek: 2, // Tuesday
        isActive: true,
        timeSlots: [
          { id: "3", startTime: "09:00", endTime: "12:00" },
          { id: "4", startTime: "14:00", endTime: "18:00" }
        ]
      },
      // Adicionar outros dias conforme necessário
    ],
    calendarSync: {
      googleEnabled: true,
      outlookEnabled: false,
      lastSync: new Date(),
      syncStatus: 'synced'
    }
  };

  const mockNotificationSettings = {
    enabled: true,
    channels: {
      push: true,
      email: true,
      sms: false,
      whatsapp: true
    },
    timing: {
      appointmentReminders: [60, 15], // 1 hora e 15 minutos antes
      confirmationDeadline: 24,
      syncUpdates: true,
      conflictAlerts: true
    },
    quiet_hours: {
      enabled: true,
      start: "22:00",
      end: "08:00"
    },
    priority_filter: 'all' as const
  };

  // Função para obter slots disponíveis
  const getAvailableSlots = (date: Date, agentId?: string): TimeSlotOption[] => {
    // Mock de slots disponíveis
    return [
      { time: "09:00", available: true, agentName: "Carlos Santos" },
      { time: "10:00", available: true, agentName: "Ana Costa" },
      { time: "11:00", available: false, conflictReason: "Compromisso existente" },
      { time: "14:00", available: true, agentName: "Carlos Santos" },
      { time: "15:00", available: true, agentName: "Pedro Silva" },
      { time: "16:00", available: true, agentName: "Ana Costa" }
    ];
  };

  const handleCreateAppointment = (date: Date) => {
    setSelectedDate(date);
    setShowBookingWizard(true);
  };

  const handleBookingComplete = (booking: BookingData) => {
    console.log("Novo agendamento criado:", booking);
    
    // Adicionar notificação de confirmação
    addNotification({
      type: 'appointment_confirmation',
      title: 'Agendamento Criado',
      message: `Agendamento "${booking.title}" criado com sucesso para ${booking.selectedDate.toLocaleDateString('pt-BR')} às ${booking.selectedTime}`,
      priority: 'medium',
      actions: [
        { id: 'view', label: 'Ver Detalhes', action: 'view' },
        { id: 'dismiss', label: 'OK', action: 'dismiss' }
      ]
    });
    
    setShowBookingWizard(false);
  };

  const handleSyncCalendar = (provider: 'google' | 'outlook') => {
    console.log(`Conectando ao ${provider}...`);
    // Implementar lógica de conexão
  };

  const handleNotificationAction = (notificationId: string, actionId: string) => {
    console.log(`Ação ${actionId} executada para notificação ${notificationId}`);
    
    if (actionId === 'dismiss') {
      deleteNotification(notificationId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie compromissos, disponibilidade e sincronização</p>
        </div>
        <Button 
          className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
          onClick={() => setShowBookingWizard(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Barra de status com notificações e sincronização */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NotificationSystem
          notifications={notifications}
          settings={mockNotificationSettings}
          onNotificationAction={handleNotificationAction}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDeleteNotification={deleteNotification}
          onUpdateSettings={(settings) => console.log("Configurações atualizadas:", settings)}
        />
        
        <SyncStatus
          syncStatus={syncStatus}
          onManualSync={() => console.log("Sincronização manual iniciada")}
          onResolveConflicts={() => console.log("Resolvendo conflitos")}
          onReconnectProvider={handleSyncCalendar}
        />
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Disponibilidade
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView
            appointments={mockAppointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onAppointmentClick={(appointment) => console.log("Compromisso clicado:", appointment)}
            onCreateAppointment={handleCreateAppointment}
          />
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <AgentAvailability
            availability={mockAgentAvailability}
            onUpdate={(availability) => console.log("Disponibilidade atualizada:", availability)}
            onSyncCalendar={handleSyncCalendar}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="space-y-6">
            {/* Integração Google Calendar */}
            <GoogleCalendarIntegration
              userId={user?.id || 'mock-user-id'}
              onConnectionChange={(isConnected) => {
                console.log('Google Calendar connection changed:', isConnected);
                // Atualizar status de sincronização se necessário
                if (isConnected) {
                  setSyncStatus(prev => ({
                    ...prev,
                    google: { ...prev.google, status: 'connected' }
                  }));
                }
              }}
            />

            {/* Outras configurações */}
            <Card className="imobipro-card">
              <CardHeader>
                <CardTitle>Outras Configurações</CardTitle>
                <CardDescription>
                  Configure preferências gerais e outras integrações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configurações adicionais em desenvolvimento</p>
                  <p className="text-xs mt-2">
                    Use as abas de Notificações e Sincronização para outras funcionalidades
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Wizard de agendamento */}
      <BookingWizard
        isOpen={showBookingWizard}
        onClose={() => setShowBookingWizard(false)}
        onComplete={handleBookingComplete}
        preselectedDate={selectedDate}
        availableAgents={mockAgents}
        getAvailableSlots={getAvailableSlots}
      />
    </div>
  );
};

export default Agenda;
