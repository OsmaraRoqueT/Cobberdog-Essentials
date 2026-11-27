-- Cobberdog Essentials: household sync schema.
-- Run once in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run).

create extension if not exists pgcrypto;

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- One row per app record. `data` holds the record as JSON; the app merges by updated_at.
create table if not exists records (
  household_id uuid not null references households(id) on delete cascade,
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null,
  deleted boolean not null default false,
  updated_by uuid references auth.users(id) default auth.uid(),
  primary key (household_id, collection, id)
);

alter table households enable row level security;
alter table household_members enable row level security;
alter table records enable row level security;

create or replace function is_member(h uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from household_members where household_id = h and user_id = auth.uid());
$$;

drop policy if exists "members read household" on households;
create policy "members read household" on households for select using (is_member(id));

drop policy if exists "read own memberships" on household_members;
create policy "read own memberships" on household_members for select using (is_member(household_id));

drop policy if exists "members read records" on records;
create policy "members read records" on records for select using (is_member(household_id));
drop policy if exists "members insert records" on records;
create policy "members insert records" on records for insert with check (is_member(household_id));
drop policy if exists "members update records" on records;
create policy "members update records" on records for update using (is_member(household_id)) with check (is_member(household_id));

-- Households are created/joined only through these functions, so join codes can't be enumerated.
create or replace function create_household(household_name text) returns households
language plpgsql security definer set search_path = public as $$
declare h households;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into households(name) values (household_name) returning * into h;
  insert into household_members(household_id, user_id) values (h.id, auth.uid());
  return h;
end $$;

create or replace function join_household(code text) returns households
language plpgsql security definer set search_path = public as $$
declare h households;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into h from households where join_code = upper(trim(code));
  if h.id is null then raise exception 'No household with that code'; end if;
  insert into household_members(household_id, user_id) values (h.id, auth.uid()) on conflict do nothing;
  return h;
end $$;

-- API permissions: signed-in users only; RLS above limits them to their household.
grant usage on schema public to authenticated;
grant select on households, household_members to authenticated;
grant select, insert, update on records to authenticated;
revoke all on households, household_members, records from anon;
revoke execute on function is_member(uuid) from public, anon;
revoke execute on function create_household(text) from public, anon;
revoke execute on function join_household(text) from public, anon;
grant execute on function is_member(uuid) to authenticated;
grant execute on function create_household(text) to authenticated;
grant execute on function join_household(text) to authenticated;

-- Live updates between household members.
do $$ begin
  alter publication supabase_realtime add table records;
exception when duplicate_object then null; end $$;
