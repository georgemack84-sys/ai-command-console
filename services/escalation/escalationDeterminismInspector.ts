import type { EscalationError, GovernanceAwareEscalationRecord } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "./escalationHasher";
import { serializeEscalationValue } from "./escalationSerializer";
import { createEscalationError } from "./escalationBoundaryEnforcer";

export function inspectEscalationDeterminism(record: GovernanceAwareEscalationRecord): readonly EscalationError[] {
  const left = serializeEscalationValue(record);
  const right = serializeEscalationValue(record);
  const leftHash = hashEscalationCoordinationValue("escalation-determinism", record);
  const rightHash = hashEscalationCoordinationValue("escalation-determinism", record);

  return Object.freeze(
    left !== right || leftHash !== rightHash
      ? [createEscalationError(
        "ESCALATION_NON_DETERMINISTIC_OUTPUT",
        "Escalation output is non-deterministic.",
        "record",
      )]
      : [],
  );
}
