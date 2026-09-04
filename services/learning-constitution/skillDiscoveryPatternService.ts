import type { DiscoveredSkillCandidate, SkillDiscoveryComparisonReport, SkillDiscoveryEpisode, SkillDiscoveryPattern } from "../../types/learning-constitution/skillDiscovery";
import type { SkillGraphProjection } from "../../types/learning-constitution/skillDependencyGraph";
import type { SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";

const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const similarity = (left: Set<string>, right: Set<string>) => { const union = new Set([...left, ...right]); return union.size ? [...left].filter((token) => right.has(token)).length / union.size : 0; };
const candidateTerms = (candidate: DiscoveredSkillCandidate) => tokens([candidate.name, candidate.description, candidate.purpose, candidate.expectedCapability, ...candidate.boundaries].join(" "));

/** Clusters events by behavioral fingerprint while retaining failure episodes as first-class contradictory evidence. */
export class SkillDiscoveryPatternDetector {
  detect(episodes: readonly SkillDiscoveryEpisode[]): readonly SkillDiscoveryPattern[] {
    const groups = new Map<string, SkillDiscoveryEpisode[]>();
    for (const episode of episodes) groups.set(episode.behavioralFingerprint, [...(groups.get(episode.behavioralFingerprint) ?? []), episode]);
    return [...groups.entries()].map(([fingerprint, entries]) => { const unique = [...new Map(entries.map((entry) => [entry.episodeId, entry])).values()]; const successes = unique.filter((entry) => entry.outcome === "SUCCESS" && entry.independent); const contexts = [...new Set(unique.map((entry) => entry.contextFingerprint))]; const eligible = unique.length >= 3 && contexts.length >= 2 && successes.length >= 2; return { patternId: `pattern:${fingerprint}`, behavioralFingerprint: fingerprint, episodeIds: unique.map((entry) => entry.episodeId), successfulEpisodeIds: successes.map((entry) => entry.episodeId), failedEpisodeIds: unique.filter((entry) => entry.outcome === "FAILURE").map((entry) => entry.episodeId), contextFingerprints: contexts, independentSuccesses: successes.length, recurrenceEligible: eligible, reason: eligible ? "Recurring independent behavior spans multiple contexts." : "Pattern does not yet meet recurrence and context-diversity requirements." }; });
  }
}

/** Conservative registry/graph comparison. It never mutates registry entries or treats overlap as competency evidence. */
export class SkillDiscoveryComparisonService {
  compare(input: Readonly<{ candidate: DiscoveredSkillCandidate; pattern: SkillDiscoveryPattern; registryEntries: readonly SkillRegistryEntry[]; graph: SkillGraphProjection }>): SkillDiscoveryComparisonReport {
    if (!input.pattern.recurrenceEligible) return { candidateSkillId: input.candidate.candidateSkillId, outcome: "INSUFFICIENT_EVIDENCE", matchedSkillIds: [], compositeSkillIds: [], similarity: 0, rationale: "The behavioral pattern has not met recurrence requirements.", reviewRequired: false, registryEffect: "NONE", executionPermissionGranted: false };
    const terms = candidateTerms(input.candidate); const scores = input.registryEntries.map((entry) => ({ skillId: entry.skill.skillId, score: similarity(terms, tokens(`${entry.skill.name} ${entry.skill.description}`)) })).sort((left, right) => right.score - left.score || left.skillId.localeCompare(right.skillId));
    const highest = scores[0]; const related = input.candidate.relatedSkillIds.filter((id) => input.registryEntries.some((entry) => entry.skill.skillId === id)); const compositeEdges = input.graph.dependencies.filter((edge) => edge.lifecycle === "ACTIVE" && related.includes(edge.prerequisite.skillId) && related.includes(edge.dependent.skillId));
    if (related.length >= 2 && compositeEdges.length > 0) return { candidateSkillId: input.candidate.candidateSkillId, outcome: "COMPOSITION_OF_EXISTING_SKILLS", matchedSkillIds: related, compositeSkillIds: related, similarity: highest?.score ?? 0, rationale: "The candidate aligns with multiple related canonical skills that are connected in the active Skill Graph.", reviewRequired: true, registryEffect: "NONE", executionPermissionGranted: false };
    if (highest?.score >= .8) return { candidateSkillId: input.candidate.candidateSkillId, outcome: "MATCH_EXISTING_SKILL", matchedSkillIds: [highest.skillId], compositeSkillIds: [], similarity: highest.score, rationale: "Candidate definition substantially overlaps an existing canonical skill.", reviewRequired: false, registryEffect: "NONE", executionPermissionGranted: false };
    if (highest?.score >= .5) return { candidateSkillId: input.candidate.candidateSkillId, outcome: "UNCERTAIN_NEEDS_HUMAN_BOUNDARY_REVIEW", matchedSkillIds: [highest.skillId], compositeSkillIds: [], similarity: highest.score, rationale: "Meaningful semantic overlap exists, but deterministic comparison cannot decide specialization versus distinct capability.", reviewRequired: true, registryEffect: "NONE", executionPermissionGranted: false };
    if (highest?.score >= .3) return { candidateSkillId: input.candidate.candidateSkillId, outcome: "SPECIALIZATION_OF_EXISTING_SKILL", matchedSkillIds: [highest.skillId], compositeSkillIds: [], similarity: highest.score, rationale: "Candidate has limited overlap with one existing skill and should be evaluated as a possible specialization.", reviewRequired: true, registryEffect: "NONE", executionPermissionGranted: false };
    return { candidateSkillId: input.candidate.candidateSkillId, outcome: "POSSIBLE_NEW_SKILL", matchedSkillIds: [], compositeSkillIds: [], similarity: highest?.score ?? 0, rationale: "No existing skill has meaningful deterministic overlap; propose a new concept for review.", reviewRequired: true, registryEffect: "NONE", executionPermissionGranted: false };
  }
}
