# ROUTE_MAPPING.md — Roomdhundo / Pg Dhundo
*Phase 1 Audit — Read-Only*

> All original routes, current URLs, query parameters, authentication/role requirements, and proposed React routes are derived directly from verified code inspection.

---

## 1. Master Route & Page Mapping Table

| Original HTML File | Current URL (Vercel-served) | Main Functionality | Associated JS Files | Associated CSS Files | Auth Required? | Required User Role | Supabase Dependencies | Proposed React Route | Query Params & State to Preserve |
|--------------------|----------------------------|--------------------|---------------------|----------------------|----------------|-------------------|----------------------|---------------------|----------------------------------|
| `index.html` (root) | `/` | Redirect shim to `files6.0/index.html` | None | None | No | Any | None | `/` | All params passed through |
| `files6.0/index.html` | `/` or `/index.html` | Home page: listings grid, category tabs (All/PG/Hotel/Flat), search hero, stay type toggle, facility filters, budget filters, save property, chat widget, agent section | `script.js`, `location.js`, `nearby.js`, `agent.js` | `style.css`, `rd-contrast.css` | No* (gate prompts login on interaction) | Any | `buildings`, `room_types`, `reviews`, `saved_buildings`, `profiles` | `/` | `?type=`, `?stay=`, `?agent=`, `?hub=` |
| `files6.0/search.html` | `/search.html` | Search results: text search, filters (room type, property type, facilities, budget), sort, daily/monthly toggle | `script.js`, `location.js`, `nearby.js` | `style.css` | No* (gate prompts login) | Any | `buildings`, `room_types`, `reviews`, `saved_buildings` | `/search` | `?q=`, `?stay=`, `?type=`, `?min=`, `?max=`, `?sort=`, `?hub=` |
| `files6.0/property.html` | `/property.html` | Property detail (PG/Room/Mess/Flat): image gallery, room types, facilities, rules, reviews, submit review, contact owner panel (enquiry), save property, map | `script.js`, `property-map.js`, `hotel-booking.js` | `style.css` | No (read-only); Yes for contact/review/save | Any | `buildings`, `room_types`, `reviews`, `enquiries`, `saved_buildings` | `/property/:id` | `?id=` (property UUID — required), `?room=` (switches to hotel room detail mode) |
| `files6.0/property.html` (room mode) | `/property.html?room=UUID` | Hotel room detail page: single room view, nightly rate, amenities, hotel booking form | `script.js`, `hotel-booking.js` | `style.css` | No (read-only); Yes for booking | Any | `room_types`, `buildings`, `hotel_bookings` | `/hotel-room/:roomId` (or `/property/:id?room=:roomId`) | `?room=` (room UUID — required) |
| `files6.0/saved.html` | `/saved.html` | User's saved properties list: saved property cards, remove saved | `script.js`, `location.js` | `style.css` | **Yes** | Any logged-in user | `saved_buildings` JOIN `buildings`, `room_types`, `reviews` | `/saved` | None |
| `files6.0/login.html` | `/login.html` | Dedicated login page: email/password login, forgot password, link to signup | `script.js` | `style.css` | No | Public (redirects if already logged in) | `auth.signInWithPassword` | `/login` | `?redirect=` (post-login return path) |
| `files6.0/signup.html` | `/signup.html` | Dedicated signup page: email, password, role picker (Renter/Owner/Agent), terms agreement | `script.js` | `style.css` | No | Public (redirects if already logged in) | `auth.signUp`, `profiles` | `/signup` | `?role=` (pre-selected role) |
| `files6.0/reset-password.html` | `/reset-password.html` | Set new password after clicking Supabase magic link | `script.js` (`wireResetPasswordForm`) | `style.css` | No (Supabase token in hash) | Public | `auth.updateUser` | `/reset-password` | Hash fragment `#access_token=...&type=recovery` (Supabase standard) |
| `files6.0/auth-callback.html` | `/auth/callback` (via Vercel rewrite) | OAuth callback handler: exchanges code/hash for session, creates/updates profile, redirects by role | `script.js` (`consumeOAuthRedirect`) | None | No | Public | `auth.getSession`, `profiles` | `/auth/callback` | Hash fragment `#access_token=...` or query `?code=...` |
| `files6.0/user-dashboard.html` | `/user-dashboard.html` | User dashboard: profile view/edit, saved count, enquiry count, hotel bookings list, logout | `script.js`, `user-dashboard.js`, `hotel-bookings-user.js` | `user-dashboard.css`, `hotel-bookings.css`, `rd-contrast.css` | **Yes** | Any logged-in user | `profiles`, `saved_buildings`, `enquiries`, `hotel_bookings` | `/dashboard` | None |
| `files6.0/enquiries.html` | `/enquiries.html` | User enquiries page: list of all submitted enquiries, status breakdown (pending/accepted/rejected) | `script.js`, `user-enquiries.js` | `user-enquiries.css`, `rd-contrast.css` | **Yes** | Any logged-in user | `enquiries` JOIN `buildings` | `/enquiries` | None |
| `files6.0/owner-dashboard.html` | `/owner-dashboard.html` | Owner dashboard: property stats, My Properties list, room availability table, hotel booking requests, enquiry manager, reviews, profile | `owner-dashboard.js`, `hotel-bookings-owner.js` | `owner-dashboard.css`, `hotel-bookings.css`, `rd-contrast.css` | **Yes** | `owner`, `admin`, `agent` | `buildings`, `room_types`, `enquiries`, `hotel_bookings`, `reviews`, `profiles` | `/owner/dashboard` | Tab state via DOM (can become sub-routes: `/owner/properties`, `/owner/enquiries`, etc.) |
| `files6.0/admin.html` | `/admin.html` | Admin dashboard (9 sections): Dashboard, Properties, Registered Profiles, Enquiries, Hotel Bookings, Agents, Economy, Reviews, Settings | `admin.js`, `hotel-bookings-admin.js`, `agents-admin.js` | `admin.css`, `hotel-bookings.css`, `admin-hotel-bookings.css`, `rd-contrast.css` | **Yes** | `admin` (or hardcoded `roomdhundo18@gmail.com`) | `buildings`, `profiles`, `enquiries`, `hotel_bookings`, `agent_applications`, `reviews`, `verification_requests` | `/admin/*` (with nested routes: `/admin/properties`, `/admin/profiles`, `/admin/bookings`, `/admin/agents`, etc.) | Section state via sidebar tab switching |
| `files6.0/list-property.html` | `/list-property.html` | Listing hub: redirects to specific listing form or lets owner choose property type | `script.js`, `location.js`, `property-map.js` | `style.css` | **Yes** | `owner`, `admin`, `agent` | `profiles` | `/list-property` | None |
| `files6.0/list-pg.html` | `/list-pg.html` | PG / Room listing form: details, location, map picker, room types with sharing prices, facilities, photos | `script.js`, `location.js`, `property-map.js` | `style.css`, `rd-contrast.css` | **Yes** | `owner`, `admin`, `agent` | `buildings`, `room_types`, `property-images` storage | `/list-property/pg` | `?edit=` (property UUID for edit mode) |
| `files6.0/list-flat.html` | `/list-flat.html` | Flat listing wizard (9 steps): basics, location, layout, rent, amenities, tenants, photos, contact, review | `script.js`, `flat-listing.js`, `location.js`, `property-map.js` | `style.css`, `hotel-listing.css`, `flat-listing.css`, `rd-contrast.css` | **Yes** | `owner`, `admin`, `agent` | `buildings` (`listing_status=pending`), `room_types`, `property-images` storage | `/list-property/flat` | `?edit=` (property UUID for edit mode) |
| `files6.0/list-hotel.html` | `/list-hotel.html` | Hotel listing wizard (3 steps): hotel info, rooms & pricing (per-room photos, hourly/nightly rates), review & publish | `script.js`, `hotel-listing.js`, `location.js`, `property-map.js` | `style.css`, `hotel-listing.css`, `rd-contrast.css` | **Yes** | `owner`, `admin`, `agent` | `buildings`, `room_types`, `property-images` storage | `/list-property/hotel` | `?edit=` (property UUID for edit mode) |
| `files6.0/be-an-agent.html` | `/be-an-agent.html` | Agent application page: application form, status display (pending/approved/rejected) | `script.js`, `agent.js`, `agent-gate.js` | `style.css` | **Yes** | Any logged-in user (especially `agent_pending`) | `agent_applications`, `profiles` | `/be-an-agent` | None |
| `files6.0/payment.html` | `/payment.html` | Booking payment summary (stub): booking breakdown, service fee, Razorpay placeholder | Inline script | `style.css` | **Yes** | Any logged-in user | `bookings` | `/payment` | `?booking=` (booking UUID — required) |
| `files6.0/policies.html` | `/policies.html` | Policies: Terms of Service, Privacy Policy, Payment & Refund Policy | None | `style.css`, `rd-contrast.css` | No | Public | None | `/policies` | `#payment`, `#terms`, `#privacy` (scroll-to-section anchor hashes) |

---

## 2. URL Parameters & State That Must Be Preserved

### Critical Parameters

1. **`property.html?id=<UUID>`**
   - The primary key of the building being viewed.
   - Used in `initPropertyPage()`: `const id = new URLSearchParams(window.location.search).get("id")`.
   - In React: Route param `/property/:id` via `useParams()`.
   - Legacy redirect needed: `/property.html?id=:id` → `/property/:id`.

2. **`property.html?room=<UUID>`**
   - When present, switches `property.html` into hotel room detail mode via `setupHotelRoomDetailPage(building, hotelRoom)`.
   - In React: Can be `/hotel-room/:roomId` or `/property/:id?room=:roomId`.

3. **`list-*.html?edit=<UUID>`**
   - Property ID to load for editing in all three listing forms (`list-pg.html`, `list-flat.html`, `list-hotel.html`).
   - Handled in `loadPropertyForEdit(buildingId, user)`.
   - In React: `/list-property/:type/edit/:id` or query param `?edit=:id`.

4. **`search.html?q=&stay=&type=&min=&max=&sort=&hub=`**
   - Query string filters for property search.
   - `q`: Search term (property name or location).
   - `stay`: `daily` or `monthly`.
   - `type`: `PG`, `Room`, `Flat`, `Hotel`, `Mess`, `Guest House`.
   - `min`, `max`: Price filter bounds.
   - `sort`: `price-asc`, `price-desc`, `rating`, `distance`.
   - `hub`: GPS hub name (`MAKAUT`, `Jaguli`, `Haringhata`).
   - In React: Kept via `useSearchParams()`.

5. **`payment.html?booking=<UUID>`**
   - Booking record ID to display and charge.
   - In React: `/payment/:bookingId` or `/payment?booking=:bookingId`.

6. **`policies.html#payment` / `#terms` / `#privacy`**
   - Section anchors for policy navigation.
   - In React: Standard hash navigation with smooth scroll.

7. **`/auth/callback#access_token=...` / `?code=...`**
   - Supabase OAuth exchange credentials.
   - MUST be handled at the exact redirect URL configured in Supabase Auth settings.

8. **`index.html?agent=<id>`**
   - Agent filter URL (filters home page properties to those listed by a specific agent).
   - In React: Preserved via `useSearchParams()`.

---

## 3. Route Guard & Authorization Architecture

### Public Routes (No Auth Required)
- `/` (Home)
- `/search`
- `/policies`
- `/login`
- `/signup`
- `/reset-password`
- `/auth/callback`
- `/property/:id` (Read-only browsing)

### Authenticated User Routes (Any Logged-in User)
- `/saved`
- `/dashboard` (User Dashboard)
- `/enquiries` (User Enquiries)
- `/be-an-agent`
- `/payment`

### Role-Restricted Routes

| Route | Allowed Roles | Redirect If Unauthorized |
|-------|---------------|--------------------------|
| `/owner/dashboard` | `owner`, `admin`, `agent` | `/dashboard` or `/login` |
| `/list-property/*` | `owner`, `admin`, `agent` | Modal prompt: "Listings are restricted to property owners" |
| `/admin/*` | `admin` only (verified in `profiles.role`) | `/login` |

### Agent Pending Gate
- Users with role `agent_pending` must be redirected to `/be-an-agent` until their application is approved.
- In React: Handled inside `AuthProvider` via a route wrapper component, replacing the fragile `agent-gate.js` `localStorage` check.

---

## 4. Proposed React Router (v6/v7) Structure

```jsx
<Routes>
  {/* Public layout */}
  <Route element={<RootLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/property/:id" element={<PropertyDetailPage />} />
    <Route path="/hotel-room/:roomId" element={<HotelRoomDetailPage />} />
    <Route path="/policies" element={<PoliciesPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />

    {/* Authenticated routes */}
    <Route element={<RequireAuth />}>
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/dashboard" element={<UserDashboardPage />} />
      <Route path="/enquiries" element={<EnquiriesPage />} />
      <Route path="/be-an-agent" element={<BeAnAgentPage />} />
      <Route path="/payment" element={<PaymentPage />} />

      {/* Owner / Agent / Admin routes */}
      <Route element={<RequireRole roles={['owner', 'agent', 'admin']} />}>
        <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
        <Route path="/list-property" element={<ListPropertyHubPage />} />
        <Route path="/list-property/pg" element={<ListPgPage />} />
        <Route path="/list-property/flat" element={<ListFlatPage />} />
        <Route path="/list-property/hotel" element={<ListHotelPage />} />
      </Route>

      {/* Admin-only routes */}
      <Route element={<RequireRole roles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="profiles" element={<AdminProfilesPage />} />
          <Route path="enquiries" element={<AdminEnquiriesPage />} />
          <Route path="hotel-bookings" element={<AdminHotelBookingsPage />} />
          <Route path="agents" element={<AdminAgentsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="economy" element={<AdminEconomyPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
    </Route>

    {/* Legacy URL redirect shim (preserves incoming .html links) */}
    <Route path="/index.html" element={<Navigate to="/" replace />} />
    <Route path="/search.html" element={<LegacyRedirect to="/search" />} />
    <Route path="/property.html" element={<LegacyPropertyRedirect />} />
    <Route path="/saved.html" element={<Navigate to="/saved" replace />} />
    <Route path="/login.html" element={<Navigate to="/login" replace />} />
    <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
    <Route path="/reset-password.html" element={<Navigate to="/reset-password" replace />} />
    <Route path="/user-dashboard.html" element={<Navigate to="/dashboard" replace />} />
    <Route path="/enquiries.html" element={<Navigate to="/enquiries" replace />} />
    <Route path="/owner-dashboard.html" element={<Navigate to="/owner/dashboard" replace />} />
    <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
    <Route path="/list-property.html" element={<Navigate to="/list-property" replace />} />
    <Route path="/list-pg.html" element={<LegacyListRedirect type="pg" />} />
    <Route path="/list-flat.html" element={<LegacyListRedirect type="flat" />} />
    <Route path="/list-hotel.html" element={<LegacyListRedirect type="hotel" />} />
    <Route path="/be-an-agent.html" element={<Navigate to="/be-an-agent" replace />} />
    <Route path="/payment.html" element={<LegacyPaymentRedirect />} />
    <Route path="/policies.html" element={<Navigate to="/policies" replace />} />

    {/* 404 Catch-All */}
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```

---

*Document created during Phase 1 Audit. Do not modify application source files during this phase.*

