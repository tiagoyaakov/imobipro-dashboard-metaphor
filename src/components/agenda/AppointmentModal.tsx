import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Building, Trash2, Save, AlertCircle } from 'lucide-react';
import { Appointment, AppointmentType, AppointmentStatus } from '@/types/agenda';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Partial<Appointment>;
  selectedDate?: Date | null;
  onCreate?: (appointment: Partial<Appointment>) => void;
  onUpdate?: (id: string, appointment: Partial<Appointment>) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  selectedDate,
  onCreate,
  onUpdate,
  onDelete,
  isLoading = false
}) => {
  const isEditing = !!appointment?.id;
  
  const [formData, setFormData] = useState<Partial<Appointment>>({
    title: '',
    description: '',
    type: AppointmentType.PROPERTY_VIEWING,
    status: AppointmentStatus.SCHEDULED,
    startTime: new Date(),
    endTime: new Date(),
    agentId: '',
    contactId: '',
    propertyId: '',
    notes: ''
  });

  // Atualizar formData quando appointment ou selectedDate mudar
  useEffect(() => {
    if (appointment) {
      setFormData({
        ...formData,
        ...appointment
      });
    } else if (selectedDate) {
      const startTime = new Date(selectedDate);
      const endTime = new Date(selectedDate);
      endTime.setHours(endTime.getHours() + 1);
      
      setFormData({
        ...formData,
        startTime,
        endTime
      });
    }
  }, [appointment, selectedDate]);

  const handleInputChange = (field: keyof Appointment, value: string | Date | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const [date, time] = value.split('T');
    const [hours, minutes] = time.split(':');
    
    const newDateTime = new Date(date);
    newDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    setFormData(prev => ({
      ...prev,
      [field]: newDateTime
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && appointment?.id) {
      onUpdate?.(appointment.id, formData);
    } else {
      onCreate?.(formData);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (appointment?.id) {
      onDelete?.(appointment.id);
      onClose();
    }
  };

  const formatDateTimeForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
            {isEditing && (
              <Badge variant="secondary" className="text-xs">
                ID: {appointment?.id}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Informações Básicas</h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Visita - Apartamento Centro"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppointmentType.PROPERTY_VIEWING}>Visita</SelectItem>
                    <SelectItem value={AppointmentType.CLIENT_MEETING}>Reunião</SelectItem>
                    <SelectItem value={AppointmentType.NEGOTIATION}>Negociação</SelectItem>
                    <SelectItem value={AppointmentType.FOLLOW_UP}>Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrição detalhada do agendamento..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          {/* Data e Hora */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Data e Hora</h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">Início *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime ? formatDateTimeForInput(formData.startTime) : ''}
                  onChange={(e) => handleDateTimeChange('startTime', e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">Fim *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime ? formatDateTimeForInput(formData.endTime) : ''}
                  onChange={(e) => handleDateTimeChange('endTime', e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AppointmentStatus.SCHEDULED}>Pendente</SelectItem>
                  <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmado</SelectItem>
                  <SelectItem value={AppointmentStatus.CANCELLED}>Cancelado</SelectItem>
                  <SelectItem value={AppointmentStatus.COMPLETED}>Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Participantes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Participantes</h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentId" className="text-sm font-medium">Agente *</Label>
                <Select value={formData.agentId} onValueChange={(value) => handleInputChange('agentId', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione o agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent1">João Silva</SelectItem>
                    <SelectItem value="agent2">Maria Santos</SelectItem>
                    <SelectItem value="agent3">Pedro Costa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactId" className="text-sm font-medium">Cliente *</Label>
                <Select value={formData.contactId} onValueChange={(value) => handleInputChange('contactId', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact1">Carlos Oliveira</SelectItem>
                    <SelectItem value="contact2">Ana Silva</SelectItem>
                    <SelectItem value="contact3">Roberto Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Propriedade */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Propriedade</h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="propertyId" className="text-sm font-medium">Propriedade</Label>
              <Select value={formData.propertyId} onValueChange={(value) => handleInputChange('propertyId', value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione a propriedade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prop1">Apartamento Centro - R$ 500.000</SelectItem>
                  <SelectItem value="prop2">Casa Jardins - R$ 800.000</SelectItem>
                  <SelectItem value="prop3">Cobertura Vila Madalena - R$ 1.200.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Footer */}
          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 order-2 sm:order-1">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-sm"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  {isLoading ? 'Excluindo...' : 'Excluir'}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 order-1 sm:order-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="text-sm"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex items-center gap-2 text-sm" 
                disabled={isLoading}
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal; 