# Canonical Learning Taxonomy — Implementation Specification

- Proposed phase name: **Phase 1T — Canonical Learning Taxonomy**
- Status: v1 frozen after automated exit-gate verification
- Depends on: [Learning Constitution](learning-constitution.md) and the Phase 0 governed-learning boundary

## 1. Purpose and non-goals

Phase 1T establishes one versioned vocabulary for identifying the semantic kind of each input unit. It answers only:

> What kind of information is this?

It does not decide whether information is true, durable, applicable, authorized, executable, or approved. Existing Phase 0 scope, validation, conflict, decision, admission, lifecycle, and authority boundaries remain the only paths for those outcomes.

## Part 1 status — identifier freeze

Implemented: the 18 v1 identifiers, processing-status vocabulary, and explicit Phase 0 compatibility mapping are exported from `types/learning-constitution/canonicalTaxonomy.ts` and protected by contract tests. This freeze adds no classifier behavior, durable-record migration, or lifecycle side effect.

## Part 2 status — canonical registry

Implemented: `learning/taxonomy/registry.v1.json` is the machine-readable v1 registry, accompanied by `learning/taxonomy/registry.schema.json` and a pure TypeScript loader/validator. Runtime code rejects malformed entries, unknown identifiers, duplicate/missing categories, and authority-bearing taxonomy metadata.

## Part 3 status — typed category access

Implemented: application code can use the `InformationCategory` union, `isInformationCategory` runtime guard, and `getCanonicalTaxonomyCategory` lookup. Lookups return metadata only from the validated registry; free-form identifiers cannot silently become canonical categories.

## Part 4 status — semantic-unit contract

Implemented: semantic units now have a pure structural contract covering stable IDs, source order, source-aligned text spans, and `ROOT`/`QUOTED`/`EXAMPLE`/`HYPOTHETICAL` containment. The validator fails closed for malformed spans, orphaned or cyclic containment, overlapping siblings, and effect-bearing results. It validates an already-produced segmentation result only: it does not split text, classify a unit, persist information, confer authority, or permit execution.

## Part 5 status — registry-derived semantic reference

Implemented: the validated canonical registry now carries all required category-boundary rules and critical false-promotion guards. [Canonical Learning Taxonomy Reference](canonical-learning-taxonomy-reference.md) is rendered from that registry and regression-tested for exact agreement, so definitions, counterexamples, negative semantics, and boundary guidance cannot drift into a separate hand-maintained source.

## Part 6 status — versioned golden corpus

Implemented: `learning/taxonomy/golden-corpus.v1.json` provides a classifier-independent expected-outcome corpus. It covers every canonical category and the required clear, negative, near-neighbor, ambiguous, compound, sequence, and adversarial scenarios. Validation fails closed for unknown categories, missing coverage, malformed containment, and outcome contradictions. The corpus is an evaluation contract only; it neither classifies text nor changes information state.

## Part 7 status — conservative canonical classifier

Implemented: a pure deterministic canonical classifier evaluates one semantic unit at a time, using only explicit markers and containment. Ambiguous, hypothetical, and unsupported units return `AMBIGUOUS`, `REQUIRES_CONTEXT`, or `REQUIRES_REVIEW` rather than receiving a guessed category. Every result includes compact evidence and has fixed non-effects: no persistence, authority change, or execution permission. Model-assisted proposal generation remains out of scope for this deterministic baseline.

## Part 8 status — risk-weighted evaluation and consistency

Implemented: the golden corpus now drives a pure risk-weighted evaluation report, with `STANDARD`, `HIGH`, and `CRITICAL` weights of 1, 5, and 20. Cross-classifier comparison reports every status/category disagreement and separately counts critical disagreements. The evaluator rejects any effect-bearing classifier result; it is an offline measurement boundary, not a learning or governance action.

## Part 9 status — taxonomy-change governance

Implemented: taxonomy changes now require a versioned snapshot comparison, semver-appropriate bump, compatibility analysis, regression-case references, and a separate approval decision. Category removal is breaking, requires a major version, and cannot validate without a migration and rollback plan. These contracts validate proposals only; they do not mutate a registry or execute a migration.

## Part 10 status — v1 exit gate and freeze

Implemented: the final Phase 1 exit gate verifies registry and corpus validity, generated-reference agreement, golden-dataset, boundary, sequence, and adversarial regressions, zero weighted evaluation failures, perfect baseline performance metrics, bounded confidence calibration, critical-case success, and the absence of persistence, authority, or execution effects in every evaluated result. [release.v1.json](../../learning/taxonomy/release.v1.json) may validate as `FROZEN` only after that gate passes. Subsequent changes must follow the Part 19 governance contract and cannot silently alter the frozen v1 release.

## Part 11 status — conservative semantic segmentation

Implemented: the semantic-unit contract now has an executable, deterministic segmenter. It splits only explicit sentence boundaries and preserves explicit example quotes and hypothetical content as contained units. Uncertain structure is left intact rather than guessed; an empty source becomes `UNRESOLVED`. Segmentation has no classification, persistence, authority, or execution effect.

## Part 12 status — initial classification pipeline

Implemented: the deterministic initial classifier is now wired after conservative semantic segmentation. Every classified result is aligned one-to-one with its semantic unit, preserving compound and containment boundaries. The pipeline rejects any misaligned or effect-bearing classifier output and returns no persistence, authority, or execution effect of its own.

## Part 13 status — golden dataset regression

Implemented: the versioned golden corpus is now executed end-to-end through the segmentation and classification pipeline. Regression verifies every expected unit boundary, containment mode, status, category, ambiguity candidate, and prohibited category. This makes the dataset an executable semantic contract; it reports drift only and never changes information state.

## Part 14 status — nearest-neighbor boundary regression

Implemented: every required registry boundary now has a machine-readable behavioral case and an end-to-end pipeline regression. The case set is validated against the registry so a missing, duplicate, reversed, or mismatched pair fails closed. This verifies category distinctions such as question versus fact and instruction versus rule without giving any classification authority beyond the taxonomy result.

## Part 15 status — conversation sequence regression

Implemented: ordered sequence cases now verify that an earlier idea, suggestion, fact, rule, or ambiguous turn retains its own semantic result when a later turn is a decision, correction, or exception. The suite does not infer relationships, promotion, authority, or persistence from ordering; it protects against retroactive reclassification only.

## Part 16 status — adversarial regression

Implemented: adversarial cases now cover quoted instructions and rules, hypothetical directives, negated directives, question-shaped commands, and misleading `Fact:` or `Rule:` labels. All cases execute through the pipeline, preserve containment, and assert non-persistent, non-authoritative, non-executable results.

## Part 17 status — classifier performance metrics

Implemented: the golden corpus now produces a classifier performance report with exact category accuracy, per-category confusion-matrix entries, status mismatches, and the existing risk-weighted evaluation. The report makes both the location and weighted impact of an error explicit; it is an offline measurement artifact only.

## Part 18 status — confidence calibration

Implemented: a versioned calibration policy defines a bounded minimum confidence for every canonical category and a maximum confidence for ambiguous outcomes. Under-threshold classifications are downgraded to `REQUIRES_REVIEW`, retaining their evidence as candidates rather than being promoted or discarded. Calibration can only preserve or narrow a result; it never grants authority, persistence, or execution permission.

The name `Phase 1T` avoids collision with the Phase 1 production-integration work already recorded in [Phase 0 Shakedown and Phase 1 Readiness](phase-0-shakedown-and-phase-1-readiness.md).

## 2. Normative design decisions

1. Use one canonical JSON registry, `learning/taxonomy/registry.v1.json`. JSON is selected because it can be parsed without adding a runtime dependency.
2. Validate that registry against `learning/taxonomy/registry.schema.json`; runtime code consumes generated or validated types, never a hand-maintained duplicate.
3. Treat `UNCLASSIFIED`, `AMBIGUOUS`, `REQUIRES_CONTEXT`, and `REQUIRES_REVIEW` as processing statuses, not taxonomy categories.
4. Classify semantic units, not whole messages. A semantic unit carries source reference, stable ID, text span, quote/example containment, and ordering within its source.
5. Keep domain, sentiment, owner, scope, authority, validation, and promotion as separate dimensions. They must not be encoded as category IDs.
6. Category semantics may describe a potential normative intent, but every classification result remains `authorityEffect: UNCHANGED` and grants no execution permission.

## 3. Canonical v1 categories

| ID | Canonical meaning | Must not imply |
| --- | --- | --- |
| `CONVERSATION` | General conversational context | Durable knowledge |
| `QUESTION` | Request for information or uncertainty | Assertion or instruction |
| `BRAINSTORM` | Explicit exploration of possibilities | Adoption |
| `IDEA` | Possible concept or course of action | Recommendation or decision |
| `SUGGESTION` | Recommendation for consideration | Instruction or decision |
| `FACT` | Assertion describing reality | Verified truth |
| `CONCEPT` | Explanatory abstraction or definition | Behavioral rule |
| `PREFERENCE` | Scoped tendency of an owner | Mandatory rule |
| `INSTRUCTION` | Requested or prescribed action | Authorization |
| `RULE` | Continuing normative constraint | Valid issuer authority |
| `PRINCIPLE` | Durable decision-guiding doctrine | Executable procedure |
| `PROCEDURE` | Method or sequence for an operation | Permission to execute |
| `EXAMPLE` | Illustrative content | Governing nested content |
| `DECISION` | Explicitly adopted choice | Global scope or approval |
| `CORRECTION` | Claim that prior information is wrong/outdated | Historical deletion |
| `EXCEPTION` | Scoped deviation from a base item | Replacement of the base item |
| `GOAL` | Desired future state | Current fact or decision |
| `FEEDBACK` | Evaluation or reaction | Preference or correction |

## 4. Category metadata contract

Every registry item SHALL include:

```ts
type TaxonomyCategory = Readonly<{
  id: InformationCategory;
  displayName: string;
  definition: string;
  semanticIntent: string;
  candidateKnowledge: boolean;
  promotionRequired: boolean;
  validationRequirement: "NONE" | "CONTEXTUAL" | "REQUIRED";
  scopeRequirement: "NONE" | "CONTEXTUAL" | "REQUIRED";
  conflictSensitivity: "NONE" | "CONTEXTUAL" | "REQUIRED";
  lifecycleEligibility: "NONE" | "CANDIDATE";
  authorityImplication: "NONE";
  examples: readonly string[];
  counterexamples: readonly string[];
  classificationNotes: readonly string[];
}>;
```

`defaultDurability` is intentionally not a taxonomy scope such as `PROJECT`, `USER`, or `SYSTEM`. If retained as a compatibility hint, it is limited to `NONE`, `EPHEMERAL`, or `DURABLE_CANDIDATE`; actual durability remains a downstream decision.

## 5. Semantic-unit and classification contracts

```ts
type SemanticUnit = Readonly<{
  semanticUnitId: string;
  source: ClassificationProvenance;
  sourceOrder: number;
  textSpan: Readonly<{ start: number; end: number }>;
  content: string;
  containment: "ROOT" | "QUOTED" | "EXAMPLE" | "HYPOTHETICAL";
  parentSemanticUnitId?: string;
}>;

type CanonicalClassificationResult = Readonly<{
  semanticUnitId: string;
  taxonomyVersion: "1.0.0";
  status: "CLASSIFIED" | "AMBIGUOUS" | "REQUIRES_CONTEXT" | "REQUIRES_REVIEW";
  category?: InformationCategory;
  candidates: readonly Readonly<{ category: InformationCategory; confidence: number }> [];
  confidence: number;
  reasonCodes: readonly string[];
  evidence: readonly ClassificationEvidence[];
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
  persistenceEffect: "NONE";
}>;
```

A message may produce zero or more semantic units. Quoted, example, and hypothetical containment must remain available to classifiers and downstream reviewers.

## 6. Required boundary rules

The registry documentation and golden dataset must explicitly cover at least:

- `QUESTION` vs `FACT`; `BRAINSTORM` vs `IDEA`; `IDEA` vs `SUGGESTION`;
- `SUGGESTION` vs `INSTRUCTION`; `PREFERENCE` vs `INSTRUCTION`; `INSTRUCTION` vs `RULE`;
- `RULE` vs `PRINCIPLE`; `PRINCIPLE` vs `PROCEDURE`; `EXAMPLE` vs `FACT`;
- `IDEA`, `SUGGESTION`, and `GOAL` vs `DECISION`;
- `FEEDBACK` vs `PREFERENCE` and `CORRECTION`; `CORRECTION` vs `DECISION`; and `EXCEPTION` vs `RULE`.

Critical false promotions must fail closed: `QUESTION -> INSTRUCTION`, `EXAMPLE -> RULE`, `IDEA -> DECISION`, `SUGGESTION -> RULE`, and `PROCEDURE -> AUTHORIZATION`.

## 7. Compatibility with the existing Phase 0 vocabulary

No existing record is silently reclassified. Phase 1T provides an explicit mapping and stores both source and canonical taxonomy versions during migration.

| Existing Phase 0 value | Canonical v1 value | Migration note |
| --- | --- | --- |
| `CONVERSATION` | `CONVERSATION` | Direct mapping |
| `BRAINSTORMING` | `BRAINSTORM` | Identifier normalization |
| `SUGGESTION` | `SUGGESTION` | Direct mapping |
| `FACT` | `FACT` | Direct mapping |
| `PREFERENCE` | `PREFERENCE` | Direct mapping |
| `INSTRUCTION` | `INSTRUCTION` | Direct mapping |
| `PROJECT_DECISION` | `DECISION` | Preserve `PROJECT` as required scope, not category ID |
| `PRINCIPLE` | `PRINCIPLE` | Direct mapping |
| `PROCEDURE` | `PROCEDURE` | Direct mapping |
| `CORRECTION` | `CORRECTION` | Direct mapping |
| `EXCEPTION` | `EXCEPTION` | Direct mapping |
| `AUTHORITATIVE_RULE` | `RULE` | Preserve authority validation as separate state |

New v1 categories require a new classification result; they are not backfilled into durable records without a governed migration proposal.

## 8. Delivery sequence

1. Freeze the 18 identifiers and approve this mapping.
2. Implement registry, JSON schema, loader, and registry-validation tests.
3. Generate or validate the `InformationCategory` TypeScript union from the registry.
4. Add semantic-unit and canonical-classification contracts, with no persistence dependencies.
5. Publish category definitions, negative semantics, and boundary tables from the same registry source.
6. Build the golden corpus: clear, negative, near-neighbor, ambiguous, compound, sequence, and adversarial cases.
7. Implement a pure conservative classifier: explicit markers and containment rules first; model inference only returns proposals with evidence.
8. Add risk-weighted evaluation and cross-classifier consistency tests.
9. Implement taxonomy change governance, semantic-version checks, and compatibility tests.
10. Freeze `taxonomyVersion: 1.0.0` only after exit criteria pass.

## 9. Acceptance and exit gate

Phase 1T exits only when:

- every v1 category is registry- and schema-valid with definitions, examples, counterexamples, and negative semantics;
- unknown IDs and invalid taxonomy versions fail closed;
- compound inputs preserve semantic-unit boundaries and containment;
- ambiguous/high-risk classifications can remain non-promotable;
- registry, documentation, code types, and tests are derived from or verified against the same source;
- all classifier APIs are side-effect-free;
- adversarial examples and critical confusion pairs are regression tested;
- stored classifications retain taxonomy and classifier versions plus structured provenance/evidence; and
- a taxonomy change requires proposal, compatibility analysis, migration plan, tests, approval, and version increment.

The gate statement is:

> Given an input unit, the system can identify its semantic kind through a stable, versioned taxonomy without deciding truth, durability, scope, authority, authorization, or execution.

## 10. Phase 1T non-goals

This phase does not replace Phase 0 persistence adapters, add durable memory side effects, authorize any action, perform policy activation, or amend the Learning Constitution.
