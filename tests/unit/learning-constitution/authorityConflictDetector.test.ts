import { describe, expect, it } from "vitest";
import { ConservativeAuthorityConflictDetector } from "../../../services/learning-constitution";
import type { AuthorityConflictRequest, AuthorityRecord, ConflictDetectionResult } from "../../../types/learning-constitution";

const authority = (authorityType: AuthorityRecord["authorityType"], overrides: Partial<AuthorityRecord> = {}): AuthorityRecord => ({ authorityId: `authority-${authorityType}`, authorityType, authoritySource: "message:1", sourceIdentity: "user:georg", scope: { type: "PROJECT", id: "axiom" }, establishedAt: "2026-08-20T00:00:00.000Z", effectiveFrom: "2026-08-20T00:00:00.000Z", supersedes: [], constraints: [], provenance: { observationId: "observation-1", sourceId: "message:1", sourceType: "CONVERSATION", originatingActorId: "user:georg", observedAt: "2026-08-20T00:00:00.000Z" }, ...overrides });
const conflict = (overrides: Partial<ConflictDetectionResult> = {}): ConflictDetectionResult => ({ candidateId: "candidate-1", existingKnowledgeId: "existing-1", relationship: "CONTRADICTS", confidence: 0.95, status: "ASSESSED", scopeCompatibility: { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" }, provenance: { candidate: authority("HUMAN_DECISION").provenance, existingKnowledge: authority("HUMAN_DECISION").provenance }, reasoningMetadata: { rationaleCode: "test", matchedFields: [], detectorId: "test", detectorVersion: "1" }, requiresValidation: true, requiresClarification: false, requiresApproval: true, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", ...overrides });
const request = (overrides: Partial<AuthorityConflictRequest> = {}): AuthorityConflictRequest => ({ existingAuthority: authority("HUMAN_DECISION"), incomingAuthority: authority("HUMAN_CORRECTION", { authorityId: "authority-incoming", supersedes: ["authority-HUMAN_DECISION"] }), knowledgeConflict: conflict({ relationship: "CORRECTS" }), precedence: { outcome: "CORRECT", reasonCode: "EXPLICIT_CORRECTION_CANDIDATE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, ...overrides });

describe("Phase 6 authority conflict detector", () => {
  const detector = new ConservativeAuthorityConflictDetector();
  it("recognizes an explicit authority correction without performing it", () => {
    expect(detector.detect(request())).toMatchObject({ outcome: "SUPERSEDE_EXISTING", reasonCode: "EXPLICIT_AUTHORITY_SUPERSESSION", authorityEffect: "UNCHANGED" });
  });
  it("blocks agent claims and preferences from overriding scoped human or policy authority", () => {
    expect(detector.detect(request({ incomingAuthority: authority("AGENT_INFERRED") }))).toMatchObject({ outcome: "REJECT_INCOMING", reasonCode: "AGENT_CLAIM_CANNOT_OVERRIDE_HUMAN_AUTHORITY" });
    expect(detector.detect(request({ existingAuthority: authority("APPROVED_POLICY", { approvedBy: "board", approvalRecord: "approval-1" }), incomingAuthority: authority("HUMAN_PREFERENCE") }))).toMatchObject({ outcome: "REJECT_INCOMING", reasonCode: "PREFERENCE_CANNOT_OVERRIDE_APPROVED_POLICY" });
  });
  it("routes external/reference disputes and uncertain relationships to validation", () => {
    expect(detector.detect(request({ existingAuthority: authority("APPROVED_REFERENCE", { approvedBy: "board", approvalRecord: "approval-1" }), incomingAuthority: authority("VERIFIED_EXTERNAL_INFORMATION") }))).toMatchObject({ outcome: "REQUIRE_VALIDATION", reasonCode: "VERIFIED_EXTERNAL_INFORMATION_CHALLENGES_APPROVED_REFERENCE" });
    expect(detector.detect(request({ knowledgeConflict: conflict({ relationship: "UNCERTAIN", status: "UNCERTAIN" }) }))).toMatchObject({ outcome: "REQUIRE_VALIDATION", reasonCode: "KNOWLEDGE_RELATIONSHIP_UNCERTAIN" });
  });
});
