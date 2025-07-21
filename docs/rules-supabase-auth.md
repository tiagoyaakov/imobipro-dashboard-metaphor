# 🔐 Regras de Implementação - Supabase Auth

**Baseado na documentação oficial:** https://supabase.com/docs/guides/auth

Este documento define as regras obrigatórias para implementação de autenticação usando Supabase Auth no projeto ImobiPRO Dashboard.

---

## 1. Conceitos Fundamentais

### 1.1 Definições Core
- **Autenticação:** Verificar se um usuário é quem ele diz ser
- **Autorização:** Verificar quais recursos um usuário pode acessar
- **JWT (JSON Web Tokens):** Método padrão usado pelo Supabase para autenticação
- **RLS (Row Level Security):** Sistema de autorização integrado ao banco de dados

### 1.2 Arquitetura Obrigatória
```typescript
// OBRIGATÓRIO: Usar JWTs para autenticação
// OBRIGATÓRIO: Integrar com RLS para autorização
// OBRIGATÓRIO: Usar schema auth.* do Postgres para dados de usuário
```

---

## 2. Métodos de Autenticação Suportados

### 2.1 Prioridade de Implementação
1. **PRIMÁRIO:** Password-based (email + senha)
2. **SECUNDÁRIO:** Email Magic Link/OTP
3. **FUTURO:** Social Login (Google, Microsoft, etc.)
4. **EMPRESARIAL:** Enterprise SSO (se necessário)

### 2.2 Métodos NÃO Implementar (Por Enquanto)
- Phone Login (SMS)
- Anonymous Sign-ins
- Web3 (Solana)
- Multi-Factor Authentication (MFA)

---

## 3. Estrutura de Dados e Integração

### 3.1 Schema do Banco
```sql
-- OBRIGATÓRIO: Usar schema auth.* do Supabase
-- Users são armazenados em auth.users (automático)
-- Dados adicionais em public.users com FK para auth.users.id
```

### 3.2 Relação com Tabelas Customizadas
```sql
-- OBRIGATÓRIO: Conectar dados customizados via triggers e FK
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Row Level Security (RLS) - CRÍTICO

### 4.1 Regras Obrigatórias
```sql
-- OBRIGATÓRIO: Habilitar RLS em TODAS as tabelas sensíveis
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- OBRIGATÓRIO: Criar políticas restritivas por padrão
CREATE POLICY "Users can only view own data" ON users
FOR SELECT USING (auth.uid() = id);
```

### 4.2 Padrões de Políticas
- **Próprios dados:** `auth.uid() = user_id`
- **Dados da empresa:** `company_id IN (SELECT company_id FROM users WHERE id = auth.uid())`
- **Dados públicos:** Políticas específicas conforme necessário

---

## 5. SDK e Client Configuration

### 5.1 Configuração Obrigatória
```typescript
// OBRIGATÓRIO: Usar o cliente oficial
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// OBRIGATÓRIO: Configurar persistência de sessão (padrão: localStorage)
```

### 5.2 Métodos Auth Principais
```typescript
// OBRIGATÓRIOS para implementar:
supabase.auth.signUp({ email, password })
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signInWithOtp({ email })
supabase.auth.signOut()
supabase.auth.getSession()
supabase.auth.onAuthStateChange(callback)
```

---

## 6. Fluxos de Autenticação

### 6.1 Sign Up (Registro)
```typescript
// OBRIGATÓRIO: Validar dados antes de enviar
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      // Metadados adicionais se necessário
    }
  }
})
```

### 6.2 Sign In (Login)
```typescript
// OBRIGATÓRIO: Tratar erros específicos
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### 6.3 Session Management
```typescript
// OBRIGATÓRIO: Monitorar mudanças de sessão
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Atualizar contexto da aplicação
  }
  if (event === 'SIGNED_OUT') {
    // Limpar dados da aplicação
  }
})
```

---

## 7. Integração com React

### 7.1 Context Pattern (Obrigatório)
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<AuthResponse>
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<{ error: AuthError | null }>
}

// OBRIGATÓRIO: Usar createContext + Provider
const AuthContext = createContext<AuthContextType>()
```

### 7.2 Hook Pattern
```typescript
// OBRIGATÓRIO: Exportar hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## 8. Tratamento de Erros

### 8.1 Códigos de Erro Comuns
- `invalid_credentials`: Email/senha incorretos
- `email_not_confirmed`: Email não confirmado
- `signup_disabled`: Registro desabilitado
- `too_many_requests`: Rate limit atingido

### 8.2 Tratamento Obrigatório
```typescript
// OBRIGATÓRIO: Tratar erros específicos, não genéricos
if (error?.message === 'Invalid login credentials') {
  setError('Email ou senha incorretos')
} else if (error?.message.includes('Email not confirmed')) {
  setError('Verifique seu email para ativar a conta')
}
```

---

## 9. Segurança e Boas Práticas

### 9.1 Configurações Obrigatórias
- **HTTPS apenas:** Nunca usar HTTP em produção
- **Rate Limiting:** Configurar no dashboard do Supabase
- **Email Confirmation:** Habilitar confirmação de email
- **Password Policy:** Definir política de senhas forte

### 9.2 Validação de Dados
```typescript
// OBRIGATÓRIO: Usar Zod para validação
const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
})
```

---

## 10. Integração com TanStack React Query

### 10.1 Query Keys Padronizados
```typescript
// OBRIGATÓRIO: Usar chaves consistentes
export const authKeys = {
  user: ['auth', 'user'] as const,
  session: ['auth', 'session'] as const,
  profile: ['auth', 'profile'] as const,
}
```

### 10.2 Cache Management
```typescript
// OBRIGATÓRIO: Invalidar cache no logout
const signOut = async () => {
  await supabase.auth.signOut()
  queryClient.clear() // Limpar todo o cache
}
```

---

## 11. Environment Variables

### 11.1 Variáveis Obrigatórias
```env
# OBRIGATÓRIO: Prefixo VITE_ para frontend
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# OPCIONAL: Para configurações específicas
VITE_SUPABASE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
```

---

## 12. Redirect URLs e Callbacks

### 12.1 Configuração Obrigatória
```typescript
// OBRIGATÓRIO: Configurar URLs de redirect no dashboard
// Desenvolvimento: http://localhost:5173/auth/callback
// Produção: https://your-domain.com/auth/callback
```

---

## 13. Checklist de Implementação

### 13.1 Pré-requisitos
- [ ] Variáveis de ambiente configuradas
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de segurança criadas
- [ ] Cliente Supabase configurado

### 13.2 Implementação Core
- [ ] AuthContext criado
- [ ] Hooks de autenticação implementados
- [ ] Formulários de login/signup
- [ ] Proteção de rotas
- [ ] Tratamento de erros

### 13.3 Testes Obrigatórios
- [ ] Login/logout funcionando
- [ ] Persistência de sessão
- [ ] Proteção de dados via RLS
- [ ] Tratamento de casos de erro

---

## 14. Não Fazer (Anti-patterns)

### 14.1 Proibições Absolutas
- ❌ **NUNCA** armazenar JWTs manualmente no localStorage
- ❌ **NUNCA** implementar autenticação customizada sem usar Supabase Auth
- ❌ **NUNCA** desabilitar RLS em tabelas com dados sensíveis
- ❌ **NUNCA** usar dados mockados após implementar auth real
- ❌ **NUNCA** fazer queries diretas sem verificar auth.uid()

### 14.2 Padrões Desencorajados
- Múltiplos contextos de autenticação
- Lógica de auth espalhada por componentes
- Tratamento genérico de erros de auth
- Bypass de políticas RLS para "simplificar"

---

**IMPORTANTE:** Este documento é baseado na documentação oficial do Supabase Auth e deve ser seguido rigorosamente para garantir segurança e conformidade com as melhores práticas. 