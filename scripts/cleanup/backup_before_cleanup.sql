-- ================================================================
-- BACKUP DE EMERGÊNCIA ANTES DA LIMPEZA FINAL
-- ================================================================
-- Data: 05/08/2025
-- Objetivo: Backup das tabelas antigas antes da remoção
-- Tabelas MVP que serão MANTIDAS: dados_cliente, imoveisvivareal4, 
-- chats, chat_messages, imobipro_messages, interesse_imoveis
-- ================================================================

-- BACKUP DE TABELAS COM DADOS CRÍTICOS
-- =====================================

-- Backup da tabela User (crítica)
CREATE TABLE IF NOT EXISTS backup_users AS 
SELECT * FROM "User";

-- Backup da tabela Company (crítica)
CREATE TABLE IF NOT EXISTS backup_companies AS 
SELECT * FROM "Company";

-- Backup da tabela Contact (dados migrados para dados_cliente)
CREATE TABLE IF NOT EXISTS backup_contacts AS 
SELECT * FROM "Contact";

-- Backup da tabela Property (dados migrados para imoveisvivareal4)
CREATE TABLE IF NOT EXISTS backup_properties AS 
SELECT * FROM "Property";

-- Backup da tabela Deal (dados migrados para interesse_imoveis)
CREATE TABLE IF NOT EXISTS backup_deals AS 
SELECT * FROM "Deal";

-- Backup da tabela Message (dados migrados para chat_messages)
CREATE TABLE IF NOT EXISTS backup_messages AS 
SELECT * FROM "Message";

-- Backup da tabela Chat (dados migrados para chats)
CREATE TABLE IF NOT EXISTS backup_chats AS 
SELECT * FROM "Chat";

-- Backup da tabela Appointment (contém dados importantes)
CREATE TABLE IF NOT EXISTS backup_appointments AS 
SELECT * FROM "Appointment";

-- Backup da tabela WhatsAppInstance (configurações importantes)
CREATE TABLE IF NOT EXISTS backup_whatsapp_instances AS 
SELECT * FROM "WhatsAppInstance";

-- Backup da tabela WhatsAppMessage (histórico importante)
CREATE TABLE IF NOT EXISTS backup_whatsapp_messages AS 
SELECT * FROM "WhatsAppMessage";

-- Log do backup (usando estrutura correta da tabela)
INSERT INTO imobipro_messages (session_id, message, data)
VALUES ('system-cleanup', '{"action": "backup", "message": "Backup de emergência realizado antes da limpeza final das tabelas"}', NOW());

-- ================================================================
-- VERIFICAÇÃO DE INTEGRIDADE
-- ================================================================

-- Verificar se as tabelas MVP existem e têm dados
SELECT 'dados_cliente' as tabela, COUNT(*) as registros FROM dados_cliente
UNION ALL
SELECT 'imoveisvivareal4' as tabela, COUNT(*) as registros FROM imoveisvivareal4
UNION ALL  
SELECT 'chats' as tabela, COUNT(*) as registros FROM chats
UNION ALL
SELECT 'chat_messages' as tabela, COUNT(*) as registros FROM chat_messages
UNION ALL
SELECT 'imobipro_messages' as tabela, COUNT(*) as registros FROM imobipro_messages
UNION ALL
SELECT 'interesse_imoveis' as tabela, COUNT(*) as registros FROM interesse_imoveis;

-- ================================================================
-- VALIDAÇÃO FINAL
-- ================================================================

-- Verificar se todas as tabelas backup foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'backup_%'
ORDER BY table_name;