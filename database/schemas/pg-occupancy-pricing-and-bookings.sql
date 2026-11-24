-- ============================================================
-- Roomdhundo / Pg Dhundo — PG & Hostel Occupancy Pricing & Booking System
-- Safe idempotent migration script.
-- Adds occupancy-based pricing, bed capacity tracking, and PG booking metadata.
-- ============================================================

-- 1. Extend room_types with bed capacity and bed inventory tracking
alter table public.room_types
    add column if not exists bed_capacity integer default 1,
    add column if not exists available_beds integer default 1,
    add column if not exists occupied_beds integer default 0;

-- Ensure room_details jsonb column exists
alter table public.room_types
    add column if not exists room_details jsonb not null default '{}'::jsonb;

-- 2. Extend bookings table with sharing and occupancy booking details
alter table public.bookings
    add column if not exists sharing_type text,
    add column if not exists occupancy_people integer default 1,
    add column if not exists duration_months integer default 1,
    add column if not exists pricing_type text default 'person',
    add column if not exists price_per_unit numeric default 0,
    add column if not exists check_in_date date,
    add column if not exists booking_details jsonb not null default '{}'::jsonb;

-- 3. Update existing records with sensible defaults
update public.room_types
set bed_capacity = greatest(1, coalesce(room_people, 1)),
    available_beds = greatest(0, coalesce(available_rooms, 1)),
    occupied_beds = greatest(0, coalesce(room_people, 1) - coalesce(available_rooms, 1))
where bed_capacity is null or available_beds is null;

select 'PG & Hostel occupancy pricing and inventory schema migration applied successfully.' as status;
