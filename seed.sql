-- ---------------------------------------------
-- 🧠 Funções auxiliares para RLS
-- ---------------------------------------------

-- Verifica se o usuário logado é o dono do dado
create or replace function is_owner(agent_id uuid)
returns boolean as $$
begin
  return auth.jwt()->>'user_id' = agent_id::text;
end;
$$ language plpgsql immutable;

-- Verifica se o usuário pertence à empresa dona do dado
create or replace function same_company(company_id uuid)
returns boolean as $$
begin
  return auth.jwt()->>'company_id' = company_id::text;
end;
$$ language plpgsql immutable;

-- Verifica se o usuário é o criador do sistema
create or replace function is_creator()
returns boolean as $$
begin
  return auth.jwt()->>'role' = 'CREATOR';
end;
$$ language plpgsql immutable;

-- JWT personalizado com claims: role, user_id, company_id
create or replace function jwt_custom_claims()
returns jsonb as $$
declare
  uid uuid := (auth.jwt() ->> 'sub')::uuid;
  user_data jsonb;
begin
  select jsonb_build_object(
    'role', u.role,
    'user_id', u.id,
    'company_id', u.company_id
  )
  into user_data
  from public.users u
  where u.id = uid;

  return user_data;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------
-- 🔒 Ativando RLS e definindo policies
-- ---------------------------------------------

-- Tabela users
alter table users enable row level security;

create policy "Creator vê tudo" on users
  for select using (is_creator());

create policy "Admin vê todos da empresa" on users
  for select using (same_company(company_id));

create policy "Usuário vê a si mesmo" on users
  for select using (auth.jwt()->>'user_id' = id::text);

-- Tabela properties
alter table properties enable row level security;

create policy "Creator vê tudo" on properties
  for select using (is_creator());

create policy "Admin vê todos os imóveis da empresa" on properties
  for select using (
    exists (select 1 from users u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios imóveis" on properties
  for select using (is_owner(agent_id));

-- Tabela contacts
alter table contacts enable row level security;

create policy "Creator vê tudo" on contacts
  for select using (is_creator());

create policy "Admin vê todos os contatos da empresa" on contacts
  for select using (
    exists (select 1 from users u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios contatos" on contacts
  for select using (is_owner(agent_id));

-- Tabela appointments
alter table appointments enable row level security;

create policy "Creator vê tudo" on appointments
  for select using (is_creator());

create policy "Admin vê todos os agendamentos da empresa" on appointments
  for select using (
    exists (select 1 from users u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios agendamentos" on appointments
  for select using (is_owner(agent_id));

-- Tabela deals
alter table deals enable row level security;

create policy "Creator vê tudo" on deals
  for select using (is_creator());

create policy "Admin vê todos os deals da empresa" on deals
  for select using (
    exists (select 1 from users u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios deals" on deals
  for select using (is_owner(agent_id));

-- Tabela activities
alter table activities enable row level security;

create policy "Creator vê tudo" on activities
  for select using (is_creator());

create policy "Admin vê todas as atividades da empresa" on activities
  for select using (
    exists (select 1 from users u where u.id = user_id and same_company(u.company_id))
  );

create policy "Corretor vê suas próprias atividades" on activities
  for select using (is_owner(user_id));

-- Tabela chats
alter table chats enable row level security;

create policy "Creator vê tudo" on chats
  for select using (is_creator());

create policy "Admin vê todos os chats da empresa" on chats
  for select using (
    exists (select 1 from users u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios chats" on chats
  for select using (is_owner(agent_id));

-- Tabela messages
alter table messages enable row level security;

create policy "Creator vê tudo" on messages
  for select using (is_creator());

create policy "Admin vê mensagens da empresa" on messages
  for select using (
    exists (select 1 from users u where u.id = sender_id and same_company(u.company_id))
  );

create policy "Corretor vê suas próprias mensagens" on messages
  for select using (is_owner(sender_id));
