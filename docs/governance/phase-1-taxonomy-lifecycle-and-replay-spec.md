# Phase 1 — Taxonomy Lifecycle and Deterministic Replay

## Category lifecycle

Frozen categories never silently disappear. A deprecation record requires the category identifier, deprecation timestamp, migration rule, removal version, and—where applicable—a replacement category. A deprecation is a proposal/validation artifact; it does not mutate the frozen registry or reclassify records.

An extension proposal must contain a `TaxonomyExtensionAnalysis`. It records the proposed semantic definition, why existing categories are insufficient, nearest neighbors, unique downstream behavior, positive and counterexamples, non-implications, durability/authority/promotion interactions, reclassification impact, and migration requirement. The proposal validator rejects an added category without this analysis.

## Replay

`CanonicalClassificationReplayRecord` preserves the input request, context references, configuration, taxonomy version, classifier/policy versions, timestamp, exact result, and deterministic result fingerprint. Replay recomputes classification from the same request and reports whether the fingerprint matches. A malformed or effect-bearing record is rejected.

Neither recording nor replay persists information, changes authority, or grants execution permission.

## Documentation and artifacts

- The [canonical reference](canonical-learning-taxonomy-reference.md) and uniform category-card renderer are generated from the registry.
- The [orthogonal semantics specification](phase-1-orthogonal-semantics-spec.md) supplies defaults, invariants, risk, and guidance-only decision trees.
- The [user guide](canonical-learning-taxonomy-user-guide.md) explains intentional teaching in plain language.
- `learning/taxonomy/README.md` describes the machine-readable registry, schema, corpus, release, and adversarial artifacts.
