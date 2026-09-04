import type { CorrectionRepository, CorrectionRootCauseAnalysis, SystemImprovementCandidate } from "../../types/learning-constitution/correctionLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";

/** Records immutable diagnoses and detects repeat patterns; neither operation changes Noesis behavior. */
export class CorrectionRootCauseService {
  constructor(private readonly repository: CorrectionRepository, private readonly audit?: LearningAuditLedger) {}
  async identify(rootCause: CorrectionRootCauseAnalysis, workspaceId: string, actor: ProvenanceActor, correlationId: string): Promise<CorrectionRootCauseAnalysis> {
    if (!rootCause.immediateCause.trim() || !rootCause.deeperCause.trim() || !rootCause.controlFailure.trim()) throw new Error("root-cause analysis requires immediate, deeper, and control causes");
    const stored = await this.repository.appendRootCause(rootCause);
    if (this.audit) await this.audit.append({ eventId: `audit:${stored.correctionId}:root-cause:${stored.rootCauseId}`, eventType: "ROOT_CAUSE_IDENTIFIED", workspaceId, occurredAt: stored.identifiedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [stored.correctionId] }, payload: { errorType: stored.errorType, mechanism: stored.mechanism } });
    return stored;
  }
  async detectRecurring(errorType: SystemImprovementCandidate["errorType"], threshold: number, improvementId: string, detectedAt: string, workspaceId: string, actor: ProvenanceActor, correlationId: string): Promise<SystemImprovementCandidate | null> {
    if (threshold < 2) throw new Error("recurring correction threshold must be at least two");
    const correctionIds = (await this.repository.list()).filter((record) => record.analyses.some((analysis) => analysis.errorType === errorType)).map((record) => record.correctionId).sort();
    if (correctionIds.length < threshold) return null;
    const candidate: SystemImprovementCandidate = { improvementId, errorType, correctionIds, patternDescription: `${correctionIds.length} corrections share ${errorType}.`, recommendedInvestigation: "Review the named learning control and propose a governed change separately.", detectedAt, status: "DETECTED", immutable: true, mutationAuthorized: false };
    const stored = await this.repository.appendImprovementCandidate(candidate);
    if (this.audit) { await this.audit.append({ eventId: `audit:recurring:${stored.improvementId}`, eventType: "RECURRING_FAILURE_PATTERN_DETECTED", workspaceId, occurredAt: stored.detectedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: stored.correctionIds }, payload: { errorType: stored.errorType, count: stored.correctionIds.length } }); await this.audit.append({ eventId: `audit:improvement:${stored.improvementId}`, eventType: "SYSTEM_IMPROVEMENT_CANDIDATE_CREATED", workspaceId, occurredAt: stored.detectedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: stored.correctionIds }, payload: { improvementId: stored.improvementId, mutationAuthorized: false } }); }
    return stored;
  }
}
