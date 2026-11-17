-- Extra hotel listing fields. Safe to re-run.
-- Does not replace buildings / room_types.

alter table public.buildings
    add column if not exists hotel_meta jsonb not null default '{}'::jsonb;

alter table public.buildings
    add column if not exists latitude double precision;

alter table public.buildings
    add column if not exists longitude double precision;

alter table public.buildings
    add column if not exists owner_email text;

alter table public.buildings
    add column if not exists website text;

alter table public.room_types
    add column if not exists hourly_price integer;

alter table public.room_types
    add column if not exists weekend_price integer;

alter table public.room_types
    add column if not exists extra_person_charge integer;

alter table public.room_types
    add column if not exists total_rooms integer;

alter table public.room_types
    add column if not exists room_size integer;

alter table public.room_types
    add column if not exists adults integer;

alter table public.room_types
    add column if not exists children integer;

alter table public.room_types
    add column if not exists room_details jsonb not null default '{}'::jsonb;
