import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Plus, 
  Calendar,
  TrendingUp,
  Users,
  PhoneCall,
  DollarSign,
  BarChart3,
  Settings,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useReportsManager, useReportsDashboard } from '@/hooks/useReports';
import { ReportTemplate } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportsSetupModal } from '@/components/reports/ReportsSetupModal';
import { companyNeedsReportsSeed } from '@/utils/seedReports';
import { useAuth } from '@/hooks/useAuth';

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

const Relatorios = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const { user } = useAuth();
  const reportsManager = useReportsManager();
  const dashboard = useReportsDashboard();

  // Verificar se precisa mostrar setup inicial
  useEffect(() => {
    async function checkSetupNeeded() {
      if (user?.companyId && reportsManager.isReady && reportsManager.templates.length === 0) {
        const needsSetup = await companyNeedsReportsSeed(user.companyId);
        if (needsSetup) {
          setShowSetupModal(true);
        }
      }
    }

    checkSetupNeeded();
  }, [user?.companyId, reportsManager.isReady, reportsManager.templates.length]);

  if (!reportsManager.isReady) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imobipro-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📊 Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises e relatórios automáticos do seu negócio
          </p>
        </div>
        <Button onClick={() => setActiveTab('templates')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardContent dashboard={dashboard} />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <TemplatesContent 
            templates={reportsManager.templates}
            actions={reportsManager.actions}
            isLoading={reportsManager.isLoading}
          />
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          <ScheduledContent 
            scheduledReports={reportsManager.scheduledReports}
            actions={reportsManager.actions}
            isLoading={reportsManager.isLoading}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <HistoryContent />
        </TabsContent>
      </Tabs>

      {/* Setup Modal */}
      <ReportsSetupModal
        open={showSetupModal}
        onOpenChange={setShowSetupModal}
        onComplete={() => {
          reportsManager.actions.refreshTemplates();
          reportsManager.actions.refreshScheduledReports();
        }}
      />
    </div>
  );
};

// ===================================================================
// DASHBOARD CONTENT
// ===================================================================

const DashboardContent = ({ dashboard }: { dashboard: any }) => {
  if (dashboard.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { sales, leads, appointments, conversions } = dashboard.metrics || {};

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas da Semana</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales ? new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(sales.totalSales) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {sales?.salesCount || 0} vendas realizadas
            </p>
            {sales?.growthRate !== undefined && (
              <div className={`flex items-center text-xs ${
                sales.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {sales.growthRate.toFixed(1)}% vs semana anterior
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads da Semana</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {leads?.newLeads || 0} novos leads
            </p>
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              {leads?.conversionRate?.toFixed(1) || 0}% convertidos
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <PhoneCall className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {appointments?.completedAppointments || 0} realizados
            </p>
            <div className="flex items-center text-xs text-blue-600">
              <Calendar className="h-3 w-3 mr-1" />
              {appointments?.completionRate?.toFixed(1) || 0}% taxa de conclusão
            </div>
          </CardContent>
        </Card>

        {/* Conversão Geral */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversão Geral</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversions?.overallConversion?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lead → Venda
            </p>
            {conversions?.periodComparison && (
              <div className={`flex items-center text-xs ${
                conversions.periodComparison.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {conversions.periodComparison.change > 0 ? '+' : ''}
                {conversions.periodComparison.change.toFixed(1)}% vs período anterior
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por Agente */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Melhores agentes da semana</CardDescription>
          </CardHeader>
          <CardContent>
            {sales?.topAgent ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      🏆
                    </div>
                    <div>
                      <p className="font-medium">{sales.topAgent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sales.topAgent.salesCount} vendas
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Destaque</Badge>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum dado disponível
              </p>
            )}
          </CardContent>
        </Card>

        {/* Fontes de Lead */}
        <Card>
          <CardHeader>
            <CardTitle>Fontes de Leads</CardTitle>
            <CardDescription>Origem dos leads da semana</CardDescription>
          </CardHeader>
          <CardContent>
            {leads?.sourceBreakdown?.length ? (
              <div className="space-y-3">
                {leads.sourceBreakdown.slice(0, 4).map((source: any, index: number) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{source.count}</p>
                      <p className="text-xs text-muted-foreground">
                        {source.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum dado disponível
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Relatórios pré-configurados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Relatório de Vendas</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gerar relatório semanal de vendas
                </p>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Relatório de Leads</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Análise de conversão de leads
                </p>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Relatório de Agendamentos</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Resumo dos agendamentos
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ===================================================================
// TEMPLATES CONTENT
// ===================================================================

const TemplatesContent = ({ templates, actions, isLoading }: any) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Templates de Relatório</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie e crie templates personalizados
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Template
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading.templates ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template: ReportTemplate) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Tipo: {getReportTypeLabel(template.type)}</span>
                  <span>{format(new Date(template.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="h-4 w-4 mr-1" />
                    Usar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro template de relatório
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ===================================================================
// SCHEDULED CONTENT
// ===================================================================

const ScheduledContent = ({ scheduledReports, actions, isLoading }: any) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Relatórios Agendados</h2>
          <p className="text-sm text-muted-foreground">
            Relatórios automáticos configurados
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Scheduled Reports */}
      {isLoading.scheduledReports ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : scheduledReports.length > 0 ? (
        <div className="space-y-4">
          {scheduledReports.map((report: any) => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{report.name}</h3>
                      <Badge variant={report.isActive ? 'default' : 'secondary'}>
                        {report.isActive ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {report.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Template: {report.template?.name}</span>
                      <span>Formato: {getFormatLabel(report.format)}</span>
                      <span>
                        Próximo envio: {report.nextSendAt ? 
                          format(new Date(report.nextSendAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
                          'Não agendado'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => actions.executeReport(report.id)}
                      disabled={isLoading.executeReport}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={report.isActive ? 'outline' : 'default'}
                      size="sm"
                    >
                      {report.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum relatório agendado</h3>
            <p className="text-muted-foreground mb-4">
              Configure relatórios automáticos para serem enviados periodicamente
            </p>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Criar Primeiro Agendamento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ===================================================================
// HISTORY CONTENT
// ===================================================================

const HistoryContent = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Histórico de Relatórios</h2>
        <p className="text-sm text-muted-foreground">
          Relatórios enviados recentemente
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Histórico em Breve</h3>
          <p className="text-muted-foreground">
            O histórico de relatórios enviados será exibido aqui
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// ===================================================================
// UTILITÁRIOS
// ===================================================================

function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    WEEKLY_SALES: 'Vendas Semanais',
    LEAD_CONVERSION: 'Conversão de Leads',
    APPOINTMENT_SUMMARY: 'Resumo de Agendamentos',
    AGENT_PERFORMANCE: 'Performance de Agentes',
    PROPERTY_ANALYSIS: 'Análise de Propriedades',
    CUSTOM: 'Personalizado'
  };
  return labels[type] || type;
}

function getFormatLabel(format: string): string {
  const labels: Record<string, string> = {
    WHATSAPP: 'WhatsApp',
    EMAIL: 'E-mail',
    PDF: 'PDF',
    EXCEL: 'Excel',
    JSON: 'JSON'
  };
  return labels[format] || format;
}

export default Relatorios;