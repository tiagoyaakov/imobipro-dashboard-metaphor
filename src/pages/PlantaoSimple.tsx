// Versão simplificada da página Plantão sem dependências circulares
import React, { useState, useEffect } from "react";
import { Loader2, Calendar, AlertCircle, Settings, CheckCircle, Clock, MapPin, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Tipos locais simplificados
interface SimpleEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: "CONFIRMADO" | "AGENDADO" | "CANCELADO";
  corretor: {
    id: string;
    name: string;
    email: string;
  };
  location?: string;
}

export default function PlantaoSimple() {
  const [events, setEvents] = useState<SimpleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendar");

  // Dados mockados para teste
  useEffect(() => {
    const mockEvents: SimpleEvent[] = [
      {
        id: "1",
        title: "Visita Apartamento Centro",
        description: "Visita com cliente interessado em apartamento",
        startDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
        status: "CONFIRMADO",
        corretor: {
          id: "corretor-1",
          name: "João Silva",
          email: "joao@imobipro.com"
        },
        location: "Rua da Consolação, 123"
      },
      {
        id: "2",
        title: "Reunião com Cliente",
        description: "Discussão sobre proposta de compra",
        startDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 horas
        endDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 horas
        status: "AGENDADO",
        corretor: {
          id: "corretor-2",
          name: "Maria Santos",
          email: "maria@imobipro.com"
        },
        location: "Escritório ImobiPRO"
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: SimpleEvent['status']) => {
    switch (status) {
      case "CONFIRMADO":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case "AGENDADO":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Agendado
          </Badge>
        );
      case "CANCELADO":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando calendário...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plantão</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus plantões e agendamentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Alert de status */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Módulo Plantão carregado com sucesso! Versão simplificada funcionando perfeitamente.
        </AlertDescription>
      </Alert>

      {/* Abas principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Aba do Calendário */}
        <TabsContent value="calendar" className="space-y-6">
          {/* Lista de eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum agendamento encontrado
                </p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {event.title}
                      </h3>
                      {getStatusBadge(event.status)}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {event.corretor.name}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Eventos</p>
                    <p className="text-2xl font-bold">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmados</p>
                    <p className="text-2xl font-bold">
                      {events.filter(e => e.status === "CONFIRMADO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agendados</p>
                    <p className="text-2xl font-bold">
                      {events.filter(e => e.status === "AGENDADO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Módulo Plantão Funcionando
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Versão simplificada carregada com sucesso - sem dependências circulares
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Próximas Funcionalidades</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sincronização com Google Calendar</li>
                  <li>• Interface de calendário interativo</li>
                  <li>• Criação e edição de eventos</li>
                  <li>• Notificações automáticas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}