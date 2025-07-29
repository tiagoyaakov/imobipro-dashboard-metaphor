import { WhatsAppService } from './whatsappService';
import { TemplateEngineService } from './templateEngineService';

// ===================================================================
// TIPOS E INTERFACES
// ===================================================================

export interface WhatsAppReportMessage {
  recipient: string; // Número do destinatário
  content: string;   // Conteúdo formatado para WhatsApp
  mediaUrl?: string; // URL de mídia (PDF, imagem) se houver
  mediaType?: 'image' | 'document' | 'video';
}

export interface BulkReportData {
  instanceId: string;
  messages: WhatsAppReportMessage[];
  scheduleId?: string;
  reportType: string;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{
    recipient: string;
    error: string;
  }>;
}

export interface MediaMessage {
  type: 'document' | 'image';
  url: string;
  filename?: string;
  caption?: string;
}

// ===================================================================
// WHATSAPP REPORT SERVICE
// ===================================================================

export class WhatsAppReportService extends WhatsAppService {

  // ===================================================================
  // ENVIO DE RELATÓRIOS
  // ===================================================================

  /**
   * Enviar relatório para um destinatário específico
   */
  static async sendReport(
    instanceId: string,
    recipient: string, 
    report: { content: string; mediaUrl?: string; mediaType?: string }
  ): Promise<void> {
    try {
      // Verificar instância ativa
      const instance = await this.getInstanceById(instanceId);
      if (!instance || instance.status !== 'CONNECTED') {
        throw new Error('Instância WhatsApp não está conectada');
      }

      // Enviar mensagem de texto
      if (report.content) {
        await this.sendMessage(instanceId, {
          to: recipient,
          type: 'text',
          content: report.content
        });
      }

      // Enviar mídia se houver
      if (report.mediaUrl && report.mediaType) {
        const mediaMessage = this.createWhatsAppMediaMessage(
          report.mediaUrl, 
          report.mediaType as any
        );
        
        await this.sendMessage(instanceId, {
          to: recipient,
          type: report.mediaType as any,
          ...mediaMessage
        });
      }

      // Log da operação
      await this.logMessageSent(instanceId, recipient, 'report', {
        hasMedia: !!report.mediaUrl,
        mediaType: report.mediaType
      });

    } catch (error) {
      console.error('Erro ao enviar relatório via WhatsApp:', error);
      throw new Error(`Falha no envio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Enviar relatórios em lote
   */
  static async sendBulkReports(reports: BulkReportData[]): Promise<BulkSendResult[]> {
    const results: BulkSendResult[] = [];

    for (const reportBatch of reports) {
      const batchResult: BulkSendResult = {
        total: reportBatch.messages.length,
        sent: 0,
        failed: 0,
        errors: []
      };

      for (const message of reportBatch.messages) {
        try {
          await this.sendReport(reportBatch.instanceId, message.recipient, {
            content: message.content,
            mediaUrl: message.mediaUrl,
            mediaType: message.mediaType
          });

          batchResult.sent++;

          // Delay entre mensagens para evitar rate limiting
          await this.delay(1000);

        } catch (error) {
          batchResult.failed++;
          batchResult.errors.push({
            recipient: message.recipient,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      results.push(batchResult);
    }

    return results;
  }

  // ===================================================================
  // FORMATAÇÃO ESPECÍFICA PARA WHATSAPP
  // ===================================================================

  /**
   * Formatar dados de relatório para WhatsApp
   */
  static async formatReportForWhatsApp(data: any): Promise<WhatsAppReportMessage> {
    // Usar o TemplateEngineService para renderizar para WhatsApp
    const content = await TemplateEngineService.renderForWhatsApp(data);

    return {
      recipient: '', // Será preenchido pelo caller
      content,
      // Adicionar mídia se necessário
      mediaUrl: data.pdfUrl,
      mediaType: data.pdfUrl ? 'document' : undefined
    };
  }

  /**
   * Criar mensagem de mídia para WhatsApp
   */
  static createWhatsAppMediaMessage(
    mediaUrl: string, 
    mediaType: 'image' | 'document' | 'video',
    filename?: string,
    caption?: string
  ): MediaMessage {
    return {
      type: mediaType,
      url: mediaUrl,
      filename: filename || this.generateFilename(mediaType),
      caption
    };
  }

  // ===================================================================
  // TEMPLATES ESPECÍFICOS PARA WHATSAPP
  // ===================================================================

  /**
   * Template para relatório semanal de vendas
   */
  static formatWeeklySalesReport(data: any): string {
    let message = `📊 *RELATÓRIO SEMANAL DE VENDAS*\n`;
    message += `${data.companyName || 'ImobiPRO'}\n\n`;
    
    message += `💰 *VENDAS DA SEMANA*\n`;
    message += `• Total: ${this.formatCurrency(data.totalSales || 0)}\n`;
    message += `• Quantidade: ${data.salesCount || 0} vendas\n`;
    message += `• Ticket médio: ${this.formatCurrency(data.averageValue || 0)}\n`;
    
    if (data.growthRate !== undefined) {
      const growthEmoji = data.growthRate >= 0 ? '📈' : '📉';
      message += `• Crescimento: ${growthEmoji} ${data.growthRate.toFixed(1)}%\n`;
    }
    
    message += `\n`;
    
    if (data.topAgent?.name) {
      message += `🏆 *DESTAQUE DA SEMANA*\n`;
      message += `• ${data.topAgent.name}\n`;
      if (data.topAgent.salesCount) {
        message += `• ${data.topAgent.salesCount} vendas realizadas\n`;
      }
      message += `\n`;
    }
    
    message += `📅 *Período:* ${data.periodStart} - ${data.periodEnd}\n`;
    message += `🕐 *Gerado em:* ${data.generatedAt}\n\n`;
    message += `✨ _Relatório automático do ImobiPRO_`;
    
    return message;
  }

  /**
   * Template para relatório de leads
   */
  static formatLeadConversionReport(data: any): string {
    let message = `🎯 *RELATÓRIO DE LEADS*\n`;
    message += `${data.companyName || 'ImobiPRO'}\n\n`;
    
    message += `📈 *CONVERSÃO DE LEADS*\n`;
    message += `• Total: ${data.totalLeads || 0} leads\n`;
    message += `• Novos: ${data.newLeads || 0} leads\n`;
    message += `• Convertidos: ${data.convertedLeads || 0} leads\n`;
    message += `• Taxa de conversão: ${data.conversionRate?.toFixed(1) || 0}%\n\n`;
    
    if (data.leadSources?.length) {
      message += `🌐 *PRINCIPAIS FONTES*\n`;
      data.leadSources.slice(0, 3).forEach((source: any) => {
        message += `• ${source.source}: ${source.count} (${source.percentage.toFixed(1)}%)\n`;
      });
      message += `\n`;
    }
    
    message += `📅 *Período:* ${data.periodStart} - ${data.periodEnd}\n`;
    message += `🕐 *Gerado em:* ${data.generatedAt}\n\n`;
    message += `✨ _Relatório automático do ImobiPRO_`;
    
    return message;
  }

  /**
   * Template para relatório de agendamentos
   */
  static formatAppointmentSummaryReport(data: any): string {
    let message = `📅 *RELATÓRIO DE AGENDAMENTOS*\n`;
    message += `${data.companyName || 'ImobiPRO'}\n\n`;
    
    message += `📞 *AGENDAMENTOS DA SEMANA*\n`;
    message += `• Total: ${data.totalAppointments || 0} agendamentos\n`;
    message += `• Realizados: ${data.completedAppointments || 0} agendamentos\n`;
    message += `• Cancelados: ${data.canceledAppointments || 0} agendamentos\n`;
    message += `• Taxa de conclusão: ${data.completionRate?.toFixed(1) || 0}%\n`;
    
    if (data.averageDuration) {
      message += `• Duração média: ${data.averageDuration} minutos\n`;
    }
    
    message += `\n`;
    
    message += `📅 *Período:* ${data.periodStart} - ${data.periodEnd}\n`;
    message += `🕐 *Gerado em:* ${data.generatedAt}\n\n`;
    message += `✨ _Relatório automático do ImobiPRO_`;
    
    return message;
  }

  // ===================================================================
  // INTEGRAÇÃO COM SISTEMA EXISTENTE
  // ===================================================================

  /**
   * Enviar relatório usando instância padrão do agente
   */
  static async sendReportToAgent(
    agentId: string, 
    recipient: string, 
    reportData: any
  ): Promise<void> {
    try {
      // Buscar instância ativa do agente
      const instance = await this.getAgentActiveInstance(agentId);
      if (!instance) {
        throw new Error('Agente não possui instância WhatsApp ativa');
      }

      // Formatar relatório
      const formattedReport = await this.formatReportForWhatsApp(reportData);

      // Enviar
      await this.sendReport(instance.id, recipient, {
        content: formattedReport.content,
        mediaUrl: formattedReport.mediaUrl,
        mediaType: formattedReport.mediaType
      });

    } catch (error) {
      console.error(`Erro ao enviar relatório para agente ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Configurar envio automático semanal
   */
  static async setupWeeklyReports(config: {
    agentId: string;
    recipients: string[];
    reportTypes: string[];
    dayOfWeek: number; // 0 = domingo, 1 = segunda...
    hour: number;
  }): Promise<void> {
    // Esta função seria integrada com um sistema de cron jobs
    // Por exemplo, usando node-cron ou integrando com n8n
    
    console.log('Configurando relatórios semanais:', config);
    
    // Em produção, registrar no sistema de agendamento
    // await this.registerWeeklySchedule(config);
  }

  // ===================================================================
  // UTILITÁRIOS PRIVADOS
  // ===================================================================

  private static async getAgentActiveInstance(agentId: string) {
    // Buscar instância ativa do agente no banco
    // Implementação seria similar ao WhatsAppService existente
    const instances = await this.getInstancesByAgent(agentId);
    return instances.find(instance => instance.status === 'CONNECTED');
  }

  private static async logMessageSent(
    instanceId: string, 
    recipient: string, 
    type: string, 
    metadata: any
  ): Promise<void> {
    // Log da mensagem enviada
    console.log('Relatório enviado:', {
      instanceId,
      recipient,
      type,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static generateFilename(mediaType: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extensions = {
      document: 'pdf',
      image: 'png',
      video: 'mp4'
    };
    
    return `relatorio_${timestamp}.${extensions[mediaType as keyof typeof extensions] || 'pdf'}`;
  }

  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // ===================================================================
  // WEBHOOK HANDLERS
  // ===================================================================

  /**
   * Handler para webhook de status de mensagem
   */
  static async handleMessageStatusWebhook(payload: {
    messageId: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
  }): Promise<void> {
    try {
      // Atualizar status da mensagem no banco
      console.log('Status atualizado:', payload);
      
      // Em produção, atualizar ReportHistory
      // await this.updateReportMessageStatus(payload);

    } catch (error) {
      console.error('Erro ao processar webhook de status:', error);
    }
  }

  /**
   * Handler para respostas automáticas em relatórios
   */
  static async handleReportResponseWebhook(payload: {
    from: string;
    message: string;
    instanceId: string;
  }): Promise<void> {
    try {
      // Detectar se é resposta a um relatório
      const isReportResponse = this.detectReportResponse(payload.message);
      
      if (isReportResponse) {
        // Processar resposta (ex: solicitar detalhes, agendar reunião)
        await this.processReportResponse(payload);
      }

    } catch (error) {
      console.error('Erro ao processar resposta de relatório:', error);
    }
  }

  private static detectReportResponse(message: string): boolean {
    const reportKeywords = [
      'relatório', 'detalhes', 'mais informações',
      'reunião', 'apresentação', 'números'
    ];
    
    return reportKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private static async processReportResponse(payload: {
    from: string;
    message: string;
    instanceId: string;
  }): Promise<void> {
    // Implementar lógica de resposta automática
    // Por exemplo, agendar reunião ou enviar detalhes adicionais
    
    const responseMessage = `Obrigado pelo interesse no relatório! 📊\n\n` +
      `Nossa equipe entrará em contato para fornecer mais detalhes.\n\n` +
      `_Mensagem automática do ImobiPRO_`;

    await this.sendMessage(payload.instanceId, {
      to: payload.from,
      type: 'text',
      content: responseMessage
    });
  }
}