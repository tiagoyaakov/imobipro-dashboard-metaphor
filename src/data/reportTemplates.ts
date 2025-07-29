import { ReportType, ReportFormat } from '@prisma/client';

// ===================================================================
// TEMPLATES PADRÃO DE RELATÓRIOS
// ===================================================================

export interface DefaultReportTemplate {
  name: string;
  description: string;
  type: ReportType;
  template: string;
  variables: Record<string, any>;
  suggestedFormats: ReportFormat[];
  category: 'sales' | 'leads' | 'appointments' | 'performance' | 'custom';
}

export const DEFAULT_REPORT_TEMPLATES: DefaultReportTemplate[] = [

  // ===================================================================
  // TEMPLATES DE VENDAS
  // ===================================================================

  {
    name: 'Relatório Semanal de Vendas',
    description: 'Resumo das vendas realizadas na semana com métricas principais',
    type: 'WEEKLY_SALES',
    category: 'sales',
    suggestedFormats: ['WHATSAPP', 'EMAIL', 'PDF'],
    variables: {
      includeGrowth: true,
      includeTopAgent: true,
      includeDailyBreakdown: false
    },
    template: `📊 **RELATÓRIO SEMANAL DE VENDAS**
{{companyName}}

💰 **VENDAS DA SEMANA**
• Total: {{formatCurrency(totalSales)}}
• Quantidade: {{salesCount}} vendas
• Ticket médio: {{formatCurrency(averageValue)}}
{{#if growthRate}}• Crescimento: {{growthRate >= 0 ? '📈' : '📉'}} {{formatPercentage(growthRate)}}{{/if}}

{{#if topAgent}}🏆 **DESTAQUE DA SEMANA**
• {{topAgent.name}}
• {{topAgent.salesCount}} vendas realizadas
{{/if}}

{{#if dailyBreakdown}}📈 **BREAKDOWN DIÁRIO**
{{#each dailyBreakdown}}• {{date}}: {{formatCurrency(sales)}} ({{count}} vendas)
{{/each}}{{/if}}

📅 **Período:** {{formatDate(periodStart)}} - {{formatDate(periodEnd)}}
🕐 **Gerado em:** {{formatDate(generatedAt)}}

✨ _Relatório automático do ImobiPRO_`
  },

  {
    name: 'Relatório Mensal de Vendas Detalhado',
    description: 'Análise completa das vendas mensais com comparativos e tendências',
    type: 'WEEKLY_SALES', // Usar mesmo enum, mas configurar período
    category: 'sales',
    suggestedFormats: ['PDF', 'EMAIL', 'EXCEL'],
    variables: {
      period: 'monthly',
      includeComparisons: true,
      includeTrends: true,
      includeAgentBreakdown: true
    },
    template: `# RELATÓRIO MENSAL DE VENDAS
**{{companyName}}** - {{formatDate(periodStart)}} a {{formatDate(periodEnd)}}

## 📊 RESUMO EXECUTIVO

**Performance Geral:**
- Total de Vendas: {{formatCurrency(totalSales)}}
- Quantidade de Vendas: {{salesCount}}
- Ticket Médio: {{formatCurrency(averageValue)}}
- Crescimento vs Mês Anterior: {{formatPercentage(growthRate)}}

## 🏆 TOP PERFORMERS

{{#if topAgent}}**Melhor Vendedor:**
- Nome: {{topAgent.name}}
- Vendas: {{topAgent.salesCount}}
- Valor Total: {{formatCurrency(topAgent.totalValue)}}
{{/if}}

## 📈 ANÁLISE TEMPORAL

{{#each dailyBreakdown}}
**{{date}}:** {{formatCurrency(sales)}} ({{count}} vendas)
{{/each}}

---
*Relatório gerado automaticamente pelo ImobiPRO em {{formatDate(generatedAt)}}*`
  },

  // ===================================================================
  // TEMPLATES DE LEADS
  // ===================================================================

  {
    name: 'Relatório de Conversão de Leads',
    description: 'Análise da performance de conversão de leads por fonte e estágio',
    type: 'LEAD_CONVERSION',
    category: 'leads',
    suggestedFormats: ['WHATSAPP', 'EMAIL', 'PDF'],
    variables: {
      includeSourceBreakdown: true,
      includeStageAnalysis: true,
      includeConversionFunnel: true
    },
    template: `🎯 **RELATÓRIO DE CONVERSÃO DE LEADS**
{{companyName}}

📈 **PERFORMANCE DA SEMANA**
• Total de Leads: {{totalLeads}}
• Novos Leads: {{newLeads}}
• Leads Qualificados: {{qualifiedLeads}}
• Leads Convertidos: {{convertedLeads}}
• Taxa de Conversão: {{formatPercentage(conversionRate)}}
• Taxa de Qualificação: {{formatPercentage(qualificationRate)}}

{{#if sourceBreakdown}}🌐 **FONTES DE LEADS**
{{#each sourceBreakdown}}• {{source}}: {{count}} leads ({{formatPercentage(percentage)}})
{{/each}}{{/if}}

{{#if stageBreakdown}}📊 **DISTRIBUIÇÃO POR ESTÁGIO**
{{#each stageBreakdown}}• {{stage}}: {{count}} leads ({{formatPercentage(percentage)}})
{{/each}}{{/if}}

📅 **Período:** {{formatDate(periodStart)}} - {{formatDate(periodEnd)}}
🕐 **Gerado em:** {{formatDate(generatedAt)}}

✨ _Relatório automático do ImobiPRO_`
  },

  {
    name: 'Relatório de Qualidade de Leads',
    description: 'Análise da qualidade dos leads recebidos e taxa de conversão por fonte',
    type: 'LEAD_CONVERSION',
    category: 'leads',
    suggestedFormats: ['EMAIL', 'PDF'],
    variables: {
      includeQualityScore: true,
      includeSourceAnalysis: true,
      includeRecommendations: true
    },
    template: `# RELATÓRIO DE QUALIDADE DE LEADS
**{{companyName}}** - Análise Semanal

## 🎯 RESUMO DE QUALIDADE

**Métricas Principais:**
- Total de Leads: {{totalLeads}}
- Score Médio de Qualidade: {{averageQualityScore}}/100
- Taxa de Conversão Geral: {{formatPercentage(conversionRate)}}

## 📊 ANÁLISE POR FONTE

{{#each sourceBreakdown}}
### {{source}}
- Quantidade: {{count}} leads
- Taxa de Conversão: {{formatPercentage(conversionRate)}}
- Score Médio: {{qualityScore}}/100
- ROI: {{roi}}

{{/each}}

## 💡 RECOMENDAÇÕES

{{#if recommendations}}
{{#each recommendations}}
- {{recommendation}}
{{/each}}
{{/if}}

---
*Gerado em {{formatDate(generatedAt)}} pelo ImobiPRO*`
  },

  // ===================================================================
  // TEMPLATES DE AGENDAMENTOS
  // ===================================================================

  {
    name: 'Resumo Semanal de Agendamentos',
    description: 'Overview dos agendamentos realizados, cancelados e taxas de conclusão',
    type: 'APPOINTMENT_SUMMARY',
    category: 'appointments',
    suggestedFormats: ['WHATSAPP', 'EMAIL'],
    variables: {
      includeCompletionRate: true,
      includeAgentBreakdown: false,
      includeBusyHours: false
    },
    template: `📅 **RELATÓRIO DE AGENDAMENTOS**
{{companyName}}

📞 **AGENDAMENTOS DA SEMANA**
• Total: {{totalAppointments}} agendamentos
• Realizados: {{completedAppointments}} agendamentos
• Cancelados: {{canceledAppointments}} agendamentos
• No-show: {{noShowAppointments}} agendamentos
• Taxa de Conclusão: {{formatPercentage(completionRate)}}
{{#if averageDuration}}• Duração Média: {{averageDuration}} minutos{{/if}}

{{#if agentBreakdown}}👥 **PERFORMANCE POR AGENTE**
{{#each agentBreakdown}}• {{agentName}}: {{appointmentCount}} agendamentos ({{formatPercentage(completionRate)}})
{{/each}}{{/if}}

📅 **Período:** {{formatDate(periodStart)}} - {{formatDate(periodEnd)}}
🕐 **Gerado em:** {{formatDate(generatedAt)}}

✨ _Relatório automático do ImobiPRO_`
  },

  {
    name: 'Análise de Produtividade de Agendamentos',
    description: 'Relatório detalhado sobre horários mais produtivos e otimização da agenda',
    type: 'APPOINTMENT_SUMMARY',
    category: 'appointments',
    suggestedFormats: ['PDF', 'EXCEL'],
    variables: {
      includeBusyHours: true,
      includeOptimizationTips: true,
      includeWeeklyTrends: true
    },
    template: `# ANÁLISE DE PRODUTIVIDADE - AGENDAMENTOS
**{{companyName}}** - Relatório Semanal

## 📊 RESUMO EXECUTIVO

- **Total de Agendamentos:** {{totalAppointments}}
- **Taxa de Conclusão:** {{formatPercentage(completionRate)}}
- **Duração Média:** {{averageDuration}} minutos
- **Horário Mais Produtivo:** {{mostProductiveHour}}h

## ⏰ HORÁRIOS MAIS OCUPADOS

{{#each busyHours}}
**{{hour}}h:** {{count}} agendamentos
{{/each}}

## 📈 ANÁLISE SEMANAL

{{#each weeklyTrends}}
- **{{dayName}}:** {{appointmentCount}} agendamentos ({{formatPercentage(completionRate)}})
{{/each}}

## 💡 DICAS DE OTIMIZAÇÃO

{{#if optimizationTips}}
{{#each optimizationTips}}
- {{tip}}
{{/each}}
{{/if}}

---
*Relatório gerado em {{formatDate(generatedAt)}}*`
  },

  // ===================================================================
  // TEMPLATES DE PERFORMANCE
  // ===================================================================

  {
    name: 'Ranking de Performance de Agentes',
    description: 'Comparativo de performance entre agentes com rankings e métricas',
    type: 'AGENT_PERFORMANCE',
    category: 'performance',
    suggestedFormats: ['EMAIL', 'PDF', 'WHATSAPP'],
    variables: {
      includeRanking: true,
      includeIndividualMetrics: true,
      includeGoalsComparison: false
    },
    template: `🏆 **RANKING DE PERFORMANCE**
{{companyName}}

👥 **TOP AGENTES DA SEMANA**

{{#each agents}}
**{{rank}}º {{name}}**
• Leads: {{leadsGenerated}}
• Agendamentos: {{appointmentsScheduled}}
• Vendas: {{salesClosed}}
• Taxa de Conversão: {{formatPercentage(conversionRate)}}
• Ticket Médio: {{formatCurrency(averageDealValue)}}

{{/each}}

🥇 **DESTAQUES**
• Mais Vendas: {{topPerformers.bySales}}
• Melhor Conversão: {{topPerformers.byConversion}}
• Mais Leads: {{topPerformers.byLeads}}

📅 **Período:** {{formatDate(periodStart)}} - {{formatDate(periodEnd)}}
🕐 **Gerado em:** {{formatDate(generatedAt)}}

✨ _Relatório automático do ImobiPRO_`
  },

  // ===================================================================
  // TEMPLATES PERSONALIZADOS
  // ===================================================================

  {
    name: 'Relatório Executivo Personalizado',
    description: 'Template base para criar relatórios executivos personalizados',
    type: 'CUSTOM',
    category: 'custom',
    suggestedFormats: ['PDF', 'EMAIL'],
    variables: {
      customSections: true,
      flexibleMetrics: true,
      brandingOptions: true
    },
    template: `# RELATÓRIO EXECUTIVO
**{{companyName}}**

{{#if executiveSummary}}
## 📋 RESUMO EXECUTIVO
{{executiveSummary}}
{{/if}}

## 📊 MÉTRICAS PRINCIPAIS

{{#each mainMetrics}}
### {{metricName}}
- **Valor:** {{value}}
- **Variação:** {{formatPercentage(variation)}}
- **Meta:** {{target}}
{{/each}}

## 📈 ANÁLISE DETALHADA

{{#each detailedSections}}
### {{sectionTitle}}
{{sectionContent}}
{{/each}}

## 🎯 PRÓXIMOS PASSOS

{{#if nextSteps}}
{{#each nextSteps}}
- {{step}}
{{/each}}
{{/if}}

---
**Período:** {{formatDate(periodStart)}} - {{formatDate(periodEnd)}}  
**Gerado em:** {{formatDate(generatedAt)}} pelo ImobiPRO`
  },

  {
    name: 'Relatório de KPIs Dashboard',
    description: 'Relatório condensado com os principais KPIs para envio diário',
    type: 'CUSTOM',
    category: 'custom',
    suggestedFormats: ['WHATSAPP', 'EMAIL'],
    variables: {
      compact: true,
      dailyFrequency: true,
      keyMetricsOnly: true
    },
    template: `📊 **KPIs DO DIA**
{{companyName}}

🔥 **HOJE EM NÚMEROS**
• Vendas: {{formatCurrency(dailySales)}} ({{dailySalesCount}})
• Leads: {{dailyLeads}} novos
• Agendamentos: {{dailyAppointments}} realizados
• Conversão: {{formatPercentage(dailyConversion)}}

{{#if alerts}}⚠️ **ALERTAS**
{{#each alerts}}• {{alert}}
{{/each}}{{/if}}

{{#if achievements}}🎉 **CONQUISTAS**
{{#each achievements}}• {{achievement}}
{{/each}}{{/if}}

📅 {{formatDate(today)}}

_KPIs automáticos do ImobiPRO_`
  }

];

// ===================================================================
// UTILITÁRIOS PARA TEMPLATES
// ===================================================================

/**
 * Buscar templates por categoria
 */
export function getTemplatesByCategory(category: string): DefaultReportTemplate[] {
  return DEFAULT_REPORT_TEMPLATES.filter(template => template.category === category);
}

/**
 * Buscar template por nome
 */
export function getTemplateByName(name: string): DefaultReportTemplate | undefined {
  return DEFAULT_REPORT_TEMPLATES.find(template => template.name === name);
}

/**
 * Buscar templates por tipo de relatório
 */
export function getTemplatesByType(type: ReportType): DefaultReportTemplate[] {
  return DEFAULT_REPORT_TEMPLATES.filter(template => template.type === type);
}

/**
 * Buscar templates compatíveis com formato
 */
export function getTemplatesByFormat(format: ReportFormat): DefaultReportTemplate[] {
  return DEFAULT_REPORT_TEMPLATES.filter(template => 
    template.suggestedFormats.includes(format)
  );
}

/**
 * Obter lista de categorias disponíveis
 */
export function getAvailableCategories(): string[] {
  const categories = new Set(DEFAULT_REPORT_TEMPLATES.map(t => t.category));
  return Array.from(categories);
}

/**
 * Criar template personalizado baseado em um padrão
 */
export function createCustomTemplate(
  baseTemplate: DefaultReportTemplate,
  customizations: {
    name?: string;
    description?: string;
    template?: string;
    variables?: Record<string, any>;
  }
): DefaultReportTemplate {
  return {
    ...baseTemplate,
    ...customizations,
    category: 'custom',
    variables: {
      ...baseTemplate.variables,
      ...customizations.variables
    }
  };
}

// ===================================================================
// TEMPLATES DE CONFIGURAÇÃO RÁPIDA
// ===================================================================

export const QUICK_SETUP_TEMPLATES = [
  {
    name: 'Setup Básico - Vendas + Leads',
    description: 'Configuração inicial com relatórios essenciais de vendas e leads',
    templates: [
      'Relatório Semanal de Vendas',
      'Relatório de Conversão de Leads'
    ],
    schedule: '0 9 * * 1', // Segunda-feira às 9h
    formats: ['WHATSAPP', 'EMAIL']
  },
  {
    name: 'Setup Completo - Todos os Módulos',
    description: 'Configuração completa com todos os tipos de relatório',
    templates: [
      'Relatório Semanal de Vendas',
      'Relatório de Conversão de Leads',
      'Resumo Semanal de Agendamentos',
      'Ranking de Performance de Agentes'
    ],
    schedule: '0 8 * * 1', // Segunda-feira às 8h
    formats: ['EMAIL', 'PDF']
  },
  {
    name: 'Setup Executivo - KPIs Diários',
    description: 'Relatórios executivos condensados enviados diariamente',
    templates: [
      'Relatório de KPIs Dashboard'
    ],
    schedule: '0 18 * * *', // Todos os dias às 18h
    formats: ['WHATSAPP']
  }
];

export default DEFAULT_REPORT_TEMPLATES;