# Learning Constitution

- Version: 1.1
- Status: Canonical
- Effective date: 2026-08-20
- Applies to: every component that observes, evaluates, stores, retrieves, or applies learned information

## 1. Purpose

This constitution defines the non-bypassable rules governing learning. It is the highest semantic authority for the learning subsystem. Its permanent starting point is:

> Conversation is not automatically learning.

Information encountered by the system is an observation. It becomes durable knowledge only after governed evaluation and an explicit accepting decision. The constitution establishes the boundary within which future classifiers, memory systems, agents, indexes, and adaptive behavior may be built; it does not implement those systems.

## 2. Scope

These rules apply to observations from users, agents, models, prompts, tools, documents, repositories, external sources, repeated statements, inferred behavior, and generated responses. No ingestion path is exempt.

The constitution governs admission to and modification of knowledge. It does not grant operational authority, define an execution permission system, or make an observation true merely because the observation was processed.

## 3. Definitions

- **Observation:** Information encountered by the system that is not yet accepted knowledge. An observation is non-durable, non-authoritative, and unvalidated by default.
- **Conversational Context:** Transient information used to understand the current interaction without an assumption of durability beyond its intended conversational lifetime.
- **Candidate Knowledge:** An observation submitted to the learning pipeline for possible durability. A candidate is not established knowledge.
- **Durable Knowledge:** Information persisted after completing the required controls and receiving an accepting decision for an explicit scope. Durability means persistence; it does not independently establish correctness or authority.
- **Learning:** The governed admission, modification, supersession, qualification, or removal of knowledge within a defined scope.
- **Classification:** The canonical semantic category assigned to a candidate so that applicable validation and authorization rules can be determined.
- **Scope:** The explicit context in which knowledge is valid, applicable, owned, and retrievable.
- **Validation:** The independent determination that a candidate satisfies the structural, evidentiary, provenance, and authorization requirements applicable to its classification and scope.
- **Conflict:** A relationship between a candidate and existing knowledge that requires explicit treatment before admission.
- **Learning Decision:** The explicit disposition produced after the required pipeline stages complete.
- **Authority:** Permission for an actor to execute, modify, approve, access, disclose, delegate, or authorize within a defined scope. Authority is separate from knowledge and competence.
- **Provenance:** The traceable chain connecting durable knowledge to its source observation, actors, classification, scope, validation, decision, time, and version.

## 4. Constitutional invariants

1. Conversation is not automatically learning.
2. An observation is not knowledge, accepted knowledge is not necessarily durable knowledge, and knowledge is not authority.
3. Non-learning is the default. Observations begin with `durable = false`, `authoritative = false`, and `validated = false`.
4. Every durable admission passes through classification, scope determination, conflict detection, validation, and an explicit learning decision.
5. Classification proposes semantic meaning; it does not establish truth, durability, or authority.
6. Scope is mandatory. Unknown scope never defaults to global scope.
7. Conflicting knowledge is never silently overwritten.
8. Repetition, plausibility, usefulness, model confidence, prompt inclusion, or agent generation cannot independently establish durable knowledge.
9. Durable knowledge has traceable provenance. Any information promoted into durable knowledge retains sufficient provenance to reconstruct its origin, interpretation, validation, authority, approval, evidence, and subsequent changes.
10. Provenance is historical evidence, not editable current-state metadata. A correction creates a successor and a relationship; it never changes the earlier source or interpretation.
11. Historical truth and current truth are separate views. The system must be able to show what it considered valid at a prior point in time as well as what it considers valid now.
12. A failed, incomplete, or uncertain control produces no durable admission.
13. Learning does not grant authority, permission, or capability.
14. Ordinary learning cannot modify this constitution or the authority system.
15. Lower governance layers cannot override higher layers.

## 5. Learning pipeline

The canonical pipeline is:

```text
Observation
    -> Classification
    -> Scope Determination
    -> Conflict Detection
    -> Validation
    -> Learning Decision
    -> Durable Knowledge
```

Implementations may optimize execution but must preserve the semantic guarantee of every stage. No direct `conversation -> memory`, `LLM output -> durable fact`, or equivalent shortcut is constitutional.

### Observation

Every learning event originates as an observation. Future observation records must be capable of carrying content, source, source type, timestamp, context, originating actor, provenance, and candidate status. Persistence is outside this game plan.

### Classification

Every candidate must be assigned one canonical classification before durability is considered:

```text
Conversation
Brainstorming
Suggestion
Fact
Preference
Instruction
Project Decision
Principle
Procedure
Correction
Exception
Authoritative Rule
```

The detailed taxonomy boundary is defined by the [Information Classification Model](information-classification-model.md). Ambiguity remains non-durable.

### Scope determination

Every durable item must declare one or more compatible scopes. The initial scope vocabulary is:

```text
Conversation
Session
User
Agent
Project
Workspace
Organization
Domain
System
Global
```

Scope promotion requires explicit justification and governance. A project statement does not become a workspace, organization, system, or global rule by implication.

The typed scope boundary and conservative compatibility rules are defined by the [Knowledge Scope Model](knowledge-scope-model.md).

### Conflict detection

Before admission, a candidate must be evaluated against relevant knowledge as agreeing, extending, narrowing, contradicting, correcting, creating an exception, or being unrelated. An unknown result remains non-durable. Corrections, exceptions, and replacements preserve historical identity and provenance rather than deleting or overwriting prior knowledge.

### Validation

Validation is independent of classification. At minimum, validation must be capable of checking the requirements associated with the candidate's class:

- preferences require attributable preference ownership;
- project decisions require authority for that project scope;
- external facts require suitable source verification;
- corrections identify the knowledge being corrected;
- authoritative rules identify an authorized rule issuer.

The detailed validators belong to later game plans.

### Learning decision

Every candidate receives exactly one explicit admission disposition:

```text
ACCEPT
REJECT
DEFER
REQUIRE_VALIDATION
REQUIRE_APPROVAL
CONFLICT
QUARANTINE
```

`SUPERSEDE`, `REVOKE`, and `EXPIRE` are reserved for later lifecycle operations and are not admission dispositions in version 1.0.

The typed policy-decision boundary is defined by the [Learning Decision Model](learning-decision-model.md).

### Durable knowledge admission

Only `ACCEPT` makes a candidate eligible for durable admission. Admission preserves the chain:

```text
Observation -> Candidate -> Decision -> Knowledge Record
```

Admission must not be reported as successful until its authoritative state transition commits successfully.

The typed durable-write boundary is defined by [Durable Knowledge Admission](durable-knowledge-admission.md).
Corrections transition through the separate [Correction and Supersession Lifecycle](correction-and-supersession-lifecycle.md), which preserves prior knowledge as history rather than rewriting it.
Narrow applicability constraints are registered through the [Knowledge Exception Lifecycle](knowledge-exception-lifecycle.md), without replacing the base knowledge.
Normal applicability is resolved through [Governed Knowledge Retrieval](governed-knowledge-retrieval.md), which remains read-only and authority-neutral.
Retired or suspect knowledge is handled through the [Knowledge Retirement and Quarantine Lifecycle](knowledge-retirement-lifecycle.md), which preserves history without retaining normal applicability.
Evidence freshness is recorded through the [Knowledge Review and Revalidation Lifecycle](knowledge-review-and-revalidation-lifecycle.md); any resulting lifecycle action remains separately governed.
Review timing is evaluated by [Knowledge Freshness and Review-Due Policy](knowledge-freshness-and-review-policy.md), which can recommend but never enact a lifecycle action.
Due assessments can become deduplicated tracked work through the [Knowledge Review Work Queue](knowledge-review-work-queue.md), which still cannot perform a review or lifecycle transition itself.
Governance can inspect aggregate behavior through [Learning Quality Metrics and Governance Reporting](learning-quality-metrics.md), whose reports and alerts remain read-only and non-authoritative.
Quality signals can be escalated only through the [Governance Review and Policy-Proposal Boundary](governance-review-and-policy-proposal.md), which approves consideration—not policy mutation.
Eligible operational policies can be versioned only through the [Authorized Operational Policy Change Lifecycle](authorized-operational-policy-change-lifecycle.md); the Learning Constitution remains outside that mechanism.
Active operational versions can be safely restored only through the [Operational Policy Rollback Lifecycle](operational-policy-rollback-lifecycle.md), which preserves all policy history and requires separate authorization.
Active-version outcomes can be assessed through [Operational Policy Effectiveness Monitoring](operational-policy-effectiveness-monitoring.md), whose recommendations remain read-only until a separate governance or rollback path is invoked.
Knowledge lineage can be inspected through the [End-to-End Knowledge Explanation Service](end-to-end-knowledge-explanation.md), which assembles history without changing the governed state it explains.
Operational-policy lineage can be inspected through the [Operational Policy Explanation Service](operational-policy-explanation.md), which is likewise read-only and authority-neutral.
Audit trust is checked independently by the [Audit Integrity and Verification Boundary](audit-integrity-and-verification.md), which detects but never repairs integrity failures.
Phase 0 exit evidence and the Phase 1 entry checklist are recorded in [Phase 0 Shakedown and Phase 1 Readiness](phase-0-shakedown-and-phase-1-readiness.md).
The reviewed canonical-taxonomy implementation specification is [Phase 1T — Canonical Learning Taxonomy](phase-1-canonical-learning-taxonomy-spec.md).

## 6. Classification requirement

Missing, unknown, or ambiguous classification prevents durable admission. A classifier is an interpreter, not a governance authority. Model output remains untrusted structured input until the deterministic boundary validates it.

Conversation, brainstorming, and suggestions cannot silently become project decisions, rules, facts, or procedures. Promotion to another classification is a separate governed operation.

## 7. Scope requirement

Missing or ambiguous scope prevents durable admission. The system may seek clarification or retain a candidate in a non-durable state. It must not infer global scope merely because a statement uses words such as “always” or “never.”

Scope compatibility is a filter, not merely a retrieval-ranking signal. Future storage and retrieval implementations must enforce it outside prompt behavior.

## 8. Conflict requirement

Conflict detection is mandatory even when a candidate has high confidence or comes from an authorized source. A direct conflict produces `CONFLICT`, `DEFER`, or another explicitly governed non-admission outcome until resolution. Resolution creates explicit relationships and preserves the prior record.

Disagreement across distinct compatible scopes is not automatically a conflict. Corrections and exceptions are semantic relationships, not destructive updates.

The typed conflict-comparison boundary is defined by the [Conflict Detection Model](conflict-detection-model.md).

## 9. Validation requirement

Validation must complete independently after classification and scope determination. `NOT_VALIDATED`, `REQUIRES_VALIDATION`, missing validators, unavailable policy, or unknown validation outcomes cannot produce `ACCEPT`. Invalid candidates are rejected or quarantined according to policy.

The typed pre-decision validation boundary is defined by the [Knowledge Validation Model](knowledge-validation-model.md).

## 10. Learning decisions

The typed decision vocabulary in `types/learning-constitution` is canonical for GP-01. Decisions include stable reason codes and always state that operational authority is unchanged. Later game plans may add reason codes but may not weaken the fail-closed meanings established here.

## 11. Durable knowledge rules

Durable knowledge requires all of the following:

1. a source observation and candidate identity;
2. a known canonical classification;
3. an explicit compatible scope;
4. completed conflict detection with no unresolved conflict;
5. successful applicable validation;
6. required approval by an authorized decision actor;
7. an explicit `ACCEPT` decision;
8. traceable provenance and version information;
9. a successfully committed admission operation.

Durability does not imply universal truth, operational authority, or permission to retrieve the item outside its scope.

## 12. Knowledge and authority separation

The permanent firewall is:

```text
Knowledge != Permission
Competence != Authorization
Learning != Authority
```

Knowledge may inform reasoning and planning. An action must still pass through the independent authority and policy gate at execution time. A learned procedure cannot grant a capability, change an authority grant, certify itself, or authorize its own execution.

The learning subsystem may describe authority requirements but does not own authoritative permission state. Every constitutional admission result therefore has `authorityEffect = UNCHANGED`.

The Phase 6 [Authority Model](authority-model.md) adds the first-class
authority-dimension contract. It preserves authority, confidence, evidence,
provenance, durability, validation, and action permission as independent
values; it does not assign authority based on any of the other dimensions.

## 13. Provenance requirements

Provenance records describe history. They must not be retroactively rewritten to make history agree with current knowledge. The system provides both historical truth (what was known at a point in time) and current truth (what is presently valid). Corrections create successors and supersession relationships; they never edit the original teaching, interpretation, candidate, approval, or durable record.

For a provenance chain to be constitutionally complete, it must be traversable from durable knowledge to its candidate, interpretation, original source, authority, validation evidence, approval, and any predecessor or successor. A record whose chain cannot be reconstructed is not trusted durable knowledge: it must be quarantined or kept non-durable until repaired through a new, separately recorded event.

Phase 7 establishes **Noesis** (`agent:noesis`) as the canonical system identity. “Learning Agent” remains a functional classification only. Identity migration is itself a system provenance event and does not rewrite historical actor references.

Anonymous durable learning is prohibited. A future durable record must identify or reference:

- source and source type;
- originating actor;
- source observation and candidate;
- classification and scope;
- conflict result;
- validation path and evidence;
- decision and decision actor;
- relevant timestamps;
- record, policy, and constitution versions;
- replaced knowledge and attached exceptions when applicable.

This chain must support deterministic explanation of where knowledge came from, why it was admitted, what it replaced, and whether it remains active.

## 14. Fail-closed behavior

When classification, scope, provenance, conflict status, validation, required approval, or authority cannot be determined, the candidate remains non-durable. Infrastructure failure also produces non-learning. Stateless reasoning may continue, but the system must not claim that it learned or forgot something unless the governed operation succeeded.

## 15. Constitutional precedence

Precedence is:

```text
Learning Constitution
    -> System Policies
    -> Organization Policies
    -> Workspace / Project Policies
    -> Agent Policies
    -> Learned Procedures
    -> Preferences
    -> Conversational Context
```

Lower layers cannot override higher layers. An instruction such as “ignore validation rules” conflicts with this constitution regardless of source confidence or repetition.

## 16. Amendment rules

This constitution is not ordinary learned knowledge. The normal learning pipeline cannot amend it. A future amendment mechanism must require a distinct proposal, authorized review, validation, explicit approval, impact analysis, and a new constitution version.

Until that mechanism exists, attempted constitutional modification through conversation, memory, model output, agent behavior, tools, or imported content is rejected as a constitutional conflict.

## Prohibited implementations

- Conversation or prompt content written directly to authoritative memory.
- LLM output treated as a durable fact without governed validation.
- Repetition treated as truth or authority.
- Learned procedures treated as execution permission.
- New statements silently overwriting existing knowledge.
- Unknown scope promoted to global knowledge.
- Classifier confidence treated as authority.
- Agents modifying their constitution or authority through learning.
- Vector or search indexes acting as the authoritative knowledge store.
- Unknown policy outcomes defaulting to allow.

## Architectural decisions

The eight GP-01 decisions and their implementation consequences are recorded in [ADR-0011](../architecture/ADR-0011-learning-constitution.md). The executable vocabulary and minimal admission-readiness gate are exported from `types/learning-constitution`. Canonical scenarios are specified in [Learning Constitution test scenarios](learning-constitution-test-scenarios.md) and mirrored by unit tests.
