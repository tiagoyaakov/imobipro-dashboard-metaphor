// Serviço para gerenciar operações do módulo Plantão
import { supabase } from "@/integrations/supabase/client";
import { 
  PlantaoEvent, 
  PlantaoEventFormData, 
  PlantaoEventsResponse, 
  PlantaoFilters,
  PlantaoUser,
  PlantaoAnalytics,
  PlantaoEventStatus,
  PlantaoSyncStatus 
} from "@/types/plantao";

// Simula dados de corretores com cores para o calendário
const CORRETOR_COLORS = [
  "#8B5CF6", // Roxo
  "#3B82F6", // Azul
  "#10B981", // Verde
  "#F59E0B", // Amarelo
  "#EF4444", // Vermelho
  "#EC4899", // Rosa
  "#6366F1", // Índigo
  "#14B8A6", // Teal
];

export class PlantaoService {
  // Cache local para eventos (simulado por enquanto)
  private static eventsCache: PlantaoEvent[] = [];
  private static usersCache: PlantaoUser[] = [];
  
  // Chaves do localStorage
  private static readonly CACHE_KEYS = {
    EVENTS: 'imobipro_plantao_events_cache',
    USERS: 'imobipro_plantao_users_cache'
  };

  /**
   * Carregar cache do localStorage
   */
  private static loadCacheFromStorage(): void {
    try {
      const eventsData = localStorage.getItem(this.CACHE_KEYS.EVENTS);
      if (eventsData) {
        const parsedEvents = JSON.parse(eventsData);
        // Converter strings de data de volta para objetos Date
        this.eventsCache = parsedEvents.map((event: any) => ({
          ...event,
          startDateTime: new Date(event.startDateTime),
          endDateTime: new Date(event.endDateTime),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
          lastModified: new Date(event.lastModified)
        }));
        console.log(`📦 ${this.eventsCache.length} eventos carregados do cache`);
      }

      const usersData = localStorage.getItem(this.CACHE_KEYS.USERS);
      if (usersData) {
        this.usersCache = JSON.parse(usersData);
        console.log(`👥 ${this.usersCache.length} usuários carregados do cache`);
      }
    } catch (error) {
      console.warn("⚠️ Erro ao carregar cache do localStorage:", error);
      this.eventsCache = [];
      this.usersCache = [];
    }
  }

  /**
   * Salvar cache no localStorage
   */
  private static saveCacheToStorage(): void {
    try {
      localStorage.setItem(this.CACHE_KEYS.EVENTS, JSON.stringify(this.eventsCache));
      localStorage.setItem(this.CACHE_KEYS.USERS, JSON.stringify(this.usersCache));
      console.log(`💾 Cache salvo: ${this.eventsCache.length} eventos`);
    } catch (error) {
      console.warn("⚠️ Erro ao salvar cache no localStorage:", error);
    }
  }

  /**
   * Adicionar evento ao cache e persistir
   */
  static addEventToCache(event: PlantaoEvent): void {
    // Verificar se evento já existe no cache
    const existingIndex = this.eventsCache.findIndex(e => e.id === event.id);
    
    if (existingIndex >= 0) {
      // Atualizar evento existente
      this.eventsCache[existingIndex] = event;
      console.log(`📝 Evento atualizado no cache: ${event.title}`);
    } else {
      // Adicionar novo evento
      this.eventsCache.push(event);
      console.log(`➕ Evento adicionado ao cache: ${event.title}`);
    }
    
    this.saveCacheToStorage();
  }

  /**
   * Remover evento do cache
   */
  static removeEventFromCache(eventId: string): void {
    const originalLength = this.eventsCache.length;
    this.eventsCache = this.eventsCache.filter(e => e.id !== eventId);
    
    if (this.eventsCache.length < originalLength) {
      console.log(`🗑️ Evento removido do cache: ${eventId}`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Forçar recarregamento do cache
   */
  static forceReloadCache(): void {
    console.log('🔄 Forçando recarregamento do cache...');
    this.loadCacheFromStorage();
  }

  /**
   * Limpar cache
   */
  static clearCache(): void {
    this.eventsCache = [];
    this.usersCache = [];
    localStorage.removeItem(this.CACHE_KEYS.EVENTS);
    localStorage.removeItem(this.CACHE_KEYS.USERS);
    console.log("🧹 Cache limpo");
  }

  /**
   * Busca todos os eventos aplicando filtros
   */
  static async getEvents(filters?: PlantaoFilters): Promise<PlantaoEventsResponse> {
    try {
      // SEMPRE carregar cache do localStorage para garantir dados persistentes
      this.loadCacheFromStorage();
      
      console.log(`🔍 Buscando eventos - Cache: ${this.eventsCache.length} eventos`);

      // Por enquanto, vamos simular dados até a integração com Supabase
      const mockEvents = this.generateMockEvents();
      
      // Combinar eventos mockados com eventos do cache (incluindo importados do Google)
      // IMPORTANTE: Cache primeiro para dar prioridade aos eventos importados
      let filteredEvents = [...this.eventsCache, ...mockEvents];
      
      // Remover duplicatas por ID (cache tem prioridade)
      const seenIds = new Set();
      filteredEvents = filteredEvents.filter(event => {
        if (seenIds.has(event.id)) {
          return false;
        }
        seenIds.add(event.id);
        return true;
      });

      console.log(`📊 Eventos após combinação: ${filteredEvents.length} (${this.eventsCache.length} do cache + ${mockEvents.length} mockados)`);
      
      // Aplicar filtros
      if (filters) {
        if (filters.corretorIds?.length) {
          filteredEvents = filteredEvents.filter(event => 
            filters.corretorIds!.includes(event.corretorId)
          );
        }

        if (filters.dateRange) {
          filteredEvents = filteredEvents.filter(event => {
            const eventStart = new Date(event.startDateTime);
            return eventStart >= filters.dateRange!.start && 
                   eventStart <= filters.dateRange!.end;
          });
        }

        if (filters.status?.length) {
          filteredEvents = filteredEvents.filter(event => 
            filters.status!.includes(event.status)
          );
        }

        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(term) ||
            event.description?.toLowerCase().includes(term) ||
            event.location?.toLowerCase().includes(term)
          );
        }
      }

      // Contar status de sincronização
      const syncedCount = filteredEvents.filter(e => e.syncStatus === PlantaoSyncStatus.SYNCED).length;
      const pendingCount = filteredEvents.filter(e => e.syncStatus === PlantaoSyncStatus.PENDING).length;
      const errorCount = filteredEvents.filter(e => e.syncStatus === PlantaoSyncStatus.ERROR).length;
      
      console.log(`✅ Retornando ${filteredEvents.length} eventos filtrados`);

      return {
        events: filteredEvents,
        totalCount: filteredEvents.length,
        syncedCount,
        pendingCount,
        errorCount
      };
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      throw error;
    }
  }

  /**
   * Busca evento por ID
   */
  static async getEventById(eventId: string): Promise<PlantaoEvent | null> {
    const response = await this.getEvents();
    return response.events.find(event => event.id === eventId) || null;
  }

  /**
   * Cria novo evento
   */
  static async createEvent(data: PlantaoEventFormData): Promise<PlantaoEvent> {
    try {
      // Validar dados
      if (!data.title || !data.startDateTime || !data.endDateTime) {
        throw new Error("Dados obrigatórios faltando");
      }

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Simular criação de evento
      const newEvent: PlantaoEvent = {
        id: `event-${Date.now()}`,
        title: data.title,
        description: data.description,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        corretorId: data.corretorId || user.id,
        corretorName: "Corretor Exemplo", // Será obtido do banco real
        corretorColor: CORRETOR_COLORS[Math.floor(Math.random() * CORRETOR_COLORS.length)],
        status: data.status || PlantaoEventStatus.AGENDADO,
        location: data.location,
        attendees: data.attendees,
        recurrenceRule: data.recurrenceRule,
        syncStatus: (data as any).googleCalendarEventId ? PlantaoSyncStatus.SYNCED : PlantaoSyncStatus.PENDING,
        googleCalendarEventId: (data as any).googleCalendarEventId,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date()
      };

      // Adicionar ao cache persistente
      this.addEventToCache(newEvent);

      // TODO: Integrar com Supabase e n8n para persistir

      return newEvent;
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      throw error;
    }
  }

  /**
   * Atualiza evento existente
   */
  static async updateEvent(eventId: string, data: Partial<PlantaoEventFormData>): Promise<PlantaoEvent> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) {
        throw new Error("Evento não encontrado");
      }

      // Simular atualização
      const updatedEvent: PlantaoEvent = {
        ...event,
        ...data,
        startDateTime: data.startDateTime ? new Date(data.startDateTime) : event.startDateTime,
        endDateTime: data.endDateTime ? new Date(data.endDateTime) : event.endDateTime,
        syncStatus: PlantaoSyncStatus.PENDING,
        updatedAt: new Date(),
        lastModified: new Date()
      };

      // TODO: Integrar com Supabase e n8n

      return updatedEvent;
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      throw error;
    }
  }

  /**
   * Cancela evento
   */
  static async cancelEvent(eventId: string): Promise<PlantaoEvent> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) {
        throw new Error("Evento não encontrado");
      }

      const canceledEvent: PlantaoEvent = {
        ...event,
        status: PlantaoEventStatus.CANCELADO,
        syncStatus: PlantaoSyncStatus.PENDING,
        updatedAt: new Date(),
        lastModified: new Date()
      };

      // TODO: Integrar com Supabase e n8n

      return canceledEvent;
    } catch (error) {
      console.error("Erro ao cancelar evento:", error);
      throw error;
    }
  }

  /**
   * Busca corretores disponíveis
   */
  static async getCorretores(): Promise<PlantaoUser[]> {
    try {
      // Por enquanto, vamos simular dados
      if (this.usersCache.length === 0) {
        this.usersCache = this.generateMockUsers();
      }
      return this.usersCache;
    } catch (error) {
      console.error("Erro ao buscar corretores:", error);
      throw error;
    }
  }

  /**
   * Busca analytics de plantões
   */
  static async getAnalytics(corretorId?: string, period?: { start: Date; end: Date }): Promise<PlantaoAnalytics[]> {
    try {
      const corretores = await this.getCorretores();
      const analytics: PlantaoAnalytics[] = [];

      const targetCorretores = corretorId 
        ? corretores.filter(c => c.id === corretorId)
        : corretores.filter(c => c.role === "AGENT");

      for (const corretor of targetCorretores) {
        const { events } = await this.getEvents({
          corretorIds: [corretor.id],
          dateRange: period
        });

        const completedEvents = events.filter(e => e.status === PlantaoEventStatus.CONCLUIDO);
        const canceledEvents = events.filter(e => e.status === PlantaoEventStatus.CANCELADO);

        // Calcular duração média
        const totalDuration = completedEvents.reduce((sum, event) => {
          const duration = new Date(event.endDateTime).getTime() - new Date(event.startDateTime).getTime();
          return sum + (duration / (1000 * 60)); // Converter para minutos
        }, 0);

        analytics.push({
          corretorId: corretor.id,
          corretorName: corretor.name,
          period: period || { start: new Date(), end: new Date() },
          totalEvents: events.length,
          completedEvents: completedEvents.length,
          canceledEvents: canceledEvents.length,
          occupancyRate: events.length > 0 ? (completedEvents.length / events.length) * 100 : 0,
          averageEventDuration: completedEvents.length > 0 ? totalDuration / completedEvents.length : 0
        });
      }

      return analytics;
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
      throw error;
    }
  }

  /**
   * Gera dados mockados de eventos (temporário)
   */
  private static generateMockEvents(): PlantaoEvent[] {
    const events: PlantaoEvent[] = [];
    const corretores = this.generateMockUsers().filter(u => u.role === "AGENT");
    const today = new Date();

    // Gerar eventos para os próximos 30 dias
    for (let day = 0; day < 30; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      // 2-4 eventos por dia
      const eventsPerDay = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < eventsPerDay; i++) {
        const corretor = corretores[Math.floor(Math.random() * corretores.length)];
        const hour = 9 + Math.floor(Math.random() * 9); // 9h às 17h
        const duration = [30, 60, 90, 120][Math.floor(Math.random() * 4)]; // 30min a 2h

        const startDateTime = new Date(date);
        startDateTime.setHours(hour, 0, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + duration);

        events.push({
          id: `event-${day}-${i}`,
          title: [
            "Visita ao imóvel - Apt. Centro",
            "Reunião com cliente - Casa Jardins",
            "Vistoria - Cobertura Zona Sul",
            "Assinatura de contrato",
            "Apresentação de proposta",
            "Follow-up com interessado"
          ][Math.floor(Math.random() * 6)],
          description: "Detalhes do agendamento...",
          startDateTime,
          endDateTime,
          corretorId: corretor.id,
          corretorName: corretor.name,
          corretorColor: corretor.color,
          status: day < 0 ? PlantaoEventStatus.CONCLUIDO : PlantaoEventStatus.AGENDADO,
          location: "São Paulo, SP",
          syncStatus: PlantaoSyncStatus.SYNCED,
          createdBy: corretor.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModified: new Date()
        });
      }
    }

    return events;
  }

  /**
   * Gera dados mockados de usuários (temporário)
   */
  private static generateMockUsers(): PlantaoUser[] {
    return [
      {
        id: "admin-1",
        name: "Administrador Sistema",
        email: "admin@imobipro.com",
        role: "ADMIN",
        color: "#000000",
        permissions: ["read", "write", "delete", "manage_all"],
        timezone: "America/Sao_Paulo"
      },
      {
        id: "corretor-1",
        name: "João Silva",
        email: "joao@imobipro.com",
        role: "AGENT",
        color: CORRETOR_COLORS[0],
        permissions: ["read", "write"],
        timezone: "America/Sao_Paulo"
      },
      {
        id: "corretor-2",
        name: "Maria Santos",
        email: "maria@imobipro.com",
        role: "AGENT",
        color: CORRETOR_COLORS[1],
        permissions: ["read", "write"],
        timezone: "America/Sao_Paulo"
      },
      {
        id: "corretor-3",
        name: "Pedro Oliveira",
        email: "pedro@imobipro.com",
        role: "AGENT",
        color: CORRETOR_COLORS[2],
        permissions: ["read", "write"],
        timezone: "America/Sao_Paulo"
      }
    ];
  }
}