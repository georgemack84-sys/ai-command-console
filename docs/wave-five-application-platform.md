# Wave 5.1 Application Platform

Wave 5.1 establishes the shared application platform used by governed Civitas ecosystem applications. It is an interaction and integration layer, not an execution authority and not an owner of application-specific business logic.

## Platform Surfaces

- Application architecture, service boundaries, context contracts, versioning, compatibility, and evidence responsibilities.
- Application shell with deterministic states: Initializing, Authenticating, Loading Context, Ready, Degraded, Access Restricted, Application Suspended, Session Expired, and Unavailable.
- Permission-aware navigation, route guards, deep-link equivalence, invalid-route safety, and cross-application routing.
- Universal Search with provider orchestration, tenant and namespace filtering, result provenance, and non-disclosure guarantees.
- Shared component library with accessibility utilities, status semantics, advisory/authoritative separation, and no authorization inference.
- Application SDK with typed contracts, gateway integration, context propagation, idempotency, schema validation, and secret-free client behavior.
- Application Gateway with identity, session, tenant, namespace, lifecycle, certification, permission, authority, schema, rate, quota, idempotency, redaction, evidence, and replay controls.
- Notification framework with permission-aware delivery, acknowledgement tracking, deep-link authorization, advisory-only behavior, and delivery evidence.
- Permission framework that preserves backend authority and revocation behavior.
- Command interface that submits through governed admission without direct execution.
- Evidence and telemetry for correlation, lineage, replay metadata, redaction, and tenant-isolated operations.
- Developer experience with docs, starter templates, reference application, contract tooling, and CI checks.

## Qualification Behavior

The default decision is `QUALIFIED`. Missing non-constitutional implementation work degrades to `CONDITIONALLY_QUALIFIED`. Invariant violations such as gateway bypass, client-side authorization authority, cross-tenant routing, search metadata leakage, notification action authorization, direct command execution, secret-bearing SDK behavior, or incomplete evidence lineage produce `NOT_QUALIFIED`.

## Interfaces

- `GET /api/wave-five-application-platform/contract`
- `POST /api/wave-five-application-platform/validate`
- Section endpoints: `architecture`, `shell`, `navigation`, `search`, `components`, `sdk`, `gateway`, `notifications`, `permissions`, `commands`, `evidence-telemetry`, `developer-experience`, and `readiness`
