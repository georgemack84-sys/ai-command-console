# Proprium Product Phase 4: From account to a useful household

Status: 4.0 through 4.3 are complete and staged. The approved first 4.4
collaboration slice—registered-user invitations, recipient acceptance,
membership removal, rate limits, and append-only audit evidence—is complete
and staging-verified. Ownership transfer and recovery remain separate decisions.

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
- authenticated users can discover their household, rename it when they are the
  owner, create and manage bills, and update their display name;
- household owners can invite an existing registered user, and recipients can
  accept invitations; owners can revoke invitations and remove non-owner
  members.

Important gaps:

- recovery, password management, session management, ownership transfer, and
  multi-household selection remain to be designed as customer experiences.

## Scope boundaries

Phase 4 owns customer-facing household identity and membership experiences. It
does **not** grant, infer, or widen execution authority.

| Concern | Phase 4 decision |
| --- | --- |
| Household access | The API remains the authority: every query and command verifies membership server-side. UI visibility is never authorization. |
| Roles | Household-local Owner and Member capabilities are evaluated from persisted household and membership facts. They do not grant application-wide identity roles or execution authority. |
| Semantic scope | Phase 2 defines applicability, containment, inheritance, and governed widening for information. A Phase 4 household is a product boundary, not a semantic-scope parent, authority grant, or execution scope. |
| Execution | Adding or changing a bill is a domain mutation with ordinary product authorization and audit/event behavior; it must not use or imply the legacy console's governed-execution authority. |
| Invitations | The first collaboration slice uses registered-user, in-product invitations only, with recipient acceptance, owner revocation/removal, abuse limits, and protected audit evidence. |
| Recovery | Deferred until the account-recovery policy, abuse controls, support boundary, and audit requirements are approved. |

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

The first approved slice is self-service display-name editing. It has a
dedicated self-management permission, authenticated API contract, audit event,
protected Profile page, and staging browser acceptance coverage. Password
change, session management, household settings, and a multi-household switcher
remain separate decisions; each sensitive mutation needs its own contract,
validation, audit evidence, and browser acceptance coverage.

### 4.4 — Shared household collaboration

The first approved collaboration slice is complete: an owner can create a
bounded, in-product invitation for an existing registered user; the recipient
can accept it idempotently; owners can revoke pending invitations and remove
non-owner members. The API enforces household-local authorization and records
append-only invitation/member evidence. Staging acceptance proves invitation,
acceptance, removal, and immediate loss of household access across two accounts.

Ownership transfer remains deliberately deferred. It needs its own
confirmation-gated contract and invariant evidence before it is exposed. The
original policy rationale remains in
[the Phase 4.4 collaboration design](proprium-product-phase-4.4-collaboration-design.md).

### 4.5 — Recovery and trust completion

Approve a recovery model before exposing it. The decision-ready proposal is in
[the Phase 4.5 recovery and trust design](proprium-product-phase-4.5-recovery-and-trust-design.md).
It covers verified recovery contact, reset-token handling, enumeration
resistance, session invalidation, rate limits, support procedures, and evidence
retention. Recovery changes authentication security posture and is not a
UI-only follow-up.

## Product decisions recorded for the initial onboarding slice

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

Each merged Phase 4 slice is published with `Release Proprium`, deployed by
immutable SHA through `Deploy Proprium Staging`, and qualified through the
repeatable staging browser suite. Registration, sign-in, refresh, logout,
revoked-session behavior, onboarding, profile persistence, and the two-account
collaboration flow now have staging evidence. A fresh deployment still requires
its own 30–120 minute staging soak before it is treated as release-qualified.

macOS certification and reconciliation of obsolete root-Next.js documentation
remain platform work. They should be tracked alongside, but must not change the
production boundary: `apps/web` and `services/api/Proprium.Api` are Proprium;
the root Next.js application is transitional.
