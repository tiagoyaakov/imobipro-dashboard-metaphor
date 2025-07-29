/**
 * 🔗 ImobiPRO - Serviço de Gerenciamento WhatsApp
 * 
 * Serviço completo para gestão de instâncias WhatsApp por corretor.
 * Inclui criação, gerenciamento de status, QR codes e integração com n8n.
 * 
 * Funcionalidades:
 * - Gestão de instâncias WhatsApp por corretor
 * - Geração e renovação de QR codes
 * - Monitoramento de status de conexão
 * - Integração com webhooks n8n
 * - Controle de permissões e limites
 * - Logs de conexão e auditoria
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface WhatsAppInstance {
  id: string;
  agentId: string;
  instanceId: string;
  phoneNumber?: string;
  displayName?: string;
  status: WhatsAppStatus;
  qrCode?: string;
  qrCodeExpiry?: Date;
  autoReply: boolean;
  autoReplyMessage?: string;
  webhookUrl?: string;
  isActive: boolean;
  canConnect: boolean;
  maxDailyMessages?: number;
  lastConnectionAt?: Date;
  messagesSentToday: number;
  messagesReceivedToday: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  createdAt: Date;
  updatedAt: Date;
  agent?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WhatsAppConnectionLog {
  id: string;
  instanceId: string;
  action: ConnectionAction;
  status: string;
  errorMessage?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  retryCount: number;
  createdAt: Date;
}

export interface WhatsAppConfig {
  id: string;
  companyId: string;
  maxInstancesPerAgent: number;
  autoQRRefresh: boolean;
  qrRefreshInterval: number;
  messageRateLimit: number;
  autoReplyEnabled: boolean;
  webhookSecret?: string;
  n8nWebhookUrl?: string;
  enableN8nIntegration: boolean;
  allowedIPs: string[];
  requireIPWhitelist: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInstanceInput {
  agentId: string;
  displayName?: string;
  autoReply?: boolean;
  autoReplyMessage?: string;
  webhookUrl?: string;
}

export interface UpdateInstanceInput {
  displayName?: string;
  autoReply?: boolean;
  autoReplyMessage?: string;
  webhookUrl?: string;
  isActive?: boolean;
  canConnect?: boolean;
  maxDailyMessages?: number;
}

export type WhatsAppStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR' | 'QR_CODE_PENDING';
export type ConnectionAction = 'CONNECT' | 'DISCONNECT' | 'QR_GENERATED' | 'ERROR' | 'RECONNECT';

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

class WhatsAppService {
  
  // --------------------------------------------------------------------------
  // CRUD DE INSTÂNCIAS
  // --------------------------------------------------------------------------

  /**
   * Buscar instância por ID
   */
  async getInstanceById(id: string): Promise<WhatsAppInstance | null> {
    try {
      const { data, error } = await supabase
        .from('WhatsAppInstance')
        .select(`
          *,
          agent:User(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as WhatsAppInstance | null;
    } catch (error) {
      console.error('Erro ao buscar instância WhatsApp:', error);
      throw new Error('Falha ao buscar instância WhatsApp');
    }
  }

  /**
   * Buscar instância por agente
   */
  async getInstanceByAgent(agentId: string): Promise<WhatsAppInstance | null> {
    try {
      const { data, error } = await supabase
        .from('WhatsAppInstance')
        .select(`
          *,
          agent:User(id, name, email)
        `)
        .eq('agentId', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as WhatsAppInstance | null;
    } catch (error) {
      console.error('Erro ao buscar instância do agente:', error);
      throw new Error('Falha ao buscar instância do agente');
    }
  }

  /**
   * Listar todas as instâncias com filtros
   */
  async getInstances(filters: {
    companyId?: string;
    status?: WhatsAppStatus;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ instances: WhatsAppInstance[]; total: number }> {
    try {
      let query = supabase
        .from('WhatsAppInstance')
        .select(`
          *,
          agent:User(id, name, email, companyId)
        `, { count: 'exact' });

      // Filtrar por empresa através do agente
      if (filters.companyId) {
        query = query.eq('agent.companyId', filters.companyId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('isActive', filters.isActive);
      }

      // Paginação
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      // Ordenação
      query = query.order('createdAt', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        instances: data as WhatsAppInstance[],
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao listar instâncias:', error);
      throw new Error('Falha ao listar instâncias');
    }
  }

  /**
   * Criar nova instância WhatsApp
   */
  async createInstance(input: CreateInstanceInput): Promise<WhatsAppInstance> {
    try {
      // Verificar se o agente já possui uma instância
      const existingInstance = await this.getInstanceByAgent(input.agentId);
      if (existingInstance) {
        throw new Error('Agente já possui uma instância WhatsApp');
      }

      // Verificar configurações da empresa
      const config = await this.getCompanyConfig(input.agentId);
      if (config && config.maxInstancesPerAgent === 1) {
        const agentInstances = await this.getInstances({});
        const agentInstanceCount = agentInstances.instances.filter(
          i => i.agentId === input.agentId
        ).length;
        
        if (agentInstanceCount >= config.maxInstancesPerAgent) {
          throw new Error('Limite de instâncias por agente atingido');
        }
      }

      // Gerar ID único para a instância
      const instanceId = `wa_${input.agentId.slice(0, 8)}_${Date.now()}`;

      const { data, error } = await supabase
        .from('WhatsAppInstance')
        .insert({
          agentId: input.agentId,
          instanceId,
          displayName: input.displayName || 'WhatsApp Instance',
          status: 'DISCONNECTED',
          autoReply: input.autoReply || false,
          autoReplyMessage: input.autoReplyMessage,
          webhookUrl: input.webhookUrl,
          isActive: true,
          canConnect: true,
          messagesSentToday: 0,
          messagesReceivedToday: 0,
          totalMessagesSent: 0,
          totalMessagesReceived: 0
        })
        .select(`
          *,
          agent:User(id, name, email)
        `)
        .single();

      if (error) throw error;

      // Log da criação
      await this.logConnection({
        instanceId: data.id,
        action: 'CONNECT',
        status: 'Instance created successfully'
      });

      return data as WhatsAppInstance;
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  /**
   * Atualizar instância
   */
  async updateInstance(id: string, input: UpdateInstanceInput): Promise<WhatsAppInstance> {
    try {
      const { data, error } = await supabase
        .from('WhatsAppInstance')
        .update(input)
        .eq('id', id)
        .select(`
          *,
          agent:User(id, name, email)
        `)
        .single();

      if (error) throw error;

      return data as WhatsAppInstance;
    } catch (error) {
      console.error('Erro ao atualizar instância:', error);
      throw new Error('Falha ao atualizar instância');
    }
  }

  /**
   * Deletar instância
   */
  async deleteInstance(id: string): Promise<void> {
    try {
      // Primeiro desconectar se estiver conectada
      await this.disconnectInstance(id);

      const { error } = await supabase
        .from('WhatsAppInstance')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      throw new Error('Falha ao deletar instância');
    }
  }

  // --------------------------------------------------------------------------
  // GERENCIAMENTO DE CONEXÃO
  // --------------------------------------------------------------------------

  /**
   * Conectar instância e gerar QR code
   */
  async connectInstance(id: string): Promise<{ qrCode?: string; status: WhatsAppStatus }> {
    try {
      const instance = await this.getInstanceById(id);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      if (!instance.canConnect) {
        throw new Error('Instância não tem permissão para conectar');
      }

      // Atualizar status para connecting
      await this.updateInstanceStatus(id, 'CONNECTING');

      // Aqui seria feita a integração com a API do WhatsApp
      // Por enquanto, vamos simular a geração de QR code
      const qrCode = this.generateMockQRCode(instance.instanceId);
      const qrCodeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

      await supabase
        .from('WhatsAppInstance')
        .update({
          status: 'QR_CODE_PENDING',
          qrCode,
          qrCodeExpiry: qrCodeExpiry.toISOString()
        })
        .eq('id', id);

      // Log da operação
      await this.logConnection({
        instanceId: id,
        action: 'QR_GENERATED',
        status: 'QR code generated successfully'
      });

      return {
        qrCode,
        status: 'QR_CODE_PENDING'
      };
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      
      // Log do erro
      await this.logConnection({
        instanceId: id,
        action: 'ERROR',
        status: 'Connection failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      await this.updateInstanceStatus(id, 'ERROR');
      throw error;
    }
  }

  /**
   * Desconectar instância
   */
  async disconnectInstance(id: string): Promise<void> {
    try {
      const instance = await this.getInstanceById(id);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // Aqui seria feita a desconexão via API do WhatsApp
      
      await supabase
        .from('WhatsAppInstance')
        .update({
          status: 'DISCONNECTED',
          qrCode: null,
          qrCodeExpiry: null,
          lastConnectionAt: null
        })
        .eq('id', id);

      // Log da operação
      await this.logConnection({
        instanceId: id,
        action: 'DISCONNECT',
        status: 'Instance disconnected successfully'
      });
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      throw new Error('Falha ao desconectar instância');
    }
  }

  /**
   * Renovar QR code
   */
  async refreshQRCode(id: string): Promise<string> {
    try {
      const instance = await this.getInstanceById(id);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      if (instance.status !== 'QR_CODE_PENDING' && instance.status !== 'DISCONNECTED') {
        throw new Error('Instância não está em estado válido para renovar QR code');
      }

      const qrCode = this.generateMockQRCode(instance.instanceId);
      const qrCodeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

      await supabase
        .from('WhatsAppInstance')
        .update({
          status: 'QR_CODE_PENDING',
          qrCode,
          qrCodeExpiry: qrCodeExpiry.toISOString()
        })
        .eq('id', id);

      // Log da operação
      await this.logConnection({
        instanceId: id,
        action: 'QR_GENERATED',
        status: 'QR code refreshed successfully'
      });

      return qrCode;
    } catch (error) {
      console.error('Erro ao renovar QR code:', error);
      throw error;
    }
  }

  /**
   * Simular conexão bem-sucedida (para testes)
   */
  async simulateConnection(id: string, phoneNumber: string): Promise<void> {
    try {
      await supabase
        .from('WhatsAppInstance')
        .update({
          status: 'CONNECTED',
          phoneNumber,
          qrCode: null,
          qrCodeExpiry: null,
          lastConnectionAt: new Date().toISOString()
        })
        .eq('id', id);

      // Log da operação
      await this.logConnection({
        instanceId: id,
        action: 'CONNECT',
        status: 'Instance connected successfully',
        metadata: { phoneNumber }
      });
    } catch (error) {
      console.error('Erro ao simular conexão:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // GERENCIAMENTO DE STATUS
  // --------------------------------------------------------------------------

  /**
   * Atualizar status da instância
   */
  async updateInstanceStatus(id: string, status: WhatsAppStatus): Promise<void> {
    try {
      await supabase
        .from('WhatsAppInstance')
        .update({ 
          status,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Verificar saúde de todas as instâncias
   */
  async checkInstancesHealth(): Promise<{
    total: number;
    connected: number;
    disconnected: number;
    errors: number;
    pending: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('WhatsAppInstance')
        .select('status')
        .eq('isActive', true);

      if (error) throw error;

      const stats = {
        total: data.length,
        connected: 0,
        disconnected: 0,
        errors: 0,
        pending: 0
      };

      data.forEach(instance => {
        switch (instance.status) {
          case 'CONNECTED':
            stats.connected++;
            break;
          case 'DISCONNECTED':
            stats.disconnected++;
            break;
          case 'ERROR':
            stats.errors++;
            break;
          case 'QR_CODE_PENDING':
          case 'CONNECTING':
            stats.pending++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao verificar saúde das instâncias:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // LOGS E AUDITORIA
  // --------------------------------------------------------------------------

  /**
   * Registrar log de conexão
   */
  async logConnection(log: {
    instanceId: string;
    action: ConnectionAction;
    status: string;
    errorMessage?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
  }): Promise<void> {
    try {
      await supabase
        .from('WhatsAppConnectionLog')
        .insert({
          instanceId: log.instanceId,
          action: log.action,
          status: log.status,
          errorMessage: log.errorMessage,
          metadata: log.metadata,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          duration: log.duration,
          retryCount: 0
        });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
      // Não propagar erro do log para não afetar operação principal
    }
  }

  /**
   * Buscar logs de conexão
   */
  async getConnectionLogs(instanceId: string, limit = 50): Promise<WhatsAppConnectionLog[]> {
    try {
      const { data, error } = await supabase
        .from('WhatsAppConnectionLog')
        .select('*')
        .eq('instanceId', instanceId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as WhatsAppConnectionLog[];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw new Error('Falha ao buscar logs de conexão');
    }
  }

  // --------------------------------------------------------------------------
  // CONFIGURAÇÕES
  // --------------------------------------------------------------------------

  /**
   * Buscar configuração da empresa
   */
  async getCompanyConfig(agentId: string): Promise<WhatsAppConfig | null> {
    try {
      // Primeiro buscar o agente para pegar o companyId
      const { data: agent, error: agentError } = await supabase
        .from('User')
        .select('companyId')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;

      const { data, error } = await supabase
        .from('WhatsAppConfig')
        .select('*')
        .eq('companyId', agent.companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as WhatsAppConfig | null;
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return null;
    }
  }

  /**
   * Criar ou atualizar configuração da empresa
   */
  async updateCompanyConfig(companyId: string, config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    try {
      const { data, error } = await supabase
        .from('WhatsAppConfig')
        .upsert({
          companyId,
          ...config
        })
        .select('*')
        .single();

      if (error) throw error;

      return data as WhatsAppConfig;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw new Error('Falha ao atualizar configuração');
    }
  }

  // --------------------------------------------------------------------------
  // UTILITÁRIOS
  // --------------------------------------------------------------------------

  /**
   * Gerar QR code mock para desenvolvimento
   */
  private generateMockQRCode(instanceId: string): string {
    // Em produção, aqui seria gerado o QR code real da API do WhatsApp
    const timestamp = Date.now();
    return `2@mock_qr_${instanceId}_${timestamp}@WhatsApp_Mock`;
  }

  /**
   * Verificar se QR code expirou
   */
  isQRCodeExpired(instance: WhatsAppInstance): boolean {
    if (!instance.qrCodeExpiry) return false;
    return new Date() > new Date(instance.qrCodeExpiry);
  }

  /**
   * Calcular tempo até expiração do QR code
   */
  getQRCodeTimeLeft(instance: WhatsAppInstance): number {
    if (!instance.qrCodeExpiry) return 0;
    const now = new Date().getTime();
    const expiry = new Date(instance.qrCodeExpiry).getTime();
    return Math.max(0, expiry - now);
  }
}

// ============================================================================
// INSTÂNCIA E EXPORTAÇÃO
// ============================================================================

export const whatsappService = new WhatsAppService();
export default whatsappService;