import { describe, expect, it } from "vitest";
import { evaluateAuthorityConfidenceEvidence } from "../../../services/learning-constitution";
import type { AuthorityConfidenceEvidenceProfile, KnowledgeEvidence } from "../../../types/learning-constitution";

const evidence = (evidenceId: string): KnowledgeEvidence => ({ evidenceId, type: "DOCUMENT", sourceReference: "docs:1", observedAt: "2026-08-23T00:00:00.000Z", provenance: { observationId: "observation-1", sourceId: "docs:1", sourceType: "DOCUMENT", originatingActorId: "author:1", observedAt: "2026-08-23T00:00:00.000Z" }, supportsCandidate: true });
const profile = (overrides: Partial<AuthorityConfidenceEvidenceProfile> = {}): AuthorityConfidenceEvidenceProfile => ({ authority: { state: "UNASSESSED" }, confidence: { score: 0.72, basis: ["classification"] }, evidence: { items: [evidence("evidence-1")] }, ...overrides });

describe("Phase 6 authority × confidence × evidence", () => {
  it("preserves the three axes without promoting one from another", () => {
    const highlyEvidenced = profile({ confidence: { score: 1, basis: ["test"] }, evidence: { items: [evidence("primary-1"), evidence("primary-2")] } });
    const evaluation = evaluateAuthorityConfidenceEvidence(highlyEvidenced);
    expect(evaluation.profile.authority).toEqual({ state: "UNASSESSED" });
    expect(evaluation.profile.confidence.score).toBe(1);
    expect(evaluation.profile.evidence.items).toHaveLength(2);
    expect(evaluation.authorityEffect).toBe("UNCHANGED");
  });

  it("accepts recorded authority with uncertainty without altering either value", () => {
    const recorded = profile({ authority: { state: "RECORDED", record: { authorityId: "authority-1", authorityType: "HUMAN_DIRECTIVE", authoritySource: "message:1", sourceIdentity: "user:georg", scope: { type: "PROJECT", id: "axiom" }, establishedAt: "2026-08-23T00:00:00.000Z", effectiveFrom: "2026-08-23T00:00:00.000Z", supersedes: [], constraints: [], provenance: { observationId: "observation-1", sourceId: "message:1", sourceType: "CONVERSATION", originatingActorId: "user:georg", observedAt: "2026-08-23T00:00:00.000Z" } } }, confidence: { score: 0.2, basis: ["ambiguous wording"] } });
    expect(evaluateAuthorityConfidenceEvidence(recorded).profile).toBe(recorded);
  });

  it("rejects invalid confidence, duplicate evidence, and generic trust substitution", () => {
    expect(() => evaluateAuthorityConfidenceEvidence(profile({ confidence: { score: 1.1, basis: [] } }))).toThrow(/confidence/);
    expect(() => evaluateAuthorityConfidenceEvidence(profile({ evidence: { items: [evidence("same"), evidence("same")] } }))).toThrow(/unique/);
    expect(() => evaluateAuthorityConfidenceEvidence({ ...profile(), trustScore: 0.99 } as AuthorityConfidenceEvidenceProfile)).toThrow(/trust scores/);
  });
});
