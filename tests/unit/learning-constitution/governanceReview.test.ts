import { describe, expect, it } from "vitest";

import {
  GovernanceReviewService,
  InMemoryGovernanceReviewProposalRepository,
  InMemoryKnowledgeAuditLedger,
} from "@/services/learning-constitution";
import type { GovernanceReviewerAuthorizer, KnowledgeQualityMetricsReport } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "metrics-report", sourceType: "SYSTEM_CONFIGURATION" as const,
  originatingActorId: "system", observedAt: "2026-09-01T00:00:00.000Z",
};
const report: KnowledgeQualityMetricsReport = {
  reportId: "quality:PROJECT:project-alpha", generatedAt: "2026-09-01T00:00:00.000Z",
  request: { scope: { type: "PROJECT", id: "project-alpha" } },
  metrics: {
    totalKnowledgeRecords: 1, activeKnowledgeRecords: 1, supersededKnowledgeRecords: 0, archivedKnowledgeRecords: 0, quarantinedKnowledgeRecords: 0,
    admittedEvents: 1, supersessionEvents: 0, exceptionEvents: 0, archivedEvents: 0, quarantinedEvents: 0, revalidatedEvents: 0, reviewFailedEvents: 0,
    queuedReviewWorkItems: 1, completedReviewWorkItems: 0, overdueQueuedReviewWorkItems: 1, recordsMissingProvenance: 0, recordsMissingVersion: 0,
  }, sourceCounts: { knowledgeRecords: 1, auditEvents: 1, reviewWorkItems: 1 },
  alerts: [{ code: "OVERDUE_REVIEW_BACKLOG_EXCEEDED", message: "backlog", recommendation: "review" }], status: "COMPLETE",
  persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
};
const authorizer: GovernanceReviewerAuthorizer = {
  isAuthorized: async (reviewerId) => reviewerId === "governor-001",
};
const request = (overrides: Partial<{ rationale: string; evidenceIds: readonly string[]; expectedImpact: string; proposalId: string }> = {}) => ({
  proposalId: "proposal-001", report, rationale: "Overdue backlog needs policy review.", evidenceIds: ["report:quality:PROJECT:project-alpha"],
  affectedPolicyIds: ["policy-review-interval"], expectedImpact: "Clarify review coverage.", provenance,
  policyVersion: "1.0.0", constitutionVersion: "1.0.0", ...overrides,
});

describe("governance review proposals", () => {
  it("creates an evidence-backed proposal and records authorized review decisions without policy mutation", async () => {
    const repository = new InMemoryGovernanceReviewProposalRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    const service = new GovernanceReviewService({ repository, authorizer, auditLedger: ledger, now: () => "2026-09-02T00:00:00.000Z" });
    const proposed = await service.propose(request());
    const begun = await service.decide({ proposalId: "proposal-001", reviewerId: "governor-001", action: "BEGIN_REVIEW" });
    const approved = await service.decide({ proposalId: "proposal-001", reviewerId: "governor-001", action: "APPROVE" });

    expect(proposed).toMatchObject({ status: "PROPOSED", persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", proposal: { state: "PROPOSED" } });
    expect(begun).toMatchObject({ status: "DECIDED", proposal: { state: "UNDER_REVIEW" } });
    expect(approved).toMatchObject({ status: "DECIDED", proposal: { state: "APPROVED_FOR_POLICY_CHANGE" }, authorityEffect: "UNCHANGED" });
    expect(await ledger.findByKnowledgeId("governance:PROJECT:project-alpha")).toHaveLength(3);
  });

  it("is idempotent by proposal ID and rejects incomplete/conflicting proposals", async () => {
    const service = new GovernanceReviewService({ repository: new InMemoryGovernanceReviewProposalRepository(), authorizer, auditLedger: new InMemoryKnowledgeAuditLedger() });
    const first = await service.propose(request());
    const replay = await service.propose(request());
    const missingEvidence = await service.propose(request({ proposalId: "proposal-002", evidenceIds: [] }));
    const conflict = await service.propose(request({ proposalId: "proposal-001", rationale: "Different" }));
    expect(replay).toMatchObject({ reasonCode: "IDEMPOTENT_REPLAY", created: false, proposal: { proposalId: first.proposal?.proposalId } });
    expect(missingEvidence).toMatchObject({ status: "REJECTED", reasonCode: "EVIDENCE_MISSING" });
    expect(conflict).toMatchObject({ status: "REJECTED", reasonCode: "PROPOSAL_ID_CONFLICT" });
  });

  it("requires a separately authorized reviewer and valid state progression", async () => {
    const service = new GovernanceReviewService({ repository: new InMemoryGovernanceReviewProposalRepository(), authorizer, auditLedger: new InMemoryKnowledgeAuditLedger() });
    await service.propose(request());
    const unauthorized = await service.decide({ proposalId: "proposal-001", reviewerId: "operator-001", action: "APPROVE" });
    const invalid = await service.decide({ proposalId: "proposal-001", reviewerId: "governor-001", action: "APPROVE" });
    expect(unauthorized).toMatchObject({ status: "REJECTED", reasonCode: "UNAUTHORIZED_REVIEWER" });
    expect(invalid).toMatchObject({ status: "REJECTED", reasonCode: "INVALID_STATE_TRANSITION" });
  });
});
