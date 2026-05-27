import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedScanRecoveryCandidates = vi.fn();
const mockedClassifyRecoverySignal = vi.fn();
const mockedRecommendRecoveryAction = vi.fn();
const mockedExplainRecoveryAdvisory = vi.fn();
const mockedRequestRecovery = vi.fn();

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const controllerPath = require.resolve("../../services/recoveryAdvisoryController.js");
const scannerPath = require.resolve("../../services/recoveryCandidateScanner.js");
const classifierPath = require.resolve("../../services/recoverySignalClassifier.js");
const recommendationPath = require.resolve("../../services/recoveryRecommendationEngine.js");
const explainerPath = require.resolve("../../services/recoveryAdvisoryExplainer.js");
const recoveryControllerPath = require.resolve("../../services/recoveryController.js");
const advisoryStorePath = require.resolve("../../services/recoveryAdvisoryStore.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const committerPath = require.resolve("../../services/recoveryCommitter.js");

function loadController() {
  delete require.cache[controllerPath];
  delete require.cache[advisoryStorePath];
  require.cache[scannerPath] = {
    id: scannerPath,
    filename: scannerPath,
    loaded: true,
    exports: { scanRecoveryCandidates: mockedScanRecoveryCandidates },
  } as any;
  require.cache[classifierPath] = {
    id: classifierPath,
    filename: classifierPath,
    loaded: true,
    exports: { classifyRecoverySignal: mockedClassifyRecoverySignal },
  } as any;
  require.cache[recommendationPath] = {
    id: recommendationPath,
    filename: recommendationPath,
    loaded: true,
    exports: { recommendRecoveryAction: mockedRecommendRecoveryAction },
  } as any;
  require.cache[explainerPath] = {
    id: explainerPath,
    filename: explainerPath,
    loaded: true,
    exports: { explainRecoveryAdvisory: mockedExplainRecoveryAdvisory },
  } as any;
  require.cache[recoveryControllerPath] = {
    id: recoveryControllerPath,
    filename: recoveryControllerPath,
    loaded: true,
    exports: { requestRecovery: mockedRequestRecovery },
  } as any;
  require.cache[committerPath] = {
    id: committerPath,
    filename: committerPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: () => {
        throw new Error("D-8 must not call D-6 commit directly");
      },
    },
  } as any;
  require.cache[auditTrailPath] = {
    id: auditTrailPath,
    filename: auditTrailPath,
    loaded: true,
    exports: {
      appendAuditEvent: (event: Record<string, unknown>) => {
        const entry = {
          id: `audit_${events.length + 1}`,
          timestamp: new Date(1700000000000 + events.length).toISOString(),
          ...event,
        };
        events.push(entry);
        return entry;
      },
      listAuditEvents: () => [...events].reverse(),
      clearAuditEvents: () => {
        events.splice(0, events.length);
      },
    },
  } as any;
  return require("../../services/recoveryAdvisoryController.js");
}

beforeEach(() => {
  events.splice(0, events.length);
  mockedScanRecoveryCandidates.mockReset();
  mockedClassifyRecoverySignal.mockReset();
  mockedRecommendRecoveryAction.mockReset();
  mockedExplainRecoveryAdvisory.mockReset();
  mockedRequestRecovery.mockReset();
});

describe("recovery advisory controller", () => {
  it("scans and records advisories without mutating runtime state", async () => {
    const controller = loadController();
    mockedScanRecoveryCandidates.mockReturnValue({
      ok: true,
      data: {
        candidates: [
          {
            executionId: "exec_1",
            planId: "plan_1",
            signalType: "FAILED_EXECUTION",
            detectedAt: "2026-01-01T00:00:00.000Z",
            evidence: {},
          },
        ],
      },
    });
    mockedClassifyRecoverySignal.mockReturnValue({
      ok: true,
      data: {
        signalType: "FAILED_EXECUTION",
        severity: "HIGH",
        confidence: 0.8,
        evidence: {},
        reason: "failed_execution_safe_retry",
      },
    });
    mockedRecommendRecoveryAction.mockReturnValue({
      ok: true,
      data: {
        recommendation: "retry_safe_steps",
        confidence: 0.8,
        requiresOperator: false,
        reason: "failed_execution_safe_retry",
      },
    });
    mockedExplainRecoveryAdvisory.mockReturnValue({
      ok: true,
      data: {
        summary: "advisory only",
        evidenceSummary: "failed",
        recommendedAction: "retry_safe_steps",
        operatorWarning: "Use D-7",
        safetyNotes: [],
      },
    });

    const result = await controller.scanAndRecommendRecoveries({
      requestedBy: "operator_1",
      limit: 5,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          advisories: [
            expect.objectContaining({
              executionId: "exec_1",
              state: "OPEN",
            }),
          ],
        }),
      }),
    );
  });

  it("routes recovery request creation through D-7 only", async () => {
    const controller = loadController();
    mockedScanRecoveryCandidates.mockReturnValue({
      ok: true,
      data: {
        candidates: [
          {
            executionId: "exec_1",
            planId: "plan_1",
            signalType: "FAILED_EXECUTION",
            detectedAt: "2026-01-01T00:00:00.000Z",
            evidence: {},
          },
        ],
      },
    });
    mockedClassifyRecoverySignal.mockReturnValue({
      ok: true,
      data: {
        signalType: "FAILED_EXECUTION",
        severity: "HIGH",
        confidence: 0.8,
        evidence: {},
        reason: "failed_execution_safe_retry",
      },
    });
    mockedRecommendRecoveryAction.mockReturnValue({
      ok: true,
      data: {
        recommendation: "retry_safe_steps",
        confidence: 0.8,
        requiresOperator: false,
        reason: "failed_execution_safe_retry",
      },
    });
    mockedExplainRecoveryAdvisory.mockReturnValue({
      ok: true,
      data: {
        summary: "advisory only",
        evidenceSummary: "failed",
        recommendedAction: "retry_safe_steps",
        operatorWarning: "Use D-7",
        safetyNotes: [],
      },
    });
    mockedRequestRecovery.mockResolvedValue({
      ok: true,
      data: { recoveryRequestId: "recovery_1", status: "REQUESTED" },
    });

    const scanned = await controller.scanAndRecommendRecoveries({
      requestedBy: "operator_1",
      limit: 5,
    });

    const advisoryId = scanned.data.advisories[0].advisoryId;
    const created = await controller.createRecoveryRequestFromAdvisory({
      advisoryId,
      requestedBy: "operator_1",
    });

    expect(created.ok).toBe(true);
    expect(mockedRequestRecovery).toHaveBeenCalledWith({
      executionId: "exec_1",
      recoveryMode: "retry_safe_steps",
      requestedBy: "operator_1",
    });
  });

  it("blocks dismissed advisories from creating recovery requests", async () => {
    const controller = loadController();
    mockedScanRecoveryCandidates.mockReturnValue({
      ok: true,
      data: {
        candidates: [
          {
            executionId: "exec_1",
            planId: "plan_1",
            signalType: "FAILED_EXECUTION",
            detectedAt: "2026-01-01T00:00:00.000Z",
            evidence: {},
          },
        ],
      },
    });
    mockedClassifyRecoverySignal.mockReturnValue({
      ok: true,
      data: {
        signalType: "FAILED_EXECUTION",
        severity: "HIGH",
        confidence: 0.8,
        evidence: {},
        reason: "failed_execution_safe_retry",
      },
    });
    mockedRecommendRecoveryAction.mockReturnValue({
      ok: true,
      data: {
        recommendation: "retry_safe_steps",
        confidence: 0.8,
        requiresOperator: false,
        reason: "failed_execution_safe_retry",
      },
    });
    mockedExplainRecoveryAdvisory.mockReturnValue({
      ok: true,
      data: {
        summary: "advisory only",
        evidenceSummary: "failed",
        recommendedAction: "retry_safe_steps",
        operatorWarning: "Use D-7",
        safetyNotes: [],
      },
    });

    const scanned = await controller.scanAndRecommendRecoveries({
      requestedBy: "operator_1",
      limit: 5,
    });

    const advisoryId = scanned.data.advisories[0].advisoryId;
    const dismissed = await controller.dismissRecoveryAdvisory({
      advisoryId,
      dismissedBy: "operator_2",
      reason: "not_needed",
    });
    expect(dismissed.ok).toBe(true);

    const created = await controller.createRecoveryRequestFromAdvisory({
      advisoryId,
      requestedBy: "operator_1",
    });
    expect(created).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY_ADVISORY",
      }),
    );
  });
});
