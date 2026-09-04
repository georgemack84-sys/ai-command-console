import { describe, expect, it } from "vitest";

import {
  InMemoryGovernanceReviewProposalRepository,
  InMemoryKnowledgeAuditLedger,
  InMemoryOperationalPolicyRepository,
  OperationalPolicyActivationService,
} from "@/services/learning-constitution";
import type { PolicyActivatorAuthorizer } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "governance", sourceType: "SYSTEM_CONFIGURATION" as const,
  originatingActorId: "governor-001", observedAt: "2026-09-01T00:00:00.000Z",
};
const activator: PolicyActivatorAuthorizer = { isAuthorized: async (id) => id === "activator-001" };
const request = (overrides: Partial<{ proposalId: string; policyId: string; version: string; contentHash: string; activatorId: string }> = {}) => ({
  proposalId: "proposal-001", policyId: "review-interval-policy", version: "2.0.0", scopeKey: "PROJECT:project-alpha",
  contentHash: "sha256:abc", impactAnalysis: "Review cadence changes from 30 to 14 days.", migrationPlan: "Apply to new assessments.",
  rollbackPlan: "Reactivate prior operational version.", effectiveAt: "2026-10-01T00:00:00.000Z", activatorId: "activator-001",
  constitutionVersion: "1.0.0", provenance, ...overrides,
});

const setup = async () => {
  const proposalRepository = new InMemoryGovernanceReviewProposalRepository();
  await proposalRepository.create({
    proposalId: "proposal-001", reportId: "quality-001", scopeKey: "PROJECT:project-alpha", alertCodes: ["OVERDUE_REVIEW_BACKLOG_EXCEEDED"],
    rationale: "Review policy needs adjustment.", evidenceIds: ["report-001"], affectedPolicyIds: ["review-interval-policy"], expectedImpact: "timely reviews",
    state: "APPROVED_FOR_POLICY_CHANGE", createdAt: "2026-09-01T00:00:00.000Z", decidedAt: "2026-09-02T00:00:00.000Z", decidedBy: "governor-001",
    policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance,
  });
  const policyRepository = new InMemoryOperationalPolicyRepository();
  const ledger = new InMemoryKnowledgeAuditLedger();
  return { policyRepository, ledger, service: new OperationalPolicyActivationService({ proposalRepository, policyRepository, authorizer: activator, auditLedger: ledger, now: () => "2026-09-03T00:00:00.000Z" }) };
};

describe("operational policy activation", () => {
  it("activates one immutable operational policy version after proposal approval and separate authorization", async () => {
    const { service, policyRepository, ledger } = await setup();
    const result = await service.activate(request());
    expect(result).toMatchObject({
      status: "ACTIVATED", reasonCode: "OPERATIONAL_POLICY_ACTIVATED", persistenceEffect: "CREATED",
      authorityEffect: "UNCHANGED", executionPermissionGranted: false,
      policyVersion: { policyId: "review-interval-policy", version: "2.0.0", proposalId: "proposal-001" },
    });
    expect(await policyRepository.getActive("review-interval-policy", "PROJECT:project-alpha")).toMatchObject({ version: "2.0.0" });
    expect(await ledger.findByKnowledgeId("policy:PROJECT:project-alpha")).toHaveLength(1);
  });

  it("is idempotent only for the same policy version payload", async () => {
    const { service } = await setup();
    await service.activate(request());
    const replay = await service.activate(request());
    const conflict = await service.activate(request({ contentHash: "sha256:different" }));
    expect(replay).toMatchObject({ status: "ACTIVATED", reasonCode: "IDEMPOTENT_REPLAY", created: false });
    expect(conflict).toMatchObject({ status: "REJECTED", reasonCode: "ACTIVATION_VERSION_CONFLICT" });
  });

  it("prohibits constitutional targets and rejects missing, unapproved, or unauthorized activation", async () => {
    const { service } = await setup();
    const constitution = await service.activate(request({ policyId: "LEARNING_CONSTITUTION" }));
    const unauthorized = await service.activate(request({ activatorId: "operator-001" }));
    const incomplete = await service.activate({ ...request(), rollbackPlan: "" });
    const unrelatedProposal = await service.activate(request({ policyId: "unapproved-policy" }));
    expect(constitution).toMatchObject({ status: "REJECTED", reasonCode: "CONSTITUTION_MUTATION_PROHIBITED" });
    expect(unauthorized).toMatchObject({ status: "REJECTED", reasonCode: "UNAUTHORIZED_ACTIVATOR" });
    expect(incomplete).toMatchObject({ status: "REJECTED", reasonCode: "ACTIVATION_INPUT_MISSING" });
    expect(unrelatedProposal).toMatchObject({ status: "REJECTED", reasonCode: "PROPOSAL_NOT_APPROVED" });
  });
});
