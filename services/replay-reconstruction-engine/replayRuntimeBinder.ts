import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ReplayValidatorBinding } from "@/types/replay-reconstruction-engine";

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

export type ReplayRuntimeBinding = Readonly<{
  validatorBindings: readonly ReplayValidatorBinding[];
  runtimeCompatible: boolean;
  orderingHash: string;
}>;

import { hashReplayValue } from "./replayHasher";

export function bindReplayRuntime(
  validation: ValidationPipelineOutput,
): ReplayRuntimeBinding {
  const validatorBindings = ORDER.map((validatorName) => {
    const validator = validation.result.validators[validatorName];
    return Object.freeze({
      validator: validator.validator,
      validatorHash: validator.hash,
      status: validator.status,
      evidence: Object.freeze([...validator.evidence]),
    });
  });

  return Object.freeze({
    validatorBindings: Object.freeze(validatorBindings),
    runtimeCompatible: validation.result.validators.runtime.passed,
    orderingHash: hashReplayValue("replay-validator-ordering", validatorBindings.map((binding) => binding.validator)),
  });
}
