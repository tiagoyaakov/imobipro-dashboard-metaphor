-- migrations/20250702140000_dashboard_functions/migration.sql

-- Habilita a extensão se ainda não estiver habilitada (necessária para datas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Função para buscar os KPIs principais do Dashboard
CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_company_id UUID)
RETURNS TABLE (
    total_properties BIGINT,
    active_clients BIGINT,
    scheduled_visits_month BIGINT,
    monthly_revenue NUMERIC,
    revenue_change_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    current_month_revenue NUMERIC;
    previous_month_revenue NUMERIC;
    revenue_change NUMERIC;
BEGIN
    -- Total de Propriedades
    SELECT COUNT(*) INTO total_properties FROM properties p
    JOIN users u ON p.agent_id = u.id
    WHERE u.company_id::uuid = p_company_id;

    -- Clientes Ativos
    SELECT COUNT(*) INTO active_clients FROM contacts c
    JOIN users u ON c.agent_id = u.id
    WHERE u.company_id::uuid = p_company_id AND c.status = 'ACTIVE';

    -- Visitas Agendadas no Mês Corrente
    SELECT COUNT(*) INTO scheduled_visits_month 
    FROM appointments a
    JOIN users u ON a.agent_id = u.id
    WHERE u.company_id::uuid = p_company_id 
      AND a.type = 'VISIT' 
      AND date_trunc('month', a.date) = date_trunc('month', CURRENT_DATE);

    -- Receita do Mês Corrente (negócios ganhos)
    SELECT COALESCE(SUM(d.value), 0) INTO current_month_revenue
    FROM deals d
    JOIN users u ON d.agent_id = u.id
    WHERE u.company_id::uuid = p_company_id 
      AND d.stage = 'WON' 
      AND date_trunc('month', d.closed_at) = date_trunc('month', CURRENT_DATE);
      
    monthly_revenue := current_month_revenue;

    -- Receita do Mês Anterior
    SELECT COALESCE(SUM(d.value), 0) INTO previous_month_revenue
    FROM deals d
    JOIN users u ON d.agent_id = u.id
    WHERE u.company_id::uuid = p_company_id
      AND d.stage = 'WON' 
      AND date_trunc('month', d.closed_at) = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month';

    -- Cálculo da Variação Percentual da Receita
    IF previous_month_revenue > 0 THEN
        revenue_change_percentage := ((current_month_revenue - previous_month_revenue) / previous_month_revenue) * 100;
    ELSEIF current_month_revenue > 0 THEN
        revenue_change_percentage := 100.0; -- Se não houve receita antes, qualquer receita agora é 100% de aumento
    ELSE
        revenue_change_percentage := 0.0;
    END IF;

    RETURN QUERY SELECT 
        total_properties,
        active_clients,
        scheduled_visits_month,
        monthly_revenue,
        revenue_change_percentage;
END;
$$;

-- 2. Função para dados do gráfico de Performance de Vendas (últimos 6 meses)
CREATE OR REPLACE FUNCTION get_sales_performance(p_company_id UUID)
RETURNS TABLE (
    month_name TEXT,
    year INT,
    total_revenue NUMERIC
)
LANGUAGE sql
AS $$
    WITH months AS (
        SELECT date_trunc('month', generate_series(CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE, '1 month')) AS month
    )
    SELECT
        to_char(m.month, 'Mon') AS month_name,
        EXTRACT(YEAR FROM m.month)::INT AS year,
        COALESCE(SUM(d.value), 0) AS total_revenue
    FROM months m
    LEFT JOIN deals d ON date_trunc('month', d.closed_at) = m.month
    JOIN users u ON d.agent_id = u.id
    WHERE u.company_id::uuid = p_company_id
        AND d.stage = 'WON'
    GROUP BY m.month
    ORDER BY m.month;
$$;

-- 3. Função para dados do gráfico de Novas Propriedades (últimos 6 meses)
CREATE OR REPLACE FUNCTION get_new_properties_performance(p_company_id UUID)
RETURNS TABLE (
    month_name TEXT,
    year INT,
    properties_count BIGINT
)
LANGUAGE sql
AS $$
    WITH months AS (
        SELECT date_trunc('month', generate_series(CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE, '1 month')) AS month
    )
    SELECT
        to_char(m.month, 'Mon') AS month_name,
        EXTRACT(YEAR FROM m.month)::INT AS year,
        COALESCE(COUNT(p.id), 0) AS properties_count
    FROM months m
    LEFT JOIN properties p ON date_trunc('month', p.created_at) = m.month
    JOIN users u ON p.agent_id = u.id
    WHERE u.company_id::uuid = p_company_id
    GROUP BY m.month
    ORDER BY m.month;
$$;


-- 4. Função para buscar as atividades recentes
CREATE OR REPLACE FUNCTION get_recent_activities(p_company_id UUID, p_limit INT)
RETURNS TABLE (
    description TEXT,
    activity_date TIMESTAMPTZ,
    type activity_type,
    user_name TEXT
)
LANGUAGE sql
AS $$
    SELECT 
        a.description,
        a.created_at as activity_date,
        a.type,
        u.name as user_name
    FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE u.company_id::uuid = p_company_id
    ORDER BY a.created_at DESC
    LIMIT p_limit;
$$; 