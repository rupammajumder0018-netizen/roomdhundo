# MIGRATION_RISKS.md — Roomdhundo / Pg Dhundo
*Phase 1 Audit — Verified Code Inspection Findings*

> This document identifies critical architectural, security, data integrity, and operational risks discovered during the Phase 1 read-only audit of the existing Roomdhundo codebase.

---

## 1. Authentication & Authorization Risks

### 1.1 Hardcoded Supabase Anon Key Across 8+ Files
- **Finding:** The Supabase Project URL (`https://vyusxdilgwrcgmqqvzsp.supabase.co`) and anon public key are hardcoded directly into `admin.js`, `script.js`, `hotel-booking.js`, `hotel-bookings-admin.js`, `hotel-bookings-owner.js`, `hotel-bookings-user.js`, `agents-admin.js`, and `payment.html`.
- **Risk:** High exposure risk if committed to public repositories or leaked. In React + Vite, this must strictly be accessed via `import.meta.env.VITE_SUPABASE_ANON_KEY` through a singleton client.
- **Precaution:** Store in `.env.local` (git-ignored) and `.env.example`.

### 1.2 Hardcoded Admin Email Bypass
- **Finding:** In `script.js` (line 2118):
  ```javascript
  const ADMIN_EMAIL = "roomdhundo18@gmail.com";
  function isAdminEmail(email) {
      return String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
  }
  ```
  And in `admin.js` line 67, admin privileges are verified primarily against this hardcoded email rather than solely against `profiles.role = 'admin'` with database RLS.
- **Risk:** Frontend-only admin identification is vulnerable to client tampering. If a user tampers with the JS bundle or role check, they could see admin UI elements (though Supabase RLS will block unauthorized queries if configured).
- **Precaution:** Admin authorization must strictly verify `profiles.role === 'admin'` via database RLS policy `is_admin()`, not hardcoded string matching.

### 1.3 `localStorage.roomdhundo_role` Cache Poisoning / Desync
- **Finding:** `agent-gate.js` and `script.js` cache the user's role in `localStorage.getItem("roomdhundo_role")`. `agent-gate.js` reads this on page boot (before Supabase authentication completes) to decide whether to redirect the user to `be-an-agent.html`.
- **Risk:** LocalStorage can be stale, desynchronized from the database, or manually edited by the user. If an owner is demoted or an agent is rejected in the DB, the client remains trapped or misrouted until localStorage is manually cleared.
- **Precaution:** Replace client-side role caching with a centralized React `AuthProvider` state populated directly from Supabase Auth and the `profiles` table.

### 1.4 OAuth Callback URL Mismatch
- **Finding:** Google OAuth relies on `auth-callback.html` (served via Vercel rewrite at `/auth/callback`). The Supabase Dashboard has specific Allowed Callback URLs registered.
- **Risk:** If the React + Vite SPA changes the redirect route, or if `http://localhost:5173/auth/callback` is not added to the Supabase redirect whitelist, all Google OAuth logins will fail with an `invalid redirect_uri` error.
- **Precaution:** Register `http://localhost:5173/auth/callback` and `http://localhost:5173` in the Supabase Dashboard Auth URL Configuration before testing OAuth in Phase 2.

### 1.5 Embedded Admin Signup Form
- **Finding:** `admin.html` contains an embedded signup form within its sidebar (`#adminSignupForm`).
- **Risk:** Any visitor who accesses `admin.html` can trigger `auth.signUp` directly from the admin panel. While they are assigned the default user role by the DB trigger, the UI creates false expectations and security confusion.
- **Precaution:** Remove the embedded admin signup form; admin accounts must only be provisioned through explicit backend role assignment.

---

## 2. CSS & UI Migration Risks

### 2.1 Monolithic Global Stylesheet (`style.css` — 116 KB)
- **Finding:** `style.css` contains over 116 KB of un-namespaced, global CSS selectors affecting `body`, `nav`, `button`, `input`, `h1-h6`, etc.
- **Risk:** When migrating to React, importing `style.css` globally could pollute component styling or conflict with Tailwind utilities. Conversely, breaking it prematurely into CSS modules risks dropping vital cascade rules, custom pseudo-classes, or animation keyframes.
- **Precaution:** Keep existing stylesheets intact initially in Phase 2 (importing as global CSS), verify visual parity 1:1, and only refactor into scoped components after UI verification is complete.

### 2.2 Dark/Light Mode Theme Flash (FOUC)
- **Finding:** 5 HTML pages (`index.html`, `login.html`, `signup.html`, `be-an-agent.html`, `policies.html`) include an inline `<script>` block in the `<head>` that reads `localStorage.getItem("roomdhundo-theme")` and sets `document.documentElement.dataset.theme` synchronously before rendering body content.
- **Risk:** If theme initialization is deferred to a React `useEffect`, the page will flash white (light mode) before turning dark when dark mode is active.
- **Precaution:** Vite's `index.html` must include the exact synchronous inline theme script in its `<head>` to maintain instant, flash-free theme rendering.

### 2.3 High-Contrast Overrides (`rd-contrast.css`)
- **Finding:** `rd-contrast.css` applies targeted `!important` color rules to `body.auth-screen` (login and signup screens) in both light and dark modes to meet WCAG contrast requirements.
- **Risk:** These overrides could easily be missed or omitted during componentization, causing degraded text contrast on auth forms.
- **Precaution:** Include `rd-contrast.css` in the auth layout or merge its variables into the theme tokens.

### 2.4 Mobile Responsive CSS (`src/mobile.css`)
- **Finding:** `src/mobile.css` sets `input, select, textarea { font-size: 16px; }` on screens `< 768px` (to prevent iOS auto-zoom on input focus) and converts all grids to single-column layouts (`grid-template-columns: 1fr !important`).
- **Risk:** If this stylesheet is lost during migration, mobile inputs will trigger zoom bugs on iPhone devices and multi-column layouts will overflow viewports.

---

## 3. Business Logic & Data Mutation Risks

### 3.1 The "Unknown Column" Stripping Loop (`supabaseMutateWithoutUnknownColumns`)
- **Finding:** In `script.js` lines 5273–5291:
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
- **Risk:** This function was created as a workaround for schema divergence between production Supabase and frontend code. If the database schema is missing a column (e.g. `owner_email`, `website`, `hotel_meta`), this function silently strips the field and retries up to 16 times without informing the user that data was discarded!
- **Precaution:** In React, align the TypeScript interfaces with the actual PostgreSQL schema. Log warnings whenever payload fields are dropped.

### 3.2 Metadata Packed into Rules Array (`RD_META:{}` String Encoding)
- **Finding:** In `script.js`, hotel check-in/check-out times, listed-by status, and flat configurations are encoded as plain-text prefixes inside the `rules` JSONB array column (e.g. `Check-in: 12:00 PM`, `Check-out: 11:00 AM`, `RD_META:{"listed_by":"Broker / Agent"}`).
- **Risk:** If a user edits house rules in a naive UI, these metadata strings could be erased or corrupted, breaking hotel booking validation or agent attribution.
- **Precaution:** Maintain backward compatibility by keeping the parser/serializer functions (`visibleListingRules`, `mergeListingMetaIntoRules`, `parseTime12h`) in a shared utility module (`src/lib/ruleUtils.ts`).

### 3.3 Hotel Room Detail Mode vs Building Page (`?room=` Parameter)
- **Finding:** `property.html` acts as two distinct pages in one:
  1. If `?room=<UUID>` is present: it runs `setupHotelRoomDetailPage()` — hides the building UI, shows the room gallery, room pricing, and the hotel stay booking form.
  2. If `?room=` is absent: it runs `initPropertyPage()` / `setupHotelPropertyPage()` — shows the whole property.
- **Risk:** In an SPA migration, this must be handled carefully. Breaking this link pattern will break all deep links to hotel rooms.
- **Precaution:** Support both `/property/:id?room=:roomId` and a dedicated route `/hotel-room/:roomId` that reads the parent building automatically.

### 3.4 17 JavaScript Files Sharing Global Window State
- **Finding:** Communication between files is done entirely through `window.*` globals:
  - `window.supabaseClient`
  - `window.roomdhundoLocation`
  - `window.getSignedInUser` / `window.getCurrentUser` / `window.fetchProfileRole`
  - `window.listingMetaFromBuilding` / `window.hotelHasMeal` / `window.hotelMealPrice`
  - `window.hydrateFlatListing` / `window.validateFlatListing` / `window.collectFlatGalleryMedia`
  - `window.hydrateHotelListing` / `window.validateHotelListing` / `window.collectHotelGalleryMedia`
- **Risk:** Script load order race conditions exist in the current Vanilla app. In React, these must not remain window globals; they must be structured as typed custom hooks, React contexts, and utility modules.

---

## 4. Database Integration & Schema Risks

### 4.1 `hotel_bookings` Table Missing from SQL Schema Repository
- **Finding:** `schema.sql` contains 10 tables, and `files6.0/SQL/agent-applications.sql` adds `agent_applications`. However, `hotel_bookings` is **not defined anywhere in the repository's `.sql` files**. Both `hotel-bookings-owner.js` and `hotel-bookings-user.js` include error handlers with the message: `"Run the hotel booking SQL migration first."`
- **Risk:** A new developer spinning up a fresh database from `schema.sql` will have a broken hotel booking system because `hotel_bookings` will not exist.
- **Precaution:** In Phase 2 or when creating database documentation, document the exact schema of `hotel_bookings` as extracted from client code queries.

### 4.2 Discrepancies in `hotel_bookings` Column Names
- **Finding:** As verified during code inspection:
  - Client code uses `guest_count` (not `guests`)
  - Client code uses `booking_mode` (not `stay_type`)
  - Client code uses `hours_count` and `nights_count` (not `hours`)
  - Client code uses `price_per_unit` and `total_price`
  - There is NO `special_requests` column in the database or client code.
- **Risk:** Writing React queries that assume standard column names (e.g. `guests` or `stay_type`) will fail with PostgreSQL column-not-found errors.
- **Precaution:** Use exact, verified column names in React Supabase queries.

### 4.3 Supabase Storage Bucket Name
- **Finding:** Only one storage bucket is used: `property-images`.
- **Risk:** If a developer creates a bucket called `images` or `listings`, all file uploads will fail with `Bucket not found`.
- **Precaution:** Ensure `property-images` is configured as a public bucket in Supabase with appropriate RLS policies for authenticated uploads.

---

## 5. Deployment & Vercel Risks

### 5.1 Vercel Routing Configuration (`vercel.json`)
- **Finding:** The current `vercel.json` contains:
  ```json
  {
    "cleanUrls": false,
    "rewrites": [
      { "source": "/auth/callback", "destination": "/files6.0/auth-callback.html" },
      { "source": "/(.*)", "destination": "/files6.0/$1" }
    ]
  }
  ```
- **Risk:** This setup serves static files from `files6.0/`. A React + Vite SPA outputs to `dist/` and requires client-side SPA routing (`/*` -> `/index.html`). If `vercel.json` is not updated during deployment, deep links (e.g. `/property/123`) will result in 404 errors.
- **Precaution:** When deploying React, update `vercel.json` to route all non-asset requests to `dist/index.html`.

### 5.2 Legacy `.html` URL Bookmarks
- **Finding:** Existing users, search engines, and WhatsApp shared links contain URLs ending in `.html` (e.g. `https://roomdhundo.com/property.html?id=...`).
- **Risk:** Dropping `.html` support immediately will break incoming referral traffic and WhatsApp links.
- **Precaution:** Add backward-compatible redirect routes in React Router (`/property.html` -> `/property/:id`, etc.).

### 5.3 Leaflet Map Initialization in React Lifecycle
- **Finding:** `property-map.js` initializes Leaflet maps by directly querying DOM IDs (`#propertyMap`, `#roomdhundoMap`).
- **Risk:** In React, initializing Leaflet directly on DOM elements without unmounting can trigger `Error: Map container is already initialized` during re-renders or navigation.
- **Precaution:** Use `react-leaflet` or manage Leaflet map instance lifecycles explicitly within `useEffect` cleanup return functions.

---

## 6. Suspicious Implementations & Existing Bugs

| Location | Issue | Impact |
|----------|-------|--------|
| `payment.html` line 258 | `alert("Payment gateway coming soon")` | Razorpay payment is completely unimplemented; PG booking fee collection does not function. |
| `hotel-bookings-owner.js` | Minified into 12 lines of fragile DOM script | Hard to debug; uses raw string concatenation with `prompt()` for notes. |
| `hotel-bookings-user.js` | Minified into 4 lines | Fragile script; fails silently if table is missing. |
| `location.js` lines 169–185 | Clears custom locations outside 3 fixed hubs | Users entering locations outside MAKAUT, Jaguli, or Haringhata are silently reset to default. |
| `admin.js` line 67 | Embedded login/signup bypasses normal user registration flow | Uncontrolled user creation in admin UI. |

---

## 7. Migration Precautions Checklist

- [ ] **Do not delete `files6.0/`** during Phase 2; keep as reference and fallback.
- [ ] **Create a singleton Supabase client** in `src/lib/supabase.ts` reading from environment variables.
- [ ] **Configure Supabase Auth Redirect URLs** to include `http://localhost:5173/auth/callback` before testing auth.
- [ ] **Preserve all URL query parameters** (`?id=`, `?room=`, `?q=`, `?stay=`, `?type=`, `?min=`, `?max=`, `?edit=`).
- [ ] **Synchronous Theme Script:** Place theme initialization script in Vite's `index.html` `<head>` to prevent FOUC.
- [ ] **Storage Bucket:** Verify Supabase bucket `property-images` exists and has public read access.
- [ ] **Strict Read-Only:** Maintain 100% read-only adherence until Phase 1 sign-off is complete.

