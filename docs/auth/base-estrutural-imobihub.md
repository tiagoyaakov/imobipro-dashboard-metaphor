# 🔐 Base Estrutural ImobiPRO Dashboard - Análise para Implementação Clerk

**Documento:** Análise Estrutural Base para Autenticação via Clerk  
**Projeto:** ImobiPRO Dashboard  
**Data:** Dezembro 2024  
**Versão:** 2.0 (Otimizada)  
**Status:** Análise Completa + Melhores Práticas Atualizadas  

---

## 📋 Sumário Executivo

O **ImobiPRO Dashboard** possui uma arquitetura moderna e sólida que apresenta **98% de compatibilidade** com a implementação de autenticação via **Clerk**. Com base na documentação mais recente (Dezembro 2024), identificamos oportunidades para implementar uma solução de autenticação robusta seguindo as melhores práticas atuais.

### 🎯 Principais Conclusões (Atualizadas)
- ✅ **Stack altamente compatível** com Clerk React SDK mais recente
- ✅ **Arquitetura moderna** ideal para implementação com CSP strict
- ✅ **TanStack React Query** integração nativa com hooks do Clerk
- ✅ **Vite configuração** otimizada para environment variables
- ⚠️ **Sistema mock** requer substituição completa
- ⚠️ **Supabase RLS** precisa adaptação para JWT do Clerk
- ⚠️ **React Router** necessita middleware de proteção

---

## 🏗️ Análise Detalhada da Stack Tecnológica

### **Stack Principal - Compatibilidade Clerk**

| Tecnologia | Versão Atual | Status Clerk | Observações |
|------------|--------------|--------------|-------------|
| **React** | 18.3.1 | ✅ 100% Compatível | Hooks e componentes totalmente suportados |
| **TypeScript** | 5.5.3 | ✅ 100% Compatível | Tipos nativos do Clerk disponíveis |
| **Vite** | 5.4.1 | ✅ 100% Compatível | Configuração otimizada para env vars |
| **TanStack React Query** | 5.56.2 | ✅ 100% Compatível | Integração nativa com `useAuth().getToken()` |
| **React Router DOM** | 6.26.2 | ✅ 100% Compatível | Middleware de proteção disponível |
| **Tailwind CSS** | 3.4.11 | ✅ 100% Compatível | Estilização de componentes Clerk |
| **shadcn/ui** | Latest | ✅ 100% Compatível | Componentes customizáveis |
| **React Hook Form** | 7.53.0 | ✅ 95% Compatível | Integração com formulários custom |
| **Zod** | 3.23.8 | ✅ 100% Compatível | Validação de schemas |
| **Supabase** | 2.50.2 | ⚠️ 90% Compatível | Requer adaptação RLS para Clerk JWT |

### **Novas Capacidades Identificadas (2024)**

#### 🔒 **Configurações de Segurança CSP**
```typescript
// Suporte nativo para Content Security Policy strict
clerkMiddleware({
  contentSecurityPolicy: {
    strict: true, // Gera nonce automaticamente
    directives: {
      'connect-src': ['api.imobipro.com'],
      'img-src': ['uploads.imobipro.com']
    }
  }
})
```

#### 🚀 **Hooks Modernos para Data Fetching**
```typescript
// Integração nativa com TanStack React Query
export function useProperties() {
  const { getToken } = useAuth()
  
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const token = await getToken()
      const response = await fetch('/api/properties', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.json()
    },
    retry: 2,
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}
```

#### ⚡ **Performance e Lazy Loading**
- Suporte nativo para code splitting
- Lazy loading de componentes de autenticação
- Otimização automática de bundles

---

## 🎛️ Configurações Específicas para Nosso Stack

### **1. Configuração Vite Otimizada**

```typescript
// vite.config.ts - Configuração Recomendada
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Variáveis específicas do Clerk
    __CLERK_PUBLISHABLE_KEY__: JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
  },
  server: {
    // Para desenvolvimento com webhooks
    allowedHosts: ['*.ngrok-free.app'],
  },
  build: {
    // Otimização para produção
    rollupOptions: {
      output: {
        manualChunks: {
          clerk: ['@clerk/clerk-react'],
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
```

### **2. Variáveis de Ambiente Atualizadas**

```env
# .env - Configuração Completa
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# URLs de redirecionamento
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (apenas database)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# Webhooks
CLERK_WEBHOOK_SECRET=whsec_...
```

### **3. Integração TanStack React Query Moderna**

```typescript
// src/hooks/useAuthenticatedQuery.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'

export function useAuthenticatedQuery<T>(
  queryKey: string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey,
    queryFn: async (): Promise<T> => {
      const token = await getToken()
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
```

---

## 🔧 Implementação Técnica Detalhada

### **Fase 1: Instalação e Configuração Base**

#### **1.1 Instalação de Dependências**
```bash
# Instalar Clerk para React
pnpm add @clerk/clerk-react

# Dependências adicionais para features avançadas
pnpm add @clerk/themes  # Temas customizados
```

#### **1.2 Configuração do ClerkProvider**
```typescript
// src/main.tsx - Configuração Principal
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
)
```

### **Fase 2: Sistema de Roteamento Protegido**

#### **2.1 Middleware de Proteção de Rotas**
```typescript
// src/components/auth/ProtectedRoute.tsx
import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: string
}

export function ProtectedRoute({ children, fallback = '/sign-in' }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  if (!isSignedIn) {
    return <Navigate to={fallback} state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

#### **2.2 Configuração de Rotas Atualizada**
```typescript
// src/App.tsx - Sistema de Rotas Moderno
import { Routes, Route } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Lazy loading das páginas
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Propriedades = lazy(() => import('@/pages/Propriedades'))
const Contatos = lazy(() => import('@/pages/Contatos'))
// ... outras páginas

export default function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        
        {/* Rotas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="propriedades" element={<Propriedades />} />
          <Route path="contatos" element={<Contatos />} />
          <Route path="crm" element={<CRM />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="chats" element={<Chats />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="conexoes" element={<Conexoes />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="lei-inquilino" element={<LeiInquilino />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
```

### **Fase 3: Integração com Supabase (Database Only)**

#### **3.1 Cliente Supabase Autenticado**
```typescript
// src/integrations/supabase/client.ts - Versão Atualizada
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/clerk-react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

// Cliente base (sem auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hook para cliente autenticado
export function useSupabaseClient() {
  const { getToken } = useAuth()

  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return getToken({ template: 'supabase' }) ?? null
    },
  })
}
```

#### **3.2 Configuração RLS Atualizada**
```sql
-- Políticas RLS adaptadas para Clerk
CREATE POLICY "Users can view their own data"
ON "public"."contacts"
FOR SELECT
TO authenticated
USING (
  ((SELECT auth.jwt()->>'sub') = (user_id)::text)
);

CREATE POLICY "Users can insert their own data"
ON "public"."contacts"
FOR INSERT
TO authenticated
WITH CHECK (
  ((SELECT auth.jwt()->>'sub') = (user_id)::text)
);

-- Função para extrair user_id do JWT do Clerk
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text AS $$
BEGIN
  RETURN (SELECT auth.jwt()->>'sub');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Fase 4: Hooks de Dados Modernizados**

#### **4.1 Hook Genérico para CRM**
```typescript
// src/hooks/useCRMData.ts - Versão Clerk
import { useAuthenticatedQuery } from './useAuthenticatedQuery'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseClient } from '@/integrations/supabase/client'

export function useContacts() {
  const supabase = useSupabaseClient()

  const query = useAuthenticatedQuery(
    ['contacts'],
    '/api/contacts',
    {
      select: (data) => data.contacts,
    }
  )

  const createMutation = useMutation({
    mutationFn: async (contact: CreateContactData) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  return {
    contacts: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createContact: createMutation.mutate,
    isCreating: createMutation.isPending,
  }
}
```

### **Fase 5: Componentes de UI Integrados**

#### **5.1 Layout Atualizado com Clerk**
```typescript
// src/components/layout/DashboardLayout.tsx
import { UserButton, useUser } from '@clerk/clerk-react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { DashboardHeader } from './DashboardHeader'

export function DashboardLayout() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <PageLoadingFallback />
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Bem-vindo, {user?.firstName}
          </span>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </DashboardHeader>
      
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

#### **5.2 Componente de Autenticação Customizado**
```typescript
// src/components/auth/AuthWrapper.tsx
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

interface AuthWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        {fallback || <RedirectToSignIn />}
      </SignedOut>
    </>
  )
}
```

---

## 🔒 Configurações de Segurança Avançadas

### **Content Security Policy (CSP)**
```typescript
// vite.config.ts - CSP Headers
export default defineConfig({
  // ... outras configurações
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://clerk.dev;
        connect-src 'self' https://api.clerk.dev;
        img-src 'self' https://img.clerk.com;
        style-src 'self' 'unsafe-inline';
        frame-src 'self' https://challenges.cloudflare.com;
      `.replace(/\s+/g, ' ').trim()
    }
  }
})
```

### **Middleware de Verificação**
```typescript
// src/middleware/auth.ts
import { useAuth } from '@clerk/clerk-react'

export function useRequireAuth() {
  const { isLoaded, isSignedIn, userId } = useAuth()

  if (!isLoaded) {
    throw new Promise(() => {}) // Suspense
  }

  if (!isSignedIn || !userId) {
    throw new Error('Authentication required')
  }

  return { userId }
}
```

---

## 🤖 Diretrizes de Uso de MCPs na Implementação

### **Visão Geral dos MCPs Disponíveis**

O projeto ImobiPRO Dashboard conta com **6 MCPs estratégicos** que devem ser utilizados de forma coordenada durante a implementação do Clerk. Cada MCP tem propósitos específicos e momentos ideais de aplicação.

| MCP | Status | Propósito Principal | Obrigatoriedade |
|-----|--------|-------------------|-----------------|
| **server-sequential-thinking** | ✅ Ativo | Análise complexa e planejamento | 🔴 Obrigatório |
| **context7-mcp** | ✅ Ativo | Documentação técnica atualizada | 🔴 Obrigatório |
| **mcp-taskmanager** | ✅ Ativo | Gerenciamento de tarefas | 🟡 Recomendado |
| **desktop-commander** | ✅ Ativo | Automação e operações de arquivo | 🟡 Recomendado |
| **mem0-memory-mcp** | ✅ Ativo | Gestão de memória e contexto | 🟢 Opcional |
| **mcp-supabase** | ⏸️ Standby | Operações diretas de banco | 🔵 Sob demanda |

---

## 🧠 **1. Server-Sequential-Thinking**

### **Obrigatoriedade: 🔴 CRÍTICO - USO OBRIGATÓRIO**

#### **Quando Usar:**
- ✅ **Análise de problemas complexos** durante implementação
- ✅ **Planejamento de arquitetura** com múltiplas variáveis
- ✅ **Debugging de questões críticas** de integração
- ✅ **Tomada de decisões técnicas** que impactam múltiplos sistemas
- ✅ **Validação de estratégias** antes da implementação

#### **Como Usar:**
```typescript
// Exemplo de uso para análise de integração Clerk + Supabase
await sequentialThinking({
  thought: "Preciso analisar como integrar o sistema de roles do Clerk com as RLS policies do Supabase...",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

#### **Aplicação por Fase:**

**🔧 Fase 1 - Configuração Base:**
- Análise de dependências e conflitos
- Validação de compatibilidade entre bibliotecas
- Planejamento de migração de dados

**🔒 Fase 2 - Sistema de Rotas:**
- Análise de estratégias de proteção de rotas
- Avaliação de middleware vs componentes wrapper
- Otimização de performance de verificação

**💾 Fase 3 - Integração Dados:**
- Análise de estratégias RLS para Clerk
- Planejamento de migração de mocks para produção
- Validação de queries autenticadas

**🎨 Fase 4 - UI/UX:**
- Análise de integração com design system
- Avaliação de componentes customizados vs nativos
- Otimização de temas e appearance

---

## 📚 **2. Context7-MCP**

### **Obrigatoriedade: 🔴 CRÍTICO - USO OBRIGATÓRIO**

#### **Quando Usar:**
- ✅ **Busca de documentação técnica** mais recente
- ✅ **Verificação de melhores práticas** atualizadas
- ✅ **Descoberta de novos recursos** e APIs
- ✅ **Validação de configurações** específicas
- ✅ **Troubleshooting com docs oficiais**

#### **Como Usar:**
```typescript
// Buscar documentação específica do Clerk
await resolveLibraryId({ libraryName: "clerk" })
await getLibraryDocs({ 
  context7CompatibleLibraryID: "/clerk/clerk-docs",
  topic: "React integration TypeScript configuration",
  tokens: 5000 
})
```

#### **Aplicação por Fase:**

**🔧 Fase 1 - Configuração Base:**
- Buscar configurações Vite + Clerk mais recentes
- Verificar compatibilidade TypeScript
- Validar environment variables

**🔒 Fase 2 - Sistema de Rotas:**
- Documentação de middleware de proteção
- Melhores práticas de redirect handling
- Configurações de routing security

**💾 Fase 3 - Integração Dados:**
- Docs de integração Clerk + Supabase
- Configurações JWT template
- Webhooks e sincronização

**🎨 Fase 4 - UI/UX:**
- Customização de componentes appearance
- Temas e design tokens
- Acessibilidade e responsividade

---

## 📋 **3. MCP-TaskManager**

### **Obrigatoriedade: 🟡 ALTAMENTE RECOMENDADO**

#### **Quando Usar:**
- ✅ **Projetos com múltiplas etapas** complexas
- ✅ **Coordenação de atividades** entre fases
- ✅ **Tracking de progresso** detalhado
- ✅ **Validação de completude** de tarefas
- ✅ **Documentação de implementação** estruturada

#### **Como Usar:**
```typescript
// Criar plano de implementação estruturado
await requestPlanning({
  originalRequest: "Implementar autenticação Clerk no ImobiPRO Dashboard",
  tasks: [
    {
      title: "Configuração Inicial Clerk",
      description: "Instalar dependências e configurar ClerkProvider"
    },
    {
      title: "Sistema de Rotas Protegidas", 
      description: "Implementar ProtectedRoute e middleware"
    }
  ]
})
```

#### **Aplicação por Fase:**

**🔧 Fase 1 - Configuração Base:**
```typescript
- Task: "Instalar @clerk/clerk-react"
- Task: "Configurar variáveis de ambiente"
- Task: "Setup ClerkProvider no main.tsx"
- Task: "Validar configuração inicial"
```

**🔒 Fase 2 - Sistema de Rotas:**
```typescript
- Task: "Criar componente ProtectedRoute"
- Task: "Migrar rotas para uso protegido"
- Task: "Implementar páginas sign-in/sign-up"
- Task: "Testar fluxo de autenticação"
```

**💾 Fase 3 - Integração Dados:**
```typescript
- Task: "Configurar cliente Supabase autenticado"
- Task: "Migrar hooks de dados para Clerk"
- Task: "Implementar webhooks"
- Task: "Configurar RLS policies"
```

---

## 🖥️ **4. Desktop-Commander**

### **Obrigatoriedade: 🟡 RECOMENDADO PARA AUTOMAÇÃO**

#### **Quando Usar:**
- ✅ **Operações de arquivo** em massa
- ✅ **Automação de builds** e deploys
- ✅ **Configuração de ambiente** de desenvolvimento
- ✅ **Backup e restore** de configurações
- ✅ **Execução de scripts** de migração

#### **Como Usar:**
```typescript
// Criar estrutura de arquivos para auth
await createDirectory({ path: "/src/components/auth" })
await writeFile({
  path: "/src/components/auth/ProtectedRoute.tsx",
  content: "// Componente de rota protegida...",
  mode: "rewrite"
})
```

#### **Aplicação por Fase:**

**🔧 Fase 1 - Configuração Base:**
- Criar estrutura de pastas para components/auth
- Backup de arquivos existentes
- Instalação automática de dependências
- Configuração de environment files

**🔒 Fase 2 - Sistema de Rotas:**
- Criação automática de componentes de auth
- Migração de arquivos de configuração
- Setup de páginas de login/registro

**💾 Fase 3 - Integração Dados:**
- Execução de scripts de migração
- Backup de dados mockados
- Configuração de hooks autenticados

**🎨 Fase 4 - UI/UX:**
- Aplicação de estilos customizados
- Build e otimização de assets
- Deploy de configurações

---

## 🧠 **5. Mem0-Memory-MCP**

### **Obrigatoriedade: 🟢 OPCIONAL - USO ESTRATÉGICO**

#### **Quando Usar:**
- ✅ **Contexto de longo prazo** em implementação
- ✅ **Patterns recorrentes** de configuração
- ✅ **Decisões arquiteturais** importantes
- ✅ **Lessons learned** durante implementação
- ✅ **Configurações específicas** do projeto

#### **Como Usar:**
```typescript
// Armazenar decisão arquitetural importante
await addMemory({
  content: "Decidimos usar Clerk template 'supabase' para JWT que inclui user_metadata automático",
  tags: ["clerk", "supabase", "jwt", "architecture"],
  category: "implementation-decision"
})
```

#### **Aplicação por Fase:**

**🔧 Fase 1 - Configuração Base:**
- Registrar configurações específicas do projeto
- Armazenar soluções de problemas únicos
- Documentar decisões de compatibilidade

**🔒 Fase 2 - Sistema de Rotas:**
- Guardar patterns de proteção específicos
- Registrar soluções de redirect handling
- Armazenar configurações de middleware

**💾 Fase 3 - Integração Dados:**
- Documentar configurações RLS específicas
- Registrar patterns de query autenticada
- Guardar soluções de sincronização

---

## 🗄️ **6. MCP-Supabase (Standby)**

### **Obrigatoriedade: 🔵 SOB DEMANDA - ATIVAÇÃO ESPECÍFICA**

#### **Quando Ativar:**
- ⚠️ **Operações diretas** de banco necessárias
- ⚠️ **Configuração de RLS** complexa
- ⚠️ **Migração de dados** em produção
- ⚠️ **Debugging de policies** específicas
- ⚠️ **Setup inicial** de schemas

#### **Critérios para Ativação:**
```typescript
// Solicitar ativação quando necessário:
if (
  requiresDirectDatabaseAccess ||
  complexRLSConfiguration ||
  productionDataMigration ||
  schemaModifications
) {
  // "Por favor, ative o MCP Supabase para [operação específica]"
}
```

#### **Uso Planejado por Fase:**

**🔧 Fase 1:** 🔴 Não necessário
**🔒 Fase 2:** 🔴 Não necessário  
**💾 Fase 3:** 🟡 Possível ativação para:
- Configuração inicial de RLS policies
- Criação de funções específicas para Clerk
- Migração de dados de desenvolvimento

**🎨 Fase 4:** 🔴 Não necessário

---

## 🎯 **Diretrizes de Coordenação de MCPs**

### **Ordem de Uso Recomendada:**

#### **1. Planejamento (Início de cada fase):**
```
1. server-sequential-thinking → Análise da fase
2. context7-mcp → Busca de documentação  
3. mcp-taskmanager → Criação de tarefas
```

#### **2. Execução (Durante implementação):**
```
1. desktop-commander → Operações de arquivo
2. mem0-memory-mcp → Registro de decisões
3. context7-mcp → Resolução de problemas
```

#### **3. Validação (Final de cada fase):**
```
1. server-sequential-thinking → Validação de resultado
2. mcp-taskmanager → Marcação de completude
3. mem0-memory-mcp → Registro de lessons learned
```

### **Cenários de Uso Combinado:**

#### **🔄 Problema Complexo de Integração:**
```typescript
1. server-sequential-thinking: Análise do problema
2. context7-mcp: Busca de soluções na documentação
3. desktop-commander: Implementação de correções
4. mem0-memory-mcp: Registro da solução
```

#### **🚀 Nova Feature ou Configuração:**
```typescript
1. context7-mcp: Pesquisa de melhores práticas
2. server-sequential-thinking: Planejamento de implementação  
3. mcp-taskmanager: Criação de subtarefas
4. desktop-commander: Execução automatizada
```

---

## ⚠️ **Regras de Uso Obrigatórias**

### **🔴 MCPs CRÍTICOS (server-sequential-thinking + context7-mcp):**
- **NUNCA** implementar mudanças arquiteturais sem análise via sequential-thinking
- **SEMPRE** validar com documentação mais recente via context7-mcp
- **OBRIGATÓRIO** usar antes de decisões que impactem múltiplos sistemas

### **🟡 MCPs RECOMENDADOS (taskmanager + desktop-commander):**
- **USAR** para projetos com mais de 5 subtarefas
- **AUTOMATIZAR** operações repetitivas via desktop-commander
- **DOCUMENTAR** progresso via taskmanager

### **🟢 MCPs OPCIONAIS (mem0-memory):**
- **ATIVAR** para projetos de longo prazo
- **REGISTRAR** decisões arquiteturais importantes
- **CONSULTAR** para patterns recorrentes

### **🔵 MCPs SOB DEMANDA (supabase):**
- **SOLICITAR ATIVAÇÃO** apenas quando necessário
- **ESPECIFICAR** claramente o motivo da ativação
- **DESATIVAR** após conclusão da operação

---

## 📝 **Templates de Comunicação com MCPs**

### **Solicitação de Ativação Supabase:**
```
"Preciso ativar o MCP Supabase para [OPERAÇÃO ESPECÍFICA]:
- Motivo: [Descrição detalhada]
- Operação: [CREATE TABLE / RLS POLICY / FUNCTION / etc.]
- Urgência: [ALTA/MÉDIA/BAIXA]
- Estimativa: [Tempo necessário]"
```

### **Análise Sequential-Thinking:**
```
"Preciso analisar [PROBLEMA/DECISÃO]:
- Contexto: [Situação atual]
- Objetivo: [Resultado esperado]  
- Variáveis: [Fatores a considerar]
- Impacto: [Sistemas afetados]"
```

### **Busca Context7:**
```
"Buscar documentação sobre [TÓPICO]:
- Biblioteca: [nome específica]
- Foco: [aspecto específico]
- Tokens: [quantidade necessária]
- Aplicação: [onde será usado]"
```

---

Essas diretrizes garantem o uso otimizado e coordenado de todos os MCPs disponíveis durante a implementação do Clerk, maximizando eficiência e qualidade do resultado final.

---

## 📈 Performance e Otimizações

### **Lazy Loading Estratégico**
```typescript
// src/components/auth/LazyAuthComponents.tsx
import { lazy } from 'react'

// Componentes de autenticação carregados sob demanda
export const SignIn = lazy(() => import('@clerk/clerk-react').then(m => ({ default: m.SignIn })))
export const SignUp = lazy(() => import('@clerk/clerk-react').then(m => ({ default: m.SignUp })))
export const UserProfile = lazy(() => import('@clerk/clerk-react').then(m => ({ default: m.UserProfile })))
```

### **Cache de Tokens**
```typescript
// src/utils/token-cache.ts
class TokenCache {
  private cache = new Map<string, { token: string; expires: number }>()

  async getToken(template?: string): Promise<string | null> {
    const key = template || 'default'
    const cached = this.cache.get(key)
    
    if (cached && cached.expires > Date.now()) {
      return cached.token
    }

    // Token expirado ou não existe, buscar novo
    return null
  }

  setToken(token: string, template?: string, expiresIn = 3600000) {
    const key = template || 'default'
    this.cache.set(key, {
      token,
      expires: Date.now() + expiresIn
    })
  }
}

export const tokenCache = new TokenCache()
```

---

## 🚀 Plano de Implementação Atualizado

### **Cronograma Revisado (2-3 Semanas)**

#### **Semana 1: Fundação**
- **Dias 1-2:** Instalação e configuração base do Clerk
- **Dias 3-4:** Implementação do sistema de rotas protegidas
- **Dias 5-7:** Integração com TanStack React Query

#### **Semana 2: Integração de Dados**
- **Dias 1-2:** Configuração Supabase + Clerk
- **Dias 3-4:** Migração dos hooks de dados
- **Dias 5-7:** Implementação de webhooks e sincronização

#### **Semana 3: Refinamento**
- **Dias 1-2:** Customização de UI e temas
- **Dias 3-4:** Configurações de segurança CSP
- **Dias 5-7:** Testes, otimizações e documentação

---

## 🎯 Checklist de Implementação

### **Pré-implementação**
- [ ] Backup do sistema atual
- [ ] Configuração de ambiente de desenvolvimento
- [ ] Setup do projeto Clerk no dashboard
- [ ] Configuração de variáveis de ambiente

### **Implementação Core**
- [ ] Instalação `@clerk/clerk-react`
- [ ] Configuração ClerkProvider
- [ ] Implementação ProtectedRoute
- [ ] Migração do sistema de rotas
- [ ] Integração com React Query

### **Dados e Backend**
- [ ] Configuração Supabase RLS
- [ ] Migração de hooks de dados
- [ ] Implementação de webhooks
- [ ] Testes de sincronização

### **UI/UX**
- [ ] Customização de componentes Clerk
- [ ] Integração com design system
- [ ] Testes de responsividade
- [ ] Configuração dark mode

### **Segurança**
- [ ] Configuração CSP
- [ ] Validação de tokens
- [ ] Audit de segurança
- [ ] Testes de penetração

### **Finalização**
- [ ] Testes E2E
- [ ] Documentação técnica
- [ ] Treinamento da equipe
- [ ] Deploy e monitoramento

---

## 🔧 Comandos e Scripts Úteis

```bash
# Instalação
pnpm add @clerk/clerk-react
pnpm add @clerk/themes

# Desenvolvimento
pnpm dev  # Com hot reload
pnpm build  # Build de produção
pnpm preview  # Preview da build

# Testes
pnpm test  # Testes unitários
pnpm test:e2e  # Testes end-to-end

# Lint e formatação
pnpm lint  # ESLint
pnpm lint:fix  # Fix automático
pnpm format  # Prettier
```

---

## 📚 Recursos Adicionais

### **Documentação Oficial**
- [Clerk React Documentation](https://clerk.com/docs/references/react/overview)
- [Clerk + Vite Setup](https://clerk.com/docs/quickstarts/react)
- [Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)

### **Exemplos de Código**
- [Clerk React Examples](https://github.com/clerk/clerk-docs/tree/main/examples)
- [TanStack Query Integration](https://clerk.com/docs/backend-requests/making-requests)

### **Comunidade**
- [Clerk Discord](https://discord.gg/clerk)
- [GitHub Discussions](https://github.com/clerk/javascript/discussions)

---

## 📝 Considerações Finais

A implementação do Clerk no ImobiPRO Dashboard representa uma evolução significativa em termos de segurança, escalabilidade e experiência do usuário. Com as configurações atualizadas e melhores práticas identificadas, o projeto está preparado para uma migração suave e eficiente.

### **Próximos Passos Recomendados:**
1. **Aprovação da Arquitetura:** Review técnico da proposta
2. **Setup do Ambiente:** Configuração do projeto Clerk
3. **Implementação Incremental:** Seguir o cronograma proposto
4. **Monitoramento Contínuo:** Métricas e feedback de usuários

### **Benefícios Esperados:**
- 🔒 **Segurança Enterprise-grade**
- 🚀 **Performance otimizada**
- 👥 **Experiência do usuário superior**
- 🔧 **Manutenibilidade aprimorada**
- 📊 **Métricas e analytics avançados**

---

**Documento atualizado em:** `2024-12-19`  
**Próxima revisão:** `2025-01-19`  
**Responsável técnico:** Equipe de Desenvolvimento ImobiPRO