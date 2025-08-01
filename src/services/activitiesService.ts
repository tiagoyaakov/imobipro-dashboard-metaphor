// ================================================================
// SERVIÇO DE ATIVIDADES - FEED EM TEMPO REAL
// ================================================================
// Data: 01/02/2025
// Descrição: Serviço para feed de atividades com atualizações em tempo real
// Features: WebSockets, cache inteligente, filtragem avançada
// ================================================================

import { supabase } from '@/integrations/supabase/client';
import type { 
  RecentActivity, 
  ActivityFilter, 
  ActivityType,
  ActivityPriority 
} from '@/types/activities';

// ================================================================
// TIPOS ESPECÍFICOS DO SERVIÇO
// ================================================================

export interface ActivityCreateData {
  type: ActivityType;
  description: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  priority?: ActivityPriority;
}

export interface ActivityServiceOptions {
  enableRealtime?: boolean;
  bufferSize?: number;
  maxRetries?: number;
  onError?: (error: Error) => void;
  onActivity?: (activity: RecentActivity) => void;
}

// ================================================================
// CLASSE PRINCIPAL DO SERVIÇO
// ================================================================

class ActivitiesService {
  private realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
  private activityBuffer: RecentActivity[] = [];
  private options: ActivityServiceOptions;
  private isListening = false;

  constructor(options: ActivityServiceOptions = {}) {
    this.options = {
      enableRealtime: true,
      bufferSize: 100,
      maxRetries: 3,
      ...options,
    };
  }

  // ================================================================
  // MÉTODOS PRINCIPAIS DE BUSCA
  // ================================================================

  /**
   * Buscar atividades recentes com filtros
   */
  async getRecentActivities(
    limit: number = 20, 
    filters: ActivityFilter = {}
  ): Promise<RecentActivity[]> {
    try {
      let query = supabase
        .from('Activity')
        .select(`
          id,
          type,
          description,
          entityId,
          entityType,
          metadata,
          createdAt,
          user:userId!inner (
            id,
            name,
            email,
            avatarUrl
          )
        `);

      // Aplicar filtros
      if (filters.userId) {
        query = query.eq('userId', filters.userId);
      }

      if (filters.entityType) {
        query = query.eq('entityType', filters.entityType);
      }

      if (filters.types && filters.types.length > 0) {
        query = query.in('type', filters.types);
      }

      if (filters.dateFrom) {
        query = query.gte('createdAt', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('createdAt', filters.dateTo);
      }

      // Aplicar ordenação e limite
      query = query
        .order('createdAt', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar atividades: ${error.message}`);
      }

      return this.mapActivitiesData(data || []);

    } catch (error) {
      console.error('Erro no getRecentActivities:', error);
      throw error;
    }
  }

  /**
   * Buscar atividades agrupadas por tipo
   */
  async getActivitiesByType(
    timeRange: 'today' | 'week' | 'month' = 'today'
  ): Promise<Record<ActivityType, RecentActivity[]>> {
    try {
      const dateFrom = this.getDateFromRange(timeRange);

      const { data, error } = await supabase
        .from('Activity')
        .select(`
          id,
          type,
          description,
          entityId,
          entityType,
          metadata,
          createdAt,
          user:userId!inner (
            id,
            name,
            email,
            avatarUrl
          )
        `)
        .gte('createdAt', dateFrom)
        .order('createdAt', { ascending: false });

      if (error) {
        throw error;
      }

      const activities = this.mapActivitiesData(data || []);
      
      // Agrupar por tipo
      const grouped: Record<string, RecentActivity[]> = {};
      activities.forEach(activity => {
        if (!grouped[activity.type]) {
          grouped[activity.type] = [];
        }
        grouped[activity.type].push(activity);
      });

      return grouped as Record<ActivityType, RecentActivity[]>;

    } catch (error) {
      console.error('Erro no getActivitiesByType:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de atividades
   */
  async getActivityStats(timeRange: 'today' | 'week' | 'month' = 'week'): Promise<{
    total: number;
    byType: Record<ActivityType, number>;
    byUser: Record<string, number>;
    hourlyDistribution: { hour: number; count: number }[];
  }> {
    try {
      const dateFrom = this.getDateFromRange(timeRange);

      const { data, error } = await supabase
        .from('Activity')
        .select(`
          id,
          type,
          createdAt,
          user:userId!inner (
            id,
            name
          )
        `)
        .gte('createdAt', dateFrom);

      if (error) {
        throw error;
      }

      const activities = data || [];
      
      // Estatísticas por tipo
      const byType: Record<string, number> = {};
      activities.forEach(activity => {
        byType[activity.type] = (byType[activity.type] || 0) + 1;
      });

      // Estatísticas por usuário
      const byUser: Record<string, number> = {};
      activities.forEach(activity => {
        const userName = activity.user?.name || 'Sistema';
        byUser[userName] = (byUser[userName] || 0) + 1;
      });

      // Distribuição por hora
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: 0,
      }));

      activities.forEach(activity => {
        const hour = new Date(activity.createdAt).getHours();
        hourlyDistribution[hour].count++;
      });

      return {
        total: activities.length,
        byType: byType as Record<ActivityType, number>,
        byUser,
        hourlyDistribution,
      };

    } catch (error) {
      console.error('Erro no getActivityStats:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS DE CRIAÇÃO
  // ================================================================

  /**
   * Criar nova atividade
   */
  async createActivity(activityData: ActivityCreateData): Promise<RecentActivity> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('Activity')
        .insert({
          type: activityData.type,
          description: activityData.description,
          entityId: activityData.entityId,
          entityType: activityData.entityType,
          metadata: activityData.metadata || {},
          userId: user.id,
        })
        .select(`
          id,
          type,
          description,
          entityId,
          entityType,
          metadata,
          createdAt,
          user:userId!inner (
            id,
            name,
            email,
            avatarUrl
          )
        `)
        .single();

      if (error) {
        throw new Error(`Erro ao criar atividade: ${error.message}`);
      }

      const activity = this.mapActivityData(data);
      
      // Adicionar ao buffer local
      this.addToBuffer(activity);

      return activity;

    } catch (error) {
      console.error('Erro no createActivity:', error);
      throw error;
    }
  }

  /**
   * Criar atividade em lote
   */
  async createBulkActivities(activitiesData: ActivityCreateData[]): Promise<RecentActivity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const insertData = activitiesData.map(activity => ({
        type: activity.type,
        description: activity.description,
        entityId: activity.entityId,
        entityType: activity.entityType,
        metadata: activity.metadata || {},
        userId: user.id,
      }));

      const { data, error } = await supabase
        .from('Activity')
        .insert(insertData)
        .select(`
          id,
          type,
          description,
          entityId,
          entityType,
          metadata,
          createdAt,
          user:userId!inner (
            id,
            name,
            email,
            avatarUrl
          )
        `);

      if (error) {
        throw new Error(`Erro ao criar atividades em lote: ${error.message}`);
      }

      const activities = this.mapActivitiesData(data || []);
      
      // Adicionar ao buffer local
      activities.forEach(activity => this.addToBuffer(activity));

      return activities;

    } catch (error) {
      console.error('Erro no createBulkActivities:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS TEMPO REAL
  // ================================================================

  /**
   * Iniciar escuta de atividades em tempo real
   */
  startRealtimeListening(): void {
    if (!this.options.enableRealtime || this.isListening) {
      return;
    }

    try {
      this.realtimeChannel = supabase
        .channel('activities-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Activity',
          },
          (payload) => {
            this.handleRealtimeInsert(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Activity',
          },
          (payload) => {
            this.handleRealtimeUpdate(payload.new, payload.old);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isListening = true;
            console.log('✅ Escuta de atividades em tempo real iniciada');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Erro na conexão de tempo real de atividades');
            this.options.onError?.(new Error('Erro na conexão de tempo real'));
          }
        });

    } catch (error) {
      console.error('Erro ao iniciar escuta em tempo real:', error);
      this.options.onError?.(error as Error);
    }
  }

  /**
   * Parar escuta de atividades em tempo real
   */
  stopRealtimeListening(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
      this.isListening = false;
      console.log('🔌 Escuta de atividades em tempo real parada');
    }
  }

  // ================================================================
  // MÉTODOS DE CACHE E BUFFER
  // ================================================================

  /**
   * Obter atividades do buffer local
   */
  getBufferedActivities(): RecentActivity[] {
    return [...this.activityBuffer];
  }

  /**
   * Limpar buffer de atividades
   */
  clearBuffer(): void {
    this.activityBuffer = [];
  }

  /**
   * Adicionar atividade ao buffer
   */
  private addToBuffer(activity: RecentActivity): void {
    this.activityBuffer.unshift(activity);
    
    // Manter tamanho do buffer
    if (this.activityBuffer.length > (this.options.bufferSize || 100)) {
      this.activityBuffer = this.activityBuffer.slice(0, this.options.bufferSize);
    }

    // Notificar callback
    this.options.onActivity?.(activity);
  }

  // ================================================================
  // HANDLERS DE TEMPO REAL
  // ================================================================

  private async handleRealtimeInsert(newRecord: any): Promise<void> {
    try {
      // Buscar dados completos da atividade
      const { data, error } = await supabase
        .from('Activity')
        .select(`
          id,
          type,
          description,
          entityId,
          entityType,
          metadata,
          createdAt,
          user:userId!inner (
            id,
            name,
            email,
            avatarUrl
          )
        `)
        .eq('id', newRecord.id)
        .single();

      if (error) {
        console.error('Erro ao buscar atividade em tempo real:', error);
        return;
      }

      const activity = this.mapActivityData(data);
      this.addToBuffer(activity);

    } catch (error) {
      console.error('Erro no handleRealtimeInsert:', error);
    }
  }

  private handleRealtimeUpdate(newRecord: any, oldRecord: any): void {
    // Atualizar atividade no buffer se existir
    const index = this.activityBuffer.findIndex(a => a.id === newRecord.id);
    if (index !== -1) {
      // Remover atividade antiga e buscar nova versão
      this.activityBuffer.splice(index, 1);
      this.handleRealtimeInsert(newRecord);
    }
  }

  // ================================================================
  // MÉTODOS UTILITÁRIOS
  // ================================================================

  private getDateFromRange(range: 'today' | 'week' | 'month'): string {
    const now = new Date();
    
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return monthAgo.toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private mapActivitiesData(data: any[]): RecentActivity[] {
    return data.map(item => this.mapActivityData(item));
  }

  private mapActivityData(item: any): RecentActivity {
    return {
      id: item.id,
      action: item.description,
      time: this.formatRelativeTime(item.createdAt),
      type: this.mapActivityTypeToDisplay(item.type),
      user: item.user?.name || 'Sistema',
      metadata: {
        userId: item.user?.id,
        userEmail: item.user?.email,
        userAvatar: item.user?.avatarUrl,
        entityId: item.entityId,
        entityType: item.entityType,
        originalType: item.type,
        rawData: item.metadata,
        timestamp: item.createdAt,
      },
    };
  }

  private mapActivityTypeToDisplay(type: string): 'property' | 'contact' | 'appointment' | 'deal' | 'other' {
    const typeMap: Record<string, 'property' | 'contact' | 'appointment' | 'deal' | 'other'> = {
      'PROPERTY_CREATED': 'property',
      'PROPERTY_UPDATED': 'property',
      'PROPERTY_DELETED': 'property',
      'CONTACT_CREATED': 'contact',
      'CONTACT_UPDATED': 'contact',
      'CONTACT_DELETED': 'contact',
      'APPOINTMENT_SCHEDULED': 'appointment',
      'APPOINTMENT_UPDATED': 'appointment',
      'APPOINTMENT_CANCELED': 'appointment',
      'DEAL_CREATED': 'deal',
      'DEAL_UPDATED': 'deal',
      'DEAL_CLOSED': 'deal',
    };

    return typeMap[type] || 'other';
  }

  private formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR');
  }

  // ================================================================
  // CLEANUP
  // ================================================================

  dispose(): void {
    this.stopRealtimeListening();
    this.clearBuffer();
  }
}

// ================================================================
// INSTÂNCIA SINGLETON
// ================================================================

export const activitiesService = new ActivitiesService();
export default activitiesService;