
/**
 * 🔲 ImobiPRO - Página de Clientes Reestruturada (MVP)
 * 
 * Nova estrutura com duas abas principais:
 * - Aba "Clientes": Lista tabular com filtros e permissões RLS
 * - Aba "CRM": Funil Kanban com drag-and-drop para gestão visual
 * 
 * @author ImobiPRO Team
 * @version 2.0.0 - Reestruturação MVP
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Star,
  List,
  BarChart3,
  Plus,
  AlertCircle,
  Database
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientesMVP, useClientesStatsMVP, useKanbanMVP, useClientesListMVP } from '@/hooks/useClientesMVP';
import KanbanBoard from '@/components/clientes/KanbanBoard';
import ClientesList from '@/components/clientes/ClientesList';
import { NovoClienteModal } from '@/components/clientes/NovoClienteModal';

const Clientes = () => {
  const { user } = useAuth();
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Hook para estatísticas gerais
  const { data: statsData, isLoading: isLoadingStats, error: statsError } = useClientesStatsMVP();
  
  // Hook para Kanban (aba CRM)
  const kanbanData = useKanbanMVP();
  
  // Hook para Lista (aba Clientes)
  const listData = useClientesListMVP();
  // Forçar um refetch inicial para garantir sincronização pós-auth/provisionamento
  useEffect(() => {
    listData.refetch?.();
    kanbanData.refetch?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fallback para stats em caso de erro
  const stats = statsData || { 
    total: 0, 
    byStatus: {}, 
    avgScore: 0, 
    qualified: 0, 
    converted: 0,
    lost: 0,
    withNextAction: 0,
    recentInteractions: 0
  };

  const handleClienteSelect = (cliente: any) => {
    setSelectedCliente(cliente);
    console.log('Cliente selecionado:', cliente);
  };

  const handleClienteCreate = () => {
    setShowCreateModal(true);
    console.log('Abrir modal de criar novo cliente');
  };

  const handleClienteCreateSuccess = () => {
    // Modal será fechado automaticamente pelo componente
    // As queries serão invalidadas automaticamente pelo mutation, mas forçamos refetch para feedback imediato
    try {
      listData.refetch?.();
      kanbanData.refetch?.();
    } catch (err) {
      console.warn('Falha ao atualizar listas após criação do cliente (refetch opcional):', err);
    }
    console.log('Cliente criado com sucesso!');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-fade-in">
      {/* Header compacto */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes & CRM</h1>
          <p className="text-sm text-muted-foreground">
            Sistema integrado de gestão de clientes com funil visual
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
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Criar Novo Cliente
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione um novo cliente ao sistema. Ele aparecerá automaticamente nas abas Lista e CRM.
                </p>
              </DialogHeader>
              <NovoClienteModal
                onSuccess={handleClienteCreateSuccess}
                onClose={handleCloseModal}
              />
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center gap-3">
            {isLoadingStats ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            ) : (
              <Badge variant="secondary" className="bg-imobipro-blue/10 text-imobipro-blue text-xs">
                <Database className="w-3 h-3 mr-1" />
                {stats.total} clientes
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Status de conexão com banco */}
      {statsError && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do banco MVP. Sistema funcionará com dados de exemplo.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard com métricas MVP */}
      <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Total</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground">
              Score médio: {stats.avgScore}
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
              {stats.converted}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : 0}% conversão
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Qualificados</CardTitle>
            <Target className="h-3 w-3 text-amber-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-amber-600">
              {stats.qualified}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Alto potencial
            </p>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Próximas Ações</CardTitle>
            <Star className="h-3 w-3 text-purple-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-purple-600">
              {stats.withNextAction}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Agendadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas principais: Clientes e CRM */}
      <Tabs defaultValue="clientes" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="clientes" className="flex items-center gap-2 text-sm">
            <List className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="crm" className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" />
            CRM Kanban
          </TabsTrigger>
        </TabsList>

        {/* Aba Clientes - Lista Tabular */}
        <TabsContent value="clientes" className="flex-1 min-h-0 mt-0">
          <ClientesList
            clientes={listData.clientes}
            onEdit={listData.onEdit}
            onView={listData.onView}
            onDelete={listData.onDelete}
            isLoading={listData.isLoading}
            currentUserRole={user?.role}
            currentUserId={user?.id}
            filters={listData.filters}
            onFilterChange={listData.onFilterChange}
            raw={listData.raw as any}
          />
        </TabsContent>

        {/* Aba CRM - Kanban Board */}
        <TabsContent value="crm" className="flex-1 min-h-0 mt-0">
          <KanbanBoard
            clientes={kanbanData.clientes}
            onStatusChange={kanbanData.onStatusChange}
            isLoading={kanbanData.isLoading}
            currentUserRole={user?.role}
            currentUserId={user?.id}
          />
        </TabsContent>
      </Tabs>
      
    </div>
  );
};

export default Clientes;
