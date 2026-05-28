import { enforceGovernanceBoundary } from "./governanceBoundaryEnforcement";
import { buildSovereignExecutionRestrictions } from "./sovereignExecutionRestrictions";
import { buildEmergencyConstitutionalControls } from "./emergencyConstitutionalControls";

export function buildConstitutionalRuntimeAuthority(input: {
  sovereignty: {
    sovereigntyState: string;
    constitutionalSafe: boolean;
    immutableAuditHealthy: boolean;
  };
  validation: {
    validationState: string;
    constitutionalSafe: boolean;
    autonomySafe: boolean;
    containmentRequired: boolean;
    immutableAuditVerified: boolean;
    failures: string[];
  };
  createdAt: number;
}) {
  const boundary = enforceGovernanceBoundary({
    constitutionalSafe: input.sovereignty.constitutionalSafe && input.sovereignty.immutableAuditHealthy,
    validationSafe: input.validation.constitutionalSafe && input.validation.immutableAuditVerified,
    containmentRequired: input.validation.containmentRequired,
    blockedReasons: input.validation.failures,
  });
  const restrictions = buildSovereignExecutionRestrictions({
    sovereigntyState: input.sovereignty.sovereigntyState,
    autonomySafe: input.validation.autonomySafe,
  });
  const emergencyControls = buildEmergencyConstitutionalControls({
    sovereigntyState: input.sovereignty.sovereigntyState,
    containmentRequired: input.validation.containmentRequired,
    escalationRequired: input.validation.validationState === "ESCALATED",
  });

  return {
    authorityId: `constitutional-runtime-authority:${input.createdAt}`,
    executionAllowed: false as const,
    advisoryOnly: true as const,
    boundary,
    restrictions,
    emergencyControls,
    blockedReasons: Array.from(new Set([
      ...boundary.blockedReasons,
      ...restrictions.blockedReasons,
    ])).sort(),
  };
}
