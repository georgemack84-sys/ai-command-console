import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";

const mockedFlags = vi.hoisted(() => ({
  loadSamFeatureFlags: vi.fn(),
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
vi.mock("../../services/sam/samPreflight.ts", () => mockedPreflight);
vi.mock("../../services/sam/samApprovalGate.ts", () => mockedApproval);
vi.mock("../../services/sam/samDryRunExecutor.ts", () => mockedDryRun);
vi.mock("../../services/sam/samAuditDeduplication.ts", () => mockedAudit);

function createProposal(overrides: Record<string, unknown> = {}) {
  return {
    proposalId: "proposal_1",
    executionId: "demo-exec-1",
    attemptId: "attempt_1",
    actionType: "recover_execution",
    requestedBy: "ai",
    reason: "preview",
    riskLevel: "high",
    confidence: 0.8,
    params: {},
    createdAt: "2026-05-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("sam bridge idempotency", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    clearSamIdempotencyStore();
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
      source: {
        readModel: "3.5A",
        operatorView: "3.5C",
        evidence: "3.5D",
        timeline: "3.5B",
      },
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
      summary: "would invoke governed recovery",
      expectedEffects: ["would verify gates"],
      blockedEffects: ["real execution blocked in 3.6B"],
    });
    mockedAudit.appendDeduplicatedSamAuditEvent.mockResolvedValue({
      attempted: true,
      appended: true,
      auditId: "audit_1",
    });
  });

  it("duplicate retry does not rerun dry-run executor", async () => {
    const { runSamBridge } = await import("../../services/sam/samBridgeController.ts");

    const first = await runSamBridge({
      proposal: createProposal() as any,
      approval: { status: "granted", approvedBy: "operator_1" },
    });
    const second = await runSamBridge({
      proposal: createProposal({ attemptId: "attempt_2" }) as any,
      approval: { status: "granted", approvedBy: "operator_1" },
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(mockedDryRun.generateSamDryRun).toHaveBeenCalledTimes(1);
  });

  it("approval is still required", async () => {
    mockedApproval.evaluateSamApproval.mockReturnValue({
      required: true,
      granted: false,
      denied: false,
      status: "required",
      reason: "SAM_APPROVAL_REQUIRED",
    });

    const { runSamBridge } = await import("../../services/sam/samBridgeController.ts");
    const result = await runSamBridge({
      proposal: createProposal() as any,
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_APPROVAL_REQUIRED");
  });

  it("denied approval still blocks", async () => {
    mockedApproval.evaluateSamApproval.mockReturnValue({
      required: true,
      granted: false,
      denied: true,
      status: "denied",
      reason: "SAM_APPROVAL_DENIED",
    });

    const { runSamBridge } = await import("../../services/sam/samBridgeController.ts");
    const result = await runSamBridge({
      proposal: createProposal() as any,
      approval: { status: "denied", reason: "no" },
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_APPROVAL_DENIED");
  });

  it("real execution remains forbidden", async () => {
    const { runSamBridge } = await import("../../services/sam/samBridgeController.ts");
    const result = await runSamBridge({
      proposal: createProposal({
        params: {
          realExecution: true,
        },
      }) as any,
      approval: { status: "granted", approvedBy: "operator_1" },
    });

    expect(result.blocked).toBe(true);
    expect(result.errors.some((error) => error.code === "SAM_REAL_EXECUTION_FORBIDDEN")).toBe(true);
  });
});
