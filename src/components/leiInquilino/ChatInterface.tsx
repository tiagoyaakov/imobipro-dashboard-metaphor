import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  Clock, 
  Check, 
  AlertCircle,
  Sparkles,
  MessageSquare,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage, AgentStatus } from '@/types/leiInquilino';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLeiInquilinoChat } from '@/hooks/useLeiInquilinoChat';

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const {
    messages,
    currentSession,
    agentStatus,
    isLoading,
    isTyping,
    config,
    sendMessage,
    messagesEndRef
  } = useLeiInquilinoChat();

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      await sendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const getMessageStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />;
      case 'sent':
      case 'delivered':
        return <Check className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const hasReferences = message.metadata?.legalReferences && message.metadata.legalReferences.length > 0;
    const hasSuggestions = message.metadata?.suggestions && message.metadata.suggestions.length > 0;

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 mb-6 animate-fade-in",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-imobipro-blue text-white" 
            : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
        )}>
          {isUser ? (
            <User className="w-5 h-5" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>

        {/* Message Content */}
        <div className={cn(
          "flex-1 max-w-[80%]",
          isUser ? "flex flex-col items-end" : "flex flex-col items-start"
        )}>
          {/* Message Bubble */}
          <div className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-imobipro-blue text-white rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md border"
          )}>
            {/* Agent Name */}
            {!isUser && (
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  {config.agentPersonality.name}
                </span>
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-0">
                  IA
                </Badge>
              </div>
            )}

            {/* Message Text */}
            <div className={cn(
              "text-sm leading-relaxed",
              isUser ? "text-white" : "text-foreground"
            )}>
              {message.content.split('\n').map((line, index) => {
                // Processar markdown básico
                const processedLine = line
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/•/g, '•');

                return (
                  <div 
                    key={index}
                    dangerouslySetInnerHTML={{ __html: processedLine }}
                    className={line.startsWith('•') ? 'ml-4' : ''}
                  />
                );
              })}
            </div>
          </div>

          {/* Legal References */}
          {hasReferences && (
            <div className="mt-3 w-full">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Referências Legais
                </span>
              </div>
              <div className="space-y-2">
                {message.metadata!.legalReferences!.map((ref) => (
                  <Card key={ref.id} className="border-l-4 border-l-blue-600 dark:border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm text-foreground">
                            {ref.title}
                          </h5>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {ref.law} - {ref.article}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {ref.description}
                          </p>
                        </div>
                        <Badge 
                          className={cn(
                            "text-xs font-medium",
                            ref.relevance === 'high' 
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                              : ref.relevance === 'medium'
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          )}
                        >
                          {ref.relevance === 'high' ? 'Alta' : 
                           ref.relevance === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {hasSuggestions && (
            <div className="mt-3 w-full">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sugestões de perguntas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.metadata!.suggestions!.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-full border-slate-300 text-slate-700 hover:bg-imobipro-blue hover:text-white hover:border-imobipro-blue dark:border-slate-600 dark:text-slate-300 dark:hover:bg-imobipro-blue dark:hover:border-imobipro-blue transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Message Info */}
          <div className={cn(
            "flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-500",
            isUser ? "flex-row-reverse" : "flex-row"
          )}>
            <span>
              {formatDistanceToNow(message.timestamp, { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
            {isUser && getMessageStatusIcon(message.status)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Chat Header */}
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              {agentStatus.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {config.agentPersonality.name}
                <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {config.agentPersonality.role}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-sm font-medium",
              agentStatus.status === 'available' 
                ? "text-green-700 dark:text-green-400" 
                : "text-yellow-700 dark:text-yellow-400"
            )}>
              {agentStatus.status === 'available' ? 'Disponível' : 'Ocupado'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Resposta em ~{Math.round(agentStatus.responseTime.average / 1000)}s
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600 dark:text-slate-400">
                <MessageSquare className="w-12 h-12 mb-4 opacity-60" />
                <p className="text-center text-sm">
                  Inicialize uma conversa para começar a receber assistência jurídica
                </p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {config.agentPersonality.name} está digitando...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Input Area */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Faça sua pergunta jurídica para ${config.agentPersonality.name}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            maxLength={config.maxMessageLength}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Character Counter */}
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-500">
          <span>
            Pressione Enter para enviar, Shift+Enter para nova linha
          </span>
          <span>
            {inputMessage.length}/{config.maxMessageLength}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;