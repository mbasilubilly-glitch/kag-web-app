# User Management + Approval + SUPER_ADMIN Authorization (Backend)

## What your system already does (mapped from current code)

### 1) User Management Service
**Endpoints in this repo** (`backend/api/urls.py`):
- `GET /api/users/` -> `UserListView`
- `GET/PATCH/PUT/DELETE /api/users/<id>/` -> `UserDetailView`

**Admin access rule**:
- Implemented in code via `is_church_admin()` in `backend/api/views.py`
- Admin roles allowed: `is_staff/is_superuser` OR `MemberProfile.role in ('Administrator','Pastor')`

### 2) Approval Service
**Pending users (Pending -> Active/Rejected)**
- `GET /api/profiles/pending/` -> `PendingProfilesListView`
- `POST /api/profiles/approval/` -> `MemberProfileApprovalView`

Workflow:
- `PENDING_APPROVAL` -> `ACTIVE` (approve)
- `PENDING_APPROVAL` -> `REJECTED` (reject)

### 3) Authorization Middleware (Role Management)
**SUPER_ADMIN only endpoint**
- `PATCH /api/users/<id>/role/` -> `UserRolePatchView` in `backend/api/views_role.py`

Enforced by:
- `is_super_admin()`
  - `user.is_staff or user.is_superuser`
  - OR `user.profile.role in ('Administrator','Pastor')`

On success, backend forces:
- `profile.status = 'ACTIVE'`
- `profile.email_verified = True`
- `profile.phone_verified = True`

Then applies the requested `role` and writes an audit record:
- `RoleAuditLog` via `backend/api/role_audit.py`

## Note: mismatch with your description
Your description mentions `PATCH /api/users/:id/status` and `PATCH /api/users/:id/approve` and `PATCH /api/users/:id/reject`.

In this repo, those actions are implemented as:
- `POST /api/profiles/approval/` with payload `{ user_id, status }`

No dedicated `/api/users/<id>/status` or `/api/users/<id>/approve|reject` routes currently exist.

## If you want exact endpoint parity
Tell me and I will add routes + serializers + view methods to support:
- `PATCH /api/users/<id>/status/`
- `PATCH /api/users/<id>/approve/`
- `PATCH /api/users/<id>/reject/`

…and keep `requireRole('SUPER_ADMIN')` consistent with existing `is_super_admin()` logic.

