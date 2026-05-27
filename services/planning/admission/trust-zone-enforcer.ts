import { createAdmissionFailure } from "./admission-errors";
import type { AdmissionBuildInput, TrustZone, TrustZoneEnforcement } from "./admission-types";

const TRUST_ZONE_ORDER: TrustZone[] = [
  "SANDBOX",
  "RESTRICTED",
  "STANDARD",
  "ELEVATED",
  "CRITICAL",
  "STRATEGIC",
];

function zoneRank(zone: TrustZone) {
  return TRUST_ZONE_ORDER.indexOf(zone);
}

export function enforceTrustZone(input: AdmissionBuildInput): TrustZoneEnforcement {
  const failures = [];
  const warnings = [];
  const requested = input.requestedTrustZone ?? input.governanceMetadata.currentTrustZone ?? "STANDARD";
  const current = input.governanceMetadata.currentTrustZone ?? "STANDARD";
  const allowed = input.governanceMetadata.allowedTrustZones ?? ["STANDARD"];

  if (!allowed.includes(requested)) {
    failures.push(createAdmissionFailure("PHASE42L_TRUST_ZONE_VIOLATION", `Requested trust zone ${requested} is not authorized by governance metadata.`, "requestedTrustZone"));
  }

  const requiresRevalidation = zoneRank(requested) > zoneRank(current);
  if (requiresRevalidation) {
    warnings.push(`Trust zone change from ${current} to ${requested} requires revalidation.`);
  }

  return {
    allowed: failures.length === 0,
    requiresRevalidation,
    failures,
    warnings,
  };
}
