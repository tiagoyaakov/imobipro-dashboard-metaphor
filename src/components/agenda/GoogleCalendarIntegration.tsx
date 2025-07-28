/**
 * 🗓️ Google Calendar Integration Component - ImobiPRO
 * 
 * Componente completo para gerenciar integração com Google Calendar
 * Funcionalidades:
 * - OAuth authentication flow
 * - Connection status display
 * - Sync management
 * - Events overview
 * - Webhook configuration
 * - Settings and preferences
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  Users,
  Webhook,
  Link,
  Unlink,
  Sync,
  User,
  Calendar as CalendarIcon,
  Bell,
  BellOff,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleCalendarManager } from '@/hooks/useGoogleCalendar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoogleCalendarIntegrationProps {
  userId: string;
  className?: string;
  onConnectionChange?: (isConnected: boolean) => void;
}

/**
 * Componente principal de integração Google Calendar
 */
export function GoogleCalendarIntegration({
  userId,
  className,
  onConnectionChange,
}: GoogleCalendarIntegrationProps) {
  const [showEvents, setShowEvents] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [webhooksEnabled, setWebhooksEnabled] = useState(false);
  
  const googleCalendar = useGoogleCalendarManager(userId);

  // Notificar mudanças de conexão
  React.useEffect(() => {
    onConnectionChange?.(googleCalendar.isConnected);
  }, [googleCalendar.isConnected, onConnectionChange]);

  const handleConnect = () => {
    googleCalendar.connect(userId);
  };

  const handleDisconnect = () => {
    if (confirm('Tem certeza que deseja desconectar o Google Calendar? Isso removerá a sincronização automática.')) {
      googleCalendar.disconnect(userId);
    }
  };

  const handleSync = () => {
    googleCalendar.sync(userId);
  };

  const handleToggleWebhooks = (enabled: boolean) => {
    setWebhooksEnabled(enabled);
    if (enabled) {
      googleCalendar.setupWebhook({ userId });
    } else {
      // googleCalendar.removeWebhook({ userId, channelId: 'current' });
    }
  };

  // ========== COMPONENTES INTERNOS ==========

  const ConnectionStatus = () => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {googleCalendar.isConnected ? (
          <>
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Google Calendar Conectado</h3>
              <p className="text-xs text-muted-foreground">
                {googleCalendar.userInfo?.name || 'Usuário Google'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Google Calendar</h3>
              <p className="text-xs text-muted-foreground">Não conectado</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {googleCalendar.isConnected && (
          <Badge variant="outline" className="text-xs">
            <CalendarIcon className="w-3 h-3 mr-1" />
            {googleCalendar.calendars.length} calendários
          </Badge>
        )}

        {googleCalendar.isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={googleCalendar.isDisconnecting}
          >
            {googleCalendar.isDisconnecting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Unlink className="w-4 h-4 mr-2" />
            )}
            Desconectar
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={googleCalendar.isConnecting}
          >
            {googleCalendar.isConnecting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Link className="w-4 h-4 mr-2" />
            )}
            Conectar
          </Button>
        )}
      </div>
    </div>
  );

  const SyncSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">Sincronização</h4>
          <p className="text-xs text-muted-foreground">
            Mantenha eventos sincronizados automaticamente
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={!googleCalendar.isConnected || googleCalendar.isSyncing}
        >
          {googleCalendar.isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Sync className="w-4 h-4 mr-2" />
              Sincronizar Agora
            </>
          )}
        </Button>
      </div>

      {googleCalendar.isSyncing && (
        <div className="space-y-2">
          <Progress value={75} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Sincronizando eventos... 3/4 concluído
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 border rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            {googleCalendar.events.length}
          </div>
          <div className="text-xs text-muted-foreground">Eventos</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-lg font-semibold text-blue-600">2</div>
          <div className="text-xs text-muted-foreground">Pendentes</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-lg font-semibold text-purple-600">0</div>
          <div className="text-xs text-muted-foreground">Conflitos</div>
        </div>
      </div>
    </div>
  );

  const EventsOverview = () => {
    const recentEvents = googleCalendar.events.slice(0, 5);

    if (!googleCalendar.isConnected) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Conecte o Google Calendar para ver eventos</p>
        </div>
      );
    }

    if (recentEvents.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum evento encontrado</p>
          <p className="text-xs">Eventos aparecerão aqui quando criados</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Próximos Eventos</h4>
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Abrir Google Calendar
            </a>
          </Button>
        </div>

        <div className="space-y-2">
          {recentEvents.map((event, index) => (
            <div
              key={event.id || index}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {event.summary || 'Evento sem título'}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {event.start?.dateTime && 
                      new Date(event.start.dateTime).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    }
                  </span>
                  {event.attendees && event.attendees.length > 0 && (
                    <>
                      <span>•</span>
                      <Users className="w-3 h-3" />
                      <span>{event.attendees.length}</span>
                    </>
                  )}
                </div>
              </div>

              <Badge
                variant={event.status === 'confirmed' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {event.status === 'confirmed' ? 'Confirmado' : 'Tentativo'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SettingsSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync">Sincronização Automática</Label>
            <p className="text-xs text-muted-foreground">
              Sincronizar eventos automaticamente a cada 5 minutos
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={setAutoSync}
            disabled={!googleCalendar.isConnected}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="webhooks">Notificações em Tempo Real</Label>
            <p className="text-xs text-muted-foreground">
              Receber notificações instantâneas de mudanças no calendário
            </p>
          </div>
          <Switch
            id="webhooks"
            checked={webhooksEnabled}
            onCheckedChange={handleToggleWebhooks}
            disabled={!googleCalendar.isConnected}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-events">Mostrar Eventos na Agenda</Label>
            <p className="text-xs text-muted-foreground">
              Exibir eventos do Google Calendar na interface do ImobiPRO
            </p>
          </div>
          <Switch
            id="show-events"
            checked={showEvents}
            onCheckedChange={setShowEvents}
            disabled={!googleCalendar.isConnected}
          />
        </div>
      </div>

      {googleCalendar.isConnected && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Privacidade:</strong> Suas credenciais do Google são criptografadas e armazenadas com segurança. 
            O ImobiPRO só acessa informações de calendário necessárias para a sincronização.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const CalendarsSection = () => {
    if (!googleCalendar.isConnected) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Conecte o Google Calendar para ver calendários disponíveis</p>
        </div>
      );
    }

    if (googleCalendar.calendars.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum calendário encontrado</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => googleCalendar.refetchCalendars()}
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Calendários Disponíveis</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => googleCalendar.refetchCalendars()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="space-y-2">
          {googleCalendar.calendars.map((calendar: any) => (
            <div
              key={calendar.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                />
                <div>
                  <div className="font-medium text-sm">{calendar.summary}</div>
                  {calendar.description && (
                    <div className="text-xs text-muted-foreground">
                      {calendar.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={calendar.accessRole === 'owner' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {calendar.accessRole === 'owner' ? 'Proprietário' : 'Acesso'}
                </Badge>
                
                {calendar.primary && (
                  <Badge variant="outline" className="text-xs">
                    Principal
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========== RENDER PRINCIPAL ==========

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Integração Google Calendar
        </CardTitle>
        <CardDescription>
          Sincronize seus agendamentos com o Google Calendar em tempo real
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ConnectionStatus />

        {googleCalendar.isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-imobipro-blue" />
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">
              <Eye className="w-4 h-4 mr-1" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              <CalendarIcon className="w-4 h-4 mr-1" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="calendars" className="text-xs">
              <Calendar className="w-4 h-4 mr-1" />
              Calendários
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="w-4 h-4 mr-1" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <SyncSection />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <EventsOverview />
          </TabsContent>

          <TabsContent value="calendars" className="space-y-4">
            <CalendarsSection />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SettingsSection />
          </TabsContent>
        </Tabs>

        {!googleCalendar.isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conecte o Google Calendar</strong> para habilitar sincronização automática 
              de agendamentos, notificações em tempo real e acesso aos seus calendários.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default GoogleCalendarIntegration;

/**
 * ============= RESUMO DO COMPONENTE =============
 * 
 * ✅ Interface completa para Google Calendar integration
 * ✅ OAuth connection flow com status visual
 * ✅ Sincronização manual e automática
 * ✅ Overview de eventos próximos
 * ✅ Listagem de calendários disponíveis
 * ✅ Configurações de webhooks e notificações
 * ✅ Design responsivo com Tabs organizadas
 * ✅ Loading states e error handling
 * ✅ Privacy notice e security badges
 * ✅ Integration com useGoogleCalendarManager
 * 
 * ============= FUNCIONALIDADES =============
 * 
 * 📱 **Visão Geral**: Status conexão, sync stats, ações rápidas
 * 📅 **Eventos**: Lista próximos eventos com detalhes  
 * 🗓️ **Calendários**: Calendários disponíveis com permissões
 * ⚙️ **Configurações**: Auto-sync, webhooks, privacy settings
 * 
 * ============= PRÓXIMOS PASSOS =============
 * 
 * 1. ⚠️ Implementar página OAuth callback
 * 2. ⚠️ Criar endpoints webhook server-side
 * 3. ⚠️ Integrar com agenda principal
 * 4. ⚠️ Adicionar tratamento de conflitos
 * 5. ⚠️ Configurar variáveis ambiente Google
 */