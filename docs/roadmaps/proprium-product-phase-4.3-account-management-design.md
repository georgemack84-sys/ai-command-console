# Proprium Product Phase 4.3: Account management design

Status: profile-editing implementation in progress; password, cross-session,
and multi-household work remains deferred.

## First implementation slice

Ship self-service display-name editing only. It changes no credential,
membership, role, household ownership, or session-validity state.

- Add `identity.profile.manage-self`; grant it only to the existing Member role.
- Add `PATCH /api/v1/auth/me` accepting exactly one trimmed display name of 1–240
  characters, authenticated through the existing opaque session.
- Persist the change for the authenticated user only, record a dedicated
  successful or denied authentication audit event with correlation ID, and return
  the updated current-user projection with `Cache-Control: no-store`.
- Add a protected Profile page with one clearly labelled display-name form; after
  success it refreshes the authoritative authentication state.

The mutation does not rotate or revoke a session: display name is presentation
identity, not a credential or security factor.

## Deferred decisions

| Capability | Required decision before implementation |
| --- | --- |
| Password change | Current-password proof, password policy, rate limit, event retention, and whether success revokes every other session. |
| Session management | Session list metadata/privacy, exact revocation scope, current-session handling, device naming, and audit retention. |
| Household settings | Owner/member policy for each setting and the required household audit events. |
| Multi-household switcher | Active-household selection persistence, no-membership behavior, URL precedence, and stale-selection recovery. |

## Exit evidence

- A member can update only their own display name through a real browser.
- The returned and refreshed authenticated state uses the new value.
- Invalid input, unauthenticated access, and cross-user mutation attempts are
  denied without changing persistence.
- Permission catalog, audit, API, component, and browser coverage are present.
