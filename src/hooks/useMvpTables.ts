// ========================================
// HOOKS REACT PARA AS NOVAS TABELAS MVP
// Data: 05/08/2025
// Descrição: Hooks customizados para operações CRUD
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  DadosCliente,
  Chat,
  ChatMessage,
  ImoveisVivaReal4,
  InteresseImovel,
  DadosClienteFilters,
  ChatFilters,
  CreateDadosClienteInput,
  UpdateDadosClienteInput,
  CreateChatInput,
  CreateChatMessageInput,
  CreateInteresseImovelInput,
  ClienteStatus
} from '@/types/mvp-tables';

// ========================================
// 1. HOOK: useDadosCliente
// ========================================

export function useDadosCliente(filters?: DadosClienteFilters) {
  const [clientes, setClientes] = useState<DadosCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('dados_cliente').select('*');

      // Aplicar filtros
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.funcionario) {
        query = query.eq('funcionario', filters.funcionario);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.origem_lead) {
        query = query.eq('origem_lead', filters.origem_lead);
      }

      if (filters?.score_min !== undefined) {
        query = query.gte('score_lead', filters.score_min);
      }

      if (filters?.score_max !== undefined) {
        query = query.lte('score_lead', filters.score_max);
      }

      if (filters?.search) {
        query = query.or(
          `nome.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Ordenação padrão
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Erro ao carregar clientes',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const createCliente = async (input: CreateDadosClienteInput) => {
    try {
      const { data, error } = await supabase
        .from('dados_cliente')
        .insert({
          ...input,
          funcionario: input.funcionario || user?.id,
          status: input.status || 'novos',
          score_lead: 50
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Cliente criado',
        description: 'Cliente adicionado com sucesso!'
      });

      await fetchClientes();
      return data;
    } catch (err) {
      toast({
        title: 'Erro ao criar cliente',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateCliente = async (id: string, input: UpdateDadosClienteInput) => {
    try {
      const { data, error } = await supabase
        .from('dados_cliente')
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Cliente atualizado',
        description: 'Dados atualizados com sucesso!'
      });

      await fetchClientes();
      return data;
    } catch (err) {
      toast({
        title: 'Erro ao atualizar cliente',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateClienteStatus = async (id: string, status: ClienteStatus) => {
    return updateCliente(id, { status });
  };

  const deleteCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dados_cliente')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cliente removido',
        description: 'Cliente removido com sucesso!'
      });

      await fetchClientes();
    } catch (err) {
      toast({
        title: 'Erro ao remover cliente',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    clientes,
    loading,
    error,
    refetch: fetchClientes,
    createCliente,
    updateCliente,
    updateClienteStatus,
    deleteCliente
  };
}

// ========================================
// 2. HOOK: useChats
// ========================================

export function useChats(filters?: ChatFilters) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('chats').select('*');

      // Aplicar filtros
      if (filters?.funcionario) {
        query = query.eq('funcionario', filters.funcionario);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.has_unread) {
        query = query.gt('nao_lidas', 0);
      }

      if (filters?.search) {
        query = query.or(
          `telefone.ilike.%${filters.search}%,nome_contato.ilike.%${filters.search}%`
        );
      }

      // Ordenação por última mensagem
      query = query.order('ultima_mensagem_timestamp', { 
        ascending: false, 
        nullsFirst: false 
      });

      const { data, error } = await query;

      if (error) throw error;
      setChats(data || []);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Erro ao carregar conversas',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const createChat = async (input: CreateChatInput) => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          ...input,
          funcionario: input.funcionario || user?.id,
          status: 'ativo',
          nao_lidas: 0
        })
        .select()
        .single();

      if (error) throw error;

      await fetchChats();
      return data;
    } catch (err) {
      toast({
        title: 'Erro ao criar conversa',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          nao_lidas: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;
      await fetchChats();
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    loading,
    error,
    refetch: fetchChats,
    createChat,
    markAsRead
  };
}

// ========================================
// 3. HOOK: useChatMessages
// ========================================

export function useChatMessages(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Erro ao carregar mensagens',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [conversationId, toast]);

  const sendMessage = async (input: CreateChatMessageInput) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          ...input,
          conversation_id: conversationId,
          status: 'sent',
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar última mensagem no chat
      const content = input.user_message || input.resposta_agent || '';
      await supabase
        .from('chats')
        .update({
          ultima_mensagem: content.substring(0, 100),
          ultima_mensagem_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId);

      await fetchMessages();
      return data;
    } catch (err) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchMessages();

    // Configurar subscription para mensagens em tempo real
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    sendMessage
  };
}

// ========================================
// 4. HOOK: useImoveisVivaReal
// ========================================

export function useImoveisVivaReal(search?: string, limit: number = 20) {
  const [imoveis, setImoveis] = useState<ImoveisVivaReal4[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchImoveis = useCallback(async () => {
    try {
      setLoading(true);
      
      // Primeiro, obter contagem total
      const { count } = await supabase
        .from('imoveisvivareal4')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      // Buscar imóveis
      let query = supabase
        .from('imoveisvivareal4')
        .select('*')
        .limit(limit);

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,neighborhoodName.ilike.%${search}%`
        );
      }

      // Ordenar por relevância (imóveis com mais informações primeiro)
      query = query.order('created_at', { ascending: false, nullsFirst: false });

      const { data, error } = await query;

      if (error) throw error;
      setImoveis(data || []);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Erro ao carregar imóveis',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [search, limit, toast]);

  useEffect(() => {
    fetchImoveis();
  }, [fetchImoveis]);

  return {
    imoveis,
    loading,
    error,
    totalCount,
    refetch: fetchImoveis
  };
}

// ========================================
// 5. HOOK: useInteresseImoveis
// ========================================

export function useInteresseImoveis(clienteId?: string) {
  const [interesses, setInteresses] = useState<InteresseImovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchInteresses = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('interesse_imoveis').select('*');

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setInteresses(data || []);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Erro ao carregar interesses',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [clienteId, toast]);

  const createInteresse = async (input: CreateInteresseImovelInput) => {
    try {
      const { data, error } = await supabase
        .from('interesse_imoveis')
        .insert({
          ...input,
          nivel_interesse: input.nivel_interesse || 5,
          proposta_enviada: false,
          status: 'analisando'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Interesse registrado',
        description: 'Interesse no imóvel foi registrado!'
      });

      await fetchInteresses();
      return data;
    } catch (err) {
      toast({
        title: 'Erro ao registrar interesse',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateInteresse = async (id: string, nivel: number) => {
    try {
      const { error } = await supabase
        .from('interesse_imoveis')
        .update({ 
          nivel_interesse: nivel,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Interesse atualizado',
        description: 'Nível de interesse foi atualizado!'
      });

      await fetchInteresses();
    } catch (err) {
      toast({
        title: 'Erro ao atualizar interesse',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchInteresses();
  }, [fetchInteresses]);

  return {
    interesses,
    loading,
    error,
    refetch: fetchInteresses,
    createInteresse,
    updateInteresse
  };
}

// ========================================
// FIM DOS HOOKS MVP
// ========================================