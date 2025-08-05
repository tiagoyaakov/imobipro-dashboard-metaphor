// Hook para gerenciar sincronização bidirecional com Google Calendar
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { PlantaoEvent } from "@/types/plantao";
import { 
  SyncReport, 
  SyncStatus, 
  SyncConflict, 
  GoogleCalendarEvent 
} from "@/types/googleCalendar";

interface UseGoogleCalendarSyncReturn {
  // Estados
  syncStatus: SyncStatus;
  lastSyncReport: SyncReport | null;
  isSyncing: boolean;
  conflicts: SyncConflict[];
  googleEvents: GoogleCalendarEvent[];
  importedEvents: PlantaoEvent[];
  
  // Ações
  syncToGoogle: (events: PlantaoEvent[]) => Promise<SyncReport>;
  syncFromGoogle: (onEventImported?: (event: Partial<PlantaoEvent>) => Promise<boolean>) => Promise<SyncReport>;
  syncBidirectional: (events: PlantaoEvent[]) => Promise<SyncReport>;
  resolveConflict: (conflict: SyncConflict, strategy?: 'KEEP_LOCAL' | 'KEEP_GOOGLE') => Promise<boolean>;
  fetchGoogleEvents: () => Promise<GoogleCalendarEvent[]>;
  clearConflicts: () => void;
  
  // Utilitários
  getLastSyncTime: () => Date | null;
  getSyncStats: () => {
    totalSyncs: number;
    successRate: number;
    lastSuccess: Date | null;
    importedCount: number;
  };
}

export function useGoogleCalendarSync(): UseGoogleCalendarSyncReturn {
  const { toast } = useToast();
  const { isConnected: isGoogleConnected } = useGoogleOAuth();
  
  // Import dinâmico para evitar dependências circulares
  const getGoogleCalendarService = async () => {
    const { googleCalendarService } = await import("@/services/googleCalendarService");
    return googleCalendarService;
  };
  
  // Estados
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [lastSyncReport, setLastSyncReport] = useState<SyncReport | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [importedEvents, setImportedEvents] = useState<PlantaoEvent[]>([]);

  /**
   * Sincronizar eventos locais para Google Calendar
   */
  const syncToGoogle = useCallback(async (events: PlantaoEvent[]): Promise<SyncReport> => {
    if (!isGoogleConnected) {
      throw new Error("Google Calendar não está conectado");
    }

    try {
      setIsSyncing(true);
      setSyncStatus(SyncStatus.SYNCING);

      console.log(`🔄 Iniciando sincronização de ${events.length} eventos para Google Calendar...`);

      const service = await getGoogleCalendarService();
      const report = await service.syncToGoogle(events);
      
      setLastSyncReport(report);
      setConflicts(report.conflicts || []);
      setSyncStatus(report.success ? SyncStatus.SYNCED : SyncStatus.ERROR);

      // Notificação de resultado
      if (report.success) {
        toast({
          title: "✅ Sincronização Concluída",
          description: `${report.created} criados, ${report.updated} atualizados${report.conflicts?.length ? `, ${report.conflicts.length} conflitos` : ''}`,
          variant: "default"
        });
      } else {
        toast({
          title: "❌ Erro na Sincronização",
          description: report.errors?.[0] || "Erro desconhecido",
          variant: "destructive"
        });
      }

      return report;

    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro na sincronização";
      setSyncStatus(SyncStatus.ERROR);
      
      toast({
        title: "❌ Falha na Sincronização",
        description: message,
        variant: "destructive"
      });

      const errorReport: SyncReport = {
        success: false,
        timestamp: new Date(),
        conflicts: [],
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [message]
      };

      setLastSyncReport(errorReport);
      return errorReport;

    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, toast]);

  /**
   * Sincronizar eventos do Google Calendar para ImobiPRO
   */
  const syncFromGoogle = useCallback(async (
    onEventImported?: (event: Partial<PlantaoEvent>) => Promise<boolean>
  ): Promise<SyncReport> => {
    if (!isGoogleConnected) {
      throw new Error("Google Calendar não está conectado");
    }

    try {
      setIsSyncing(true);
      setSyncStatus(SyncStatus.SYNCING);

      console.log("🔄 Iniciando importação de eventos do Google Calendar...");

      const service = await getGoogleCalendarService();
      const report = await service.syncFromGoogle("primary", onEventImported);
      
      setLastSyncReport(report);
      setSyncStatus(report.success ? SyncStatus.SYNCED : SyncStatus.ERROR);

      // Atualizar lista de eventos importados
      if (report.success && report.created > 0) {
        // Re-fetch eventos do Google para atualizar a lista
        try {
          const service = await getGoogleCalendarService();
          const events = await service.listEvents("primary", {
            timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // 7 dias atrás
            timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 dias à frente
          });
          setGoogleEvents(events);
          console.log(`📅 ${events.length} eventos carregados do Google Calendar`);
        } catch (error) {
          console.warn("Erro ao atualizar eventos do Google:", error);
        }
      }

      // Notificação de resultado
      if (report.success) {
        toast({
          title: "📥 Importação Concluída",
          description: `${report.created} eventos importados do Google Calendar`,
          variant: "default"
        });
      } else {
        toast({
          title: "❌ Erro na Importação",
          description: report.errors?.[0] || "Erro desconhecido na importação",
          variant: "destructive"
        });
      }

      return report;

    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro na importação";
      setSyncStatus(SyncStatus.ERROR);
      
      toast({
        title: "❌ Falha na Importação",
        description: message,
        variant: "destructive"
      });

      const errorReport: SyncReport = {
        success: false,
        timestamp: new Date(),
        conflicts: [],
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [message]
      };

      setLastSyncReport(errorReport);
      return errorReport;

    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, toast]);

  /**
   * Sincronização bidirecional avançada
   */
  const syncBidirectional = useCallback(async (events: PlantaoEvent[]): Promise<SyncReport> => {
    if (!isGoogleConnected) {
      throw new Error("Google Calendar não está conectado");
    }

    try {
      setIsSyncing(true);
      setSyncStatus(SyncStatus.SYNCING);

      console.log(`🔄 Iniciando sincronização bidirecional de ${events.length} eventos...`);

      const service = await getGoogleCalendarService();
      const report = await service.syncBidirectional(events);
      
      setLastSyncReport(report);
      setConflicts(report.conflicts || []);
      setSyncStatus(report.success ? SyncStatus.SYNCED : SyncStatus.ERROR);

      // Notificação detalhada de resultado
      if (report.success) {
        const hasConflicts = (report.conflicts?.length || 0) > 0;
        toast({
          title: "✅ Sincronização Bidirecional Concluída",
          description: `${report.created} criados, ${report.updated} atualizados${hasConflicts ? `, ${report.conflicts!.length} conflitos detectados` : ''}`,
          variant: hasConflicts ? "default" : "default"
        });

        if (hasConflicts) {
          console.log("⚠️ Conflitos detectados:", report.conflicts);
        }

      } else {
        toast({
          title: "❌ Erro na Sincronização Bidirecional",
          description: report.errors?.[0] || "Erro desconhecido na sincronização",
          variant: "destructive"
        });
      }

      return report;

    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro na sincronização bidirecional";
      setSyncStatus(SyncStatus.ERROR);
      
      toast({
        title: "❌ Falha na Sincronização Bidirecional",
        description: message,
        variant: "destructive"
      });

      const errorReport: SyncReport = {
        success: false,
        timestamp: new Date(),
        conflicts: [],
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [message]
      };

      setLastSyncReport(errorReport);
      return errorReport;

    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, toast]);

  /**
   * Resolver conflito específico
   */
  const resolveConflict = useCallback(async (
    conflict: SyncConflict, 
    strategy: 'KEEP_LOCAL' | 'KEEP_GOOGLE' = 'KEEP_LOCAL'
  ): Promise<boolean> => {
    try {
      const service = await getGoogleCalendarService();
      const result = await service.resolveConflict(conflict, strategy);
      
      if (result.success) {
        // Remover conflito resolvido da lista
        setConflicts(prev => prev.filter(c => c !== conflict));
        
        toast({
          title: "✅ Conflito Resolvido",
          description: result.message,
          variant: "default"
        });
      } else {
        toast({
          title: "⚠️ Erro ao Resolver Conflito",
          description: result.message,
          variant: "destructive"
        });
      }

      return result.success;

    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao resolver conflito";
      toast({
        title: "❌ Falha na Resolução",
        description: message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Buscar eventos do Google Calendar
   */
  const fetchGoogleEvents = useCallback(async (): Promise<GoogleCalendarEvent[]> => {
    if (!isGoogleConnected) {
      throw new Error("Google Calendar não está conectado");
    }

    try {
      const service = await getGoogleCalendarService();
      const events = await service.listEvents("primary", {
        timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // 7 dias atrás
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 dias à frente
      });

      setGoogleEvents(events);
      console.log(`📅 ${events.length} eventos carregados do Google Calendar`);
      
      return events;

    } catch (error) {
      console.error("Erro ao buscar eventos do Google Calendar:", error);
      throw error;
    }
  }, [isGoogleConnected]);

  /**
   * Limpar conflitos
   */
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  /**
   * Obter último horário de sincronização
   */
  const getLastSyncTime = useCallback((): Date | null => {
    return lastSyncReport?.timestamp || null;
  }, [lastSyncReport]);

  /**
   * Obter estatísticas de sincronização
   */
  const getSyncStats = useCallback(() => {
    // TODO: Implementar storage persistente das estatísticas
    return {
      totalSyncs: lastSyncReport ? 1 : 0,
      successRate: lastSyncReport?.success ? 100 : 0,
      lastSuccess: lastSyncReport?.success ? lastSyncReport.timestamp : null,
      importedCount: importedEvents.length
    };
  }, [lastSyncReport, importedEvents.length]);

  return {
    // Estados
    syncStatus,
    lastSyncReport,
    isSyncing,
    conflicts,
    googleEvents,
    importedEvents,
    
    // Ações
    syncToGoogle,
    syncFromGoogle,
    syncBidirectional,
    resolveConflict,
    fetchGoogleEvents,
    clearConflicts,
    
    // Utilitários
    getLastSyncTime,
    getSyncStats
  };
}