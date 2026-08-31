-- ============================================================
-- ROOMDHUNDO DATABASE SCHEMA
-- VERSION 3
--
-- Compatible with:
--   - Public website
--   - Search
--   - Property details
--   - Login / Signup
--   - User account
--   - Owner dashboard
--   - List property
--   - Saved properties
--   - Reviews
--   - Enquiries
--   - Admin user/property management
--
-- IMPORTANT:
-- This version DOES NOT DROP your existing buildings.
-- It is designed to preserve existing RoomDhundo data.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- HELPER: updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- PROFILES
--
-- Connected to Supabase Auth.
--
-- Your frontend uses:
-- id
-- name
-- full_name
-- email
-- phone
-- address
-- city
-- pincode
-- role
-- user_type
-- status
-- ============================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    name text,
    full_name text,

    email text,

    phone text,
    address text,
    city text,
    pincode text,

    role text not null default 'user'
        check (role in ('user', 'owner', 'admin')),

    user_type text default 'renter'
        check (user_type in ('renter', 'owner', 'admin')),

    status text not null default 'active'
        check (status in ('active', 'suspended', 'blocked')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- Add missing columns if profiles already existed
alter table public.profiles
    add column if not exists name text;

alter table public.profiles
    add column if not exists full_name text;

alter table public.profiles
    add column if not exists email text;

alter table public.profiles
    add column if not exists phone text;

alter table public.profiles
    add column if not exists address text;

alter table public.profiles
    add column if not exists city text;

alter table public.profiles
    add column if not exists pincode text;

alter table public.profiles
    add column if not exists role text default 'user';

alter table public.profiles
    add column if not exists user_type text default 'renter';

alter table public.profiles
    add column if not exists status text default 'active';

alter table public.profiles
    add column if not exists created_at timestamptz default now();

alter table public.profiles
    add column if not exists updated_at timestamptz default now();


-- ============================================================
-- PROFILE TRIGGER
--
-- Automatically creates a profile when a Supabase Auth user
-- is created.
-- ============================================================

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

        'user',
        'renter',
        'active'
    )

    on conflict (id) do nothing;

    return new;

end;
$$;


drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created

after insert on auth.users

for each row

execute procedure public.handle_new_user();


-- ============================================================
-- PROFILE UPDATED_AT
-- ============================================================

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at

before update on public.profiles

for each row

execute procedure public.set_updated_at();


-- ============================================================
-- BUILDINGS
--
-- One row = one physical property.
--
-- Existing RoomDhundo structure is preserved.
-- ============================================================

create table if not exists public.buildings (

    id uuid primary key default gen_random_uuid(),

    name text not null,

    location text not null,

    distance_km numeric not null default 0,

    type text not null,

    description text,

    rules jsonb not null default '[]'::jsonb,

    facilities jsonb not null default '[]'::jsonb,

    facility_tags jsonb not null default '[]'::jsonb,

    images jsonb not null default '[]'::jsonb,

    videos jsonb not null default '[]'::jsonb,

    owner_name text not null,

    owner_phone text not null,

    owner_alt_phone text,

    owner_whatsapp text,

    owner_verified boolean not null default false,

    owner_member_since text,

    created_by uuid references auth.users(id) on delete set null,

    listing_status text not null default 'published'
        check (
            listing_status in (
                'draft',
                'pending',
                'published',
                'rejected',
                'archived'
            )
        ),

    verification_status text not null default 'pending'
        check (
            verification_status in (
                'pending',
                'approved',
                'rejected',
                'changes_requested'
            )
        ),

    rejection_reason text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- ADD MISSING BUILDING COLUMNS
-- ============================================================

alter table public.buildings
    add column if not exists videos jsonb not null default '[]'::jsonb;

alter table public.buildings
    add column if not exists owner_alt_phone text;

alter table public.buildings
    add column if not exists listing_status text default 'published';

alter table public.buildings
    add column if not exists verification_status text default 'pending';

alter table public.buildings
    add column if not exists rejection_reason text;

alter table public.buildings
    add column if not exists updated_at timestamptz default now();


-- ============================================================
-- BUILDING UPDATED_AT
-- ============================================================

drop trigger if exists buildings_updated_at on public.buildings;

create trigger buildings_updated_at

before update on public.buildings

for each row

execute procedure public.set_updated_at();


-- ============================================================
-- ROOM TYPES
-- ============================================================

create table if not exists public.room_types (

    id uuid primary key default gen_random_uuid(),

    building_id uuid not null
        references public.buildings(id)
        on delete cascade,

    room_type text not null,

    price_value integer not null default 0,

    daily_price integer,

    room_rent integer not null default 0,

    room_people integer not null default 1,

    available_rooms integer not null default 1,

    availability text not null default 'Available',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- ROOM TYPE UPDATED_AT
-- ============================================================

drop trigger if exists room_types_updated_at on public.room_types;

create trigger room_types_updated_at

before update on public.room_types

for each row

execute procedure public.set_updated_at();


-- ============================================================
-- REVIEWS
-- ============================================================

create table if not exists public.reviews (

    id uuid primary key default gen_random_uuid(),

    building_id uuid not null
        references public.buildings(id)
        on delete cascade,

    user_id uuid
        references auth.users(id)
        on delete set null,

    reviewer_name text not null,

    rating integer not null
        check (rating between 1 and 5),

    comment text,

    status text not null default 'published'
        check (
            status in (
                'pending',
                'published',
                'rejected'
            )
        ),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- SAVED BUILDINGS
-- ============================================================

create table if not exists public.saved_buildings (

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    building_id uuid not null
        references public.buildings(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    primary key (user_id, building_id)
);


-- ============================================================
-- ENQUIRIES
--
-- Used by property.html.
--
-- Current frontend inserts:
--
-- user_id
-- building_id
-- renter_phone
-- status
-- ============================================================

create table if not exists public.enquiries (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    building_id uuid not null
        references public.buildings(id)
        on delete cascade,

    renter_phone text not null,

    message text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'contacted',
                'scheduled',
                'visited',
                'closed',
                'cancelled'
            )
        ),

    owner_response text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- ENQUIRY UPDATED_AT
-- ============================================================

drop trigger if exists enquiries_updated_at on public.enquiries;

create trigger enquiries_updated_at

before update on public.enquiries

for each row

execute procedure public.set_updated_at();


-- ============================================================
-- VERIFICATION REQUESTS
--
-- For the future/admin verification workflow.
-- ============================================================

create table if not exists public.verification_requests (

    id uuid primary key default gen_random_uuid(),

    building_id uuid not null
        references public.buildings(id)
        on delete cascade,

    submitted_by uuid
        references auth.users(id)
        on delete set null,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'approved',
                'rejected',
                'changes_requested'
            )
        ),

    admin_note text,

    reviewed_by uuid
        references auth.users(id)
        on delete set null,

    reviewed_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- PROPERTY REPORTS
--
-- Useful for future moderation.
-- ============================================================

create table if not exists public.property_reports (

    id uuid primary key default gen_random_uuid(),

    building_id uuid not null
        references public.buildings(id)
        on delete cascade,

    reported_by uuid
        references auth.users(id)
        on delete set null,

    reason text not null,

    description text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'reviewed',
                'resolved',
                'dismissed'
            )
        ),

    admin_note text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table if not exists public.notifications (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    title text not null,

    message text not null,

    type text default 'general',

    is_read boolean not null default false,

    created_at timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists buildings_created_by_idx
on public.buildings(created_by);

create index if not exists buildings_type_idx
on public.buildings(type);

create index if not exists buildings_location_idx
on public.buildings(location);

create index if not exists buildings_distance_idx
on public.buildings(distance_km);

create index if not exists buildings_listing_status_idx
on public.buildings(listing_status);

create index if not exists buildings_verification_status_idx
on public.buildings(verification_status);

create index if not exists room_types_building_id_idx
on public.room_types(building_id);

create index if not exists enquiries_user_id_idx
on public.enquiries(user_id);

create index if not exists enquiries_building_id_idx
on public.enquiries(building_id);

create index if not exists enquiries_status_idx
on public.enquiries(status);

create index if not exists reviews_building_id_idx
on public.reviews(building_id);

create index if not exists profiles_role_idx
on public.profiles(role);

create index if not exists profiles_status_idx
on public.profiles(status);


-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.profiles enable row level security;

alter table public.buildings enable row level security;

alter table public.room_types enable row level security;

alter table public.reviews enable row level security;

alter table public.saved_buildings enable row level security;

alter table public.enquiries enable row level security;

alter table public.verification_requests enable row level security;

alter table public.property_reports enable row level security;

alter table public.notifications enable row level security;


-- ============================================================
-- ADMIN HELPER
--
-- Used by RLS policies.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
        and role = 'admin'
        and status = 'active'
    );
$$;


-- ============================================================
-- REMOVE OLD POLICIES
--
-- This prevents duplicate-policy errors when rerunning.
-- ============================================================


-- PROFILES

drop policy if exists "Users can view own profile"
on public.profiles;

drop policy if exists "Users can insert own profile"
on public.profiles;

drop policy if exists "Users can update own profile"
on public.profiles;

drop policy if exists "Admins can view all profiles"
on public.profiles;

drop policy if exists "Admins can update profiles"
on public.profiles;


-- BUILDINGS

drop policy if exists "Public can view buildings"
on public.buildings;

drop policy if exists "Authenticated users can insert their own building"
on public.buildings;

drop policy if exists "Owners can update their own building"
on public.buildings;

drop policy if exists "Owners can delete their own building"
on public.buildings;

drop policy if exists "Admins can manage buildings"
on public.buildings;


-- ROOM TYPES

drop policy if exists "Public can view room types"
on public.room_types;

drop policy if exists "Owners can insert room types for their building"
on public.room_types;

drop policy if exists "Owners can update room types for their building"
on public.room_types;

drop policy if exists "Owners can delete room types for their building"
on public.room_types;

drop policy if exists "Admins can manage room types"
on public.room_types;


-- REVIEWS

drop policy if exists "Public can view reviews"
on public.reviews;

drop policy if exists "Authenticated users can add a review as themselves"
on public.reviews;

drop policy if exists "Admins can manage reviews"
on public.reviews;


-- SAVED BUILDINGS

drop policy if exists "Users can view their own saved buildings"
on public.saved_buildings;

drop policy if exists "Users can save a building as themselves"
on public.saved_buildings;

drop policy if exists "Users can remove their own saved building"
on public.saved_buildings;


-- ENQUIRIES

drop policy if exists "Users can create their own enquiries"
on public.enquiries;

drop policy if exists "Users can view their own enquiries"
on public.enquiries;

drop policy if exists "Owners can view enquiries for their properties"
on public.enquiries;

drop policy if exists "Owners can update enquiries for their properties"
on public.enquiries;

drop policy if exists "Admins can manage enquiries"
on public.enquiries;


-- VERIFICATION

drop policy if exists "Owners can create verification requests"
on public.verification_requests;

drop policy if exists "Owners can view own verification requests"
on public.verification_requests;

drop policy if exists "Admins can manage verification requests"
on public.verification_requests;


-- REPORTS

drop policy if exists "Users can create property reports"
on public.property_reports;

drop policy if exists "Users can view own property reports"
on public.property_reports;

drop policy if exists "Admins can manage property reports"
on public.property_reports;


-- NOTIFICATIONS

drop policy if exists "Users can view own notifications"
on public.notifications;

drop policy if exists "Users can update own notifications"
on public.notifications;

drop policy if exists "Admins can manage notifications"
on public.notifications;


-- ============================================================
-- PROFILES POLICIES
-- ============================================================

create policy "Users can view own profile"

on public.profiles

for select

to authenticated

using (
    id = auth.uid()
);


create policy "Users can insert own profile"

on public.profiles

for insert

to authenticated

with check (
    id = auth.uid()
);


create policy "Users can update own profile"

on public.profiles

for update

to authenticated

using (
    id = auth.uid()
)

with check (
    id = auth.uid()
);


create policy "Admins can view all profiles"

on public.profiles

for select

to authenticated

using (
    public.is_admin()
);


create policy "Admins can update profiles"

on public.profiles

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- BUILDINGS POLICIES
-- ============================================================

create policy "Public can view buildings"

on public.buildings

for select

to anon, authenticated

using (
    true
);


create policy "Authenticated users can insert their own building"

on public.buildings

for insert

to authenticated

with check (
    auth.uid() = created_by
);


create policy "Owners can update their own building"

on public.buildings

for update

to authenticated

using (
    auth.uid() = created_by
)

with check (
    auth.uid() = created_by
);


create policy "Owners can delete their own building"

on public.buildings

for delete

to authenticated

using (
    auth.uid() = created_by
);


create policy "Admins can manage buildings"

on public.buildings

for all

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- ROOM TYPES POLICIES
-- ============================================================

create policy "Public can view room types"

on public.room_types

for select

to anon, authenticated

using (
    true
);


create policy "Owners can insert room types for their building"

on public.room_types

for insert

to authenticated

with check (
    exists (
        select 1
        from public.buildings b
        where b.id = building_id
        and b.created_by = auth.uid()
    )
);


create policy "Owners can update room types for their building"

on public.room_types

for update

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


create policy "Owners can delete room types for their building"

on public.room_types

for delete

to authenticated

using (
    exists (
        select 1
        from public.buildings b
        where b.id = building_id
        and b.created_by = auth.uid()
    )
);


create policy "Admins can manage room types"

on public.room_types

for all

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- REVIEWS POLICIES
-- ============================================================

create policy "Public can view reviews"

on public.reviews

for select

to anon, authenticated

using (
    status = 'published'
);


create policy "Authenticated users can add a review as themselves"

on public.reviews

for insert

to authenticated

with check (
    auth.uid() = user_id
);


create policy "Admins can manage reviews"

on public.reviews

for all

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- SAVED BUILDINGS POLICIES
-- ============================================================

create policy "Users can view their own saved buildings"

on public.saved_buildings

for select

to authenticated

using (
    auth.uid() = user_id
);


create policy "Users can save a building as themselves"

on public.saved_buildings

for insert

to authenticated

with check (
    auth.uid() = user_id
);


create policy "Users can remove their own saved building"

on public.saved_buildings

for delete

to authenticated

using (
    auth.uid() = user_id
);


-- ============================================================
-- ENQUIRY POLICIES
-- ============================================================

create policy "Users can create their own enquiries"

on public.enquiries

for insert

to authenticated

with check (
    auth.uid() = user_id
);


create policy "Users can view their own enquiries"

on public.enquiries

for select

to authenticated

using (
    auth.uid() = user_id
);


create policy "Owners can view enquiries for their properties"

on public.enquiries

for select

to authenticated

using (
    exists (
        select 1
        from public.buildings b
        where b.id = building_id
        and b.created_by = auth.uid()
    )
);


create policy "Owners can update enquiries for their properties"

on public.enquiries

for update

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


create policy "Admins can manage enquiries"

on public.enquiries

for all

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- VERIFICATION REQUEST POLICIES
-- ============================================================

create policy "Owners can create verification requests"

on public.verification_requests

for insert

to authenticated

with check (
    auth.uid() = submitted_by
);


create policy "Owners can view own verification requests"

on public.verification_requests

for select

to authenticated

using (
    auth.uid() = submitted_by
);


create policy "Admins can manage verification requests"

on public.verification_requests

for all

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- PROPERTY REPORT POLICIES
-- ============================================================

create policy "Users can create property reports"

on public.property_reports

for insert

to authenticated

with check (
    auth.uid() = reported_by
);


create policy "Users can view own property reports"

on public.property_reports

for select

to authenticated

using (
    auth.uid() = reported_by
);


create policy "Admins can manage property reports"

on public.property_reports

for all

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- NOTIFICATION POLICIES
-- ============================================================

create policy "Users can view own notifications"

on public.notifications

for select

to authenticated

using (
    auth.uid() = user_id
);


create policy "Users can update own notifications"

on public.notifications

for update

to authenticated

using (
    auth.uid() = user_id
)

with check (
    auth.uid() = user_id
);


create policy "Admins can manage notifications"

on public.notifications

for all

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- ============================================================
-- NORMALIZE EXISTING DATA
--
-- Existing buildings created before this schema update
-- receive safe defaults.
-- ============================================================

update public.buildings

set listing_status = 'published'

where listing_status is null;


update public.buildings

set verification_status =
    case
        when owner_verified = true
        then 'approved'
        else 'pending'
    end

where verification_status is null;


-- ============================================================
-- FINAL
-- ============================================================

select
    'RoomDhundo database schema updated successfully.' as message;