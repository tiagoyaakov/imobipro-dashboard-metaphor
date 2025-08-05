// Indicador de status de sincronização com Google Calendar
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";
import { SyncStatus } from "@/types/googleCalendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncStatusIndicatorProps {
  syncStatus: SyncStatus;
  isConnected: boolean;
  lastSyncAt?: Date | null;
  conflictsCount?: number;
  onSync?: () => void;
  onOpenConnection?: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function SyncStatusIndicator({
  syncStatus,
  isConnected,
  lastSyncAt,
  conflictsCount = 0,
  onSync,
  onOpenConnection,
  isLoading = false,
  compact = false
}: SyncStatusIndicatorProps) {

  // Obter ícone e cor baseado no status
  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }

    switch (syncStatus) {
      case SyncStatus.SYNCED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case SyncStatus.SYNCING:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case SyncStatus.ERROR:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case SyncStatus.CONFLICT:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case SyncStatus.CONNECTING:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return isConnected ? 
          <Wifi className="h-4 w-4 text-gray-400" /> : 
          <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  // Obter texto do status
  const getStatusText = () => {
    if (!isConnected) {
      return "Desconectado";
    }

    switch (syncStatus) {
      case SyncStatus.SYNCED:
        return "Sincronizado";
      case SyncStatus.SYNCING:
        return "Sincronizando...";
      case SyncStatus.ERROR:
        return "Erro na sincronização";
      case SyncStatus.CONFLICT:
        return `${conflictsCount} conflito${conflictsCount !== 1 ? 's' : ''}`;
      case SyncStatus.CONNECTING:
        return "Conectando...";
      default:
        return "Aguardando";
    }
  };

  // Obter cor do badge
  const getBadgeVariant = () => {
    if (!isConnected) return "secondary";
    
    switch (syncStatus) {
      case SyncStatus.SYNCED:
        return "default";
      case SyncStatus.ERROR:
        return "destructive";
      case SyncStatus.CONFLICT:
        return "outline";
      default:
        return "secondary";
    }
  };

  // Renderizar informações de tooltip
  const renderTooltipContent = () => {
    return (
      <div className="space-y-2">
        <div className="font-medium">
          Google Calendar {isConnected ? "Conectado" : "Desconectado"}
        </div>
        
        <div className="text-sm space-y-1">
          <div>Status: {getStatusText()}</div>
          
          {lastSyncAt && (
            <div>
              Última sync: {format(lastSyncAt, "dd/MM 'às' HH:mm", { locale: ptBR })}
            </div>
          )}
          
          {conflictsCount > 0 && (
            <div className="text-yellow-600">
              ⚠️ {conflictsCount} conflito{conflictsCount !== 1 ? 's' : ''} pendente{conflictsCount !== 1 ? 's' : ''}
            </div>
          )}
          
          {!isConnected && (
            <div className="text-muted-foreground">
              Clique para conectar
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar versão compacta
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm" 
              className="h-8 w-8 p-0 relative"
              onClick={isConnected ? onSync : onOpenConnection}
              disabled={isLoading || syncStatus === SyncStatus.SYNCING}
            >
              {getStatusIcon()}
              
              {/* Indicador de conflitos */}
              {conflictsCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                  variant="destructive"
                >
                  {conflictsCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {renderTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Renderizar versão completa
  return (
    <div className="flex items-center gap-3">
      {/* Status Badge */}
      <Badge variant={getBadgeVariant()} className="flex items-center gap-2">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        
        {conflictsCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
            {conflictsCount}
          </Badge>
        )}
      </Badge>

      {/* Última sincronização */}
      {lastSyncAt && isConnected && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {format(lastSyncAt, "HH:mm", { locale: ptBR })}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Última sincronização: {format(lastSyncAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Botões de ação */}
      <div className="flex gap-1">
        {isConnected ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onSync}
                  disabled={isLoading || syncStatus === SyncStatus.SYNCING}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Sincronizar agora
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={onOpenConnection}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Conectar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Conectar com Google Calendar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Botão de configurações (sempre visível) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onOpenConnection}
              >
                <Calendar className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Configurações do Google Calendar
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}