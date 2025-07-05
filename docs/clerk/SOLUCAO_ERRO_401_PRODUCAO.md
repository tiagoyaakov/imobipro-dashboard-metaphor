# 🚨 **SOLUÇÃO URGENTE - Erro 401 Unauthorized em Produção**

> **Problema**: Registro de usuários falha com erro 401 no domínio `imobpro-brown.vercel.app`
> **Causa**: Chaves de desenvolvimento sendo usadas em produção sem configuração adequada
> **Solução**: Configurar domínio no Clerk Dashboard

---

## 🔍 **DIAGNÓSTICO CONFIRMADO**

- **Erro**: 401 Unauthorized - Private Access Token challenges
- **Console**: "Clerk has been loaded with development keys"
- **Chave atual**: `pk_test_dXNlZnVsLW11ZGZpc2gtMS5jbGVyay5hY2NvdW50cy5kZXYk`
- **Domínio**: `imobpro-brown.vercel.app` não configurado no Clerk

---

## ⚡ **SOLUÇÃO IMEDIATA (5 minutos)**

### **Passo 1: Acessar Clerk Dashboard**
1. Abrir: https://dashboard.clerk.com/
2. Fazer login com sua conta
3. Verificar se está no projeto correto: **"useful-mudfish-1"**

### **Passo 2: Configurar Domínio**
1. **Navegar para**: Configure → Domains
2. **Clicar em**: "Add domain"
3. **Inserir**: `imobpro-brown.vercel.app`
4. **Salvar** as configurações

### **Passo 3: Configurar Paths**
1. **Navegar para**: Configure → Paths
2. **Configurar os campos**:
   ```
   ✅ Sign-in URL: /login
   ✅ Sign-up URL: /register
   ✅ User profile URL: /profile
   ✅ After sign-in URL: /dashboard
   ✅ After sign-up URL: /dashboard
   ```
3. **IMPORTANTE**: Configurar "Fallback development host":
   ```
   ✅ Fallback development host: https://imobpro-brown.vercel.app
   ```

### **Passo 4: Aguardar Propagação**
- **Tempo**: 2-5 minutos
- **Teste**: Tentar registrar novamente

---

## 🔧 **VERIFICAÇÃO VERCEL**

### **Confirmar Variáveis de Ambiente**
1. **Acessar**: https://vercel.com/dashboard
2. **Ir para**: Projeto → Settings → Environment Variables
3. **Verificar se existem**:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY = pk_test_dXNlZnVsLW11ZGZpc2gtMS5jbGVyay5hY2NvdW50cy5kZXYk
   CLERK_SECRET_KEY = sk_test_UtCaJ7mDwyQhppEZd6srt4kdjBQ0JcgplFkXQtP0T8
   ```

### **Forçar Redeploy**
1. **Ir para**: Deployments
2. **Clicar nos 3 pontinhos** no último deploy
3. **Selecionar**: "Redeploy"
4. **Aguardar**: Deploy completar

---

## 📋 **CHECKLIST DE TESTE**

Após as configurações, testar:

- [ ] **Acessar**: https://imobpro-brown.vercel.app
- [ ] **Clicar em**: "Sign Up"
- [ ] **Preencher**: Email e senha
- [ ] **Clicar**: "Continuar"
- [ ] **Verificar**: Não deve voltar para login
- [ ] **Confirmar**: Email de verificação enviado
- [ ] **Testar**: Processo completo de registro

---

## 🚀 **SE AINDA NÃO FUNCIONAR**

### **Troubleshooting Avançado**

1. **Verificar Console do Browser**:
   - Pressionar F12
   - Ir para "Console"
   - Procurar por outros erros
   - Verificar se ainda mostra "development keys"

2. **Testar em Aba Anônima**:
   - Abrir nova aba anônima
   - Tentar registrar novamente
   - Verificar se o problema persiste

3. **Verificar Network Tab**:
   - F12 → Network
   - Tentar registrar
   - Verificar se há outras requisições falhando

### **Possíveis Soluções Adicionais**

1. **Configurar domínio com subdomain**:
   ```
   No Clerk Dashboard:
   - Tentar adicionar: *.vercel.app
   - Ou especificamente: imobpro-brown.vercel.app
   ```

2. **Verificar configuração de email**:
   ```
   Clerk Dashboard → Configure → Email, phone, username
   - Verificar se email está habilitado
   - Confirmar configurações de verificação
   ```

3. **Temporariamente desabilitar Cloudflare**:
   - Se possível, testar sem proxy do Cloudflare
   - Verificar se resolve o problema

---

## 🎯 **RESULTADO ESPERADO**

Após a configuração:
- ✅ Registro funciona normalmente
- ✅ Console não mostra mais "development keys"
- ✅ Usuário é redirecionado para /dashboard
- ✅ Email de verificação é enviado

---

## 🔮 **PRÓXIMOS PASSOS (Produção Real)**

Para uma solução de produção profissional:

1. **Adquirir domínio próprio** (ex: `imobipro.com`)
2. **Criar instância de produção** no Clerk
3. **Obter chaves live** (`pk_live_` e `sk_live_`)
4. **Configurar DNS** adequadamente
5. **Configurar OAuth** para produção

---

## 📞 **SUPORTE TÉCNICO**

Se o problema persistir:
1. **Documentar** exatamente o erro
2. **Tirar screenshots** do Clerk Dashboard
3. **Verificar** se as configurações estão salvas
4. **Aguardar** até 10 minutos para propagação

---

**⏰ Tempo estimado para resolução: 5-10 minutos** 