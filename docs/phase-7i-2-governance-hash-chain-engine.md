# Phase 7I.2 Governance Hash Chain Engine

Phase 7I.2 implements the deterministic hash-chain foundation for Governance Intelligence. It consumes the Phase 7I.1 governance integrity contract, serializes protected governance artifacts canonically, generates versioned hashes, links records sequentially, and validates the resulting chain fail-closed.

## Surface

- Type contract: `types/governance-hash-chain.ts`
- Engine: `services/governance-hash-chain/index.ts`
- API: `app/api/governance-hash-chain/*`
- Tests: `tests/unit/governance-hash-chain/governanceHashChain.test.ts`

## Engine Components

- Canonical serialization engine: stable payload ordering, serializer versioning, deterministic canonical hash.
- Cryptographic hash generator: SHA-256 compatible project hash utility, hash version, content hash, canonical hash, timestamp.
- Governance chain builder: ordered chain records with immutable `previous_hash`, `current_hash`, `root_hash`, `chain_position`, and `chain_id`.
- Lineage hash graph: ancestry record ids and edge hashes for root-to-leaf reconstruction.
- Replay hash chain: replay input, state, output, reconstruction, verification, and Truth Ledger references.
- Integrity ledger integration: append-only ledger metadata for each chain record.
- Chain validator: deterministic diagnostics with `VALID`, `DEGRADED`, and `CORRUPTED` states.

## Failure Rules

The validator fails closed:

- `CANONICAL_SERIALIZATION_MISMATCH`, `CONTENT_HASH_MISMATCH`, `PREVIOUS_HASH_MISMATCH`, `ROOT_HASH_MISMATCH`, `MISSING_CHAIN_RECORD`, `DUPLICATE_CHAIN_POSITION`, `REORDERED_CHAIN`, `REPLAY_HASH_MISMATCH`, and `CROSS_TENANT_LINKAGE` produce `CORRUPTED`.
- `UNSUPPORTED_HASH_ALGORITHM`, `MISSING_LINEAGE_REFERENCE`, and `LEDGER_PERSISTENCE_DELAY` produce `DEGRADED`.

Any corrupted finding dominates degraded findings.

## API

- `GET /api/governance-hash-chain/contract`
- `POST /api/governance-hash-chain/build`
- `POST /api/governance-hash-chain/validate`
- `POST /api/governance-hash-chain/serialize`
- `POST /api/governance-hash-chain/classify`
- `POST /api/governance-hash-chain/lineage`
- `POST /api/governance-hash-chain/replay`
- `POST /api/governance-hash-chain/ledger`
- `GET|POST /api/governance-hash-chain/inspect`

All routes require workspace membership and return the standard API response envelope.

## Developer Notes

Use `buildGovernanceHashChain()` for the baseline chain, `canonicalizeGovernanceArtifact()` plus `generateGovernanceArtifactHash()` for standalone artifact hashing, and `validateGovernanceHashChain()` for diagnostics. Scenario inputs provide deterministic negative fixtures for Phase 7I.3 tamper detection.
