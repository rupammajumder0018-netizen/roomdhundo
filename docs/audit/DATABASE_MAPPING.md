# Database Mapping — Roomdhundo

> **Source:** `files6.0/schema.sql`, `files6.0/SQL/agent-applications.sql`, `files6.0/SQL/hotel-listing-fields.sql`, `files6.0/SQL/add room images.sql`, plus JavaScript verification (`files6.0/script.js`, `admin.js`, `hotel-booking.js`, `hotel-bookings-*.js`, `agent.js`, `owner-dashboard.js`, `user-enquiries.js`)  
> **Supabase Project:** `vyusxdilgwrcgmqqvzsp` (from public URL — not a secret)  
> **Status:** Verified and reconciled across SQL files and JavaScript client operations (Phase 3 Audit)

---

## 1. Database Tables

### `public.profiles`
User account profile linked to Supabase Auth.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | References `auth.users(id)` |
| full_name | text | Display name |
| name | text | Legacy alias for full_name |
| email | text | User email |
| role | text | `user`, `owner`, `admin`, `agent`, `agent_pending` |
| phone | text | Optional phone number |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

---

### `public.buildings`
Property listings (all types).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| name | text | Property name |
| location | text | Human-readable location |
| type | text | `PG`, `Room`, `Mess`, `Flat`, `Hotel`, `Guest House` |
| description | text | Full description |
| images | jsonb (stored as array) | Array of image URLs (Supabase Storage bucket `property-images` or external) |
| videos | jsonb (stored as array) | Array of video URLs |
| facilities | jsonb (stored as array) | Facility labels array |
| facility_tags | jsonb (stored as array) | Normalised facility tag slugs |
| rules | jsonb (stored as array) | House rules (also encodes flat/hotel meta as `RD_META:{}` JSON prefix) |
| owner_name | text | Owner display name |
| owner_phone | text | Owner contact number |
| owner_alt_phone | text | Alternative owner contact number |
| owner_whatsapp | text | WhatsApp number |
| owner_verified | boolean | Verification flag (`default false`) |
| owner_member_since | text | Member join year (e.g. "2024") |
| owner_email | text | Owner email (hotel-specific — added by migration) |
| website | text | Hotel website URL (added by migration) |
| created_by | uuid | FK → `auth.users(id)` |
| listing_status | text | `pending`, `published`, `rejected` |
| verification_status | text | Verification workflow state (`pending`, `approved`) |
| latitude | double precision | GPS latitude (added by migration) |
| longitude | double precision | GPS longitude (added by migration) |
| distance_km | numeric | Pre-computed distance from hub (legacy; now computed at runtime) |
| hotel_meta | jsonb | Hotel-specific metadata (star rating, meal plan, policies, check-in/out, gallery) |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

---

### `public.room_types`
Rooms/room categories belonging to a building.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| building_id | uuid FK | → `buildings(id)` ON DELETE CASCADE |
| room_type | text | Room name/label |
| price_value | integer | Monthly rent |
| room_rent | integer | Legacy alias for price_value |
| daily_price | integer | Per-night price |
| hourly_price | integer | Per-hour price (hotel rooms) |
| weekend_price | integer | Weekend premium pricing |
| extra_person_charge | integer | Charge per additional guest |
| available_rooms | integer | Currently available room count |
| total_rooms | integer | Total capacity |
| availability | text | `available`, `occupied`, `unavailable` |
| max_guests | integer | Maximum occupancy |
| adults | integer | Adult capacity |
| children | integer | Children capacity |
| room_size | integer | Room size in sq ft |
| images | text[] | Per-room photo URLs (added by migration) |
| room_details | jsonb | Extended room details (beds, amenities, occupancy options, hourly slots) |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

---

### `public.reviews`
Renter reviews for buildings.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto |
| building_id | uuid FK | → `buildings(id)` ON DELETE CASCADE |
| user_id | uuid FK | → `auth.users(id)` ON DELETE SET NULL |
| reviewer_name | text | Display name of the reviewer |
| rating | integer | 1–5 |
| comment | text | Review text |
| status | text | `published` (default), `pending`, `hidden` |
| created_at | timestamptz | Auto |

---

### `public.saved_buildings`
Renter saved/favourited properties.

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid PK (composite) | → `auth.users(id)` |
| building_id | uuid PK (composite) | → `buildings(id)` |
| saved_at | timestamptz | Auto |

---

### `public.enquiries`
Contact-owner requests from renters.

> **Schema Divergence Note:** `files6.0/schema.sql` defined this table with `building_id`, but all active JavaScript clients (`script.js`, `admin.js`, `user-enquiries.js`, `owner-dashboard.js`) query and insert `property_id` and `owner_id`. Both columns must be supported during migration.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto |
| user_id | uuid FK | Renter → `auth.users(id)` |
| building_id | uuid FK | → `buildings(id)` (as defined in `schema.sql`) |
| property_id | uuid FK | → `buildings(id)` (as actively used by JS code) |
| owner_id | uuid FK | → `auth.users(id)` (property owner, used by JS code) |
| room_type | text | Selected room category label (used by JS code) |
| renter_phone | text | Renter's contact number |
| message | text | Enquiry message |
| status | text | `pending`, `contacted`, `scheduled`, `visited`, `closed`, `cancelled` |
| owner_response | text | Owner's reply text |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

---

### `public.hotel_bookings`
Hotel stay booking requests (created via dynamic migration, verified against JS client usage).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| building_id | uuid FK | → `buildings(id)` |
| room_type_id | uuid FK | → `room_types(id)` |
| user_id | uuid FK | Guest → `auth.users(id)` |
| owner_id | uuid FK | Property owner → `auth.users(id)` |
| guest_name | text | Guest display name |
| guest_phone | text | Contact mobile |
| guest_count | integer | Number of guests (verified code field; not `guests`) |
| booking_mode | text | `nightly` or `hourly` (verified code field; not `stay_type`) |
| check_in | timestamptz | Check-in ISO timestamp |
| check_out | timestamptz | Check-out ISO timestamp |
| hours_count | integer | Number of hours for hourly stay (nullable) |
| nights_count | integer | Number of nights for nightly stay (nullable) |
| price_per_unit | numeric | Rate per night or per hour |
| total_price | numeric | Total booking amount |
| status | text | `pending`, `confirmed`, `rejected`, `cancelled` |
| owner_note | text | Note left by owner on approval/rejection |
| admin_note | text | Note left by admin |
| updated_by | uuid FK | User ID who last updated status |
| created_at | timestamptz | Auto timestamp |

---

### `public.bookings`
PG/flat booking records (Razorpay payment stub — not fully implemented).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto |
| user_id | uuid FK | → `auth.users(id)` |
| building_id | uuid FK | → `buildings(id)` |
| room_type_id | uuid FK | → `room_types(id)` |
| amount | numeric | Booking amount |
| service_fee | numeric | 10% service fee |
| status | text | Payment status |
| razorpay_order_id | text | Razorpay order reference |
| razorpay_payment_id | text | Payment ID |
| created_at | timestamptz | Auto |

---

### `public.verification_requests`
Admin property verification workflow (defined in schema.sql; unreferenced in frontend JavaScript).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto |
| building_id | uuid FK | → `buildings(id)` ON DELETE CASCADE |
| submitted_by | uuid FK | → `auth.users(id)` ON DELETE SET NULL |
| status | text | `pending`, `approved`, `rejected`, `changes_requested` |
| admin_note | text | Admin comment |
| reviewed_by | uuid FK | → `auth.users(id)` ON DELETE SET NULL |
| reviewed_at | timestamptz | Timestamp of review |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

---

### `public.property_reports`
User reports on properties.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto |
| building_id | uuid FK | → `buildings(id)` |
| reported_by | uuid FK | → `auth.users(id)` |
| reason | text | Report reason |
| details | text | Additional info |
| created_at | timestamptz | Auto |

---

### `public.notifications`
User notification records.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto |
| user_id | uuid FK | → `auth.users(id)` |
| message | text | Notification text |
| is_read | boolean | Read status |
| created_at | timestamptz | Auto |

---

### `public.agent_applications`
Agent application records (verified from `files6.0/SQL/agent-applications.sql` and `agent.js`).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated (`gen_random_uuid()`) |
| user_id | uuid FK (unique) | Applicant → `auth.users(id)` ON DELETE CASCADE |
| first_name | text | Applicant first name |
| last_name | text | Applicant last name |
| phone | text | Contact mobile |
| email | text | Contact email |
| location | text | Operating area / city |
| pincode | text | Postal pincode |
| status | text | `pending`, `approved`, `rejected` |
| created_at | timestamptz | Auto timestamp (`now()`) |
| reviewed_at | timestamptz | Timestamp of admin review |
| reviewed_by | uuid | Admin user ID who reviewed |

---

### `public.economy_deals`
Admin closed deals & commission accounting (verified from `files6.0/admin.js:7004–7844`).

> **Unresolved Database Dependency:** The `economy_deals` table is referenced extensively by `admin.js` for commission calculations (`profit = amount * commission_percent / 100`) and deal tracking. Like `hotel_bookings`, no migration file for `economy_deals` exists in repository SQL files. `admin.js` explicitly catches error code `42P01` (table does not exist).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| deal_date | date/text | Date deal closed |
| property_name | text | Associated property |
| deal_with | text | Client/counterparty name |
| amount | numeric | Total transaction volume |
| commission_percent | numeric | Commission percentage rate |
| commission_type | text | `flat` or `percent` |
| notes | text | Admin deal notes |
| created_by | uuid FK | → `auth.users(id)` |
| created_at | timestamptz | Auto timestamp |

---

## 2. Database Relationships

```
auth.users
    │
    ├── profiles (1:1)
    ├── buildings (1:many, via created_by)
    ├── saved_buildings (1:many)
    ├── enquiries (1:many, as renter)
    ├── hotel_bookings (1:many, as guest)
    ├── bookings (1:many)
    ├── reviews (1:many)
    ├── notifications (1:many)
    ├── property_reports (1:many)
    └── agent_applications (1:1)

buildings
    ├── room_types (1:many, CASCADE DELETE)
    ├── reviews (1:many)
    ├── saved_buildings (1:many)
    ├── enquiries (1:many)
    ├── hotel_bookings (1:many)
    ├── bookings (1:many)
    ├── verification_requests (1:many)
    └── property_reports (1:many)

room_types
    ├── hotel_bookings (1:many)
    └── bookings (1:many)
```

---

## 3. SQL Functions

| Function | Schema | Purpose |
|----------|--------|---------|
| `set_updated_at()` | public | Trigger function: sets `updated_at = now()` before UPDATE on any table |
| `handle_new_user()` | public | Trigger on `auth.users` INSERT: creates matching row in `profiles` |
| `is_admin()` | public | RLS helper: returns true if `profiles.role = 'admin'` for current user |

---

## 4. Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `set_updated_at` | `profiles` | BEFORE UPDATE | `set_updated_at()` |
| `set_updated_at` | `buildings` | BEFORE UPDATE | `set_updated_at()` |
| `set_updated_at` | `enquiries` | BEFORE UPDATE | `set_updated_at()` |
| `set_updated_at` | `agent_applications` | BEFORE UPDATE | `set_updated_at()` |
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` |

---

## 5. Row Level Security (RLS) Policies

### `buildings`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| Anyone can view approved | anon, auth | SELECT | `listing_status = 'approved'` |
| Owner can view own | auth | SELECT | `created_by = auth.uid()` |
| Authenticated can insert | auth | INSERT | `auth.uid() IS NOT NULL` |
| Owner can update own | auth | UPDATE | `created_by = auth.uid()` |
| Admin can do anything | auth | ALL | `is_admin()` |

### `room_types`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| Anyone can view | anon, auth | SELECT | (joins through buildings) |
| Owner can manage own | auth | INSERT, UPDATE, DELETE | Building owned by user |
| Admin can do anything | auth | ALL | `is_admin()` |

### `profiles`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| User can view own | auth | SELECT | `id = auth.uid()` |
| User can update own | auth | UPDATE | `id = auth.uid()` |
| Admin can view all | auth | SELECT | `is_admin()` |
| Admin can update all | auth | UPDATE | `is_admin()` |

### `enquiries`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| Renter can insert own | auth | INSERT | `user_id = auth.uid()` |
| Renter can view own | auth | SELECT | `user_id = auth.uid()` |
| Owner can view enquiries for own buildings | auth | SELECT | Building owned by user |
| Owner can update status/response | auth | UPDATE | Building owned by user |
| Admin can do anything | auth | ALL | `is_admin()` |

### `saved_buildings`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| User can manage own | auth | ALL | `user_id = auth.uid()` |

### `hotel_bookings`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| Guest can insert own | auth | INSERT | `user_id = auth.uid()` |
| Guest can view own | auth | SELECT | `user_id = auth.uid()` |
| Owner can view own hotel's bookings | auth | SELECT | Building owned by user |
| Owner can update status | auth | UPDATE | Building owned by user |
| Admin can do anything | auth | ALL | `is_admin()` |

### `agent_applications`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| Anyone can view approved | anon | SELECT | `status = 'approved'` |
| User can insert own | auth | INSERT | `user_id = auth.uid()` |
| User can view own | auth | SELECT | `user_id = auth.uid()` |
| Admin can do anything | auth | ALL | `is_admin()` |

### `reviews`
| Policy | Role | Permission | Condition |
|--------|------|-----------|-----------|
| Anyone can view approved | anon, auth | SELECT | `status = 'approved'` |
| Authenticated user can insert | auth | INSERT | `auth.uid() IS NOT NULL` |
| Admin can do anything | auth | ALL | `is_admin()` |

---

## 6. Supabase Storage (Verified from Code)

**Exact Bucket Name:** `property-images`

All media uploads across the entire application use the single Supabase Storage bucket `property-images`. This was verified directly from `script.js` (`uploadPropertyImages` lines 4547–4565 and `uploadPropertyMedia` lines 4599–4616).

| Parameter | Verified Value |
|-----------|----------------|
| **Bucket Name** | `property-images` |
| **Storage Path Pattern** | `${userId}/${Date.now()}-${i}-${safeFileName}` |
| **Max Image Size** | 5 MB (`image/*` MIME type) |
| **Max Video Size** | 50 MB (`video/*` MIME type) |
| **Max Building Images** | 5 (PG listing) / 36 (Hotel & Flat wizards) |
| **Max Per-Room Images** | 5 images per room type |
| **Public URL Method** | `supabaseClient.storage.from("property-images").getPublicUrl(path)` |
| **Upload Consumers** | • PG Listing (`list-pg.html`)<br>• Flat Listing (`list-flat.html`)<br>• Hotel Listing (`list-hotel.html`)<br>• Per-Room Gallery (`wireRoomImages`)<br>• Property Media Edit Mode (`renderExistingPropertyMedia`) |
| **Other Buckets** | None. User profiles do not have photo uploads. |

---

## 7. Feature-to-Database Mapping

| Feature | Tables Read | Tables Written |
|---------|------------|---------------|
| Home page listings | `buildings`, `room_types`, `reviews` | — |
| Search page | `buildings`, `room_types`, `reviews` | — |
| Property detail | `buildings`, `room_types`, `reviews`, `saved_buildings` | `reviews` (write review), `enquiries` (contact owner), `saved_buildings` |
| Saved properties | `buildings`, `room_types`, `saved_buildings` | `saved_buildings` |
| Hotel booking form | `buildings`, `room_types` | `hotel_bookings` |
| User dashboard | `profiles`, `saved_buildings`, `enquiries` | `profiles` |
| User hotel bookings | `hotel_bookings`, `buildings`, `room_types` | — |
| User enquiries | `enquiries`, `buildings`, `profiles` | — |
| Owner dashboard | `buildings`, `room_types`, `enquiries`, `reviews` | `buildings`, `room_types`, `enquiries` |
| Owner hotel bookings | `hotel_bookings`, `buildings`, `room_types`, `profiles` | `hotel_bookings` (approve/reject) |
| List PG/Room (new) | — | `buildings`, `room_types` |
| List Flat (new) | — | `buildings`, `room_types` |
| List Hotel (new) | — | `buildings`, `room_types` |
| Edit listing | `buildings`, `room_types` | `buildings`, `room_types` |
| Agent application | `agent_applications`, `buildings` | `agent_applications` |
| Admin dashboard | `buildings`, `profiles`, `reviews`, `enquiries`, `room_types` | `buildings`, `profiles`, `reviews` |
| Admin hotel bookings | `hotel_bookings`, `buildings`, `room_types`, `profiles` | `hotel_bookings` |
| Admin agents | `agent_applications`, `profiles` | `agent_applications`, `profiles` |
| Auth (login/signup) | `profiles` | `profiles` |
| Auth callback | `profiles` | `profiles` |
| Payment page | `bookings` | — (read-only stub) |

