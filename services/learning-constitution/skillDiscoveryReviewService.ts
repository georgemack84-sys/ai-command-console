import type { CandidateSkillGraphPlacement, DiscoveredSkillCandidate, SkillDiscoveryArtifactStore, SkillDiscoveryReview } from "../../types/learning-constitution/skillDiscovery";
import type { SkillGraphProjection } from "../../types/learning-constitution/skillDependencyGraph";

const activeLifecycle = new Set<DiscoveredSkillCandidate["lifecycle"]>(["OBSERVED", "PATTERN_DETECTED", "CANDIDATE", "UNDER_REVIEW"]);

/** Human decisions can route a candidate for evaluation or close it, but cannot certify a capability. */
export class SkillDiscoveryHumanReviewService {
  constructor(private readonly artifacts: SkillDiscoveryArtifactStore) {}
  async review(input: Readonly<{ candidate: DiscoveredSkillCandidate; review: SkillDiscoveryReview }>) {
    const { candidate, review } = input;
    if (review.decidedBy.actorType !== "HUMAN" || !review.decidedBy.actorId.trim() || !review.rationale.trim() || review.candidateSkillId !== candidate.candidateSkillId || review.definitionVersion !== candidate.definitionVersion || !review.immutable || review.registryWriteAuthorized || review.certificationStatus !== "NOT_CERTIFIED" || !activeLifecycle.has(candidate.lifecycle)) throw new Error("skill discovery review requires a human decision for the current untested candidate definition");
    if ((review.action === "MERGE") !== Boolean(review.targetCandidateOrSkillId)) throw new Error("merge review requires exactly one target candidate or canonical skill");
    if (review.action !== "MERGE" && review.targetCandidateOrSkillId !== null) throw new Error("only merge review may name a target");
    const lifecycle = review.action === "ACCEPT_FOR_EVALUATION" ? "ACCEPTED_FOR_EVALUATION" : review.action === "REJECT" ? "REJECTED" : review.action === "MERGE" ? "MERGED" : review.action === "DEFER" ? "DEFERRED" : "UNDER_REVIEW" as const;
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_REVIEW:${review.reviewId}`, artifactType: "REVIEW", subjectId: candidate.candidateSkillId, payload: review, createdAt: review.decidedAt });
    const event = { candidateSkillId: candidate.candidateSkillId, definitionVersion: candidate.definitionVersion, previousLifecycle: candidate.lifecycle, lifecycle, action: review.action, certificationStatus: "NOT_CERTIFIED" as const, registryWriteAuthorized: false as const };
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_LIFECYCLE:${candidate.candidateSkillId}:v${candidate.definitionVersion}:${review.reviewId}`, artifactType: "LIFECYCLE", subjectId: candidate.candidateSkillId, payload: event, createdAt: review.decidedAt });
    return event;
  }
  async revise(input: Readonly<{ prior: DiscoveredSkillCandidate; revised: DiscoveredSkillCandidate; action: Extract<SkillDiscoveryReview["action"], "RENAME" | "NARROW" | "EXPAND"> }>) {
    if (input.prior.candidateSkillId !== input.revised.candidateSkillId || input.revised.definitionVersion !== input.prior.definitionVersion + 1 || input.revised.lifecycle !== "UNDER_REVIEW" || input.revised.competencyStatus !== "UNTESTED" || input.revised.certificationStatus !== "NOT_CERTIFIED" || !input.revised.immutable) throw new Error("candidate definition revisions must create the next immutable untested version under review");
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_CANDIDATE:${input.revised.candidateSkillId}:v${input.revised.definitionVersion}`, artifactType: "CANDIDATE", subjectId: input.revised.candidateSkillId, payload: { ...input.revised, revisionAction: input.action, supersedesDefinitionVersion: input.prior.definitionVersion }, createdAt: input.revised.createdAt });
    return input.revised;
  }
}

/** Skill Graph positioning is a candidate concept proposal; Phase 19 remains the sole graph admission path. */
export class CandidateSkillGraphPlacementService {
  constructor(private readonly artifacts: SkillDiscoveryArtifactStore) {}
  async propose(input: Readonly<{ placement: CandidateSkillGraphPlacement; candidate: DiscoveredSkillCandidate; graph: SkillGraphProjection }>) {
    const { placement, candidate } = input;
    if (candidate.lifecycle !== "ACCEPTED_FOR_EVALUATION" || placement.candidateSkillId !== candidate.candidateSkillId || placement.definitionVersion !== candidate.definitionVersion || placement.status !== "PROPOSED" || placement.graphWriteAuthorized || placement.executionPermissionGranted || placement.durableKnowledgeEffect !== "NONE" || !placement.rationale.trim()) throw new Error("only an accepted untested candidate may propose a non-writing graph placement");
    const known = new Set(input.graph.dependencies.flatMap((edge) => [edge.prerequisite.skillId, edge.dependent.skillId]));
    if (placement.prerequisiteSkillIds.some((id) => !known.has(id)) || placement.relatedSkillIds.some((id) => !known.has(id))) throw new Error("graph placement references must point to known graph skills");
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_GRAPH_PLACEMENT:${placement.proposalId}`, artifactType: "GRAPH_PLACEMENT", subjectId: candidate.candidateSkillId, payload: placement, createdAt: placement.createdAt });
    return placement;
  }
}
