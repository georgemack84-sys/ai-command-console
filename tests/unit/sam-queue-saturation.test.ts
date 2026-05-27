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

function createProposal() {
  return {
    proposalId: "proposal_queue_1",
    executionId: "demo-queue-1",
    attemptId: "attempt-queue-1",
    actionType: "recover_execution",
    requestedBy: "ai",
    reason: "pressure",
    riskLevel: "high",
    confidence: 0.8,
    params: {},
    createdAt: "2026-05-07T00:00:00.000Z",
  };
}

describe("sam queue saturation", () => {
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
      granted: true,
      denied: false,
      status: "granted",
      approvedBy: "operator_1",
    });
    mockedDryRun.generateSamDryRun.mockResolvedValue({
      dryRun: true,
      executed: false,
      wouldExecute: true,
      actionType: "recover_execution",
      summary: "would run",
      expectedEffects: ["would run"],
      blockedEffects: [],
    });
    mockedAudit.appendDeduplicatedSamAuditEvent.mockResolvedValue({
      attempted: true,
      appended: true,
      auditId: "audit_1",
    });
  });

  it("blocks safely when the queue governor is frozen", async () => {
    primeSamQueueGovernorState({ queueDepth: 999 });
    const { runSamBridge } = await import("../../services/sam/samBridgeController.ts");

    const result = await runSamBridge({
      proposal: createProposal() as any,
      approval: { status: "granted", approvedBy: "operator_1" },
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_QUEUE_PRESSURE_REJECTED");
    expect(mockedDryRun.generateSamDryRun).not.toHaveBeenCalled();
  });
});
