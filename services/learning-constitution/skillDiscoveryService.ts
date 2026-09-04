import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { DiscoveredSkillCandidate, SkillDiscoveryArtifactStore, SkillDiscoveryBudget, SkillDiscoveryEpisode } from "../../types/learning-constitution/skillDiscovery";

const validTime = (value: string) => !Number.isNaN(Date.parse(value));
const terminal = new Set<DiscoveredSkillCandidate["lifecycle"]>(["DEFERRED", "DUPLICATE", "MERGED", "REJECTED", "INSUFFICIENT_EVIDENCE", "EXPIRED"]);

/** Detects candidate concepts from diverse episodes; it has no access to the canonical Skill Registry writer. */
export class SkillDiscoveryService {
  constructor(private readonly artifacts: SkillDiscoveryArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async recordEpisode(episode: SkillDiscoveryEpisode) {
    if (!episode.episodeId.trim() || !episode.sourceId.trim() || !episode.behavioralFingerprint.trim() || !episode.contextFingerprint.trim() || !episode.safeForDiscovery || !episode.immutable || !validTime(episode.observedAt)) throw new Error("skill discovery episodes require immutable, safe, attributable behavior and context fingerprints");
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_EPISODE:${episode.episodeId}`, artifactType: "EPISODE", subjectId: episode.behavioralFingerprint, payload: episode, createdAt: episode.observedAt });
    return episode;
  }
  async propose(input: Readonly<{ candidate: DiscoveredSkillCandidate; episodes: readonly SkillDiscoveryEpisode[]; budget: SkillDiscoveryBudget; workspaceId?: string; correlationId?: string }>) {
    const { candidate, episodes, budget } = input;
    if (candidate.lifecycle !== "CANDIDATE" || candidate.competencyStatus !== "UNTESTED" || candidate.certificationStatus !== "NOT_CERTIFIED" || candidate.registryWriteAuthorized || candidate.executionPermissionGranted || candidate.durableKnowledgeEffect !== "NONE") throw new Error("skill discovery may create only untested, uncertified, non-registry candidates");
    if (!candidate.name.trim() || !candidate.description.trim() || !candidate.purpose.trim() || !candidate.expectedCapability.trim() || !candidate.boundaries.length || !candidate.nonExamples.length || !candidate.failureConditions.length || !candidate.evaluationRequirements.length || candidate.definitionVersion < 1 || candidate.discoveryConfidence < 0 || candidate.discoveryConfidence > 1 || !validTime(candidate.expiresAt)) throw new Error("candidate skill definitions require bounded versioned definitions, non-examples, and evaluation requirements");
    const selected = episodes.filter((episode) => candidate.observedEpisodeIds.includes(episode.episodeId)); const uniqueEpisodes = new Map(selected.map((episode) => [episode.episodeId, episode])); const contexts = new Set([...uniqueEpisodes.values()].map((episode) => episode.contextFingerprint)); const successes = [...uniqueEpisodes.values()].filter((episode) => episode.outcome === "SUCCESS" && episode.independent).length;
    if (uniqueEpisodes.size < 3 || contexts.size < 2 || successes < 2) throw new Error("skill discovery requires at least three episodes, two contexts, and two independent successful observations");
    const windowStart = Date.parse(candidate.createdAt) - budget.windowHours * 3_600_000;
    const recent = (await this.artifacts.listWorkspaceArtifacts()).filter((artifact) => artifact.artifactType === "CANDIDATE" && Date.parse(artifact.createdAt) >= windowStart).length;
    if (recent >= budget.maximumCandidates) throw new Error("skill discovery candidate budget exhausted");
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_CANDIDATE:${candidate.candidateSkillId}:v${candidate.definitionVersion}`, artifactType: "CANDIDATE", subjectId: candidate.candidateSkillId, payload: candidate, createdAt: candidate.createdAt });
    if (this.audit && input.workspaceId) await this.audit.append({ eventId: `audit:skill-discovery:${candidate.candidateSkillId}:v${candidate.definitionVersion}`, eventType: "SKILL_CANDIDATE_DISCOVERED", workspaceId: input.workspaceId, occurredAt: candidate.createdAt, actor: candidate.createdBy, correlationId: input.correlationId ?? candidate.candidateSkillId, schemaVersion: "10.0", references: {}, payload: { candidateSkillId: candidate.candidateSkillId, episodeIds: candidate.observedEpisodeIds, relatedSkillIds: candidate.relatedSkillIds, comparison: candidate.comparison, competencyStatus: "UNTESTED", certificationStatus: "NOT_CERTIFIED", registryWriteAuthorized: false, executionPermissionGranted: false } });
    return candidate;
  }
  async expire(input: Readonly<{ candidate: DiscoveredSkillCandidate; now: string }>) {
    if (!validTime(input.now) || Date.parse(input.now) < Date.parse(input.candidate.expiresAt) || terminal.has(input.candidate.lifecycle)) throw new Error("only an active candidate after its expiration may expire");
    const event = { candidateSkillId: input.candidate.candidateSkillId, previousLifecycle: input.candidate.lifecycle, lifecycle: "EXPIRED" as const, occurredAt: input.now, certificationStatus: "NOT_CERTIFIED" as const, registryWriteAuthorized: false as const };
    await this.artifacts.append({ artifactId: `SKILL_DISCOVERY_EXPIRATION:${input.candidate.candidateSkillId}:v${input.candidate.definitionVersion}`, artifactType: "LIFECYCLE", subjectId: input.candidate.candidateSkillId, payload: event, createdAt: input.now });
    return event;
  }
}
