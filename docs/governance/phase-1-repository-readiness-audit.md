# Phase 1 Repository Readiness Audit

| Required separation | Implemented location | Verification |
| --- | --- | --- |
| Machine-readable taxonomy and schema | `learning/taxonomy/registry.v1.json`, `registry.schema.json` | Registry validation tests |
| Taxonomy version and release gate | `learning/taxonomy/release.v1.json` | Release-readiness tests |
| Classification, semantic-unit, lifecycle, and replay contracts | `types/learning-constitution/` | Typecheck and unit contracts |
| Pure taxonomy services | `services/learning-constitution/` | Pipeline, history, lifecycle, and adversarial tests |
| Normative reference, boundaries, lifecycle, and user guide | `docs/governance/` | Reference agreement and documentation review |
| Golden, ambiguity, adversarial, and sequence data | `learning/taxonomy/*.v1.json` | End-to-end regressions |

The implementation uses TypeScript paths rather than the illustrative extension names in the original brief. The architectural separation is preserved: registry/data, contracts, pure services, documentation, and tests are distinct. No taxonomy artifact exposes an authority, persistence, approval, or execution side effect.
