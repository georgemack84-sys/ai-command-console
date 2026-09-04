import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, SkillDiscoveryComparisonService, SkillDiscoveryHandoffService, SkillDiscoveryHumanReviewService, SkillDiscoveryPatternDetector, SkillDiscoveryService } from "@/services/learning-constitution";
import type { DiscoveredSkillCandidate, SkillDiscoveryArtifactRecord, SkillDiscoveryArtifactStore, SkillDiscoveryEpisode } from "@/types/learning-constitution";

const at = "2026-09-03T20:00:00.000Z";
const agent = { actorId: "agent:noesis-discovery", actorType: "AGENT" as const };
const human = { actorId: "human:teacher", actorType: "HUMAN" as const };
const store = (): SkillDiscoveryArtifactStore => { const records: SkillDiscoveryArtifactRecord[] = []; return { append: async (artifact) => { records.push(artifact); return artifact; }, listArtifacts: async (subjectId) => records.filter((artifact) => artifact.subjectId === subjectId), listWorkspaceArtifacts: async () => records }; };
const episode = (id: string, context: string): SkillDiscoveryEpisode => ({ episodeId: id, source: "EVALUATION", sourceId: `EV-${id}`, behavioralFingerprint: "dependency-aware-roadmap-decomposition", contextFingerprint: context, outcome: "SUCCESS", independent: true, safeForDiscovery: true, observedAt: at, immutable: true });
const candidate: DiscoveredSkillCandidate = { candidateSkillId: "CS-ACCEPT-34", definitionVersion: 1, name: "Dependency-aware roadmap decomposition", description: "Decompose a roadmap while exposing prerequisites and ordering constraints.", purpose: "Represent an observed planning capability.", expectedCapability: "Identify phases and prerequisite ordering across unfamiliar projects.", boundaries: ["Project roadmap planning"], nonExamples: ["Listing phases without dependency reasoning"], failureConditions: ["Incorrect prerequisite ordering"], evaluationRequirements: ["Novel independent scenario", "Adversarial changed-assumption scenario"], proposedSkillType: "COMPOSITE", observedEpisodeIds: ["E1", "E2", "E3"], relatedSkillIds: [], proposedPrerequisiteSkillIds: [], discoveryConfidence: .82, comparison: "POSSIBLE_NEW_SKILL", lifecycle: "CANDIDATE", competencyStatus: "UNTESTED", certificationStatus: "NOT_CERTIFIED", expiresAt: "2026-10-03T20:00:00.000Z", createdBy: agent, createdAt: at, immutable: true, registryWriteAuthorized: false, executionPermissionGranted: false, durableKnowledgeEffect: "NONE" };

describe("Phase 34 integrated acceptance", () => {
  it("discovers an unnamed recurring capability yet never treats discovery as competence or certification", async () => {
    const artifacts = store(); const audit = new InMemoryLearningAuditLedger(); const discovery = new SkillDiscoveryService(artifacts, audit); const episodes = [episode("E1", "project-a"), episode("E2", "project-b"), episode("E3", "project-c")];
    for (const item of episodes) await discovery.recordEpisode(item);
    const pattern = new SkillDiscoveryPatternDetector().detect(episodes)[0];
    expect(pattern).toMatchObject({ recurrenceEligible: true, independentSuccesses: 3 });
    expect(new SkillDiscoveryComparisonService().compare({ candidate, pattern, registryEntries: [], graph: { dependencies: [], latestVersion: null } })).toMatchObject({ outcome: "POSSIBLE_NEW_SKILL", registryEffect: "NONE" });
    await discovery.propose({ candidate, episodes, budget: { maximumCandidates: 3, windowHours: 24 }, workspaceId: "workspace-34", correlationId: "phase34-acceptance" });
    const review = new SkillDiscoveryHumanReviewService(artifacts);
    await review.review({ candidate, review: { reviewId: "REVIEW-34", candidateSkillId: candidate.candidateSkillId, definitionVersion: candidate.definitionVersion, action: "ACCEPT_FOR_EVALUATION", targetCandidateOrSkillId: null, rationale: "The recurring pattern is distinct enough to test.", decidedBy: human, decidedAt: at, immutable: true, registryWriteAuthorized: false, certificationStatus: "NOT_CERTIFIED" } });
    const accepted = { ...candidate, lifecycle: "ACCEPTED_FOR_EVALUATION" as const };
    const request = await new SkillDiscoveryHandoffService(artifacts, audit).requestEvaluation({ requestId: "REQUEST-34", candidate: accepted, workspaceId: "workspace-34", correlationId: "phase34-acceptance" });
    expect(request).toMatchObject({ requiredStages: ["PRACTICE", "EVALUATION", "ADVERSARIAL_EXAMINATION", "RETENTION"], certificationStatus: "NOT_CERTIFIED", registryWriteAuthorized: false, executionPermissionGranted: false });
    expect((await artifacts.listWorkspaceArtifacts()).some((artifact) => (artifact.artifactType as string) === "CERTIFICATION")).toBe(false);
    expect((await audit.list("workspace-34")).map((entry) => entry.event.eventType)).toEqual(["SKILL_CANDIDATE_DISCOVERED", "SKILL_EVALUATION_REQUESTED"]);
  });
});
