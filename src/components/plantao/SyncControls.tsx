// Controles de sincronização bidirecional para o módulo Plantão
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { SyncStatus, SyncReport } from "@/types/googleCalendar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncControlsProps {
  // Estados de sincronização
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncReport: SyncReport | null;
  conflicts: number;
  
  // Ações
  onSyncToGoogle: () => Promise<void>;
  onSyncBidirectional: () => Promise<void>;
  onViewConflicts?: () => void;
  
  // Configuração
  isGoogleConnected: boolean;
  canSync: boolean;
}

export function SyncControls({
  isSyncing,
  syncStatus,
  lastSyncReport,
  conflicts,
  onSyncToGoogle,
  onSyncBidirectional,
  onViewConflicts,
  isGoogleConnected,
  canSync
}: SyncControlsProps) {
  
  // Renderizar badge de status
  const renderStatusBadge = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCING:
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Sincronizando
          </Badge>
        );
        
      case SyncStatus.SYNCED:
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sincronizado
          </Badge>
        );
        
      case SyncStatus.ERROR:
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
        
      case SyncStatus.CONFLICT:
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Conflitos
          </Badge>
        );
        
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-200">
            Aguardando
          </Badge>
        );
    }
  };

  // Renderizar informações do último sync
  const renderLastSyncInfo = () => {
    if (!lastSyncReport) return null;

    return (
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-4">
          <span>
            Última sincronização: {formatDistanceToNow(lastSyncReport.timestamp, { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
          {lastSyncReport.success && (
            <span className="text-green-600">
              ✓ {lastSyncReport.created} criados, {lastSyncReport.updated} atualizados
            </span>
          )}
        </div>
        
        {lastSyncReport.errors && lastSyncReport.errors.length > 0 && (
          <div className="text-red-600">
            ⚠ {lastSyncReport.errors.length} erro(s) encontrado(s)
          </div>
        )}
      </div>
    );
  };

  if (!isGoogleConnected) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Google Calendar não conectado
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              Conecte-se ao Google Calendar para sincronizar eventos automaticamente
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Sincronização Google Calendar
          </h3>
          {renderStatusBadge()}
        </div>
        
        {conflicts > 0 && onViewConflicts && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewConflicts}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {conflicts} Conflito{conflicts > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {/* Controles de sincronização */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onSyncToGoogle}
          disabled={!canSync || isSyncing}
          size="sm"
          variant="outline"
          className="flex-1 min-w-[140px]"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Enviar para Google
        </Button>

        <Button
          onClick={onSyncBidirectional}
          disabled={!canSync || isSyncing}
          size="sm"
          className="flex-1 min-w-[140px]"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Sincronização Completa
        </Button>
      </div>

      {/* Informações do último sync */}
      {renderLastSyncInfo()}

      {/* Dicas de uso */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>Enviar para Google:</strong> Sincroniza apenas eventos do ImobiPRO → Google Calendar</p>
          <p><strong>Sincronização Completa:</strong> Sincronização bidirecional + detecção de conflitos</p>
        </div>
      </div>
    </div>
  );
}