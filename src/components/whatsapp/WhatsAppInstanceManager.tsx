/**
 * 🔗 ImobiPRO - Gerenciador de Instância WhatsApp
 * 
 * Componente para gerenciar configurações de uma instância WhatsApp.
 * Inclui edição de configurações e ações de gerenciamento.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings,
  Trash2,
  RefreshCw,
  MessageCircle,
  Webhook,
  Shield,
  BarChart3,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { WhatsAppInstance, UpdateInstanceInput } from '@/services/whatsappService';

interface WhatsAppInstanceManagerProps {
  instance: WhatsAppInstance | null;
  onUpdate: (input: UpdateInstanceInput) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const WhatsAppInstanceManager: React.FC<WhatsAppInstanceManagerProps> = ({
  instance,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  const [formData, setFormData] = useState<UpdateInstanceInput>({
    displayName: instance?.displayName || '',
    autoReply: instance?.autoReply || false,
    autoReplyMessage: instance?.autoReplyMessage || '',
    webhookUrl: instance?.webhookUrl || '',
    maxDailyMessages: instance?.maxDailyMessages || 1000
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!instance) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhuma instância selecionada</p>
      </div>
    );
  }

  const handleInputChange = (field: keyof UpdateInstanceInput, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onUpdate(formData);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    displayName: instance.displayName || '',
    autoReply: instance.autoReply || false,
    autoReplyMessage: instance.autoReplyMessage || '',
    webhookUrl: instance.webhookUrl || '',
    maxDailyMessages: instance.maxDailyMessages || 1000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'text-green-600';
      case 'CONNECTING': return 'text-blue-600';
      case 'QR_CODE_PENDING': return 'text-yellow-600';
      case 'ERROR': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações básicas da instância */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Número</p>
                <p className="text-sm font-medium truncate">
                  {instance.phoneNumber || 'Não conectado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Mensagens hoje</p>
                <p className="text-sm font-medium">
                  {instance.messagesSentToday + instance.messagesReceivedToday}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Última conexão</p>
                <p className="text-sm font-medium">
                  {instance.lastConnectionAt 
                    ? new Date(instance.lastConnectionAt).toLocaleDateString()
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Permissões</p>
                <div className="flex items-center gap-1">
                  {instance.canConnect ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  )}
                  <p className="text-sm font-medium">
                    {instance.canConnect ? 'Ativas' : 'Restritas'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Configurações básicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="text-sm font-medium">
              Nome de exibição
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Ex: WhatsApp Corretor João"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nome amigável para identificar a instância
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Resposta automática</Label>
              <p className="text-xs text-muted-foreground">
                Responder automaticamente mensagens recebidas
              </p>
            </div>
            <Switch
              checked={formData.autoReply}
              onCheckedChange={(checked) => handleInputChange('autoReply', checked)}
            />
          </div>

          {formData.autoReply && (
            <div>
              <Label htmlFor="autoReplyMessage" className="text-sm font-medium">
                Mensagem de resposta automática
              </Label>
              <Textarea
                id="autoReplyMessage"
                value={formData.autoReplyMessage}
                onChange={(e) => handleInputChange('autoReplyMessage', e.target.value)}
                placeholder="Olá! Recebi sua mensagem e retornarei em breve..."
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="maxDailyMessages" className="text-sm font-medium">
              Limite diário de mensagens
            </Label>
            <Input
              id="maxDailyMessages"
              type="number"
              value={formData.maxDailyMessages}
              onChange={(e) => handleInputChange('maxDailyMessages', parseInt(e.target.value))}
              min={1}
              max={10000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo de mensagens por dia (padrão: 1000)
            </p>
          </div>

          <div>
            <Label htmlFor="webhookUrl" className="text-sm font-medium">
              URL do webhook
            </Label>
            <Input
              id="webhookUrl"
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
              placeholder="https://seu-webhook.com/whatsapp"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL para receber notificações de mensagens
            </p>
          </div>
        </div>
      </div>

      {/* Configurações avançadas (colapsável) */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4 mr-2" />
          {showAdvanced ? 'Ocultar' : 'Mostrar'} configurações avançadas
        </Button>

        {showAdvanced && (
          <Card className="mt-4 imobipro-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">⚙️ Configurações Avançadas</CardTitle>
              <CardDescription className="text-xs">
                Configurações técnicas e de integração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">ID da Instância</p>
                  <code className="bg-muted px-2 py-1 rounded">{instance.instanceId}</code>
                </div>
                <div>
                  <p className="text-muted-foreground">Status atual</p>
                  <Badge variant="outline" className={getStatusColor(instance.status)}>
                    {instance.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p>{new Date(instance.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Atualizado em</p>
                  <p>{new Date(instance.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Total enviadas</p>
                  <p className="font-medium">{instance.totalMessagesSent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total recebidas</p>
                  <p className="font-medium">{instance.totalMessagesReceived}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Enviadas hoje</p>
                  <p className="font-medium">{instance.messagesSentToday}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recebidas hoje</p>
                  <p className="font-medium">{instance.messagesReceivedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting || isUpdating}
          className="sm:w-auto w-full"
        >
          {isDeleting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Removendo...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Remover Instância
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormData({
              displayName: instance.displayName || '',
              autoReply: instance.autoReply || false,
              autoReplyMessage: instance.autoReplyMessage || '',
              webhookUrl: instance.webhookUrl || '',
              maxDailyMessages: instance.maxDailyMessages || 1000
            })}
            disabled={!hasChanges || isUpdating}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isUpdating}
            className="bg-imobipro-blue hover:bg-imobipro-blue/90"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppInstanceManager;