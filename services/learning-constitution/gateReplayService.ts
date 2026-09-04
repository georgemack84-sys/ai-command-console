import type { DurableLearningGate, GateAuditLedger, GateDecision } from "../../types/learning-constitution/durableLearningGate";
import type { LearningIntegrityFailureRecorder } from "../../types/learning-constitution/learningAuditFailure";

export type GateReplayResult = Readonly<{
  status: "REPRODUCIBLE" | "DIFFERENT" | "UNAVAILABLE";
  original?: GateDecision;
  replay?: GateDecision;
  differences: readonly string[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

/** Re-runs a captured evaluation and makes decision drift explicit. */
export class GateReplayService {
  constructor(private readonly dependencies: Readonly<{ auditLedger: GateAuditLedger; gate: DurableLearningGate; failureRecorder?: LearningIntegrityFailureRecorder; workspaceId?: string }>) {}

  async replay(candidateId: string, evaluationId: string): Promise<GateReplayResult> {
    const event = (await this.dependencies.auditLedger.findByCandidateId(candidateId)).find((item) => item.decision.evaluationId === evaluationId);
    if (!event?.request) return this.result("UNAVAILABLE", [], event?.decision);
    const replay = await this.dependencies.gate.evaluate({ ...event.request, evaluationId: `replay:${evaluationId}` });
    const differences: string[] = [];
    if (event.decision.outcome !== replay.outcome) differences.push("OUTCOME");
    if (JSON.stringify(event.decision.reasonCodes) !== JSON.stringify(replay.reasonCodes)) differences.push("REASON_CODES");
    if (event.decision.inputFingerprint !== replay.inputFingerprint) differences.push("INPUT_FINGERPRINT");
    if (JSON.stringify(event.decision.checks) !== JSON.stringify(replay.checks)) differences.push("CHECKS");
    if (differences.length && this.dependencies.failureRecorder && this.dependencies.workspaceId) await this.dependencies.failureRecorder.record({ eventId: `learning-audit:replay-mismatch:${evaluationId}`, eventType: "REPLAY_MISMATCH_DETECTED", workspaceId: this.dependencies.workspaceId, occurredAt: new Date().toISOString(), actor: { actorId: "agent:noesis", actorType: "SYSTEM" }, correlationId: evaluationId, causationId: `gate-audit:${evaluationId}`, references: { gateEvaluationId: evaluationId, provenanceIds: [event.request.candidate.provenance.observationId] }, reason: differences.join(",") });
    return this.result(differences.length ? "DIFFERENT" : "REPRODUCIBLE", differences, event.decision, replay);
  }

  private result(status: GateReplayResult["status"], differences: readonly string[], original?: GateDecision, replay?: GateDecision): GateReplayResult {
    return { status, ...(original ? { original } : {}), ...(replay ? { replay } : {}), differences, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
