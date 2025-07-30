import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { chatSummaryService, ChatSummary, SummaryRequest, SummaryConfig } from '@/services/chatSummaryService';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Chaves para query cache
const QUERY_KEYS = {
  summary: (chatId: string) => ['chat-summary', chatId],
  summaryStats: () => ['chat-summary-stats'],
  batchSummariesStatus: (requestId: string) => ['batch-summaries', requestId]
};

// Hook para buscar resumo de um chat (com cache)
export const useChatSummary = (chatId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.summary(chatId!),
    queryFn: () => chatSummaryService.getCachedSummary(chatId!),
    enabled: !!user && !!chatId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1
  });
};

// Hook para gerar resumo de um chat
export const useGenerateSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, config }: { 
      request: SummaryRequest; 
      config?: SummaryConfig;
    }) => chatSummaryService.getSummary(request, config),
    onSuccess: (newSummary, variables) => {
      // Atualizar cache do resumo
      queryClient.setQueryData(
        QUERY_KEYS.summary(variables.request.chatId),
        newSummary
      );

      // Invalidar estatísticas
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.summaryStats() 
      });

      toast({
        title: 'Resumo gerado',
        description: 'Resumo da conversa criado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao gerar resumo',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para regenerar resumo (forçar nova geração)
export const useRegenerateSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, config }: { 
      request: SummaryRequest; 
      config?: SummaryConfig;
    }) => chatSummaryService.getSummary({ ...request, forceRegenerate: true }, config),
    onSuccess: (newSummary, variables) => {
      // Atualizar cache
      queryClient.setQueryData(
        QUERY_KEYS.summary(variables.request.chatId),
        newSummary
      );

      // Invalidar estatísticas
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.summaryStats() 
      });

      toast({
        title: 'Resumo atualizado',
        description: 'Resumo da conversa foi regenerado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao regenerar resumo',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para gerar múltiplos resumos em lote
export const useGenerateBatchSummaries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requests, config }: { 
      requests: SummaryRequest[]; 
      config?: SummaryConfig;
    }) => chatSummaryService.generateBatchSummaries(requests, config),
    onSuccess: (summaries) => {
      // Atualizar cache para cada resumo
      summaries.forEach(summary => {
        queryClient.setQueryData(
          QUERY_KEYS.summary(summary.chatId),
          summary
        );
      });

      // Invalidar estatísticas
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.summaryStats() 
      });

      toast({
        title: 'Resumos gerados',
        description: `${summaries.length} resumos criados com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao gerar resumos',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook para estatísticas de resumos
export const useSummaryStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.summaryStats(),
    queryFn: () => chatSummaryService.getSummaryStats(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });
};

// Hook para limpar cache de resumos
export const useClearSummaryCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId?: string) => chatSummaryService.clearSummaryCache(chatId),
    onSuccess: (_, chatId) => {
      if (chatId) {
        // Remover resumo específico do cache
        queryClient.removeQueries({ 
          queryKey: QUERY_KEYS.summary(chatId) 
        });
      } else {
        // Limpar todos os resumos
        queryClient.removeQueries({ 
          queryKey: ['chat-summary'] 
        });
      }

      // Invalidar estatísticas
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.summaryStats() 
      });

      toast({
        title: 'Cache limpo',
        description: chatId ? 'Resumo removido do cache' : 'Todos os resumos foram limpos',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao limpar cache',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Hook composto para gerenciamento completo de resumos
export const useChatSummaryManager = (chatId?: string) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CREATOR';

  // Queries
  const summaryQuery = useChatSummary(chatId);
  const statsQuery = useSummaryStats();

  // Mutations
  const generateMutation = useGenerateSummary();
  const regenerateMutation = useRegenerateSummary();
  const batchMutation = useGenerateBatchSummaries();
  const clearCacheMutation = useClearSummaryCache();

  // Funções de conveniência
  const generateSummary = useCallback((
    messages: SummaryRequest['messages'],
    config?: SummaryConfig
  ) => {
    if (!chatId) return Promise.reject('Chat ID é obrigatório');
    
    const request: SummaryRequest = {
      chatId,
      messages
    };

    return generateMutation.mutateAsync({ request, config });
  }, [chatId, generateMutation]);

  const regenerateSummary = useCallback((
    messages: SummaryRequest['messages'],
    config?: SummaryConfig
  ) => {
    if (!chatId) return Promise.reject('Chat ID é obrigatório');
    
    const request: SummaryRequest = {
      chatId,
      messages,
      forceRegenerate: true
    };

    return regenerateMutation.mutateAsync({ request, config });
  }, [chatId, regenerateMutation]);

  const generateBatchSummaries = useCallback((
    requests: SummaryRequest[],
    config?: SummaryConfig
  ) => {
    return batchMutation.mutateAsync({ requests, config });
  }, [batchMutation]);

  const clearCache = useCallback((targetChatId?: string) => {
    return clearCacheMutation.mutateAsync(targetChatId || chatId);
  }, [clearCacheMutation, chatId]);

  // Utilitários para análise do resumo
  const getSummaryInsights = useCallback((summary?: ChatSummary) => {
    if (!summary) return null;

    return {
      hasHighPriority: summary.priority === 'high',
      isPositive: summary.sentiment === 'positive',
      isNegative: summary.sentiment === 'negative',
      hasNextAction: !!summary.nextAction,
      isReliable: summary.confidence > 0.7,
      isRecent: Date.now() - summary.generatedAt.getTime() < 24 * 60 * 60 * 1000, // 24h
      wordCount: summary.wordCount,
      keyPointsCount: summary.keyPoints.length
    };
  }, []);

  const shouldRegenerateSummary = useCallback((summary?: ChatSummary) => {
    if (!summary) return true;
    
    const insights = getSummaryInsights(summary);
    if (!insights) return true;

    // Regenerar se for antigo (mais de 24h) ou pouco confiável
    return !insights.isRecent || !insights.isReliable;
  }, [getSummaryInsights]);

  // Status de processamento
  const isProcessing = generateMutation.isPending || 
                      regenerateMutation.isPending || 
                      batchMutation.isPending;

  const canGenerateSummary = !!chatId && !!user;
  const canViewSummaries = !!user;
  const canManageSummaries = isAdmin;

  return {
    // Data
    summary: summaryQuery.data,
    stats: statsQuery.data,
    insights: getSummaryInsights(summaryQuery.data),
    
    // Loading states
    isLoading: summaryQuery.isLoading || statsQuery.isLoading,
    isProcessing,
    isError: summaryQuery.isError,
    error: summaryQuery.error,
    
    // Actions
    generateSummary,
    regenerateSummary,
    generateBatchSummaries,
    clearCache,
    
    // Action states
    isGenerating: generateMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
    isBatchProcessing: batchMutation.isPending,
    isClearingCache: clearCacheMutation.isPending,
    
    // Utilities
    shouldRegenerateSummary: shouldRegenerateSummary(summaryQuery.data),
    hasSummary: !!summaryQuery.data,
    
    // Permissions
    canGenerateSummary,
    canViewSummaries,
    canManageSummaries,
    
    // Refresh
    refetch: () => {
      summaryQuery.refetch();
      statsQuery.refetch();
    }
  };
};

// Hook para análise avançada de resumos (para admin)
export const useSummaryAnalytics = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CREATOR';

  const statsQuery = useSummaryStats();

  const analytics = useCallback(() => {
    const stats = statsQuery.data;
    if (!stats) return null;

    const total = stats.totalSummaries;
    if (total === 0) return null;

    return {
      // Distribuições percentuais
      sentimentDistribution: {
        positive: ((stats.sentimentDistribution.positive || 0) / total * 100).toFixed(1),
        neutral: ((stats.sentimentDistribution.neutral || 0) / total * 100).toFixed(1),
        negative: ((stats.sentimentDistribution.negative || 0) / total * 100).toFixed(1)
      },
      priorityDistribution: {
        high: ((stats.priorityDistribution.high || 0) / total * 100).toFixed(1),
        medium: ((stats.priorityDistribution.medium || 0) / total * 100).toFixed(1),
        low: ((stats.priorityDistribution.low || 0) / total * 100).toFixed(1)
      },
      
      // Métricas de qualidade
      averageConfidence: (stats.averageConfidence * 100).toFixed(1),
      qualityScore: stats.averageConfidence > 0.7 ? 'Alta' : 
                   stats.averageConfidence > 0.4 ? 'Média' : 'Baixa',
      
      // Insights
      mostCommonSentiment: Object.entries(stats.sentimentDistribution)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral',
      mostCommonPriority: Object.entries(stats.priorityDistribution)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'medium',
      
      // Totais
      totalSummaries: total
    };
  }, [statsQuery.data]);

  return {
    analytics: analytics(),
    isLoading: statsQuery.isLoading,
    isError: statsQuery.isError,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
    canViewAnalytics: isAdmin
  };
};