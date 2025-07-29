import { ReportsService } from '@/services/reportsService';
import { DEFAULT_REPORT_TEMPLATES } from '@/data/reportTemplates';
import { ReportType, ReportFormat } from '@prisma/client';

// ===================================================================
// UTILITÁRIO PARA POPULAR BANCO COM TEMPLATES PADRÃO
// ===================================================================

export interface SeedReportsOptions {
  companyId: string;
  userId: string;
  skipExisting?: boolean;
}

export interface SeedResult {
  success: boolean;
  templatesCreated: number;
  scheduledReportsCreated: number;
  errors: string[];
}

/**
 * Popular banco de dados com templates padrão de relatórios
 */
export async function seedReportsForCompany(options: SeedReportsOptions): Promise<SeedResult> {
  const { companyId, userId, skipExisting = true } = options;
  let templatesCreated = 0;
  let scheduledReportsCreated = 0;
  const errors: string[] = [];

  try {
    // Verificar se já existem templates para a empresa
    if (skipExisting) {
      const existingTemplates = await ReportsService.getTemplates({ companyId });
      if (existingTemplates.length > 0) {
        console.log('Templates already exist for company, skipping seed');
        return {
          success: true,
          templatesCreated: 0,
          scheduledReportsCreated: 0,
          errors: []
        };
      }
    }

    // Criar templates essenciais
    const essentialTemplates = DEFAULT_REPORT_TEMPLATES.filter(template => 
      ['sales', 'leads', 'appointments'].includes(template.category)
    );

    for (const templateData of essentialTemplates) {
      try {
        const template = await ReportsService.createTemplate({
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          template: templateData.template,
          variables: templateData.variables,
          companyId
        }, userId);

        templatesCreated++;
        console.log(`✅ Template criado: ${template.name}`);

        // Criar agendamento automático para template de vendas semanais
        if (templateData.type === 'WEEKLY_SALES') {
          try {
            await ReportsService.scheduleReport({
              name: 'Relatório Semanal Automático',
              description: 'Relatório de vendas enviado automaticamente toda segunda-feira',
              templateId: template.id,
              schedule: '0 9 * * 1', // Segunda-feira às 9h
              recipients: [], // Será configurado pelo usuário
              format: 'WHATSAPP' as ReportFormat,
              companyId
            }, userId);

            scheduledReportsCreated++;
            console.log('✅ Agendamento automático criado para vendas semanais');
          } catch (scheduleError) {
            errors.push(`Erro ao criar agendamento para ${template.name}: ${scheduleError}`);
          }
        }

      } catch (templateError) {
        const errorMsg = `Erro ao criar template ${templateData.name}: ${templateError}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      templatesCreated,
      scheduledReportsCreated,
      errors
    };

  } catch (error) {
    const errorMsg = `Erro geral no seed de relatórios: ${error}`;
    errors.push(errorMsg);
    console.error(errorMsg);

    return {
      success: false,
      templatesCreated,
      scheduledReportsCreated,
      errors
    };
  }
}

/**
 * Criar templates específicos por categoria
 */
export async function createTemplatesByCategory(
  category: string,
  companyId: string,
  userId: string
): Promise<string[]> {
  const createdIds: string[] = [];
  const templates = DEFAULT_REPORT_TEMPLATES.filter(t => t.category === category);

  for (const templateData of templates) {
    try {
      const template = await ReportsService.createTemplate({
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        template: templateData.template,
        variables: templateData.variables,
        companyId
      }, userId);

      createdIds.push(template.id);
    } catch (error) {
      console.error(`Erro ao criar template ${templateData.name}:`, error);
    }
  }

  return createdIds;
}

/**
 * Verificar se empresa precisa de seed inicial
 */
export async function companyNeedsReportsSeed(companyId: string): Promise<boolean> {
  try {
    const templates = await ReportsService.getTemplates({ companyId });
    return templates.length === 0;
  } catch (error) {
    console.error('Erro ao verificar necessidade de seed:', error);
    return false;
  }
}

/**
 * Hook para verificar e executar seed automaticamente
 */
export function useAutoSeedReports(companyId?: string, userId?: string) {
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [seedResult, setSeedResult] = React.useState<SeedResult | null>(null);

  React.useEffect(() => {
    async function checkAndSeed() {
      if (!companyId || !userId || isSeeding) return;

      try {
        const needsSeed = await companyNeedsReportsSeed(companyId);
        
        if (needsSeed) {
          setIsSeeding(true);
          console.log('🌱 Iniciando seed automático de relatórios...');
          
          const result = await seedReportsForCompany({
            companyId,
            userId,
            skipExisting: true
          });

          setSeedResult(result);
          
          if (result.success) {
            console.log(`✅ Seed concluído: ${result.templatesCreated} templates criados`);
          } else {
            console.error('❌ Seed falhou:', result.errors);
          }
        }
      } catch (error) {
        console.error('Erro no auto-seed:', error);
        setSeedResult({
          success: false,
          templatesCreated: 0,
          scheduledReportsCreated: 0,
          errors: [String(error)]
        });
      } finally {
        setIsSeeding(false);
      }
    }

    checkAndSeed();
  }, [companyId, userId]);

  return {
    isSeeding,
    seedResult,
    seedManually: () => {
      if (companyId && userId) {
        return seedReportsForCompany({ companyId, userId, skipExisting: false });
      }
      return Promise.reject('Company ID e User ID são obrigatórios');
    }
  };
}

// Adicionar React import no topo se necessário
import React from 'react';

/**
 * Templates de configuração rápida
 */
export const QUICK_SETUP_CONFIGS = [
  {
    name: 'Configuração Básica',
    description: 'Templates essenciais para começar',
    templates: ['WEEKLY_SALES', 'LEAD_CONVERSION'],
    schedules: [
      {
        name: 'Vendas Semanais',
        cron: '0 9 * * 1', // Segunda às 9h
        format: 'WHATSAPP' as ReportFormat
      }
    ]
  },
  {
    name: 'Configuração Completa',
    description: 'Todos os tipos de relatório',
    templates: ['WEEKLY_SALES', 'LEAD_CONVERSION', 'APPOINTMENT_SUMMARY', 'AGENT_PERFORMANCE'],
    schedules: [
      {
        name: 'Relatório Executivo',
        cron: '0 8 * * 1', // Segunda às 8h
        format: 'EMAIL' as ReportFormat
      }
    ]
  }
];

/**
 * Aplicar configuração rápida
 */
export async function applyQuickSetup(
  configName: string,
  companyId: string,
  userId: string,
  recipients: string[] = []
): Promise<SeedResult> {
  const config = QUICK_SETUP_CONFIGS.find(c => c.name === configName);
  if (!config) {
    throw new Error(`Configuração ${configName} não encontrada`);
  }

  let templatesCreated = 0;
  let scheduledReportsCreated = 0;
  const errors: string[] = [];

  try {
    // Criar templates
    for (const templateType of config.templates) {
      const templateData = DEFAULT_REPORT_TEMPLATES.find(t => t.type === templateType);
      if (!templateData) continue;

      try {
        const template = await ReportsService.createTemplate({
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          template: templateData.template,
          variables: templateData.variables,
          companyId
        }, userId);

        templatesCreated++;

        // Criar agendamentos se configurado
        const scheduleConfig = config.schedules.find(s => 
          s.name.toLowerCase().includes(templateType.toLowerCase().split('_')[0])
        );

        if (scheduleConfig && recipients.length > 0) {
          await ReportsService.scheduleReport({
            name: scheduleConfig.name,
            description: `Agendamento automático - ${config.description}`,
            templateId: template.id,
            schedule: scheduleConfig.cron,
            recipients,
            format: scheduleConfig.format,
            companyId
          }, userId);

          scheduledReportsCreated++;
        }

      } catch (error) {
        errors.push(`Erro ao processar ${templateType}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      templatesCreated,
      scheduledReportsCreated,
      errors
    };

  } catch (error) {
    return {
      success: false,
      templatesCreated,
      scheduledReportsCreated,
      errors: [String(error)]
    };
  }
}