import { N8nWebhookPayload, ChatMessage, LegalReference } from '@/types/leiInquilino';

interface N8nConfig {
  webhookUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
}

class N8nLegalService {
  private config: N8nConfig;
  private readonly DEFAULT_CONFIG: N8nConfig = {
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/legal-assistant',
    timeout: 30000,
    retryAttempts: 3
  };

  constructor(config?: Partial<N8nConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  /**
   * Envia mensagem para o webhook N8N e processa a resposta
   */
  async sendMessage(
    message: ChatMessage, 
    context?: {
      sessionId: string;
      userId: string;
      category?: string;
      previousMessages?: ChatMessage[];
    }
  ): Promise<ChatMessage> {
    const payload = {
      messageId: message.id,
      conversationId: context?.sessionId || 'default',
      userId: context?.userId,
      content: message.content,
      category: context?.category,
      timestamp: message.timestamp.toISOString(),
      context: {
        previousMessages: context?.previousMessages?.slice(-5).map(msg => ({
          content: msg.content,
          type: msg.type,
          timestamp: msg.timestamp.toISOString()
        })) || []
      }
    };

    try {
      const response = await this.callN8nWebhook(payload);
      return this.processN8nResponse(response, message.metadata?.conversationId);
    } catch (error) {
      console.error('Erro na comunicação com N8N:', error);
      throw new Error('Falha ao processar mensagem via N8N');
    }
  }

  /**
   * Chama o webhook N8N com retry automático
   */
  private async callN8nWebhook(payload: any, attempt: number = 1): Promise<N8nWebhookPayload> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.validateN8nResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt < this.config.retryAttempts) {
        console.warn(`Tentativa ${attempt} falhou, tentando novamente...`, error);
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        return this.callN8nWebhook(payload, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Valida e normaliza a resposta do N8N
   */
  private validateN8nResponse(data: any): N8nWebhookPayload {
    if (!data || typeof data !== 'object') {
      throw new Error('Resposta inválida do N8N');
    }

    return {
      messageId: data.messageId || `n8n-${Date.now()}`,
      conversationId: data.conversationId || 'default',
      content: data.content || data.response || 'Desculpe, não consegui processar sua mensagem.',
      type: data.type || 'response',
      metadata: {
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        legalReferences: Array.isArray(data.legalReferences) 
          ? data.legalReferences.map(this.normalizeLegalReference)
          : [],
        confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
        processingTime: typeof data.processingTime === 'number' ? data.processingTime : undefined
      }
    };
  }

  /**
   * Normaliza referências legais vindas do N8N
   */
  private normalizeLegalReference(ref: any): LegalReference {
    return {
      id: ref.id || `ref-${Date.now()}-${Math.random()}`,
      title: ref.title || 'Referência Legal',
      article: ref.article || ref.artigo || 'Art. não especificado',
      law: ref.law || ref.lei || 'Lei não especificada',
      description: ref.description || ref.descricao || '',
      url: ref.url || undefined,
      relevance: this.normalizeRelevance(ref.relevance || ref.relevancia)
    };
  }

  /**
   * Normaliza o nível de relevância
   */
  private normalizeRelevance(relevance: any): 'high' | 'medium' | 'low' {
    if (typeof relevance === 'string') {
      const normalized = relevance.toLowerCase();
      if (['high', 'alta', 'alto'].includes(normalized)) return 'high';
      if (['medium', 'media', 'medio', 'média', 'médio'].includes(normalized)) return 'medium';
      return 'low';
    }
    
    if (typeof relevance === 'number') {
      if (relevance >= 8) return 'high';
      if (relevance >= 5) return 'medium';
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Processa a resposta do N8N e cria uma mensagem de chat
   */
  private processN8nResponse(n8nResponse: N8nWebhookPayload, conversationId?: string): ChatMessage {
    return {
      id: n8nResponse.messageId,
      content: n8nResponse.content,
      type: 'agent',
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        messageId: n8nResponse.messageId,
        conversationId: n8nResponse.conversationId || conversationId,
        source: 'n8n',
        suggestions: n8nResponse.metadata?.suggestions || [],
        legalReferences: n8nResponse.metadata?.legalReferences || []
      }
    };
  }

  /**
   * Testa a conectividade com o N8N
   */
  async testConnection(): Promise<{ success: boolean; responseTime?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const testPayload = {
        messageId: 'test-connection',
        conversationId: 'test',
        content: 'Teste de conectividade',
        type: 'test'
      };

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(5000) // 5 second timeout for test
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return { success: true, responseTime };
      } else {
        return { 
          success: false, 
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Atualiza a configuração do serviço
   */
  updateConfig(newConfig: Partial<N8nConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): N8nConfig {
    return { ...this.config };
  }

  /**
   * Utility para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gera templates de prompt específicos para diferentes categorias legais
   */
  generateCategoryPrompt(content: string, category: string): string {
    const prompts = {
      'rent-law': `Como especialista em Lei do Inquilinato (Lei 8.245/91), analise a seguinte questão: "${content}". Forneça orientação jurídica precisa, cite artigos relevantes e sugira próximos passos práticos.`,
      
      'contracts': `Como especialista em contratos imobiliários, analise a questão: "${content}". Foque em aspectos contratuais, cláusulas importantes e implicações legais, sempre baseado na legislação brasileira atual.`,
      
      'eviction': `Como especialista em ações de despejo e procedimentos locatícios, responda: "${content}". Explique os procedimentos legais, prazos, requisitos e possíveis defesas, sempre considerando o CPC e Lei 8.245/91.`,
      
      'maintenance': `Como especialista em reformas e benfeitorias em imóveis locados, responda: "${content}". Aborde responsabilidades, direitos de retenção, indenizações e aspectos práticos da manutenção predial.`
    };

    return prompts[category as keyof typeof prompts] || content;
  }
}

// Instância singleton do serviço
export const n8nLegalService = new N8nLegalService();

// Tipos auxiliares para exportação
export type { N8nConfig };
export default N8nLegalService;