import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Building, Trash2, Save } from 'lucide-react';
import { Appointment, AppointmentStatus, AppointmentType } from '@/types/agenda';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  selectedDate?: Date | null;
  onCreate?: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
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
  const [formData, setFormData] = useState({
    title: '',
    type: AppointmentType.PROPERTY_VIEWING,
    status: AppointmentStatus.SCHEDULED,
    startTime: '',
    endTime: '',
    notes: '',
    agentId: '',
    contactId: '',
    propertyId: ''
  });

  const isEditing = !!appointment;

  useEffect(() => {
    if (appointment) {
      setFormData({
        title: appointment.title,
        type: appointment.type,
        status: appointment.status,
        startTime: appointment.startTime instanceof Date 
          ? appointment.startTime.toISOString().slice(0, 16)
          : new Date(appointment.startTime).toISOString().slice(0, 16),
        endTime: appointment.endTime instanceof Date 
          ? appointment.endTime.toISOString().slice(0, 16)
          : new Date(appointment.endTime).toISOString().slice(0, 16),
        notes: appointment.notes || '',
        agentId: appointment.agentId || '',
        contactId: appointment.contactId || '',
        propertyId: appointment.propertyId || ''
      });
    } else if (selectedDate) {
      const dateStr = selectedDate.toISOString().slice(0, 16);
      setFormData(prev => ({
        ...prev,
        startTime: dateStr,
        endTime: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
      }));
    } else {
      setFormData({
        title: '',
        type: AppointmentType.PROPERTY_VIEWING,
        status: AppointmentStatus.SCHEDULED,
        startTime: '',
        endTime: '',
        notes: '',
        agentId: '',
        contactId: '',
        propertyId: ''
      });
    }
  }, [appointment, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startTime || !formData.endTime) {
      return;
    }

    try {
      const appointmentData = {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        notes: formData.notes,
        agentId: formData.agentId,
        contactId: formData.contactId,
        propertyId: formData.propertyId,
        autoAssigned: false
      };

      if (isEditing && appointment) {
        await onUpdate?.(appointment.id, appointmentData);
      } else {
        await onCreate?.(appointmentData);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    
    try {
      await onDelete?.(appointment.id);
      onClose();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <Calendar className="w-5 h-5" />
            {isEditing ? (
              <>
                Editar Agendamento
                <Badge variant="outline" className="text-xs">
                  ID: {appointment?.id.slice(0, 8)}
                </Badge>
              </>
            ) : (
              'Novo Agendamento'
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Título *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Visita ao apartamento"
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Tipo
                </Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as AppointmentType }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppointmentType.PROPERTY_VIEWING}>Visita</SelectItem>
                    <SelectItem value={AppointmentType.CLIENT_MEETING}>Reunião</SelectItem>
                    <SelectItem value={AppointmentType.NEGOTIATION}>Negociação</SelectItem>
                    <SelectItem value={AppointmentType.DOCUMENT_SIGNING}>Assinatura</SelectItem>
                    <SelectItem value={AppointmentType.FOLLOW_UP}>Follow-up</SelectItem>
                    <SelectItem value={AppointmentType.OTHER}>Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Data e Hora
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Início *
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">
                  Fim *
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Participantes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentId" className="text-sm font-medium">
                  Agente
                </Label>
                <Select value={formData.agentId} onValueChange={(value) => setFormData(prev => ({ ...prev, agentId: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecionar agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent1">João Silva</SelectItem>
                    <SelectItem value="agent2">Maria Santos</SelectItem>
                    <SelectItem value="agent3">Pedro Costa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactId" className="text-sm font-medium">
                  Cliente
                </Label>
                <Select value={formData.contactId} onValueChange={(value) => setFormData(prev => ({ ...prev, contactId: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact1">Ana Oliveira</SelectItem>
                    <SelectItem value="contact2">Carlos Ferreira</SelectItem>
                    <SelectItem value="contact3">Lucia Mendes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyId" className="text-sm font-medium">
                Propriedade
              </Label>
              <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecionar propriedade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property1">Apartamento Centro - R$ 450.000</SelectItem>
                  <SelectItem value="property2">Casa Jardins - R$ 780.000</SelectItem>
                  <SelectItem value="property3">Cobertura Praia - R$ 1.200.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status e Observações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Detalhes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as AppointmentStatus }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppointmentStatus.SCHEDULED}>Agendado</SelectItem>
                    <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmado</SelectItem>
                    <SelectItem value={AppointmentStatus.COMPLETED}>Concluído</SelectItem>
                    <SelectItem value={AppointmentStatus.CANCELLED}>Cancelado</SelectItem>
                    <SelectItem value={AppointmentStatus.NO_SHOW}>Não Compareceu</SelectItem>
                    <SelectItem value={AppointmentStatus.RESCHEDULED}>Reagendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações sobre o agendamento..."
                className="text-sm min-h-[80px]"
                rows={3}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="w-full sm:w-auto text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto text-sm"
            >
              Cancelar
            </Button>
          </div>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.title || !formData.startTime || !formData.endTime}
            className="w-full sm:w-auto text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal; 