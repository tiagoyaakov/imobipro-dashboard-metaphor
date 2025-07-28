import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Calendar,
  User,
  Settings,
  Plus,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  isBreak?: boolean;
  label?: string;
}

export interface WorkingDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isActive: boolean;
  timeSlots: TimeSlot[];
}

export interface AgentAvailabilityData {
  id: string;
  agentId: string;
  agentName: string;
  workingDays: WorkingDay[];
  maxDailyAppointments: number;
  appointmentDuration: number; // minutes
  bufferTime: number; // minutes between appointments
  autoAssign: boolean;
  calendarSync: {
    googleEnabled: boolean;
    outlookEnabled: boolean;
    lastSync?: Date;
    syncStatus: 'synced' | 'syncing' | 'error' | 'disconnected';
  };
}

interface AgentAvailabilityProps {
  availability: AgentAvailabilityData;
  onUpdate: (availability: AgentAvailabilityData) => void;
  onSyncCalendar: (provider: 'google' | 'outlook') => void;
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' }
];

const AgentAvailability: React.FC<AgentAvailabilityProps> = ({
  availability,
  onUpdate,
  onSyncCalendar,
  className
}) => {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState<{ startTime: string; endTime: string }>({
    startTime: '09:00',
    endTime: '17:00'
  });

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Ensure HH:MM format
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case 'synced':
        return 'Sincronizado';
      case 'syncing':
        return 'Sincronizando...';
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Desconectado';
    }
  };

  const updateWorkingDay = (dayOfWeek: number, updates: Partial<WorkingDay>) => {
    const newAvailability = {
      ...availability,
      workingDays: availability.workingDays.map(day =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      )
    };
    onUpdate(newAvailability);
  };

  const addTimeSlot = (dayOfWeek: number) => {
    const timeSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime
    };

    const workingDay = availability.workingDays.find(d => d.dayOfWeek === dayOfWeek);
    if (workingDay) {
      const updatedSlots = [...workingDay.timeSlots, timeSlot].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      );
      updateWorkingDay(dayOfWeek, { timeSlots: updatedSlots });
    }
    
    setEditingDay(null);
    setNewTimeSlot({ startTime: '09:00', endTime: '17:00' });
  };

  const removeTimeSlot = (dayOfWeek: number, slotId: string) => {
    const workingDay = availability.workingDays.find(d => d.dayOfWeek === dayOfWeek);
    if (workingDay) {
      const updatedSlots = workingDay.timeSlots.filter(slot => slot.id !== slotId);
      updateWorkingDay(dayOfWeek, { timeSlots: updatedSlots });
    }
  };

  const copyDaySchedule = (fromDay: number, toDay: number) => {
    const sourceDay = availability.workingDays.find(d => d.dayOfWeek === fromDay);
    const targetDay = availability.workingDays.find(d => d.dayOfWeek === toDay);
    
    if (sourceDay && targetDay) {
      const copiedSlots = sourceDay.timeSlots.map(slot => ({
        ...slot,
        id: `slot-${Date.now()}-${Math.random()}`
      }));
      
      updateWorkingDay(toDay, { 
        timeSlots: copiedSlots,
        isActive: sourceDay.isActive
      });
    }
  };

  const updateGeneralSettings = (updates: Partial<AgentAvailabilityData>) => {
    onUpdate({ ...availability, ...updates });
  };

  const renderTimeSlot = (slot: TimeSlot, dayOfWeek: number) => (
    <div
      key={slot.id}
      className={cn(
        "flex items-center justify-between p-2 rounded-md border",
        slot.isBreak 
          ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" 
          : "border-border bg-muted/20"
      )}
    >
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-sm font-mono">
          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
        </span>
        {slot.label && (
          <Badge variant="secondary" className="text-xs">
            {slot.label}
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeTimeSlot(dayOfWeek, slot.id)}
        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );

  const renderWorkingDay = (day: WorkingDay) => {
    const dayInfo = DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek);
    if (!dayInfo) return null;

    return (
      <Card key={day.dayOfWeek} className="imobipro-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={day.isActive}
                onCheckedChange={(checked) => 
                  updateWorkingDay(day.dayOfWeek, { isActive: checked })
                }
              />
              <Label className="font-semibold">{dayInfo.label}</Label>
            </div>
            <div className="flex items-center gap-1">
              {day.timeSlots.length > 0 && (
                <Select
                  onValueChange={(value) => {
                    const targetDay = parseInt(value);
                    copyDaySchedule(day.dayOfWeek, targetDay);
                  }}
                >
                  <SelectTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.filter(d => d.value !== day.dayOfWeek).map(d => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        Copiar para {d.short}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDay(editingDay === day.dayOfWeek ? null : day.dayOfWeek)}
                className="h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {!day.isActive ? (
            <p className="text-sm text-muted-foreground italic">
              Não trabalha neste dia
            </p>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {day.timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário configurado
                  </p>
                ) : (
                  day.timeSlots.map(slot => renderTimeSlot(slot, day.dayOfWeek))
                )}
              </div>
              
              {editingDay === day.dayOfWeek && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="time"
                        value={newTimeSlot.startTime}
                        onChange={(e) => setNewTimeSlot(prev => ({
                          ...prev,
                          startTime: e.target.value
                        }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="time"
                        value={newTimeSlot.endTime}
                        onChange={(e) => setNewTimeSlot(prev => ({
                          ...prev,
                          endTime: e.target.value
                        }))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => addTimeSlot(day.dayOfWeek)}
                      className="flex-1"
                    >
                      Adicionar Horário
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDay(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-imobipro-blue" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Disponibilidade - {availability.agentName}
          </h2>
          <p className="text-muted-foreground">
            Configure horários de trabalho e sincronização de calendário
          </p>
        </div>
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">Horários</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {availability.workingDays
                .sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))
                .map(renderWorkingDay)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="imobipro-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDaily">Máximo de compromissos por dia</Label>
                  <Input
                    id="maxDaily"
                    type="number"
                    min="1"
                    max="20"
                    value={availability.maxDailyAppointments}
                    onChange={(e) => updateGeneralSettings({
                      maxDailyAppointments: parseInt(e.target.value) || 1
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duração padrão (minutos)</Label>
                  <Select
                    value={availability.appointmentDuration.toString()}
                    onValueChange={(value) => updateGeneralSettings({
                      appointmentDuration: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h 30min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="buffer">Intervalo entre compromissos (minutos)</Label>
                  <Select
                    value={availability.bufferTime.toString()}
                    onValueChange={(value) => updateGeneralSettings({
                      bufferTime: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem intervalo</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoAssign"
                    checked={availability.autoAssign}
                    onCheckedChange={(checked) => updateGeneralSettings({
                      autoAssign: checked
                    })}
                  />
                  <Label htmlFor="autoAssign">Atribuição automática de agendamentos</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card className="imobipro-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Sincronização de Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Calendar */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Google Calendar</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getSyncStatusIcon(availability.calendarSync.syncStatus)}
                      <span>{getSyncStatusText(availability.calendarSync.syncStatus)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant={availability.calendarSync.googleEnabled ? "destructive" : "default"}
                  onClick={() => {
                    if (availability.calendarSync.googleEnabled) {
                      updateGeneralSettings({
                        calendarSync: {
                          ...availability.calendarSync,
                          googleEnabled: false,
                          syncStatus: 'disconnected'
                        }
                      });
                    } else {
                      onSyncCalendar('google');
                    }
                  }}
                >
                  {availability.calendarSync.googleEnabled ? 'Desconectar' : 'Conectar'}
                </Button>
              </div>

              {/* Outlook Calendar */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Outlook Calendar</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getSyncStatusIcon('disconnected')}
                      <span>Desconectado</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onSyncCalendar('outlook')}
                >
                  Conectar
                </Button>
              </div>

              {availability.calendarSync.lastSync && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Última sincronização: {availability.calendarSync.lastSync.toLocaleString('pt-BR')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentAvailability;