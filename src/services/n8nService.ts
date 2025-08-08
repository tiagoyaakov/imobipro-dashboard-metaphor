import { N8nWorkflowConfig, N8nExecutionLog, AppointmentExtended } from '@/types/agenda';

// ===== N8N CONFIGURATION =====
// 🔧 CONFIGURAR ESTAS VARIÁVEIS COM SUAS INFORMAÇÕES N8N
const N8N_CONFIG = {
  // ⚠️ TODO: Substituir pela URL da sua instância n8n
  baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678',
  
  // ⚠️ TODO: Substituir pela sua API Key do n8n
  apiKey: import.meta.env.VITE_N8N_API_KEY || 'your-n8n-api-key',
  
  // ⚠️ TODO: Substituir pela URL base onde o ImobiPRO receberá webhooks
  webhookBaseUrl: import.meta.env.VITE_WEBHOOK_BASE_URL || 'https://seu-imobipro.com/api/webhooks',
  
  // ⚠️ TODO: Definir secret para validação de webhooks (recomendado)
  webhookSecret: import.meta.env.VITE_N8N_WEBHOOK_SECRET || 'your-webhook-secret',
  
  // Timeout para requests (em ms)
  timeout: 30000,
};

// ===== N8N API CLIENT =====

class N8nApiClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseUrl = N8N_CONFIG.baseUrl;
    this.apiKey = N8N_CONFIG.apiKey;
    this.timeout = N8N_CONFIG.timeout;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`n8n API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // ===== WORKFLOW MANAGEMENT =====

  /**
   * 🔌 Listar todos os workflows
   */
  async getWorkflows() {
    return this.makeRequest('/workflows');
  }

  /**
   * 🔌 Obter workflow específico por ID
   */
  async getWorkflow(workflowId: string) {
    return this.makeRequest(`/workflows/${workflowId}`);
  }

  /**
   * 🔌 Ativar/Desativar workflow
   */
  async toggleWorkflow(workflowId: string, active: boolean) {
    return this.makeRequest(`/workflows/${workflowId}/${active ? 'activate' : 'deactivate'}`, {
      method: 'POST',
    });
  }

  /**
   * 🔌 Executar workflow manualmente
   */
  async executeWorkflow(workflowId: string, inputData: any) {
    return this.makeRequest(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ inputData }),
    });
  }

  // ===== EXECUTION MANAGEMENT =====

  /**
   * 🔌 Listar execuções de workflow
   */
  async getExecutions(workflowId?: string, limit: number = 20) {
    const params = new URLSearchParams();
    if (workflowId) params.append('workflowId', workflowId);
    params.append('limit', limit.toString());
    
    return this.makeRequest(`/executions?${params.toString()}`);
  }

  /**
   * 🔌 Obter execução específica
   */
  async getExecution(executionId: string) {
    return this.makeRequest(`/executions/${executionId}`);
  }

  /**
   * 🔌 Parar execução em andamento
   */
  async stopExecution(executionId: string) {
    return this.makeRequest(`/executions/${executionId}/stop`, {
      method: 'POST',
    });
  }

  // ===== WEBHOOK MANAGEMENT =====

  /**
   * 🔌 Criar webhook para workflow
   */
  async createWebhook(workflowId: string, webhookPath: string) {
    const webhookUrl = `${N8N_CONFIG.webhookBaseUrl}/${webhookPath}`;
    
    return this.makeRequest(`/workflows/${workflowId}/webhook`, {
      method: 'POST',
      body: JSON.stringify({
        webhookUrl,
        httpMethod: 'POST',
        responseMode: 'responseNode',
      }),
    });
  }

  /**
   * 🔌 Listar webhooks do workflow
   */
  async getWebhooks(workflowId: string) {
    return this.makeRequest(`/workflows/${workflowId}/webhooks`);
  }
}

// ===== N8N SERVICE =====

export const n8nService = {
  client: new N8nApiClient(),

  // ===== WORKFLOW TEMPLATES =====
  
  /**
   * 📋 Template IDs dos workflows essenciais
   * ⚠️ TODO: Substituir pelos IDs reais dos seus workflows n8n
   */
  WORKFLOW_IDS: {
    WHATSAPP_SCHEDULING: 'workflow-whatsapp-scheduling', // 🔧 Substituir pelo ID real
    APPOINTMENT_REMINDERS: 'workflow-appointment-reminders', // 🔧 Substituir pelo ID real
    POST_VISIT_FOLLOWUP: 'workflow-post-visit-followup', // 🔧 Substituir pelo ID real
    CONFLICT_RESOLUTION: 'workflow-conflict-resolution', // 🔧 Substituir pelo ID real
    CALENDAR_SYNC: 'workflow-calendar-sync', // 🔧 Substituir pelo ID real
  },

  /**
   * 📋 Webhook paths para cada tipo de evento
   * ⚠️ TODO: Configurar estes endpoints no seu servidor web/API Gateway
   */
  WEBHOOK_PATHS: {
    // 📥 Webhooks de entrada (n8n → ImobiPRO)
    INCOMING: {
      APPOINTMENT_CREATED: 'n8n/appointment/created',     // 🔧 Implementar endpoint
      APPOINTMENT_UPDATED: 'n8n/appointment/updated',     // 🔧 Implementar endpoint
      APPOINTMENT_CANCELLED: 'n8n/appointment/cancelled', // 🔧 Implementar endpoint
      WHATSAPP_MESSAGE: 'n8n/whatsapp/message',          // 🔧 Implementar endpoint
      CALENDAR_EVENT: 'n8n/calendar/event',              // 🔧 Implementar endpoint
    },
    
    // 📤 Webhooks de saída (ImobiPRO → n8n)
    OUTGOING: {
      TRIGGER_REMINDER: 'n8n/trigger/reminder',          // 🔧 URL no n8n
      TRIGGER_FOLLOWUP: 'n8n/trigger/followup',          // 🔧 URL no n8n
      TRIGGER_SYNC: 'n8n/trigger/sync',                  // 🔧 URL no n8n
      TRIGGER_CONFLICT: 'n8n/trigger/conflict',          // 🔧 URL no n8n
      TRIGGER_NOTIFICATION: 'n8n/trigger/notification',  // 🔧 URL no n8n
    }
  },

  // ===== WORKFLOW EXECUTION =====

  /**
   * 🚀 Executar workflow de agendamento via WhatsApp
   */
  async executeWhatsAppScheduling(data: {
    phoneNumber: string;
    message: string;
    contactId?: string;
    agentId?: string;
  }) {
    return this.client.executeWorkflow(
      this.WORKFLOW_IDS.WHATSAPP_SCHEDULING,
      {
        phoneNumber: data.phoneNumber,
        message: data.message,
        contactId: data.contactId,
        agentId: data.agentId,
        timestamp: new Date().toISOString(),
        source: 'imobipro'
      }
    );
  },

  /**
   * 🚀 Executar workflow de lembretes
   */
  async executeAppointmentReminders(data: {
    appointmentId: string;
    reminderType: '24h' | '1h' | 'confirmation';
    contactInfo: {
      name: string;
      phone?: string;
      email?: string;
    };
    appointmentDetails: {
      date: string;
      time: string;
      address?: string;
      agentName: string;
    };
  }) {
    return this.client.executeWorkflow(
      this.WORKFLOW_IDS.APPOINTMENT_REMINDERS,
      {
        appointmentId: data.appointmentId,
        reminderType: data.reminderType,
        contactInfo: data.contactInfo,
        appointmentDetails: data.appointmentDetails,
        timestamp: new Date().toISOString(),
        source: 'imobipro'
      }
    );
  },

  /**
   * 🚀 Executar workflow de follow-up pós-visita
   */
  async executePostVisitFollowup(data: {
    appointmentId: string;
    contactId: string;
    propertyId?: string;
    agentId: string;
    visitOutcome?: 'interested' | 'not_interested' | 'needs_followup';
    notes?: string;
  }) {
    return this.client.executeWorkflow(
      this.WORKFLOW_IDS.POST_VISIT_FOLLOWUP,
      {
        appointmentId: data.appointmentId,
        contactId: data.contactId,
        propertyId: data.propertyId,
        agentId: data.agentId,
        visitOutcome: data.visitOutcome,
        notes: data.notes,
        timestamp: new Date().toISOString(),
        source: 'imobipro'
      }
    );
  },

  /**
   * 🚀 Executar workflow de resolução de conflitos
   */
  async executeConflictResolution(data: {
    conflictId: string;
    conflictType: string;
    appointmentId: string;
    conflictData: any;
    resolutionStrategy?: string;
  }) {
    return this.client.executeWorkflow(
      this.WORKFLOW_IDS.CONFLICT_RESOLUTION,
      {
        conflictId: data.conflictId,
        conflictType: data.conflictType,
        appointmentId: data.appointmentId,
        conflictData: data.conflictData,
        resolutionStrategy: data.resolutionStrategy,
        timestamp: new Date().toISOString(),
        source: 'imobipro'
      }
    );
  },

  /**
   * 🚀 Executar workflow de sincronização de calendário
   */
  async executeCalendarSync(data: {
    operation: 'create' | 'update' | 'delete';
    appointmentId: string;
    calendarData: any;
    syncDirection: 'to_google' | 'from_google';
  }) {
    return this.client.executeWorkflow(
      this.WORKFLOW_IDS.CALENDAR_SYNC,
      {
        operation: data.operation,
        appointmentId: data.appointmentId,
        calendarData: data.calendarData,
        syncDirection: data.syncDirection,
        timestamp: new Date().toISOString(),
        source: 'imobipro'
      }
    );
  },

  // ===== WEBHOOK UTILITIES =====

  /**
   * 🔐 Validar assinatura de webhook (se configurado)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!N8N_CONFIG.webhookSecret) {
      console.warn('Webhook secret não configurado - validação de assinatura desabilitada');
      return true;
    }

    // TODO: Implementar validação HMAC quando o secret for fornecido
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', N8N_CONFIG.webhookSecret)
    //   .update(payload)
    //   .digest('hex');
    // return signature === `sha256=${expectedSignature}`;
    
    return true; // Temporariamente aceitar tudo
  },

  /**
   * 🔧 Obter status de health do n8n
   */
  async getHealthStatus() {
    try {
      const workflows = await this.client.getWorkflows();
      return {
        status: 'healthy',
        workflowCount: workflows.length,
        connection: 'ok',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        connection: 'failed',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 🔧 Configurar webhooks para todos os workflows
   */
  async setupAllWebhooks() {
    const results = [];
    
    for (const [workflowName, workflowId] of Object.entries(this.WORKFLOW_IDS)) {
      try {
        const webhookPath = `n8n/workflow/${workflowId}`;
        const result = await this.client.createWebhook(workflowId, webhookPath);
        results.push({
          workflow: workflowName,
          workflowId,
          webhookPath,
          status: 'success',
          result
        });
      } catch (error) {
        results.push({
          workflow: workflowName,
          workflowId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
};

// ===== WEBHOOK HANDLER TEMPLATES =====

/**
 * 📥 Template para handlers de webhook
 * ⚠️ TODO: Implementar estes handlers no seu framework web (Express, Fastify, etc.)
 */
export const webhookHandlers = {
  
  /**
   * 📥 Handler para agendamentos criados via n8n
   * Endpoint: POST /api/webhooks/n8n/appointment/created
   */
  handleAppointmentCreated: async (payload: any) => {
    console.log('🔥 Webhook: Agendamento criado via n8n', payload);
    
    // TODO: Implementar lógica para:
    // 1. Validar payload
    // 2. Criar agendamento no banco
    // 3. Sincronizar com Google Calendar
    // 4. Enviar notificações
    // 5. Atualizar slots de disponibilidade
    
    return { success: true, message: 'Agendamento criado com sucesso' };
  },

  /**
   * 📥 Handler para mensagens do WhatsApp
   * Endpoint: POST /api/webhooks/n8n/whatsapp/message
   */
  handleWhatsAppMessage: async (payload: any) => {
    console.log('🔥 Webhook: Mensagem WhatsApp recebida', payload);
    
    // TODO: Implementar lógica para:
    // 1. Processar mensagem com NLP
    // 2. Identificar intenção (agendamento, cancelamento, etc.)
    // 3. Executar ação correspondente
    // 4. Responder automaticamente
    
    return { success: true, message: 'Mensagem processada com sucesso' };
  },

  /**
   * 📥 Handler para eventos de calendário
   * Endpoint: POST /api/webhooks/n8n/calendar/event
   */
  handleCalendarEvent: async (payload: any) => {
    console.log('🔥 Webhook: Evento de calendário recebido', payload);
    
    // TODO: Implementar lógica para:
    // 1. Sincronizar evento com banco local
    // 2. Detectar conflitos
    // 3. Atualizar slots de disponibilidade
    // 4. Notificar corretor se necessário
    
    return { success: true, message: 'Evento sincronizado com sucesso' };
  }
};

// ===== CONFIGURATION HELPER =====

/**
 * 🔧 Helper para verificar se a configuração n8n está completa
 */
export const n8nConfigValidator = {
  validateConfig(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!N8N_CONFIG.baseUrl || N8N_CONFIG.baseUrl.includes('localhost')) {
      issues.push('⚠️ Configure a URL da instância n8n em VITE_N8N_BASE_URL');
    }
    
    if (!N8N_CONFIG.apiKey || N8N_CONFIG.apiKey === 'your-n8n-api-key') {
      issues.push('⚠️ Configure a API Key do n8n em VITE_N8N_API_KEY');
    }
    
    if (!N8N_CONFIG.webhookBaseUrl || N8N_CONFIG.webhookBaseUrl.includes('seu-imobipro')) {
      issues.push('⚠️ Configure a URL base dos webhooks em VITE_WEBHOOK_BASE_URL');
    }
    
    const workflowIds = Object.values(n8nService.WORKFLOW_IDS);
    if (workflowIds.some(id => id.startsWith('workflow-'))) {
      issues.push('⚠️ Configure os IDs reais dos workflows n8n');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  },

  printSetupInstructions() {
    console.log(`
🔧 ===== INSTRUÇÕES DE CONFIGURAÇÃO N8N =====

1. 📋 Variáveis de Ambiente (.env):
   VITE_N8N_BASE_URL=https://sua-instancia-n8n.com
   VITE_N8N_API_KEY=sua-api-key-aqui
   VITE_WEBHOOK_BASE_URL=https://seu-imobipro.com/api/webhooks
   VITE_N8N_WEBHOOK_SECRET=seu-secret-aqui

2. 🔌 Endpoints a implementar no servidor:
   POST /api/webhooks/n8n/appointment/created
   POST /api/webhooks/n8n/appointment/updated
   POST /api/webhooks/n8n/appointment/cancelled
   POST /api/webhooks/n8n/whatsapp/message
   POST /api/webhooks/n8n/calendar/event

3. 🤖 Workflows n8n a criar:
   - Agendamento via WhatsApp
   - Lembretes automáticos
   - Follow-up pós-visita
   - Resolução de conflitos
   - Sincronização de calendário

4. 🔐 Configurações de segurança:
   - API Key com permissões adequadas
   - Webhook secret para validação
   - Rate limiting nos endpoints
   - Logs de auditoria

📖 Para mais detalhes, consulte a documentação completa.
    `);
  }
};

export default n8nService;