import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  DashboardKpis,
  SalesPerformanceData,
  NewPropertiesPerformanceData,
  RecentActivity,
} from '@/integrations/supabase/types';

// TODO: Definir tipos de retorno com base no que as funções SQL retornam.
// Por enquanto, usaremos 'any' como placeholder.

/**
 * Hook para buscar os KPIs do dashboard.
 * Chama a função SQL `get_dashboard_kpis`.
 */
export const useDashboardKpis = (companyId: string) => {
  return useQuery<DashboardKpis | null, Error>({
    queryKey: ['dashboard-kpis', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        p_company_id: companyId,
      });

      if (error) {
        console.error('Erro ao buscar KPIs do dashboard:', error.message);
        throw new Error(`Erro ao buscar KPIs: ${error.message}`);
      }

      // A RPC retorna um array com um único objeto, então pegamos o primeiro elemento.
      return data?.[0] ?? null;
    },
    enabled: !!companyId,
  });
};

/**
 * Hook para buscar dados de performance de vendas.
 * Chama a função SQL `get_sales_performance`.
 */
export const useSalesPerformance = (companyId: string, months: number = 6) => {
  return useQuery<SalesPerformanceData[] | null, Error>({
    queryKey: ['sales-performance', companyId, months],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase.rpc('get_sales_performance', {
        p_company_id: companyId,
        p_months: months,
      });

      if (error) {
        console.error('Erro ao buscar performance de vendas:', error.message);
        throw new Error(`Erro ao buscar performance de vendas: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!companyId,
  });
};

/**
 * Hook para buscar dados de performance de novas propriedades.
 * Chama a função SQL `get_new_properties_performance`.
 */
export const useNewPropertiesPerformance = (companyId: string, months: number = 6) => {
  return useQuery<NewPropertiesPerformanceData[] | null, Error>({
    queryKey: ['new-properties-performance', companyId, months],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase.rpc('get_new_properties_performance', {
        p_company_id: companyId,
        p_months: months,
      });

      if (error) {
        console.error('Erro ao buscar performance de novas propriedades:', error.message);
        throw new Error(`Erro ao buscar performance de novas propriedades: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!companyId,
  });
};

/**
 * Hook para buscar atividades recentes.
 * Chama a função SQL `get_recent_activities`.
 */
export const useRecentActivities = (companyId: string, limit: number = 5) => {
  return useQuery<RecentActivity[] | null, Error>({
    queryKey: ['recent-activities', companyId, limit],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase.rpc('get_recent_activities', {
        p_company_id: companyId,
        p_limit: limit,
      });

      if (error) {
        console.error('Erro ao buscar atividades recentes:', error.message);
        throw new Error(`Erro ao buscar atividades recentes: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!companyId,
  });
}; 