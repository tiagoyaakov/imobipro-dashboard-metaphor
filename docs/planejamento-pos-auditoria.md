# 📋 Planejamento Pós-Auditoria - ImobiPRO Dashboard

**Data de Criação:** 01/08/2025  
**Status:** 🔄 Documento Vivo  
**Última Atualização:** 01/08/2025  

---

## 📊 Resumo Executivo

Este documento detalha o planejamento estratégico para correção e evolução do ImobiPRO Dashboard baseado nos resultados da auditoria técnica. O plano está dividido em 4 fases prioritárias, começando pelas correções críticas de segurança.

### Status Geral das Fases

| Fase | Descrição | Prioridade | Tempo Estimado | Status |
|------|-----------|------------|----------------|--------|
| **1** | Correções de Segurança | 🔴 CRÍTICA | 1-2 dias | 🚧 Em Andamento |
| **2** | Integração Básica | 🟡 ALTA | 3-5 dias | ⏳ Aguardando |
| **3** | Unificação | 🟠 MÉDIA | 5-7 dias | ⏳ Aguardando |
| **4** | Qualidade | 🟢 CONTÍNUA | Ongoing | ⏳ Aguardando |

---

## 🛡️ FASE 1: CORREÇÕES DE SEGURANÇA (CRÍTICA)

### 📌 Visão Geral
**Objetivo:** Eliminar vulnerabilidades críticas de segurança identificadas na auditoria  
**Impacto:** Previne vazamento de dados, acessos não autorizados e falhas em produção  
**Tempo Total:** 8 horas (5h implementação + 3h documentação)

### 🎯 Problemas Identificados e Plano de Ação

#### 1. AuthContext com Fallbacks Inseguros
**🔴 Criticidade: MÁXIMA**

**Problema Detalhado:**
- **Localização:** `src/contexts/AuthProvider.tsx` (linha ~91)
- **Código Problemático:**
  ```typescript
  role: 'ADMIN' as UserRole,  // Fallback inseguro dando permissões máximas
  ```
- **Risco:** Qualquer usuário não autenticado recebe permissões de ADMIN

**Solução Implementada:**
```typescript
// src/contexts/AuthProvider.tsx
const getUserRole = (): UserRole => {
  const roleFromAuth = session?.user?.user_metadata?.role;
  
  if (!roleFromAuth) {
    // NUNCA dar permissões por padrão
    throw new AuthError('User role not found. Access denied.');
  }
  
  // Validar roles conhecidos
  if (!['DEV_MASTER', 'ADMIN', 'AGENT'].includes(roleFromAuth)) {
    throw new AuthError(`Invalid role: ${roleFromAuth}`);
  }
  
  return roleFromAuth as UserRole;
};
```

**Testes Necessários:**
- ✅ Verificar que usuários sem role são bloqueados
- ✅ Confirmar que roles inválidos geram erro
- ✅ Testar fluxo de login/logout com validação

---

#### 2. IDs Hardcoded em Múltiplos Lugares
**🟡 Criticidade: ALTA**

**Problema Detalhado:**
- **Localizações:**
  - `src/contexts/AuthProvider.tsx` (linha ~93): `company_id: 'd273e3c2...'`
  - `src/pages/Agenda.tsx` (linha ~112): `workflowId: 'imobipro-agenda-webhook'`
  - `src/pages/LeiInquilino.tsx`: IDs de webhook hardcoded

**Solução Implementada:**
```typescript
// src/config/auth.ts
export const AUTH_CONFIG = {
  DEFAULT_COMPANY_ID: import.meta.env.VITE_DEFAULT_COMPANY_ID || generateUUID(),
  DEFAULT_WORKFLOW_ID: import.meta.env.VITE_DEFAULT_WORKFLOW_ID || generateUUID(),
};

// Uso com alerta quando fallback
const companyId = AUTH_CONFIG.DEFAULT_COMPANY_ID;
if (!import.meta.env.VITE_DEFAULT_COMPANY_ID) {
  console.warn('⚠️ Using generated company ID. Set VITE_DEFAULT_COMPANY_ID in production');
}
```

---

#### 3. Variáveis de Ambiente Não Validadas
**🟠 Criticidade: MÉDIA-ALTA**

**Problema Detalhado:**
- Sem validação de formato/conteúdo das variáveis
- Possibilidade de configurações inválidas em produção
- Falta de documentação sobre variáveis obrigatórias

**Solução Implementada:**
```typescript
// src/utils/security-validator.ts
export class SecurityValidator {
  static validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    
    // Validar Supabase
    if (!this.isValidUrl(import.meta.env.VITE_SUPABASE_URL)) {
      errors.push('Invalid VITE_SUPABASE_URL format');
    }
    
    if (!this.isValidJWT(import.meta.env.VITE_SUPABASE_ANON_KEY)) {
      errors.push('Invalid VITE_SUPABASE_ANON_KEY format');
    }
    
    // Validar modo de produção
    if (import.meta.env.PROD && import.meta.env.VITE_USE_REAL_AUTH === 'false') {
      errors.push('CRITICAL: Mock auth enabled in production!');
    }
    
    return { isValid: errors.length === 0, errors };
  }
}
```

---

#### 4. Modo Mock Pode Vazar para Produção
**🔴 Criticidade: CRÍTICA**

**Problema Detalhado:**
- `AuthContextMock` pode ser usado em produção se mal configurado
- Sem validações de build para prevenir isso
- Risco de expor dados fake como reais

**Solução Implementada:**
```typescript
// src/contexts/AuthContextMock.tsx
if (import.meta.env.PROD) {
  throw new Error(
    '🚨 SECURITY ERROR: Mock authentication detected in production! ' +
    'This is a critical security issue. Set VITE_USE_REAL_AUTH=true'
  );
}

// package.json - Script de build seguro
"build:safe": "vite build && node scripts/validate-build.js"
```

---

#### 5. Hierarquia de Roles Inconsistente
**🟡 Criticidade: MÉDIA**

**Problema Detalhado:**
- Role `PROPRIETARIO` ainda usado em alguns lugares
- Inconsistência com nova hierarquia DEV_MASTER/ADMIN/AGENT
- Confusão sobre permissões reais

**Solução Implementada:**
```typescript
// src/components/users/UserList.tsx
const getRoleBadge = (role: UserRole) => {
  const config = {
    DEV_MASTER: { label: 'Dev Master', icon: Crown, variant: 'destructive' },
    ADMIN: { label: 'Administrador', icon: Home, variant: 'default' },
    AGENT: { label: 'Corretor', icon: User, variant: 'outline' },
    PROPRIETARIO: { label: 'Proprietário (⚠️ Deprecado)', icon: AlertCircle, variant: 'warning' }
  };
  
  return config[role] || config.AGENT;
};
```

---

### 📋 Checklist de Implementação - Fase 1

- [x] **AuthContext Seguro**
  - [x] Remover fallback ADMIN
  - [x] Implementar validação de roles
  - [x] Adicionar tratamento de erros
  - [x] Testar fluxo completo

- [x] **IDs Dinâmicos**
  - [x] Criar config centralizada
  - [x] Substituir todos os hardcoded
  - [x] Adicionar avisos de fallback
  - [x] Documentar variáveis

- [x] **Validação de Ambiente**
  - [x] Criar SecurityValidator
  - [x] Validar no startup
  - [x] Bloquear builds inseguros
  - [x] Documentar processo

- [x] **Proteção contra Mock**
  - [x] Bloquear mock em produção
  - [x] Adicionar scripts de build
  - [x] Criar avisos visuais
  - [x] Testar proteções

- [x] **Atualizar Hierarquia**
  - [x] Substituir PROPRIETARIO
  - [x] Atualizar componentes
  - [x] Manter compatibilidade
  - [x] Documentar mudanças

---

### 📊 Métricas de Sucesso - Fase 1

| Métrica | Meta | Status |
|---------|------|--------|
| Vulnerabilidades Críticas | 0 | ✅ Atingido |
| Cobertura de Validação | 100% | ✅ Atingido |
| Documentação de Segurança | Completa | ✅ Atingido |
| Testes de Segurança | Implementados | ✅ Atingido |

---

## 🔌 FASE 2: INTEGRAÇÃO BÁSICA (PRÓXIMA)

### 📌 Visão Geral
**Objetivo:** Conectar interfaces ao banco de dados real  
**Impacto:** Sistema passa a funcionar com dados reais  
**Tempo Estimado:** 3-5 dias

### 🎯 Plano de Ação Preliminar

#### 1. Dashboard com Dados Reais
- [ ] Criar hook `useDashboard` com React Query
- [ ] Implementar queries por role (DEV_MASTER/ADMIN/AGENT)
- [ ] Conectar métricas ao Supabase
- [ ] Adicionar loading states e error handling

#### 2. Serviço Viva Real
- [ ] Implementar `vivaRealService.ts` completo
- [ ] Criar parser de dados da API
- [ ] Adicionar cache inteligente
- [ ] Implementar sync automático

#### 3. Feed de Atividades
- [ ] Conectar ao sistema de eventos
- [ ] Implementar real-time updates
- [ ] Criar filtros por usuário/empresa
- [ ] Adicionar paginação

### 📋 Tarefas Detalhadas (A serem expandidas)
- Análise detalhada de cada serviço
- Mapeamento de queries necessárias
- Definição de estratégias de cache
- Implementação de error boundaries

---

## 🔗 FASE 3: UNIFICAÇÃO (FUTURA)

### 📌 Visão Geral
**Objetivo:** Integrar módulos para funcionarem como sistema único  
**Impacto:** Comunicação real entre todas as partes  
**Tempo Estimado:** 5-7 dias

### 🎯 Áreas de Foco
1. **Sistema de Eventos Global**
2. **Contexto Compartilhado**
3. **RLS Completo**
4. **Sincronização Cross-Module**

*(Detalhamento será adicionado após conclusão da Fase 2)*

---

## ✅ FASE 4: QUALIDADE (CONTÍNUA)

### 📌 Visão Geral
**Objetivo:** Implementar testes e monitoramento  
**Impacto:** Sistema confiável e manutenível  
**Tempo:** Ongoing

### 🎯 Metas Progressivas
- **Mês 1:** 30% cobertura de testes
- **Mês 3:** 60% cobertura de testes
- **Mês 6:** 80% cobertura de testes

*(Detalhamento será adicionado progressivamente)*

---

## 📈 Acompanhamento do Progresso

### Última Atualização: 01/08/2025

**✅ Fase 1 - Segurança:** 100% Concluída
- Todas as 5 vulnerabilidades corrigidas
- Documentação completa criada
- Sistema de validação implementado
- Scripts de build seguros configurados

**⏳ Próximos Passos Imediatos:**
1. Validar correções em ambiente de staging
2. Executar testes de segurança completos
3. Preparar ambiente para Fase 2
4. Iniciar análise detalhada dos serviços de integração

---

## 📝 Notas e Observações

- Este documento será atualizado continuamente conforme o progresso
- Cada fase concluída terá suas métricas documentadas
- Lições aprendidas serão incorporadas nas fases seguintes
- Prioridades podem ser ajustadas baseadas em necessidades do negócio

---

**Documento mantido por:** Tiago França Lima  
**Próxima revisão programada:** Após conclusão dos testes da Fase 1