// ===================================================================
// PIPELINE AUTOMATIONS COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Sistema de automações baseadas em estágios do pipeline com triggers,
// ações configuráveis e integração com n8n workflows

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Zap,
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  Mail,
  MessageSquare,
  Calendar,
  Phone,
  FileText,
  Webhook,
  AlertCircle,
  CheckCircle,
  Activity,
  Target,
  Users,
  Bot,
} from 'lucide-react';
import { DealStage, DEAL_STAGE_CONFIGS, PipelineAutomation, PipelineAutomationAction } from '@/types/pipeline';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface PipelineAutomationsProps {
  className?: string;
}

interface AutomationCardProps {
  automation: PipelineAutomation;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (automation: PipelineAutomation) => void;
  onDelete: (id: string) => void;
}

// ===================================================================
// DADOS MOCK PARA DEMONSTRAÇÃO
// ===================================================================

const mockAutomations: PipelineAutomation[] = [
  {
    id: '1',
    name: 'Welcome do Lead Inicial',
    description: 'Enviar mensagem de boas-vindas quando deal entra no estágio Lead Inicial',
    trigger: {
      type: 'stage_change',
      stage: DealStage.LEAD_IN,
    },
    actions: [
      {
        type: 'send_whatsapp',
        config: {
          template: 'welcome_lead',
          message: 'Olá! Obrigado pelo seu interesse. Em breve entraremos em contato!',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Follow-up inicial do lead',
          dueDate: '+1 day',
        },
        delay: 60, // 1 hora
      },
    ],
    isActive: true,
  },
  {
    id: '2',
    name: 'Lembrete de Proposta',
    description: 'Lembrar agente sobre proposals sem resposta há 3 dias',
    trigger: {
      type: 'time_based',
      stage: DealStage.PROPOSAL,
      conditions: { daysInStage: 3 },
    },
    actions: [
      {
        type: 'send_email',
        config: {
          to: 'agent',
          subject: 'Proposta sem resposta há 3 dias',
          template: 'proposal_reminder',
        },
      },
      {
        type: 'schedule_reminder',
        config: {
          message: 'Fazer follow-up da proposta',
          dueDate: '+1 day',
        },
      },
    ],
    isActive: true,
  },
  {
    id: '3',
    name: 'Celebração de Fechamento',
    description: 'Ações automáticas quando deal é fechado com sucesso',
    trigger: {
      type: 'stage_change',
      stage: DealStage.WON,
    },
    actions: [
      {
        type: 'send_whatsapp',
        config: {
          template: 'congratulations',
          message: 'Parabéns! Seu negócio foi finalizado com sucesso! 🎉',
        },
      },
      {
        type: 'webhook',
        config: {
          url: 'https://n8n.imobipro.com/webhook/deal-closed',
          method: 'POST',
        },
      },
      {
        type: 'update_field',
        config: {
          field: 'tags',
          value: 'cliente-ativo',
        },
      },
    ],
    isActive: true,
  },
  {
    id: '4',
    name: 'Recovery de Deals Perdidos',
    description: 'Seguir com cliente quando deal é marcado como perdido',
    trigger: {
      type: 'stage_change',
      stage: DealStage.LOST,
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'lost_deal_followup',
          subject: 'Ficamos à disposição para futuras oportunidades',
        },
        delay: 1440, // 24 horas
      },
      {
        type: 'create_task',
        config: {
          title: 'Analisar motivo da perda do deal',
          assignTo: 'agent',
        },
      },
    ],
    isActive: false,
  },
];

// ===================================================================
// COMPONENTES AUXILIARES
// ===================================================================

function AutomationCard({ automation, onToggle, onEdit, onDelete }: AutomationCardProps) {
  const stageConfig = automation.trigger.stage 
    ? DEAL_STAGE_CONFIGS[automation.trigger.stage] 
    : null;

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return Mail;
      case 'send_whatsapp': return MessageSquare;
      case 'create_task': return CheckCircle;
      case 'schedule_reminder': return Clock;
      case 'webhook': return Webhook;
      case 'update_field': return Edit;
      default: return Activity;
    }
  };

  const getTriggerDescription = () => {
    switch (automation.trigger.type) {
      case 'stage_change':
        return `Quando deal muda para ${stageConfig?.name || 'estágio desconhecido'}`;
      case 'time_based':
        return `A cada ${automation.trigger.conditions?.daysInStage || 'X'} dias em ${stageConfig?.name || 'estágio'}`;
      case 'manual':
        return 'Execução manual';
      default:
        return 'Trigger não definido';
    }
  };

  return (
    <Card className={`transition-all duration-200 ${automation.isActive ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-200 bg-gray-50/50 dark:bg-gray-800/50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center space-x-3 mb-2">
              <CardTitle className="text-lg">{automation.name}</CardTitle>
              <Switch
                checked={automation.isActive}
                onCheckedChange={(checked) => onToggle(automation.id, checked)}
              />
            </div>
            <CardDescription className="text-sm">
              {automation.description}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(automation)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(automation.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Trigger */}
          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Trigger</p>
              <p className="text-xs text-gray-500">{getTriggerDescription()}</p>
            </div>
            {stageConfig && (
              <Badge
                style={{ 
                  backgroundColor: `${stageConfig.color}20`,
                  color: stageConfig.color 
                }}
              >
                {stageConfig.name}
              </Badge>
            )}
          </div>
          
          {/* Actions */}
          <div className="space-y-2">
            <p className="font-medium text-sm">Ações ({automation.actions.length})</p>
            <div className="grid grid-cols-1 gap-2">
              {automation.actions.map((action, index) => {
                const Icon = getActionIcon(action.type);
                return (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {action.type.replace('_', ' ')}
                      </p>
                      {action.delay && (
                        <p className="text-xs text-gray-500">
                          Delay: {action.delay} minutos
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AutomationFormModal({ 
  isOpen, 
  onClose, 
  automation, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  automation?: PipelineAutomation; 
  onSave: (automation: PipelineAutomation) => void; 
}) {
  const [formData, setFormData] = useState<Partial<PipelineAutomation>>(
    automation || {
      name: '',
      description: '',
      trigger: { type: 'stage_change' },
      actions: [],
      isActive: true,
    }
  );

  const handleSave = () => {
    if (formData.name && formData.trigger) {
      onSave({
        id: automation?.id || Date.now().toString(),
        name: formData.name,
        description: formData.description || '',
        trigger: formData.trigger,
        actions: formData.actions || [],
        isActive: formData.isActive ?? true,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {automation ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
          <DialogDescription>
            Configure triggers e ações para automatizar seu pipeline
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Automação</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Welcome do Lead Inicial"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que esta automação faz..."
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">Trigger</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Trigger</Label>
                <Select
                  value={formData.trigger?.type || 'stage_change'}
                  onValueChange={(value) => 
                    setFormData({ 
                      ...formData, 
                      trigger: { ...formData.trigger, type: value as any } 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage_change">Mudança de Estágio</SelectItem>
                    <SelectItem value="time_based">Baseado em Tempo</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(formData.trigger?.type === 'stage_change' || formData.trigger?.type === 'time_based') && (
                <div>
                  <Label>Estágio</Label>
                  <Select
                    value={formData.trigger?.stage || ''}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        trigger: { ...formData.trigger, stage: value as DealStage } 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar estágio" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(DealStage).map(stage => (
                        <SelectItem key={stage} value={stage}>
                          {DEAL_STAGE_CONFIGS[stage].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Ações</h4>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ação
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>As ações configuradas serão executadas quando o trigger for ativado.</p>
            </div>
            
            {/* Lista de ações será implementada conforme necessário */}
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
              Nenhuma ação configurada ainda
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {automation ? 'Salvar Alterações' : 'Criar Automação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function PipelineAutomations({ className = '' }: PipelineAutomationsProps) {
  const [automations, setAutomations] = useState<PipelineAutomation[]>(mockAutomations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<PipelineAutomation | undefined>();

  const handleToggleAutomation = (id: string, isActive: boolean) => {
    setAutomations(prev => 
      prev.map(automation => 
        automation.id === id ? { ...automation, isActive } : automation
      )
    );
  };

  const handleEditAutomation = (automation: PipelineAutomation) => {
    setEditingAutomation(automation);
    setIsModalOpen(true);
  };

  const handleDeleteAutomation = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta automação?')) {
      setAutomations(prev => prev.filter(automation => automation.id !== id));
    }
  };

  const handleSaveAutomation = (automation: PipelineAutomation) => {
    if (editingAutomation) {
      setAutomations(prev => 
        prev.map(a => a.id === automation.id ? automation : a)
      );
    } else {
      setAutomations(prev => [...prev, automation]);
    }
    setEditingAutomation(undefined);
  };

  const handleCreateNew = () => {
    setEditingAutomation(undefined);
    setIsModalOpen(true);
  };

  const activeAutomations = automations.filter(a => a.isActive).length;
  const totalAutomations = automations.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Bot className="h-6 w-6 mr-2" />
            Automações do Pipeline
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure automações inteligentes para seu funil de vendas
          </p>
        </div>
        
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold">{totalAutomations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium">Ativas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{activeAutomations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Pause className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium">Inativas</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{totalAutomations - activeAutomations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium">Execuções Hoje</span>
            </div>
            <p className="text-2xl font-bold">47</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Automações */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Automações Configuradas</h3>
        
        {automations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma automação configurada</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Crie sua primeira automação para otimizar seu pipeline de vendas
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Automação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {automations.map(automation => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onToggle={handleToggleAutomation}
                onEdit={handleEditAutomation}
                onDelete={handleDeleteAutomation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Templates de Automação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Templates de Automação
          </CardTitle>
          <CardDescription>
            Templates pré-configurados para começar rapidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="welcome">
              <AccordionTrigger>Welcome Sequence para Novos Leads</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Sequência automática de boas-vindas para leads que entram no pipeline
                  </p>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Mensagem WhatsApp imediata</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Follow-up em 1 hora</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Criar task de qualificação</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Usar Template
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="nurturing">
              <AccordionTrigger>Nurturing de Prospects</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Sequência de nutrição para prospects qualificados
                  </p>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Email educativo semanal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Lembrete de ligação quinzenal</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Usar Template
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="closing">
              <AccordionTrigger>Aceleração de Fechamento</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Automações para acelerar fechamento de negócios
                  </p>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Alerta para propostas sem resposta</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Agendamento automático de reuniões</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Usar Template
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <AutomationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        automation={editingAutomation}
        onSave={handleSaveAutomation}
      />
    </div>
  );
}