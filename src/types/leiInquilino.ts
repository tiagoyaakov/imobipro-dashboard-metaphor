export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'agent';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  metadata?: {
    messageId?: string;
    conversationId?: string;
    source?: 'web' | 'n8n' | 'api';
    attachments?: ChatAttachment[];
    suggestions?: string[];
    legalReferences?: LegalReference[];
  };
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'document' | 'image' | 'pdf' | 'contract';
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface LegalReference {
  id: string;
  title: string;
  article: string;
  law: string;
  description: string;
  url?: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  category: LegalCategory;
  status: 'active' | 'closed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  messagesCount: number;
  lastMessage?: string;
  metadata?: {
    n8nWorkflowId?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    relatedProperty?: string;
    relatedContact?: string;
  };
}

export interface LegalCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  examples: string[];
}

export interface AgentStatus {
  isOnline: boolean;
  status: 'available' | 'busy' | 'away' | 'offline';
  lastSeen?: Date;
  currentSessions: number;
  responseTime: {
    average: number;
    last24h: number;
  };
}

export interface N8nWebhookPayload {
  messageId: string;
  conversationId: string;
  content: string;
  type: 'response' | 'typing' | 'error';
  metadata?: {
    suggestions?: string[];
    legalReferences?: LegalReference[];
    confidence?: number;
    processingTime?: number;
  };
}

export interface ChatAnalytics {
  totalSessions: number;
  activeSessions: number;
  averageResponseTime: number;
  popularCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  userSatisfaction: {
    average: number;
    total: number;
    ratings: Array<{
      rating: number;
      count: number;
    }>;
  };
}

export interface LegalPromptTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
  tags: string[];
  usage: number;
}

export interface ChatConfiguration {
  maxMessageLength: number;
  allowAttachments: boolean;
  supportedFileTypes: string[];
  maxFileSize: number;
  autoSuggestions: boolean;
  legalReferencesEnabled: boolean;
  responseTimeout: number;
  retryAttempts: number;
  n8nWebhookUrl?: string;
  agentPersonality: {
    name: string;
    role: string;
    expertise: string[];
    tone: 'formal' | 'friendly' | 'professional';
  };
}