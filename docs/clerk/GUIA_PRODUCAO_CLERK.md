# 🚀 **Guia Completo - Clerk em Produção**

> **Como resolver o erro 401 Unauthorized e configurar adequadamente o Clerk para produção**

---

## 🚨 **PROBLEMA ATUAL**

- **Erro**: 401 Unauthorized ao registrar usuários
- **Console**: "development keys" detectadas em produção
- **Causa**: Chaves `pk_test_` sendo usadas no domínio de produção

---

## ⚡ **SOLUÇÃO RÁPIDA (Recomendada para Testes)**

### **1. Configurar Domínio de Desenvolvimento no Clerk Dashboard**

1. **Acesse**: https://dashboard.clerk.com/
2. **Selecione** sua aplicação (deve estar em "Development")
3. **Vá para**: `Configure > Domains`
4. **Adicione o domínio**: `https://imobpro-brown.vercel.app`
5. **Salve** as configurações

### **2. Atualizar Configuração das Variáveis de Ambiente na Vercel**

1. **Acesse**: https://vercel.com/dashboard
2. **Selecione** seu projeto `imobipro-dashboard-metaphor`
3. **Vá para**: `Settings > Environment Variables`
4. **Adicione/Atualize**:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_dXNlZnVsLW11ZGZpc2gtMS5jbGVyay5hY2NvdW50cy5kZXYk
   CLERK_SECRET_KEY=sk_test_UtCaJ7mDwyQhppEZd6srt4kdjBQ0JcgplFkXQtP0T8
   ```
5. **Marque**: "Production" environment
6. **Clique**: "Save"
7. **Redeploy**: a aplicação

---

## 🏢 **SOLUÇÃO PARA PRODUÇÃO REAL**

### **Fase 1: Criar Instância de Produção**

1. **Dashboard Clerk**: https://dashboard.clerk.com/
2. **Clique** no dropdown "Development" (topo da página)
3. **Selecione**: "Create production instance"
4. **Configure**:
   - Nome: `ImobiPRO Production`
   - Domínio: Seu domínio customizado (ex: `imobipro.com`)
5. **Clone** as configurações da instância de desenvolvimento

### **Fase 2: Obter Chaves de Produção**

1. **Na instância de produção**, vá para `Configure > API Keys`
2. **Copie** as chaves que começam com:
   - `pk_live_...` (Publishable Key)
   - `sk_live_...` (Secret Key)

### **Fase 3: Configurar DNS (Necessário para domínio próprio)**

1. **No Clerk Dashboard**, vá para `Domains`
2. **Copie** os registros DNS necessários
3. **Configure** no seu provedor de DNS:
   ```
   Tipo: CNAME
   Nome: accounts
   Valor: accounts.clerk.services
   
   Tipo: CNAME  
   Nome: clerk
   Valor: clerk.{sua-instancia}.clerk.accounts.liveblocks.io
   ```

### **Fase 4: Configurar OAuth para Produção**

1. **Google Console**: https://console.cloud.google.com/
2. **Crie** credenciais OAuth 2.0
3. **Configure**:
   - JavaScript origins: `https://seudominio.com`
   - Redirect URIs: (obter do Clerk Dashboard)
4. **Atualize** no Clerk: `Configure > SSO Connections > Google`

### **Fase 5: Atualizar Produção**

1. **Vercel Environment Variables**:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
   CLERK_SECRET_KEY=sk_live_sua_chave_secreta
   ```
2. **Redeploy** a aplicação

---

## 🔧 **CONFIGURAÇÃO VERCEL ESPECÍFICA**

### **Para Domínio .vercel.app (Limitações)**

⚠️ **Importante**: Domínios `.vercel.app` têm limitações em produção:
- Não suportam chaves `pk_live_` diretamente
- Requerem configuração especial
- **Recomendação**: Use domínio próprio para produção real

### **Configuração Environment Variables**

```bash
# Development/Preview
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Production (apenas para domínio próprio)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

---

## 🚀 **AÇÃO IMEDIATA RECOMENDADA**

### **Para Resolver Agora:**

1. **Configurar domínio Vercel no Clerk Development**:
   - Dashboard Clerk > Domains
   - Adicionar: `https://imobpro-brown.vercel.app`

2. **Verificar configuração atual**:
   ```bash
   # Verificar se as chaves estão corretas na Vercel
   # Settings > Environment Variables
   ```

3. **Redeploy**:
   - Forçar novo deploy na Vercel
   - Aguardar 2-3 minutos para propagação

### **Para Produção Futura:**

1. **Adquirir domínio próprio** (ex: `imobipro.com`)
2. **Configurar instância de produção** no Clerk
3. **Configurar DNS adequadamente**
4. **Obter OAuth credentials próprias**

---

## 📞 **CHECKLIST DE VERIFICAÇÃO**

- [ ] Domínio configurado no Clerk Dashboard
- [ ] Chaves corretas na Vercel Environment Variables
- [ ] Environment marcado como "Production"
- [ ] Deploy realizado após mudanças
- [ ] Teste de registro funcionando

---

## 🆘 **TROUBLESHOOTING**

### **Erro 401 Persiste:**
```bash
1. Verificar console do browser para erros específicos
2. Confirmar que domínio está exatamente igual no Clerk
3. Aguardar propagação (até 5 minutos)
4. Testar em aba anônima
```

### **"Development keys" ainda aparece:**
```bash
1. Verificar se as variáveis de ambiente foram salvas
2. Confirmar ambiente "Production" selecionado
3. Forçar redeploy completo
```

### **Registro não funciona:**
```bash
1. Verificar configuração de email no Clerk
2. Confirmar configurações de sign-up habilitadas
3. Testar com email diferente
```

---

**📝 Após resolver, documentar as configurações finais para referência futura.** 