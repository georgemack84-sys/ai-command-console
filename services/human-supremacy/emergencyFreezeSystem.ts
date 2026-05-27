import type { EmergencyFreeze, HumanSupremacyError } from "@/types/human-supremacy";
import { createHumanSupremacyError } from "./authorityBoundaryValidator";
import { hashInterventionValue } from "./interventionHasher";

export function buildEmergencyFreeze(input: {
  coordinationId: string;
  initiatedBy: string;
  reason: string;
  freezeScope: EmergencyFreeze["freezeScope"];
  activatedAt: string;
}): Readonly<{
  freeze?: EmergencyFreeze;
  errors: readonly HumanSupremacyError[];
}> {
  if (!input.initiatedBy.trim()) {
    return Object.freeze({
      freeze: undefined,
      errors: Object.freeze([
        createHumanSupremacyError(
          "HUMAN_SUPREMACY_AUTONOMOUS_FREEZE_FORBIDDEN",
          "Emergency freeze requires explicit human authorization.",
          "initiatedBy",
        ),
      ]),
    });
  }
  const freeze: EmergencyFreeze = Object.freeze({
    freezeId: hashInterventionValue("emergency-freeze-id", {
      coordinationId: input.coordinationId,
      initiatedBy: input.initiatedBy,
      activatedAt: input.activatedAt,
      freezeScope: input.freezeScope,
    }),
    freezeScope: input.freezeScope,
    initiatedBy: input.initiatedBy,
    reason: input.reason,
    activatedAt: input.activatedAt,
    replaySafe: true as const,
    governanceVisible: true as const,
    immutableAudit: true as const,
  });
  return Object.freeze({ freeze, errors: Object.freeze([]) });
}
