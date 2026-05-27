import { beforeEach, describe, expect, it } from "vitest";

import { buildContractObservabilitySnapshot } from "../../services/observability/contractObservabilityAdapter.ts";
import { resetContractTelemetry, recordContractTelemetry } from "../../services/contracts/contractTelemetry.ts";
import { resetValidationTelemetry, recordValidationTelemetry } from "../../services/contracts/validationTelemetry.ts";
import { resetCompatibilityAlerts, recordCompatibilityAlert } from "../../services/contracts/compatibilityAlerts.ts";
import { resetGovernanceAuditEvents, recordGovernanceAudit } from "../../services/contracts/governanceAudit.ts";

describe("observability contract adapter", () => {
  beforeEach(() => {
    resetContractTelemetry();
    resetValidationTelemetry();
    resetCompatibilityAlerts();
    resetGovernanceAuditEvents();
  });

  it("maps validation telemetry, compatibility alerts, replay failures, and readiness failures into metrics", () => {
    recordValidationTelemetry("validation_failed");
    recordValidationTelemetry("unknown_field_rejected");
    recordContractTelemetry("replay_validation_failed");
    recordCompatibilityAlert("compatibility drift detected");
    recordGovernanceAudit({ type: "api.readiness.failed" });

    const snapshot = buildContractObservabilitySnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
    });

    expect(snapshot.metrics.contractValidationFailures.value).toBe(1);
    expect(snapshot.metrics.contractCompatibilityFailures.value).toBe(1);
    expect(snapshot.metrics.replayValidationFailures.value).toBe(1);
    expect(snapshot.metrics.readinessGateFailures.value).toBe(1);
  });

  it("degrades safely when telemetry snapshots are unavailable", () => {
    const snapshot = buildContractObservabilitySnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
      validationTelemetry: undefined,
      contractTelemetry: undefined,
      compatibilityAlerts: undefined,
      governanceEvents: undefined,
    });

    expect(snapshot.metrics.contractValidationFailures.status).toBe("UNKNOWN");
    expect(snapshot.metrics.replayValidationFailures.status).toBe("UNKNOWN");
  });
});
