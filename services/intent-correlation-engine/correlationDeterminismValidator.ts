import type { CorrelationResult, IntentCorrelationError } from "@/types/intent-correlation-engine";
import { serializeCorrelationValue } from "./correlationSerializer";
import { hashCorrelationValue } from "./correlationHasher";
import { createCorrelationError } from "./correlationErrors";

export function validateCorrelationDeterminism(result: CorrelationResult): readonly IntentCorrelationError[] {
  const left = serializeCorrelationValue(result);
  const right = serializeCorrelationValue(result);
  const leftHash = hashCorrelationValue("intent-correlation-determinism", result);
  const rightHash = hashCorrelationValue("intent-correlation-determinism", result);

  return Object.freeze(
    left === right && leftHash === rightHash
      ? []
      : [createCorrelationError("PHASE_4_6B_CORRELATION_NON_DETERMINISTIC_OUTPUT", "Correlation output was not deterministic across repeated serialization.", "result")],
  );
}
