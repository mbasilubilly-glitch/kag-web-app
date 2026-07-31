# TODO - Ministry Management Module

## Phase 1: Validate existing ministry enrollment + snapshot wiring
- [x] Fix Departments enrollment UI crash by consuming `/member-departments/snapshot/` correctly
- [x] Fix backend runtime import blocker by ensuring `DonationSerializer` import exists
- [x] Validate frontend `Ministries` + `SingleMinistry` pages call correct endpoints

## Phase 2: Ministry Management Module vertical slice (scaffold)
- [ ] Add backend ministry-scoped models (MinistryEvent, MinistryAnnouncement, MinistryMember, MinistryAttendance stubs)
- [ ] Add backend serializers/views with ministry isolation by `ministry` foreign key
- [ ] Add role-based authorization scaffolding (admin vs ministry leader vs member)
- [ ] Add frontend ministry dashboard pages (placeholders)
  - [ ] `Youth`, `Children`, `Men`, `WWK`, `Worship Team` pages or route group using `/:ministryKey`
  - [ ] Admin ministry member/events/attendance pages placeholders
- [ ] Add navigation links to the new ministry module

## Phase 3: Features per ministry
- [ ] Youth: age groups, mentorship stubs
- [ ] Children: check-in/out stubs
- [ ] Men: fellowship stubs
- [ ] WWK: prayer/prayer circle stubs
- [ ] Worship Team: schedule + setlist stubs

