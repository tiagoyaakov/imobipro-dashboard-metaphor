// Modal para conectar/desconectar Google Calendar
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  RotateCw as Sync,
  Settings,
  Info
} from "lucide-react";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { SyncStatus } from "@/types/googleCalendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GoogleCalendarConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleCalendarConnectionModal({
  isOpen,
  onClose,
}: GoogleCalendarConnectionModalProps) {
  const {
    isConnected,
    isConnecting,
    connectionStatus,
    tokens,
    lastConnectedAt,
    error,
    connectToGoogle,
    disconnectFromGoogle,
    refreshConnection,
    clearError,
    isConfigured,
    debugInfo
  } = useGoogleOAuth();

  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Renderizar status visual
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case SyncStatus.CONNECTING:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Conectando...</span>
          </div>
        );
      case SyncStatus.SYNCED:
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Conectado</span>
          </div>
        );
      case SyncStatus.ERROR:
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Erro na Conexão</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Desconectado</span>
          </div>
        );
    }
  };

  // Renderizar informações de configuração
  const renderConfigurationStatus = () => {
    if (!isConfigured) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Google Calendar não está configurado. Verifique as variáveis de ambiente:
            <ul className="mt-2 list-disc list-inside">
              <li>VITE_GOOGLE_CLIENT_ID</li>
              <li>VITE_GOOGLE_REDIRECT_URI</li>
            </ul>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Google Calendar está configurado e pronto para uso.
        </AlertDescription>
      </Alert>
    );
  };

  // Renderizar detalhes da conexão ativa
  const renderConnectionDetails = () => {
    if (!isConnected || !tokens) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            Detalhes da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lastConnectedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conectado em:</span>
              <span className="text-sm font-medium">
                {format(lastConnectedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Token expira em:</span>
            <span className="text-sm font-medium">
              {format(new Date(tokens.expiryDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Permissões:</span>
            <Badge variant="outline" className="text-xs">
              Calendário Completo
            </Badge>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshConnection}
              disabled={isConnecting}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Atualizar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="flex-1"
            >
              <Settings className="h-3 w-3 mr-2" />
              Debug
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar informações de debug
  const renderDebugInfo = () => {
    if (!showDebugInfo) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informações de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </DialogTitle>
          <DialogDescription>
            Conecte com o Google Calendar para sincronizar seus plantões automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status da Configuração */}
          {renderConfigurationStatus()}

          {/* Erro atual */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="h-auto p-1"
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Status da Conexão */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Status da Conexão</h3>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? "Sincronização ativa" : "Sincronização desativada"}
                  </p>
                </div>
                {renderConnectionStatus()}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da Conexão (se conectado) */}
          {renderConnectionDetails()}

          {/* Recursos da Sincronização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sync className="h-4 w-4" />
                Recursos de Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Sincronização bidirecional automática
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Atualizações em tempo real
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Detecção e resolução de conflitos
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Lembretes e notificações
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Informações de Debug */}
          {renderDebugInfo()}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>

            {isConnected ? (
              <Button
                variant="destructive"
                onClick={disconnectFromGoogle}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Desconectar
              </Button>
            ) : (
              <Button
                onClick={connectToGoogle}
                disabled={isConnecting || !isConfigured}
                className="flex-1"
              >
                {isConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Conectar com Google
              </Button>
            )}
          </div>

          {/* Nota de Segurança */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Privacidade:</strong> Suas credenciais são armazenadas localmente e 
              usadas apenas para sincronizar eventos entre o ImobiPRO e seu Google Calendar.
              Nenhuma informação é compartilhada com terceiros.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}