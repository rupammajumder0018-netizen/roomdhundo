# Roomdhundo — Target System Architecture

**Document Version:** 1.2.0 (Phase 4: Authentication System Architecture)  
**Author:** Senior React & Supabase Authentication Engineer  
**Branch:** `migration/react-vite`  
**Active Stack:** React 19, Vite 5, React Router DOM 7, Supabase JS v2, Tailwind CSS v4

---

## 1. Architectural Philosophy & Coexistence Guarantee

The migration preserves the entire legacy Vanilla HTML/CSS/JS application inside [`files6.0/`](file:///d:/Projects/roomdhundo/files6.0/) throughout all migration phases. This ensures:
1. **Zero Downtime Risk:** The legacy codebase remains untouched as a full rollback reference.
2. **Side-by-Side Comparison:** Any screen or interaction in React can be verified against the corresponding legacy implementation in `files6.0/`.
3. **Repository Root Target:** The React + Vite SPA is rooted at the repository root (`/`), with its production build output directed to `dist/`.

---

## 2. Directory Structure

```
d:\Projects\roomdhundo\
├── .env.example                 # Template for required environment variables
├── .gitignore                   # Ignores node_modules, dist, .env, and local artifacts
├── index.html                   # Vite SPA HTML entry point with synchronous theme init
├── vite.config.js               # Vite 5 + React plugin configuration (with code-split manualChunks)
├── package.json                 # Project manifest with npm scripts & dependencies
├── package-lock.json            # Deterministic dependency lockfile
├── vercel.json                  # Deployment routing and legacy fallback configuration
├── ARCHITECTURE.md              # System architecture reference (this document)
├── audit\                       # Phase 1 Codebase Audit Suite (6 documents)
├── files6.0\                    # ORIGINAL APPLICATION (Preserved intact — Read-Only)
├── public\
│   └── assets\                  # Static assets served as-is by Vite
├── tests\                       # Non-destructive automated test suite (node --test)
│   ├── auth-system.test.js      # Auth service & role normalization tests
│   ├── supabase-client-init.test.js
│   └── supabase-services.test.js
└── src\
    ├── assets\                  # Bundled images, SVGs, and media
    ├── components\
    │   └── auth\
    │       ├── ProtectedRoute.jsx   # Route guard enforcing authentication & roles
    │       └── PublicOnlyRoute.jsx  # Route guard redirecting authenticated users
    ├── contexts\
    │   └── AuthContext.jsx      # Centralized reactive authentication state provider
    ├── hooks\
    │   └── useAuth.js           # Ergonomic custom hook consuming AuthContext
    ├── layouts\                 # Master layouts (RootLayout, DashboardLayout, AdminLayout)
    │   └── RootLayout.jsx       # Global header (reactive auth status), theme toggle, <Outlet />, footer
    ├── pages\                   # Route page components
    │   ├── HomePage.jsx         # Foundation home view
    │   ├── NotFoundPage.jsx     # 404 catch-all view
    │   └── auth\
    │       ├── LoginPage.jsx        # Login screen (roles, Google OAuth, email/pwd)
    │       ├── SignupPage.jsx       # Signup screen (roles, Google OAuth, full form)
    │       ├── ForgotPasswordPage.jsx # Password recovery request screen
    │       ├── ResetPasswordPage.jsx  # New password entry screen
    │       └── AuthCallback.jsx     # OAuth exchange & role resolution screen
    ├── services\                # Centralized backend & API service layer
    │   ├── index.js             # Unified barrel export
    │   ├── auth\
    │   │   └── index.js         # Supabase GoTrue auth & profile synchronization
    │   ├── supabase\
    │   │   ├── client.js        # Hardened Supabase singleton client with safe fallbacks
    │   │   └── mutationHelpers.js # Data integrity helpers & schema compatibility handler
    │   ├── properties\
    │   │   └── index.js         # Buildings, room types, saved properties, reviews
    │   ├── bookings\
    │   │   └── index.js         # Hotel bookings (with unmigrated schema dependency flag)
    │   ├── enquiries\
    │   │   └── index.js         # Renter enquiries (reconciling building_id/property_id)
    │   └── storage\
    │       └── index.js         # Property media uploads (property-images bucket)
    ├── styles\
    │   ├── main.css             # Theme variables (--rd-*), reset, and layout shell styles
    │   └── auth.css             # High-contrast auth screens, role pickers, Google OAuth styles
    ├── utils\                   # Pure utility functions (formatting, date, rules)
    ├── App.jsx                  # Master React Router route definitions & AuthProvider mount
    └── main.jsx                 # React root mount (StrictMode + BrowserRouter)
```

---

## 3. Technology Stack & Decision Matrix

| Layer | Selection | Justification |
|-------|-----------|---------------|
| **Core Framework** | React 19 (`react`, `react-dom`) | Modern component lifecycle, declarative rendering, robust ecosystem. |
| **Language** | JavaScript (JSX) | Strict requirement: no TypeScript complexity overhead during initial migration. |
| **Build Tool & Dev Server** | Vite 5 (`vite`, `@vitejs/plugin-react`) | Sub-second HMR, native ES modules, optimized Rollup production bundling to `dist/`. |
| **Client-Side Routing** | React Router DOM v7 (`react-router-dom`) | Declarative nested routing, route parameters, layout outlets, history management. |
| **Backend Integration** | `@supabase/supabase-js` v2 | Official client for PostgreSQL queries, GoTrue Auth, and Storage bucket interactions. |
| **CSS & Theming** | CSS Custom Properties + Tailwind v4 | Preserves existing `--rd-*` design tokens and prevents style conflicts. |
| **Automated Testing** | Node.js Test Runner (`node:test`, `node:assert`) | Built-in, zero-dependency, sub-second ESM testing for services and client behavior. |

---

## 4. Supabase Client Integration

The Supabase client is centralized in [`src/services/supabase/client.js`](file:///d:/Projects/roomdhundo/src/services/supabase/client.js):

- **Environment-Driven:** Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env` with `process.env` fallback for automated tests.
- **Validation:** Emits a non-crashing warning if credentials are omitted. Exports `isSupabaseConfigured` boolean and `getSupabase()` getter.
- **Singleton Guarantee:** A single client instance is created at module evaluation and reused everywhere.
- **Security:** Zero hardcoded keys or URLs. Never exposes service-role keys.
- **Browser Compatibility:** Configured with `persistSession: true`, `autoRefreshToken: true`, and `detectSessionInUrl: true`.

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

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
```

---

## 5. Service Layer & Data Integrity Architecture

The React service layer isolates all Supabase database queries and storage operations into domain modules:

1. **`src/services/properties/index.js`**:
   - Encapsulates reads and writes for `buildings`, `room_types`, `saved_buildings`, and `reviews`.
   - Never crashes when Supabase is unconfigured; returns `{ data: null, error }`.
2. **`src/services/bookings/index.js`**:
   - Manages `hotel_bookings` workflow (create, fetch by user/owner, status transition).
   - Flagged with architectural notice: `hotel_bookings` is an unmigrated table missing from repository SQL files.
3. **`src/services/enquiries/index.js`**:
   - Handles tenant enquiry submissions and status updates.
   - Reconciles historical divergence between `schema.sql` (`building_id`) and active JS queries (`property_id`, `owner_id`).
4. **`src/services/storage/index.js`**:
   - Validates and uploads media to the verified `property-images` bucket.
   - Enforces 5 MB image and 50 MB video limits and generates standardized paths: `${userId}/${timestamp}-${index}-${safeFileName}`.
   - Confirms that legacy code contained no storage file deletion logic.
5. **`src/services/supabase/mutationHelpers.js` (Legacy Helper Migration)**:
   - Investigated legacy helper `supabaseMutateWithoutUnknownColumns` which silently stripped columns on schema mismatches up to 16 times.
   - Modernized behavior: Aborts and logs prominent errors to preserve data integrity by default. Requires explicit `{ allowStripping: true }` opt-in if legacy fallback is needed.

---

## 5. Visual Theme Architecture (Flash-Free Dark/Light Mode)

To prevent Flash of Unstyled Content (FOUC) when loading in dark mode:
1. **Pre-DOM Theme Script:** [`index.html`](file:///d:/Projects/roomdhundo/index.html) contains a synchronous `<script>` in the `<head>`:
   ```html
   <script>
     (function () {
       try {
         var saved = localStorage.getItem("roomdhundo-theme");
         document.documentElement.dataset.theme = saved || "light";
       } catch (e) {}
     })();
   </script>
   ```
2. **CSS Custom Properties:** [`src/styles/main.css`](file:///d:/Projects/roomdhundo/src/styles/main.css) defines variables on `html[data-theme="light"]` and `html[data-theme="dark"]`:
   - `--rd-bg`: Background color (`#eefaf4` light / `#102a3a` dark)
   - `--rd-surface`: Card & header surfaces (`#ffffff` light / `#16384e` dark)
   - `--rd-text`: Text color (`#22577A` light / `#e9fff3` dark)
   - `--rd-accent`: Primary brand accent (`#38A3A5` light / `#57CC99` dark)
   - `--rd-border`: Structural borders (`#c6ead9` light / `#2b5d72` dark)
3. **React State Synchronization:** `RootLayout.jsx` reads `localStorage` on mount and updates both `document.documentElement.dataset.theme` and `localStorage` whenever toggled.

---

## 6. Authentication & Authorization Architecture

Phase 4 establishes a centralized, reactive authentication architecture:

### 6.1 State Management (`AuthContext.jsx`)
- **Reactive Subscription:** Subscribes to `supabase.auth.onAuthStateChange` with automatic subscription cleanup.
- **Session Restoration:** Restores active sessions synchronously via `supabase.auth.getSession()` on app boot.
- **Flicker-Free Initialization:** `isLoading` remains `true` until session check and database profile load complete.
- **Race Condition Prevention:** Guards asynchronous profile loading using user ID references.

### 6.2 Trusted Role Management
- **Zero LocalStorage Trust:** Completely eliminates the legacy vulnerability where `localStorage.roomdhundo_role` could be tampered with or become desynchronized.
- **Authoritative Database Source:** The user's role is strictly queried from `public.profiles.role` using the authenticated session.
- **Zero Hardcoded Admin Emails:** Removes hardcoded checks like `ADMIN_EMAIL = "roomdhundo18@gmail.com"`. Admin access is verified through database RLS policies (`public.is_admin()`) and `profile.role === 'admin'`.
- **Supported Roles:** `'user'`, `'owner'`, `'admin'`, `'agent'`, `'agent_pending'`.

### 6.3 Route Guards
- **`ProtectedRoute.jsx`:** Blocks unauthenticated requests, preserves the intended redirect URL in `location.state.from`, and enforces optional `allowedRoles` (e.g. `['admin']` or `['owner']`).
- **`PublicOnlyRoute.jsx`:** Prevents authenticated users from seeing login/signup screens, redirecting them back to their dashboard or previous location.

### 6.4 Google OAuth & Password Recovery
- **OAuth Flow:** Uses Supabase `signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`. Preserves selected role intent in `sessionStorage` and validates role compatibility on callback.
- **Password Reset:** Standard two-step flow: `sendPasswordResetEmail(email)` sends a recovery link pointing to `/reset-password`, where `updateUserPassword(newPassword)` commits the new credentials.

---

## 7. Routing & Navigation Strategy

### Current Foundation Routes
- `/` → `HomePage.jsx` (Status overview & test links)
- `*` → `NotFoundPage.jsx` (404 handler)

### Proposed Full Route Structure (Subsequent Phases)
```jsx
<Routes>
  <Route element={<RootLayout />}>
    {/* Public Routes */}
    <Route path="/" element={<HomePage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/property/:id" element={<PropertyDetailPage />} />
    <Route path="/policies" element={<PoliciesPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />

    {/* Authenticated User Routes */}
    <Route element={<RequireAuth />}>
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/dashboard" element={<UserDashboardPage />} />
      <Route path="/enquiries" element={<EnquiriesPage />} />
      <Route path="/be-an-agent" element={<BeAnAgentPage />} />
      <Route path="/payment" element={<PaymentPage />} />

      {/* Owner / Agent / Admin Routes */}
      <Route element={<RequireRole roles={['owner', 'agent', 'admin']} />}>
        <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
        <Route path="/list-property" element={<ListPropertyHubPage />} />
        <Route path="/list-property/pg" element={<ListPgPage />} />
        <Route path="/list-property/flat" element={<ListFlatPage />} />
        <Route path="/list-property/hotel" element={<ListHotelPage />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<RequireRole roles={['admin']} />}>
        <Route path="/admin/*" element={<AdminPortalPage />} />
      </Route>
    </Route>

    {/* Legacy .html Backlink Compatibility Shims */}
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
    <Route path="/payment.html" element={<Navigate to="/payment" replace />} />
    <Route path="/policies.html" element={<Navigate to="/policies" replace />} />

    {/* 404 Catch-All */}
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```

---

## 7. Vercel Deployment & URL Strategy

### Transition Path
During Phase 2, `files6.0/` remains available. When preparing for production cutover in Phase 10:
1. Set Vercel Project Output Directory to `dist/`.
2. Update `vercel.json` to handle client-side routing while forwarding any unmigrated asset requests:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. Maintain legacy `.html` redirects within React Router to preserve bookmarks, WhatsApp links, and search engine indexation.

