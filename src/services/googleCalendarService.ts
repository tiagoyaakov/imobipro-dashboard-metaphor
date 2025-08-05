// Serviço para operações com Google Calendar API
import { googleOAuthService } from "@/services/googleOAuthService";
import { 
  GoogleCalendar, 
  GoogleCalendarEvent, 
  GoogleCalendarListResponse,
  GoogleEventsListResponse,
  GoogleDateTime,
  SyncResult,
  SyncReport,
  SyncConflict,
  ConflictType,
  isGoogleApiError,
  GoogleApiError 
} from "@/types/googleCalendar";
import { PlantaoEvent } from "@/types/plantao";

export class GoogleCalendarService {
  private readonly BASE_URL = "https://www.googleapis.com/calendar/v3";
  
  /**
   * Verificar se usuário está autenticado
   */
  public async isAuthenticated(): Promise<boolean> {
    const token = await googleOAuthService.getValidAccessToken();
    return !!token;
  }

  /**
   * Obter headers para requisições autenticadas
   */
  private async getAuthHeaders(): Promise<Headers> {
    const token = await googleOAuthService.getValidAccessToken();
    
    if (!token) {
      throw new Error("Usuário não está autenticado com Google Calendar");
    }

    return new Headers({
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    });
  }

  /**
   * Listar calendários do usuário
   */
  public async listCalendars(): Promise<GoogleCalendar[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.BASE_URL}/users/me/calendarList`, {
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new GoogleApiError(error.error?.message || "Erro ao listar calendários");
      }

      const data: GoogleCalendarListResponse = await response.json();
      return data.items || [];
      
    } catch (error) {
      console.error("Erro ao listar calendários:", error);
      throw error;
    }
  }

  /**
   * Obter calendário principal do usuário
   */
  public async getPrimaryCalendar(): Promise<GoogleCalendar | null> {
    const calendars = await this.listCalendars();
    return calendars.find(cal => cal.primary) || calendars[0] || null;
  }

  /**
   * Listar eventos de um calendário
   */
  public async listEvents(
    calendarId: string = "primary",
    options: {
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: "startTime" | "updated";
    } = {}
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const params = new URLSearchParams({
        singleEvents: String(options.singleEvents ?? true),
        orderBy: options.orderBy || "startTime",
        maxResults: String(options.maxResults || 250)
      });

      if (options.timeMin) {
        params.append("timeMin", options.timeMin.toISOString());
      }
      if (options.timeMax) {
        params.append("timeMax", options.timeMax.toISOString());
      }

      const response = await fetch(
        `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new GoogleApiError(error.error?.message || "Erro ao listar eventos");
      }

      const data: GoogleEventsListResponse = await response.json();
      return data.items || [];
      
    } catch (error) {
      console.error("Erro ao listar eventos:", error);
      throw error;
    }
  }

  /**
   * Criar evento no Google Calendar
   */
  public async createEvent(
    calendarId: string = "primary",
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new GoogleApiError(error.error?.message || "Erro ao criar evento");
      }

      return await response.json();
      
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      throw error;
    }
  }

  /**
   * Atualizar evento no Google Calendar
   */
  public async updateEvent(
    calendarId: string = "primary",
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new GoogleApiError(error.error?.message || "Erro ao atualizar evento");
      }

      return await response.json();
      
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      throw error;
    }
  }

  /**
   * Deletar evento do Google Calendar
   */
  public async deleteEvent(
    calendarId: string = "primary",
    eventId: string
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: "DELETE",
          headers
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new GoogleApiError(error.error?.message || "Erro ao deletar evento");
      }
      
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      throw error;
    }
  }

  /**
   * Converter PlantaoEvent para GoogleCalendarEvent
   */
  public plantaoEventToGoogleEvent(plantaoEvent: PlantaoEvent): Partial<GoogleCalendarEvent> {
    const startDateTime: GoogleDateTime = {
      dateTime: plantaoEvent.startDate.toISOString(),
      timeZone: "America/Sao_Paulo"
    };

    const endDateTime: GoogleDateTime = {
      dateTime: plantaoEvent.endDate.toISOString(),
      timeZone: "America/Sao_Paulo"
    };

    return {
      summary: plantaoEvent.title,
      description: plantaoEvent.description || `Plantão - ${plantaoEvent.corretor.name}`,
      start: startDateTime,
      end: endDateTime,
      location: plantaoEvent.location || "",
      status: plantaoEvent.status === "CANCELADO" ? "cancelled" : "confirmed",
      extendedProperties: {
        private: {
          imobiproId: plantaoEvent.id,
          imobiproType: "plantao",
          corretorId: plantaoEvent.corretor.id,
          corretorName: plantaoEvent.corretor.name
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 15 },
          { method: "email", minutes: 60 }
        ]
      }
    };
  }

  /**
   * Converter GoogleCalendarEvent para PlantaoEvent
   */
  public googleEventToPlantaoEvent(googleEvent: GoogleCalendarEvent): Partial<PlantaoEvent> {
    const startDate = new Date(
      googleEvent.start.dateTime || googleEvent.start.date || ""
    );
    const endDate = new Date(
      googleEvent.end.dateTime || googleEvent.end.date || ""
    );

    // Extrair dados do ImobiPRO das propriedades estendidas
    const imobiproId = googleEvent.extendedProperties?.private?.imobiproId;
    const corretorId = googleEvent.extendedProperties?.private?.corretorId;
    const corretorName = googleEvent.extendedProperties?.private?.corretorName;

    return {
      id: imobiproId || `google-${googleEvent.id}`,
      title: googleEvent.summary || "Evento do Google Calendar",
      description: googleEvent.description || "",
      startDate,
      endDate,
      location: googleEvent.location || "",
      status: googleEvent.status === "cancelled" ? "CANCELADO" : "CONFIRMADO",
      googleCalendarId: googleEvent.id,
      corretor: corretorId && corretorName ? {
        id: corretorId,
        name: corretorName,
        email: googleEvent.creator.email
      } : undefined
    };
  }

  /**
   * Sincronizar eventos do ImobiPRO para Google Calendar
   */
  public async syncToGoogle(
    plantaoEvents: PlantaoEvent[],
    calendarId: string = "primary"
  ): Promise<SyncReport> {
    const report: SyncReport = {
      success: true,
      timestamp: new Date(),
      conflicts: [],
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      // Campos legados
      startedAt: new Date(),
      totalEvents: plantaoEvents.length,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      results: []
    };

    try {
      // Obter eventos existentes do Google Calendar
      const existingGoogleEvents = await this.listEvents(calendarId, {
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)   // 90 dias à frente
      });

      // Mapear eventos por ID do ImobiPRO
      const googleEventsByImobiproId = new Map<string, GoogleCalendarEvent>();
      existingGoogleEvents.forEach(event => {
        const imobiproId = event.extendedProperties?.private?.imobiproId;
        if (imobiproId) {
          googleEventsByImobiproId.set(imobiproId, event);
        }
      });

      // Sincronizar cada evento
      for (const plantaoEvent of plantaoEvents) {
        try {
          const existingGoogleEvent = googleEventsByImobiproId.get(plantaoEvent.id);
          const googleEventData = this.plantaoEventToGoogleEvent(plantaoEvent);

          let result: SyncResult;

          if (existingGoogleEvent) {
            // Atualizar evento existente
            const updatedEvent = await this.updateEvent(
              calendarId,
              existingGoogleEvent.id,
              googleEventData
            );
            
            result = {
              success: true,
              action: "UPDATE",
              localId: plantaoEvent.id,
              googleId: updatedEvent.id
            };
            report.updated++;
          } else {
            // Criar novo evento
            const createdEvent = await this.createEvent(calendarId, googleEventData);
            
            result = {
              success: true,
              action: "CREATE",
              localId: plantaoEvent.id,
              googleId: createdEvent.id
            };
            report.created++;
          }

          report.results?.push(result);
          report.syncedCount! += 1;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
          
          report.results?.push({
            success: false,
            action: "SKIP",
            localId: plantaoEvent.id,
            error: errorMessage
          });
          
          report.errors.push(`${plantaoEvent.title}: ${errorMessage}`);
          report.errorCount! += 1;
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro na sincronização";
      report.errors.push(errorMessage);
      report.errorCount! += 1;
      report.success = false;
    }

    report.completedAt = new Date();
    return report;
  }

  /**
   * Sincronizar eventos do Google Calendar para ImobiPRO
   */
  public async syncFromGoogle(
    calendarId: string = "primary",
    onEventImported?: (event: Partial<PlantaoEvent>) => Promise<boolean>
  ): Promise<SyncReport> {
    const report: SyncReport = {
      success: true,
      timestamp: new Date(),
      conflicts: [],
      created: 0,
      updated: 0,
      deleted: 0,
      errors: []
    };

    try {
      console.log("🔄 Iniciando importação de eventos do Google Calendar...");

      const events = await this.listEvents(calendarId, {
        timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 dias à frente
      });

      console.log(`📅 ${events.length} eventos encontrados no Google Calendar`);

      // Filtrar apenas eventos que não são do ImobiPRO (eventos externos)
      const externalEvents = events.filter(event => 
        !event.extendedProperties?.private?.imobiproType
      );

      console.log(`🔍 ${externalEvents.length} eventos externos identificados`);

      // Importar cada evento externo
      for (const googleEvent of externalEvents) {
        try {
          const plantaoEvent = this.googleEventToPlantaoEvent(googleEvent);
          
          if (onEventImported) {
            const imported = await onEventImported(plantaoEvent);
            if (imported) {
              report.created++;
              console.log(`✅ Evento importado: ${googleEvent.summary}`);
            } else {
              console.log(`⏭️ Evento ignorado: ${googleEvent.summary}`);
            }
          } else {
            // Se não há callback, apenas conta como "encontrado"
            report.created++;
          }

        } catch (error) {
          const errorMessage = `Erro ao importar evento "${googleEvent.summary}": ${error instanceof Error ? error.message : String(error)}`;
          report.errors.push(errorMessage);
          console.error("❌", errorMessage);
        }
      }

      console.log(`✅ Importação concluída: ${report.created} eventos importados, ${report.errors.length} erros`);

    } catch (error) {
      report.success = false;
      const message = error instanceof Error ? error.message : "Erro na importação do Google Calendar";
      report.errors.push(message);
      console.error("❌ Erro na importação:", error);
    }

    return report;
  }

  /**
   * Detectar conflitos entre eventos
   */
  public detectConflicts(
    plantaoEvents: PlantaoEvent[],
    googleEvents: GoogleCalendarEvent[]
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    plantaoEvents.forEach(plantaoEvent => {
      googleEvents.forEach(googleEvent => {
        const plantaoStart = plantaoEvent.startDate.getTime();
        const plantaoEnd = plantaoEvent.endDate.getTime();
        
        const googleStart = new Date(
          googleEvent.start.dateTime || googleEvent.start.date || ""
        ).getTime();
        const googleEnd = new Date(
          googleEvent.end.dateTime || googleEvent.end.date || ""
        ).getTime();

        // Verificar sobreposição de horários
        const hasTimeOverlap = (
          plantaoStart < googleEnd && plantaoEnd > googleStart
        );

        if (hasTimeOverlap) {
          conflicts.push({
            id: `conflict-${plantaoEvent.id}-${googleEvent.id}`,
            type: ConflictType.TIME_OVERLAP,
            localEvent: plantaoEvent,
            googleEvent,
            detectedAt: new Date(),
            description: `Conflito de horário entre "${plantaoEvent.title}" (ImobiPRO) e "${googleEvent.summary}" (Google Calendar)`
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Configurar webhook para receber notificações de mudanças
   */
  public async setupWebhook(
    calendarId: string = "primary",
    webhookUrl: string
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const channelData = {
        id: `imobipro-${Date.now()}`,
        type: "web_hook",
        address: webhookUrl,
        token: Math.random().toString(36).substring(7),
        expiration: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
      };

      const response = await fetch(
        `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(channelData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new GoogleApiError(error.error?.message || "Erro ao configurar webhook");
      }

      console.log("Webhook configurado com sucesso");
      
    } catch (error) {
      console.error("Erro ao configurar webhook:", error);
      throw error;
    }
  }

  /**
   * Sincronização bidirecional avançada
   */
  public async syncBidirectional(
    localEvents: PlantaoEvent[], 
    calendarId: string = "primary"
  ): Promise<SyncReport> {
    const report: SyncReport = {
      success: true,
      timestamp: new Date(),
      conflicts: [],
      created: 0,
      updated: 0,
      deleted: 0,
      errors: []
    };

    try {
      console.log("🔄 Iniciando sincronização bidirecional avançada...");
      
      // 1. Obter eventos do Google Calendar
      const googleEvents = await this.listEvents(calendarId, {
        timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // 7 dias atrás
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 dias à frente
      });
      
      console.log(`📅 Google Calendar: ${googleEvents.length} eventos encontrados`);
      console.log(`📋 Local (Plantão): ${localEvents.length} eventos encontrados`);

      // 2. Mapear eventos existentes
      const googleEventsByImobiproId = new Map<string, GoogleCalendarEvent>();
      const imobiproEventsInGoogle = new Set<string>();
      
      googleEvents.forEach(event => {
        const imobiproId = event.extendedProperties?.private?.imobiproId;
        if (imobiproId) {
          googleEventsByImobiproId.set(imobiproId, event);
          imobiproEventsInGoogle.add(imobiproId);
        }
      });

      // 3. Sincronizar eventos locais → Google Calendar
      for (const localEvent of localEvents) {
        try {
          const existingGoogleEvent = googleEventsByImobiproId.get(localEvent.id);

          if (existingGoogleEvent) {
            // Verificar se precisa atualizar
            if (this.needsEventUpdate(localEvent, existingGoogleEvent)) {
              const updatedEvent = await this.updateEvent(
                calendarId,
                existingGoogleEvent.id!,
                this.plantaoEventToGoogleEvent(localEvent)
              );
              
              if (updatedEvent) {
                report.updated++;
                console.log(`📝 Atualizado no Google: ${localEvent.title}`);
              }
            }
          } else {
            // Criar novo evento no Google Calendar
            const createdEvent = await this.createEvent(
              calendarId,
              this.plantaoEventToGoogleEvent(localEvent)
            );
            
            if (createdEvent) {
              report.created++;
              console.log(`➕ Criado no Google: ${localEvent.title}`);
            }
          }

        } catch (error) {
          const message = `Erro ao sincronizar evento "${localEvent.title}": ${error instanceof Error ? error.message : String(error)}`;
          report.errors.push(message);
          console.error("❌", message);
        }
      }

      // 4. Detectar conflitos com eventos externos do Google
      const externalGoogleEvents = googleEvents.filter(event => 
        !event.extendedProperties?.private?.imobiproId
      );

      for (const googleEvent of externalGoogleEvents) {
        const conflictingLocal = localEvents.find(localEvent => 
          this.eventsTimeOverlap(localEvent, googleEvent)
        );

        if (conflictingLocal) {
          const conflict: SyncConflict = {
            type: ConflictType.TIME_OVERLAP,
            localEvent: conflictingLocal,
            googleEvent: googleEvent,
            description: `Evento do Google "${googleEvent.summary}" conflita com "${conflictingLocal.title}"`,
            suggestedResolution: "Revisar horários ou mesclar eventos"
          };
          
          report.conflicts.push(conflict);
          console.log(`⚠️ Conflito detectado: ${conflict.description}`);
        }
      }

      // 5. Identificar eventos órfãos no Google (foram deletados localmente)
      const localEventIds = new Set(localEvents.map(e => e.id));
      const orphanedGoogleEvents = Array.from(imobiproEventsInGoogle).filter(
        id => !localEventIds.has(id)
      );

      if (orphanedGoogleEvents.length > 0) {
        console.log(`🗑️ ${orphanedGoogleEvents.length} eventos órfãos encontrados no Google Calendar`);
        
        for (const orphanedId of orphanedGoogleEvents) {
          const googleEvent = googleEventsByImobiproId.get(orphanedId);
          if (googleEvent) {
            const conflict: SyncConflict = {
              type: ConflictType.ORPHANED_EVENT,
              googleEvent: googleEvent,
              description: `Evento "${googleEvent.summary}" existe no Google mas foi deletado localmente`,
              suggestedResolution: "Manter no Google ou deletar também"
            };
            
            report.conflicts.push(conflict);
          }
        }
      }

      console.log(`✅ Sincronização bidirecional concluída:`, {
        created: report.created,
        updated: report.updated,
        conflicts: report.conflicts.length,
        errors: report.errors.length
      });

    } catch (error) {
      report.success = false;
      const message = error instanceof Error ? error.message : "Erro na sincronização bidirecional";
      report.errors.push(message);
      console.error("❌ Erro na sincronização bidirecional:", error);
    }

    return report;
  }

  /**
   * Verificar se evento local precisa ser atualizado no Google
   */
  private needsEventUpdate(localEvent: PlantaoEvent, googleEvent: GoogleCalendarEvent): boolean {
    // Comparar campos principais
    if (localEvent.title !== googleEvent.summary) return true;
    if ((localEvent.description || '') !== (googleEvent.description || '')) return true;
    
    // Comparar horários
    const localStart = localEvent.startDate;
    const localEnd = localEvent.endDate;
    const googleStart = new Date(googleEvent.start?.dateTime || googleEvent.start?.date || '');
    const googleEnd = new Date(googleEvent.end?.dateTime || googleEvent.end?.date || '');
    
    if (Math.abs(localStart.getTime() - googleStart.getTime()) > 60000) return true; // diferença > 1 minuto
    if (Math.abs(localEnd.getTime() - googleEnd.getTime()) > 60000) return true;
    
    // Comparar status
    const localStatus = localEvent.status === "CANCELADO" ? "cancelled" : "confirmed";
    if (localStatus !== (googleEvent.status || "confirmed")) return true;
    
    return false;
  }

  /**
   * Verificar se dois eventos se sobrepõem temporalmente
   */
  private eventsTimeOverlap(localEvent: PlantaoEvent, googleEvent: GoogleCalendarEvent): boolean {
    const localStart = localEvent.startDate;
    const localEnd = localEvent.endDate;
    const googleStart = new Date(googleEvent.start?.dateTime || googleEvent.start?.date || '');
    const googleEnd = new Date(googleEvent.end?.dateTime || googleEvent.end?.date || '');
    
    return (localStart < googleEnd && localEnd > googleStart);
  }

  /**
   * Resolver conflito automaticamente (estratégias simples)
   */
  public async resolveConflict(
    conflict: SyncConflict, 
    strategy: 'KEEP_LOCAL' | 'KEEP_GOOGLE' | 'MERGE' = 'KEEP_LOCAL'
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (strategy) {
        case 'KEEP_LOCAL':
          if (conflict.localEvent && conflict.googleEvent) {
            // Atualizar evento do Google com dados locais
            const updated = await this.updateEvent(
              'primary',
              conflict.googleEvent.id!,
              this.plantaoEventToGoogleEvent(conflict.localEvent)
            );
            return { 
              success: !!updated, 
              message: `Conflito resolvido: evento do Google atualizado com dados locais` 
            };
          }
          break;
          
        case 'KEEP_GOOGLE':
          // TODO: Implementar atualização do evento local com dados do Google
          return { 
            success: false, 
            message: `Estratégia KEEP_GOOGLE não implementada ainda` 
          };
          
        case 'MERGE':
          // TODO: Implementar merge inteligente
          return { 
            success: false, 
            message: `Estratégia MERGE não implementada ainda` 
          };
          
        default:
          return { 
            success: false, 
            message: `Estratégia de resolução desconhecida: ${strategy}` 
          };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Erro ao resolver conflito: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
    
    return { success: false, message: 'Conflito não pôde ser resolvido' };
  }
}

// Instância singleton
export const googleCalendarService = new GoogleCalendarService();

// Export para uso direto
export default googleCalendarService;