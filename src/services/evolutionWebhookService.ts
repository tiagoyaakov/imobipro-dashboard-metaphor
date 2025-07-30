// Serviço para processar webhooks da Evolution API
import { supabase } from '@/integrations/supabase/client';
import { evolutionApiService } from './evolutionApiService';
import { chatsService } from './chatsService';
import { messagesService } from './messagesService';

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: any;
  timestamp: string;
  server_url?: string;
}

export interface MessageWebhookData {
  messages: Array<{
    key: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
      };
      videoMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
      };
      audioMessage?: {
        url: string;
        mimetype: string;
      };
      documentMessage?: {
        url: string;
        mimetype: string;
        fileName: string;
      };
    };
    messageTimestamp: number;
    pushName?: string;
  }>;
}

export interface ConnectionWebhookData {
  state: 'open' | 'close' | 'connecting';
  instance?: string;
  qrcode?: {
    base64: string;
  };
}

class EvolutionWebhookService {
  // Processar webhook recebido
  async processWebhook(payload: EvolutionWebhookPayload): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('Processing Evolution webhook:', payload.event, payload.instance);

      switch (payload.event) {
        case 'messages.upsert':
          return await this.handleMessageUpsert(payload.data as MessageWebhookData, payload.instance);
        
        case 'messages.update':
          return await this.handleMessageUpdate(payload.data, payload.instance);
        
        case 'connection.update':
          return await this.handleConnectionUpdate(payload.data as ConnectionWebhookData, payload.instance);
        
        case 'presence.update':
          return await this.handlePresenceUpdate(payload.data, payload.instance);
        
        case 'qrcode.updated':
          return await this.handleQRCodeUpdate(payload.data, payload.instance);
        
        default:
          console.log('Unhandled webhook event:', payload.event);
          return {
            success: true,
            message: `Event ${payload.event} acknowledged but not processed`
          };
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Processar nova mensagem ou atualização
  private async handleMessageUpsert(
    data: MessageWebhookData, 
    instance: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const processedMessages = [];

      for (const msg of data.messages) {
        const processedMessage = await this.processMessage(msg, instance);
        if (processedMessage) {
          processedMessages.push(processedMessage);
        }
      }

      return {
        success: true,
        message: `Processed ${processedMessages.length} messages`,
        data: processedMessages
      };
    } catch (error) {
      console.error('Error handling message upsert:', error);
      throw error;
    }
  }

  // Processar mensagem individual
  private async processMessage(msg: any, instance: string) {
    try {
      const phoneNumber = this.extractPhoneNumber(msg.key.remoteJid);
      const messageContent = this.extractMessageContent(msg.message);
      const messageType = this.detectMessageType(msg.message);

      if (!messageContent && messageType === 'text') {
        return null; // Ignorar mensagens sem conteúdo
      }

      // Buscar ou criar contato
      const contact = await this.findOrCreateContact(phoneNumber, msg.pushName);
      
      // Buscar agente da instância (assumindo que instanceId = agentId)
      const agentId = await this.getAgentIdFromInstance(instance);
      if (!agentId) {
        console.warn('No agent found for instance:', instance);
        return null;
      }

      // Buscar ou criar chat
      const chat = await chatsService.findOrCreateChat(agentId, contact.id);

      // Determinar quem enviou a mensagem
      const senderId = msg.key.fromMe ? agentId : contact.id;

      // Verificar se mensagem já existe (evitar duplicatas)
      const existingMessage = await this.findExistingMessage(msg.key.id);
      if (existingMessage) {
        return existingMessage;
      }

      // Criar mensagem no banco
      const message = await messagesService.createMessage({
        chatId: chat.id,
        content: messageContent,
        senderId
      });

      // Salvar dados do WhatsApp para referência
      await this.saveWhatsAppMessageData({
        messageId: message.id,
        whatsappId: msg.key.id,
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        messageType,
        mediaUrl: this.extractMediaUrl(msg.message),
        instance,
        timestamp: new Date(msg.messageTimestamp * 1000)
      });

      return message;
    } catch (error) {
      console.error('Error processing individual message:', error);
      return null;
    }
  }

  // Buscar ou criar contato
  private async findOrCreateContact(phoneNumber: string, name?: string) {
    try {
      // Tentar buscar contato existente pelo telefone
      const { data: existingContact } = await supabase
        .from('Contact')
        .select('*')
        .eq('phone', phoneNumber)
        .single();

      if (existingContact) {
        return existingContact;
      }

      // Criar novo contato
      const { data: newContact, error } = await supabase
        .from('Contact')
        .insert({
          id: crypto.randomUUID(),
          name: name || phoneNumber,
          phone: phoneNumber,
          category: 'LEAD',
          status: 'NEW',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating contact: ${error.message}`);
      }

      return newContact;
    } catch (error) {
      console.error('Error finding/creating contact:', error);
      throw error;
    }
  }

  // Buscar agente por instância
  private async getAgentIdFromInstance(instance: string): Promise<string | null> {
    try {
      // Por enquanto, assumir que instance = agentId
      // Em produção, isso deve ser mapeado via tabela WhatsAppInstance
      const { data: whatsappInstance } = await supabase
        .from('WhatsAppInstance')
        .select('agentId')
        .eq('instanceId', instance)
        .single();

      return whatsappInstance?.agentId || null;
    } catch (error) {
      console.warn('Could not find agent for instance:', instance);
      return null;
    }
  }

  // Verificar se mensagem já existe
  private async findExistingMessage(whatsappId: string) {
    try {
      const { data: existing } = await supabase
        .from('WhatsAppMessage')
        .select('*')
        .eq('whatsappId', whatsappId)
        .single();

      return existing;
    } catch (error) {
      return null;
    }
  }

  // Salvar dados específicos do WhatsApp
  private async saveWhatsAppMessageData(data: {
    messageId: string;
    whatsappId: string;
    remoteJid: string;
    fromMe: boolean;
    messageType: string;
    mediaUrl?: string;
    instance: string;
    timestamp: Date;
  }) {
    try {
      await supabase
        .from('WhatsAppMessage')
        .insert({
          id: crypto.randomUUID(),
          whatsappId: data.whatsappId,
          instanceId: data.instance,
          fromNumber: data.remoteJid.split('@')[0],
          toNumber: data.fromMe ? data.remoteJid.split('@')[0] : data.instance,
          content: '', // Conteúdo já está na tabela Message
          messageType: data.messageType as any,
          mediaUrl: data.mediaUrl,
          isFromMe: data.fromMe,
          messageStatus: 'delivered',
          timestamp: data.timestamp.toISOString(),
          createdAt: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving WhatsApp message data:', error);
    }
  }

  // Processar atualização de conexão
  private async handleConnectionUpdate(
    data: ConnectionWebhookData, 
    instance: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('Connection update:', data.state, instance);

      // Atualizar status da instância se existir
      await this.updateInstanceStatus(instance, data.state, data.qrcode?.base64);

      return {
        success: true,
        message: `Connection updated to ${data.state}`,
        data: { state: data.state, qrcode: data.qrcode?.base64 }
      };
    } catch (error) {
      console.error('Error handling connection update:', error);
      throw error;
    }
  }

  // Atualizar status da instância
  private async updateInstanceStatus(instance: string, state: string, qrCode?: string) {
    try {
      const status = this.mapConnectionState(state);
      
      await supabase
        .from('WhatsAppInstance')
        .update({
          status,
          qrCode,
          qrCodeExpiry: qrCode ? new Date(Date.now() + 5 * 60 * 1000) : null, // 5 min
          lastConnectionAt: state === 'open' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        })
        .eq('instanceId', instance);
    } catch (error) {
      console.error('Error updating instance status:', error);
    }
  }

  // Mapear estado de conexão
  private mapConnectionState(state: string): string {
    switch (state) {
      case 'open':
        return 'CONNECTED';
      case 'connecting':
        return 'CONNECTING';
      case 'close':
        return 'DISCONNECTED';
      default:
        return 'ERROR';
    }
  }

  // Processar atualização de presença
  private async handlePresenceUpdate(
    data: any, 
    instance: string
  ): Promise<{ success: boolean; message: string }> {
    // Por enquanto apenas log, pode ser usado para status "digitando"
    console.log('Presence update:', data, instance);
    
    return {
      success: true,
      message: 'Presence update acknowledged'
    };
  }

  // Processar atualização de QR Code
  private async handleQRCodeUpdate(
    data: any, 
    instance: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      await this.updateInstanceStatus(instance, 'connecting', data.qrcode?.base64);
      
      return {
        success: true,
        message: 'QR Code updated',
        data: { qrcode: data.qrcode?.base64 }
      };
    } catch (error) {
      console.error('Error handling QR code update:', error);
      throw error;
    }
  }

  // Atualizar status de mensagem
  private async handleMessageUpdate(
    data: any, 
    instance: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Atualizar status de entrega/leitura se necessário
      console.log('Message update:', data, instance);
      
      return {
        success: true,
        message: 'Message update processed'
      };
    } catch (error) {
      console.error('Error handling message update:', error);
      throw error;
    }
  }

  // Utilitários para extrair dados da mensagem
  private extractPhoneNumber(remoteJid: string): string {
    return remoteJid.split('@')[0];
  }

  private extractMessageContent(message: any): string {
    if (message.conversation) {
      return message.conversation;
    }
    if (message.extendedTextMessage?.text) {
      return message.extendedTextMessage.text;
    }
    if (message.imageMessage?.caption) {
      return message.imageMessage.caption;
    }
    if (message.videoMessage?.caption) {
      return message.videoMessage.caption;
    }
    return '';
  }

  private detectMessageType(message: any): string {
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    return 'text';
  }

  private extractMediaUrl(message: any): string | undefined {
    return message.imageMessage?.url || 
           message.videoMessage?.url || 
           message.audioMessage?.url || 
           message.documentMessage?.url;
  }

  // Configurar webhook na Evolution API
  async setupWebhook(instanceId: string, webhookUrl: string): Promise<boolean> {
    try {
      const result = await evolutionApiService.setWebhook(webhookUrl);
      return result.success;
    } catch (error) {
      console.error('Error setting up webhook:', error);
      return false;
    }
  }

  // Validar assinatura do webhook (se configurada)
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }
}

export const evolutionWebhookService = new EvolutionWebhookService();