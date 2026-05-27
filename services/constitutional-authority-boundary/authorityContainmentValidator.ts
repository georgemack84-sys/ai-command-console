import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function validateAuthorityContainment(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const gate = input.controlledAutonomyReadinessGateResult;
  const containmentVerified = gate.domainCertifications.some((item) => item.domain === "containment" && item.classification === "VERIFIED");
  const normalized = normalizeAuthorityMetadata(input.metadata);
  const errors: AuthorityBoundaryError[] = [];
  if (!containmentVerified) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_CONTAINMENT_FAILURE",
      message: "Authority containment requires verified upstream containment certification.",
      path: "controlledAutonomyReadinessGateResult.domainCertifications",
    }));
  }
  if (normalized.includes("containmentdegradation") || normalized.includes("hiddenorchestration")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_CONTAINMENT_FAILURE",
      message: "Containment degradation or hidden orchestration markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
