import React, { useState } from 'react';
import { Search, Filter, MoreVertical, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChatsManager } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { ChatWithDetails } from '@/services/chatsService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatListProps {
  selectedChatId?: string;
  onChatSelect: (chat: ChatWithDetails) => void;
  agentId?: string; // Para admin selecionar agente específico
}

export const ChatList: React.FC<ChatListProps> = ({
  selectedChatId,
  onChatSelect,
  agentId
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filters = {
    search: searchTerm,
    hasUnread: showUnreadOnly || undefined,
    agentId: agentId
  };

  const {
    chats,
    unreadChats,
    activeChats,
    isLoading,
    isError,
    canViewAllChats,
    refetch
  } = useChatsManager(filters);

  const filteredChats = React.useMemo(() => {
    let result = chats;

    if (showUnreadOnly) {
      result = unreadChats;
    }

    if (searchTerm) {
      result = result.filter(chat => 
        chat.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result.sort((a, b) => {
      // Priorizar chats com mensagens não lidas
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Depois ordenar por última atualização
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [chats, unreadChats, searchTerm, showUnreadOnly]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="h-full p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <p className="text-gray-600">Erro ao carregar chats</p>
            <Button variant="outline" onClick={refetch} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header com busca e filtros */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Conversas
            {unreadChats.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadChats.length}
              </Badge>
            )}
          </h2>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                {showUnreadOnly ? 'Mostrar todas' : 'Apenas não lidas'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={refetch}>
                Atualizar lista
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Barra de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats rápidas */}
        <div className="flex space-x-4 text-sm text-gray-600">
          <span>Total: {chats.length}</span>
          <span>Não lidas: {unreadChats.length}</span>
          <span>Ativas: {activeChats.length}</span>
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChatId === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar do contato */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(chat.contact.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Conteúdo principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {chat.contact.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="h-5 min-w-[20px] text-xs">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </Badge>
                        )}
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(chat.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Última mensagem */}
                    {chat.lastMessage ? (
                      <p className={`text-sm truncate ${
                        chat.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        {chat.lastMessage.senderId === user?.id ? 'Você: ' : ''}
                        {truncateMessage(chat.lastMessage.content)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
                    )}

                    {/* Info do contato */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {chat.contact.phone && (
                          <span>{chat.contact.phone}</span>
                        )}
                        {chat.messagesCount > 0 && (
                          <span>• {chat.messagesCount} mensagens</span>
                        )}
                      </div>

                      {/* Menu de ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            Marcar como lida
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Ver contato
                          </DropdownMenuItem>
                          {canViewAllChats && (
                            <DropdownMenuItem className="text-red-600">
                              Arquivar conversa
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};