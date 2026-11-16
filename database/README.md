# Roomdhundo — Database Documentation & Migrations Guide

This directory contains the database schema definitions, security remediation migrations, and reference scripts for the Roomdhundo platform hosted on Supabase (PostgreSQL 15+).

---

## 1. Directory Structure

```text
database/
├── README.md                                          # This documentation guide
├── migrations/
│   └── security/
│       ├── PHASE_12_SECURITY_REMEDIATION.sql          # Primary, consolidated security migration
│       └── PHASE_12_ORPHAN_PROFILE_BACKFILL.sql       # Safe, sanitized 45-orphan user backfill
├── schemas/                                           # Baseline schema references (historical)
│   ├── schema.sql                                     # Complete base database schema
│   ├── agent-applications.sql                         # Agent registration table & policies
│   ├── hotel-listing-fields.sql                       # Hotel amenities and pricing columns
│   └── add room images.sql                            # Room type image storage reference
└── security-recommendations.sql                       # Supplementary RLS recommendations
```

---

## 2. Live Database Architecture (Supabase)

The live database consists of the following key tables in the `public` schema:

| Table Name | Primary Purpose | Row-Level Security (RLS) | Key Columns |
| :--- | :--- | :---: | :--- |
| `public.profiles` | User profiles synced with `auth.users` | ✅ Enabled | `id` (FK auth.users), `full_name`, `email`, `role`, `phone`, `owner_approval_status`, `created_at`, `updated_at` |
| `public.buildings` | Property listings (PG, Flat, Hotel, Room) | ✅ Enabled | `id`, `name`, `type`, `location`, `status`, `listing_status`, `verification_status`, `created_by` |
| `public.room_types` | Room categories & inventory for buildings | ✅ Enabled | `id`, `building_id`, `room_type`, `price_value`, `available_rooms`, `total_rooms`, `availability`, `images` |
| `public.hotel_bookings` | Booking requests for hotel accommodations | ✅ Enabled | `id`, `building_id`, `room_type_id`, `user_id`, `guest_name`, `check_in`, `check_out`, `status`, `total_price` |
| `public.enquiries` | Renter property inquiries sent to owners | ✅ Enabled | `id`, `building_id`, `user_id`, `owner_id`, `name`, `email`, `phone`, `message`, `status` |
| `public.agent_applications` | Verified student agent onboarding requests | ✅ Enabled | `id`, `user_id`, `first_name`, `last_name`, `email`, `phone`, `college_name`, `status` |
| `public.reviews` | User reviews and ratings on properties | ✅ Enabled | `id`, `building_id`, `user_id`, `rating`, `comment`, `created_at` |
| `public.saved_buildings` | User favorites / saved bookmark items | ✅ Enabled | `id`, `building_id`, `user_id`, `created_at` |
| `public.building_owner_contacts` | Isolated contact data for property owners | ✅ Enabled | `building_id` (PK), `owner_id`, `owner_name`, `owner_email`, `owner_phone` |
| `storage.objects` | Supabase storage bucket (`property-images`) | ✅ Enabled | Folders structured as `${auth.uid()}/...` |

---

## 3. Migration Execution Order

When applying database updates via the Supabase Dashboard SQL Editor, execute the migration scripts in the following strict order:

### Step 1: Pre-Execution Verification
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and navigate to the project SQL Editor.
2. Verify that your database role is `postgres` or `service_role`.
3. Check table row counts before starting:
   ```sql
   SELECT 
     (SELECT count(*) FROM auth.users) AS auth_users_count,
     (SELECT count(*) FROM public.profiles) AS profiles_count,
     (SELECT count(*) FROM public.buildings) AS buildings_count;
   ```

### Step 2: Security Hardening Migration
- **File:** `database/migrations/security/PHASE_12_SECURITY_REMEDIATION.sql`
- **What it does:**
  1. Extends `profiles` with `phone`, `updated_at`, and `owner_approval_status`.
  2. Extends `buildings` with `listing_status` (defaults to `'published'`).
  3. Creates `public.building_owner_contacts` table to isolate owner email/phone.
  4. Hardens `public.roomdhundo_is_admin()` helper function with strict schema `search_path`.
  5. Implements `public.is_approved_owner()` authorization helper.
  6. Creates trigger `trg_protect_profile_roles` on `profiles` to prevent client-side privilege escalation.
  7. Implements idempotent `handle_new_user()` trigger on `auth.users`.
  8. Enforces non-overlapping, secure RLS policies on `profiles`, `buildings`, `room_types`, `hotel_bookings`, `agent_applications`, `enquiries`, `reviews`, and `storage.objects`.
  9. Creates secure public view `public.public_approved_agents` without private PII.
  10. Protects building moderation status and enquiry mutations with dedicated BEFORE triggers.

### Step 3: Orphan Profile Backfill
- **File:** `database/migrations/security/PHASE_12_ORPHAN_PROFILE_BACKFILL.sql`
- **What it does:**
  1. Targeted backfill for the 45 existing `auth.users` accounts that lacked `public.profiles`.
  2. Sanitizes `raw_user_meta_data`: only `'owner'` or `'user'` roles are permitted; escalations to `'admin'` or `'agent'` are rejected.
  3. Backfilled owners are placed in `'pending'` status for administrator review.
  4. Includes exact UUID rollback block at the bottom of the script for instant recovery if needed.

---

## 4. Post-Execution Verification Queries

Run the following SQL checks in Supabase SQL Editor after executing the migrations:

```sql
-- 1. Verify profile count matches auth.users count (should be 164)
SELECT 
  (SELECT count(*) FROM auth.users) AS auth_count,
  (SELECT count(*) FROM public.profiles) AS profile_count;

-- 2. Verify all RLS policies are enabled on all 10 tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 3. Verify triggers are active
SELECT event_object_table, trigger_name, action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 4. Verify helper function security
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN ('roomdhundo_is_admin', 'is_approved_owner', 'handle_new_user');
```

---

## 5. Security & Safety Rules

- **Zero Data Loss:** Migrations are purely additive (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). They do not drop tables or columns.
- **Client Trust Boundary:** Never rely on client-side state for authorization. Database triggers enforce that ordinary users cannot update their own `role` or `owner_approval_status`.
- **Payment Gateway Notice:** Razorpay integration, payment webhook triggers, and Edge Functions remain outside this scope and will be provisioned in a dedicated payment phase.
