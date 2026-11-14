# Roomdhundo — Target System Architecture

**Document Version:** 1.4.0 (Phase 6: User Dashboard & Renter Experience Architecture)  
**Author:** Senior React Architect & Full-Stack Migration Engineer  
**Branch:** `migration/react-vite`  
**Active Stack:** React 19, Vite 5, React Router DOM 7, Supabase JS v2, Leaflet 1.9, Tailwind CSS v4

---

## 1. Architectural Philosophy & Coexistence Guarantee

The migration preserves the entire legacy Vanilla HTML/CSS/JS application inside [`files6.0/`](file:///d:/Projects/roomdhundo/files6.0/) throughout all migration phases. This ensures:
1. **Zero Downtime Risk:** The legacy codebase remains untouched as a full rollback reference.
2. **Side-by-Side Comparison:** Any screen or interaction in React can be verified against the corresponding legacy implementation in `files6.0/`.
3. **Repository Root Target:** The React + Vite SPA is rooted at the repository root (`/`), with its production build output directed to `dist/`.
4. **URL Compatibility:** All historic `.html` URLs, dynamic query parameters (`?q=`, `?stay=`, `?type=`, `?min=`, `?max=`, `?sort=`, `?hub=`, `?id=`, `?room=`), and hash fragments (`#payment`, `#privacy`) are fully preserved via client-side redirection shims.

---

## 2. Directory Structure

```
d:\Projects\roomdhundo\
├── .env.example                 # Template for required environment variables
├── .gitignore                   # Ignores node_modules, dist, .env, and local artifacts
├── index.html                   # Vite SPA HTML entry point (with sync theme init & Leaflet CSS)
├── vite.config.js               # Vite 5 + React plugin config (Rollup code-split manualChunks)
├── package.json                 # Project manifest with npm scripts & dependencies
├── package-lock.json            # Deterministic dependency lockfile
├── vercel.json                  # SPA rewrite configuration
├── ARCHITECTURE.md              # System architecture reference (this document)
├── audit\                       # Phase 1 Codebase Audit Suite (6 documents)
├── files6.0\                    # ORIGINAL APPLICATION (Preserved intact — Read-Only)
├── tests\                       # Automated test suite (node --test, 27 tests)
│   ├── auth-system.test.js      # Auth service & role normalization tests
│   ├── routing-and-pages.test.js# URL builders, computed fields, distance, room logic
│   ├── supabase-client-init.test.js
│   ├── supabase-services.test.js
│   └── user-dashboard.test.js   # User profile, saved properties, enquiry calculations
└── src\
    ├── components\
    │   ├── auth\
    │   │   ├── ProtectedRoute.jsx   # Route guard enforcing authentication & roles
    │   │   └── PublicOnlyRoute.jsx  # Route guard redirecting authenticated users
    │   ├── common\
    │   │   ├── EmptyState.jsx       # Reusable accessible empty results state
    │   │   ├── Footer.jsx           # Site footer (branding, 10% fee notice, Instagram, policies)
    │   │   ├── Header.jsx           # Global navbar (brand, hub picker, links, theme, auth state)
    │   │   ├── LoadingState.jsx     # Reusable accessible loading spinner
    │   │   └── RatingStars.jsx      # Dynamic star rating display with review count
    │   ├── property\
    │   │   ├── ContactOwnerModal.jsx# "Pg Dhundo Connect" enquiry submission modal
    │   │   ├── PropertyCard.jsx     # Listing card (image, rating, price, badges, save toggle)
    │   │   ├── PropertyGallery.jsx  # Hero photo carousel with prev/next & thumbnail strip
    │   │   ├── PropertyGrid.jsx     # Responsive grid of property cards
    │   │   └── PropertyMap.jsx      # Leaflet map with OpenStreetMap tiles & property marker
    │   ├── search\
    │   │   ├── SearchBar.jsx        # Search input with Monthly/Daily toggle & filter button
    │   │   └── SearchFilters.jsx    # Collapsible filter drawer (budget, type, sharing, amenities)
    │   └── user\
    │       ├── EnquiryCard.jsx      # Enquiry details, status, owner contact action buttons
    │       ├── EnquiryStatusBadge.jsx # Color-coded status badge for enquiries
    │       ├── SavedPropertyCard.jsx# Saved property card with unsave action
    │       ├── UserDashboardHeader.jsx # Greeting, account active indicator
    │       ├── UserProfileSection.jsx # Profile display & safe profile edit modal
    │       └── UserStatCards.jsx    # Quick stat counters (saved, enquiries, account type)
    ├── contexts\
    │   └── AuthContext.jsx      # Centralized reactive authentication state provider
    ├── hooks\
    │   └── useAuth.js           # Ergonomic custom hook consuming AuthContext
    ├── layouts\
    │   └── RootLayout.jsx       # Main application layout (Header, <Outlet />, Footer)
    ├── pages\                   # Route page components
    │   ├── HomePage.jsx         # Homepage (Hero, category tabs, listings, approved agents)
    │   ├── NotFoundPage.jsx     # 404 catch-all view
    │   ├── PoliciesPage.jsx     # Policy view (10% fee, privacy, rules, hash scrolling)
    │   ├── PropertyDetailsPage.jsx # Accommodation details, gallery, map, room types, reviews
    │   ├── SearchPage.jsx       # Search & filter view with URL param synchronization
    │   ├── auth\
    │   │   ├── LoginPage.jsx        # Login screen (roles, Google OAuth, email/pwd)
    │   │   ├── SignupPage.jsx       # Signup screen (roles, Google OAuth, full form)
    │   │   ├── ForgotPasswordPage.jsx # Password recovery request screen
    │   │   ├── ResetPasswordPage.jsx  # New password entry screen
    │   │   └── AuthCallback.jsx     # OAuth exchange & role resolution screen
    │   └── user\
    │       ├── SavedPropertiesPage.jsx # Saved properties grid with unsave capability
    │       ├── UserDashboardPage.jsx # User dashboard (stats, profile, account options, help)
    │       └── UserEnquiriesPage.jsx # User enquiries tracker with filters and stats
    ├── routes\
    │   ├── AppRoutes.jsx        # Centralized route tree with layout nesting & shims
    │   ├── legacyRedirects.jsx  # Redirection shims preserving legacy query parameters
    │   └── paths.js             # Type-safe route path constants and URL builders
    ├── services\                # Centralized backend & API service layer
    │   ├── index.js             # Unified barrel export
    │   ├── auth\
    │   │   └── index.js         # Supabase GoTrue auth, profile synchronization, update profile
    │   ├── supabase\
    │   │   ├── client.js        # Hardened Supabase singleton client with safe fallbacks
    │   │   └── mutationHelpers.js # Data integrity helpers & schema compatibility handler
    │   ├── properties\
    │   │   └── index.js         # Buildings, room types, saved properties, distance
    │   ├── bookings\
    │   │   └── index.js         # Hotel bookings (with unmigrated schema dependency flag)
    │   ├── enquiries\
    │   │   └── index.js         # Tenant enquiries, status tracking, enriched queries
    │   └── storage\
    │       └── index.js         # Property media storage, uploads, and sanitization
    └── styles\
        ├── auth.css             # Authentication card & form styles with WCAG contrast
        ├── main.css             # Global tokens, theme definitions, and base resets
        ├── public.css           # Public page, component, card, and responsive grid styles
        └── user-dashboard.css   # Dashboard, profile, saved properties, and enquiries styles
```

---

## 3. Public Routing & Compatibility Architecture

```mermaid
flowchart TD
    Request["Incoming URL Request"] --> Router{"Route Match"}
    
    Router -->|"/"| HomePage["HomePage (/)]
    Router -->|"/search"| SearchPage["SearchPage (/search)"]
    Router -->|"/property/:id"| PropDetails["PropertyDetailsPage (/property/:id)"]
    Router -->|"/hotel-room/:roomId"| PropDetails
    Router -->|"/policies"| PoliciesPage["PoliciesPage (/policies)"]
    Router -->|"/login, /signup, etc."| AuthRoutes["Auth Flow"]
    
    Router -->|"/dashboard"| UserDash["UserDashboardPage (Protected)"]
    Router -->|"/saved"| UserSaved["SavedPropertiesPage (Protected)"]
    Router -->|"/enquiries"| UserEnq["UserEnquiriesPage (Protected)"]
    
    Router -->|"/search.html"| LegacySearch["LegacySearchRedirect -> /search?params"]
    Router -->|"/property.html?id=..."| LegacyProp["LegacyPropertyRedirect -> /property/:id"]
    Router -->|"/user-dashboard.html"| LegacyDash["Redirect -> /dashboard"]
    Router -->|"/saved.html"| LegacySaved["Redirect -> /saved"]
    Router -->|"/enquiries.html"| LegacyEnq["Redirect -> /enquiries"]
    Router -->|"/index.html, /login.html"| LegacyStatic["Direct Navigate Redirects"]
    Router -->|"/admin.html, /owner-dashboard.html"| Notice["UnmigratedFeatureNotice (Phases 7-8)"]
    Router -->|"Non-matching path"| NotFound["NotFoundPage (404)"]
```

---

## 4. User Dashboard & Renter Experience Architecture

The Phase 6 user experience encompasses three tightly integrated authenticated routes protected by `<ProtectedRoute>`:

1. **User Dashboard (`/dashboard`)**:
   - Greets user by display name and renders account health/active indicator.
   - Summarizes real-time metrics: saved property count and total enquiries sent.
   - Offers safe, non-privileged profile editing (`updateUserProfile`), strictly disallowing `role` modification.
   - Provides account routing cards to Search, Saved Properties, and My Enquiries.
   - Direct support integration through official Pg Dhundo WhatsApp link.
   - Direct session sign-out action with user confirmation.

2. **Saved Properties (`/saved`)**:
   - Queries `saved_buildings` join `buildings`, `room_types`, `reviews` for the authenticated user.
   - Attaches computed fields (`minPrice`, `avgRating`, `location`).
   - Enables one-click unsave/removal with instant state reconciliation.
   - Accessible empty state with redirection to `/search`.

3. **User Enquiries (`/enquiries`)**:
   - Queries `enquiries` table for `user_id = auth.uid()` enriched with property details and owner profiles.
   - Status counters and interactive filter chips: `All`, `Pending`, `Accepted`, `Contacted`, `Rejected`.
   - Actionable owner contacts: When an enquiry status is `accepted` or `contacted`, renders direct `tel:` call and formatted `wa.me` WhatsApp quick-links.

---

## 5. Security Architecture & Privilege Boundaries

- **Client Sanitization:** Client-side registration strictly strips `'admin'` or unauthorized privileged roles from signup metadata. Profile update services (`updateUserProfile`) disallow client modification of `role`.
- **Authoritative Roles:** `public.profiles.role` remains the authoritative role source. React route guards only provide UI-level gating.
- **Backend Vulnerability Notice:** Production deployment remains blocked until database administrators apply the SQL corrections to `public.handle_new_user()` and the `public.profiles` RLS update policy in Postgres.

### 3.1 Legacy Query Parameter Preservation
- `/search.html?q=MAKAUT&stay=daily&type=PG&min=2000&max=5000`: Transparently redirected to `/search?q=MAKAUT&stay=daily&type=PG&min=2000&max=5000`.
- `/property.html?id=building-uuid&room=room-uuid`: Transparently redirected to `/property/building-uuid?room=room-uuid`.
- `/policies.html#payment`: Transparently redirected to `/policies#payment`, with smooth anchor scrolling executed in `PoliciesPage`.

---

## 4. Property Computation & Data Architecture

To maintain 1:1 functional fidelity with `files6.0/script.js` without duplicating business logic inside components, the service layer [`src/services/properties/index.js`](file:///d:/Projects/roomdhundo/src/services/properties/index.js) decorates database rows using `attachComputedFields`:

1. **Rating Aggregation:** Computes `avgRating` from all published reviews or marks as `New listing`.
2. **Dynamic Pricing Bounds:** Scans room types and occupancy options to determine `minPrice`, `maxPrice`, and `minDailyPrice`.
3. **Availability Analysis:** Evaluates `isRoomAvailable` across room sharing tiers to report total available rooms.
4. **Hub Distance:** Calculates straight-line distance via Haversine formula from the active campus hub (`MAKAUT`, `Jaguli`, `Haringhata`).
5. **Couple-Friendly & Amenities:** Evaluates tags and facilities to provide quick badges.

---

## 5. Security Architecture & Outstanding Database Issues

Per the Phase 4 Security Audit:
- **Client Sanitization:** Client-side registration strictly strips `'admin'` or unauthorized privileged roles from signup metadata. Profile update services disallow client modification of `role`.
- **Backend Vulnerability Notice:** Production deployment remains blocked until database administrators apply the SQL corrections to `public.handle_new_user()` and the `public.profiles` RLS update policy in Postgres.
