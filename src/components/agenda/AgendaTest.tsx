import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { 
  useAgentSchedule, 
  useUpsertAgentSchedule,
  useAvailableSlots,
  useGenerateSlotsFromSchedule,
  useAgendaManager 
} from '@/hooks/useAgenda';
import { WorkingHours, DaySchedule } from '@/types/agenda';

interface AgendaTestProps {
  agentId: string;
}

/**
 * Componente de teste para demonstrar as funcionalidades da agenda
 */
export function AgendaTest({ agentId }: AgendaTestProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Hook gerenciador completo da agenda
  const agendaManager = useAgendaManager(agentId);
  
  // Hooks específicos para demonstração
  const { data: schedule, isLoading: isLoadingSchedule } = useAgentSchedule(agentId);
  const { data: availableSlots, isLoading: isLoadingSlots } = useAvailableSlots(agentId, selectedDate);
  const upsertSchedule = useUpsertAgentSchedule();
  const generateSlots = useGenerateSlotsFromSchedule();

  // Estado local para demonstração
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { available: true, start: '09:00', end: '18:00', breaks: [] },
    tuesday: { available: true, start: '09:00', end: '18:00', breaks: [] },
    wednesday: { available: true, start: '09:00', end: '18:00', breaks: [] },
    thursday: { available: true, start: '09:00', end: '18:00', breaks: [] },
    friday: { available: true, start: '09:00', end: '18:00', breaks: [] },
    saturday: { available: false, start: '09:00', end: '14:00', breaks: [] },
    sunday: { available: false, start: '09:00', end: '14:00', breaks: [] },
  });

  const handleSaveSchedule = () => {
    upsertSchedule.mutate({
      agentId,
      workingHours,
      timezone: 'America/Sao_Paulo',
      isActive: true,
      bufferTime: 15,
      maxDailyAppointments: 8,
      allowWeekendWork: false,
      autoAssignEnabled: true,
    });
  };

  const handleGenerateSlots = () => {
    generateSlots.mutate({
      agentId,
      date: selectedDate,
      duration: 60
    });
  };

  const updateDaySchedule = (day: keyof WorkingHours, field: keyof DaySchedule, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'SYNCED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
      case 'SYNCING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}:00`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingSchedule) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imobipro-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-imobipro-blue" />
        <h1 className="text-2xl font-bold">Teste do Módulo Agenda</h1>
        <Badge variant="outline" className="ml-auto">
          Agent ID: {agentId}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração de Horários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Configuração de Horários
            </CardTitle>
            <CardDescription>
              Configure os horários de trabalho do corretor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => {
              const dayName = {
                monday: 'Segunda',
                tuesday: 'Terça',
                wednesday: 'Quarta',
                thursday: 'Quinta',
                friday: 'Sexta',
                saturday: 'Sábado',
                sunday: 'Domingo'
              }[day];

              const daySchedule = workingHours[day];

              return (
                <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-20 text-sm font-medium">
                    {dayName}
                  </div>
                  
                  <Switch
                    checked={daySchedule?.available || false}
                    onCheckedChange={(checked) => 
                      updateDaySchedule(day, 'available', checked)
                    }
                  />

                  {daySchedule?.available && (
                    <>
                      <Input
                        type="time"
                        value={daySchedule.start || '09:00'}
                        onChange={(e) => 
                          updateDaySchedule(day, 'start', e.target.value)
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">até</span>
                      <Input
                        type="time"
                        value={daySchedule.end || '18:00'}
                        onChange={(e) => 
                          updateDaySchedule(day, 'end', e.target.value)
                        }
                        className="w-24"
                      />
                    </>
                  )}
                </div>
              );
            })}

            <Button 
              onClick={handleSaveSchedule}
              disabled={upsertSchedule.isPending}
              className="w-full"
            >
              {upsertSchedule.isPending ? 'Salvando...' : 'Salvar Horários'}
            </Button>
          </CardContent>
        </Card>

        {/* Status da Agenda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status da Agenda
            </CardTitle>
            <CardDescription>
              Informações sobre a agenda atual do corretor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                    {schedule.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Fuso Horário:</span>
                  <span className="text-sm">{schedule.timezone}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Buffer entre agendamentos:</span>
                  <span className="text-sm">{schedule.bufferTime} min</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Max. agendamentos/dia:</span>
                  <span className="text-sm">{schedule.maxDailyAppointments || 'Ilimitado'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Atribuição automática:</span>
                  <Badge variant={schedule.autoAssignEnabled ? 'default' : 'secondary'}>
                    {schedule.autoAssignEnabled ? 'Habilitada' : 'Desabilitada'}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-500 mt-4">
                  Última atualização: {new Date(schedule.updatedAt).toLocaleString('pt-BR')}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma agenda configurada</p>
                <p className="text-xs">Configure os horários para começar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gerenciamento de Slots */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Slots de Disponibilidade
            </CardTitle>
            <CardDescription>
              Gerencie os slots disponíveis para agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="selectedDate">Data</Label>
                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleGenerateSlots}
                disabled={generateSlots.isPending || !schedule}
                variant="outline"
              >
                {generateSlots.isPending ? 'Gerando...' : 'Gerar Slots'}
              </Button>
            </div>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-imobipro-blue"></div>
              </div>
            ) : availableSlots && availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col items-center p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getSyncStatusIcon(slot.status)}
                      <span className="text-xs text-gray-600">
                        {slot.slotType}
                      </span>
                    </div>
                    
                    <div className="text-sm font-medium">
                      {formatTime(slot.startTime)}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {slot.duration}min
                    </div>
                    
                    <Badge 
                      variant={slot.status === 'AVAILABLE' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {slot.status === 'AVAILABLE' ? 'Livre' : 'Ocupado'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum slot disponível</p>
                <p className="text-xs">Gere slots para esta data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Demonstração das principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => agendaManager.generateSlots({ agentId, date: selectedDate })}
                disabled={agendaManager.isGeneratingSlots}
                className="flex flex-col h-auto py-4"
              >
                <Calendar className="h-6 w-6 mb-2" />
                <span className="text-xs">Gerar Slots</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => console.log('Sincronizar calendário')}
                className="flex flex-col h-auto py-4"
              >
                <CheckCircle className="h-6 w-6 mb-2" />
                <span className="text-xs">Sincronizar</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => console.log('Exportar dados')}
                className="flex flex-col h-auto py-4"
              >
                <User className="h-6 w-6 mb-2" />
                <span className="text-xs">Exportar</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => console.log('Relatórios')}
                className="flex flex-col h-auto py-4"
              >
                <AlertCircle className="h-6 w-6 mb-2" />
                <span className="text-xs">Relatórios</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AgendaTest;