-- ========================================
-- SCRIPT 1: CRIAÇÃO DAS NOVAS TABELAS MVP
-- Data: 05/08/2025
-- Descrição: Criação das 6 tabelas simplificadas
-- ========================================

-- 1. TABELA: dados_cliente
-- Substitui: Contact, LeadActivity, MessageCampaignParticipation
CREATE TABLE IF NOT EXISTS public.dados_cliente (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL, -- Chave de integração WhatsApp
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'novos' CHECK (status IN ('novos', 'contatados', 'qualificados', 'interessados', 'negociando', 'convertidos', 'perdidos')),
    funcionario UUID REFERENCES public.users(id), -- Corretor responsável
    observacoes TEXT,
    ultima_interacao TIMESTAMP WITH TIME ZONE,
    empresa VARCHAR(255),
    cargo VARCHAR(100),
    origem_lead VARCHAR(100),
    score_lead INTEGER DEFAULT 50 CHECK (score_lead >= 0 AND score_lead <= 100),
    tags TEXT[],
    data_conversao TIMESTAMP WITH TIME ZONE,
    proxima_acao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_dados_cliente_telefone ON public.dados_cliente(telefone);
CREATE INDEX idx_dados_cliente_funcionario ON public.dados_cliente(funcionario);
CREATE INDEX idx_dados_cliente_status ON public.dados_cliente(status);
CREATE INDEX idx_dados_cliente_created_at ON public.dados_cliente(created_at DESC);

-- 2. TABELA: imoveisvivareal4 (já existe com 106k+ registros - apenas verificar estrutura)
-- Esta tabela já existe e está populada com dados reais do Viva Real
-- Não precisa ser criada, apenas validar que existe

-- 3. TABELA: chats
-- Substitui: Chat, WhatsAppInstance
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telefone VARCHAR(20) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    nome_contato VARCHAR(255),
    funcionario UUID REFERENCES public.users(id),
    instancia VARCHAR(100), -- Separação por corretor
    status VARCHAR(50) DEFAULT 'ativo',
    ultima_mensagem TEXT,
    ultima_mensagem_timestamp TIMESTAMP WITH TIME ZONE,
    nao_lidas INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(telefone, conversation_id)
);

-- Índices para performance
CREATE INDEX idx_chats_telefone ON public.chats(telefone);
CREATE INDEX idx_chats_funcionario ON public.chats(funcionario);
CREATE INDEX idx_chats_conversation_id ON public.chats(conversation_id);
CREATE INDEX idx_chats_ultima_mensagem_timestamp ON public.chats(ultima_mensagem_timestamp DESC);

-- 4. TABELA: chat_messages
-- Substitui: Message, WhatsAppMessage
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_message TEXT,
    resposta_agent TEXT,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location')),
    is_from_me BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'sent',
    metadata JSONB, -- Dados adicionais N8N ready
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp DESC);

-- 5. TABELA: imobipro_messages
-- Nova funcionalidade: Memória do agente IA
CREATE TABLE IF NOT EXISTS public.imobipro_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255),
    telefone VARCHAR(20),
    role VARCHAR(50) CHECK (role IN ('system', 'user', 'assistant', 'function')),
    content TEXT NOT NULL,
    langchain_format JSONB, -- JSON LangChain compatível
    tokens_used INTEGER,
    model_used VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_imobipro_messages_session_id ON public.imobipro_messages(session_id);
CREATE INDEX idx_imobipro_messages_conversation_id ON public.imobipro_messages(conversation_id);
CREATE INDEX idx_imobipro_messages_telefone ON public.imobipro_messages(telefone);
CREATE INDEX idx_imobipro_messages_created_at ON public.imobipro_messages(created_at DESC);

-- 6. TABELA: interesse_imoveis
-- Substitui: Deal relacionamentos
CREATE TABLE IF NOT EXISTS public.interesse_imoveis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.dados_cliente(id) ON DELETE CASCADE,
    telefone VARCHAR(20),
    imovel_id VARCHAR(255), -- ID do imóvel em imoveisvivareal4
    tipo_interesse VARCHAR(50) CHECK (tipo_interesse IN ('venda', 'aluguel', 'ambos')),
    nivel_interesse INTEGER DEFAULT 5 CHECK (nivel_interesse >= 1 AND nivel_interesse <= 10),
    observacoes TEXT,
    data_visita TIMESTAMP WITH TIME ZONE,
    proposta_enviada BOOLEAN DEFAULT false,
    valor_proposta DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'analisando',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_interesse_imoveis_cliente_id ON public.interesse_imoveis(cliente_id);
CREATE INDEX idx_interesse_imoveis_telefone ON public.interesse_imoveis(telefone);
CREATE INDEX idx_interesse_imoveis_imovel_id ON public.interesse_imoveis(imovel_id);
CREATE INDEX idx_interesse_imoveis_created_at ON public.interesse_imoveis(created_at DESC);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Função auxiliar para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela
CREATE TRIGGER update_dados_cliente_updated_at BEFORE UPDATE ON public.dados_cliente
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interesse_imoveis_updated_at BEFORE UPDATE ON public.interesse_imoveis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMENTÁRIOS NAS TABELAS
-- ========================================

COMMENT ON TABLE public.dados_cliente IS 'Tabela principal de clientes/leads - substitui Contact, LeadActivity, MessageCampaignParticipation';
COMMENT ON TABLE public.chats IS 'Lista de conversas ativas - substitui Chat, WhatsAppInstance';
COMMENT ON TABLE public.chat_messages IS 'Histórico de mensagens SDR - substitui Message, WhatsAppMessage';
COMMENT ON TABLE public.imobipro_messages IS 'Memória do agente IA - formato LangChain compatível';
COMMENT ON TABLE public.interesse_imoveis IS 'Matching cliente-propriedade - substitui Deal relacionamentos';

-- ========================================
-- FIM DO SCRIPT
-- ========================================