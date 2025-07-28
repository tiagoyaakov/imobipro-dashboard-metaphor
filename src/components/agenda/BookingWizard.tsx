import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Home,
  Users,
  PhoneCall,
  Eye,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BookingData {
  // Cliente
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  
  // Agendamento
  appointmentType: 'visit' | 'meeting' | 'call' | 'inspection';
  title: string;
  description?: string;
  duration: number; // minutes
  
  // Data e hora
  selectedDate: Date;
  selectedTime: string;
  
  // Localização
  location?: string;
  propertyId?: string;
  propertyAddress?: string;
  
  // Corretor
  agentId?: string;
  autoAssign: boolean;
}

export interface TimeSlotOption {
  time: string;
  available: boolean;
  agentId?: string;
  agentName?: string;
  conflictReason?: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  specialties?: string[];
  isAvailable: boolean;
}

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (booking: BookingData) => void;
  preselectedDate?: Date;
  preselectedProperty?: { id: string; address: string };
  availableAgents: Agent[];
  getAvailableSlots: (date: Date, agentId?: string) => TimeSlotOption[];
  className?: string;
}

type WizardStep = 'type' | 'datetime' | 'agent' | 'client' | 'details' | 'confirmation';

const APPOINTMENT_TYPES = [
  {
    value: 'visit' as const,
    label: 'Visita ao Imóvel',
    description: 'Visita presencial para conhecer o imóvel',
    icon: Home,
    duration: 60,
    color: 'bg-imobipro-blue'
  },
  {
    value: 'meeting' as const,
    label: 'Reunião',
    description: 'Reunião para negociação ou apresentação',
    icon: Users,
    duration: 45,
    color: 'bg-green-500'
  },
  {
    value: 'call' as const,
    label: 'Ligação',
    description: 'Conversa por telefone ou videoconferência',
    icon: PhoneCall,
    duration: 30,
    color: 'bg-orange-500'
  },
  {
    value: 'inspection' as const,
    label: 'Vistoria',
    description: 'Inspeção técnica detalhada do imóvel',
    icon: Eye,
    duration: 90,
    color: 'bg-purple-500'
  }
];

const BookingWizard: React.FC<BookingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  preselectedDate,
  preselectedProperty,
  availableAgents,
  getAvailableSlots,
  className
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [bookingData, setBookingData] = useState<BookingData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    appointmentType: 'visit',
    title: '',
    description: '',
    duration: 60,
    selectedDate: preselectedDate || new Date(),
    selectedTime: '',
    location: preselectedProperty?.address || '',
    propertyId: preselectedProperty?.id,
    propertyAddress: preselectedProperty?.address,
    autoAssign: true
  });
  
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const steps: { id: WizardStep; title: string; description: string }[] = [
    { id: 'type', title: 'Tipo', description: 'Selecione o tipo de agendamento' },
    { id: 'datetime', title: 'Data/Hora', description: 'Escolha data e horário' },
    { id: 'agent', title: 'Corretor', description: 'Selecione o corretor' },
    { id: 'client', title: 'Cliente', description: 'Dados do cliente' },
    { id: 'details', title: 'Detalhes', description: 'Informações adicionais' },
    { id: 'confirmation', title: 'Confirmação', description: 'Revisar agendamento' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Obter slots disponíveis para a data selecionada
  const availableSlots = useMemo(() => {
    if (!bookingData.selectedDate) return [];
    return getAvailableSlots(bookingData.selectedDate, selectedAgent?.id);
  }, [bookingData.selectedDate, selectedAgent?.id, getAvailableSlots]);

  // Detectar conflitos
  const detectConflicts = (data: BookingData) => {
    const conflicts: string[] = [];
    
    // Verificar se o horário está disponível
    const selectedSlot = availableSlots.find(slot => slot.time === data.selectedTime);
    if (selectedSlot && !selectedSlot.available) {
      conflicts.push(selectedSlot.conflictReason || 'Horário não disponível');
    }
    
    // Verificar se é um horário comercial
    const [hours] = data.selectedTime.split(':').map(Number);
    if (hours < 8 || hours > 18) {
      conflicts.push('Horário fora do expediente comercial');
    }
    
    // Verificar se é fim de semana para tipos específicos
    const dayOfWeek = data.selectedDate.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && data.appointmentType === 'meeting') {
      conflicts.push('Reuniões não são recomendadas aos finais de semana');
    }
    
    setConflicts(conflicts);
    return conflicts;
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    const newData = { ...bookingData, ...updates };
    setBookingData(newData);
    
    // Detectar conflitos se data/hora foram alteradas
    if (updates.selectedDate || updates.selectedTime) {
      detectConflicts(newData);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStepId = steps[currentStepIndex + 1].id;
      setCurrentStep(nextStepId);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevStepId = steps[currentStepIndex - 1].id;
      setCurrentStep(prevStepId);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'type':
        return bookingData.appointmentType && bookingData.duration > 0;
      case 'datetime':
        return bookingData.selectedDate && bookingData.selectedTime;
      case 'agent':
        return bookingData.autoAssign || selectedAgent;
      case 'client':
        return bookingData.clientName && bookingData.clientPhone;
      case 'details':
        return bookingData.title;
      default:
        return true;
    }
  };

  const handleComplete = () => {
    const finalData = {
      ...bookingData,
      agentId: selectedAgent?.id
    };
    onComplete(finalData);
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
              index <= currentStepIndex
                ? "bg-imobipro-blue text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-2",
                index < currentStepIndex ? "bg-imobipro-blue" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Que tipo de agendamento você precisa?</h3>
        <p className="text-muted-foreground">Selecione a opção que melhor se adequa</p>
      </div>
      
      <RadioGroup
        value={bookingData.appointmentType}
        onValueChange={(value) => {
          const selectedType = APPOINTMENT_TYPES.find(type => type.value === value);
          updateBookingData({
            appointmentType: value as BookingData['appointmentType'],
            duration: selectedType?.duration || 60
          });
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {APPOINTMENT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Label
              key={type.value}
              htmlFor={type.value}
              className={cn(
                "cursor-pointer p-4 border-2 rounded-lg transition-all",
                "hover:border-imobipro-blue hover:bg-imobipro-blue/5",
                bookingData.appointmentType === type.value
                  ? "border-imobipro-blue bg-imobipro-blue/10"
                  : "border-border"
              )}
            >
              <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", type.color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{type.label}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {type.duration} min
                  </Badge>
                </div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );

  const renderDateTimeSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Selecione a Data</h3>
        <Calendar
          mode="single"
          selected={bookingData.selectedDate}
          onSelect={(date) => date && updateBookingData({ selectedDate: date, selectedTime: '' })}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Horários Disponíveis</h3>
        {availableSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum horário disponível para esta data</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={bookingData.selectedTime === slot.time ? "default" : "outline"}
                  size="sm"
                  disabled={!slot.available}
                  onClick={() => updateBookingData({ selectedTime: slot.time })}
                  className={cn(
                    "justify-start",
                    !slot.available && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {slot.time}
                  {slot.agentName && (
                    <span className="ml-1 text-xs opacity-70">
                      ({slot.agentName})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {conflicts.length > 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <div key={index}>• {conflict}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );

  const renderAgentSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Escolha do Corretor</h3>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoAssign"
            checked={bookingData.autoAssign}
            onChange={(e) => updateBookingData({ autoAssign: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="autoAssign" className="text-sm">
            Atribuição automática
          </Label>
        </div>
      </div>
      
      {!bookingData.autoAssign && (
        <div className="grid gap-3">
          {availableAgents.map((agent) => (
            <Card
              key={agent.id}
              className={cn(
                "cursor-pointer transition-all imobipro-card",
                selectedAgent?.id === agent.id
                  ? "border-imobipro-blue bg-imobipro-blue/5"
                  : "hover:bg-muted/20"
              )}
              onClick={() => setSelectedAgent(agent)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-imobipro-blue rounded-full flex items-center justify-center text-white font-semibold">
                    {agent.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{agent.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge
                        variant={agent.isAvailable ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {agent.isAvailable ? 'Disponível' : 'Ocupado'}
                      </Badge>
                      {agent.rating && (
                        <span>⭐ {agent.rating}/5</span>
                      )}
                    </div>
                    {agent.specialties && agent.specialties.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {agent.specialties.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <CheckCircle2 className="w-5 h-5 text-imobipro-blue" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {bookingData.autoAssign && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            O corretor mais adequado será atribuído automaticamente baseado na disponibilidade e especialidade.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderClientForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Dados do Cliente</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName">Nome Completo *</Label>
          <Input
            id="clientName"
            value={bookingData.clientName}
            onChange={(e) => updateBookingData({ clientName: e.target.value })}
            placeholder="Digite o nome do cliente"
          />
        </div>
        
        <div>
          <Label htmlFor="clientPhone">Telefone *</Label>
          <Input
            id="clientPhone"
            value={bookingData.clientPhone}
            onChange={(e) => updateBookingData({ clientPhone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="clientEmail">E-mail</Label>
          <Input
            id="clientEmail"
            type="email"
            value={bookingData.clientEmail || ''}
            onChange={(e) => updateBookingData({ clientEmail: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Detalhes do Agendamento</h3>
      
      <div>
        <Label htmlFor="title">Título do Agendamento *</Label>
        <Input
          id="title"
          value={bookingData.title}
          onChange={(e) => updateBookingData({ title: e.target.value })}
          placeholder="Ex: Visita - Apartamento 3 quartos Centro"
        />
      </div>
      
      <div>
        <Label htmlFor="location">Localização</Label>
        <Input
          id="location"
          value={bookingData.location || ''}
          onChange={(e) => updateBookingData({ location: e.target.value })}
          placeholder="Endereço ou localização"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Observações</Label>
        <Textarea
          id="description"
          value={bookingData.description || ''}
          onChange={(e) => updateBookingData({ description: e.target.value })}
          placeholder="Informações adicionais sobre o agendamento"
          rows={3}
        />
      </div>
    </div>
  );

  const renderConfirmation = () => {
    const appointmentType = APPOINTMENT_TYPES.find(type => type.value === bookingData.appointmentType);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Confirmar Agendamento</h3>
          <p className="text-muted-foreground">Revise os dados antes de finalizar</p>
        </div>
        
        <Card className="imobipro-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">TIPO</Label>
                <div className="flex items-center gap-2 mt-1">
                  {appointmentType && (
                    <>
                      <div className={cn("p-1 rounded", appointmentType.color)}>
                        <appointmentType.icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold">{appointmentType.label}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">DURAÇÃO</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{bookingData.duration} minutos</span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">DATA</Label>
                <div className="flex items-center gap-1 mt-1">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {bookingData.selectedDate.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">HORÁRIO</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{bookingData.selectedTime}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">CLIENTE</Label>
                <div className="flex items-center gap-1 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{bookingData.clientName}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{bookingData.clientPhone}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">CORRETOR</Label>
                <div className="flex items-center gap-1 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {selectedAgent ? selectedAgent.name : 'Atribuição automática'}
                  </span>
                </div>
              </div>
            </div>
            
            {bookingData.location && (
              <div>
                <Label className="text-xs text-muted-foreground">LOCALIZAÇÃO</Label>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{bookingData.location}</span>
                </div>
              </div>
            )}
            
            {bookingData.description && (
              <div>
                <Label className="text-xs text-muted-foreground">OBSERVAÇÕES</Label>
                <p className="text-sm mt-1">{bookingData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Atenção aos conflitos:</strong>
                {conflicts.map((conflict, index) => (
                  <div key={index}>• {conflict}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'type':
        return renderTypeSelection();
      case 'datetime':
        return renderDateTimeSelection();
      case 'agent':
        return renderAgentSelection();
      case 'client':
        return renderClientForm();
      case 'details':
        return renderDetailsForm();
      case 'confirmation':
        return renderConfirmation();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-hidden", className)}>
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {renderStepIndicator()}
          
          <ScrollArea className="flex-1 px-1">
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>
          </ScrollArea>
          
          <Separator className="my-4" />
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                
                {currentStep === 'confirmation' ? (
                  <Button
                    onClick={handleComplete}
                    className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
                    disabled={conflicts.length > 0}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Confirmar Agendamento
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingWizard;