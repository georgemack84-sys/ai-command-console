# Program 6 - P6.15 Evidence Aggregation & Qualification Ledger

P6.15 establishes the immutable evidence foundation for Civitas Proving Ground qualification by collecting, validating, aggregating, preserving, and governing proving evidence across simulation, replay, adversarial testing, resilience, performance, integration, exercises, benchmarking, certification rehearsal, and continuous validation.

## Scope

- Owns proving evidence, qualification evidence, evidence aggregation, lineage, and the immutable proving evidence ledger.
- Consumes P6.14 continuous validation outputs and the upstream proving-chain evidence.
- Produces the proving evidence ledger, qualification evidence packages, evidence registry, lineage graph, replay evidence references, federated evidence graph, audit reports, and governance policies.

## Constitutional Rule

Evidence with broken integrity, completeness, signatures, timestamps, provenance, replay references, lineage, append-only ledger behavior, or cryptographic verification never supplies Program Qualification. Such defects fail closed.

## API Surface

- `GET /api/proving-evidence-aggregation-qualification-ledger/contract`
- `POST /api/proving-evidence-aggregation-qualification-ledger/validate`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/collection`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/validation`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/aggregation`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/lineage`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/ledger`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/qualification`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/registry`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/replay`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/federation`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/audit`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/governance`
- `GET|POST /api/proving-evidence-aggregation-qualification-ledger/readiness`
