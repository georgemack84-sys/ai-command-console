import { describe, expect, it } from "vitest";

import {
  InMemoryGovernanceReviewProposalRepository,
  InMemoryKnowledgeAuditLedger,
  InMemoryOperationalPolicyRepository,
  OperationalPolicyExplanationService,
} from "@/services/learning-constitution";
import type { OperationalPolicyVersion } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "governance", sourceType: "SYSTEM_CONFIGURATION" as const,
  originatingActorId: "governor-001", observedAt: "2026-09-01T00:00:00.000Z",
};
const policy = (version: string, activatedAt: string): OperationalPolicyVersion => ({
  policyId: "review-interval-policy", version, scopeKey: "PROJECT:project-alpha", contentHash: `sha256:${version}`,
  impactAnalysis: "impact", migrationPlan: "migration", rollbackPlan: "rollback", effectiveAt: activatedAt, activatedAt,
  activatedBy: "activator", proposalId: "proposal-001", constitutionVersion: "1.0.0", provenance,
});

describe("operational policy explanation", () => {
  it("explains active policy version history, governance linkage, and ordered activation events", async () => {
    const repository = new InMemoryOperationalPolicyRepository();
    const proposals = new InMemoryGovernanceReviewProposalRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await repository.activate(policy("1.0.0", "2026-09-01T00:00:00.000Z"));
    await repository.activate(policy("2.0.0", "2026-09-02T00:00:00.000Z"));
    await proposals.create({ proposalId: "proposal-001", reportId: "quality-001", scopeKey: "PROJECT:project-alpha", alertCodes: [], rationale: "rationale", evidenceIds: ["report"], affectedPolicyIds: ["review-interval-policy"], expectedImpact: "impact", state: "APPROVED_FOR_POLICY_CHANGE", createdAt: "2026-09-01T00:00:00.000Z", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance });
    await ledger.append({ eventId: "audit-2", eventType: "OPERATIONAL_POLICY_ACTIVATED", policyId: "review-interval-policy", policyVersion: "2.0.0", scopeKey: "PROJECT:project-alpha", proposalId: "proposal-001", occurredAt: "2026-09-02T00:00:00.000Z", constitutionVersion: "1.0.0", provenance });
    await ledger.append({ eventId: "audit-1", eventType: "OPERATIONAL_POLICY_ACTIVATED", policyId: "review-interval-policy", policyVersion: "1.0.0", scopeKey: "PROJECT:project-alpha", proposalId: "proposal-001", occurredAt: "2026-09-01T00:00:00.000Z", constitutionVersion: "1.0.0", provenance });
    const result = await new OperationalPolicyExplanationService({ policyRepository: repository, proposalRepository: proposals, auditLedger: ledger }).explain({ policyId: "review-interval-policy", scopeKey: "PROJECT:project-alpha" });
    expect(result).toMatchObject({ status: "COMPLETE", reasonCode: "POLICY_HISTORY_EXPLAINED", authorityEffect: "UNCHANGED", executionPermissionGranted: false, trace: { activeVersion: { version: "2.0.0" }, governanceProposal: { state: "APPROVED_FOR_POLICY_CHANGE" } } });
    expect(result.trace?.versionHistory.map((version) => version.version)).toEqual(["1.0.0", "2.0.0"]);
    expect(result.trace?.auditEvents.map((event) => event.eventId)).toEqual(["audit-1", "audit-2"]);
  });

  it("reports missing versions and incomplete activation history without mutation", async () => {
    const repository = new InMemoryOperationalPolicyRepository();
    await repository.activate(policy("1.0.0", "2026-09-01T00:00:00.000Z"));
    const service = new OperationalPolicyExplanationService({ policyRepository: repository, proposalRepository: new InMemoryGovernanceReviewProposalRepository(), auditLedger: new InMemoryKnowledgeAuditLedger() });
    const incomplete = await service.explain({ policyId: "review-interval-policy", scopeKey: "PROJECT:project-alpha" });
    const missing = await service.explain({ policyId: "missing-policy", scopeKey: "PROJECT:project-alpha" });
    expect(incomplete).toMatchObject({ status: "INCOMPLETE_HISTORY", reasonCode: "POLICY_ACTIVATION_HISTORY_MISSING" });
    expect(missing).toMatchObject({ status: "NOT_FOUND", reasonCode: "POLICY_NOT_FOUND" });
  });
});
