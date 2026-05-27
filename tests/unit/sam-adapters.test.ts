import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedReadModel = vi.hoisted(() => ({
  buildRecoveryReadModel: vi.fn(),
}));

const mockedTimeline = vi.hoisted(() => ({
  buildRecoveryTimeline: vi.fn(),
}));

const mockedOperatorController = vi.hoisted(() => ({
  getRecoveryOperatorView: vi.fn(),
}));

const mockedEvidence = vi.hoisted(() => ({
  buildRecoveryEvidenceBundle: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryReadModel.ts", () => mockedReadModel);
vi.mock("../../services/recovery/recoveryTimelineBuilder.ts", () => mockedTimeline);
vi.mock("../../controllers/recoveryOperatorController.ts", () => mockedOperatorController);
vi.mock("../../services/recovery/recoveryEvidenceBuilder.ts", () => mockedEvidence);

import {
  loadSamEvidenceState,
  loadSamOperatorActionState,
  loadSamReadModelState,
  loadSamTimelineState,
  previewSamExecution,
  previewSamVerification,
} from "../../services/sam/adapters/index.ts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sam adapters", () => {
  it("adapter failures produce blocked-safe read model state", async () => {
    mockedReadModel.buildRecoveryReadModel.mockRejectedValue(new Error("boom"));

    const result = await loadSamReadModelState({ executionId: "demo-exec-1" });
    expect(result.readModelAvailable).toBe(false);
    expect(result.reason).toBe("SAM_ADAPTER_FAILED");
  });

  it("adapters normalize missing operator fields safely", async () => {
    mockedOperatorController.getRecoveryOperatorView.mockResolvedValue({
      ok: true,
      data: {
        executionId: "demo-exec-1",
        readModel: {},
        timeline: {},
      },
    });

    const result = await loadSamOperatorActionState({
      executionId: "demo-exec-1",
      actionType: "recover_execution",
    });

    expect(result.operatorActionAllowed).toBe(false);
    expect(result.allowedActions).toEqual([]);
  });

  it("evidence adapter treats disputed evidence as invalid", async () => {
    mockedEvidence.buildRecoveryEvidenceBundle.mockResolvedValue({
      ok: true,
      data: {
        state: "disputed",
        integrity: { matchesReadModel: false },
        meta: { warnings: ["mismatch"] },
      },
    });

    const result = await loadSamEvidenceState({ executionId: "demo-exec-1" });
    expect(result.evidenceValid).toBe(false);
    expect(result.disputedState).toBe(true);
  });

  it("timeline adapter normalizes mismatch state", async () => {
    mockedTimeline.buildRecoveryTimeline.mockResolvedValue({
      ok: true,
      data: {
        meta: {
          matchesReadModel: false,
          warnings: ["TIMELINE_STATE_MISMATCH"],
        },
      },
    });

    const result = await loadSamTimelineState({ executionId: "demo-exec-1" });
    expect(result.timelineConsistent).toBe(false);
    expect(result.disputedState).toBe(true);
  });

  it("execution adapter is dry-run only", async () => {
    const result = await previewSamExecution({
      proposal: {
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
      },
    });

    expect(result.executed).toBe(false);
    expect(result.dryRun).toBe(true);
  });

  it("verification adapter remains placeholder-only", async () => {
    const result = await previewSamVerification({ executionId: "demo-exec-1" });
    expect(result.executed).toBe(false);
    expect(result.dryRun).toBe(true);
  });
});
