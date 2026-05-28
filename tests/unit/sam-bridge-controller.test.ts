import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";

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

import { runSamBridge } from "../../services/sam/samBridgeController.ts";

function createProposal() {
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
  };
}

beforeEach(() => {
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
    blockedEffects: ["real execution blocked in 3.6A"],
  });
  mockedAudit.appendDeduplicatedSamAuditEvent.mockResolvedValue({
    attempted: true,
    appended: true,
    auditId: "audit_1",
  });
});

describe("sam bridge controller", () => {
  it("runs stages in order", async () => {
    await runSamBridge({ proposal: createProposal() as any, approval: { status: "granted", approvedBy: "operator_1" } });

    expect(mockedSchema.validateSamProposal.mock.invocationCallOrder[0]).toBeLessThan(
      mockedPreflight.runSamPreflight.mock.invocationCallOrder[0],
    );
    expect(mockedPreflight.runSamPreflight.mock.invocationCallOrder[0]).toBeLessThan(
      mockedApproval.evaluateSamApproval.mock.invocationCallOrder[0],
    );
    expect(mockedApproval.evaluateSamApproval.mock.invocationCallOrder[0]).toBeLessThan(
      mockedDryRun.generateSamDryRun.mock.invocationCallOrder[0],
    );
  });

  it("blocks before dry-run if preflight fails", async () => {
    mockedPreflight.runSamPreflight.mockResolvedValue({
      allowed: false,
      blocked: true,
      reason: "SAM_EVIDENCE_INVALID",
      checks: {
        readModelAvailable: true,
        operatorActionAllowed: true,
        evidenceValid: false,
        disputedState: false,
      },
      source: {},
    });

    const result = await runSamBridge({ proposal: createProposal() as any });
    expect(result.blocked).toBe(true);
    expect(result.stage).toBe("blocked");
    expect(mockedDryRun.generateSamDryRun).not.toHaveBeenCalled();
  });

  it("blocks before dry-run if approval missing", async () => {
    mockedApproval.evaluateSamApproval.mockReturnValue({
      required: true,
      granted: false,
      denied: false,
      status: "required",
      reason: "SAM_APPROVAL_REQUIRED",
    });

    const result = await runSamBridge({ proposal: createProposal() as any });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_APPROVAL_REQUIRED");
    expect(mockedDryRun.generateSamDryRun).not.toHaveBeenCalled();
  });

  it("returns completed result only after dry-run preview", async () => {
    const result = await runSamBridge({
      proposal: createProposal() as any,
      approval: { status: "granted", approvedBy: "operator_1" },
    });

    expect(result.ok).toBe(true);
    expect(result.stage).toBe("completed");
    expect(result.dryRun.dryRun).toBe(true);
  });

  it("disabled S.A.M. returns SAM_DISABLED", async () => {
    mockedFlags.loadSamFeatureFlags.mockReturnValue({
      enabled: false,
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

    const result = await runSamBridge({ proposal: createProposal() as any });
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("SAM_DISABLED");
  });

  it("SAM_REAL_EXECUTION_ENABLED=true still blocks real execution", async () => {
    mockedFlags.loadSamFeatureFlags.mockReturnValue({
      enabled: true,
      dryRun: true,
      requireApproval: true,
      interceptLegacyExecution: false,
      enableAutoApproval: false,
      realExecutionEnabled: true,
      safeMode: true,
      samIdempotencyEnabled: true,
      samRetrySafetyEnabled: true,
      samAuditDeduplicationEnabled: true,
      samDurableIdempotencyEnabled: false,
    });

    const result = await runSamBridge({
      proposal: createProposal() as any,
      approval: { status: "granted", approvedBy: "operator_1" },
    });

    expect(result.blocked).toBe(true);
    expect(result.dryRun.executed).toBe(false);
    expect(result.dryRun.dryRun).toBe(true);
    expect(result.errors.some((error: any) => error.code === "SAM_REAL_EXECUTION_FORBIDDEN")).toBe(true);
  });
});
