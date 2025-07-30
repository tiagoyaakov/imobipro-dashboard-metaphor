import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatSession, AgentStatus, N8nWebhookPayload, LegalCategory, ChatConfiguration } from '@/types/leiInquilino';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { n8nLegalService } from '@/services/n8nLegalService';

// Configuração padrão do chat
const DEFAULT_CONFIG: ChatConfiguration = {
  maxMessageLength: 2000,
  allowAttachments: true,
  supportedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  autoSuggestions: true,
  legalReferencesEnabled: true,
  responseTimeout: 30000, // 30 segundos
  retryAttempts: 3,
  agentPersonality: {
    name: 'ImobiPRO Agent',
    role: 'Assistente Jurídico Imobiliário',
    expertise: ['Lei do Inquilinato', 'Contratos de Locação', 'Direitos e Deveres', 'Legislação Imobiliária'],
    tone: 'professional'
  }
};

// Categorias legais predefinidas
const LEGAL_CATEGORIES: LegalCategory[] = [
  {
    id: 'rent-law',
    name: 'Lei do Inquilinato',
    description: 'Questões sobre direitos e deveres de locadores e locatários',
    icon: 'Home',
    color: '#0EA5E9',
    examples: ['Reajuste de aluguel', 'Rescisão antecipada', 'Depósito caução']
  },
  {
    id: 'contracts',
    name: 'Contratos de Locação',
    description: 'Elaboração e análise de contratos imobiliários',
    icon: 'FileText',
    color: '#8B5CF6',
    examples: ['Cláusulas especiais', 'Renovação automática', 'Garantias']
  },
  {
    id: 'eviction',
    name: 'Ações de Despejo',
    description: 'Procedimentos para ações de despejo e retomada',
    icon: 'AlertTriangle',
    color: '#F59E0B',
    examples: ['Despejo por falta de pagamento', 'Denúncia vazia', 'Prazos processuais']
  },
  {
    id: 'maintenance',
    name: 'Reformas e Benfeitorias',
    description: 'Questões sobre manutenção e melhorias no imóvel',
    icon: 'Wrench',
    color: '#10B981',
    examples: ['Responsabilidade por reparos', 'Benfeitorias necessárias', 'Direito de retenção']
  }
];

export const useLeiInquilinoChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isOnline: true,
    status: 'available',
    currentSessions: 0,
    responseTime: { average: 2500, last24h: 2200 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [config] = useState<ChatConfiguration>(DEFAULT_CONFIG);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll para a última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Inicializar chat com mensagem de boas-vindas
  const initializeChat = useCallback(() => {
    if (!user) return;

    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      content: `Olá! Eu sou o **${config.agentPersonality.name}**, seu ${config.agentPersonality.role} especializado em questões imobiliárias.

Como posso ajudá-lo hoje? Posso esclarecer dúvidas sobre:
• **Lei do Inquilinato** - Direitos e deveres
• **Contratos de Locação** - Análise e elaboração
• **Ações de Despejo** - Procedimentos legais
• **Reformas e Benfeitorias** - Responsabilidades

Pode fazer sua pergunta ou escolher uma das categorias abaixo para começarmos!`,
      type: 'agent',
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        suggestions: [
          'Como funciona o reajuste anual do aluguel?',
          'Quais são os direitos do inquilino?',
          'Como fazer um contrato de locação?',
          'O que é despejo por falta de pagamento?'
        ]
      }
    };

    setMessages([welcomeMessage]);
    
    // Criar sessão inicial
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      userId: user.id,
      title: 'Nova Consulta Jurídica',
      category: LEGAL_CATEGORIES[0],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      messagesCount: 1,
      lastMessage: 'Consulta iniciada'
    };

    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
  }, [user, config.agentPersonality.name, config.agentPersonality.role]);

  // Enviar mensagem
  const sendMessage = useCallback(async (content: string, category?: string) => {
    if (!content.trim() || !currentSession || !user) return;

    if (content.length > config.maxMessageLength) {
      toast.error(`Mensagem muito longa. Máximo ${config.maxMessageLength} caracteres.`);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      type: 'user',
      timestamp: new Date(),
      status: 'sending',
      metadata: {
        conversationId: currentSession.id,
        source: 'web'
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Processar via N8N ou fallback
      await processN8nResponse(userMessage, category);
      
      // Atualizar status da mensagem
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );

      // Atualizar sessão
      setCurrentSession(prev => prev ? {
        ...prev,
        updatedAt: new Date(),
        messagesCount: prev.messagesCount + 1,
        lastMessage: content.substring(0, 100)
      } : null);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
      toast.error('Falha ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [currentSession, user, config.maxMessageLength]);

  // Processar resposta via N8N ou fallback para simulação
  const processN8nResponse = useCallback(async (userMessage: ChatMessage, category?: string) => {
    try {
      // Tentar usar N8N primeiro
      const agentMessage = await n8nLegalService.sendMessage(userMessage, {
        sessionId: currentSession?.id || 'default',
        userId: user?.id || 'anonymous',
        category,
        previousMessages: messages.slice(-5)
      });

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.warn('N8N não disponível, usando fallback:', error);
      
      // Fallback para respostas simuladas
      await simulateLocalResponse(userMessage, category);
    }
  }, [currentSession?.id, user?.id, messages]);

  // Fallback para respostas locais quando N8N não estiver disponível
  const simulateLocalResponse = useCallback(async (userMessage: ChatMessage, category?: string) => {
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const responses = getContextualResponse(userMessage.content, category);
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    const agentMessage: ChatMessage = {
      id: `agent-${Date.now()}`,
      content: selectedResponse.content,
      type: 'agent',
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        conversationId: userMessage.metadata?.conversationId,
        source: 'local-fallback',
        suggestions: selectedResponse.suggestions,
        legalReferences: selectedResponse.legalReferences
      }
    };

    setMessages(prev => [...prev, agentMessage]);
  }, []);

  // Respostas contextuais baseadas no conteúdo
  const getContextualResponse = (content: string, category?: string) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('aluguel') || lowerContent.includes('reajuste')) {
      return [{
        content: `Sobre **reajuste de aluguel**, a Lei 8.245/91 estabelece que:

• O reajuste anual é permitido apenas após 12 meses do contrato ou do último reajuste
• Deve seguir o índice previsto no contrato (IGP-M, IPCA, etc.)
• O locador deve notificar o locatário com 30 dias de antecedência
• Reajustes fora do prazo ou índice são inválidos

**Exemplo prático**: Se o contrato foi assinado em janeiro de 2023, o primeiro reajuste só pode ocorrer em janeiro de 2024.

Precisa de mais informações sobre algum aspecto específico?`,
        suggestions: [
          'Como calcular o reajuste do aluguel?',
          'O que fazer se o reajuste estiver incorreto?',
          'Quais índices são mais usados?'
        ],
        legalReferences: [
          {
            id: 'lei-8245-art17',
            title: 'Reajuste de Aluguéis',
            article: 'Art. 17',
            law: 'Lei 8.245/91',
            description: 'Regula os reajustes de aluguéis residenciais',
            relevance: 'high' as const
          }
        ]
      }];
    }

    if (lowerContent.includes('despejo') || lowerContent.includes('rescisão')) {
      return [{
        content: `Sobre **ações de despejo**, existem diferentes modalidades:

**1. Despejo por Falta de Pagamento**
• Prazo: 15 dias para pagamento após citação
• Possibilidade de purgar a mora até a contestação
• Cumulação com cobrança de aluguéis

**2. Despejo por Infração Contratual**
• Prazo: 15 dias para cessação da infração
• Necessário provar o descumprimento do contrato
• Pode ser cumulado com perdas e danos

**3. Denúncia Vazia (fim do contrato)**
• Apenas para contratos sem prazo determinado
• Aviso prévio de 30 dias

Qual situação específica você gostaria de esclarecer?`,
        suggestions: [
          'Como funciona a purga da mora?',
          'Quando posso pedir despejo por infração?',
          'Quais são os prazos processuais?'
        ],
        legalReferences: [
          {
            id: 'lei-8245-art9',
            title: 'Ações de Despejo',
            article: 'Art. 9º',
            law: 'Lei 8.245/91',
            description: 'Modalidades de despejo e seus procedimentos',
            relevance: 'high' as const
          }
        ]
      }];
    }

    // Resposta genérica
    return [{
      content: `Entendo sua dúvida sobre questões imobiliárias. Para oferecer uma resposta mais precisa e personalizada, preciso de alguns detalhes adicionais:

• **Tipo de imóvel**: Residencial ou comercial?
• **Situação específica**: Qual o problema ou dúvida principal?
• **Partes envolvidas**: Você é locador ou locatário?
• **Localização**: Em qual estado está o imóvel?

Com essas informações, posso fornecer orientações mais direcionadas baseadas na legislação aplicável.

Você também pode escolher uma das categorias abaixo para orientações específicas:`,
      suggestions: [
        'Sou locador e tenho dúvidas sobre contratos',
        'Sou inquilino e preciso saber meus direitos',
        'Preciso de ajuda com ação de despejo',
        'Quero entender sobre reformas no imóvel'
      ],
      legalReferences: []
    }];
  };

  // Criar nova sessão
  const createNewSession = useCallback((title?: string, category?: LegalCategory) => {
    if (!user) return;

    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      userId: user.id,
      title: title || 'Nova Consulta',
      category: category || LEGAL_CATEGORIES[0],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      messagesCount: 0,
      metadata: {
        tags: [],
        priority: 'medium'
      }
    };

    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    setMessages([]);
    
    // Inicializar com mensagem de boas-vindas
    setTimeout(() => initializeChat(), 100);
  }, [user, initializeChat]);

  // Carregar sessão existente
  const loadSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      // Aqui carregaria as mensagens da sessão do banco de dados
      // Por enquanto, reinicia o chat
      setMessages([]);
      initializeChat();
    }
  }, [sessions, initializeChat]);

  // Finalizar sessão
  const endSession = useCallback((sessionId: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'closed' as const, updatedAt: new Date() }
          : session
      )
    );
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setMessages([]);
    }
  }, [currentSession]);

  // Inicializar quando o usuário estiver disponível
  useEffect(() => {
    if (user && messages.length === 0 && !currentSession) {
      initializeChat();
    }
  }, [user, messages.length, currentSession, initializeChat]);

  return {
    // Estado
    messages,
    currentSession,
    sessions,
    agentStatus,
    isLoading,
    isTyping,
    config,
    legalCategories: LEGAL_CATEGORIES,
    
    // Ações
    sendMessage,
    createNewSession,
    loadSession,
    endSession,
    
    // Refs
    messagesEndRef
  };
};