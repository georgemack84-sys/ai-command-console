# Authority Model — Phase 6, Part I

- Version: 6.1
- Status: Foundational architecture
- Applies to: governed learning and durable-knowledge contracts

## Definition

Authority is the recognized right of a source or actor to establish, modify,
correct, approve, or supersede information within a defined scope. It answers
who may establish information. It does not determine whether a statement is
true, how confident the system is, what evidence supports it, how long it is
remembered, or whether an action may execute.

## Separation invariant

Every governed knowledge record must retain independent values for:

```text
classification | scope | authority | confidence | evidence
provenance     | durability | validation | action permission
```

The system must never create a generic trust score that substitutes for those
dimensions. Confidence and evidence may improve belief in a statement but may
not establish authority. Learning authority may not grant execution permission.

Part I deliberately assigned no authority type. Part II defines the
[Canonical Authority Taxonomy](authority-taxonomy.md), and Part III defines the
[Authority Record](authority-record.md). Part IV adds the conservative
[Authority Resolver](authority-resolver.md), which assigns only a candidate
type, and Part V adds [scope-aware precedence](authority-precedence.md). The
authority gate remains later Phase 6 work. This prevents a partial
implementation from silently treating confidence, evidence, or a human source
as authority.

Part VI adds explicit [authority conflict resolution](authority-conflict-resolution.md).
Part VII adds [scope and action boundaries](authority-boundaries.md).
Part VIII formalizes the [authority × confidence × evidence](authority-confidence-evidence.md) profile.
Part IX adds [authority enforcement and audit](authority-enforcement-and-audit.md).
Part X adds end-to-end [authority validation and qualification](authority-validation-and-qualification.md).
Part XI adds an explicit [authority promotion protocol](authority-promotion.md).
Part XII adds the [authority-gated durable-admission boundary](authority-gated-admission.md).
Part XIII adds [immutable authority audit and explanation](authority-audit-architecture.md).
Part XIV adds the adversarial [authority validation suite](authority-validation-suite.md).
