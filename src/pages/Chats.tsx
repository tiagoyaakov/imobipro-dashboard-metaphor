
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Bot,
  BarChart3,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChatList, 
  ChatWindow, 
  ChatSummaryPanel, 
  EvolutionApiConnection 
} from '@/components/chats';
import { useChatsManager } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { ChatWithDetails } from '@/services/chatsService';
import { WhatsAppInstanceStatus } from '@/services/evolutionApiService';
import { cn } from '@/lib/utils';

const Chats = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CREATOR';
  
  // Estados
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    isAdmin ? undefined : user?.id
  );
  const [evolutionStatus, setEvolutionStatus] = useState<WhatsAppInstanceStatus | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Buscar usuários para admin
  const { data: users } = useUsers({ enabled: isAdmin });
  const agents = users?.filter(u => u.role === 'AGENT') || [];

  // Gerenciar chats
  const {
    chats,
    stats,
    unreadChats,
    activeChats,
    isLoading,
    canViewAllChats,
    refetch
  } = useChatsManager({ agentId: selectedAgentId });

  // Detectar mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Auto-selecionar primeiro chat se não há nenhum selecionado
  useEffect(() => {
    if (!selectedChat && chats.length > 0) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  const handleChatSelect = (chat: ChatWithDetails) => {
    setSelectedChat(chat);
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId === 'all' ? undefined : agentId);
    setSelectedChat(null);
  };

  const handleEvolutionStatusChange = (status: WhatsAppInstanceStatus) => {
    setEvolutionStatus(status);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  // Stats cards para dashboard
  const statsCards = [
    {
      title: 'Total de Chats',
      value: stats?.totalChats || 0,
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      title: 'Não Lidas',
      value: unreadChats.length,
      icon: MessageSquare,
      color: 'text-red-600'
    },
    {
      title: 'Ativas Hoje',
      value: activeChats.length,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'WhatsApp',
      value: evolutionStatus?.status === 'connected' ? 'Conectado' : 'Desconectado',
      icon: Bot,
      color: evolutionStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Chats</h1>
              <p className="text-gray-600">Central de mensagens e comunicação</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de agente para admin */}
            {isAdmin && (
              <Select value={selectedAgentId || 'all'} onValueChange={handleAgentChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar corretor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os corretores</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <div>
                    <p className="text-xs text-gray-600">{stat.title}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="conversations" className="h-full">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversas
                {unreadChats.length > 0 && (
                  <Badge variant="secondary">{unreadChats.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Conversas */}
          <TabsContent value="conversations" className="h-full mt-0">
            <div className="h-full flex">
              {/* Lista de chats - Desktop sempre visível, mobile apenas quando não há chat selecionado */}
              <div className={cn(
                "border-r bg-background",
                isMobile 
                  ? selectedChat 
                    ? "hidden" 
                    : "w-full"
                  : "w-80 flex-shrink-0"
              )}>
                <ChatList
                  selectedChatId={selectedChat?.id}
                  onChatSelect={handleChatSelect}
                  agentId={selectedAgentId}
                />
              </div>

              {/* Chat principal - Desktop sempre visível, mobile apenas quando há chat selecionado */}
              <div className={cn(
                "flex-1 flex",
                isMobile && !selectedChat ? "hidden" : ""
              )}>
                {selectedChat ? (
                  <>
                    {/* Janela do chat */}
                    <div className="flex-1">
                      <ChatWindow
                        chat={selectedChat}
                        onBack={isMobile ? handleBackToList : undefined}
                        showBackButton={isMobile}
                      />
                    </div>

                    {/* Painel de resumo - apenas para admin e desktop */}
                    {isAdmin && !isMobile && (
                      <div className="w-80 border-l bg-gray-50/50">
                        <ChatSummaryPanel chat={selectedChat} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50/50">
                    <div className="text-center space-y-4">
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Selecione uma conversa
                        </h3>
                        <p className="text-gray-600">
                          Escolha uma conversa para começar a trocar mensagens
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="h-full p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumos de Conversas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Analytics de conversas em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance de Atendimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Métricas de performance em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings" className="h-full p-6">
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>WhatsApp Evolution API</CardTitle>
                </CardHeader>
                <CardContent>
                  <EvolutionApiConnection
                    instanceId={user?.id}
                    onStatusChange={handleEvolutionStatusChange}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Configurações avançadas de chat em desenvolvimento
                    </div>
                    <Button variant="outline" disabled>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Automações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Chats;
