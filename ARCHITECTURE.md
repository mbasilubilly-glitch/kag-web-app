# Architecture

A reference for how this system is put together — where to look for something,
and how the pieces talk to each other. See `ROLES_AND_FEATURES.md` for what the
system does feature-by-feature; this doc is about how it's built.

## 1. Overview

The KAG Unity Church Management System is a Django REST API backend with a
React single-page app frontend, built as an installable PWA.

| Layer | Stack |
|---|---|
| Backend | Django 4.2+ REST Framework, SimpleJWT auth, MySQL/MariaDB (SQLite optional for dev) |
| Frontend | React 18 + Vite + React Router 6 + Tailwind CSS, no state library |
| PWA layer | Hand-written service worker + manifest (no Workbox/vite-plugin-pwa) |
| Integrations | M-Pesa Daraja (STK Push + C2B), Google Identity Services sign-in, Web Push (VAPID) |

Repo layout: `backend/` (Django project, single `api` app) and `frontend/`
(Vite app), each deployed independently — the frontend talks to the backend
only over `VITE_API_BASE_URL` (`/api/*`).

## 2. System Architecture

```
Browser (React SPA, service worker)
  │  axios instance (src/api.js) — attaches "Authorization: Bearer <JWT>"
  ▼
/api/*  ──────────────────────────────────────────────────────────►  Django URLconf
                                                                       (backend/urls.py
                                                                        → api/urls.py
                                                                        → api/urls_auth_aliases.py)
                                                                             │
                                                                             ▼
                                                                       DRF views (views_*.py)
                                                                       permission check (api/permissions.py)
                                                                             │
                                                                             ▼
                                                                       Models (api/models.py + satellites)
                                                                             │
                                                                             ▼
                                                                       MySQL/MariaDB
```

Two request paths bypass the normal JWT flow entirely, because the caller
isn't the frontend:
- **M-Pesa webhooks** (`MpesaCallbackView`, `C2BValidationView`,
  `C2BConfirmationView`) — Safaricom calls these directly over HTTPS,
  `AllowAny`, no bearer token. They write `Donation`/`MpesaSTKPushRequest`
  rows straight from the webhook payload.
- **Google OAuth sign-in** (`GoogleAuthView`) — verifies the Google ID token
  server-side, then issues SimpleJWT tokens directly (it does not go through
  `TokenObtainPairWithApprovalView`, though it does force new accounts to
  `PENDING_APPROVAL` so this path still can't hand out an ACTIVE session).

**Auth/JWT**: `POST /api/auth/token/` (`TokenObtainPairWithApprovalView`)
issues access/refresh tokens only if `MemberProfile.status == 'ACTIVE'`;
otherwise it returns why (pending approval / rejected / suspended / locked),
and tracks failed attempts, flipping `status` to `LOCKED` after 5. Access
tokens live 7 days, refresh tokens 30 days (`SIMPLE_JWT` in `settings.py`) —
there's no token blacklist app installed, so a 401 on the frontend just
force-logs-out locally; it can't revoke a still-valid token server-side.

**The role/status model** is the backbone of every permission decision on
both sides:
- `MemberProfile.role` — `Visitor | Member | Ministry Leader | Pastor |
  Administrator`. "Administrator" and "Pastor" both mean **Church Admin**
  in permission checks — see `api/permissions.py`.
- `MemberProfile.status` — `PENDING_APPROVAL | ACTIVE | REJECTED | SUSPENDED
  | DISABLED | LOCKED`. Only `ACTIVE` can obtain a JWT.
- **Super Administrator** is a distinct, stricter concept from a "Church
  Admin": it's whoever holds Django's literal `is_staff AND is_superuser`
  (`is_true_super_admin` in `permissions.py`), created once via
  `python manage.py create_super_admin` — never self-registered. Only the
  Super Admin may create/suspend/delete a Church Administrator account.
- **Department Admin** is not a separate role value — it's any user with a
  `DepartmentAdminAssignment` row scoping them to one `Ministry`
  (`is_department_admin_for`). A Department Admin's `profile.role` is
  whatever it already was; the assignment is what grants scoped admin
  rights to that one department's console.
- **Media Team** is a separate, single-purpose grant (`MediaTeamMember`) for
  gallery management only — not a role, not scoped to a department.

## 3. Backend Architecture (`backend/`)

**One Django app (`api`), sliced by filename, not by sub-app.** Convention:
`views_<domain>.py` + `serializers_<domain>.py` per feature area (e.g.
`views_mpesa.py`/no separate serializer file, `views_gallery.py`, etc.);
`views.py` is the original file and still holds core/miscellaneous views
(profile, users, sermons, events, prayer requests, notifications, dashboard
summary). Models mostly live in one `models.py`, with a few domains split out
(`models_children_ministry.py`, `models_department_attendance.py`,
`models_auth_models.py`) — see §5 for why this isn't fully consistent yet.

**`api/permissions.py`** is the single place role/permission checks live:
`is_church_admin`, `IsChurchAdmin`, `is_media_team`,
`IsChurchAdminOrMediaTeam`, `is_true_super_admin`, `is_church_admin_account`,
`requires_super_admin_to_manage`, `is_department_admin_for`,
`IsEventAdminOrReadOnly`. Every view file that needs a permission check
imports from here — nowhere else defines its own copy. (This used to be
scattered across `views.py`, `views_role.py`, `admin_provisioning.py`, and
`views_department_admin_assignments.py`, each with a near-duplicate
`is_church_admin`; that's been consolidated.)

**URL routing**: `backend/urls.py` mounts `/api/auth/token/` (+ `/refresh/`)
directly, then `include()`s `api/urls.py` (the main namespace) followed by
`api/urls_auth_aliases.py` (a handful of alternate spec-compliant paths for
login/password-reset/pending-users/role — kept thin, delegating to the same
views `api/urls.py` already exposes under their primary names).

**Model domains** (all in `api/models.py` unless noted):
- **Directory**: `MemberProfile` (1:1 with Django `User` — the real "member
  record"), `Ministry` (also doubles as "Homecell" via
  `category='homecell'` — there's no separate Homecell model),
  `MemberMinistry`, `MemberHomecell`, `DepartmentAdminAssignment`.
- **Content**: `Sermon`, `Event`, `EventRegistration`, `Announcement`,
  `PrayerRequest`, `ContactMessage`.
- **Giving**: `GivingCategory`, `Donation` (unified record regardless of
  source — online STK, manual entry, or C2B), `MpesaSTKPushRequest`.
- **Galleries**: `Gallery`, `Album`, `GalleryItem`, `GalleryCategory`,
  `MediaTeamMember` — soft-delete (`is_deleted`/`deleted_at`) throughout,
  with a shared recycle-bin view (`views_gallery_recycle_bin.py`).
- **Attendance** (two separate subsystems, same shape): `models_department_attendance.py`
  (ministry attendance) and `models_children_ministry.py` (guardians,
  children, medical info, child attendance).
- **Notifications**: `Notification` (in-app) and `DeviceToken` (despite the
  name, this stores a **Web Push** subscription — endpoint/p256dh/auth — not
  an FCM token; see integrations below).
- **Auth**: `PasswordResetOTP` in `models_auth_models.py`.

**Integrations**:
- **M-Pesa Daraja** — `mpesa_daraja.py` wraps OAuth + STK Push HTTP calls.
  `views_mpesa.py` handles STK initiate/status/admin-list plus the
  `MpesaCallbackView` webhook; `views_mpesa_c2b.py` handles direct-paybill
  C2B validation/confirmation webhooks (parses `BillRefNumber` to guess a
  `GivingCategory`, matches `MSISDN` to a member by phone) and a polled
  `LiveGivingFeedView`.
- **Google Identity Services** — `views_auth_google.py`, verifies the ID
  token against `GOOGLE_OAUTH_CLIENT_ID`; new/returning Google users are
  always forced to `Member` role + `PENDING_APPROVAL` status (Google sign-in
  can never grant admin).
- **Web Push** — `push_service.py` sends via `pywebpush` using VAPID keys;
  triggered from `PushSendView`/registration endpoints in `views.py`.
- **Email** — SMTP if `EMAIL_HOST` is set, otherwise Django's console
  backend (emails print to server logs — fine in dev, a footgun if forgotten
  in production, since that's also where password-reset OTPs and
  admin-generated temporary passwords go).

**Environment variables that matter in production** (all read via
`os.getenv` in `settings.py` unless noted): `DJANGO_SECRET_KEY` (falls back
to an insecure default — always set this),  `DJANGO_DEBUG`,
`DJANGO_ALLOWED_HOSTS`, `DJANGO_USE_SQLITE`, `MYSQL_*`, `CORS_ALLOWED_ORIGINS`,
`EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`,
`DEFAULT_FROM_EMAIL`, `MPESA_ENV`/`MPESA_SHORTCODE`/`MPESA_PASSKEY`/
`MPESA_CONSUMER_KEY`/`MPESA_CONSUMER_SECRET`/`MPESA_CALLBACK_URL`,
`GOOGLE_OAUTH_CLIENT_ID` (read directly in `views_auth_google.py`, not
surfaced in `settings.py`), `VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` (read
directly in `push_service.py`).

## 4. Frontend Architecture (`frontend/src/`)

**Routing**: one flat `App.jsx` route table (no code-splitting/lazy
loading), wrapped unconditionally in the `Sidebar`/`Navbar`/`Footer` shell.
Three tiers: public routes, `<ProtectedRoute>`-wrapped routes (any signed-in
user), and `<ProtectedRoute adminOnly>`-wrapped routes (rendered inside
`AdminLayout`, which nests all `/admin/*` pages via `<Outlet/>`). A second,
route-param-aware guard, `MinistryGuard`, sits *inside* each ministry
console page (not in `App.jsx`, since `ProtectedRoute` has no access to
`:id`) — it checks `/department-admin-assignments/mine/` to confirm a
non-admin user is actually assigned to that specific ministry.

**Auth state — `src/hooks/useAuth.js`**: the single source of truth for the
auth/role flags (`isAuthenticated`, `isAdmin`, `isSuperAdmin`, `isMediaTeam`,
`role`) that sign-in writes to `localStorage` (`SignIn.jsx`'s
`applySession()`). Every consumer (`Navbar`, `Sidebar`, `Dashboard`,
`AdminLayout`, `ProtectedRoute`, `MinistryGuard`) reads through this hook
instead of calling `localStorage.getItem(...)` directly — it re-derives on
the shared `window` `'authChanged'` event, which is dispatched on sign-in,
sign-out (`useAuth().signOut()`), and on a 401 from the API client. This is
distinct from `useCurrentUser.js`, which fetches *display* data (name,
avatar, role label) from `/auth/profile/` — `useAuth` answers "what can this
user do," `useCurrentUser` answers "who is this user."

**API client — `src/api.js`**: a single axios instance. Token lives in
`localStorage` (Remember Me checked at sign-in) or `sessionStorage`
otherwise; a request interceptor attaches the bearer token; a response
interceptor on any `401` clears all auth state, dispatches `'authChanged'`,
and hard-redirects to `/signin`. There is no refresh-token flow — a 401
always ends the session rather than silently refreshing. Error messages are
extracted from failed requests via `src/utils/errors.js`'s
`extractErrorMessage(err, fallback, { fields, useFirstField })` — the one
shared implementation of what used to be a `readableError` helper
reimplemented per-page.

**Component organization**: `Avatar` is the one genuinely reusable UI
primitive; most pages hand-roll their own Tailwind classes for
buttons/cards/status pills rather than sharing a component library (a known
gap — see §5). `Sidebar` carries the real navigation (icons, active state);
`Navbar` is branding-only. `MinistryConsoleNav` + `MinistryComingSoon` back
the ministry console's tab bar and its not-yet-built sub-pages.

**PWA layer**: hand-written (no vite-plugin-pwa/Workbox) — `public/sw.js`
(app-shell precache, network-first navigation with offline fallback,
cache-first for media file extensions, stale-while-revalidate for other
same-origin assets, always network-passthrough for `/api/*`),
`public/manifest.webmanifest`, `src/serviceWorkerRegistration.js`. Offline
write queueing (`src/utils/offlineQueue.js`, an IndexedDB queue) is wired
into exactly two forms — `EventRegistration` and `PrayerRequest` — not every
write-heavy page; `sw.js`'s background-sync handler re-implements the same
IndexedDB schema inline (classic service workers can't import ES modules),
so the two must be kept in sync by hand if the queue format ever changes.

## 5. Known limitations / roadmap

Not fixed in this pass — documented so the next person doesn't have to
rediscover them:

- **`api/models.py` is a 686-line file spanning ~13 feature domains.**
  Splitting it into per-domain files (mirroring the existing
  `views_*.py`/`serializers_*.py` slicing) would match the rest of the
  codebase's convention, but touches every model import in the app — a
  bigger, separate pass.
- **No shared frontend UI kit.** Every page reimplements its own
  button/card/status-pill styling and its own `STATUS_STYLES` color map
  (`AdminUsers`, `AdminMembershipList`, `AdminChurchAdmins`, `AdminDonations`
  each have a slightly different one). A shared
  `Button`/`Card`/`Modal`/`StatusBadge`/`Table` set would remove a lot of
  drift, but migrating 65 pages to it is real effort.
- **Three independently-maintained admin nav link lists** —
  `AdminLayout.jsx`'s sidebar, `AdminPanel.jsx`'s `QUICK_LINKS`, and
  `Dashboard.jsx`'s `ADMIN_ACTIONS` — all enumerate overlapping `/admin/*`
  routes by hand with no shared source of truth.
- **`views_homecells.py` and `views_departments.py` overlap** — both expose
  a "my departments/homecell" endpoint for the current user via separate
  views/serializers. Candidates to merge once someone has time to verify
  nothing depends on the specific shape of each.
- **Two structurally-identical attendance subsystems** (department
  attendance vs. children's-ministry attendance) — same session+record+
  unique-constraint shape, no shared abstract base model.
- **JWT access tokens live 7 days with no blacklist app**, which sits
  oddly next to a system that has an account-lockout feature. Worth
  revisiting alongside adding a real refresh-token flow to `src/api.js`
  (today a 401 just force-logs-out rather than silently refreshing).
- **No pagination on list endpoints** (users, donations, galleries, etc.
  all return the full queryset).
- **No production static/media file serving configured** (no
  whitenoise/S3-style backend) despite `ImageField`/`FileField` usage
  throughout (profile pictures, gallery images) — Django only serves
  `MEDIA_URL` when `DEBUG=True`.
- **Offline queueing only covers two forms** (`EventRegistration`,
  `PrayerRequest`) out of several write-heavy ones (`Give`, `Contact`,
  manual donation entry) — an inconsistently-applied offline strategy.
