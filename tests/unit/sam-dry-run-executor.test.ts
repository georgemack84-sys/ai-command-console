import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/executionEngine.js", () => ({
  runExecution: () => {
    throw new Error("S.A.M. dry-run must never call execution engine");
  },
}));

vi.mock("../../services/recoveryController.js", () => ({
  commitRecovery: () => {
    throw new Error("S.A.M. dry-run must never call recovery commit");
  },
}));

import { generateSamDryRun } from "../../services/sam/samDryRunExecutor.ts";

describe("sam dry-run executor", () => {
  it("never calls execution engine", async () => {
    const result = await generateSamDryRun({
      proposal: {
        proposalId: "proposal_1",
        executionId: "demo-exec-1",
        attemptId: "attempt_1",
        actionType: "recover_execution",
        requestedBy: "ai",
        reason: "preview",
        riskLevel: "high",
        confidence: 0.7,
        params: {},
        createdAt: "2026-05-06T00:00:00.000Z",
      },
    });

    expect(result.executed).toBe(false);
    expect(result.dryRun).toBe(true);
  });

  it("returns executed false", async () => {
    const result = await generateSamDryRun({
      proposal: {
        proposalId: "proposal_2",
        executionId: "demo-exec-2",
        attemptId: "attempt_2",
        actionType: "pause_execution",
        requestedBy: "operator",
        reason: "preview",
        riskLevel: "medium",
        confidence: 0.6,
        params: {},
        createdAt: "2026-05-06T00:00:00.000Z",
      },
    });

    expect(result.executed).toBe(false);
  });

  it("returns dryRun true", async () => {
    const result = await generateSamDryRun({
      proposal: {
        proposalId: "proposal_3",
        executionId: "demo-exec-3",
        attemptId: "attempt_3",
        actionType: "export_evidence",
        requestedBy: "operator",
        reason: "preview",
        riskLevel: "low",
        confidence: 0.9,
        params: {},
        createdAt: "2026-05-06T00:00:00.000Z",
      },
    });

    expect(result.dryRun).toBe(true);
  });
});
