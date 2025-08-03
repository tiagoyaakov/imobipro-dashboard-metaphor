# 🔧 Plano de Refinamento - MÓDULO PROPRIEDADES

**Data de Criação:** 03/08/2025  
**Status:** 📋 Documento de Planejamento  
**Módulo:** Propriedades (Sistema de Gestão de Portfólio Imobiliário)  
**Última Atualização:** 03/08/2025  

---

## 📋 **Visão Geral**

Este documento detalha o plano de ações de implementação, correção e desenvolvimento para tornar o **Módulo Propriedades** **100% funcional**, com segurança aprimorada, integração Viva Real completamente operacional e cobertura completa de testes.

O módulo Propriedades está em situação excepcional: possui **95% das funcionalidades implementadas** e **arquitetura exemplar (8.2/10)**, mas com lacunas críticas de segurança, dependência quebrada (Viva Real) e ausência total de testes. O foco será corrigir os problemas críticos identificados na auditoria.

---

## 🎯 **STATUS ATUAL E PROBLEMAS IDENTIFICADOS**

### **📊 Status Atual (Baseado na Auditoria)**

| Aspecto | Status Atual | Meta |
|---------|-------------|------|
| **Funcionalidades** | 95% (implementação completa) | 100% operacional |
| **Segurança** | 65% (sem RLS) | 100% seguro |
| **Integração Viva Real** | 0% (serviço quebrado) | 100% funcional |
| **Testes** | 0% (ausência total) | 80% cobertura |
| **Performance** | 80% (otimizações básicas) | 95% otimizada |
| **Validações** | 40% (básicas apenas) | 100% robustas |

### **🚨 Problemas Críticos Identificados**

1. **Dependência quebrada crítica** - `vivaRealService.ts` não existe mas é importado
2. **Segurança vulnerável** - Sem RLS policies implementadas
3. **Hooks que falharão** - 4 hooks dependem do serviço ausente:
   - `useImportFromVivaReal()`
   - `useSyncProperty()`
   - `useSyncLogs()`
   - `useVivaRealStats()`
4. **Console.logs em produção** - Debug logs espalhados pelo código
5. **Validações insuficientes** - Falta CPF/CNPJ, CEP, coordenadas
6. **Schema inconsistencies** - Tabelas referenciadas podem não existir
7. **Hardcoded values** - Magic numbers e paths não configuráveis
8. **Ausência total de testes** - 0% de cobertura

### **✅ Pontos Fortes Identificados**
- Arquitetura sólida com separation of concerns exemplar
- UI/UX excepcional (9/10) com responsividade e acessibilidade
- CRUD completo implementado e funcional
- Sistema de cache inteligente com React Query
- Componentes reutilizáveis e bem estruturados
- Upload de imagens funcionando com Supabase Storage

---

## 🗓️ **CRONOGRAMA DE REFINAMENTO - 8-12 DIAS**

| Etapa | Descrição | Duração | Prioridade |
|-------|-----------|---------|------------|
| **1** | Correções Críticas | 3-4 dias | 🔴 CRÍTICA |
| **2** | Implementação Viva Real | 2-3 dias | 🟡 ALTA |
| **3** | Segurança e Validações | 2-3 dias | 🟡 ALTA |
| **4** | Testes e Otimizações | 1-2 dias | 🟢 IMPORTANTE |

---

## 🔧 **ETAPA 1: CORREÇÕES CRÍTICAS**
**Duração:** 3-4 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O módulo possui uma dependência quebrada crítica que impede 4 hooks de funcionarem. Além disso, há console.logs em produção, hardcoded values e schema inconsistencies que podem causar falhas em runtime.

### **📋 Objetivos Específicos**
- [ ] Implementar `vivaRealService.ts` completo e funcional
- [ ] Corrigir todos os hooks que dependem do serviço
- [ ] Remover todos os console.logs de produção
- [ ] Resolver hardcoded values com configurações
- [ ] Validar e corrigir schema inconsistencies
- [ ] Implementar error boundaries para componentes

### **🗂️ Tarefas Detalhadas**

#### **Task 1.1: Implementar vivaRealService.ts**
```typescript
// src/services/vivaRealService.ts (CRIAR)
- importFromJsonFile() - Importação de arquivos JSON Viva Real
- syncProperty() - Sincronização individual de propriedade
- getSyncLogs() - Histórico de sincronizações
- getSyncStats() - Estatísticas de sincronização
- validateVivaRealData() - Validação de dados Viva Real
- transformVivaRealToProperty() - Transformação de dados
```

#### **Task 1.2: Corrigir Hooks Dependentes**
```typescript
// src/hooks/useProperties.ts (MODIFICAR)
- useImportFromVivaReal() - Conectar ao serviço real
- useSyncProperty() - Implementar lógica de sync  
- useSyncLogs() - Buscar logs do Supabase
- useVivaRealStats() - Calcular estatísticas
- Adicionar error handling robusto
- Implementar retry automático
```

#### **Task 1.3: Limpar Console.logs e Debug Code**
```typescript
// Remover de todos os arquivos:
console.log('Error in getProperties:', error); // REMOVER
console.error('Debug info:', data); // REMOVER
// Substituir por logging proper com winston/pino
```

#### **Task 1.4: Resolver Hardcoded Values**
```typescript
// src/config/properties.ts (CRIAR)
const PROPERTY_CONFIG = {
  maxSalePrice: process.env.VITE_MAX_SALE_PRICE || 5000000,
  maxRentPrice: process.env.VITE_MAX_RENT_PRICE || 10000,
  placeholderImage: process.env.VITE_PROPERTY_PLACEHOLDER || '/placeholder-property.jpg',
  maxImagesPerProperty: 10,
  supportedImageTypes: ['jpg', 'jpeg', 'png', 'webp']
};
```

#### **Task 1.5: Validar Schema Database**
```sql
-- Verificar se existem no Supabase:
PropertyVivaRealData (se não existir, criar ou remover referências)
PropertyAppointment (se não existir, criar ou remover referências)

-- Implementar RPC ausente:
CREATE OR REPLACE FUNCTION searchPropertiesByLocation(...)
```

### **📁 Arquivos a Criar/Modificar**
- `src/services/vivaRealService.ts` - Serviço completo (CRIAR)
- `src/config/properties.ts` - Configurações (CRIAR)
- `src/hooks/useProperties.ts` - Corrigir hooks (MODIFICAR)
- `src/types/vivaReal.ts` - Types específicos (CRIAR)
- `src/utils/logger.ts` - Sistema de logging (CRIAR)
- `src/components/shared/ErrorBoundary.tsx` - Error handling (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para validar schema e RPC
- **Sequential Thinking**: Para estruturar correções complexas
- **backend-architect**: Para arquitetura do vivaRealService
- **api-tester**: Para testar integrações Viva Real

### **✅ Critérios de Aceite**
- vivaRealService.ts implementado e testado
- Todos os hooks funcionando sem erros
- Zero console.logs em código de produção
- Configurações externalizadas em arquivos próprios
- Schema database validado e consistente
- Error boundaries funcionando em todos os componentes

### **⚠️ Riscos e Mitigações**
- **Risco**: API Viva Real pode ter limitações não documentadas
- **Mitigação**: Implementar mock service para desenvolvimento e testes
- **Risco**: Schema changes podem quebrar funcionalidades existentes
- **Mitigação**: Migrations incrementais com rollback plan

### **🔗 Dependências**
- Supabase configurado com permissions adequadas
- Documentação API Viva Real (se disponível)
- Tokens/chaves de acesso para Viva Real (se necessário)

---

## 🏠 **ETAPA 2: IMPLEMENTAÇÃO VIVA REAL**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
A interface de importação Viva Real está 100% implementada mas sem backend funcional. Precisa criar integração real com parsing de dados, validação robusta e sistema de sincronização.

### **📋 Objetivos Específicos**
- [ ] Parser completo de dados JSON Viva Real
- [ ] Sistema de mapeamento de campos automático
- [ ] Validação robusta de dados importados
- [ ] Sistema de importação em lote otimizado
- [ ] Interface de monitoramento de importações
- [ ] Sistema de sincronização automática

### **🗂️ Tarefas Detalhadas**

#### **Task 2.1: Parser de Dados Viva Real**
```typescript
// src/utils/vivaRealParser.ts (CRIAR)
- parseVivaRealJson() - Parser principal
- validateVivaRealProperty() - Validação individual
- normalizePropertyData() - Normalização de dados
- extractImages() - Extração de URLs de imagens
- mapVivaRealFields() - Mapeamento de campos
```

#### **Task 2.2: Sistema de Importação em Lote**
```typescript
// src/services/importService.ts (CRIAR)
- BatchImporter class - Importação otimizada
- Progress tracking - Rastreamento de progresso
- Error handling per item - Tratamento individual
- Rollback capability - Capacidade de reverter
- Duplicate detection - Detecção de duplicatas
```

#### **Task 2.3: Interface de Monitoramento**
```typescript
// src/components/properties/ImportMonitor.tsx (CRIAR)
- Progress bar em tempo real
- Lista de erros e sucessos
- Estatísticas de importação
- Ações de retry e rollback
- Export de logs de importação
```

#### **Task 2.4: Sistema de Sincronização**
```typescript
// src/services/syncService.ts (CRIAR)
- Sync automático baseado em scheduler
- Detecção de mudanças
- Merge de dados conflitantes
- Histórico de sincronizações
```

### **📁 Arquivos a Criar/Modificar**
- `src/utils/vivaRealParser.ts` - Parser de dados (CRIAR)
- `src/services/importService.ts` - Importação em lote (CRIAR)
- `src/components/properties/ImportMonitor.tsx` - Interface de monitoramento (CRIAR)
- `src/services/syncService.ts` - Sincronização automática (CRIAR)
- `src/components/properties/VivaRealImport.tsx` - Conectar ao backend (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **Context7**: Para pesquisar estrutura de dados Viva Real
- **backend-architect**: Para arquitetura de importação
- **performance-benchmarker**: Para otimização de lote
- **ui-designer**: Para UX de monitoramento

### **✅ Critérios de Aceite**
- Parser processa arquivos JSON Viva Real sem erros  
- Importação em lote funciona com 100+ propriedades
- Interface de monitoramento mostra progresso em tempo real
- Sistema detecta e trata duplicatas automaticamente
- Sincronização automática funciona sem intervenção manual

---

## 🔐 **ETAPA 3: SEGURANÇA E VALIDAÇÕES**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
A maior vulnerabilidade do módulo é a ausência de RLS policies e validações robustas. É crítico implementar segurança adequada e validações client/server-side completas.

### **📋 Objetivos Específicos**
- [ ] Implementar RLS policies completas
- [ ] Sistema de permissões granulares
- [ ] Validações robustas client e server-side
- [ ] Sanitização de inputs para prevenir ataques
- [ ] Auditoria automática de ações
- [ ] Rate limiting para uploads e importações

### **🗂️ Tarefas Detalhadas**

#### **Task 3.1: Implementar RLS Policies**
```sql
-- Políticas de segurança no Supabase:
CREATE POLICY "properties_select_policy" ON properties
FOR SELECT USING (
  CASE 
    WHEN user_role() = 'DEV_MASTER' THEN true
    WHEN user_role() = 'ADMIN' THEN company_id = user_company_id()
    WHEN user_role() = 'AGENT' THEN agent_id = user_id()
    ELSE false
  END
);

-- Políticas para INSERT, UPDATE, DELETE
-- Políticas para PropertyOwner e PropertyImage
```

#### **Task 3.2: Sistema de Permissões Granulares**
```typescript
// src/utils/permissions.ts (CRIAR)
- canCreateProperty() - Verificar criação
- canEditProperty() - Verificar edição  
- canDeleteProperty() - Verificar exclusão
- canImportVivaReal() - Verificar importação
- hasPropertyAccess() - Verificar acesso individual
```

#### **Task 3.3: Validações Robustas**
```typescript
// src/utils/validators.ts (CRIAR)
- validateCPF() - Validação de CPF brasileiro
- validateCNPJ() - Validação de CNPJ brasileiro
- validateCEP() - Validação de CEP com lookup
- validateCoordinates() - Validação de lat/lng
- sanitizeInput() - Sanitização contra XSS
- validatePropertyData() - Validação completa
```

#### **Task 3.4: Auditoria e Logging**
```typescript
// src/services/auditService.ts (CRIAR)
- Log de todas as operações CRUD
- Rastreamento de mudanças
- IP tracking e user agent
- Detecção de atividade suspeita
- Reports de auditoria
```

### **📁 Arquivos a Criar/Modificar**
- `supabase/migrations/rls_properties.sql` - RLS policies (CRIAR)
- `src/utils/permissions.ts` - Sistema de permissões (CRIAR)
- `src/utils/validators.ts` - Validações robustas (CRIAR)
- `src/services/auditService.ts` - Auditoria (CRIAR)
- `src/middleware/rateLimiter.ts` - Rate limiting (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para RLS policies
- **Semgrep Security**: Para validação de segurança
- **backend-architect**: Para arquitetura de segurança
- **legal-compliance-checker**: Para validações de compliance

### **✅ Critérios de Aceite**
- RLS policies bloqueiam acesso não autorizado
- Todas as validações funcionando client e server-side
- Inputs sanitizados contra ataques de injeção
- Auditoria registra todas as operações críticas
- Rate limiting impede abuso de APIs

### **⚠️ Riscos e Mitigações**
- **Risco**: RLS muito restritivo pode quebrar funcionalidades
- **Mitigação**: Testes extensivos com diferentes roles antes do deploy
- **Risco**: Validações podem impactar performance
- **Mitigação**: Validações assíncronas e cache de validações

---

## 🧪 **ETAPA 4: TESTES E OTIMIZAÇÕES**
**Duração:** 1-2 dias | **Prioridade:** 🟢 IMPORTANTE

### **🎯 Contexto**
O módulo tem 0% de cobertura de testes, representando risco significativo. Precisa implementar cobertura completa e otimizações de performance identificadas na auditoria.

### **📋 Objetivos Específicos**
- [ ] Testes unitários para todos os componentes críticos
- [ ] Testes de integração com Supabase e Viva Real
- [ ] Testes de segurança e RLS policies
- [ ] Otimizações de performance (debouncing, lazy loading)
- [ ] Testes de carga para importações
- [ ] Coverage report e métricas de qualidade

### **🗂️ Tarefas Detalhadas**

#### **Task 4.1: Testes Unitários Core**
```typescript
// src/tests/properties/
- PropertyCard.test.tsx - 4 variantes + interações
- PropertyFilters.test.tsx - 15+ filtros
- propertiesService.test.ts - CRUD operations
- vivaRealService.test.ts - Importação e sync
- validators.test.ts - Todas as validações
```

#### **Task 4.2: Testes de Integração**
```typescript
// src/tests/integration/properties/
- SupabaseIntegration.test.tsx - CRUD com RLS
- VivaRealImport.integration.test.tsx - Importação completa
- ImageUpload.integration.test.tsx - Upload Supabase Storage
- PermissionSystem.integration.test.tsx - Controle de acesso
```

#### **Task 4.3: Testes de Segurança**
```typescript
// src/tests/security/properties/
- RLSPolicies.test.ts - Políticas de segurança
- InputSanitization.test.ts - Sanitização
- PermissionChecks.test.ts - Sistema de permissões
- AuditTrail.test.ts - Auditoria
```

#### **Task 4.4: Otimizações de Performance**
```typescript
// Implementar:
- Debouncing na busca (300ms)
- Lazy loading para imagens
- Virtual scrolling para listas grandes
- Prefetch inteligente de dados
- Memoização de cálculos caros
```

### **📁 Arquivos a Criar/Modificar**
- `src/tests/properties/PropertyCard.test.tsx` (CRIAR)
- `src/tests/properties/propertiesService.test.ts` (CRIAR)
- `src/tests/integration/properties/SupabaseIntegration.test.tsx` (CRIAR)
- `src/tests/security/properties/RLSPolicies.test.ts` (CRIAR)
- `src/utils/performance.ts` - Otimizações (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **test-writer-fixer**: Para criação e manutenção dos testes
- **performance-benchmarker**: Para otimizações de performance
- **Semgrep Security**: Para validação de testes de segurança

### **✅ Critérios de Aceite**
- Cobertura de testes > 80%
- Todos os cenários críticos testados
- Testes de RLS validando segurança
- Performance melhorada em 30%+ nas operações críticas
- Zero quebras em testes de regressão

---

## 📊 **MÉTRICAS DE SUCESSO**

| Métrica | Estado Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| **Funcionalidades** | 95% | 100% | Todos os hooks funcionais |
| **Segurança** | 65% | 100% | RLS policies ativas |
| **Viva Real Integration** | 0% | 100% | Importação funcional |
| **Testes** | 0% | 80% | Coverage report |
| **Performance** | 80% | 95% | Lighthouse + carga |
| **Validações** | 40% | 100% | Todas as validações ativas |

---

## 🎯 **RECURSOS NECESSÁRIOS**

### **MCPs Principais**
- **Sequential Thinking**: Estruturação de correções complexas
- **Supabase Integration**: RLS policies e queries complexas
- **Context7**: Documentação Viva Real, validações brasileiras
- **Semgrep Security**: Validação de código seguro
- **Memory Management**: Contexto de implementações

### **Agents Especializados**
- **backend-architect**: Arquitetura de segurança e integrações
- **frontend-developer**: Correções de componentes React
- **api-tester**: Testes de integrações Viva Real e Supabase
- **performance-benchmarker**: Otimizações e testes de carga
- **test-writer-fixer**: Cobertura completa de testes
- **legal-compliance-checker**: Validações de compliance brasileiro

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Investigar dependência quebrada** - Confirmar se vivaRealService é realmente necessário
2. **Preparar dados de teste** - Propriedades, proprietários, arquivos Viva Real
3. **Configurar ambiente de segurança** - RLS policies em ambiente de teste
4. **Setup de validações brasileiras** - APIs de CEP, CPF/CNPJ
5. **Documentar APIs Viva Real** - Se disponível, mapear estrutura de dados

---

## 📝 **Observações Finais**

O **Módulo Propriedades** é uma implementação **exemplar** em termos de arquitetura e funcionalidades (8.2/10), mas tem **vulnerabilidades críticas** que impedem uso em produção. O foco será exclusivamente nas **correções de segurança** e **dependências quebradas**.

**Diferencial Técnico:**
- Arquitetura sólida com patterns modernos
- UI/UX excepcional e acessível
- Sistema de cache inteligente implementado
- CRUD completo e funcional
- Upload de imagens robusto

**Principais Desafios:**
- Implementar vivaRealService sem documentação clara
- Balancear RLS policies sem quebrar funcionalidades
- Manter performance alta com validações robustas

**Tempo Total Estimado:** 8-12 dias  
**Risco:** Médio (infraestrutura sólida, problemas conhecidos)  
**Impacto:** Alto (módulo core do sistema)  
**Complexidade:** Média-Alta (correções críticas + integrações)

---

**Documento criado por:** Claude Code com Sequential Thinking MCP  
**Próxima atualização:** Após conclusão da Etapa 1  
**Status:** 📋 Pronto para implementação