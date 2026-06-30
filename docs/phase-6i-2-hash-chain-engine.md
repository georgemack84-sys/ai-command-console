# Mission Control Phase 6I.2 - Hash Chain Engine

Phase 6I.2 creates the first active proof layer in the integrity architecture. It consumes a valid 6I.1 Integrity Contract and builds a deterministic, read-only hash-chain execution result.

This phase does not repair records, rewrite hashes, mutate evidence, rewrite lineage, alter governance decisions, execute replay, or perform final integrity certification.

## Engine Surface

The hash-chain engine produces:

- `hash_chain_id`
- linked `integrity_contract_id`
- tenant and optional mission
- hash chain type, scope, and target
- source refs and source artifacts
- canonicalization, ordering, and hash contexts
- hash nodes and hash edges
- chain root
- chain proof
- expected and observed chain state
- completeness and integrity reports
- final chain result state
- failure and escalation reasons
- audit events
- deterministic `chain_execution_hash`

## Proof Construction

Each source artifact becomes a deterministic hash node. Nodes include source refs, tenant and mission scope, canonical payload hash, expected and observed hashes, schema/governance/evidence/lineage refs, order, and node hash.

Edges prove relationships between nodes. The default builder creates `SEQUENCE_NEXT` edges; explicit edge specs can model governance, lineage, evidence, replay, schema, and dependency relationships.

The root hash is derived from ordered node hashes, edge hashes, the chain ID, and the root strategy. The proof hash then binds the root, path hashes, canonicalization context, ordering context, and hash context.

## Result Classification

The engine uses the 6I integrity precedence:

```txt
INVALID > UNAUTHORIZED > CORRUPTED > INCOMPLETE > MISMATCH > VERIFIED
```

It resolves to:

- `VERIFIED` when all required nodes, edges, hashes, root, scope, authority, governance, evidence, lineage, replay provenance, schema context, ordering, and serialization checks pass
- `MISMATCH` when expected and observed hashes differ but the chain is otherwise checkable
- `INCOMPLETE` when required artifacts, edges, hashes, or proof material are missing
- `CORRUPTED` when hash evidence indicates tampering or payload conflict
- `UNAUTHORIZED` when artifacts or edges exceed authority
- `INVALID` when contract, scope, target, tenant, mission, ordering, hash algorithm, governance, authority, schema, or provenance rules fail closed

## Guardrails

Hash-chain execution is read-only:

- source records are not mutated
- evidence is not rewritten
- lineage is not rewritten
- governance decisions are not rewritten
- replay artifacts are not rewritten
- execution authority is forbidden
- source mutation is forbidden
- cross-tenant edges fail closed
- current policy substitution fails closed
- governance bypass fails closed
- non-deterministic ordering and unstable serialization fail closed

## Storage Shape

`toTruthHashChainExecutionStorageRecord` serializes the result into a `hash_chain_executions`-style row with canonical JSON fields for scope, target, requester, source refs, canonicalization context, ordering context, hash context, expected and observed chain state, nodes, edges, root, proof, reports, failures, escalations, and audit events.

## Certification Coverage

The focused test suite covers:

- integrity contract loading and hash validation
- scope, tenant, mission, and target validation
- source artifact loading, missing artifacts, tenant mismatch, and authorization
- stable canonicalization and deterministic ordering
- node hash creation, missing expected hashes, mismatches, and corruption
- edge hash creation, missing edges, mismatches, and cross-tenant edges
- linear, graph, replay, governance, evidence, lineage, and schema chains
- root and proof generation
- result-state classification
- deterministic root and execution hashes
- audit event emission
- storage serialization
