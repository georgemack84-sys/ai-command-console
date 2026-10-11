# Proprium Product Phase 4.5: Recovery and trust design

Status: proposal — requires product approval before implementation.

## Purpose

Phase 4.5 gives a person who has lost a password a safe, bounded path back to
their own account. It does not turn a username, an unverified contact address,
customer-support request, household membership, or an invitation into proof of
identity.

Recovery is an authentication-security feature. The API remains the authority
for contact verification, token issuance, password reset, session invalidation,
audit evidence, and every decision that changes account access.

## Current boundary

Proprium authenticates with a username, password, and opaque server-side
session. Registration, session refresh, logout, and revoked-session protection
already exist. The product does not yet have a verified recovery contact,
password-reset endpoint, user session-management screen, or support-led
account-recovery process.

Consequently, no current UI should imply that a household owner, an invitation
recipient, an operator, or an email address can restore account access.

## Proposed first release

Deliver recovery in two deliberately separate, authenticated and public flows.

1. An authenticated user adds or replaces one recovery email address and proves
   control of it by completing a short-lived verification challenge.
2. A person who cannot sign in may request a password reset only for a verified
   recovery email. The externally visible response is the same whether or not
   the account or email exists.

The public reset flow sends a one-time link to the verified address. The link
opens a neutral reset page, accepts a new password, invalidates all existing
sessions, and records protected audit evidence. It does not sign the browser in
automatically; the person signs in normally with the new password.

The first release excludes recovery by support ticket, SMS, voice call,
household-member approval, security questions, social login, backup codes,
passkeys, and multiple recovery contacts. Those mechanisms alter the threat
model and need separate approval.

## Security and privacy contract

### Recovery contact

- Store one normalized recovery email per account only after verification.
- Store the normalized value only where delivery requires it; protected
  projections expose at most a masked display value.
- Changing or removing a verified contact requires an authenticated current
  session and current-password proof. The existing verified contact receives a
  security notification when it changes, but that notification is not itself an
  approval path.
- A contact can be verified for only one account at a time. Requests that would
  reveal an existing association receive the same generic client response.

### Public reset request

- `POST` accepts an email-shaped recovery address and always returns a generic
  accepted response, regardless of account existence, contact-verification
  state, account state, or rate-limit outcome.
- Rate-limit by normalized contact, source/IP boundary, and account when known;
  use a conservative rolling window and record the protected reason for a
  denial or suppression.
- Do not return account ID, username, household name, invitation information,
  delivery result, or an error that distinguishes registered from unregistered
  input.

### Reset token

- Generate a cryptographically random, opaque, single-use token. Persist only a
  keyed hash, token family ID, timestamps, request metadata needed for abuse
  review, and terminal state; never persist the bearer token itself.
- A token expires after 15 minutes. Issuing a new token invalidates every
  outstanding reset token for that account.
- Token consumption is atomic. Expired, consumed, malformed, and superseded
  tokens return one generic reset failure and never alter password or session
  state.
- Reset URLs must be absent from analytics, application logs, browser-visible
  diagnostics, referrers where controllable, and audit payloads.

### Password and session outcome

- Validate the new password with the existing password-policy service; do not
  create a second client-only policy.
- On successful reset, atomically update the password credential, invalidate all
  opaque sessions for the account, consume the token, and append the success
  audit event. A failure leaves all four facts unchanged.
- Password reset does not alter household memberships, ownership, invitations,
  roles, bills, or semantic scope.

## Audit, retention, and support

Create a dedicated authentication-recovery audit stream. Each append-only event
includes event and correlation IDs, server timestamp, actor/account ID only
when safely known, bounded source metadata, action, outcome, and bounded reason
code. Required events are contact-verification requested/succeeded/failed,
contact changed/removed, reset requested/suppressed, token consumed/expired,
password reset succeeded/failed, and authorization/rate-limit denials.

Audit evidence is protected operational data. It must not contain bearer tokens,
raw recovery links, plaintext passwords, or more contact data than is necessary
for the approved retention policy.

Support may explain the self-service process and investigate protected audit
evidence, but may not manually set a password, disclose whether an account
exists, change a recovery contact without the authenticated proof above, or
bypass rate limits. A future exception process requires its own risk assessment,
dual-control design, and retention policy.

## API and persistence direction

The implementation should add:

- a verified-recovery-contact aggregate with verification challenge state;
- a recovery-token aggregate with a keyed token hash, expiry, single-use state,
  and account-wide supersession invariant;
- authenticated commands to begin/complete contact verification and to replace
  or remove a contact with current-password proof;
- a public reset-request command and a reset-completion command with uniform
  public responses;
- password/session mutation inside one transaction, followed by post-commit
  notifications and integration events;
- API, persistence, and operator-audit contracts that preserve enumeration
  resistance.

Exact routes, mail provider, delivery retries, contact normalization library,
rate-limit thresholds, notification copy, and retention duration are deferred
to the approved implementation specification. A provider outage must fail
closed without leaking account existence or issuing an un-deliverable valid
token.

## Required acceptance evidence

- A signed-in user can verify one recovery contact, view only its masked form,
  and replace or remove it only after current-password proof.
- A public reset request has indistinguishable status, body, and timing budget
  for known, unknown, unverified, and rate-limited contact input.
- A valid token resets the password once, revokes every existing session, and
  allows a subsequent normal sign-in.
- Replayed, expired, malformed, superseded, and cross-account tokens leave the
  credential and sessions unchanged.
- Contact changes, reset attempts, suppression, and outcomes create the
  expected protected audit evidence without secrets.
- Integration coverage proves transactionality, authorization, enumeration
  resistance, and rate-limit boundaries. Browser acceptance covers successful
  recovery, generic public responses, revoked-session behavior, and keyboard/
  screen-reader accessible form feedback.

## Decisions requested

1. Approve one verified email recovery contact as the only initial recovery
   factor; defer SMS, support-led recovery, backup codes, and secondary
   contacts.
2. Approve 15-minute, opaque, single-use reset tokens with account-wide
   supersession and no automatic post-reset sign-in.
3. Approve all-session invalidation after a successful password reset.
4. Approve generic public reset responses and protected-only delivery/abuse
   outcomes as the enumeration-resistance policy.
5. Approve the support boundary: guidance and protected investigation only, no
   manual credential reset or recovery-contact override.

If approved, the smallest engineering slice is authenticated recovery-contact
verification and its audit contracts. Public password reset follows only after
that slice has delivery and privacy evidence.
