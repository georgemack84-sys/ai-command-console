# Phase 8A.6 - Governance Interfaces

## Purpose

The Governance Interfaces framework defines the exclusive, deterministic communication boundary between Controlled Autonomy and Mission Control Phase 7 Governance Intelligence. Every governance interaction must pass through versioned receive or publish gateway contracts with constitutional validation, authority checks, replay registration, lineage registration, truth ledger references, integrity protection, and operator visibility.

## Implemented Artifacts

- `types/autonomy-governance-interfaces.ts` defines transactions, payloads, validation results, audit ledgers, replay results, visibility surfaces, scenarios, and failure reasons.
- `services/autonomy-governance-interfaces/index.ts` implements receive and publish transaction creation, schema and tenant validation, governance authorization, constitutional compliance checks, authority-scope checks, replay and lineage registration, truth-ledger registration, integrity checks, immutable audit ledgers, replay, and visibility.
- `app/api/autonomy-governance-interfaces/*` exposes authenticated framework, transaction, validate, ledger, replay, and visibility endpoints.
- `tests/unit/autonomy-governance-interfaces/autonomyGovernanceInterfaces.test.ts` covers accepted transactions, rejection scenarios, ledgers, replay, integrity failure detection, and visibility.

## Gateway Coverage

The receive gateway accepts governance state, policies, authority, risk, compliance, recommendations, escalations, replay references, and lineage metadata. The publish gateway emits autonomy state, authority usage, execution intent, evidence, replay data, and lifecycle events.

## Validation Coverage

Every transaction validates schema version, tenant ownership, governance authorization, constitutional compliance, policy compatibility, authority scope, replay registration, lineage registration, truth-ledger registration, integrity, and absence of hidden routes.

## Replay And Visibility

Every transaction records transaction ID, autonomy ID, tenant, mission, source, destination, payloads, governance profile, authority scope, replay reference, lineage reference, truth-ledger reference, constitutional decision, integrity hash, and timestamp. Visibility exposes interface activity, governance interactions, policy exchanges, authority decisions, replay references, lineage references, execution intent, evidence flow, lifecycle events, interface health, and integrity status.
