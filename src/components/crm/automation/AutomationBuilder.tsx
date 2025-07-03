import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Separator } from '../../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Switch } from '../../ui/switch';
import { useToast } from '../../ui/use-toast';
import { 
  Plus, 
  Zap, 
  Mail, 
  Clock, 
  Target, 
  Settings,
  Play,
  Pause,
  Copy,
  Trash2,
  ArrowDown,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Filter,
  Tag,
  X
} from 'lucide-react';

interface AutomationTrigger {
  id: string;
  type: 'contact_created' | 'lead_score_changed' | 'segment_entered' | 'email_opened' | 'link_clicked' | 'form_submitted';
  name: string;
  conditions: Record<string, any>;
}

interface AutomationAction {
  id: string;
  type: 'send_email' | 'add_tag' | 'update_score' | 'move_stage' | 'wait' | 'create_task';
  name: string;
  config: Record<string, any>;
  delay?: number; // em minutos
}

interface AutomationFlow {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive: boolean;
  stats: {
    triggered: number;
    completed: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AutomationBuilderProps {
  className?: string;
}

export function AutomationBuilder({ className }: AutomationBuilderProps) {
  const [automations, setAutomations] = useState<AutomationFlow[]>([
    {
      id: '1',
      name: 'Boas-vindas para Novos Leads',
      description: 'Sequência de emails de boas-vindas para novos leads',
      trigger: {
        id: 't1',
        type: 'contact_created',
        name: 'Contato Criado',
        conditions: { category: 'LEAD' }
      },
      actions: [
        {
          id: 'a1',
          type: 'send_email',
          name: 'Enviar Email de Boas-vindas',
          config: { template: 'welcome-email', subject: 'Bem-vindo ao ImobiPRO!' },
          delay: 0
        },
        {
          id: 'a2',
          type: 'wait',
          name: 'Aguardar 2 dias',
          config: {},
          delay: 2880 // 2 dias em minutos
        },
        {
          id: 'a3',
          type: 'send_email',
          name: 'Enviar Conteúdo Educativo',
          config: { template: 'educational-content', subject: 'Dicas para Investir em Imóveis' },
          delay: 0
        }
      ],
      isActive: true,
      stats: {
        triggered: 45,
        completed: 38,
        conversionRate: 84
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Re-engajamento de Leads Frios',
      description: 'Ativação de leads com baixo score',
      trigger: {
        id: 't2',
        type: 'lead_score_changed',
        name: 'Score Baixo',
        conditions: { score: { lte: 30 } }
      },
      actions: [
        {
          id: 'a4',
          type: 'add_tag',
          name: 'Adicionar Tag "Needs Attention"',
          config: { tag: 'needs-attention' },
          delay: 0
        },
        {
          id: 'a5',
          type: 'create_task',
          name: 'Criar Tarefa de Follow-up',
          config: { title: 'Follow-up com lead frio', priority: 'high' },
          delay: 0
        }
      ],
      isActive: false,
      stats: {
        triggered: 12,
        completed: 8,
        conversionRate: 67
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationFlow | null>(null);
  const [newAutomation, setNewAutomation] = useState<Partial<AutomationFlow>>({
    name: '',
    description: '',
    trigger: undefined,
    actions: [],
    isActive: true
  });
  const [selectedTrigger, setSelectedTrigger] = useState<Partial<AutomationTrigger>>({});
  const [selectedAction, setSelectedAction] = useState<Partial<AutomationAction>>({});
  
  const { toast } = useToast();
  
  // Opções de triggers
  const triggerOptions = [
    { value: 'contact_created', label: 'Contato Criado', icon: Users },
    { value: 'lead_score_changed', label: 'Score Alterado', icon: TrendingUp },
    { value: 'segment_entered', label: 'Entrou no Segmento', icon: Filter },
    { value: 'email_opened', label: 'Email Aberto', icon: Mail },
    { value: 'link_clicked', label: 'Link Clicado', icon: Target },
    { value: 'form_submitted', label: 'Formulário Enviado', icon: CheckCircle }
  ];
  
  // Opções de ações
  const actionOptions = [
    { value: 'send_email', label: 'Enviar Email', icon: Mail },
    { value: 'add_tag', label: 'Adicionar Tag', icon: Tag },
    { value: 'update_score', label: 'Atualizar Score', icon: TrendingUp },
    { value: 'move_stage', label: 'Mover Estágio', icon: ArrowRight },
    { value: 'wait', label: 'Aguardar', icon: Clock },
    { value: 'create_task', label: 'Criar Tarefa', icon: CheckCircle }
  ];
  
  // Adicionar trigger
  const addTrigger = () => {
    if (!selectedTrigger.type || !selectedTrigger.name) {
      toast({
        title: "Erro de Validação",
        description: "Selecione um tipo de trigger",
        variant: "destructive"
      });
      return;
    }
    
    const trigger: AutomationTrigger = {
      id: `t${Date.now()}`,
      type: selectedTrigger.type as any,
      name: selectedTrigger.name,
      conditions: selectedTrigger.conditions || {}
    };
    
    setNewAutomation(prev => ({ ...prev, trigger }));
    setSelectedTrigger({});
  };
  
  // Adicionar ação
  const addAction = () => {
    if (!selectedAction.type || !selectedAction.name) {
      toast({
        title: "Erro de Validação",
        description: "Preencha os campos da ação",
        variant: "destructive"
      });
      return;
    }
    
    const action: AutomationAction = {
      id: `a${Date.now()}`,
      type: selectedAction.type as any,
      name: selectedAction.name,
      config: selectedAction.config || {},
      delay: selectedAction.delay || 0
    };
    
    setNewAutomation(prev => ({
      ...prev,
      actions: [...(prev.actions || []), action]
    }));
    
    setSelectedAction({});
  };
  
  // Remover ação
  const removeAction = (actionId: string) => {
    setNewAutomation(prev => ({
      ...prev,
      actions: prev.actions?.filter(a => a.id !== actionId) || []
    }));
  };
  
  // Salvar automação
  const saveAutomation = () => {
    if (!newAutomation.name || !newAutomation.trigger || !newAutomation.actions?.length) {
      toast({
        title: "Erro de Validação",
        description: "Nome, trigger e pelo menos uma ação são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    const automation: AutomationFlow = {
      id: editingAutomation?.id || `auto${Date.now()}`,
      name: newAutomation.name,
      description: newAutomation.description || '',
      trigger: newAutomation.trigger,
      actions: newAutomation.actions,
      isActive: newAutomation.isActive || true,
      stats: editingAutomation?.stats || {
        triggered: 0,
        completed: 0,
        conversionRate: 0
      },
      createdAt: editingAutomation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (editingAutomation) {
      setAutomations(prev => prev.map(a => a.id === editingAutomation.id ? automation : a));
      toast({
        title: "Automação Atualizada",
        description: `Automação "${automation.name}" foi atualizada`,
      });
    } else {
      setAutomations(prev => [...prev, automation]);
      toast({
        title: "Automação Criada",
        description: `Automação "${automation.name}" foi criada`,
      });
    }
    
    resetForm();
  };
  
  // Resetar formulário
  const resetForm = () => {
    setNewAutomation({
      name: '',
      description: '',
      trigger: undefined,
      actions: [],
      isActive: true
    });
    setSelectedTrigger({});
    setSelectedAction({});
    setIsCreating(false);
    setEditingAutomation(null);
  };
  
  // Editar automação
  const editAutomation = (automation: AutomationFlow) => {
    setEditingAutomation(automation);
    setNewAutomation({
      name: automation.name,
      description: automation.description,
      trigger: automation.trigger,
      actions: automation.actions,
      isActive: automation.isActive
    });
    setIsCreating(true);
  };
  
  // Duplicar automação
  const duplicateAutomation = (automation: AutomationFlow) => {
    const duplicate: AutomationFlow = {
      ...automation,
      id: `auto${Date.now()}`,
      name: `${automation.name} (Cópia)`,
      stats: { triggered: 0, completed: 0, conversionRate: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setAutomations(prev => [...prev, duplicate]);
    toast({
      title: "Automação Duplicada",
      description: `Automação "${duplicate.name}" foi criada`,
    });
  };
  
  // Excluir automação
  const deleteAutomation = (automationId: string) => {
    setAutomations(prev => prev.filter(a => a.id !== automationId));
    toast({
      title: "Automação Excluída",
      description: "Automação foi excluída com sucesso",
    });
  };
  
  // Ativar/desativar automação
  const toggleAutomationStatus = (automationId: string) => {
    setAutomations(prev => prev.map(a => 
      a.id === automationId 
        ? { ...a, isActive: !a.isActive, updatedAt: new Date().toISOString() }
        : a
    ));
  };
  
  // Obter ícone do trigger/ação
  const getIcon = (type: string, options: any[]) => {
    const option = options.find(o => o.value === type);
    return option ? option.icon : Zap;
  };
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Marketing Automation</h2>
          <p className="text-muted-foreground">
            Automatize suas ações de marketing e nutrição de leads
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAutomation ? 'Editar Automação' : 'Criar Nova Automação'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Automação</Label>
                  <Input
                    id="name"
                    value={newAutomation.name}
                    onChange={(e) => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Sequência de Boas-vindas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newAutomation.description}
                    onChange={(e) => setNewAutomation(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo desta automação"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newAutomation.isActive}
                    onCheckedChange={(checked) => setNewAutomation(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Ativar automação após criação</Label>
                </div>
              </div>
              
              <Separator />
              
              {/* Trigger */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trigger (Gatilho)</h3>
                
                {newAutomation.trigger ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComponent = getIcon(newAutomation.trigger.type, triggerOptions);
                            return <IconComponent className="w-5 h-5" />;
                          })()}
                          <div>
                            <p className="font-medium">{newAutomation.trigger.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {triggerOptions.find(t => t.value === newAutomation.trigger?.type)?.label}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewAutomation(prev => ({ ...prev, trigger: undefined }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label>Tipo de Trigger</Label>
                      <Select 
                        value={selectedTrigger.type} 
                        onValueChange={(value) => setSelectedTrigger(prev => ({ 
                          ...prev, 
                          type: value,
                          name: triggerOptions.find(t => t.value === value)?.label || ''
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerOptions.map(trigger => (
                            <SelectItem key={trigger.value} value={trigger.value}>
                              <div className="flex items-center gap-2">
                                <trigger.icon className="w-4 h-4" />
                                {trigger.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Nome do Trigger</Label>
                      <Input
                        value={selectedTrigger.name}
                        onChange={(e) => setSelectedTrigger(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome personalizado"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        onClick={addTrigger}
                        className="w-full"
                        disabled={!selectedTrigger.type}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Trigger
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Ações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ações</h3>
                
                {/* Ações Existentes */}
                {newAutomation.actions && newAutomation.actions.length > 0 && (
                  <div className="space-y-2">
                    {newAutomation.actions.map((action, index) => (
                      <Card key={action.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                {index + 1}
                              </Badge>
                              {(() => {
                                const IconComponent = getIcon(action.type, actionOptions);
                                return <IconComponent className="w-5 h-5" />;
                              })()}
                              <div>
                                <p className="font-medium">{action.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {actionOptions.find(a => a.value === action.type)?.label}
                                  {action.delay && action.delay > 0 && (
                                    <span className="ml-2">
                                      • Delay: {action.delay < 60 ? `${action.delay}min` : `${Math.round(action.delay / 60)}h`}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAction(action.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Nova Ação */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label>Tipo de Ação</Label>
                    <Select 
                      value={selectedAction.type} 
                      onValueChange={(value) => setSelectedAction(prev => ({ 
                        ...prev, 
                        type: value,
                        name: actionOptions.find(a => a.value === value)?.label || ''
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a ação" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionOptions.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            <div className="flex items-center gap-2">
                              <action.icon className="w-4 h-4" />
                              {action.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome da Ação</Label>
                    <Input
                      value={selectedAction.name}
                      onChange={(e) => setSelectedAction(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome personalizado"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Delay (minutos)</Label>
                    <Input
                      type="number"
                      value={selectedAction.delay || 0}
                      onChange={(e) => setSelectedAction(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={addAction}
                      className="w-full"
                      disabled={!selectedAction.type}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Ação
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Ações */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={saveAutomation}>
                  {editingAutomation ? 'Atualizar' : 'Criar'} Automação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Lista de Automações */}
      <div className="grid gap-4">
        {automations.map(automation => (
          <Card key={automation.id} className={!automation.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <CardTitle className="text-lg">{automation.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                      {automation.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Badge variant="outline">
                      {automation.stats.conversionRate}% conversão
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAutomationStatus(automation.id)}
                  >
                    {automation.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editAutomation(automation)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateAutomation(automation)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAutomation(automation.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {automation.description && (
                <p className="text-sm text-muted-foreground">{automation.description}</p>
              )}
              
              {/* Fluxo Visual */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Fluxo de Automação:</h4>
                <div className="flex flex-col gap-2">
                  {/* Trigger */}
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    {(() => {
                      const IconComponent = getIcon(automation.trigger.type, triggerOptions);
                      return <IconComponent className="w-4 h-4 text-green-600" />;
                    })()}
                    <span className="text-sm font-medium text-green-800">
                      {automation.trigger.name}
                    </span>
                  </div>
                  
                  {/* Ações */}
                  {automation.actions.map((action, index) => (
                    <div key={action.id} className="flex items-center gap-2">
                      <ArrowDown className="w-4 h-4 text-muted-foreground ml-2" />
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex-1">
                        <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        {(() => {
                          const IconComponent = getIcon(action.type, actionOptions);
                          return <IconComponent className="w-4 h-4 text-blue-600" />;
                        })()}
                        <span className="text-sm font-medium text-blue-800">
                          {action.name}
                        </span>
                        {action.delay && action.delay > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {action.delay < 60 ? `${action.delay}min` : `${Math.round(action.delay / 60)}h`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold">{automation.stats.triggered}</p>
                  <p className="text-sm text-muted-foreground">Acionadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{automation.stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{automation.stats.conversionRate}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Criada em: {new Date(automation.createdAt).toLocaleDateString('pt-BR')}</span>
                <span>Atualizada em: {new Date(automation.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {automations.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira automação para engajar seus leads automaticamente
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Automação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}