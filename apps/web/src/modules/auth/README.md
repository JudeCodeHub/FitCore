# auth module

Owns the login and signup pages. Staff onboarding (invite-based) and
password reset pages are not built yet — they'll land here too when
their checklist items come up.

**Routes:** `/login`, `/signup`

**Data deps:** `apps/api` — `POST /auth/login`, `POST /auth/signup`,
`GET /auth/me`, `POST /auth/logout`.

The auth **context** (current user, tokens) does not live here — it's
in `shared/auth/`, since every module needs to know who's logged in,
not just these pages.
