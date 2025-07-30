// ===================================================================
// DEAL FORM MODAL COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Modal para criação e edição de deals com validação completa,
// seleção de clientes/propriedades e configurações avançadas

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  DollarSign,
  User,
  MapPin,
  Target,
  Calendar as CalendarIcon2,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Deal, DealStage, CreateDealData, DEAL_STAGE_CONFIGS } from '@/types/pipeline';

// ===================================================================
// SCHEMA DE VALIDAÇÃO
// ===================================================================

const dealFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(100, 'Título muito longo'),
  value: z.number().min(1, 'Valor deve ser maior que zero'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  agentId: z.string().optional(),
  propertyId: z.string().optional(),
  expectedCloseDate: z.date().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional(),
  stage: z.nativeEnum(DealStage).optional(),
  probability: z.number().min(0).max(100).optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface DealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDealData) => Promise<void>;
  deal?: Deal | null;
  initialStage?: DealStage | null;
  isLoading?: boolean;
}

// Mock data - Em produção, viria de APIs
const mockClients = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999' },
  { id: '2', name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 88888-8888' },
  { id: '3', name: 'Pedro Costa', email: 'pedro@email.com', phone: '(11) 77777-7777' },
];

const mockProperties = [
  { id: '1', title: 'Apartamento 2 quartos - Vila Madalena', address: 'Vila Madalena, São Paulo' },
  { id: '2', title: 'Casa 3 quartos - Jardins', address: 'Jardins, São Paulo' },
  { id: '3', title: 'Cobertura Duplex - Ipanema', address: 'Ipanema, Rio de Janeiro' },
];

const mockAgents = [
  { id: '1', name: 'Carlos Corretor' },
  { id: '2', name: 'Ana Vendedora' },
  { id: '3', name: 'Bruno Agente' },
];

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function DealFormModal({
  isOpen,
  onClose,
  onSubmit,
  deal,
  initialStage,
  isLoading = false,
}: DealFormModalProps) {
  
  // ===================================================================
  // ESTADO LOCAL
  // ===================================================================
  
  const [clientsOpen, setClientsOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  
  const isEditing = !!deal;
  const selectedStage = deal?.currentStage || initialStage || DealStage.LEAD_IN;
  const stageConfig = DEAL_STAGE_CONFIGS[selectedStage];

  // ===================================================================
  // FORM SETUP
  // ===================================================================
  
  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: '',
      value: 0,
      clientId: '',
      agentId: '',
      propertyId: '',
      stage: selectedStage,
      probability: stageConfig.probability.default,
    },
  });

  const { handleSubmit, reset, watch, setValue, formState: { errors } } = form;
  const watchedStage = watch('stage');

  // ===================================================================
  // EFFECTS
  // ===================================================================
  
  useEffect(() => {
    if (deal) {
      reset({
        title: deal.title,
        value: deal.value,
        clientId: deal.clientId,
        agentId: deal.agentId || '',
        propertyId: deal.propertyId || '',
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : undefined,
        nextAction: deal.nextAction || '',
        nextActionDate: deal.nextActionDate ? new Date(deal.nextActionDate) : undefined,
        stage: deal.currentStage,
        probability: deal.probability,
      });
    } else {
      reset({
        title: '',
        value: 0,
        clientId: '',
        agentId: '',
        propertyId: '',
        stage: selectedStage,
        probability: stageConfig.probability.default,
      });
    }
  }, [deal, reset, selectedStage, stageConfig]);

  // Atualizar probabilidade quando estágio muda
  useEffect(() => {
    if (watchedStage && !deal) {
      const config = DEAL_STAGE_CONFIGS[watchedStage];
      setValue('probability', config.probability.default);
    }
  }, [watchedStage, setValue, deal]);

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  
  const handleFormSubmit = async (data: DealFormData) => {
    try {
      const submitData: CreateDealData = {
        title: data.title,
        value: data.value,
        clientId: data.clientId,
        agentId: data.agentId || undefined,
        propertyId: data.propertyId || undefined,
        expectedCloseDate: data.expectedCloseDate?.toISOString(),
        nextAction: data.nextAction || undefined,
        nextActionDate: data.nextActionDate?.toISOString(),
        stage: data.stage,
        probability: data.probability,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar deal:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  // ===================================================================
  // RENDER HELPERS
  // ===================================================================
  
  const selectedClient = mockClients.find(c => c.id === watch('clientId'));
  const selectedProperty = mockProperties.find(p => p.id === watch('propertyId'));
  const selectedAgent = mockAgents.find(a => a.id === watch('agentId'));

  // ===================================================================
  // RENDER PRINCIPAL
  // ===================================================================
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>{isEditing ? 'Editar Deal' : 'Novo Deal'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do deal' : 'Crie um novo deal no pipeline de vendas'}
            {!isEditing && initialStage && (
              <Badge 
                className="ml-2"
                style={{ 
                  backgroundColor: `${stageConfig.color}20`,
                  color: stageConfig.color 
                }}
              >
                {stageConfig.name}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Informações Básicas
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Título do Deal *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Venda Apartamento 2 quartos - Vila Madalena"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Deal *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probabilidade (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Relacionamentos */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <User className="h-4 w-4 mr-2" />
                Relacionamentos
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Cliente *</FormLabel>
                      <Popover open={clientsOpen} onOpenChange={setClientsOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {selectedClient ? selectedClient.name : "Selecionar cliente"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar cliente..." />
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {mockClients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.id}
                                  onSelect={() => {
                                    field.onChange(client.id);
                                    setClientsOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      client.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <p className="font-medium">{client.name}</p>
                                    <p className="text-xs text-gray-500">{client.email}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Propriedade */}
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Propriedade</FormLabel>
                      <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {selectedProperty ? selectedProperty.title : "Selecionar propriedade"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar propriedade..." />
                            <CommandEmpty>Nenhuma propriedade encontrada.</CommandEmpty>
                            <CommandGroup>
                              {mockProperties.map((property) => (
                                <CommandItem
                                  key={property.id}
                                  value={property.id}
                                  onSelect={() => {
                                    field.onChange(property.id);
                                    setPropertiesOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      property.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <p className="font-medium">{property.title}</p>
                                    <p className="text-xs text-gray-500">{property.address}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Agente */}
                <FormField
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Responsável</FormLabel>
                      <Popover open={agentsOpen} onOpenChange={setAgentsOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {selectedAgent ? selectedAgent.name : "Selecionar agente"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar agente..." />
                            <CommandEmpty>Nenhum agente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {mockAgents.map((agent) => (
                                <CommandItem
                                  key={agent.id}
                                  value={agent.id}
                                  onSelect={() => {
                                    field.onChange(agent.id);
                                    setAgentsOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      agent.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {agent.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Datas e ações */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <CalendarIcon2 className="h-4 w-4 mr-2" />
                Cronograma
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expectedCloseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data prevista de fechamento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                "Selecionar data"
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextActionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da próxima ação</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                "Selecionar data"
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nextAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima ação</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a próxima ação a ser tomada..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resumo selecionado */}
            {(selectedClient || selectedProperty) && (
              <>
                <Separator />
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Resumo do Deal</h4>
                    <div className="space-y-2 text-sm">
                      {selectedClient && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span><strong>Cliente:</strong> {selectedClient.name} - {selectedClient.email}</span>
                        </div>
                      )}
                      {selectedProperty && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span><strong>Propriedade:</strong> {selectedProperty.title}</span>
                        </div>
                      )}
                      {watch('value') > 0 && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watch('value'))}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Deal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}