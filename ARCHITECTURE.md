# Roomdhundo — Target System Architecture

**Document Version:** 1.0.0 (Phase 2: React + Vite Foundation)  
**Author:** Senior React Architect  
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
├── vite.config.js               # Vite 5 + React plugin configuration
├── package.json                 # Project manifest with npm scripts & dependencies
├── package-lock.json            # Deterministic dependency lockfile
├── vercel.json                  # Deployment routing and legacy fallback configuration
├── ARCHITECTURE.md              # System architecture reference (this document)
├── audit\                       # Phase 1 Codebase Audit Suite (6 documents)
├── files6.0\                    # ORIGINAL APPLICATION (Preserved intact — Read-Only)
├── public\
│   └── assets\                  # Static assets served as-is by Vite
└── src\
    ├── assets\                  # Bundled images, SVGs, and media
    ├── components\              # Reusable presentational & layout components
    ├── contexts\                # React contexts (AuthContext, ThemeContext, LocationContext)
    ├── hooks\                   # Custom React hooks (useAuth, useTheme, useProperties)
    ├── layouts\                 # Master layouts (RootLayout, DashboardLayout, AdminLayout)
    │   └── RootLayout.jsx       # Global header, theme toggle, <Outlet />, and footer
    ├── pages\                   # Route page components
    │   ├── HomePage.jsx         # Foundation home view
    │   └── NotFoundPage.jsx     # 404 catch-all view
    ├── services\
    │   └── supabase\
    │       └── client.js        # Centralized, validated Supabase singleton client
    ├── styles\
    │   └── main.css             # Theme variables (--rd-*), reset, and layout shell styles
    ├── utils\                   # Pure utility functions (formatting, date, rules)
    ├── App.jsx                  # Master React Router route definitions
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

---

## 4. Supabase Client Integration

The Supabase client is centralized in [`src/services/supabase/client.js`](file:///d:/Projects/roomdhundo/src/services/supabase/client.js):

- **Environment-Driven:** Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`.
- **Validation:** Logs a clear, non-crashing warning if credentials are not configured in `.env.local`.
- **Singleton Guarantee:** A single client instance is created and exported. No duplicate clients are initialized.
- **Security:** Zero hardcoded keys or URLs. Never exposes service-role keys.

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Roomdhundo] Supabase environment variables are missing.");
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;
```

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

## 6. Routing & Navigation Strategy

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

