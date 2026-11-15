# Roomdhundo — Target System Architecture

**Document Version:** 1.6.0 (Phase 8: Admin Management Console & Agent Operations)  
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
├── tests\                       # Automated test suite (node --test, 37 tests)
│   ├── auth-system.test.js      # Auth service & role normalization tests
│   ├── owner-system.test.js     # Owner dashboard, availability, listing wizards & role tests
│   ├── routing-and-pages.test.js# URL builders, computed fields, distance, room logic
│   ├── supabase-client-init.test.js
│   ├── supabase-services.test.js
│   └── user-dashboard.test.js   # User profile, saved properties, enquiry calculations
└── src\
    ├── components\
    │   ├── auth\
    │   │   ├── ProtectedRoute.jsx   # Route guard enforcing authentication & allowedRoles
    │   │   └── PublicOnlyRoute.jsx  # Route guard redirecting authenticated users
    │   ├── common\
    │   │   ├── EmptyState.jsx       # Reusable accessible empty results state
    │   │   ├── Footer.jsx           # Site footer (branding, 10% fee notice, Instagram, policies)
    │   │   ├── Header.jsx           # Global navbar (brand, hub picker, links, theme, auth state)
    │   │   ├── LoadingState.jsx     # Reusable accessible loading spinner
    │   │   └── RatingStars.jsx      # Dynamic star rating display with review count
    │   ├── listings\
    │   │   ├── ImageUploader.jsx    # Drag-and-drop / file selector with previews & validation
    │   │   └── RoomTypeManager.jsx  # Dynamic room types builder with flexible sharing & rates
    │   ├── owner\
    │   │   ├── OwnerEnquiryCard.jsx # Enquiry card with renter details, call/WhatsApp, status actions
    │   │   ├── OwnerProfileSection.jsx # Profile details view and inline contact edit form
    │   │   ├── OwnerPropertyCard.jsx   # Property card with quick status toggle, view/edit/delete
    │   │   ├── OwnerSidebar.jsx     # Navigation sidebar, pending badge, help box & logout
    │   │   ├── OwnerStatCards.jsx   # 4 metric cards (properties, total rooms, avail, occupied)
    │   │   └── RoomAvailabilityTable.jsx # Property selector & room status toggle table
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
    │   ├── listings\
    │   │   ├── FlatListingPage.jsx  # 9-step flat listing wizard with review & submit
    │   │   ├── HotelListingPage.jsx # 3-step hotel wizard with room rates & photos
    │   │   ├── ListingHubPage.jsx   # Property category selection hub (PG, Flat, Hotel)
    │   │   └── PgListingPage.jsx    # PG listing form supporting new & edit modes
    │   ├── owner\
    │   │   └── OwnerDashboardPage.jsx # Owner panel (stats, properties, room table, enquiries, profile)
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
    │   ├── owner\
    │   │   └── index.js         # Owner dashboard data, room toggles, listing save, profile sync
    │   └── storage\
    │       └── index.js         # Property media storage, uploads, and sanitization
    └── styles\
        ├── auth.css             # Authentication card & form styles with WCAG contrast
        ├── main.css             # Global tokens, theme definitions, and base resets
        ├── owner.css            # Owner dashboard, cards, tables, wizard steps & uploaders
        ├── public.css           # Public page, component, card, and responsive grid styles
        └── user-dashboard.css   # Dashboard, profile, saved properties, and enquiries styles
```

---

## 3. Public & Role-Gated Routing Architecture

```mermaid
flowchart TD
    Request["Incoming URL Request"] --> Router{"Route Match"}
    
    Router -->|"/"| HomePage["HomePage (/)]
    Router -->|"/search"| SearchPage["SearchPage (/search)"]
    Router -->|"/property/:id"| PropDetails["PropertyDetailsPage (/property/:id)"]
    Router -->|"/hotel-room/:roomId"| PropDetails
    Router -->|"/policies"| PoliciesPage["PoliciesPage (/policies)"]
    Router -->|"/login, /signup, etc."| AuthRoutes["Auth Flow"]
    
    Router -->|"/dashboard"| UserDash["UserDashboardPage (Protected: All Roles)"]
    Router -->|"/saved"| UserSaved["SavedPropertiesPage (Protected: All Roles)"]
    Router -->|"/enquiries"| UserEnq["UserEnquiriesPage (Protected: All Roles)"]
    
    Router -->|"/owner/dashboard"| OwnerDash["OwnerDashboardPage (Protected: Owner, Admin, Agent)"]
    Router -->|"/list-property"| ListHub["ListingHubPage (Protected: Owner, Admin, Agent)"]
    Router -->|"/list-property/pg"| PgWizard["PgListingPage (Protected: Owner, Admin, Agent)"]
    Router -->|"/list-property/flat"| FlatWizard["FlatListingPage (Protected: Owner, Admin, Agent)"]
    Router -->|"/list-property/hotel"| HotelWizard["HotelListingPage (Protected: Owner, Admin, Agent)"]
    
    Router -->|"/owner-dashboard.html"| LegacyOwner["Redirect -> /owner/dashboard"]
    Router -->|"/list-property.html"| LegacyHub["Redirect -> /list-property"]
    Router -->|"/list-pg.html"| LegacyPg["Redirect -> /list-property/pg"]
    Router -->|"/list-flat.html"| LegacyFlat["Redirect -> /list-property/flat"]
    Router -->|"/list-hotel.html"| LegacyHotel["Redirect -> /list-property/hotel"]
    
    Router -->|"/search.html"| LegacySearch["LegacySearchRedirect -> /search?params"]
    Router -->|"/property.html?id=..."| LegacyProp["LegacyPropertyRedirect -> /property/:id"]
    Router -->|"/user-dashboard.html"| LegacyDash["Redirect -> /dashboard"]
    Router -->|"/saved.html"| LegacySaved["Redirect -> /saved"]
    Router -->|"/enquiries.html"| LegacyEnq["Redirect -> /enquiries"]
    Router -->|"/index.html, /login.html"| LegacyStatic["Direct Navigate Redirects"]
    Router -->|"/admin.html, /be-an-agent.html"| Notice["UnmigratedFeatureNotice (Phase 8)"]
    Router -->|"Non-matching path"| NotFound["NotFoundPage (404)"]
```

---

## 4. User Dashboard & Renter Experience Architecture

The Phase 6 user experience encompasses three authenticated routes protected by `<ProtectedRoute>`:

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

## 5. Owner Dashboard & Property Listing Architecture (Phase 7)

Phase 7 introduces the authenticated property owner and manager experience protected by `<ProtectedRoute allowedRoles={['owner', 'admin', 'agent']}>`:

1. **Owner Dashboard (`/owner/dashboard`)**:
   - **Real-Time Portfolio Metrics:** Total properties, total rooms, available rooms, occupied rooms, and enquiry counts.
   - **Property Cards:** Status badges (`Available`, `Occupied`, `Pending Review`, `Rejected`), room/bed statistics, minimum rent calculation, view/edit links, and individual delete capability with confirmation.
   - **Quick Property Toggle:** Toggles availability across all rooms of a property in one tap.
   - **Room Availability Management:** Property filter dropdown and detailed room type table with immediate `Mark Available` / `Mark Occupied` status actions.
   - **Enquiry Management:** Full enquiry lifecycle (`pending` → `accepted` / `rejected` → `contacted`) with live search by renter name/phone/property, status filter chips, and direct `tel:` and `wa.me` contact buttons.
   - **Owner Profile Synchronization:** Profile name update in `public.profiles` and synchronized phone updates across all properties owned by the user.

2. **Property Listing Hub (`/list-property`)**:
   - Clean category routing hub for PG/Hostel/Room, Flat/Apartment, and Hotel/Guest House.

3. **PG / Room Listing Wizard (`/list-property/pg`)**:
   - Supports both Create and Edit modes (`?edit=<id>`).
   - Basic info, location, facilities chips, custom amenity additions, description, and rules.
   - Dynamic room types manager with bed counts and monthly rent.
   - Image upload pipeline using `ImageUploader` and Supabase Storage bucket `property-images`.

4. **Flat / Apartment Wizard (`/list-property/flat`)**:
   - 9-step structured wizard (Basics, Location, Layout & Size, Pricing, Amenities, Tenant Rules, Photos, Contact, Review & Submit).
   - Submits in `pending` review status for administrative verification.

5. **Hotel / Guest House Wizard (`/list-property/hotel`)**:
   - 3-step structured wizard (Hotel Info & Star Rating, Rooms & Rates with Nightly Pricing, Review & Publish).
   - Supports check-in/out policies and multi-room categories.

---

## 6. Security Architecture & Privilege Boundaries

- **Client Sanitization:** Client-side registration strictly strips `'admin'` or unauthorized privileged roles from signup metadata. Profile update services (`updateUserProfile` and `updateOwnerProfile`) disallow client modification of `role`.
- **Role Verification:** Listing wizards and owner dashboard routes are strictly protected by `<ProtectedRoute allowedRoles={['owner', 'admin', 'agent']}>`. Standard renters (`role = 'renter'`) are blocked and redirected.
- **Data Scoping:** All owner queries and mutations (`buildings`, `room_types`, `enquiries`) are strictly scoped to `created_by = auth.uid()` or `owner_id = auth.uid()`.
- **Backend Vulnerability Notice:** Production deployment remains blocked until database administrators apply the SQL corrections to `public.handle_new_user()` and the `public.profiles` RLS update policy in Postgres.

---

## 6. Admin Management Console & Agent Operations Architecture (Phase 8)

Phase 8 implements the complete platform management console and agent operations workflow:

1. **Strict Database-Backed Role Authorization (`/admin/*`)**:
   - Gated behind `<ProtectedRoute allowedRoles={['admin']}>`.
   - Authorization relies exclusively on `public.profiles.role === 'admin'`. Client-side `localStorage` tokens and unverified metadata are strictly rejected.
   - Non-admin users attempting to access `/admin` or sub-routes are redirected to the homepage or login.

2. **Admin Console Navigation & Layout (`src/layouts/AdminLayout.jsx`)**:
   - **Sidebar Navigation (`<AdminSidebar />`)**: Direct links to Dashboard, Properties, Users, Agents, Enquiries, Reviews, Economy, and Settings. Includes "View Website" link and secure signout.
   - **Admin Header (`<AdminHeader />`)**: Mobile sidebar toggle, page heading, and admin profile pill with avatar and "Administrator" badge.

3. **Sub-Modules & Domain Services (`src/services/admin/adminService.js`)**:
   - **Dashboard Overview (`/admin`)**: Aggregated metric cards (`<AdminStatCards />`) covering total properties, verified properties, pending moderation, users, owners, agents, enquiries, and reviews. Highlights pending listings awaiting administrative review.
   - **Property Moderation (`/admin/properties`)**: Full inventory table with filters for verification status (`all`, `pending`, `approved`, `rejected`), property type (`all`, `pg`, `hotel`, `flat`), and search by name/location. Direct actions: Approve (sets `listing_status = 'published'`, `verification_status = 'approved'`), Reject (sets `listing_status = 'rejected'`, `verification_status = 'rejected'`), View, and Delete.
   - **User Directory (`/admin/profiles`)**: Searchable user list with role filters (`all`, `user`, `owner`, `agent`, `admin`). Displays full name, email, phone, role badges, user ID, and registration date.
   - **Agent Applications Moderation (`/admin/agents`)**: Lists prospective agent applications from `agent_applications`. Displays applicant name, contact info, operating location, and PIN code. Direct Approve action updates `agent_applications.status = 'approved'` and promotes `profiles.role = 'agent'`. Reject action marks application rejected and resets `profiles.role = 'user'`.
   - **Enquiry Tracking (`/admin/enquiries`)**: Platform-wide enquiry monitoring with status filtering (`all`, `pending`, `accepted`, `rejected`, `contacted`). Interactive dropdown allows immediate status updates.
   - **Review Moderation (`/admin/reviews`)**: Moderation table displaying property, reviewer, star rating, feedback text, and date with one-click deletion of inappropriate content.
   - **Economy Deals Monitoring (`/admin/economy`)**: Live view of economy deals and promotional listings.
   - **Settings & Security Audit (`/admin/settings`)**: Displays admin profile information, platform version, active Supabase URL, and security posture notes regarding backend RLS rules.

4. **Agent Application Workflow (`/be-an-agent`)**:
   - Publicly accessible page with role-aware submission form.
   - Client-side validation: 10-digit mobile number regex, 6-digit PIN code regex, valid email format, and required location.
   - Logged-in applicants have their status checked on load: if pending, an informative waiting card is displayed (`"Your application is currently being reviewed by the Pg Dhundo administration team"`).
   - Upon submission, upserts record to `agent_applications` and updates applicant's `profiles.role = 'agent_pending'`.

