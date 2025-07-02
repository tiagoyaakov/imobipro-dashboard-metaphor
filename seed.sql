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
create or replace function auth.jwt_custom_claims()
returns jsonb as $$
declare
  user_data jsonb;
begin
  select jsonb_build_object(
    'role', u.role,
    'user_id', u.id,
    'company_id', u.company_id
  )
  into user_data
  from public."User" u
  where u.id = auth.uid();

  return user_data;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------
-- 🔒 Ativando RLS e definindo policies
-- ---------------------------------------------

-- Tabela User
alter table "User" enable row level security;

create policy "Creator vê tudo" on "User"
  for select using (is_creator());

create policy "Admin vê todos da empresa" on "User"
  for select using (same_company(company_id));

create policy "Usuário vê a si mesmo" on "User"
  for select using (auth.jwt()->>'user_id' = id::text);


-- Tabela Property
alter table "Property" enable row level security;

create policy "Creator vê tudo" on "Property"
  for select using (is_creator());

create policy "Admin vê todos os imóveis da empresa" on "Property"
  for select using (
    exists (select 1 from "User" u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios imóveis" on "Property"
  for select using (is_owner(agent_id));


-- Tabela Contact
alter table "Contact" enable row level security;

create policy "Creator vê tudo" on "Contact"
  for select using (is_creator());

create policy "Admin vê todos os contatos da empresa" on "Contact"
  for select using (
    exists (select 1 from "User" u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios contatos" on "Contact"
  for select using (is_owner(agent_id));


-- Tabela Appointment
alter table "Appointment" enable row level security;

create policy "Creator vê tudo" on "Appointment"
  for select using (is_creator());

create policy "Admin vê todos os agendamentos da empresa" on "Appointment"
  for select using (
    exists (select 1 from "User" u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios agendamentos" on "Appointment"
  for select using (is_owner(agent_id));


-- Tabela Deal
alter table "Deal" enable row level security;

create policy "Creator vê tudo" on "Deal"
  for select using (is_creator());

create policy "Admin vê todos os deals da empresa" on "Deal"
  for select using (
    exists (select 1 from "User" u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios deals" on "Deal"
  for select using (is_owner(agent_id));


-- Tabela Activity
alter table "Activity" enable row level security;

create policy "Creator vê tudo" on "Activity"
  for select using (is_creator());

create policy "Admin vê todas as atividades da empresa" on "Activity"
  for select using (
    exists (select 1 from "User" u where u.id = user_id and same_company(u.company_id))
  );

create policy "Corretor vê suas próprias atividades" on "Activity"
  for select using (is_owner(user_id));


-- Tabela Chat
alter table "Chat" enable row level security;

create policy "Creator vê tudo" on "Chat"
  for select using (is_creator());

create policy "Admin vê todos os chats da empresa" on "Chat"
  for select using (
    exists (select 1 from "User" u where u.id = agent_id and same_company(u.company_id))
  );

create policy "Corretor vê seus próprios chats" on "Chat"
  for select using (is_owner(agent_id));


-- Tabela Message
alter table "Message" enable row level security;

create policy "Creator vê tudo" on "Message"
  for select using (is_creator());

create policy "Admin vê mensagens da empresa" on "Message"
  for select using (
    exists (select 1 from "User" u where u.id = sender_id and same_company(u.company_id))
  );

create policy "Corretor vê suas próprias mensagens" on "Message"
  for select using (is_owner(sender_id));
