import type { ValidationProjection } from "@/types/step-trace-viewer";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import { hashTraceViewerValue } from "./traceViewHasher";

const VALIDATOR_ORDER = [
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

export function projectValidationView(
  validation: ValidationPipelineOutput,
): ValidationProjection {
  const items = VALIDATOR_ORDER.map((validator) => validation.result.validators[validator]).map((item) => ({
    validator: item.validator,
    status: item.status,
    passed: item.passed,
    failureCode: item.failureCode,
    evidence: Object.freeze([...item.evidence]),
    hash: item.hash,
  }));

  return Object.freeze({
    status: validation.result.status,
    deterministic: validation.result.deterministic,
    items: Object.freeze(items),
    projectionHash: hashTraceViewerValue("trace-validation-projection", {
      status: validation.result.status,
      items,
    }),
  });
}
