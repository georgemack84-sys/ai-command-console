import type { CoordinationFreezeRecord, FreshnessError } from "@/types/freshness";
import { coordinateFreezeEscalation } from "./freezeEscalationCoordinator";
import { validateFreezeContainment } from "./freezeContainmentValidator";

export function freezeUnsafeCoordination(input: {
  proposalId: string;
  drifts: readonly import("@/types/freshness").DriftRecord[];
  replayIntegrity: "verified" | "mismatch" | "quarantined";
  freshnessStatus: "fresh" | "revalidation_required" | "stale" | "expired" | "frozen";
  createdAt: string;
  metadata?: Readonly<Record<string, unknown>>;
}): Readonly<{
  freeze: CoordinationFreezeRecord;
  errors: readonly FreshnessError[];
}> {
  const freeze = coordinateFreezeEscalation(input);
  const errors = validateFreezeContainment({
    freeze,
    metadata: input.metadata,
  });
  return Object.freeze({ freeze, errors });
}
