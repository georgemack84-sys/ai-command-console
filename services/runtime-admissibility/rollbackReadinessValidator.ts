import { verifyCheckpointState } from "@/services/runtime/verification/checkpointVerification";
import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRollbackReadiness(input: RuntimeAdmissibilityInput): readonly RuntimeAdmissibilityError[] {
  const verification = verifyCheckpointState({
    ledgerEvents: [...input.rollbackSnapshot.ledgerEvents],
    checkpointState: input.rollbackSnapshot.checkpointState,
  });
  if (verification.valid) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_ROLLBACK_AMBIGUOUS",
    message: "Rollback checkpoint could not be reconstructed deterministically from historical ledger evidence.",
    path: "rollbackSnapshot.checkpointState",
  })]);
}
