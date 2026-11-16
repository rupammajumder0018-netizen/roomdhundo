# Roomdhundo Application Architecture

This document describes the architectural principles, component structure, data flows, and security model implemented in the Roomdhundo platform.

---

## 1. System Architecture Overview

Roomdhundo is structured as a decoupled Single-Page Application (SPA) communicating directly with Supabase managed services via PostgREST and the Supabase JavaScript Client.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 React 18 SPA (Vite)                 │   │
│   │                                                     │   │
│   │  ┌───────────────┐  ┌───────────────┐  ┌─────────┐  │   │
│   │  │ Pages/Views   │  │ Components    │  │ Hooks   │  │   │
│   │  └───────┬───────┘  └───────┬───────┘  └────┬────┘  │   │
│   │          │                  │               │       │   │
│   │          ▼                  ▼               ▼       │   │
│   │      ┌──────────────────────────────────────────┐   │   │
│   │      │         React Contexts (State)           │   │   │
│   │      │    - AuthContext (Session, User, Role)   │   │   │
│   │      │    - UIStateContext (Modals, Toasts)     │   │   │
│   │      └────────────────────┬─────────────────────┘   │   │
│   │                           │                         │   │
│   │                           ▼                         │   │
│   │      ┌──────────────────────────────────────────┐   │   │
│   │      │              Service Layer               │   │   │
│   │      │  - auth/          - properties/          │   │   │
│   │      │  - owner/         - bookings/            │   │   │
│   │      │  - admin/         - storage/             │   │   │
│   │      └────────────────────┬─────────────────────┘   │   │
│   └───────────────────────────┼─────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────┘
                                │ HTTPS / WSS
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Cloud                         │
│                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │      GoTrue Auth        │   │    PostgREST Gateway    │  │
│  │ (JWT, OAuth, Sessions)  │   │ (Row Level Security)    │  │
│  └────────────┬────────────┘   └────────────┬────────────┘  │
│               │                             │               │
│               ▼                             ▼               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PostgreSQL 15 Database                   │  │
│  │                                                       │  │
│  │  - public.profiles       - public.buildings           │  │
│  │  - public.room_types     - public.hotel_bookings      │  │
│  │  - public.enquiries      - public.agent_applications  │  │
│  │  - public.reviews        - public.saved_buildings     │  │
│  │                                                       │  │
│  │  Triggers:                                            │  │
│  │  - trg_protect_profile_roles (Anti-Escalation)        │  │
│  │  - trg_protect_building_status (Anti-Self-Approve)    │  │
│  │  - on_auth_user_created (Profile Sync)                │  │
│  └───────────────────────────────────────────────────────┘  │
│                               │                             │
│                               ▼                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Supabase Storage (S3-compatible)           │  │
│  │  - Bucket: property-images                            │  │
│  │  - Path: {userId}/* (Strict Owner Isolation)          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Organization

```text
src/
├── assets/                  # Static images, logos, icons, and illustrations
├── components/              # Reusable UI component modules
│   ├── admin/               # Admin tables, headers, navigation bars, and modals
│   ├── auth/                # Route guards (ProtectedRoute, PublicOnlyRoute)
│   ├── common/              # Common UI primitives (Hero, SearchBox, Modals)
│   ├── owner/               # Owner dashboard tabs, listing wizards, and forms
│   ├── property/            # Property cards, image galleries, reviews, stay booking
│   └── user/                # User dashboard panels, saved listings, enquiry lists
├── contexts/                # Global state management
│   ├── AuthContext.jsx      # Session state, trusted role, and authentication methods
│   └── UIStateContext.jsx   # Toast notifications, modal dialogs, and UI toggles
├── hooks/                   # Custom application hooks (useAuth, useDebounce, useMediaQuery)
├── layouts/                 # Page scaffolding wrappers
│   ├── RootLayout.jsx       # Public navigation, header, footer, and toast containers
│   └── AdminLayout.jsx      # Admin sidebar, header, and secure outlet container
├── pages/                   # Route targets
│   ├── admin/               # Admin portal pages (Dashboard, Properties, Users, Bookings)
│   ├── agent/               # Agent onboarding application page
│   ├── auth/                # Login, Signup, Password Recovery, and OAuth callback
│   ├── listings/            # Multi-step property listing wizards (PG, Flat, Hotel)
│   ├── owner/               # Owner dashboard and listing manager
│   ├── payment/             # Payment summary and transaction notice screen
│   ├── user/                # User profile, saved listings, and enquiry tracking
│   ├── HomePage.jsx         # Landing page with hero search and featured properties
│   ├── SearchPage.jsx       # Dynamic faceted search and distance-filtered listings
│   └── PropertyDetailsPage.jsx # Comprehensive listing view with rooms and reviews
├── routes/                  # Route definitions (`AppRoutes.jsx`, `paths.js`)
├── services/                # PostgREST and Supabase API integration
│   ├── admin/               # Platform moderation and user directory queries
│   ├── auth/                # User authentication, password reset, and profile creation
│   ├── bookings/            # Hotel booking lifecycle and stay quote calculators
│   ├── owner/               # Owner property CRUD and room inventory mutations
│   ├── properties/          # Public listing queries, distance math, and computed fields
│   ├── storage/             # Supabase storage bucket file uploads and URL generation
│   └── supabase/            # Client singleton and safe mutation wrappers
├── styles/                  # CSS stylesheets organized by view
└── utils/                   # Shared formatting, date parsing, and validation helpers
```

---

## 3. Data & State Management

### Client-Side State
1. **Auth State (`AuthContext.jsx`):**
   - Stores current Supabase `session` and `user`.
   - Fetches and caches the validated `public.profiles` record.
   - Derives role flags: `isAdmin`, `isOwner`, `isAgent`, `isPendingAgent`.
   - Listens to Supabase `onAuthStateChange` to synchronize state automatically.
2. **UI State (`UIStateContext.jsx`):**
   - Centralized toast notification system.
   - Modal dialog states and responsive drawer toggles.

### Server Communication
All database reads and mutations are executed through dedicated functions in `src/services/`. Each service adheres to:
- **Parameter Validation:** Mandatory validation of UUIDs, dates, and required input fields before dispatching network requests.
- **Graceful Error Handling:** Returning `{ data, error }` response envelopes rather than throwing unhandled exceptions.
- **Sanitized Fallbacks:** Safe handling when environment variables or specific tables are not yet provisioned.

---

## 4. Security & Authorization Architecture

### A. Role Hierarchy & Storage
- User identity is managed by Supabase `auth.users`.
- User authorization is governed strictly by `public.profiles.role`:
  - `user` / `renter`: Standard registered renter.
  - `owner`: Registered property owner (requires `owner_approval_status = 'approved'`).
  - `agent`: Verified student agent.
  - `agent_pending`: Agent application under review.
  - `admin`: Platform administrator.

### B. Anti-Privilege Escalation Model
- **Trigger-Based Protection:** Postgres trigger `trg_protect_profile_roles` executes `BEFORE INSERT OR UPDATE` on `public.profiles`.
- If an update alters `role` or `owner_approval_status` and the requesting user is not a verified administrator (`public.roomdhundo_is_admin() = true`), the mutation is blocked with an exception.
- Metadata provided during client signup cannot set `role = 'admin'` or bypass the pending approval queue.

### C. Owner Verification & Listing Flow
1. Anyone can register as an owner via signup.
2. Upon registration, `owner_approval_status` is initialized to `'pending'`.
3. In the React app, `ProtectedRoute.jsx` intercepts pending owners attempting to access owner routes and displays an informative pending review notice.
4. In Postgres, RLS policies on `buildings` and `room_types` require `public.is_approved_owner(auth.uid()) = true`.
5. An administrator reviews and approves the owner via `AdminUsersPage.jsx`.
6. Once approved, the owner can create and manage listings.

### D. Dual-Status Property Moderation Model
Property listings in `public.buildings` utilize a dual-status lifecycle:
1. **Admin Moderation (`status`):**
   - Values: `'pending'`, `'approved'`, `'rejected'`.
   - Only platform administrators can change `status`. A `BEFORE UPDATE` trigger on `buildings` prevents owners from self-approving listings.
2. **Owner Publication (`listing_status`):**
   - Values: `'published'`, `'draft'`, `'archived'`.
   - Managed by the property owner to temporarily unlist or archive a listing.
3. **Public Discovery Rule:** A property is visible to the public if and only if:
   `status = 'approved' AND listing_status = 'published'`

---

## 5. Build, Bundling & Deployment Strategy

- **Build Tool:** Vite 5 with Rollup.
- **Code Splitting:** Configured in `vite.config.js` with manual chunks for `@supabase/supabase-js`, `lucide-react`, and vendor libraries.
- **Production Asset Caching:** Configured in `vercel.json` with immutable 1-year cache headers for hashed `/assets/*` bundles and `no-cache` for `index.html`.
- **SPA Routing:** `vercel.json` rewrites all non-file route requests to `/index.html` to support client-side React Router navigation.
