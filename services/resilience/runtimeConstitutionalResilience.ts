import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import { buildResilienceAudit } from "./resilienceAudit";
import { assessConstitutionalResilience } from "./resilienceAssessment";
import { buildResilienceLineage } from "./resilienceLineage";
import { buildStabilizationTelemetry } from "./stabilizationTelemetry";

export function evaluateRuntimeConstitutionalResilience(dashboard: RecoveryDashboardReadModel) {
  const { assessment, stabilization } = assessConstitutionalResilience(dashboard);
  const lineage = buildResilienceLineage(dashboard);

  return {
    assessment,
    stabilization,
    lineage,
    auditRecord: buildResilienceAudit({ assessment, lineage }),
    telemetry: buildStabilizationTelemetry({ resilience: assessment, stabilization }),
  };
}
