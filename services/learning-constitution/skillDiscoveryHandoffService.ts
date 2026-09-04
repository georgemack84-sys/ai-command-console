import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { CandidateSkillEvaluationRequest, DiscoveredSkillCandidate, SkillDiscoveryArtifactStore } from "../../types/learning-constitution/skillDiscovery";

const accepted = (payload: unknown, candidate: DiscoveredSkillCandidate) => typeof payload === "object" && payload !== null && (payload as { action?: unknown; definitionVersion?: unknown }).action === "ACCEPT_FOR_EVALUATION" && (payload as { definitionVersion?: unknown }).definitionVersion === candidate.definitionVersion;

/** Creates a version-bound request for existing governed learning systems; it cannot execute or certify the candidate. */
export class SkillDiscoveryHandoffService {
  constructor(private readonly artifacts: SkillDiscoveryArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async requestEvaluation(input: Readonly<{ requestId: string; candidate: DiscoveredSkillCandidate; workspaceId?: string; correlationId?: string }>): Promise<CandidateSkillEvaluationRequest> {
    if (input.candidate.lifecycle !== "ACCEPTED_FOR_EVALUATION" || input.candidate.competencyStatus !== "UNTESTED" || input.candidate.certificationStatus !== "NOT_CERTIFIED") throw new Error("only accepted untested candidates may request governed evaluation");
    const history = await this.artifacts.listArtifacts(input.candidate.candidateSkillId);
    if (!history.some((artifact) => artifact.artifactType === "REVIEW" && accepted(artifact.payload, input.candidate))) throw new Error("candidate evaluation requires a matching immutable human acceptance review");
    const request: CandidateSkillEvaluationRequest = { requestId: input.requestId, candidateSkillId: input.candidate.candidateSkillId, definitionVersion: input.candidate.definitionVersion, requiredStages: ["PRACTICE", "EVALUATION", "ADVERSARIAL_EXAMINATION", "RETENTION"], boundarySnapshot: { expectedCapability: input.candidate.expectedCapability, boundaries: input.candidate.boundaries, nonExamples: input.candidate.nonExamples, failureConditions: input.candidate.failureConditions }, status: "PROPOSED", practiceAuthority: "EXISTING_GOVERNED_PATH_REQUIRED", evaluationAuthority: "EXISTING_GOVERNED_PATH_REQUIRED", certificationStatus: "NOT_CERTIFIED", registryWriteAuthorized: false, executionPermissionGranted: false, durableKnowledgeEffect: "NONE", createdAt: input.candidate.createdAt, createdBy: input.candidate.createdBy };
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_EVALUATION_REQUEST:${request.requestId}`, artifactType: "EVALUATION_REQUEST", subjectId: request.candidateSkillId, payload: request, createdAt: request.createdAt });
    if (this.audit && input.workspaceId) await this.audit.append({ eventId: `audit:skill-discovery-evaluation-request:${request.requestId}`, eventType: "SKILL_EVALUATION_REQUESTED", workspaceId: input.workspaceId, occurredAt: request.createdAt, actor: request.createdBy, correlationId: input.correlationId ?? request.requestId, schemaVersion: "10.0", references: {}, payload: { candidateSkillId: request.candidateSkillId, definitionVersion: request.definitionVersion, requiredStages: request.requiredStages, certificationStatus: "NOT_CERTIFIED", registryWriteAuthorized: false, executionPermissionGranted: false } });
    return request;
  }
}
