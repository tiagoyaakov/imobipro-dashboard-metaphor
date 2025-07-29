import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReportTemplate, ScheduledReport, ReportHistory, ReportType, ReportFormat } from '@prisma/client';
import { 
  ReportsService,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateFilters,
  ScheduleReportInput,
  ReportParams,
  GeneratedReport
} from '@/services/reportsService';
import { ReportDataService } from '@/services/reportDataService';
import { TemplateEngineService, VariableDefinition } from '@/services/templateEngineService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ===================================================================
// QUERY KEYS
// ===================================================================

export const reportKeys = {
  all: ['reports'] as const,
  templates: () => [...reportKeys.all, 'templates'] as const,
  template: (id: string) => [...reportKeys.templates(), id] as const,
  templatesByCompany: (companyId: string, filters?: TemplateFilters) => 
    [...reportKeys.templates(), 'company', companyId, filters] as const,
  scheduledReports: () => [...reportKeys.all, 'scheduled'] as const,
  scheduledReport: (id: string) => [...reportKeys.scheduledReports(), id] as const,
  scheduledByCompany: (companyId: string) => 
    [...reportKeys.scheduledReports(), 'company', companyId] as const,
  reportHistory: () => [...reportKeys.all, 'history'] as const,
  reportHistoryBySchedule: (scheduleId: string) => 
    [...reportKeys.reportHistory(), 'schedule', scheduleId] as const,
  variables: (type: ReportType) => [...reportKeys.all, 'variables', type] as const,
  preview: (templateId: string, params: ReportParams) => 
    [...reportKeys.all, 'preview', templateId, params] as const,
  metrics: () => [...reportKeys.all, 'metrics'] as const,
  salesMetrics: (params: ReportParams) => [...reportKeys.metrics(), 'sales', params] as const,
  leadMetrics: (params: ReportParams) => [...reportKeys.metrics(), 'leads', params] as const,
  appointmentMetrics: (params: ReportParams) => [...reportKeys.metrics(), 'appointments', params] as const,
};

// ===================================================================
// TEMPLATE HOOKS
// ===================================================================

/**
 * Hook para buscar templates de relatório
 */
export function useReportTemplates(filters?: TemplateFilters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: reportKeys.templatesByCompany(user?.companyId || '', filters),
    queryFn: () => ReportsService.getTemplates({
      companyId: user?.companyId,
      ...filters
    }),
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar template específico
 */
export function useReportTemplate(id: string) {
  return useQuery({
    queryKey: reportKeys.template(id),
    queryFn: () => ReportsService.getTemplateById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para criar novo template
 */
export function useCreateReportTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateTemplateInput) => 
      ReportsService.createTemplate(input, user?.id || ''),
    onSuccess: (data) => {
      // Invalidar cache de templates
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.templatesByCompany(data.companyId) 
      });
      
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });
}

/**
 * Hook para atualizar template
 */
export function useUpdateReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTemplateInput }) =>
      ReportsService.updateTemplate(id, input),
    onSuccess: (data) => {
      // Invalidar cache específico e da lista
      queryClient.invalidateQueries({ queryKey: reportKeys.template(data.id) });
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.templatesByCompany(data.companyId) 
      });
      
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });
}

/**
 * Hook para deletar template
 */
export function useDeleteReportTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => ReportsService.deleteTemplate(id),
    onSuccess: () => {
      // Invalidar cache de templates
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.templatesByCompany(user?.companyId || '') 
      });
      
      toast.success('Template removido com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao remover template: ${error.message}`);
    },
  });
}

// ===================================================================
// SCHEDULED REPORTS HOOKS
// ===================================================================

/**
 * Hook para buscar relatórios agendados
 */
export function useScheduledReports() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: reportKeys.scheduledByCompany(user?.companyId || ''),
    queryFn: () => ReportsService.getScheduledReports(user?.companyId),
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para agendar relatório
 */
export function useScheduleReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: ScheduleReportInput) => 
      ReportsService.scheduleReport(input, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.scheduledByCompany(user?.companyId || '') 
      });
      
      toast.success('Relatório agendado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao agendar relatório: ${error.message}`);
    },
  });
}

/**
 * Hook para executar relatório agendado
 */
export function useExecuteScheduledReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (scheduleId: string) => 
      ReportsService.executeScheduledReport(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.scheduledByCompany(user?.companyId || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.reportHistory() 
      });
      
      toast.success('Relatório executado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao executar relatório: ${error.message}`);
    },
  });
}

// ===================================================================
// REPORT GENERATION HOOKS
// ===================================================================

/**
 * Hook para gerar relatório
 */
export function useGenerateReport() {
  return useMutation({
    mutationFn: ({ templateId, params }: { templateId: string; params: ReportParams }) =>
      ReportsService.generateReport(templateId, params),
    onError: (error) => {
      toast.error(`Erro ao gerar relatório: ${error.message}`);
    },
  });
}

/**
 * Hook para preview de relatório
 */
export function useReportPreview(templateId: string, params: ReportParams, enabled = false) {
  return useQuery({
    queryKey: reportKeys.preview(templateId, params),
    queryFn: () => ReportsService.generateReport(templateId, params),
    enabled: enabled && !!templateId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// ===================================================================
// TEMPLATE ENGINE HOOKS
// ===================================================================

/**
 * Hook para buscar variáveis disponíveis
 */
export function useReportVariables(type: ReportType) {
  return useQuery({
    queryKey: reportKeys.variables(type),
    queryFn: () => TemplateEngineService.getAvailableVariables(type),
    enabled: !!type,
    staleTime: 30 * 60 * 1000, // 30 minutos (raramente muda)
  });
}

/**
 * Hook para validar template
 */
export function useValidateTemplate() {
  return useMutation({
    mutationFn: (template: string) => TemplateEngineService.validateTemplate(template),
  });
}

// ===================================================================
// METRICS HOOKS
// ===================================================================

/**
 * Hook para métricas de vendas
 */
export function useSalesMetrics(params: ReportParams) {
  return useQuery({
    queryKey: reportKeys.salesMetrics(params),
    queryFn: () => ReportDataService.aggregateWeeklySalesData(params.agentId),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para métricas de leads
 */
export function useLeadMetrics(params: ReportParams) {
  return useQuery({
    queryKey: reportKeys.leadMetrics(params),
    queryFn: () => ReportDataService.aggregateLeadConversionData(params.agentId),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para métricas de agendamentos
 */
export function useAppointmentMetrics(params: ReportParams) {
  return useQuery({
    queryKey: reportKeys.appointmentMetrics(params),
    queryFn: () => ReportDataService.aggregateAppointmentData(params.agentId),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para taxas de conversão
 */
export function useConversionRates(timeRange: { start: Date; end: Date }) {
  return useQuery({
    queryKey: [...reportKeys.metrics(), 'conversion', timeRange],
    queryFn: () => ReportDataService.calculateConversionRates(timeRange),
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
}

// ===================================================================
// COMPOUND HOOKS
// ===================================================================

/**
 * Hook composto para gerenciamento completo de relatórios
 */
export function useReportsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const templates = useReportTemplates();
  const scheduledReports = useScheduledReports();

  // Mutations
  const createTemplate = useCreateReportTemplate();
  const updateTemplate = useUpdateReportTemplate();
  const deleteTemplate = useDeleteReportTemplate();
  const scheduleReport = useScheduleReport();
  const executeReport = useExecuteScheduledReport();
  const generateReport = useGenerateReport();

  // Actions
  const actions = {
    // Template actions
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    
    // Schedule actions
    scheduleReport: scheduleReport.mutate,
    executeReport: executeReport.mutate,
    generateReport: generateReport.mutate,
    
    // Utility actions
    refreshTemplates: () => {
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.templatesByCompany(user?.companyId || '') 
      });
    },
    
    refreshScheduledReports: () => {
      queryClient.invalidateQueries({ 
        queryKey: reportKeys.scheduledByCompany(user?.companyId || '') 
      });
    },
  };

  // Loading states
  const isLoading = {
    templates: templates.isLoading,
    scheduledReports: scheduledReports.isLoading,
    createTemplate: createTemplate.isPending,
    updateTemplate: updateTemplate.isPending,
    deleteTemplate: deleteTemplate.isPending,
    scheduleReport: scheduleReport.isPending,
    executeReport: executeReport.isPending,
    generateReport: generateReport.isPending,
  };

  return {
    // Data
    templates: templates.data || [],
    scheduledReports: scheduledReports.data || [],
    
    // Loading states
    isLoading,
    
    // Error states
    error: {
      templates: templates.error,
      scheduledReports: scheduledReports.error,
      createTemplate: createTemplate.error,
      updateTemplate: updateTemplate.error,
      deleteTemplate: deleteTemplate.error,
      scheduleReport: scheduleReport.error,
      executeReport: executeReport.error,
      generateReport: generateReport.error,
    },
    
    // Actions
    actions,
    
    // Status
    isReady: !templates.isLoading && !scheduledReports.isLoading,
  };
}

/**
 * Hook para dashboard de métricas
 */
export function useReportsDashboard() {
  const defaultParams: ReportParams = {
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
      end: new Date()
    }
  };

  // Temporariamente retornar dados mock até tabelas serem criadas
  const mockMetrics = {
    sales: {
      totalSales: 850000,
      salesCount: 12,
      averageValue: 70833,
      topAgent: {
        name: 'João Silva',
        salesCount: 3
      },
      growthRate: 15.3
    },
    leads: {
      totalLeads: 45,
      newLeads: 12,
      convertedLeads: 8,
      conversionRate: 17.8,
      sourceBreakdown: [
        { source: 'Site', count: 15, percentage: 33.3 },
        { source: 'WhatsApp', count: 12, percentage: 26.7 },
        { source: 'Indicação', count: 10, percentage: 22.2 },
        { source: 'Facebook', count: 8, percentage: 17.8 }
      ]
    },
    appointments: {
      totalAppointments: 28,
      completedAppointments: 24,
      canceledAppointments: 4,
      completionRate: 85.7,
      averageDuration: 65
    },
    conversions: {
      overallConversion: 12.3,
      periodComparison: {
        current: 12.3,
        previous: 10.8,
        change: 1.5
      }
    }
  };

  return {
    metrics: mockMetrics,
    isLoading: false,
    hasError: false,
    refresh: () => {
      console.log('Dashboard refresh - usando dados mock');
    }
  };
}