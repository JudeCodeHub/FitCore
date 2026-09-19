# classes module

Read-only weekly timetable so far — no admin/trainer create/edit UI yet
(the backend CRUD exists; this module just displays the schedule).

**Routes:** `/admin/classes`, `/member/classes`. The trainer dashboard
(`/trainer`, in the `dashboard` module) also renders this module's
`WeeklyTimetable` component, filtered to the trainer's own classes.

**Data deps:** `apps/api` — `GET /classes?from=&to=`.
