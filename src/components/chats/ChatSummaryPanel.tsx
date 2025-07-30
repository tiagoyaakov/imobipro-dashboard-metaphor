import React, { useState } from 'react';
import { 
  FileText, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChatSummaryManager } from '@/hooks/useChatSummary';
import { useMessagesManager } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { ChatWithDetails } from '@/services/chatsService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatSummaryPanelProps {
  chat: ChatWithDetails;
  className?: string;
}

export const ChatSummaryPanel: React.FC<ChatSummaryPanelProps> = ({
  chat,
  className
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CREATOR';
  const [isExpanded, setIsExpanded] = useState(false);

  // Buscar mensagens para gerar resumo
  const { messages } = useMessagesManager(chat.id, { limit: 50 });

  // Gerenciar resumos
  const {
    summary,
    insights,
    isLoading,
    isGenerating,
    isRegenerating,
    generateSummary,
    regenerateSummary,
    shouldRegenerateSummary,
    hasSummary,
    canViewSummaries,
    canManageSummaries
  } = useChatSummaryManager(chat.id);

  // Preparar dados das mensagens para o resumo
  const prepareMessagesForSummary = () => {
    return messages.map(msg => ({
      content: msg.content,
      sentAt: msg.sentAt,
      isFromAgent: msg.sender.role === 'AGENT' || msg.sender.role === 'ADMIN',
      senderName: msg.sender.name
    }));
  };

  const handleGenerateSummary = async () => {
    const messageData = prepareMessagesForSummary();
    if (messageData.length < 3) {
      return;
    }
    
    try {
      await generateSummary(messageData, {
        language: 'pt',
        summaryLength: 'medium',
        includeContext: true
      });
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    }
  };

  const handleRegenerateSummary = async () => {
    const messageData = prepareMessagesForSummary();
    if (messageData.length < 3) {
      return;
    }
    
    try {
      await regenerateSummary(messageData, {
        language: 'pt',
        summaryLength: 'medium',
        includeContext: true
      });
    } catch (error) {
      console.error('Erro ao regenerar resumo:', error);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  // Não mostrar se não for admin ou não puder ver resumos
  if (!canViewSummaries || !isAdmin) {
    return null;
  }

  // Se não há mensagens suficientes
  if (messages.length < 3) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Resumo da Conversa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Mínimo de 3 mensagens necessárias para gerar resumo
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Resumo da Conversa
          </CardTitle>
          
          {canManageSummaries && (
            <div className="flex gap-1">
              {hasSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateSummary}
                  disabled={isRegenerating}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado de carregamento */}
        {(isLoading || isGenerating || isRegenerating) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            {isGenerating ? 'Gerando resumo...' : 
             isRegenerating ? 'Atualizando resumo...' : 
             'Carregando...'}
          </div>
        )}

        {/* Botão para gerar resumo se não existe */}
        {!hasSummary && !isLoading && !isGenerating && (
          <Button
            onClick={handleGenerateSummary}
            disabled={messages.length < 3}
            className="w-full"
            variant="outline"
          >
            <Brain className="h-4 w-4 mr-2" />
            Gerar Resumo com IA
          </Button>
        )}

        {/* Resumo existente */}
        {summary && (
          <div className="space-y-3">
            {/* Indicadores de qualidade */}
            <div className="flex items-center gap-2 text-xs">
              <Badge className={getSentimentColor(summary.sentiment)}>
                {summary.sentiment === 'positive' ? 'Positiva' :
                 summary.sentiment === 'negative' ? 'Negativa' : 'Neutra'}
              </Badge>
              <Badge className={getPriorityColor(summary.priority)}>
                Prioridade {summary.priority === 'high' ? 'Alta' :
                          summary.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              {insights?.isReliable && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confiável
                </Badge>
              )}
            </div>

            {/* Confiança */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Confiança da IA</span>
                <span>{(summary.confidence * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={summary.confidence * 100} 
                className="h-2"
              />
            </div>

            <Separator />

            {/* Resumo principal */}
            <div>
              <h4 className="text-sm font-medium mb-2">Resumo</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary.summary}
              </p>
            </div>

            {/* Pontos chave */}
            {summary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Pontos Principais</h4>
                <ul className="space-y-1">
                  {summary.keyPoints.slice(0, isExpanded ? undefined : 3).map((point, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="flex-1">{point}</span>
                    </li>
                  ))}
                </ul>
                {summary.keyPoints.length > 3 && !isExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="mt-1 p-0 h-auto text-xs text-blue-600"
                  >
                    Ver mais {summary.keyPoints.length - 3} pontos...
                  </Button>
                )}
              </div>
            )}

            {/* Próxima ação */}
            {summary.nextAction && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Próxima Ação Sugerida
                </h4>
                <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  {summary.nextAction}
                </p>
              </div>
            )}

            {/* Categoria */}
            {summary.category && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Categoria:</span> {summary.category}
              </div>
            )}

            <Separator />

            {/* Metadados */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Gerado {format(summary.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
              <div className="flex gap-2">
                {shouldRegenerateSummary && (
                  <Badge variant="outline" className="text-yellow-600">
                    Desatualizado
                  </Badge>
                )}
                <span>{summary.wordCount} palavras</span>
              </div>
            </div>

            {/* Ações */}
            {canManageSummaries && (
              <div className="flex gap-2 pt-2">
                {shouldRegenerateSummary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateSummary}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Atualizar
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Exportar
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};