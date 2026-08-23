import { describe, expect, it } from "vitest";
import { ScopeAwareAuthorityPrecedenceEvaluator } from "../../../services/learning-constitution";
import type { AuthorityPrecedenceRequest, AuthorityRecord } from "../../../types/learning-constitution";

const authority = (overrides: Partial<AuthorityRecord> = {}): AuthorityRecord => ({
  authorityId: "authority-existing", authorityType: "HUMAN_DECISION", authoritySource: "message:1", sourceIdentity: "user:georg",
  scope: { type: "PROJECT", id: "axiom" }, establishedAt: "2026-08-20T00:00:00.000Z", effectiveFrom: "2026-08-20T00:00:00.000Z",
  supersedes: [], constraints: [], provenance: { observationId: "observation-1", sourceId: "message:1", sourceType: "CONVERSATION", originatingActorId: "user:georg", observedAt: "2026-08-20T00:00:00.000Z" },
  ...overrides,
});

const request = (overrides: Partial<AuthorityPrecedenceRequest> = {}): AuthorityPrecedenceRequest => ({
  existing: authority(),
  incoming: authority({ authorityId: "authority-incoming", authorityType: "HUMAN_CORRECTION", authoritySource: "message:2", establishedAt: "2026-08-23T00:00:00.000Z", effectiveFrom: "2026-08-23T00:00:00.000Z", supersedes: ["authority-existing"] }),
  relationshipIntent: "CORRECT",
  ...overrides,
});

describe("Phase 6 authority precedence", () => {
  const evaluator = new ScopeAwareAuthorityPrecedenceEvaluator();

  it("permits an explicit, later, same-source correction as a candidate relationship", () => {
    expect(evaluator.evaluate(request())).toMatchObject({ outcome: "CORRECT", reasonCode: "EXPLICIT_CORRECTION_CANDIDATE", authorityEffect: "UNCHANGED" });
  });

  it("does not use a universal authority ranking across scopes or without an asserted relationship", () => {
    expect(evaluator.evaluate(request({ incoming: authority({ authorityId: "policy", authorityType: "APPROVED_POLICY", scope: { type: "SYSTEM" }, approvedBy: "board", approvalRecord: "approval-1" }), relationshipIntent: "SUPERSEDE" }))).toMatchObject({ outcome: "COEXIST", reasonCode: "SCOPES_DO_NOT_OVERLAP" });
    expect(evaluator.evaluate(request({ relationshipIntent: "COEXIST" }))).toMatchObject({ outcome: "COEXIST", reasonCode: "NO_REPLACEMENT_CLAIM" });
  });

  it("requires review for unsupported, cross-source, backdated, or revocation claims", () => {
    expect(evaluator.evaluate(request({ incoming: authority({ authorityId: "authority-incoming", supersedes: [] }), relationshipIntent: "SUPERSEDE" }))).toMatchObject({ reasonCode: "SUPERSESSION_REFERENCE_MISSING" });
    expect(evaluator.evaluate(request({ incoming: authority({ authorityId: "authority-incoming", sourceIdentity: "user:other", supersedes: ["authority-existing"] }), relationshipIntent: "SUPERSEDE" }))).toMatchObject({ reasonCode: "SOURCE_IDENTITY_MISMATCH" });
    expect(evaluator.evaluate(request({ relationshipIntent: "REVOKE" }))).toMatchObject({ outcome: "REQUIRE_REVIEW", reasonCode: "EXPLICIT_REVOCATION_REQUIRES_REVIEW" });
  });
});
