# Mission Control Phase 6I.1 - Integrity Contract

Phase 6I.1 defines the contract Mission Control uses before any integrity verifier is allowed to judge records, evidence, lineage, governance decisions, replay artifacts, schemas, missions, or full context.

This phase is contract-only. It does not repair records, rewrite history, execute replay, verify external systems, or perform final certification.

## Contract Surface

The integrity contract captures:

- identity: `integrity_contract_id`, tenant, optional mission, type, scope, and target
- requester: operator, system, auditor, certification suite, or governance engine
- sources: truth records, events, evidence, lineage, governance, policy, recommendation, risk, confidence, replay, and schema refs
- expected and observed integrity states
- hash and schema requirements
- governance and authority boundaries
- optional evidence, lineage, and replay binding context
- failure, output, and audit policy
- lifecycle and certification state
- deterministic `contract_hash`

## Guardrails

The validator fails closed when required material is missing or unsafe:

- missing contract identity, tenant, type, target, scope, sources, expected state, policies, or audit requirements
- tenant or mission scope violations
- incompatible type and target pairs
- unsupported hash algorithm or unstable serialization
- silent schema substitution
- missing policy snapshot when historical governance is required
- current-policy substitution or governance bypass
- execution authority, authority expansion, source mutation, or unauthorized writes
- missing evidence, lineage, or replay context when required
- missing replay hash chain or provenance mismatch policy
- stale or incorrect contract hash

Integrity checks are read-only. The only permitted write boundary is `INTEGRITY_AUDIT_ONLY`, and only when write authority is verified.

## Determinism

`hashTruthIntegrityContract` hashes the canonical contract payload using stable serialization and the existing Mission Control confidence hash engine. The hash excludes the contract hash field itself, so equivalent object key ordering produces the same hash while changes to target, expected hashes, governance context, or authority context change the contract hash.

## Storage Shape

`toTruthIntegrityContractStorageRecord` serializes the contract into an `integrity_contracts`-style row with canonical JSON fields:

- `integrity_scope_json`
- `integrity_target_json`
- `requested_by_json`
- `source_refs_json`
- `expected_integrity_json`
- `observed_integrity_json`
- `hash_requirements_json`
- `schema_requirements_json`
- `governance_context_json`
- `authority_context_json`
- `evidence_context_json`
- `lineage_context_json`
- `replay_context_json`
- `failure_policy_json`
- `output_policy_json`
- `audit_policy_json`

## Certification Coverage

The focused test suite covers the 6I.1 certification matrix:

- valid and missing contract
- identity, tenant, mission, type, target, scope, requester, and source validation
- expected and observed integrity validation
- hash, schema, governance, authority, evidence, lineage, replay, failure, output, and audit policy validation
- result precedence
- event constants
- deterministic hashing
- storage serialization
- lifecycle transitions
- invalid-before-verification rejection
