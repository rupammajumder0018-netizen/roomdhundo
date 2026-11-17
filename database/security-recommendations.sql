-- ============================================================
-- ROOMDHUNDO — PHASE 11 DATABASE SECURITY RECOMMENDATIONS
-- ============================================================
--
-- IMPORTANT:
-- This file contains reviewable security recommendations identified during
-- the Phase 11 Database Security Review.
--
-- DO NOT EXECUTE AUTOMATICALLY.
-- Review these changes in a staging environment prior to applying to production.
-- ============================================================

-- ------------------------------------------------------------
-- 1. FIX PRIVILEGE ESCALATION IN handle_new_user()
--
-- VULNERABILITY (CONFIRMED):
-- The original handle_new_user() trigger function inspected
-- new.raw_user_meta_data ->> 'role' and accepted 'admin'.
-- Because user metadata is client-controlled during supabase.auth.signUp(),
-- any registrant could self-assign the 'admin' role.
--
-- FIX:
-- Restrict self-assigned role to 'user' or 'owner'.
-- Any attempt to pass 'admin', 'agent', or unrecognized roles defaults to 'user'.
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (
        id,
        name,
        full_name,
        email,
        role,
        user_type,
        status
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'name',
            new.raw_user_meta_data ->> 'full_name',
            split_part(coalesce(new.email, ''), '@', 1)
        ),
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name',
            split_part(coalesce(new.email, ''), '@', 1)
        ),
        new.email,
        -- Enforce safe role assignment: only 'owner' or 'user' allowed on signup
        case
            when coalesce(new.raw_user_meta_data ->> 'role', '') = 'owner' then 'owner'
            else 'user'
        end,
        case
            when coalesce(new.raw_user_meta_data ->> 'role', '') = 'owner' then 'owner'
            else 'renter'
        end,
        'active'
    )
    on conflict (id) do nothing;

    return new;
end;
$$;


-- ------------------------------------------------------------
-- 2. PREVENT USERS FROM SELF-ELEVATING PROFILES ROLE OR STATUS
--
-- VULNERABILITY (CONFIRMED):
-- The policy "Users can update own profile" on public.profiles checks only
-- id = auth.uid(). Any logged-in user can execute:
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
-- and elevate their account to full administrator.
--
-- FIX:
-- Add a BEFORE UPDATE trigger that prevents non-admin callers from modifying
-- protected columns: role, user_type, status.
-- ------------------------------------------------------------

create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- If caller is not an active admin, lock down role, user_type, and status
    if not public.is_admin() then
        new.role = old.role;
        new.user_type = old.user_type;
        new.status = old.status;
    end if;

    return new;
end;
$$;

drop trigger if exists tr_protect_profile_roles on public.profiles;

create trigger tr_protect_profile_roles
before update on public.profiles
for each row
execute procedure public.protect_profile_roles();


-- ------------------------------------------------------------
-- 3. HARDEN AGENT APPLICATIONS CREATION
--
-- VULNERABILITY (CONFIRMED):
-- The policy "agent_applications_insert_own" checks auth.uid() = user_id
-- but did not enforce status = 'pending'. An applicant could insert
-- status = 'approved' directly.
--
-- FIX:
-- Enforce status = 'pending' on insert.
-- ------------------------------------------------------------

drop policy if exists "agent_applications_insert_own" on public.agent_applications;

create policy "agent_applications_insert_own"
on public.agent_applications for insert
to authenticated
with check (
    auth.uid() = user_id
    and status = 'pending'
);


-- ------------------------------------------------------------
-- 4. ENABLE RENTER CANCELLATION & OWNER MANAGEMENT OF BOOKINGS
--
-- FINDING (FUNCTIONAL GAP):
-- In schema.sql, public.bookings has no UPDATE policy for either
-- the booking owner (renter) or the property owner.
-- Renters cannot cancel a pending booking, and property owners cannot
-- confirm/decline bookings without admin privileges.
--
-- FIX:
-- Allow renters to cancel their own pending bookings.
-- Allow property owners to update bookings for their properties.
-- ------------------------------------------------------------

drop policy if exists "Users can cancel their own pending bookings" on public.bookings;

create policy "Users can cancel their own pending bookings"
on public.bookings for update
to authenticated
using (
    auth.uid() = user_id
    and status = 'pending'
)
with check (
    auth.uid() = user_id
    and status = 'cancelled'
);

drop policy if exists "Owners can update bookings for their properties" on public.bookings;

create policy "Owners can update bookings for their properties"
on public.bookings for update
to authenticated
using (
    exists (
        select 1
        from public.buildings b
        where b.id = building_id
        and b.created_by = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.buildings b
        where b.id = building_id
        and b.created_by = auth.uid()
    )
);


-- ------------------------------------------------------------
-- 5. STORAGE BUCKET RLS POLICIES FOR property-images
--
-- FINDING (CONFIGURATION REQUIREMENT):
-- Storage bucket 'property-images' requires RLS policies in Supabase
-- storage.objects to enable uploads and public reads.
-- ------------------------------------------------------------

-- Allow public read access to property images
create policy "Public Access property-images"
on storage.objects for select
using ( bucket_id = 'property-images' );

-- Allow authenticated users to upload to their own user directory
create policy "Authenticated Users can upload property-images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploaded images
create policy "Users can delete own property-images"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);
