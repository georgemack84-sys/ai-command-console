import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";
import { primeSamQueueGovernorState, resetSamQueueGovernorState } from "../../services/sam/scaling/samQueueGovernor.ts";

const mockedFlags = vi.hoisted(() => ({
  loadSamFeatureFlags: vi.fn(),
}));

const mockedSchema = vi.hoisted(() => ({
  validateSamProposal: vi.fn(),
}));

const mockedPreflight = vi.hoisted(() => ({
  runSamPreflight: vi.fn(),
}));

const mockedApproval = vi.hoisted(() => ({
  evaluateSamApproval: vi.fn(),
}));

const mockedDryRun = vi.hoisted(() => ({
  generateSamDryRun: vi.fn(),
}));

const mockedAudit = vi.hoisted(() => ({
  appendDeduplicatedSamAuditEvent: vi.fn(),
}));

vi.mock("../../services/sam/samFeatureFlags.ts", () => mockedFlags);
vi.mock("../../services/sam/samProposalSchema.ts", () => mockedSchema);
vi.mock("../../services/sam/samPreflight.ts", () => mockedPreflight);
vi.mock("../../services/sam/samApprovalGate.ts", () => mockedApproval);
vi.mock("../../services/sam/samDryRunExecutor.ts", () => mockedDryRun);
vi.mock("../../services/sam/samAuditDeduplication.ts", () => mockedAudit);

function createProposal(params: Record<string, unknown> = {}) {
  return {
    proposalId: "proposal_perf_1",
    executionId: "demo-perf-1",
    attemptId: "attempt-perf-1",
    actionType: "recover_execution",
    requestedBy: "ai",
    reason: "perf",
    riskLevel: "high",
    confidence: 0.8,
    params,
    createdAt: "2026-05-07T00:00:00.000Z",
  };
}

describe("sam performance governance", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    clearSamIdempotencyStore();
    resetSamQueueGovernorState();
    mockedFlags.loadSamFeatureFlags.mockReturnValue({
      enabled: true,
      dryRun: true,
      requireApproval: true,
      interceptLegacyExecution: false,
      enableAutoApproval: false,
      realExecutionEnabled: false,
      safeMode: true,
      samIdempotencyEnabled: true,
      samRetrySafetyEnabled: true,
      samAuditDeduplicationEnabled: true,
      samDurableIdempotencyEnabled: false,
    });
    mockedSchema.validateSamProposal.mockReturnValue({
      ok: true,
      data: createProposal(),
      errors: [],
    });
    mockedPreflight.runSamPreflight.mockResolvedValue({
      allowed: true,
      blocked: false,
      checks: {
        readModelAvailable: true,
        operatorActionAllowed: true,
        evidenceValid: true,
        timelineConsistent: true,
        lockValid: true,
        disputedState: false,
      },
      source: {},
    });
    mockedApproval.evaluateSamApproval.mockReturnValue({
      required: true,
      granted: false,
      denied: true,
      status: "denied",
      reason: "SAM_APPROVAL_DENIED",
    });
    mockedDryRun.generateSamDryRun.mockResolvedValue({
      dryRun: true,
      executed: false,
      wouldExecute: true,
      actionType: "recover_execution",
      summary: "would run",
      expectedEffects: [],
      blockedEffects: [],
    });
    mockedAudit.appendDeduplicatedSamAuditEvent.mockResolvedValue({
      attempted: true,
      appended: true,
      auditId: "audit_1",
    });
  });

  it("does not bypass denied approval under load", async () => {
    primeSamQueueGovernorState({ queueDepth: 1, concurrentProposals: 1 });
    const { runSamBridge } = await import("../../services/sam/samBridgeController.ts");

    const result = await runSamBridge({
      proposal: createProposal() as any,
      approval: { status: "denied", reason: "no" },
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_APPROVAL_DENIED");
    expect(mockedDryRun.generateSamDryRun).not.toHaveBeenCalled();
  });
});
