import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  Archive,
  Home,
  FileText,
  AlertTriangle,
  Wrench,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatSession, LegalCategory } from '@/types/leiInquilino';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLeiInquilinoChat } from '@/hooks/useLeiInquilinoChat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatSidebarProps {
  className?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ className }) => {
  const {
    currentSession,
    sessions,
    legalCategories,
    createNewSession,
    loadSession,
    endSession
  } = useLeiInquilinoChat();

  const getCategoryIcon = (iconName: string) => {
    const icons = {
      Home,
      FileText,
      AlertTriangle,
      Wrench
    };
    const IconComponent = icons[iconName as keyof typeof icons] || MessageSquare;
    return IconComponent;
  };

  const getStatusIcon = (status: ChatSession['status']) => {
    switch (status) {
      case 'active':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const handleNewSession = (category?: LegalCategory) => {
    createNewSession(
      category ? `Consulta - ${category.name}` : 'Nova Consulta',
      category
    );
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const closedSessions = sessions.filter(s => s.status === 'closed');

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Consultas</CardTitle>
          <Button
            size="sm"
            onClick={() => handleNewSession()}
            className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="px-4 space-y-4">
            {/* Quick Start Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-2">
                Iniciar Consulta por Categoria
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {legalCategories.map((category) => {
                  const IconComponent = getCategoryIcon(category.icon);
                  return (
                    <Button
                      key={category.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleNewSession(category)}
                      className="justify-start h-auto p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent 
                            className="w-4 h-4"
                            style={{ color: category.color }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-xs">
                            {category.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {category.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Sessões Ativas ({activeSessions.length})
                </h3>
                <div className="space-y-2">
                  {activeSessions.map((session) => {
                    const IconComponent = getCategoryIcon(session.category.icon);
                    const isCurrentSession = currentSession?.id === session.id;
                    
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "group relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                          isCurrentSession 
                            ? "bg-imobipro-blue/10 border-imobipro-blue shadow-sm" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${session.category.color}20` }}
                          >
                            <IconComponent 
                              className="w-3 h-3"
                              style={{ color: session.category.color }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium truncate">
                                {session.title}
                              </h4>
                              {getStatusIcon(session.status)}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {session.lastMessage || 'Nenhuma mensagem ainda'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {session.messagesCount} msgs
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(session.updatedAt, { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Session Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  endSession(session.id);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Encerrar Sessão
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Closed Sessions */}
            {closedSessions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground px-2 flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    Histórico ({closedSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {closedSessions.slice(0, 5).map((session) => {
                      const IconComponent = getCategoryIcon(session.category.icon);
                      
                      return (
                        <div
                          key={session.id}
                          className="p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-all opacity-75"
                          onClick={() => loadSession(session.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: `${session.category.color}15` }}
                            >
                              <IconComponent 
                                className="w-3 h-3 opacity-60"
                                style={{ color: session.category.color }}
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate mb-1">
                                {session.title}
                              </h4>
                              
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {session.messagesCount} msgs
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(session.updatedAt, { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {closedSessions.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        Ver mais {closedSessions.length - 5} sessões...
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Nenhuma consulta ainda
                </h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                  Inicie uma nova consulta jurídica escolhendo uma categoria acima
                </p>
                <Button
                  size="sm"
                  onClick={() => handleNewSession()}
                  className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Primeira Consulta
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatSidebar;