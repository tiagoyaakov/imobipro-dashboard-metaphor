// Página principal do módulo Plantão (Agendamento)
import React, { useState, useCallback, useEffect } from "react";
import { View } from "react-big-calendar";
// Removendo PageTemplate - usaremos layout customizado
import { PlantaoCalendar } from "@/components/plantao/PlantaoCalendar";
import { PlantaoEventModal } from "@/components/plantao/PlantaoEventModal";
import { PlantaoFilters } from "@/components/plantao/PlantaoFilters";
import { usePlantao } from "@/hooks/usePlantao";
import { useToast } from "@/hooks/use-toast";
import { PlantaoEvent, PlantaoEventFormData } from "@/types/plantao";
import { Loader2, Calendar, AlertCircle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Plantao() {
  const { toast } = useToast();
  
  const {
    events,
    corretores,
    loading,
    error,
    filters,
    selectedEvent,
    currentUser,
    isAdmin,
    fetchEvents,
    createEvent,
    updateEvent,
    cancelEvent,
    setFilters,
    selectEvent,
    clearError,
  } = usePlantao();

  // Estados locais
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");

  // Estados para Google Calendar (temporariamente desabilitado para corrigir dependências circulares)
  const isGoogleConnected = false;
  const googleSyncStatus = 'disconnected';
  const isConnecting = false;
  const isSyncing = false;


  // Handlers de navegação
  const handleNavigate = useCallback((action: "PREV" | "NEXT" | "TODAY") => {
    const newDate = new Date(currentDate);
    
    switch (action) {
      case "TODAY":
        setCurrentDate(new Date());
        break;
      case "PREV":
        if (currentView === "month") {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (currentView === "week") {
          newDate.setDate(newDate.getDate() - 7);
        } else if (currentView === "day") {
          newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
        break;
      case "NEXT":
        if (currentView === "month") {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (currentView === "week") {
          newDate.setDate(newDate.getDate() + 7);
        } else if (currentView === "day") {
          newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
        break;
    }
  }, [currentDate, currentView]);

  // Handler de mudança de visualização
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // Handler de mudança de corretor (filtro)
  const handleCorretorChange = useCallback((corretorId?: string) => {
    setFilters({
      ...filters,
      corretorIds: corretorId ? [corretorId] : undefined,
    });
  }, [filters, setFilters]);

  // Handler de novo evento
  const handleNewEvent = useCallback(() => {
    selectEvent(null);
    setModalInitialDate(undefined);
    setIsModalOpen(true);
  }, [selectEvent]);

  // Handler de seleção de evento
  const handleSelectEvent = useCallback((event: PlantaoEvent) => {
    selectEvent(event);
    setModalInitialDate(undefined);
    setIsModalOpen(true);
  }, [selectEvent]);

  // Handler de seleção de slot (clique no calendário)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    selectEvent(null);
    setModalInitialDate(slotInfo.start);
    setIsModalOpen(true);
  }, [selectEvent]);

  // Handler de submit do modal
  const handleEventSubmit = useCallback(async (data: PlantaoEventFormData) => {
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, data);
    } else {
      await createEvent(data);
    }
    setIsModalOpen(false);
  }, [selectedEvent, createEvent, updateEvent]);

  // Handler de fechamento do modal
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    selectEvent(null);
    setModalInitialDate(undefined);
  }, [selectEvent]);

  // Handlers do Google Calendar
  const handleGoogleModalOpen = useCallback(() => {
    setIsGoogleModalOpen(true);
  }, []);

  const handleGoogleModalClose = useCallback(() => {
    setIsGoogleModalOpen(false);
  }, []);

  const handleGoogleSync = useCallback(async () => {
    toast({
      title: "🔧 Sincronização Temporariamente Indisponível",
      description: "A sincronização com Google Calendar está sendo otimizada",
      variant: "default"
    });
  }, [toast]);

  // Handlers de sincronização (temporariamente desabilitados)
  const handleSyncToGoogle = useCallback(async () => {
    toast({
      title: "🔧 Funcionalidade em Manutenção",
      description: "A sincronização está sendo otimizada",
      variant: "default"
    });
  }, [toast]);

  const handleSyncBidirectional = useCallback(async () => {
    toast({
      title: "🔧 Funcionalidade em Manutenção", 
      description: "A sincronização está sendo otimizada",
      variant: "default"
    });
  }, [toast]);

  const handleSyncFromGoogle = useCallback(async () => {
    toast({
      title: "🔧 Funcionalidade em Manutenção",
      description: "A importação está sendo otimizada",
      variant: "default"
    });
  }, [toast]);

  const handleViewConflicts = useCallback(() => {
    toast({
      title: "🔧 Funcionalidade em Manutenção",
      description: "A resolução de conflitos está sendo otimizada",
      variant: "default"
    });
  }, [toast]);

  const handleCloseConflictModal = useCallback(() => {
    setIsConflictModalOpen(false);
  }, []);

  const handleResolveConflict = useCallback(async (
    conflict: any, 
    strategy: 'KEEP_LOCAL' | 'KEEP_GOOGLE'
  ) => {
    return false;
  }, []);

  // Renderizar loading
  if (loading && events.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando calendário...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header customizado com indicador de sincronização */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plantão</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isAdmin 
              ? "Gerencie os plantões de todos os corretores"
              : "Visualize e gerencie seus plantões"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            🔧 Sincronização Google Calendar em manutenção
          </div>
        </div>
      </div>
      {/* Alertas de erro */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button 
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Fechar
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Abas principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sincronização
          </TabsTrigger>
        </TabsList>

        {/* Aba do Calendário */}
        <TabsContent value="calendar" className="space-y-6">
          {/* Filtros e controles */}
          <PlantaoFilters
            currentDate={currentDate}
            currentView={currentView}
            corretores={corretores}
            selectedCorretorId={filters.corretorIds?.[0]}
            isAdmin={isAdmin}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange}
            onCorretorChange={handleCorretorChange}
            onNewEvent={handleNewEvent}
          />

          {/* Card do calendário */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[700px]">
                <PlantaoCalendar
                  events={events}
                  corretores={corretores}
                  currentView={currentView}
                  onViewChange={handleViewChange}
                  onNavigate={setCurrentDate}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  isAdmin={isAdmin}
                  selectedCorretorId={filters.corretorIds?.[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas rápidas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Eventos</p>
                    <p className="text-2xl font-bold">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmados</p>
                    <p className="text-2xl font-bold">
                      {events.filter(e => e.status === "CONFIRMADO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold">
                      {events.filter(e => e.status === "AGENDADO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelados</p>
                    <p className="text-2xl font-bold">
                      {events.filter(e => e.status === "CANCELADO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Sincronização */}
        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sincronização Google Calendar</h3>
                <p className="text-muted-foreground mb-4">
                  A sincronização com Google Calendar está temporariamente indisponível
                  enquanto otimizamos as funcionalidades para melhor performance.
                </p>
                <div className="text-sm text-muted-foreground">
                  🔧 Funcionalidade em manutenção - Voltará em breve
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de criação/edição */}
      {currentUser && (
        <PlantaoEventModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleEventSubmit}
          event={selectedEvent}
          corretores={corretores}
          isAdmin={isAdmin}
          currentUserId={currentUser.id}
          initialDate={modalInitialDate}
        />
      )}

    </div>
  );
}