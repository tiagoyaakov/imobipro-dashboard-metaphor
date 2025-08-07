// ================================================================
// TIPOS E ENUMS PARA MÓDULO CLIENTES REESTRUTURADO
// ================================================================
// Data: 07/08/2025
// Descrição: Tipos para novo módulo Clientes com abas Lista e CRM Kanban
// ================================================================

export type StatusCliente = 
  | 'novos'
  | 'contatados' 
  | 'qualificados'
  | 'interessados'
  | 'negociando'
  | 'convertidos'
  | 'perdidos';

export interface StatusClienteConfig {
  value: StatusCliente;
  label: string;
  color: string;
  bgColor: string;
  description: string;
  icon: string;
}

export const STATUS_CLIENTE_CONFIG: Record<StatusCliente, StatusClienteConfig> = {
  novos: {
    value: 'novos',
    label: 'Novos',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Leads recém-chegados, aguardando primeiro contato',
    icon: 'UserPlus'
  },
  contatados: {
    value: 'contatados',
    label: 'Contatados',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Primeiro contato realizado, aguardando resposta',
    icon: 'Phone'
  },
  qualificados: {
    value: 'qualificados',
    label: 'Qualificados',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Lead demonstrou interesse e foi qualificado',
    icon: 'Star'
  },
  interessados: {
    value: 'interessados',
    label: 'Interessados',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Cliente demonstrou interesse concreto',
    icon: 'Heart'
  },
  negociando: {
    value: 'negociando',
    label: 'Negociando',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Em processo ativo de negociação',
    icon: 'Handshake'
  },
  convertidos: {
    value: 'convertidos',
    label: 'Convertidos',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Negócio fechado com sucesso',
    icon: 'CheckCircle'
  },
  perdidos: {
    value: 'perdidos',
    label: 'Perdidos',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Lead perdido ou negócio não concretizado',
    icon: 'XCircle'
  }
};

export const STATUS_ORDER: StatusCliente[] = [
  'novos',
  'contatados', 
  'qualificados',
  'interessados',
  'negociando',
  'convertidos',
  'perdidos'
];

// Interface para o card do Kanban
export interface ClienteKanbanCard {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  status: StatusCliente;
  funcionario?: string | null;
  score_lead: number;
  origem_lead?: string | null;
  empresa?: string | null;
  ultima_interacao?: string | null;
  proxima_acao?: string | null;
  created_at: string;
  updated_at: string;
}

// Props para o componente Kanban
export interface KanbanBoardProps {
  clientes: ClienteKanbanCard[];
  onStatusChange: (clienteId: string, novoStatus: StatusCliente) => void;
  isLoading?: boolean;
  currentUserRole?: string;
  currentUserId?: string;
}

// Props para a lista tabular
export interface ClientesListProps {
  clientes: ClienteKanbanCard[];
  onEdit: (cliente: ClienteKanbanCard) => void;
  onView: (cliente: ClienteKanbanCard) => void;
  onDelete?: (clienteId: string) => void;
  isLoading?: boolean;
  currentUserRole?: string;
  currentUserId?: string;
}

export interface ClienteFilters {
  status?: StatusCliente;
  funcionario?: string;
  origem_lead?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}