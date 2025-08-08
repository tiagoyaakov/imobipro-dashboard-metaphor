-- =============================================================
-- TRIGGER: Notificar n8n ao inserir novo imóvel
-- Requisitos: extensão pg_net para HTTP requests
-- Observação: a URL do webhook do n8n é passada como argumento
--             do trigger para evitar hardcoding no código-fonte.
--             Ajuste a URL no CREATE TRIGGER conforme seu ambiente.
-- =============================================================

-- 1) Habilitar extensão (idempotente)
create extension if not exists pg_net;

-- 2) Função de trigger
create or replace function public.notify_n8n_property_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text := TG_ARGV[0];
  payload jsonb;
begin
  if webhook_url is null or webhook_url = '' then
    -- Sem URL configurada, apenas retorna
    return NEW;
  end if;

  payload := jsonb_build_object(
    'event', 'property.created',
    'id', NEW.id,
    'title', NEW.title,
    'city', NEW.city,
    'price', NEW.price,
    'created_at', NEW.created_at
  );

  -- Disparar POST assíncrono para n8n (erros não bloqueiam inserção)
  perform net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );

  return NEW;
end;
$$;

-- 3) Trigger na tabela principal
drop trigger if exists trg_n8n_property_insert on public.imoveisvivareal4;
create trigger trg_n8n_property_insert
after insert on public.imoveisvivareal4
for each row execute function public.notify_n8n_property_insert('https://your-n8n-instance.com/webhook/property-created');


