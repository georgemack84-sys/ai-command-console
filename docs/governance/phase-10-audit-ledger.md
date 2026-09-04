# Phase 10 — Noesis Audit Ledger

The Phase 10 ledger is Noesis's canonical, workspace-scoped history of significant learning transitions. It records facts; it is not a mutable read model or a general application log.

Every event has a unique identity, ordered sequence, canonical SHA-256 hash, predecessor hash, timestamp, actor, correlation ID, optional causation ID, schema version, references, and immutable payload. PostgreSQL enforces append-only behavior on `noesis_learning_audit_events`.

The initial event taxonomy covers learning-gate decisions, durable commits, authority transitions, provenance links, conflict resolutions, and integrity/security failures. Ordinary operational failures remain in application logs.

The Phase 9 runtime records `LEARNING_GATE_EVALUATED` before promotion. `PrismaDurableRegistryWriter` records `DURABLE_KNOWLEDGE_COMMITTED` inside the same serializable transaction as the durable registry mutation. Audit failure therefore prevents an unaudited durable commit.

Managers may use the audit integrity endpoint and knowledge-history endpoint. The explanation service returns `EXPLANATION_INCOMPLETE` or `NOT_FOUND` when the evidence is absent; it must never fabricate historical facts.

`AuditLedgerVerifier` independently validates sequence, predecessor links, canonical hashes, workspace scope, event identity, actor identity, timestamps, and schema version.
