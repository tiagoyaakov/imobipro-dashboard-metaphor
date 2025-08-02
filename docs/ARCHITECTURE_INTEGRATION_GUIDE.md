# 🏗️ Guia de Arquitetura e Integração - ImobiPRO Dashboard

## 📊 Visão Geral da Arquitetura

O ImobiPRO Dashboard utiliza uma arquitetura híbrida que combina:

### 1. **Prisma Schema** (`schema.prisma`)
- Define o modelo de dados completo
- Usado para geração de tipos TypeScript
- Base para as migrations do Supabase
- Contém TODOS os modelos e relacionamentos do sistema

### 2. **Supabase**
- Banco de dados PostgreSQL real
- Autenticação integrada
- Row Level Security (RLS) nativo
- Real-time subscriptions
- Storage para arquivos

### 3. **TypeScript Types** (`src/integrations/supabase/types.ts`)
- Tipos gerados automaticamente do Supabase
- Sincronizados com o banco de dados real
- Usados pelos serviços e hooks

## 🔄 Como a Integração Funciona

### Fluxo de Dados:

```
Prisma Schema (Definição) 
    ↓
Supabase Migrations (SQL)
    ↓
PostgreSQL Database (Supabase)
    ↓
TypeScript Types (Gerados)
    ↓
Services & Hooks (Consumo)
    ↓
React Components (UI)
```

## 📁 Estrutura Atual

### Modelos Principais (do schema.prisma):

1. **Company** - Empresas/Imobiliárias
2. **User** - Usuários com roles (CREATOR, ADMIN, AGENT)
3. **Property** - Propriedades/Imóveis
4. **Contact** - Contatos/Leads
5. **Appointment** - Agendamentos
6. **Deal** - Negociações
7. **Activity** - Log de atividades
8. **Chat/Message** - Sistema de mensagens
9. **WhatsAppInstance** - Conexões WhatsApp
10. **ReportTemplate** - Templates de relatórios

### Serviços Implementados:

```typescript
// Base Service com RLS automático
class BaseService<TTable> {
  // Aplica RLS baseado no role do usuário
  protected async applyRLS(query) {
    // CREATOR vê tudo
    // ADMIN vê apenas sua empresa
    // AGENT vê apenas seus dados
  }
}

// Serviços específicos
- PropertyService
- ContactService  
- AppointmentService
- DealService
- WhatsAppService
- ReportsService
```

## 🔐 Sistema de Permissões (RLS)

### Hierarquia de Usuários:

1. **CREATOR (DEV_MASTER)**
   - Acesso total ao sistema
   - Vê dados de todas as empresas
   - Invisível para outros usuários

2. **ADMIN**
   - Acesso total à sua empresa
   - Não vê dados de outras empresas
   - Gerencia corretores (AGENT)

3. **AGENT**
   - Acesso apenas aos próprios dados
   - Limitado pela empresa
   - Sem acesso administrativo

### RLS no Banco de Dados:

As políticas RLS são aplicadas em duas camadas:

1. **Supabase (Banco)**
   ```sql
   -- Exemplo de política para properties
   CREATE POLICY "Users can view properties from their company"
   ON properties FOR SELECT
   USING (
     auth.uid() IN (
       SELECT id FROM users 
       WHERE company_id = properties.company_id
     )
   );
   ```

2. **Services (Aplicação)**
   ```typescript
   // BaseService aplica filtros adicionais
   if (profile.role === 'ADMIN') {
     query = query.eq('companyId', profile.companyId)
   } else if (profile.role === 'AGENT') {
     query = query.eq('agentId', profile.id)
   }
   ```

## 🔄 Sistema Global de Sincronização

### GlobalContext
Gerencia estado compartilhado entre módulos:
- Seleções globais (propriedade, contato, agendamento)
- Filtros globais
- Notificações
- Estado de sincronização

### EventBus
Sistema de eventos para comunicação:
```typescript
// Eventos disponíveis
- PROPERTY_SELECTED
- CONTACT_SELECTED
- APPOINTMENT_SELECTED
- FILTERS_CHANGED
- PROPERTY_CREATED/UPDATED/DELETED
- CONTACT_CREATED/UPDATED/DELETED
// etc...
```

### Hooks de Sincronização
```typescript
// Sincroniza dados entre módulos
useCrossModuleSync()

// Navegação com contexto preservado
useCrossModuleNavigation()

// Escuta eventos de outros módulos
useModuleEvents()

// Sincroniza filtros globalmente
useFilterSync()
```

## 🛠️ Como Implementar um Novo Módulo

### 1. Definir o Modelo (schema.prisma)
```prisma
model NewModule {
  id        String   @id @default(uuid())
  name      String
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  agentId   String
  agent     User     @relation(fields: [agentId], references: [id])
  // ... outros campos
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Criar Migration Supabase
```sql
-- supabase/migrations/xxx_add_new_module.sql
CREATE TABLE "NewModule" (
  -- campos conforme schema.prisma
);

-- Habilitar RLS
ALTER TABLE "NewModule" ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "company_isolation" ON "NewModule"
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );
```

### 3. Criar Service
```typescript
// src/services/newModule.service.ts
export class NewModuleService extends BaseService<'NewModule'> {
  constructor() {
    super('NewModule', 'newmodule')
  }
  
  // Métodos específicos do módulo
}
```

### 4. Criar Hooks
```typescript
// src/hooks/useNewModule.ts
export const useNewModule = () => {
  const { data, error } = useQuery({
    queryKey: ['newmodule'],
    queryFn: () => newModuleService.findAll()
  })
  
  return { data, error }
}
```

### 5. Integrar com Sistema Global
```typescript
// No componente
const { property } = useGlobalSelections()
const { syncWithProperty } = useCrossModuleSync()

// Reagir a seleções globais
useEffect(() => {
  if (property.id) {
    // Filtrar dados baseado na propriedade selecionada
  }
}, [property.id])
```

## 📝 Próximos Passos para RLS Completo

### 1. Criar Políticas Faltantes
Tabelas que precisam de RLS:
- [x] WhatsAppInstance (parcial)
- [x] ReportTemplate (parcial)
- [ ] Property
- [ ] Contact
- [ ] Appointment
- [ ] Deal
- [ ] Activity
- [ ] Chat/Message

### 2. Implementar Políticas por Role
```sql
-- Template de políticas necessárias por tabela
-- 1. SELECT - Isolamento por empresa
-- 2. INSERT - Validação de empresa/agente
-- 3. UPDATE - Apenas próprios registros
-- 4. DELETE - Apenas ADMIN/CREATOR
```

### 3. Testes de Segurança
- Testar acesso entre empresas
- Validar hierarquia de roles
- Verificar vazamento de dados

## 🎯 Benefícios da Arquitetura

1. **Type Safety**: Prisma + TypeScript garantem tipos em todo sistema
2. **Segurança**: RLS em duas camadas (banco + aplicação)
3. **Escalabilidade**: Supabase gerencia infraestrutura
4. **Real-time**: Atualizações automáticas via subscriptions
5. **Modularidade**: Sistema de eventos desacopla módulos
6. **Performance**: Cache inteligente com React Query

## 🚀 Conclusão

A arquitetura atual permite:
- ✅ Desenvolvimento modular independente
- ✅ Segurança por design com RLS
- ✅ Sincronização automática entre módulos
- ✅ Type safety completo
- ✅ Escalabilidade horizontal

O sistema está preparado para crescer mantendo:
- Isolamento entre empresas
- Hierarquia de permissões
- Performance otimizada
- Experiência unificada

---

**Última atualização:** 01/08/2025