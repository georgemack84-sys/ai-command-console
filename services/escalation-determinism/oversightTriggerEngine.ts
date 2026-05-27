import type {
  EscalationSeverity,
  OversightState,
  OversightTriggerRecord,
  UncertaintySignal,
} from "./escalationStateTypes";
import { hashEscalationValue } from "./escalationHashingEngine";

function rankSeverity(severity: EscalationSeverity): number {
  return severity === "critical" ? 4 : severity === "high" ? 3 : severity === "elevated" ? 2 : 1;
}

export function buildOversightTrigger(input: {
  escalationId: string;
  signals: readonly UncertaintySignal[];
}): OversightTriggerRecord {
  const triggered = input.signals.filter((signal) => signal.triggered);
  const hasCritical = triggered.some((signal) => signal.severity === "critical");
  const hasHigh = triggered.some((signal) => signal.severity === "high");
  const oversightState: OversightState = hasCritical
    ? "disputed"
    : hasHigh
      ? "frozen"
      : triggered.length > 0
        ? "elevated"
        : "stable";
  return Object.freeze({
    triggerId: hashEscalationValue("escalation-oversight-trigger-id", input.escalationId),
    oversightState,
    escalationTriggered: triggered.length > 0,
    triggerHash: hashEscalationValue("escalation-oversight-trigger", {
      escalationId: input.escalationId,
      oversightState,
      maxSeverity: Math.max(...input.signals.map((signal) => rankSeverity(signal.severity))),
    }),
  });
}
