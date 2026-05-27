import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedReadModel = vi.hoisted(() => ({
  buildRecoveryReadModel: vi.fn(),
}));

const mockedTimeline = vi.hoisted(() => ({
  buildRecoveryTimeline: vi.fn(),
}));

const mockedAuditTrail = vi.hoisted(() => ({
  appendAuditEvent: vi.fn(),
}));

const mockedVerificationController = vi.hoisted(() => ({
  requestVerification: vi.fn(),
}));

const mockedAdvisoryController = vi.hoisted(() => ({
  dismissRecoveryAdvisory: vi.fn(),
  escalateRecoveryAdvisory: vi.fn(),
}));

const mockedVerificationStore = vi.hoisted(() => ({
  recordVerificationStarted: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryReadModel.ts", () => mockedReadModel);
vi.mock("../../services/recovery/recoveryTimelineBuilder.ts", () => mockedTimeline);
vi.mock("../../services/auditTrail.js", () => mockedAuditTrail);
vi.mock("../../services/recoveryVerificationController.js", () => mockedVerificationController);
vi.mock("../../services/recoveryAdvisoryController.js", () => mockedAdvisoryController);
vi.mock("../../services/recoveryVerificationStore.js", () => mockedVerificationStore);
vi.mock("../../services/recoveryCommitter.js", () => ({
  commitRecoveryPlan: () => {
    throw new Error("3.5C must not call D-6 commit");
  },
}));
vi.mock("../../services/recoveryController.js", () => ({
  approveRecovery: () => {
    throw new Error("3.5C must not call D-7 approve");
  },
  commitRecovery: () => {
    throw new Error("3.5C must not call D-7 commit");
  },
}));
vi.mock("../../services/recoveryCandidateScanner.js", () => ({
  scanRecoveryCandidates: () => {
    throw new Error("3.5C must not call D-8 scanner");
  },
}));
vi.mock("../../services/recoveryLearningRunner.js", () => ({
  runRecoveryLearningPass: () => {
    throw new Error("3.5C must not call D-13 runner");
  },
}));

import {
  addOperatorNote,
  buildOperatorView,
  deriveAllowedActions,
  dismissAdvisoryAction,
  escalateAdvisoryAction,
  requestVerificationAction,
} from "../../services/recovery/recoveryOperatorActions.ts";
import { createRecoveryReadModel, createRecoveryTimeline } from "../helpers/recovery-fixtures";

beforeEach(() => {
  vi.clearAllMocks();
  mockedReadModel.buildRecoveryReadModel.mockResolvedValue({ ok: true, data: createRecoveryReadModel() });
  mockedTimeline.buildRecoveryTimeline.mockResolvedValue({ ok: true, data: createRecoveryTimeline() });
  mockedAuditTrail.appendAuditEvent.mockImplementation((event: Record<string, unknown>) => ({
    id: "audit_1",
    timestamp: "2026-05-03T00:00:00.000Z",
    ...event,
  }));
  mockedVerificationController.requestVerification.mockResolvedValue({ ok: true, data: { queued: true } });
  mockedAdvisoryController.dismissRecoveryAdvisory.mockResolvedValue({ ok: true, data: { state: "DISMISSED" } });
  mockedAdvisoryController.escalateRecoveryAdvisory.mockResolvedValue({ ok: true, data: { state: "ESCALATED" } });
  mockedVerificationStore.recordVerificationStarted.mockReturnValue({ id: "verification_1" });
});

describe("recovery operator actions", () => {
  it("allowed actions derived correctly", async () => {
    const view = await buildOperatorView({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(view.ok && view.data.allowedActions).toEqual([
      { action: "ADD_NOTE", allowed: true },
      { action: "REQUEST_VERIFICATION", allowed: true },
      { action: "DISMISS_ADVISORY", allowed: false, reason: "Advisory is not open." },
      { action: "ESCALATE_ADVISORY", allowed: false, reason: "Advisory is not open." },
      { action: "VIEW_EVIDENCE", allowed: true },
    ]);
  });

  it("operator-view includes timelineMatchesReadModel", async () => {
    const view = await buildOperatorView({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(view.ok && view.data.timelineMatchesReadModel).toBe(true);
  });

  it("blocked actions include reason", () => {
    const actions = deriveAllowedActions({
      readModel: createRecoveryReadModel({
        advisory: { status: "dismissed", latestAdvisoryId: "adv_1", requiresOperator: false, advisoryOnly: true },
        verification: { status: "passed" },
      }),
      timeline: createRecoveryTimeline(),
    });
    expect(actions.find((action) => action.action === "REQUEST_VERIFICATION")).toEqual({
      action: "REQUEST_VERIFICATION",
      allowed: false,
      reason: "Verification already passed.",
    });
    expect(actions.find((action) => action.action === "DISMISS_ADVISORY")).toEqual({
      action: "DISMISS_ADVISORY",
      allowed: false,
      reason: "Advisory is not open.",
    });
  });

  it("timeline mismatch blocks all mutating actions", () => {
    const actions = deriveAllowedActions({
      readModel: createRecoveryReadModel(),
      timeline: createRecoveryTimeline({
        meta: {
          totalEvents: 0,
          timeRange: {},
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    expect(actions).toEqual([
      { action: "ADD_NOTE", allowed: true },
      { action: "REQUEST_VERIFICATION", allowed: false, reason: "Timeline does not currently explain read model" },
      { action: "DISMISS_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
      { action: "ESCALATE_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
      { action: "VIEW_EVIDENCE", allowed: true },
    ]);
  });

  it("mismatch allows only ADD_NOTE + VIEW_EVIDENCE", () => {
    const actions = deriveAllowedActions({
      readModel: createRecoveryReadModel(),
      timeline: createRecoveryTimeline({
        meta: {
          totalEvents: 0,
          timeRange: {},
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    expect(actions.filter((action) => action.allowed).map((action) => action.action)).toEqual(["ADD_NOTE", "VIEW_EVIDENCE"]);
  });

  it("mismatch reason is correct", () => {
    const actions = deriveAllowedActions({
      readModel: createRecoveryReadModel(),
      timeline: createRecoveryTimeline({
        meta: {
          totalEvents: 0,
          timeRange: {},
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    expect(actions.find((action) => action.action === "ESCALATE_ADVISORY")?.reason).toBe("Timeline does not currently explain read model");
  });

  it("matching timeline enables actions", () => {
    const actions = deriveAllowedActions({
      readModel: createRecoveryReadModel({
        advisory: { status: "open", latestAdvisoryId: "adv_1", requiresOperator: true, advisoryOnly: true },
      }),
      timeline: createRecoveryTimeline(),
    });
    expect(actions.find((action) => action.action === "DISMISS_ADVISORY")?.allowed).toBe(true);
    expect(actions.find((action) => action.action === "ESCALATE_ADVISORY")?.allowed).toBe(true);
  });

  it("add note records append-only evidence", async () => {
    const result = await addOperatorNote({
      executionId: "exec_1",
      note: "Need review",
      notedBy: "operator_1",
      nowMs: 1700000000000,
    });
    expect(result.ok).toBe(true);
    expect(mockedAuditTrail.appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RECOVERY_OPERATOR_NOTE_ADDED",
      }),
    );
  });

  it("dismiss advisory routes correctly", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: createRecoveryReadModel({
        advisory: { status: "open", latestAdvisoryId: "adv_1", requiresOperator: true, advisoryOnly: true },
      }),
    });
    const result = await dismissAdvisoryAction({
      executionId: "exec_1",
      dismissedBy: "operator_1",
      reason: "resolved",
      nowMs: 1700000000000,
    });
    expect(result.ok).toBe(true);
    expect(mockedAdvisoryController.dismissRecoveryAdvisory).toHaveBeenCalledWith(
      expect.objectContaining({
        advisoryId: "adv_1",
      }),
    );
  });

  it("escalate advisory routes correctly", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: createRecoveryReadModel({
        advisory: { status: "open", latestAdvisoryId: "adv_1", requiresOperator: true, advisoryOnly: true },
      }),
    });
    const result = await escalateAdvisoryAction({
      executionId: "exec_1",
      escalatedBy: "operator_1",
      reason: "needs review",
      nowMs: 1700000000000,
    });
    expect(result.ok).toBe(true);
    expect(mockedAdvisoryController.escalateRecoveryAdvisory).toHaveBeenCalledWith(
      expect.objectContaining({
        advisoryId: "adv_1",
      }),
    );
  });

  it("request verification routes correctly", async () => {
    const result = await requestVerificationAction({
      executionId: "exec_1",
      requestedBy: "operator_1",
      nowMs: 1700000000000,
    });
    expect(result.ok).toBe(true);
    expect(mockedVerificationController.requestVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: "exec_1",
      }),
    );
  });

  it("no mutation occurs", async () => {
    const fakeDb = { run: vi.fn(), exec: vi.fn() };
    const view = await buildOperatorView({ db: fakeDb, executionId: "exec_1", nowMs: 1700000000000 });
    expect(view.ok).toBe(true);
    expect(fakeDb.run).not.toHaveBeenCalled();
    expect(fakeDb.exec).not.toHaveBeenCalled();
  });
});
