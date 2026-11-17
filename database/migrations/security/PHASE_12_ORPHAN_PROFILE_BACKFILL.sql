-- ==============================================================================
-- ROOMDHUNDO — PHASE 12: ORPHAN PROFILE RECOVERY & DATA BACKFILL
-- File: database/migrations/security/PHASE_12_ORPHAN_PROFILE_BACKFILL.sql
-- Status: PREPARED FOR REVIEW (DO NOT EXECUTE WITHOUT MANUAL APPROVAL)
-- Purpose:
--   Recovers 45 registered user accounts currently in auth.users that lack
--   a corresponding public.profiles record due to the historical absence of
--   the handle_new_user() trigger.
--
-- Safety Principles:
--   1. Treats raw_user_meta_data as completely untrusted client input.
--   2. Sanitizes roles:
--      - Explicit 'owner' metadata receives role = 'owner' and owner_approval_status = 'pending'.
--      - Metadata containing 'agent', 'admin', 'administrator', 'super_admin' or blank
--        is safely sanitized to role = 'user' (Renter).
--      - No unverified user receives elevated privileges or immediate owner approval.
--   3. Idempotent: Only inserts for users missing from public.profiles.
--   4. Preserves all 119 existing profiles, their IDs, and admin privileges untouched.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PRE-CHECK: INSPECT ORPHAN COUNT BEFORE BACKFILL
-- ==============================================================================
-- Run this check before execution. Expected count is exactly 45 orphan records.
DO $$
DECLARE
    v_orphan_count integer;
BEGIN
    SELECT count(*) INTO v_orphan_count
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

    RAISE NOTICE 'Discovered % orphan accounts in auth.users awaiting profile recovery.', v_orphan_count;
END $$;


-- ==============================================================================
-- IDEMPOTENT BACKFILL EXECUTION
-- ==============================================================================
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    owner_approval_status,
    created_at,
    updated_at
)
SELECT
    u.id,
    -- Extract full name from metadata if provided, otherwise NULL
    NULLIF(trim(coalesce(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        ''
    )), ''),
    u.email,
    -- Strict Role Sanitization:
    -- Only 'owner' is recognized for owner intent.
    -- Historical metadata 'agent' or privileged roles are strictly downgraded to 'user'
    -- because agents require formal application review and approval.
    CASE 
        WHEN lower(trim(coalesce(u.raw_user_meta_data->>'role', ''))) = 'owner' THEN 'owner'
        ELSE 'user'
    END AS role,
    -- Approval Status Sanitization:
    -- All recovered owners start in 'pending' status requiring administrator confirmation.
    -- Non-owners receive NULL as renters do not require listing approval.
    CASE 
        WHEN lower(trim(coalesce(u.raw_user_meta_data->>'role', ''))) = 'owner' THEN 'pending'
        ELSE NULL
    END AS owner_approval_status,
    coalesce(u.created_at, now()) AS created_at,
    now() AS updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ==============================================================================
-- POST-CHECK: VERIFY ZERO ORPHANS REMAIN
-- ==============================================================================
DO $$
DECLARE
    v_remaining_orphans integer;
    v_total_profiles integer;
BEGIN
    SELECT count(*) INTO v_remaining_orphans
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

    SELECT count(*) INTO v_total_profiles
    FROM public.profiles;

    IF v_remaining_orphans > 0 THEN
        RAISE EXCEPTION 'Backfill validation failed: % orphan accounts still remain.', v_remaining_orphans;
    ELSE
        RAISE NOTICE 'Backfill complete. Remaining orphans: 0. Total public.profiles: %.', v_total_profiles;
    END IF;
END $$;

COMMIT;

-- ==============================================================================
-- VERIFICATION & RECONCILIATION QUERIES (RUN MANUALLY)
-- ==============================================================================
-- 1. Verify exact 1-to-1 match between auth.users and public.profiles:
--    SELECT 
--        (SELECT count(*) FROM auth.users) AS total_auth_users,
--        (SELECT count(*) FROM public.profiles) AS total_profiles,
--        (SELECT count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)) AS orphan_count;
--
-- 2. Inspect distribution of recovered profiles:
--    SELECT role, owner_approval_status, count(*) 
--    FROM public.profiles 
--    GROUP BY role, owner_approval_status;
--
-- ==============================================================================
-- TARGETED ROLLBACK STATEMENT (SAFE: TOUCHES ONLY THE 45 RECOVERED IDS)
-- ==============================================================================
-- DELETE FROM public.profiles
-- WHERE id IN (
--     '5f0be324-58e2-4eac-993d-094298e0c348', 'd6b4000a-8be3-40f9-a88c-2a45d84d087b',
--     'cb0276e6-b78c-46f3-b8f4-9d64e09d2c9e', '289ff836-e633-40ff-b584-ae6f83de21f9',
--     'a87ffd54-c9d5-417c-80c6-c7fe78fd558f', '05066aa9-fe8a-4024-9fcb-8c4aca3a407a',
--     '10f5a311-2d17-4bd8-a9a4-6d8b605e96b4', '642ae1f5-4a72-4f6f-8f22-b2defe1979fa',
--     'd26419ce-315c-4a00-b8a8-20b5269757b6', '711b301d-2b8c-4adc-a896-fb36863c48b9',
--     '38664dcc-9df5-4d99-a3b3-ffa3aaec196d', '6f19b085-6fb6-4f2e-9823-439c14008dca',
--     '1acf5cf1-0370-4c5a-8ff4-d287f397f490', '0a7d8c97-6053-497f-9158-7a2cb47beb4f',
--     '82f23bd6-2596-43d6-a4da-30567743857e', '6c6beba4-6615-4dda-be5f-d842ba08a0ce',
--     '336c2cf7-899a-45d0-9eb7-029d2a747add', 'bed67cda-8500-4886-addf-9950c2b9a926',
--     'feb43f06-9599-49bd-9748-6fc48850ee77', '4caceca3-68a6-4f1c-a47c-0aa6e3378b9a',
--     'cfc944af-944c-468f-9397-6e8655f2c9f4', '0413d730-2d6e-45ce-8230-497cd362a05c',
--     'c46fd6f9-6e6a-4559-b53d-f646306488d4', '4def8c6e-d829-4faa-bbcf-8de087186056',
--     'cc1078df-ae56-4d39-87c3-a2995f1c66bf', '859f71ab-8df0-490b-b3c0-4ef63333dfca',
--     'f9238128-1046-474b-8953-06ffa6c7e2d1', '8a67d81f-1b52-4c12-89b3-6c9cb562fd2a',
--     '923e0d57-009c-452e-8e00-5c314c39f74b', '2e927475-deb7-4019-8415-000e0f60d08c',
--     '0957d2ab-f495-410c-ae13-107e50a83143', 'e9f70da1-369f-461a-ad36-e936605d4f51',
--     '7e6f4bcd-b8e6-4086-a173-e31928d2b518', '4a76686f-e05a-495f-b346-0d27b1c56eac',
--     '6227f30c-9c8a-4fe7-a061-44939943105d', 'ba980c9a-6bb6-44f3-b849-a306c14b273f',
--     '51cbd128-a2e2-49d7-9b21-ccb7ba78338c', 'ee951379-ea60-48c3-b9a0-cb269d9cf3c4',
--     '4cecbbe5-765e-4ef5-b5b5-46dba85ae2ee', 'adcf51db-f2f6-416a-8b55-8ad1d7256c03',
--     '210cd038-d99d-48e1-890e-ace4e1a2a204', '428a5e35-e3eb-4c22-89fe-de41029b5844',
--     'd5687333-0d18-41a7-a809-7634e8d9e2a0', '18e5e87b-c7bd-48bf-8284-a595e5d681f7',
--     'e522c1d2-78ff-441f-9234-897f5125433e'
-- );
-- ==============================================================================
