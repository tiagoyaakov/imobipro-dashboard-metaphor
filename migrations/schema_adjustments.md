# 🔄 Ajustes Necessários no Schema para Supabase Auth

## ❗ Problema Identificado

O schema atual (`schema.prisma`) tem uma tabela `User` que conflita com o sistema de autenticação do Supabase. O Supabase Auth gerencia usuários na tabela `auth.users`, e nossa tabela customizada precisa ser ajustada.

## 🔧 Ajustes Necessários

### 1. Modificar Tabela User no Schema

**Problema atual:**
```prisma
model User {
  id           String     @id @default(uuid())
  email        String     @unique
  password     String     // ❌ Conflita com Supabase Auth
  // ... outros campos
}
```

**Solução:**
```prisma
model User {
  id           String     @id // ❌ Remover @default(uuid())
  email        String     @unique
  // ❌ Remover campo password (gerenciado pelo Supabase Auth)
  name         String
  role         UserRole   @default(AGENT)
  isActive     Boolean    @default(true)
  companyId    String
  company      Company    @relation(fields: [companyId], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // Relacionamentos permanecem iguais
  properties   Property[]
  contacts     Contact[]
  appointments Appointment[]
  deals        Deal[]
  activities   Activity[]
  messages     Message[]
  chats        Chat[]     @relation("ChatOwner")
}
```

### 2. Integração com auth.users

A tabela `User` será populada automaticamente via trigger quando um usuário se registrar no Supabase Auth:

```sql
-- O trigger em auth_rls_policies.sql já trata isso
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "User" (id, email, name, role, "companyId")
  VALUES (
    NEW.id::text,                    -- ID vem do auth.users
    NEW.email,                       -- Email vem do auth.users  
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'AGENT'::UserRole,
    -- companyId será definido na aplicação
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Campos de Metadados

Para campos adicionais durante o registro, usar `raw_user_meta_data` no Supabase:

```typescript
// No registro
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      name: 'Nome do Usuário',
      companyId: 'uuid-da-empresa',
      role: 'AGENT'
    }
  }
})
```

## 🚀 Próximos Passos

### Ordem de Implementação:

1. **✅ CONCLUÍDO**: Criar RLS policies (`auth_rls_policies.sql`)
2. **🔄 PENDENTE**: Ajustar schema.prisma (remover password, ajustar ID)
3. **🔄 PENDENTE**: Executar migração no Supabase
4. **🔄 PENDENTE**: Regenerar tipos TypeScript
5. **🔄 PENDENTE**: Testar integração

### Comandos para Executar:

```bash
# 1. Ajustar schema.prisma manualmente
# 2. Gerar migração
npx prisma migrate dev --name adjust_user_for_supabase_auth

# 3. Executar RLS policies no Supabase SQL Editor
# (Conteúdo do arquivo auth_rls_policies.sql)

# 4. Regenerar tipos TypeScript do Supabase
npx supabase gen types typescript --project-id eeceyvenrnyyqvilezgr > src/integrations/supabase/types.ts
```

## ⚠️ Cuidados

### Durante a Migração:
- **Backup**: Fazer backup do banco antes dos ajustes
- **Testes**: Testar em ambiente de desenvolvimento primeiro
- **Dados Existentes**: Se houver dados, migrar cuidadosamente

### Compatibilidade:
- Manter interface do `AuthContextMock` inalterada
- Garantir que componentes existentes continuem funcionando
- Testar todas as relações entre tabelas

## 📝 Notas Técnicas

### Por que não usar Prisma para Auth?
- Supabase Auth é mais seguro e robusto
- Gerencia sessões, tokens, recuperação de senha automaticamente
- Integração nativa com RLS (Row Level Security)
- Suporte a múltiplos provedores (OAuth, Magic Links, etc.)

### Vantagens da Abordagem Híbrida:
- **Supabase Auth**: Gerencia autenticação, sessões, segurança
- **Tabela User customizada**: Armazena dados específicos da aplicação
- **Trigger**: Sincronização automática entre as duas tabelas 