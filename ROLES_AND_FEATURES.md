# Church Management System — Roles, Hierarchy & Full Feature Catalog

> Rewritten from the original role specification and verified against the actual codebase (Django REST Framework backend + React/Vite PWA frontend, single-church/single-tenant). This is the **fifth pass** — Phase 0 found most of the Department Administrator console, email delivery, and Giving unbuilt; Phase 1 + Giving/Live closed most of those; Pass 3 added the Audit Log Viewer; Pass 4 rebuilt registration, login, and account provisioning end-to-end; this pass adds the two long-flagged admin-creation UIs (Super Admin → Church Administrator, Church Admin → Department Administrator) and, in the process of building and testing them, found and fixed two real pre-existing security gaps in the account-management endpoints (see §9). Every capability below is tagged with its real, current implementation status.
>
> **✓ Built** — implemented end-to-end (backend + frontend, working, verified by scripted tests against a live server)
> **◐ Partial** — backend exists but no working frontend, or the reverse, or the feature is an honest "coming soon" placeholder rather than functional
> **— Planned** — named in the spec/docs but not implemented anywhere in code (no route, no page, no model, or model exists but is unwired dead code)

---

## 0. How roles actually work in the code today

The system's `MemberProfile.role` field only stores five values: `Visitor`, `Member`, `Ministry Leader`, `Pastor`, `Administrator`. There is **no literal `super_admin` / `church_admin` / `department_admin` value** anywhere in the database. The three-tier admin hierarchy described below is real in *intent* and now largely enforced for department-level actions, but is built out of three different mechanisms rather than three distinct role strings:

| Tier | How it's actually determined in code |
|---|---|
| **Super Administrator** | Django's built-in `is_staff` / `is_superuser` flags on the `auth_user` row **OR** `MemberProfile.role ∈ {Administrator, Pastor}` |
| **Church Administrator** | The *identical* check as Super Administrator (`is_church_admin()` duplicates `is_super_admin()` logic verbatim). In practice, a "Church Administrator" is just an Administrator/Pastor-role user who does not additionally hold Django's `is_staff`/`is_superuser` flags — nothing in the codebase actually withholds a capability from one vs. the other, except the one action explicitly gated on `is_staff`/`is_superuser` (role reassignment). |
| **Department Administrator** | Not a role at all — it's a **relationship row** in `DepartmentAdminAssignment`, linking an Administrator/Pastor-role user to one or more specific `Ministry` records (departments), created and owned by whichever Church Admin assigned them. A new `is_department_admin_for(user, ministry_id)` check (church admin OR holds an assignment for that ministry) now gates every department-scoped endpoint. |
| **Ministry Leader** | Exists as a selectable registration role with **no backend permission logic** — behaves exactly like `Member` today. |
| **Member / Visitor** | Default roles for approved / pending self-registrants. Functionally identical once `status = ACTIVE`; the label is cosmetic. |

There is no formal RBAC/permissions table — Django's `auth_group`/`auth_permission` tables exist but are unused. Authorization is a set of role-string comparisons scattered across view functions.

> **Confirmed limitation (tested, not fixed):** because `DepartmentAdminAssignment` requires its target user to already hold role `Administrator`/`Pastor` (the same values `is_church_admin()` checks for), a Department Administrator promoted to that role **also automatically passes every Church Administrator check** — e.g. they can post church-wide announcements, not just department ones. This isn't a bug in any single feature; it's a structural consequence of "Department Admin" not being its own role value. Fixing it would require a real `department_admin`-only role or a formal permissions table — out of scope for the current pass.

---

## 1. Super Administrator *(only one, in intent — enforced via Django superuser flag)*

The system owner. Inherits every permission below (Church Admin, Department Admin, Member, Visitor) because permission checks are additive OR-checks that a Django superuser always passes.

### Exclusive responsibilities

| Capability | Status |
|---|---|
| Assign or revoke user roles, with a permanent audit trail (`RoleAuditLog`: actor, target, old→new role, reason, timestamp) | ✓ Built |
| Override any permission gate in the system | ✓ Built (superuser bypass) |
| Reset another user's password | ✓ Built — generates a temporary password, emails it, gated to church admins; resetting a **Church Administrator's** password (or the Super Admin's own) is now further restricted to the true Super Administrator only (see §9) |
| Suspend / reactivate any user's account (including other admins) | ✓ Built — a single status endpoint now supports `ACTIVE / REJECTED / SUSPENDED`; suspension blocks login immediately. Suspending/reactivating a Church Administrator, or the Super Admin account itself, is now Super-Admin-only (see §9) |
| Configure SMTP email services | ✓ Built — real `EMAIL_BACKEND`/SMTP settings via environment variables; falls back to a console backend in dev so nothing is silently dropped. Password-reset codes are genuinely emailed now (previously generated but never sent) |
| Account created only during system installation, never self-registered | ✓ Built — new `python manage.py create_super_admin` management command; enforces "only one Super Administrator" (refuses to create a second unless `--force`), creates the Django user + `MemberProfile` correctly, pre-verified and active |
| Create/edit/delete Church Administrator accounts | ✓ Built — new dedicated "Add Church Administrator" form at `/admin/church-admins` (Super Admin only, verified live: a plain Church Admin gets 403 from both the list and create endpoints); generates a temporary password and emails it; edit/delete reuse the existing Admin Users page, now correctly gated (see §9) |
| Manage role-based permissions (RBAC config) | — Planned — no permission table, just hardcoded role checks in code |
| Configure authentication / authorization settings | — Planned |
| Configure system-wide security policies | — Planned |
| Manage church profile & organization settings | — Planned — no `Church`/tenant table exists; this is a single-church system |
| Configure notification services | ◐ Partial — Web Push (VAPID) broadcast is admin-triggerable; SMTP is now configured via environment (see above), but there's no in-app settings UI for either — both are build/deploy-time config, not admin-editable at runtime |
| Configure PWA settings | ◐ Partial — the app *is* a working installable, offline-capable PWA (service worker, offline queue), but there is no admin UI to configure it — it's fixed at build time |
| System maintenance tooling | — Planned |
| Backup and restore the database | — Planned |
| Monitor system health & performance | — Planned |
| View complete audit logs | ✓ Built — new super-admin-only Audit Log page (`/admin/audit-log`) lists every role change: actor, target, old→new role, reason, timestamp. Verified live: a non-admin member is correctly denied (403) |
| View login history for all users | — Planned |
| Monitor all user activities | — Planned |
| Configure application / database settings | — Planned |
| Manage API integrations | — Planned |
| Manage storage & uploaded files | ◐ Partial — profile photos, sermon/event media upload and store correctly; no dedicated file-manager UI |
| Generate system-wide reports | ◐ Partial — dashboard shows 3 counters (total members, sermons, events); no real reporting module |
| Manage all churches, departments, ministries, users | ◐ Partial — single church only; department/ministry/user management is otherwise ✓ |

### Inherited authority
Everything listed under Church Administrator, Department Administrator, Member, and Visitor below.

---

## 2. Church Administrator *(multiple supported)*

Day-to-day operator: members, visitors, departments, and department leadership.

| Capability | Status |
|---|---|
| Receive & review member registration requests | ✓ Built (`GET /api/profiles/pending/`) |
| Approve / reject member registration | ✓ Built (`POST /api/profiles/approval/`) |
| Request profile corrections | — Planned — no such status exists (only Pending/Active/Rejected/Suspended) |
| Activate / suspend / deactivate member accounts | ✓ Built — suspend blocks login immediately; reactivate restores it (verified live: a suspended member's login attempt is correctly rejected, then succeeds again after reactivation) |
| Manage member profiles | ✓ Built |
| Create / edit church departments (ministries) | ✓ Built |
| Activate departments | ◐ Partial — no activate/deactivate flag on a ministry |
| Archive departments | ◐ Partial — hard delete only, no archive/soft-delete state |
| Delete departments | ✓ Built |
| Create Department Administrator accounts | ✓ Built — new "Create New Department Administrator" form on the assignment page creates a brand-new account and assigns it to a department in one step (distinct from picking an existing user), generates a temp password, emails it |
| Create Department Administrator assignment | ✓ Built — and a real, previously-latent bug in this exact endpoint was found and fixed (see §9); assigning a Department Admin used to 500 every time |
| Assign / reassign a Department Administrator to a department | ✓ Built — assigning an **existing** Member/Visitor now auto-promotes them to the Administrator role as part of the assignment (previously required them to already hold that role, a dead end since only Super Admin can grant it directly — see §9) |
| Allow multiple administrators per department | ✓ Built (schema supports it, no artificial single-admin limit) |
| Remove a Department Administrator | ✓ Built |
| Suspend / activate a Department Administrator specifically | ✓ Built — the same generic suspend/reactivate action works on any user, including department admins |
| Reset a Department Administrator's password | ✓ Built — same generic admin password-reset endpoint |
| Monitor Department Administrator activity / performance reports | — Planned |
| Manage members & visitors | ✓ Built |
| Manage attendance | ◐ Partial — Children's Ministry attendance and **department/ministry attendance** (new) both exist and work; there is still no attendance feature scoped to the whole church outside a department/ministry context |
| Manage events (create/edit/delete, view registrations) | ✓ Built — plus a real pre-existing bug fixed here too: event edit/delete used to be open to *any* authenticated member, not just admins (see §9) |
| Manage prayer requests (view, update status) | ✓ Built |
| Manage sermons | ✓ Built |
| Church-wide announcements | ✓ Built — new `Announcement` model/page; a church admin posts with no ministry, visible to all members |
| Department announcements | ✓ Built — same model, scoped to a ministry, postable by that department's admin |
| Reports | ◐ Partial — basic dashboard counters only; no dedicated reporting module |
| Ministry / department assignments (member enrollment) | ✓ Built |
| Digital Member ID Cards | — Planned |
| Department performance | — Planned |
| Manage giving/donations (view all gifts, filter, totals) | ✓ Built — new admin Donations page |

---

## 3. Department Administrator *(unlimited, scoped per assignment)*

Restricted-scope role: cannot create other admins or touch system settings — these escalation paths still don't exist for anyone. **This tier went from "console entirely unbuilt" to functional for its core responsibilities** since the last audit.

### Restrictions (confirmed accurate)
Cannot create Church/Department Administrators, cannot modify Church Administrator accounts, cannot touch system settings/permissions/audit logs/backups. Access to a specific department is now actively checked (`is_department_admin_for`), not just assumed — verified live: a Department Admin can reach their own assigned ministry's roster, but a different member is correctly denied (403) from the same endpoint.

### Responsibilities

| Capability | Status |
|---|---|
| Discover which department(s) they administer | ✓ Built — new `GET /department-admin-assignments/mine/`; surfaced in the sidebar as "My Departments" |
| Department Dashboard | ✓ Built — real counts (members, events, attendance sessions, announcements) for their assigned ministry |
| Department Members (roster) | ✓ Built — name, email, phone, role, join date, scoped to enrolled members of that ministry |
| Department Attendance | ✓ Built — create sessions, bulk mark present/absent per enrolled member |
| Department Meetings | ◐ Partial — attendance sessions can represent a meeting/gathering, but there's no separate meeting-scheduling concept |
| Department Events | ✓ Built — events can now carry a `ministry` FK; department admins can create/edit/delete their own department's events, church-wide events remain church-admin-only |
| Department Calendar | ◐ Partial — honest "coming soon" page (was previously a generic, indistinguishable placeholder; now clearly labeled and explains what to use instead: Events + Attendance) |
| Department Announcements | ✓ Built |
| Department Prayer Requests view | ◐ Partial — coming-soon; `PrayerRequest` still has no ministry-scoping field |
| Ministry Resources | ◐ Partial — coming-soon |
| Department Documents | — Planned |
| Department Reports | ◐ Partial — coming-soon; dashboard counts are the closest thing today |
| Assign Department Leaders / Create Department Teams | — Planned |
| Upload files & resources | — Planned |
| Track department activities | ◐ Partial — covered indirectly by attendance/events/announcements; no unified activity log |
| Generate department reports | — Planned |
| Communicate with department members | ◐ Partial — department announcements now cover one-way broadcast; no direct messaging |
| Monitor department performance | — Planned |

---

## 4. Member

Not detailed in the original spec, but a full first-class role in the system.

| Capability | Status |
|---|---|
| Register via a dedicated full Member form, separate from Visitor registration | ✓ Built — `/register` now leads to a "Register As: Visitor / Church Member" choice page (per spec — no role dropdown), then a full form: personal info, church info (baptized/confirmed, preferred department, church branch), profile picture upload, password. Verified live end-to-end against the real database |
| Account starts `PENDING_APPROVAL` immediately on registration | ✓ Built — email verification step removed; a Church Administrator reviews and approves directly, no OTP gate in between |
| Sign in via email/password (JWT) or Google | ✓ Built |
| Password reset via OTP | ✓ Built — server-generated, actually emailed; a real two-step "send code → enter code + new password" flow exists on the Forgot Password page |
| Show/hide password toggle | ✓ Built — Sign In, Member registration, Visitor registration (both password fields) |
| Remember Me | ✓ Built — properly implemented, not just a checkbox: token goes to `localStorage` (survives browser restart) when checked, `sessionStorage` (cleared on browser close) when not |
| Account lockout after repeated failed logins | ✓ Built — 5 failed attempts flips status to `LOCKED`, tracked per-account, resets on a successful login |
| View / edit own profile | ✓ Built |
| Browse sermon library | ✓ Built |
| Browse events & self-register for an event | ✓ Built |
| Watch the livestream / see service times | ✓ Built — new `/live` page; the stream area is honestly labeled "not live right now" outside service hours rather than faking a working embed |
| Submit prayer requests | ✓ Built |
| Enroll in one homecell + multiple ministries (self-service) | ✓ Built |
| Personal dashboard | ◐ Partial — shows church-wide aggregate stats, not personalized data |
| Push notification opt-in + in-app notification list | ✓ Built |
| View church-wide and department announcements | ✓ Built — new `/announcements` feed |
| Submit contact/inquiry messages | ✓ Built |
| Join the worship team | ◐ Partial — currently just routes through the generic contact-message form as a temporary shim |
| Give / donate | ✓ Built — new `/give` page: log a gift (amount, category, paybill number, M-Pesa reference) and view personal giving history. **Note:** this records gifts already paid via M-Pesa outside the app; it is not a payment gateway integration (an earlier STK-push flow was deliberately removed from the codebase before this pass) |
| Per-ministry member dashboard (once enrolled) | — Planned — the console built in §3 is for admins/department admins; an enrolled regular member still only has the public join/leave page for a ministry |
| Auto-generated Member Number on approval | — Planned — field exists on the model, not yet populated automatically when a Church Admin approves |
| Digital Member ID card (generated + emailed on approval) | — Planned |

---

## 5. Visitor

Default role for first-time public registrants (via a dedicated lighter registration form) and first-time Google sign-ins.

| Capability | Status |
|---|---|
| Browse public site — no login required | ✓ Built |
| Submit a contact/inquiry message — no login required | ✓ Built |
| Register via a dedicated lighter form (name, phone, email, gender, age, address, purpose of visit, service attended, date of visit, prayer request) | ✓ Built — separate from the Member form per spec; verified live |
| Immediate `ACTIVE` access, no approval queue | ✓ Built — verified live: a visitor can log in immediately after registering, unlike a Member who must first be approved by a Church Administrator |
| Register for an event | ✓ Built (requires an authenticated session) |
| Once approved by a Church Administrator, gains identical dashboard access to a Member | ✓ Built |

---

## 6. Children's Ministry — admin-managed sub-records (not a login role)

**Unchanged this pass.** Fully built on the backend, with zero frontend UI — still managed entirely through direct API access, no admin page exists for it yet.

| Capability | Status |
|---|---|
| Guardian profiles (CRUD) | ◐ Partial — backend only |
| Child profiles (CRUD, linked to guardians) | ◐ Partial — backend only |
| Child medical/allergy information | ◐ Partial — backend only |
| Attendance sessions (create, list) | ◐ Partial — backend only |
| Bulk present/absent marking per session | ◐ Partial — backend only |
| Guardian self-service portal | — Planned |

---

## 7. Full System Feature Catalog (flat, by domain)

**Identity & Access** — JWT login ✓ · Google OAuth ✓ · split Member/Visitor registration (no role dropdown) ✓ (new) · email-verification-gated approval queue ✓ (new) · immediate-access Visitor registration ✓ (new) · email verification OTP ✓ (now actually emailed) · password reset OTP ✓ (now actually emailed, full UI flow) · show/hide password ✓ (new) · Remember Me ✓ (new, real localStorage/sessionStorage split) · account lockout after failed logins ✓ (new) · role-based status messages on login ✓ (new) · Super Admin provisioned via system-init management command, not self-registered ✓ (new) · role assignment + audit log ✓ · audit log viewer page ✓ · department-admin delegation ✓ · admin-triggered password reset ✓ · suspend/reactivate any account ✓ · RBAC/permissions table — Planned · login history — Planned · CAPTCHA — Planned (needs a provider decision) · Two-Factor Authentication — Planned (marked optional in spec) · device recognition — Planned

**Membership & Directory** — user list/edit/delete ✓ · member profile management ✓ (now with full personal/church info + profile picture upload) · approval workflow ✓ · suspend/reactivate ✓ · auto-generated Member Number on approval — Planned · digital ID cards — Planned

**Ministries, Departments & Homecells** — ministry/department CRUD ✓ · homecell catalog & enrollment ✓ · department-admin assignment ✓ (bug fixed) · department console: dashboard/members/attendance/events/announcements ✓ · calendar/resources/reports/prayer-requests/meetings/teams ◐ (honest placeholders or partial)

**Events & Attendance** — event CRUD ✓ · department-scoped events ✓ · event registration ✓ · department/ministry attendance ✓ (new) · children's ministry attendance ◐ (backend only) · church-wide adult attendance outside a department context — still not modeled

**Sermons & Media** — sermon CRUD ✓ · public sermon library ✓

**Live** — service times + livestream page ✓ (new; stream itself is an honest placeholder, not a real broadcast integration)

**Prayer & Pastoral Care** — member prayer request submission ✓ · admin status management ✓ · department-scoped prayer requests — Planned

**Communication** — contact form + admin inbox/reply ✓ · in-app notifications ✓ · Web Push broadcast ✓ · church-wide announcements ✓ (new) · department announcements ✓ (new) · member announcement feed ✓ (new)

**Children's Ministry** — guardian/child/medical records, attendance sessions ◐ (backend only, no UI — unchanged)

**Giving & Finance** — donation recording, categories, M-Pesa reference logging ✓ (new — wired up, privacy bug fixed, admin + member pages) · real payment gateway integration — not implemented (manual reference logging only, by design)

**Reporting & Analytics** — dashboard summary counters ✓ · department dashboard counts ✓ (new) · deeper department/church performance reports — Planned

**Platform / Technical** — installable PWA ✓ · offline caching & action queue ✓ · service worker ✓ · SMTP email delivery ✓ (new) · unified typography + brand-consistent navigation ✓ (new — see §9) · multi-church/tenancy — Planned · backup/restore — Planned · system health monitoring — Planned

---

## 8. Remaining gaps (named in spec, still unbuilt)

Church profile/org settings · system-wide security policy configuration · database/application settings UI · API integration management · backup & restore · system health/performance monitoring · full login history · digital member ID cards · auto-generated Member Number on approval · Homecells as full department-like entities (rename/edit/delete Jerusalem/Macedonia/Nazareth/Galilee/Judea, with department-style attendance/events) · QR-code attendance · family group management · baptism/confirmation record management · visitor follow-up (notes, scheduling, conversion tracking) · CAPTCHA · Two-Factor Authentication (marked optional in spec) · device recognition · department performance metrics/reports · department meetings/teams/leader-assignment/file uploads · department-scoped prayer requests · multi-church support · Children's Ministry frontend (guardian/child/attendance admin pages) · guardian self-service portal · real payment gateway integration for giving · landing page rebuild to the exact specified header/hero layout · the structural role-model collapse noted in §0 (Department Admin ⊂ Church Admin by role value, for *content* permissions — account-management permissions were fixed this pass, see §9).

This list is shorter than earlier audits' — registration, login, account provisioning, and now both admin-creation UIs are built and verified end-to-end against the live database. What's left is mostly platform/ops tooling (backup, health monitoring, multi-tenancy), a batch of newly-detailed spec items (Homecells-as-departments, QR attendance, family/baptism records, visitor follow-up), and features that need an external decision before they can be built (CAPTCHA provider, 2FA scope).

---

## 9. What changed since the first audit (bugs found and fixed along the way)

Five real, pre-existing bugs were discovered through this work — not just gaps, actual broken behavior:

1. **`RoleAuditLog` model was invisible to Django's migration system.** It lived in a file never imported by `models.py`, so the very first migration generated during this work would have silently **dropped the entire role-audit-log table**. Fixed by wiring the import in properly.
2. **Assigning a Department Administrator has been broken since it was built.** `DepartmentAdminAssignmentSerializer` referenced a field (`church_admin_id`) that doesn't exist on the model — every assignment attempt threw a 500 error. Fixed.
3. **Two privacy/authorization gaps**: any authenticated member could list *every* member's donation records (not just their own), and any authenticated member — not just admins — could edit or delete *any* church event. Both fixed and verified with live tests confirming the correct access is now denied.
4. **Every "admin-only" endpoint that used DRF's built-in `IsAdminUser` (member approval/suspend, pending-profiles list, member-profile edit, ministry/notification/prayer-request/event-registration/contact-message admin views, sermon create/edit, push send) silently required a literal Django `is_staff` flag** — which a role-based Church Administrator (the normal, non-superuser kind this whole spec describes) never has. Discovered live while testing the new Church-Admin-creation flow: a freshly created Church Administrator got a generic 403 trying to suspend a member, with no code path even reaching the app's own `is_church_admin()` logic. Fixed by introducing an `IsChurchAdmin` permission class that matches the rest of the codebase's role-based check, and swapping it in everywhere `IsAdminUser` was gating a Church-Admin-level action (9 call sites, plus one duplicated inline copy of the same bug in `urls_auth_aliases.py`).
5. **A Church Administrator could suspend, reactivate, delete, or reset the password of the Super Administrator account itself.** While adding the new "only the Super Admin can touch a Church Admin account" restriction, the first version of the check explicitly *excluded* Django staff/superuser accounts from the protected set (reasoning: "that's the Super Admin, not a Church Admin") — which backfired, since it meant the Super Admin ended up **less** protected than an ordinary Church Admin. Caught immediately by a live test (a test Church Admin account successfully suspended the real Super Administrator account), reactivated by hand, and fixed by protecting both the Super Admin account and Church Admin accounts under the same `requires_super_admin_to_manage()` check.
