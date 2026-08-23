import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryOperationalPolicyRepository,
  OperationalPolicyRollbackService,
} from "@/services/learning-constitution";
import type { OperationalPolicyVersion, PolicyRollbackAuthorizer } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "governance", sourceType: "SYSTEM_CONFIGURATION" as const,
  originatingActorId: "governor-001", observedAt: "2026-09-01T00:00:00.000Z",
};
const policy = (version: string, activatedAt: string): OperationalPolicyVersion => ({
  policyId: "review-interval-policy", version, scopeKey: "PROJECT:project-alpha", contentHash: `sha256:${version}`,
  impactAnalysis: "impact", migrationPlan: "migration", rollbackPlan: "rollback", effectiveAt: activatedAt, activatedAt,
  activatedBy: "activator-001", proposalId: `proposal-${version}`, constitutionVersion: "1.0.0", provenance,
});
const authorizer: PolicyRollbackAuthorizer = { isAuthorized: async (id) => id === "rollback-001" };
const request = (overrides: Partial<{ policyId: string; targetVersion: string; rollbackActorId: string; reason: string }> = {}) => ({
  policyId: "review-interval-policy", scopeKey: "PROJECT:project-alpha", targetVersion: "1.0.0", rollbackActorId: "rollback-001", reason: "Observed regression after activation.", ...overrides,
});

const setup = async () => {
  const policyRepository = new InMemoryOperationalPolicyRepository();
  await policyRepository.activate(policy("1.0.0", "2026-09-01T00:00:00.000Z"));
  await policyRepository.activate(policy("2.0.0", "2026-09-02T00:00:00.000Z"));
  const ledger = new InMemoryKnowledgeAuditLedger();
  return { policyRepository, ledger, service: new OperationalPolicyRollbackService({ policyRepository, authorizer, auditLedger: ledger, now: () => "2026-09-03T00:00:00.000Z" }) };
};

describe("operational policy rollback", () => {
  it("reactivates an eligible prior version and preserves version history", async () => {
    const { service, policyRepository, ledger } = await setup();
    const result = await service.rollback(request());
    expect(result).toMatchObject({
      status: "ROLLED_BACK", reasonCode: "OPERATIONAL_POLICY_ROLLED_BACK", persistenceEffect: "UPDATED",
      activePolicyVersion: { version: "1.0.0" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    });
    expect(await policyRepository.getByPolicyVersion("review-interval-policy", "2.0.0", "PROJECT:project-alpha")).toMatchObject({ version: "2.0.0" });
    expect(await policyRepository.getActive("review-interval-policy", "PROJECT:project-alpha")).toMatchObject({ version: "1.0.0" });
    expect(await ledger.findByKnowledgeId("policy:PROJECT:project-alpha")).toHaveLength(1);
  });

  it("is idempotent after the target is active", async () => {
    const { service, ledger } = await setup();
    await service.rollback(request());
    const replay = await service.rollback(request());
    expect(replay).toMatchObject({ status: "ROLLED_BACK", reasonCode: "IDEMPOTENT_REPLAY", created: false });
    expect(await ledger.findByKnowledgeId("policy:PROJECT:project-alpha")).toHaveLength(1);
  });

  it("rejects constitutional, unauthorized, missing, or non-prior targets", async () => {
    const { service } = await setup();
    const constitution = await service.rollback(request({ policyId: "LEARNING_CONSTITUTION" }));
    const unauthorized = await service.rollback(request({ rollbackActorId: "operator-001" }));
    const missing = await service.rollback(request({ targetVersion: "0.9.0" }));
    const nonPrior = await service.rollback(request({ targetVersion: "2.0.0" }));
    expect(constitution).toMatchObject({ status: "REJECTED", reasonCode: "CONSTITUTION_MUTATION_PROHIBITED" });
    expect(unauthorized).toMatchObject({ status: "REJECTED", reasonCode: "UNAUTHORIZED_ROLLBACK_ACTOR" });
    expect(missing).toMatchObject({ status: "REJECTED", reasonCode: "ROLLBACK_TARGET_NOT_FOUND" });
    expect(nonPrior).toMatchObject({ status: "ROLLED_BACK", reasonCode: "IDEMPOTENT_REPLAY" });
  });
});
