# Migration Audit — Roomdhundo

> **Phase:** 1 (Audit)  
> **Date:** 2026-11-07  
> **Status:** Complete  
> **Auditor:** Antigravity (AI Senior Software Architect)

---

## 1. Current Architecture

Roomdhundo is a **multi-page static web application** served through Vercel CDN. There is no server-side rendering, no Node.js backend, no bundler, and no module system in the main application. All interactivity is handled through Vanilla JavaScript loaded via `<script>` tags.

### Technology Stack (current)

| Layer | Technology |
|-------|-----------|
| Hosting | Vercel (static CDN, no serverless functions) |
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2022, no bundler) |
| Supabase | JavaScript CDN UMD build via jsDelivr (`@supabase/supabase-js@2`) |
| Map | Leaflet 1.9.4 (CDN, unpkg) |
| CSS build | Tailwind CSS v4 CLI (compile-time only, not at runtime) |
| Fonts | Google Fonts (Inter) |
| Icons | Font Awesome 6.5.2 (CDN) |
| Analytics | Google Analytics 4 (`G-0TKM9DNE73`, hardcoded in HTML files) |
| Payments | Razorpay (planned but not implemented; stub only) |

---

## 2. Actual Application Root

```
d:\Projects\roomdhundo\
├── index.html          ← REDIRECT SHIM only (meta refresh to ./files6.0/index.html)
├── package.json        ← Tailwind v4 build scripts only; no runtime dependencies
├── package-lock.json   ← Tailwind CLI + PostCSS only
├── vercel.json         ← Rewrites all /* to /files6.0/*
├── .gitignore
├── README.md           ← Minimal (just "# roomdhundo")
│
└── files6.0/           ← TRUE APPLICATION ROOT (all source here)
    ├── *.html          ← 20 HTML pages
    ├── *.js            ← 16 JavaScript files
    ├── *.css           ← 11 CSS files (compiled outputs)
    └── src/            ← Tailwind input sources (legacy CSS)
        ├── *.input.css
        └── legacy-*.css
```

**The root `index.html` is NOT the application entry point.** It is only a redirect shim. The true application root is `files6.0/`.

---

## 3. Application Entry Points

| Entry Point | Purpose |
|-------------|---------|
| `files6.0/index.html` | Home / listings page (primary user entry) |
| `files6.0/admin.html` | Admin dashboard (admin-only) |
| `files6.0/owner-dashboard.html` | Owner dashboard |
| `files6.0/user-dashboard.html` | Renter dashboard |
| `files6.0/auth-callback.html` | Google OAuth redirect target |

---

## 4. Existing Dependencies

### Runtime (CDN-loaded, not bundled)

```
@supabase/supabase-js@2    — jsDelivr UMD (loaded on every page that needs Supabase)
leaflet@1.9.4              — unpkg (loaded on property.html, list-property.html, list-pg.html, list-hotel.html)
Font Awesome 6.5.2         — cdnjs (owner-dashboard.html, enquiries.html)
Google Fonts (Inter)       — fonts.googleapis.com (owner-dashboard.html)
```

### Build-time only

```
tailwindcss@^4             — CLI compiles src/*.input.css → *.css at build time
                              (NOT shipped to browser; compiled CSS is committed)
```

### No npm runtime packages.

---

## 5. Technical Debt

| Item | Severity | Description |
|------|----------|-------------|
| Supabase anon key duplicated 8+ times | High | Same key hardcoded in `admin.js`, `script.js`, `hotel-booking.js`, `hotel-bookings-admin.js`, `hotel-bookings-owner.js`, `hotel-bookings-user.js`, `agents-admin.js`, `payment.html` |
| Admin email hardcoded | High | `roomdhundo18@gmail.com` hardcoded in `script.js` as `ADMIN_EMAIL` constant |
| Role cached in localStorage | Medium | `localStorage.roomdhundo_role` is the basis for early-redirect logic in `agent-gate.js` before Supabase auth resolves |
| Global variable coupling | High | All JS files communicate through `window.supabaseClient`, `window.getSignedInUser`, `window.fetchProfileRole`, `window.initHotelStay`, `window.roomdhundoLocation`, etc. |
| `innerHTML` DOM injection | Medium | Most JS files use template literals injected via `innerHTML`; XSS risk mitigated by custom `esc()` / `escapePropertyHtml()` helpers but not DOMPurify |
| Duplicate Supabase client initialization | Medium | Several files create their own `supabaseClient` if the global is absent (defensive pattern, but causes multiple client instances) |
| `script.js` size (6,637 lines) | Medium | Monolithic God file; handles auth, home page, search, property detail, enquiries, saved, theme, chatbot, hub system, hotel utilities |
| `admin.js` size (10,173 lines) | Medium | Very large admin dashboard; all admin sections in one file |
| Razorpay payment is a stub | Medium | `payment.html` exists but payment gateway is not implemented |
| `alert()` used for user feedback | Low | Multiple `alert()` calls for success/error messages throughout `script.js` |
| `mobile.css` duplicates | Low | Mobile breakpoints split between `src/mobile.css` and media queries inside each `legacy-*.css` |
| Inline `<style>` blocks | Low | `list-property.html` and several other pages have page-specific styles in `<style>` tags rather than external CSS files |
| Theme init duplicated | Low | Dark/light theme init logic duplicated in inline `<script>` blocks in `owner-dashboard.html`, `user-dashboard.html`, `enquiries.html` instead of a shared script |

---

## 6. Security Observations

> **Note:** Supabase anon keys are **not secret** by design — they are safe to expose client-side. However, duplication is a maintenance risk. The actual access control enforcement is Supabase Row Level Security (RLS).

| Concern | File(s) | Risk | Notes |
|---------|---------|------|-------|
| Anon key duplicated 8+ times | Multiple JS files | Low (anon key is public) | Creates maintenance debt; should use a single shared config |
| Admin email hardcoded | `script.js` | Medium | If email changes, every JS file referencing it must be updated |
| Frontend-only role guard (`agent-gate.js`) | `agent-gate.js` | Medium | Trusts `localStorage.roomdhundo_role` before Supabase resolves; bypassable via DevTools |
| Frontend-only listing page guard | `script.js` (`restrictListPropertyPageForRenters`) | Low | Renter blocked in UI only; RLS is the real enforcement |
| Admin page has no server-side auth redirect | `admin.html` | Medium | Admin dashboard does client-side admin check; a renter navigating to admin.html will see a login prompt, not a 403 |
| `innerHTML` with custom escape helper | Multiple files | Low-Medium | No DOMPurify; relies on custom `esc()`/`escapePropertyHtml()` functions |
| Google Analytics ID in source | Multiple HTML files | Informational | `G-0TKM9DNE73` — not a secret |
| Instagram social link | Multiple HTML files | Informational | Public URL |

---

## 7. Deployment Architecture

```
GitHub (source)
    │
    ▼
Vercel (static CDN)
    │
    ├── vercel.json rewrites:
    │   ├── /auth/callback → /files6.0/auth-callback.html
    │   └── /*            → /files6.0/:path*
    │
    └── Static assets served from files6.0/
```

### Key vercel.json settings

```json
{
  "cleanUrls": false,       — .html extensions preserved in URLs
  "trailingSlash": false,   — no trailing slash added
  "rewrites": [...]         — all routes point into files6.0/
}
```

### Impact on React migration

- React SPA requires a single rewrite rule: `/* → /index.html`
- Current `.html` extension URLs must be preserved OR HTTP redirects provided for SEO/bookmarks
- No environment variables are currently stored in Vercel; they will need to be added for Supabase URL and anon key

---

## 8. Overall Migration Assessment

| Area | Assessment |
|------|-----------|
| Architecture complexity | **Medium** — large codebase but no exotic patterns |
| Supabase integration | **Well-suited for React** — same JS SDK works; queries need wrapping in hooks |
| Auth migration risk | **Medium** — Google OAuth callback URL and session handling need careful porting |
| CSS migration risk | **High** — 116KB `style.css` with no component structure; will need systematic porting |
| Business logic preservation | **Medium** — most logic is in `script.js`; must be split into components without breaking it |
| Deployment risk | **Low** — Vercel supports React/Vite natively; just need to update `vercel.json` |
| Payment | **Low risk** — Razorpay is a stub; can be reimplemented in React as a future feature |

