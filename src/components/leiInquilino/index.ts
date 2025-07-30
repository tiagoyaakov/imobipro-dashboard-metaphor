// Componentes principais do módulo Lei do Inquilino
export { default as ChatInterface } from './ChatInterface';
export { default as ChatSidebar } from './ChatSidebar';
export { default as ChatSettings } from './ChatSettings';
export { default as ChatAnalytics } from './ChatAnalytics';

// Hooks
export { useLeiInquilinoChat } from '@/hooks/useLeiInquilinoChat';

// Serviços
export { n8nLegalService } from '@/services/n8nLegalService';

// Tipos
export type {
  ChatMessage,
  ChatSession,
  ChatAttachment,
  LegalReference,
  LegalCategory,
  AgentStatus,
  N8nWebhookPayload,
  ChatAnalytics,
  LegalPromptTemplate,
  ChatConfiguration
} from '@/types/leiInquilino';