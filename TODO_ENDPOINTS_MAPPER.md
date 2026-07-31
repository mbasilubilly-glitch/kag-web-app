# Endpoint mapping status

Goal: match the spec routes exactly.

Spec routes mentioned by user:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/send-email-verification
- POST /api/auth/verify-email
- POST /api/auth/send-otp
- POST /api/auth/verify-otp
- GET /api/users/pending
- PATCH /api/users/:id/approve
- PATCH /api/users/:id/reject
- PATCH /api/users/:id/role (SUPER_ADMIN only)

Current system routes (existing):
- POST /api/auth/register/ (already exists)
- POST /api/auth/token/ (JWT login)
- POST /api/auth/verify/send/ and /api/auth/verify/check/ (email OTP)
- POST /api/auth/password-reset/send/ and /api/auth/password-reset/confirm/ (password reset OTP)
- GET /api/profiles/pending/ (pending profiles)
- POST /api/profiles/approval/ (ACTIVE/REJECTED via MemberProfileApprovalView)
- PATCH /api/users/:pk/role/ (SUPER_ADMIN role patch)

Missing/needs aliasing:
- Aliases for spec route names to these current routes.

Planned implementation:
- Add URL aliases in backend/backend/urls.py or backend/api/urls.py mapping spec paths to existing views.
- Prefer aliases that only change the URL path; no business logic duplication.

