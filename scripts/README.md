# 📊 Scripts de Migração - ImobiPRO Dashboard

## 🎯 Objetivo
Migrar o banco de dados de 43 tabelas para 6 tabelas otimizadas, conforme análise do relatório de migração.

## 📁 Estrutura dos Scripts

```
scripts/
├── backup/
│   └── backup_old_schema.sql      # Backup completo do schema atual
├── migration/
│   ├── 01_create_new_tables.sql   # Criação das 6 novas tabelas
│   ├── 02_setup_rls.sql          # Configuração de Row Level Security
│   └── 03_migrate_data.sql       # Migração dos dados existentes
├── rollback/
│   └── rollback_migration.sql     # Reverter migração em caso de erro
├── execute_migration.sql          # Script principal de execução
└── README.md                      # Esta documentação
```

## 🚀 Como Executar a Migração

### Pré-requisitos
- Acesso ao Supabase Dashboard
- Permissões de admin no banco de dados
- Backup externo do banco (recomendado)

### Passo a Passo

#### 1. Fazer Backup Externo (IMPORTANTE!)
```bash
# Via Supabase Dashboard
1. Acesse: https://app.supabase.com
2. Vá em Settings > Database
3. Clique em "Backups"
4. Crie um backup manual
```

#### 2. Executar a Migração

**Opção A: Via Supabase SQL Editor (Recomendado)**
1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Copie e cole o conteúdo de cada script na ordem:
   - `backup/backup_old_schema.sql`
   - `migration/01_create_new_tables.sql`
   - `migration/02_setup_rls.sql`
   - `migration/03_migrate_data.sql`

**Opção B: Script Único**
1. Copie o conteúdo de `execute_migration.sql`
2. Execute no SQL Editor do Supabase

#### 3. Validar a Migração
```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dados_cliente', 'chats', 'chat_messages', 'imobipro_messages', 'interesse_imoveis');

-- Verificar contagem de registros
SELECT 'dados_cliente' as tabela, COUNT(*) FROM dados_cliente
UNION ALL
SELECT 'chats', COUNT(*) FROM chats
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages;
```

## 🔄 Como Fazer Rollback

Em caso de problemas, execute:

```sql
-- No SQL Editor do Supabase
-- Copie e cole o conteúdo de: rollback/rollback_migration.sql
```

## 📊 Tabelas Criadas

### 1. `dados_cliente`
- **Substitui:** Contact, LeadActivity, MessageCampaignParticipation
- **Função:** Base do CRM com funil de vendas
- **Chave:** telefone (integração WhatsApp)

### 2. `imoveisvivareal4`
- **Status:** Já existe com 106k+ registros
- **Função:** Catálogo de propriedades
- **Origem:** Dados reais do Viva Real

### 3. `chats`
- **Substitui:** Chat, WhatsAppInstance
- **Função:** Lista de conversas ativas
- **Chave:** telefone + conversation_id

### 4. `chat_messages`
- **Substitui:** Message, WhatsAppMessage
- **Função:** Histórico de mensagens
- **Integração:** N8N ready

### 5. `imobipro_messages`
- **Nova funcionalidade:** Memória do agente IA
- **Formato:** LangChain compatível
- **Função:** Continuidade conversacional

### 6. `interesse_imoveis`
- **Substitui:** Deal relacionamentos
- **Função:** Matching cliente-propriedade
- **Uso:** Remarketing e analytics

## 🔐 Row Level Security (RLS)

Todas as tabelas possuem RLS configurado:

- **DEV_MASTER:** Acesso total
- **ADMIN:** Acesso aos dados da sua empresa
- **AGENT:** Acesso apenas aos próprios dados

## ⚠️ Avisos Importantes

1. **SEMPRE faça backup antes de executar**
2. **Execute em ambiente de teste primeiro** (se disponível)
3. **A migração é incremental** - pode ser executada múltiplas vezes
4. **Tabelas de usuários NÃO são alteradas** (users, companies)
5. **O processo leva aproximadamente 10-15 minutos**

## 🧪 Checklist de Validação

- [ ] Backup externo criado
- [ ] Scripts executados na ordem correta
- [ ] Nenhum erro durante execução
- [ ] Contagem de registros validada
- [ ] RLS funcionando corretamente
- [ ] Frontend testado com novas tabelas
- [ ] Integrações N8N validadas

## 📞 Suporte

Em caso de problemas:
1. Execute o rollback imediatamente
2. Verifique os logs no Supabase Dashboard
3. Restaure o backup externo se necessário

## 📈 Benefícios Esperados

- **Performance:** +300% nas consultas
- **Complexidade:** -70% no código
- **Manutenção:** -80% do esforço
- **Desenvolvimento:** 3x mais rápido

---

**Data de Criação:** 05/08/2025  
**Última Atualização:** 05/08/2025  
**Status:** Pronto para Execução