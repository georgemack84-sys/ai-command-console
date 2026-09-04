import type { DurableLearningGate, DurableLearningGateRequest, GateDecision } from "../../types/learning-constitution/durableLearningGate";
import type { KnowledgeAdmissionRequest } from "../../types/learning-constitution/durableKnowledge";
import type { ControlledRegistryWriteResult } from "./controlledRegistryWriter";
import type { ControlledRegistryWriterContract } from "./controlledRegistryWriter";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";

type DeferredCandidateRecorder = Readonly<{
  defer(decision: GateDecision): Promise<unknown>;
}>;

export type DurableLearningPromotionResult = Readonly<{
  status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED";
  gateDecision: GateDecision;
  write?: ControlledRegistryWriteResult;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

/**
 * The production hand-off from provisional candidate evaluation to the
 * controlled durable writer. No outcome other than gate ACCEPT reaches commit.
 */
export class DurableLearningPromotionService {
  constructor(private readonly dependencies: Readonly<{
    gate: DurableLearningGate;
    registryWriter: ControlledRegistryWriterContract;
    deferredCandidates?: DeferredCandidateRecorder;
    phase10Audit?: Readonly<{ ledger: LearningAuditLedger; workspaceId: string; actor?: ProvenanceActor }>;
  }>) {}

  async promote(input: Readonly<{
    gateRequest: DurableLearningGateRequest;
    admission: KnowledgeAdmissionRequest;
  }>): Promise<DurableLearningPromotionResult> {
    const gateDecision = await this.dependencies.gate.evaluate(input.gateRequest);
    try {
      await this.appendGateAudit(input.gateRequest, gateDecision);
    } catch {
      // A candidate can never reach durable mutation without its Phase 10 gate record.
      return { status: "DEFERRED", gateDecision: { ...gateDecision, outcome: "DEFER", commitAuthorization: undefined }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    }
    if (gateDecision.outcome !== "ACCEPT") {
      if (gateDecision.outcome === "DEFER") {
        await this.dependencies.deferredCandidates?.defer(gateDecision);
      }
      return {
        status: gateDecision.outcome === "REJECT" ? "REJECTED" : "DEFERRED",
        gateDecision,
        persistenceEffect: "NONE",
        authorityEffect: "UNCHANGED",
        executionPermissionGranted: false,
      };
    }

    const write = await this.dependencies.registryWriter.commit({
      gateRequest: input.gateRequest,
      decision: gateDecision,
      admission: input.admission,
    });
    return {
      status: write.status === "COMMITTED"
        ? "COMMITTED"
        : write.status === "RE_EVALUATION_REQUIRED"
          ? "RE_EVALUATION_REQUIRED"
          : "REJECTED",
      gateDecision,
      write,
      persistenceEffect: write.persistenceEffect,
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }

  private async appendGateAudit(request: DurableLearningGateRequest, decision: GateDecision): Promise<void> {
    const audit = this.dependencies.phase10Audit;
    if (!audit) return;
    await audit.ledger.append({
      eventId: `learning-audit:gate:${decision.evaluationId}`,
      eventType: "LEARNING_GATE_EVALUATED",
      workspaceId: audit.workspaceId,
      occurredAt: request.candidate.provenance.observedAt,
      actor: audit.actor ?? { actorId: decision.context.decisionActorId, actorType: "SYSTEM" },
      correlationId: decision.evaluationId,
      schemaVersion: "10.0",
      references: { gateEvaluationId: decision.evaluationId, provenanceIds: [request.candidate.provenance.observationId], pipelineId: request.candidate.provenance.sourceId },
      payload: { candidateId: decision.candidateId, outcome: decision.outcome, reasonCodes: decision.reasonCodes, gateVersion: decision.context.gateVersion },
    });
  }
}
