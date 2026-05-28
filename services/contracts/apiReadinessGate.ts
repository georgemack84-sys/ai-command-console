import { recordContractTelemetry } from "./contractTelemetry";
import { recordGovernanceAudit } from "./governanceAudit";
import { certifyApiContract } from "./apiCertification";

export function evaluateApiReadinessGate(
  input: Parameters<typeof certifyApiContract>[0],
  scope?: { tenantId?: string; workspaceId?: string },
) {
  const result = certifyApiContract(input);
  if (!result.passed) {
    recordContractTelemetry("readiness_gate_failed", scope);
    recordGovernanceAudit({
      type: "api.readiness.failed",
      code: "API_SCHEMA_INVALID",
      tenantId: scope?.tenantId,
      workspaceId: scope?.workspaceId,
    });
  }
  return result;
}
