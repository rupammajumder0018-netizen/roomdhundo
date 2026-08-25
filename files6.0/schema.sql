-- =====================================================
-- ROOMDHUNDO DATABASE SCHEMA (v2 — buildings + room types)
-- Paste this whole file into Supabase SQL Editor and run it.
-- This REPLACES the old single "properties" table structure.
-- Safe to re-run: it drops and recreates these tables only.
-- =====================================================

drop table if exists saved_buildings cascade;
drop table if exists saved_properties cascade; -- old v1 table, if it still exists
drop table if exists reviews cascade;
drop table if exists room_types cascade;
drop table if exists properties cascade;       -- old v1 table, if it still exists
drop table if exists buildings cascade;

-- =====================================================
-- BUILDINGS
-- One row per physical property. Room-specific info (price,
-- sharing type, availability) lives in room_types instead.
-- =====================================================
create table buildings (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    location text not null,
    distance_km numeric not null,
    type text not null,               -- PG / Room / Mess / Flat / Guest House
    description text,
    rules jsonb default '[]',
    facilities jsonb default '[]',       -- e.g. ["📶 Wi-Fi", "🍛 Food"]
    facility_tags jsonb default '[]',    -- e.g. ["wifi", "food"]
    images jsonb default '[]',
    owner_name text not null,
    owner_phone text not null,
    owner_whatsapp text,
    owner_verified boolean default false,
    owner_member_since text,
    created_by uuid references auth.users(id),
    created_at timestamptz default now()
);

alter table buildings enable row level security;

create policy "Public can view buildings"
    on buildings for select
    using (true);

create policy "Authenticated users can insert their own building"
    on buildings for insert
    with check (auth.uid() = created_by);

create policy "Owners can update their own building"
    on buildings for update
    using (auth.uid() = created_by);

create policy "Owners can delete their own building"
    on buildings for delete
    using (auth.uid() = created_by);

-- =====================================================
-- ROOM TYPES
-- Multiple per building — this is what actually has a price.
-- =====================================================
create table room_types (
    id uuid primary key default gen_random_uuid(),
    building_id uuid references buildings(id) on delete cascade,
    room_type text not null,          -- Single / Double Sharing / Triple Sharing / 4+ Sharing
    price_value integer not null,     -- monthly rent for this room type
    daily_price integer,
    room_rent integer not null,
    room_people integer not null default 1,
    available_rooms integer not null default 1,
    availability text default 'Room available',
    created_at timestamptz default now()
);

alter table room_types enable row level security;

create policy "Public can view room types"
    on room_types for select
    using (true);

create policy "Owners can insert room types for their building"
    on room_types for insert
    with check (exists (select 1 from buildings b where b.id = building_id and b.created_by = auth.uid()));

create policy "Owners can update room types for their building"
    on room_types for update
    using (exists (select 1 from buildings b where b.id = building_id and b.created_by = auth.uid()));

create policy "Owners can delete room types for their building"
    on room_types for delete
    using (exists (select 1 from buildings b where b.id = building_id and b.created_by = auth.uid()));

-- =====================================================
-- REVIEWS (per building)
-- =====================================================
create table reviews (
    id uuid primary key default gen_random_uuid(),
    building_id uuid references buildings(id) on delete cascade,
    user_id uuid references auth.users(id),
    reviewer_name text not null,
    rating integer not null check (rating between 1 and 5),
    comment text,
    created_at timestamptz default now()
);

alter table reviews enable row level security;

create policy "Public can view reviews"
    on reviews for select
    using (true);

create policy "Authenticated users can add a review as themselves"
    on reviews for insert
    with check (auth.uid() = user_id);

-- =====================================================
-- SAVED BUILDINGS (favorites)
-- =====================================================
create table saved_buildings (
    user_id uuid references auth.users(id) on delete cascade,
    building_id uuid references buildings(id) on delete cascade,
    created_at timestamptz default now(),
    primary key (user_id, building_id)
);

alter table saved_buildings enable row level security;

create policy "Users can view their own saved buildings"
    on saved_buildings for select
    using (auth.uid() = user_id);

create policy "Users can save a building as themselves"
    on saved_buildings for insert
    with check (auth.uid() = user_id);

create policy "Users can remove their own saved building"
    on saved_buildings for delete
    using (auth.uid() = user_id);

-- =====================================================
-- SEED DATA — 10 demo buildings, each with one room type,
-- so search isn't empty on day one. (Real listings can have more.)
-- =====================================================
do $$
declare
    b_id uuid;
begin
    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Krishna PG', 'Jaguli, near MAKAUT', 2.1, 'PG', 'Krishna PG provides comfortable accommodation for students and working professionals near MAKAUT.', '["No smoking inside rooms","Visitors allowed until 9 PM","Maintain cleanliness"]', '["📶 Wi-Fi","🍛 Food","🧺 Laundry","🚗 Parking","🚿 Attached Bathroom"]', '["wifi","food","laundry","parking","bathroom"]', '["images/krishna-pg-1.webp","images/krishna-pg-2.webp"]', 'Raj Properties', '9876543210', '9876543210', true, '2026')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Double Sharing', 6000, 300, 6000, 2, 2, 'Room available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Green Residence', 'Haringhata', 4.3, 'PG', 'Green Residence offers affordable accommodation with essential facilities.', '["No smoking inside rooms","Visitors allowed until 8 PM"]', '["📶 Wi-Fi","🍛 Food","🚿 Attached Bathroom"]', '["wifi","food","bathroom"]', '["images/krishna-pg-1.webp"]', 'Green Homes', '9876543211', '9876543211', true, '2026')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Triple Sharing', 5500, 280, 5500, 2, 1, 'Room available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Sunrise Boys Hostel', 'Near MAKAUT Gate', 0.8, 'Room', 'Sunrise Boys Hostel is a single-occupancy hostel just steps from the MAKAUT main gate.', '["No smoking or alcohol","Gate closes at 10 PM"]', '["📶 Wi-Fi","🍛 Food","❄️ AC"]', '["wifi","food","ac"]', '["images/krishna-pg-1.webp"]', 'Sunrise Hostels', '9876543212', '9876543212', true, '2025')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Single', 4500, 250, 4500, 1, 3, 'Rooms available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Mahalaxmi Mess', 'Jaguli Bazar', 1.5, 'Mess', 'Mahalaxmi Mess offers budget dormitory-style beds with three home-cooked meals a day included.', '["Meal timings are fixed","No outside food in the mess hall"]', '["🍛 Food","📶 Wi-Fi"]', '["food","wifi"]', '["images/krishna-pg-1.webp"]', 'Mahalaxmi Mess Services', '9876543213', '9876543213', false, '2026')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, '4+ Sharing', 3200, 180, 3200, 4, 5, 'Beds available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Sky Heights Flat', 'Haringhata Main Road', 6.7, 'Flat', 'A fully independent 1BHK flat, ideal for working professionals who want privacy and space.', '["No subletting","Society guest register applies"]', '["📶 Wi-Fi","❄️ AC","🚗 Parking","🚿 Attached Bathroom"]', '["wifi","ac","parking","bathroom"]', '["images/krishna-pg-1.webp"]', 'Sky Heights Realty', '9876543214', '9876543214', true, '2024')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Single', 12000, 700, 12000, 1, 1, 'Flat available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Comfort Guest House', 'Near MAKAUT', 3.2, 'Guest House', 'Comfort Guest House suits both monthly stays and short nightly visits, with daily housekeeping.', '["Check-in after 12 PM","Check-out by 11 AM"]', '["📶 Wi-Fi","🍛 Food","❄️ AC","🧺 Laundry","🚿 Attached Bathroom"]', '["wifi","food","ac","laundry","bathroom"]', '["images/krishna-pg-1.webp"]', 'Comfort Stays', '9876543215', '9876543215', true, '2025')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Double Sharing', 8000, 900, 8000, 2, 4, 'Rooms available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Student Nest PG', 'Jaguli', 1.2, 'PG', 'Student Nest PG is a budget-friendly PG built specifically around MAKAUT students'' schedules.', '["No smoking inside rooms","Visitors allowed until 8 PM"]', '["📶 Wi-Fi","🍛 Food","🧺 Laundry"]', '["wifi","food","laundry"]', '["images/krishna-pg-1.webp"]', 'Student Nest Housing', '9876543216', '9876543216', true, '2026')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Triple Sharing', 5000, 260, 5000, 3, 2, 'Rooms available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('City View Rooms', 'Haringhata Chowk', 9.4, 'Room', 'City View Rooms offers no-frills single rooms a bit further out, at a lower monthly rent.', '["No visitors after 9 PM","Electricity billed separately"]', '["📶 Wi-Fi","🚗 Parking"]', '["wifi","parking"]', '["images/krishna-pg-1.webp"]', 'City View Properties', '9876543217', '9876543217', false, '2025')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Single', 4000, 220, 4000, 1, 6, 'Rooms available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Annapurna Mess', 'MAKAUT Road', 0.5, 'Mess', 'Annapurna Mess is the most budget option on the list, right on MAKAUT Road.', '["Meal timings are fixed","No refunds for missed meals"]', '["🍛 Food"]', '["food"]', '["images/krishna-pg-1.webp"]', 'Annapurna Services', '9876543218', '9876543218', false, '2026')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, '4+ Sharing', 2800, 160, 2800, 4, 8, 'Beds available');

    insert into buildings (name, location, distance_km, type, description, rules, facilities, facility_tags, images, owner_name, owner_phone, owner_whatsapp, owner_verified, owner_member_since)
    values ('Royal Residency Flat', 'Jaguli', 5.5, 'Flat', 'Royal Residency is a premium 2BHK flat ideal for sharing between two working professionals.', '["No subletting","Advance deposit required"]', '["📶 Wi-Fi","❄️ AC","🚗 Parking","🚿 Attached Bathroom","🧺 Laundry"]', '["wifi","ac","parking","bathroom","laundry"]', '["images/krishna-pg-1.webp"]', 'Royal Residency', '9876543219', '9876543219', true, '2023')
    returning id into b_id;
    insert into room_types (building_id, room_type, price_value, daily_price, room_rent, room_people, available_rooms, availability)
    values (b_id, 'Double Sharing', 15000, 850, 15000, 2, 2, 'Flat available');
end $$;
