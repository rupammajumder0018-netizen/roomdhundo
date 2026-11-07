# Roomdhundo — Supabase Integration & Service Layer Report
**Phase 3 Implementation Report**

**Engineer:** Senior React & Supabase Integration Engineer  
**Branch:** `migration/react-vite`  
**Date:** 2026-11-07  
**Status:** ✅ Complete — Verified & Tested  

---

## 1. Executive Summary

In Phase 3 of the Roomdhundo migration, we audited, modernized, and established the centralized Supabase integration layer for the React + Vite application. 

Key achievements:
1. **Audited All 9 Legacy Supabase Client Initializations:** Identified multi-client proliferation, verified options, and mapped all database, RPC, realtime, and storage operations.
2. **Centralized Supabase Client Singleton:** Implemented and hardened `src/services/supabase/client.js` with session persistence, automatic token refreshes, safe unconfigured state handling, and zero hardcoded credentials.
3. **Database Compatibility Audit & Schema Reconciliation:** Reconciled discrepancies between `schema.sql`, subsequent migration scripts (`agent-applications.sql`, `hotel-listing-fields.sql`, `add room images.sql`), and active JavaScript queries across 10 tables.
4. **Resolved Unknown Column Stripping Loop:** Audited the legacy `supabaseMutateWithoutUnknownColumns` helper, identified its risk of silent data loss, and ported a modernized helper (`src/services/supabase/mutationHelpers.js`) that enforces data integrity by default.
5. **Storage Architecture Verified:** Verified single-bucket operations (`property-images`), 5MB image / 50MB video upload limits, path generation algorithms, and confirmed that zero file deletion logic existed in the legacy codebase.
6. **Domain-Driven Service Layer:** Established initial service modules in `src/services/` (`properties`, `bookings`, `enquiries`, `storage`, and `supabase`) without mock data or premature feature logic.
7. **Automated Testing Suite:** Implemented 9 automated ESM unit tests via Node.js native test runner (`node:test`) — 100% passing.
8. **Production Build Verified:** Confirmed clean Vite production bundling (`npm run build`).

---

## 2. Centralized Client Architecture

### 2.1 File Location & Implementation
**Path:** `src/services/supabase/client.js`

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  "";

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) ||
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[Roomdhundo] Supabase environment variables are missing.\n" +
      "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.\n" +
      "Database and storage operations will be unavailable until these are set."
  );
}

// Single instance of Supabase client across the application
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "[Roomdhundo] Supabase client is not initialized. " +
        "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in .env.local."
    );
  }
  return supabase;
}

export default supabase;
```

### 2.2 Guarantees & Features
- **Strict Singleton:** Exactly one client is initialized per browser session.
- **Environment Isolation:** Credentials read via `import.meta.env` (Vite) with seamless `process.env` fallback for automated Node.js test runs.
- **Zero Exposure:** Anon public key only; service-role keys are never referenced or imported.
- **Non-Crashing Missing Config State:** When variables are absent, `isSupabaseConfigured` is `false`, `supabase` is `null`, and a clear diagnostic warning is emitted. Service calls return predictable errors rather than crashing on null dereference.
- **SDK v2 Compatibility:** Leverages `@supabase/supabase-js` v2 with browser-native session persistence and token refresh lifecycle management.

---

## 3. Environment Configuration Audit

| Verification Item | Status | Finding |
|-------------------|--------|---------|
| `.env.example` | Verified | Contains empty templates for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| `.gitignore` | Verified | Explicitly ignores `.env`, `.env.local`, and `.env.*.local`. |
| Secret Leak Check | Verified | No `.env.local` exists in the repository. Git tracking status is clean. |
| Production Build Injection | Verified | Vite inlines environment variables safely during build time without bundling unreferenced secrets. |

---

## 4. Legacy Client Findings

A comprehensive scan across all JavaScript files in `files6.0/` identified 9 separate client instantiation sites:

| Legacy File | Line | Initialization Pattern | Issues Identified |
|-------------|------|------------------------|-------------------|
| `files6.0/script.js` | 9 | `window.supabase.createClient(URL, KEY)` | Assigned to `window.supabaseClient`. |
| `files6.0/admin.js` | 34 | `window.supabase.createClient(URL, KEY)` | Fresh instance; ignores `window.supabaseClient`. |
| `files6.0/agents-admin.js` | 6 | `supabaseClient || createClient(URL, KEY)` | Conditional reuse. |
| `files6.0/hotel-booking.js` | 4 | `supabaseClient || createClient(URL, KEY)` | Conditional reuse. |
| `files6.0/hotel-bookings-admin.js` | 6 | `supabaseClient || createClient(URL, KEY)` | Conditional reuse. |
| `files6.0/hotel-bookings-owner.js` | 4 | `window.supabase.createClient(URL, KEY)` | Unconditional new instance; state desync risk. |
| `files6.0/hotel-bookings-user.js` | 2 | `window.supabase.createClient(URL, KEY)` | Unconditional new instance. |
| `files6.0/owner-dashboard.js` | 19 | `window.supabase.createClient(URL, KEY)` | Unconditional new instance. |
| `files6.0/payment.html` | 172 | `window.supabase.createClient(URL, KEY)` | Unconditional new instance in inline script. |

### 4.1 Client Options & Query Patterns
- **Options Passed:** None. All 9 instances called `createClient(URL, KEY)` with default options.
- **RPC Calls:** **Zero** `.rpc()` calls exist across the entire legacy frontend. Database functions (`is_admin()`, `set_updated_at()`, `handle_new_user()`) operate strictly as internal triggers and RLS helpers.
- **Realtime Subscriptions:** **Zero** Supabase realtime channels (`.channel()`, `.on()`, `.subscribe()`) were used. (The only `.on()` calls were Leaflet map event bindings in `property-map.js`).
- **Secondary Consumers:** `agent.js`, `flat-listing.js`, `nearby.js`, `user-dashboard.js`, and `user-enquiries.js` relied on `window.supabaseClient` being available on `window`.

---

## 5. Database Compatibility Audit & Schema Reconciliation

Comparing `files6.0/schema.sql`, subsequent migration scripts (`files6.0/SQL/*`), the Phase 1 audit notes, and active JavaScript queries revealed critical schema characteristics and divergences:

### 5.1 Reconciled Tables & Discrepancies

#### 1. `buildings`
- **Core Columns:** `id`, `name`, `location`, `type`, `description`, `rules`, `facilities`, `facility_tags`, `images`, `videos`, `owner_name`, `owner_phone`, `owner_alt_phone`, `owner_whatsapp`, `owner_verified`, `owner_member_since`, `created_by`, `listing_status`, `verification_status`, `created_at`, `updated_at`.
- **Extended Columns (added by `files6.0/SQL/hotel-listing-fields.sql`):** `hotel_meta`, `latitude`, `longitude`, `owner_email`, `website`.
- **Query Patterns:** Heavy nested querying: `.select("*, room_types(*), reviews(*)")`.

#### 2. `room_types`
- **Core Columns:** `id`, `building_id`, `room_type`, `price_value`, `room_rent`, `room_people`, `available_rooms`, `availability`, `created_at`, `updated_at`.
- **Discrepancy Clarified:** Phase 1 documented `max_guests`; the actual column defined in `schema.sql` (line 355) is `room_people integer not null default 1`.
- **Extended Columns (added by `files6.0/SQL/hotel-listing-fields.sql` & `add room images.sql`):** `hourly_price`, `weekend_price`, `extra_person_charge`, `total_rooms`, `room_size`, `adults`, `children`, `room_details`, `images` (`text[]`).

#### 3. `profiles`
- **Columns:** `id`, `full_name`, `name` (legacy alias), `email`, `role`, `phone`, `created_at`, `updated_at`.
- **Roles:** `user`, `owner`, `admin`, `agent`, `agent_pending` (constrained by `files6.0/SQL/agent-applications.sql`).
- **Fallbacks:** `admin.js` queries `select("id, full_name, email, role, status, created_at")`; `flat-listing.js` queries `full_name, name, phone, role` with fallback to `full_name, name, role` if `phone` is unavailable.

#### 4. `saved_buildings`
- **Columns:** `user_id`, `building_id`, `saved_at`.
- **Behavior:** Fully consistent across SQL and code.

#### 5. `enquiries` — Critical Schema Divergence
- **Divergence:** `files6.0/schema.sql` declared `building_id`, `renter_phone`, `message`, `status`. However, active frontend code (`script.js:4165`, `admin.js:908`, `user-enquiries.js:219`, `owner-dashboard.js:2151`) queries and inserts:
  `user_id`, `owner_id`, `property_id`, `room_type`, `renter_phone`, `message`, `status`.
- **Mitigation:** The React service layer accommodates both `property_id` and `building_id` aliases.

#### 6. `reviews`
- **Columns:** `id`, `building_id`, `user_id`, `reviewer_name`, `rating`, `comment`, `status` (`published`, `pending`, `hidden`), `created_at`.
- **Discrepancy Clarified:** `reviewer_name` is present in `schema.sql` and used by `script.js:4436` and `admin.js:850`, but was omitted from the initial Phase 1 table summary.

#### 7. `agent_applications`
- **Columns (verified from `files6.0/SQL/agent-applications.sql`):** `id`, `user_id`, `first_name`, `last_name`, `phone`, `email`, `location`, `pincode`, `status`, `created_at`, `reviewed_at`, `reviewed_by`.
- **Discrepancy Clarified:** Replaced the legacy assumption (`full_name`, `experience`, `area`) with the actual columns from the migration script.

#### 8. `verification_requests`
- **Status:** Defined in `schema.sql` (with `submitted_by`, not `requested_by`), but **completely unreferenced** in frontend JavaScript. Property verification is handled directly via `buildings.owner_verified` and `buildings.verification_status` by `admin.js`.

#### 9. `hotel_bookings` — Unresolved Backend Dependency
- **Status:** **Not defined in repository SQL files.**
- **Verified Code Columns:** `id`, `building_id`, `room_type_id`, `user_id`, `owner_id`, `guest_name`, `guest_phone`, `guest_count`, `booking_mode` (`hourly` | `nightly`), `check_in`, `check_out`, `hours_count`, `nights_count`, `price_per_unit`, `total_price`, `status`, `owner_note`, `admin_note`, `updated_by`, `created_at`.

#### 10. `economy_deals` — Unresolved Backend Dependency
- **Status:** **Not defined in repository SQL files.**
- **Usage:** Managed by `admin.js:7004–7844` for deal volume and broker commissions (`profit = amount * commission_percent / 100`). `admin.js` explicitly catches error `42P01` (table undefined).

---

## 6. Storage Integration Audit

### 6.1 Bucket Configuration
- **Bucket Name:** `property-images` (Single bucket used across the entire application).
- **Public URL Format:** `${SUPABASE_URL}/storage/v1/object/public/property-images/${path}`

### 6.2 Upload Restrictions & Path Generation
- **Image Size Limit:** 5 MB (`5 * 1024 * 1024` bytes), MIME type `image/*`.
- **Video Size Limit:** 50 MB (`50 * 1024 * 1024` bytes), MIME type `video/*`.
- **Path Structure:** `${userId}/${Date.now()}-${index}-${sanitizedFileName}`
- **Filename Sanitization:** All characters outside `[a-zA-Z0-9._-]` are replaced with `_`.

### 6.3 Deletion Policy Finding
- **Audit Result:** An exhaustive search of all legacy files for storage deletion operations (`storage.from(...).remove(...)`) confirmed that **zero deletion operations existed**.
- **Impact:** In the legacy application, when properties or room photos were deleted or edited, orphaned files remained in the bucket indefinitely. A future maintenance cleanup job should be considered.

---

## 7. Database Helper Migration & Data Integrity Review

### 7.1 Legacy Helper Analysis (`supabaseMutateWithoutUnknownColumns`)
In `files6.0/script.js` (lines 5273–5291), the following loop was used during property insertion:

```javascript
async function supabaseMutateWithoutUnknownColumns(table, mode, payload, applyFilters) {
    let body = cloneSupabasePayload(payload);
    for (let attempt = 0; attempt < 16; attempt++) {
        let query = supabaseClient.from(table)[mode](body);
        if (typeof applyFilters === "function") query = applyFilters(query);
        const result = await query.select();
        if (!result.error) return result;
        const column = unknownColumnFromError(result.error.message);
        if (column) {
            body = stripUnknownColumn(body, column);
            continue;
        }
        return result;
    }
}
```

### 7.2 The Risk: Silent Data Loss
When newer fields (`hotel_meta`, `latitude`, `longitude`, `owner_email`, `website`, room `images`) were sent to a Supabase instance where migrations had not run, this loop **silently stripped the column** and saved the record without warning. Users believed their data was saved, while it was permanently discarded.

### 7.3 Modernized Implementation (`src/services/supabase/mutationHelpers.js`)
We created a hardened replacement:
- **Default Integrity Protection (`allowStripping: false`):** Unknown column errors (`PGRST204` / PostgreSQL column missing) are caught, the missing column is identified, and an explicit error is returned without stripping data.
- **Auditable Fallback Mode (`allowStripping: true`):** If legacy fallback behavior is explicitly requested for transitional environments, a prominent `console.warn` is emitted on every stripped field, and the returned result includes `strippedColumns: string[]` for auditing.

---

## 8. React Service Layer Architecture

Established domain modules in `src/services/` based strictly on verified functionality:

```
src/services/
├── index.js                     # Unified barrel export
├── supabase/
│   ├── client.js                # Centralized singleton client & getters
│   └── mutationHelpers.js       # Safe mutation execution & column detection
├── properties/
│   └── index.js                 # Properties, room types, saved properties, reviews
├── bookings/
│   └── index.js                 # Hotel bookings & status transitions
├── enquiries/
│   └── index.js                 # Tenant enquiries (reconciles property_id/building_id)
└── storage/
    └── index.js                 # Property media uploads & validation
```

All service functions:
- Guard against unconfigured Supabase clients by returning `{ data: null, error }` instead of crashing.
- Do not introduce mock data.
- Do not duplicate legacy business logic prematurely.

---

## 9. Automated Verification & Testing

### 9.1 Unit Test Suite (`node --test`)
Created non-destructive unit tests in `tests/`:
- `tests/supabase-client-init.test.js`
- `tests/supabase-services.test.js`

**Test Execution:**
```
> npm test

TAP version 13
ok 1 - Supabase Client — Initialises singleton when environment variables are supplied
ok 2 - Supabase Client — Missing configuration warning without crash
ok 3 - Supabase Client — Handles unconfigured state safely
ok 4 - Mutation Helpers — Extracts unknown column names and clones payloads
ok 5 - Storage Service — File validation and safe path generation
ok 6 - Properties Service — Exports required functions and returns safe errors without throwing
ok 7 - Bookings Service — Verified function exports and unmigrated table awareness
ok 8 - Enquiries Service — Verified function exports and safe error responses
ok 9 - Services Index — Re-exports all required service domains

1..9
# tests 9 | suites 0 | pass 9 | fail 0 | cancelled 0 | skipped 0
# duration_ms 476ms
```

### 9.2 Production Build Verification
```
> npm run build

vite v5.4.21 building for production...
✓ 90 modules transformed.
dist/index.html                   1.08 kB │ gzip:   0.58 kB
dist/assets/index-DX9Kd4tG.css    2.41 kB │ gzip:   1.03 kB
dist/assets/index-DLQojl2t.js   494.60 kB │ gzip: 143.18 kB
✓ built in 2.92s
```

### 9.3 Live Network Connectivity Disclosure
In accordance with prompt instructions:
- **Real live database network queries were NOT performed** because production Supabase credentials are not committed to source control and must be provided locally by the user in `.env.local`.
- No mock connection results have been invented.
- All service contracts and client initializations were verified using non-destructive offline isolation tests.

---

## 10. Outstanding Backend Dependencies

Before cutover to production:
1. **`hotel_bookings` Migration Script:** An official migration SQL script must be drafted and committed to the repository matching the 19 verified columns.
2. **`economy_deals` Migration Script:** If admin deal tracking is retained in React, `economy_deals.sql` must be drafted and applied.
3. **`enquiries` Schema Normalization:** Decide whether the foreign key should be permanently normalized to `property_id` or `building_id`.

---

## 11. Recommended Next Steps (Phase 4: Auth System Migration)

With the Supabase client and service layer verified and passing tests:
1. **Design `AuthContext` and `useAuth` hook:** Centralized React state listening to `supabase.auth.onAuthStateChange`.
2. **Eliminate Client-Side Role Cache Poisoning:** Remove `localStorage.getItem("roomdhundo_role")` in favor of reactive DB profile role loading.
3. **Deprecate Hardcoded Admin Email:** Migrate admin authorization strictly to database RLS and verified `profiles.role === 'admin'`.
4. **Configure OAuth Redirect Whitelist:** Ensure Supabase dashboard contains `http://localhost:5173/auth/callback` before testing Google Sign-In.

---

*Phase 3 is complete and ready for review. Awaiting approval to proceed to Phase 4 (Auth System Migration).*

