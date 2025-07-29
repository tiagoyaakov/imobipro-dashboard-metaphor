/**
 * 🔲 ImobiPRO - Página Principal de Clientes
 * 
 * Página simplificada do módulo de clientes para evitar erros de build.
 * Versão funcional básica mantendo UX essencial.
 * 
 * @author ImobiPRO Team
 * @version 1.0.1-hotfix
 */

import React, { useState } from 'react';
import { Users, Plus, Filter, Download, Search, BarChart3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

  // Dados simulados para evitar dependências problemáticas
  const stats = {
    totalLeads: 45,
    byStage: { NEW: 12, QUALIFIED: 8, CONVERTED: 5 },
    topSources: [
      { source: 'WhatsApp', count: 15, conversionRate: 12.5 },
      { source: 'Site', count: 12, conversionRate: 8.3 },
      { source: 'Indicação', count: 8, conversionRate: 15.0 }
    ]
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLeadCreated = () => {
    console.log('Novo lead - funcionalidade será restaurada em breve');
  };

  const handleExportData = () => {
    console.log('Exportar dados - funcionalidade será restaurada em breve');
  };

  // ============================================================================
  // RENDER
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
        
        <Badge variant="outline" className="text-sm">
          {userRole === 'ADMIN' ? 'Visão Geral' : 'Meus Leads'}
        </Badge>
      </div>

      <Separator />

      {/* Estatísticas Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.byStage.NEW}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{stats.byStage.QUALIFIED}</p>
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
                <p className="text-sm font-medium text-gray-600">Convertidos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.byStage.CONVERTED}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Principais Fontes */}
      <Card>
        <CardHeader>
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
                {source.source}: {source.count} leads ({source.conversionRate}%)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filtros e Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as fontes</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Site">Site</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estágios</SelectItem>
                  <SelectItem value="NEW">Novo</SelectItem>
                  <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                  <SelectItem value="CONVERTED">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                onClick={handleLeadCreated}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Novo Lead
              </Button>
              
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

      {/* Área do Funil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funil de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Funil Kanban
              </h3>
              <p className="text-gray-600 mb-4">
                Interface interativa de arrastar e soltar será restaurada em breve
              </p>
              <Badge variant="secondary">
                Funcionalidade temporariamente desabilitada
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPONENTE DE DEMONSTRAÇÃO
// ============================================================================

export function ClientsPageDemo() {
  return (
    <ClientsPage
      currentAgentId="demo-agent-1"
      userRole="AGENT"
    />
  );
}