# 🔒 Testes de Segurança - ImobiPRO Dashboard

Este diretório contém a suíte completa de testes automatizados para validar as correções de segurança implementadas no projeto ImobiPRO Dashboard.

## 🎯 Objetivo

Validar as **5 correções críticas de segurança** implementadas:

1. ✅ **AuthContext sem fallback ADMIN**
2. ✅ **Company ID dinâmico** 
3. ✅ **Bloqueio de mock em produção**
4. ✅ **SecurityValidator robusto**
5. ✅ **Configuração segura de autenticação**

## 📁 Estrutura dos Testes

```
src/
├── test/
│   ├── setup.ts                    # Configuração global dos testes
│   └── README.md                   # Este arquivo
├── utils/
│   └── security-validator.test.ts  # Testes do SecurityValidator
├── contexts/
│   └── AuthContext.test.tsx        # Testes do AuthContext
└── config/
    └── auth.test.ts                # Testes da configuração de auth
```

## 🚀 Como Executar os Testes

### Executar Todos os Testes
```bash
pnpm test
```

### Executar Apenas Testes de Segurança
```bash
pnpm test:security
```

### Executar com Interface Visual
```bash
pnpm test:ui
```

### Executar com Cobertura de Código
```bash
pnpm test:coverage
```

### Executar em Modo Watch
```bash
pnpm test:watch
```

## 🔍 Cenários de Teste Implementados

### 1. SecurityValidator (`security-validator.test.ts`)

#### ✅ Validação de URLs
- Aceita URLs HTTPS válidas
- Rejeita URLs HTTP em produção
- Rejeita URLs inválidas

#### ✅ Validação de JWT
- Valida formato JWT correto (3 partes)
- Rejeita JWTs inválidos
- Rejeita JWTs vazios

#### ✅ Validação de Ambiente de Produção
- Bloqueia auth mock em produção
- Exige HTTPS em produção
- Exige credenciais em produção
- Alerta sobre debug mode ativo

#### ✅ Detecção de IDs Hardcoded
- Detecta `mock-user-id`
- Detecta `mock-company-id`
- Detecta ID específico do projeto
- Alerta em ambiente de produção

#### ✅ Detecção de Exposição de Dados
- Detecta `AuthContextMock` exposto
- Detecta `__AUTH_MOCK__` exposto
- Detecta dados de desenvolvimento em localStorage
- Detecta variáveis sensíveis expostas

### 2. AuthContext (`AuthContext.test.tsx`)

#### ✅ Segurança: Sem Fallback ADMIN
- Nunca usa ADMIN como role padrão
- Sempre usa AGENT como fallback seguro
- Registra warning de segurança

#### ✅ Segurança: Company ID Dinâmico
- Usa company ID da configuração
- Não usa IDs hardcoded
- Gera IDs únicos dinamicamente

#### ✅ Segurança: Bloqueio de Mock em Produção
- Não permite contexto mock em produção
- Valida configuração de ambiente
- Força autenticação real

#### ✅ Segurança: Tratamento de Erros
- Mapeia erros de forma segura
- Não expõe informações sensíveis
- Limpa dados na sessão de logout

#### ✅ Segurança: Registro de Usuários
- Valida formato de email
- Usa role seguro por padrão
- Previne escalação de privilégios

### 3. Configuração de Auth (`auth.test.ts`)

#### ✅ Configuração de Produção
- Força auth real em produção
- Exige URL e chave válidas
- Não expõe service role key

#### ✅ Configuração de Desenvolvimento
- Usa role seguro (AGENT) por padrão
- Gera IDs dinâmicos
- Controla debug logs
- Limita bypass de desenvolvimento

#### ✅ Função de Validação
- Valida URLs HTTPS
- Rejeita URLs HTTP
- Valida formato JWT
- Detecta variáveis ausentes
- Alerta sobre debug em produção

#### ✅ Constantes de Segurança
- Define rotas de auth seguras
- Define rotas protegidas
- Define permissões por role
- Não inclui rotas perigosas

## 📊 Cobertura de Código

### Metas de Cobertura
- **Linhas**: 70%
- **Funções**: 70%
- **Branches**: 70%  
- **Statements**: 70%

### Arquivos Prioritários
- `security-validator.ts`: **90%+**
- `AuthContext.tsx`: **80%+**
- `auth.ts`: **75%+**

## 🛠️ Configuração de Ambiente

### Variáveis de Teste
```typescript
// Configuradas automaticamente em setup.ts
VITE_SUPABASE_URL: 'https://test.supabase.co'
VITE_SUPABASE_ANON_KEY: 'eyJ0eXAiOiJKV1QiLCJh...'
VITE_USE_REAL_AUTH: 'false'
VITE_DEBUG_AUTH: 'false'
VITE_DEFAULT_COMPANY_ID: 'test-company-id'
```

### Mocks Configurados
- `crypto.randomUUID()` - Para testes determinísticos
- `window.localStorage` - Mock de storage
- `window.location` - Mock de localização
- `console.*` - Spies para validar logs
- `fetch` - Mock de requisições

## 🔧 Ferramentas Utilizadas

- **Vitest**: Framework de testes
- **React Testing Library**: Testes de componentes React
- **jsdom**: Ambiente DOM para testes
- **@testing-library/jest-dom**: Matchers adicionais

## 📝 Exemplos de Uso

### Teste de Segurança Básico
```typescript
it('should block mock auth in production', () => {
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_USE_REAL_AUTH', 'false');
  
  const result = validateSecurity();
  
  expect(result.isValid).toBe(false);
  expect(result.criticalErrors).toContain(
    expect.stringContaining('mock está ativa em produção')
  );
});
```

### Teste de Componente React
```typescript
it('should never use ADMIN as fallback role', async () => {
  // Mock failed user query (força fallback)
  mockSupabaseClient.from().select().eq().single
    .mockResolvedValue({ data: null, error: { message: 'User not found' } });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </QueryClientProvider>
  );

  await waitFor(() => {
    const roleElement = screen.getByTestId('user-role');
    expect(roleElement.textContent).toBe('AGENT'); // Nunca ADMIN
  });
});
```

## 🚨 Alertas de Segurança

### ❌ Testes que DEVEM Falhar
- Mock auth em produção
- URLs HTTP em produção  
- IDs hardcoded detectados
- Variáveis sensíveis expostas
- Roles perigosos como padrão

### ✅ Testes que DEVEM Passar
- Configuração HTTPS + JWT válido
- Company IDs dinâmicos
- Role AGENT como fallback
- Variáveis de ambiente limpas
- AuthContext sem mocks expostos

## 📈 Métricas de Sucesso

### CI/CD Integration
```bash
# Pre-deploy checks incluem testes
pnpm pre-deploy-checks
# ↳ security-check && typecheck && lint && format:check && test:run
```

### Thresholds de Build
- **Falha crítica**: Testes de segurança falhando
- **Warning**: Cobertura < 70%
- **Sucesso**: Todos os testes passando + cobertura OK

## 🔄 Manutenção

### Quando Adicionar Novos Testes
- Novas funcionalidades de autenticação
- Mudanças em configurações de segurança
- Detecção de novas vulnerabilidades
- Alterações em roles/permissões

### Quando Atualizar Testes Existentes
- Correções de bugs de segurança
- Atualizações de dependências críticas
- Mudanças de ambiente (dev → prod)
- Novos requisitos de compliance

---

**🔒 Mantenha a segurança em primeiro lugar!**  
*Estes testes são sua primeira linha de defesa contra vulnerabilidades de segurança.*