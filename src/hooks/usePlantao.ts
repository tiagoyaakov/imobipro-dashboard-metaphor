// Hook customizado para gerenciar estado e lógica do módulo Plantão
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
// Import dinâmico para evitar dependências circulares
import {
  PlantaoEvent,
  PlantaoEventFormData,
  PlantaoFilters,
  PlantaoUser,
  PlantaoAnalytics,
  isAdmin as isAdminUser
} from "@/types/plantao";

interface UsePlantaoReturn {
  // Estados
  events: PlantaoEvent[];
  corretores: PlantaoUser[];
  analytics: PlantaoAnalytics[];
  loading: boolean;
  error: string | null;
  filters: PlantaoFilters;
  selectedEvent: PlantaoEvent | null;
  currentUser: PlantaoUser | null;
  isAdmin: boolean;

  // Ações
  fetchEvents: () => Promise<void>;
  fetchCorretores: () => Promise<void>;
  fetchAnalytics: (corretorId?: string) => Promise<void>;
  createEvent: (data: PlantaoEventFormData) => Promise<void>;
  updateEvent: (eventId: string, data: Partial<PlantaoEventFormData>) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  setFilters: (filters: PlantaoFilters) => void;
  selectEvent: (event: PlantaoEvent | null) => void;
  clearError: () => void;
}

export function usePlantao(): UsePlantaoReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Import dinâmico para evitar dependências circulares
  const getPlantaoService = async () => {
    const { PlantaoService } = await import("@/services/plantaoService");
    return PlantaoService;
  };

  // Estados
  const [events, setEvents] = useState<PlantaoEvent[]>([]);
  const [corretores, setCorretores] = useState<PlantaoUser[]>([]);
  const [analytics, setAnalytics] = useState<PlantaoAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlantaoFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<PlantaoEvent | null>(null);
  const [currentUser, setCurrentUser] = useState<PlantaoUser | null>(null);

  // Verificar se é admin
  const isAdmin = currentUser ? isAdminUser(currentUser) : false;

  // Buscar eventos
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 usePlantao.fetchEvents() - Iniciando busca de eventos...');

      // Se não for admin, filtrar apenas eventos do próprio corretor
      const effectiveFilters = !isAdmin && currentUser
        ? { ...filters, corretorIds: [currentUser.id] }
        : filters;
      
      console.log('🔍 Filtros efetivos:', effectiveFilters);

      const service = await getPlantaoService();
      const response = await service.getEvents(effectiveFilters);
      
      console.log(`✅ ${response.events.length} eventos carregados (${response.syncedCount} sincronizados, ${response.pendingCount} pendentes)`);
      
      setEvents(response.events);

      // Mostrar estatísticas de sincronização apenas se houver dados relevantes
      if (response.pendingCount > 0 && response.pendingCount < response.totalCount) {
        toast({
          title: "Sincronização em andamento",
          description: `${response.pendingCount} eventos aguardando sincronização com Google Calendar`,
          variant: "default"
        });
      }

      if (response.errorCount > 0) {
        toast({
          title: "Erros de sincronização",
          description: `${response.errorCount} eventos com erro de sincronização`,
          variant: "destructive"
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar eventos";
      console.error('❌ Erro ao buscar eventos:', err);
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, currentUser, toast]);

  // Buscar corretores
  const fetchCorretores = useCallback(async () => {
    try {
      const service = await getPlantaoService();
      const users = await service.getCorretores();
      setCorretores(users);
    } catch (err) {
      console.error("Erro ao buscar corretores:", err);
    }
  }, []);

  // Buscar analytics
  const fetchAnalytics = useCallback(async (corretorId?: string) => {
    try {
      setLoading(true);
      const service = await getPlantaoService();
      const data = await service.getAnalytics(corretorId);
      setAnalytics(data);
    } catch (err) {
      console.error("Erro ao buscar analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar evento
  const createEvent = useCallback(async (data: PlantaoEventFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Se não for admin, sempre usar o próprio ID
      const eventData = !isAdmin && currentUser
        ? { ...data, corretorId: currentUser.id }
        : data;

      const service = await getPlantaoService();
      const newEvent = await service.createEvent(eventData);
      
      toast({
        title: "Evento criado",
        description: "O evento foi adicionado ao calendário com sucesso",
        variant: "default"
      });

      // Recarregar eventos
      await fetchEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar evento";
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUser, fetchEvents, toast]);

  // Atualizar evento
  const updateEvent = useCallback(async (eventId: string, data: Partial<PlantaoEventFormData>) => {
    try {
      setLoading(true);
      setError(null);

      const service = await getPlantaoService();
      await service.updateEvent(eventId, data);
      
      toast({
        title: "Evento atualizado",
        description: "As alterações foram salvas com sucesso",
        variant: "default"
      });

      // Recarregar eventos
      await fetchEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar evento";
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEvents, toast]);

  // Cancelar evento
  const cancelEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const service = await getPlantaoService();
      await service.cancelEvent(eventId);
      
      toast({
        title: "Evento cancelado",
        description: "O evento foi cancelado com sucesso",
        variant: "default"
      });

      // Recarregar eventos
      await fetchEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao cancelar evento";
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEvents, toast]);

  // Selecionar evento
  const selectEvent = useCallback((event: PlantaoEvent | null) => {
    setSelectedEvent(event);
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Configurar usuário atual
  useEffect(() => {
    const setupCurrentUser = async () => {
      if (user) {
        const service = await getPlantaoService();
        const users = await service.getCorretores();
        const currentUserData = users.find(u => u.id === user.id) || {
          id: user.id,
          name: user.email || "Usuário",
          email: user.email || "",
          role: user.app_metadata?.role || "AGENT",
          color: "#000000",
          permissions: ["read", "write"],
          timezone: "America/Sao_Paulo"
        };
        setCurrentUser(currentUserData as PlantaoUser);
      }
    };

    setupCurrentUser();
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (currentUser) {
      fetchEvents();
      fetchCorretores();
    }
  }, [currentUser, fetchEvents, fetchCorretores]);

  return {
    // Estados
    events,
    corretores,
    analytics,
    loading,
    error,
    filters,
    selectedEvent,
    currentUser,
    isAdmin,

    // Ações
    fetchEvents,
    fetchCorretores,
    fetchAnalytics,
    createEvent,
    updateEvent,
    cancelEvent,
    setFilters,
    selectEvent,
    clearError
  };
}