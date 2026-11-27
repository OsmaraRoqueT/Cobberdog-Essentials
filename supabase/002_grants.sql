-- Run once after schema.sql (SQL Editor → New query → paste → Run). Safe to run again.
-- Newer Supabase projects don't grant table access to API roles automatically.
-- Signed-in users get access; Row Level Security then limits them to their own household.
-- Anonymous (not signed-in) visitors get nothing.

grant usage on schema public to authenticated;
grant select on public.households, public.household_members to authenticated;
grant select, insert, update on public.records to authenticated;

revoke all on public.households, public.household_members, public.records from anon;

revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.join_household(text) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
