import { ReportTemplate, ScheduledReport, ReportHistory, ReportType, ReportFormat, ReportStatus } from '@prisma/client';
import { supabase } from '../integrations/supabase/client';

// ===================================================================
// TIPOS E INTERFACES
// ===================================================================

export interface CreateTemplateInput {
  name: string;
  description?: string;
  type: ReportType;
  template: string;
  variables?: Record<string, any>;
  companyId: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  template?: string;
  variables?: Record<string, any>;
  isActive?: boolean;
}

export interface TemplateFilters {
  companyId?: string;
  type?: ReportType;
  isActive?: boolean;
  createdBy?: string;
}

export interface ScheduleReportInput {
  name: string;
  description?: string;
  templateId: string;
  schedule: string; // cron expression
  recipients: string[];
  format: ReportFormat;
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  companyId: string;
}

export interface ReportParams {
  dateRange?: {
    start: Date;
    end: Date;
  };
  agentId?: string;
  filters?: Record<string, any>;
}

export interface GeneratedReport {
  content: string;
  metadata: {
    generatedAt: Date;
    dataPoints: number;
    executionTime: number;
  };
}

export interface SalesMetrics {
  totalSales: number;
  salesCount: number;
  averageValue: number;
  topAgent: {
    id: string;
    name: string;
    sales: number;
  };
  monthlyGrowth: number;
}

export interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
}

export interface AppointmentMetrics {
  totalAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  completionRate: number;
  averageDuration: number;
}

// ===================================================================
// SERVIÇO PRINCIPAL DE RELATÓRIOS
// ===================================================================

export class ReportsService {
  
  // ===================================================================
  // GERENCIAMENTO DE TEMPLATES
  // ===================================================================

  /**
   * Criar novo template de relatório
   */
  static async createTemplate(input: CreateTemplateInput, userId: string): Promise<ReportTemplate> {
    const { data, error } = await supabase
      .from('ReportTemplate')
      .insert({
        ...input,
        createdBy: userId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar template: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualizar template existente
   */
  static async updateTemplate(id: string, input: UpdateTemplateInput): Promise<ReportTemplate> {
    const { data, error } = await supabase
      .from('ReportTemplate')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar template: ${error.message}`);
    }

    return data;
  }

  /**
   * Buscar templates com filtros
   */
  static async getTemplates(filters: TemplateFilters = {}): Promise<ReportTemplate[]> {
    let query = supabase
      .from('ReportTemplate')
      .select('*, creator:User(name), company:Company(name)');

    if (filters.companyId) {
      query = query.eq('companyId', filters.companyId);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.isActive !== undefined) {
      query = query.eq('isActive', filters.isActive);
    }
    
    if (filters.createdBy) {
      query = query.eq('createdBy', filters.createdBy);
    }

    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Buscar template por ID
   */
  static async getTemplateById(id: string): Promise<ReportTemplate | null> {
    const { data, error } = await supabase
      .from('ReportTemplate')
      .select('*, creator:User(name), company:Company(name)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Erro ao buscar template: ${error.message}`);
    }

    return data;
  }

  /**
   * Deletar template
   */
  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('ReportTemplate')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar template: ${error.message}`);
    }
  }

  // ===================================================================
  // AGENDAMENTO DE RELATÓRIOS
  // ===================================================================

  /**
   * Agendar relatório
   */
  static async scheduleReport(input: ScheduleReportInput, userId: string): Promise<ScheduledReport> {
    // Calcular próxima execução baseada no cron
    const nextSendAt = this.calculateNextExecution(input.schedule);

    const { data, error } = await supabase
      .from('ScheduledReport')
      .insert({
        ...input,
        createdBy: userId,
        nextSendAt
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao agendar relatório: ${error.message}`);
    }

    return data;
  }

  /**
   * Buscar relatórios agendados
   */
  static async getScheduledReports(companyId?: string): Promise<ScheduledReport[]> {
    let query = supabase
      .from('ScheduledReport')
      .select(`
        *, 
        template:ReportTemplate(name, type),
        creator:User(name)
      `);

    if (companyId) {
      query = query.eq('companyId', companyId);
    }

    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar relatórios agendados: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Executar relatório agendado
   */
  static async executeScheduledReport(scheduleId: string): Promise<void> {
    const schedule = await this.getScheduledReportById(scheduleId);
    if (!schedule) {
      throw new Error('Relatório agendado não encontrado');
    }

    const template = await this.getTemplateById(schedule.templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    try {
      // Marcar como processando
      await this.createReportHistory({
        scheduledReportId: scheduleId,
        content: '',
        recipients: schedule.recipients,
        format: schedule.format,
        status: 'PROCESSING'
      });

      // Gerar relatório
      const report = await this.generateReport(schedule.templateId, {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
          end: new Date()
        }
      });

      // Atualizar histórico com sucesso
      await this.updateReportHistory(scheduleId, {
        content: report.content,
        status: 'SENT',
        sentAt: new Date(),
        executionTime: report.metadata.executionTime
      });

      // Atualizar próxima execução
      const nextSendAt = this.calculateNextExecution(schedule.schedule);
      await supabase
        .from('ScheduledReport')
        .update({ 
          lastSentAt: new Date(),
          nextSendAt 
        })
        .eq('id', scheduleId);

    } catch (error) {
      // Marcar como falha
      await this.updateReportHistory(scheduleId, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  // ===================================================================
  // GERAÇÃO DE RELATÓRIOS
  // ===================================================================

  /**
   * Gerar relatório baseado em template
   */
  static async generateReport(templateId: string, params: ReportParams): Promise<GeneratedReport> {
    const startTime = Date.now();

    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Buscar dados baseado no tipo de relatório
    let data: any = {};
    let dataPoints = 0;

    switch (template.type) {
      case 'WEEKLY_SALES':
        data = await this.getSalesMetrics(params);
        dataPoints = data.salesCount || 0;
        break;
      
      case 'LEAD_CONVERSION':
        data = await this.getLeadMetrics(params);
        dataPoints = data.totalLeads || 0;
        break;
      
      case 'APPOINTMENT_SUMMARY':
        data = await this.getAppointmentMetrics(params);
        dataPoints = data.totalAppointments || 0;
        break;
      
      case 'AGENT_PERFORMANCE':
        data = await this.getAgentPerformanceMetrics(params);
        dataPoints = data.agents?.length || 0;
        break;
      
      default:
        throw new Error(`Tipo de relatório não suportado: ${template.type}`);
    }

    // Renderizar template com dados
    const content = await this.renderTemplate(template.template, data);

    const executionTime = Date.now() - startTime;

    return {
      content,
      metadata: {
        generatedAt: new Date(),
        dataPoints,
        executionTime
      }
    };
  }

  // ===================================================================
  // MÉTRICAS E DADOS
  // ===================================================================

  /**
   * Buscar métricas de vendas
   */
  static async getSalesMetrics(params: ReportParams): Promise<SalesMetrics> {
    // Implementar busca real de dados de vendas
    // Por enquanto, dados mock para desenvolvimento
    return {
      totalSales: 850000,
      salesCount: 12,
      averageValue: 70833,
      topAgent: {
        id: '1',
        name: 'João Silva',
        sales: 3
      },
      monthlyGrowth: 15.3
    };
  }

  /**
   * Buscar métricas de leads
   */
  static async getLeadMetrics(params: ReportParams): Promise<LeadMetrics> {
    // Implementar busca real de dados de leads
    return {
      totalLeads: 45,
      newLeads: 12,
      convertedLeads: 8,
      conversionRate: 17.8,
      leadSources: [
        { source: 'Site', count: 15, percentage: 33.3 },
        { source: 'WhatsApp', count: 12, percentage: 26.7 },
        { source: 'Indicação', count: 10, percentage: 22.2 },
        { source: 'Facebook', count: 8, percentage: 17.8 }
      ]
    };
  }

  /**
   * Buscar métricas de agendamentos
   */
  static async getAppointmentMetrics(params: ReportParams): Promise<AppointmentMetrics> {
    return {
      totalAppointments: 28,
      completedAppointments: 24,
      canceledAppointments: 4,
      completionRate: 85.7,
      averageDuration: 65 // minutos
    };
  }

  /**
   * Buscar métricas de performance de agentes
   */
  static async getAgentPerformanceMetrics(params: ReportParams): Promise<any> {
    return {
      agents: [
        { id: '1', name: 'João Silva', leads: 15, appointments: 12, sales: 3 },
        { id: '2', name: 'Maria Santos', leads: 12, appointments: 10, sales: 2 },
        { id: '3', name: 'Pedro Costa', leads: 18, appointments: 6, sales: 1 }
      ]
    };
  }

  // ===================================================================
  // TEMPLATE ENGINE
  // ===================================================================

  /**
   * Renderizar template com dados
   */
  static async renderTemplate(template: string, data: any): Promise<string> {
    let rendered = template;

    // Substituição simples de variáveis {{variable}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] !== undefined ? data[variable] : match;
    });

    // Formatação específica para WhatsApp
    if (template.includes('{{formatCurrency}}')) {
      rendered = rendered.replace(/\{\{formatCurrency\(([^)]+)\)\}\}/g, (match, value) => {
        const numValue = data[value] || 0;
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(numValue);
      });
    }

    return rendered;
  }

  // ===================================================================
  // HISTÓRICO DE RELATÓRIOS
  // ===================================================================

  /**
   * Criar entrada no histórico
   */
  static async createReportHistory(input: {
    scheduledReportId: string;
    content: string;
    recipients: string[];
    format: ReportFormat;
    status: ReportStatus;
    error?: string;
  }): Promise<ReportHistory> {
    const { data, error } = await supabase
      .from('ReportHistory')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar histórico: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualizar histórico
   */
  static async updateReportHistory(scheduleId: string, updates: Partial<ReportHistory>): Promise<void> {
    const { error } = await supabase
      .from('ReportHistory')
      .update(updates)
      .eq('scheduledReportId', scheduleId)
      .order('createdAt', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Erro ao atualizar histórico: ${error.message}`);
    }
  }

  // ===================================================================
  // UTILITÁRIOS
  // ===================================================================

  /**
   * Calcular próxima execução baseada em cron expression
   */
  static calculateNextExecution(cronExpression: string): Date {
    // Implementação simples para relatórios semanais
    // Em produção, usar biblioteca como 'node-cron' ou 'cron-parser'
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return nextWeek;
  }

  /**
   * Buscar relatório agendado por ID
   */
  private static async getScheduledReportById(id: string): Promise<ScheduledReport | null> {
    const { data, error } = await supabase
      .from('ScheduledReport')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar relatório agendado: ${error.message}`);
    }

    return data;
  }
}