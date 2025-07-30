// ===================================================================
// DEAL DETAILS MODAL COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Modal para visualização detalhada de deals com histórico de estágios,
// atividades, timeline e ações rápidas

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  DollarSign,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Target,
  TrendingUp,
  MessageSquare,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Deal, DealStage, DEAL_STAGE_CONFIGS } from '@/types/pipeline';
import { useDealStageHistory, useDealActivities } from '@/hooks/usePipeline';
import { formatCurrency, getProbabilityColor } from '@/services/pipelineService';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface DealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onEdit?: (deal: Deal) => void;
  onDelete?: (dealId: string) => void;
}

// ===================================================================
// COMPONENTES AUXILIARES
// ===================================================================

function DealStageTimeline({ dealId }: { dealId: string }) {
  const { data: stageHistory, isLoading } = useDealStageHistory(dealId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stageHistory || stageHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum histórico de estágios disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stageHistory.map((entry, index) => {
        const fromConfig = DEAL_STAGE_CONFIGS[entry.fromStage];
        const toConfig = DEAL_STAGE_CONFIGS[entry.toStage];
        
        return (
          <div key={entry.id} className="flex items-start space-x-4">
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${toConfig.color}20`, color: toConfig.color }}
              >
                {entry.toStage === DealStage.WON ? (
                  <CheckCircle className="h-4 w-4" />
                ) : entry.toStage === DealStage.LOST ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </div>
              {index < stageHistory.length - 1 && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-200" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-medium text-sm">
                  {fromConfig.name} → {toConfig.name}
                </p>
                <Badge
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${toConfig.color}20`,
                    color: toConfig.color 
                  }}
                  className="text-xs"
                >
                  {toConfig.name}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-500 mb-1">
                {format(new Date(entry.changedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {entry.changedByName && ` • por ${entry.changedByName}`}
              </p>
              
              {entry.reason && (
                <p className="text-xs text-gray-600 italic">"{entry.reason}"</p>
              )}
              
              {entry.durationInPreviousStage && (
                <p className="text-xs text-gray-500 mt-1">
                  Permaneceu {entry.durationInPreviousStage} dias no estágio anterior
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DealActivitiesList({ dealId }: { dealId: string }) {
  const { data: activities, isLoading } = useDealActivities(dealId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma atividade registrada</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'STAGE_CHANGED': return ArrowRight;
      case 'PROPOSAL_SENT': return FileText;
      case 'MEETING_SCHEDULED': return Calendar;
      case 'CALL_MADE': return Phone;
      case 'EMAIL_SENT': return Mail;
      case 'WHATSAPP_SENT': return MessageSquare;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.type);
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="h-3 w-3 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {activity.createdByName && ` • por ${activity.createdByName}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function DealDetailsModal({
  isOpen,
  onClose,
  deal,
  onEdit,
  onDelete,
}: DealDetailsModalProps) {
  
  const [activeTab, setActiveTab] = useState('overview');

  if (!deal) return null;

  // ===================================================================
  // DADOS COMPUTADOS
  // ===================================================================
  
  const stageConfig = DEAL_STAGE_CONFIGS[deal.currentStage];
  const probabilityColor = getProbabilityColor(deal.probability);
  const formattedValue = formatCurrency(deal.value);
  
  const clientInitials = deal.client?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const daysInStage = deal.daysInStage || 0;
  const isOverdue = daysInStage > 14;

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  
  const handleEdit = () => {
    onEdit?.(deal);
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja remover este deal?')) {
      onDelete?.(deal.id);
      onClose();
    }
  };

  // ===================================================================
  // RENDER HELPERS
  // ===================================================================
  
  const renderHeader = () => (
    <DialogHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <DialogTitle className="text-xl font-bold leading-tight mb-2">
            {deal.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            Detalhes completos do deal e histórico de atividades
          </DialogDescription>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge
            variant="secondary"
            style={{ 
              backgroundColor: `${stageConfig.color}20`,
              color: stageConfig.color,
              borderColor: stageConfig.color
            }}
            className="text-sm font-medium"
          >
            {stageConfig.name}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar deal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </DialogHeader>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium">Valor do Deal</span>
            </div>
            <p className="text-2xl font-bold">{formattedValue}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 mr-2" style={{ color: probabilityColor }} />
              <span className="text-sm font-medium">Probabilidade</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: probabilityColor }}>
              {deal.probability}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className={`h-5 w-5 mr-2 ${isOverdue ? 'text-orange-500' : 'text-blue-500'}`} />
              <span className="text-sm font-medium">Tempo no Estágio</span>
            </div>
            <p className={`text-2xl font-bold ${isOverdue ? 'text-orange-600' : ''}`}>
              {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cliente */}
        {deal.client && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {clientInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{deal.client.name}</h4>
                  <div className="space-y-1 mt-2">
                    {deal.client.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {deal.client.email}
                      </div>
                    )}
                    {deal.client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {deal.client.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Propriedade */}
        {deal.property && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="h-5 w-5 mr-2" />
                Propriedade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">{deal.property.title}</h4>
              {deal.property.address && (
                <p className="text-sm text-gray-600">{deal.property.address}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Responsável */}
        {deal.agent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2" />
                Responsável
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {deal.agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{deal.agent.name}</p>
                  <p className="text-sm text-gray-500">Corretor responsável</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2" />
              Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Criado em:</span>
              <span className="font-medium">
                {format(new Date(deal.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            
            {deal.expectedCloseDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Previsão de fechamento:</span>
                <span className="font-medium">
                  {format(new Date(deal.expectedCloseDate), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
            
            {deal.closedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fechado em:</span>
                <span className="font-medium">
                  {format(new Date(deal.closedAt), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próxima ação */}
      {deal.nextAction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              Próxima Ação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 dark:text-gray-100 mb-2">{deal.nextAction}</p>
            {deal.nextActionDate && (
              <p className="text-sm text-gray-500">
                Prazo: {format(new Date(deal.nextActionDate), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerta para deals que precisam de atenção */}
      {isOverdue && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Deal precisa de atenção
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Este deal está há {daysInStage} dias no estágio {stageConfig.name}. 
                  Considere tomar uma ação para movê-lo para o próximo estágio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ===================================================================
  // RENDER PRINCIPAL
  // ===================================================================
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {renderHeader()}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-1">
                <TabsContent value="overview" className="mt-4">
                  {renderOverview()}
                </TabsContent>
                
                <TabsContent value="timeline" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico de Estágios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DealStageTimeline dealId={deal.id} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activities" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Atividades do Deal
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DealActivitiesList dealId={deal.id} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Deal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}