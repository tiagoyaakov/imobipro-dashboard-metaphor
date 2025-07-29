import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ===================================================================
// TIPOS E INTERFACES
// ===================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimePeriod {
  period: 'week' | 'month' | 'quarter' | 'year';
  offset?: number; // 0 = current, -1 = previous, etc.
}

export interface WeeklySalesData {
  period: DateRange;
  totalSales: number;
  salesCount: number;
  averageValue: number;
  topAgent: {
    id: string;
    name: string;
    salesCount: number;
    totalValue: number;
  };
  dailyBreakdown: Array<{
    date: string;
    sales: number;
    count: number;
  }>;
  growthRate: number;
}

export interface LeadConversionData {
  period: DateRange;
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  qualificationRate: number;
  sourceBreakdown: Array<{
    source: string;
    count: number;
    conversionRate: number;
    percentage: number;
  }>;
  stageBreakdown: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export interface AppointmentData {
  period: DateRange;
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  averageDuration: number;
  busyHours: Array<{
    hour: number;
    count: number;
  }>;
  agentBreakdown: Array<{
    agentId: string;
    agentName: string;
    appointmentCount: number;
    completionRate: number;
  }>;
}

export interface ConversionRates {
  leadToQualified: number;
  qualifiedToAppointment: number;
  appointmentToSale: number;
  overallConversion: number;
  periodComparison: {
    current: number;
    previous: number;
    change: number;
  };
}

export interface PerformanceData {
  agents: Array<{
    id: string;
    name: string;
    leadsGenerated: number;
    appointmentsScheduled: number;
    salesClosed: number;
    conversionRate: number;
    averageDealValue: number;
    rank: number;
  }>;
  topPerformers: {
    bySales: string;
    byConversion: string;
    byLeads: string;
  };
}

export interface TopMetrics {
  period: TimePeriod;
  topAgent: {
    id: string;
    name: string;
    metric: string;
    value: number;
  };
  topProperty: {
    id: string;
    title: string;
    views: number;
    leads: number;
  };
  topLeadSource: {
    source: string;
    count: number;
    percentage: number;
  };
  bestConversionDay: {
    dayOfWeek: string;
    rate: number;
  };
}

// ===================================================================
// SERVIÇO DE AGREGAÇÃO DE DADOS
// ===================================================================

export class ReportDataService {

  // ===================================================================
  // MÉTRICAS DE VENDAS
  // ===================================================================

  /**
   * Agregar dados de vendas semanais
   */
  static async aggregateWeeklySalesData(agentId?: string): Promise<WeeklySalesData> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // Buscar deals fechados no período
      let query = supabase
        .from('Deal')
        .select(`
          id,
          value,
          status,
          closedAt,
          agentId,
          agent:User(name)
        `)
        .eq('status', 'WON')
        .gte('closedAt', startDate.toISOString())
        .lte('closedAt', endDate.toISOString());

      if (agentId) {
        query = query.eq('agentId', agentId);
      }

      const { data: deals, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar dados de vendas: ${error.message}`);
      }

      // Calcular métricas
      const totalSales = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
      const salesCount = deals?.length || 0;
      const averageValue = salesCount > 0 ? totalSales / salesCount : 0;

      // Encontrar top agent
      const agentSales = deals?.reduce((acc, deal) => {
        const agentId = deal.agentId;
        if (!acc[agentId]) {
          acc[agentId] = {
            id: agentId,
            name: deal.agent?.name || 'Agente',
            salesCount: 0,
            totalValue: 0
          };
        }
        acc[agentId].salesCount++;
        acc[agentId].totalValue += deal.value || 0;
        return acc;
      }, {} as Record<string, any>) || {};

      const topAgent = Object.values(agentSales).sort((a: any, b: any) => 
        b.totalValue - a.totalValue
      )[0] || {
        id: '',
        name: 'Nenhum',
        salesCount: 0,
        totalValue: 0
      };

      // Breakdown diário
      const dailyBreakdown = this.generateDailyBreakdown(deals || [], startDate, endDate);

      // Calcular crescimento (comparar com semana anterior)
      const previousWeekData = await this.getPreviousWeekSales(startDate, agentId);
      const growthRate = previousWeekData.totalSales > 0 
        ? ((totalSales - previousWeekData.totalSales) / previousWeekData.totalSales) * 100
        : 0;

      return {
        period: { start: startDate, end: endDate },
        totalSales,
        salesCount,
        averageValue,
        topAgent,
        dailyBreakdown,
        growthRate
      };

    } catch (error) {
      console.error('Erro ao agregar dados de vendas:', error);
      return this.getEmptyWeeklySalesData(startDate, endDate);
    }
  }

  // ===================================================================
  // MÉTRICAS DE LEADS
  // ===================================================================

  /**
   * Agregar dados de conversão de leads
   */
  static async aggregateLeadConversionData(agentId?: string): Promise<LeadConversionData> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // Buscar contatos/leads no período
      let query = supabase
        .from('Contact')
        .select(`
          id,
          category,
          leadStage,
          leadSource,
          createdAt,
          agentId
        `)
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString());

      if (agentId) {
        query = query.eq('agentId', agentId);
      }

      const { data: contacts, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar dados de leads: ${error.message}`);
      }

      const leads = contacts?.filter(c => c.category === 'LEAD') || [];
      
      // Calcular métricas básicas
      const totalLeads = leads.length;
      const newLeads = leads.filter(l => l.leadStage === 'NEW').length;
      const qualifiedLeads = leads.filter(l => l.leadStage === 'QUALIFIED').length;
      const convertedLeads = leads.filter(l => l.leadStage === 'CONVERTED').length;
      const lostLeads = leads.filter(l => l.leadStage === 'LOST').length;

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

      // Breakdown por fonte
      const sourceBreakdown = this.calculateSourceBreakdown(leads);

      // Breakdown por estágio
      const stageBreakdown = this.calculateStageBreakdown(leads);

      return {
        period: { start: startDate, end: endDate },
        totalLeads,
        newLeads,
        qualifiedLeads,
        convertedLeads,
        lostLeads,
        conversionRate,
        qualificationRate,
        sourceBreakdown,
        stageBreakdown
      };

    } catch (error) {
      console.error('Erro ao agregar dados de leads:', error);
      return this.getEmptyLeadConversionData(startDate, endDate);
    }
  }

  // ===================================================================
  // MÉTRICAS DE AGENDAMENTOS
  // ===================================================================

  /**
   * Agregar dados de agendamentos
   */
  static async aggregateAppointmentData(agentId?: string): Promise<AppointmentData> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // Buscar agendamentos no período
      let query = supabase
        .from('Appointment')
        .select(`
          id,
          status,
          scheduledFor,
          duration,
          agentId,
          agent:User(name),
          createdAt
        `)
        .gte('scheduledFor', startDate.toISOString())
        .lte('scheduledFor', endDate.toISOString());

      if (agentId) {
        query = query.eq('agentId', agentId);
      }

      const { data: appointments, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar dados de agendamentos: ${error.message}`);
      }

      // Calcular métricas
      const totalAppointments = appointments?.length || 0;
      const scheduledAppointments = appointments?.filter(a => a.status === 'SCHEDULED').length || 0;
      const completedAppointments = appointments?.filter(a => a.status === 'COMPLETED').length || 0;
      const canceledAppointments = appointments?.filter(a => a.status === 'CANCELLED').length || 0;
      const noShowAppointments = appointments?.filter(a => a.status === 'NO_SHOW').length || 0;

      const completionRate = totalAppointments > 0 
        ? (completedAppointments / totalAppointments) * 100 
        : 0;

      // Duração média
      const validDurations = appointments?.filter(a => a.duration).map(a => a.duration) || [];
      const averageDuration = validDurations.length > 0 
        ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
        : 0;

      // Horas mais ocupadas
      const busyHours = this.calculateBusyHours(appointments || []);

      // Breakdown por agente
      const agentBreakdown = this.calculateAgentAppointmentBreakdown(appointments || []);

      return {
        period: { start: startDate, end: endDate },
        totalAppointments,
        scheduledAppointments,
        completedAppointments,
        canceledAppointments,
        noShowAppointments,
        completionRate,
        averageDuration,
        busyHours,
        agentBreakdown
      };

    } catch (error) {
      console.error('Erro ao agregar dados de agendamentos:', error);
      return this.getEmptyAppointmentData(startDate, endDate);
    }
  }

  // ===================================================================
  // ANÁLISES AVANÇADAS
  // ===================================================================

  /**
   * Calcular taxas de conversão
   */
  static async calculateConversionRates(timeRange: DateRange): Promise<ConversionRates> {
    try {
      // Buscar dados do período atual
      const currentData = await this.getConversionDataForPeriod(timeRange);
      
      // Buscar dados do período anterior para comparação
      const previousRange = {
        start: new Date(timeRange.start.getTime() - (timeRange.end.getTime() - timeRange.start.getTime())),
        end: timeRange.start
      };
      const previousData = await this.getConversionDataForPeriod(previousRange);

      return {
        leadToQualified: currentData.leadToQualified,
        qualifiedToAppointment: currentData.qualifiedToAppointment,
        appointmentToSale: currentData.appointmentToSale,
        overallConversion: currentData.overallConversion,
        periodComparison: {
          current: currentData.overallConversion,
          previous: previousData.overallConversion,
          change: currentData.overallConversion - previousData.overallConversion
        }
      };

    } catch (error) {
      console.error('Erro ao calcular taxas de conversão:', error);
      return {
        leadToQualified: 0,
        qualifiedToAppointment: 0,
        appointmentToSale: 0,
        overallConversion: 0,
        periodComparison: {
          current: 0,
          previous: 0,
          change: 0
        }
      };
    }
  }

  /**
   * Gerar comparação de performance entre agentes
   */
  static async generatePerformanceComparisons(agents: string[]): Promise<PerformanceData> {
    try {
      const agentData = await Promise.all(
        agents.map(async (agentId, index) => {
          const salesData = await this.aggregateWeeklySalesData(agentId);
          const leadData = await this.aggregateLeadConversionData(agentId);
          const appointmentData = await this.aggregateAppointmentData(agentId);

          return {
            id: agentId,
            name: `Agente ${index + 1}`, // Em produção, buscar nome real
            leadsGenerated: leadData.totalLeads,
            appointmentsScheduled: appointmentData.totalAppointments,
            salesClosed: salesData.salesCount,
            conversionRate: leadData.conversionRate,
            averageDealValue: salesData.averageValue,
            rank: 0 // Será calculado após ordenação
          };
        })
      );

      // Ranquear agentes por vendas
      agentData.sort((a, b) => b.salesClosed - a.salesClosed);
      agentData.forEach((agent, index) => {
        agent.rank = index + 1;
      });

      // Encontrar top performers
      const topPerformers = {
        bySales: agentData[0]?.name || 'Nenhum',
        byConversion: agentData.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.name || 'Nenhum',
        byLeads: agentData.sort((a, b) => b.leadsGenerated - a.leadsGenerated)[0]?.name || 'Nenhum'
      };

      return {
        agents: agentData,
        topPerformers
      };

    } catch (error) {
      console.error('Erro ao gerar comparação de performance:', error);
      return {
        agents: [],
        topPerformers: {
          bySales: 'Nenhum',
          byConversion: 'Nenhum',
          byLeads: 'Nenhum'
        }
      };
    }
  }

  // ===================================================================
  // UTILITÁRIOS PRIVADOS
  // ===================================================================

  private static generateDailyBreakdown(deals: any[], startDate: Date, endDate: Date) {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayDeals = deals.filter(deal => {
        const dealDate = new Date(deal.closedAt);
        return dealDate.toDateString() === current.toDateString();
      });

      days.push({
        date: current.toISOString().split('T')[0],
        sales: dayDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        count: dayDeals.length
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  private static async getPreviousWeekSales(currentWeekStart: Date, agentId?: string) {
    const previousWeekEnd = new Date(currentWeekStart.getTime() - 1);
    const previousWeekStart = new Date(previousWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    let query = supabase
      .from('Deal')
      .select('value')
      .eq('status', 'WON')
      .gte('closedAt', previousWeekStart.toISOString())
      .lte('closedAt', previousWeekEnd.toISOString());

    if (agentId) {
      query = query.eq('agentId', agentId);
    }

    const { data } = await query;
    
    return {
      totalSales: data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0
    };
  }

  private static calculateSourceBreakdown(leads: any[]) {
    const sourceCount = leads.reduce((acc, lead) => {
      const source = lead.leadSource || 'OUTROS';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = leads.length;
    
    return Object.entries(sourceCount).map(([source, count]) => ({
      source,
      count,
      conversionRate: 0, // Calcular se necessário
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private static calculateStageBreakdown(leads: any[]) {
    const stageCount = leads.reduce((acc, lead) => {
      const stage = lead.leadStage || 'NEW';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = leads.length;
    
    return Object.entries(stageCount).map(([stage, count]) => ({
      stage,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private static calculateBusyHours(appointments: any[]) {
    const hourCount = appointments.reduce((acc, appointment) => {
      const hour = new Date(appointment.scheduledFor).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCount)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }

  private static calculateAgentAppointmentBreakdown(appointments: any[]) {
    const agentStats = appointments.reduce((acc, appointment) => {
      const agentId = appointment.agentId;
      if (!acc[agentId]) {
        acc[agentId] = {
          agentId,
          agentName: appointment.agent?.name || 'Agente',
          total: 0,
          completed: 0
        };
      }
      acc[agentId].total++;
      if (appointment.status === 'COMPLETED') {
        acc[agentId].completed++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agentStats).map((agent: any) => ({
      agentId: agent.agentId,
      agentName: agent.agentName,
      appointmentCount: agent.total,
      completionRate: agent.total > 0 ? (agent.completed / agent.total) * 100 : 0
    }));
  }

  private static async getConversionDataForPeriod(timeRange: DateRange) {
    // Implementação simplificada - em produção, fazer queries reais
    return {
      leadToQualified: 25.5,
      qualifiedToAppointment: 60.2,
      appointmentToSale: 18.7,
      overallConversion: 12.3
    };
  }

  // ===================================================================
  // DADOS VAZIOS PARA FALLBACK
  // ===================================================================

  private static getEmptyWeeklySalesData(start: Date, end: Date): WeeklySalesData {
    return {
      period: { start, end },
      totalSales: 0,
      salesCount: 0,
      averageValue: 0,
      topAgent: { id: '', name: 'Nenhum', salesCount: 0, totalValue: 0 },
      dailyBreakdown: [],
      growthRate: 0
    };
  }

  private static getEmptyLeadConversionData(start: Date, end: Date): LeadConversionData {
    return {
      period: { start, end },
      totalLeads: 0,
      newLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
      conversionRate: 0,
      qualificationRate: 0,
      sourceBreakdown: [],
      stageBreakdown: []
    };
  }

  private static getEmptyAppointmentData(start: Date, end: Date): AppointmentData {
    return {
      period: { start, end },
      totalAppointments: 0,
      scheduledAppointments: 0,
      completedAppointments: 0,
      canceledAppointments: 0,
      noShowAppointments: 0,
      completionRate: 0,
      averageDuration: 0,
      busyHours: [],
      agentBreakdown: []
    };
  }
}