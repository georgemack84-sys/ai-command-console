# Phase 6H.3 Replay State Reconstruction

Phase 6H.3 converts a certified Phase 6H.2 replay input bundle into a deterministic historical state package. It reconstructs the state represented by the bundle so future replay execution can consume it without mutating history or expanding authority.

This phase does not execute replay, run inference, recompute recommendations, recompute risk or confidence, compare replay output, modify truth records, rewrite evidence or lineage, change governance decisions, fetch external data, execute tools, or perform remediation.

## State Package

The replay state package records the state package identity, replay and bundle identity, replay contract reference, input bundle hash, state reconstruction type, replay boundary, state components, schema and serialization state, timeline, transition log, state graph, invariants, consistency report, state hashes, reconstruction state, certification state, failure reasons, escalation reasons, audit events, and immutable storage fields.

## State Components

State components use a common shape: component ID, component type, tenant and mission scope, source refs, source hashes, reconstructed value, reconstruction method, completeness, integrity, and component hash. Components cover truth, event, evidence, lineage, governance, authority, recommendation, risk, confidence, escalation, runtime, mission, operator, schema, and serialization state.

## Boundary, Timeline, And Transitions

The replay state boundary identifies the historical point being reconstructed. It must be deterministic, scoped to tenant and mission, and hash-addressed.

The timeline is built from the input bundle ordering context. The transition log explains deterministic state changes derived from ordered input refs. Invalid transitions fail closed.

## Invariants And Consistency

State invariants preserve tenant isolation, mission scope, governance supremacy, operator authority, absence of execution authority, source immutability, evidence lineage, historical policy context, deterministic ordering, and schema context.

The consistency report checks truth/event, evidence/recommendation, lineage/event, governance/policy, authority/requester, mission scope, runtime/governance, and schema/source consistency.

## Hashing

The package generates stable hashes for every required state component, timeline, transition log, state graph, schema state, and the full state package. Same inputs produce the same full state package hash; changed evidence, lineage, governance, authority, or timeline state changes it.

## Audit Events

State reconstruction emits audit event names for request, input bundle load, boundary resolution, component construction, timeline reconstruction, transition reconstruction, graph reconstruction, invariant verification, consistency verification, hashing, package creation, failure, and escalation.

## Out Of Scope

Replay execution, result comparison, replay ledger execution records, UI surfaces, dashboards, forensic workflows, external integrations, autonomous remediation, source mutation, and final replay certification remain out of scope.
