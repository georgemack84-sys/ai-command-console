# Phase 7K.3 Governance Lineage Explorer

Phase 7K.3 adds a read-only Governance Lineage Explorer for certified Governance Truth Ledger relationships.

## Delivered

- Deterministic lineage explorer contract and service at `services/governance-lineage-explorer`.
- Typed lineage view model in `types/governance-lineage-explorer.ts`.
- Authenticated API endpoints under `app/api/governance-lineage-explorer`.
- Operator UI at `/governance-lineage-explorer`.
- Focused unit coverage for doctrine, graph rendering, navigation paths, evidence/replay references, state handling, observability, and prohibited actions.

## Guarantees

- The explorer is read-only and advisory-only.
- Relationship creation, lineage modification, history alteration, and governance overrides are blocked.
- Graph nodes and edges are derived from the certified Phase 7J.4 cross-ledger correlation graph.
- Forward, backward, root, dependency, influence, supersession, and timeline views are generated deterministically.
- Tenant isolation and authorization enforcement are explicit on the view and API surface.
