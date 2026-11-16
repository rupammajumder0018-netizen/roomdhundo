# Roomdhundo — Phase 12: Schema Compatibility & Alignment Report

**Document:** `PHASE_12_SCHEMA_COMPATIBILITY_REPORT.md`  
**Status:** Comprehensive Technical Review  
**Date:** November 16, 2026  
**Context:** Documents differences between Live Database, Historical Schema (`schema.sql`), and Frontend Services  

---

## 1. Overview & Purpose

During the live security audit (`LIVE_SUPABASE_SECURITY_AUDIT.md`), significant divergence was identified between:
1. The **Live Supabase Database** (10 tables, active production dataset).
2. The **Historical Specification** (`database/schemas/schema.sql` and `files6.0/schema.sql`).
3. The **Frontend React Application Services** (`src/services/*`).

This report provides an exhaustive, field-by-field audit of schema divergence, evaluates the four missing tables, details the dual-status listing architecture, and establishes minimum compatible changes required to restore 100% operational integrity without destructive database operations.

---

## 2. Table-by-Table Divergence Analysis

| Table Name | Live Database Status | `schema.sql` Definition | Frontend Code Usage | Compatibility Assessment |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | **119 rows**, 5 columns (`id`, `full_name`, `role`, `created_at`, `email`) | 12 columns (includes `phone`, `status`, `user_type`, `address`, `city`, `pincode`, `updated_at`) | Queries `phone`, `updated_at`, `role`, `full_name`, `email` | **Partial Mismatch:** `phone` and `updated_at` must be added to live DB to prevent PostgREST column errors. `owner_approval_status` must be added for owner workflow. |
| `public.buildings` | **36 rows**, 28 columns (includes `status` with check `'pending','approved','rejected'`) | Defines `verification_status` and `listing_status` | Queries and mutates `listing_status` and `verification_status` | **Critical Mismatch:** Live DB uses `status`. Frontend expects `listing_status`. Adding `listing_status` resolves the mismatch. |
| `public.room_types` | **65 rows**, 22 columns | 22 columns | Queries all columns; updates room rent, availability, images | **Aligned:** Schema matches live database. Needs RLS policy alignment to parent building status. |
| `public.hotel_bookings` | **4 rows**, 19 columns | Defined in runtime schema | `src/services/bookings/index.js` manages hotel stay reservations | **Aligned:** Table is healthy. RLS guest insert tautology bug (`rt.building_id = rt.building_id`) must be fixed. |
| `public.bookings` | **DOES NOT EXIST** | Lines 1450–1512 in `files6.0/schema.sql` | `src/services/bookings/index.js` lines 675 & 733 query this table | **Missing Table:** Generic booking workflow. As payment gateways are postponed, calls to this table must be cleanly handled/deferred. |
| `public.agent_applications` | **2 rows**, 12 columns | 12 columns | `src/services/admin/adminService.js` and `BeAnAgentPage.jsx` | **Aligned:** Healthy schema. Needs public PII protection for applicant phone/email. |
| `public.enquiries` | **29 rows**, 10 columns | 10 columns | `src/services/enquiries/index.js` and `ContactOwnerModal.jsx` | **Aligned:** Schema matches. Needs cleanup of duplicate admin RLS policies. |
| `public.enquiry_stats` | **1 row**, 7 columns | 7 columns | Admin dashboard analytics | **Aligned:** Healthy. |
| `public.reviews` | **6 rows**, 7 columns | 7 columns | `src/services/properties/index.js` and `AdminReviewsPage.jsx` | **Aligned:** Healthy. |
| `public.saved_buildings` | **25 rows**, 3 columns | 3 columns | `SavedPropertiesPage.jsx` | **Aligned:** Healthy. |
| `public.economy_deals` | **6 rows**, 9 columns | 9 columns | `AdminEconomyPage.jsx` | **Aligned:** Healthy. |
| `public.verification_requests` | **DOES NOT EXIST** | Planned in `schema.sql` | None in active frontend (handled via `buildings.status`) | **Not Needed:** Redundant table; moderation is performed directly on `buildings`. |
| `public.property_reports` | **DOES NOT EXIST** | Planned in `schema.sql` | None in active frontend | **Deferred:** Future moderation feature. |
| `public.notifications` | **DOES NOT EXIST** | Planned in `schema.sql` | None in active frontend | **Deferred:** In-app notification center is scheduled for future phase. |

---

## 3. Deep Dive on Missing Tables

### 3.1 `public.bookings` (General Booking & Reservation System)
- **Background:** The legacy codebase (`files6.0/payment.html` and `files6.0/schema.sql`) contained a proposed `bookings` table intended for online room reservations with advance rent deposits and platform fees (10%).
- **Current Live State:** This table was **never created** in the live database. Instead, only `public.hotel_bookings` was provisioned.
- **Frontend Impact:** In `src/services/bookings/index.js`:
  - `fetchUserBookings()` queries `.from("bookings")` (line 675).
  - `createRoomReservationBooking()` inserts into `.from("bookings")` (line 733).
  - Both operations fail with: `relation "public.bookings" does not exist`.
- **Architectural Decision:**
  - **Payment Gateway Integration is Postponed:** Per Phase 12 requirements, Razorpay, payment gateways, webhooks, and payment Edge Functions must NOT be introduced at this time.
  - **Resolution:**
    1. Do not create a half-configured `bookings` table with dummy payment columns.
    2. In `src/services/bookings/index.js`, update `fetchUserBookings()` to query `hotel_bookings` (which represents actual live guest bookings) and guard `createRoomReservationBooking()` to return a descriptive notice: *"Direct room reservations with advance payment are currently scheduled for Phase 13. Please use the 'Contact Owner' enquiry button to arrange your stay directly."*
    3. This preserves the operational hotel booking system and eliminates runtime errors on user dashboards.

---

### 3.2 `public.verification_requests`
- **Background:** `database/schemas/schema.sql` proposed a `verification_requests` table to allow owners to submit identity documents for physical property verification badges.
- **Current Live State:** The table does not exist.
- **Evaluation:**
  - Property moderation in Roomdhundo is already executed directly on `public.buildings.status` (`pending`, `approved`, `rejected`) and `public.buildings.owner_verified` (`boolean`).
  - Creating a separate `verification_requests` table is redundant and would create synchronization overhead.
  - **Recommendation:** Do not create this table. Continue managing property verification directly on `buildings`.

---

### 3.3 `public.property_reports` & `public.notifications`
- **Background:** Proposed tables for user reporting of spam/inaccurate listings and in-app system notifications.
- **Current Live State:** Neither table exists.
- **Frontend Inspection:** The current React application does not contain components or routes that query `property_reports` or `notifications`.
- **Recommendation:** Do not provision these tables in Phase 12. Defer their creation to dedicated feature phases (User Notifications & Platform Moderation) to keep the database lean and secure.

---

## 4. Column Mismatches & Technical Resolutions

### 4.1 Property Moderation & Publication Columns
In `public.buildings`, the live column is:
- `status`: text, check constraint `('pending', 'approved', 'rejected')`, default `'pending'`.

However, the frontend codebase was written expecting two distinct lifecycle properties:
1. **Admin Verification Status:** Moderated by administrators (`pending` &rarr; `approved` / `rejected`).
2. **Owner Publication Status:** Controlled by property owners (`published`, `draft`, `archived`).

```
                    ┌────────────────────────────┐
                    │   Admin Verification       │
                    │   (buildings.status)       │
                    └─────────────┬──────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
            ['approved']                    ['pending' / 'rejected']
                  │                               │
        ┌─────────┴─────────┐                     │
        ▼                   ▼                     ▼
['published']          ['draft' / 'archived']     │
        │                   │                     │
        ▼                   ▼                     ▼
 🌐 PUBLIC VISIBLE     🔒 OWNER ONLY         🔒 OWNER & ADMIN ONLY
```

#### Technical Solution:
- In `PHASE_12_SECURITY_REMEDIATION.sql`:
  ```sql
  ALTER TABLE public.buildings
      ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'published'
      CHECK (listing_status IN ('draft', 'pending', 'published', 'archived'));
  ```
- **Public Visibility Rule:** A building is publicly visible if and only if:
  `buildings.status = 'approved' AND buildings.listing_status = 'published'`
- **Frontend Code Compatibility:**
  - In `src/services/admin/adminService.js`:
    - `fetchAdminDashboardStats`: queries `status, listing_status`.
    - `updatePropertyVerificationStatus`: updates `status: action` (where action is `'approved'` or `'rejected'`).
  - In `src/services/properties/index.js`:
    - `fetchPublishedProperties`: filters `.eq("status", "approved").eq("listing_status", "published")`.
  - In `src/services/owner/index.js`:
    - `createListing`: inserts `{ status: 'pending', listing_status: 'published' }`.

---

### 4.2 User Profile Columns (`phone` and `updated_at`)
- **The Issue:**
  - `src/services/auth/index.js` (line 86) queries:
    `.select("id, full_name, email, role, phone, created_at, updated_at")`
  - In the live database, `public.profiles` has only `id, full_name, role, created_at, email`.
  - In PostgREST, requesting non-existent columns returns HTTP 400 with `column profiles.phone does not exist`, causing `fetchUserProfile()` to fail and return `null`.
- **Technical Solution:**
  - In `PHASE_12_SECURITY_REMEDIATION.sql`:
    ```sql
    ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS phone text,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
        ADD COLUMN IF NOT EXISTS owner_approval_status text DEFAULT 'pending'
        CHECK (owner_approval_status IS NULL OR owner_approval_status IN ('pending', 'approved', 'rejected'));
    ```
  - This immediately satisfies `fetchUserProfile()`, `AdminUserTable.jsx`, and `UserProfileSection.jsx` without requiring breaking changes to caller code.

---

## 5. Frontend Service Audit & Minimum Compatible Changes

### 5.1 `src/services/admin/adminService.js`
- **Current Issues:**
  1. Line 84 selects nonexistent `listing_status, verification_status`.
  2. Lines 220–226 update `listing_status, verification_status`.
  3. `fetchAdminProfiles()` lacks server-side pagination and count extraction.
- **Minimum Compatible Fixes:**
  - Align property queries to use live `status` column for admin moderation and newly added `listing_status` for owner publication.
  - Implement server-side range queries (`.range(from, to)`) in `fetchAdminProfiles()`.

### 5.2 `src/services/auth/index.js`
- **Current Issues:**
  1. Relies on nonexistent `handle_new_user()` trigger for email signups.
  2. Selects `phone, updated_at` before they are added to Postgres.
- **Minimum Compatible Fixes:**
  - The SQL migration deploys `handle_new_user()` on `auth.users`, automatically creating profiles on signup.
  - Profile selection includes `owner_approval_status`.

### 5.3 `src/services/properties/index.js`
- **Current Issues:**
  1. `fetchPublishedProperties()` requests all properties without server-side approval filtering, relying on client-side `isPubliclyListedBuilding(b)` which fails because `b.listing_status` is undefined.
- **Minimum Compatible Fixes:**
  - Add `.eq("status", "approved").eq("listing_status", "published")` to the Supabase query.
  - Update `isPubliclyListedBuilding(b)` to check both fields.

### 5.4 `src/services/owner/index.js`
- **Current Issues:**
  1. Lines 392–393 insert `listing_status` and `verification_status` into `buildings`.
- **Minimum Compatible Fixes:**
  - Set `status: "pending"` and `listing_status: "published"`.
  - Store owner contact info in `public.building_owner_contacts`.

### 5.5 `src/services/bookings/index.js`
- **Current Issues:**
  1. Queries nonexistent `bookings` table.
- **Minimum Compatible Fixes:**
  - Direct `fetchUserBookings()` to retrieve live `hotel_bookings`.
  - Guard `createRoomReservationBooking()` with an informative notice that payment-enabled direct bookings are scheduled for a future phase.

---

## 6. Backward Compatibility Verification Matrix

| Component / Flow | Before Remediation | After Remediation | Risk of Regression |
| :--- | :--- | :--- | :--- |
| **Existing 119 Profiles** | At risk of role tampering & global read | Protected by trigger; private read only | **Zero:** IDs and roles preserved |
| **Existing 1 Admin Account** | Exposed to user elevation | Role protected; admin policies intact | **Zero:** Account retained |
| **Existing 36 Buildings** | All in `pending` status; exposed to public | Protected: only approved listings public | **Zero:** Existing rows preserved |
| **Existing 4 Hotel Bookings** | Subject to tautology RLS check | Tautology fixed; overlap guard active | **Zero:** Existing records intact |
| **Existing Property Images** | Unchecked upload; no delete | Isolated to user folder; delete enabled | **Zero:** Public URLs preserved |
| **Email User Signup** | Broken: orphan accounts created | Automated: profile created on signup | **Fixed:** 100% flow restored |
| **Email Owner Login** | Broken: role mismatch lockout | Automated: profile created with pending | **Fixed:** 100% flow restored |
| **Admin &rarr; Users Directory** | Missing 45 users; unpaginated | Complete: all 164 users visible with paging | **Fixed:** 100% completeness |

---
*End of Compatibility Report.*
