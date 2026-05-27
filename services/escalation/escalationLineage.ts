import type { EscalationCoordinationInput, EscalationCoordinationState } from "./contracts/escalationTypes";

function slug(value: string | undefined) {
  return String(value || "unknown").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function deriveEscalationLineage({
  input,
  existingEscalations = [],
}: {
  input: EscalationCoordinationInput;
  existingEscalations?: EscalationCoordinationState[];
}) {
  const parent = existingEscalations.find((entry) =>
    entry.escalationType === input.requestedType
    && entry.escalationSource === input.source
    && !["RESOLVED", "VERIFIED"].includes(entry.escalationState),
  ) || null;
  const parentEscalationId = parent?.escalationId;
  const escalationLineageId = parent?.escalationLineageId
    || `lineage_${slug(input.executionId)}_${slug(input.source)}_${slug(input.requestedType)}`;

  const loopDetected = Boolean(parent && parent.parentEscalationId && parent.parentEscalationId === parent.escalationId);

  return {
    escalationLineageId,
    parentEscalationId,
    loopDetected,
  };
}
