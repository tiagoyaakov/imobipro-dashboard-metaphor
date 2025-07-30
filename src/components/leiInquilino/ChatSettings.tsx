import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bot, 
  Link, 
  Shield, 
  Clock, 
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { n8nLegalService } from '@/services/n8nLegalService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatSettingsProps {
  className?: string;
  onClose?: () => void;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({ className, onClose }) => {
  const [config, setConfig] = useState(n8nLegalService.getConfig());
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    responseTime?: number;
    error?: string;
  }>({ status: 'idle' });
  const [isSaving, setIsSaving] = useState(false);

  const handleTestConnection = async () => {
    setConnectionStatus({ status: 'testing' });
    
    try {
      const result = await n8nLegalService.testConnection();
      
      if (result.success) {
        setConnectionStatus({ 
          status: 'success', 
          responseTime: result.responseTime 
        });
        toast.success('Conexão com N8N estabelecida com sucesso!');
      } else {
        setConnectionStatus({ 
          status: 'error', 
          error: result.error 
        });
        toast.error(`Falha na conexão: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus({ 
        status: 'error', 
        error: 'Erro inesperado durante o teste' 
      });
      toast.error('Erro ao testar conexão');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Validar URL do webhook
      if (config.webhookUrl && !isValidUrl(config.webhookUrl)) {
        throw new Error('URL do webhook inválida');
      }

      // Atualizar configuração do serviço
      n8nLegalService.updateConfig(config);
      
      // Salvar no localStorage (em produção, salvar no backend)
      localStorage.setItem('n8n-legal-config', JSON.stringify(config));
      
      toast.success('Configurações salvas com sucesso!');
      onClose?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Link className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus.status) {
      case 'testing':
        return 'Testando conexão...';
      case 'success':
        return `Conectado (${connectionStatus.responseTime}ms)`;
      case 'error':
        return connectionStatus.error || 'Erro na conexão';
      default:
        return 'Não testado';
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Configurações do Chat IA</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Configure a integração com N8N e personalize o comportamento do assistente
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* N8N Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Integração N8N</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL do Webhook</Label>
              <Input
                id="webhookUrl"
                placeholder="https://seu-n8n.com/webhook/legal-assistant"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                URL do webhook N8N que processará as mensagens do chat
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Opcional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Bearer token para autenticação"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Token de autenticação para maior segurança
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={config.timeout}
                  onChange={(e) => setConfig({ ...config, timeout: Number(e.target.value) })}
                  min="5000"
                  max="60000"
                  step="1000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Tentativas</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  value={config.retryAttempts}
                  onChange={(e) => setConfig({ ...config, retryAttempts: Number(e.target.value) })}
                  min="1"
                  max="5"
                />
              </div>
            </div>
          </div>

          {/* Connection Test */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Status da Conexão</h4>
                {getConnectionStatusIcon()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={connectionStatus.status === 'testing' || !config.webhookUrl}
              >
                {connectionStatus.status === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
            </div>
            
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {getConnectionStatusText()}
            </div>
          </div>
        </div>

        <Separator />

        {/* AI Agent Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Configurações do Agente IA</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
              <div>
                <h4 className="font-medium">ImobiPRO Agent</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Assistente Jurídico Imobiliário especializado
                </p>
              </div>
              <Badge variant="secondary">
                <Shield className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value="professional"
                  disabled
                >
                  <option value="professional">Profissional</option>
                  <option value="friendly">Amigável</option>
                  <option value="formal">Formal</option>
                </select>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Estilo de comunicação do agente
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/30">
                  {['Lei do Inquilinato', 'Contratos', 'Despejo', 'Reformas'].map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sugestões Automáticas</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Exibir sugestões de perguntas após cada resposta
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Referências Legais</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Incluir referências legais nas respostas
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Histórico de Sessões</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manter histórico de conversas para contexto
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSettings;