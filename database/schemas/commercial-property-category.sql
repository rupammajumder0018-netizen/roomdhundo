-- ============================================================
-- ROOMDHUNDO — COMMERCIAL PROPERTY CATEGORY SCHEMA UPDATE
-- Integrates the 5th property category: "Commercial"
-- Supports shops, showrooms, offices, warehouses, godowns, etc.
-- Idempotent and safe to execute in PostgreSQL.
-- ============================================================

-- 1. Ensure category, subcategories, and category_details exist on public.buildings
alter table public.buildings
    add column if not exists category text;

alter table public.buildings
    add column if not exists subcategories jsonb not null default '[]'::jsonb;

alter table public.buildings
    add column if not exists category_details jsonb not null default '{}'::jsonb;

-- 2. Ensure room_size, room_details, and availability columns exist on public.room_types / rooms
alter table if exists public.room_types
    add column if not exists room_size text,
    add column if not exists room_details jsonb not null default '{}'::jsonb,
    add column if not exists availability text default 'Available';

alter table if exists public.rooms
    add column if not exists room_size text,
    add column if not exists room_details jsonb not null default '{}'::jsonb,
    add column if not exists availability text default 'Available';

-- 3. Create or update composite index for category and subcategory filtering
create index if not exists idx_buildings_category on public.buildings(category);
create index if not exists idx_buildings_subcategories on public.buildings using gin(subcategories);

-- 4. Backfill any existing commercial properties based on their type strings
update public.buildings
set category = 'commercial'
where (
    lower(type) like '%shop%' or
    lower(type) like '%retail%' or
    lower(type) like '%showroom%' or
    lower(type) like '%office%' or
    lower(type) like '%coworking%' or
    lower(type) like '%warehouse%' or
    lower(type) like '%godown%' or
    lower(type) like '%commercial%' or
    lower(type) like '%industrial%' or
    lower(type) like '%restaurant space%'
) and (category is null or category != 'commercial');
