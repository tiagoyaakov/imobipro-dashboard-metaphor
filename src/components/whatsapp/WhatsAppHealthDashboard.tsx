/**
 * 🔗 ImobiPRO - Dashboard de Saúde WhatsApp
 * 
 * Dashboard para monitoramento de logs e estatísticas das instâncias WhatsApp.
 * Inclui histórico de conexões e métricas de performance.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ScrollArea,
  ScrollBar
} from '@/components/ui/scroll-area';
import { 
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  MessageCircle,
  TrendingUp,
  Filter,
  Calendar,
  Eye,
  Download
} from 'lucide-react';
import { useWhatsAppConnectionLogs } from '@/hooks/useWhatsApp';
import type { WhatsAppConnectionLog } from '@/services/whatsappService';

interface WhatsAppHealthDashboardProps {
  instanceId?: string;
}

export const WhatsAppHealthDashboard: React.FC<WhatsAppHealthDashboardProps> = ({
  instanceId
}) => {
  const [selectedLogType, setSelectedLogType] = useState<string>('all');
  const { data: logs, isLoading, refetch } = useWhatsAppConnectionLogs(instanceId || '', 100);

  // Filtrar logs por tipo
  const filteredLogs = logs?.filter(log => {
    if (selectedLogType === 'all') return true;
    return log.action === selectedLogType;
  }) || [];

  // Estatísticas dos logs
  const logStats = logs?.reduce((stats, log) => {
    const today = new Date().toDateString();
    const logDate = new Date(log.createdAt).toDateString();
    const isToday = today === logDate;
    
    stats.total++;
    if (isToday) stats.today++;
    
    switch (log.action) {
      case 'CONNECT':
        stats.connections++;
        break;
      case 'DISCONNECT':
        stats.disconnections++;
        break;
      case 'QR_GENERATED':
        stats.qrGenerated++;
        break;
      case 'ERROR':
        stats.errors++;
        break;
    }
    
    return stats;
  }, {
    total: 0,
    today: 0,
    connections: 0,
    disconnections: 0,
    qrGenerated: 0,
    errors: 0
  }) || {
    total: 0,
    today: 0,
    connections: 0,
    disconnections: 0,
    qrGenerated: 0,
    errors: 0
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CONNECT':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'DISCONNECT':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'QR_GENERATED':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'RECONNECT':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CONNECT':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'DISCONNECT':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'QR_GENERATED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'ERROR':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'RECONNECT':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  if (!instanceId) {
    return (
      <Card className="imobipro-card h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Monitoramento não disponível</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Crie uma instância WhatsApp para visualizar logs e estatísticas de conexão.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Total Logs</p>
                <p className="text-lg font-bold">{logStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Conexões</p>
                <p className="text-lg font-bold text-green-600">{logStats.connections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">QR Codes</p>
                <p className="text-lg font-bold text-blue-600">{logStats.qrGenerated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="imobipro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Erros</p>
                <p className="text-lg font-bold text-red-600">{logStats.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Atualizar
          </Button>

          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedLogType}
              onChange={(e) => setSelectedLogType(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="all">Todos os logs</option>
              <option value="CONNECT">Conexões</option>
              <option value="DISCONNECT">Desconexões</option>
              <option value="QR_GENERATED">QR Codes</option>
              <option value="ERROR">Erros</option>
              <option value="RECONNECT">Reconexões</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {logStats.today} eventos hoje
        </div>
      </div>

      {/* Lista de logs */}
      <Card className="imobipro-card flex-1 min-h-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">📋 Histórico de Atividades</CardTitle>
              <CardDescription className="text-xs">
                Logs detalhados das operações da instância
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredLogs.length} registros
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-sm font-medium mb-2">Nenhum log encontrado</h3>
              <p className="text-xs max-w-md mx-auto">
                {selectedLogType === 'all' 
                  ? 'Ainda não há atividades registradas para esta instância.'
                  : `Nenhum log do tipo "${selectedLogType}" encontrado.`
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0 ${getActionColor(log.action)}`}
                          >
                            {log.action}
                          </Badge>
                          {log.retryCount > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              {log.retryCount} tentativas
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {log.duration && (
                            <span>{formatDuration(log.duration)}</span>
                          )}
                          <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground">{log.status}</p>
                      
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded border border-red-200">
                          {log.errorMessage}
                        </p>
                      )}
                      
                      {log.metadata && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Ver detalhes
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppHealthDashboard;