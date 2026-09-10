create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000)
);
create index documents_owner_idx on public.documents(owner_id);
alter table public.documents enable row level security;
revoke all on public.documents from anon, authenticated;
grant select, insert, update, delete on public.documents to authenticated;
create policy owner_select on public.documents for select to authenticated using ((select auth.uid()) = owner_id);
create policy owner_insert on public.documents for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy owner_update on public.documents for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy owner_delete on public.documents for delete to authenticated using ((select auth.uid()) = owner_id);
