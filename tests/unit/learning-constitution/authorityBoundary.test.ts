import { describe, expect, it } from "vitest";
import { requireSeparateActionAuthorization, ScopeBoundAuthorityBoundaryEvaluator } from "../../../services/learning-constitution";
import type { AuthorityRecord } from "../../../types/learning-constitution";

const authority = (scope: AuthorityRecord["scope"]): AuthorityRecord => ({ authorityId: "authority-1", authorityType: "HUMAN_DECISION", authoritySource: "message:1", sourceIdentity: "user:georg", scope, establishedAt: "2026-08-23T00:00:00.000Z", effectiveFrom: "2026-08-23T00:00:00.000Z", supersedes: [], constraints: [], provenance: { observationId: "observation-1", sourceId: "message:1", sourceType: "CONVERSATION", originatingActorId: "user:georg", observedAt: "2026-08-23T00:00:00.000Z" } });

describe("Phase 6 authority boundaries", () => {
  const evaluator = new ScopeBoundAuthorityBoundaryEvaluator();

  it("applies authority only to its exact scope, an explicit descendant, or global", () => {
    expect(evaluator.evaluate({ authority: authority({ type: "PROJECT", id: "axiom" }), subjectScope: { type: "PROJECT", id: "axiom" } })).toMatchObject({ outcome: "APPLIES", reasonCode: "EXACT_SCOPE_MATCH" });
    expect(evaluator.evaluate({ authority: authority({ type: "USER", id: "georg" }), subjectScope: { type: "PROJECT", id: "axiom", parentScope: { type: "USER", id: "georg" } } })).toMatchObject({ outcome: "APPLIES", reasonCode: "EXPLICIT_DESCENDANT_SCOPE" });
    expect(evaluator.evaluate({ authority: authority({ type: "GLOBAL" }), subjectScope: { type: "PROJECT", id: "axiom" } })).toMatchObject({ outcome: "APPLIES", reasonCode: "GLOBAL_SCOPE" });
  });

  it("fails closed for identity mismatch and hierarchy the record cannot prove", () => {
    expect(evaluator.evaluate({ authority: authority({ type: "PROJECT", id: "axiom" }), subjectScope: { type: "PROJECT", id: "other" } })).toMatchObject({ outcome: "OUT_OF_SCOPE" });
    expect(evaluator.evaluate({ authority: authority({ type: "WORKSPACE", id: "workspace-1" }), subjectScope: { type: "AGENT", id: "noesis" } })).toMatchObject({ outcome: "REQUIRE_REVIEW", reasonCode: "SCOPE_HIERARCHY_UNRESOLVED" });
  });

  it("never converts learning authority into action permission", () => {
    expect(requireSeparateActionAuthorization()).toEqual({ allowed: false, reasonCode: "SEPARATE_ACTION_AUTHORIZATION_REQUIRED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
  });
});
