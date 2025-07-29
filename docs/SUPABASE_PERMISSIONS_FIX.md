# 🔧 ImobiPRO - Correção de Permissões Supabase

## 🚨 Problema Identificado

O erro **403 Forbidden** na criação de leads indica que as permissões RLS (Row Level Security) da tabela `Contact` no Supabase não estão configuradas corretamente.

## ✅ Solução Implementada

Criamos um sistema híbrido que resolve o problema de duas formas:

### 1. **Sistema de Fallback Automático**
- ✅ Tenta criar via Supabase primeiro
- ✅ Se falhar, usa webhook n8n como fallback
- ✅ Logs detalhados para diagnóstico
- ✅ Interface de status em tempo real

### 2. **Script SQL de Correção**
- ✅ Corrige permissões RLS da tabela Contact
- ✅ Cria políticas de acesso apropriadas
- ✅ Função SQL para criação de leads
- ✅ Testes de permissão automatizados

## 🛠️ Como Aplicar a Correção

### Opção 1: Executar Script SQL (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: `eeceyvenrnyyqvilezgr`

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Execute o Script**
   - Copie todo o conteúdo do arquivo: `migrations/fix_contact_permissions.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

4. **Verifique o Resultado**
   - Deve aparecer mensagens de sucesso no console
   - Execute este teste: `SELECT * FROM check_contact_permissions();`

### Opção 2: Configurar Webhook n8n (Alternativa)

Se preferir usar n8n como método principal:

1. **Configure as Variáveis de Ambiente**
   ```env
   NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/lead-create
   NEXT_PUBLIC_USE_N8N_PRIMARY=true
   ```

2. **Crie o Workflow n8n**
   - Use o exemplo em `docs/N8N_INTEGRATION.md`
   - Configure webhook para receber leads
   - Conecte com seu Supabase

## 🧪 Como Testar

### Teste 1: Verificar Status dos Sistemas
1. Abra a página de Clientes
2. Veja o indicador de status no header
3. Deve mostrar "Sistemas OK" em verde

### Teste 2: Criar Lead de Teste
1. Clique em "Novo Lead"
2. Preencha os campos obrigatórios:
   - Nome: "Teste Sistema"
   - Email: "teste@test.com"
   - Fonte: "Site"
3. Clique em "Criar Lead"
4. Deve funcionar sem erro 403

### Teste 3: Verificar no Supabase
1. Acesse Supabase → Table Editor → Contact
2. Verifique se o lead foi criado
3. Confirme os dados estão corretos

## 🔍 Diagnóstico Avançado

### Script SQL para Diagnóstico
```sql
-- Verificar permissões atuais
SELECT * FROM check_contact_permissions();

-- Testar criação de lead
SELECT create_lead_via_api(
  'Teste SQL', 
  'teste@sql.com', 
  '11999999999',
  'Site',
  'Teste via SQL'
);

-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'Contact';

-- Ver políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'Contact';
```

### Componente de Diagnóstico
O sistema agora inclui um componente de diagnóstico que mostra:
- ✅ Status do Supabase (conectividade e permissões)
- ✅ Status do n8n (se configurado)
- ✅ Método ativo (Supabase direto ou n8n)
- ✅ Botão de teste para validar funcionamento

## 🚀 Funcionalidades Implementadas

### Hook de Criação com Fallback
```typescript
const createLead = useCreateLeadWithFallback();

// Tenta Supabase → Se falhar → Tenta n8n
const result = await createLead.mutateAsync(leadData);
```

### Serviço Híbrido
```typescript
// Estratégias automáticas:
// 1. Supabase direto (rápido)
// 2. n8n webhook (robusto)  
// 3. Fallback inteligente
const result = await leadWebhookService.createLead(input);
```

### Status em Tempo Real
- 🟢 **Verde**: Todos os sistemas funcionando
- 🟡 **Amarelo**: Alguns sistemas com problemas
- 🔴 **Vermelho**: Sistemas indisponíveis

## 💡 Próximos Passos

1. **Execute o script SQL** para corrigir as permissões
2. **Teste a criação de lead** no dashboard
3. **Configure n8n** (opcional) para automações avançadas
4. **Monitore os logs** para identificar outros problemas

## 🆘 Se Ainda Houver Problemas

### Caso o Script SQL Falhe:
1. Verifique se você tem permissões de admin no Supabase
2. Confirme se a tabela `Contact` existe
3. Execute as migrações Prisma primeiro: `npx prisma db push`

### Caso o n8n Não Conecte:
1. Verifique se a URL do webhook está correta
2. Teste a conectividade: `curl -X POST sua-url-n8n`
3. Verifique se o n8n está executando

### Logs Detalhados:
```typescript
// Habilite logs detalhados
NEXT_PUBLIC_DEBUG_LEADS=true
```

## 📞 Suporte

Se precisar de ajuda adicional:
1. Verifique os logs do console do navegador
2. Execute os scripts de diagnóstico SQL
3. Use o componente de status para identificar o problema
4. Consulte a documentação em `docs/N8N_INTEGRATION.md`

---

**Status**: ✅ Solução Implementada  
**Versão**: 1.0.0  
**Data**: Janeiro 2024