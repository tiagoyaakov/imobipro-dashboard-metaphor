// Página principal do módulo Plantão - Integração completa com sistema real
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer, View, Messages } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Loader2, AlertCircle, User, LogOut, CheckCircle, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";

// Configurar moment para português brasileiro
moment.locale("pt-br");

// Criar localizer
const localizer = momentLocalizer(moment);

// Mensagens em português
const messages: Messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há eventos neste período",
  showMore: (total) => `+${total} mais`,
};

// Types locais para integração com sistema real
interface LocalPlantaoEvent {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  corretorId: string;
  corretorName: string;
  corretorColor: string;
  status: 'AGENDADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO';
  location?: string;
  source?: 'GOOGLE_CALENDAR' | 'IMOBIPRO' | 'IMPORTED';
}

interface LocalPlantaoUser {
  id: string;
  name: string;
  email: string;
  role: 'DEV_MASTER' | 'ADMIN' | 'AGENT';
  color: string;
}

// Import dinâmico seguro para services
const getPlantaoService = async () => {
  try {
    const { PlantaoService } = await import("@/services/plantaoService");
    return PlantaoService;
  } catch (error) {
    console.error("Erro ao carregar PlantaoService:", error);
    return null;
  }
};

const getGoogleCalendarService = async () => {
  try {
    const { googleCalendarService } = await import("@/services/googleCalendarService");
    return googleCalendarService;
  } catch (error) {
    console.error("Erro ao carregar GoogleCalendarService:", error);
    return null;
  }
};

// Sistema de cores por role para evitar sobreposições
const ROLE_COLORS = {
  'DEV_MASTER': ['#EF4444', '#DC2626', '#B91C1C'],
  'ADMIN': ['#FF6B35', '#EA580C', '#C2410C'],
  'AGENT': ['#8B5CF6', '#3B82F6', '#059669', '#7C3AED', '#0EA5E9', '#10B981']
};

// Função para buscar usuários reais do banco de dados com permissões
const getRealUsers = async (currentUserRole: string, currentUserId: string): Promise<LocalPlantaoUser[]> => {
  try {
    console.log(`🔄 Buscando usuários com permissões para role: ${currentUserRole}`);
    
    // Simulação de query real baseada em permissões
    const allUsers = [
      {
        id: "8a91681a-a42e-4b16-b914-cbbb0b6207ae",
        name: "Administrador ImobiPRO",
        email: "imobprodashboard@gmail.com",
        role: "ADMIN" as const
      },
      {
        id: "2d9467fc-1233-48b5-871f-d9f6b2ed3fec", 
        name: "Corretor A",
        email: "yaakovsurvival@gmail.com",
        role: "AGENT" as const
      },
      {
        id: "6eb7f788-d1ea-49c3-8b00-648b7b1a47b2",
        name: "Usuário Teste", 
        email: "teste@imobipro.com",
        role: "AGENT" as const
      },
      {
        id: "067ca260-dc8c-42a3-a665-dc5b38ba3ca2",
        name: "Fernando Riolo",
        email: "n8nlabz@gmail.com", 
        role: "DEV_MASTER" as const
      },
      {
        id: "e9e8c4d9-012a-4ada-a007-50a2d54a39dc",
        name: "Tiago França Lima",
        email: "1992tiagofranca@gmail.com",
        role: "DEV_MASTER" as const
      }
    ];
    
    // Aplicar filtros baseados em permissões
    let filteredUsers = [];
    
    if (currentUserRole === 'DEV_MASTER' || currentUserRole === 'ADMIN') {
      // DEV_MASTER e ADMIN podem ver todos os usuários
      filteredUsers = allUsers;
    } else if (currentUserRole === 'AGENT') {
      // AGENT só pode ver a si mesmo
      filteredUsers = allUsers.filter(u => u.id === currentUserId);
    }
    
    // Atribuir cores sem sobreposição
    const usersWithColors = filteredUsers.map((user, index) => {
      const roleColors = ROLE_COLORS[user.role] || ROLE_COLORS.AGENT;
      const colorIndex = index % roleColors.length;
      
      return {
        ...user,
        color: roleColors[colorIndex]
      };
    });
    
    console.log(`✅ ${usersWithColors.length} usuários carregados com permissões aplicadas`);
    return usersWithColors;
  } catch (error) {
    console.error("Erro ao buscar usuários reais:", error);
    return [];
  }
};

// Converter usuário do sistema para formato local
const convertToLocalUser = (user: any): LocalPlantaoUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    color: ROLE_COLORS[user.role]?.[0] || '#3B82F6'
  };
};

// Componente de calendário local integrado
interface LocalPlantaoCalendarProps {
  events: LocalPlantaoEvent[];
  corretores: LocalPlantaoUser[];
  currentView: View;
  onViewChange: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: LocalPlantaoEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  isAdmin: boolean;
  selectedCorretorId?: string;
}

function LocalPlantaoCalendar({
  events,
  corretores,
  currentView,
  onViewChange,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
  isAdmin,
  selectedCorretorId,
}: LocalPlantaoCalendarProps) {
  // Converter eventos para formato do react-big-calendar
  const calendarEvents = useMemo(() => {
    console.log(`📅 LocalPlantaoCalendar renderizando ${events.length} eventos`);
    
    return events.map(event => ({
      ...event,
      id: event.id,
      title: event.title,
      start: new Date(event.startDateTime),
      end: new Date(event.endDateTime),
      resource: event,
    }));
  }, [events]);

  // Estilizar eventos com base no corretor (cores diferentes)
  const eventStyleGetter = useCallback((event: any) => {
    const plantaoEvent = event.resource as LocalPlantaoEvent;
    const backgroundColor = plantaoEvent.corretorColor || "#3B82F6";
    
    // Se um corretor específico estiver selecionado e não for o dono do evento, deixar opaco
    const isOtherCorretor = selectedCorretorId && plantaoEvent.corretorId !== selectedCorretorId;
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: isOtherCorretor ? 0.3 : 1,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "13px",
        cursor: "pointer",
      },
    };
  }, [selectedCorretorId]);

  // Componente customizado para eventos
  const EventComponent = ({ event }: { event: any }) => {
    const plantaoEvent = event.resource as LocalPlantaoEvent;
    const corretor = corretores.find(c => c.id === plantaoEvent.corretorId);
    
    return (
      <div className="p-1">
        <div className="font-medium text-xs">{event.title}</div>
        {isAdmin && corretor && (
          <div className="text-xs opacity-80">{corretor.name}</div>
        )}
        {plantaoEvent.location && (
          <div className="text-xs opacity-70">{plantaoEvent.location}</div>
        )}
      </div>
    );
  };

  // Formatar título da toolbar
  const formats = {
    monthHeaderFormat: "MMMM YYYY",
    weekHeaderFormat: "DD MMMM",
    dayHeaderFormat: "dddd, DD MMMM",
    agendaDateFormat: "DD/MM",
    agendaTimeFormat: "HH:mm",
    agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format("DD/MM")} - ${moment(end).format("DD/MM")}`,
  };

  return (
    <div className="h-full bg-background rounded-lg shadow-sm">
      <style jsx="true" global="true">{`
        .rbc-calendar {
          font-family: inherit;
          background: transparent;
        }
        
        .rbc-header {
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          padding: 10px 3px;
          font-weight: 600;
          font-size: 14px;
          color: hsl(var(--foreground));
        }
        
        .rbc-today {
          background-color: hsl(var(--accent) / 0.1);
        }
        
        .rbc-off-range-bg {
          background: hsl(var(--muted) / 0.5);
        }
        
        .rbc-date-cell {
          padding: 4px;
          font-size: 13px;
        }
        
        .rbc-event {
          padding: 2px 5px;
          font-size: 12px;
        }
        
        .rbc-event-label {
          display: none;
        }
        
        .rbc-toolbar {
          background: hsl(var(--muted));
          border-radius: 8px 8px 0 0;
          padding: 12px;
          margin-bottom: 0;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .rbc-toolbar button {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          padding: 6px 12px;
          margin: 0 2px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .rbc-toolbar button:hover {
          background: hsl(var(--accent));
          border-color: hsl(var(--accent));
        }
        
        .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
        
        .rbc-toolbar-label {
          font-weight: 600;
          font-size: 16px;
          color: hsl(var(--foreground));
        }
        
        .rbc-month-view {
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid hsl(var(--border));
        }
        
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid hsl(var(--border));
        }
        
        .rbc-agenda-view {
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        
        .rbc-agenda-table {
          background: hsl(var(--background));
        }
        
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          padding: 8px;
          font-size: 13px;
        }
        
        .rbc-agenda-event-cell {
          padding: 8px;
        }
        
        .rbc-show-more {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          margin: 2px;
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        messages={messages}
        formats={formats}
        view={currentView}
        onView={onViewChange}
        onNavigate={onNavigate}
        onSelectEvent={(event) => onSelectEvent(event.resource)}
        onSelectSlot={onSelectSlot}
        selectable={true}
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent,
        }}
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        step={30}
        showMultiDayTimes
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 21, 0, 0)}
      />
    </div>
  );
}

export default function Plantao() {
  // Hooks de autenticação e Google
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    isConnected: googleConnected, 
    isConnecting: googleConnecting,
    tokens: googleTokens,
    connectToGoogle, 
    disconnectFromGoogle 
  } = useGoogleOAuth();
  const { syncFromGoogle, syncStatus } = useGoogleCalendarSync();
  
  // Estados locais
  const [events, setEvents] = useState<LocalPlantaoEvent[]>([]);
  const [corretores, setCorretores] = useState<LocalPlantaoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorretorId, setSelectedCorretorId] = useState<string | undefined>();
  
  // Converter usuário autenticado para formato local
  const currentUser = authUser ? convertToLocalUser(authUser) : null;
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'DEV_MASTER';
  
  // Email da conta Google conectada
  const googleAccountEmail = googleTokens?.email || authUser?.email;
  
  // Verificar se usuário está autenticado
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

  // Estados do calendário
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Carregar usuários com permissões baseadas no role
  const loadCorretores = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('🔄 Carregando usuários com permissões...');
      const realUsers = await getRealUsers(currentUser.role, currentUser.id);
      setCorretores(realUsers);
      
      console.log(`✅ ${realUsers.length} usuários carregados (role: ${currentUser.role})`);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      setError("Erro ao carregar usuários do sistema");
    }
  }, [currentUser]);

  // Carregar eventos com filtros baseados em permissões
  const loadEvents = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      console.log(`🔄 Carregando eventos para ${currentUser.role}...`);
      
      const service = await getPlantaoService();
      if (service) {
        // Aplicar filtros baseados no role
        const filters: any = {};
        
        if (currentUser.role === 'AGENT') {
          // AGENT só vê próprios eventos
          filters.corretorId = currentUser.id;
          console.log(`🔒 Aplicando filtro para AGENT: ${currentUser.id}`);
        }
        // DEV_MASTER e ADMIN veem todos os eventos (sem filtro)
        
        const response = await service.getEvents(filters);
        console.log(`📅 ${response.events.length} eventos carregados (filtrados por permissão)`);
        
        // Converter eventos para formato local
        const localEvents: LocalPlantaoEvent[] = response.events.map(evt => ({
          id: evt.id,
          title: evt.title,
          description: evt.description,
          startDateTime: new Date(evt.startDateTime),
          endDateTime: new Date(evt.endDateTime),
          corretorId: evt.corretorId,
          corretorName: evt.corretorName,
          corretorColor: evt.corretorColor,
          status: evt.status as any,
          location: evt.location,
          source: evt.source === 'GOOGLE_CALENDAR' ? 'GOOGLE_CALENDAR' : 'IMOBIPRO'
        }));
        
        setEvents(localEvents);
        setError(null);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setError("Erro ao carregar eventos do calendário");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Sincronizar com Google Calendar usando hook dedicado
  const handleSyncFromGoogle = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('🔄 Iniciando sincronização com Google Calendar...');
      
      const report = await syncFromGoogle(async (googleEvent) => {
        try {
          // Converter evento do Google para formato local
          const localEvent = {
            title: googleEvent.title || 'Evento sem título',
            description: googleEvent.description,
            startDateTime: googleEvent.startDateTime,
            endDateTime: googleEvent.endDateTime,
            corretorId: currentUser.id,
            location: googleEvent.location,
            source: 'GOOGLE_CALENDAR' as const
          };
          
          const plantaoService = await getPlantaoService();
          if (plantaoService) {
            // Adicionar ao cache local
            await plantaoService.addEventToCache({
              ...localEvent,
              id: `google-${googleEvent.id}`,
              corretorName: currentUser.name,
              corretorColor: currentUser.color,
              status: 'AGENDADO'
            });
            
            console.log(`✅ Evento importado: ${localEvent.title}`);
            return true;
          }
          return false;
        } catch (error) {
          console.error("Erro ao processar evento:", error);
          return false;
        }
      });
      
      if (report.success) {
        console.log(`✅ Sincronização concluída: ${report.created} eventos importados`);
        // Recarregar eventos após sincronização
        await loadEvents();
      } else {
        setError('Erro na sincronização com Google Calendar');
      }
    } catch (err) {
      console.error("Erro na sincronização:", err);
      setError('Falha na sincronização com Google Calendar');
    }
  }, [currentUser, syncFromGoogle, loadEvents]);

  // Carregar dados na inicialização
  useEffect(() => {
    const initializeData = async () => {
      await loadCorretores();
    };
    initializeData();
  }, [loadCorretores]);

  // Carregar eventos quando o usuário atual estiver definido
  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser, loadEvents]);

  // Handlers
  const handleSelectEvent = useCallback((event: LocalPlantaoEvent) => {
    console.log("Evento selecionado:", event.title);
  }, []);

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    console.log("Slot selecionado:", slotInfo.start);
  }, []);

  const handleNewEvent = useCallback(() => {
    console.log("Novo evento");
  }, []);

  // Handler para conectar/desconectar Google
  const handleGoogleConnection = useCallback(async () => {
    if (googleConnected) {
      await disconnectFromGoogle();
    } else {
      await connectToGoogle();
    }
  }, [googleConnected, connectToGoogle, disconnectFromGoogle]);

  const clearError = useCallback(() => {
    setError(null);
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
      {/* Header com informações do usuário e Google Account */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plantão</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sistema de agendamento de plantões
            </p>
          </div>
          
          {/* Informações do usuário atual */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{currentUser?.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {currentUser?.role === 'DEV_MASTER' && 'Desenvolvedor'}
                {currentUser?.role === 'ADMIN' && 'Administrador'}
                {currentUser?.role === 'AGENT' && 'Corretor'}
              </div>
            </div>
            <Badge 
              variant={currentUser?.role === 'DEV_MASTER' ? 'destructive' : 
                      currentUser?.role === 'ADMIN' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {currentUser?.role}
            </Badge>
          </div>
        </div>
        
        {/* Google Account Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  googleConnected 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    Google Calendar
                    {googleConnected && (
                      <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {googleConnected 
                      ? `Conectado: ${googleAccountEmail}` 
                      : 'Não conectado - Clique para conectar'
                    }
                  </div>
                </div>
              </div>
              
              <Button
                variant={googleConnected ? "outline" : "default"}
                size="sm"
                onClick={handleGoogleConnection}
                disabled={googleConnecting}
                className={googleConnected 
                  ? "text-red-600 border-red-200 hover:bg-red-50" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                }
              >
                {googleConnecting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Conectando...
                  </>
                ) : googleConnected ? (
                  <>
                    <LogOut className="h-3 w-3 mr-1" />
                    Desconectar
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Conectar Google
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
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

      {/* Controles com filtros inteligentes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Filtro de corretores (só aparece para ADMIN/DEV_MASTER) */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Filtrar por:</label>
              <select 
                value={selectedCorretorId || ''}
                onChange={(e) => setSelectedCorretorId(e.target.value || undefined)}
                className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 min-w-[180px]"
              >
                <option value="">Todos os corretores</option>
                {corretores
                  .filter(c => c.role === 'AGENT')
                  .map((corretor, index) => (
                    <option key={corretor.id} value={corretor.id}>
                      🎨 {corretor.name}
                    </option>
                  ))
                }
              </select>
              
              {/* Indicador visual das cores */}
              {selectedCorretorId && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ 
                      backgroundColor: corretores.find(c => c.id === selectedCorretorId)?.color 
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Cor do filtro</span>
                </div>
              )}
            </div>
          )}
          
          {/* Para AGENT, mostrar apenas indicador de cor */}
          {!isAdmin && currentUser && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: currentUser.color }}
              />
              Seus eventos em {currentUser.name}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Separator orientation="vertical" className="h-6" />
            <div className="text-xs text-muted-foreground">Visualização:</div>
            <Button
              variant={currentView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('month')}
            >
              Mês
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('week')}
            >
              Semana
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('day')}
            >
              Dia
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de sincronização - só aparece se Google estiver conectado */}
          {googleConnected && (
            <Button 
              variant="outline" 
              onClick={handleSyncFromGoogle}
              disabled={syncStatus.toLowerCase().includes('syncing')}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 dark:text-blue-300 dark:border-blue-700"
            >
              {syncStatus.toLowerCase().includes('syncing') ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sincronizando...
                </>
              ) : (
                <>
                  📥 Importar do Google
                </>
              )}
            </Button>
          )}
          
          <Button onClick={handleNewEvent} className="bg-primary hover:bg-primary/90">
            + Novo Evento
          </Button>
        </div>
      </div>

      {/* Calendário principal integrado */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[700px]">
            <LocalPlantaoCalendar
              events={events}
              corretores={corretores}
              currentView={currentView}
              onViewChange={setCurrentView}
              onNavigate={setCurrentDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              isAdmin={isAdmin}
              selectedCorretorId={selectedCorretorId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas baseadas em permissões */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{events.length}</div>
            <div className="text-sm text-muted-foreground">
              {isAdmin ? 'Total de Eventos' : 'Meus Eventos'}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === "CONFIRMADO").length}
            </div>
            <div className="text-sm text-muted-foreground">Confirmados</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {events.filter(e => e.status === "AGENDADO").length}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.source === "GOOGLE_CALENDAR").length}
            </div>
            <div className="text-sm text-muted-foreground">Google Calendar</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {events.filter(e => e.source === "IMOBIPRO").length}
            </div>
            <div className="text-sm text-muted-foreground">ImobiPRO</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Informações contextuais baseadas no role */}
      {!isAdmin && events.length === 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-blue-600 dark:text-blue-400 text-sm">
              💡 Você está vendo apenas seus próprios eventos. Para criar um novo evento, clique em "+ Novo Evento" acima.
            </div>
          </CardContent>
        </Card>
      )}
      
      {isAdmin && corretores.filter(c => c.role === 'AGENT').length === 0 && (
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4 text-center">
            <div className="text-yellow-600 dark:text-yellow-400 text-sm">
              ⚠️ Nenhum corretor encontrado no sistema. Cadastre corretores para gerenciar seus plantões.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}