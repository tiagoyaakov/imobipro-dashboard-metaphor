
/**
 * 🔗 ImobiPRO - Página de Conexões WhatsApp
 * 
 * Página principal para gestão de conexões WhatsApp por corretor.
 * Inclui criação de instâncias, monitoramento de status e QR codes.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Smartphone, 
  Settings, 
  Activity,
  Plus,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Power,
  PowerOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsAppInstanceManager, useWhatsAppHealth } from '@/hooks/useWhatsApp';
import { WhatsAppInstanceManager } from '@/components/whatsapp/WhatsAppInstanceManager';
import { WhatsAppQRCodeModal } from '@/components/whatsapp/WhatsAppQRCodeModal';
import { WhatsAppHealthDashboard } from '@/components/whatsapp/WhatsAppHealthDashboard';
import { WhatsAppSettingsModal } from '@/components/whatsapp/WhatsAppSettingsModal';

const Conexoes = () => {
  const { user } = useAuth();
  const userWithFallback = user || { id: 'mock-user', role: 'AGENT' };
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const instanceManager = useWhatsAppInstanceManager(userWithFallback.id);
  const { data: health } = useWhatsAppHealth();

  const {
    instance,
    hasInstance,
    isConnected,
    isConnecting,
    canConnect,
    qrCodeExpired,
    qrTimeLeft,
    actions,
    mutations
  } = instanceManager;

  // Status helpers
  const getStatusIcon = () => {
    if (!hasInstance) return <Smartphone className="w-5 h-5 text-gray-400" />;
    
    switch (instance?.status) {
      case 'CONNECTED':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'CONNECTING':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'QR_CODE_PENDING':
        return <QrCode className="w-5 h-5 text-yellow-500" />;
      case 'ERROR':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!hasInstance) return 'secondary';
    
    switch (instance?.status) {
      case 'CONNECTED': return 'success';
      case 'CONNECTING': return 'info';
      case 'QR_CODE_PENDING': return 'warning';
      case 'ERROR': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = () => {
    if (!hasInstance) return 'Não configurado';
    
    switch (instance?.status) {
      case 'CONNECTED': return `Conectado ${instance.phoneNumber ? `(${instance.phoneNumber})` : ''}`;
      case 'CONNECTING': return 'Conectando...';
      case 'QR_CODE_PENDING': return 'Aguardando QR Code';
      case 'ERROR': return 'Erro na conexão';
      case 'DISCONNECTED': return 'Desconectado';
      default: return 'Status desconhecido';
    }
  };

  const handleCreateInstance = () => {
    actions.createInstance({
      displayName: `WhatsApp ${userWithFallback.role === 'AGENT' ? 'Corretor' : 'Admin'}`,
      autoReply: false
    });
  };

  const handleConnect = () => {
    if (isConnected) {
      actions.disconnect();
    } else {
      actions.connect();
      setShowQRModal(true);
    }
  };

  const formatTimeLeft = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conexões WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas conexões WhatsApp para comunicação com clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasInstance && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              disabled={mutations.updateInstance.isPending}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <Badge variant={getStatusColor() as any} className="text-xs">
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Health Dashboard */}
      {health && (
        <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Card className="imobipro-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium">Total Instâncias</CardTitle>
              <Smartphone className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg font-bold">{health.total}</div>
              <p className="text-[10px] text-muted-foreground">
                Instâncias ativas
              </p>
            </CardContent>
          </Card>

          <Card className="imobipro-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium">Conectadas</CardTitle>
              <Wifi className="h-3 w-3 text-green-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg font-bold text-green-600">{health.connected}</div>
              <p className="text-[10px] text-muted-foreground">
                Online agora
              </p>
            </CardContent>
          </Card>

          <Card className="imobipro-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium">Pendentes</CardTitle>
              <Clock className="h-3 w-3 text-yellow-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg font-bold text-yellow-600">{health.pending}</div>
              <p className="text-[10px] text-muted-foreground">
                Aguardando conexão
              </p>
            </CardContent>
          </Card>

          <Card className="imobipro-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium">Com Erro</CardTitle>
              <AlertTriangle className="h-3 w-3 text-red-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg font-bold text-red-600">{health.errors}</div>
              <p className="text-[10px] text-muted-foreground">
                Necessitam atenção
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {!hasInstance ? (
          // Estado inicial - sem instância
          <Card className="imobipro-card h-full flex items-center justify-center">
            <CardContent className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma instância WhatsApp configurada</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crie sua primeira instância WhatsApp para começar a se comunicar com seus clientes 
                diretamente através da plataforma.
              </p>
              <Button 
                onClick={handleCreateInstance}
                disabled={mutations.createInstance.isPending}
                className="bg-imobipro-blue hover:bg-imobipro-blue/90"
              >
                {mutations.createInstance.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Instância WhatsApp
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Estado com instância - interface completa
          <Tabs defaultValue="instance" className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-3 mb-3">
              <TabsTrigger value="instance" className="flex items-center gap-1.5 text-xs">
                <Smartphone className="w-3 h-3" />
                Minha Instância
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-1.5 text-xs">
                <Activity className="w-3 h-3" />
                Monitoramento
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
                <Settings className="w-3 h-3" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instance" className="flex-1 min-h-0 mt-0">
              <Card className="imobipro-card h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon()}
                        {instance?.displayName || 'Instância WhatsApp'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        Status: {getStatusText()}
                        {instance?.status === 'QR_CODE_PENDING' && qrTimeLeft > 0 && (
                          <span className="text-yellow-600">
                            (expira em {formatTimeLeft(qrTimeLeft)})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {instance?.status === 'QR_CODE_PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowQRModal(true)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Ver QR Code
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleConnect}
                        disabled={!canConnect || mutations.connectInstance.isPending || mutations.disconnectInstance.isPending}
                        variant={isConnected ? "destructive" : "default"}
                        className={!isConnected ? "bg-imobipro-blue hover:bg-imobipro-blue/90" : ""}
                      >
                        {mutations.connectInstance.isPending || mutations.disconnectInstance.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : isConnected ? (
                          <PowerOff className="w-4 h-4 mr-2" />
                        ) : (
                          <Power className="w-4 h-4 mr-2" />
                        )}
                        {isConnected ? 'Desconectar' : 'Conectar'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <WhatsAppInstanceManager 
                    instance={instance}
                    onUpdate={actions.updateInstance}
                    onDelete={actions.deleteInstance}
                    isUpdating={mutations.updateInstance.isPending}
                    isDeleting={mutations.deleteInstance.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="flex-1 min-h-0 mt-0">
              <WhatsAppHealthDashboard instanceId={instance?.id} />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 min-h-0 mt-0">
              <Card className="imobipro-card h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">⚙️ Configurações Avançadas</CardTitle>
                  <CardDescription className="text-xs">
                    Configurações globais do WhatsApp para sua empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <h3 className="text-sm font-medium mb-2">Configurações em Desenvolvimento</h3>
                    <p className="text-xs max-w-md mx-auto">
                      Painel para configurar limites, webhooks, integração n8n e permissões avançadas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Modais */}
      {hasInstance && (
        <>
          <WhatsAppQRCodeModal
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            instance={instance}
            onRefreshQR={actions.refreshQR}
            onSimulateConnection={actions.simulateConnection}
            isRefreshing={mutations.refreshQR.isPending}
            isSimulating={mutations.simulateConnection.isPending}
          />
          
          <WhatsAppSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            instance={instance}
            onUpdate={actions.updateInstance}
            isUpdating={mutations.updateInstance.isPending}
          />
        </>
      )}
    </div>
  );
};

export default Conexoes;
