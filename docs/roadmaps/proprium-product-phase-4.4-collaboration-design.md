# Proprium Product Phase 4.4: Shared household collaboration design

Status: proposal — requires product approval before implementation.

## Purpose

Phase 4.4 lets a household owner share an existing household with another
person without changing authentication, recovery, semantic scope, or governed
execution. It is a product-membership capability: the API remains the sole
authority for every read and mutation.

## Current boundary

Today, `HouseholdMembership` records only a household ID, user ID, and join
time. `Household.OwnerUserId` is the sole owner fact. Existing bill and
realtime services authorize by persisted membership. There are no household
roles, invitations, notification delivery, or household audit records.

The first implementation must extend this model explicitly. It must not infer
administrative authority from UI visibility, a recipient's account role, an
email address, a semantic-scope relationship, or a legacy execution permission.

## Proposed first release

Invite a registered Proprium user to one household by their username. The owner
creates an invitation; the recipient must explicitly accept it. On acceptance,
the API creates a member relationship. The recipient can then use the existing
member-authorized household and bill experiences.

This intentionally excludes email delivery, links that create accounts,
recurrence, external sharing, and generalized workspace administration.

### Lifecycle

```text
owner creates pending invitation
    -> recipient accepts or owner revokes
    -> accepted invitation creates one membership
    -> owner may remove that member later
```

- Invitations target an existing user by immutable user ID after username
  resolution; the public API never returns the target's account-discovery data.
- Pending invitations expire after 7 days and may be revoked before acceptance.
- A household has at most one pending invitation per target user.
- Acceptance is idempotent: an existing membership is returned as the completed
  result, never duplicated.
- Revocation, expiry, or removal must make subsequent household reads,
  mutations, and realtime subscriptions fail server-side.

## Membership model

The initial household roles are deliberately small:

| Role | Capabilities | Explicit exclusions |
| --- | --- | --- |
| Owner | Rename household; create, revoke, and view invitations; remove members; initiate ownership transfer; all ordinary member bill capabilities | Cannot bypass authentication or grant application-wide identity roles |
| Member | Read and mutate household bills under existing product rules; view household members | Cannot rename household, invite, remove a member, or transfer ownership |

Owner is a household-local fact, not an application `Role` and not a permission
catalog grant. Product endpoints must evaluate it from the household record and
membership relationship for the requested household. The existing application
Member role continues to grant only authenticated application access and
self-profile management.

## Ownership transfer and owner departure

Ownership transfer is a separate, confirmation-gated command, never an effect
of accepting an invitation or removing a member.

- Only the current owner may initiate a transfer to an existing member.
- The target must explicitly accept while still a member.
- The transfer is atomic: exactly one owner exists before and after it.
- The current owner cannot remove themself or be removed while they remain the
  sole owner.
- A household cannot be left ownerless. Household deletion is out of scope.

## Notification and privacy policy

The first release uses in-product pending-invitation notifications after the
recipient signs in. It sends no email, SMS, push notification, or external
link. This avoids making an unverified contact method an authorization channel
and defers delivery, bounce, unsubscribe, and abuse concerns to a later
approved design.

Invitation creation returns a privacy-preserving result: it must not distinguish
an unknown username from a user who is ineligible or already invited. The owner
can see only invitations they created for their own household.

## Abuse and operational limits

- Limit each owner to 10 pending invitations per household and 20 creation
  attempts per rolling 24 hours.
- Apply rate limiting to create, accept, and revoke operations by authenticated
  actor and household.
- Use short, generic client errors for target resolution and authorization
  failures; detailed reason codes belong only in protected audit evidence.
- Do not expose invitation identifiers in analytics, logs, browser-visible
  error details, or cross-household queries.

## Audit and event evidence

Create a dedicated household-membership audit stream. Each event records:

- correlation ID, event ID, server timestamp, household ID, actor ID, target
  user ID when applicable, action, outcome, and a bounded reason code;
- invitation created, accepted, revoked, expired, and duplicate acceptance;
- member removed; ownership transfer initiated, accepted, rejected, and
  cancelled; and authorization or rate-limit denials.

Audit records are append-only and do not include a plaintext username beyond
what is already needed for protected operator evidence. Membership changes also
emit integration events only after the transaction commits; consumers must
re-authorize at delivery time rather than treating an event as authority.

## API and persistence direction

The implementation design should introduce:

- a household-local membership-role field plus a unique owner invariant;
- an invitation aggregate/table with opaque ID, target user ID, inviter ID,
  status, timestamps, expiry, and constrained reason fields;
- member and invitation projections scoped to the caller's household access;
- command endpoints for create/list/revoke invitation, accept invitation,
  list/remove member, and the separate ownership-transfer lifecycle;
- server-side authorization for every command and query, including realtime
  subscription invalidation after removal.

Exact routes, schemas, retention duration, and migration mechanics are deferred
to an approved implementation specification. No endpoint may accept a role,
owner flag, target user ID, or audit outcome as a client-authoritative claim.

## Required acceptance evidence

- An owner can invite, revoke, and remove only within their own household.
- A recipient must explicitly accept; before acceptance, no bill, household, or
  realtime data is exposed.
- A member cannot perform owner-only actions, even with crafted requests.
- Removal and revocation immediately deny new reads, commands, and subscriptions.
- Transfer preserves exactly one owner and cannot orphan a household.
- Duplicate, expired, cross-household, unauthenticated, and rate-limited cases
  leave persistence unchanged and produce audit evidence.
- Browser acceptance covers owner, recipient, non-member, revoked member, and
  restored-session paths. Integration tests cover each authorization boundary.

## Decisions requested

Approve or change these defaults before implementation:

1. Registered-user, in-product invitations only; no email delivery in 4.4.
2. Owner and Member are the only initial household roles.
3. Seven-day invitation expiry; ten pending invitations per household; twenty
   creation attempts per owner per day.
4. Two-party, explicit ownership transfer between existing members only.
5. Append-only household-membership audit evidence and post-commit integration
   events.

If approved, the smallest engineering slice is invitation creation, protected
recipient inbox, and accept/revoke flows. Member removal and ownership transfer
should follow only after that slice's evidence is accepted.
