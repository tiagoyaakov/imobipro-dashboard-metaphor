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
import { useToast } from '../../ui/use-toast';
import { 
  Plus, 
  Filter, 
  X, 
  Users, 
  Target, 
  Check,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Copy,
  Trash2
} from 'lucide-react';
import { ContactStatus, ContactCategory } from '../../../schemas/crm';
import { useContacts } from '../../../hooks/useCRMData';

interface SegmentRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  label: string;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  operator: 'AND' | 'OR';
  isActive: boolean;
  matchCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SegmentationRulesProps {
  className?: string;
}

export function SegmentationRules({ className }: SegmentationRulesProps) {
  const [segments, setSegments] = useState<Segment[]>([
    {
      id: '1',
      name: 'Hot Leads',
      description: 'Leads com alta pontuação e engajamento',
      rules: [
        { id: 'r1', field: 'leadScore', operator: 'gte', value: '80', label: 'Score >= 80' },
        { id: 'r2', field: 'category', operator: 'eq', value: 'LEAD', label: 'Categoria = Lead' }
      ],
      operator: 'AND',
      isActive: true,
      matchCount: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Clientes Inativos',
      description: 'Clientes sem atividade recente',
      rules: [
        { id: 'r3', field: 'category', operator: 'eq', value: 'CLIENT', label: 'Categoria = Cliente' },
        { id: 'r4', field: 'status', operator: 'eq', value: 'INACTIVE', label: 'Status = Inativo' }
      ],
      operator: 'AND',
      isActive: false,
      matchCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [newSegment, setNewSegment] = useState<Partial<Segment>>({
    name: '',
    description: '',
    rules: [],
    operator: 'AND',
    isActive: true
  });
  const [newRule, setNewRule] = useState<Partial<SegmentRule>>({
    field: '',
    operator: '',
    value: '',
    label: ''
  });
  
  const { toast } = useToast();
  const { getContacts } = useContacts();
  const { data: contactsData } = getContacts();
  
  // Opções para campos
  const fieldOptions = [
    { value: 'category', label: 'Categoria' },
    { value: 'status', label: 'Status' },
    { value: 'leadScore', label: 'Score do Lead' },
    { value: 'company', label: 'Empresa' },
    { value: 'position', label: 'Cargo' },
    { value: 'createdAt', label: 'Data de Criação' },
  ];
  
  // Opções para operadores
  const operatorOptions = [
    { value: 'eq', label: 'Igual a' },
    { value: 'ne', label: 'Diferente de' },
    { value: 'gt', label: 'Maior que' },
    { value: 'gte', label: 'Maior ou igual a' },
    { value: 'lt', label: 'Menor que' },
    { value: 'lte', label: 'Menor ou igual a' },
    { value: 'contains', label: 'Contém' },
    { value: 'starts', label: 'Começa com' },
    { value: 'ends', label: 'Termina com' },
  ];
  
  // Adicionar nova regra
  const addRule = () => {
    if (!newRule.field || !newRule.operator || !newRule.value) {
      toast({
        title: "Erro de Validação",
        description: "Preencha todos os campos da regra",
        variant: "destructive"
      });
      return;
    }
    
    const fieldLabel = fieldOptions.find(f => f.value === newRule.field)?.label || newRule.field;
    const operatorLabel = operatorOptions.find(o => o.value === newRule.operator)?.label || newRule.operator;
    
    const rule: SegmentRule = {
      id: `r${Date.now()}`,
      field: newRule.field!,
      operator: newRule.operator!,
      value: newRule.value!,
      label: `${fieldLabel} ${operatorLabel} ${newRule.value}`
    };
    
    setNewSegment(prev => ({
      ...prev,
      rules: [...(prev.rules || []), rule]
    }));
    
    setNewRule({
      field: '',
      operator: '',
      value: '',
      label: ''
    });
  };
  
  // Remover regra
  const removeRule = (ruleId: string) => {
    setNewSegment(prev => ({
      ...prev,
      rules: prev.rules?.filter(r => r.id !== ruleId) || []
    }));
  };
  
  // Salvar segmento
  const saveSegment = () => {
    if (!newSegment.name || !newSegment.rules?.length) {
      toast({
        title: "Erro de Validação",
        description: "Nome e pelo menos uma regra são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    const segment: Segment = {
      id: editingSegment?.id || `s${Date.now()}`,
      name: newSegment.name,
      description: newSegment.description || '',
      rules: newSegment.rules,
      operator: newSegment.operator || 'AND',
      isActive: newSegment.isActive || true,
      matchCount: calculateMatchCount(newSegment.rules, newSegment.operator || 'AND'),
      createdAt: editingSegment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (editingSegment) {
      setSegments(prev => prev.map(s => s.id === editingSegment.id ? segment : s));
      toast({
        title: "Segmento Atualizado",
        description: `Segmento "${segment.name}" foi atualizado com sucesso`,
      });
    } else {
      setSegments(prev => [...prev, segment]);
      toast({
        title: "Segmento Criado",
        description: `Segmento "${segment.name}" foi criado com sucesso`,
      });
    }
    
    resetForm();
  };
  
  // Resetar formulário
  const resetForm = () => {
    setNewSegment({
      name: '',
      description: '',
      rules: [],
      operator: 'AND',
      isActive: true
    });
    setNewRule({
      field: '',
      operator: '',
      value: '',
      label: ''
    });
    setIsCreating(false);
    setEditingSegment(null);
  };
  
  // Calcular número de matches (simulado)
  const calculateMatchCount = (rules: SegmentRule[], operator: string): number => {
    // Simulação simples - em produção isso seria calculado com base nos dados reais
    const totalContacts = contactsData?.total || 10;
    const baseMatch = Math.floor(totalContacts * 0.3); // 30% como base
    const ruleComplexity = rules.length;
    
    return Math.max(1, baseMatch - ruleComplexity);
  };
  
  // Editar segmento
  const editSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setNewSegment({
      name: segment.name,
      description: segment.description,
      rules: segment.rules,
      operator: segment.operator,
      isActive: segment.isActive
    });
    setIsCreating(true);
  };
  
  // Duplicar segmento
  const duplicateSegment = (segment: Segment) => {
    const duplicate: Segment = {
      ...segment,
      id: `s${Date.now()}`,
      name: `${segment.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSegments(prev => [...prev, duplicate]);
    toast({
      title: "Segmento Duplicado",
      description: `Segmento "${duplicate.name}" foi criado`,
    });
  };
  
  // Excluir segmento
  const deleteSegment = (segmentId: string) => {
    setSegments(prev => prev.filter(s => s.id !== segmentId));
    toast({
      title: "Segmento Excluído",
      description: "Segmento foi excluído com sucesso",
    });
  };
  
  // Ativar/desativar segmento
  const toggleSegmentStatus = (segmentId: string) => {
    setSegments(prev => prev.map(s => 
      s.id === segmentId 
        ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString() }
        : s
    ));
  };
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Segmentação de Contatos</h2>
          <p className="text-muted-foreground">
            Crie regras para segmentar seus contatos automaticamente
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Segmento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingSegment ? 'Editar Segmento' : 'Criar Novo Segmento'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Segmento</Label>
                  <Input
                    id="name"
                    value={newSegment.name}
                    onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Hot Leads"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator">Operador Lógico</Label>
                  <Select 
                    value={newSegment.operator} 
                    onValueChange={(value) => setNewSegment(prev => ({ ...prev, operator: value as 'AND' | 'OR' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">E (AND) - Todas as regras</SelectItem>
                      <SelectItem value="OR">OU (OR) - Qualquer regra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newSegment.description}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo deste segmento"
                  rows={2}
                />
              </div>
              
              <Separator />
              
              {/* Regras */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Regras de Segmentação</h3>
                
                {/* Regras Existentes */}
                {newSegment.rules && newSegment.rules.length > 0 && (
                  <div className="space-y-2">
                    {newSegment.rules.map((rule, index) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {index > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {newSegment.operator}
                            </Badge>
                          )}
                          <span className="text-sm">{rule.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(rule.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Nova Regra */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label>Campo</Label>
                    <Select 
                      value={newRule.field} 
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, field: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Operador</Label>
                    <Select 
                      value={newRule.operator} 
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, operator: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorOptions.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      value={newRule.value}
                      onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Digite o valor"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={addRule}
                      className="w-full"
                      disabled={!newRule.field || !newRule.operator || !newRule.value}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
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
                <Button onClick={saveSegment}>
                  {editingSegment ? 'Atualizar' : 'Criar'} Segmento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Lista de Segmentos */}
      <div className="grid gap-4">
        {segments.map(segment => (
          <Card key={segment.id} className={!segment.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={segment.isActive ? 'default' : 'secondary'}>
                      {segment.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {segment.matchCount} contatos
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSegmentStatus(segment.id)}
                  >
                    {segment.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editSegment(segment)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateSegment(segment)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSegment(segment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {segment.description && (
                <p className="text-sm text-muted-foreground">{segment.description}</p>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Regras:</h4>
                <div className="flex flex-wrap gap-2">
                  {segment.rules.map((rule, index) => (
                    <div key={rule.id} className="flex items-center gap-1">
                      {index > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {segment.operator}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {rule.label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Criado em: {new Date(segment.createdAt).toLocaleDateString('pt-BR')}</span>
                <span>Atualizado em: {new Date(segment.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {segments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum segmento criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro segmento para organizar seus contatos
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Segmento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}