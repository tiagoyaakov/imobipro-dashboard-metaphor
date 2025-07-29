/**
 * 🔲 ImobiPRO - Componente Kanban do Funil de Leads
 * 
 * Interface Kanban completa para gestão visual do funil de vendas.
 * Suporta drag & drop, filtros avançados e estatísticas em tempo real.
 * 
 * Funcionalidades:
 * - Drag & drop entre estágios
 * - Filtros por score, fonte, agente
 * - Busca inteligente
 * - Ações em lote
 * - Estatísticas por coluna
 * - Cards com informações relevantes
 * - Responsivo e otimizado
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import '@/styles/kanban.css';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  MessageCircle,
  Star,
  TrendingUp,
  Plus,
  SortAsc,
  Users,
  Target,
  Clock,
  DollarSign
} from 'lucide-react';
import { useFunnelKanban } from '@/hooks/useClients';
import type { ContactWithDetails } from '@/services/clientsService';
import type { LeadStage } from '@prisma/client';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface LeadFunnelKanbanProps {
  agentId?: string;
  className?: string;
  onContactSelect?: (contact: ContactWithDetails) => void;
  onContactCreate?: () => void;
}

interface KanbanFilters {
  search: string;
  minScore: number;
  maxScore: number;
  leadSource: string;
  priority: string;
  tags: string[];
}

// ============================================================================
// CONFIGURAÇÕES DO FUNIL
// ============================================================================

const LEAD_STAGES: Array<{
  id: LeadStage;
  label: string;
  color: string;
  bgColor: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'NEW',
    label: 'Novos',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Leads recém-chegados',
    icon: <Plus className="w-4 h-4" />
  },
  {
    id: 'CONTACTED',
    label: 'Contatados',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Primeiro contato realizado',
    icon: <Phone className="w-4 h-4" />
  },
  {
    id: 'QUALIFIED',
    label: 'Qualificados',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Leads qualificados',
    icon: <Target className="w-4 h-4" />
  },
  {
    id: 'INTERESTED',
    label: 'Interessados',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200',
    description: 'Demonstraram interesse',
    icon: <Star className="w-4 h-4" />
  },
  {
    id: 'NEGOTIATING',
    label: 'Negociando',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Em processo de negociação',
    icon: <DollarSign className="w-4 h-4" />
  },
  {
    id: 'CONVERTED',
    label: 'Convertidos',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Fecharam negócio',
    icon: <TrendingUp className="w-4 h-4" />
  },
  {
    id: 'LOST',
    label: 'Perdidos',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Leads perdidos',
    icon: <Clock className="w-4 h-4" />
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function LeadFunnelKanban({ 
  agentId, 
  className = '',
  onContactSelect,
  onContactCreate 
}: LeadFunnelKanbanProps) {
  const [filters, setFilters] = useState<KanbanFilters>({
    search: '',
    minScore: 0,
    maxScore: 100,
    leadSource: '',
    priority: '',
    tags: []
  });

  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const { 
    contactsByStage, 
    stats, 
    isLoading, 
    moveContact, 
    isMoving 
  } = useFunnelKanban(agentId);

  // Filtrar contatos baseado nos filtros ativos
  const filteredContactsByStage = useMemo(() => {
    const filtered: Record<LeadStage, ContactWithDetails[]> = {} as any;

    LEAD_STAGES.forEach(stage => {
      const stageContacts = contactsByStage[stage.id] || [];
      
      filtered[stage.id] = stageContacts.filter(contact => {
        // Filtro de busca
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const matchesSearch = 
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.email?.toLowerCase().includes(searchTerm) ||
            contact.phone?.includes(searchTerm) ||
            contact.company?.toLowerCase().includes(searchTerm);
          
          if (!matchesSearch) return false;
        }

        // Filtro de score
        if (contact.leadScore < filters.minScore || contact.leadScore > filters.maxScore) {
          return false;
        }

        // Filtro de fonte
        if (filters.leadSource && contact.leadSource !== filters.leadSource) {
          return false;
        }

        // Filtro de prioridade
        if (filters.priority && contact.priority !== filters.priority) {
          return false;
        }

        return true;
      });
    });

    return filtered;
  }, [contactsByStage, filters]);

  // Handler para drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const contactId = draggableId;
    const newStage = destination.droppableId as LeadStage;

    moveContact(contactId, newStage);
  };

  // Handler para seleção múltipla
  const handleContactSelection = (contactId: string, selected: boolean) => {
    setSelectedContacts(prev => 
      selected 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imobipro-blue"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com filtros e ações */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Funil de Leads</h2>
            <p className="text-muted-foreground">
              Gerencie seu pipeline de vendas com drag & drop
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={onContactCreate}
              className="bg-imobipro-blue hover:bg-imobipro-blue-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Score do Lead</DropdownMenuItem>
              <DropdownMenuItem>Fonte</DropdownMenuItem>
              <DropdownMenuItem>Prioridade</DropdownMenuItem>
              <DropdownMenuItem>Tags</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedContacts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Users className="w-4 h-4 mr-2" />
                  Ações ({selectedContacts.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Mover em lote</DropdownMenuItem>
                <DropdownMenuItem>Atribuir agente</DropdownMenuItem>
                <DropdownMenuItem>Adicionar tags</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Excluir selecionados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                  <p className="text-xs text-muted-foreground">Total de Leads</p>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.byStage.CONVERTED || 0}</p>
                  <p className="text-xs text-muted-foreground">Convertidos</p>
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {stats.conversionRates.NEW_to_CONVERTED?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                </div>
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.topSources[0]?.source || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Top Fonte</p>
                </div>
                <Star className="h-4 w-4 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban Board - Layout Otimizado */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board flex gap-2 h-[calc(100vh-420px)] min-h-[500px] overflow-hidden">
          {LEAD_STAGES.map((stage) => {
            const stageContacts = filteredContactsByStage[stage.id] || [];
            const stageCount = stageContacts.length;

            return (
              <div key={stage.id} className="kanban-column flex-1 min-w-0 flex flex-col">
                <Card className={`${stage.bgColor} border h-full flex flex-col`}>
                  {/* Header compacto */}
                  <CardHeader className="pb-2 px-3 pt-3 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`${stage.color} flex-shrink-0`}>
                          {React.cloneElement(stage.icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
                        </div>
                        <CardTitle className={`text-xs font-semibold ${stage.color} truncate`}>
                          {stage.label}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-auto min-w-[18px] flex items-center justify-center">
                        {stageCount}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* Área de drop scrollável */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <CardContent
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`kanban-column-scroll flex-1 px-2 pb-2 overflow-y-auto transition-colors ${
                          snapshot.isDraggingOver ? 'kanban-drop-zone-active' : ''
                        }`}
                      >
                        <div className="space-y-2 py-1">
                          {stageContacts.map((contact, index) => (
                            <Draggable
                              key={contact.id}
                              draggableId={contact.id}
                              index={index}
                              isDragDisabled={isMoving}
                            >
                              {(provided, snapshot) => (
                                <CompactLeadCard
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  contact={contact}
                                  isDragging={snapshot.isDragging}
                                  isSelected={selectedContacts.includes(contact.id)}
                                  onSelect={(selected) => 
                                    handleContactSelection(contact.id, selected)
                                  }
                                  onClick={() => onContactSelect?.(contact)}
                                />
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {stageContacts.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <div className="text-gray-400 mb-2">
                                {React.cloneElement(stage.icon as React.ReactElement, { className: "w-8 h-8 mx-auto opacity-30" })}
                              </div>
                              <p className="text-[10px] leading-tight">Nenhum lead<br />neste estágio</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Droppable>
                </Card>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

// ============================================================================
// COMPONENTE LEAD CARD
// ============================================================================

interface LeadCardProps {
  contact: ContactWithDetails;
  isDragging: boolean;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
}

// Componente CompactLeadCard otimizado para design responsivo
const CompactLeadCard = React.forwardRef<HTMLDivElement, LeadCardProps & any>(
  ({ contact, isDragging, isSelected, onSelect, onClick, ...props }, ref) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'URGENT': return 'bg-red-500';
        case 'HIGH': return 'bg-orange-500';
        case 'MEDIUM': return 'bg-yellow-500';
        case 'LOW': return 'bg-green-500';
        default: return 'bg-gray-500';
      }
    };

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      if (score >= 40) return 'text-orange-600';
      return 'text-red-600';
    };

    const formatPhone = (phone: string) => {
      if (phone.length <= 10) return phone;
      return `${phone.slice(0, 6)}...`;
    };

    const getInitials = (name: string) => {
      return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    return (
      <Card
        ref={ref}
        {...props}
        className={`kanban-card cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-imobipro-blue/30 group ${
          isDragging ? 'kanban-card-dragging' : ''
        } ${
          isSelected ? 'kanban-card-selected ring-1 ring-imobipro-blue bg-imobipro-blue/5' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-2.5">
          {/* Header ultra compacto */}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(e.target.checked);
              }}
              className="kanban-checkbox w-3 h-3 rounded border-gray-300 text-imobipro-blue focus:ring-1 focus:ring-imobipro-blue"
            />
            
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={contact.avatarUrl || ''} />
              <AvatarFallback className="text-[9px] font-semibold bg-gradient-to-br from-gray-100 to-gray-200">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-[11px] leading-tight truncate text-gray-900">
                {contact.name}
              </h4>
              {(contact.company || contact.email) && (
                <p className="text-[9px] text-gray-500 truncate leading-tight">
                  {contact.company || contact.email}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-2.5 w-2.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem className="text-xs">Ver perfil</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Editar</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Atividade</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-red-600">
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Score e prioridade em linha */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(contact.priority)}`} />
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {contact.priority.slice(0, 3)}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 text-amber-500" />
              <span className={`text-[10px] font-semibold ${getScoreColor(contact.leadScore)}`}>
                {contact.leadScore}
              </span>
            </div>
          </div>

          {/* Barra de progresso ultra fina */}
          <div className="w-full bg-gray-200 rounded-full h-0.5 mb-2">
            <div 
              className={`h-0.5 rounded-full transition-all duration-300 ${
                contact.leadScore >= 80 ? 'bg-green-500' :
                contact.leadScore >= 60 ? 'bg-yellow-500' :
                contact.leadScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${contact.leadScore}%` }}
            />
          </div>

          {/* Informações essenciais */}
          <div className="space-y-1">
            {/* Contato */}
            {contact.phone && (
              <div className="flex items-center gap-1 text-[9px] text-gray-600">
                <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{formatPhone(contact.phone)}</span>
              </div>
            )}

            {/* Tags compactas */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contact.tags.slice(0, 1).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-[8px] px-1 py-0 h-3 bg-gray-100 text-gray-600 border-0">
                    {tag.length > 8 ? `${tag.slice(0, 8)}...` : tag}
                  </Badge>
                ))}
                {contact.tags.length > 1 && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-gray-300 text-gray-500">
                    +{contact.tags.length - 1}
                  </Badge>
                )}
              </div>
            )}

            {/* Fonte ou última interação */}
            <div className="text-[8px] text-gray-400 flex items-center gap-1">
              {contact.leadSource && (
                <span className="truncate">📍 {contact.leadSource}</span>
              )}
              {contact.lastInteractionAt && !contact.leadSource && (
                <span className="truncate">
                  💬 {new Date(contact.lastInteractionAt).toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

// Manter o LeadCard original como fallback
const LeadCard = CompactLeadCard;

LeadCard.displayName = 'LeadCard';