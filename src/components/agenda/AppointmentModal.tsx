import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Building, Trash2, Save } from 'lucide-react';
import { Appointment } from '@/types/agenda';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Partial<Appointment>;
  selectedDate?: Date | null;
  onCreate?: (appointment: Partial<Appointment>) => void;
  onUpdate?: (id: string, appointment: Partial<Appointment>) => void;
  onDelete?: (id: string) => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  selectedDate,
  onCreate,
  onUpdate,
  onDelete
}) => {
  const isEditing = !!appointment?.id;
  
  const [formData, setFormData] = useState<Partial<Appointment>>({
    title: '',
    description: '',
    type: 'visit',
    status: 'pending',
    startTime: new Date(),
    endTime: new Date(),
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    propertyId: '',
    location: '',
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Visita - Apartamento Centro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visit">Visita</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="negotiation">Negociação</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrição detalhada do agendamento..."
                rows={3}
              />
            </div>
          </div>

          {/* Data e Hora */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data e Hora</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Início *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime ? formatDateTimeForInput(formData.startTime) : ''}
                  onChange={(e) => handleDateTimeChange('startTime', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Fim *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime ? formatDateTimeForInput(formData.endTime) : ''}
                  onChange={(e) => handleDateTimeChange('endTime', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Propriedade e Localização */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Propriedade e Localização</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Propriedade</Label>
                <Select value={formData.propertyId} onValueChange={(value) => handleInputChange('propertyId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prop1">Apartamento Centro - R$ 500.000</SelectItem>
                    <SelectItem value="prop2">Casa Jardins - R$ 800.000</SelectItem>
                    <SelectItem value="prop3">Cobertura Vila Madalena - R$ 1.200.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Endereço ou local específico"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal; 