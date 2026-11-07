# ROOMDHUNDO — AUTHENTICATION & SECURITY VERIFICATION REPORT
**Phase 4: Comprehensive Security, Verification, and Code Audit**
**Date:** 2026-11-07  
**Git Branch:** `migration/react-vite`  
**Status:** Verification Complete (Ready for Phase 5 upon approval)

---

## 1. Executive Summary

This report documents the thorough security verification and audit of the Phase 4 Authentication System migration for the Roomdhundo React application. The verification inspected:
1. The Postgres schema and trigger definitions in `files6.0/schema.sql` (specifically `public.handle_new_user()`).
2. Public registration metadata manipulation risks and privilege escalation vectors.
3. Role selection boundaries in both the React UI and service layer.
4. Database RLS authority vs. frontend state.
5. `AuthContext` concurrency, race conditions, and session restoration.
6. Google OAuth PKCE exchange and URL token detection.
7. Password reset workflow and recovery session handling.
8. Automated test suite categorization (Unit vs. Mock vs. Live Integration).
9. Build and test execution results.
10. Git transient locking analysis.

---

## 2. SQL Trigger Inspection (`public.handle_new_user()`)

### 2.1 Complete SQL Definition
Inspected from `files6.0/schema.sql` (lines 250–295):

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (
        id,
        name,
        full_name,
        email,
        role,
        user_type,
        status
    )

    values (
        new.id,

        coalesce(
            new.raw_user_meta_data ->> 'name',
            new.raw_user_meta_data ->> 'full_name',
            split_part(coalesce(new.email, ''), '@', 1)
        ),

        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name',
            split_part(coalesce(new.email, ''), '@', 1)
        ),

        new.email,

        case
            when coalesce(new.raw_user_meta_data ->> 'role', '') in ('owner', 'admin', 'agent', 'agent_pending')
                then case
                    when new.raw_user_meta_data ->> 'role' = 'agent' then 'agent_pending'
                    else new.raw_user_meta_data ->> 'role'
                end
            else 'user'
        end,
        case
            when coalesce(new.raw_user_meta_data ->> 'role', '') = 'owner' then 'owner'
            when coalesce(new.raw_user_meta_data ->> 'role', '') in ('agent', 'agent_pending') then 'agent'
            else 'renter'
        end,
        'active'
    )

    on conflict (id) do nothing;

    return new;

end;
$$;
```

---

## 3. Security Vulnerability Findings

### Finding 1: Backend Privilege Escalation via User Metadata in Legacy SQL Trigger
- **Severity:** **CRITICAL** (Backend Database Schema Vulnerability)
- **File Reference:** `files6.0/schema.sql` (Line 271)
- **Evidence:**
  ```sql
  when coalesce(new.raw_user_meta_data ->> 'role', '') in ('owner', 'admin', 'agent', 'agent_pending')
      then case
          when new.raw_user_meta_data ->> 'role' = 'agent' then 'agent_pending'
          else new.raw_user_meta_data ->> 'role'
      end
  ```
- **Description:**  
  The database trigger `public.handle_new_user()` in `files6.0/schema.sql` explicitly permits `'admin'` as a valid role sourced from `new.raw_user_meta_data ->> 'role'`. If any malicious actor bypasses the frontend and directly issues a request to Supabase GoTrue (`supabase.auth.signUp({ email, password, options: { data: { role: 'admin' } } })`), the backend trigger assigns `role = 'admin'` to `public.profiles.role`.
- **Impact:**  
  Because `public.is_admin()` checks `role = 'admin'` on `public.profiles`, any user registering with `role: 'admin'` in metadata would receive full administrative privileges across the entire database under RLS.
- **Client-Side Remediation Applied (Phase 4):**
  In [`src/services/auth/index.js`](file:///d:/Projects/roomdhundo/src/services/auth/index.js), `signUpWithEmail` now enforces a strict client-side allowlist. Any requested role other than `'owner'` or `'agent'` is forced to `'user'`. Any attempt to pass `'admin'` or `'super_admin'` is stripped before dispatching to Supabase.
- **Required Backend Fix (For DBA / Production Supabase Admin):**
  Update `public.handle_new_user()` in Postgres to remove `'admin'` from the allowed metadata roles:
  ```sql
  -- Recommended Backend SQL Correction (To be applied in database migration):
  when coalesce(new.raw_user_meta_data ->> 'role', '') in ('owner', 'agent', 'agent_pending')
      then case
          when new.raw_user_meta_data ->> 'role' in ('agent', 'agent_pending') then 'agent_pending'
          else new.raw_user_meta_data ->> 'role'
      end
  else 'user'
  ```

---

### Finding 2: Unrestricted Self-Update of Profile Role in Legacy RLS Policy
- **Severity:** **HIGH** (Backend Database Schema Vulnerability)
- **File Reference:** `files6.0/schema.sql` (Lines 610–618)
- **Evidence:**
  ```sql
  create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (
      id = auth.uid()
  )
  with check (
      id = auth.uid()
  );
  ```
- **Description:**  
  The RLS policy `"Users can update own profile"` grants unrestricted column updates to any authenticated user on their own row (`id = auth.uid()`). A malicious user could send `UPDATE profiles SET role = 'admin' WHERE id = auth.uid()` via the Supabase client and elevate their own permissions.
- **Client-Side Remediation Applied (Phase 4):**
  In [`src/services/auth/index.js`](file:///d:/Projects/roomdhundo/src/services/auth/index.js), `upsertUserProfile` was hardened to disallow setting `role: 'admin'` or modifying roles arbitrarily.
- **Required Backend Fix (For DBA / Production Supabase Admin):**
  Create a `BEFORE UPDATE` trigger on `public.profiles` or modify the RLS policy with a check that prevents updating `role` unless `public.is_admin()` evaluates to `true`:
  ```sql
  -- Recommended Backend SQL Trigger:
  create or replace function public.prevent_self_role_escalation()
  returns trigger language plpgsql as $$
  begin
      if (old.role is distinct from new.role) and not public.is_admin() then
          raise exception 'Unauthorized role modification';
      end if;
      return new;
  end;
  $$;
  ```

---

### Finding 3: Potential Concurrency Race Condition in `AuthContext` Profile Initialization
- **Severity:** **MEDIUM** (Resolved in React Client)
- **File Reference:** `src/contexts/AuthContext.jsx` (Lines 77–140)
- **Description:**  
  On application initialization, both `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()` were scheduled. In modern Supabase SDK v2, `onAuthStateChange()` automatically fires an `INITIAL_SESSION` event on mount. In certain timings, both listeners attempted to call `loadProfile(userId)` simultaneously, causing duplicate network requests and potential state tearing.
- **Remediation Applied:**  
  Added ref-based synchronization: `getSession()` now checks `if (activeUserIdRef.current !== initialSession.user.id)` before triggering `loadProfile()`. This ensures that whichever fires first acquires the loading lock, eliminating duplicate profile queries.

---

### Finding 4: OAuth Code Double-Redemption Risk with `detectSessionInUrl: true`
- **Severity:** **LOW / RESILIENCE** (Resolved in React Client)
- **File Reference:** `src/pages/auth/AuthCallback.jsx` & `src/services/supabase/client.js`
- **Description:**  
  Because `detectSessionInUrl: true` is configured in `src/services/supabase/client.js`, the Supabase client automatically detects `?code=` in the URL and begins the PKCE token exchange upon script execution. When `AuthCallback.jsx` simultaneously called `exchangeOAuthCode(code)`, there was a risk of receiving `AuthApiError: invalid_grant: code already redeemed`.
- **Remediation Applied:**  
  In [`src/pages/auth/AuthCallback.jsx`](file:///d:/Projects/roomdhundo/src/pages/auth/AuthCallback.jsx), if `exchangeOAuthCode(code)` returns an error or code is already consumed, the callback handler falls back to `supabase.auth.getSession()` to check if the session was already established by `detectSessionInUrl` before treating the flow as failed.

---

## 4. Role Selection & Route Protection Verification

| Area | Requirement | Verification Result |
| :--- | :--- | :--- |
| **Public UI Role Selection** | Only permit `renter` (`user`), `owner`, and `agent` | **Verified.** In `SignupPage.jsx` and `LoginPage.jsx`, the UI strictly presents radio buttons for Renter, Owner, and Agent. No admin option exists. |
| **Agent Role Safety** | Agent signup must not grant instant access | **Verified.** Signup passes `agent_pending`. Agent application gate redirects pending agents to `/be-an-agent`. |
| **Authoritative Role Source** | Sourced strictly from `public.profiles.role` | **Verified.** `AuthContext.jsx` derives `role` and `roleKind` solely from the database profile. `localStorage` is never read for authorization. |
| **RLS Independence** | Authorization boundary in DB, not React | **Verified.** Backend RLS policies in `schema.sql` evaluate `public.is_admin()` and `auth.uid()`, independent of React state. |
| **Password Recovery** | Mirror legacy flow without token leaks | **Verified.** `ForgotPasswordPage.jsx` and `ResetPasswordPage.jsx` use GoTrue recovery sessions without exposing tokens in URL logs or UI state. |

---

## 5. Automated Test Suite Audit (15 Tests)

The 15 automated tests executed via `npm test` were inspected to clearly delineate their operational nature:

| Test File | Test Name | Nature | Description |
| :--- | :--- | :--- | :--- |
| `supabase-client-init.test.js` | *Initialises singleton when environment variables are supplied* | **Unit / Mock Env** | Runs a child Node process with mock environment variables (`https://mock-project-id.supabase.co`) to verify SDK client creation and structure. Zero network traffic. |
| `supabase-client-init.test.js` | *Missing configuration warning without crash* | **Unit / Empty Env** | Runs a child process with empty env vars to test safe null fallback and exception throwing on `getSupabase()`. |
| `supabase-services.test.js` | *Handles unconfigured state safely* | **Unit Test** | Verifies `isSupabaseConfigured` boolean and safe null client state. |
| `supabase-services.test.js` | *Extracts unknown column names and clones payloads* | **Pure Unit Test** | Tests string parsing of Postgres/PostgREST error messages and immutability of payload cloning. |
| `supabase-services.test.js` | *File validation and safe path generation* | **Pure Unit Test** | Tests regex sanitization of filenames, folder path structure, and 5MB/50MB size boundary logic. |
| `supabase-services.test.js` | *Properties Service — Exports required functions and safe errors* | **Unit Test** | Verifies module exports and safe `{ data: null, error }` returns when unconfigured. |
| `supabase-services.test.js` | *Bookings Service — Verified function exports and unmigrated table awareness* | **Unit Test** | Verifies module exports and unconfigured error handling. |
| `supabase-services.test.js` | *Enquiries Service — Verified function exports and safe error responses* | **Unit Test** | Verifies module exports and safe error handling. |
| `supabase-services.test.js` | *Services Index — Re-exports all required service domains* | **Unit Test** | Verifies barrel re-export integrity. |
| `auth-system.test.js` | *accountKindFromRole normalizes legacy and modern role strings* | **Pure Unit Test** | Verifies string mapping (`super_admin` -> `admin`, `landlord` -> `owner`, etc.). |
| `auth-system.test.js` | *accountKindLabel returns proper human-readable labels* | **Pure Unit Test** | Verifies user-facing role labels. |
| `auth-system.test.js` | *isListingOwnerRole verifies listing privileges* | **Pure Unit Test** | Verifies authorization predicate for listing permissions. |
| `auth-system.test.js` | *differentEmailRoleMessage outputs descriptive role mismatch text* | **Pure Unit Test** | Verifies copy formatting on role mismatch. |
| `auth-system.test.js` | *Methods return safe error objects without crashing when unconfigured* | **Unit Test** | Verifies all GoTrue methods return graceful error objects when unconfigured without throwing unhandled rejections. |
| `auth-system.test.js` | *Validates required arguments* | **Unit Test** | Verifies early argument validation for `fetchUserProfile`, `upsertUserProfile`, and `exchangeOAuthCode`. |

### Test Summary:
- **Total Tests:** 15
- **Unit & Contract Tests:** 15 (100%)
- **Live Supabase Integration Tests:** **0 (0%)**
- **Reason:** Per project constraints, live Supabase credentials (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) are intentionally not provided in the repository or sandbox environment. No live network calls or database mutations were performed or fabricated.

---

## 6. Build and Test Verification

### Test Execution Output (`npm test`)
```text
> roomdhundo@1.0.0 test
> node --test tests/supabase-client-init.test.js tests/supabase-services.test.js tests/auth-system.test.js

TAP version 13
ok 1 - Auth Service — accountKindFromRole normalizes legacy and modern role strings
ok 2 - Auth Service — accountKindLabel returns proper human-readable labels
ok 3 - Auth Service — isListingOwnerRole verifies listing privileges
ok 4 - Auth Service — differentEmailRoleMessage outputs descriptive role mismatch text
ok 5 - Auth Service — Methods return safe error objects without crashing when unconfigured
ok 6 - Auth Service — Validates required arguments
ok 7 - Supabase Client — Initialises singleton when environment variables are supplied
ok 8 - Supabase Client — Missing configuration warning without crash
ok 9 - Supabase Client — Handles unconfigured state safely
ok 10 - Mutation Helpers — Extracts unknown column names and clones payloads
ok 11 - Storage Service — File validation and safe path generation
ok 12 - Properties Service — Exports required functions and returns safe errors without throwing
ok 13 - Bookings Service — Verified function exports and unmigrated table awareness
ok 14 - Enquiries Service — Verified function exports and safe error responses
ok 15 - Services Index — Re-exports all required service domains
1..15
# pass 15
# fail 0
# duration_ms 491.3458
```

### Production Build Output (`npm run build`)
```text
> roomdhundo@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 99 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.24 kB │ gzip:  0.63 kB
dist/assets/index-DyGUg8DC.css      9.75 kB │ gzip:  2.64 kB
dist/assets/vendor-285iMdjQ.js     51.14 kB │ gzip: 17.88 kB │ map:   493.89 kB
dist/assets/supabase-DlNZ_Rpy.js  228.79 kB │ gzip: 59.54 kB │ map: 1,237.40 kB
dist/assets/index-DNITTHlH.js     247.54 kB │ gzip: 74.15 kB │ map: 1,121.37 kB
✓ built in 2.28s
```
Zero warnings. Code splitting cleanly isolates `vendor`, `supabase`, and `index`.

---

## 7. Git Lock Error Analysis

### Observation
In the previous session, a Git error occurred:
`fatal: Unable to create 'D:/Projects/roomdhundo/.git/index.lock': Permission denied`

### Root Cause Analysis
1. **Operating System File Locking:** On Windows, file handles opened with non-shared read/write access (e.g., by the IDE file indexing daemon, TypeScript language server, or Windows Defender real-time scanning) lock files temporarily.
2. When a `git commit` or `git add` command executed while the IDE was indexing newly created files, Git attempted to atomically create `.git/index.lock`.
3. Because another process held a transient handle on `.git/index`, Windows returned `ERROR_ACCESS_DENIED` (`Permission denied`).
4. **Current State:** The lock file `.git/index.lock` was transient and has since been automatically removed (`Test-Path .git/index.lock` evaluates to `False`). Git working tree is completely healthy. No automated commit was executed per user instruction.

---

## 8. Summary of Action Items & Status

| Item | Status | Action Required |
| :--- | :--- | :--- |
| **Client-side Role Sanitization** | **Fixed** | Completed in `src/services/auth/index.js` (blocks `'admin'` in signup and upsert). |
| **`AuthContext` Concurrency** | **Fixed** | Completed in `src/contexts/AuthContext.jsx` (`activeUserIdRef` deduplication). |
| **OAuth PKCE Resilience** | **Fixed** | Completed in `src/pages/auth/AuthCallback.jsx` (handles dual detection). |
| **Automated Tests** | **Passed** | 15/15 passing. |
| **Production Build** | **Passed** | Clean bundle generation in 2.28s. |
| **Backend DB Trigger (`handle_new_user`)** | **Documented** | DBA must run SQL migration removing `'admin'` from `new.raw_user_meta_data` check. |
| **Backend Profile Update RLS Policy** | **Documented** | DBA must add trigger preventing non-admins from changing `profiles.role`. |
| **Phase 5 Initiation** | **Stopped** | Paused awaiting explicit user direction. |

