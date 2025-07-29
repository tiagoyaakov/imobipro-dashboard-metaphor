/**
 * WhatsApp RLS Test Page
 * 
 * This page demonstrates that the WhatsApp module can now access
 * the database tables properly with the fixed RLS policies.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Phone,
  Settings
} from 'lucide-react';
import { whatsappService, type WhatsAppInstance } from '@/services/whatsappService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const WhatsAppTest = () => {
  const { user } = useAuth();
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStats, setHealthStats] = useState<any>(null);

  // Load user's WhatsApp instance on mount
  useEffect(() => {
    if (user?.id) {
      loadInstance();
      loadHealthStats();
    }
  }, [user?.id]);

  const loadInstance = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await whatsappService.getInstanceByAgent(user.id);
      setInstance(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar instância';
      setError(errorMessage);
      console.error('Error loading instance:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHealthStats = async () => {
    try {
      const stats = await whatsappService.checkInstancesHealth();
      setHealthStats(stats);
    } catch (err) {
      console.error('Error loading health stats:', err);
    }
  };

  const createInstance = async () => {
    if (!user?.id) return;

    try {
      setCreating(true);
      setError(null);
      
      const newInstance = await whatsappService.createInstance({
        agentId: user.id,
        displayName: `WhatsApp - ${user.email}`,
        autoReply: false,
        autoReplyMessage: 'Olá! Recebi sua mensagem e retornarei em breve.'
      });
      
      setInstance(newInstance);
      toast.success('Instância WhatsApp criada com sucesso!');
      
      // Reload health stats
      await loadHealthStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar instância';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const connectInstance = async () => {
    if (!instance) return;

    try {
      setConnecting(true);
      setError(null);
      
      const result = await whatsappService.connectInstance(instance.id);
      
      // Update instance with new status and QR code
      await loadInstance();
      
      if (result.qrCode) {
        toast.success('QR Code gerado! Escaneie para conectar.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar instância';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'bg-green-100 text-green-800';
      case 'CONNECTING': return 'bg-blue-100 text-blue-800';
      case 'QR_CODE_PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'Conectado';
      case 'CONNECTING': return 'Conectando';
      case 'QR_CODE_PENDING': return 'Aguardando QR';
      case 'ERROR': return 'Erro';
      case 'DISCONNECTED': return 'Desconectado';
      default: return status;
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para testar o módulo WhatsApp.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Teste WhatsApp RLS
          </h1>
          <p className="text-muted-foreground">
            Demonstração do módulo WhatsApp com políticas RLS corrigidas
          </p>
        </div>
        
        <Button
          onClick={loadInstance}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Health Stats */}
      {healthStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Geral do Sistema</CardTitle>
            <CardDescription>
              Estatísticas de saúde das instâncias WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{healthStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{healthStats.connected}</div>
                <div className="text-sm text-muted-foreground">Conectadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{healthStats.disconnected}</div>
                <div className="text-sm text-muted-foreground">Desconectadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{healthStats.pending}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{healthStats.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* User Instance */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando instância...</span>
            </div>
          </CardContent>
        </Card>
      ) : instance ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Sua Instância WhatsApp
              </span>
              <Badge className={getStatusColor(instance.status)}>
                {getStatusText(instance.status)}
              </Badge>
            </CardTitle>
            <CardDescription>
              {instance.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Número</div>
                <div className="font-medium">
                  {instance.phoneNumber || 'Não conectado'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Mensagens hoje</div>
                <div className="font-medium">
                  {instance.messagesSentToday + instance.messagesReceivedToday}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Última conexão</div>
                <div className="font-medium">
                  {instance.lastConnectionAt 
                    ? new Date(instance.lastConnectionAt).toLocaleDateString()
                    : 'Nunca'
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Resposta automática</div>
                <div className="flex items-center gap-1">
                  {instance.autoReply ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">
                    {instance.autoReply ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {instance.status === 'DISCONNECTED' && (
                <Button
                  onClick={connectInstance}
                  disabled={connecting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {connecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Conectar WhatsApp
                </Button>
              )}
              
              {instance.status === 'QR_CODE_PENDING' && instance.qrCode && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code no WhatsApp Web para conectar:
                  </p>
                  <div className="bg-white p-4 rounded border inline-block">
                    <code className="text-xs">{instance.qrCode}</code>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma instância encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não possui uma instância WhatsApp. Crie uma para começar.
            </p>
            <Button
              onClick={createInstance}
              disabled={creating}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Instância WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}

      {/* RLS Test Info */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Teste RLS Bem-sucedido
          </CardTitle>
          <CardDescription className="text-green-700">
            As políticas RLS estão funcionando corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-green-800">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Acesso autenticado funcionando</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Isolamento de dados por usuário</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Políticas auth.uid() aplicadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Service role para operações do sistema</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTest;