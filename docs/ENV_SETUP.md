# 🔧 Configuração de Variáveis de Ambiente

## 🚀 **Início Rápido - Modo Mock Automático**

✅ **O sistema funciona automaticamente sem configuração!**

Se você ainda não configurou o Supabase, o ImobiPRO Dashboard funcionará automaticamente em **modo mock** com dados de demonstração. Simplesmente execute:

```bash
pnpm dev
```

O sistema detectará automaticamente que não há configurações do Supabase e usará dados mockados para desenvolvimento.

---

## 🔐 **Configuração Avançada - Modo Real (Supabase)**

Para usar autenticação real com banco de dados Supabase, siga os passos abaixo:

### Arquivo `.env` - Configuração Local

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# =====================================================
# MODO DE AUTENTICAÇÃO
# =====================================================

# Ativar autenticação real (true) ou mock (false)
VITE_USE_REAL_AUTH=true

# =====================================================
# SUPABASE - Configurações Obrigatórias
# =====================================================

# URL do projeto Supabase
VITE_SUPABASE_URL=https://eeceyvenrnyyqvilezgr.supabase.co

# Chave pública (anon key) - Obter no Dashboard do Supabase
# Project Settings > API > anon key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave de serviço (service_role) - MANTER SEGURO
# Project Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ID do projeto
SUPABASE_PROJECT_ID=eeceyvenrnyyqvilezgr

# URL da base de dados (para Prisma/migrações)
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.eeceyvenrnyyqvilezgr.supabase.co:5432/postgres

# =====================================================
# AUTENTICAÇÃO - Configurações
# =====================================================

# URL de redirecionamento após autenticação
VITE_SUPABASE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback

# =====================================================
# APLICAÇÃO - Configurações Gerais
# =====================================================

# Tema padrão
VITE_DEFAULT_THEME=dark

# Cor primária
VITE_PRIMARY_COLOR=#0EA5E9

# Localização
VITE_DEFAULT_LOCALE=pt-BR
VITE_TIMEZONE=America/Sao_Paulo

# Ambiente
NODE_ENV=development
```

## 📋 Como Obter as Chaves do Supabase

### 1. Acessar o Dashboard
- Acesse: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto ImobiPRO

### 2. Obter as Chaves
- Vá em **Project Settings** → **API**
- Copie as seguintes chaves:
  - **URL**: `https://eeceyvenrnyyqvilezgr.supabase.co`
  - **anon key**: Chave pública (pode ser exposta no frontend)
  - **service_role key**: Chave privada (NUNCA expor no frontend)

### 3. Configurar Senha do Banco
- Vá em **Project Settings** → **Database**
- Anote a senha do banco (definida na criação do projeto)
- Use na `DATABASE_URL`

## ⚠️ Importante

### Segurança
- **NUNCA** commite o arquivo `.env` 
- **NUNCA** exponha a `service_role key` no frontend
- Use apenas variáveis com prefixo `VITE_` no frontend

### Produção
Para produção, configure as mesmas variáveis no provedor de hospedagem:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Outros**: Consulte documentação específica

## 🧪 Verificar Configuração

Após criar o `.env`, execute:

```bash
# Instalar dependências (se ainda não fez)
pnpm install

# Iniciar o servidor de desenvolvimento
pnpm dev
```

Se as variáveis estiverem corretas, você verá no console:
```
🔗 Supabase Client configurado: {
  url: 'https://eeceyvenrnyyqvilezgr.supabase.co',
  project: 'ImobPRO',
  anon_key_prefix: 'eyJhbGciOiJIUzI1NiIs...'
}
```

## 🚨 Troubleshooting

### Erro: "Variáveis de ambiente do Supabase não configuradas"
- Verifique se o arquivo `.env` existe na raiz
- Confirme se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidas
- Reinicie o servidor de desenvolvimento

### Erro de conexão com o banco
- Verifique a `DATABASE_URL`
- Confirme se a senha está correta
- Teste a conexão no dashboard do Supabase 