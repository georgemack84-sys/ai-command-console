import { describe, expect, it } from "vitest";
import { ConservativeAuthorityResolver, evaluateAuthorityConfidenceEvidence, InMemoryAuthorityLedger, LedgerBackedAuthorityPromotionService, requireSeparateActionAuthorization } from "../../../services/learning-constitution";
import type { AuthorityPromotionRequest, AuthorityRecord, InformationClassificationResult, KnowledgeScopeResolutionResult } from "../../../types/learning-constitution";

const provenance = { observationId: "observation-1", sourceId: "run:1", sourceType: "AGENT_OUTPUT" as const, originatingActorId: "agent:noesis", observedAt: "2026-08-23T00:00:00.000Z" };
const classification = (confidence: number): InformationClassificationResult => ({ classification: "FACT", confidence, status: "CLASSIFIED", proposedDurability: "DURABLE_CANDIDATE", requiresValidation: true, provenance, reasoningMetadata: { rationaleCode: "test", matchedSignals: [], classifierId: "test", classifierVersion: "1" }, relationshipHints: { supersedesKnowledgeIds: [], exceptionToKnowledgeIds: [] }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
const scopeResolution: KnowledgeScopeResolutionResult = { scope: { type: "PROJECT", id: "axiom" }, confidence: 1, status: "RESOLVED", source: "EXPLICIT", provenance, reasoningMetadata: { rationaleCode: "test", matchedScopeIds: ["axiom"], resolverId: "test", resolverVersion: "1" }, requiresClarification: false, promotionRequested: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" };
const agentRecord = (authorityType: AuthorityRecord["authorityType"]): AuthorityRecord => ({ authorityId: "authority-agent", authorityType, authoritySource: "run:1", sourceIdentity: "agent:noesis", scope: { type: "PROJECT", id: "axiom" }, establishedAt: "2026-08-23T00:00:00.000Z", effectiveFrom: "2026-08-23T00:00:00.000Z", supersedes: [], constraints: [], provenance });

describe("Phase 6 adversarial authority qualification", () => {
  it("does not promote an agent inference through extreme confidence", () => {
    const result = new ConservativeAuthorityResolver().resolve({ classification: classification(0.999999), scopeResolution, source: { sourceClass: "AGENT", sourceIdentity: "agent:noesis", sourceReference: "run:1", agentKnowledgeKind: "INFERRED" } });
    expect(result).toMatchObject({ authorityType: "AGENT_INFERRED", authorityEffect: "UNCHANGED" });
    expect(result.authorityType).not.toBe("HUMAN_DECISION");
  });

  it("does not convert repeated evidence into human authority", () => {
    const evidence = Array.from({ length: 100 }, (_, index) => ({ evidenceId: `evidence-${index}`, type: "AGENT_OUTPUT" as const, sourceReference: `run:${index}`, observedAt: "2026-08-23T00:00:00.000Z", provenance, supportsCandidate: true }));
    const profile = evaluateAuthorityConfidenceEvidence({ authority: { state: "RECORDED", record: agentRecord("AGENT_INFERRED") }, confidence: { score: 0.999999, basis: ["repetition"] }, evidence: { items: evidence } });
    expect(profile.profile.authority).toMatchObject({ state: "RECORDED", record: { authorityType: "AGENT_INFERRED" } });
    expect(profile.profile.evidence.items).toHaveLength(100);
  });

  it("rejects agent-derived knowledge attempting to become a human decision", async () => {
    const request: AuthorityPromotionRequest = { eventId: "promotion-adversarial", record: agentRecord("AGENT_DERIVED"), newAuthority: "HUMAN_DECISION", authorizedBy: "agent:noesis", reason: "repeated observations", timestamp: "2026-08-23T00:00:00.000Z", evidenceIds: ["evidence-1"] };
    const ledger = new InMemoryAuthorityLedger();
    await expect(new LedgerBackedAuthorityPromotionService(ledger).promote(request)).resolves.toMatchObject({ status: "REJECTED", reasonCode: "HUMAN_AUTHORITY_REQUIRES_HUMAN_ESTABLISHMENT" });
    expect(await ledger.findAll()).toMatchObject([{ eventType: "PROMOTION_REJECTED" }]);
  });

  it("preserves the learning-to-action firewall under every authority condition", () => {
    expect(requireSeparateActionAuthorization()).toMatchObject({ allowed: false, executionPermissionGranted: false });
  });
});
