# Live Supabase Security & User Directory Audit Report
**Project:** Roomdhundo (React + Vite + Supabase)  
**Audit Date:** November 16, 2026  
**Mode:** Live Inspection Only (Strict Read-Only)  
**Database Host:** Supabase Managed Postgres  

---

## Executive Summary

A comprehensive, live, read-only security inspection of the Roomdhundo Supabase instance and its React application code was conducted. 

### Critical Highlights & Findings:
1. **Critical Privilege Escalation:** Any authenticated user can elevate their account to `admin` by running `supabase.from('profiles').update({ role: 'admin' })`. The existing RLS policy `"Users can update their own profile"` checks only `(auth.uid() = id)` and lacks column restrictions, while database check constraints allow `'admin'`.
2. **Global Profile Data Leak:** The policy `"Admin read profiles"` on `public.profiles` grants `{authenticated}` users `SELECT` access with `qual: true`. Any logged-in renter or owner can read all user records, emails, full names, and system roles.
3. **Broken Email Registration & 45 Orphan Users:** The `public.handle_new_user()` trigger **does not exist** on `auth.users`. Email signups never insert rows into `public.profiles`. Currently, **45 out of 164 registered users** in `auth.users` have no profile record, permanently locking out email-registered owners and making these users invisible in Admin &rarr; Users.
4. **Public Exposure of Unapproved Properties & Owner Emails:** The policy `"Public can view buildings"` on `public.buildings` has `qual: true`. All 36 buildings in the database (which are all in `pending` status) and their plain-text `owner_email` values are publicly readable by unauthenticated visitors via the Supabase API.
5. **Non-Existent Schema Tables & Columns:** Several tables (`bookings`, `verification_requests`, `property_reports`, `notifications`) referenced in `schema.sql` and `bookings/index.js` **do not exist** in the live database. Furthermore, frontend code queries non-existent columns (`listing_status`, `verification_status` on `buildings`, and `phone`, `updated_at` on `profiles`).
6. **No Owner Approval Enforcement:** No approval field exists on `profiles`. Google-registered owners bypass review and obtain owner privileges immediately. Furthermore, RLS on `buildings` permits any authenticated user to create listings.

---

## Task 1: Live Database Structure, Functions, Triggers & Storage

### 1.1 Tables in Public Schema

Only **10 base tables** exist in the live `public` schema. All 10 have Row Level Security enabled (`rowsecurity = true`).

| Table Name | Row Count | Primary Key | Foreign Keys | Status in Live DB |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | 119 | `id` (uuid) | `id -> auth.users.id` (CASCADE) | Live |
| `public.buildings` | 36 | `id` (uuid) | `created_by -> auth.users.id` | Live (All 36 rows have `status = 'pending'`) |
| `public.room_types` | 65 | `id` (uuid) | `building_id -> buildings.id` | Live |
| `public.hotel_bookings` | 4 | `id` (uuid) | `building_id -> buildings.id`, `room_type_id -> room_types.id`, `user_id -> auth.users.id`, `owner_id -> auth.users.id` | Live |
| `public.enquiries` | 29 | `id` (uuid) | None defined in DB constraints | Live |
| `public.enquiry_stats` | 1 | `id` (int4) | None | Live |
| `public.reviews` | 6 | `id` (uuid) | `building_id -> buildings.id`, `user_id -> auth.users.id` | Live |
| `public.saved_buildings` | 25 | Composite (`user_id`, `building_id`) | `building_id -> buildings.id` | Live |
| `public.economy_deals` | 6 | `id` (uuid) | None | Live |
| `public.agent_applications` | 2 | `id` (uuid) | None defined in DB constraints | Live |

#### Tables Missing from Live Database:
The following tables are referenced in documentation, historical schemas (`database/schemas/schema.sql`), or frontend services, but **DO NOT EXIST** in the live database:
- `public.bookings` (Used in `src/services/bookings/index.js` lines 675, 733; calls fail with `relation "public.bookings" does not exist`)
- `public.verification_requests`
- `public.property_reports`
- `public.notifications`

---

### 1.2 Column Catalog & Schema Details

#### `public.profiles` (5 columns)
- `id` (uuid, NOT NULL, PK -> `auth.users(id)`)
- `full_name` (text, NULL)
- `role` (text, NOT NULL, DEFAULT `'user'`, CHECK: `role IN ('user', 'owner', 'admin', 'agent', 'agent_pending')`)
- `created_at` (timestamptz, DEFAULT `now()`)
- `email` (text, NULL)
*Discrepancy Note:* Columns `phone`, `updated_at`, `status`, `address`, `city`, `pincode`, and `user_type` **do not exist** on `profiles`.

#### `public.buildings` (28 columns)
- `id` (uuid, NOT NULL, PK)
- `name` (text, NOT NULL)
- `location` (text, NOT NULL)
- `distance_km` (numeric, NULL)
- `type` (text, NOT NULL)
- `description` (text, NULL)
- `rules` (jsonb, DEFAULT `'[]'`)
- `facilities` (jsonb, DEFAULT `'[]'`)
- `facility_tags` (jsonb, DEFAULT `'[]'`)
- `images` (jsonb, DEFAULT `'[]'`)
- `videos` (jsonb, DEFAULT `'[]'`)
- `owner_name` (text, NOT NULL)
- `owner_phone` (text, NOT NULL)
- `owner_whatsapp` (text, NULL)
- `owner_alt_phone` (text, NULL)
- `owner_email` (text, NULL) **[PRIVACY RISK: Stored directly in table]**
- `website` (text, NULL)
- `owner_verified` (boolean, DEFAULT `false`)
- `owner_member_since` (text, NULL)
- `created_by` (uuid, NULL -> `auth.users(id)`)
- `created_at` (timestamptz, DEFAULT `now()`)
- `status` (text, NOT NULL, DEFAULT `'pending'`, CHECK: `status IN ('pending', 'approved', 'rejected')`)
- `latitude` (float8, CHECK: `-90 <= latitude <= 90`)
- `longitude` (float8, CHECK: `-180 <= longitude <= 180`)
- `location_accuracy` (float8, NULL)
- `location_source` (text, DEFAULT `'manual'`)
- `location_updated_at` (timestamptz, NULL)
- `hotel_meta` (jsonb, NOT NULL, DEFAULT `'{}'`)
*Discrepancy Note:* Columns `listing_status` and `verification_status` **do not exist** on `buildings`.

#### `public.room_types` (22 columns)
- `id` (uuid, NOT NULL, PK)
- `building_id` (uuid, NULL -> `buildings(id)`)
- `room_type` (text, NOT NULL)
- `price_value` (int4, NOT NULL)
- `daily_price` (int4, NULL)
- `hourly_price` (int4, NULL)
- `weekend_price` (int4, NULL)
- `room_rent` (int4, NOT NULL)
- `room_people` (int4, NOT NULL, DEFAULT 1)
- `available_rooms` (int4, NOT NULL, DEFAULT 1)
- `total_rooms` (int4, NULL)
- `max_guests` (int4, NOT NULL, DEFAULT 2)
- `adults` (int4, NULL)
- `children` (int4, NULL)
- `extra_person_charge` (int4, NULL)
- `room_size` (int4, NULL)
- `room_number` (text, NULL)
- `availability` (text, DEFAULT `'Room available'`)
- `price_period` (text, DEFAULT `'monthly'`)
- `description` (text, NULL)
- `images` (jsonb, NOT NULL, DEFAULT `'[]'`)
- `room_details` (jsonb, NOT NULL, DEFAULT `'{}'`)
- `created_at` (timestamptz, DEFAULT `now()`)
*Discrepancy Note:* No status column exists on `room_types`.

#### `public.hotel_bookings` (19 columns)
- `id` (uuid, NOT NULL, PK)
- `building_id` (uuid, NOT NULL -> `buildings(id)`)
- `room_type_id` (uuid, NOT NULL -> `room_types(id)`)
- `user_id` (uuid, NOT NULL -> `auth.users(id)`)
- `owner_id` (uuid, NOT NULL -> `auth.users(id)`)
- `guest_name` (text, NOT NULL)
- `guest_phone` (text, NOT NULL)
- `guest_count` (int4, NOT NULL, DEFAULT 1, CHECK: `guest_count > 0`)
- `booking_mode` (text, NOT NULL, CHECK: `booking_mode IN ('hourly', 'nightly')`)
- `check_in` (timestamptz, NOT NULL)
- `check_out` (timestamptz, NOT NULL)
- `hours_count` (int4, NULL)
- `nights_count` (int4, NULL)
- `price_per_unit` (int4, NOT NULL, DEFAULT 0, CHECK: `price_per_unit >= 0`)
- `total_price` (int4, NOT NULL, DEFAULT 0, CHECK: `total_price >= 0`)
- `status` (text, NOT NULL, DEFAULT `'pending'`, CHECK: `status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')`)
- `owner_note` (text, NULL)
- `admin_note` (text, NULL)
- `updated_by` (uuid, NULL -> `auth.users(id)`)
- `created_at` (timestamptz, NOT NULL, DEFAULT `now()`)
- `updated_at` (timestamptz, NOT NULL, DEFAULT `now()`)

---

### 1.3 Complete Inventory of Live RLS Policies

All 35 active RLS policies in the live database across `public` and `storage`:

| Table | Policy Name | Command | Roles | USING Expression (qual) | WITH CHECK Expression | Overlap / Security Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `agent_applications` | `agent_applications_admin_all` | ALL | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND lower(p.role) = 'admin')` | Same as USING | Overlaps INSERT and SELECT |
| `agent_applications` | `agent_applications_insert_own` | INSERT | `{authenticated}` | *None* | `(auth.uid() = user_id)` | Multiple permissive INSERT |
| `agent_applications` | `agent_applications_select_approved` | SELECT | `{anon, authenticated}` | `(status = 'approved')` | *None* | Multiple permissive SELECT |
| `agent_applications` | `agent_applications_select_own` | SELECT | `{authenticated}` | `(auth.uid() = user_id)` | *None* | Multiple permissive SELECT |
| `buildings` | `Admins can delete any building` | DELETE | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` | *None* | Overlaps Owner delete |
| `buildings` | `Admins can update buildings` | UPDATE | `{authenticated}` | `(SELECT private.is_admin() AS is_admin)` | `(SELECT private.is_admin() AS is_admin)` | Overlaps Owner update |
| `buildings` | `Admins can view buildings` | SELECT | `{authenticated}` | `(SELECT private.is_admin() AS is_admin)` | *None* | **Redundant:** Superseded by public view |
| `buildings` | `Authenticated users can insert their own building` | INSERT | `{public}` | *None* | `(auth.uid() = created_by)` | **Unrestricted:** Any logged-in user can insert |
| `buildings` | `Owners can delete their own building` | DELETE | `{public}` | `(auth.uid() = created_by)` | *None* | Permissive |
| `buildings` | `Owners can update their own building` | UPDATE | `{public}` | `(auth.uid() = created_by)` | *None* | Permissive |
| `buildings` | `Public can view buildings` | SELECT | `{public}` | `true` | *None* | **CRITICAL:** Exposes all pending properties & `owner_email` |
| `economy_deals` | `Admin manages economy deals` | ALL | `{authenticated}` | `is_admin()` | `is_admin()` | Admin only |
| `enquiries` | `Admin can delete all enquiries` | DELETE | `{authenticated}` | `is_admin()` | *None* | Duplicate of `Admins can delete enquiries` |
| `enquiries` | `Admins can delete enquiries` | DELETE | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` | *None* | Duplicate of `Admin can delete all enquiries` |
| `enquiries` | `Admin can update all enquiries` | UPDATE | `{authenticated}` | `is_admin()` | `is_admin()` | Duplicate of `Admins can update enquiries` |
| `enquiries` | `Admins can update enquiries` | UPDATE | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` | Same as USING | Duplicate of `Admin can update all enquiries` |
| `enquiries` | `Admin can view all enquiries` | SELECT | `{authenticated}` | `is_admin()` | *None* | Multiple permissive SELECT |
| `enquiries` | `Owners can update their enquiries` | UPDATE | `{authenticated}` | `(auth.uid() = owner_id)` | `(auth.uid() = owner_id)` | Permissive |
| `enquiries` | `Owners can view their enquiries` | SELECT | `{authenticated}` | `(auth.uid() = owner_id)` | *None* | Multiple permissive SELECT |
| `enquiries` | `Users can create enquiries` | INSERT | `{authenticated}` | *None* | `(auth.uid() = user_id)` | Permissive |
| `enquiries` | `Users can view their own enquiries` | SELECT | `{authenticated}` | `(auth.uid() = user_id)` | *None* | Multiple permissive SELECT |
| `enquiry_stats` | `Admins can update enquiry stats` | UPDATE | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND lower(profiles.role) = ANY (ARRAY['admin', 'administrator', 'super_admin']))` | Same as USING | Admin only |
| `enquiry_stats` | `Anyone can read enquiry stats` | SELECT | `{authenticated}` | `true` | *None* | Authenticated users only |
| `hotel_bookings` | `Admins can manage all hotel bookings` | ALL | `{authenticated}` | `roomdhundo_is_admin()` | `roomdhundo_is_admin()` | Overlaps other actions |
| `hotel_bookings` | `Guests can create their own hotel bookings` | INSERT | `{authenticated}` | *None* | `(user_id = auth.uid()) AND (status = 'pending') AND EXISTS (b WHERE b.id = building_id AND b.created_by = owner_id AND lower(b.type) = 'hotel') AND EXISTS (rt WHERE rt.id = room_type_id AND rt.building_id = rt.building_id)` | **Bug:** Tautology `rt.building_id = rt.building_id` |
| `hotel_bookings` | `Guests owners and admins can view hotel bookings` | SELECT | `{authenticated}` | `(user_id = auth.uid()) OR (owner_id = auth.uid()) OR roomdhundo_is_admin()` | *None* | Scoped to involved parties |
| `hotel_bookings` | `Owners can respond to hotel bookings` | UPDATE | `{authenticated}` | `(owner_id = auth.uid())` | `(owner_id = auth.uid()) AND (status = ANY (ARRAY['pending', 'confirmed', 'rejected', 'cancelled', 'completed']))` | Permissive |
| `profiles` | `Admin read profiles` | SELECT | `{authenticated}` | `true` | *None* | **CRITICAL LEAK:** Any logged in user reads ALL profiles |
| `profiles` | `Admins can view all profiles` | SELECT | `{authenticated}` | `is_admin()` | *None* | Redundant due to `Admin read profiles` |
| `profiles` | `Admins can view profiles` | SELECT | `{authenticated}` | `(SELECT private.is_admin() AS is_admin)` | *None* | Redundant due to `Admin read profiles` |
| `profiles` | `Users can read their own profile` | SELECT | `{authenticated}` | `(auth.uid() = id)` | *None* | Redundant due to `Admin read profiles` |
| `profiles` | `Users can view their own profile` | SELECT | `{authenticated}` | `(auth.uid() = id)` | *None* | Duplicate of `Users can read their own profile` |
| `profiles` | `Users can create their own profile` | INSERT | `{authenticated}` | *None* | `(auth.uid() = id)` | Duplicate of `Users can insert their own profile` |
| `profiles` | `Users can insert their own profile` | INSERT | `{authenticated}` | *None* | `(auth.uid() = id)` | Duplicate of `Users can create their own profile` |
| `profiles` | `Users can update their own profile` | UPDATE | `{authenticated}` | `(auth.uid() = id)` | `(auth.uid() = id)` | **CRITICAL ESCALATION:** Users can set `role = 'admin'` |
| `profiles` | `Admins can update profiles` | UPDATE | `{authenticated}` | `is_admin()` | `is_admin()` | Overlaps with user update |
| `profiles` | `Admins can delete profiles` | DELETE | `{authenticated}` | `is_admin() AND (id <> auth.uid())` | *None* | Admin delete |
| `reviews` | `Admins can delete any review` | DELETE | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` | *None* | Admin delete |
| `reviews` | `Authenticated users can add a review as themselves` | INSERT | `{public}` | *None* | `(auth.uid() = user_id)` | Permissive |
| `reviews` | `Public can view reviews` | SELECT | `{public}` | `true` | *None* | Public read |
| `room_types` | `Admins can delete any room type` | DELETE | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` | *None* | Admin delete |
| `room_types` | `Admins can update room types` | UPDATE | `{authenticated}` | `(SELECT private.is_admin() AS is_admin)` | `(SELECT private.is_admin() AS is_admin)` | Overlaps Owner update |
| `room_types` | `Admins can view room types` | SELECT | `{authenticated}` | `(SELECT private.is_admin() AS is_admin)` | *None* | Redundant due to public view |
| `room_types` | `Owners can delete room types for their building` | DELETE | `{public}` | `EXISTS (SELECT 1 FROM buildings b WHERE b.id = room_types.building_id AND b.created_by = auth.uid())` | *None* | Owner delete |
| `room_types` | `Owners can insert room types for their building` | INSERT | `{public}` | *None* | `EXISTS (SELECT 1 FROM buildings b WHERE b.id = room_types.building_id AND b.created_by = auth.uid())` | Owner insert |
| `room_types` | `Owners can update room types for their building` | UPDATE | `{public}` | `EXISTS (SELECT 1 FROM buildings b WHERE b.id = room_types.building_id AND b.created_by = auth.uid())` | *None* | Owner update |
| `room_types` | `Public can view room types` | SELECT | `{public}` | `true` | *None* | **EXPOSURE:** Exposes rooms of unpublished buildings |
| `saved_buildings` | `Admins can delete any saved building` | DELETE | `{authenticated}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` | *None* | Admin delete |
| `saved_buildings` | `Users can remove their own saved building` | DELETE | `{public}` | `(auth.uid() = user_id)` | *None* | User delete |
| `saved_buildings` | `Users can save a building as themselves` | INSERT | `{public}` | *None* | `(auth.uid() = user_id)` | User insert |
| `saved_buildings` | `Users can view their own saved buildings` | SELECT | `{public}` | `(auth.uid() = user_id)` | *None* | User select |
| `storage.objects` | `Authenticated users can upload property images` | INSERT | `{public}` | *None* | `(bucket_id = 'property-images' AND auth.role() = 'authenticated')` | **NO User isolation, NO size/mime check** |
| `storage.objects` | `Public read access for property images` | SELECT | `{public}` | `(bucket_id = 'property-images')` | *None* | Public read |

---

### 1.4 Database Functions & Triggers

#### Triggers:
1. `hotel_booking_overlap_guard` on `public.hotel_bookings`:
   - Fires `BEFORE INSERT OR UPDATE`.
   - Executes function `public.prevent_hotel_booking_overlap()`.
2. **Missing Trigger:** There is **NO trigger on `auth.users`**. The trigger `on_auth_user_created` or `handle_new_user()` is completely missing.

#### Functions:
1. `public.is_admin()` (`SECURITY DEFINER`, search_path: `'public'`):
   Checks if `public.profiles` has a row where `id = auth.uid()` and `lower(role) = 'admin'`.
   *Security Warning:* Callable by `anon` role via RPC `/rest/v1/rpc/is_admin`.
2. `private.is_admin()` (`SECURITY DEFINER`, search_path: `''`):
   Checks if `public.profiles` has a row where `id = auth.uid()` and `lower(role) IN ('admin', 'administrator', 'super_admin')`.
3. `public.roomdhundo_is_admin()` (`SECURITY DEFINER`, search_path: `'public'`):
   Checks if `public.profiles` has a row where `id = auth.uid()` and `lower(role) IN ('admin', 'administrator', 'super_admin')`.
   *Security Warning:* Callable by `anon` role via RPC `/rest/v1/rpc/roomdhundo_is_admin`.
4. `public.prevent_hotel_booking_overlap()` (`SECURITY DEFINER`, search_path: `'public'`):
   Validates hotel owner match, room type relation, locks room type row for concurrency control, and blocks double bookings.
   *Security Warning:* Callable by `anon` role via RPC `/rest/v1/rpc/prevent_hotel_booking_overlap`.
5. `public.calculate_distance_km(lat1, lon1, lat2, lon2)` (`IMMUTABLE`):
   Haversine distance calculation in km. Has mutable search path warning.

---

### 1.5 Storage Buckets & Policies

1. **Bucket:** `property-images`
   - `public`: `true`
   - `file_size_limit`: `null` (No database-level size limit enforced)
   - `allowed_mime_types`: `null` (Any file type allowed at database level)
2. **Storage Policies:**
   - Only 2 policies exist on `storage.objects`:
     - `INSERT`: Allows any authenticated user to upload to `property-images`. Does not restrict folder prefix to `auth.uid()`.
     - `SELECT`: Allows public read for `bucket_id = 'property-images'`.
   - **Missing Policies:**
     - **NO `UPDATE` policy:** Users cannot update objects.
     - **NO `DELETE` policy:** Owners and users cannot delete images they uploaded.

---

## Task 2: Complete User Registration & Profile Flow Trace

| Step / Flow | Email Renter | Email Owner | Google Renter | Google Owner |
| :--- | :--- | :--- | :--- | :--- |
| **1. UI Initiation** | `SignupPage.jsx` (role: `"user"`) | `SignupPage.jsx` (role: `"owner"`) | `SignupPage.jsx` (role: `"user"`) | `SignupPage.jsx` (role: `"owner"`) |
| **2. Auth Call** | `signUpWithEmail()` in `services/auth` | `signUpWithEmail()` in `services/auth` | `signInWithGoogle()` via `supabase.auth.signInWithOAuth` | `signInWithGoogle()` via `supabase.auth.signInWithOAuth` |
| **3. Metadata / Session Storage** | `options.data: { role: 'user' }` | `options.data: { role: 'owner' }` | `sessionStorage: roomdhundo_oauth_role = 'user'` | `sessionStorage: roomdhundo_oauth_role = 'owner'` |
| **4. Live DB Trigger** | **Missing** (`handle_new_user` does not exist) | **Missing** (`handle_new_user` does not exist) | **Missing** | **Missing** |
| **5. Client Profile Insertion** | **None** | **None** | `AuthCallback.jsx` calls `upsertUserProfile()` | `AuthCallback.jsx` calls `upsertUserProfile()` |
| **6. Profile Row in `public.profiles`** | **NOT CREATED** (Orphan) | **NOT CREATED** (Orphan) | **CREATED** (`role: 'user'`) | **CREATED** (`role: 'owner'`) |
| **7. First Login Experience** | Profile is `null`, defaults to `user` role | Profile is `null`, role defaults to `user`. **Login fails with role mismatch error!** | Seamless redirect, profile loaded | Seamless redirect, immediate owner access |

### Detailed Flow Analysis:
1. **Email Renter Flow:** User enters email/password. Supabase Auth creates record in `auth.users`. Because `handle_new_user()` does not exist in Postgres and `signUpWithEmail()` does not insert a profile, **no `public.profiles` record is created**. The user becomes an orphan in `auth.users`.
2. **Email Owner Flow (Fatal Bug):** User signs up as owner. No `public.profiles` row is created. On login, `LoginPage.jsx` calls `login()`, which invokes `fetchUserProfile()`, returning `null`. `LoginPage.jsx` lines 53–64 read `accountKindFromRole(result.profile?.role || "user")`, which evaluates to `"user"` (Renter). Because the user selected "As an Owner" on the login screen (`wantedKind = "owner"`), the code triggers `differentEmailRoleMessage("user", "owner")` and signs them out. **Email-registered owners can never log in as owners.**
3. **Google Renter Flow:** User authenticates via Google. Redirected to `/auth/callback`. `AuthCallback.jsx` exchanges code, retrieves role `"user"` from `sessionStorage`, checks `fetchUserProfile()`, finds none, and calls `upsertUserProfile()` with `role: "user"`. Profile is successfully created.
4. **Google Owner Flow:** User authenticates via Google. Redirected to `/auth/callback`. `AuthCallback.jsx` retrieves `"owner"` from `sessionStorage` and calls `upsertUserProfile()` with `role: "owner"`. Profile is created with `role: "owner"`. **Owner approval requirement is completely bypassed.**
5. **SessionStorage Vulnerability:** If a Google user opens the OAuth redirect in a different tab, an incognito session, or clears storage, `sessionStorage.getItem("roomdhundo_oauth_role")` returns `null`, defaulting their role to `"user"`. Their owner intent is silently lost.
6. **Live Data Proof of Failure:**
   - Total rows in `auth.users`: **164**
   - Total rows in `public.profiles`: **119**
   - Total orphan users in `auth.users` without profiles: **45 users (27.4% of all accounts)**

---

## Task 3: Owner Approval Requirements Verification

### Confirmed Requirement:
*Anyone can register directly as an owner, but owner privileges require administrator approval.*

### Findings:
1. **Does an owner approval field exist?**
   - **NO.** In `public.profiles`, the only columns are `id`, `full_name`, `role`, `created_at`, `email`.
   - There is no `owner_approval_status`, `is_approved`, `approval_status`, or `status` column.
2. **Can pending owners create or modify buildings?**
   - **YES.** In the database:
     - Policy `"Authenticated users can insert their own building"` on `buildings` requires only `(auth.uid() = created_by)`. It **does not check role** or approval status.
     - Policy `"Owners can update their own building"` requires only `(auth.uid() = created_by)`.
     - Any authenticated user (even role `'user'`) can create and modify buildings via the Supabase client.
3. **Can pending owners access owner dashboard functionality?**
   - **YES.** Google OAuth sets `role = 'owner'` immediately in `public.profiles`. The frontend route guard `<ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>` checks only `role` and grants full access.
4. **Can existing account status values safely represent owner approval?**
   - **NO.** The live `public.profiles` table has **no account status column**. In historical schema files, `status` had values `'active'`, `'suspended'`, `'blocked'`, which are account lifecycle states, not approval states.
5. **Is a separate `owner_approval_status` field necessary?**
   - **YES.** A dedicated field (e.g. `owner_approval_status` with `'pending' | 'approved' | 'rejected'`, default `'pending'`) or an explicit role (`'owner_pending'`) is necessary.
6. **Can approval and rejection be enforced through database permissions?**
   - **YES.** RLS policies on `buildings` and `room_types` must verify:
     ```sql
     WITH CHECK (
       auth.uid() = created_by AND 
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE id = auth.uid() 
           AND role = 'owner' 
           AND owner_approval_status = 'approved'
       )
     )
     ```

---

## Task 4: Public Listing Visibility & Owner Email Privacy

### Confirmed Requirements:
1. *Only approved AND published buildings should be publicly visible.*
2. *Room types should only be publicly visible when their parent building is approved AND published.*
3. *`owner_email` must only be visible to the respective owner and administrators.*

### Findings:

#### 1. Building Visibility:
- **Database Level:** The active RLS policy `"Public can view buildings"` on `public.buildings` has `qual: true`. It allows anonymous and authenticated users to query all buildings regardless of status.
- **Live Database State:** All **36 buildings** currently stored in `public.buildings` have `status = 'pending'`. Yet every single one is readable via public API.
- **Frontend Level:** In `src/services/properties/index.js`, `isPubliclyListedBuilding(b)` checks `b.listing_status`. However, `listing_status` is not a column on `buildings` (the live column is `status`). Therefore `b.listing_status` is `undefined`, causing `!b.listing_status` to evaluate to `true`. All 36 pending properties are displayed on the public site!

#### 2. Room Types Visibility:
- **Database Level:** The active RLS policy `"Public can view room types"` on `public.room_types` has `qual: true`.
- There is no join to `buildings` verifying that the parent building is approved or published.
- Unapproved and draft room types are completely exposed to public inspection.

#### 3. Owner Email Privacy:
- **Database Level:** `owner_email` is stored as a column directly on `public.buildings`.
- Because Postgres Row Level Security acts on whole rows and not individual columns, the `qual: true` policy exposes `owner_email` to anyone calling `supabase.from('buildings').select('owner_email')`.
- Frontend field exclusion does **not** provide database security; any user can open browser DevTools or curl the PostgREST endpoint to scrape all property owners' email addresses.

---

## Task 5: Admin User Visibility Verification

### Confirmed Requirement:
*Every successfully registered user must appear in Admin &rarr; Users, regardless of auth provider, role, approval status, or listed properties.*

### Findings:
1. **Does the existing implementation meet this requirement?**
   - **NO.**
2. **Root Cause Analysis:**
   - `AdminUsersPage.jsx` calls `fetchAdminProfiles()` in `src/services/admin/adminService.js`.
   - `fetchAdminProfiles()` executes `supabase.from("profiles").select("*")`.
   - As proven in Task 2, **45 registered users** in `auth.users` have no profile in `public.profiles` because the database trigger `handle_new_user()` is missing.
   - Consequently, those 45 users **never appear** in Admin &rarr; Users.
3. **Column Inconsistency in Code:**
   - In `fetchAdminProfiles()`, search queries inspect `p.phone`. In `src/services/auth/index.js`, `fetchUserProfile()` requests columns `phone` and `updated_at`.
   - In the live database, `public.profiles` contains **no `phone` or `updated_at` column**.
4. **Pagination Truncation Risk:**
   - `fetchAdminProfiles()` has no `.range()` or pagination. Supabase PostgREST has a default limit of 1,000 rows. Once user registrations exceed 1,000, unpaginated queries will truncate, hiding newer users.

---

## Severity-Ranked Vulnerability & Issue Catalog

### 🔴 Critical Severity

1. **Privilege Escalation to Admin via Profile Self-Update**
   - **Target:** `public.profiles`, Policy `"Users can update their own profile"`
   - **Details:** The RLS `WITH CHECK` expression is `(auth.uid() = id)` with no column restriction. Any user can call `supabase.from('profiles').update({ role: 'admin' }).eq('id', auth.uid())` and become a system administrator immediately.
2. **Mass Profile Data Leakage to Any Logged-In User**
   - **Target:** `public.profiles`, Policy `"Admin read profiles"`
   - **Details:** Despite its name, this policy applies to `{authenticated}` with `qual: true`. Any logged-in renter can query `supabase.from('profiles').select('*')` to harvest all user IDs, names, emails, and roles.
3. **Missing `handle_new_user()` Trigger & 45 Orphan Accounts**
   - **Target:** `auth.users`, `public.profiles`, `SignupPage.jsx`
   - **Details:** No trigger synchronizes `auth.users` to `public.profiles`. Email signup leaves 45 accounts orphaned, locks out email owners, and hides registered users from Admin &rarr; Users.
4. **Public Exposure of Pending Buildings & Owner Emails**
   - **Target:** `public.buildings`, Policy `"Public can view buildings"`
   - **Details:** `qual: true` exposes 36 unapproved properties and plain-text `owner_email` to unauthenticated web crawlers and attackers.

---

### 🟠 High Severity

5. **Unrestricted Building Creation by Any Authenticated User**
   - **Target:** `public.buildings`, Policy `"Authenticated users can insert their own building"`
   - **Details:** `WITH CHECK` checks only `(auth.uid() = created_by)`. Renters with role `'user'` can insert buildings.
6. **Owner Approval Workflow Missing in Database & Frontend**
   - **Target:** `public.profiles`, `OwnerDashboardPage.jsx`, `ListingHubPage.jsx`
   - **Details:** No approval status column exists. Google signup directly sets `role = 'owner'`, giving instant owner dashboard and listing rights without admin moderation.
7. **Unrestricted Public Room Types Exposure**
   - **Target:** `public.room_types`, Policy `"Public can view room types"`
   - **Details:** `qual: true` exposes room types belonging to unapproved, pending, or archived buildings.
8. **Missing Base Tables Causing Service Failures**
   - **Target:** `public.bookings`, `src/services/bookings/index.js`
   - **Details:** Table `bookings` does not exist in live DB, breaking reservation and payment calls.
9. **Schema Mismatches Breaking Admin Verification**
   - **Target:** `src/services/admin/adminService.js`, `public.buildings`
   - **Details:** Code queries/updates `listing_status` and `verification_status`, but live table only has `status IN ('pending', 'approved', 'rejected')`. Admin property updates fail.

---

### 🟡 Medium Severity

10. **Unchecked Media Uploads & Missing Delete/Update Policies in Storage**
    - **Target:** `storage.buckets`, `storage.objects`
    - **Details:** Bucket `property-images` has `file_size_limit: null` and `allowed_mime_types: null`. Policy allows any authenticated user to upload any file size/type anywhere in the bucket. No `DELETE` or `UPDATE` policies exist.
11. **Tautological Check in Hotel Bookings Policy**
    - **Target:** `public.hotel_bookings`, Policy `"Guests can create their own hotel bookings"`
    - **Details:** Policy condition contains `(rt.building_id = rt.building_id)`. While mitigated by a trigger, the policy rule itself is flawed.
12. **Publicly Executable `SECURITY DEFINER` Functions**
    - **Target:** `public.is_admin()`, `public.roomdhundo_is_admin()`, `public.prevent_hotel_booking_overlap()`
    - **Details:** Supabase linter flagged that `anon` role has `EXECUTE` privileges on these functions via RPC endpoints.
13. **18 Redundant & Conflicting Permissive Policies**
    - **Target:** `profiles`, `buildings`, `room_types`, `enquiries`, `hotel_bookings`, `agent_applications`
    - **Details:** Multiple permissive policies for the same role and action degrade query performance and complicate policy auditing.

---

### 🔵 Low Severity

14. **Lack of Server-Side Pagination in Admin Profiles**
    - **Target:** `src/services/admin/adminService.js` (`fetchAdminProfiles`)
    - **Details:** Unpaginated queries will truncate at 1,000 rows under default PostgREST configuration.
15. **Unindexed Foreign Keys on Multiple Tables**
    - **Target:** `buildings(created_by)`, `room_types(building_id)`, `reviews(building_id)`, `reviews(user_id)`, `saved_buildings(building_id)`, `hotel_bookings(updated_by)`
    - **Details:** Supabase performance linter reported unindexed foreign keys impacting join performance.
16. **Mutable Search Path on `public.calculate_distance_km`**
    - **Target:** `public.calculate_distance_km`
    - **Details:** Function search path is not pinned to `''` or `'public'`.

---

## Recommended Architecture & Remediation Plan

*(All changes are recommendations for future implementation. In accordance with strict audit rules, no changes have been applied).*

### 1. Database Security & Profile Fixes
1. **Drop Insecure Profile Policies & Prevent Privilege Escalation:**
   - Drop policy `"Admin read profiles"`.
   - Update policy `"Users can update their own profile"` to prevent changing `role` (or create a trigger that raises an exception if `OLD.role IS DISTINCT FROM NEW.role` when `auth.uid() != admin`).
2. **Add Missing Profile Columns:**
   - Alter `public.profiles` to add:
     - `owner_approval_status text not null default 'pending' check (owner_approval_status in ('pending', 'approved', 'rejected'))`
     - `phone text`
     - `updated_at timestamptz default now()`
3. **Deploy `handle_new_user()` Trigger on `auth.users`:**
   - Create a `SECURITY DEFINER` function that reads `raw_user_meta_data` (`full_name`, `role`).
   - If `role = 'owner'`, set `role = 'owner'` and `owner_approval_status = 'pending'`.
   - Attach trigger `AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`.
4. **Backfill 45 Orphan Users:**
   - Execute an idempotent `INSERT INTO public.profiles (id, email, full_name, role) SELECT id, email, raw_user_meta_data->>'full_name', coalesce(raw_user_meta_data->>'role', 'user') FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);`.

### 2. Listing Visibility & Owner Email Privacy Fixes
1. **Enforce Building Approval in RLS:**
   - Replace `"Public can view buildings"` with:
     ```sql
     CREATE POLICY "Public can view approved buildings"
     ON public.buildings FOR SELECT TO public
     USING (status = 'approved');
     ```
   - Keep admin policy to view all buildings, and owner policy to view own buildings: `(auth.uid() = created_by)`.
2. **Enforce Room Type Visibility Based on Parent Building:**
   - Replace `"Public can view room types"` with:
     ```sql
     CREATE POLICY "Public can view room types for approved buildings"
     ON public.room_types FOR SELECT TO public
     USING (
       EXISTS (
         SELECT 1 FROM public.buildings b
         WHERE b.id = room_types.building_id
           AND (b.status = 'approved' OR b.created_by = (select auth.uid()) OR (select private.is_admin()))
       )
     );
     ```
3. **Protect `owner_email`:**
   - Remove `owner_email` from public client queries, or create a public secure view `public.v_buildings` that excludes `owner_email` and grant public access only to the view.
   - Alternatively, execute:
     ```sql
     REVOKE SELECT (owner_email) ON public.buildings FROM anon, authenticated;
     ```
     and provide a restricted RPC for verified booking inquiries.

### 3. Owner Listing Permissions & Route Protection
1. **Restrict Building Creation to Approved Owners:**
   - Update `"Authenticated users can insert their own building"`:
     ```sql
     WITH CHECK (
       auth.uid() = created_by AND (
         EXISTS (
           SELECT 1 FROM public.profiles p
           WHERE p.id = auth.uid()
             AND p.role = 'owner'
             AND p.owner_approval_status = 'approved'
         ) OR (SELECT private.is_admin())
       )
     )
     ```
2. **Update Frontend Route Guards:**
   - In `ProtectedRoute.jsx`, check both `role === 'owner'` AND `profile?.owner_approval_status === 'approved'`. If pending, redirect to an "Approval Pending" informational view.

### 4. Storage Bucket Hardening
1. Configure `property-images` bucket:
   - Set `file_size_limit = 5242880` (5MB).
   - Set `allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']`.
2. Add Storage RLS Policies:
   - Enforce folder ownership on upload: `((bucket_id = 'property-images') AND (auth.uid()::text = (storage.foldername(name))[1]))`.
   - Add `DELETE` and `UPDATE` policies permitting users to manage files in their own folder: `((bucket_id = 'property-images') AND (auth.uid()::text = (storage.foldername(name))[1]))`.

### 5. Application Code Alignments
1. In `src/services/admin/adminService.js`:
   - Change `listing_status` and `verification_status` to `status` across property fetch and update queries.
   - Add pagination (`.range(from, to)`) to `fetchAdminProfiles()`.
2. In `src/services/auth/index.js`:
   - Remove non-existent column selections (`phone`, `updated_at`) from `fetchUserProfile()` until columns are added to Postgres.
3. In `src/services/bookings/index.js`:
   - Either create the `bookings` table in Supabase or guard booking queries with graceful fallbacks.

---

## Items That Could Not Be Verified

1. **Third-Party Email Delivery / SMTP:** Whether confirmation emails are actually delivered to end users depends on Supabase external SMTP settings, which are not inspectable via SQL.
2. **Google OAuth Client Credentials:** Google Cloud Console OAuth 2.0 Client ID and Client Secret are stored encrypted inside Supabase Auth backend and cannot be verified via SQL.
3. **Razorpay Gateway Live Keys:** Backend webhook endpoints or payment keys for room bookings could not be verified in database tables.

---

## Final Audit Verdicts

| Area | Status / Verdict | Summary |
| :--- | :--- | :--- |
| **Database Schema Alignment** | **Missing and requires implementation** | 4 tables missing (`bookings`, `verification_requests`, `property_reports`, `notifications`); multiple column mismatches (`phone`, `listing_status`). |
| **Profile Creation & Sync Trigger** | **Missing and requires implementation** | Trigger `handle_new_user()` does not exist; 45 orphan users in `auth.users`. |
| **Admin User Directory Completeness** | **Missing and requires implementation** | 45 registered users completely invisible in Admin Users due to missing profiles; lacks server-side pagination. |
| **Owner Approval Requirement** | **Missing and requires implementation** | No approval field exists; Google signup grants immediate access; database RLS allows any user to create buildings. |
| **Public Listing Visibility** | **Missing and requires implementation** | Database policy allows public read of all pending properties (`qual: true`); frontend filter fails due to column name mismatch. |
| **Owner Email Privacy** | **Missing and requires implementation** | Plain-text `owner_email` exposed to public internet via `public.buildings` SELECT policy. |
| **Storage Security & Image Access** | **Partially implemented** | Upload and read work, but lacks bucket-level size/MIME constraints, user-folder isolation, and DELETE/UPDATE policies. |
| **Hotel Bookings Flow & Guards** | **Partially implemented** | Trigger `prevent_hotel_booking_overlap` works well; RLS insert policy contains tautology bug; general room `bookings` table is missing. |
| **Profile RLS Security (Role Integrity)** | **Critical Vulnerability** | Logged-in users can escalate to `admin` and view all profiles. |

---
*Report generated and consolidated into `LIVE_SUPABASE_SECURITY_AUDIT.md`.*
