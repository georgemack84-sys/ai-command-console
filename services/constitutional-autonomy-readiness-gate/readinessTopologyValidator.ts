import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import { createReadinessError } from "./readinessErrors";

export function validateReadinessTopology(
  coordinationFramework: BoundedCoordinationFrameworkRecord,
): Readonly<{
  topologyValid: boolean;
  reasons: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const rejectedCodes = new Set([
    "COORDINATION_RECURSION_DETECTED",
    "COORDINATION_HIDDEN_PATH_DETECTED",
    "COORDINATION_TOPOLOGY_INVALID",
    "COORDINATION_DYNAMIC_MUTATION_FORBIDDEN",
  ]);
  const topologyValid = !coordinationFramework.errors.some((error) => rejectedCodes.has(error.code));

  return Object.freeze({
    topologyValid,
    reasons: Object.freeze(
      topologyValid ? ["Coordination topology remains bounded and non-recursive."] : ["Coordination topology is recursive, hidden, or ambiguous."],
    ),
    errors: Object.freeze(
      topologyValid ? [] : [createReadinessError("AUTONOMY_SCOPE_EXCEEDED", "Unsafe coordination topology blocks readiness.", "coordinationFramework")],
    ),
  });
}
