# Roomdhundo (PG Dhundo)

> **Modern Student & Working Professional Accommodation Platform**  
> Serving MAKAUT (WBUT), Jaguli, and Haringhata with PG, Flat, Room, and Hotel discovery, booking requests, verified agent listings, and comprehensive owner and administrator moderation portals.

---

## 1. Overview & Architecture

Roomdhundo is built as a single-page application (SPA) with **React 18** and **Vite 5**, backed by **Supabase (PostgreSQL 15+)** for Authentication, Relational Database, Row-Level Security (RLS), and Media Storage.

### Key Capabilities
- **Search & Discovery:** Instant filtering by property type (PG, Flat, Hotel, Room), occupancy, price range, and geographic distance from college hubs (MAKAUT, Jaguli, Haringhata).
- **Authentication & Roles:** Multi-role architecture (`renter`, `owner`, `agent`, `admin`) supporting email/password and Google OAuth, with strict server-side role authorization and admin owner approval.
- **Renter Experience:** User dashboard, saved properties, booking request tracking, and enquiry management.
- **Owner Portal:** Listing management, availability toggles, room inventory management, and enquiry inbox.
- **Hotel Stays:** Nightly and hourly booking requests with guest meal add-ons and overlap checking.
- **Admin Management:** Platform metrics, property listing verification, owner approval workflows, agent application review, enquiries oversight, and user directory management.

---

## 2. Tech Stack

- **Frontend:** React 18, React Router v6, Lucide React (feather icons)
- **Tooling & Build:** Vite 5, Node.js Test Runner (`node --test`)
- **Backend / BaaS:** Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage)
- **Deployment Target:** Vercel (SPA routing configured via `vercel.json`)

---

## 3. Repository Structure

```text
roomdhundo/
├── archive/
│   └── legacy-vanilla/        # Archived historical HTML/CSS/JS files
├── database/
│   ├── README.md              # Database schema guide & migration instructions
│   ├── migrations/
│   │   └── security/          # Consolidated security remediation SQL migrations
│   └── schemas/               # Baseline reference SQL files
├── docs/
│   ├── audit/                 # Live Supabase audit and remediation plan
│   ├── history/               # Historical documentation
│   └── phases/                # Phase 5 through 11 implementation records
├── public/                    # Static assets, branding, and icons
├── src/
│   ├── assets/                # App images, logos, and placeholders
│   ├── components/            # Modular UI components (admin, auth, owner, property, user)
│   ├── contexts/              # React Contexts (AuthContext, UIStateContext)
│   ├── hooks/                 # Custom React hooks (useAuth, useDebounce, etc.)
│   ├── layouts/               # Layout wrappers (RootLayout, AdminLayout)
│   ├── pages/                 # Route page components
│   ├── routes/                # Application routes and navigation paths
│   ├── services/              # Supabase API services (admin, auth, bookings, owner, properties)
│   ├── styles/                # CSS stylesheets and design tokens
│   ├── App.jsx                # Application entry component
│   └── main.jsx               # React DOM bootstrap
├── tests/                     # 69 unit and integration tests
├── .env.example               # Environment variables template
├── package.json               # Dependencies and npm scripts
├── vercel.json                # SPA routing and cache headers
└── vite.config.js             # Vite configuration with chunk splitting
```

---

## 4. Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- A [Supabase](https://supabase.com) account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/roomdhundo.git
   cd roomdhundo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server with hot module replacement (HMR). |
| `npm run build` | Compiles and bundles production-ready assets to the `dist/` directory. |
| `npm run preview` | Locally serves the production build from `dist/` for verification. |
| `npm test` | Runs the full 69-test automated test suite using the Node.js test runner. |

---

## 6. Database & Security

Database migrations are located in `database/migrations/security/`:
- `PHASE_12_SECURITY_REMEDIATION.sql`: Consolidates all RLS policies, trigger-based anti-privilege escalation, owner approval fields, and sanitized `handle_new_user()` logic.
- `PHASE_12_ORPHAN_PROFILE_BACKFILL.sql`: Idempotent backfill query for the 45 unprofiled `auth.users` records.

For complete execution instructions and post-migration verification queries, see [database/README.md](file:///d:/Projects/roomdhundo/database/README.md).

---

## 7. Testing & Verification

The project includes 69 comprehensive tests covering:
- Supabase client initialization & unconfigured fail-safes
- Multi-role authentication & role normalizers
- Property and room type computed fields & filters
- Owner dashboard statistics & listing operations
- Admin moderation, enquiry management, and user directory pagination
- Hotel stay quotes, night/hour calculators, and booking overlap detection
- Route registration and URL parameter builders

Run all tests:
```bash
npm test
```

---

## 8. License

Private & Proprietary. All rights reserved.
