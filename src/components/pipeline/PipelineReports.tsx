// ===================================================================
// PIPELINE REPORTS COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Integração do Pipeline com sistema de relatórios, geração automática
// de relatórios de performance e análise de funil de vendas

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  FileBarChart,
  Download,
  Send,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  Mail,
  MessageSquare,
  FileText,
  Settings,
  Plus,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePipelineReport, usePipelineMetrics } from '@/hooks/usePipeline';
import { DealStage, DEAL_STAGE_CONFIGS } from '@/types/pipeline';
import { formatCurrency } from '@/services/pipelineService';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface PipelineReportsProps {
  agentId?: string;
  className?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency: string;
  recipients: string[];
  isActive: boolean;
  lastSent?: string;
  nextSend?: string;
  format: 'whatsapp' | 'email' | 'pdf';
}

interface ReportMetric {
  label: string;
  value: string | number;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
}

// ===================================================================
// DADOS MOCK PARA DEMONSTRAÇÃO
// ===================================================================

const mockReportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Relatório Diário de Pipeline',
    description: 'Resumo diário das atividades do pipeline',
    type: 'daily',
    frequency: 'Todos os dias às 18:00',
    recipients: ['gestor@empresa.com'],
    isActive: true,
    lastSent: '2024-01-29T18:00:00Z',
    nextSend: '2024-01-30T18:00:00Z',
    format: 'email',
  },
  {
    id: '2',
    name: 'Relatório Semanal de Performance',
    description: 'Análise semanal de conversão e performance do time',
    type: 'weekly',
    frequency: 'Todas as sextas às 17:00',
    recipients: ['diretor@empresa.com', 'gerente@empresa.com'],
    isActive: true,
    lastSent: '2024-01-26T17:00:00Z',
    nextSend: '2024-02-02T17:00:00Z',
    format: 'pdf',
  },
  {
    id: '3',
    name: 'Update via WhatsApp',
    description: 'Updates rápidos do pipeline via WhatsApp',
    type: 'daily',
    frequency: 'Dias úteis às 09:00',
    recipients: ['+55 11 99999-9999'],
    isActive: false,
    format: 'whatsapp',
  },
];

// ===================================================================
// COMPONENTES AUXILIARES
// ===================================================================

function ReportMetricsCard({ metrics }: { metrics: any }) {
  const reportMetrics: ReportMetric[] = [
    {
      label: 'Deals Ativos',
      value: metrics.totalDeals - (metrics.dealsByStage.WON || 0) - (metrics.dealsByStage.LOST || 0),
      change: 5.2,
      trend: 'up',
      icon: Activity,
    },
    {
      label: 'Taxa de Conversão',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      change: 2.1,
      trend: 'up',
      icon: Target,
    },
    {
      label: 'Receita Projetada',
      value: formatCurrency(metrics.projectedRevenue),
      change: 8.3,
      trend: 'up',
      icon: DollarSign,
    },
    {
      label: 'Ciclo Médio',
      value: `${metrics.averageCycleTime} dias`,
      change: -3.5,
      trend: 'down',
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {reportMetrics.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
        const trendColor = metric.trend === 'up' ? 'text-green-600' : 'text-red-600';
        
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {metric.value}
                  </p>
                  {metric.change && (
                    <div className="flex items-center mt-1">
                      <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
                      <span className={`text-xs font-medium ${trendColor}`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ConversionFunnelReport({ metrics }: { metrics: any }) {
  const funnelData = [
    { stage: 'Lead Inicial', deals: metrics.dealsByStage[DealStage.LEAD_IN] || 0, color: '#64748B' },
    { stage: 'Qualificação', deals: metrics.dealsByStage[DealStage.QUALIFICATION] || 0, color: '#3B82F6' },
    { stage: 'Proposta', deals: metrics.dealsByStage[DealStage.PROPOSAL] || 0, color: '#8B5CF6' },
    { stage: 'Negociação', deals: metrics.dealsByStage[DealStage.NEGOTIATION] || 0, color: '#F59E0B' },
    { stage: 'Fechado', deals: metrics.dealsByStage[DealStage.WON] || 0, color: '#10B981' },
  ];

  const totalLeads = funnelData[0].deals;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <CardDescription>
          Análise do funil de conversão por estágio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((stage, index) => {
            const conversionRate = totalLeads > 0 ? (stage.deals / totalLeads) * 100 : 0;
            const dropoffFromPrevious = index > 0 
              ? funnelData[index - 1].deals - stage.deals 
              : 0;
            
            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium">{stage.stage}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{stage.deals}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({conversionRate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${conversionRate}%`,
                      backgroundColor: stage.color 
                    }}
                  />
                </div>
                
                {dropoffFromPrevious > 0 && (
                  <p className="text-xs text-red-600">
                    -{dropoffFromPrevious} deals perdidos do estágio anterior
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportTemplateCard({ 
  template, 
  onToggle, 
  onEdit, 
  onSendNow 
}: { 
  template: ReportTemplate;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (template: ReportTemplate) => void;
  onSendNow: (id: string) => void;
}) {
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      case 'pdf': return FileText;
      default: return FileBarChart;
    }
  };

  const FormatIcon = getFormatIcon(template.format);

  return (
    <Card className={`transition-all duration-200 ${template.isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center space-x-3 mb-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Switch
                checked={template.isActive}
                onCheckedChange={(checked) => onToggle(template.id, checked)}
              />
            </div>
            <CardDescription>{template.description}</CardDescription>
          </div>
          
          <Badge variant={template.isActive ? 'default' : 'secondary'}>
            {template.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{template.frequency}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FormatIcon className="h-4 w-4 text-gray-500" />
              <span className="capitalize">{template.format}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {template.recipients.length} destinatário(s)
            </span>
            {template.nextSend && template.isActive && (
              <span className="text-gray-600">
                Próximo envio: {format(new Date(template.nextSend), 'dd/MM HH:mm', { locale: ptBR })}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSendNow(template.id)}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Agora
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewReportModal({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (template: ReportTemplate) => void; 
}) {
  const [formData, setFormData] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    type: 'weekly',
    frequency: '',
    recipients: [],
    format: 'email',
    isActive: true,
  });

  const handleSave = () => {
    if (formData.name && formData.recipients && formData.recipients.length > 0) {
      onSave({
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description || '',
        type: formData.type as any,
        frequency: formData.frequency || '',
        recipients: formData.recipients,
        format: formData.format as any,
        isActive: formData.isActive ?? true,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Relatório Automático</DialogTitle>
          <DialogDescription>
            Configure um novo relatório automático do pipeline
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Relatório</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Relatório Semanal de Performance"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o conteúdo do relatório..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frequência</Label>
              <Select
                value={formData.type || 'weekly'}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Formato</Label>
              <Select
                value={formData.format || 'email'}
                onValueChange={(value) => setFormData({ ...formData, format: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Destinatários</Label>
            <Input
              value={formData.recipients?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                recipients: e.target.value.split(',').map(r => r.trim()).filter(r => r) 
              })}
              placeholder="email1@empresa.com, email2@empresa.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe múltiplos destinatários com vírgula
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Criar Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function PipelineReports({ agentId, className = '' }: PipelineReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>(mockReportTemplates);
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = addDays(end, -parseInt(selectedPeriod));
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [selectedPeriod]);

  const { data: metrics, isLoading: metricsLoading } = usePipelineMetrics(agentId, dateRange);
  const { data: reportData, isLoading: reportLoading } = usePipelineReport(agentId, dateRange);

  const handleToggleTemplate = (id: string, isActive: boolean) => {
    setReportTemplates(prev => 
      prev.map(template => 
        template.id === id ? { ...template, isActive } : template
      )
    );
  };

  const handleEditTemplate = (template: ReportTemplate) => {
    // Implementar edição de template
    console.log('Editar template:', template);
  };

  const handleSendNow = (id: string) => {
    // Implementar envio imediato
    console.log('Enviar relatório:', id);
  };

  const handleSaveNewReport = (template: ReportTemplate) => {
    setReportTemplates(prev => [...prev, template]);
  };

  if (metricsLoading || reportLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <FileBarChart className="h-6 w-6 mr-2" />
            Relatórios do Pipeline
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Relatórios automáticos e análises do funil de vendas
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setIsNewReportModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="templates">Relatórios Automáticos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Detalhadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Métricas principais */}
          {metrics && <ReportMetricsCard metrics={metrics} />}
          
          {/* Funil de conversão */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metrics && <ConversionFunnelReport metrics={metrics} />}
            
            <Card>
              <CardHeader>
                <CardTitle>Últimos Relatórios Enviados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportTemplates
                    .filter(t => t.lastSent)
                    .sort((a, b) => new Date(b.lastSent!).getTime() - new Date(a.lastSent!).getTime())
                    .slice(0, 5)
                    .map(template => (
                      <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(template.lastSent!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {template.format}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Relatórios Automáticos</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure relatórios para serem enviados automaticamente
              </p>
            </div>
            
            <Button onClick={() => setIsNewReportModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportTemplates.map(template => (
              <ReportTemplateCard
                key={template.id}
                template={template}
                onToggle={handleToggleTemplate}
                onEdit={handleEditTemplate}
                onSendNow={handleSendNow}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Detalhadas</CardTitle>
              <CardDescription>
                Análises aprofundadas do desempenho do pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics detalhadas serão implementadas em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de novo relatório */}
      <NewReportModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
        onSave={handleSaveNewReport}
      />
    </div>
  );
}