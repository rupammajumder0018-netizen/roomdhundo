-- RoomDhundo agent applications
-- Run this once in the Supabase SQL editor.

do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any (c.conkey)
    where c.conrelid = 'public.profiles'::regclass
      and c.contype = 'c'
      and a.attname = 'role'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', r.conname);
  end loop;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_type'
  ) then
    for r in
      select c.conname
      from pg_constraint c
      join pg_attribute a
        on a.attrelid = c.conrelid
       and a.attnum = any (c.conkey)
      where c.conrelid = 'public.profiles'::regclass
        and c.contype = 'c'
        and a.attname = 'user_type'
    loop
      execute format('alter table public.profiles drop constraint if exists %I', r.conname);
    end loop;

    execute $sql$
      alter table public.profiles
      add constraint profiles_user_type_check
      check (user_type in ('renter', 'owner', 'admin', 'agent'))
    $sql$;
  end if;
end $$;

alter table public.profiles
    drop constraint if exists profiles_role_check;
alter table public.profiles
    add constraint profiles_role_check
    check (role in ('user', 'owner', 'admin', 'agent', 'agent_pending'));

create table if not exists public.agent_applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    first_name text not null,
    last_name text not null,
    phone text not null,
    email text not null,
    location text not null,
    pincode text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by uuid,
    unique (user_id)
);

alter table public.agent_applications enable row level security;

drop policy if exists "agent_applications_insert_own" on public.agent_applications;
create policy "agent_applications_insert_own"
on public.agent_applications for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "agent_applications_select_own" on public.agent_applications;
create policy "agent_applications_select_own"
on public.agent_applications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "agent_applications_select_approved" on public.agent_applications;
create policy "agent_applications_select_approved"
on public.agent_applications for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "agent_applications_admin_all" on public.agent_applications;
create policy "agent_applications_admin_all"
on public.agent_applications for all
to authenticated
using (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and lower(p.role) = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and lower(p.role) = 'admin'
    )
);
