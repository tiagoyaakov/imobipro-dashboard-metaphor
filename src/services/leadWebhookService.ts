/**
 * 🔲 ImobiPRO - Serviço de Webhook para Criação de Leads
 * 
 * Serviço que permite criação de leads via webhook n8n ou Supabase direta.
 * Resolve problemas de permissões RLS e fornece fallback robusto.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  N8nLeadWebhook,
  LeadResponse,
  convertFromN8nFormat,
  convertToN8nFormat,
  validateN8nLeadWebhook,
  sanitizeN8nWebhookData
} from '@/schemas/n8n-leads-schemas';
import type { CreateContactInput } from '@/types/clients';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const WEBHOOK_CONFIG = {
  n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/lead-create',
  useN8nPrimary: import.meta.env.VITE_USE_N8N_PRIMARY === 'true',
  fallbackToSupabase: true,
  timeout: 10000, // 10 segundos
};

// ============================================================================
// INTERFACES
// ============================================================================

interface LeadCreationResult {
  success: boolean;
  data?: LeadResponse;
  error?: string;
  method: 'n8n' | 'supabase' | 'fallback';
  processingTime: number;
}

interface SupabasePermissionCheck {
  canRead: boolean;
  canInsert: boolean;
  error?: string;
}

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

class LeadWebhookService {

  // --------------------------------------------------------------------------
  // MÉTODO PRINCIPAL DE CRIAÇÃO
  // --------------------------------------------------------------------------

  /**
   * Cria lead usando a melhor estratégia disponível
   */
  async createLead(input: CreateContactInput): Promise<LeadCreationResult> {
    const startTime = Date.now();

    try {
      // Converter para formato n8n
      const webhookData = this.convertToWebhookFormat(input);

      // Estratégia 1: Tentar via n8n se configurado como primário
      if (WEBHOOK_CONFIG.useN8nPrimary) {
        console.log('Tentando criação via n8n (método primário)...');
        const n8nResult = await this.createViaWebhook(webhookData);
        if (n8nResult.success) {
          return {
            ...n8nResult,
            method: 'n8n',
            processingTime: Date.now() - startTime
          };
        }
        console.warn('n8n falhou, tentando fallback para Supabase:', n8nResult.error);
      }

      // Estratégia 2: Tentar Supabase direto
      console.log('Tentando criação via Supabase...');
      const supabaseResult = await this.createViaSupabase(input);
      if (supabaseResult.success) {
        return {
          ...supabaseResult,
          method: 'supabase',
          processingTime: Date.now() - startTime
        };
      }

      // Estratégia 3: Fallback para n8n se Supabase falhou
      if (!WEBHOOK_CONFIG.useN8nPrimary && WEBHOOK_CONFIG.fallbackToSupabase) {
        console.log('Supabase falhou, tentando n8n como fallback...');
        const n8nFallback = await this.createViaWebhook(webhookData);
        if (n8nFallback.success) {
          return {
            ...n8nFallback,
            method: 'fallback',
            processingTime: Date.now() - startTime
          };
        }
      }

      // Se tudo falhou
      return {
        success: false,
        error: `Todas as estratégias falharam. Supabase: ${supabaseResult.error}`,
        method: 'fallback',
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Erro crítico na criação de lead:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        method: 'fallback',
        processingTime: Date.now() - startTime
      };
    }
  }

  // --------------------------------------------------------------------------
  // CRIAÇÃO VIA N8N WEBHOOK
  // --------------------------------------------------------------------------

  /**
   * Cria lead via webhook n8n
   */
  private async createViaWebhook(webhookData: N8nLeadWebhook): Promise<Omit<LeadCreationResult, 'method' | 'processingTime'>> {
    try {
      const sanitized = sanitizeN8nWebhookData(webhookData);
      const validated = validateN8nLeadWebhook(sanitized);

      const response = await fetch(WEBHOOK_CONFIG.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Source': 'imobipro-dashboard',
          'X-Correlation-ID': `dashboard_${Date.now()}`
        },
        body: JSON.stringify({
          action: 'create_lead',
          data: validated,
          metadata: {
            source: 'dashboard',
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
          }
        }),
        signal: AbortSignal.timeout(WEBHOOK_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`Webhook n8n retornou ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Resposta inválida do webhook n8n'
        };
      }

    } catch (error) {
      console.error('Erro no webhook n8n:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no webhook n8n'
      };
    }
  }

  // --------------------------------------------------------------------------
  // CRIAÇÃO VIA SUPABASE
  // --------------------------------------------------------------------------

  /**
   * Cria lead diretamente via Supabase
   */
  private async createViaSupabase(input: CreateContactInput): Promise<Omit<LeadCreationResult, 'method' | 'processingTime'>> {
    try {
      // Verificar permissões primeiro
      const permissionCheck = await this.checkSupabasePermissions();
      if (!permissionCheck.canInsert) {
        return {
          success: false,
          error: `Sem permissão para inserir na tabela Contact: ${permissionCheck.error}`
        };
      }

      // Verificar duplicatas se email ou telefone forem fornecidos
      // TEMPORARIAMENTE DESABILITADO para resolver problemas de query
      // TODO: Implementar verificação de duplicatas mais robusta
      /*
      if (input.email || input.phone) {
        const duplicateCheck = await this.checkForDuplicates(input.email, input.phone);
        if (duplicateCheck.hasDuplicate) {
          return {
            success: false,
            error: `Lead já existe: ${duplicateCheck.reason}`
          };
        }
      }
      */

      // Calcular score inicial
      const initialScore = this.calculateInitialScore(input);

      // Preparar dados para inserção
      const insertData: any = {
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        category: 'LEAD',
        status: 'NEW',
        leadStage: 'NEW',
        leadScore: initialScore,
        leadSource: input.leadSource || 'Site',
        leadSourceDetails: input.leadSourceDetails || null,
        company: input.company || null,
        position: input.position || null,
        budget: input.budget || null,
        timeline: input.timeline || null,
        preferences: input.preferences || {},
        tags: input.tags || [],
        priority: input.priority || 'MEDIUM',
        isQualified: false,
        unsubscribed: false,
        optInWhatsApp: false,
        optInEmail: false,
        optInSMS: false,
        interactionCount: 0,
        engagementLevel: 'LOW'
      };

      // Só adicionar agentId se estiver presente e válido
      if (input.agentId && input.agentId.trim() && input.agentId !== 'mock-user') {
        insertData.agentId = input.agentId;
      }

      console.log('Dados para inserção:', insertData);

      // Tentar inserir
      const { data, error } = await supabase
        .from('Contact')
        .insert(insertData)
        .select(`
          id, name, email, phone, leadStage, leadScore, leadSource,
          company, budget, timeline, tags, priority, agentId,
          createdAt, updatedAt
        `)
        .single();

      if (error) {
        console.error('Erro detalhado do Supabase na inserção:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          inputData: {
            name: input.name,
            email: input.email || 'null',
            phone: input.phone || 'null',
            agentId: input.agentId
          }
        });
        
        // Fornecer mensagens de erro mais específicas
        let friendlyMessage = 'Erro desconhecido ao criar lead';
        
        if (error.code === '23505') {
          friendlyMessage = 'Lead já existe com este email ou telefone';
        } else if (error.code === '23502') {
          friendlyMessage = 'Campos obrigatórios não foram preenchidos';
        } else if (error.code === '42501') {
          friendlyMessage = 'Sem permissão para criar leads';
        } else if (error.message.includes('RLS')) {
          friendlyMessage = 'Erro de permissões do sistema (RLS)';
        } else if (error.message.includes('agentId')) {
          friendlyMessage = 'ID do agente inválido';
        }
        
        return {
          success: false,
          error: `${friendlyMessage}: ${error.message}`
        };
      }

      // Converter para formato de resposta
      const response: LeadResponse = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        leadStage: data.leadStage as any,
        leadScore: data.leadScore,
        leadSource: data.leadSource || 'Site',
        company: data.company,
        budget: data.budget ? Number(data.budget) : undefined,
        timeline: data.timeline,
        tags: data.tags || [],
        priority: data.priority as any,
        isQualified: false,
        agentId: data.agentId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };

      return {
        success: true,
        data: response
      };

    } catch (error) {
      console.error('Erro no Supabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no Supabase'
      };
    }
  }

  // --------------------------------------------------------------------------
  // VERIFICAÇÕES E UTILITÁRIOS
  // --------------------------------------------------------------------------

  /**
   * Verifica se já existe um contato com o mesmo email ou telefone
   */
  private async checkForDuplicates(email?: string, phone?: string): Promise<{
    hasDuplicate: boolean;
    reason?: string;
    existingContact?: any;
  }> {
    try {
      if (!email && !phone) {
        return { hasDuplicate: false };
      }

      // Construir query de forma segura
      let query = supabase
        .from('Contact')
        .select('id, name, email, phone')
        .limit(1);

      // Aplicar filtros condicionalmente de forma mais segura
      if (email && phone) {
        // Usar filtros separados em vez de OR composto para evitar problemas de parsing
        query = query.or(`email.eq."${email}",phone.eq."${phone}"`);
      } else if (email) {
        query = query.eq('email', email);
      } else if (phone) {
        query = query.eq('phone', phone);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao verificar duplicatas:', error);
        // Não falhar a criação por erro na verificação de duplicatas
        return { hasDuplicate: false };
      }

      if (data && data.length > 0) {
        const existing = data[0];
        const reason = existing.email === email ? 
          `Email ${email} já cadastrado` : 
          `Telefone ${phone} já cadastrado`;
        
        return {
          hasDuplicate: true,
          reason,
          existingContact: existing
        };
      }

      return { hasDuplicate: false };
    } catch (error) {
      console.error('Erro na verificação de duplicatas:', error);
      // Não falhar a criação por erro na verificação
      return { hasDuplicate: false };
    }
  }

  /**
   * Verifica permissões do Supabase
   */
  private async checkSupabasePermissions(): Promise<SupabasePermissionCheck> {
    try {
      console.log('Verificando permissões do Supabase...');
      
      // Testar leitura básica - usando uma query mais simples
      const { data: readData, error: readError } = await supabase
        .from('Contact')
        .select('id')
        .limit(1);

      const canRead = !readError;
      
      if (readError) {
        console.error('Erro na leitura:', readError);
      } else {
        console.log('Leitura bem-sucedida');
      }

      // Não fazer teste de inserção pois pode causar problemas de RLS
      // Em vez disso, assumir que se pode ler, pode inserir
      const canInsert = canRead;

      return {
        canRead,
        canInsert,
        error: readError?.message
      };

    } catch (error) {
      console.error('Erro na verificação de permissões:', error);
      return {
        canRead: false,
        canInsert: false,
        error: error instanceof Error ? error.message : 'Erro na verificação'
      };
    }
  }

  /**
   * Converte CreateContactInput para formato webhook
   */
  private convertToWebhookFormat(input: CreateContactInput): N8nLeadWebhook {
    return {
      name: input.name,
      email: input.email,
      phone: input.phone,
      leadSource: (input.leadSource as any) || 'Site',
      leadSourceDetails: input.leadSourceDetails,
      company: input.company,
      position: input.position,
      budget: input.budget,
      timeline: input.timeline,
      preferences: input.preferences,
      tags: input.tags,
      priority: (input.priority as any) || 'MEDIUM',
      agentId: input.agentId,
      autoAssign: !input.agentId,
      webhookSource: 'dashboard',
      correlationId: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Calcula score inicial simplificado
   */
  private calculateInitialScore(input: CreateContactInput): number {
    let score = 50; // Score base

    // Score por fonte
    const sourceScores: Record<string, number> = {
      'Indicação': 90,
      'Site': 70,
      'WhatsApp': 65,
      'Facebook': 55,
      'Instagram': 55,
      'Google Ads': 70,
      'Email Marketing': 40,
      'Outros': 45
    };
    score += (sourceScores[input.leadSource || 'Site'] || 50) * 0.3;

    // Score por orçamento
    if (input.budget) {
      if (input.budget >= 500000) score += 20;
      else if (input.budget >= 300000) score += 15;
      else if (input.budget >= 150000) score += 10;
      else score += 5;
    }

    // Score por completude dos dados
    let completeness = 0;
    if (input.email) completeness += 10;
    if (input.phone) completeness += 10;
    if (input.company) completeness += 5;
    if (input.timeline) completeness += 5;
    score += completeness;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // --------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS DE DIAGNÓSTICO
  // --------------------------------------------------------------------------

  /**
   * Testa conectividade com ambos os sistemas
   */
  async testConnectivity(): Promise<{
    supabase: { available: boolean; error?: string };
    n8n: { available: boolean; error?: string };
  }> {
    const supabaseTest = await this.checkSupabasePermissions();
    
    let n8nTest = { available: false, error: 'Não configurado' };
    try {
      const response = await fetch(WEBHOOK_CONFIG.n8nWebhookUrl.replace('/webhook/', '/health') || 'http://localhost:5678/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      n8nTest = { available: response.ok };
    } catch (error) {
      n8nTest = { 
        available: false, 
        error: error instanceof Error ? error.message : 'Erro de conectividade' 
      };
    }

    return {
      supabase: {
        available: supabaseTest.canRead && supabaseTest.canInsert,
        error: supabaseTest.error
      },
      n8n: n8nTest
    };
  }

  /**
   * Retorna configuração atual
   */
  getConfig() {
    return {
      ...WEBHOOK_CONFIG,
      hasN8nUrl: !!WEBHOOK_CONFIG.n8nWebhookUrl
    };
  }
}

// ============================================================================
// INSTÂNCIA E EXPORTAÇÃO
// ============================================================================

export const leadWebhookService = new LeadWebhookService();
export default leadWebhookService;