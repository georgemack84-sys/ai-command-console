import type { PatternDetectionInput, PatternEvaluation, PatternEvaluator, PotentialPattern, PotentialPatternRepository } from "../../types/learning-constitution/principleLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

const unique = (values: readonly string[]) => [...new Set(values)];
const confidence = (support: number, contradict: number, diversity: number) => Math.max(0, Math.min(0.99, ((support / Math.max(1, support + contradict)) * 0.65) + (Math.min(diversity, 4) / 4) * 0.25));

/** Builds evidence-only patterns. It deliberately cannot create candidate or durable principles. */
export class ConservativePatternDetectionService {
  constructor(private readonly evaluator: PatternEvaluator, private readonly audit?: LearningAuditLedger, private readonly repository?: PotentialPatternRepository) {}
  async detect(input: PatternDetectionInput, workspaceId: string, correlationId: string): Promise<Readonly<{ pattern: PotentialPattern; evaluation: PatternEvaluation }>> {
    const supporting = input.supportingEvidence; const contradicting = input.contradictingEvidence ?? [];
    if (!input.description.trim() || !input.proposedExplanation.trim() || !input.disconfirmationCondition.trim()) throw new Error("pattern requires description, explanation, and disconfirmation condition");
    if (supporting.length < 2) throw new Error("pattern requires at least two supporting observations");
    if (new Set([...supporting, ...contradicting].map((item) => item.evidenceId)).size !== supporting.length + contradicting.length) throw new Error("pattern evidence must be unique");
    if (input.alternativeExplanations.filter((item) => item.trim()).length < 2) throw new Error("pattern requires at least two alternative explanations");
    const diversityCount = new Set(supporting.map((item) => item.diversityKey)).size;
    const pattern: PotentialPattern = { patternId: input.patternId, description: input.description, supportingEvidence: supporting, contradictingEvidence: contradicting, relevantCorrectionIds: unique(input.relevantCorrectionIds ?? []), relevantExceptionIds: unique(input.relevantExceptionIds ?? []), observedScope: input.observedScope, observationCount: supporting.length + contradicting.length, diversityCount, confidence: confidence(supporting.length, contradicting.length, diversityCount), proposedExplanation: input.proposedExplanation, alternativeExplanations: unique(input.alternativeExplanations), disconfirmationCondition: input.disconfirmationCondition, status: "PATTERN_ONLY", createdBy: input.createdBy, createdAt: input.createdAt, immutable: true };
    const persisted = this.repository ? await this.repository.append(pattern) : pattern; const evaluation = this.evaluator.evaluate(persisted);
    if (this.audit) await this.audit.append({ eventId: `audit:pattern:${pattern.patternId}`, eventType: evaluation.disposition === "REJECT" ? "PATTERN_REJECTED" : "PATTERN_DETECTED", workspaceId, occurredAt: pattern.createdAt, actor: pattern.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: [...pattern.supportingEvidence, ...pattern.contradictingEvidence].map((item) => item.provenanceId) }, payload: { patternId: pattern.patternId, observationCount: pattern.observationCount, diversityCount: pattern.diversityCount, confidence: pattern.confidence, disposition: evaluation.disposition, candidatePrincipleCreated: false } });
    return { pattern: persisted, evaluation };
  }
}

/** Correlation guard: low diversity and counterevidence prevent a pattern from being treated as a candidate rule. */
export class ConservativePatternEvaluator implements PatternEvaluator {
  evaluate(pattern: PotentialPattern): PatternEvaluation {
    const reasons: string[] = [];
    if (pattern.diversityCount < 2) reasons.push("INSUFFICIENT_EVIDENCE_DIVERSITY");
    if (pattern.contradictingEvidence.length) reasons.push("COUNTEREVIDENCE_PRESENT");
    if (pattern.relevantCorrectionIds.length) reasons.push("CORRECTION_REASSESSMENT_REQUIRED");
    const disposition = reasons.includes("INSUFFICIENT_EVIDENCE_DIVERSITY") ? "REJECT" : reasons.length ? "REASSESS" : "RETAIN";
    return { patternId: pattern.patternId, disposition, reasons: reasons.length ? reasons : ["PATTERN_RETAINED_AS_EVIDENCE_ONLY"], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false, candidatePrincipleCreated: false };
  }
}
