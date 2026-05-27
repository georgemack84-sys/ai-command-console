import type { EscalationCoordinationState, EscalationType } from "./contracts/escalationTypes";

const CONFLICTING_TYPES: Record<EscalationType, EscalationType[]> = {
  operator: [],
  governance: ["operator"],
  recovery: ["containment", "emergency"],
  infrastructure: ["recovery"],
  constitutional: ["operator"],
  containment: ["recovery", "operator"],
  emergency: ["operator", "recovery", "infrastructure"],
};

export function resolveEscalationConflicts({
  requestedType,
  existingEscalations = [],
}: {
  requestedType: EscalationType;
  existingEscalations?: EscalationCoordinationState[];
}) {
  const unresolved = existingEscalations.filter((entry) => !["RESOLVED", "VERIFIED"].includes(entry.escalationState));
  const conflictingEscalations = unresolved
    .filter((entry) => CONFLICTING_TYPES[requestedType].includes(entry.escalationType))
    .map((entry) => entry.escalationId);
  const duplicateAmplification = unresolved.some((entry) =>
    entry.escalationType === requestedType
    && entry.escalationReason === unresolved[0]?.escalationReason,
  );

  return {
    conflictingEscalations,
    frozen: conflictingEscalations.length > 0 || duplicateAmplification,
    duplicateAmplification,
  };
}
