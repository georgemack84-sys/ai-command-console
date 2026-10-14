# ADR-0012: Application Platform Boundary

**Status:** Accepted
**Date:** 2026-10-11

## Context

Ecosystem Platform Phase 5 makes Proprium a governed platform that independent
applications can join without surrendering ownership of their domain logic or
data. The repository already has qualified infrastructure for user sessions,
workspace authorization, governed mutation routing, audit evidence, operational
telemetry, and PostgreSQL persistence. A new application platform must compose
those authorities instead of recreating them.

The first reference integration will be Nuru. Its read-oriented knowledge and
evidence capabilities provide a lower-risk path for proving application
registration, discovery, authentication, authorization, and audit.

## Decision

The Application Platform owns only the cross-application contract layer:

- application registration and stable application identifiers;
- declarative application metadata, ownership, lifecycle state, and supported
  contract versions;
- references to application service identities and credentials;
- versioned capability declarations and their schemas; and
- application-specific health, diagnostic, and integration-status projections.

The platform does **not** make registration, identity issuance, capability
declaration, health, or discovery equivalent to authorization. Every protected
application operation remains subject to the existing authorization and
governed-execution path.

### Authoritative ownership

| Concern | Existing authority | Application Platform responsibility |
| --- | --- | --- |
| Human authentication and sessions | `src/lib/auth.ts`, `src/server/services/auth-service.ts` | Identify the initiating human through the existing session; do not issue user sessions. |
| Workspace access and roles | `src/server/auth/permissions.ts` | Require the existing workspace authorization before registry reads or mutations. |
| Protected mutation admission | `services/runtimeControl.js`, `services/executionEngine.js`, `services/toolRouter.js` | Submit protected operations through the governed path; do not create an execution gateway. |
| Audit evidence | `services/auditTrail.js` and domain audit ledgers | Emit application-platform events with application and correlation identifiers; do not create a second audit store. |
| Operational telemetry and health | `src/server/services/control-center-service.ts`, `app/api/control-center/overview/route.ts` | Contribute application diagnostic projections; do not replace runtime observability. |
| Canonical relational persistence | PostgreSQL through `services/api/Proprium.Infrastructure/Persistence/PropriumDbContext.cs` | Add registry-owned relational records in the canonical database when implementation begins. |
| Semantic scope | `src/server/knowledge/scope-service.ts` | Remain separate. A registered application is never a semantic-scope parent or implicit scope authority. |

### Required authorization sequence

```text
registration -> service identity -> capability declaration -> explicit authorization
  -> governed invocation -> audit evidence
```

Each transition is independently validated and auditable. Later transitions
cannot be inferred from earlier ones:

- Registration supplies identity and metadata, never execution rights.
- A service identity authenticates an application, never impersonates a human.
- A capability declaration makes an interface discoverable, never executable.
- Authorization is scoped and revocable through the authoritative policy path.
- Invocation must preserve application, service-identity, workspace, user (when
  present), correlation, capability-version, and authorization evidence.

### Registry contract baseline

Phase 5.1 will introduce a versioned application registry. Its first contract
version must represent the following fields without embedding credentials,
authorization grants, semantic scope hierarchy, or domain records:

| Field | Purpose |
| --- | --- |
| `applicationId` | Stable, opaque platform identifier. |
| `slug` | Human-readable, immutable integration key after activation. |
| `displayName` and `description` | Administrative presentation only. |
| `ownerWorkspaceId` and `ownerApplicationContact` | Administrative ownership and escalation routing. |
| `lifecycleState` | `DRAFT`, `ACTIVE`, `SUSPENDED`, `MAINTENANCE`, `DEPRECATED`, or `RETIRED`. |
| `supportedContractVersions` | Registry/capability/event contract compatibility, not domain API compatibility. |
| `serviceIdentityReference` | Pointer to the later credential/identity authority; never secret material. |
| `metadata` | Bounded, validated non-secret integration metadata. |
| `createdAt`, `updatedAt`, `createdBy` | Administrative and audit correlation. |

Lifecycle changes must be explicit state transitions. `SUSPENDED` and `RETIRED`
applications cannot begin protected operations; suspension does not delete an
application's independently owned domain data.

## Consequences

- Application registry work begins as a new bounded context, not as extensions
  to household, Nuru, or semantic-scope tables.
- Phase 5.1 may persist registry records, but Phase 5.3 owns credential
  issuance, rotation, revocation, and secret storage.
- Phase 5.4 may persist capability declarations, but Phase 5.5 owns grants,
  consent, revocation, and authorization decisions.
- Phase 5.7 may define application event contracts, but existing governed
  routing and authorization boundaries remain mandatory for protected effects.
- Any proposal that introduces a second session system, role engine, policy
  evaluator, audit ledger, execution gateway, or event broker is out of scope
  unless it explicitly amends this ADR with a migration and retirement plan for
  the existing authority.

## Acceptance evidence for Phase 5.0

1. This ADR identifies the authoritative implementation boundary for identity,
   authorization, execution, audit, telemetry, persistence, and semantic scope.
2. The registry contract reserves no credential, grant, semantic-authority, or
   domain-data fields.
3. The Phase 5 delivery plan maps each future concern to a single owner.
4. Phase 5.1 implementation review must demonstrate that no new component
   duplicates an authority listed above.
