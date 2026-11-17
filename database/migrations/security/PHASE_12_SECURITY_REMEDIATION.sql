-- ==============================================================================
-- ROOMDHUNDO — PHASE 12: FINAL COMPREHENSIVE DATABASE SECURITY REMEDIATION
-- File: database/migrations/security/PHASE_12_SECURITY_REMEDIATION.sql
-- Status: PREPARED FOR REVIEW (STRICTLY NON-DESTRUCTIVE — DO NOT EXECUTE WITHOUT APPROVAL)
-- Purpose:
--   1. Close critical privilege escalation on public.profiles (BEFORE INSERT/UPDATE trigger).
--   2. Drop global profile data leak ("Admin read profiles") and replace with private self-read.
--   3. Implement owner approval workflow (owner_approval_status: 'pending' by default).
--   4. Automate profile creation on auth.users via non-swallowing handle_new_user() trigger.
--   5. Restrict public viewing strictly to approved AND published buildings and room types.
--   6. Relocate and protect owner_email in a private building_owner_contacts table.
--   7. Fix room/building tautology bug in hotel_bookings guest insert policy.
--   8. Enforce hotel booking and enquiry update constraints and valid state transitions.
--   9. Protect applicant contact details on agent_applications and review exposure.
--  10. Secure storage.objects with folder-level isolation and MIME/size limits.
--  11. Unify admin checks to public.roomdhundo_is_admin() with search_path hardening.
--  12. Reconcile all overlapping permissive policies and revoke anon RPC access.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- SECTION 1: PRE-FLIGHT VERIFICATION
-- ==============================================================================
DO $$
BEGIN
    IF current_user NOT IN ('postgres', 'supabase_admin') THEN
        RAISE NOTICE 'Executing migration under user: %', current_user;
    END IF;
END $$;


-- ==============================================================================
-- SECTION 2: CANONICAL ADMIN & OWNER AUTHORIZATION FUNCTIONS
-- ==============================================================================

-- 2.1 Unified, Hardened Admin Authorization Function
-- Replaces unverified private.is_admin() dependency with canonical search_path-hardened check
CREATE OR REPLACE FUNCTION public.roomdhundo_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND lower(coalesce(p.role, '')) IN ('admin', 'administrator', 'super_admin')
    );
$$;

-- 2.2 Standard is_admin() wrapper pointing to canonical implementation
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
    SELECT public.roomdhundo_is_admin();
$$;

-- 2.3 Verified Owner Approval Helper
CREATE OR REPLACE FUNCTION public.is_approved_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND lower(coalesce(p.role, '')) = 'owner'
          AND lower(coalesce(p.owner_approval_status, '')) = 'approved'
    );
$$;

-- 2.4 Revoke public/anonymous RPC execution privileges on internal authorization functions
-- (Remediates Supabase Linter warnings 0028 & 0029)
REVOKE EXECUTE ON FUNCTION public.roomdhundo_is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.roomdhundo_is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_approved_owner() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_approved_owner() TO authenticated;


-- ==============================================================================
-- SECTION 3: PROFILES SCHEMA ENHANCEMENT & STRICT ROLE PROTECTION
-- ==============================================================================

-- 3.1 Safely add required columns to public.profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS owner_approval_status text DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3.2 Enforce owner_approval_status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_owner_approval_status_check' 
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_owner_approval_status_check
            CHECK (owner_approval_status IS NULL OR owner_approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- 3.3 Set initial approval status:
-- Do NOT automatically approve existing owners without evidence of prior administrative approval.
-- All existing owners default to 'pending' to require explicit administrator confirmation.
-- Renters receive NULL approval status as renters do not require listing approval.
UPDATE public.profiles
SET owner_approval_status = 'pending'
WHERE role = 'owner' AND owner_approval_status IS NULL;

UPDATE public.profiles
SET owner_approval_status = NULL
WHERE role IN ('user', 'agent', 'agent_pending');

-- 3.4 Hardened Trigger: Block unauthorized role & approval manipulation on INSERT and UPDATE
-- In PostgreSQL, RLS WITH CHECK cannot inspect OLD values on UPDATE.
-- A BEFORE INSERT OR UPDATE trigger guarantees that no non-admin caller can:
--   a) Insert a profile with role = 'admin', 'administrator', or 'agent'.
--   b) Insert an owner profile with owner_approval_status = 'approved'.
--   c) Update role or owner_approval_status without being an active administrator.
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    -- Determine whether executing caller is an authorized administrator
    SELECT public.roomdhundo_is_admin() INTO v_is_admin;

    IF TG_OP = 'INSERT' THEN
        -- Non-admins cannot insert privileged roles or pre-approved status
        IF NOT v_is_admin THEN
            IF lower(coalesce(NEW.role, 'user')) IN ('admin', 'administrator', 'super_admin', 'agent') THEN
                RAISE EXCEPTION 'Security Violation: Privileged roles cannot be self-assigned.';
            END IF;
            IF NEW.role = 'owner' AND lower(coalesce(NEW.owner_approval_status, 'pending')) = 'approved' THEN
                RAISE EXCEPTION 'Security Violation: Owner approval requires platform administrator authorization.';
            END IF;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Block role changes by non-admins
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            IF NOT v_is_admin THEN
                RAISE EXCEPTION 'Security Violation: Only platform administrators are permitted to modify account roles.';
            END IF;
        END IF;

        -- Block owner_approval_status changes by non-admins
        IF OLD.owner_approval_status IS DISTINCT FROM NEW.owner_approval_status THEN
            IF NOT v_is_admin THEN
                RAISE EXCEPTION 'Security Violation: Only platform administrators are permitted to modify owner approval status.';
            END IF;
        END IF;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_roles();


-- ==============================================================================
-- SECTION 4: AUTOMATED PROFILE CREATION TRIGGER ON AUTH.USERS
-- ==============================================================================

-- 4.1 Reliable, Non-Swallowing handle_new_user() Trigger Function
-- Triggered AFTER INSERT ON auth.users.
-- Critical fix: Does NOT swallow insertion exceptions with empty exception handlers,
-- preventing silent failure and orphan creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
    v_raw_role text;
    v_assigned_role text;
    v_approval_status text;
    v_full_name text;
BEGIN
    -- Extract and sanitize raw role requested in metadata
    v_raw_role := lower(trim(coalesce(NEW.raw_user_meta_data->>'role', 'user')));
    
    -- Extract full name
    v_full_name := trim(coalesce(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        ''
    ));

    -- Enforce strict role sanitization:
    -- Only 'owner' is recognized for owner intent.
    -- All other roles ('admin', 'agent', etc.) strictly default to 'user'.
    IF v_raw_role = 'owner' THEN
        v_assigned_role := 'owner';
        v_approval_status := 'pending'; -- New owners always require admin approval
    ELSE
        v_assigned_role := 'user';
        v_approval_status := NULL;      -- Renters do not require owner approval
    END IF;

    -- Idempotent profile creation:
    -- Never overwrite existing roles or approval statuses on conflict
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        owner_approval_status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NULLIF(v_full_name, ''),
        NEW.email,
        v_assigned_role,
        v_approval_status,
        coalesce(NEW.created_at, now()),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = coalesce(EXCLUDED.email, public.profiles.email),
        full_name = coalesce(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
        updated_at = now()
        -- CRITICAL: public.profiles.role and owner_approval_status are intentionally excluded
        -- so synchronization never overwrites an administrator-assigned role or moderation state.
        ;

    RETURN NEW;
END;
$$;

-- 4.2 Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- SECTION 5: RLS POLICIES FOR PROFILES
-- ==============================================================================

-- 5.1 Drop all historical and overlapping profile policies
DROP POLICY IF EXISTS "Admin read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- 5.2 Create clean, non-overlapping profile policies
-- Read Own: Users can read only their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Read All: Administrators can read all profiles
CREATE POLICY "profiles_select_admin"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.roomdhundo_is_admin());

-- Insert Own: Profile insertion is strictly restricted to regular user role
-- (trg_protect_profile_roles additionally enforces non-escalation)
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id AND
        role = 'user' AND
        owner_approval_status IS NULL
    );

-- Update Own: Users can update their own profile fields
-- (trg_protect_profile_roles blocks changing role or owner_approval_status)
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin Update: Administrators can modify profiles
CREATE POLICY "profiles_update_admin"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.roomdhundo_is_admin())
    WITH CHECK (public.roomdhundo_is_admin());

-- Admin Delete: Administrators can delete non-self profiles
CREATE POLICY "profiles_delete_admin"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.roomdhundo_is_admin() AND id <> auth.uid());


-- ==============================================================================
-- SECTION 6: BUILDINGS SCHEMA, CONTACT ISOLATION & PRIVACY
-- ==============================================================================

-- 6.1 Add listing_status column to public.buildings
-- Aligns schema with frontend expectations across services:
-- status = Admin Verification ('pending', 'approved', 'rejected')
-- listing_status = Owner Publication ('draft', 'pending', 'published', 'archived')
ALTER TABLE public.buildings
    ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'published';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'buildings_listing_status_check' 
          AND conrelid = 'public.buildings'::regclass
    ) THEN
        ALTER TABLE public.buildings
            ADD CONSTRAINT buildings_listing_status_check
            CHECK (listing_status IN ('draft', 'pending', 'published', 'archived'));
    END IF;
END $$;

-- 6.2 Trigger to prevent owners from self-approving buildings
CREATE OR REPLACE FUNCTION public.protect_building_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NOT (SELECT public.roomdhundo_is_admin()) THEN
            RAISE EXCEPTION 'Unauthorized: Only platform administrators are permitted to modify property verification status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_building_status ON public.buildings;
CREATE TRIGGER trg_protect_building_status
    BEFORE UPDATE ON public.buildings
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_building_status();

-- 6.3 Dedicated Owner Contact Table: public.building_owner_contacts
-- Solves PostgreSQL row-level RLS exposure where public SELECT on buildings
-- exposed owner_email in plain text.
CREATE TABLE IF NOT EXISTS public.building_owner_contacts (
    building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_email text,
    owner_phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.building_owner_contacts ENABLE ROW LEVEL SECURITY;

-- Backfill existing owner contact data from buildings
INSERT INTO public.building_owner_contacts (building_id, owner_id, owner_email, owner_phone)
SELECT id, created_by, owner_email, owner_phone
FROM public.buildings
WHERE created_by IS NOT NULL
ON CONFLICT (building_id) DO UPDATE SET
    owner_email = EXCLUDED.owner_email,
    owner_phone = EXCLUDED.owner_phone;

-- Redact plain text owner_email on buildings table so public queries never receive it
UPDATE public.buildings
SET owner_email = NULL
WHERE owner_email IS NOT NULL;

-- 6.4 Building Owner Contacts RLS Policies (Owner & Admin only, strictly linked to ownership)
DROP POLICY IF EXISTS "contacts_select_owner_and_admin" ON public.building_owner_contacts;
CREATE POLICY "contacts_select_owner_and_admin"
    ON public.building_owner_contacts FOR SELECT
    TO authenticated
    USING (
        (auth.uid() = owner_id) OR
        public.roomdhundo_is_admin()
    );

DROP POLICY IF EXISTS "contacts_modify_owner_and_admin" ON public.building_owner_contacts;
CREATE POLICY "contacts_modify_owner_and_admin"
    ON public.building_owner_contacts FOR ALL
    TO authenticated
    USING (
        (auth.uid() = owner_id) OR
        public.roomdhundo_is_admin()
    )
    WITH CHECK (
        (auth.uid() = owner_id AND EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = building_owner_contacts.building_id
              AND b.created_by = auth.uid()
        )) OR
        public.roomdhundo_is_admin()
    );

-- 6.5 Clean up and rebuild public.buildings RLS policies
DROP POLICY IF EXISTS "Public can view buildings" ON public.buildings;
DROP POLICY IF EXISTS "Admins can view buildings" ON public.buildings;
DROP POLICY IF EXISTS "Authenticated users can insert their own building" ON public.buildings;
DROP POLICY IF EXISTS "Owners can update their own building" ON public.buildings;
DROP POLICY IF EXISTS "Admins can update buildings" ON public.buildings;
DROP POLICY IF EXISTS "Owners can delete their own building" ON public.buildings;
DROP POLICY IF EXISTS "Admins can delete any building" ON public.buildings;
DROP POLICY IF EXISTS "buildings_select_public" ON public.buildings;
DROP POLICY IF EXISTS "buildings_select_owner" ON public.buildings;
DROP POLICY IF EXISTS "buildings_select_admin" ON public.buildings;
DROP POLICY IF EXISTS "buildings_insert_approved_owner" ON public.buildings;
DROP POLICY IF EXISTS "buildings_update_owner_and_admin" ON public.buildings;
DROP POLICY IF EXISTS "buildings_delete_owner_and_admin" ON public.buildings;

-- Public Visibility: ONLY approved AND published buildings are visible to the public
CREATE POLICY "buildings_select_public"
    ON public.buildings FOR SELECT
    TO public
    USING (
        status = 'approved' AND 
        listing_status = 'published'
    );

-- Owner Visibility: Owners can view all their own buildings (draft, pending, approved, archived)
CREATE POLICY "buildings_select_owner"
    ON public.buildings FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

-- Admin Visibility: Administrators can view all buildings
CREATE POLICY "buildings_select_admin"
    ON public.buildings FOR SELECT
    TO authenticated
    USING (public.roomdhundo_is_admin());

-- Insert: Only APPROVED owners (or administrators) can create new buildings
CREATE POLICY "buildings_insert_approved_owner"
    ON public.buildings FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = created_by AND (
            public.is_approved_owner() OR
            public.roomdhundo_is_admin()
        )
    );

-- Update: Building owners (if approved) or administrators can update buildings
-- (trg_protect_building_status prevents owners from changing status)
CREATE POLICY "buildings_update_owner_and_admin"
    ON public.buildings FOR UPDATE
    TO authenticated
    USING (
        (auth.uid() = created_by AND public.is_approved_owner()) OR
        public.roomdhundo_is_admin()
    )
    WITH CHECK (
        (auth.uid() = created_by AND public.is_approved_owner()) OR
        public.roomdhundo_is_admin()
    );

-- Delete: Building owners (if approved) or administrators can delete buildings
CREATE POLICY "buildings_delete_owner_and_admin"
    ON public.buildings FOR DELETE
    TO authenticated
    USING (
        (auth.uid() = created_by AND public.is_approved_owner()) OR
        public.roomdhundo_is_admin()
    );


-- ==============================================================================
-- SECTION 7: ROOM TYPES PUBLICATION & OWNER SECURITY
-- ==============================================================================

DROP POLICY IF EXISTS "Public can view room types" ON public.room_types;
DROP POLICY IF EXISTS "Admins can view room types" ON public.room_types;
DROP POLICY IF EXISTS "Owners can insert room types for their building" ON public.room_types;
DROP POLICY IF EXISTS "Owners can update room types for their building" ON public.room_types;
DROP POLICY IF EXISTS "Admins can update room types" ON public.room_types;
DROP POLICY IF EXISTS "Owners can delete room types for their building" ON public.room_types;
DROP POLICY IF EXISTS "Admins can delete any room type" ON public.room_types;
DROP POLICY IF EXISTS "room_types_select_public" ON public.room_types;
DROP POLICY IF EXISTS "room_types_select_owner" ON public.room_types;
DROP POLICY IF EXISTS "room_types_select_admin" ON public.room_types;
DROP POLICY IF EXISTS "room_types_insert_owner" ON public.room_types;
DROP POLICY IF EXISTS "room_types_update_owner" ON public.room_types;
DROP POLICY IF EXISTS "room_types_delete_owner" ON public.room_types;

-- Public Visibility: Room types are public ONLY if their parent building is approved AND published
CREATE POLICY "room_types_select_public"
    ON public.room_types FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = room_types.building_id
              AND b.status = 'approved'
              AND b.listing_status = 'published'
        )
    );

-- Owner Visibility: Owners can view room types for their own buildings
CREATE POLICY "room_types_select_owner"
    ON public.room_types FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = room_types.building_id
              AND b.created_by = auth.uid()
        )
    );

-- Admin Visibility: Administrators can view all room types
CREATE POLICY "room_types_select_admin"
    ON public.room_types FOR SELECT
    TO authenticated
    USING (public.roomdhundo_is_admin());

-- Insert: Only approved owners for their building (or admin) can create room types
CREATE POLICY "room_types_insert_owner"
    ON public.room_types FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = room_types.building_id
              AND (
                (b.created_by = auth.uid() AND public.is_approved_owner()) OR
                public.roomdhundo_is_admin()
              )
        )
    );

-- Update: Only approved owners for their building (or admin) can update room types
CREATE POLICY "room_types_update_owner"
    ON public.room_types FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = room_types.building_id
              AND (
                (b.created_by = auth.uid() AND public.is_approved_owner()) OR
                public.roomdhundo_is_admin()
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = room_types.building_id
              AND (
                (b.created_by = auth.uid() AND public.is_approved_owner()) OR
                public.roomdhundo_is_admin()
              )
        )
    );

-- Delete: Only approved owners for their building (or admin) can delete room types
CREATE POLICY "room_types_delete_owner"
    ON public.room_types FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = room_types.building_id
              AND (
                (b.created_by = auth.uid() AND public.is_approved_owner()) OR
                public.roomdhundo_is_admin()
              )
        )
    );


-- ==============================================================================
-- SECTION 8: HOTEL BOOKINGS POLICY HARDENING & VALID TRANSITIONS
-- ==============================================================================

DROP POLICY IF EXISTS "Guests can create their own hotel bookings" ON public.hotel_bookings;
DROP POLICY IF EXISTS "Guests owners and admins can view hotel bookings" ON public.hotel_bookings;
DROP POLICY IF EXISTS "Owners can respond to hotel bookings" ON public.hotel_bookings;
DROP POLICY IF EXISTS "Admins can manage all hotel bookings" ON public.hotel_bookings;
DROP POLICY IF EXISTS "hotel_bookings_insert_guest" ON public.hotel_bookings;
DROP POLICY IF EXISTS "hotel_bookings_select_parties" ON public.hotel_bookings;
DROP POLICY IF EXISTS "hotel_bookings_update_owner" ON public.hotel_bookings;
DROP POLICY IF EXISTS "hotel_bookings_admin_all" ON public.hotel_bookings;

-- 8.1 Hardened prevent_hotel_booking_overlap() with state transition validation
CREATE OR REPLACE FUNCTION public.prevent_hotel_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
    v_capacity integer;
    v_overlaps integer;
    v_building_owner uuid;
    v_is_admin boolean;
BEGIN
    SELECT public.roomdhundo_is_admin() INTO v_is_admin;

    -- Validate building owner match
    SELECT b.created_by INTO v_building_owner
    FROM public.buildings b WHERE b.id = NEW.building_id;
    IF NOT FOUND OR v_building_owner IS DISTINCT FROM NEW.owner_id THEN
        RAISE EXCEPTION 'Integrity Error: Selected owner does not match hotel building ownership.';
    END IF;

    -- Validate room type belongs to hotel
    IF NOT EXISTS (
        SELECT 1 FROM public.room_types rt 
        WHERE rt.id = NEW.room_type_id AND rt.building_id = NEW.building_id
    ) THEN
        RAISE EXCEPTION 'Integrity Error: Selected room type does not belong to this hotel.';
    END IF;

    -- Non-admin owners can only update status and owner_note
    IF TG_OP = 'UPDATE' AND auth.uid() = OLD.owner_id AND NOT v_is_admin THEN
        IF NEW.building_id IS DISTINCT FROM OLD.building_id
            OR NEW.room_type_id IS DISTINCT FROM OLD.room_type_id
            OR NEW.user_id IS DISTINCT FROM OLD.user_id
            OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
            OR NEW.guest_name IS DISTINCT FROM OLD.guest_name
            OR NEW.guest_phone IS DISTINCT FROM OLD.guest_phone
            OR NEW.guest_count IS DISTINCT FROM OLD.guest_count
            OR NEW.booking_mode IS DISTINCT FROM OLD.booking_mode
            OR NEW.check_in IS DISTINCT FROM OLD.check_in
            OR NEW.check_out IS DISTINCT FROM OLD.check_out
            OR NEW.hours_count IS DISTINCT FROM OLD.hours_count
            OR NEW.nights_count IS DISTINCT FROM OLD.nights_count
            OR NEW.price_per_unit IS DISTINCT FROM OLD.price_per_unit
            OR NEW.total_price IS DISTINCT FROM OLD.total_price
            OR NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN
            RAISE EXCEPTION 'Unauthorized: Property owners may only update booking status and owner notes.';
        END IF;

        -- Enforce valid booking state transitions
        IF OLD.status = 'pending' AND NEW.status NOT IN ('pending', 'confirmed', 'rejected', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid State Transition: Pending booking can only transition to confirmed, rejected, or cancelled.';
        ELSIF OLD.status = 'confirmed' AND NEW.status NOT IN ('confirmed', 'completed', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid State Transition: Confirmed booking can only transition to completed or cancelled.';
        ELSIF OLD.status IN ('rejected', 'cancelled', 'completed') AND OLD.status IS DISTINCT FROM NEW.status THEN
            RAISE EXCEPTION 'Invalid State Transition: Terminal booking status cannot be re-opened by owner.';
        END IF;
    END IF;

    -- Concurrency room lock and overlap validation
    IF NEW.status = 'confirmed' THEN
        SELECT greatest(coalesce(rt.available_rooms, 0), 0) INTO v_capacity
        FROM public.room_types rt WHERE rt.id = NEW.room_type_id FOR UPDATE;

        IF coalesce(v_capacity, 0) < 1 THEN
            RAISE EXCEPTION 'Capacity Error: No rooms are currently available for this room type.';
        END IF;

        SELECT count(*) INTO v_overlaps
        FROM public.hotel_bookings b
        WHERE b.room_type_id = NEW.room_type_id
          AND b.id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND b.status = 'confirmed'
          AND tstzrange(b.check_in, b.check_out, '[)') && tstzrange(NEW.check_in, NEW.check_out, '[)');

        IF v_overlaps >= v_capacity THEN
            RAISE EXCEPTION 'Availability Error: All rooms of this type are already booked during the selected period.';
        END IF;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 8.2 Guest Insert Policy (Fixes tautology rt.building_id = rt.building_id)
CREATE POLICY "hotel_bookings_insert_guest"
    ON public.hotel_bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        (user_id = auth.uid()) AND
        (status = 'pending') AND
        -- Ensure building is an approved, published hotel
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = hotel_bookings.building_id
              AND b.created_by = hotel_bookings.owner_id
              AND lower(b.type) = 'hotel'
              AND b.status = 'approved'
              AND b.listing_status = 'published'
        ) AND
        -- Ensure room_type genuinely belongs to this hotel
        EXISTS (
            SELECT 1 FROM public.room_types rt
            WHERE rt.id = hotel_bookings.room_type_id
              AND rt.building_id = hotel_bookings.building_id
        )
    );

-- 8.3 Select Policy
CREATE POLICY "hotel_bookings_select_parties"
    ON public.hotel_bookings FOR SELECT
    TO authenticated
    USING (
        (user_id = auth.uid()) OR
        (owner_id = auth.uid()) OR
        public.roomdhundo_is_admin()
    );

-- 8.4 Owner Update Policy
CREATE POLICY "hotel_bookings_update_owner"
    ON public.hotel_bookings FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (
        (owner_id = auth.uid()) AND
        (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rejected'::text, 'cancelled'::text, 'completed'::text]))
    );

-- 8.5 Admin Management Policy
CREATE POLICY "hotel_bookings_admin_all"
    ON public.hotel_bookings FOR ALL
    TO authenticated
    USING (public.roomdhundo_is_admin())
    WITH CHECK (public.roomdhundo_is_admin());


-- ==============================================================================
-- SECTION 9: OTHER RLS POLICIES CONSOLIDATION
-- ==============================================================================

-- 9.1 AGENT APPLICATIONS: Protect Applicant Contact Details
DROP POLICY IF EXISTS "agent_applications_select_approved" ON public.agent_applications;
DROP POLICY IF EXISTS "agent_applications_select_own" ON public.agent_applications;
DROP POLICY IF EXISTS "agent_applications_insert_own" ON public.agent_applications;
DROP POLICY IF EXISTS "agent_applications_admin_all" ON public.agent_applications;

CREATE POLICY "agent_applications_select_own"
    ON public.agent_applications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "agent_applications_insert_own"
    ON public.agent_applications FOR INSERT
    TO authenticated
    WITH CHECK ((auth.uid() = user_id) AND (status = 'pending'));

CREATE POLICY "agent_applications_admin_all"
    ON public.agent_applications FOR ALL
    TO authenticated
    USING (public.roomdhundo_is_admin())
    WITH CHECK (public.roomdhundo_is_admin());

-- Secure public view for approved agents that strictly omits private PII (phone, email, pincode)
CREATE OR REPLACE VIEW public.public_approved_agents AS
SELECT 
    a.id,
    a.user_id,
    a.first_name,
    a.last_name,
    a.location,
    a.created_at
FROM public.agent_applications a
WHERE a.status = 'approved';

GRANT SELECT ON public.public_approved_agents TO anon, authenticated;

-- 9.2 ENQUIRIES: Remove Duplicate Policies & Restrict Updates
DROP POLICY IF EXISTS "Admin can delete all enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admin can update all enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admin can view all enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Owners can update their enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Owners can view their enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Users can create enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Users can view their own enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_select_parties" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_insert_user" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_update_owner" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_admin_all" ON public.enquiries;

CREATE OR REPLACE FUNCTION public.protect_enquiry_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
    IF NOT (SELECT public.roomdhundo_is_admin()) THEN
        IF NEW.user_id IS DISTINCT FROM OLD.user_id
            OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
            OR NEW.property_id IS DISTINCT FROM OLD.property_id
            OR NEW.message IS DISTINCT FROM OLD.message
            OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Unauthorized: Property owners may only update the enquiry status.';
        END IF;
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_enquiry_updates ON public.enquiries;
CREATE TRIGGER trg_protect_enquiry_updates
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_enquiry_updates();

CREATE POLICY "enquiries_select_parties"
    ON public.enquiries FOR SELECT
    TO authenticated
    USING ((auth.uid() = user_id) OR (auth.uid() = owner_id) OR public.roomdhundo_is_admin());

CREATE POLICY "enquiries_insert_user"
    ON public.enquiries FOR INSERT
    TO authenticated
    WITH CHECK ((auth.uid() = user_id) AND (status = 'pending'));

CREATE POLICY "enquiries_update_owner"
    ON public.enquiries FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (
        (auth.uid() = owner_id) AND 
        (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'contacted'::text]))
    );

CREATE POLICY "enquiries_admin_all"
    ON public.enquiries FOR ALL
    TO authenticated
    USING (public.roomdhundo_is_admin())
    WITH CHECK (public.roomdhundo_is_admin());

-- 9.3 REVIEWS: Protect against user_id impersonation & unpublished property leaks
DROP POLICY IF EXISTS "Authenticated users can add a review as themselves" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete any review" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;

-- Public can view reviews ONLY for approved and published buildings
CREATE POLICY "reviews_select_public"
    ON public.reviews FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = reviews.building_id
              AND b.status = 'approved'
              AND b.listing_status = 'published'
        )
    );

CREATE POLICY "reviews_insert_authenticated"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.buildings b
            WHERE b.id = reviews.building_id
              AND b.status = 'approved'
              AND b.listing_status = 'published'
        )
    );

CREATE POLICY "reviews_admin_delete"
    ON public.reviews FOR DELETE
    TO authenticated
    USING (public.roomdhundo_is_admin());


-- ==============================================================================
-- SECTION 10: STORAGE BUCKET CONFIGURATION & FOLDER ISOLATION
-- ==============================================================================

-- 10.1 Enforce strict bucket file constraints on property-images
UPDATE storage.buckets
SET file_size_limit = 52428800, -- 50 MB limit
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime'
    ]
WHERE id = 'property-images';

-- 10.2 Storage Objects Policies
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "storage_property_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_property_images_insert_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "storage_property_images_update_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "storage_property_images_delete_own_folder" ON storage.objects;

-- Public Read: Media remains viewable
CREATE POLICY "storage_property_images_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'property-images');

-- User Upload: Authenticated users can upload only into their own user ID folder
-- Pattern matches React client: `${userId}/${timestamp}-${index}-${safeFileName}`
CREATE POLICY "storage_property_images_insert_own_folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'property-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- User Update: Users can update objects in their own folder
CREATE POLICY "storage_property_images_update_own_folder"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'property-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'property-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- User Delete: Users can delete objects in their own folder (admins can delete any)
CREATE POLICY "storage_property_images_delete_own_folder"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'property-images' AND
        (
            auth.uid()::text = (storage.foldername(name))[1] OR
            public.roomdhundo_is_admin()
        )
    );

COMMIT;

-- ==============================================================================
-- POST-MIGRATION VERIFICATION QUERIES (RUN MANUALLY TO VALIDATE)
-- ==============================================================================
-- 1. Check policies on profiles:
--    SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE tablename = 'profiles';
-- 2. Verify triggers:
--    SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE tgname IN ('on_auth_user_created', 'trg_protect_profile_roles', 'trg_protect_building_status', 'trg_protect_enquiry_updates');
-- 3. Check bucket constraints:
--    SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'property-images';
-- 4. Check owner approval column:
--    SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'owner_approval_status';
-- ==============================================================================
-- ROLLBACK GUIDANCE (IF REVERSAL IS REQUIRED PRIOR TO DATA COMMITS)
-- ==============================================================================
-- DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS trg_protect_building_status ON public.buildings;
-- DROP TRIGGER IF EXISTS trg_protect_enquiry_updates ON public.enquiries;
-- DROP FUNCTION IF EXISTS public.protect_profile_roles();
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS public.protect_building_status();
-- DROP FUNCTION IF EXISTS public.protect_enquiry_updates();
-- DROP TABLE IF EXISTS public.building_owner_contacts;
-- DROP VIEW IF EXISTS public.public_approved_agents;
-- ==============================================================================
