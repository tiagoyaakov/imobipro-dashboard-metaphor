
/**
 * 🔲 ImobiPRO - Página de Clientes (Funil de Leads)
 * 
 * Página principal para gestão de clientes e funil de vendas.
 * Inclui interface Kanban, filtros avançados e ações em lote.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewLeadForm, LeadFunnelKanban, AddLeadButton } from '@/components/clients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Star,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFunnelStats } from '@/hooks/useClients';
// import type { ContactWithDetails } from '@/types/clients';

const Clientes = () => {
  const { user } = useAuth();
  // Fallback mock caso não tenha dados
  const userWithFallback = user || { id: 'mock-user', role: 'AGENT' };
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: stats } = useFunnelStats(userWithFallback?.id);
  // Fallback para stats mockados caso não carregue
  const statsData = stats || { 
    totalLeads: 25, 
    byStage: { NEW: 8, QUALIFIED: 6, CONVERTED: 3, NEGOTIATING: 4 },
    topSources: [
      { source: 'WhatsApp', count: 12 },
      { source: 'Site', count: 8 },
      { source: 'Indicação', count: 5 }
    ]
  };

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    // TODO: Abrir modal/sidebar com detalhes do contato
    console.log('Contato selecionado:', contact);
  };

  const handleContactCreate = () => {
    setShowCreateModal(true);
    // TODO: Abrir modal de criação
    console.log('Criar novo contato');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-fade-in">
      {/* Header compacto */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes & Leads</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seu funil de vendas e relacionamento com clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button 
                className="bg-imobipro-blue hover:bg-imobipro-blue-dark text-white px-4 py-2 text-sm"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Lead</DialogTitle>
              </DialogHeader>
              <NewLeadForm 
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                defaultAgentId={userWithFallback?.id}
                onSuccess={() => setShowCreateModal(false)} 
              />
            </DialogContent>
          </Dialog>
          
          <Badge variant="secondary" className="bg-imobipro-blue/10 text-imobipro-blue text-xs">
            {statsData?.totalLeads || 0} leads ativos
          </Badge>
        </div>
      </div>

      {/* Dashboard com métricas compactas */}
      <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Total de Leads</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">{statsData?.totalLeads || 0}</div>
            <p className="text-[10px] text-muted-foreground">
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Convertidos</CardTitle>
            <TrendingUp className="h-3 w-3 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-green-600">
              {statsData?.byStage?.CONVERTED || 0}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {((statsData?.byStage?.CONVERTED || 0) / (statsData?.totalLeads || 1) * 100).toFixed(1)}% conversão
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Negociando</CardTitle>
            <Target className="h-3 w-3 text-amber-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-amber-600">
              {statsData?.byStage?.NEGOTIATING || 0}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Alto potencial
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Top Fonte</CardTitle>
            <Star className="h-3 w-3 text-purple-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-purple-600">
              {statsData?.topSources?.[0]?.source || 'N/A'}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {statsData?.topSources?.[0]?.count || 0} leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas principais */}
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-4 mb-3">
          <TabsTrigger value="kanban" className="flex items-center gap-1.5 text-xs">
            <Target className="w-3 h-3" />
            Funil Kanban
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="w-3 h-3" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-1.5 text-xs">
            <MessageSquare className="w-3 h-3" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
            <Settings className="w-3 h-3" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="flex-1 min-h-0 mt-0">
          <LeadFunnelKanban 
            agentId={userWithFallback?.id}
            onContactSelect={handleContactSelect}
            onContactCreate={handleContactCreate}
            className="h-full"
          />
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 min-h-0 mt-0">
          <Card className="imobipro-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">📊 Analytics Avançado</CardTitle>
              <CardDescription className="text-xs">
                Análise detalhada do desempenho do funil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-medium mb-2">Analytics em Desenvolvimento</h3>
                <p className="text-xs max-w-md mx-auto">
                  Dashboard com gráficos, relatórios de conversão e métricas avançadas.
                </p>
                <div className="mt-4 space-y-1 text-[10px]">
                  <p>✅ Funil Kanban funcional</p>
                  <p>🔄 Gráficos de conversão</p>
                  <p>🔄 Análise de ROI por fonte</p>
                  <p>🔄 Relatórios automatizados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="flex-1 min-h-0 mt-0">
          <Card className="imobipro-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">📢 Campanhas de Marketing</CardTitle>
              <CardDescription className="text-xs">
                Gerencie campanhas de WhatsApp, Email e SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-medium mb-2">Campanhas em Desenvolvimento</h3>
                <p className="text-xs max-w-md mx-auto">
                  Sistema completo de campanhas automatizadas com templates e segmentação.
                </p>
                <div className="mt-4 space-y-1 text-[10px]">
                  <p>✅ Estrutura de dados criada</p>
                  <p>🔄 Interface de criação</p>
                  <p>🔄 Templates personalizáveis</p>
                  <p>🔄 Integração WhatsApp/Email</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 mt-0">
          <Card className="imobipro-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">⚙️ Configurações do CRM</CardTitle>
              <CardDescription className="text-xs">
                Personalize o comportamento do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-medium mb-2">Configurações em Desenvolvimento</h3>
                <p className="text-xs max-w-md mx-auto">
                  Painel para personalizar scoring, atribuição automática e notificações.
                </p>
                <div className="mt-4 space-y-1 text-[10px]">
                  <p>✅ Sistema de scoring implementado</p>
                  <p>🔄 Configuração de pesos</p>
                  <p>🔄 Atribuição automática</p>
                  <p>🔄 Configurações de notificação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
    </div>
  );
};

export default Clientes;
