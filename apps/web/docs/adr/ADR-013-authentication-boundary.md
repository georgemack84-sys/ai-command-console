# ADR-013: frontend authentication boundary

The frontend treats `GET /api/v1/auth/me` as its sole identity authority. The canonical client sends credentialed requests and adds `X-Proprium-CSRF: 1` to every state-changing method, including login and logout. Login and logout accept only `204 No Content` and identity is never inferred from them.

Middleware admission uses the opaque `__Host-proprium_session` cookie name from the backend [authentication and session design](../../../../docs/architecture/authentication-and-session-design.md). Browser `__Host-` enforcement supplies Secure, `Path=/`, and no Domain attribute; middleware checks only presence and maximum length. It never parses or authenticates the cookie.

Protected routes render a neutral client resolution frame until `/auth/me` succeeds. There is no protected server component data fetch, browser-storage restoration, or silent refresh. `401` clears the session view; `403` preserves it.
