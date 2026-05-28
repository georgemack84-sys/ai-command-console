import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  EscalationCorrectnessRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function scoreEscalationCorrectness(input: ConstitutionalReadinessInput): {
  record: EscalationCorrectnessRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const deterministic =
    input.escalationDeterminismResult.integrityReport.deterministic
    && input.escalationDeterminismResult.record.replaySafe
    && !input.escalationDeterminismResult.errors.some((error) =>
      error.code === "ESCALATION_DETERMINISM_DETERMINISM_VIOLATION"
      || error.code === "ESCALATION_DETERMINISM_REPLAY_MISMATCH");
  const ambiguous =
    input.escalationDeterminismResult.record.oversightState === "disputed"
    || input.escalationDeterminismResult.record.oversightState === "revoked";
  const score = deterministic && !ambiguous ? 1 : deterministic ? 0.5 : 0.15;

  const errors: ConstitutionalReadinessError[] = [];
  if (!deterministic || ambiguous) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_ESCALATION_AMBIGUOUS",
      message: "Escalation semantics became ambiguous or nondeterministic.",
      path: "escalationDeterminismResult.record.oversightState",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      escalationId: input.escalationDeterminismResult.record.escalationId,
      deterministic,
      oversightState: input.escalationDeterminismResult.record.oversightState,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-escalation-correctness", {
        escalationId: input.escalationDeterminismResult.record.escalationId,
        deterministic,
        oversightState: input.escalationDeterminismResult.record.oversightState,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
