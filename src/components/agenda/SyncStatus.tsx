import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  Calendar,
  Smartphone,
  Monitor,
  Cloud,
  Zap,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SyncEvent {
  id: string;
  timestamp: Date;
  type: 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'appointment_updated';
  source: 'google' | 'outlook' | 'local' | 'api';
  message: string;
  details?: string;
  appointmentId?: string;
}

export interface SyncStatusData {
  isOnline: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  syncProgress: number; // 0-100
  pendingChanges: number;
  conflictsCount: number;
  providers: {
    google: {
      connected: boolean;
      status: 'synced' | 'syncing' | 'error' | 'disconnected';
      lastSync?: Date;
      errorMessage?: string;
    };
    outlook: {
      connected: boolean;
      status: 'synced' | 'syncing' | 'error' | 'disconnected';
      lastSync?: Date;
      errorMessage?: string;
    };
  };
  stats: {
    totalAppointments: number;
    syncedToday: number;
    conflictsResolved: number;
    uptime: number; // percentage
  };
  recentEvents: SyncEvent[];
}

interface SyncStatusProps {
  syncStatus: SyncStatusData;
  onManualSync: () => void;
  onResolveConflicts: () => void;
  onReconnectProvider: (provider: 'google' | 'outlook') => void;
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({
  syncStatus,
  onManualSync,
  onResolveConflicts,
  onReconnectProvider,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'text-green-500';
      case 'syncing':
        return 'text-blue-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventIcon = (type: SyncEvent['type']) => {
    switch (type) {
      case 'sync_start':
        return <RefreshCw className="w-3 h-3 text-blue-500" />;
      case 'sync_complete':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'sync_error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'conflict_detected':
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
      case 'appointment_updated':
        return <Calendar className="w-3 h-3 text-imobipro-blue" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderCompactStatus = () => (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center gap-3">
        {syncStatus.isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        
        <div className="flex items-center gap-2">
          {syncStatus.isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Sincronizando...</span>
              <Badge variant="secondary" className="text-xs">
                {syncStatus.syncProgress}%
              </Badge>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Última sync: {formatLastSync(syncStatus.lastSync)}
              </span>
            </>
          )}
        </div>
        
        {syncStatus.pendingChanges > 0 && (
          <Badge variant="outline" className="text-xs">
            {syncStatus.pendingChanges} pendentes
          </Badge>
        )}
        
        {syncStatus.conflictsCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {syncStatus.conflictsCount} conflitos
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualSync}
          disabled={syncStatus.isSyncing}
          className="h-6 px-2"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 px-2"
        >
          {isExpanded ? 'Menos' : 'Mais'}
        </Button>
      </div>
    </div>
  );

  const renderExpandedStatus = () => {
    if (!isExpanded) return null;
    
    return (
      <div className="p-4 space-y-4">
        {/* Progresso da sincronização */}
        {syncStatus.isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Sincronizando calendários</span>
              <span>{syncStatus.syncProgress}%</span>
            </div>
            <Progress value={syncStatus.syncProgress} className="h-2" />
          </div>
        )}
        
        {/* Alertas de conflitos */}
        {syncStatus.conflictsCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {syncStatus.conflictsCount} conflito(s) de agenda detectado(s)
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={onResolveConflicts}
              >
                Resolver
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Status dos provedores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Google Calendar</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getSyncStatusIcon(syncStatus.providers.google.status)}
                  <span>
                    {syncStatus.providers.google.connected 
                      ? formatLastSync(syncStatus.providers.google.lastSync || null)
                      : 'Desconectado'
                    }
                  </span>
                </div>
              </div>
            </div>
            {!syncStatus.providers.google.connected && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReconnectProvider('google')}
              >
                Conectar
              </Button>
            )}
          </div>
          
          {/* Outlook Calendar */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Outlook</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getSyncStatusIcon(syncStatus.providers.outlook.status)}
                  <span>
                    {syncStatus.providers.outlook.connected 
                      ? formatLastSync(syncStatus.providers.outlook.lastSync || null)
                      : 'Desconectado'
                    }
                  </span>
                </div>
              </div>
            </div>
            {!syncStatus.providers.outlook.connected && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReconnectProvider('outlook')}
              >
                Conectar
              </Button>
            )}
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-imobipro-blue">
              {syncStatus.stats.totalAppointments}
            </div>
            <div className="text-xs text-muted-foreground">
              Total de compromissos
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {syncStatus.stats.syncedToday}
            </div>
            <div className="text-xs text-muted-foreground">
              Sincronizados hoje
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-orange-500">
              {syncStatus.stats.conflictsResolved}
            </div>
            <div className="text-xs text-muted-foreground">
              Conflitos resolvidos
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-purple-500">
              {syncStatus.stats.uptime}%
            </div>
            <div className="text-xs text-muted-foreground">
              Disponibilidade
            </div>
          </div>
        </div>
        
        {/* Eventos recentes */}
        <div>
          <h4 className="font-semibold text-sm mb-3">Atividade Recente</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {syncStatus.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade recente
              </p>
            ) : (
              syncStatus.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/20"
                >
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {event.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatLastSync(event.timestamp)}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.source}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("imobipro-card overflow-hidden", className)}>
      {renderCompactStatus()}
      {renderExpandedStatus()}
    </Card>
  );
};

// Componente para indicador de conexão na barra de status
export const ConnectionIndicator: React.FC<{ isOnline: boolean; className?: string }> = ({ 
  isOnline, 
  className 
}) => (
  <div className={cn("flex items-center gap-2", className)}>
    {isOnline ? (
      <>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground">Online</span>
      </>
    ) : (
      <>
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-xs text-muted-foreground">Offline</span>
      </>
    )}
  </div>
);

// Hook personalizado para gerenciar estado de sincronização
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusData>({
    isOnline: navigator.onLine,
    lastSync: null,
    isSyncing: false,
    syncProgress: 0,
    pendingChanges: 0,
    conflictsCount: 0,
    providers: {
      google: {
        connected: false,
        status: 'disconnected'
      },
      outlook: {
        connected: false,
        status: 'disconnected'
      }
    },
    stats: {
      totalAppointments: 0,
      syncedToday: 0,
      conflictsResolved: 0,
      uptime: 100
    },
    recentEvents: []
  });

  // Monitorar conexão de rede
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startSync = () => {
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: true,
      syncProgress: 0
    }));
  };

  const updateSyncProgress = (progress: number) => {
    setSyncStatus(prev => ({
      ...prev,
      syncProgress: Math.min(100, Math.max(0, progress))
    }));
  };

  const completeSync = () => {
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      syncProgress: 100,
      lastSync: new Date()
    }));
  };

  const addSyncEvent = (event: Omit<SyncEvent, 'id'>) => {
    const newEvent: SyncEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random()}`
    };

    setSyncStatus(prev => ({
      ...prev,
      recentEvents: [newEvent, ...prev.recentEvents.slice(0, 9)] // Keep last 10 events
    }));
  };

  return {
    syncStatus,
    setSyncStatus,
    startSync,
    updateSyncProgress,
    completeSync,
    addSyncEvent
  };
};

export default SyncStatus;