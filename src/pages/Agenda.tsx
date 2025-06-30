
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Users } from "lucide-react";

const Agenda = () => {
  const appointments = [
    {
      id: 1,
      title: "Visita - Apartamento Centro",
      client: "João Silva",
      time: "09:00 - 10:00",
      status: "Confirmado",
      type: "Visita"
    },
    {
      id: 2,
      title: "Reunião - Negociação Casa Jardins",
      client: "Maria Santos",
      time: "14:30 - 15:30",
      status: "Pendente",
      type: "Reunião"
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600 mt-1">Gerencie seus compromissos e visitas</p>
        </div>
        <Button className="bg-imobipro-blue hover:bg-imobipro-blue-dark">
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 imobipro-card">
          <CardHeader>
            <CardTitle>Compromissos de Hoje</CardTitle>
            <CardDescription>Seus agendamentos para hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                    <Badge variant={appointment.status === "Confirmado" ? "default" : "secondary"}>
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {appointment.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {appointment.client}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 h-64 rounded-lg flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agenda;
