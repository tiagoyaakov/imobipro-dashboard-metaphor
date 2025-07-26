● 🔲 Plano Estruturado para Correção da Integração Google Calendar

  Baseado na pesquisa profunda realizada pelo context-7 MCP e análise da implementação atual, identifiquei 5 
  problemas críticos que estão causando falhas na autorização:

  🚨 Problemas Críticos Identificados

  1. REDIRECT_URI Duplicada - URL tem repetição: ...google-oauth-callback.htmlgoogle-oauth-callback.html
  2. Falta de Listener PostMessage - Componente não escuta mensagens do popup
  3. Client Secret Exposto - Exposição no frontend (risco de segurança)
  4. Tokens não Persistidos - Apenas simulação, não salva no banco real
  5. OAuth Manual Desatualizado - Não usa Google Identity Services moderno

  📋 Plano de Implementação por Prioridade

  🔴 ALTA PRIORIDADE (Resolver Imediatamente)

  1. Correção das Variáveis de Ambiente
  - Corrigir REDIRECT_URI duplicada
  - Mover client_secret para backend seguro
  - Atualizar configuração no Google Console

  2. Implementação do Listener PostMessage
  - Adicionar event listener no GoogleCalendarConnection
  - Processar callbacks do popup automaticamente
  - Implementar tratamento de erros robusto

  🟡 MÉDIA PRIORIDADE (Próximas 2 semanas)

  3. Migração para Google Identity Services (GSI)
  - Substituir OAuth manual por @google-cloud/local-auth
  - Implementar @react-oauth/google no frontend
  - Configurar refresh tokens automático

  4. Persistência Real de Tokens
  - Criar tabela user_integrations no Supabase
  - Implementar Edge Functions para token management
  - Configurar RLS policies adequadas

  🟢 BAIXA PRIORIDADE (Funcionalidades Avançadas)

  5. Sincronização Bidirecional
  - Webhooks do Google Calendar
  - Incremental sync com sync tokens
  - Conflict resolution automático

  🛠️ Implementação Técnica Detalhada

  Fase 1: Correções Críticas (2-3 horas)

  // 1. Corrigir .env
  VITE_GOOGLE_REDIRECT_URI=https://imobpro-brown.vercel.app/google-oauth-callback.html

  // 2. Adicionar listener no GoogleCalendarConnection
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
        handleAuthCallback(event.data.code);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  Fase 2: Modernização (1-2 semanas)

  // 3. Migrar para Google Identity Services
  import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

  // 4. Edge Function para token management
  export async function POST(request: Request) {
    const { code, userId } = await request.json();

    // Trocar code por tokens no backend seguro
    const tokens = await exchangeCodeForTokens(code);

    // Salvar no Supabase com encryption
    await saveUserTokens(userId, tokens);
  }

  🔧 Arquitetura Recomendada 2025

  Frontend (React + TypeScript)
  ├── @react-oauth/google (modern OAuth)
  ├── PostMessage API (popup communication)
  ├── TanStack Query (state sync)
  └── Zustand (local state)

  Backend (Supabase Edge Functions)
  ├── Token Exchange (secure)
  ├── Token Refresh (automatic)
  ├── Webhook Processing (real-time)
  └── Calendar API Calls (server-side)

  Database (Supabase)
  ├── user_integrations (encrypted tokens)
  ├── calendar_events (cached events)
  ├── sync_status (incremental sync)
  └── RLS Policies (security)