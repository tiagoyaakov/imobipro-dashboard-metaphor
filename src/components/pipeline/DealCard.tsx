// ===================================================================
// DEAL CARD COMPONENT - ImobiPRO Dashboard
// ===================================================================
// Componente de card individual para deals no pipeline Kanban
// com drag & drop, ações rápidas e design responsivo

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreHorizontal,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Deal, DealStage, DEAL_STAGE_CONFIGS } from '@/types/pipeline';
import { formatCurrency, getProbabilityColor } from '@/services/pipelineService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface DealCardProps {
  deal: Deal;
  isCompact?: boolean;
  showActions?: boolean;
  onEdit?: (deal: Deal) => void;
  onDelete?: (dealId: string) => void;
  onView?: (deal: Deal) => void;
  onMove?: (dealId: string, toStage: DealStage) => void;
  className?: string;
}

// Interface para drag & drop (placeholder)
interface DragItem {
  type: string;
  id: string;
  deal: Deal;
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function DealCard({
  deal,
  isCompact = false,
  showActions = true,
  onEdit,
  onDelete,
  onView,
  onMove,
  className = '',
}: DealCardProps) {
  
  // ===================================================================
  // DRAG AND DROP SETUP (PLACEHOLDER)
  // ===================================================================
  
  const isDragging = false;
  const drag = React.useRef<HTMLDivElement>(null);

  // ===================================================================
  // CONFIGURAÇÕES DO ESTÁGIO
  // ===================================================================
  
  const stageConfig = DEAL_STAGE_CONFIGS[deal.currentStage];
  const probabilityColor = getProbabilityColor(deal.probability);
  
  // ===================================================================
  // CÁLCULOS E FORMATAÇÕES
  // ===================================================================
  
  const formattedValue = formatCurrency(deal.value);
  const expectedCloseDate = deal.expectedCloseDate 
    ? format(new Date(deal.expectedCloseDate), 'dd/MM/yyyy', { locale: ptBR })
    : null;
  
  const daysInStage = deal.daysInStage || 0;
  const isOverdue = daysInStage > 14; // Mais de 14 dias no mesmo estágio
  
  const clientInitials = deal.client?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(deal);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(deal.id);
  };

  const handleView = () => {
    onView?.(deal);
  };

  const handleQuickMove = (toStage: DealStage) => {
    onMove?.(deal.id, toStage);
  };

  // ===================================================================
  // OPÇÕES DE MOVIMENTAÇÃO RÁPIDA
  // ===================================================================
  
  const availableStages = stageConfig.nextStages.filter(stage => stage !== deal.currentStage);

  // ===================================================================
  // RENDER CONDICIONAL - VERSÃO COMPACTA
  // ===================================================================
  
  if (isCompact) {
    return (
      <Card
        ref={drag}
        className={`
          cursor-pointer transition-all duration-200 hover:shadow-md
          ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
          ${isOverdue ? 'border-l-4 border-l-orange-500' : ''}
          ${className}
        `}
        onClick={handleView}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm truncate flex-1 mr-2">
              {deal.title}
            </h4>
            <Badge
              variant="secondary"
              style={{ 
                backgroundColor: `${probabilityColor}20`,
                color: probabilityColor,
                borderColor: probabilityColor
              }}
              className="text-xs"
            >
              {deal.probability}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formattedValue}
            </span>
            {deal.client && (
              <div className="flex items-center">
                <Avatar className="w-4 h-4 mr-1">
                  <AvatarFallback className="text-xs">{clientInitials}</AvatarFallback>
                </Avatar>
                <span className="truncate max-w-20">{deal.client.name}</span>
              </div>
            )}
          </div>
          
          {daysInStage > 7 && (
            <div className="mt-2 flex items-center text-xs text-orange-600">
              <Clock className="w-3 h-3 mr-1" />
              {daysInStage} dias neste estágio
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ===================================================================
  // RENDER PRINCIPAL - VERSÃO COMPLETA
  // ===================================================================
  
  return (
    <Card
      ref={drag}
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-lg
        ${isDragging ? 'opacity-50 rotate-1 scale-105 shadow-xl' : ''}
        ${isOverdue ? 'border-l-4 border-l-orange-500' : ''}
        ${className}
      `}
      onClick={handleView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <h4 className="font-semibold text-base leading-tight mb-1 truncate">
              {deal.title}
            </h4>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {formattedValue}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${probabilityColor}20`,
                      color: probabilityColor,
                      borderColor: probabilityColor
                    }}
                    className="text-sm font-medium"
                  >
                    {deal.probability}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Probabilidade de fechamento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  
                  {availableStages.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {availableStages.map(stage => {
                        const targetConfig = DEAL_STAGE_CONFIGS[stage];
                        return (
                          <DropdownMenuItem 
                            key={stage}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickMove(stage);
                            }}
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Mover para {targetConfig.name}
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Cliente Info */}
        {deal.client && (
          <div className="flex items-center mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Avatar className="w-8 h-8 mr-3">
              <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                {clientInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{deal.client.name}</p>
              <div className="flex items-center text-xs text-gray-500 space-x-3">
                {deal.client.email && (
                  <div className="flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    <span className="truncate max-w-24">{deal.client.email}</span>
                  </div>
                )}
                {deal.client.phone && (
                  <div className="flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    <span>{deal.client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Property Info */}
        {deal.property && (
          <div className="flex items-center mb-3 text-sm">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <span className="truncate">{deal.property.title}</span>
          </div>
        )}
        
        {/* Timeline Info */}
        <div className="space-y-2 text-sm">
          {expectedCloseDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Previsão de fechamento</span>
              </div>
              <span className="font-medium">{expectedCloseDate}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-2" />
              <span>Tempo neste estágio</span>
            </div>
            <span className={`font-medium ${isOverdue ? 'text-orange-600' : ''}`}>
              {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          
          {deal.agent && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4 mr-2" />
                <span>Responsável</span>
              </div>
              <span className="font-medium truncate max-w-32">{deal.agent.name}</span>
            </div>
          )}
        </div>
        
        {/* Next Action */}
        {deal.nextAction && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
              Próxima ação:
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {deal.nextAction}
            </p>
            {deal.nextActionDate && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Prazo: {format(new Date(deal.nextActionDate), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
          </div>
        )}
        
        {/* Warning for overdue deals */}
        {isOverdue && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" />
              <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                Deal precisa de atenção
              </p>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Há {daysInStage} dias neste estágio
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}