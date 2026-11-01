-- Run once in Supabase SQL editor (adds per-room photos)
alter table public.room_types
  add column if not exists images text[] not null default '{}';