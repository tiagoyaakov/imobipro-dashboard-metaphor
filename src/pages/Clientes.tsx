
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
import { LeadFunnelKanban } from '@/components/clients';
import { Button } from '@/components/ui/button';
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
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFunnelStats } from '@/hooks/useClients';
import type { ContactWithDetails } from '@/services/clientsService';

const Clientes = () => {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<ContactWithDetails | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: stats } = useFunnelStats(user?.id);

  const handleContactSelect = (contact: ContactWithDetails) => {
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes & Leads</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu funil de vendas e relacionamento com clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-imobipro-blue/10 text-imobipro-blue">
            {stats?.totalLeads || 0} leads ativos
          </Badge>
        </div>
      </div>

      {/* Dashboard com métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.byStage.CONVERTED || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de conversão: {((stats?.byStage.CONVERTED || 0) / (stats?.totalLeads || 1) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <Target className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.byStage.NEGOTIATING || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Potencial de fechamento alto
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Fonte</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.topSources[0]?.source || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.topSources[0]?.count || 0} leads gerados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas principais */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Funil Kanban
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <LeadFunnelKanban
            agentId={user?.id}
            onContactSelect={handleContactSelect}
            onContactCreate={handleContactCreate}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="imobipro-card">
            <CardHeader>
              <CardTitle>📊 Analytics Avançado</CardTitle>
              <CardDescription>
                Análise detalhada do desempenho do funil de vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Analytics em Desenvolvimento</h3>
                <p className="text-sm">
                  Dashboard com gráficos detalhados, relatórios de conversão,
                  análise de ROI e métricas avançadas será implementado aqui.
                </p>
                <div className="mt-6 space-y-2 text-xs">
                  <p>✅ Funil Kanban funcional</p>
                  <p>🔄 Gráficos de conversão (em breve)</p>
                  <p>🔄 Análise de ROI por fonte (em breve)</p>
                  <p>🔄 Relatórios automatizados (em breve)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <Card className="imobipro-card">
            <CardHeader>
              <CardTitle>📢 Campanhas de Marketing</CardTitle>
              <CardDescription>
                Gerencie campanhas de WhatsApp, Email e SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Campanhas em Desenvolvimento</h3>
                <p className="text-sm">
                  Sistema completo de campanhas automatizadas com templates,
                  segmentação e análise de resultados será implementado aqui.
                </p>
                <div className="mt-6 space-y-2 text-xs">
                  <p>✅ Estrutura de dados criada</p>
                  <p>🔄 Interface de criação (em breve)</p>
                  <p>🔄 Templates personalizáveis (em breve)</p>
                  <p>🔄 Integração WhatsApp/Email (em breve)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="imobipro-card">
            <CardHeader>
              <CardTitle>⚙️ Configurações do CRM</CardTitle>
              <CardDescription>
                Personalize o comportamento do sistema de leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Configurações em Desenvolvimento</h3>
                <p className="text-sm">
                  Painel de configurações para personalizar scoring, atribuição automática,
                  notificações e integrações será implementado aqui.
                </p>
                <div className="mt-6 space-y-2 text-xs">
                  <p>✅ Sistema de scoring implementado</p>
                  <p>🔄 Configuração de pesos (em breve)</p>
                  <p>🔄 Atribuição automática (em breve)</p>
                  <p>🔄 Configurações de notificação (em breve)</p>
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
