import { beforeEach, describe, expect, it } from "vitest";

import { buildMetricSnapshot } from "../../services/observability/metricSnapshot.ts";
import { resetApiMetrics, recordApiMetric } from "../../services/contracts/apiMetrics.ts";
import { resetContractTelemetry, recordContractTelemetry } from "../../services/contracts/contractTelemetry.ts";
import { resetValidationTelemetry, recordValidationTelemetry } from "../../services/contracts/validationTelemetry.ts";
import { resetCompatibilityAlerts } from "../../services/contracts/compatibilityAlerts.ts";
import { resetGovernanceAuditEvents } from "../../services/contracts/governanceAudit.ts";
import { resetSamPerformanceMetrics } from "../../services/sam/performance/samPerformanceMetrics.ts";
import { resetSamQueueGovernorState } from "../../services/sam/scaling/samQueueGovernor.ts";
import { resetSamQueueMetrics } from "../../services/sam/performance/samQueueMetrics.ts";
import { resetSamThroughputTracker } from "../../services/sam/performance/samThroughputTracker.ts";

describe("observability metrics", () => {
  beforeEach(() => {
    resetApiMetrics();
    resetContractTelemetry();
    resetValidationTelemetry();
    resetCompatibilityAlerts();
    resetGovernanceAuditEvents();
    resetSamPerformanceMetrics();
    resetSamQueueGovernorState();
    resetSamQueueMetrics();
    resetSamThroughputTracker();
  });

  it("builds a stable metric snapshot with required metrics", async () => {
    recordValidationTelemetry("validation_failed");
    recordValidationTelemetry("unknown_field_rejected");
    recordContractTelemetry("replay_validation_failed");
    recordApiMetric("sam.proposal.validation_failed", 2);

    const snapshot = await buildMetricSnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
    });

    const names = snapshot.metrics.map((metric) => metric.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "failedRecoveries",
        "lockContentionRate",
        "verificationMismatches",
        "systemHealthStatus",
        "contractValidationFailures",
        "contractCompatibilityFailures",
        "replayValidationFailures",
        "readinessGateFailures",
        "degradedContractResponses",
        "apiV1ValidationFailures",
      ]),
    );

    const lockMetric = snapshot.metrics.find((metric) => metric.name === "lockContentionRate");
    expect(lockMetric).toMatchObject({
      status: "UNKNOWN",
      value: null,
    });
    expect(snapshot.unknownSignals).toContain("lockContentionRate");
  });

  it("does not invent lock data when no safe source exists", async () => {
    const snapshot = await buildMetricSnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
    });

    const metric = snapshot.metrics.find((entry) => entry.name === "lockContentionRate");
    expect(metric?.status).toBe("UNKNOWN");
    expect(metric?.value).toBeNull();
  });
});
