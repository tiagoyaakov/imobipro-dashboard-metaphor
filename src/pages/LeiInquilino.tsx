import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  Bot, 
  Sparkles, 
  Shield, 
  BookOpen,
  MessageSquare,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatInterface from '@/components/leiInquilino/ChatInterface';
import ChatSidebar from '@/components/leiInquilino/ChatSidebar';
import { useLeiInquilinoChat } from '@/hooks/useLeiInquilinoChat';

const LeiInquilino = () => {
  const { 
    currentSession, 
    sessions, 
    agentStatus, 
    legalCategories,
    config 
  } = useLeiInquilinoChat();
  
  const [showSidebar, setShowSidebar] = useState(true);

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const totalSessions = sessions.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-yellow-800" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Lei do Inquilino
              <Badge variant="secondary" className="text-sm">
                <Bot className="w-4 h-4 mr-1" />
                IA Powered
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Assistente jurídico inteligente com {config.agentPersonality.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats Cards */}
          <div className="hidden sm:flex items-center gap-3">
            <Card className="px-3 py-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-imobipro-blue" />
                <div className="text-center">
                  <div className="text-sm font-semibold">{activeSessions}</div>
                  <div className="text-xs text-muted-foreground">Ativas</div>
                </div>
              </div>
            </Card>
            
            <Card className="px-3 py-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div className="text-center">
                  <div className="text-sm font-semibold">{totalSessions}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </Card>
            
            <Card className="px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  agentStatus.isOnline ? "bg-green-500" : "bg-gray-400"
                )} />
                <div className="text-center">
                  <div className="text-sm font-semibold">
                    {agentStatus.isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-xs text-muted-foreground">Agent</div>
                </div>
              </div>
            </Card>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden"
          >
            <Users className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: Shield,
            title: 'Consultoria Especializada',
            description: 'IA treinada em legislação imobiliária brasileira',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20'
          },
          {
            icon: BookOpen,
            title: 'Base Legal Atualizada',
            description: 'Referências atualizadas da Lei 8.245/91',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20'
          },
          {
            icon: MessageSquare,
            title: 'Chat Inteligente',
            description: 'Respostas contextuais em tempo real',
            color: 'text-green-500',
            bgColor: 'bg-green-50 dark:bg-green-950/20'
          },
          {
            icon: Settings,
            title: 'Integração N8N',
            description: 'Powered by workflows automatizados',
            color: 'text-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20'
          }
        ].map((feature, index) => (
          <Card key={index} className={cn("p-4 border-l-4", feature.bgColor)} style={{
            borderLeftColor: feature.color.replace('text-', '').replace('-500', '')
          }}>
            <div className="flex items-center gap-3">
              <feature.icon className={cn("w-5 h-5", feature.color)} />
              <div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
        {/* Sidebar */}
        <div className={cn(
          "lg:col-span-3 transition-all duration-300",
          showSidebar ? "block" : "hidden lg:block"
        )}>
          <ChatSidebar className="h-full" />
        </div>
        
        {/* Chat */}
        <div className={cn(
          "transition-all duration-300",
          showSidebar ? "lg:col-span-9" : "lg:col-span-12"
        )}>
          {currentSession ? (
            <ChatInterface className="h-full" />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">
                  Bem-vindo ao {config.agentPersonality.name}
                </CardTitle>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Seu assistente jurídico especializado em questões imobiliárias. 
                  Inicie uma nova consulta para receber orientações personalizadas.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                  {legalCategories.slice(0, 4).map((category) => {
                    const IconComponent = {
                      Home: () => <div className="w-6 h-6 bg-blue-500 rounded" />,
                      FileText: () => <div className="w-6 h-6 bg-purple-500 rounded" />,
                      AlertTriangle: () => <div className="w-6 h-6 bg-orange-500 rounded" />,
                      Wrench: () => <div className="w-6 h-6 bg-green-500 rounded" />
                    }[category.icon] || (() => <div className="w-6 h-6 bg-gray-500 rounded" />);
                    
                    return (
                      <Card key={category.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <Scale className="w-4 h-4" style={{ color: category.color }} />
                          </div>
                          <h4 className="font-semibold text-sm">{category.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Todas as consultas são confidenciais e baseadas na legislação brasileira atual
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeiInquilino;
