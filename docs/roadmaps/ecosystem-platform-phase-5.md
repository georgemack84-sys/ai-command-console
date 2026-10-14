# Ecosystem Platform Phase 5

**Status:** In progress — milestone 5.10 reference integration in progress
**Architecture decision:** [ADR-0012](../architecture/ADR-0012-application-platform-boundary.md)

## Objective

Proprium becomes the shared, governed foundation for independently deployable
applications. Applications retain their domain logic and records; Proprium owns
their shared platform contracts and governance boundaries.

This roadmap intentionally uses the name **Ecosystem Platform Phase 5**. It is
separate from the historic Phase 5 recorded in the repository root roadmap.

## Releases and milestones

| Release | Milestones | Deliverable | Exit evidence |
| --- | --- | --- | --- |
| A — Application Foundation | 5.0–5.3 | Registry, guided onboarding, and scoped application identities | A developer registers a test application without direct database access; its credentials cannot impersonate a user or gain authority. |
| B — Capabilities and Governance | 5.4–5.7 | Declared capabilities, explicit grants, lifecycle, and event integration | A capability is discoverable but inert until separately authorized; suspended apps cannot start protected work. |
| C — Application Center | 5.8–5.9 | Actionable diagnostics and administration UI | Administrators can view and manage authorized application state through server-authorized mutations. |
| D — Integration Qualification | 5.10–5.11 | Nuru reference integration and release qualification | The end-to-end journey is evidenced, reversible, accessible, and independently deployable. |

## Milestone ledger

| Milestone | Status | Scope | Acceptance criterion |
| --- | --- | --- | --- |
| 5.0 | Complete | Platform boundary and contract baseline | ADR-0012 establishes one authoritative owner for each existing platform concern. |
| 5.1 | Complete | Application registry | Stable identities, workspace-scoped validated registrations, idempotent retries, and audit evidence. |
| 5.2 | Complete | Application onboarding | Guided, server-validated registration flow requires no direct database manipulation. |
| 5.3 | Complete | Application identities and credentials | Scoped, hashed credentials are rotatable/revocable and cannot impersonate users or grant capability authority. |
| 5.4 | Complete | Capability declaration and discovery | Versioned schemas, permissions, and constraints are discoverable but remain non-executable. |
| 5.5 | Complete | Permissions and consent | Scoped capability permissions require separate, non-self approval and support auditable revocation. |
| 5.6 | Complete | Lifecycle management | Explicit audited transitions enforce suspension and retirement boundaries for protected operations. |
| 5.7 | Complete | Event integration | Versioned, workspace-scoped subscriptions retain bounded retries and dead-letter diagnostics without granting authority. |
| 5.8 | Complete | Health and diagnostics | Actionable health isolates lifecycle, credential, subscription, retry, and dead-letter state from authorization. |
| 5.9 | Complete | Application Center | Administrative interface surfaces registry and health; mutations remain server-authorized. |
| 5.10 | Planned | Nuru reference integration | Nuru remains independently deployable and owns its domain records. |
| 5.11 | Planned | Qualification and release | Security, failure, accessibility, migration, browser, staging, and rollback evidence are accepted. |

## 5.1 implementation gate

Before implementation, the change set must include:

1. A registry-specific schema and migration under the canonical persistence
   boundary.
2. Input/output contracts that omit secrets and authorization grants.
3. A server-side service that checks existing workspace authorization for every
   registry operation.
4. Auditable, idempotent registration behavior and lifecycle-safe updates.
5. Tests proving duplicate slugs, cross-workspace access, invalid contract
   versions, and lifecycle violations fail safely.
6. A short architecture review against ADR-0012's non-duplication rule.

## Reference application order

1. Nuru
2. Headline Flow
3. Market Signal
4. Household Manager

Nuru is first because it has distinct service boundaries and valuable
read-oriented capabilities (knowledge search and evidence retrieval), allowing
the contracts to be proven before high-risk financial mutations.
