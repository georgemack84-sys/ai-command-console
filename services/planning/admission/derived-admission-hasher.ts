import { hashStableContent } from "../versioning";
import type { AdmissionContext, AdmissionDecision } from "./admission-types";

export function deriveAdmissionHash(input: {
  context: AdmissionContext;
  decision: AdmissionDecision;
  reasons: readonly string[];
  blocks: readonly string[];
  warnings: readonly string[];
}): string {
  return hashStableContent("GOVERNANCE", {
    phase: "4.2L",
    context: input.context,
    decision: input.decision,
    reasons: input.reasons,
    blocks: input.blocks,
    warnings: input.warnings,
  });
}
