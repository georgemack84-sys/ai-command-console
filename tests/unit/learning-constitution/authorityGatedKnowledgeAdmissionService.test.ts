import { describe, expect, it, vi } from "vitest";
import { GovernedAuthorityGatedKnowledgeAdmissionService } from "../../../services/learning-constitution";
import type { AuthorityGateRequest, DurableLearningGateRequest, KnowledgeAdmissionRequest } from "../../../types/learning-constitution";

const authority = (decision: "ALLOW" | "REVIEW" | "DENY"): AuthorityGateRequest => ({ resolution: { status: decision === "ALLOW" ? "CANDIDATE_ASSIGNED" : "REQUIRE_REVIEW", reasonCode: "HUMAN_DIRECTIVE_IDENTIFIED", authorityType: decision === "ALLOW" ? "HUMAN_DIRECTIVE" : undefined, source: { sourceClass: "HUMAN", sourceIdentity: "user:georg", sourceReference: "message:1" }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false } });
const promotion = { gateRequest: {} as Omit<DurableLearningGateRequest, "authority">, admission: {} as KnowledgeAdmissionRequest };

describe("Phase 6 authority-gated durable admission", () => {
  it("does not invoke durable admission when the authority gate denies or requires review", async () => {
    const promote = vi.fn();
    const service = new GovernedAuthorityGatedKnowledgeAdmissionService({ authorityGate: { evaluate: () => ({ decision: "DENY", reasonCode: "OUT_OF_SCOPE_AUTHORITY", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) }, promotion: { promote } });
    await expect(service.admit({ authority: authority("DENY"), promotion })).resolves.toMatchObject({ status: "DENIED" });
    expect(promote).not.toHaveBeenCalled();
  });
  it("forwards only gate-allowed admission and preserves the underlying result", async () => {
    const promote = vi.fn().mockResolvedValue({ status: "COMMITTED", persistenceEffect: "CREATED" });
    const service = new GovernedAuthorityGatedKnowledgeAdmissionService({ authorityGate: { evaluate: () => ({ decision: "ALLOW", reasonCode: "AUTHORITY_ACCEPTED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) }, promotion: { promote } });
    await expect(service.admit({ authority: authority("ALLOW"), promotion })).resolves.toMatchObject({ status: "FORWARDED", promotion: { status: "COMMITTED" }, persistenceEffect: "CREATED" });
    expect(promote).toHaveBeenCalledWith({ gateRequest: expect.objectContaining({ authority: expect.objectContaining({ decision: "ALLOW" }) }), admission: promotion.admission });
  });
});
