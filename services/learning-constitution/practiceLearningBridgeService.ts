import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { PracticeEvidence, PracticeEvaluation } from "../../types/learning-constitution/practiceEngine";
import type { SkillArtifactRecord, SkillArtifactStore, SkillCapabilityEvidence, SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";
import type { SkillGraphArtifactStore, SkillGraphProjection, SkillRemediationPlan } from "../../types/learning-constitution/skillDependencyGraph";
import { SkillBottleneckDetectionService, SkillRemediationPlanBuilder, SkillRemediationPlanService } from "./skillDependencyGraphService";

const practiceOutcome = (outcome: PracticeEvidence["outcome"]): SkillCapabilityEvidence["outcome"] => outcome === "PASS" || outcome === "CLARIFICATION_VALID" ? "SUCCESS" : outcome === "PARTIAL" ? "PARTIAL" : "FAILURE";

/** Appends practice evidence to an existing Phase 18 skill; it neither promotes mastery nor writes knowledge. */
export class PracticeSkillRegistryBridgeService {
  constructor(private readonly artifacts: SkillArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async attach(input: Readonly<{ practiceEvidence: PracticeEvidence; provenanceId: string; context: string; workspaceId: string; correlationId: string; actor: import("../../types/learning-constitution/provenance").ProvenanceActor }>): Promise<SkillCapabilityEvidence> {
    const existing = await this.artifacts.listArtifacts(input.practiceEvidence.skillId);
    if (!existing.some((artifact) => artifact.artifactType === "CANDIDATE")) throw new Error("practice evidence requires an existing canonical skill candidate");
    if (!input.provenanceId.trim() || !input.context.trim()) throw new Error("practice evidence requires provenance and context");
    const evidence: SkillCapabilityEvidence = { evidenceId: input.practiceEvidence.evidenceId, skillId: input.practiceEvidence.skillId, outcome: practiceOutcome(input.practiceEvidence.outcome), assistance: "INDEPENDENT", context: input.context, provenanceId: input.provenanceId, observedAt: input.practiceEvidence.createdAt, revoked: false };
    await this.artifacts.append({ artifactId: `SKILL_EVIDENCE:${evidence.evidenceId}`, artifactType: "EVIDENCE", subjectId: evidence.skillId, payload: evidence, createdAt: evidence.observedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:practice-evidence-attached:${evidence.evidenceId}`, eventType: "PRACTICE_EVIDENCE_ATTACHED_TO_SKILL", workspaceId: input.workspaceId, occurredAt: evidence.observedAt, actor: input.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: { provenanceIds: [evidence.provenanceId] }, payload: { skillId: evidence.skillId, practiceEvidenceId: input.practiceEvidence.evidenceId, outcome: evidence.outcome, skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
    return evidence;
  }
}

/** Routes only dependency-classified practice failure into the Phase 19 remediation path. */
export class PracticeGraphRemediationRouter {
  constructor(private readonly graphArtifacts: SkillGraphArtifactStore) {}
  async route(input: Readonly<{
    planId: string;
    evaluation: PracticeEvaluation;
    targetSkillId: string;
    projection: SkillGraphProjection;
    registryEntries: ReadonlyMap<string, SkillRegistryEntry>;
    graphVersionId: string;
    createdBy: import("../../types/learning-constitution/provenance").ProvenanceActor;
    workspaceId: string;
    correlationId: string;
  }>): Promise<Readonly<{ status: "ROUTED" | "NOT_ROUTED" | "INSUFFICIENT_EVIDENCE"; plan?: SkillRemediationPlan }>> {
    if (input.evaluation.outcome !== "FAIL" || !input.evaluation.failureTypes.includes("DEPENDENCY_FAILURE")) return { status: "NOT_ROUTED" };
    const diagnosis = new SkillBottleneckDetectionService().diagnose({ targetSkillId: input.targetSkillId, dependencies: input.projection.dependencies, registryEntries: input.registryEntries, failedEvaluationEvidenceIds: [input.evaluation.evaluationId] });
    if (diagnosis.status === "INSUFFICIENT_EVIDENCE" || diagnosis.status === "NOT_LOCALIZED") return { status: "INSUFFICIENT_EVIDENCE" };
    const plan = new SkillRemediationPlanBuilder().build({ planId: input.planId, diagnosis, graphVersionId: input.graphVersionId, createdBy: input.createdBy, createdAt: input.evaluation.evaluatedAt });
    await new SkillRemediationPlanService(this.graphArtifacts).create(plan, input.workspaceId, input.correlationId);
    return { status: "ROUTED", plan };
  }
}
