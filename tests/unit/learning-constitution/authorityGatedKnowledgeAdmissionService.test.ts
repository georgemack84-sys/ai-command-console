import { describe, expect, it, vi } from "vitest";
import { GovernedAuthorityGatedKnowledgeAdmissionService } from "../../../services/learning-constitution";
import type { AuthorityGateRequest, KnowledgeAdmissionRequest, KnowledgeAdmissionResult } from "../../../types/learning-constitution";

const authority = (decision: "ALLOW" | "REVIEW" | "DENY"): AuthorityGateRequest => ({ resolution: { status: decision === "ALLOW" ? "CANDIDATE_ASSIGNED" : "REQUIRE_REVIEW", reasonCode: "HUMAN_DIRECTIVE_IDENTIFIED", authorityType: decision === "ALLOW" ? "HUMAN_DIRECTIVE" : undefined, source: { sourceClass: "HUMAN", sourceIdentity: "user:georg", sourceReference: "message:1" }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false } });
const knowledge = {} as KnowledgeAdmissionRequest;
const admitted = { status: "ADMITTED", reasonCode: "KNOWLEDGE_ADMITTED", created: true, idempotentReplay: false, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false } as KnowledgeAdmissionResult;

describe("Phase 6 authority-gated durable admission", () => {
  it("does not invoke durable admission when the authority gate denies or requires review", async () => {
    const admit = vi.fn();
    const service = new GovernedAuthorityGatedKnowledgeAdmissionService({ authorityGate: { evaluate: () => ({ decision: "DENY", reasonCode: "OUT_OF_SCOPE_AUTHORITY", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) }, knowledgeAdmission: { admit } });
    await expect(service.admit({ authority: authority("DENY"), knowledge })).resolves.toMatchObject({ status: "DENIED" });
    expect(admit).not.toHaveBeenCalled();
  });
  it("forwards only gate-allowed admission and preserves the underlying result", async () => {
    const admit = vi.fn().mockResolvedValue(admitted);
    const service = new GovernedAuthorityGatedKnowledgeAdmissionService({ authorityGate: { evaluate: () => ({ decision: "ALLOW", reasonCode: "AUTHORITY_ACCEPTED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) }, knowledgeAdmission: { admit } });
    await expect(service.admit({ authority: authority("ALLOW"), knowledge })).resolves.toMatchObject({ status: "FORWARDED", admission: { status: "ADMITTED" }, persistenceEffect: "CREATED" });
    expect(admit).toHaveBeenCalledWith(knowledge);
  });
});
