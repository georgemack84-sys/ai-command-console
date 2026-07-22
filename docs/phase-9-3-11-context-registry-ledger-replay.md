# Mission Control Phase 9.3.11 - Context Registry, Ledger & Replay

Phase 9.3.11 adds deterministic persistence infrastructure for certified decision contexts.

## Scope

The infrastructure:

- registers certified decision contexts as immutable registry records;
- emits append-only ledger entries for registration, validation, certification, replay
  generation, and replay verification;
- stores serialized context, validation reports, explainability reports, replay packages, and
  certification evidence in repository records;
- generates self-contained replay packages with resolver versions, dependencies, lineage, and
  hashes;
- preserves an immutable audit trail;
- fails closed for duplicate identity, incomplete persistence, uncertified validation,
  incomplete replay package, integrity failure, version conflict, and cross-tenant storage.

## Public API

`createContextRegistryRequest(overrides?)`

Creates a request with candidate, decision context, validation report, existing registry, and
registry version.

`registerContext(request?)`

Returns a `ContextRegistryPackage` containing:

- registry record
- ledger entries
- repository record
- replay package
- audit trail
- validation result
- replay reference
- integrity hash

`replayContextRegistry(package)`

Recomputes the package hash and reports whether registry, ledger, repository, replay package,
and audit trail can be reconstructed exactly.

`buildContextRegistryObservability(packages)`

Aggregates registration attempts, successes, failures, ledger entries, replay packages,
duplicate identity failures, persistence failures, replay failures, integrity failures,
isolation failures, and replay success rate.

`getContextRegistryLedgerReplayInfrastructure()`

Returns registry version, fixed ledger event order, default request, default registry package,
replay result, and observability snapshot.

## Lifecycle

The default registration emits deterministic ledger events in this order:

1. `CONTEXT_REGISTERED`
2. `CONTEXT_VALIDATED`
3. `CONTEXT_CERTIFIED`
4. `CONTEXT_REPLAY_GENERATED`
5. `CONTEXT_REPLAY_VERIFIED`

Ledger entries are hash-chained from `GENESIS` and are never modified.
