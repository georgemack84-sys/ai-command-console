import type { NormalizationEvent } from "./normalization-types";

export function applyStepNormalizationDefaults(input: {
  stepIndex: number;
  sourceId: string;
  outputs?: Record<string, unknown>;
  constraints?: unknown[];
}): {
  outputs: Record<string, unknown>;
  constraints: unknown[];
  events: NormalizationEvent[];
} {
  const events: NormalizationEvent[] = [];
  const outputs = input.outputs ?? {};
  const constraints = input.constraints ?? [];

  if (input.outputs === undefined) {
    events.push({
      eventId: `default:${input.sourceId}:outputs`,
      path: `steps.${input.stepIndex}.outputs`,
      action: "DEFAULT_APPLIED",
      before: undefined,
      after: {},
      reason: "Missing outputs normalize to an empty record.",
    });
  }

  if (input.constraints === undefined) {
    events.push({
      eventId: `default:${input.sourceId}:constraints`,
      path: `steps.${input.stepIndex}.constraints`,
      action: "DEFAULT_APPLIED",
      before: undefined,
      after: [],
      reason: "Missing constraints normalize to an empty array.",
    });
  }

  return {
    outputs,
    constraints,
    events,
  };
}

