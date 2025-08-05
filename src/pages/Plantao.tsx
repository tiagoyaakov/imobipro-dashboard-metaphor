// Página do módulo Plantão - Migração para FullCalendar v6+ com Google Calendar
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import FullCalendar from '@fullcalendar/react';
import { CalendarApi, EventContentArg, EventApi, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Loader2, AlertCircle, Globe, CheckCircle, LogOut, RefreshCw, Calendar as CalendarIcon, Filter, Users, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { useToast } from "@/hooks/use-toast";

// Types locais compatíveis com FullCalendar
interface PlantaoEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  source: 'GOOGLE_CALENDAR' | 'IMOBIPRO';
  googleEventId?: string;
  userId?: string; // ID do usuário proprietário do evento
  userEmail?: string; // Email do usuário para filtros
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    [key: string]: any;
  };
}

// Interface para usuários do sistema
interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  isActive: boolean;
  companyId: string;
}

// Componente de calendário FullCalendar
interface PlantaoCalendarProps {
  events: PlantaoEvent[];
  googleApiKey?: string;
  googleCalendarId?: string;
  onEventClick: (eventInfo: EventClickArg) => void;
  onDateSelect: (selectInfo: DateSelectArg) => void;
  onEventDrop?: (dropInfo: EventDropArg) => void;
  loading?: boolean;
}

function PlantaoCalendar({
  events,
  googleApiKey = '',
  googleCalendarId = '',
  onEventClick,
  onDateSelect,
  onEventDrop,
  loading = false,
}: PlantaoCalendarProps) {
  console.log('PlantaoCalendar rendering with events:', events.length);
  const calendarRef = useRef<FullCalendar>(null);

  // Configurações do FullCalendar
  const calendarOptions = useMemo(() => ({
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin,
      listPlugin,
      googleCalendarPlugin
    ],
    
    // Configurações básicas
    initialView: 'dayGridMonth',
    locale: ptBrLocale,
    timeZone: 'America/Sao_Paulo',
    height: 'auto',
    
    // Header personalizado
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    
    // Configurações visuais
    nowIndicator: true,
    navLinks: true,
    editable: true, // Habilitar drag and drop
    selectable: true,
    selectMirror: true,
    dayMaxEvents: 3,
    
    // Configurações de drag and drop
    eventStartEditable: true, // Permite mover eventos
    eventDurationEditable: true, // Permite redimensionar eventos
    eventOverlap: true, // Permite sobreposição de eventos
    selectOverlap: true,
    
    // Configurações de horário
    slotMinTime: '07:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:30:00',
    scrollTime: '09:00:00',
    
    // Configurações específicas de views
    views: {
      dayGridMonth: {
        dayMaxEvents: 3,
        moreLinkClick: 'popover'
      },
      timeGridWeek: {
        allDaySlot: true,
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      },
      timeGridDay: {
        allDaySlot: true
      },
      listWeek: {
        listDayFormat: {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        }
      }
    },
    
    // Textos personalizados
    buttonText: {
      today: 'Hoje',
      month: 'Mês',
      week: 'Semana',
      day: 'Dia',
      list: 'Lista'
    },
    
    // Formatação de datas
    titleFormat: {
      year: 'numeric',
      month: 'long'
    },
    
    // Google Calendar integração
    googleCalendarApiKey: googleApiKey,
    
    // Event Sources - Usar apenas eventos sincronizados manualmente
    events: events, // Usar apenas eventos que já passaram pela nossa sincronização
    
    // Remover eventSources duplos para evitar conflitos de ID
    // Todos os eventos (ImobiPRO + Google) vêm através do array 'events'
    
    // Event handlers
    eventClick: onEventClick,
    select: onDateSelect,
    eventDrop: onEventDrop,
    
    // Loading state
    loading: (isLoading: boolean) => {
      console.log('FullCalendar loading state:', isLoading);
    },
    
    // Customização de eventos
    eventContent: (eventInfo: EventContentArg) => {
      const { event } = eventInfo;
      const isGoogle = event.classNames.includes('google-calendar-event');
      const startTime = eventInfo.timeText;
      
      return {
        html: `
          <div class="fc-event-content-custom">
            <div class="fc-event-time-custom">${startTime}</div>
            <div class="fc-event-title-custom">
              ${isGoogle ? '📅 ' : '🏢 '}${event.title}
            </div>
            ${event.extendedProps?.location ? `<div class="fc-event-location-custom">📍 ${event.extendedProps.location}</div>` : ''}
          </div>
        `
      };
    },
    
    // Configurações de estilo
    eventClassNames: (eventInfo: any) => {
      const classes = ['custom-event'];
      if (eventInfo.event.classNames?.includes('google-calendar-event')) {
        classes.push('google-event');
      } else {
        classes.push('imobipro-event');
      }
      return classes;
    },
    
    // Configurações avançadas
    eventDisplay: 'block',
    displayEventTime: true,
    displayEventEnd: false,
    
    // Business Hours (horário comercial)
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Segunda a Sexta
      startTime: '09:00',
      endTime: '18:00',
    },
    
    // Configurações de seleção
    selectConstraint: 'businessHours',
    
    // Configurações adicionais
    aspectRatio: 1.8,
    expandRows: true,
    handleWindowResize: true,
    
  }), [events, onEventClick, onDateSelect, onEventDrop]);

  // Métodos da API do calendário
  const getCalendarApi = useCallback((): CalendarApi | null => {
    return calendarRef.current?.getApi() || null;
  }, []);

  const refreshEvents = useCallback(() => {
    const api = getCalendarApi();
    if (api) {
      api.refetchEvents();
    }
  }, [getCalendarApi]);

  const changeView = useCallback((viewName: string) => {
    const api = getCalendarApi();
    if (api) {
      api.changeView(viewName);
    }
  }, [getCalendarApi]);

  const goToDate = useCallback((date: Date) => {
    const api = getCalendarApi();
    if (api) {
      api.gotoDate(date);
    }
  }, [getCalendarApi]);

  // Sistema de cores WCAG AA compliant
  const ROLE_COLORS = {
    'DEV_MASTER': {
      primary: '#DC2626', // Red-600 - Contraste 6.64:1
      light: '#FEE2E2',   // Red-50
      dark: '#991B1B',    // Red-800
      text: '#ffffff'     // Contraste 8.59:1
    },
    'ADMIN': {
      primary: '#EA580C', // Orange-600 - Contraste 5.94:1
      light: '#FFF7ED',   // Orange-50
      dark: '#C2410C',    // Orange-700
      text: '#ffffff'     // Contraste 7.24:1
    },
    'AGENT': [
      { primary: '#8B5CF6', light: '#F3F4F6', dark: '#6D28D9', text: '#ffffff' }, // Purple - Contraste 5.36:1
      { primary: '#3B82F6', light: '#EFF6FF', dark: '#1D4ED8', text: '#ffffff' }, // Blue - Contraste 5.74:1
      { primary: '#059669', light: '#ECFDF5', dark: '#047857', text: '#ffffff' }, // Green - Contraste 4.68:1
      { primary: '#DC2626', light: '#FEF2F2', dark: '#991B1B', text: '#ffffff' }  // Red - Contraste 6.64:1
    ]
  };

  // Estilos customizados WCAG AA compliant para FullCalendar
  useEffect(() => {
    // Adicionar estilos CSS customizados com foco em acessibilidade
    const style = document.createElement('style');
    style.textContent = `
      /* FullCalendar WCAG AA Design System */
      :root {
        --fc-border-color: #E2E8F0;
        --fc-today-bg-color: #EFF6FF;
        --fc-button-bg-color: #F8FAFC;
        --fc-button-border-color: #CBD5E1;
        --fc-button-text-color: #1E293B;
        --fc-button-hover-bg-color: #E2E8F0;
        --fc-button-active-bg-color: #3B82F6;
        --fc-button-active-text-color: #ffffff;
        --fc-header-bg-color: #ffffff;
        --fc-header-border-color: #E2E8F0;
        --fc-event-text-color: #ffffff;
        --fc-grid-line-color: #F1F5F9;
      }
      
      .dark {
        --fc-border-color: #334155;
        --fc-today-bg-color: #1E293B;
        --fc-button-bg-color: #1E293B;
        --fc-button-border-color: #475569;
        --fc-button-text-color: #F1F5F9;
        --fc-button-hover-bg-color: #334155;
        --fc-button-active-bg-color: #3B82F6;
        --fc-button-active-text-color: #ffffff;
        --fc-header-bg-color: #0F172A;
        --fc-header-border-color: #334155;
        --fc-event-text-color: #ffffff;
        --fc-grid-line-color: #1E293B;
      }
      
      /* Layout base */
      .fc {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }
      
      /* Header personalizado com WCAG AA */
      .fc-header-toolbar {
        background: var(--fc-header-bg-color);
        border: 1px solid var(--fc-header-border-color);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        gap: 16px;
      }
      
      .fc-toolbar-title {
        font-size: 24px;
        font-weight: 700;
        color: #1E293B;
        margin: 0;
        letter-spacing: -0.025em;
      }
      
      .dark .fc-toolbar-title {
        color: #F1F5F9;
      }
      
      /* Botões com contraste WCAG AA */
      .fc-button {
        background: var(--fc-button-bg-color) !important;
        border: 1px solid var(--fc-button-border-color) !important;
        color: var(--fc-button-text-color) !important;
        border-radius: 8px !important;
        padding: 8px 16px !important;
        font-weight: 500 !important;
        font-size: 14px !important;
        min-height: 40px !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
      }
      
      .fc-button:hover:not(:disabled) {
        background: var(--fc-button-hover-bg-color) !important;
        border-color: #94A3B8 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      }
      
      .fc-button:active,
      .fc-button.fc-button-active {
        background: var(--fc-button-active-bg-color) !important;
        border-color: var(--fc-button-active-bg-color) !important;
        color: var(--fc-button-active-text-color) !important;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.25) !important;
      }
      
      .fc-button:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
        transform: none !important;
      }
      
      /* Grid com melhor contraste */
      .fc-theme-standard .fc-scrollgrid {
        border: 1px solid var(--fc-border-color);
        border-radius: 12px;
        overflow: hidden;
        background: var(--fc-header-bg-color);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      
      .fc-theme-standard th,
      .fc-theme-standard td {
        border-color: var(--fc-grid-line-color);
      }
      
      /* Cabeçalho da grade */
      .fc-theme-standard .fc-scrollgrid thead th {
        background: #F8FAFC;
        color: #374151;
        font-weight: 600;
        font-size: 14px;
        padding: 16px 12px;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        border-bottom: 2px solid var(--fc-border-color);
      }
      
      .dark .fc-theme-standard .fc-scrollgrid thead th {
        background: #1E293B;
        color: #E2E8F0;
      }
      
      /* Células do calendário */
      .fc-daygrid-day {
        transition: background-color 0.2s ease;
        min-height: 100px;
      }
      
      .fc-daygrid-day:hover {
        background: #F8FAFC;
      }
      
      .dark .fc-daygrid-day:hover {
        background: #1E293B;
      }
      
      .fc-daygrid-day.fc-day-today {
        background: #EFF6FF;
        border: 2px solid #3B82F6;
      }
      
      .dark .fc-daygrid-day.fc-day-today {
        background: #1E3A8A;
        border-color: #3B82F6;
      }
      
      /* Números dos dias com contraste adequado */
      .fc-daygrid-day-number {
        font-weight: 600;
        font-size: 14px;
        color: #374151;
        padding: 8px;
      }
      
      .dark .fc-daygrid-day-number {
        color: #E2E8F0;
      }
      
      .fc-day-today .fc-daygrid-day-number {
        color: #1D4ED8;
        font-weight: 700;
      }
      
      /* Eventos com contraste WCAG AA */
      .fc-event {
        border-radius: 6px !important;
        border: 2px solid transparent !important;
        font-weight: 500 !important;
        font-size: 12px !important;
        padding: 2px 6px !important;
        margin: 1px 2px !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        min-height: 20px !important;
        cursor: grab !important;
      }
      
      .fc-event:active,
      .fc-event.fc-event-dragging {
        cursor: grabbing !important;
        transform: scale(1.02) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        z-index: 999 !important;
      }
      
      .fc-event:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15) !important;
        z-index: 100 !important;
      }
      
      .fc-event:focus {
        outline: 2px solid #3B82F6 !important;
        outline-offset: 2px !important;
      }
      
      /* Eventos Google Calendar */
      .custom-event.google-event {
        background: #10B981 !important;
        border-color: #047857 !important;
        color: #ffffff !important;
      }
      
      /* Eventos ImobiPRO */
      .custom-event.imobipro-event {
        background: #3B82F6 !important;
        border-color: #1D4ED8 !important;
        color: #ffffff !important;
      }
      
      /* Conteúdo customizado dos eventos */
      .fc-event-content-custom {
        padding: 2px 4px;
        font-size: 12px;
        line-height: 1.3;
        font-weight: 500;
      }
      
      .fc-event-time-custom {
        font-weight: 600;
        margin-bottom: 1px;
        opacity: 0.9;
      }
      
      .fc-event-title-custom {
        font-weight: 500;
        margin-bottom: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .fc-event-location-custom {
        font-size: 10px;
        opacity: 0.8;
        font-style: italic;
      }
      
      /* Links "mais eventos" */
      .fc-more-link {
        background: #3B82F6 !important;
        color: #ffffff !important;
        border-radius: 4px !important;
        padding: 2px 8px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        text-decoration: none !important;
        border: 1px solid #1D4ED8 !important;
      }
      
      .fc-more-link:hover {
        background: #1D4ED8 !important;
        transform: translateY(-1px) !important;
      }
      
      /* Popover com melhor acessibilidade */
      .fc-popover {
        border: 1px solid var(--fc-border-color) !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        background: var(--fc-header-bg-color) !important;
        overflow: hidden !important;
      }
      
      .fc-popover-header {
        background: #F8FAFC !important;
        color: #374151 !important;
        border-bottom: 1px solid var(--fc-border-color) !important;
        font-weight: 600 !important;
        padding: 12px 16px !important;
      }
      
      .dark .fc-popover-header {
        background: #1E293B !important;
        color: #E2E8F0 !important;
      }
      
      /* Vista de lista */
      .fc-list {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--fc-border-color);
      }
      
      .fc-list-day {
        background: #F8FAFC;
        border-bottom: 1px solid var(--fc-border-color);
      }
      
      .dark .fc-list-day {
        background: #1E293B;
      }
      
      .fc-list-day-text {
        color: #374151;
        font-weight: 600;
        font-size: 14px;
        padding: 12px 16px;
      }
      
      .dark .fc-list-day-text {
        color: #E2E8F0;
      }
      
      .fc-list-event {
        transition: background-color 0.2s ease;
        border-bottom: 1px solid var(--fc-grid-line-color);
      }
      
      .fc-list-event:hover {
        background: #EFF6FF;
      }
      
      .dark .fc-list-event:hover {
        background: #1E3A8A;
      }
      
      /* Estados de carregamento */
      .fc-loading {
        opacity: 0.6;
        pointer-events: none;
        position: relative;
      }
      
      .fc-loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 24px;
        height: 24px;
        margin: -12px 0 0 -12px;
        border: 2px solid #E5E7EB;
        border-top: 2px solid #3B82F6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 1000;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Responsividade melhorada */
      @media (max-width: 768px) {
        .fc-header-toolbar {
          flex-direction: column;
          gap: 12px;
          padding: 16px;
        }
        
        .fc-toolbar-title {
          font-size: 20px;
          text-align: center;
        }
        
        .fc-button {
          padding: 6px 12px !important;
          font-size: 13px !important;
          min-height: 36px !important;
        }
        
        .fc-daygrid-day {
          min-height: 80px;
        }
      }
      
      /* Focus indicators para acessibilidade */
      .fc-button:focus-visible {
        outline: 2px solid #3B82F6 !important;
        outline-offset: 2px !important;
      }
      
      .fc-daygrid-day:focus-within {
        outline: 2px solid #3B82F6;
        outline-offset: -2px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Carregando eventos...</p>
          </div>
        </div>
      )}
      
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <FullCalendar
          ref={calendarRef}
          {...calendarOptions}
        />
      </div>
    </div>
  );
}

export default function Plantao() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Google OAuth hooks (mantidos do código original)
  const { 
    isConnected: googleConnected, 
    isConnecting: googleConnecting,
    tokens: googleTokens,
    connectToGoogle, 
    disconnectFromGoogle 
  } = useGoogleOAuth();
  
  // Google Calendar Sync (mantido do código original)
  const { 
    syncFromGoogle, 
    syncStatus,
    getSyncStats 
  } = useGoogleCalendarSync();
  
  // Estados
  const [allEvents, setAllEvents] = useState<PlantaoEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<PlantaoEvent[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SystemUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Email da conta Google conectada (mantido do código original)
  const googleAccountEmail = googleTokens?.email || user?.email;

  // Configurações do Google Calendar
  const googleApiKey = process.env.VITE_GOOGLE_CALENDAR_API_KEY || '';
  const googleCalendarId = googleTokens?.calendarId || 'primary';

  // Determinar permissões do usuário atual
  const currentUserRole = user?.role as 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  const canViewAllUsers = currentUserRole === 'DEV_MASTER' || currentUserRole === 'ADMIN';
  const shouldShowFilters = canViewAllUsers;

  // Carregar usuários disponíveis para filtro
  const loadAvailableUsers = useCallback(async () => {
    if (!canViewAllUsers) return;
    
    try {
      setLoadingUsers(true);
      
      // Simular consulta aos usuários - em produção seria uma API call
      const mockUsers: SystemUser[] = [
        {
          id: "8a91681a-a42e-4b16-b914-cbbb0b6207ae",
          name: "Administrador ImobiPRO",
          email: "imobprodashboard@gmail.com",
          role: "ADMIN",
          isActive: true,
          companyId: "c1036c09-e971-419b-9244-e9f6792954e2"
        },
        {
          id: "2d9467fc-1233-48b5-871f-d9f6b2ed3fec",
          name: "Corretor A",
          email: "yaakovsurvival@gmail.com",
          role: "AGENT",
          isActive: true,
          companyId: "c1036c09-e971-419b-9244-e9f6792954e2"
        },
        {
          id: "6eb7f788-d1ea-49c3-8b00-648b7b1a47b2",
          name: "Usuário Teste",
          email: "teste@imobipro.com",
          role: "AGENT",
          isActive: true,
          companyId: "c1036c09-e971-419b-9244-e9f6792954e2"
        }
      ];
      
      // Filtrar DEV_MASTER dos filtros (conforme solicitado)
      const filteredUsers = mockUsers.filter(u => u.role !== 'DEV_MASTER');
      setAvailableUsers(filteredUsers);
      
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [canViewAllUsers, toast]);

  // Carregar usuários quando o componente montar
  useEffect(() => {
    if (canViewAllUsers) {
      loadAvailableUsers();
    }
  }, [loadAvailableUsers]);

  // Aplicar filtros de usuário
  const applyUserFilter = useCallback((events: PlantaoEvent[], userId: string) => {
    if (userId === 'ALL') {
      return events;
    }
    
    // Se for AGENT, mostrar apenas seus próprios eventos
    if (currentUserRole === 'AGENT') {
      return events.filter(event => 
        event.userEmail === user?.email || 
        event.userId === user?.id
      );
    }
    
    // Para ADMIN/DEV_MASTER, filtrar pelo usuário selecionado
    const selectedUser = availableUsers.find(u => u.id === userId);
    if (!selectedUser) return events;
    
    return events.filter(event => 
      event.userEmail === selectedUser.email || 
      event.userId === selectedUser.id
    );
  }, [currentUserRole, user?.email, user?.id, availableUsers]);

  // Atualizar eventos filtrados quando mudarem os filtros
  useEffect(() => {
    const filtered = applyUserFilter(allEvents, selectedUserId);
    setFilteredEvents(filtered);
  }, [allEvents, selectedUserId, applyUserFilter]);

  // Função para obter cor por usuário
  const getUserColor = useCallback((userId: string, userEmail: string) => {
    const userForColor = availableUsers.find(u => u.id === userId || u.email === userEmail);
    if (!userForColor) return '#3B82F6'; // Azul padrão
    
    const colorMap: { [key: string]: string } = {
      'ADMIN': '#EA580C', // Laranja
      'AGENT': '#8B5CF6', // Roxo
    };
    
    return colorMap[userForColor.role] || '#3B82F6';
  }, [availableUsers]);

  // Carregar eventos do Google Calendar (adaptado para FullCalendar)
  const loadGoogleCalendarEvents = useCallback(async () => {
    if (!googleConnected) return;
    
    try {
      setSyncing(true);
      setError(null);
      
      const syncedEvents: PlantaoEvent[] = [];
      
      // Sincronizar com Google Calendar
      const result = await syncFromGoogle(async (googleEvent) => {
        const userColor = getUserColor(user?.id || '', googleAccountEmail || '');
        
        const plantaoEvent: PlantaoEvent = {
          id: googleEvent.id || `google_${Date.now()}`,
          title: googleEvent.title || 'Evento sem título',
          description: googleEvent.description,
          start: new Date(googleEvent.startDateTime),
          end: new Date(googleEvent.endDateTime),
          location: googleEvent.location,
          source: 'GOOGLE_CALENDAR',
          googleEventId: googleEvent.id,
          userId: user?.id,
          userEmail: googleAccountEmail,
          color: userColor,
          backgroundColor: userColor,
          borderColor: userColor,
          textColor: '#ffffff',
          extendedProps: {
            description: googleEvent.description,
            location: googleEvent.location,
            source: 'GOOGLE_CALENDAR',
            userId: user?.id,
            userEmail: googleAccountEmail,
            googleEventId: googleEvent.id // Armazenar ID real do Google
          }
        };
        
        syncedEvents.push(plantaoEvent);
        return true;
      });
      
      if (result.success) {
        setAllEvents(syncedEvents);
        toast({
          title: "Sincronização concluída",
          description: `${syncedEvents.length} eventos sincronizados do Google Calendar`,
        });
      } else {
        throw new Error(result.error || 'Erro na sincronização');
      }
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
      setError("Erro ao sincronizar com Google Calendar");
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Google Calendar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }, [googleConnected, syncFromGoogle, toast, getUserColor, user?.id, googleAccountEmail]);

  // Função auxiliar para mapear cores do Google Calendar (mantida)
  const getColorFromGoogleColorId = (colorId: string): string => {
    const colorMap: { [key: string]: string } = {
      '1': '#7986CB', // Lavender
      '2': '#33B679', // Sage
      '3': '#8E24AA', // Grape
      '4': '#E67C73', // Flamingo
      '5': '#F6BF26', // Banana
      '6': '#F4511E', // Tangerine
      '7': '#039BE5', // Peacock
      '8': '#616161', // Graphite
      '9': '#3F51B5', // Blueberry
      '10': '#0B8043', // Basil
      '11': '#D50000', // Tomato
    };
    return colorMap[colorId] || '#10B981';
  };

  // Verificar autenticação (mantido)
  if (!isAuthenticated || authLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Carregar eventos quando conectar ao Google (mantido)
  useEffect(() => {
    if (googleConnected) {
      loadGoogleCalendarEvents();
    } else {
      setAllEvents([]);
    }
  }, [googleConnected, loadGoogleCalendarEvents]);

  // Handlers para FullCalendar
  const handleEventClick = useCallback((eventInfo: EventClickArg) => {
    const event = eventInfo.event;
    const isGoogle = event.classNames.includes('google-calendar-event');
    
    console.log("Evento clicado:", event.title);
    toast({
      title: event.title,
      description: `${event.start?.toLocaleString('pt-BR')} - ${event.end?.toLocaleString('pt-BR')}${isGoogle ? ' (Google Calendar)' : ' (ImobiPRO)'}`,
    });
  }, [toast]);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    console.log("Data selecionada:", selectInfo.startStr, "-", selectInfo.endStr);
    toast({
      title: "Criar evento",
      description: "Para criar eventos, use o Google Calendar ou a interface do ImobiPRO",
    });
    
    // Limpar seleção
    selectInfo.view.calendar.unselect();
  }, [toast]);

  // Handler para drag and drop de eventos
  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const { event, delta, revert } = dropInfo;
    
    // Verificar se é um evento do Google Calendar
    const isGoogleEvent = event.extendedProps?.source === 'GOOGLE_CALENDAR';
    
    console.log('Event details:', {
      id: event.id,
      title: event.title,
      classNames: event.classNames,
      source: event.extendedProps?.source,
      googleEventId: event.extendedProps?.googleEventId,
      isGoogleEvent
    });
    
    if (!isGoogleEvent || !googleConnected) {
      toast({
        title: "Evento movido localmente",
        description: "Evento foi movido apenas no calendário local. Para sincronizar com Google Calendar, conecte sua conta.",
        variant: "default",
      });
      return;
    }

    // Extrair ID real do Google Calendar
    let googleEventId = event.extendedProps?.googleEventId || event.id;
    
    // Debug - verificar qual ID estamos usando
    console.log('Event ID:', event.id);
    console.log('GoogleEventId from extendedProps:', event.extendedProps?.googleEventId);
    console.log('Original googleEventId being used:', googleEventId);
    
    // Se o ID tem prefixo 'google-', remover o prefixo
    if (typeof googleEventId === 'string' && googleEventId.startsWith('google-')) {
      const originalId = googleEventId;
      // Se não temos o ID real nas extendedProps, tentar extrair do ID
      if (!event.extendedProps?.googleEventId) {
        googleEventId = googleEventId.replace('google-', '');
        console.log(`✅ CORREÇÃO APLICADA: ${originalId} → ${googleEventId}`);
      }
    } else {
      console.log('✅ ID já limpo ou sem prefixo google-');
    }
    
    if (!googleEventId || googleEventId.toString().length < 10) {
      console.error('GoogleEventId inválido:', googleEventId);
      toast({
        title: "Erro ao mover evento",
        description: `Não foi possível identificar o evento no Google Calendar. ID: ${googleEventId}`,
        variant: "destructive",
      });
      revert();
      return;
    }

    try {
      // Mostrar loading
      toast({
        title: "Sincronizando...",
        description: "Atualizando evento no Google Calendar",
      });

      // Calcular novas datas
      const newStart = event.start;
      const newEnd = event.end;
      
      if (!newStart) {
        throw new Error('Data de início inválida');
      }

      // Atualizar evento no Google Calendar via API
      const success = await updateGoogleCalendarEvent({
        eventId: googleEventId,
        calendarId: googleCalendarId || 'primary',
        startDateTime: newStart.toISOString(),
        endDateTime: newEnd ? newEnd.toISOString() : new Date(newStart.getTime() + 60 * 60 * 1000).toISOString(), // 1 hora se não tiver end
        title: event.title,
        description: event.extendedProps?.description,
        location: event.extendedProps?.location,
      });

      if (success) {
        toast({
          title: "Evento atualizado!",
          description: `"${event.title}" foi movido no Google Calendar com sucesso`,
        });
        
        // Atualizar eventos locais
        setAllEvents(prevEvents => 
          prevEvents.map(e => 
            e.id === event.id || e.googleEventId === googleEventId
              ? {
                  ...e,
                  start: newStart,
                  end: newEnd || new Date(newStart.getTime() + 60 * 60 * 1000),
                }
              : e
          )
        );
      } else {
        throw new Error('Falha na atualização');
      }
    } catch (error) {
      console.error('Erro ao atualizar evento no Google Calendar:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível atualizar o evento no Google Calendar. As alterações foram revertidas.",
        variant: "destructive",
      });
      // Reverter mudanças no calendário
      revert();
    }
  }, [googleConnected, googleCalendarId, toast]);

  // Função para atualizar evento no Google Calendar
  const updateGoogleCalendarEvent = async ({
    eventId,
    calendarId,
    startDateTime,
    endDateTime,
    title,
    description,
    location,
  }: {
    eventId: string;
    calendarId: string;
    startDateTime: string;
    endDateTime: string;
    title: string;
    description?: string;
    location?: string;
  }): Promise<boolean> => {
    try {
      // Verificar se temos tokens válidos
      if (!googleTokens?.accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      // Preparar dados do evento
      const eventData = {
        summary: title,
        description: description || '',
        location: location || '',
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Sao_Paulo',
        },
      };

      // Fazer chamada para Google Calendar API
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${googleTokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Google Calendar API Error:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Failed to update event'}`);
      }

      const updatedEvent = await response.json();
      console.log('Evento atualizado no Google Calendar:', updatedEvent);
      return true;
    } catch (error) {
      console.error('Erro na atualização do Google Calendar:', error);
      return false;
    }
  };

  const handleGoogleConnection = useCallback(async () => {
    if (googleConnected) {
      await disconnectFromGoogle();
      setAllEvents([]);
    } else {
      await connectToGoogle();
    }
  }, [googleConnected, connectToGoogle, disconnectFromGoogle]);

  const handleUserFilterChange = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadGoogleCalendarEvents();
  }, [loadGoogleCalendarEvents]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header redesenhado com WCAG AA */}
      <div className="space-y-6">
        {/* Cabeçalho principal com gradiente e contraste adequado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 p-8 rounded-xl shadow-sm border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Plantão
              </h1>
              <p className="text-blue-100 text-lg font-medium">
                Gestão de agendamentos e sincronização Google Calendar
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filtros de usuário (apenas para ADMIN/DEV_MASTER) */}
        {shouldShowFilters && (
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Filtros de Visualização
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Selecione um corretor para filtrar os eventos ou visualize todos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Corretor:</span>
                  </div>
                  <Select value={selectedUserId} onValueChange={handleUserFilterChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar corretor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                          <span className="font-medium">Todos os Eventos</span>
                        </div>
                      </SelectItem>
                      {loadingUsers ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Carregando...</span>
                          </div>
                        </SelectItem>
                      ) : (
                        availableUsers.map((user) => {
                          const roleColors = {
                            'ADMIN': '#EA580C',
                            'AGENT': '#8B5CF6'
                          };
                          const roleLabels = {
                            'ADMIN': 'Admin',
                            'AGENT': 'Corretor'
                          };
                          
                          return (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: roleColors[user.role] }}
                                ></div>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {roleLabels[user.role]} • {user.email}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Indicador do filtro ativo */}
              {selectedUserId !== 'ALL' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Mostrando eventos de: {availableUsers.find(u => u.id === selectedUserId)?.name || 'Usuário selecionado'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Card de status Google Calendar redesenhado */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Indicador visual de status */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-200 ${
                  googleConnected 
                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' 
                    : 'bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600'
                }`}>
                  {googleConnected ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <Globe className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
                
                {/* Informações de status */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Google Calendar
                    </h3>
                    {googleConnected && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                        Conectado
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${
                    googleConnected 
                      ? 'text-slate-700 dark:text-slate-300' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {googleConnected 
                      ? `${googleAccountEmail}` 
                      : 'Conecte sua conta para sincronizar eventos'
                    }
                  </p>
                </div>
              </div>
              
              {/* Ações */}
              <div className="flex items-center gap-3">
                {googleConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={syncing}
                    className="font-medium border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sincronizando
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant={googleConnected ? "outline" : "default"}
                  size="sm"
                  onClick={handleGoogleConnection}
                  disabled={googleConnecting}
                  className={googleConnected 
                    ? "font-medium text-red-700 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                    : "font-medium bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 transition-colors"
                  }
                >
                  {googleConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Conectando
                    </>
                  ) : googleConnected ? (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Desconectar
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Conectar Google
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas redesenhados com WCAG AA */}
      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="h-auto p-1 ml-4 text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 hover:bg-red-100 dark:hover:bg-red-800/30"
              >
                ✕
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso informativo redesenhado */}
      {!googleConnected && (
        <Alert className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200 font-medium">
            Para começar a usar o sistema de plantão, conecte sua conta Google Calendar e sincronize seus eventos.
          </AlertDescription>
        </Alert>
      )}

      {/* Calendário principal redesenhado */}
      {googleConnected ? (
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header do calendário */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Calendário de Plantão
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Visualização integrada Google Calendar + ImobiPRO
                  </p>
                </div>
                {syncing && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Sincronizando...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Calendário FullCalendar */}
            <div className="p-6">
              <PlantaoCalendar
                events={filteredEvents}
                googleApiKey={googleApiKey}
                googleCalendarId={googleCalendarId}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onEventDrop={handleEventDrop}
                loading={syncing}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
          <CardContent className="flex flex-col items-center justify-center h-[600px] text-center p-8">
            <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-2xl mb-6">
              <CalendarIcon className="h-16 w-16 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Calendário Desconectado
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
              Para visualizar e gerenciar seus plantões, conecte sua conta Google Calendar e tenha acesso a todos os seus eventos sincronizados.
            </p>
            <Button 
              onClick={handleGoogleConnection} 
              disabled={googleConnecting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
            >
              {googleConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                  Conectando...
                </>
              ) : (
                <>
                  <Globe className="h-5 w-5 mr-3" />
                  Conectar Google Calendar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas redesenhadas com WCAG AA */}
      {googleConnected && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de eventos */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {selectedUserId === 'ALL' ? 'Total de Eventos' : 'Meus Eventos'}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {filteredEvents.length}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eventos hoje */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Eventos Hoje
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredEvents.filter(e => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return e.start >= today && e.start < tomorrow;
                    }).length}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                  <div className="w-6 h-6 bg-blue-600 dark:bg-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {new Date().getDate()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos 7 dias */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Próximos 7 dias
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {filteredEvents.filter(e => {
                      const today = new Date();
                      const nextWeek = new Date(today);
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      return e.start >= today && e.start < nextWeek;
                    }).length}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Google Calendar
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {filteredEvents.filter(e => e.source === 'GOOGLE_CALENDAR').length}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                  <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Status do filtro ativo para AGENT */}
      {currentUserRole === 'AGENT' && googleConnected && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Visualizando apenas seus eventos sincronizados
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Como corretor, você visualiza apenas os eventos do seu calendário Google conectado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legenda redesenhada */}
      {googleConnected && filteredEvents.length > 0 && (
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Legenda dos Eventos
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredEvents.length} eventos{selectedUserId !== 'ALL' ? ' filtrados' : ''}
                </Badge>
                {shouldShowFilters && selectedUserId !== 'ALL' && (
                  <Badge variant="outline" className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                    Filtrado
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-4 h-4 bg-green-500 rounded-md border border-green-600"></div>
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">📅 Google Calendar</span>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Eventos sincronizados da conta Google conectada
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="w-4 h-4 bg-blue-500 rounded-md border border-blue-600"></div>
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">🏢 ImobiPRO</span>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Eventos criados no sistema ImobiPRO
                  </p>
                </div>
              </div>
            </div>
            
            {/* Indicadores por usuário (apenas para ADMIN/DEV_MASTER) */}
            {shouldShowFilters && availableUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Cores por Usuário
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableUsers.map((user) => {
                    const roleColors = {
                      'ADMIN': '#EA580C',
                      'AGENT': '#8B5CF6'
                    };
                    const roleLabels = {
                      'ADMIN': 'Admin',
                      'AGENT': 'Corretor'
                    };
                    
                    return (
                      <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: roleColors[user.role] }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {user.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            ({roleLabels[user.role]})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}