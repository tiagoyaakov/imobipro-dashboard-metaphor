# Módulo 1 — Plantão (Agenda)

## Objetivo
Agenda minimalista para corretores, com integração ao Google Calendar e automações via n8n (SDR IA/WhatsApp).

## Perfis e Permissões
- DEV_MASTER: vê e faz tudo (todas as imobiliárias).
- ADMIN: vê calendário da própria imobiliária e filtra por corretor.
- AGENT (corretor): vê apenas os próprios eventos; agenda vinculada ao calendário matriz da imobiliária.

## UI — Diretrizes
- Calendário (FullCalendar): manter como está (ok).
- Controles periféricos minimalistas:
  - Filtros/topbar compactos (botões `h-8`, títulos `text-base`/`sm:text-lg`).
  - Modais com espaçamento reduzido, inputs `h-9`, textos auxiliares `text-xs`.
  - Ícones padrão `h-4 w-4`. Sombras discretas; gaps menores.

Arquivos ajustados:
- `src/components/plantao/PlantaoFilters.tsx`
- `src/components/plantao/PlantaoEventModal.tsx`
- `src/components/plantao/GoogleCalendarConnectionModal.tsx`

## Integrações n8n (resumo)
- Endpoints (Supabase Edge Functions):
  - POST `/functions/plantao-events` (criar)
  - PATCH `/functions/plantao-events/:id` (atualizar)
  - POST `/functions/plantao-events/:id/cancel` (cancelar)
  - GET `/functions/plantao-events?start&end&corretorId` (listar)
  - POST `/functions/plantao-availability` (free/busy)
  - POST `/functions/plantao-google-sync` (sincronização)
  - POST `/functions/plantao-n8n-webhook` (intents do WhatsApp)

- Segurança:
  - JWT (service role ou do usuário) + `X-Signature` HMAC para n8n.
  - Idempotência por `idempotencyKey`.

## Modelo e RLS (resumo)
- Tabelas: `plantao_events`, `plantao_user_integrations`.
- RLS em `plantao_events`:
  - DEV_MASTER: tudo
  - ADMIN: `company_id = current_setting('app.company_id')`
  - AGENT: `corretor_id = auth.uid()`

Detalhes completos em `architecture.md`.
