/**
 * 🔲 ImobiPRO - Página Principal de Clientes
 * 
 * Página completa do módulo de clientes com funil Kanban, estatísticas e ações.
 * Demonstra a integração completa da funcionalidade "NOVO LEAD".
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Users, Plus, Filter, Download, Search, BarChart3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { 
  LeadFunnelKanban, 
  AddLeadButton, 
  FloatingAddLeadButton 
} from '@/components/clients';
import { 
  useFunnelStats, 
  useContacts,
  useFunnelKanban 
} from '@/hooks/useClients';

// ============================================================================
// INTERFACE
// ============================================================================

interface ClientsPageProps {
  /** ID do agente atual (para filtrar leads por corretor) */
  currentAgentId?: string;
  /** Role do usuário atual */
  userRole?: 'CREATOR' | 'ADMIN' | 'AGENT';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ClientsPage({ 
  currentAgentId, 
  userRole = 'AGENT' 
}: ClientsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');

  // Hooks para dados
  const { data: stats, isLoading: statsLoading } = useFunnelStats(currentAgentId);
  const { 
    contactsByStage, 
    isLoading: kanbanLoading, 
    moveContact,
    isMoving 
  } = useFunnelKanban(currentAgentId);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLeadCreated = (newLead: any) => {
    console.log('Novo lead criado:', newLead);
    // O React Query irá atualizar automaticamente os dados
  };

  const handleExportData = () => {
    // Implementar exportação de dados
    console.log('Exportando dados dos leads...');
  };

  // ============================================================================
  // RENDER ESTATÍSTICAS
  // ============================================================================

  const renderStats = () => {
    if (statsLoading || !stats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const totalLeads = stats.totalLeads;
    const newLeads = stats.byStage.NEW || 0;
    const qualifiedLeads = stats.byStage.QUALIFIED || 0;
    const convertedLeads = stats.byStage.CONVERTED || 0;

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : '0';

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads Novos</p>
                <p className="text-2xl font-bold text-green-600">{newLeads}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Qualificados</p>
                <p className="text-2xl font-bold text-yellow-600">{qualifiedLeads}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Filter className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // RENDER FILTROS
  // ============================================================================

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Filtros e Ações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Fonte */}
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as fontes</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
                <SelectItem value="Indicação">Indicação</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            {/* Estágio */}
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estágio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estágios</SelectItem>
                <SelectItem value="NEW">Novo</SelectItem>
                <SelectItem value="CONTACTED">Contatado</SelectItem>
                <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                <SelectItem value="INTERESTED">Interessado</SelectItem>
                <SelectItem value="NEGOTIATING">Negociando</SelectItem>
                <SelectItem value="CONVERTED">Convertido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <AddLeadButton
              variant="inline"
              size="default"
              label="Novo Lead"
              defaultAgentId={currentAgentId}
              onLeadCreated={handleLeadCreated}
            />
            
            <Button
              variant="outline"
              onClick={handleExportData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // RENDER PRINCIPAIS FONTES
  // ============================================================================

  const renderTopSources = () => {
    if (!stats?.topSources) return null;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Principais Fontes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.topSources.map((source, index) => (
              <Badge
                key={source.source}
                variant={index === 0 ? "default" : "secondary"}
                className="text-sm py-1 px-3"
              >
                {source.source}: {source.count} leads ({source.conversionRate.toFixed(1)}%)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus leads e acompanhe o funil de vendas
          </p>
        </div>
        
        {/* Badge de status */}
        <Badge variant="outline" className="text-sm">
          {userRole === 'ADMIN' ? 'Visão Geral' : 'Meus Leads'}
        </Badge>
      </div>

      <Separator />

      {/* Estatísticas */}
      {renderStats()}

      {/* Principais Fontes */}
      {renderTopSources()}

      {/* Filtros */}
      {renderFilters()}

      {/* Kanban Board */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funil de Leads
            {isMoving && (
              <Badge variant="secondary" className="animate-pulse">
                Atualizando...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kanbanLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imobipro-blue mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando funil...</p>
              </div>
            </div>
          ) : (
            <LeadFunnelKanban
              contactsByStage={contactsByStage}
              onMoveContact={moveContact}
              isLoading={isMoving}
              currentUserId={currentAgentId}
              userRole={userRole}
            />
          )}
        </CardContent>
      </Card>

      {/* Botão flutuante para adicionar lead */}
      <FloatingAddLeadButton
        defaultAgentId={currentAgentId}
        onLeadCreated={handleLeadCreated}
      />
    </div>
  );
}

// ============================================================================
// COMPONENTE DE DEMONSTRAÇÃO
// ============================================================================

/**
 * Componente de demonstração para testes
 */
export function ClientsPageDemo() {
  return (
    <ClientsPage
      currentAgentId="demo-agent-1"
      userRole="AGENT"
    />
  );
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default ClientsPage;