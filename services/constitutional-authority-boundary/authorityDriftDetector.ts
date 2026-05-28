import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function detectAuthorityDrift(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const gate = input.controlledAutonomyReadinessGateResult;
  const normalized = normalizeAuthorityMetadata(input.metadata);
  if (gate.risk.riskLevel === "critical" || normalized.includes("authoritydrift") || normalized.includes("ceilingdrift")) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_DRIFT_DETECTED",
      message: "Authority drift or ceiling drift markers were detected.",
      path: gate.risk.riskLevel === "critical" ? "controlledAutonomyReadinessGateResult.risk.riskLevel" : "metadata",
    })]);
  }
  return Object.freeze([]);
}
