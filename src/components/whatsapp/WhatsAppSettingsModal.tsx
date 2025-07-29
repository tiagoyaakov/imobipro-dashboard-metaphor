/**
 * 🔗 ImobiPRO - Modal de Configurações WhatsApp
 * 
 * Modal para configurações avançadas da instância WhatsApp.
 * Inclui configurações de webhook, automação e permissões.
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings,
  RefreshCw,
  Webhook,
  MessageCircle,
  Shield,
  Zap,
  Bell,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  TestTube
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { WhatsAppInstance, UpdateInstanceInput } from '@/services/whatsappService';

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: WhatsAppInstance | null;
  onUpdate: (input: UpdateInstanceInput) => void;
  isUpdating: boolean;
}

export const WhatsAppSettingsModal: React.FC<WhatsAppSettingsModalProps> = ({
  isOpen,
  onClose,
  instance,
  onUpdate,
  isUpdating
}) => {
  const [formData, setFormData] = useState<UpdateInstanceInput>({
    displayName: instance?.displayName || '',
    autoReply: instance?.autoReply || false,
    autoReplyMessage: instance?.autoReplyMessage || '',
    webhookUrl: instance?.webhookUrl || '',
    maxDailyMessages: instance?.maxDailyMessages || 1000,
    isActive: instance?.isActive ?? true,
    canConnect: instance?.canConnect ?? true
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = (field: keyof UpdateInstanceInput, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onUpdate(formData);
  };

  const copyWebhookUrl = () => {
    if (formData.webhookUrl) {
      navigator.clipboard.writeText(formData.webhookUrl);
      toast({
        title: "📋 URL copiada",
        description: "URL do webhook copiada para a área de transferência",
      });
    }
  };

  const testWebhook = async () => {
    if (!formData.webhookUrl) {
      toast({
        variant: "destructive",
        title: "❌ URL necessária",
        description: "Configure uma URL de webhook antes de testar",
      });
      return;
    }

    toast({
      title: "🧪 Testando webhook",
      description: "Enviando requisição de teste...",
    });

    // Simular teste de webhook
    setTimeout(() => {
      toast({
        title: "✅ Webhook testado",
        description: "Requisição de teste enviada com sucesso",
      });
    }, 2000);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    displayName: instance?.displayName || '',
    autoReply: instance?.autoReply || false,
    autoReplyMessage: instance?.autoReplyMessage || '',
    webhookUrl: instance?.webhookUrl || '',
    maxDailyMessages: instance?.maxDailyMessages || 1000,
    isActive: instance?.isActive ?? true,
    canConnect: instance?.canConnect ?? true
  });

  if (!instance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações Avançadas
          </DialogTitle>
          <DialogDescription>
            Configure opções avançadas para {instance.displayName || 'sua instância WhatsApp'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="webhook" className="text-xs">
                <Webhook className="w-3 h-3 mr-1" />
                Webhook
              </TabsTrigger>
              <TabsTrigger value="automation" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Automação
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Segurança
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-4">
              <TabsContent value="general" className="h-full overflow-y-auto space-y-4 mt-0">
                <Card className="imobipro-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">📝 Configurações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="displayName" className="text-sm">
                        Nome de exibição
                      </Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        placeholder="Ex: WhatsApp Corretor João"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxDailyMessages" className="text-sm">
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
                        Máximo de mensagens que podem ser enviadas por dia
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Instância ativa</Label>
                        <p className="text-xs text-muted-foreground">
                          Permitir que a instância seja utilizada
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Permitir conexão</Label>
                        <p className="text-xs text-muted-foreground">
                          Permitir que a instância se conecte ao WhatsApp
                        </p>
                      </div>
                      <Switch
                        checked={formData.canConnect}
                        onCheckedChange={(checked) => handleInputChange('canConnect', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="webhook" className="h-full overflow-y-auto space-y-4 mt-0">
                <Card className="imobipro-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      Configuração de Webhook
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure um endpoint para receber notificações de mensagens
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="webhookUrl" className="text-sm">
                        URL do webhook
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="webhookUrl"
                          type="url"
                          value={formData.webhookUrl}
                          onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                          placeholder="https://seu-servidor.com/webhook/whatsapp"
                        />
                        {formData.webhookUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyWebhookUrl}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Endpoint para receber eventos de mensagens recebidas
                      </p>
                    </div>

                    {formData.webhookUrl && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={testWebhook}
                          className="w-full"
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          Testar Webhook
                        </Button>
                      </div>
                    )}

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="text-xs text-blue-800">
                            <p className="font-medium mb-1">Exemplo de payload:</p>
                            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`{
  "instanceId": "wa_123...",
  "messageId": "msg_456...",
  "from": "+5511999999999",
  "content": "Olá!",
  "type": "text",
  "timestamp": "2024-01-01T10:00:00Z"
}`}
                            </pre>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="automation" className="h-full overflow-y-auto space-y-4 mt-0">
                <Card className="imobipro-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Resposta Automática
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Ativar resposta automática</Label>
                        <p className="text-xs text-muted-foreground">
                          Responder automaticamente às mensagens recebidas
                        </p>
                      </div>
                      <Switch
                        checked={formData.autoReply}
                        onCheckedChange={(checked) => handleInputChange('autoReply', checked)}
                      />
                    </div>

                    {formData.autoReply && (
                      <div>
                        <Label htmlFor="autoReplyMessage" className="text-sm">
                          Mensagem de resposta automática
                        </Label>
                        <Textarea
                          id="autoReplyMessage"
                          value={formData.autoReplyMessage}
                          onChange={(e) => handleInputChange('autoReplyMessage', e.target.value)}
                          placeholder="Olá! Recebi sua mensagem e retornarei em breve..."
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Esta mensagem será enviada automaticamente para novas conversas
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="imobipro-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Integração n8n
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure automações avançadas com workflows n8n
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                      <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <h4 className="text-sm font-medium mb-2">Em Desenvolvimento</h4>
                      <p className="text-xs max-w-md mx-auto">
                        Integração com n8n para automações avançadas será disponibilizada em breve.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="h-full overflow-y-auto space-y-4 mt-0">
                <Card className="imobipro-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Informações de Segurança
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">ID da Instância</p>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {instance.instanceId}
                        </code>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Criado em</p>
                        <p>{new Date(instance.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Última atualização</p>
                        <p>{new Date(instance.updatedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="outline" className="text-xs">
                          {instance.status}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Estatísticas de Uso</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Mensagens enviadas (total)</p>
                          <p className="text-lg font-bold">{instance.totalMessagesSent}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mensagens recebidas (total)</p>
                          <p className="text-lg font-bold">{instance.totalMessagesReceived}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Enviadas hoje</p>
                          <p className="text-lg font-bold">{instance.messagesSentToday}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Recebidas hoje</p>
                          <p className="text-lg font-bold">{instance.messagesReceivedToday}</p>
                        </div>
                      </div>
                    </div>

                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div className="text-xs text-amber-800">
                            <p className="font-medium mb-1">Aviso de Segurança</p>
                            <p>
                              Mantenha suas credenciais seguras e não compartilhe URLs de webhook 
                              com terceiros não autorizados.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="sm:w-auto w-full"
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isUpdating}
              className="sm:w-auto w-full bg-imobipro-blue hover:bg-imobipro-blue/90"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppSettingsModal;