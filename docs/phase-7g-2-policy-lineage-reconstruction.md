# Mission Control Phase 7G.2 - Policy Lineage Reconstruction

## Delivered

Phase 7G.2 adds a deterministic Policy Lineage Reconstruction Engine that rebuilds the full policy history behind governance conclusions. It reconstructs identity, dependencies, inheritance, supersession, constitutional precedence, historical timeline, influence scores, validation, replay, and operator observability.

## Contract Guarantees

- Deterministic reconstruction hashes for every policy lineage snapshot.
- Immutable policy identity fields: `policy_id`, `policy_version`, `tenant_id`, `mission_id`, effective time, expiration time, and status.
- Complete relationship reconstruction across dependency, inheritance, supersession, constitutional, parent, child, and governance influence families.
- Constitutional precedence is always visible and conflicts remain historically preserved.
- Historical timelines are chronological, replayable, and evidence-backed.
- Policy influence scoring is deterministic and exposes mandatory, high, medium, low, and informational influence.
- Fail-closed validation covers PLR-001 through PLR-015.
- Tenant isolation, replay integrity, hidden influence rejection, and advisory-only boundaries are enforced.

## API Surface

- `GET /api/policy-lineage-reconstruction/contract`
- `POST /api/policy-lineage-reconstruction/resolve-policy`
- `POST /api/policy-lineage-reconstruction/reconstruct`
- `POST /api/policy-lineage-reconstruction/dependencies`
- `POST /api/policy-lineage-reconstruction/inheritance`
- `POST /api/policy-lineage-reconstruction/supersession`
- `POST /api/policy-lineage-reconstruction/timeline`
- `POST /api/policy-lineage-reconstruction/replay`
- `POST /api/policy-lineage-reconstruction/validate`
- `POST /api/policy-lineage-reconstruction/hash`
- `GET|POST /api/policy-lineage-reconstruction/inspect`

## Certification Readiness

The engine provides the deterministic policy ancestry foundation required for Phase 7G.3 Decision Influence Analysis, Phase 7G.4 Governance Explainability Engine, and Phase 7G.5 Lineage Certification Gate.
