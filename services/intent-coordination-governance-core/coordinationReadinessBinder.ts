import type { CoordinationGovernanceError } from "@/types/intent-coordination-governance-core";
import type { ConstitutionalAutonomyReadinessGateRecord } from "./constitutionalAutonomyReadinessGateAdapter";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export function bindCoordinationReadiness(
  readinessGate: ConstitutionalAutonomyReadinessGateRecord,
): Readonly<{
  readinessValid: boolean;
  reasons: readonly string[];
  errors: readonly CoordinationGovernanceError[];
}> {
  const readinessValid =
    readinessGate.derivedOnly
    && readinessGate.certification.derivedOnly
    && readinessGate.replayBinding.valid;

  return Object.freeze({
    readinessValid,
    reasons: Object.freeze(
      readinessValid
        ? ["Upstream constitutional readiness certification is valid and replay-safe."]
        : ["Upstream readiness certification is missing or invalid for coordination governance."],
    ),
    errors: Object.freeze(
      readinessValid ? [] : [createCoordinationGovernanceError("READINESS_BINDING_MISSING", "Intent coordination requires valid readiness certification.", "readinessGate")],
    ),
  });
}
