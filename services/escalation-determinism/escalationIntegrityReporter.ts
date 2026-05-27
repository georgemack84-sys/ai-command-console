import type {
  EscalationDeterminismError,
  EscalationIntegrityReport,
  OversightState,
} from "./escalationStateTypes";
import { hashEscalationValue } from "./escalationHashingEngine";

export function buildEscalationIntegrityReport(input: {
  escalationId: string;
  oversightState: OversightState;
  errors: readonly EscalationDeterminismError[];
  deterministic: boolean;
}): EscalationIntegrityReport {
  const reasons = Object.freeze(input.errors.map((item) => item.code));
  return Object.freeze({
    reportId: hashEscalationValue("escalation-determinism-report-id", input.escalationId),
    escalationId: input.escalationId,
    oversightState: input.oversightState,
    failClosed: input.oversightState !== "stable",
    deterministic: input.deterministic,
    reasons,
    reportHash: hashEscalationValue("escalation-determinism-report", {
      escalationId: input.escalationId,
      oversightState: input.oversightState,
      deterministic: input.deterministic,
      reasons,
    }),
  });
}
