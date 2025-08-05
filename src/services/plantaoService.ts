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

  /**
   * Busca todos os eventos aplicando filtros
   */
  static async getEvents(filters?: PlantaoFilters): Promise<PlantaoEventsResponse> {
    try {
      // Por enquanto, vamos simular dados até a integração com Supabase
      const mockEvents = this.generateMockEvents();
      
      let filteredEvents = [...mockEvents];

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
        status: PlantaoEventStatus.AGENDADO,
        location: data.location,
        attendees: data.attendees,
        recurrenceRule: data.recurrenceRule,
        syncStatus: PlantaoSyncStatus.PENDING,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date()
      };

      // Adicionar ao cache (temporário)
      this.eventsCache.push(newEvent);

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