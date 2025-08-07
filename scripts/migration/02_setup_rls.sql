-- ========================================
-- SCRIPT 2: CONFIGURAÇÃO DE RLS (Row Level Security)
-- Data: 05/08/2025
-- Descrição: Políticas de segurança para as novas tabelas
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.dados_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imobipro_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interesse_imoveis ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA dados_cliente
-- ========================================

-- DEV_MASTER pode ver todos os clientes
CREATE POLICY "dev_master_all_dados_cliente" ON public.dados_cliente
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    );

-- ADMIN pode ver todos os clientes da sua empresa
CREATE POLICY "admin_company_dados_cliente" ON public.dados_cliente
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u1
            WHERE u1.id = auth.uid() 
            AND u1.role = 'ADMIN'
            AND EXISTS (
                SELECT 1 FROM public.users u2
                WHERE u2.id = dados_cliente.funcionario
                AND u2.company_id = u1.company_id
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u1
            WHERE u1.id = auth.uid() 
            AND u1.role = 'ADMIN'
            AND EXISTS (
                SELECT 1 FROM public.users u2
                WHERE u2.id = dados_cliente.funcionario
                AND u2.company_id = u1.company_id
            )
        )
    );

-- AGENT pode ver apenas seus próprios clientes
CREATE POLICY "agent_own_dados_cliente" ON public.dados_cliente
    FOR ALL
    TO authenticated
    USING (
        dados_cliente.funcionario = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'AGENT'
        )
    )
    WITH CHECK (
        dados_cliente.funcionario = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'AGENT'
        )
    );

-- ========================================
-- POLÍTICAS PARA chats
-- ========================================

-- DEV_MASTER pode ver todos os chats
CREATE POLICY "dev_master_all_chats" ON public.chats
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    );

-- ADMIN pode ver todos os chats da sua empresa
CREATE POLICY "admin_company_chats" ON public.chats
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u1
            WHERE u1.id = auth.uid() 
            AND u1.role = 'ADMIN'
            AND EXISTS (
                SELECT 1 FROM public.users u2
                WHERE u2.id = chats.funcionario
                AND u2.company_id = u1.company_id
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u1
            WHERE u1.id = auth.uid() 
            AND u1.role = 'ADMIN'
            AND EXISTS (
                SELECT 1 FROM public.users u2
                WHERE u2.id = chats.funcionario
                AND u2.company_id = u1.company_id
            )
        )
    );

-- AGENT pode ver apenas seus próprios chats
CREATE POLICY "agent_own_chats" ON public.chats
    FOR ALL
    TO authenticated
    USING (
        chats.funcionario = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'AGENT'
        )
    )
    WITH CHECK (
        chats.funcionario = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'AGENT'
        )
    );

-- ========================================
-- POLÍTICAS PARA chat_messages
-- ========================================

-- Mensagens seguem a mesma política dos chats (via JOIN)
CREATE POLICY "dev_master_all_chat_messages" ON public.chat_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    );

CREATE POLICY "admin_company_chat_messages" ON public.chat_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chats c
            JOIN public.users u1 ON u1.id = auth.uid()
            JOIN public.users u2 ON u2.id = c.funcionario
            WHERE c.id = chat_messages.chat_id
            AND u1.role = 'ADMIN'
            AND u1.company_id = u2.company_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats c
            JOIN public.users u1 ON u1.id = auth.uid()
            JOIN public.users u2 ON u2.id = c.funcionario
            WHERE c.id = chat_messages.chat_id
            AND u1.role = 'ADMIN'
            AND u1.company_id = u2.company_id
        )
    );

CREATE POLICY "agent_own_chat_messages" ON public.chat_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chats c
            JOIN public.users u ON u.id = auth.uid()
            WHERE c.id = chat_messages.chat_id
            AND c.funcionario = auth.uid()
            AND u.role = 'AGENT'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats c
            JOIN public.users u ON u.id = auth.uid()
            WHERE c.id = chat_messages.chat_id
            AND c.funcionario = auth.uid()
            AND u.role = 'AGENT'
        )
    );

-- ========================================
-- POLÍTICAS PARA imobipro_messages
-- ========================================

-- Similar às políticas de chat_messages mas baseado em telefone
CREATE POLICY "dev_master_all_imobipro_messages" ON public.imobipro_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    );

CREATE POLICY "admin_company_imobipro_messages" ON public.imobipro_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND u.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND u.role = 'ADMIN'
        )
    );

CREATE POLICY "agent_own_imobipro_messages" ON public.imobipro_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dados_cliente dc
            JOIN public.users u ON u.id = auth.uid()
            WHERE dc.telefone = imobipro_messages.telefone
            AND dc.funcionario = auth.uid()
            AND u.role = 'AGENT'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dados_cliente dc
            JOIN public.users u ON u.id = auth.uid()
            WHERE dc.telefone = imobipro_messages.telefone
            AND dc.funcionario = auth.uid()
            AND u.role = 'AGENT'
        )
    );

-- ========================================
-- POLÍTICAS PARA interesse_imoveis
-- ========================================

-- DEV_MASTER pode ver todos os interesses
CREATE POLICY "dev_master_all_interesse_imoveis" ON public.interesse_imoveis
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'DEV_MASTER'
        )
    );

-- ADMIN pode ver todos os interesses de clientes da sua empresa
CREATE POLICY "admin_company_interesse_imoveis" ON public.interesse_imoveis
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dados_cliente dc
            JOIN public.users u1 ON u1.id = auth.uid()
            JOIN public.users u2 ON u2.id = dc.funcionario
            WHERE dc.id = interesse_imoveis.cliente_id
            AND u1.role = 'ADMIN'
            AND u1.company_id = u2.company_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dados_cliente dc
            JOIN public.users u1 ON u1.id = auth.uid()
            JOIN public.users u2 ON u2.id = dc.funcionario
            WHERE dc.id = interesse_imoveis.cliente_id
            AND u1.role = 'ADMIN'
            AND u1.company_id = u2.company_id
        )
    );

-- AGENT pode ver apenas interesses de seus próprios clientes
CREATE POLICY "agent_own_interesse_imoveis" ON public.interesse_imoveis
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dados_cliente dc
            JOIN public.users u ON u.id = auth.uid()
            WHERE dc.id = interesse_imoveis.cliente_id
            AND dc.funcionario = auth.uid()
            AND u.role = 'AGENT'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dados_cliente dc
            JOIN public.users u ON u.id = auth.uid()
            WHERE dc.id = interesse_imoveis.cliente_id
            AND dc.funcionario = auth.uid()
            AND u.role = 'AGENT'
        )
    );

-- ========================================
-- FIM DO SCRIPT
-- ========================================