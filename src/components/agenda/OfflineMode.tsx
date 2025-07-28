import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Wifi,
  WifiOff,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Database,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Sync,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OfflineQueueItem {
  id: string;
  type: 'create_appointment' | 'update_appointment' | 'delete_appointment' | 'sync_calendar';
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface CacheStats {
  appointmentsCount: number;
  agentsCount: number;
  clientsCount: number;
  totalSize: string; // em MB
  lastUpdate: Date;
  expiresAt: Date;
}

interface OfflineModeProps {
  isOnline: boolean;
  queueItems: OfflineQueueItem[];
  cacheStats: CacheStats;
  syncProgress: number;
  onSyncQueue: () => void;
  onClearQueue: () => void;
  onRefreshCache: () => void;
  onInstallPWA?: () => void;
  isPWAInstallable?: boolean;
  className?: string;
}

const OfflineMode: React.FC<OfflineModeProps> = ({
  isOnline,
  queueItems,
  cacheStats,
  syncProgress,
  onSyncQueue,
  onClearQueue,
  onRefreshCache,
  onInstallPWA,
  isPWAInstallable = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number; total: number } | null>(null);

  const pendingItems = queueItems.filter(item => item.status === 'pending').length;
  const failedItems = queueItems.filter(item => item.status === 'failed').length;

  // Verificar uso do storage
  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        setStorageUsage({
          used: Math.round((estimate.usage || 0) / (1024 * 1024)), // MB
          total: Math.round((estimate.quota || 0) / (1024 * 1024)) // MB
        });
      });
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'create_appointment':
        return 'Criar agendamento';
      case 'update_appointment':
        return 'Atualizar agendamento';
      case 'delete_appointment':
        return 'Excluir agendamento';
      case 'sync_calendar':
        return 'Sincronizar calendário';
      default:
        return 'Ação desconhecida';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-orange-500" />;
      case 'syncing':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderConnectionStatus = () => (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center gap-3">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-semibold text-sm">Online</h3>
              <p className="text-xs text-muted-foreground">
                Sincronização ativa
              </p>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-sm">Modo Offline</h3>
              <p className="text-xs text-muted-foreground">
                {pendingItems > 0 ? `${pendingItems} ações na fila` : 'Dados em cache'}
              </p>
            </div>
          </>
        )}
        
        {pendingItems > 0 && (
          <Badge variant="outline" className="text-xs">
            {pendingItems} pendentes
          </Badge>
        )}
        
        {failedItems > 0 && (
          <Badge variant="destructive" className="text-xs">
            {failedItems} falharam
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {syncProgress > 0 && syncProgress < 100 && (
          <div className="flex items-center gap-2">
            <Progress value={syncProgress} className="w-16 h-2" />
            <span className="text-xs text-muted-foreground">{syncProgress}%</span>
          </div>
        )}
        
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

  const renderOfflineQueue = () => {
    if (queueItems.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <Sync className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma ação pendente</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Fila de Sincronização</h4>
          <div className="flex gap-2">
            {isOnline && pendingItems > 0 && (
              <Button
                size="sm"
                onClick={onSyncQueue}
                className="h-6 px-2 text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                Sincronizar
              </Button>
            )}
            {queueItems.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onClearQueue}
                className="h-6 px-2 text-xs"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {queueItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 border rounded-md text-xs"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <span className="truncate">{getActionLabel(item.type)}</span>
                {item.retryCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Tentativa {item.retryCount}
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground">
                {formatTime(item.timestamp)}
              </span>
            </div>
          ))}
          {queueItems.length > 5 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              +{queueItems.length - 5} itens
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderCacheInfo = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Cache Local</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefreshCache}
          className="h-6 px-2 text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Atualizar
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 border rounded">
          <div className="font-semibold">{cacheStats.appointmentsCount}</div>
          <div className="text-muted-foreground">Agendamentos</div>
        </div>
        <div className="p-2 border rounded">
          <div className="font-semibold">{cacheStats.agentsCount}</div>
          <div className="text-muted-foreground">Corretores</div>
        </div>
        <div className="p-2 border rounded">
          <div className="font-semibold">{cacheStats.clientsCount}</div>
          <div className="text-muted-foreground">Clientes</div>
        </div>
        <div className="p-2 border rounded">
          <div className="font-semibold">{cacheStats.totalSize}</div>
          <div className="text-muted-foreground">Tamanho</div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <div>Última atualização: {formatTime(cacheStats.lastUpdate)}</div>
        <div>Expira em: {formatTime(cacheStats.expiresAt)}</div>
      </div>
      
      {storageUsage && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Armazenamento</span>
            <span>{storageUsage.used}MB / {storageUsage.total}MB</span>
          </div>
          <Progress 
            value={(storageUsage.used / storageUsage.total) * 100} 
            className="h-1"
          />
        </div>
      )}
    </div>
  );

  const renderPWAInstall = () => {
    if (!isPWAInstallable) return null;

    return (
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            Instale o app para melhor experiência offline
          </span>
          <Button
            size="sm"
            onClick={onInstallPWA}
            className="ml-2"
          >
            Instalar
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {renderConnectionStatus()}
      
      {!isOnline && (
        <Alert className="m-4 mb-0">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Você está offline. As alterações serão sincronizadas quando a conexão for restaurada.
          </AlertDescription>
        </Alert>
      )}
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {renderOfflineQueue()}
          
          <Separator />
          
          {renderCacheInfo()}
          
          {renderPWAInstall()}
        </div>
      )}
    </Card>
  );
};

// Hook para gerenciar estado offline
export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
    const newItem: OfflineQueueItem = {
      ...item,
      id: `queue-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending'
    };

    setQueueItems(prev => [...prev, newItem]);
    return newItem.id;
  };

  const updateQueueItem = (id: string, updates: Partial<OfflineQueueItem>) => {
    setQueueItems(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const removeFromQueue = (id: string) => {
    setQueueItems(prev => prev.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    setQueueItems([]);
  };

  const syncQueue = async () => {
    const pendingItems = queueItems.filter(item => item.status === 'pending');
    
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setSyncProgress(((i + 1) / pendingItems.length) * 100);
      
      try {
        updateQueueItem(item.id, { status: 'syncing' });
        
        // Simular operação de sincronização
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateQueueItem(item.id, { status: 'completed' });
        
        // Remover item completado após um tempo
        setTimeout(() => removeFromQueue(item.id), 3000);
        
      } catch (error) {
        updateQueueItem(item.id, {
          status: 'failed',
          retryCount: item.retryCount + 1,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    setSyncProgress(0);
  };

  return {
    isOnline,
    queueItems,
    syncProgress,
    addToQueue,
    updateQueueItem,
    removeFromQueue,
    clearQueue,
    syncQueue
  };
};

export default OfflineMode;