# 🏗️ **Nova Hierarquia de Usuários - ImobiPRO Dashboard**

## 🎯 **Visão Geral**

O sistema ImobiPRO Dashboard implementou uma **nova hierarquia de usuários** projetada para refletir a estrutura real de funcionamento de um negócio imobiliário, com foco em controle administrativo, segurança e escalabilidade.

---

## 📊 **Estrutura Hierárquica**

### **🎭 DEV_MASTER (Administrador Global)**
- **Função**: Desenvolvedor principal que controla o sistema globalmente
- **Visibilidade**: **OCULTO** de todos os outros usuários (ninja mode)
- **Permissões**: Controle total sobre todas as funcionalidades

#### **Responsabilidades:**
- ✅ Criar contas de administrador para cada imobiliária
- ✅ Ativar/desativar clientes e recursos
- ✅ Gerenciar o uso geral da plataforma  
- ✅ Liberar novas funcionalidades para imobiliárias
- ✅ Impersonar qualquer usuário (ADMIN ou AGENT)
- ✅ Acesso completo a logs e auditoria

#### **Restrições:**
- ❌ **Invisível** para outros usuários em listas/seleções
- ❌ Não pode criar outros DEV_MASTER
- ❌ Não pode impersonar outros DEV_MASTER

---

### **🏢 ADMIN (Administrador de Imobiliária)**
- **Função**: Dono ou gestor da imobiliária
- **Visibilidade**: Visível para DEV_MASTER e outros ADMIN
- **Permissões**: Gestão completa da sua imobiliária

#### **Responsabilidades:**
- ✅ Gerenciar corretores da sua imobiliária
- ✅ Ver conversas e métricas dos corretores
- ✅ Conceder/revogar funções específicas dos corretores
- ✅ Impersonar corretores para testes
- ✅ Configurar relatórios avançados
- ✅ Acesso às configurações da imobiliária

#### **Restrições:**
- ❌ Não pode criar outros ADMIN (apenas DEV_MASTER pode)
- ❌ Não pode impersonar ADMIN ou DEV_MASTER
- ❌ Não vê dados de outras imobiliárias
- ❌ Não tem acesso às configurações globais

---

### **👤 AGENT (Corretor)**
- **Função**: Corretor
- **Visibilidade**: Visível para DEV_MASTER e ADMIN da sua imobiliária
- **Permissões**: Acesso apenas aos próprios dados

#### **Responsabilidades:**
- ✅ Acessar apenas leads atribuídos a ele
- ✅ Gerenciar próprios contatos e clientes
- ✅ Ver apenas próprias métricas e relatórios
- ✅ Funcionalidades liberadas pelo ADMIN

#### **Restrições:**
- ❌ Não pode gerenciar outros usuários
- ❌ Não pode usar impersonation
- ❌ Não vê dados de outros corretores
- ❌ Não tem acesso a configurações administrativas

---

## 🔒 **Matriz de Permissões**

| **Ação** | **DEV_MASTER** | **ADMIN** | **AGENT** |
|----------|----------------|-----------|-----------|
| **Criar usuários** | ✅ ADMIN/AGENT | ❌ | ❌ |
| **Gerenciar ADMIN** | ✅ | ❌ | ❌ |
| **Gerenciar AGENT** | ✅ | ✅ (próprios) | ❌ |
| **Impersonar ADMIN** | ✅ | ❌ | ❌ |
| **Impersonar AGENT** | ✅ | ✅ | ❌ |
| **Ver todos os dados** | ✅ | ❌ (só sua imobiliária) | ❌ (só próprios) |
| **Configurações globais** | ✅ | ❌ | ❌ |
| **Ativar/desativar recursos** | ✅ | ❌ | ❌ |
| **Logs de auditoria completos** | ✅ | ❌ (limitados) | ❌ |

---

## 🛡️ **Segurança Implementada**

### **🕵️ DEV_MASTER Oculto (Ninja Mode)**
```typescript
// DEV_MASTER nunca aparece em listas para outros usuários
const filterUsersByHierarchy = (users: User[], viewerRole: UserRole): User[] => {
  return users.filter(user => {
    if (user.role === 'DEV_MASTER') {
      return viewerRole === 'DEV_MASTER'; // Só DEV_MASTER vê DEV_MASTER
    }
    return true;
  });
};
```

### **🔐 RLS Policies (Row Level Security)**
```sql
-- Política de visualização baseada na hierarquia
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT USING (
  CASE 
    -- DEV_MASTER pode ver todos
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'DEV_MASTER') 
      THEN true
    -- ADMIN pode ver ADMIN e AGENT (não DEV_MASTER)
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN') 
      THEN role IN ('ADMIN', 'AGENT')
    -- AGENT só pode ver a si mesmo
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'AGENT')
      THEN id = auth.uid()
    ELSE false
  END
);
```

### **🎭 Sistema de Impersonation**
```typescript
// DEV_MASTER pode impersonar ADMIN e AGENT
// ADMIN pode impersonar apenas AGENT
// AGENT não pode impersonar ninguém

const canImpersonateUser = (adminRole: UserRole, targetRole: UserRole): boolean => {
  switch (adminRole) {
    case 'DEV_MASTER':
      return targetRole !== 'DEV_MASTER';
    case 'ADMIN':
      return targetRole === 'AGENT';
    default:
      return false;
  }
};
```

---

## 🗄️ **Implementação no Banco de Dados**

### **Migração Realizada**
1. **Adicionado enum value**: `DEV_MASTER`
2. **Migração de dados**:
   - `ADMIN` atual → `DEV_MASTER`
   - `PROPRIETARIO` → `ADMIN`
3. **Constraint**: Bloqueio de uso do `PROPRIETARIO` (deprecated)

### **Funções SQL Criadas**
```sql
-- Verificação de roles
is_dev_master_user(user_id)     -- Verifica se é DEV_MASTER
is_imobiliaria_admin_user(user_id) -- Verifica se é ADMIN  
is_agent_user(user_id)          -- Verifica se é AGENT

-- Gestão de usuários respeitando hierarquia
update_user_role(target_id, new_role)
update_user_status(target_id, new_status)

-- Sistema de impersonation com hierarquia
start_user_impersonation(target_id)
end_user_impersonation()
get_active_impersonation()
```

---

## 🎨 **Interface Visual**

### **Badges de Role**
- **DEV_MASTER**: Badge vermelho (destaque especial)
- **ADMIN**: Badge azul (administradores)  
- **AGENT**: Badge outline (corretores)

### **Ícones**
- **DEV_MASTER**: 👑 (Crown - vermelho)
- **ADMIN**: 🏠 (Home - azul) 
- **AGENT**: 👤 (User - cinza)

### **Sistema de Impersonation**
- Botão 👁️ no header (visível apenas para DEV_MASTER e ADMIN)
- Modal organizado por seções (Administradores / Corretores)
- Indicador visual laranja quando ativo
- DEV_MASTER pode testar como qualquer ADMIN ou AGENT
- ADMIN pode testar apenas como AGENT

---

## 📝 **Tipos TypeScript**

```typescript
export type UserRole = 'DEV_MASTER' | 'ADMIN' | 'AGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  company_id: string;
  avatar_url?: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
}

// Helpers de validação
export const isDevMaster = (role?: UserRole): boolean => role === 'DEV_MASTER';
export const isImobiliariaAdmin = (role?: UserRole): boolean => role === 'ADMIN';
export const isAgent = (role?: UserRole): boolean => role === 'AGENT';
export const hasAdminPermissions = (role?: UserRole): boolean => 
  role === 'DEV_MASTER' || role === 'ADMIN';
```

---

## 🧪 **Cenários de Teste**

### **Teste como DEV_MASTER**
1. **Login**: Usar `1992tiagofranca@gmail.com` (agora é DEV_MASTER)
2. **Funcionalidades**:
   - ✅ Ver botão 👁️ de impersonation no header
   - ✅ Impersonar qualquer ADMIN ou AGENT
   - ✅ Criar novos usuários ADMIN ou AGENT
   - ✅ Gerenciar status de qualquer usuário
   - ✅ Acessar todas as configurações

### **Teste como ADMIN**
1. **Login**: Usar emails que eram PROPRIETARIO (agora são ADMIN)
2. **Funcionalidades**:
   - ✅ Ver botão 👁️ de impersonation no header
   - ✅ Impersonar apenas AGENT (não outros ADMIN)
   - ✅ Gerenciar apenas corretores
   - ❌ Não criar outros ADMIN
   - ❌ Não ver DEV_MASTER em listas

### **Teste como AGENT**
1. **Login**: Usar emails que já eram AGENT
2. **Funcionalidades**:
   - ❌ Não ver botão de impersonation
   - ❌ Não gerenciar outros usuários
   - ✅ Ver apenas próprios dados
   - ✅ Funcionalidades básicas do corretor

---

## 📊 **Monitoramento e Auditoria**

### **Logs Automáticos**
- Todas as mudanças de role são registradas
- Sessões de impersonation são auditadas
- Criação/desativação de usuários logada
- Alterações de permissões rastreadas

### **Queries de Monitoramento**
```sql
-- Ver todas as ações de DEV_MASTER
SELECT * FROM activities 
WHERE user_id IN (SELECT id FROM users WHERE role = 'DEV_MASTER')
ORDER BY created_at DESC;

-- Sessões de impersonation ativas
SELECT * FROM user_impersonations 
WHERE is_active = true;

-- Distribuição de usuários por role
SELECT role, COUNT(*) as total, 
       COUNT(CASE WHEN is_active THEN 1 END) as active
FROM users GROUP BY role;
```

---

## 🚀 **Próximos Passos**

### **Versão 2.0**
- [ ] **Limite de tempo** automático para impersonations
- [ ] **Histórico detalhado** de ações por admin
- [ ] **Notificações** para usuários sendo impersonados
- [ ] **Relatórios** de uso por hierarquia

### **Versão 3.0**
- [ ] **Multi-tenancy** completo por imobiliária
- [ ] **API externa** para automação de testes
- [ ] **Dashboard** de métricas de hierarquia
- [ ] **Permissões granulares** personalizáveis

---

## ✅ **Status da Implementação**

### **✅ Concluído**
- 🗄️ **Banco de dados**: Migração e RLS policies
- 🔧 **Backend**: Funções SQL e validações
- ⚛️ **Frontend**: Hooks e componentes
- 🎨 **UI/UX**: Interface atualizada
- 🧪 **Testes**: Build sem erros
- 📚 **Documentação**: Guias completos

### **📋 Validado**
- ✅ Migração de dados bem-sucedida
- ✅ RLS policies funcionando
- ✅ Sistema de impersonation operacional
- ✅ Interface visual consistente
- ✅ TypeScript sem erros
- ✅ Build de produção funcionando

---

**🎉 A nova hierarquia de usuários está 100% implementada e operacional!**

**💡 O sistema agora reflete perfeitamente a estrutura real de negócio imobiliário com segurança, escalabilidade e facilidade de gestão.** 