// ========================================
// TIPOS TYPESCRIPT PARA AS NOVAS TABELAS MVP
// Data: 05/08/2025
// Descrição: Interfaces para as 6 tabelas simplificadas
// ========================================

// ========================================
// 1. DADOS_CLIENTE - Base do CRM (ESTRUTURA REAL ENCONTRADA)
// ========================================

export type ClienteStatus = 
  | 'novos' 
  | 'contatados' 
  | 'qualificados' 
  | 'interessados' 
  | 'negociando' 
  | 'convertidos' 
  | 'perdidos';

export interface DadosCliente {
  id: number; // ID serial (não UUID como planejado)
  telefone: string; // Chave única para integração WhatsApp
  sessionid?: string | null; // UUID da sessão
  status?: string | null; // Status do cliente
  portal?: string | null; // Portal de origem
  email?: string | null;
  nome?: string | null;
  funcionario?: string | null; // ID do corretor responsável
  data_agendamento?: string | null; // ISO DateTime
  confirmacao?: string | null;
  observacoes?: string | null;
  interesse?: string | null;
  preco?: string | null;
  imovel_interesse?: string | null;
  created_at?: string | null; // ISO DateTime
  updated_at?: string | null; // ISO DateTime
}

// ========================================
// 2. IMOVEISVIVAREAL4 - Catálogo de Propriedades
// ========================================

export interface ImoveisVivaReal4 {
  id: string;
  title?: string | null;
  description?: string | null;
  price?: number | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  neighborhoodName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  thumbnails?: string[] | null;
  propertyTypeName?: string | null;
  businessName?: string | null; // venda, aluguel
  listingType?: string | null;
  usageName?: string | null;
  accountName?: string | null;
  contactPhoneNumber?: string | null;
  siteUrl?: string | null;
  vivaRealId?: string | null;
  externalId?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any; // Para campos adicionais do Viva Real
}

// ========================================
// 3. CHATS - Lista de Conversas
// ========================================

export interface Chat {
  id: string;
  telefone: string;
  conversation_id: string;
  nome_contato?: string | null;
  funcionario?: string | null; // UUID do corretor
  instancia?: string | null; // Instância WhatsApp do corretor
  status: string;
  ultima_mensagem?: string | null;
  ultima_mensagem_timestamp?: string | null; // ISO DateTime
  nao_lidas: number;
  metadata?: Record<string, any> | null;
  created_at: string; // ISO DateTime
  updated_at: string; // ISO DateTime
}

// ========================================
// 4. CHAT_MESSAGES - Histórico de Mensagens
// ========================================

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'video' 
  | 'document' 
  | 'location';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  chat_id?: string | null;
  user_message?: string | null;
  resposta_agent?: string | null;
  message_type: MessageType;
  is_from_me: boolean;
  status: string;
  metadata?: Record<string, any> | null; // Dados N8N
  timestamp: string; // ISO DateTime
  created_at: string; // ISO DateTime
}

// ========================================
// 5. IMOBIPRO_MESSAGES - Memória IA
// ========================================

export type MessageRole = 
  | 'system' 
  | 'user' 
  | 'assistant' 
  | 'function';

export interface ImobiproMessage {
  id: string;
  session_id: string;
  conversation_id?: string | null;
  telefone?: string | null;
  role: MessageRole;
  content: string;
  langchain_format?: Record<string, any> | null; // JSON LangChain
  tokens_used?: number | null;
  model_used?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string; // ISO DateTime
}

// ========================================
// 6. INTERESSE_IMOVEIS - Matching Cliente-Propriedade
// ========================================

export type TipoInteresse = 
  | 'venda' 
  | 'aluguel' 
  | 'ambos';

export interface InteresseImovel {
  id: string;
  cliente_id?: string | null;
  telefone?: string | null;
  imovel_id?: string | null; // ID em imoveisvivareal4
  tipo_interesse?: TipoInteresse | null;
  nivel_interesse: number; // 1-10
  observacoes?: string | null;
  data_visita?: string | null; // ISO DateTime
  proposta_enviada: boolean;
  valor_proposta?: number | null;
  status: string;
  created_at: string; // ISO DateTime
  updated_at: string; // ISO DateTime
}

// ========================================
// TIPOS DE RESPOSTA DO SUPABASE
// ========================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: Error | null;
  count?: number | null;
}

// ========================================
// FILTROS E ORDENAÇÃO
// ========================================

export interface DadosClienteFilters {
  status?: ClienteStatus | ClienteStatus[];
  funcionario?: string;
  tags?: string[];
  origem_lead?: string;
  score_min?: number;
  score_max?: number;
  search?: string; // Busca por nome, telefone ou email
}

export interface ChatFilters {
  funcionario?: string;
  status?: string;
  has_unread?: boolean;
  search?: string; // Busca por telefone ou nome
}

export interface InteresseImoveisFilters {
  cliente_id?: string;
  imovel_id?: string;
  tipo_interesse?: TipoInteresse;
  nivel_interesse_min?: number;
  proposta_enviada?: boolean;
  status?: string;
}

// ========================================
// INTERFACES PARA OPERAÇÕES CRUD
// ========================================

export interface CreateDadosClienteInput {
  nome: string;
  telefone: string;
  email?: string;
  status?: ClienteStatus;
  funcionario?: string;
  observacoes?: string;
  empresa?: string;
  cargo?: string;
  origem_lead?: string;
  tags?: string[];
}

export interface UpdateDadosClienteInput {
  nome?: string;
  email?: string;
  status?: ClienteStatus;
  funcionario?: string;
  observacoes?: string;
  score_lead?: number;
  tags?: string[];
  proxima_acao?: string;
}

export interface CreateChatInput {
  telefone: string;
  conversation_id: string;
  nome_contato?: string;
  funcionario?: string;
  instancia?: string;
}

export interface CreateChatMessageInput {
  conversation_id: string;
  chat_id?: string;
  user_message?: string;
  resposta_agent?: string;
  message_type?: MessageType;
  is_from_me?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateInteresseImovelInput {
  cliente_id?: string;
  telefone?: string;
  imovel_id?: string;
  tipo_interesse?: TipoInteresse;
  nivel_interesse?: number;
  observacoes?: string;
}

// ========================================
// HELPERS E UTILITIES
// ========================================

export const clienteStatusColors: Record<ClienteStatus, string> = {
  novos: '#6B7280',      // gray
  contatados: '#3B82F6', // blue
  qualificados: '#8B5CF6', // purple
  interessados: '#F59E0B', // amber
  negociando: '#EF4444',   // red
  convertidos: '#10B981',  // green
  perdidos: '#991B1B'      // dark red
};

export const clienteStatusLabels: Record<ClienteStatus, string> = {
  novos: 'Novos',
  contatados: 'Contatados',
  qualificados: 'Qualificados',
  interessados: 'Interessados',
  negociando: 'Negociando',
  convertidos: 'Convertidos',
  perdidos: 'Perdidos'
};

export const tipoInteresseLabels: Record<TipoInteresse, string> = {
  venda: 'Venda',
  aluguel: 'Aluguel',
  ambos: 'Venda e Aluguel'
};

// Função helper para formatar telefone brasileiro
export const formatPhoneBR = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Função helper para calcular score visual
export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10B981'; // green
  if (score >= 60) return '#F59E0B'; // amber
  if (score >= 40) return '#3B82F6'; // blue
  return '#EF4444'; // red
};

// ========================================
// FIM DOS TIPOS MVP
// ========================================