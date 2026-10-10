# Proprium Product Phase 4: From account to a useful household

Status: approved direction; 4.0 and 4.1 initial implementation in progress

## Purpose

Phase 4 turns the authenticated platform into the first coherent Proprium
customer journey:

```text
new user -> account -> private household -> first bill -> useful household home
```

The phase deliberately starts with a household financial workflow because the
platform already has transactional household membership and bill APIs. It does
not introduce a second, speculative domain model merely to make onboarding look
complete.

## Product outcome

A new customer can create an account, understand that a private household was
created for them, give that household an appropriate name, and record the first
bill they want to manage. Returning members can see that bill from their
household home and can safely end their session.

The success measure is activation, not registration: a newly registered user
reaches a household home containing at least one meaningful bill without needing
an operator, a URL, or knowledge of an internal identifier.

## Current foundation and constraints

Already implemented:

- account registration creates a `MEMBER` user, an authenticated session, a
  private household, and a membership in one transaction;
- the API enforces household membership for bill reads and mutations;
- the web app has protected routing, session renewal, logout, route states, and
  an accessible registration form.

Important gaps:

- the browser cannot discover the authenticated user's household or select an
  active household;
- there is no product household home, onboarding checkpoint, or bill UI;
- household naming, profile management, invites, recovery, and multi-household
  behavior have not been designed as customer experiences.

## Scope boundaries

Phase 4 owns customer-facing household identity and membership experiences. It
does **not** grant, infer, or widen execution authority.

| Concern | Phase 4 decision |
| --- | --- |
| Household access | The API remains the authority: every query and command verifies membership server-side. UI visibility is never authorization. |
| Roles | The initial slice uses the existing member relationship only. Household roles and delegated administration require an explicit later design and permission catalog change. |
| Semantic scope | Phase 2 defines applicability, containment, inheritance, and governed widening for information. A Phase 4 household is a product boundary, not a semantic-scope parent, authority grant, or execution scope. |
| Execution | Adding or changing a bill is a domain mutation with ordinary product authorization and audit/event behavior; it must not use or imply the legacy console's governed-execution authority. |
| Invitations and recovery | Deferred until the owner/member model, account recovery policy, abuse controls, and audit requirements are separately approved. |

Phase 2 and Phase 4 may proceed in parallel only if their contracts remain
separate and neither persists the other's identifiers as an authority shortcut.

## Delivery sequence

### 4.0 — Activation contract and household discovery

Define a minimal authenticated household projection and active-household rule.
For the first release, a user with one membership is automatically active; a
user with multiple memberships must select one explicitly before household data
is shown or changed. The projection must contain only the household identity,
display name, and the caller's membership metadata required by the UI.

Acceptance:

- a newly registered user can discover their generated household without a
  client-side database lookup;
- a user cannot discover a household they do not belong to;
- the active household is explicit in all bill requests and URL state;
- browser tests prove both the one-household and forbidden-household cases.

Implementation note: the initial API exposes `GET /api/v1/households` as the
authenticated caller's membership projection and preserves the household ID in
the client route. `PATCH /api/v1/households/{householdId}` permits renaming only
by the persisted owner; this is a temporary product rule, not a general roles
system.

### 4.1 — Smallest end-to-end onboarding slice

Ship one intentionally narrow journey:

1. After registration or first protected visit, show an onboarding checkpoint
   that confirms the private household.
2. Let the user rename that household, with clear validation and recoverable
   error states.
3. Take the user to `/households/{householdId}` and ask for their first bill.
4. Create the bill through the existing member-authorized API and show it in the
   household home.
5. On a later sign-in, bypass completed onboarding and show the same household
   home and bill.

This slice makes an existing backend capability useful before adding invites,
budgets, automation, or a generalized workspace system.

Exit gate:

- registration-to-first-bill works in a real browser against the staged
  Proprium web and API images;
- refresh and a new session preserve the household and bill;
- a non-member receives no household or bill data;
- logout and a revoked session return the user to the public authentication
  experience without cached private data;
- keyboard, screen-reader naming, validation, loading, empty, and error states
  meet the existing UI-foundation qualification standards.

### 4.2 — Household home and routine bill management

Expand the household home only after 4.1 evidence is accepted: list bills,
show meaningful due-date and payment-state cues, edit bill details, and mark a
bill paid or unpaid. Preserve the existing household-scoped API and integration
event behavior; define any new summary calculations as read models rather than
as a new authority mechanism.

### 4.3 — Account and household management

Design and implement profile editing, password change, session management,
household settings, and a multi-household switcher. Each sensitive mutation
needs its own API contract, validation, audit evidence, and browser acceptance
coverage.

### 4.4 — Shared household collaboration

Before implementation, approve the invitation lifecycle, membership roles,
revocation semantics, transfer-of-ownership rules, notification channel, abuse
limits, and audit trail. Do not ship invitations as an unbounded email feature
without these decisions.

### 4.5 — Recovery and trust completion

Approve a recovery model before exposing it: verified contact method, reset and
recovery tokens, enumeration resistance, session invalidation, rate limits,
support procedures, and evidence retention. Recovery changes authentication
security posture and is not a UI-only follow-up.

## Product decisions required before 4.1 is merged

1. **Name:** is the initial object always called a “household” in customer
   language, or should the interface use a broader term such as “space”? This
   roadmap uses *household* because it matches the implemented domain.
2. **Activation event:** for Phase 4 reporting, activation is “first bill
   created,” not merely “household renamed.”
3. **Initial bill fields:** retain the implemented name, amount, due date, and
   optional notes; recurrence, payee integrations, attachments, reminders, and
   budgets are out of scope for 4.1.
4. **Ownership:** a generated household has an owner in persistence, but 4.1
   exposes no owner-only UI until the role and transfer policies are approved.

## Release and platform work that remains independent

Before treating Phase 4 as customer-ready, complete the outstanding release
evidence for the merged account-creation commit: publish it with `Release
Proprium`, deploy the immutable SHA through `Deploy Proprium Staging`, manually
check registration, sign-in, refresh, logout, and revoked-session behavior, and
record a 30–120 minute staging soak. Turn those checks into a repeatable browser
acceptance suite before adding the Phase 4 flow.

macOS certification and reconciliation of obsolete root-Next.js documentation
remain platform work. They should be tracked alongside, but must not change the
production boundary: `apps/web` and `services/api/Proprium.Api` are Proprium;
the root Next.js application is transitional.
