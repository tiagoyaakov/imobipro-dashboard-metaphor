import { supabase } from '@/integrations/supabase/client';
import { n8nService } from './n8nService';

export interface ChatSummary {
  chatId: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  generatedAt: Date;
  confidence: number;
  wordCount: number;
}

export interface SummaryRequest {
  chatId: string;
  messages: Array<{
    content: string;
    sentAt: string;
    isFromAgent: boolean;
    senderName: string;
  }>;
  forceRegenerate?: boolean;
}

export interface SummaryConfig {
  maxMessages?: number;
  minMessages?: number;
  includeContext?: boolean;
  language?: 'pt' | 'en';
  summaryLength?: 'short' | 'medium' | 'long';
}

class ChatSummaryService {
  private readonly DEFAULT_CONFIG: Required<SummaryConfig> = {
    maxMessages: 50,
    minMessages: 5,
    includeContext: true,
    language: 'pt',
    summaryLength: 'medium'
  };

  // Gerar resumo usando IA (n8n service)
  async generateSummary(
    request: SummaryRequest,
    config: SummaryConfig = {}
  ): Promise<ChatSummary> {
    try {
      const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

      // Verificar se há mensagens suficientes
      if (request.messages.length < finalConfig.minMessages) {
        throw new Error(`Mínimo de ${finalConfig.minMessages} mensagens necessárias para gerar resumo`);
      }

      // Limitar quantidade de mensagens se necessário
      const messages = request.messages.slice(-finalConfig.maxMessages);

      // Preparar contexto para IA
      const context = this.prepareContextForAI(messages, finalConfig);

      // Chamar n8n service para gerar resumo
      const aiResponse = await this.callAISummaryService(context, finalConfig);

      // Processar resposta da IA
      const summary = this.processAIResponse(aiResponse, request.chatId);

      // Salvar cache do resumo localmente (opcional)
      await this.saveSummaryCache(summary);

      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      
      // Fallback: gerar resumo básico sem IA
      return this.generateBasicSummary(request);
    }
  }

  // Preparar contexto estruturado para a IA
  private prepareContextForAI(
    messages: SummaryRequest['messages'],
    config: Required<SummaryConfig>
  ): string {
    const conversationText = messages
      .map((msg, index) => {
        const timestamp = new Date(msg.sentAt).toLocaleString('pt-BR');
        const speaker = msg.isFromAgent ? '👨‍💼 Corretor' : '👤 Cliente';
        return `[${timestamp}] ${speaker}: ${msg.content}`;
      })
      .join('\n');

    const prompt = `
Por favor, analise esta conversa imobiliária e gere um resumo estruturado:

=== CONVERSA ===
${conversationText}

=== INSTRUÇÕES ===
- Idioma: ${config.language === 'pt' ? 'Português' : 'English'}
- Tamanho: ${config.summaryLength}
- Contexto: Conversa entre corretor de imóveis e cliente

Retorne um JSON com esta estrutura:
{
  "summary": "Resumo da conversa em 2-3 frases",
  "keyPoints": ["ponto-chave-1", "ponto-chave-2", "ponto-chave-3"],
  "sentiment": "positive|neutral|negative",
  "nextAction": "Próxima ação recomendada",
  "category": "categoria da conversa (ex: visita, negociação, dúvida)",
  "priority": "low|medium|high",
  "confidence": 0.85
}
    `.trim();

    return prompt;
  }

  // Chamar serviço de IA via n8n
  private async callAISummaryService(
    prompt: string,
    config: Required<SummaryConfig>
  ): Promise<any> {
    try {
      // Usar o n8n service existente para fazer a chamada
      const response = await n8nService.executeWorkflow('chat-summary', {
        prompt,
        config,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('Error calling AI summary service:', error);
      throw error;
    }
  }

  // Processar resposta da IA e normalizar dados
  private processAIResponse(aiResponse: any, chatId: string): ChatSummary {
    try {
      // Tentar parsear resposta JSON da IA
      let parsedResponse: any;

      if (typeof aiResponse === 'string') {
        // Tentar encontrar JSON na resposta
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } else {
        parsedResponse = aiResponse;
      }

      // Validar e normalizar campos
      const summary: ChatSummary = {
        chatId,
        summary: parsedResponse.summary || 'Resumo não disponível',
        keyPoints: Array.isArray(parsedResponse.keyPoints) 
          ? parsedResponse.keyPoints 
          : ['Conversa com cliente'],
        sentiment: ['positive', 'neutral', 'negative'].includes(parsedResponse.sentiment) 
          ? parsedResponse.sentiment 
          : 'neutral',
        nextAction: parsedResponse.nextAction || undefined,
        category: parsedResponse.category || 'Geral',
        priority: ['low', 'medium', 'high'].includes(parsedResponse.priority) 
          ? parsedResponse.priority 
          : 'medium',
        generatedAt: new Date(),
        confidence: typeof parsedResponse.confidence === 'number' 
          ? Math.max(0, Math.min(1, parsedResponse.confidence))
          : 0.5,
        wordCount: parsedResponse.summary?.split(' ').length || 0
      };

      return summary;
    } catch (error) {
      console.error('Error processing AI response:', error);
      
      // Fallback com dados básicos
      return {
        chatId,
        summary: 'Erro ao processar resumo da IA',
        keyPoints: ['Conversa com cliente'],
        sentiment: 'neutral',
        priority: 'medium',
        generatedAt: new Date(),
        confidence: 0.1,
        wordCount: 0
      };
    }
  }

  // Gerar resumo básico sem IA (fallback)
  private generateBasicSummary(request: SummaryRequest): ChatSummary {
    const { messages, chatId } = request;
    
    const messageCount = messages.length;
    const clientMessages = messages.filter(m => !m.isFromAgent);
    const agentMessages = messages.filter(m => m.isFromAgent);
    
    // Análise básica do sentimento baseada em palavras-chave
    const positiveWords = ['obrigado', 'ótimo', 'perfeito', 'excelente', 'interessado'];
    const negativeWords = ['problema', 'ruim', 'não gostei', 'caro', 'difícil'];
    
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');
    const hasPositive = positiveWords.some(word => allText.includes(word));
    const hasNegative = negativeWords.some(word => allText.includes(word));
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (hasPositive && !hasNegative) sentiment = 'positive';
    if (hasNegative && !hasPositive) sentiment = 'negative';

    // Gerar resumo básico
    const summary = `Conversa com ${messageCount} mensagens. Cliente enviou ${clientMessages.length} mensagens e corretor respondeu ${agentMessages.length} vezes.`;
    
    const keyPoints = [
      `${messageCount} mensagens trocadas`,
      `Última mensagem: ${new Date(messages[messages.length - 1]?.sentAt).toLocaleDateString()}`,
      `Sentimento: ${sentiment === 'positive' ? 'Positivo' : sentiment === 'negative' ? 'Negativo' : 'Neutro'}`
    ];

    return {
      chatId,
      summary,
      keyPoints,
      sentiment,
      nextAction: clientMessages.length > agentMessages.length ? 'Responder ao cliente' : undefined,
      category: 'Geral',
      priority: 'medium',
      generatedAt: new Date(),
      confidence: 0.3, // Baixa confiança para resumo básico
      wordCount: summary.split(' ').length
    };
  }

  // Salvar cache do resumo (implementação simples com localStorage)
  private async saveSummaryCache(summary: ChatSummary): Promise<void> {
    try {
      const cacheKey = `chat-summary-${summary.chatId}`;
      const cacheData = {
        ...summary,
        generatedAt: summary.generatedAt.toISOString()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Could not save summary cache:', error);
    }
  }

  // Buscar resumo do cache
  async getCachedSummary(chatId: string): Promise<ChatSummary | null> {
    try {
      const cacheKey = `chat-summary-${chatId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const parsedCache = JSON.parse(cached);
      
      // Verificar se cache não está muito antigo (24 horas)
      const cacheAge = Date.now() - new Date(parsedCache.generatedAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (cacheAge > maxAge) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return {
        ...parsedCache,
        generatedAt: new Date(parsedCache.generatedAt)
      };
    } catch (error) {
      console.warn('Error reading summary cache:', error);
      return null;
    }
  }

  // Limpar cache de resumos
  async clearSummaryCache(chatId?: string): Promise<void> {
    try {
      if (chatId) {
        localStorage.removeItem(`chat-summary-${chatId}`);
      } else {
        // Limpar todos os resumos
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('chat-summary-')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn('Error clearing summary cache:', error);
    }
  }

  // Gerar resumo com cache inteligente
  async getSummary(
    request: SummaryRequest,
    config: SummaryConfig = {}
  ): Promise<ChatSummary> {
    // Verificar cache primeiro (a menos que seja forçada regeneração)
    if (!request.forceRegenerate) {
      const cached = await this.getCachedSummary(request.chatId);
      if (cached) {
        return cached;
      }
    }

    // Gerar novo resumo
    return this.generateSummary(request, config);
  }

  // Gerar múltiplos resumos em lote
  async generateBatchSummaries(
    requests: SummaryRequest[],
    config: SummaryConfig = {}
  ): Promise<ChatSummary[]> {
    const results: ChatSummary[] = [];
    
    // Processar em lotes de 5 para não sobrecarregar a API
    const batchSize = 5;
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(request => 
        this.getSummary(request, config).catch(error => {
          console.error(`Error generating summary for chat ${request.chatId}:`, error);
          return this.generateBasicSummary(request);
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequeno delay entre lotes para não sobrecarregar
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // Buscar estatísticas de resumos
  async getSummaryStats(): Promise<{
    totalSummaries: number;
    averageConfidence: number;
    sentimentDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
  }> {
    try {
      const keys = Object.keys(localStorage);
      const summaryKeys = keys.filter(key => key.startsWith('chat-summary-'));
      
      const summaries: ChatSummary[] = [];
      
      for (const key of summaryKeys) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            summaries.push({
              ...parsed,
              generatedAt: new Date(parsed.generatedAt)
            });
          }
        } catch (error) {
          console.warn(`Error parsing cached summary ${key}:`, error);
        }
      }
      
      const totalSummaries = summaries.length;
      const averageConfidence = summaries.length > 0 
        ? summaries.reduce((sum, s) => sum + s.confidence, 0) / summaries.length
        : 0;
      
      const sentimentDistribution = summaries.reduce((acc, s) => {
        acc[s.sentiment] = (acc[s.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const priorityDistribution = summaries.reduce((acc, s) => {
        acc[s.priority] = (acc[s.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        totalSummaries,
        averageConfidence,
        sentimentDistribution,
        priorityDistribution
      };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      return {
        totalSummaries: 0,
        averageConfidence: 0,
        sentimentDistribution: {},
        priorityDistribution: {}
      };
    }
  }
}

export const chatSummaryService = new ChatSummaryService();