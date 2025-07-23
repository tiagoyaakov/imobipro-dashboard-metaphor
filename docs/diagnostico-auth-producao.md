# 🚨 **Diagnóstico: Autenticação em Produção**

## **⚡ Problema Resolvido**

### **❌ Erro Original**
```javascript
Uncaught Error: useAuthMock deve ser usado dentro de um AuthProviderMock. 
Certifique-se de envolver seu componente com <AuthProviderMock>.
```

### **🔍 Causa Raiz**
O hook `useAuth()` estava **SEMPRE** retornando `useAuthMock()`, independente da configuração de ambiente!

```typescript
// ❌ ANTES (sempre mock):
export const useAuth = () => {
  // Por ora, sempre usar o modo mock até o real estar implementado
  return useAuthMock();
};

// ✅ DEPOIS (respeita configuração):
export const useAuth = () => {
  const authMode = getAuthMode();
  
  if (authMode === 'real') {
    return useAuthReal();
  } else {
    return useAuthMock();
  }
};
```

---

## **🛠️ Correções Aplicadas**

### **1. Hook useAuth (src/hooks/useAuth.ts)**
```typescript
✅ Agora respeita authMode baseado em VITE_USE_REAL_AUTH
✅ Produção: usa AuthContext real do Supabase
✅ Desenvolvimento: pode usar mock se configurado
```

### **2. Hierarquia de Usuários Atualizada**
```typescript
// ❌ ANTES:
'CREATOR' | 'ADMIN' | 'AGENT' | 'PROPRIETARIO'

// ✅ DEPOIS:
'DEV_MASTER' | 'ADMIN' | 'AGENT'
```

### **3. PrivateRoute e AppWithAuth**
```typescript
✅ Interfaces atualizadas para UserRole[]
✅ Proteção de rotas respeitando nova hierarquia
✅ Exportações corretas (DevMasterRoute)
```

---

## **🔧 Configuração de Ambiente**

### **Produção (.env)**
```env
VITE_USE_REAL_AUTH=true
VITE_SUPABASE_URL=https://projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### **Desenvolvimento (.env)**
```env
VITE_USE_REAL_AUTH=false  # Para usar mock
# ou
VITE_USE_REAL_AUTH=true   # Para testar auth real
```

---

## **📋 Checklist de Verificação**

### **🔍 Diagnóstico Rápido**
- [ ] Erro "useAuthMock deve ser usado dentro de..." = problema no useAuth()
- [ ] Verificar se `VITE_USE_REAL_AUTH=true` em produção
- [ ] Confirmar se Supabase URL/KEY estão configuradas
- [ ] Build sem erros TypeScript
- [ ] UnifiedAuthProvider está envolvendo a aplicação

### **🧪 Teste Local**
```bash
# 1. Verificar variáveis
echo $VITE_USE_REAL_AUTH

# 2. Build sem erros
pnpm run build

# 3. Testar em dev
pnpm run dev

# 4. Logs de debug (temporário)
# Console deve mostrar: mode: 'real'
```

---

## **⚙️ Como o Sistema Funciona**

### **Fluxo de Autenticação**
```mermaid
graph TD
    A[App Inicia] --> B[UnifiedAuthProvider]
    B --> C{getAuthMode()}
    C -->|real| D[AuthProvider - Supabase]
    C -->|mock| E[AuthProviderMock - Dados Fake]
    D --> F[useAuth → useAuthReal]
    E --> G[useAuth → useAuthMock]
```

### **Configuração authMode**
```typescript
export const getAuthMode = (): 'real' | 'mock' => {
  return authConfig.useRealAuth ? 'real' : 'mock';
};

export const authConfig = {
  useRealAuth: import.meta.env.PROD || // SEMPRE real em produção
               (import.meta.env.VITE_USE_REAL_AUTH === 'true' && 
                import.meta.env.VITE_SUPABASE_URL && 
                import.meta.env.VITE_SUPABASE_ANON_KEY)
};
```

---

## **🚨 Problemas Futuros Potenciais**

### **1. Variáveis de Ambiente Missing**
```bash
# Verificar se estão definidas
echo "VITE_USE_REAL_AUTH: $VITE_USE_REAL_AUTH"
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
```

### **2. RLS Policies não Aplicadas**
```sql
-- Verificar se as policies estão ativas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

### **3. Hierarquia de Roles Desatualizada**
```typescript
// Verificar tipos estão corretos
type UserRole = 'DEV_MASTER' | 'ADMIN' | 'AGENT'; // ✅
type UserRole = 'CREATOR' | 'PROPRIETARIO' | ...; // ❌
```

---

## **📝 Log de Casos**

### **Caso 1: Deploy Vercel (23/01/2025)**
- **Problema**: useAuthMock error em produção
- **Causa**: useAuth() sempre mock
- **Solução**: Corrigir getAuthMode() logic
- **Status**: ✅ Resolvido

### **Caso 2: Nova Hierarquia**
- **Problema**: Types CREATOR/PROPRIETARIO
- **Causa**: Refatoração incompleta
- **Solução**: Atualizar todos os tipos
- **Status**: ✅ Resolvido

---

## **🎯 Ações Preventivas**

1. **Testes automatizados** para auth em diferentes modos
2. **Validação de env vars** no build
3. **Logs de debug** detalhados (temporários)
4. **Type checking** rigoroso para roles
5. **Documentação** atualizada sempre

---

**💡 LEMBRETE:** Este documento deve ser atualizado sempre que houver mudanças no sistema de autenticação! 