# FEATURE_MAPPING.md — Roomdhundo / Pg Dhundo
*Phase 1 Audit — Read-Only*

> Every row is derived from verified code inspection. No assumptions.

---

## Legend

| Column | Meaning |
|--------|---------|
| **Priority** | H = High (core UX / data), M = Medium (important but isolated), L = Low (static / stub) |
| **Auth Req** | Whether a logged-in session is required |
| **Role** | Minimum role to access the feature (blank = any authenticated user) |

---

## 1. Navigation & Shell

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Navbar (links, auth button) | All pages | `script.js` (`updateNavForUser`, `wireAuthUI`) | `style.css` | `profiles` | `<Navbar />` | H |
| Theme toggle (dark/light) | All pages (inline `<script>`) | `script.js` (`wireThemeToggle`) | `style.css` (CSS vars `--rd-*`) | — | `useTheme()` hook + `<ThemeToggle />` | H |
| Mobile nav drawer | All pages | `script.js` (`wireMobileNav`) | `style.css` | — | Inside `<Navbar />` | M |
| Back-button (site-wide) | All pages | `script.js` (`wireSiteBackButton`) | — | — | React Router `useNavigate` | L |
| Chatbot (FAQ + WhatsApp/email) | `index.html`, `property.html` | `script.js` (`wireChatbot`) | `style.css` | — | `<ChatbotWidget />` | M |
| "Back to top" button | `index.html` | `script.js` | `style.css` | — | `<BackToTop />` | L |

---

## 2. Authentication

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables / APIs | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|------------------------|----------------------------|----------|
| Auth modal (Login + Signup) | All pages (modal overlay) | `script.js` (`wireAuthUI`, `openAuthModal`, `closeAuthModal`) | `style.css` | `auth.signInWithPassword`, `auth.signUp`, `profiles` | `<AuthModal />` with `<LoginForm />` + `<SignupForm />` | H |
| Email / password login | Modal in all pages | `script.js` | `style.css` | `auth.signInWithPassword` | `<LoginForm />` | H |
| Email / password signup | Modal in all pages | `script.js` (`wireAuthUI`) | `style.css` | `auth.signUp`, `profiles` (via trigger) | `<SignupForm />` | H |
| Role picker on signup | Modal in all pages | `script.js` (`getSelectedAuthRole`) | `style.css` | `profiles.role` | Inside `<SignupForm />` | H |
| Google OAuth (sign in with Google) | Modal in all pages | `script.js` (`auth.signInWithOAuth`) | `style.css` | `auth` provider OAuth | `<GoogleOAuthButton />` | H |
| Auth callback (OAuth exchange) | `auth-callback.html` | `script.js` (`consumeOAuthRedirect`) | — | `auth.getSession`, `profiles` | `/auth/callback` route → `<AuthCallbackPage />` | H |
| Password reset request | All pages (modal) | `script.js` (`auth.resetPasswordForEmail`) | `style.css` | `auth` | Inside `<AuthModal />` | H |
| Password reset confirmation | `reset-password.html` | `script.js` (`wireResetPasswordForm`) | `style.css` | `auth.updateUser` | `<ResetPasswordPage />` | H |
| Logout | Nav button in all pages | `script.js` (`auth.signOut`) | `style.css` | `auth` | `<LogoutButton />` or inside `<Navbar />` | H |
| Session restoration | All pages (DOMContentLoaded) | `script.js` (`getCurrentUserFast`, `auth.getSession`) | — | `auth` | `AuthProvider` context (single `onAuthStateChange`) | H |
| Role-based redirect after login | All pages | `script.js` (`dashboardPathForRole`) | — | `profiles` | Inside `AuthProvider` / `useAuthRedirect` hook | H |
| Agent pending gate (localStorage) | All pages | `agent-gate.js` | — | `localStorage.roomdhundo_role` (antipattern) | Remove — replace with server-verified role in `AuthProvider` | H |
| Role choice modal (post-signup) | All pages (overlay) | `script.js` (`wireRoleChoice`, `selectUserRole`) | `style.css` | `profiles` | `<RoleChoiceModal />` | H |

---

## 3. Home Page

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Hero search bar | `index.html` | `script.js` (`wireHeroSearch`) | `style.css` | — | `<HeroSearch />` | H |
| Property listing grid | `index.html` | `script.js` (`renderBuildingCard`, `loadAllBuildings`) | `style.css` | `buildings`, `room_types`, `reviews` | `<PropertyGrid />`, `<PropertyCard />` | H |
| Category filter tabs (All / PG-Room / Hotel / Flat) | `index.html` | `script.js` | `style.css` | `buildings.type` filter | `<CategoryTabs />` | H |
| Stay-type toggle (Daily / Monthly) | `index.html` | `script.js` (`wireHomeStayButtons`) | `style.css` | `room_types.daily_price` / `price_value` | `<StayToggle />` | H |
| Flat offer toggle (Rent / For Sale) | `index.html`, `list-flat.html` | `script.js` | `style.css` | `buildings.facility_tags` (`flat-sale` / `flat-rent`) | `<FlatOfferToggle />` | M |
| Facility filters (checkboxes) | `index.html` | `script.js` | `style.css` | `buildings.facility_tags` | `<FacilityFilter />` | H |
| Budget filter (min/max rent) | `index.html` | `script.js` | `style.css` | `room_types.price_value` | `<BudgetFilter />` | H |
| Agent section on home page | `index.html` | `agent.js` (`renderHomeAgents`) | `style.css` | `profiles` (role=agent) | `<AgentSection />` | M |
| "Login required to explore" gate | `index.html`, `search.html`, `saved.html`, `property.html` | `script.js` (`requireLoginToExplore`, `showGuestLoginPrompt`) | `style.css` | `auth` | `<RequireAuth />` HOC or gate component | H |
| Nearby properties (GPS) | `index.html`, `search.html` | `nearby.js` | `style.css` | `buildings.latitude`, `buildings.longitude` | `useNearby()` hook + inside `<PropertyGrid />` | M |
| Hub selector (MAKAUT / Jaguli / Haringhata) | `index.html`, `search.html` | `location.js` | `style.css` | — (GPS + localStorage) | `<HubSelector />` | M |
| Save/unsave button on card | `index.html`, `search.html` | `script.js` (`toggleSavedBuilding`) | `style.css` | `saved_buildings` | `<SaveButton />` | H |
| Compare button | `index.html`, `search.html` | `script.js` (placeholder, no logic) | `style.css` | — | `<CompareButton />` (placeholder) | L |

---

## 4. Search Page

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Text search (name / location) | `search.html` | `script.js` | `style.css` | `buildings` (ilike filter) | `<SearchPage />`, `<SearchBar />` | H |
| Filters (room type, property type, facilities, budget, sort) | `search.html` | `script.js` | `style.css` | `buildings`, `room_types` | `<SearchFilters />` | H |
| Sort (price, rating, distance) | `search.html` | `script.js` | `style.css` | computed client-side | Inside `<SearchFilters />` | M |
| Stay mode (daily/monthly) | `search.html` | `script.js` | `style.css` | `room_types.daily_price` | `<StayToggle />` | M |
| URL query params (`?q=&stay=&type=&min=&max=`) | `search.html` | `script.js` | — | — | URL state → `useSearchParams` | H |
| Property results grid | `search.html` | `script.js` (`renderBuildingCard`) | `style.css` | `buildings`, `room_types`, `reviews` | Shared `<PropertyGrid />`, `<PropertyCard />` | H |

---

## 5. Property Detail Page

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Property detail (PG / Room / Mess / Guest House) | `property.html` | `script.js` (`initPropertyPage`) | `style.css` | `buildings`, `room_types`, `reviews` | `<PropertyDetailPage />` | H |
| Hotel property page | `property.html` | `script.js` (`setupHotelPropertyPage`), `hotel-booking.js` | `style.css` | `buildings`, `room_types`, `hotel_bookings` | `<HotelPropertyPage />` | H |
| Hotel room detail page (`?room=UUID`) | `property.html` | `script.js` (`setupHotelRoomDetailPage`), `hotel-booking.js` | `style.css` | `room_types`, `hotel_bookings` | `<HotelRoomDetailPage />` | H |
| Property image gallery + lightbox | `property.html` | `script.js` (gallery logic) | `style.css` | `buildings.images`, `room_types.images` | `<ImageGallery />` | H |
| Room types list (occupancy / pricing) | `property.html` | `script.js` (room type cards) | `style.css` | `room_types` | `<RoomTypeList />`, `<RoomTypeCard />` | H |
| Facilities grid | `property.html` | `script.js` (`getBuildingFacilityLabels`) | `style.css` | `buildings.facility_tags` | `<FacilitiesGrid />` | M |
| Rules list | `property.html` | `script.js` (`visibleListingRules`) | `style.css` | `buildings.rules` | `<RulesList />` | M |
| Owner card + View Owner Profile modal | `property.html` | `script.js` | `style.css` | `buildings.owner_name`, `buildings.owner_verified` | `<OwnerCard />`, `<OwnerModal />` | M |
| Contact owner panel + enquiry form | `property.html` | `script.js` (`submitEnquiryBtn`) | `style.css` | `enquiries` (insert) | `<ContactPanel />`, `<EnquiryForm />` | H |
| Call Pg Dhundo / WhatsApp buttons | `property.html` | `script.js` | `style.css` | — | `<ContactButtons />` | M |
| Review form + star rating | `property.html` | `script.js` (`wireReviewForm`) | `style.css` | `reviews` (insert) | `<ReviewForm />` | H |
| Reviews list | `property.html` | `script.js` | `style.css` | `reviews` (select) | `<ReviewsList />` | H |
| Leaflet map (property location) | `property.html` | `property-map.js` | `style.css`, Leaflet CSS | `buildings.latitude`, `buildings.longitude` | `<PropertyMap />` (react-leaflet) | M |
| Save / unsave property button | `property.html` | `script.js` (`toggleSavedBuilding`) | `style.css` | `saved_buildings` | `<SaveButton />` | H |

---

## 6. Hotel Booking Flow

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Hotel booking form (dates, guests, board type) | `property.html` | `hotel-booking.js` (`initHotelStay`) | `style.css` | `hotel_bookings` (insert) | `<HotelBookingForm />` | H |
| Board type selector (room-only / breakfast / half-board / full-board) | `property.html` | `hotel-booking.js` | `style.css` | `buildings.hotel_meta` | `<BoardTypeSelector />` | M |
| Nightly / hourly price calculation | `property.html` | `hotel-booking.js`, `script.js` (meta helpers) | — | `room_types.daily_price`, `room_types.room_details.hourly` | Inside `<HotelBookingForm />` | H |
| Guest count (adults + children) | `property.html` | `hotel-booking.js` | `style.css` | — | Inside `<HotelBookingForm />` | M |
| Special requests / notes | Not implemented | None | None | None (verified: no `special_requests` column in DB or UI) | Omit or add to schema | L |
| Booking submission | `property.html` | `hotel-booking.js` | — | `hotel_bookings` (insert) | `<HotelBookingForm />` | H |

---

## 7. Saved Properties

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Saved properties grid | `saved.html` | `script.js` (`initSavedPage`) | `style.css` | `saved_buildings` JOIN `buildings`, `room_types`, `reviews` | `<SavedPage />`, shared `<PropertyCard />` | H |
| Remove saved property | `saved.html` | `script.js` | `style.css` | `saved_buildings` (delete) | Inside `<PropertyCard />` via `<SaveButton />` | H |

---

## 8. User Dashboard

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| User profile view / edit | `user-dashboard.html` | `user-dashboard.js` | `user-dashboard.css`, `rd-contrast.css` | `profiles` | `<UserProfile />` | H |
| Stat cards (saved, enquiries, etc.) | `user-dashboard.html` | `user-dashboard.js` | `user-dashboard.css` | `saved_buildings`, `enquiries` | `<UserStats />` | M |
| User hotel bookings list | `user-dashboard.html` | `hotel-bookings-user.js` | `hotel-bookings.css` | `hotel_bookings` | `<UserHotelBookings />` | H |
| Logout button | `user-dashboard.html` | `user-dashboard.js` | `user-dashboard.css` | `auth.signOut` | `<LogoutButton />` | H |
| Navigation sidebar | `user-dashboard.html` | `user-dashboard.js` | `user-dashboard.css` | — | `<DashboardSidebar />` | M |

---

## 9. User Enquiries Page

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Enquiry list (all statuses) | `enquiries.html` | `user-enquiries.js` | `user-enquiries.css`, `rd-contrast.css` | `enquiries` JOIN `buildings` | `<EnquiriesPage />`, `<EnquiryCard />` | H |
| Filter by status (pending / accepted / rejected) | `enquiries.html` | `user-enquiries.js` | `user-enquiries.css` | `enquiries.status` | Inside `<EnquiriesPage />` | M |
| Enquiry status badges | `enquiries.html` | `user-enquiries.js` | `user-enquiries.css` | `enquiries.status` | `<StatusBadge />` | M |

---

## 10. Owner Dashboard

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Stats overview (properties, rooms, occupancy) | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `buildings`, `room_types` | `<OwnerStats />` | H |
| My Properties list | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `buildings` (created_by = user.id) | `<OwnerProperties />` | H |
| Edit property (redirect to list-*.html?edit=ID) | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `buildings` | `<EditPropertyButton />` | H |
| Delete property | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `buildings` (delete), `room_types` | Inside `<OwnerProperties />` | H |
| Room availability table | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `room_types` | `<RoomAvailability />` | M |
| Hotel booking requests (approve/reject) | `owner-dashboard.html` | `hotel-bookings-owner.js` | `hotel-bookings.css` | `hotel_bookings` | `<OwnerHotelBookings />` | H |
| Enquiries management (view, respond, change status) | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `enquiries` | `<OwnerEnquiries />` | H |
| Reviews list (read-only for owner) | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `reviews` JOIN `buildings` | `<OwnerReviews />` | M |
| Owner profile view / edit | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | `profiles` | `<OwnerProfile />` | H |
| Navigation sidebar | `owner-dashboard.html` | `owner-dashboard.js` | `owner-dashboard.css` | — | `<DashboardSidebar />` | M |

---

## 11. Property Listing Forms

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| List property hub (choose type) | `list-property.html` | `script.js` (`wireListPropertyAccess`, `bindListPropertyOpeners`) | `style.css` | `profiles` (role check) | `<ListPropertyHubPage />` | H |
| PG / Room listing form | `list-pg.html` | `script.js` (`wireListPropertyForm`, `addRoomTypeBlock`) | `style.css`, `rd-contrast.css` | `buildings` (insert/update), `room_types`, `property-images` storage | `<ListPgPage />` | H |
| Flat listing wizard (9 steps) | `list-flat.html` | `script.js` (form submit), `flat-listing.js` (wizard steps) | `style.css`, `hotel-listing.css`, `flat-listing.css`, `rd-contrast.css` | `buildings` (insert/update, `listing_status=pending`), `room_types`, `property-images` storage | `<ListFlatPage />` | H |
| Hotel listing wizard (3 steps) | `list-hotel.html` | `script.js` (form submit), `hotel-listing.js` (wizard steps) | `style.css`, `hotel-listing.css`, `rd-contrast.css` | `buildings` (insert/update), `room_types` (with `images` JSONB), `property-images` storage | `<ListHotelPage />` | H |
| Edit existing property (all types) | `list-pg.html?edit=ID`, `list-flat.html?edit=ID`, `list-hotel.html?edit=ID` | `script.js` (`loadPropertyForEdit`) | (same as above) | `buildings` (select + update), `room_types` | Same forms with edit mode | H |
| Property image / video upload | All listing forms | `script.js` (`uploadPropertyMedia`) | — | `property-images` Supabase Storage bucket | `<MediaUploader />` | H |
| Per-room image upload (hotel) | `list-hotel.html`, `list-pg.html` | `script.js` (`wireRoomImages`) | — | `property-images` storage | `<RoomImageUploader />` | H |
| Leaflet map (pick location) | All listing forms | `property-map.js` | Leaflet CSS, `style.css` | `buildings.latitude`, `buildings.longitude` | `<LocationPicker />` (react-leaflet) | H |
| Agent listing owner fields | All listing forms | `script.js` (`setupAgentListingOwnerFields`) | `style.css` | `profiles` (role=agent) | Inside listing forms | M |
| Owner-only modal (access denied) | All listing forms | `script.js` (`showOwnerOnlyModal`) | `style.css` | — | `<AccessDeniedModal />` | M |

---

## 12. Admin Dashboard

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Dashboard stats (users, properties, revenue) | `admin.html` | `admin.js` | `admin.css`, `rd-contrast.css` | `buildings`, `profiles`, `enquiries`, `hotel_bookings` | `<AdminStats />` | H |
| Properties management (view / approve / reject / delete) | `admin.html` | `admin.js` | `admin.css` | `buildings`, `verification_requests` | `<AdminProperties />` | H |
| User profiles management (view / change role) | `admin.html` | `admin.js` | `admin.css` | `profiles` | `<AdminProfiles />` | H |
| Enquiries overview (platform-wide) | `admin.html` | `admin.js` | `admin.css` | `enquiries` | `<AdminEnquiries />` | H |
| Hotel bookings admin (approve / reject) | `admin.html` | `hotel-bookings-admin.js` | `admin.css`, `admin-hotel-bookings.css`, `hotel-bookings.css` | `hotel_bookings` | `<AdminHotelBookings />` | H |
| Agent applications (approve / reject) | `admin.html` | `agents-admin.js` | `admin.css` | `agent_applications`, `profiles` | `<AdminAgents />` | H |
| Reviews moderation (delete / flag) | `admin.html` | `admin.js` | `admin.css` | `reviews` | `<AdminReviews />` | M |
| Economy section | `admin.html` | `admin.js` | `admin.css` | — (placeholder) | `<AdminEconomy />` | L |
| Settings section | `admin.html` | `admin.js` | `admin.css` | `profiles` (admin's own) | `<AdminSettings />` | L |
| Admin auth (login + signup embedded in sidebar) | `admin.html` | `admin.js` (own Supabase client) | `admin.css` | `auth`, `profiles` | Use shared `<AuthModal />` | M |
| Admin navigation sidebar | `admin.html` | `admin.js` | `admin.css` | — | `<AdminSidebar />` | H |

---

## 13. Agent Features

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Agent application form | `be-an-agent.html` | `agent.js` (`submitAgentApplication`) | `style.css` | `agent_applications` (insert), `profiles` (update role) | `<BeAnAgentPage />` | H |
| Agent application status display | `be-an-agent.html` | `agent.js` | `style.css` | `agent_applications` | `<AgentApplicationStatus />` | H |
| Agent gate (pending → redirect) | All pages | `agent-gate.js` | — | `localStorage.roomdhundo_role` (antipattern) | Remove — gate via `AuthProvider` | H |
| Home page agent section | `index.html` | `agent.js` (`renderHomeAgents`) | `style.css` | `profiles` (role=agent) | `<AgentSection />` | M |

---

## 14. Payment (Stub)

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Booking summary display | `payment.html` | Inline `<script>` in `payment.html` | `style.css` | `bookings` (select) | `<PaymentPage />` | L |
| Razorpay payment gateway | `payment.html` | Inline `<script>` (`alert("Payment gateway coming soon")`) | `style.css` | — | `<RazorpayCheckout />` (not implemented) | L |

---

## 15. Static / Utility Pages

| Feature | HTML File(s) | JS File(s) | CSS File(s) | Supabase Tables | Proposed React Component(s) | Priority |
|---------|-------------|-----------|------------|-----------------|----------------------------|----------|
| Policies page (ToS, privacy, payment policy) | `policies.html` | None | `style.css`, `rd-contrast.css` | — | `<PoliciesPage />` | L |
| Auth callback handler | `auth-callback.html` | `script.js` (loads and runs `consumeOAuthRedirect`) | — | `auth.getSession`, `profiles` | `<AuthCallbackPage />` at `/auth/callback` | H |
| Login page (standalone) | `login.html` | `script.js` | `style.css` | `auth` | Redirect to home with `<AuthModal />` open, or `<LoginPage />` | M |
| Signup page (standalone) | `signup.html` | `script.js` | `style.css` | `auth`, `profiles` | Redirect to home with `<AuthModal />` open, or `<SignupPage />` | M |
| Reset password page | `reset-password.html` | `script.js` (`wireResetPasswordForm`) | `style.css` | `auth.updateUser` | `<ResetPasswordPage />` | H |

---

## 16. Cross-Cutting Utilities (Global JS → React Equivalents)

| Current Global | Location | React Equivalent |
|---------------|----------|-----------------|
| `window.supabaseClient` | `script.js`, duplicated in `admin.js`, `hotel-bookings-admin.js`, etc. | Singleton `supabaseClient` exported from `src/lib/supabase.ts` |
| `window.getSignedInUser` | `script.js` | `useAuth()` hook from `AuthProvider` |
| `window.getCurrentUser` | `script.js` | `useAuth()` hook |
| `window.fetchProfileRole` | `script.js` | `useAuth()` hook (role cached in context) |
| `window.updateNavForUser` | `script.js` | `<Navbar />` reads from `useAuth()` |
| `window.isAdminEmail` | `script.js` | Remove — use DB role |
| `window.roomdhundoLocation` | `location.js` | `useHub()` context provider |
| `window.listingMetaFromBuilding` | `script.js` | Utility function in `src/lib/buildingUtils.ts` |
| `window.hotelHasMeal` / `window.hotelMealPrice` / `window.hotelHasBreakfast` | `script.js` | Utility functions in `src/lib/hotelUtils.ts` |
| `window.initHotelStay` | `hotel-booking.js` | Encapsulated in `<HotelBookingForm />` |
| `window.applyFlatGalleryUploads` / `window.collectFlatGalleryMedia` / `window.hydrateFlatListing` / `window.validateFlatListing` / `window.syncFlatListingHiddenFields` | `flat-listing.js` | Encapsulated in `<ListFlatPage />` / `useFlatListing()` hook |
| `window.collectHotelGalleryMedia` / `window.hydrateHotelListing` / `window.validateHotelListing` / `window.syncHotelListingHiddenFields` | `hotel-listing.js` | Encapsulated in `<ListHotelPage />` / `useHotelListing()` hook |
| `window.formatTime12h` | `script.js` | Utility in `src/lib/timeUtils.ts` |

---

*Document created during Phase 1 Audit. Do not modify application source files during this phase.*

