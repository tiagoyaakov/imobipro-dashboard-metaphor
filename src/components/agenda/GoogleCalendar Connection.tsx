import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Unlink,
  Settings
} from 'lucide-react';
import { useGoogleCalendarDirect, useGoogleCalendarStatusDirect } from '@/hooks/useGoogleCalendarDirect';

interface GoogleCalendarConnectionProps {
  className?: string;
}

const GoogleCalendarConnection: React.FC<GoogleCalendarConnectionProps> = ({ 
  className = '' 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { isConnected, isChecking } = useGoogleCalendarStatusDirect();
  const { 
    isLoading,
    error,
    connectGoogleCalendar,
    handleAuthCallback,
    disconnectGoogleCalendar,
    fullSync,
    clearError,
    isConfigValid
  } = useGoogleCalendarDirect();

  /**
   * Iniciar processo de conexão com Google Calendar (novo método com popup)
   */
  const handleConnect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    // Verificar configuração primeiro
    if (!isConfigValid()) {
      setConnectionError('Configuração do Google Calendar incompleta. Verifique as variáveis de ambiente.');
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    clearError();

    try {
      // 1. Obter URL de autorização
      const authUrl = await connectGoogleCalendar();
      console.log('🔐 [GoogleCalendarConnection] Abrindo popup para:', authUrl);
      
      // 2. Abrir popup para autorização
      const popup = window.open(
        authUrl, 
        'google-calendar-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Pop-up bloqueado. Permita pop-ups e tente novamente.');
      }

      // 3. Escutar mensagens do popup
      const handleMessage = (event: MessageEvent) => {
        console.log('🔐 [GoogleCalendarConnection] Mensagem recebida:', event.data);
        
        if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
          console.log('🔐 [GoogleCalendarConnection] Sucesso! Processando código...');
          
          // Remover listener
          window.removeEventListener('message', handleMessage);
          
          // Processar o código recebido
          handleAuthCallback(event.data.code)
            .then(() => {
              console.log('🔐 [GoogleCalendarConnection] Callback processado com sucesso!');
              setIsConnecting(false);
              // Recarregar para atualizar status
              setTimeout(() => window.location.reload(), 1000);
            })
            .catch((error) => {
              console.error('🔐 [GoogleCalendarConnection] Erro no callback:', error);
              setConnectionError(error.message);
              setIsConnecting(false);
            });
            
        } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
          console.error('🔐 [GoogleCalendarConnection] Erro OAuth:', event.data.error);
          
          // Remover listener
          window.removeEventListener('message', handleMessage);
          
          setConnectionError(`Erro de autorização: ${event.data.error}`);
          setIsConnecting(false);
        }
      };

      // Adicionar listener para mensagens
      window.addEventListener('message', handleMessage);

      // 4. Monitorar se popup foi fechado manualmente
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          
          if (isConnecting) {
            console.log('🔐 [GoogleCalendarConnection] Popup fechado manualmente');
            setIsConnecting(false);
            setConnectionError('Autorização cancelada.');
          }
        }
      }, 1000);

      // Timeout após 5 minutos
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          setConnectionError('Tempo limite de autorização expirado. Tente novamente.');
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('🔐 [GoogleCalendarConnection] Erro ao conectar:', error);
      setConnectionError(
        error instanceof Error 
          ? error.message 
          : 'Erro desconhecido ao conectar com Google Calendar'
      );
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, connectGoogleCalendar, clearError, handleAuthCallback]);

  /**
   * Desconectar Google Calendar
   */
  const handleDisconnect = useCallback(async () => {
    if (!isConnected) return;

    try {
      await disconnectGoogleCalendar();
      window.location.reload(); // Recarregar para atualizar status
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      setConnectionError(
        error instanceof Error 
          ? error.message 
          : 'Erro ao desconectar Google Calendar'
      );
    }
  }, [isConnected, disconnectGoogleCalendar]);

  /**
   * Sincronizar manualmente
   */
  const handleSync = useCallback(async () => {
    if (!isConnected) return;

    try {
      await fullSync();
      // Feedback de sucesso
      alert('Sincronização realizada com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setConnectionError(
        error instanceof Error 
          ? error.message 
          : 'Erro na sincronização'
      );
    }
  }, [isConnected, fullSync]);

  /**
   * Limpar erro
   */
  const handleClearError = useCallback(() => {
    setConnectionError(null);
    clearError();
  }, [clearError]);

  return (
    <Card className={`${className} border-2`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Google Calendar</h3>
              <p className="text-sm text-muted-foreground">
                Sincronize agendamentos automaticamente
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          {isChecking ? (
            <Badge variant="outline" className="animate-pulse">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Verificando...
            </Badge>
          ) : isConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="w-3 h-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </div>

        <Separator className="mb-4" />

        {/* Error Display */}
        {(connectionError || error) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{connectionError || error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearError}
                className="h-auto p-1 text-xs"
              >
                Fechar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status & Actions */}
        <div className="space-y-4">
          {isConnected ? (
            /* Connected State */
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Sincronização Ativa
                  </span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Seus agendamentos são sincronizados automaticamente com o Google Calendar.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSync}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sincronizar Agora
                </Button>
                
                <Button 
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            /* Disconnected State */
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Conectar Google Calendar
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Conecte sua conta do Google para sincronizar agendamentos automaticamente 
                  entre o ImobiPRO e seu Google Calendar.
                </p>
                
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Sincronização automática de agendamentos</li>
                  <li>• Notificações do Google Calendar</li>
                  <li>• Acesso em qualquer dispositivo</li>
                  <li>• Backup automático dos eventos</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || isChecking}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Conectar Google Calendar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Settings className="w-3 h-3" />
            <span>
              {isConnected 
                ? 'Configurações avançadas disponíveis após conexão'
                : 'Conecte-se para acessar configurações avançadas'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarConnection;