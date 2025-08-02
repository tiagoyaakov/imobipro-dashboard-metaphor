# 🔐 Guia de Implementação RLS - ImobiPRO Dashboard

## 📊 Visão Geral

Este documento descreve a implementação completa de Row Level Security (RLS) no ImobiPRO Dashboard, garantindo isolamento total entre empresas e respeito à hierarquia de usuários.

## 🎯 Objetivos da Implementação

1. **Isolamento por Empresa**: Dados de uma empresa nunca são visíveis para outra
2. **Hierarquia de Permissões**: CREATOR > ADMIN > AGENT
3. **Segurança por Design**: RLS aplicado em duas camadas (banco + aplicação)
4. **Performance Otimizada**: Índices estratégicos para queries eficientes

## 📁 Arquivos Criados

### 1. Migration SQL Principal
**Arquivo**: `supabase/migrations/20250801_complete_rls_policies.sql`

Contém:
- ✅ Funções helper para verificação de roles
- ✅ Políticas RLS para todas as 9 tabelas principais
- ✅ Índices de performance
- ✅ Grants de permissão

### 2. Script de Teste RLS
**Arquivo**: `scripts/test-rls-policies.ts`

Funcionalidades:
- Cria dados de teste com 2 empresas
- Testa isolamento entre empresas
- Valida hierarquia de permissões
- Verifica operações CRUD por role

### 3. Script de Aplicação
**Arquivo**: `scripts/apply-rls-migration.ts`

Funcionalidades:
- Aplica a migration SQL no Supabase
- Verifica se RLS está habilitado
- Lista políticas criadas
- Relatório de sucesso/erro

## 🔐 Políticas Implementadas

### Por Tabela:

#### Company
- **SELECT**: Usuários veem apenas sua empresa (exceto CREATOR)
- **INSERT**: Apenas CREATOR pode criar empresas
- **UPDATE**: CREATOR ou ADMIN da própria empresa
- **DELETE**: Apenas CREATOR

#### User
- **SELECT**: Usuários da mesma empresa se veem
- **INSERT**: ADMIN pode criar AGENT na sua empresa
- **UPDATE**: Próprio perfil ou ADMIN atualiza AGENT
- **DELETE**: Apenas CREATOR

#### Property
- **SELECT**: Todos da empresa veem propriedades
- **INSERT**: Qualquer um pode criar para si ou sua empresa
- **UPDATE**: Dono ou ADMIN da empresa
- **DELETE**: ADMIN ou CREATOR

#### Contact
- **SELECT**: AGENT vê próprios, ADMIN vê todos da empresa
- **INSERT**: Criar próprios contatos
- **UPDATE**: Dono ou ADMIN
- **DELETE**: Dono ou ADMIN

#### Appointment
- **SELECT**: AGENT vê próprios, ADMIN vê todos da empresa
- **INSERT**: Criar próprios agendamentos
- **UPDATE**: Dono ou ADMIN
- **DELETE**: Dono ou ADMIN

#### Deal
- **SELECT**: AGENT vê próprios, ADMIN vê todos da empresa
- **INSERT**: Criar próprios negócios
- **UPDATE**: Dono ou ADMIN
- **DELETE**: ADMIN ou CREATOR

#### Activity
- **SELECT**: Vê atividades da própria empresa
- **INSERT**: Registra próprias atividades
- **UPDATE/DELETE**: Não permitido (log imutável)

#### Chat
- **SELECT**: AGENT vê próprios, ADMIN vê todos da empresa
- **INSERT**: Criar próprios chats
- **UPDATE**: Dono ou ADMIN
- **DELETE**: ADMIN ou CREATOR

#### Message
- **SELECT**: Mensagens de chats acessíveis
- **INSERT**: Enviar em chats acessíveis
- **UPDATE/DELETE**: Não permitido (histórico imutável)

## 🚀 Como Usar

### 1. Aplicar a Migration

```bash
# Aplicar políticas RLS no Supabase
pnpm run migrate:rls
```

### 2. Testar as Políticas

```bash
# Executar testes de RLS
pnpm run test:rls
```

### 3. Verificar no Supabase Dashboard

1. Acesse seu projeto no Supabase
2. Vá em Database > Policies
3. Verifique se todas as políticas foram criadas
4. Teste manualmente com diferentes usuários

## 🧪 Cenários de Teste

### Teste 1: Isolamento entre Empresas
- ADMIN da Empresa A não vê dados da Empresa B ✅
- AGENT da Empresa A não vê dados da Empresa B ✅
- Propriedades/Contatos/Deals isolados por empresa ✅

### Teste 2: Hierarquia de Roles
- CREATOR vê tudo de todas as empresas ✅
- ADMIN vê tudo da sua empresa ✅
- AGENT vê apenas seus próprios dados ✅

### Teste 3: Operações CRUD
- INSERT respeitando empresa/agente ✅
- UPDATE apenas dados permitidos ✅
- DELETE respeitando hierarquia ✅

## ⚠️ Considerações Importantes

### 1. Service Role Key
- Use APENAS em scripts administrativos
- NUNCA exponha no frontend
- Mantém no `.env` server-side

### 2. Performance
- Índices criados para queries comuns
- Monitorar queries lentas
- Ajustar índices conforme uso

### 3. Manutenção
- Testar RLS após mudanças no schema
- Atualizar políticas quando adicionar tabelas
- Documentar exceções ou casos especiais

## 📊 Monitoramento

### Queries Úteis

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Listar todas as políticas
SELECT * FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar performance de queries
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%WHERE%company%'
ORDER BY mean_exec_time DESC;
```

## 🔄 Próximos Passos

1. **Monitorar Performance**: Acompanhar queries após deploy
2. **Adicionar Métricas**: Implementar logging de violações RLS
3. **Testes E2E**: Criar testes automatizados end-to-end
4. **Documentação**: Atualizar docs de API com RLS

## 📝 Troubleshooting

### Problema: Usuário não vê dados esperados
1. Verificar role do usuário
2. Confirmar company_id correto
3. Checar se RLS está habilitado na tabela
4. Revisar políticas específicas

### Problema: Performance degradada
1. Verificar índices nas colunas de filtro
2. Analisar EXPLAIN das queries
3. Considerar materializar views para queries complexas

### Problema: Erro de permissão
1. Verificar grants na tabela
2. Confirmar autenticação do usuário
3. Revisar política específica que está bloqueando

## ✅ Checklist de Validação

- [ ] Migration aplicada sem erros
- [ ] Todos os testes RLS passando
- [ ] Performance aceitável em produção
- [ ] Documentação atualizada
- [ ] Equipe treinada sobre RLS
- [ ] Monitoramento configurado

---

**Última atualização**: 01/08/2025
**Versão**: 1.0