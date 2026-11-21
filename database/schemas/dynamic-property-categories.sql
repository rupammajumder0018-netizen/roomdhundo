-- ============================================================
-- ROOMDHUNDO — DYNAMIC PROPERTY CATEGORIES & SPECIFICATIONS
-- Adds industry-level category, subcategory, and specification fields.
-- Idempotent and safe to run multiple times.
-- ============================================================

-- 1. Main category (one of: pg_hostels, hotels_stays, flats_rentals, event_spaces)
alter table public.buildings
    add column if not exists category text;

-- 2. Subcategories array (multi-select e.g. ["PG", "Only Boys PG"])
alter table public.buildings
    add column if not exists subcategories jsonb not null default '[]'::jsonb;

-- 3. Dynamic category specifications (gender, food, BHK, capacity, etc.)
alter table public.buildings
    add column if not exists category_details jsonb not null default '{}'::jsonb;

-- 4. WhatsApp contact number for owners/managers
alter table public.buildings
    add column if not exists owner_whatsapp text;

-- 5. Helpful index for querying by category
create index if not exists idx_buildings_category on public.buildings(category);

-- 6. Backfill existing buildings with default categories if null
update public.buildings
set category = case
    when lower(type) in ('hotel', 'guest house', 'resort', 'lodge', 'homestay') then 'hotels_stays'
    when lower(type) in ('flat', 'apartment', 'independent room', 'independent house', 'studio apartment') then 'flats_rentals'
    when lower(type) in ('event hall', 'banquet hall', 'party hall', 'wedding venue', 'conference hall', 'meeting hall') then 'event_spaces'
    else 'pg_hostels'
end
where category is null;
