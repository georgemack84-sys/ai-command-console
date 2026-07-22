# Phase 10.12.7 - Evidence Poisoning Defense

## Purpose

Protect Mission Control Adaptive Intelligence from corrupted, fabricated, manipulated, duplicated, synthetic, unverifiable, or otherwise untrustworthy evidence that could influence adaptive proposals, simulations, governance decisions, or future learning.

Evidence poisoning defense ensures adaptive learning is driven only by authenticated, verifiable, lineage-complete, governance-approved, replayable evidence.

## Tightened Contract

- Defense version: `evidence-poisoning-defense/v1`
- Defense identifier: `EvidencePoisoningDefense`
- Required predecessor: Phase 10.12.1 Drift Defense Architecture
- Baseline authority: immutable evidence trust baseline approved through governance
- Required outputs: Evidence Health Score, Poisoning Assessment, Source Reliability Impact
- Required ledger record: `EvidencePoisoningRecord`

## Defense Scope

The module validates trusted evidence sources, source classifications, quality thresholds, provenance requirements, lineage requirements, governance requirements, constitutional requirements, and historical source trust records.

It detects unknown sources, broken lineage, missing provenance, invalid signatures, tampered evidence, unverifiable artifacts, fabricated evidence, duplicated evidence, contradictory evidence, replay inconsistencies, source corruption, synthetic data injection, low-quality clusters, abnormal evidence growth, incomplete lineage, replay manipulation, coordinated evidence attacks, stale evidence exploitation, concentration attacks, nondeterministic assessments, non-replayable validation, tenant breach, and unknown evidence behavior.

## Containment

The defense automatically rejects unverifiable evidence, quarantines suspected poisoned evidence, suppresses synthetic evidence, isolates compromised sources, excludes poisoned evidence from adaptive learning, requires governance review for poisoning events, preserves forensic evidence, and fails closed when evidence integrity cannot be established.

## Evidence And Replay

Each result includes an evidence trust baseline, provenance report, consistency report, synthetic evidence report, quality report, source reliability report, evidence health score, poisoning assessment, source reliability impact, containment decision, immutable ledger record, cryptographic hashes, and replay verification.

## Invariants

Only authenticated, verifiable, lineage-complete evidence may influence adaptive intelligence. Assessments are deterministic, evidence-backed, explainable, replayable, tenant-isolated, governance-aware, constitutional, advisory-only, auditable, and cryptographically verifiable.

## Implementation

- Types: `types/evidence-poisoning-defense.ts`
- Service: `services/evidence-poisoning-defense/index.ts`
- API routes: `app/api/evidence-poisoning-defense/*`
- Tests: `tests/unit/evidence-poisoning-defense/evidencePoisoningDefense.test.ts`

The exported service exposes `defendEvidenceIntegrity`, `replayEvidencePoisoningDefense`, and `getEvidencePoisoningFoundation`.
