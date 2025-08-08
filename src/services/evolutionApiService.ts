// Serviço para integração com Evolution API - WhatsApp Business
// Baseado na documentação e padrões do WhatsApp Service existente

export interface EvolutionAPIConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
  webhookUrl?: string;
  timeout?: number;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  number: string;
  profilePictureUrl?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  timestamp: Date;
  mediaUrl?: string;
  filename?: string;
  mimetype?: string;
  caption?: string;
  isFromMe: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface WhatsAppInstanceStatus {
  instance: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  qrCode?: string;
  phoneNumber?: string;
  profileName?: string;
  profilePicture?: string;
  lastConnection?: Date;
  batterLevel?: number;
  isOnline: boolean;
}

export interface SendMessageOptions {
  to: string;
  message: string;
  delay?: number;
  quoted?: {
    messageId: string;
  };
}

export interface SendMediaOptions {
  to: string;
  media: string | File; // URL ou arquivo
  caption?: string;
  filename?: string;
  delay?: number;
}

class EvolutionApiService {
  private config: EvolutionAPIConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config?: Partial<EvolutionAPIConfig>) {
    // Configuração padrão (pode ser sobrescrita via ENV)
    this.config = {
      baseUrl: config?.baseUrl || import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
      apiKey: config?.apiKey || import.meta.env.VITE_EVOLUTION_API_KEY || '',
      instance: config?.instance || import.meta.env.VITE_EVOLUTION_INSTANCE || 'default',
      webhookUrl: config?.webhookUrl || import.meta.env.VITE_EVOLUTION_WEBHOOK_URL,
      timeout: config?.timeout || 30000
    };

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  // Fazer requisição para Evolution API
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: this.defaultHeaders,
        signal: AbortSignal.timeout(this.config.timeout!)
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Evolution API request failed (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  // Obter status da instância
  async getInstanceStatus(): Promise<WhatsAppInstanceStatus> {
    try {
      const response = await this.request<any>(`/instance/connectionState/${this.config.instance}`);
      
      return {
        instance: this.config.instance,
        status: this.mapConnectionStatus(response.state),
        qrCode: response.qrcode?.base64,
        phoneNumber: response.instance?.owner,
        profileName: response.instance?.profileName,
        profilePicture: response.instance?.profilePicUrl,
        lastConnection: response.instance?.serverToken ? new Date() : undefined,
        isOnline: response.state === 'open'
      };
    } catch (error) {
      console.error('Error getting instance status:', error);
      return {
        instance: this.config.instance,
        status: 'error',
        isOnline: false
      };
    }
  }

  // Mapear status de conexão da Evolution API para nosso padrão
  private mapConnectionStatus(state: string): WhatsAppInstanceStatus['status'] {
    switch (state) {
      case 'open':
        return 'connected';
      case 'connecting':
      case 'qrReadSuccess':
        return 'connecting';
      case 'close':
      case 'notLogged':
        return 'disconnected';
      default:
        return 'error';
    }
  }

  // Conectar instância (gerar QR code)
  async connectInstance(): Promise<{ qrCode?: string; status: string }> {
    try {
      const response = await this.request<any>(`/instance/connect/${this.config.instance}`, 'GET');
      
      return {
        qrCode: response.qrcode?.base64,
        status: 'connecting'
      };
    } catch (error) {
      console.error('Error connecting instance:', error);
      throw error;
    }
  }

  // Desconectar instância
  async disconnectInstance(): Promise<{ success: boolean }> {
    try {
      await this.request(`/instance/logout/${this.config.instance}`, 'DELETE');
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      return { success: false };
    }
  }

  // Enviar mensagem de texto
  async sendMessage(options: SendMessageOptions): Promise<WhatsAppMessage> {
    try {
      const payload = {
        number: options.to,
        textMessage: {
          text: options.message
        },
        delay: options.delay || 0,
        quoted: options.quoted
      };

      const response = await this.request<any>(
        `/message/sendText/${this.config.instance}`, 
        'POST', 
        payload
      );

      return {
        id: response.key?.id || crypto.randomUUID(),
        from: response.key?.remoteJid || this.config.instance,
        to: options.to,
        body: options.message,
        type: 'text',
        timestamp: new Date(),
        isFromMe: true,
        status: 'sent'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Enviar mídia (imagem, áudio, vídeo, documento)
  async sendMedia(options: SendMediaOptions): Promise<WhatsAppMessage> {
    try {
      const payload = {
        number: options.to,
        mediaMessage: {
          media: options.media,
          caption: options.caption,
          fileName: options.filename
        },
        delay: options.delay || 0
      };

      const response = await this.request<any>(
        `/message/sendMedia/${this.config.instance}`, 
        'POST', 
        payload
      );

      return {
        id: response.key?.id || crypto.randomUUID(),
        from: response.key?.remoteJid || this.config.instance,
        to: options.to,
        body: options.caption || '',
        type: 'image', // Detectar tipo real baseado no arquivo
        timestamp: new Date(),
        mediaUrl: typeof options.media === 'string' ? options.media : undefined,
        filename: options.filename,
        isFromMe: true,
        status: 'sent'
      };
    } catch (error) {
      console.error('Error sending media:', error);
      throw error;
    }
  }

  // Buscar conversas/chats
  async getChats(): Promise<WhatsAppContact[]> {
    try {
      const response = await this.request<any>(`/chat/findChats/${this.config.instance}`);
      
      if (!Array.isArray(response)) {
        return [];
      }

      return response.map((chat: any) => ({
        id: chat.id,
        name: chat.name || chat.pushName || chat.id.split('@')[0],
        number: chat.id.split('@')[0],
        profilePictureUrl: chat.profilePicUrl,
        isOnline: false, // Evolution API pode não fornecer isso
        lastSeen: chat.lastMsgTimestamp ? new Date(chat.lastMsgTimestamp * 1000) : undefined
      }));
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  // Buscar mensagens de uma conversa
  async getChatMessages(chatId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    try {
      const response = await this.request<any>(
        `/chat/findMessages/${this.config.instance}`,
        'POST',
        {
          where: {
            key: {
              remoteJid: chatId
            }
          },
          limit
        }
      );

      if (!Array.isArray(response)) {
        return [];
      }

      return response.map((msg: any) => ({
        id: msg.key?.id || crypto.randomUUID(),
        from: msg.key?.remoteJid || '',
        to: msg.key?.fromMe ? chatId : this.config.instance,
        body: msg.message?.conversation || msg.message?.extendedTextMessage?.text || '',
        type: this.detectMessageType(msg.message),
        timestamp: new Date(msg.messageTimestamp * 1000),
        mediaUrl: msg.message?.imageMessage?.url || msg.message?.videoMessage?.url,
        filename: msg.message?.documentMessage?.fileName,
        mimetype: msg.message?.imageMessage?.mimetype || msg.message?.videoMessage?.mimetype,
        caption: msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption,
        isFromMe: msg.key?.fromMe || false,
        status: 'delivered'
      }));
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  // Detectar tipo de mensagem
  private detectMessageType(message: any): WhatsAppMessage['type'] {
    if (message?.imageMessage) return 'image';
    if (message?.videoMessage) return 'video';
    if (message?.audioMessage) return 'audio';
    if (message?.documentMessage) return 'document';
    return 'text';
  }

  // Configurar webhook
  async setWebhook(webhookUrl: string): Promise<{ success: boolean }> {
    try {
      await this.request(
        `/webhook/set/${this.config.instance}`,
        'POST',
        {
          url: webhookUrl,
          enabled: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'PRESENCE_UPDATE'
          ]
        }
      );

      this.config.webhookUrl = webhookUrl;
      return { success: true };
    } catch (error) {
      console.error('Error setting webhook:', error);
      return { success: false };
    }
  }

  // Processar webhook recebido
  processWebhook(payload: any): {
    type: 'message' | 'status' | 'connection';
    data: any;
  } | null {
    try {
      if (payload.event === 'messages.upsert' && payload.data?.messages) {
        const message = payload.data.messages[0];
        
        return {
          type: 'message',
          data: {
            id: message.key?.id,
            from: message.key?.remoteJid,
            to: message.key?.fromMe ? message.key.remoteJid : this.config.instance,
            body: message.message?.conversation || message.message?.extendedTextMessage?.text || '',
            type: this.detectMessageType(message.message),
            timestamp: new Date(message.messageTimestamp * 1000),
            isFromMe: message.key?.fromMe || false,
            mediaUrl: message.message?.imageMessage?.url || message.message?.videoMessage?.url,
            filename: message.message?.documentMessage?.fileName
          }
        };
      }

      if (payload.event === 'connection.update') {
        return {
          type: 'connection',
          data: {
            status: this.mapConnectionStatus(payload.data.state),
            qrCode: payload.data.qrcode?.base64
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing webhook:', error);
      return null;
    }
  }

  // Verificar se número está no WhatsApp
  async checkNumber(number: string): Promise<{ exists: boolean; jid?: string }> {
    try {
      const response = await this.request<any>(
        `/chat/whatsappNumbers/${this.config.instance}`,
        'POST',
        { numbers: [number] }
      );

      if (Array.isArray(response) && response.length > 0) {
        return {
          exists: response[0].exists,
          jid: response[0].jid
        };
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking number:', error);
      return { exists: false };
    }
  }

  // Obter informações do perfil
  async getProfileInfo(number: string): Promise<WhatsAppContact | null> {
    try {
      const response = await this.request<any>(
        `/chat/findProfile/${this.config.instance}`,
        'POST',
        { number }
      );

      if (response) {
        return {
          id: response.jid || `${number}@s.whatsapp.net`,
          name: response.name || response.pushName || number,
          number,
          profilePictureUrl: response.profilePicUrl
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting profile info:', error);
      return null;
    }
  }

  // Health check da API
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    instance: string;
    apiVersion?: string;
    connectionStatus?: string;
  }> {
    try {
      // Tentar fazer uma chamada simples para verificar conectividade
      const status = await this.getInstanceStatus();
      
      return {
        status: 'healthy',
        instance: this.config.instance,
        connectionStatus: status.status
      };
    } catch (error) {
      console.error('Evolution API health check failed:', error);
      return {
        status: 'unhealthy',
        instance: this.config.instance
      };
    }
  }

  // Utilitário para formatar número brasileiro
  static formatBrazilianNumber(number: string): string {
    // Remove caracteres não numéricos
    const cleaned = number.replace(/\D/g, '');
    
    // Se começar com 55 (código do Brasil), mantém
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return cleaned;
    }
    
    // Se não tem código do país, adiciona 55
    if (cleaned.length === 11) {
      return `55${cleaned}`;
    }
    
    // Se tem 10 dígitos, adiciona 9 no celular e código do país
    if (cleaned.length === 10) {
      return `55${cleaned.slice(0, 2)}9${cleaned.slice(2)}`;
    }
    
    return cleaned;
  }

  // Configurar instância atual
  setInstance(instance: string): void {
    this.config.instance = instance;
  }

  // Obter configuração atual
  getConfig(): EvolutionAPIConfig {
    return { ...this.config };
  }
}

// Instância singleton
export const evolutionApiService = new EvolutionApiService();

// Export da classe para criar múltiplas instâncias se necessário
export { EvolutionApiService };