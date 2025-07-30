import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, MoreVertical, ArrowLeft, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMessagesManager } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { ChatWithDetails } from '@/services/chatsService';
import { MessageBubble } from './MessageBubble';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatWindowProps {
  chat: ChatWithDetails;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  onBack,
  showBackButton = false
}) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    stats,
    sendMessage,
    isSending,
    isLoading,
    canSendMessages,
    refetch
  } = useMessagesManager(chat.id, {
    enableRealTime: true,
    limit: 50,
    onNewMessage: (newMessage) => {
      // Scroll para a nova mensagem se ela não for do usuário atual
      if (newMessage.senderId !== user?.id) {
        scrollToBottom();
      }
    }
  });

  // Auto-scroll para o final quando há novas mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !canSendMessages || isSending) {
      return;
    }

    try {
      await sendMessage(messageText.trim());
      setMessageText('');
      scrollToBottom();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header do chat */}
      <CardHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(chat.contact.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {chat.contact.name}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {chat.contact.phone && (
                  <span>{chat.contact.phone}</span>
                )}
                {stats && (
                  <span>• {stats.totalMessages} mensagens</span>
                )}
                {chat.lastMessage && (
                  <span>• última: {formatLastSeen(chat.lastMessage.sentAt)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Ações do chat */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  Ver informações do contato
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Gerar resumo da conversa
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Histórico completo
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Exportar conversa
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Arquivar conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status do chat */}
        {chat.unreadCount > 0 && (
          <div className="mt-2">
            <Badge variant="secondary">
              {chat.unreadCount} mensagem{chat.unreadCount > 1 ? 's' : ''} não lida{chat.unreadCount > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardHeader>

      {/* Área de mensagens */}
      <div className="flex-1 relative">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg mb-2">Nenhuma mensagem ainda</p>
                  <p className="text-sm">Inicie uma conversa com {chat.contact.name}</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLastMessage={index === messages.length - 1}
                    showSenderName={
                      index === 0 || 
                      messages[index - 1].senderId !== message.senderId
                    }
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Barra de input de mensagem */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              placeholder={`Mensagem para ${chat.contact.name}...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!canSendMessages || isSending}
              className="resize-none"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!messageText.trim() || !canSendMessages || isSending}
            className="flex-shrink-0"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Status de digitação */}
        <div className="mt-2 text-xs text-gray-500">
          {!canSendMessages && (
            <span>Não é possível enviar mensagens neste momento</span>
          )}
        </div>
      </div>
    </div>
  );
};