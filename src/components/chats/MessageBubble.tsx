import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageWithSender } from '@/services/messagesService';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: MessageWithSender;
  isLastMessage?: boolean;
  showSenderName?: boolean;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLastMessage = false,
  showSenderName = false,
  className
}) => {
  const { user } = useAuth();
  const isFromCurrentUser = message.senderId === user?.id;
  const isFromAgent = message.sender.role === 'AGENT' || message.sender.role === 'ADMIN' || message.sender.role === 'CREATOR';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(messageDate, 'HH:mm', { locale: ptBR });
    } else if (diffInHours < 24 * 7) {
      return format(messageDate, 'EEE HH:mm', { locale: ptBR });
    } else {
      return format(messageDate, 'dd/MM HH:mm', { locale: ptBR });
    }
  };

  const getStatusIcon = () => {
    // TODO: Implementar status real quando tivermos campos no banco
    // Por enquanto, assumir que mensagens do usuário atual são enviadas
    if (isFromCurrentUser) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    return null;
  };

  const renderMessageContent = () => {
    // Detectar URLs e torná-las clicáveis
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Avatar (apenas para mensagens de outros usuários) */}
      {!isFromCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={undefined} />
          <AvatarFallback 
            className={cn(
              "text-xs",
              isFromAgent ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            )}
          >
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col max-w-[70%]",
        isFromCurrentUser ? "ml-auto items-end" : "items-start"
      )}>
        {/* Nome do remetente */}
        {showSenderName && !isFromCurrentUser && (
          <div className="text-xs text-gray-600 mb-1 px-1">
            {message.sender.name}
            {isFromAgent && (
              <span className="ml-1 text-blue-600 font-medium">
                (Corretor)
              </span>
            )}
          </div>
        )}

        {/* Bolha da mensagem */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-2 max-w-full break-words",
            isFromCurrentUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          )}
        >
          {/* Conteúdo da mensagem */}
          <div className="text-sm leading-relaxed">
            {renderMessageContent()}
          </div>

          {/* Timestamp e status */}
          <div className={cn(
            "flex items-center justify-end gap-1 mt-1 text-xs",
            isFromCurrentUser ? "text-blue-100" : "text-gray-500"
          )}>
            <span>{formatMessageTime(message.sentAt)}</span>
            {getStatusIcon()}
          </div>
        </div>

        {/* Informações extras para a última mensagem */}
        {isLastMessage && (
          <div className="text-xs text-gray-500 mt-1 px-1">
            {formatDistanceToNow(new Date(message.sentAt), {
              addSuffix: true,
              locale: ptBR
            })}
          </div>
        )}
      </div>

      {/* Espaçador para mensagens do usuário atual */}
      {isFromCurrentUser && <div className="w-8 flex-shrink-0" />}
    </div>
  );
};