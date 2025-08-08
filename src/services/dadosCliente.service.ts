import { BaseService } from './base.service'
import { supabase } from '@/lib/supabase-client'
import { EventBus, SystemEvents } from '@/lib/event-bus'

// ========================================
// TIPOS PARA NOVA TABELA dados_cliente
// ========================================

// Tipos básicos para dados_cliente (CORRIGIDO para coincidir com tabela real)
export interface DadosCliente {
  id: number  // integer no Supabase
  nome?: string | null
  telefone: string
  email?: string | null
  status?: string | null  // default 'novos'
  funcionario?: string | null  // UUID do corretor responsável
  observacoes?: string | null
  sessionid?: string | null
  portal?: string | null
  data_agendamento?: string | null
  confirmacao?: string | null
  interesse?: string | null
  preco?: string | null
  imovel_interesse?: string | null
  created_at?: string
  updated_at?: string
}

export interface DadosClienteInsert {
  nome?: string | null  // opcional no insert
  telefone: string      // obrigatório
  email?: string | null
  status?: string | null  // default será aplicado pelo banco
  funcionario?: string | null
  observacoes?: string | null
  sessionid?: string | null
  portal?: string | null
  data_agendamento?: string | null
  confirmacao?: string | null
  interesse?: string | null
  preco?: string | null
  imovel_interesse?: string | null
}

export interface DadosClienteUpdate {
  nome?: string | null
  telefone?: string
  email?: string | null
  status?: string | null
  funcionario?: string | null
  observacoes?: string | null
  sessionid?: string | null
  portal?: string | null
  data_agendamento?: string | null
  confirmacao?: string | null
  interesse?: string | null
  preco?: string | null
  imovel_interesse?: string | null
}

// ========================================
// INTERFACES
// ========================================

// Filtros específicos para dados_cliente
export interface DadosClienteFilters {
  status?: string
  funcionario?: string
  search?: string
  telefone?: string
  email?: string
  portal?: string
  interesse?: string
}

// Estatísticas de clientes
export interface DadosClienteStats {
  total: number
  byStatus: Record<string, number>
  avgScore: number
  qualified: number
  converted: number
  lost: number
  withNextAction: number
  recentInteractions: number
}

// ========================================
// SERVICE CLASS  
// ========================================

export class DadosClienteService {
  private tableName = 'dados_cliente'
  
  constructor() {}

  // Aplicar RLS baseado no usuário logado
  private async applyRLS(query: any) {
    // Confiar nas policies de RLS no servidor; não aplicar filtros adicionais no client
    // Mantemos apenas uma checagem leve de sessão
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    return query
  }

  // Buscar todos os clientes com filtros
  async findAll(options?: {
    filters?: DadosClienteFilters
    orderBy?: string
    ascending?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })

      // Aplicar RLS
      query = await this.applyRLS(query)

      // Aplicar filtros específicos
      if (options?.filters) {
        const filters = options.filters
        
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.funcionario) query = query.eq('funcionario', filters.funcionario)
        if (filters.telefone) query = query.eq('telefone', filters.telefone)
        if (filters.email) query = query.eq('email', filters.email)
        if (filters.portal) query = query.eq('portal', filters.portal)
        if (filters.interesse) query = query.eq('interesse', filters.interesse)
        
        // Busca textual (apenas campos que existem)
        if (filters.search) {
          query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`)
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      } else {
        // Ordenação padrão: data de criação
        query = query.order('created_at', { ascending: false })
      }

      // Aplicar paginação
      if (options?.limit) {
        query = query.limit(options.limit)
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1)
        }
      }

      const { data, error, count } = await query

      if (error) throw error

      return { data, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar por ID
  async findById(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Criar novo cliente - VERSÃO SIMPLIFICADA SEM RLS
  async create(cliente: DadosClienteInsert) {
    try {
      const tsStart = new Date().toISOString();
      console.log('🔥 [SERVICE][create:start]', tsStart, { input: cliente });
      
      // VERIFICAR USUÁRIO AUTENTICADO ANTES DA INSERÇÃO
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('🔥 [ERROR] Usuário não autenticado');
        throw new Error('User not authenticated');
      }

      // VERIFICAR SE USUÁRIO EXISTE NA TABELA User
      const { data: profile } = await supabase
        .from('User')
        .select('id, role, companyId')
        .eq('id', user.id)
        .single()
      
      if (!profile) {
        console.error('🔥 [ERROR] Perfil do usuário não encontrado:', user.id);
        throw new Error('User profile not found');
      }

      console.log('🔥 [SERVICE][create:user]', { id: profile.id, role: profile.role, companyId: profile.companyId });

      // Preparar dados do cliente
      const clienteWithDefaults: DadosClienteInsert = {
        nome: cliente.nome?.trim() || null,
        telefone: cliente.telefone?.trim() || '',  // obrigatório
        email: cliente.email?.trim() || null,
        status: cliente.status || 'novos',
        funcionario: cliente.funcionario || null,  // será definido pela regra de negócio
        observacoes: cliente.observacoes?.trim() || null,
        portal: cliente.portal?.trim() || null,
        interesse: cliente.interesse?.trim() || null
      }

      console.log('🔥 [SERVICE][create:payload]', clienteWithDefaults);

      // INSERÇÃO COM VERIFICAÇÃO DE AUTENTICAÇÃO
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(clienteWithDefaults)
        .select(`
          id,
          nome,
          telefone,
          email,
          status,
          funcionario,
          observacoes,
          portal,
          interesse,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error('🔥 [SERVICE][create:error]', {
          message: (error as any)?.message,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint
        });
        // Propagar erro original para o modal exibir corretamente
        throw error;
      }

      console.log('🔥 [SERVICE][create:success]', { id: data?.id, funcionario: data?.funcionario, status: data?.status });
      
      // Emitir evento se possível
      try {
        EventBus.emit(SystemEvents.CONTACT_CREATED, {
          contactId: data?.id,
          userId: clienteWithDefaults.funcionario
        });
      } catch (eventError) {
        console.warn('🔥 [WARN] Erro ao emitir evento (não crítico):', eventError);
      }

      return { data, error: null };
    } catch (error) {
      console.error('🔥 [SERVICE][create:fatal]', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      return { data: null, error: error as Error };
    }
  }

  // Atualizar cliente
  async update(id: string, updates: DadosClienteUpdate) {
    try {
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      let query = supabase
        .from(this.tableName)
        .update(updatesWithTimestamp)
        .eq('id', id)
        .select()
        .single()

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Deletar cliente
  async delete(id: string) {
    try {
      let query = supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      // Aplicar RLS
      query = await this.applyRLS(query)

      const { error } = await query

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Atualizar status do cliente no funil
  async updateStatus(id: string, newStatus: DadosCliente['status'], observacoes?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Buscar cliente atual
      const { data: cliente } = await this.findById(id)
      if (!cliente) throw new Error('Cliente não encontrado')

      const oldStatus = cliente.status

      // Atualizar status
      const updates: DadosClienteUpdate = {
        status: newStatus,
        ...(observacoes && { observacoes })
      }

      const { data, error } = await this.update(id, updates)
      if (error) throw error

      // Emitir evento
      EventBus.emit(SystemEvents.CONTACT_STAGE_CHANGED, {
        contactId: id,
        oldStage: oldStatus,
        newStage: newStatus,
        userId: user.id
      })

      // Sistema de score será implementado posteriormente quando campos existirem

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Atualizar score do cliente (temporariamente desabilitado)
  async updateScore(id: string, score: number, reason?: string) {
    try {
      // Campo score_lead não existe na tabela atual
      console.warn('updateScore: Campo score_lead não implementado ainda')
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obter estatísticas (versão simplificada)
  async getStats(): Promise<{ data: DadosClienteStats | null; error: Error | null }> {
    try {
      // Query base com RLS
      let baseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      baseQuery = await this.applyRLS(baseQuery)

      // Total de clientes
      const { count: total } = await baseQuery

      // Por status
      const statuses = ['novos', 'contatados', 'qualificados', 'interessados', 'negociando', 'convertidos', 'perdidos']
      const statusQueries = statuses.map(async (status) => {
        let q = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', status)
        q = await this.applyRLS(q)
        const { count } = await q
        return { status, count: count || 0 }
      })

      const statusCounts = await Promise.all(statusQueries)
      const byStatus = Object.fromEntries(statusCounts.map(s => [s.status, s.count]))

      // Contadores específicos
      let qualifiedQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true }).in('status', ['qualificados', 'interessados', 'negociando'])
      qualifiedQuery = await this.applyRLS(qualifiedQuery)
      const { count: qualified } = await qualifiedQuery

      const stats: DadosClienteStats = {
        total: total || 0,
        byStatus,
        avgScore: 0, // Campo não existe ainda
        qualified: qualified || 0,
        converted: byStatus.convertidos || 0,
        lost: byStatus.perdidos || 0,
        withNextAction: 0, // Campo não existe ainda
        recentInteractions: 0 // Campo não existe ainda
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar clientes com próxima ação próxima (temporariamente desabilitado)
  async getUpcomingActions(days: number = 7) {
    try {
      // Campo proxima_acao não existe na tabela atual
      console.warn('getUpcomingActions: Campo proxima_acao não implementado ainda')
      return { data: [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Importar clientes em lote
  async importClientes(clientes: DadosClienteInsert[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Preparar clientes com defaults
      const clientesWithDefaults = clientes.map(cliente => ({
        ...cliente,
        status: cliente.status || 'novos',
        funcionario: cliente.funcionario || user.id
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(clientesWithDefaults)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

// Exportar instância única
export const dadosClienteService = new DadosClienteService()