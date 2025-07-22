# 🧪 TESTE DE SIGNUP - ImobiPRO Dashboard

## 🔧 **CORREÇÕES IMPLEMENTADAS**

### ✅ **Problema Original**
- **Erro 422 (Unprocessable Content)** ao tentar criar conta
- Causado por políticas RLS que impediam signup

### ✅ **Soluções Aplicadas**

#### **1. 🔐 Políticas RLS Corrigidas**
```sql
-- ✅ Permitir leitura de companies durante signup
CREATE POLICY "Permitir leitura de companies para signup"
ON public.companies FOR SELECT TO public USING (true);

-- ✅ Permitir signup usando auth.uid()
CREATE POLICY "Permitir signup de novos usuários"
ON public.users FOR INSERT TO public 
WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());
```

#### **2. 🛠 Código de Signup Melhorado**
- Processo em 2 etapas: Supabase Auth → Tabela Users
- Logs detalhados para debugging
- Criação automática de empresa padrão
- Tratamento robusto de erros

---

## 🚀 **COMO TESTAR**

### **1. Acesse a Página de Signup**
```
https://imobpro-brown.vercel.app/auth/signup
```

### **2. Dados de Teste**
```
Nome: João Silva Teste
Email: teste@exemplo.com
Senha: MinhaSenh@123
Confirmar Senha: MinhaSenh@123
Função: Corretor (ou Proprietário)
```

### **3. Verificar Console do Navegador**
Abra **F12 > Console** e observe os logs:

```javascript
// ✅ LOGS ESPERADOS (SUCESSO):
[DEBUG] Tentando signup com: { email: "teste@exemplo.com", metadata: {...} }
[DEBUG] Signup no Auth bem-sucedido: { user: {...} }
[DEBUG] Inserindo usuário na tabela users...
[DEBUG] Usuário inserido na tabela users com sucesso: {...}
```

```javascript
// ❌ SE AINDA HOUVER ERRO:
[DEBUG] Erro ao buscar companies: {...}
[DEBUG] Erro ao inserir usuário na tabela users: {...}
```

### **4. Verificações Adicionais**

#### **✅ Signup Bem-sucedido:**
- Redirecionamento para página de confirmação
- Ou login automático no dashboard
- Email de confirmação enviado (se configurado)

#### **❌ Se Ainda Houver Problemas:**
- Verifique console para logs detalhados
- Capture screenshot dos erros
- Teste com email diferente

---

## 🔍 **TROUBLESHOOTING**

### **Problema 1: Erro 422 Persiste**
```bash
# Verificar se as políticas RLS foram aplicadas
# (Necessário acesso admin ao Supabase)
```

### **Problema 2: Tabela Companies Vazia**
- O código cria automaticamente "Empresa Padrão"
- Se falhar, verificar logs do console

### **Problema 3: Email já Existe**
- Use emails diferentes para cada teste
- Ou limpe a tabela auth.users no Supabase

---

## 📊 **MONITORAMENTO**

### **Logs Importantes:**
1. **Tentativa de signup** → Dados enviados
2. **Auth bem-sucedido** → Usuário criado no Supabase Auth  
3. **Inserção na tabela** → Registro na tabela custom users
4. **Criação de empresa** → Se necessária, empresa padrão criada

### **Próximos Passos Após Sucesso:**
1. ✅ Teste de login com a conta criada
2. ✅ Verificar se dados aparecem no dashboard
3. ✅ Testar logout e login novamente

---

## 🚨 **SE PROBLEMAS PERSISTIREM**

Capture estas informações:

1. **Console Logs Completos**
2. **Network Tab** (requests falhando)
3. **Email e senha usados no teste**
4. **Timestamp do erro**

**Estes dados ajudarão no debug avançado!** 🕵️‍♂️ 