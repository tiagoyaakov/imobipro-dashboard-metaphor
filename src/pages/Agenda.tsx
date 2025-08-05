import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, User, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ================================================================
// TIPOS LOCAIS
// ================================================================

interface SimpleAppointment {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'VISIT' | 'MEETING' | 'CALL';
  status: 'confirmed' | 'pending' | 'cancelled';
  clientName: string;
  clientPhone: string;
  location?: string;
  agentName: string;
}

// ================================================================
// DADOS MOCKADOS SIMPLES
// ================================================================

const generateMockAppointments = (): SimpleAppointment[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return [
    {
      id: '1',
      title: 'Visita - Apartamento Centro',
      description: 'Apresentação do apartamento de 2 quartos no centro da cidade',
      date: today.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      type: 'VISIT',
      status: 'confirmed',
      clientName: 'João Silva',
      clientPhone: '(11) 99999-9999',
      location: 'Rua das Flores, 123 - Centro',
      agentName: 'Carlos Santos'
    },
    {
      id: '2',
      title: 'Reunião - Negociação Casa Jardins',
      description: 'Discussão da proposta para casa nos Jardins',
      date: today.toISOString().split('T')[0],
      startTime: '14:30',
      endTime: '15:30',
      type: 'MEETING',
      status: 'pending',
      clientName: 'Maria Santos',
      clientPhone: '(11) 88888-8888',
      location: 'Escritório - Av. Paulista, 1000',
      agentName: 'Ana Costa'
    },
    {
      id: '3',
      title: 'Ligação - Follow-up Cliente',
      description: 'Acompanhamento pós-visita',
      date: tomorrow.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '10:30',
      type: 'CALL',
      status: 'confirmed',
      clientName: 'Pedro Oliveira',
      clientPhone: '(11) 77777-7777',
      agentName: 'Carlos Santos'
    },
    {
      id: '4',
      title: 'Visita - Casa Moema',
      description: 'Primeira visita à casa em Moema',
      date: tomorrow.toISOString().split('T')[0],
      startTime: '16:00',
      endTime: '17:00',
      type: 'VISIT',
      status: 'pending',
      clientName: 'Ana Rodrigues',
      clientPhone: '(11) 66666-6666',
      location: 'Rua Moema, 456 - Moema',
      agentName: 'Ana Costa'
    }
  ];
};

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const Agenda = () => {
  const [appointments, setAppointments] = useState<SimpleAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Carregar dados iniciais
  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = generateMockAppointments();
      setAppointments(mockData);
      setIsLoading(false);
      
      console.log('📅 Agenda carregada com sucesso:', mockData.length, 'agendamentos');
    };

    loadAppointments();
  }, []);

  // Filtrar agendamentos por data selecionada
  const todayAppointments = appointments.filter(apt => apt.date === selectedDate);
  
  // Agrupar por status
  const confirmedAppointments = todayAppointments.filter(apt => apt.status === 'confirmed');
  const pendingAppointments = todayAppointments.filter(apt => apt.status === 'pending');

  // Função para obter cor do badge por tipo
  const getTypeBadgeColor = (type: SimpleAppointment['type']) => {
    switch (type) {
      case 'VISIT': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'MEETING': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'CALL': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Função para obter cor do badge por status
  const getStatusBadgeColor = (status: SimpleAppointment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateAppointment = () => {
    console.log('📅 Criar novo agendamento');
    // Implementar modal de criação
  };

  const handleAppointmentClick = (appointment: SimpleAppointment) => {
    console.log('📅 Clicou no agendamento:', appointment.title);
    // Implementar modal de detalhes
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground mt-1">Carregando agendamentos...</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus compromissos e agendamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => console.log('📅 Configurações')}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button 
            className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
            onClick={handleCreateAppointment}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Seletor de Data */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <label htmlFor="date-picker" className="text-sm font-medium">
                Data selecionada:
              </label>
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              {todayAppointments.length} agendamento(s) para esta data
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {confirmedAppointments.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingAppointments.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todayAppointments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Agendamentos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Agendamentos para {new Date(selectedDate).toLocaleDateString('pt-BR')}
        </h2>
        
        {todayAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum agendamento para esta data.
              </p>
              <Button 
                className="mt-4"
                onClick={handleCreateAppointment}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {todayAppointments.map((appointment) => (
              <Card 
                key={appointment.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAppointmentClick(appointment)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{appointment.title}</h3>
                        <Badge className={getTypeBadgeColor(appointment.type)}>
                          {appointment.type === 'VISIT' ? 'Visita' : 
                           appointment.type === 'MEETING' ? 'Reunião' : 'Ligação'}
                        </Badge>
                        <Badge className={getStatusBadgeColor(appointment.status)}>
                          {appointment.status === 'confirmed' ? 'Confirmado' : 
                           appointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </div>
                      
                      {appointment.description && (
                        <p className="text-muted-foreground mb-3">
                          {appointment.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.clientName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.clientPhone}</span>
                    </div>
                  </div>

                  {appointment.location && (
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Corretor: {appointment.agentName}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;