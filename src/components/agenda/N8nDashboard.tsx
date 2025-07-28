import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  Play, 
  Pause, 
  Clock,
  Zap,
  Calendar,
  MessageSquare,
  Users,
  Activity,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useN8nManager, useWorkflowTemplates } from '@/hooks/useN8n';

/**
 * 🎛️ Dashboard principal para monitoramento e configuração do n8n
 */
export function N8nDashboard() {
  const n8nManager = useN8nManager();
  const { templates, categories } = useWorkflowTemplates();
  const [selectedTab, setSelectedTab] = useState('overview');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getWorkflowStatusColor = (active: boolean) => {
    return active ? 'text-green-500' : 'text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-imobipro-blue" />
          <div>
            <h1 className="text-3xl font-bold">n8n Dashboard</h1>
            <p className="text-gray-600">Automação e Workflows</p>
          </div>
        </div>
        
        <Button 
          onClick={n8nManager.printSetupInstructions}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Instruções de Setup
        </Button>
      </div>

      {/* Configuration Status Alert */}
      {!n8nManager.isConfigValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuração Incompleta</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-1">
              {n8nManager.config?.issues?.map((issue, index) => (
                <div key={index} className="text-sm">• {issue}</div>
              ))}
            </div>
            <Button 
              onClick={n8nManager.printSetupInstructions}
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              Ver Instruções Completas
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Status de Conectividade */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status n8n</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusIcon(n8nManager.health?.status || 'unknown')}
                  <span className="font-semibold capitalize">
                    {n8nManager.health?.status === 'healthy' ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                {n8nManager.health?.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Última verificação: {formatDate(n8nManager.health.timestamp)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Total de Workflows */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-imobipro-blue" />
                  <span className="text-2xl font-bold">
                    {n8nManager.workflows.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {n8nManager.workflows.filter(w => w.active).length} ativos
                </p>
              </CardContent>
            </Card>

            {/* Execuções Recentes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Execuções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">
                    {n8nManager.executions.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Últimas 24h
                </p>
              </CardContent>
            </Card>

            {/* Status da Configuração */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {n8nManager.isConfigValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {n8nManager.isConfigValid ? 'Completa' : 'Incompleta'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {n8nManager.config?.issues?.length || 0} problemas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Configuração e gerenciamento rápido dos workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => n8nManager.setupWebhooks()}
                  disabled={n8nManager.isSettingUpWebhooks || !n8nManager.isConfigValid}
                  className="flex flex-col h-auto py-4"
                  variant="outline"
                >
                  <RefreshCw className="h-6 w-6 mb-2" />
                  <span className="text-xs">Configurar Webhooks</span>
                </Button>

                <Button
                  onClick={() => window.open(n8nManager.config?.baseUrl, '_blank')}
                  className="flex flex-col h-auto py-4"
                  variant="outline"
                >
                  <ExternalLink className="h-6 w-6 mb-2" />
                  <span className="text-xs">Abrir n8n</span>
                </Button>

                <Button
                  onClick={() => setSelectedTab('workflows')}
                  className="flex flex-col h-auto py-4"
                  variant="outline"
                >
                  <Bot className="h-6 w-6 mb-2" />
                  <span className="text-xs">Ver Workflows</span>
                </Button>

                <Button
                  onClick={() => setSelectedTab('executions')}
                  className="flex flex-col h-auto py-4"
                  variant="outline"
                >
                  <Activity className="h-6 w-6 mb-2" />
                  <span className="text-xs">Ver Execuções</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Workflows Ativos
            </h2>
            <Button
              onClick={() => n8nManager.setupWebhooks()}
              disabled={n8nManager.isSettingUpWebhooks}
              size="sm"
            >
              {n8nManager.isSettingUpWebhooks ? 'Configurando...' : 'Configurar Webhooks'}
            </Button>
          </div>

          {n8nManager.workflows.length > 0 ? (
            <div className="grid gap-4">
              {n8nManager.workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100 ${getWorkflowStatusColor(workflow.active)}`}>
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-gray-600">ID: {workflow.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={workflow.active ? 'default' : 'secondary'}>
                          {workflow.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        
                        <Button
                          onClick={() => n8nManager.toggleWorkflow({ 
                            workflowId: workflow.id, 
                            active: !workflow.active 
                          })}
                          disabled={n8nManager.isTogglingWorkflow}
                          size="sm"
                          variant="outline"
                        >
                          {workflow.active ? (
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
              <CardContent className="p-8 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Nenhum workflow encontrado</h3>
                <p className="text-gray-600 mb-4">
                  Configure sua instância n8n ou importe os templates
                </p>
                <Button onClick={() => setSelectedTab('templates')}>
                  Ver Templates Disponíveis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Execuções */}
        <TabsContent value="executions" className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Execuções Recentes
          </h2>

          {n8nManager.executions.length > 0 ? (
            <div className="space-y-3">
              {n8nManager.executions.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-full ${
                          execution.finished 
                            ? execution.success 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {execution.finished ? (
                            execution.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-medium">Execução {execution.id}</h4>
                          <p className="text-sm text-gray-600">
                            Workflow: {execution.workflowName || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={
                          execution.finished 
                            ? execution.success ? 'default' : 'destructive'
                            : 'secondary'
                        }>
                          {execution.finished 
                            ? execution.success ? 'Sucesso' : 'Erro'
                            : 'Executando'
                          }
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(execution.startedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Nenhuma execução encontrada</h3>
                <p className="text-gray-600">
                  Execute um workflow para ver o histórico aqui
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Templates de Workflow
          </h2>

          <div className="grid gap-6">
            {Object.entries(categories).map(([categoryKey, categoryName]) => {
              const categoryTemplates = templates.filter(t => t.category === categoryKey);
              
              if (categoryTemplates.length === 0) return null;
              
              return (
                <div key={categoryKey}>
                  <h3 className="text-lg font-medium mb-4">{categoryName}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {categoryTemplates.map((template) => (
                      <Card key={template.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{template.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{template.name}</h4>
                              <p className="text-sm text-gray-600 mb-3">
                                {template.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">{template.status}</Badge>
                                <Button size="sm" variant="outline">
                                  Importar Template
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default N8nDashboard;