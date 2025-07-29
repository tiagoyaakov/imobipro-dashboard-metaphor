import { ReportType } from '@prisma/client';

// ===================================================================
// TIPOS E INTERFACES
// ===================================================================

export interface TemplateVariables {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage' | 'array' | 'object';
  description: string;
  required: boolean;
  example?: any;
  format?: string;
}

export interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface PDFContent {
  html: string;
  options: {
    format: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margin: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
  };
}

// ===================================================================
// TEMPLATE ENGINE SERVICE
// ===================================================================

export class TemplateEngineService {

  // ===================================================================
  // RENDERIZAÇÃO DE TEMPLATES
  // ===================================================================

  /**
   * Renderizar template com variáveis
   */
  static async renderTemplate(template: string, variables: TemplateVariables): Promise<string> {
    let rendered = template;

    try {
      // 1. Substituição de variáveis simples {{variable}}
      rendered = this.replaceSimpleVariables(rendered, variables);

      // 2. Substituição de variáveis com formatação {{formatCurrency(value)}}
      rendered = this.replaceFormattedVariables(rendered, variables);

      // 3. Processamento de loops {{#each items}}...{{/each}}
      rendered = this.processLoops(rendered, variables);

      // 4. Processamento de condicionais {{#if condition}}...{{/if}}
      rendered = this.processConditionals(rendered, variables);

      // 5. Formatação específica por tipo
      rendered = this.applySpecificFormatting(rendered, variables);

      return rendered;

    } catch (error) {
      console.error('Erro ao renderizar template:', error);
      throw new Error(`Erro na renderização do template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Validar template
   */
  static async validateTemplate(template: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Verificar sintaxe de variáveis
      const variableMatches = template.match(/\{\{[^}]+\}\}/g) || [];
      
      for (const match of variableMatches) {
        const variable = match.slice(2, -2).trim();
        
        // Verificar se é uma variável válida
        if (!this.isValidVariableSyntax(variable)) {
          errors.push(`Sintaxe inválida na variável: ${match}`);
        }
      }

      // 2. Verificar loops balanceados
      const loopOpenCount = (template.match(/\{\{#each/g) || []).length;
      const loopCloseCount = (template.match(/\{\{\/each\}\}/g) || []).length;
      
      if (loopOpenCount !== loopCloseCount) {
        errors.push('Tags de loop {{#each}} não estão balanceadas');
      }

      // 3. Verificar condicionais balanceadas
      const ifOpenCount = (template.match(/\{\{#if/g) || []).length;
      const ifCloseCount = (template.match(/\{\{\/if\}\}/g) || []).length;
      
      if (ifOpenCount !== ifCloseCount) {
        errors.push('Tags condicionais {{#if}} não estão balanceadas');
      }

      // 4. Verificar funções de formatação
      const formatMatches = template.match(/\{\{format\w+\([^)]+\)\}\}/g) || [];
      
      for (const match of formatMatches) {
        if (!this.isValidFormatFunction(match)) {
          warnings.push(`Função de formatação pode estar incorreta: ${match}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Erro durante validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
        warnings
      };
    }
  }

  /**
   * Obter variáveis disponíveis por tipo de relatório
   */
  static async getAvailableVariables(reportType: ReportType): Promise<VariableDefinition[]> {
    const baseVariables: VariableDefinition[] = [
      {
        name: 'companyName',
        type: 'string',
        description: 'Nome da empresa/imobiliária',
        required: true,
        example: 'ImobiPRO Corretores'
      },
      {
        name: 'periodStart',
        type: 'date',
        description: 'Data de início do período',
        required: true,
        format: 'DD/MM/YYYY',
        example: '01/01/2025'
      },
      {
        name: 'periodEnd',
        type: 'date',
        description: 'Data de fim do período',
        required: true,
        format: 'DD/MM/YYYY',
        example: '07/01/2025'
      },
      {
        name: 'generatedAt',
        type: 'date',
        description: 'Data e hora de geração do relatório',
        required: true,
        format: 'DD/MM/YYYY HH:mm',
        example: '08/01/2025 09:30'
      }
    ];

    switch (reportType) {
      case 'WEEKLY_SALES':
        return [
          ...baseVariables,
          {
            name: 'totalSales',
            type: 'currency',
            description: 'Valor total de vendas',
            required: true,
            example: 850000
          },
          {
            name: 'salesCount',
            type: 'number',
            description: 'Quantidade de vendas',
            required: true,
            example: 12
          },
          {
            name: 'averageValue',
            type: 'currency',
            description: 'Valor médio por venda',
            required: true,
            example: 70833
          },
          {
            name: 'topAgent',
            type: 'object',
            description: 'Melhor vendedor do período',
            required: true,
            example: { name: 'João Silva', salesCount: 3 }
          },
          {
            name: 'growthRate',
            type: 'percentage',
            description: 'Taxa de crescimento vs período anterior',
            required: true,
            example: 15.3
          },
          {
            name: 'dailyBreakdown',
            type: 'array',
            description: 'Breakdown diário de vendas',
            required: false,
            example: [{ date: '01/01', sales: 150000, count: 2 }]
          }
        ];

      case 'LEAD_CONVERSION':
        return [
          ...baseVariables,
          {
            name: 'totalLeads',
            type: 'number',
            description: 'Total de leads no período',
            required: true,
            example: 45
          },
          {
            name: 'newLeads',
            type: 'number',
            description: 'Novos leads no período',
            required: true,
            example: 12
          },
          {
            name: 'convertedLeads',
            type: 'number',
            description: 'Leads convertidos',
            required: true,
            example: 8
          },
          {
            name: 'conversionRate',
            type: 'percentage',
            description: 'Taxa de conversão',
            required: true,
            example: 17.8
          },
          {
            name: 'leadSources',
            type: 'array',
            description: 'Breakdown por fonte de lead',
            required: false,
            example: [{ source: 'Site', count: 15, percentage: 33.3 }]
          }
        ];

      case 'APPOINTMENT_SUMMARY':
        return [
          ...baseVariables,
          {
            name: 'totalAppointments',
            type: 'number',
            description: 'Total de agendamentos',
            required: true,
            example: 28
          },
          {
            name: 'completedAppointments',
            type: 'number',
            description: 'Agendamentos realizados',
            required: true,
            example: 24
          },
          {
            name: 'canceledAppointments',
            type: 'number',
            description: 'Agendamentos cancelados',
            required: true,
            example: 4
          },
          {
            name: 'completionRate',
            type: 'percentage',
            description: 'Taxa de conclusão',
            required: true,
            example: 85.7
          },
          {
            name: 'averageDuration',
            type: 'number',
            description: 'Duração média em minutos',
            required: true,
            example: 65
          }
        ];

      case 'AGENT_PERFORMANCE':
        return [
          ...baseVariables,
          {
            name: 'agents',
            type: 'array',
            description: 'Lista de agentes com métricas',
            required: true,
            example: [{ name: 'João Silva', leads: 15, sales: 3 }]
          },
          {
            name: 'topPerformer',
            type: 'object',
            description: 'Melhor agente do período',
            required: true,
            example: { name: 'João Silva', metric: 'vendas', value: 3 }
          }
        ];

      default:
        return baseVariables;
    }
  }

  // ===================================================================
  // RENDERIZAÇÃO POR FORMATO
  // ===================================================================

  /**
   * Renderizar para WhatsApp
   */
  static async renderForWhatsApp(data: any): Promise<string> {
    // Template básico para WhatsApp (texto simples com emojis)
    let message = `📊 *RELATÓRIO SEMANAL - ${data.companyName || 'ImobiPRO'}*\n\n`;
    
    if (data.totalSales) {
      message += `💰 *Vendas da Semana:*\n`;
      message += `• Total: ${this.formatCurrency(data.totalSales)}\n`;
      message += `• Quantidade: ${data.salesCount} vendas\n`;
      message += `• Ticket médio: ${this.formatCurrency(data.averageValue)}\n`;
      
      if (data.growthRate !== undefined) {
        const growthEmoji = data.growthRate >= 0 ? '📈' : '📉';
        message += `• Crescimento: ${growthEmoji} ${data.growthRate.toFixed(1)}%\n`;
      }
      message += `\n`;
    }

    if (data.totalLeads) {
      message += `🎯 *Leads da Semana:*\n`;
      message += `• Total: ${data.totalLeads} leads\n`;
      message += `• Novos: ${data.newLeads} leads\n`;
      message += `• Convertidos: ${data.convertedLeads} leads\n`;
      message += `• Taxa de conversão: ${data.conversionRate?.toFixed(1)}%\n\n`;
    }

    if (data.totalAppointments) {
      message += `📅 *Agendamentos da Semana:*\n`;
      message += `• Total: ${data.totalAppointments} agendamentos\n`;
      message += `• Realizados: ${data.completedAppointments} agendamentos\n`;
      message += `• Taxa de conclusão: ${data.completionRate?.toFixed(1)}%\n\n`;
    }

    if (data.topAgent?.name) {
      message += `🏆 *Destaque da Semana:*\n`;
      message += `• ${data.topAgent.name}\n`;
      if (data.topAgent.salesCount) {
        message += `• ${data.topAgent.salesCount} vendas realizadas\n`;
      }
      message += `\n`;
    }

    message += `📅 *Período:* ${data.periodStart} - ${data.periodEnd}\n`;
    message += `🕐 *Gerado em:* ${data.generatedAt}\n\n`;
    message += `✨ _Relatório gerado automaticamente pelo ImobiPRO_`;

    return message;
  }

  /**
   * Renderizar para Email
   */
  static async renderForEmail(data: any): Promise<EmailContent> {
    const subject = `📊 Relatório Semanal - ${data.companyName || 'ImobiPRO'} - ${data.periodStart} a ${data.periodEnd}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .metric-card { background: #F8F9FA; border-left: 4px solid #3B82F6; padding: 15px; margin: 10px 0; }
          .metric-title { font-weight: bold; color: #1F2937; }
          .metric-value { font-size: 24px; font-weight: bold; color: #3B82F6; }
          .footer { background: #F3F4F6; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Relatório Semanal</h1>
          <p>${data.companyName || 'ImobiPRO'}</p>
          <p>${data.periodStart} - ${data.periodEnd}</p>
        </div>
        
        <div class="content">
          ${data.totalSales ? `
            <div class="metric-card">
              <div class="metric-title">💰 Vendas da Semana</div>
              <div class="metric-value">${this.formatCurrency(data.totalSales)}</div>
              <p>Quantidade: ${data.salesCount} vendas | Ticket médio: ${this.formatCurrency(data.averageValue)}</p>
              ${data.growthRate !== undefined ? `<p>Crescimento: ${data.growthRate >= 0 ? '📈' : '📉'} ${data.growthRate.toFixed(1)}%</p>` : ''}
            </div>
          ` : ''}
          
          ${data.totalLeads ? `
            <div class="metric-card">
              <div class="metric-title">🎯 Leads da Semana</div>
              <div class="metric-value">${data.totalLeads}</div>
              <p>Novos: ${data.newLeads} | Convertidos: ${data.convertedLeads} | Taxa: ${data.conversionRate?.toFixed(1)}%</p>
            </div>
          ` : ''}
          
          ${data.totalAppointments ? `
            <div class="metric-card">
              <div class="metric-title">📅 Agendamentos da Semana</div>
              <div class="metric-value">${data.totalAppointments}</div>
              <p>Realizados: ${data.completedAppointments} | Taxa de conclusão: ${data.completionRate?.toFixed(1)}%</p>
            </div>
          ` : ''}
          
          ${data.topAgent?.name ? `
            <div class="metric-card">
              <div class="metric-title">🏆 Destaque da Semana</div>
              <div class="metric-value">${data.topAgent.name}</div>
              ${data.topAgent.salesCount ? `<p>${data.topAgent.salesCount} vendas realizadas</p>` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Relatório gerado automaticamente pelo ImobiPRO em ${data.generatedAt}</p>
        </div>
      </body>
      </html>
    `;

    const textBody = await this.renderForWhatsApp(data); // Reutilizar versão texto

    return {
      subject,
      htmlBody,
      textBody
    };
  }

  /**
   * Renderizar para PDF
   */
  static async renderForPDF(data: any): Promise<PDFContent> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Semanal - ${data.companyName}</title>
        <style>
          body { font-family: 'Helvetica', Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; color: #1F2937; margin-bottom: 10px; }
          .report-title { font-size: 20px; color: #6B7280; }
          .period { font-size: 16px; color: #9CA3AF; margin-top: 10px; }
          
          .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .metric-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; }
          .metric-icon { font-size: 24px; margin-bottom: 10px; }
          .metric-title { font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { font-size: 32px; font-weight: bold; color: #1F2937; margin: 5px 0; }
          .metric-subtitle { font-size: 12px; color: #9CA3AF; }
          
          .chart-section { margin: 30px 0; }
          .chart-title { font-size: 18px; font-weight: bold; color: #1F2937; margin-bottom: 15px; }
          
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          
          @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${data.companyName || 'ImobiPRO'}</div>
          <div class="report-title">📊 Relatório Semanal de Performance</div>
          <div class="period">${data.periodStart} - ${data.periodEnd}</div>
        </div>
        
        <div class="metrics-grid">
          ${data.totalSales ? `
            <div class="metric-card">
              <div class="metric-icon">💰</div>
              <div class="metric-title">Vendas da Semana</div>
              <div class="metric-value">${this.formatCurrency(data.totalSales)}</div>
              <div class="metric-subtitle">${data.salesCount} vendas • Ticket médio: ${this.formatCurrency(data.averageValue)}</div>
              ${data.growthRate !== undefined ? `<div class="metric-subtitle">Crescimento: ${data.growthRate >= 0 ? '📈' : '📉'} ${data.growthRate.toFixed(1)}%</div>` : ''}
            </div>
          ` : ''}
          
          ${data.totalLeads ? `
            <div class="metric-card">
              <div class="metric-icon">🎯</div>
              <div class="metric-title">Leads da Semana</div>
              <div class="metric-value">${data.totalLeads}</div>
              <div class="metric-subtitle">Novos: ${data.newLeads} • Convertidos: ${data.convertedLeads}</div>
              <div class="metric-subtitle">Taxa de conversão: ${data.conversionRate?.toFixed(1)}%</div>
            </div>
          ` : ''}
          
          ${data.totalAppointments ? `
            <div class="metric-card">
              <div class="metric-icon">📅</div>
              <div class="metric-title">Agendamentos</div>
              <div class="metric-value">${data.totalAppointments}</div>
              <div class="metric-subtitle">Realizados: ${data.completedAppointments}</div>
              <div class="metric-subtitle">Taxa de conclusão: ${data.completionRate?.toFixed(1)}%</div>
            </div>
          ` : ''}
          
          ${data.topAgent?.name ? `
            <div class="metric-card">
              <div class="metric-icon">🏆</div>
              <div class="metric-title">Destaque da Semana</div>
              <div class="metric-value">${data.topAgent.name}</div>
              ${data.topAgent.salesCount ? `<div class="metric-subtitle">${data.topAgent.salesCount} vendas realizadas</div>` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Relatório gerado automaticamente pelo ImobiPRO em ${data.generatedAt}</p>
          <p>Este relatório contém informações confidenciais da ${data.companyName}</p>
        </div>
      </body>
      </html>
    `;

    return {
      html,
      options: {
        format: 'A4',
        orientation: 'portrait',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      }
    };
  }

  // ===================================================================
  // UTILITÁRIOS PRIVADOS
  // ===================================================================

  private static replaceSimpleVariables(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] !== undefined ? String(variables[variable]) : match;
    });
  }

  private static replaceFormattedVariables(template: string, variables: TemplateVariables): string {
    // Currency formatting: {{formatCurrency(value)}}
    template = template.replace(/\{\{formatCurrency\((\w+)\)\}\}/g, (match, variable) => {
      const value = variables[variable];
      return value !== undefined ? this.formatCurrency(value) : match;
    });

    // Percentage formatting: {{formatPercentage(value)}}
    template = template.replace(/\{\{formatPercentage\((\w+)\)\}\}/g, (match, variable) => {
      const value = variables[variable];
      return value !== undefined ? `${value.toFixed(1)}%` : match;
    });

    // Date formatting: {{formatDate(value)}}
    template = template.replace(/\{\{formatDate\((\w+)\)\}\}/g, (match, variable) => {
      const value = variables[variable];
      if (value instanceof Date) {
        return value.toLocaleDateString('pt-BR');
      }
      return match;
    });

    return template;
  }

  private static processLoops(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, loopContent) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) {
        return '';
      }

      return array.map(item => {
        let itemContent = loopContent;
        // Replace {{this.property}} or {{property}} within loop
        itemContent = itemContent.replace(/\{\{(?:this\.)?(\w+)\}\}/g, (itemMatch, prop) => {
          return item[prop] !== undefined ? String(item[prop]) : itemMatch;
        });
        return itemContent;
      }).join('');
    });
  }

  private static processConditionals(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = variables[condition];
      return (value && value !== 0 && value !== '') ? content : '';
    });
  }

  private static applySpecificFormatting(template: string, variables: TemplateVariables): string {
    // Remove extra whitespace and normalize line breaks
    return template
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
      .trim();
  }

  private static isValidVariableSyntax(variable: string): boolean {
    // Basic validation - could be expanded
    return /^[\w.()#\/]+$/.test(variable);
  }

  private static isValidFormatFunction(match: string): boolean {
    // Check if format function is recognized
    const validFunctions = ['formatCurrency', 'formatPercentage', 'formatDate'];
    return validFunctions.some(func => match.includes(func));
  }

  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}