# ✅ **Checklist de Implementação - Clerk Authentication**

> **Guia passo-a-passo para implementação completa do Clerk no ImobiPRO Dashboard**

---

## 🚀 **FASE 1: Configuração Base e Dependências**

### **1.1 Limpeza do Sistema Anterior**
- [ ] **Executar script de limpeza**: `.\scripts\cleanup-supabase.ps1`
- [ ] **Verificar remoção de arquivos**:
  - [ ] `src/integrations/supabase/` removido
  - [ ] `src/contexts/AuthContext.tsx` removido
  - [ ] `src/contexts/AuthContextMock.tsx` removido
  - [ ] `src/types/supabase.ts` removido
- [ ] **Verificar package.json**: sem dependências `@supabase/supabase-js`
- [ ] **Verificar imports**: nenhum import do Supabase restante
- [ ] **Verificar variáveis de ambiente**: sem variáveis `VITE_SUPABASE_*`

### **1.2 Instalação do Clerk**
- [ ] **Instalar dependência**: `pnpm add @clerk/react-router`
- [ ] **Remover dependência antiga**: `pnpm remove @clerk/clerk-react` (se existir)
- [ ] **Verificar instalação**: dependência aparece no `package.json`

### **1.3 Configuração de Variáveis de Ambiente**
- [ ] **Criar conta no Clerk**: https://clerk.com/
- [ ] **Configurar aplicação no Clerk Dashboard**
- [ ] **Obter chaves de API** (Publishable Key e Secret Key)
- [ ] **Configurar arquivo `.env`**:
  ```env
  VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
  CLERK_SECRET_KEY=sk_test_sua_chave_secreta
  VITE_CLERK_SIGN_IN_URL=/login
  VITE_CLERK_SIGN_UP_URL=/register
  VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
  VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
  ```
- [ ] **Atualizar `.env.example`** com as mesmas variáveis (sem valores)

### **1.4 Configuração do main.tsx**
- [ ] **Atualizar imports**: usar `@clerk/react-router`
- [ ] **Configurar ClerkProvider** com tema personalizado
- [ ] **Adicionar validação de variáveis de ambiente**
- [ ] **Configurar QueryClient** para integração com React Query
- [ ] **Testar carregamento**: aplicação deve carregar sem erros

---

## 🔐 **FASE 2: Componentes de Autenticação**

### **2.1 Páginas de Login e Registro**
- [ ] **Atualizar `src/pages/auth/Login.tsx`**:
  - [ ] Importar `SignIn` do Clerk
  - [ ] Implementar layout responsivo
  - [ ] Adicionar fallback de carregamento
  - [ ] Configurar redirecionamento para registro
- [ ] **Atualizar `src/pages/auth/Register.tsx`**:
  - [ ] Importar `SignUp` do Clerk
  - [ ] Implementar layout responsivo
  - [ ] Adicionar fallback de carregamento
  - [ ] Configurar redirecionamento para login
- [ ] **Testar páginas**: navegação e carregamento funcionais

### **2.2 Componentes de Proteção de Rotas**
- [ ] **Atualizar `src/components/auth/ProtectedRoute.tsx`**:
  - [ ] Migrar para hook `useAuth` do Clerk
  - [ ] Implementar verificação de carregamento
  - [ ] Adicionar tratamento de erros
  - [ ] Configurar redirecionamento com estado
- [ ] **Atualizar `src/components/auth/PublicRoute.tsx`**:
  - [ ] Migrar para hook `useAuth` do Clerk
  - [ ] Implementar redirecionamento para usuários logados
  - [ ] Adicionar fallback de carregamento
- [ ] **Testar proteção**: rotas protegidas e públicas funcionais

### **2.3 Componentes de Layout**
- [ ] **Atualizar `src/components/layout/DashboardHeader.tsx`**:
  - [ ] Migrar para hooks `useUser` e `useClerk`
  - [ ] Implementar `UserButton` do Clerk
  - [ ] Adicionar tratamento de loading states
  - [ ] Configurar menu de usuário
- [ ] **Atualizar `src/components/layout/DashboardLayout.tsx`**:
  - [ ] Integrar `ProtectedRoute` atualizado
  - [ ] Verificar carregamento de usuário
  - [ ] Adicionar fallbacks apropriados
- [ ] **Testar layout**: header e navegação funcionais

### **2.4 Página de Perfil**
- [ ] **Atualizar `src/pages/Profile.tsx`**:
  - [ ] Implementar `UserProfile` do Clerk
  - [ ] Configurar layout responsivo
  - [ ] Adicionar customização de tema
  - [ ] Testar edição de perfil
- [ ] **Testar funcionalidade**: edição de perfil completa

---

## 🔧 **FASE 3: Hooks Customizados e Integrações**

### **3.1 Hook para Fetch Autenticado**
- [ ] **Criar `src/hooks/useAuthenticatedFetch.ts`**:
  - [ ] Implementar função de fetch com token
  - [ ] Adicionar retry automático
  - [ ] Configurar tratamento de erros HTTP
  - [ ] Implementar timeout e rate limiting
- [ ] **Testar hook**: chamadas autenticadas funcionais

### **3.2 Integração com TanStack React Query**
- [ ] **Criar `src/hooks/useAuthenticatedQuery.ts`**:
  - [ ] Implementar query customizada com auth
  - [ ] Configurar cache e invalidação
  - [ ] Adicionar hooks específicos (useProperties, useContacts)
  - [ ] Implementar retry inteligente
- [ ] **Testar integração**: queries funcionais com autenticação

### **3.3 Hook para Tratamento de Erros**
- [ ] **Criar `src/hooks/useAuthError.ts`**:
  - [ ] Implementar tratamento de erros específicos do Clerk
  - [ ] Adicionar mensagens de erro traduzidas
  - [ ] Configurar logging de erros
  - [ ] Implementar função de logout
- [ ] **Testar tratamento**: erros exibidos adequadamente

### **3.4 Preparação para Supabase**
- [ ] **Criar `src/hooks/useSupabaseToken.ts`**:
  - [ ] Implementar obtenção de token JWT
  - [ ] Configurar template 'supabase'
  - [ ] Adicionar tratamento de erros
- [ ] **Documentar configuração**: JWT templates no Clerk Dashboard

---

## 🧪 **FASE 4: Testes e Validação**

### **4.1 Configuração de Testes**
- [ ] **Criar `src/test-utils/clerk-test-wrapper.tsx`**:
  - [ ] Implementar wrapper para testes
  - [ ] Configurar mocks do Clerk
  - [ ] Adicionar QueryClient para testes
  - [ ] Implementar função de render customizada
- [ ] **Testar configuração**: testes executam sem erros

### **4.2 Testes de Componentes**
- [ ] **Criar `src/components/auth/__tests__/ProtectedRoute.test.tsx`**:
  - [ ] Testar renderização com usuário logado
  - [ ] Testar redirecionamento sem usuário
  - [ ] Testar states de carregamento
- [ ] **Criar testes para outros componentes**:
  - [ ] PublicRoute
  - [ ] DashboardHeader
  - [ ] Login/Register pages
- [ ] **Executar testes**: todos os testes passam

### **4.3 Testes de Integração**
- [ ] **Testar fluxo completo de autenticação**:
  - [ ] Login → Dashboard → Logout
  - [ ] Registro → Verificação → Dashboard
  - [ ] Proteção de rotas → Redirecionamento
- [ ] **Testar integração com APIs**:
  - [ ] Chamadas autenticadas
  - [ ] Renovação de token
  - [ ] Tratamento de erros
- [ ] **Testar responsividade**: funciona em diferentes dispositivos

---

## 🎨 **FASE 5: Customização e UX**

### **5.1 Tema e Aparência**
- [ ] **Configurar tema dark personalizado**:
  - [ ] Cores do design system
  - [ ] Tipografia consistente
  - [ ] Espaçamentos padronizados
  - [ ] Bordas e sombras
- [ ] **Testar tema**: componentes seguem design system

### **5.2 Estados de Carregamento**
- [ ] **Implementar loading states**:
  - [ ] Skeleton loading para auth
  - [ ] Spinners apropriados
  - [ ] Fallbacks de erro
  - [ ] Mensagens de feedback
- [ ] **Testar UX**: transições suaves e feedback adequado

### **5.3 Responsividade**
- [ ] **Verificar componentes em diferentes tamanhos**:
  - [ ] Mobile (< 768px)
  - [ ] Tablet (768px - 1024px)
  - [ ] Desktop (> 1024px)
- [ ] **Testar navegação**: funcional em todos os dispositivos

### **5.4 Acessibilidade**
- [ ] **Verificar acessibilidade**:
  - [ ] Navegação por teclado
  - [ ] Screen readers
  - [ ] Contraste de cores
  - [ ] ARIA labels
- [ ] **Testar com ferramentas**: axe-core, WAVE

---

## 📊 **FASE 6: Monitoramento e Analytics**

### **6.1 Logging e Monitoramento**
- [ ] **Implementar logging estruturado**:
  - [ ] Eventos de autenticação
  - [ ] Erros e exceções
  - [ ] Performance metrics
- [ ] **Configurar analytics**: eventos de usuário

### **6.2 Métricas de Performance**
- [ ] **Medir tempos de carregamento**:
  - [ ] Tempo de autenticação
  - [ ] Tempo de carregamento de páginas
  - [ ] Tamanho do bundle
- [ ] **Otimizar performance**: lazy loading, code splitting

---

## 🚀 **FASE 7: Deploy e Produção**

### **7.1 Configuração de Produção**
- [ ] **Configurar variáveis de ambiente de produção**:
  - [ ] Chaves de produção do Clerk
  - [ ] URLs de produção
  - [ ] Configurações de segurança
- [ ] **Testar build de produção**: `pnpm build`

### **7.2 Testes de Produção**
- [ ] **Smoke tests em produção**:
  - [ ] Login funcional
  - [ ] Proteção de rotas
  - [ ] Logout funcional
  - [ ] APIs autenticadas
- [ ] **Monitorar erros**: configurar alertas

### **7.3 Documentação Final**
- [ ] **Atualizar README.md**:
  - [ ] Instruções de configuração
  - [ ] Variáveis de ambiente
  - [ ] Comandos de desenvolvimento
- [ ] **Criar changelog**: documentar mudanças
- [ ] **Atualizar documentação técnica**: APIs, componentes, hooks

---

## 🔄 **FASE 8: Manutenção e Melhorias**

### **8.1 Atualizações Futuras**
- [ ] **Planejar atualizações**:
  - [ ] Versões do Clerk
  - [ ] Funcionalidades adicionais
  - [ ] Integrações futuras
- [ ] **Configurar automação**: dependabot, CI/CD

### **8.2 Funcionalidades Avançadas**
- [ ] **Implementar funcionalidades adicionais**:
  - [ ] Multi-factor authentication
  - [ ] Social logins
  - [ ] Role-based access control
  - [ ] Webhooks do Clerk
- [ ] **Integração com Supabase**: JWT templates

---

## 📋 **RESUMO DE PROGRESSO**

### **Fases Concluídas:**
- [ ] **Fase 1**: Configuração Base (0/4 etapas)
- [ ] **Fase 2**: Componentes de Auth (0/4 etapas)
- [ ] **Fase 3**: Hooks e Integrações (0/4 etapas)
- [ ] **Fase 4**: Testes e Validação (0/3 etapas)
- [ ] **Fase 5**: Customização e UX (0/4 etapas)
- [ ] **Fase 6**: Monitoramento (0/2 etapas)
- [ ] **Fase 7**: Deploy e Produção (0/3 etapas)
- [ ] **Fase 8**: Manutenção (0/2 etapas)

### **Progresso Total: 0/30 etapas concluídas**

---

## 🎯 **Comandos Úteis**

```bash
# Limpeza completa
.\scripts\cleanup-supabase.ps1

# Instalação do Clerk
pnpm add @clerk/react-router

# Build e testes
pnpm build
pnpm test
pnpm dev

# Verificação de dependências
pnpm audit
pnpm outdated

# Commit estruturado
git add .
git commit -m "feat: implement clerk authentication"
```

---

**🎉 Siga este checklist para implementação completa e robusta do Clerk!** 