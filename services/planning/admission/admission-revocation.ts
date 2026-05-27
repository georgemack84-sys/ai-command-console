import { hashStableContent } from "../versioning";
import { buildAdmissionLineageAnchors } from "./admission-context";
import type { AdmissionBuildInput, AdmissionDecision, AdmissionRevocation } from "./admission-types";

export function buildAdmissionRevocation(input: {
  buildInput: AdmissionBuildInput;
  decision: AdmissionDecision;
  reasons: readonly string[];
}): AdmissionRevocation {
  const lineage = buildAdmissionLineageAnchors(input.buildInput);
  const revoked = input.decision === "DENIED" || input.decision === "QUARANTINED" || input.decision === "REVOKED";

  return {
    decision: revoked ? "REVOKED" : "UNCHANGED",
    reasons: revoked ? input.reasons : [],
    lineage,
    derivedRevocationHash: hashStableContent("GOVERNANCE", {
      phase: "4.2L",
      revoked,
      reasons: revoked ? input.reasons : [],
      lineage,
    }),
  };
}
