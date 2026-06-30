# Mission Control Phase 6I.3 - Tamper Detection

Phase 6I.3 turns the integrity architecture from passive hash storage into active tamper evidence. It scans protected ledger records, recomputes canonical hashes, checks chain continuity, compares expected and observed references, and emits append-only findings.

This phase does not repair records, rewrite hashes, mutate source data, or certify the whole integrity architecture by itself.

## Detection Scope

Tamper detection covers:

- truth, event, evidence, recommendation, governance, escalation, lineage, replay, integrity, hash-chain, tenant-ledger, and archival records
- canonical payload hash mismatches
- stored-vs-expected hash mismatches
- parent hash breaks
- sequence reordering
- record deletion, insertion, and duplication
- evidence, replay, lineage, governance, and recommendation reference drift
- tenant-boundary drift
- unauthorized writes and supersessions
- archive mismatch and missing archive manifests
- stale or divergent indexes
- unknown or unverifiable integrity state

## Result States

Findings use the 6I.3 state model:

- `CLEAN`
- `SUSPECT`
- `TAMPERED`
- `INCOMPLETE`
- `UNVERIFIABLE`
- `INVALID`

Tampered, incomplete, unverifiable, and invalid findings block certification. Suspect findings require review but do not automatically prove ledger tampering.

## Engine Surface

`runTruthTamperScan` accepts a `TruthTamperScanRequest` and protected records, then returns:

- scan identity, tenant, mission, and scope
- deterministic findings
- append-only finding ledger records
- certification impact
- escalation and operator-review flags
- deterministic `scan_hash`
- read-only/source-mutation guard flags

## Guardrails

Tamper detection is read-only:

- it never mutates source records
- it never rewrites hashes
- it records findings append-only
- critical findings trigger escalation
- unverifiable records fail closed
- tenant drift and chain breaks are critical
- clean records remain certifiable

## Certification Coverage

The focused test suite covers:

- clean record validation
- content and metadata mutation
- evidence, replay, lineage, and governance drift
- hash mismatch and chain break
- deletion, insertion, reordering, and duplication
- replay divergence
- tenant-boundary drift
- unauthorized write and supersession
- archive mismatch and missing manifests
- index mismatch as suspect
- unverifiable and invalid fail-closed behavior
- certification impact
- append-only finding records
- deterministic scan hashes
