# Children’s Ministry (admin-only) — TODO

## Backend
- [ ] Add Django models:
  - [ ] Parent/Guardian profile linked to auth `User`
  - [ ] Child profile linked to guardian(s)
  - [ ] Child medical/allergy info
  - [ ] Attendance session model
  - [ ] Attendance record per child per session
- [ ] Add serializers for the above models
- [ ] Add admin-only views/endpoints:
  - [ ] CRUD guardians
  - [ ] CRUD children + medical info
  - [ ] Create/list attendance sessions
  - [ ] Submit attendance records for a session
- [ ] Add URLs for the new endpoints
- [ ] Create and run migrations

## Frontend (admin)
- [ ] Create admin pages:
  - [ ] Children registration (child + guardian + medical/allergy fields)
  - [ ] Guardian profiles page
  - [ ] Attendance tracking page
- [ ] Wire routes into `frontend/src/App.jsx` under `/admin/*`
- [ ] Add navigation links in `frontend/src/pages/AdminLayout.jsx`

## Validation
- [ ] Run `python manage.py makemigrations` and `migrate`
- [ ] Run frontend build
- [ ] Manual smoke test:
  - [ ] Admin creates guardian + child
  - [ ] Admin creates attendance session
  - [ ] Admin marks children present/absent

