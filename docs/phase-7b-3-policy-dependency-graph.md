# Mission Control Phase 7B.3 - Policy Dependency Graph

## Purpose

Phase 7B.3 builds a deterministic `PolicyDependencyGraph` from validated 7B.1 `PolicyAnalysis` records and verified 7B.2 `PolicyCorrelation` records.

The graph describes policy relationships without changing policy behavior. It is an intelligence surface, not an enforcement surface.

## Doctrine

The graph preserves:

- advisory-only behavior
- no autonomous conflict resolution
- immutable historical snapshots
- replay-required graph construction
- tenant isolation
- fail-closed validation
- no policy mutation

The graph may detect conflicts, dependencies, inheritance, supersession, shared authorities, constraint interactions, and exception paths. It must not resolve conflicts, rewrite policy, merge policy, approve policy changes, expand authority, or execute governance actions.

## Contracts

The canonical types are defined in `types/policy-dependency-graph.ts`:

- `PolicyDependencyGraph`
- `PolicyDependencyEdge`
- `PolicyConflictRecord`
- `PolicyDependencyNode`
- `PolicyGraphSnapshot`
- `PolicyGraphReplayRefs`
- `PolicyGraphObservabilitySurface`

## Node Classes

The graph resolves:

- policy nodes
- authority nodes
- constraint nodes
- exception nodes
- recommendation nodes
- governance decision nodes
- runtime control nodes

Each node has deterministic identity, tenant scope, source references, lineage references, replay references, and a stable node hash.

## Edge Types

Supported relationship types:

- `DEPENDS_ON`
- `SUPERSEDES`
- `INHERITS`
- `CONFLICTS_WITH`
- `REFERENCES`
- `EXTENDS`
- `LIMITS`
- `ENABLES`
- `DISABLES`
- `SUPPORTED_BY`

Edges are evidence-linked, tenant-scoped, replayable, and historically immutable.

## Conflict Detection

The engine emits advisory conflict records for:

- contradictory permissions
- overlapping authority
- incompatible constraints
- circular inheritance
- recursive dependency chains
- unreachable policies
- expired active exceptions
- unsupported exceptions
- supersession conflicts
- tenant scope conflicts
- runtime boundary conflicts

Conflict detection does not resolve or suppress conflicts.

## Replay And Snapshots

Every graph includes replay references for:

- PolicyAnalysis snapshots
- PolicyCorrelation snapshots
- Truth Ledger snapshots
- graph algorithm version
- node set hash
- edge set hash
- conflict set hash
- graph output hash
- replay execution reference

Historical graph snapshots are immutable. A changed graph creates a new snapshot rather than mutating the old one.

## API Surface

Phase 7B.3 exposes:

- `GET /api/policy-dependency-graph/contract`
- `POST /api/policy-dependency-graph/graph`
- `POST /api/policy-dependency-graph/validate`
- `POST /api/policy-dependency-graph/hash`
- `POST /api/policy-dependency-graph/transition`
- `POST /api/policy-dependency-graph/replay`
- `POST /api/policy-dependency-graph/snapshot`
- `GET|POST /api/policy-dependency-graph/inspect`

All routes require an authenticated workspace member.

## Certification Posture

7B.3 accepts only valid 7B.1 policy analyses in `VALIDATED`, `REPLAYABLE`, `RESTRICTED`, or `ARCHIVED` state, and only valid 7B.2 correlations in `CONSISTENCY_VERIFIED`, `REPLAYABLE`, `RESTRICTED`, or `ARCHIVED` state.

The graph fails closed for missing nodes, missing evidence, missing replay refs, unsupported relationships, unknown node types, cross-tenant edges, circular inheritance, recursive dependency chains, historical mutation, and graph hash mismatch.

The output is ready to feed 7B.4 Policy Impact Analysis.
