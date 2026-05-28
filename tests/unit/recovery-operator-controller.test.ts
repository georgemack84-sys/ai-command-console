import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedActions = vi.hoisted(() => ({
  addOperatorNote: vi.fn(),
  buildOperatorView: vi.fn(),
  dismissAdvisoryAction: vi.fn(),
  escalateAdvisoryAction: vi.fn(),
  requestVerificationAction: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryOperatorActions.ts", () => mockedActions);

import {
  addRecoveryOperatorNote,
  dismissRecoveryOperatorAdvisory,
  escalateRecoveryOperatorAdvisory,
  getRecoveryOperatorReadModel,
  getRecoveryOperatorTimeline,
  getRecoveryOperatorView,
  requestRecoveryOperatorVerification,
} from "../../controllers/recoveryOperatorController.ts";

beforeEach(() => {
  vi.clearAllMocks();
  mockedActions.buildOperatorView.mockResolvedValue({
    ok: true,
    data: {
      executionId: "exec_1",
      readModel: { executionId: "exec_1" },
      timeline: { executionId: "exec_1" },
      timelineMatchesReadModel: true,
      allowedActions: [],
      warnings: [],
    },
  });
  mockedActions.addOperatorNote.mockResolvedValue({ ok: true, data: { noted: true } });
  mockedActions.requestVerificationAction.mockResolvedValue({ ok: true, data: { requested: true } });
  mockedActions.dismissAdvisoryAction.mockResolvedValue({ ok: true, data: { dismissed: true } });
  mockedActions.escalateAdvisoryAction.mockResolvedValue({ ok: true, data: { escalated: true } });
});

describe("recovery operator controller", () => {
  it("read-model endpoint returns 3.5A output", async () => {
    const result = await getRecoveryOperatorReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result).toEqual({
      ok: true,
      data: { executionId: "exec_1" },
    });
  });

  it("timeline endpoint returns 3.5B output", async () => {
    const result = await getRecoveryOperatorTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result).toEqual({
      ok: true,
      data: { executionId: "exec_1" },
    });
  });

  it("operator-view includes timelineMatchesReadModel", async () => {
    const result = await getRecoveryOperatorView({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.timelineMatchesReadModel).toBe(true);
  });

  it("add note delegates correctly", async () => {
    const result = await addRecoveryOperatorNote({
      executionId: "exec_1",
      note: "Need review",
      notedBy: "operator_1",
      nowMs: 1700000000000,
    });
    expect(result.ok).toBe(true);
    expect(mockedActions.addOperatorNote).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: "exec_1",
      }),
    );
  });

  it("request verification delegates correctly", async () => {
    const result = await requestRecoveryOperatorVerification({
      executionId: "exec_1",
      requestedBy: "operator_1",
      nowMs: 1700000000000,
    });
    expect(result.ok).toBe(true);
    expect(mockedActions.requestVerificationAction).toHaveBeenCalled();
  });

  it("dismiss and escalate delegate correctly", async () => {
    await dismissRecoveryOperatorAdvisory({
      executionId: "exec_1",
      dismissedBy: "operator_1",
      reason: "resolved",
      nowMs: 1700000000000,
    });
    await escalateRecoveryOperatorAdvisory({
      executionId: "exec_1",
      escalatedBy: "operator_1",
      reason: "review",
      nowMs: 1700000000000,
    });
    expect(mockedActions.dismissAdvisoryAction).toHaveBeenCalled();
    expect(mockedActions.escalateAdvisoryAction).toHaveBeenCalled();
  });
});
