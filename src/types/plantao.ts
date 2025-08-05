// Tipos para o módulo de Plantão (Agendamento)

import { UserRole } from "@/types/auth";

// Status possíveis de um evento de plantão
export enum PlantaoEventStatus {
  AGENDADO = "AGENDADO",
  CONFIRMADO = "CONFIRMADO",
  CANCELADO = "CANCELADO",
  CONCLUIDO = "CONCLUIDO"
}

// Status de sincronização com Google Calendar
export enum PlantaoSyncStatus {
  SYNCED = "SYNCED",
  PENDING = "PENDING",
  ERROR = "ERROR"
}

// Estrutura principal de um evento de plantão
export interface PlantaoEvent {
  id: string;
  googleEventId?: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  corretorId: string;
  corretorName: string;
  corretorColor?: string; // Cor para diferenciar corretores no calendário
  status: PlantaoEventStatus;
  location?: string;
  attendees?: string[]; // Lista de emails dos participantes
  recurrenceRule?: string; // Regra de recorrência (RRULE)
  syncStatus: PlantaoSyncStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
}

// Estrutura de um corretor/usuário para o módulo de plantão
export interface PlantaoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  googleCalendarId?: string;
  color: string; // Cor atribuída ao corretor para visualização
  permissions: PlantaoPermission[];
  timezone: string;
  avatar?: string;
}

// Permissões específicas do módulo
export type PlantaoPermission = "read" | "write" | "delete" | "manage_all";

// Filtros para visualização do calendário
export interface PlantaoFilters {
  corretorIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: PlantaoEventStatus[];
  searchTerm?: string;
}

// Estrutura para criação/edição de eventos
export interface PlantaoEventFormData {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  corretorId?: string; // Opcional - para ADMIN selecionar corretor
  location?: string;
  attendees?: string[];
  recurrenceRule?: string;
}

// Resposta da API ao buscar eventos
export interface PlantaoEventsResponse {
  events: PlantaoEvent[];
  totalCount: number;
  syncedCount: number;
  pendingCount: number;
  errorCount: number;
}

// Estrutura para analytics/relatórios
export interface PlantaoAnalytics {
  corretorId: string;
  corretorName: string;
  period: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  completedEvents: number;
  canceledEvents: number;
  occupancyRate: number; // Taxa de ocupação em %
  averageEventDuration: number; // Em minutos
}

// Configurações do módulo
export interface PlantaoConfig {
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  minEventDuration: number; // Em minutos
  maxEventDuration: number; // Em minutos
  allowPastEvents: boolean;
  defaultEventDuration: number; // Em minutos
  businessDays: number[]; // 0-6 (domingo-sábado)
}

// Tipos para integração com Google Calendar
export interface GoogleCalendarAuth {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scope: string[];
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  recurrence?: string[];
}

// Helpers de tipo
export const isAdmin = (user: PlantaoUser): boolean => {
  return user.role === "DEV_MASTER" || user.role === "ADMIN";
};

export const canEditEvent = (user: PlantaoUser, event: PlantaoEvent): boolean => {
  if (isAdmin(user)) return true;
  return event.corretorId === user.id;
};

export const canDeleteEvent = (user: PlantaoUser, event: PlantaoEvent): boolean => {
  if (isAdmin(user)) return true;
  return event.corretorId === user.id && event.status !== PlantaoEventStatus.CONCLUIDO;
};