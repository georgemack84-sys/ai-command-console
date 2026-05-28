import type { StateProjection } from "@/types/step-trace-viewer";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import { hashTraceViewerValue } from "./traceViewHasher";

const ORDER = [
  "schema",
  "dependency",
  "capability",
  "governance",
  "replay",
  "rollback",
  "runtime",
  "isolation",
  "integrity",
] as const;

export function projectStateView(
  validation: ValidationPipelineOutput,
): StateProjection {
  const transitions = [];
  let previousState = "pending";
  let governanceSource: string | undefined;

  for (const validatorName of ORDER) {
    const validator = validation.result.validators[validatorName];
    const nextState = validator.status;
    if (validator.validator === "governance") {
      governanceSource = validator.hash;
    }
    transitions.push({
      previousState,
      nextState,
      transitionReason: validator.failureCode ?? "validator-passed",
      validatorSource: validator.validator,
      governanceSource,
      evidenceHash: validator.hash,
    });
    previousState = nextState;
  }

  return Object.freeze({
    reconstructedStateHash: validation.result.reconstructedStateHash,
    currentStatus: validation.result.status,
    transitions: Object.freeze(transitions),
    projectionHash: hashTraceViewerValue("trace-state-projection", {
      currentStatus: validation.result.status,
      reconstructedStateHash: validation.result.reconstructedStateHash,
      transitions,
    }),
  });
}
