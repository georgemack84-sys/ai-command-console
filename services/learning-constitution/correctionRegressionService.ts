import type { CorrectionRegressionCase, CorrectionRepository, CorrectionRetestEvidence } from "../../types/learning-constitution/correctionLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";

export interface CorrectionCounterfactualRunner { replay(regressionCase: CorrectionRegressionCase): Promise<Readonly<{ actualBehavior: string; outcome: CorrectionRetestEvidence["outcome"]; findings: readonly string[] }>>; }

/** Stores regression intent before replay and makes the replay result append-only evidence. */
export class CorrectionRegressionService {
  constructor(private readonly repository: CorrectionRepository, private readonly runner: CorrectionCounterfactualRunner, private readonly audit?: LearningAuditLedger) {}
  async createCase(regressionCase: CorrectionRegressionCase, workspaceId: string, actor: ProvenanceActor, correlationId: string): Promise<CorrectionRegressionCase> {
    if (!regressionCase.scenario.trim() || !regressionCase.expectedBehavior.trim() || !regressionCase.counterexample.trim()) throw new Error("regression case requires scenario, expected behavior, and counterexample");
    const stored = await this.repository.appendRegressionCase(regressionCase);
    if (this.audit) await this.audit.append({ eventId: `audit:${stored.correctionId}:regression:${stored.regressionCaseId}`, eventType: "REGRESSION_CASE_CREATED", workspaceId, occurredAt: stored.createdAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [stored.correctionId] }, payload: { regressionCaseId: stored.regressionCaseId, protectsCandidateId: stored.protectsCandidateId, errorType: stored.errorType } });
    return stored;
  }
  async retest(regressionCase: CorrectionRegressionCase, retestId: string, evaluatedAt: string, workspaceId: string, actor: ProvenanceActor, correlationId: string): Promise<CorrectionRetestEvidence> {
    if (this.audit) await this.audit.append({ eventId: `audit:${regressionCase.correctionId}:retest-started:${retestId}`, eventType: "CORRECTION_RETEST_STARTED", workspaceId, occurredAt: evaluatedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [regressionCase.correctionId] }, payload: { regressionCaseId: regressionCase.regressionCaseId } });
    const replay = await this.runner.replay(regressionCase); const evidence: CorrectionRetestEvidence = { retestId, correctionId: regressionCase.correctionId, regressionCaseId: regressionCase.regressionCaseId, ...replay, evaluatedAt, immutable: true };
    const stored = await this.repository.appendRetest(evidence);
    if (this.audit) await this.audit.append({ eventId: `audit:${stored.correctionId}:retest:${stored.retestId}`, eventType: stored.outcome === "PASS" ? "CORRECTION_RETEST_PASSED" : "CORRECTION_RETEST_FAILED", workspaceId, occurredAt: stored.evaluatedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [stored.correctionId] }, payload: { regressionCaseId: stored.regressionCaseId, outcome: stored.outcome, findings: stored.findings } });
    return stored;
  }
}
