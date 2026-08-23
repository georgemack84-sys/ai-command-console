import { describe, expect, it } from "vitest";
import { ConservativeAuthorityResolver } from "../../../services/learning-constitution";
import type { AuthorityResolutionRequest, InformationClassificationResult, KnowledgeScopeResolutionResult } from "../../../types/learning-constitution";

const classification = (value: InformationClassificationResult["classification"]): InformationClassificationResult => ({
  classification: value,
  confidence: 0.99,
  status: "CLASSIFIED",
  proposedDurability: "DURABLE_CANDIDATE",
  requiresValidation: true,
  provenance: { observationId: "observation-1", sourceId: "message-1", sourceType: "CONVERSATION", originatingActorId: "user-1", observedAt: "2026-08-23T00:00:00.000Z" },
  reasoningMetadata: { rationaleCode: "test", matchedSignals: [], classifierId: "test", classifierVersion: "1" },
  relationshipHints: { supersedesKnowledgeIds: [], exceptionToKnowledgeIds: [] },
  persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

const scopeResolution: KnowledgeScopeResolutionResult = {
  scope: { type: "PROJECT", id: "axiom" }, confidence: 1, status: "RESOLVED", source: "EXPLICIT",
  provenance: classification("FACT").provenance, reasoningMetadata: { rationaleCode: "test", matchedScopeIds: ["axiom"], resolverId: "test", resolverVersion: "1" }, requiresClarification: false, promotionRequested: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED",
};

const request = (overrides: Partial<AuthorityResolutionRequest> = {}): AuthorityResolutionRequest => ({
  classification: classification("INSTRUCTION"),
  scopeResolution,
  source: { sourceClass: "HUMAN", sourceIdentity: "user:georg", sourceReference: "message:1" },
  ...overrides,
});

describe("Phase 6 authority resolver", () => {
  const resolver = new ConservativeAuthorityResolver();

  it("uses semantic meaning as well as human source", () => {
    expect(resolver.resolve(request()).authorityType).toBe("HUMAN_DIRECTIVE");
    expect(resolver.resolve(request({ classification: classification("PREFERENCE") })).authorityType).toBe("HUMAN_PREFERENCE");
    expect(resolver.resolve(request({ classification: classification("SUGGESTION") }))).toMatchObject({ status: "REQUIRE_REVIEW", reasonCode: "SEMANTICS_DO_NOT_ESTABLISH_AUTHORITY" });
  });

  it("requires the specific designation or verification required by non-human sources", () => {
    expect(resolver.resolve(request({ classification: classification("FACT"), source: { sourceClass: "EXTERNAL", sourceIdentity: "docs:1", sourceReference: "https://example.test" } }))).toMatchObject({ status: "REQUIRE_REVIEW", reasonCode: "EXTERNAL_VERIFICATION_MISSING" });
    expect(resolver.resolve(request({ classification: classification("FACT"), source: { sourceClass: "EXTERNAL", sourceIdentity: "docs:1", sourceReference: "https://example.test", externallyVerified: true } }))).toMatchObject({ authorityType: "VERIFIED_EXTERNAL_INFORMATION" });
    expect(resolver.resolve(request({ classification: classification("FACT"), source: { sourceClass: "AGENT", sourceIdentity: "agent:1", sourceReference: "run:1", agentKnowledgeKind: "INFERRED" } }))).toMatchObject({ authorityType: "AGENT_INFERRED" });
  });

  it("fails closed before authority selection when classification or scope is unresolved", () => {
    expect(resolver.resolve(request({ classification: { ...classification("INSTRUCTION"), status: "AMBIGUOUS", classification: undefined } }))).toMatchObject({ reasonCode: "CLASSIFICATION_UNRESOLVED" });
    expect(resolver.resolve(request({ scopeResolution: { ...scopeResolution, status: "UNRESOLVED", scope: undefined } }))).toMatchObject({ reasonCode: "SCOPE_UNRESOLVED" });
  });
});
