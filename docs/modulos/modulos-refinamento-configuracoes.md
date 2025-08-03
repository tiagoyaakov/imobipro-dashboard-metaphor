# 🔧 Plano de Refinamento - MÓDULO CONFIGURAÇÕES

**Data de Criação:** 03/08/2025  
**Status:** 📋 Documento de Planejamento  
**Módulo:** Configurações (Sistema de Configurações e Feature Flags)  
**Última Atualização:** 03/08/2025  

---

## 📋 **Visão Geral**

Este documento detalha o plano de ações de implementação, correção e desenvolvimento para tornar o **Módulo Configurações** **100% funcional**, com sistema completo de configurações, feature flags, permissões e controle granular de funcionalidades.

Baseado no status atual (apenas template básico) e no planejamento do sistema, o módulo Configurações será desenvolvido através de 5 etapas estruturadas utilizando os MCPs e agents especializados disponíveis no Claude Code.

---

## 🎯 **STATUS ATUAL E PROBLEMAS IDENTIFICADOS**

### **📊 Status Atual (Baseado na Análise)**

| Aspecto | Status Atual | Meta |
|---------|-------------|------|
| **Implementação** | 0% (apenas template) | 100% funcional |
| **Feature Flags** | 0% (não implementado) | 100% operacional |
| **Configurações** | 0% (não implementado) | 100% personalizável |
| **Permissões** | 0% (não implementado) | 100% granular |
| **Interface** | 5% (template básico) | 100% completa |

### **🚨 Problemas Críticos Identificados**

1. **Módulo completamente vazio** - Apenas template com placeholder
2. **Sistema de Feature Flags não implementado** - Crítico para controle de funcionalidades
3. **Configurações de empresa ausentes** - Sem personalização por cliente
4. **Configurações de usuário não implementadas** - Sem preferências pessoais
5. **Controle de permissões inexistente** - Sistema de roles não configurável
6. **Interface de configurações não desenvolvida** - UX complexa não implementada
7. **Auditoria de mudanças ausente** - Sem rastreamento de alterações
8. **Backup/restore não implementado** - Sem recuperação de configurações

---

## 🗓️ **CRONOGRAMA DE REFINAMENTO - 8-12 DIAS**

| Etapa | Descrição | Duração | Prioridade |
|-------|-----------|---------|------------|
| **1** | Sistema de Feature Flags | 2-3 dias | 🔴 CRÍTICA |
| **2** | Configurações de Empresa | 2-3 dias | 🔴 CRÍTICA |
| **3** | Configurações de Usuário | 2-3 dias | 🟡 ALTA |
| **4** | Interface e Permissões | 2-3 dias | 🟡 ALTA |
| **5** | Auditoria e Segurança | 1-2 dias | 🟠 MÉDIA |

---

## 🚩 **ETAPA 1: SISTEMA DE FEATURE FLAGS**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O sistema precisa de controle granular sobre funcionalidades disponíveis para diferentes planos, empresas e usuários. Feature flags são essenciais para releases graduais e controle de acesso.

### **📋 Objetivos Específicos**
- [ ] Implementar tabela FeatureFlag no Supabase
- [ ] Criar hook useFeatureFlags com cache inteligente
- [ ] Desenvolver interface de administração de flags
- [ ] Implementar controle por plano/empresa/usuário
- [ ] Sistema de toggle por DEV_MASTER

### **🗂️ Tarefas Detalhadas**

#### **Task 1.1: Schema e Migrations Supabase**
```sql
-- Migration: create_feature_flags_table.sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  required_plan plan_type,
  enabled_for JSONB, -- { users: [], companies: [], roles: [] }
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS Policies para Feature Flags
-- Apenas DEV_MASTER pode gerenciar
```

#### **Task 1.2: Serviço Feature Flags**
```typescript
// src/services/featureFlagsService.ts
- getAvailableFeatures(userId, companyId, userRole)
- toggleFeatureFlag(flagName, isActive) // Apenas DEV_MASTER
- getFeatureFlagsByPlan(planType)
- getUserFeatureFlags(userId)
- companyFeatureFlags(companyId)
```

#### **Task 1.3: Hook useFeatureFlags**
```typescript
// src/hooks/useFeatureFlags.ts
- Cache strategy: STATIC (30min) para flags estáveis
- Invalidação automática quando admin altera
- Fallback para configurações padrão
- Suporte a feature testing A/B
```

#### **Task 1.4: Interface de Administração**
```typescript
// src/components/configuracoes/FeatureFlagsManager.tsx
- Lista de todas as feature flags
- Toggle switches para DEV_MASTER
- Configuração de planos necessários
- Habilitação específica por empresa/usuário
- Histórico de mudanças
```

### **📁 Arquivos a Criar/Modificar**
- `supabase/migrations/create_feature_flags_table.sql` - Migration (CRIAR)
- `src/services/featureFlagsService.ts` - Serviço (CRIAR)
- `src/hooks/useFeatureFlags.ts` - Hook principal (CRIAR)
- `src/components/configuracoes/FeatureFlagsManager.tsx` - Interface (CRIAR)
- `src/types/featureFlags.ts` - Tipos TypeScript (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para migrations e RLS
- **Sequential Thinking**: Para arquitetura do sistema
- **backend-architect**: Para design da API
- **ui-designer**: Para interface de administração

### **✅ Critérios de Aceite**
- Sistema de feature flags totalmente funcional
- DEV_MASTER pode habilitar/desabilitar qualquer flag
- Controle granular por plano, empresa e usuário
- Cache eficiente com invalidação automática
- Interface intuitiva para gerenciamento
- RLS adequado para segurança

### **⚠️ Riscos e Mitigações**
- **Risco**: Cache desatualizado causando inconsistências
- **Mitigação**: Implementar invalidação real-time via WebSockets
- **Risco**: Conflitos entre diferentes níveis de habilitação
- **Mitigação**: Hierarquia clara: plano → empresa → usuário

### **🔗 Dependências**
- Supabase operacional
- Sistema de roles implementado
- Enum PlanType definido
- WebSockets para invalidação de cache

---

## 🏢 **ETAPA 2: CONFIGURAÇÕES DE EMPRESA**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
Cada empresa precisa personalizar o sistema conforme suas necessidades: horários de funcionamento, integrações habilitadas, configurações de negócio e preferências regionais.

### **📋 Objetivos Específicos**
- [ ] Implementar tabela CompanySettings no Supabase
- [ ] Criar interface de configurações da empresa
- [ ] Sistema de configurações por categoria
- [ ] Validação e salvamento automático
- [ ] Preview de mudanças antes de aplicar

### **🗂️ Tarefas Detalhadas**

#### **Task 2.1: Schema CompanySettings**
```sql
-- Configurações gerais, de negócio e integrações
-- Campos: timezone, currency, language, workingHours
-- whatsappEnabled, googleCalendarEnabled, vivaRealEnabled
-- leadAutoAssignment, appointmentReminders
```

#### **Task 2.2: Serviço CompanySettings**
```typescript
// src/services/companySettingsService.ts
- getCompanySettings(companyId)
- updateCompanySettings(companyId, settings)
- getDefaultSettings() // Para novas empresas
- validateSettings(settings) // Validação robusta
```

#### **Task 2.3: Interface de Configurações**
```typescript
// src/components/configuracoes/CompanySettingsForm.tsx
- Seções organizadas: Geral, Negócio, Integrações
- Campos com validação em tempo real
- Preview de mudanças
- Botões Salvar/Cancelar/Restaurar padrões
```

#### **Task 2.4: Configurações por Categoria**
```typescript
// Categorias separadas:
- GeneralSettings: timezone, currency, language
- BusinessSettings: workingHours, autoAssignment
- IntegrationSettings: whatsapp, googleCalendar, vivaReal
- NotificationSettings: reminders, alerts
```

### **📁 Arquivos a Criar/Modificar**
- `supabase/migrations/create_company_settings_table.sql` (CRIAR)
- `src/services/companySettingsService.ts` (CRIAR)
- `src/hooks/useCompanySettings.ts` (CRIAR)
- `src/components/configuracoes/CompanySettingsForm.tsx` (CRIAR)
- `src/components/configuracoes/settings/` - Componentes por categoria (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para operações de banco
- **frontend-developer**: Para componentes complexos
- **ui-designer**: Para UX das configurações
- **backend-architect**: Para validações server-side

### **✅ Critérios de Aceite**
- Cada empresa tem configurações independentes
- Interface organizada por categorias
- Validação robusta de todos os campos
- Salvamento automático com debounce
- Preview de mudanças antes de aplicar
- ADMIN pode configurar, AGENT visualiza apenas

---

## 👤 **ETAPA 3: CONFIGURAÇÕES DE USUÁRIO**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
Usuários precisam personalizar sua experiência: tema, notificações, preferências de dashboard, configurações de privacidade e atalhos personalizados.

### **📋 Objetivos Específicos**
- [ ] Implementar tabela UserSettings no Supabase
- [ ] Criar painel de preferências pessoais
- [ ] Sistema de temas (dark/light/auto)
- [ ] Configurações de notificações
- [ ] Personalização do dashboard

### **🗂️ Tarefas Detalhadas**

#### **Task 3.1: Schema UserSettings**
```sql
-- Preferências: theme, notifications, dashboard
-- Privacy settings, shortcuts, language override
-- RLS: usuário só vê/edita próprias configurações
```

#### **Task 3.2: Sistema de Temas**
```typescript
// src/hooks/useTheme.ts
- Controle de tema por usuário
- Persistência automática
- Detecção de preferência do sistema
- Transições suaves entre temas
```

#### **Task 3.3: Configurações de Notificações**
```typescript
// src/components/configuracoes/NotificationSettings.tsx
- Push notifications on/off
- Email notifications configuráveis
- WhatsApp notifications
- Horários de não perturbe
```

#### **Task 3.4: Personalização Dashboard**
```typescript
// src/components/configuracoes/DashboardCustomization.tsx
- Escolha de widgets visíveis
- Ordem dos componentes
- Métricas preferidas
- Filtros padrão salvos
```

### **📁 Arquivos a Criar/Modificar**
- `supabase/migrations/create_user_settings_table.sql` (CRIAR)
- `src/services/userSettingsService.ts` (CRIAR)
- `src/hooks/useUserSettings.ts` (CRIAR)
- `src/hooks/useTheme.ts` (MODIFICAR - melhorar)
- `src/components/configuracoes/UserPreferences.tsx` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **ui-designer**: Para interface de personalização
- **frontend-developer**: Para sistema de temas
- **Supabase Integration MCP**: Para RLS de usuário

### **✅ Critérios de Aceite**
- Cada usuário tem configurações independentes
- Sistema de temas funcionando perfeitamente
- Notificações configuráveis e funcionais
- Dashboard personalizável por usuário
- Configurações sincronizadas entre sessões

---

## ⚙️ **ETAPA 4: INTERFACE E PERMISSÕES**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
Desenvolver interface completa de configurações com navegação intuitiva, controle de permissões por role e sistema de busca avançada para configurações.

### **📋 Objetivos Específicos**
- [ ] Interface principal de configurações
- [ ] Navegação por abas/seções
- [ ] Sistema de busca de configurações
- [ ] Controle de permissões por role
- [ ] Ajuda contextual e tooltips

### **🗂️ Tarefas Detalhadas**

#### **Task 4.1: Layout Principal**
```typescript
// src/pages/Configuracoes.tsx
- Sidebar com seções organizadas
- Área principal com conteúdo dinâmico
- Breadcrumb para navegação
- Estados de loading/error
```

#### **Task 4.2: Sistema de Permissões**
```typescript
// src/hooks/useConfigPermissions.ts
- DEV_MASTER: Acesso total a tudo
- ADMIN: Configurações da empresa + pessoais
- AGENT: Apenas configurações pessoais
- Guards para proteger seções sensíveis
```

#### **Task 4.3: Busca de Configurações**
```typescript
// src/components/configuracoes/ConfigSearch.tsx
- Busca por nome da configuração
- Filtros por categoria
- Sugestões automáticas
- Navegação direta para resultado
```

#### **Task 4.4: Ajuda Contextual**
```typescript
// src/components/configuracoes/HelpSystem.tsx
- Tooltips explicativos
- Documentação inline
- Links para ajuda externa
- Tour guiado para novos usuários
```

### **📁 Arquivos a Criar/Modificar**
- `src/pages/Configuracoes.tsx` (MODIFICAR - implementar completo)
- `src/hooks/useConfigPermissions.ts` (CRIAR)
- `src/components/configuracoes/ConfigSidebar.tsx` (CRIAR)
- `src/components/configuracoes/ConfigSearch.tsx` (CRIAR)
- `src/components/configuracoes/HelpSystem.tsx` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **ui-designer**: Para design da interface
- **frontend-developer**: Para componentes complexos
- **whimsy-injector**: Para microinterações
- **Sequential Thinking**: Para arquitetura da navegação

### **✅ Critérios de Aceite**
- Interface intuitiva e bem organizada
- Navegação fluida entre seções
- Permissões funcionando corretamente por role
- Busca encontra configurações rapidamente
- Ajuda contextual útil e acessível

---

## 🔒 **ETAPA 5: AUDITORIA E SEGURANÇA**
**Duração:** 1-2 dias | **Prioridade:** 🟠 MÉDIA

### **🎯 Contexto**
Implementar sistema de auditoria para rastrear mudanças de configurações, backup automático, restore de configurações e validações de segurança.

### **📋 Objetivos Específicos**
- [ ] Log de auditoria para mudanças
- [ ] Sistema de backup automático
- [ ] Restore de configurações
- [ ] Validações de segurança
- [ ] Monitoramento de uso

### **🗂️ Tarefas Detalhadas**

#### **Task 5.1: Sistema de Auditoria**
```typescript
// src/services/configAuditService.ts
- Log de toda mudança de configuração
- Rastreamento: quem, quando, o que mudou
- Histórico de versões
- Rollback para versões anteriores
```

#### **Task 5.2: Backup e Restore**
```typescript
// src/services/configBackupService.ts
- Backup automático diário
- Export de configurações
- Import de configurações
- Validação de integridade
```

#### **Task 5.3: Validações de Segurança**
```typescript
// src/services/configSecurityService.ts
- Validação de permissões antes de salvar
- Prevenção de configurações perigosas
- Rate limiting para mudanças
- Alertas para mudanças críticas
```

### **📁 Arquivos a Criar/Modificar**
- `src/services/configAuditService.ts` (CRIAR)
- `src/services/configBackupService.ts` (CRIAR)
- `src/services/configSecurityService.ts` (CRIAR)
- `src/components/configuracoes/AuditLog.tsx` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Semgrep Security MCP**: Para validações de segurança
- **backend-architect**: Para sistema de auditoria
- **Supabase Integration MCP**: Para backup/restore

### **✅ Critérios de Aceite**
- Todas mudanças são auditadas
- Backup automático funcionando
- Restore seguro e validado
- Alertas para mudanças críticas
- Sistema seguro contra ataques

---

## 📊 **MÉTRICAS DE SUCESSO**

| Métrica | Estado Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| **Implementação** | 0% | 100% | Todas funcionalidades operacionais |
| **Feature Flags** | 0% | 100% | Sistema completo funcionando |
| **Configurações** | 0% | 100% | Empresa + usuário configuráveis |
| **Interface** | 5% | 100% | UX completa e intuitiva |
| **Segurança** | 0% | 100% | Auditoria e validações ativas |

---

## 🎯 **RECURSOS NECESSÁRIOS**

### **MCPs Principais**
- **Sequential Thinking**: Arquitetura complexa do sistema
- **Supabase Integration**: Operações críticas de banco
- **Semgrep Security**: Validações de segurança
- **Context7**: Documentação de padrões de configuração

### **Agents Especializados**
- **backend-architect**: Arquitetura do sistema de configurações
- **frontend-developer**: Componentes complexos de interface
- **ui-designer**: Design e UX das configurações
- **whimsy-injector**: Microinterações para melhor UX
- **test-writer-fixer**: Testes de segurança e funcionalidade

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Validar plano com DEV_MASTER** - Confirmar prioridades e escopo
2. **Iniciar Etapa 1** - Feature flags são base para tudo
3. **Preparar migrations Supabase** - Estrutura de dados essencial
4. **Setup de ambiente de testes** - Validar permissões e segurança
5. **Documentar padrões** - Para futuras expansões do sistema

---

## 📝 **Observações Finais**

Este plano desenvolve o **Módulo Configurações** do zero até um sistema completo e robusto de configurações empresariais e pessoais. O módulo é crítico para o controle granular de funcionalidades via feature flags.

**Tempo Total Estimado:** 8-12 dias  
**Risco:** Alto (sistema complexo com muitas interdependências)  
**Impacto:** Crítico (controla disponibilidade de funcionalidades)

---

**Documento criado por:** Claude Code com Sequential Thinking MCP  
**Próxima atualização:** Após conclusão da Etapa 1  
**Status:** 📋 Pronto para implementação