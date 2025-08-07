// ================================================================
// COMPONENTE KANBAN BOARD - CRM FUNIL VISUAL
// ================================================================
// Data: 07/08/2025
// Descrição: Kanban board com drag-and-drop para gestão visual do funil de clientes
// Features: Drag & Drop, filtros, permissões, cards informativos
// ================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided
} from '@hello-pangea/dnd';
import {
  UserPlus,
  Phone, 
  Star,
  Heart,
  Handshake,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  Mail,
  MoreVertical
} from 'lucide-react';
import { 
  STATUS_CLIENTE_CONFIG, 
  STATUS_ORDER,
  type StatusCliente, 
  type ClienteKanbanCard,
  type KanbanBoardProps 
} from '@/types/clientes';
import { cn } from '@/lib/utils';

// Mapa de ícones
const ICON_MAP = {
  UserPlus,
  Phone,
  Star,
  Heart,
  Handshake,
  CheckCircle,
  XCircle
};

interface KanbanColumnProps {
  status: StatusCliente;
  clientes: ClienteKanbanCard[];
  provided: DroppableProvided;
}

// Card individual do cliente no Kanban
const ClienteCard: React.FC<{
  cliente: ClienteKanbanCard;
  provided: DraggableProvided;
  isDragging: boolean;
}> = ({ cliente, provided, isDragging }) => {
  const statusConfig = STATUS_CLIENTE_CONFIG[cliente.status];
  
  // Iniciais do nome para avatar
  const initials = cliente.nome
    .split(' ')
    .map(n => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Cor do score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "mb-3 transition-all duration-200",
        isDragging && "rotate-2 scale-105 shadow-lg"
      )}
    >
      <Card className="hover:shadow-md cursor-grab active:cursor-grabbing">
        <CardContent className="p-4">
          {/* Header do card */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium leading-tight truncate">
                  {cliente.nome}
                </h4>
                {cliente.empresa && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {cliente.empresa}
                  </p>
                )}
              </div>
            </div>
            
            {/* Score badge */}
            <Badge 
              variant="secondary" 
              className={cn("text-xs px-2 py-0.5", getScoreColor(cliente.score_lead))}
            >
              {cliente.score_lead}
            </Badge>
          </div>

          {/* Informações de contato */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
              <span className="truncate">{cliente.telefone}</span>
            </div>
            
            {cliente.email && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{cliente.email}</span>
              </div>
            )}
          </div>

          {/* Metadados */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              {cliente.origem_lead && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {cliente.origem_lead}
                </Badge>
              )}
            </div>
            
            {cliente.proxima_acao && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{new Date(cliente.proxima_acao).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Coluna do Kanban
const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  status, 
  clientes, 
  provided 
}) => {
  const config = STATUS_CLIENTE_CONFIG[status];
  const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];
  
  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-lg p-4 min-w-[280px]">
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {IconComponent && <IconComponent className={cn("h-4 w-4", config.color)} />}
          <h3 className="font-medium text-sm">{config.label}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {clientes.length}
        </Badge>
      </div>

      {/* Descrição da coluna */}
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        {config.description}
      </p>

      {/* Lista de clientes */}
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className="flex-1 min-h-[200px]"
      >
        {clientes.map((cliente, index) => (
          <Draggable 
            key={cliente.id} 
            draggableId={cliente.id} 
            index={index}
          >
            {(provided, snapshot) => (
              <ClienteCard
                cliente={cliente}
                provided={provided}
                isDragging={snapshot.isDragging}
              />
            )}
          </Draggable>
        ))}
        {provided.placeholder}
        
        {/* Placeholder quando vazio */}
        {clientes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">Nenhum cliente nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal do KanbanBoard
const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  clientes, 
  onStatusChange, 
  isLoading = false,
  currentUserRole,
  currentUserId 
}) => {
  const [draggedClienteId, setDraggedClienteId] = useState<string | null>(null);

  // Agrupar clientes por status
  const clientesPorStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = clientes.filter(cliente => {
      // Filtrar por permissões: AGENT só vê próprios clientes
      if (currentUserRole === 'AGENT' && currentUserId) {
        return cliente.status === status && cliente.funcionario === currentUserId;
      }
      // ADMIN e DEV_MASTER veem todos
      return cliente.status === status;
    });
    return acc;
  }, {} as Record<StatusCliente, ClienteKanbanCard[]>);

  // Handler do drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não tem destino, cancelar
    if (!destination) {
      setDraggedClienteId(null);
      return;
    }
    
    // Se soltou na mesma posição, cancelar
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      setDraggedClienteId(null);
      return;
    }

    // Atualizar o status do cliente
    const novoStatus = destination.droppableId as StatusCliente;
    onStatusChange(draggableId, novoStatus);
    
    setDraggedClienteId(null);
  };

  const handleDragStart = (start: any) => {
    setDraggedClienteId(start.draggableId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando funil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header com resumo */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {STATUS_ORDER.map(status => {
            const config = STATUS_CLIENTE_CONFIG[status];
            const count = clientesPorStatus[status]?.length || 0;
            
            return (
              <div key={status} className="text-center">
                <div className={cn("text-2xl font-bold", config.color)}>
                  {count}
                </div>
                <div className="text-xs text-muted-foreground">
                  {config.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext 
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map(status => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <KanbanColumn
                  status={status}
                  clientes={clientesPorStatus[status] || []}
                  provided={provided}
                />
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Legenda de permissões */}
      {currentUserRole === 'AGENT' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Modo Corretor:</strong> Visualizando apenas seus clientes atribuídos.
          </p>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;