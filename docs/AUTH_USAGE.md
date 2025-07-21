# 🔐 Guia de Uso - Sistema de Autenticação

## 📋 Visão Geral

O sistema de autenticação foi implementado com **duas opções**:

1. **AuthContext Real** - Integração completa com Supabase Auth
2. **AuthContextMock** - Dados simulados para desenvolvimento

## 🚀 Configuração Rápida

### 1. Provider Principal (App.tsx)

```typescript
import { UnifiedAuthProvider } from './contexts/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedAuthProvider>
        {/* Sua aplicação */}
      </UnifiedAuthProvider>
    </QueryClientProvider>
  );
}
```

### 2. Usando o Hook de Autenticação

```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Olá, {user.name}!</h1>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Para usar autenticação real (Supabase)
VITE_USE_REAL_AUTH=true
VITE_SUPABASE_URL=https://eeceyvenrnyyqvilezgr.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Para usar dados mockados (desenvolvimento)
VITE_USE_REAL_AUTH=false
```

### Comportamento Padrão

- **Desenvolvimento** (`npm run dev`): Usa mock por padrão
- **Produção** (`npm run build`): Sempre usa auth real
- **Forçar real**: `VITE_USE_REAL_AUTH=true`

## 📚 Hooks Disponíveis

### 1. `useAuth()` - Hook Principal

```typescript
const {
  isAuthenticated, // boolean
  user,            // User | null
  isLoading,       // boolean
  login,           // (email, password) => Promise<{success, error?}>
  logout,          // () => void
  refreshUser,     // () => Promise<void>
  switchUser       // (userId) => void (apenas mock)
} = useAuth();
```

### 2. `useLogin()` - Gerenciamento de Login

```typescript
const { login, isLoading, error, clearError } = useLogin();

const handleSubmit = async (data) => {
  const result = await login(data);
  if (result.success) {
    // Login realizado com sucesso
  }
};
```

### 3. `useSignup()` - Registro de Usuário

```typescript
const { signup, isLoading, error, clearError } = useSignup();

const handleSignup = async (email, password, metadata) => {
  const result = await signup(email, password, metadata);
  if (result.success) {
    // Registro realizado com sucesso
  }
};
```

### 4. `usePasswordReset()` - Recuperação de Senha

```typescript
const { resetPassword, isLoading, error, clearError } = usePasswordReset();

const handleReset = async (email) => {
  const result = await resetPassword(email);
  if (result.success) {
    // Email de recuperação enviado
  }
};
```

## 🎨 Componentes de Exemplo

### Formulário de Login

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormSchema } from '../schemas/auth';
import { useLogin } from '../hooks/useAuth';

export function LoginForm() {
  const { login, isLoading, error, clearError } = useLogin();
  
  const form = useForm({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    clearError();
    const result = await login(data);
    
    if (!result.success) {
      // Erro será mostrado automaticamente via error state
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register('email')}
        type="email"
        placeholder="Email"
        disabled={isLoading}
      />
      
      <input
        {...form.register('password')}
        type="password"
        placeholder="Senha"
        disabled={isLoading}
      />
      
      {error && (
        <div className="text-red-500">{error}</div>
      )}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

### Proteção de Rota

```typescript
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Verificando autenticação...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

## 🔄 Migração do Mock para Real

### Passo 1: Configurar Variáveis de Ambiente

```env
# Alterar de false para true
VITE_USE_REAL_AUTH=true
```

### Passo 2: Executar Migrações SQL

Execute o conteúdo de `migrations/auth_rls_policies.sql` no SQL Editor do Supabase.

### Passo 3: Testar Funcionalidades

1. Registro de novo usuário
2. Login/logout
3. Proteção de rotas
4. Dados do usuário

### Passo 4: Remover Código Mock (Opcional)

Após confirmar que tudo funciona, remova:
- `AuthContextMock.tsx`
- Referências ao mock nos componentes

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"

**Solução**: Verificar se `.env` existe e tem as variáveis corretas.

```bash
# Verificar variáveis
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### Erro: "useAuth must be used within AuthProvider"

**Solução**: Certificar que o componente está dentro do `UnifiedAuthProvider`.

### Erro: "Invalid login credentials"

**Soluções**:
1. Verificar email/senha
2. Confirmar que usuário existe no Supabase Auth
3. Verificar se email foi confirmado

### Erro: "Row Level Security"

**Soluções**:
1. Executar migrações RLS (`auth_rls_policies.sql`)
2. Verificar se usuário tem permissões corretas
3. Verificar se `companyId` está definido

## 📊 Estados de Carregamento

### Durante Login
```typescript
const { login, isLoading } = useLogin();

// isLoading = true durante a requisição
```

### Durante Inicialização
```typescript
const { user, isLoading } = useAuth();

// isLoading = true até verificar sessão
```

### Durante Mudanças de Estado
```typescript
useEffect(() => {
  // Reagir a mudanças de autenticação
  if (isAuthenticated) {
    // Usuário logou
  } else {
    // Usuário deslogou
  }
}, [isAuthenticated]);
```

## 🔐 Validações e Segurança

### Schemas de Validação

Todos os formulários usam validação Zod:

```typescript
import { LoginFormSchema, SignupFormSchema } from '../schemas/auth';

// Validação automática nos formulários
const form = useForm({
  resolver: zodResolver(LoginFormSchema)
});
```

### Mensagens de Erro

Erros são mapeados automaticamente para português:

```typescript
// Inglês (Supabase) → Português (App)
"Invalid login credentials" → "Email ou senha incorretos"
"Email not confirmed" → "Verifique seu email para ativar a conta"
```

### Permissões de Usuário

```typescript
import { hasRole, isAdmin, isCreator } from '../hooks/useAuth';

const user = useAuth().user;

if (isAdmin(user)) {
  // Usuário é admin
}

if (hasRole(user, 'AGENT')) {
  // Usuário é corretor
}
``` 