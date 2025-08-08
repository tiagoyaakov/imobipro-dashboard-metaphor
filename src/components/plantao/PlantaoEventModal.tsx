// Modal para criar/editar eventos de plantão
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, Loader2 } from "lucide-react";
import { PlantaoEvent, PlantaoEventFormData, PlantaoUser } from "@/types/plantao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Schema de validação
const eventFormSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  startDateTime: z.string().min(1, "Data e hora inicial são obrigatórias"),
  endDateTime: z.string().min(1, "Data e hora final são obrigatórias"),
  corretorId: z.string().optional(),
  location: z.string().optional(),
  attendees: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  return end > start;
}, {
  message: "A data/hora final deve ser posterior à inicial",
  path: ["endDateTime"],
});

interface PlantaoEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlantaoEventFormData) => Promise<void>;
  event?: PlantaoEvent | null;
  corretores: PlantaoUser[];
  isAdmin: boolean;
  currentUserId: string;
  initialDate?: Date;
}

export function PlantaoEventModal({
  isOpen,
  onClose,
  onSubmit,
  event,
  corretores,
  isAdmin,
  currentUserId,
  initialDate,
}: PlantaoEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PlantaoEventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      corretorId: currentUserId,
      location: "",
      attendees: "",
    },
  });

  // Preencher formulário quando editar evento
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        startDateTime: format(new Date(event.startDateTime), "yyyy-MM-dd'T'HH:mm"),
        endDateTime: format(new Date(event.endDateTime), "yyyy-MM-dd'T'HH:mm"),
        corretorId: event.corretorId,
        location: event.location || "",
        attendees: event.attendees?.join(", ") || "",
      });
    } else if (initialDate) {
      // Se tiver data inicial (clique no calendário), preencher
      const start = new Date(initialDate);
      start.setHours(9, 0, 0, 0);
      const end = new Date(initialDate);
      end.setHours(10, 0, 0, 0);
      
      form.reset({
        title: "",
        description: "",
        startDateTime: format(start, "yyyy-MM-dd'T'HH:mm"),
        endDateTime: format(end, "yyyy-MM-dd'T'HH:mm"),
        corretorId: currentUserId,
        location: "",
        attendees: "",
      });
    }
  }, [event, form, currentUserId, initialDate]);

  const handleSubmit = async (data: PlantaoEventFormData) => {
    try {
      setIsSubmitting(true);
      
      // Processar attendees (converter string para array)
      const processedData: PlantaoEventFormData = {
        ...data,
        attendees: data.attendees 
          ? data.attendees.split(",").map(email => email.trim()).filter(Boolean)
          : undefined,
      };

      await onSubmit(processedData);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            {event ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {event 
              ? "Atualize as informações do evento de plantão"
              : "Preencha as informações para criar um novo evento de plantão"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Título do Evento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Visita ao imóvel - Apt. Centro" 
                      className="h-9"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Corretor (apenas para admin) */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="corretorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Corretor Responsável</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecione o corretor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {corretores
                          .filter(c => c.role === "AGENT")
                          .map((corretor) => (
                            <SelectItem key={corretor.id} value={corretor.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2.5 h-2.5 rounded-full" 
                                  style={{ backgroundColor: corretor.color }}
                                />
                                {corretor.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Data/Hora Início e Fim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      Início
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        className="h-9"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      Término
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        className="h-9"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Localização */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    Localização
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Rua das Flores, 123 - Centro" 
                      className="h-9"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Participantes */}
            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Participantes
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Emails separados por vírgula" 
                      className="h-9"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Adicione os emails dos participantes, separados por vírgula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione detalhes sobre o evento..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-9"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {event ? "Atualizar" : "Criar"} Evento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent
    </Dialog>
  );
}