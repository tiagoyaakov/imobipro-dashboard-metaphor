# 🔍 TESTE DIAGNÓSTICO - Erro 422 no Signup

## 🎯 **OBJETIVO DO TESTE**

Isolamos o signup **APENAS para o Supabase Auth** (sem nossa lógica customizada) para descobrir onde está o problema:

- ✅ **Se funcionar**: O problema está na nossa lógica de inserir na tabela `users`
- ❌ **Se falhar**: O problema está no Supabase Auth básico (configurações, rate limiting, etc.)

---

## 🧪 **COMO TESTAR**

### **📍 URL:**
```
https://imobpro-brown.vercel.app/auth/signup
```

### **📝 Dados de Teste (Use email NOVO):**
```
Nome: Carlos Test Debug
Email: carlos.debug@exemplo.com
Senha: MinhaSenh@123
Confirmar Senha: MinhaSenh@123
Função: Corretor
```

### **🔍 Console Logs Esperados:**
```javascript
// ✅ SE O SUPABASE AUTH BÁSICO FUNCIONAR:
[DEBUG] === TESTE DE SIGNUP SIMPLIFICADO ===
[DEBUG] Tentando signup APENAS no Supabase Auth (sem tabela users): {...}
[DEBUG] ✅ Signup básico do Supabase funcionou! {...}
[DEBUG] PULANDO inserção na tabela users para diagnóstico...
[DEBUG] ✅ Retornando sucesso do signup simplificado
```

```javascript
// ❌ SE AINDA DER ERRO 422:
[DEBUG] === TESTE DE SIGNUP SIMPLIFICADO ===
[DEBUG] Tentando signup APENAS no Supabase Auth (sem tabela users): {...}
[DEBUG] Erro no signup básico do Supabase: {...}
[DEBUG] Detalhes do erro: {
  message: "...",
  status: 422,
  code: "..."
}
```

---

## 📊 **CENÁRIOS POSSÍVEIS**

### **✅ CENÁRIO 1: Signup Básico Funciona**
```
✅ Não há erro 422
✅ Logs mostram "Signup básico do Supabase funcionou!"
✅ Redirecionamento para tela de confirmação ou dashboard
```

**🔍 DIAGNÓSTICO**: O problema estava na nossa lógica customizada (inserção na tabela `users`, políticas RLS, etc.)

**🔧 PRÓXIMO PASSO**: Reativar gradualmente nossa lógica para identificar qual parte falha

---

### **❌ CENÁRIO 2: Signup Básico Falha (Erro 422)**
```
❌ Ainda há erro 422 no console
❌ POST /auth/v1/signup → 422
❌ Logs mostram "Erro no signup básico do Supabase"
```

**🔍 DIAGNÓSTICO**: O problema está no Supabase Auth básico

**🔧 POSSÍVEIS CAUSAS**:
- 📧 Email já existe no sistema
- 🕒 Rate limiting (muitas tentativas)
- ⚙️ Configurações de confirmação de email
- 🪝 Hooks "before user created" rejeitando
- 🔒 Configurações de signup desabilitadas

---

## 🛠 **SOLUÇÃO BASEADA NO RESULTADO**

### **Se CENÁRIO 1 (Básico Funciona):**
1. Reativar inserção na tabela `users` passo a passo
2. Testar cada parte individualmente:
   - Buscar/criar empresa
   - Inserir na tabela users
   - Verificar políticas RLS

### **Se CENÁRIO 2 (Básico Falha):**
1. Verificar se email já existe no auth.users
2. Esperar alguns minutos (rate limiting)
3. Tentar com email totalmente diferente
4. Verificar configurações do projeto Supabase

---

## 📞 **INFORMAÇÕES PARA ANÁLISE**

Após o teste, forneça:

1. **Qual cenário aconteceu** (1 ou 2)
2. **Console logs completos** (copie todo o output)
3. **Network tab** (F12 > Network > captura da requisição falhando)
4. **Email usado** no teste
5. **Comportamento observado** (redirecionamento, mensagens, etc.)

---

## ⚠️ **IMPORTANTE**

- Use um **email diferente** a cada teste
- Aguarde **2-3 minutos** entre tentativas se der erro
- Este é um **teste diagnóstico temporário** - o código será restaurado após identificarmos o problema

**🎯 O objetivo é isolar onde exatamente está falhando!** 