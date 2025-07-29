# 🔄 Instruções para Migração do Módulo WhatsApp

## ❗ ERRO ATUAL
O módulo de Conexões está apresentando erro **"Falha ao buscar instância do agente"** porque as tabelas WhatsApp ainda não existem no banco de dados Supabase.

## 🔧 SOLUÇÃO
Execute a migração SQL no Supabase Dashboard para criar as tabelas necessárias.

---

## 📋 PASSOS PARA APLICAR A MIGRAÇÃO

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Selecione o projeto: **imobipro-dashboard**

### 2. Abra o SQL Editor
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**

### 3. Execute a Migração
- Copie todo o conteúdo do arquivo `migrations/add_whatsapp_module.sql`
- Cole no editor SQL do Supabase
- Clique em **"Run"** para executar

### 4. Verifique a Criação das Tabelas
Após executar, verifique se as seguintes tabelas foram criadas:
- ✅ `WhatsAppInstance`
- ✅ `WhatsAppConnectionLog` 
- ✅ `WhatsAppMessage`
- ✅ `WhatsAppConfig`

### 5. Verifique os Enums
Confirme se os enums foram criados:
- ✅ `WhatsAppStatus`
- ✅ `ConnectionAction`
- ✅ `MessageType`

---

## 🛡️ SEGURANÇA (RLS)
A migração já inclui:
- ✅ Row Level Security habilitado
- ✅ Políticas de acesso por usuário
- ✅ Restrições por empresa
- ✅ Proteção de dados sensíveis

---

## 🧪 TESTE APÓS MIGRAÇÃO
1. Acesse o módulo **Conexões** no dashboard
2. Clique em **"Criar Instância WhatsApp"**
3. Verifique se não há mais erros de "tabela não encontrada"

---

## 🔍 VERIFICAÇÃO DE DADOS

### SQL para verificar se as tabelas existem:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%WhatsApp%';
```

### SQL para verificar os enums:
```sql
SELECT typname 
FROM pg_type 
WHERE typname IN ('WhatsAppStatus', 'ConnectionAction', 'MessageType');
```

---

## ⚠️ IMPORTANTE
- Execute a migração **ANTES** de testar o módulo Conexões
- Faça backup do banco se necessário
- Verifique se não há conflitos com dados existentes

---

## 🆘 EM CASO DE ERRO
Se houver erro durante a execução:
1. Verifique se todas as tabelas referenciadas existem (`User`, `Company`, `Chat`, `Contact`)
2. Execute a migração em partes menores se necessário
3. Consulte os logs de erro no Supabase para detalhes

---

## ✅ APÓS EXECUTAR
Quando a migração for aplicada com sucesso, o módulo de Conexões funcionará corretamente com:
- Criação de instâncias WhatsApp
- Geração de QR codes
- Monitoramento de status
- Logs de conexão
- Configurações avançadas