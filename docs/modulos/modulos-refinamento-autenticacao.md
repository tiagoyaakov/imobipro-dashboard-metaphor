# 🔐 PLANO DE REFINAMENTO - MÓDULO AUTENTICAÇÃO

**Data:** 03/02/2025  
**Status:** 🟡 REFINAMENTO CRÍTICO  
**Módulo:** Sistema de Autenticação e Controle de Acesso  
**Pontuação Atual:** 7.5/10  
**Meta:** 9.0/10  

---

## 📊 **VISÃO GERAL**

O Módulo de Autenticação possui **arquitetura sólida** com sistema hierárquico de roles, modo dual (real/mock) e integração Supabase, mas apresenta **vulnerabilidades críticas** que comprometem a segurança do sistema. O refinamento foca na correção de falhas de segurança e implementação de testes abrangentes.

### **Status Atual vs. Meta**
- **Arquitetura**: ✅ Bem estruturada (8.5/10)
- **Funcionalidades**: ✅ Completas (8.0/10)
- **Segurança**: ❌ Vulnerabilidades críticas (5.0/10)
- **Testes**: ❌ Ausência total (0/10)
- **Manutenibilidade**: ⚠️ Complexidade alta (6.0/10)

---

## 🎯 **PROBLEMAS IDENTIFICADOS**

### **🔴 Críticos de Segurança**
1. **Fallbacks Inseguros**: AuthContext cria usuário fake com role ADMIN quando falha
2. **Modo Mock em Produção**: Sistema pode vazar contexto mock em produção
3. **Variáveis Não Validadas**: Sistema assume existência sem verificar em runtime
4. **IDs Hardcoded**: Company ID fixo comprometendo isolamento

### **🔴 Críticos de Qualidade**
5. **Ausência Total de Testes**: 0% cobertura em funcionalidades críticas
6. **AuthContext Gigante**: 761 linhas, violando princípios SOLID
7. **Código Duplicado**: Mapeamento de erros repetido

### **🟡 Moderados**
8. **Funções Quebradas**: switchUser() não funcional
9. **Recuperação de Senha**: Apenas estrutura, não implementada
10. **Rate Limiting**: Ausente no frontend

---

## 📅 **CRONOGRAMA DE REFINAMENTO**

### **Fase 1: Correções Críticas de Segurança** (5 dias)
- Remoção de fallbacks inseguros
- Validação rigorosa de variáveis
- Isolamento completo de contextos

### **Fase 2: Refatoração Arquitetural** (4 dias)
- Divisão do AuthContext em módulos
- Eliminação de código duplicado
- Implementação de testes críticos

### **Fase 3: Features de Segurança** (4 dias)
- Rate limiting inteligente
- Logs de auditoria
- 2FA preparation

### **Fase 4: Funcionalidades Completas** (3 dias)
- Recuperação de senha funcional
- Validação final e otimização

---

## 🔧 **DETALHAMENTO DAS ETAPAS**

### **Etapa 1: Remoção de Fallbacks Inseguros**
**Duração:** 2 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Eliminar criação de usuário fake com role ADMIN
- Implementar erro explícito quando não encontrar usuário
- Validar Company ID obrigatório
- Fail-safe mode para problemas de autenticação

#### **Implementação:**

**Problema Atual (CRÍTICO):**
```typescript
// src/contexts/AuthContext.tsx - LINHA 87-101 - VULNERABILIDADE
const mapUser = (authUser: AuthUser | null, dbUser: User | null): AppUser | null => {
  if (!authUser) return null;
  
  // ❌ VULNERABILIDADE CRÍTICA: Cria usuário fake com role ADMIN
  if (!dbUser) {
    console.warn('❌ Usuário não encontrado no banco, criando temporario...');
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.email?.split('@')[0] || 'Usuário',
      role: 'ADMIN', // ❌ ROLE ADMIN POR PADRÃO
      companyId: 'temp-company-id', // ❌ ID HARDCODED
      // ...resto dos campos
    };
  }
};
```

**Solução Segura:**
```typescript
// src/contexts/AuthContext.tsx - REFATORADO
const mapUser = (authUser: AuthUser | null, dbUser: User | null): AppUser | null => {
  if (!authUser) return null;
  
  // ✅ SEGURO: Erro explícito se usuário não existir
  if (!dbUser) {
    throw new AuthError('USER_NOT_FOUND', 
      'Usuário autenticado mas não encontrado no sistema. Contate o administrador.'
    );
  }
  
  // ✅ SEGURO: Validar dados obrigatórios
  if (!dbUser.companyId) {
    throw new AuthError('INVALID_USER_DATA', 
      'Usuário sem empresa associada. Dados inconsistentes.'
    );
  }
  
  // ✅ SEGURO: Mapeamento apenas com dados válidos
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: dbUser.name,
    role: dbUser.role,
    companyId: dbUser.companyId,
    isActive: dbUser.isActive,
    avatarUrl: dbUser.avatarUrl || null,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt
  };
};
```

**Error Handler Robusto:**
```typescript
// src/utils/authErrors.ts - NOVO
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public action?: 'LOGOUT' | 'RETRY' | 'CONTACT_ADMIN'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const handleAuthError = (error: AuthError) => {
  switch (error.code) {
    case 'USER_NOT_FOUND':
      // Forçar logout e mostrar mensagem específica
      return {
        shouldLogout: true,
        message: 'Usuário não encontrado no sistema. Entre em contato com o administrador.',
        showContactInfo: true
      };
    
    case 'INVALID_USER_DATA':
      return {
        shouldLogout: true,
        message: 'Dados do usuário inconsistentes. Sistema será reiniciado.',
        showContactInfo: true
      };
      
    default:
      return {
        shouldLogout: true,
        message: 'Erro de autenticação. Tente novamente.',
        showContactInfo: false
      };
  }
};
```

#### **Critérios de Aceite:**
- ✅ Zero fallbacks inseguros
- ✅ Erro explícito para usuário não encontrado
- ✅ Validação obrigatória de Company ID
- ✅ Error handling robusto
- ✅ Logs de auditoria para falhas

---

### **Etapa 2: Isolamento Completo de Contextos**
**Duração:** 2 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Garantir que contexto mock nunca vaze para produção
- Validação rigorosa de environment
- Feature flags seguros
- Modo de desenvolvimento explícito

#### **Implementação:**

**Problema Atual:**
```typescript
// src/contexts/AuthProvider.tsx - PROBLEMA
export const UnifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  // ❌ PROBLEMA: Lógica de decisão inadequada
  const isProduction = import.meta.env.PROD;
  const forceMock = import.meta.env.VITE_FORCE_MOCK === 'true';
  
  // ❌ VULNERABILIDADE: Mock pode vazar em produção
  if (!isProduction || forceMock) {
    return <AuthContextMock>{children}</AuthContextMock>;
  }
  
  return <AuthContext>{children}</AuthContext>;
};
```

**Solução Segura:**
```typescript
// src/contexts/AuthProvider.tsx - REFATORADO
interface AuthConfig {
  mode: 'production' | 'development' | 'test';
  supabaseUrl: string;
  supabaseAnonKey: string;
  allowMock: boolean;
}

const validateAuthConfig = (): AuthConfig => {
  const mode = import.meta.env.MODE as 'production' | 'development' | 'test';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const forceMock = import.meta.env.VITE_FORCE_MOCK === 'true';
  
  // ✅ VALIDAÇÃO RIGOROSA
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_CONFIG_MISSING: Variáveis de configuração obrigatórias não encontradas');
  }
  
  // ✅ SEGURANÇA: Mock apenas em desenvolvimento
  const allowMock = mode === 'development' || mode === 'test';
  
  return {
    mode,
    supabaseUrl,
    supabaseAnonKey,
    allowMock: allowMock && forceMock
  };
};

export const UnifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  const config = validateAuthConfig();
  
  // ✅ SEGURO: Mock apenas se explicitamente permitido
  if (config.allowMock) {
    console.warn('🚨 MODO MOCK ATIVO - APENAS DESENVOLVIMENTO');
    return <AuthContextMock>{children}</AuthContextMock>;
  }
  
  // ✅ PADRÃO SEGURO: Sempre usar autenticação real
  return <AuthContext config={config}>{children}</AuthContext>;
};
```

**Validação de Runtime:**
```typescript
// src/utils/envValidation.ts - NOVO
export const validateEnvironment = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Environment variables missing: ${missing.join(', ')}`);
  }
  
  // Validar formato das URLs
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid URL');
  }
};
```

#### **Critérios de Aceite:**
- ✅ Mock impossível em produção
- ✅ Validação rigorosa de environment
- ✅ Error handling para configs inválidas
- ✅ Logs claros de modo ativo
- ✅ Testes de isolamento

---

### **Etapa 3: Configuração Completa de Testes**
**Duração:** 3 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Framework de testes robusto
- Testes de segurança abrangentes
- Mocks controlados
- Pipeline automatizado

#### **Implementação:**

**Setup de Testes:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

**Testes de Segurança (CRÍTICOS):**
```typescript
// src/contexts/__tests__/AuthContext.security.test.ts
describe('AuthContext Security', () => {
  test('should never create fake user with ADMIN role', async () => {
    // Mock Supabase auth success but DB user not found
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test', email: 'test@example.com' } },
      error: null
    });
    
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    });
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    });
    
    // ✅ DEVE FALHAR SEGURAMENTE
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.error).toContain('USER_NOT_FOUND');
    });
  });
  
  test('should never allow mock context in production', () => {
    // Mock production environment
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_FORCE_MOCK', 'true');
    
    expect(() => {
      render(<UnifiedAuthProvider><div>test</div></UnifiedAuthProvider>);
    }).not.toThrow();
    
    // Verificar que está usando contexto real
    expect(mockSupabase.createClient).toHaveBeenCalled();
  });
  
  test('should validate required environment variables', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    
    expect(() => validateEnvironment()).toThrow('Environment variables missing');
  });
});
```

**Testes de Permissões:**
```typescript
// src/utils/__tests__/permissions.test.ts
describe('Permission System', () => {
  test('DEV_MASTER should have all permissions', () => {
    const user = { role: 'DEV_MASTER' };
    
    expect(canManageUsers(user.role)).toBe(true);
    expect(canImpersonateUser(user.role, 'ADMIN')).toBe(true);
    expect(canImpersonateUser(user.role, 'AGENT')).toBe(true);
  });
  
  test('ADMIN should have limited permissions', () => {
    const user = { role: 'ADMIN' };
    
    expect(canManageUsers(user.role)).toBe(true);
    expect(canImpersonateUser(user.role, 'ADMIN')).toBe(false);
    expect(canImpersonateUser(user.role, 'AGENT')).toBe(true);
  });
  
  test('AGENT should have minimal permissions', () => {
    const user = { role: 'AGENT' };
    
    expect(canManageUsers(user.role)).toBe(false);
    expect(canImpersonateUser(user.role, 'ADMIN')).toBe(false);
    expect(canImpersonateUser(user.role, 'AGENT')).toBe(false);
  });
});
```

**Testes de Login/Logout:**
```typescript
// src/components/__tests__/LoginForm.test.tsx
describe('LoginForm Integration', () => {
  test('should handle successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true });
    
    render(<LoginForm onLogin={mockLogin} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  test('should handle login errors gracefully', async () => {
    const mockLogin = vi.fn().mockRejectedValue(
      new Error('Invalid credentials')
    );
    
    render(<LoginForm onLogin={mockLogin} />);
    
    // ... ações de login ...
    
    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });
});
```

#### **Critérios de Aceite:**
- ✅ Testes de segurança: 100% cobertura
- ✅ Testes de permissões: 100% cobertura
- ✅ Testes de componentes: 80% cobertura
- ✅ Pipeline CI/CD executando testes
- ✅ Relatórios de cobertura

---

### **Etapa 4: Refatoração do AuthContext**
**Duração:** 2 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- Dividir AuthContext em módulos menores
- Eliminar código duplicado
- Melhorar manutenibilidade
- Aplicar princípios SOLID

#### **Implementação:**

**Divisão em Módulos:**
```typescript
// src/contexts/auth/AuthState.ts - Estado isolado
export interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false
};
```

```typescript
// src/contexts/auth/AuthActions.ts - Ações isoladas
export class AuthActions {
  constructor(
    private supabase: SupabaseClient,
    private setState: (state: Partial<AuthState>) => void
  ) {}
  
  async login(email: string, password: string): Promise<LoginResult> {
    this.setState({ isLoading: true, error: null });
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Buscar dados do usuário no banco
      const dbUser = await this.fetchUserData(data.user.id);
      const mappedUser = mapUser(data.user, dbUser);
      
      this.setState({ 
        user: mappedUser, 
        isLoading: false, 
        isAuthenticated: true 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = this.mapAuthError(error);
      this.setState({ 
        error: errorMessage, 
        isLoading: false, 
        isAuthenticated: false 
      });
      
      return { success: false, error: errorMessage };
    }
  }
  
  async logout(): Promise<void> {
    this.setState({ isLoading: true });
    
    try {
      await this.supabase.auth.signOut();
      this.setState(initialAuthState);
    } catch (error) {
      console.error('Erro no logout:', error);
      // Forçar logout local mesmo com erro
      this.setState(initialAuthState);
    }
  }
  
  private mapAuthError(error: any): string {
    // Centralizar mapeamento de erros
    const errorMap = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado',
      'Too many requests': 'Muitas tentativas. Tente novamente em alguns minutos'
    };
    
    return errorMap[error.message] || 'Erro de autenticação';
  }
}
```

```typescript
// src/contexts/auth/AuthContext.ts - Contexto simplificado
export const AuthContext = ({ children, config }: AuthContextProps) => {
  const [state, setState] = useState<AuthState>(initialAuthState);
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const actions = new AuthActions(supabase, setState);
  
  // Session listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const dbUser = await actions.fetchUserData(session.user.id);
          const mappedUser = mapUser(session.user, dbUser);
          setState(prev => ({ 
            ...prev, 
            user: mappedUser, 
            isAuthenticated: true,
            isLoading: false 
          }));
        } else if (event === 'SIGNED_OUT') {
          setState(initialAuthState);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const value = {
    ...state,
    login: actions.login,
    logout: actions.logout
  };
  
  return (
    <AuthContextProvider value={value}>
      {children}
    </AuthContextProvider>
  );
};
```

#### **Critérios de Aceite:**
- ✅ AuthContext < 200 linhas
- ✅ Módulos especializados criados
- ✅ Zero código duplicado
- ✅ Princípios SOLID aplicados
- ✅ Testes passando 100%

---

### **Etapa 5: Rate Limiting e Segurança Avançada**
**Duração:** 2 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- Rate limiting inteligente
- Logs de auditoria completos
- Proteção contra brute force
- Detecção de tentativas suspeitas

#### **Implementação:**

**Rate Limiting:**
```typescript
// src/utils/rateLimiting.ts
export class AuthRateLimiter {
  private attempts = new Map<string, number[]>();
  private blocked = new Set<string>();
  
  isBlocked(identifier: string): boolean {
    return this.blocked.has(identifier);
  }
  
  canAttempt(identifier: string): boolean {
    if (this.isBlocked(identifier)) return false;
    
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxAttempts = 5;
    
    const userAttempts = this.attempts.get(identifier) || [];
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    return recentAttempts.length < maxAttempts;
  }
  
  recordAttempt(identifier: string, success: boolean): void {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    if (!success) {
      userAttempts.push(now);
      this.attempts.set(identifier, userAttempts);
      
      // Bloquear após 5 tentativas falhadas
      const windowMs = 15 * 60 * 1000;
      const recentFailures = userAttempts.filter(time => now - time < windowMs);
      
      if (recentFailures.length >= 5) {
        this.blocked.add(identifier);
        
        // Desbloquear após 30 minutos
        setTimeout(() => {
          this.blocked.delete(identifier);
          this.attempts.delete(identifier);
        }, 30 * 60 * 1000);
      }
    } else {
      // Limpar tentativas em caso de sucesso
      this.attempts.delete(identifier);
      this.blocked.delete(identifier);
    }
  }
}
```

**Logs de Auditoria:**
```typescript
// src/utils/authAudit.ts
export class AuthAuditLogger {
  static async logAuthEvent(event: AuthEvent): Promise<void> {
    const auditLog = {
      event: event.type,
      userId: event.userId,
      email: event.email,
      success: event.success,
      errorCode: event.errorCode,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      metadata: event.metadata
    };
    
    try {
      await supabase.from('auth_audit_logs').insert(auditLog);
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }
  
  static async logSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    const suspiciousLog = {
      type: activity.type,
      severity: activity.severity,
      description: activity.description,
      metadata: activity.metadata,
      timestamp: new Date().toISOString()
    };
    
    await supabase.from('suspicious_activities').insert(suspiciousLog);
    
    // Alertar administradores em casos graves
    if (activity.severity === 'HIGH') {
      await this.alertAdministrators(suspiciousLog);
    }
  }
}
```

**Integração no Login:**
```typescript
// Atualizar AuthActions.login
async login(email: string, password: string): Promise<LoginResult> {
  const identifier = email;
  
  // ✅ Verificar rate limiting
  if (!this.rateLimiter.canAttempt(identifier)) {
    await AuthAuditLogger.logAuthEvent({
      type: 'LOGIN_BLOCKED',
      email,
      success: false,
      errorCode: 'RATE_LIMITED'
    });
    
    throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
  }
  
  try {
    const result = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (result.error) throw result.error;
    
    // ✅ Registrar sucesso
    this.rateLimiter.recordAttempt(identifier, true);
    await AuthAuditLogger.logAuthEvent({
      type: 'LOGIN_SUCCESS',
      userId: result.data.user.id,
      email,
      success: true
    });
    
    return { success: true };
  } catch (error) {
    // ✅ Registrar falha
    this.rateLimiter.recordAttempt(identifier, false);
    await AuthAuditLogger.logAuthEvent({
      type: 'LOGIN_FAILED',
      email,
      success: false,
      errorCode: error.code,
      metadata: { message: error.message }
    });
    
    throw error;
  }
}
```

#### **Critérios de Aceite:**
- ✅ Rate limiting funcionando
- ✅ Logs de auditoria completos
- ✅ Proteção contra brute force
- ✅ Alertas para atividades suspeitas
- ✅ Dashboard de segurança

---

### **Etapa 6: Recuperação de Senha Funcional**
**Duração:** 2 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- Fluxo completo de reset de senha
- Validação de tokens segura
- Interface intuitiva
- Integração com email

#### **Implementação:**

**Hook de Recuperação:**
```typescript
// src/hooks/usePasswordReset.ts
export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const requestReset = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      
      await AuthAuditLogger.logAuthEvent({
        type: 'PASSWORD_RESET_REQUESTED',
        email,
        success: true
      });
    } catch (error) {
      const message = error.message === 'User not found' 
        ? 'Email não encontrado no sistema'
        : 'Erro ao enviar email de recuperação';
      
      setError(message);
      
      await AuthAuditLogger.logAuthEvent({
        type: 'PASSWORD_RESET_FAILED',
        email,
        success: false,
        errorCode: error.code
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const confirmReset = async (password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      
      await AuthAuditLogger.logAuthEvent({
        type: 'PASSWORD_RESET_COMPLETED',
        success: true
      });
    } catch (error) {
      setError('Erro ao alterar senha. Token pode ter expirado.');
      
      await AuthAuditLogger.logAuthEvent({
        type: 'PASSWORD_RESET_FAILED',
        success: false,
        errorCode: error.code
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    requestReset,
    confirmReset,
    isLoading,
    error,
    isSuccess
  };
};
```

**Componente de Solicitação:**
```typescript
// src/components/auth/ForgotPasswordForm.tsx
export const ForgotPasswordForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(z.object({
      email: z.string().email('Email inválido')
    }))
  });
  
  const { requestReset, isLoading, error, isSuccess } = usePasswordReset();
  
  const onSubmit = async (data: { email: string }) => {
    await requestReset(data.email);
  };
  
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Email Enviado!</h2>
            <p className="text-muted-foreground">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/login">Voltar ao Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperar Senha</CardTitle>
        <CardDescription>
          Digite seu email para receber instruções de recuperação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Email'}
          </Button>
          
          <Button asChild variant="ghost" className="w-full">
            <Link to="/auth/login">Voltar ao Login</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Fluxo completo funcionando
- ✅ Validação de tokens segura
- ✅ Interface intuitiva
- ✅ Logs de auditoria
- ✅ Tratamento de erros robusto

---

### **Etapa 7: 2FA Preparation**
**Duração:** 1 dia  
**Prioridade:** 🟢 Melhoria

#### **Objetivos:**
- Estrutura para 2FA futuro
- Feature flags funcionais
- UI preparada
- Backend integration ready

#### **Implementação:**

**Feature Flag System:**
```typescript
// src/utils/featureFlags.ts
export const FeatureFlags = {
  TWO_FACTOR_AUTH: import.meta.env.VITE_ENABLE_2FA === 'true',
  SOCIAL_LOGIN: import.meta.env.VITE_ENABLE_SOCIAL_LOGIN === 'true',
  BIOMETRIC_AUTH: import.meta.env.VITE_ENABLE_BIOMETRIC === 'true'
} as const;

export const useFeatureFlag = (flag: keyof typeof FeatureFlags) => {
  return FeatureFlags[flag];
};
```

**2FA Components (Preparação):**
```typescript
// src/components/auth/TwoFactorSetup.tsx
export const TwoFactorSetup = () => {
  const isTwoFactorEnabled = useFeatureFlag('TWO_FACTOR_AUTH');
  
  if (!isTwoFactorEnabled) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Autenticação em Duas Etapas</CardTitle>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Funcionalidade em desenvolvimento. Disponível em breve.
        </p>
      </CardContent>
    </Card>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Feature flags funcionais
- ✅ UI preparada para 2FA
- ✅ Estrutura backend ready
- ✅ Documentação técnica

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Segurança**
- **Vulnerabilidades Críticas:** 3 → 0
- **Fallbacks Inseguros:** Eliminados 100%
- **Rate Limiting:** Implementado
- **Logs de Auditoria:** 100% coverage

### **Qualidade de Código**
- **Cobertura de Testes:** 0% → 85%
- **Complexidade Ciclomática:** Reduzida 60%
- **Código Duplicado:** Eliminado 100%
- **TypeScript:** 100% strict mode

### **Funcionalidades**
- **Login/Logout:** 100% funcional
- **Recuperação de Senha:** 100% funcional
- **Permissões:** 100% testadas
- **Rate Limiting:** Implementado

---

## 🛠️ **RECURSOS NECESSÁRIOS**

### **Técnicos**
- 1 Security Engineer (lead)
- 1 Developer React Senior
- 1 QA Security Specialist

### **Infraestrutura**
- Monitoring de segurança
- Logs centralizados
- Email service (SendGrid/SES)
- Rate limiting infrastructure

### **Ferramentas**
- Security testing tools
- Penetration testing framework
- Audit logging system
- Performance monitoring

---

## 🚀 **PRÓXIMOS PASSOS**

### **Imediato (Esta Semana)**
1. ✅ Aprovação do plano crítico
2. ✅ Correção das vulnerabilidades críticas
3. ✅ Setup de testes de segurança
4. ✅ Validação de environment

### **Curto Prazo (2 semanas)**
1. 🔄 Refatoração arquitetural completa
2. 🔄 Suite de testes 85% cobertura
3. 🔄 Rate limiting implementado
4. 🔄 Logs de auditoria funcionais

### **Médio Prazo (3 semanas)**
1. 📋 Recuperação de senha funcional
2. 📋 Preparação para 2FA
3. 📋 Dashboard de segurança
4. 📋 Documentação técnica completa

---

## 📋 **OBSERVAÇÕES FINAIS**

### **Pontos de Atenção**
- **Backwards Compatibility**: Manter API pública durante refatoração
- **Zero Downtime**: Migração sem interrupção do serviço
- **Security First**: Priorizar segurança sobre features
- **Testing Critical**: Cobertura obrigatória para código de autenticação

### **Riscos Identificados**
- **Breaking Changes**: Refatoração pode quebrar integrações
- **Security Regression**: Novos bugs podem introduzir vulnerabilidades
- **Performance Impact**: Rate limiting pode afetar UX
- **Complexity**: Aumento da complexidade do sistema

### **Critérios de Entrega**
- ✅ Zero vulnerabilidades críticas
- ✅ Testes de segurança passando 100%
- ✅ Performance mantida/melhorada
- ✅ Auditoria de segurança aprovada
- ✅ Documentação técnica completa
- ✅ Penetration testing aprovado

---

**Preparado por:** Claude AI Assistant  
**Aprovado por:** [Pending - REVISÃO DE SEGURANÇA OBRIGATÓRIA]  
**Data de Início:** [TBD - URGENTE]  
**Data de Conclusão Estimada:** [TBD + 16 dias]

**⚠️ NOTA CRÍTICA:** Este refinamento é considerado **PRIORIDADE MÁXIMA** devido às vulnerabilidades de segurança identificadas. Recomenda-se início imediato.