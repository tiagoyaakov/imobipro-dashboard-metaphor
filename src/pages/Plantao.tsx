// Página principal do módulo Plantão (Agendamento)
import React, { useState, useCallback, useEffect } from "react";
import { View } from "react-big-calendar";
// Removendo PageTemplate - usaremos layout customizado
import { PlantaoCalendar } from "@/components/plantao/PlantaoCalendar";
import { PlantaoEventModal } from "@/components/plantao/PlantaoEventModal";
import { PlantaoFilters } from "@/components/plantao/PlantaoFilters";
import { GoogleCalendarConnectionModal } from "@/components/plantao/GoogleCalendarConnectionModal";
import { SyncStatusIndicator } from "@/components/plantao/SyncStatusIndicator";
import { SyncControls } from "@/components/plantao/SyncControls";
import { ConflictResolutionModal } from "@/components/plantao/ConflictResolutionModal";
import { usePlantao } from "@/hooks/usePlantao";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { PlantaoEvent, PlantaoEventFormData } from "@/types/plantao";
import { SyncStatus } from "@/types/googleCalendar";
import { Loader2, Calendar, AlertCircle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Plantao() {
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

  // Hook do Google Calendar OAuth
  const {
    isConnected: isGoogleConnected,
    connectionStatus: googleSyncStatus,
    lastConnectedAt,
    isConnecting,
    refreshConnection
  } = useGoogleOAuth();

  // Hook de sincronização bidirecional
  const {
    syncStatus,
    lastSyncReport,
    isSyncing,
    conflicts,
    googleEvents,
    importedEvents,
    syncToGoogle,
    syncFromGoogle,
    syncBidirectional,
    resolveConflict,
    fetchGoogleEvents,
    clearConflicts,
    getLastSyncTime,
    getSyncStats
  } = useGoogleCalendarSync();

  // Debug temporário para OAuth
  useEffect(() => {
    console.group('🔍 Debug Plantão - Google OAuth Status');
    console.log('isGoogleConnected:', isGoogleConnected);
    console.log('googleSyncStatus:', googleSyncStatus);
    console.log('isConnecting:', isConnecting);
    console.log('lastConnectedAt:', lastConnectedAt);
    console.log('URL atual:', window.location.href);
    console.log('Session storage auth_started:', sessionStorage.getItem('google_auth_started'));
    console.log('localStorage tokens:', localStorage.getItem('google_calendar_tokens'));
    console.groupEnd();
  }, [isGoogleConnected, googleSyncStatus, isConnecting, lastConnectedAt]);

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
    await refreshConnection();
    // TODO: Implementar sincronização de eventos
  }, [refreshConnection]);

  // Handlers de sincronização
  const handleSyncToGoogle = useCallback(async () => {
    try {
      await syncToGoogle(events);
    } catch (error) {
      console.error('Erro na sincronização para Google:', error);
    }
  }, [syncToGoogle, events]);

  const handleSyncBidirectional = useCallback(async () => {
    try {
      await syncBidirectional(events);
    } catch (error) {
      console.error('Erro na sincronização bidirecional:', error);
    }
  }, [syncBidirectional, events]);

  const handleSyncFromGoogle = useCallback(async () => {
    try {
      await syncFromGoogle(async (event) => {
        // Callback para processar cada evento importado
        console.log('Processando evento importado:', event);
        
        // Criar o evento no sistema local através do hook usePlantao
        if (event.title && event.startDateTime && event.endDateTime) {
          try {
            await createEvent({
              title: event.title,
              description: event.description || '',
              startDateTime: new Date(event.startDateTime),
              endDateTime: new Date(event.endDateTime),
              location: event.location || '',
              corretorId: currentUser?.id || '',
              clientName: '',
              clientPhone: '',
              propertyId: '',
              tipo: 'VISITA',
              status: 'AGENDADO',
              observacoes: 'Importado do Google Calendar',
              googleCalendarEventId: event.googleCalendarEventId
            });
            console.log('✅ Evento importado e criado localmente:', event.title);
            return true;
          } catch (error) {
            console.error('❌ Erro ao criar evento localmente:', error);
            return false;
          }
        }
        return false;
      });
      
      // Recarregar eventos após importação
      await fetchEvents();
    } catch (error) {
      console.error('Erro na importação do Google:', error);
    }
  }, [syncFromGoogle, createEvent, currentUser, fetchEvents]);

  const handleViewConflicts = useCallback(() => {
    setIsConflictModalOpen(true);
  }, []);

  const handleCloseConflictModal = useCallback(() => {
    setIsConflictModalOpen(false);
  }, []);

  const handleResolveConflict = useCallback(async (
    conflict: any, 
    strategy: 'KEEP_LOCAL' | 'KEEP_GOOGLE'
  ) => {
    return await resolveConflict(conflict, strategy);
  }, [resolveConflict]);

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
          <SyncStatusIndicator
            syncStatus={isGoogleConnected ? syncStatus : SyncStatus.IDLE}
            isConnected={isGoogleConnected}
            lastSyncAt={getLastSyncTime()}
            onSync={handleGoogleSync}
            onOpenConnection={handleGoogleModalOpen}
            isLoading={isConnecting || isSyncing}
            compact
          />
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
          <SyncControls
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            lastSyncReport={lastSyncReport}
            conflicts={conflicts.length}
            onSyncToGoogle={handleSyncToGoogle}
            onSyncFromGoogle={handleSyncFromGoogle}
            onSyncBidirectional={handleSyncBidirectional}
            onViewConflicts={conflicts.length > 0 ? handleViewConflicts : undefined}
            isGoogleConnected={isGoogleConnected}
            canSync={isGoogleConnected && !isSyncing && events.length > 0}
          />

          {/* Informações sobre eventos do Google Calendar */}
          {(googleEvents.length > 0 || importedEvents.length > 0) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Estatísticas de Sincronização
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Eventos do Google Calendar */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Google Calendar</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Eventos encontrados:</span>
                        <span className="font-medium">{googleEvents.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conflitos detectados:</span>
                        <span className={`font-medium ${conflicts.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {conflicts.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Eventos Importados */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Importação</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Eventos importados:</span>
                        <span className="font-medium text-green-600">{getSyncStats().importedCount}</span>
                      </div>
                      {getSyncStats().lastSuccess && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Última sincronização:</span>
                          <span className="font-medium">
                            {getSyncStats().lastSuccess?.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

      {/* Modal de conexão Google Calendar */}
      <GoogleCalendarConnectionModal
        isOpen={isGoogleModalOpen}
        onClose={handleGoogleModalClose}
      />

      {/* Modal de resolução de conflitos */}
      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={handleCloseConflictModal}
        conflicts={conflicts}
        onResolveConflict={handleResolveConflict}
        onClearConflicts={clearConflicts}
        isResolving={isSyncing}
      />
    </div>
  );
}