# W1.3A Messaging Core

W1.3A establishes the platform messaging core for deterministic, tenant-aware command and event transport across Core Infrastructure. The phase consumes W1.1A Identity Core and W1.2A Storage Core and qualifies the messaging substrate before downstream services depend on it.

## Constitutional Scope

- Owns command transport, event transport, retry services, dead-letter handling, tenant-aware routing, durable message persistence, transport monitoring, and messaging audit evidence.
- Enforces tenant and namespace boundaries for message routing.
- Preserves deterministic ordering, replay compatibility, authenticated transport, authorization checks, immutable audit evidence, and fail-closed behavior for critical defects.

## Implementation

- Contract: `types/messaging-core.ts`
- Service: `services/messaging-core/index.ts`
- API: `app/api/messaging-core/*`
- Tests: `tests/unit/messaging-core/messagingCore.test.ts`

## Qualification

The qualification suite verifies baseline activation, deterministic replay, command ordering, event immutability, retry and DLQ controls, durable persistence, tenant isolation, transport security, observability metrics, immutable audit evidence, conditional activation handling, activation failure, and fail-closed critical messaging defects.

The canonical successful readiness decision is `CORE_ACTIVATED`.
