import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ safety: vi.fn(), begin: vi.fn(), outcome: vi.fn(), findRun: vi.fn(), findEvidence: vi.fn() }));
vi.mock("@/src/server/services/workflow-dispatch-safety-service", () => ({ getWorkflowDispatchSafety: mocks.safety }));
vi.mock("@/src/server/services/workflow-execution-state-service", () => ({ beginWorkflowStepAttempt: mocks.begin, recordWorkflowStepOutcome: mocks.outcome }));
vi.mock("@/src/server/db/prisma", () => ({ prisma: { workflowRun: { findFirst: mocks.findRun }, workflowStepRun: { findFirst: mocks.findEvidence } } }));

import { dispatchWorkflowSandboxStep } from "@/src/server/services/workflow-sandbox-dispatch-service";

const request = { workflowRunId: "run-1", stepKey: "retrieve_evidence" as const, credential: "credential", scope: { operations: ["evidence.retrieve"], resources: ["reference-workflow"] }, input: { query: "ocean", resource: "reference-workflow" }, idempotencyKey: "idempotency-123" };

describe("workflow sandbox dispatch", () => {
  beforeEach(() => { Object.values(mocks).forEach((mock) => mock.mockReset()); vi.unstubAllGlobals(); });
  it("fails closed before authorization when the verified target lacks owner approval", async () => {
    mocks.safety.mockResolvedValue({ dispatchEnabled: false, reason: "A workspace owner must approve the verified local sandbox before dispatch can be enabled." });
    await expect(dispatchWorkflowSandboxStep("workspace-1", request)).rejects.toMatchObject({ code: "sandbox_dispatch_blocked", status: 409 });
    expect(mocks.begin).not.toHaveBeenCalled();
  });
  it("records a retryable receipt when the local sandbox times out", async () => {
    mocks.safety.mockResolvedValue({ dispatchEnabled: true, sandboxUrl: "http://localhost/api/sandbox/" });
    mocks.begin.mockResolvedValue({ stepRunId: "step-1", attempt: 1, status: "RUNNING", created: true });
    mocks.findRun.mockResolvedValue({ correlationId: "corr-1" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    mocks.outcome.mockResolvedValue({ status: "RETRY_WAIT", retryEligible: true });
    const result = await dispatchWorkflowSandboxStep("workspace-1", request);
    expect(result).toMatchObject({ dispatched: true, replayed: false, outcome: { status: "RETRY_WAIT" } });
    expect(mocks.outcome).toHaveBeenCalledWith("workspace-1", "run-1", "retrieve_evidence", "step-1", expect.objectContaining({ outcome: "RETRYABLE_FAILURE", failureCode: "sandbox_dispatch_error" }));
  });
  it("does not dispatch again for an idempotent replay", async () => {
    mocks.safety.mockResolvedValue({ dispatchEnabled: true, sandboxUrl: "http://localhost/api/sandbox/" });
    mocks.begin.mockResolvedValue({ stepRunId: "step-1", attempt: 1, status: "COMPLETED", created: false });
    await expect(dispatchWorkflowSandboxStep("workspace-1", request)).resolves.toMatchObject({ dispatched: false, replayed: true });
  });
});
