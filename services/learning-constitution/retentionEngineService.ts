import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";
import type { RetentionArtifactStore, RetentionAuditType, RetentionEvidence, RetentionRecord, RetentionStage, RetentionTransition } from "../../types/learning-constitution/retentionEngine";
import type { KnowledgeVolatility, RetentionReviewBudget, RetentionReviewCandidate, RetentionReviewLease, RetentionReviewPriority, RetentionSchedule } from "../../types/learning-constitution/retentionEngine";

const checkpointStages: Record<RetentionEvidence["checkpoint"], RetentionStage | null> = { IMMEDIATE: "IMMEDIATE_ONLY", SHORT_TERM: "SHORT_TERM_RETAINED", MEDIUM_TERM: "MEDIUM_TERM_RETAINED", LONG_TERM: "LONG_TERM_RETAINED", REACTIVATION: "SHORT_TERM_RETAINED", NATURAL_USE: null, ADVERSARIAL: null };
const stageFor = (checkpoint: RetentionEvidence["checkpoint"]): RetentionStage | null => checkpointStages[checkpoint];
const rank: Record<RetentionStage, number> = { NOT_EVALUATED: 0, IMMEDIATE_ONLY: 1, SHORT_TERM_RETAINED: 2, MEDIUM_TERM_RETAINED: 3, LONG_TERM_RETAINED: 4, DURABLY_RETAINED: 5, RETENTION_AT_RISK: 0, DEGRADED: 0, REMEDIATION_REQUIRED: 0 };
const validTime = (value: string) => !Number.isNaN(Date.parse(value));

/** Enforces Phase 33's core boundary: only fresh, attributable demonstrations can change a retention claim. */
export class RetentionEngineService {
  constructor(private readonly artifacts: RetentionArtifactStore) {}

  async start(record: RetentionRecord): Promise<RetentionRecord> {
    if (!record.retentionId.trim() || !record.skillId.trim() || !record.competencyClaimId.trim() || !record.initialLearningEventId.trim() || !record.immutable || record.stage !== "NOT_EVALUATED" || record.suspendedStage !== null || !validTime(record.initialLearningAt)) throw new Error("retention records must begin as immutable, identified, and NOT_EVALUATED");
    await this.artifacts.append({ artifactId: `RETENTION_RECORD:${record.retentionId}`, artifactType: "RECORD", subjectId: record.skillId, payload: record, createdAt: record.createdAt });
    return record;
  }

  async applyEvidence(record: RetentionRecord, evidence: RetentionEvidence): Promise<RetentionTransition> {
    if (evidence.retentionId !== record.retentionId || evidence.skillId !== record.skillId || !evidence.immutable || !validTime(evidence.occurredAt)) throw new Error("retention evidence must be immutable and bound to its retention record");
    await this.artifacts.append({ artifactId: `RETENTION_EVIDENCE:${evidence.evidenceId}`, artifactType: "EVIDENCE", subjectId: record.retentionId, payload: evidence, createdAt: evidence.occurredAt });
    const reject = (reason: string): RetentionTransition => ({ record: { ...record, evidenceIds: [...record.evidenceIds, evidence.evidenceId], updatedAt: evidence.occurredAt }, accepted: false, advanced: false, reason, requiresRemediation: record.remediationRequired });
    if (evidence.validity !== "VALID" || evidence.sourceKnowledgeStatus !== "ACTIVE") return reject("Only valid evidence for active knowledge can support retention.");
    if (evidence.outcome === "INCONCLUSIVE") return reject("Inconclusive evidence changes neither retention nor remediation state.");
    if (Date.parse(evidence.occurredAt) < Date.parse(record.initialLearningAt)) return reject("Retention evidence cannot predate initial learning.");
    if (evidence.outcome === "FAIL") {
      const next = { ...record, stage: "REMEDIATION_REQUIRED" as const, suspendedStage: record.remediationRequired ? record.suspendedStage : record.stage, evidenceIds: [...record.evidenceIds, evidence.evidenceId], lastFailureAt: evidence.occurredAt, remediationRequired: true, updatedAt: evidence.occurredAt };
      await this.artifacts.append({ artifactId: `RETENTION_TRANSITION:${record.retentionId}:${evidence.evidenceId}`, artifactType: "TRANSITION", subjectId: record.retentionId, payload: next, createdAt: evidence.occurredAt });
      return { record: next, accepted: true, advanced: false, reason: "A valid failure suspends the retention claim pending targeted remediation.", requiresRemediation: true };
    }
    if (!evidence.independentExecution || evidence.answerExposed) return reject("Passing evidence must be independently executed without answer exposure.");
    const baselineStage = record.remediationRequired ? record.suspendedStage ?? "NOT_EVALUATED" : record.stage;
    const target = stageFor(evidence.checkpoint);
    if (target && rank[target] > rank[baselineStage] + 1) return reject("Retention stages cannot be skipped by a single demonstration.");
    if (target && rank[target] > 1 && !evidence.novelContext) return reject("Delayed retention stages require a novel context.");
    const newStage = target && rank[target] > rank[baselineStage] ? target : baselineStage;
    const next = { ...record, stage: newStage, suspendedStage: null, evidenceIds: [...record.evidenceIds, evidence.evidenceId], lastSuccessfulDemonstrationAt: evidence.occurredAt, remediationRequired: false, updatedAt: evidence.occurredAt };
    await this.artifacts.append({ artifactId: `RETENTION_TRANSITION:${record.retentionId}:${evidence.evidenceId}`, artifactType: "TRANSITION", subjectId: record.retentionId, payload: next, createdAt: evidence.occurredAt });
    return { record: next, accepted: true, advanced: newStage !== baselineStage, reason: newStage === baselineStage ? "Evidence was retained without advancing the current stage." : "Fresh independent evidence advanced the retention stage.", requiresRemediation: false };
  }
}

export class RetentionAuditService {
  constructor(private readonly ledger: LearningAuditLedger) {}
  async record(input: Readonly<{ eventId: string; eventType: RetentionAuditType; workspaceId: string; retentionId: string; skillId: string; occurredAt: string; actor: ProvenanceActor; correlationId: string; payload: Readonly<Record<string, unknown>> }>) {
    return this.ledger.append({ eventId: input.eventId, eventType: input.eventType, workspaceId: input.workspaceId, occurredAt: input.occurredAt, actor: input.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: {}, payload: { ...input.payload, retentionId: input.retentionId, skillId: input.skillId, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
  }
}

const intervalCeiling: Record<KnowledgeVolatility, number> = { STABLE: 24 * 365, SEMI_STABLE: 24 * 90, VOLATILE: 24 * 14 };
const baseInterval: Record<RetentionStage, number> = { NOT_EVALUATED: 0, IMMEDIATE_ONLY: 24 * 3, SHORT_TERM_RETAINED: 24 * 10, MEDIUM_TERM_RETAINED: 24 * 30, LONG_TERM_RETAINED: 24 * 90, DURABLY_RETAINED: 24 * 180, RETENTION_AT_RISK: 24, DEGRADED: 24, REMEDIATION_REQUIRED: 0 };
const strengthMultiplier = (strength: RetentionEvidence["strength"]) => strength === "STRONG" ? 1.5 : strength === "MODERATE" ? 1.15 : 1;

/** Pure, clock-injected scheduling policy. It exposes why a review is due and never treats lateness as forgetting. */
export class RetentionScheduler {
  schedule(input: Readonly<{ record: RetentionRecord; now: string; evidenceStrength: RetentionEvidence["strength"]; outcome: RetentionEvidence["outcome"]; volatility: KnowledgeVolatility }>): RetentionSchedule {
    if (!validTime(input.now)) throw new Error("retention scheduling requires an ISO-8601 clock value");
    const current = baseInterval[input.record.stage];
    const failed = input.outcome === "FAIL" || input.record.remediationRequired;
    const nextIntervalHours = failed ? 24 : Math.min(intervalCeiling[input.volatility], Math.max(24, Math.round(current * strengthMultiplier(input.evidenceStrength))));
    const anchor = input.record.lastSuccessfulDemonstrationAt ?? input.record.initialLearningAt;
    const nextReviewAt = new Date(Date.parse(anchor) + nextIntervalHours * 3_600_000).toISOString();
    return { retentionId: input.record.retentionId, currentIntervalHours: current, nextIntervalHours, nextReviewAt, reason: failed ? "Failure or pending remediation shortens the next review interval." : `Fresh ${input.evidenceStrength.toLowerCase()} evidence supports a bounded interval expansion.`, schedulingEffect: "RECOMMENDATION_ONLY", executionPermissionGranted: false };
  }

  priority(candidate: RetentionReviewCandidate, now: string): RetentionReviewPriority {
    const due = !!candidate.record.nextReviewAt && Date.parse(candidate.record.nextReviewAt) <= Date.parse(now);
    const score = Number((candidate.importance * .25 + candidate.decayRisk * .20 + candidate.dependencyImportance * .20 + candidate.failureHistory * .15 + candidate.usageProbability * .10 + candidate.uncertainty * .10 + (due ? .20 : 0) + (candidate.record.remediationRequired ? .30 : 0)).toFixed(4));
    return { retentionId: candidate.record.retentionId, score, due, rationale: candidate.record.remediationRequired ? "Remediation is required after a valid failed retention demonstration." : due ? "Review is due and ranked by importance, decay, dependencies, failures, likely use, and uncertainty." : "Review is ranked by retention risk; it is not yet due." };
  }

  select(candidates: readonly RetentionReviewCandidate[], budget: RetentionReviewBudget, now: string): readonly RetentionReviewCandidate[] {
    if (budget.maximumReviews < 0 || budget.maximumEvaluationMinutes < 0 || budget.maximumAdversarialReviews < 0) throw new Error("retention budgets cannot be negative");
    const ordered = [...candidates].sort((left, right) => this.priority(right, now).score - this.priority(left, now).score || left.record.retentionId.localeCompare(right.record.retentionId));
    let adversarialUsed = 0;
    return ordered.filter((candidate) => { if (candidate.adversarial && adversarialUsed >= budget.maximumAdversarialReviews) return false; if (candidate.adversarial) adversarialUsed += 1; return true; }).slice(0, budget.maximumReviews);
  }
}

/** Stores a single immutable review reservation per review key, so concurrent scheduler runs cannot execute it twice. */
export class RetentionReviewLeaseService {
  constructor(private readonly artifacts: RetentionArtifactStore) {}
  async acquire(input: Readonly<{ retentionId: string; reviewKey: string; leaseId: string; now: string; expiresAt: string }>): Promise<RetentionReviewLease> {
    if (!input.retentionId.trim() || !input.reviewKey.trim() || !input.leaseId.trim() || !validTime(input.now) || !validTime(input.expiresAt) || Date.parse(input.expiresAt) <= Date.parse(input.now)) throw new Error("retention review leases require a bounded identity and future expiry");
    const existing = (await this.artifacts.listArtifacts(input.retentionId)).find((artifact) => artifact.artifactType === "REVIEW_LEASE" && (artifact.payload as { reviewKey?: string }).reviewKey === input.reviewKey)?.payload as RetentionReviewLease | undefined;
    if (existing && Date.parse(existing.expiresAt) > Date.parse(input.now)) return existing;
    if (existing) throw new Error("an expired retention review lease is immutable; schedule a new review key");
    const lease: RetentionReviewLease = { leaseId: input.leaseId, retentionId: input.retentionId, reviewKey: input.reviewKey, issuedAt: input.now, expiresAt: input.expiresAt, status: "ACTIVE", executionPermissionGranted: false, durableKnowledgeEffect: "NONE" };
    await this.artifacts.append({ artifactId: `RETENTION_REVIEW_LEASE:${input.retentionId}:${input.reviewKey}`, artifactType: "REVIEW_LEASE", subjectId: input.retentionId, payload: lease, createdAt: input.now });
    return lease;
  }
}
