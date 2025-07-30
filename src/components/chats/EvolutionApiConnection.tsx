import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  QrCode, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { evolutionApiService, WhatsAppInstanceStatus } from '@/services/evolutionApiService';
import { useAuth } from '@/hooks/useAuth';

interface EvolutionApiConnectionProps {
  instanceId?: string;
  className?: string;
  onStatusChange?: (status: WhatsAppInstanceStatus) => void;
}

export const EvolutionApiConnection: React.FC<EvolutionApiConnectionProps> = ({
  instanceId,
  className,
  onStatusChange
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<WhatsAppInstanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling para atualizar status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        setError(null);
        const currentStatus = await evolutionApiService.getInstanceStatus();
        setStatus(currentStatus);
        onStatusChange?.(currentStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao conectar com Evolution API');
        setStatus({
          instance: instanceId || 'default',
          status: 'error',
          isOnline: false
        });
      }
    };

    // Buscar status inicial
    fetchStatus();

    // Polling a cada 10 segundos quando conectado, 5 segundos quando conectando
    const getInterval = () => {
      return status?.status === 'connecting' ? 5000 : 10000;
    };

    const startPolling = () => {
      intervalId = setInterval(fetchStatus, getInterval());
    };

    startPolling();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [instanceId, onStatusChange, status?.status]);

  const handleConnect = async () => {
    setIsLoading(true);
    setIsConnecting(true);
    setError(null);

    try {
      const result = await evolutionApiService.connectInstance();
      
      if (result.qrCode) {
        setShowQrModal(true);
      }
      
      // Atualizar status
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newStatus = await evolutionApiService.getInstanceStatus();
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar');
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await evolutionApiService.disconnectInstance();
      
      // Atualizar status
      const newStatus = await evolutionApiService.getInstanceStatus();
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newStatus = await evolutionApiService.getInstanceStatus();
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }

    switch (status?.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Smartphone className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status?.status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              WhatsApp Evolution API
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
            <Badge className={getStatusColor()}>
              {status?.instance || 'default'}
            </Badge>
          </div>

          {/* Informações da conexão */}
          {status?.status === 'connected' && (
            <div className="space-y-2 text-sm">
              {status.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{status.phoneNumber}</span>
                </div>
              )}
              {status.profileName && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Nome:</span>
                  <span>{status.profileName}</span>
                </div>
              )}
              {status.lastConnection && (
                <div className="text-xs text-gray-500">
                  Última conexão: {status.lastConnection.toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            {status?.status === 'connected' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Desconectar
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isLoading || isConnecting}
                size="sm"
                className="flex-1"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Conectar
              </Button>
            )}

            {status?.status === 'connecting' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQrModal(true)}
                disabled={!status.qrCode}
              >
                <QrCode className="h-3 w-3 mr-1" />
                Ver QR
              </Button>
            )}
          </div>

          {/* Status de saúde */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Status da API</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  status?.isOnline ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>{status?.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal do QR Code */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Escanear QR Code
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Abra o WhatsApp no seu celular, vá em "Dispositivos conectados" e escaneie este QR code
              </AlertDescription>
            </Alert>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              {status?.qrCode ? (
                <img 
                  src={status.qrCode} 
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {isConnecting ? 'Gerando QR Code...' : 'QR Code indisponível'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status da conexão */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
              
              {status?.status === 'connecting' && (
                <p className="text-xs text-gray-600">
                  Aguardando leitura do QR Code...
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQrModal(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                onClick={handleRefreshStatus}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};