import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type { CanonicalPlan } from "../contracts/plan-types";
import type { CanonicalPlanStep } from "../contracts/step-types";
import { applyStepNormalizationDefaults } from "./normalize-defaults";
import { normalizeStepEnums } from "./normalize-enums";
import type { NormalizePlanFailure, NormalizationEvent, NormalizedPlanStep } from "./normalization-types";

export function normalizePlanStep(input: {
  plan: CanonicalPlan;
  step: CanonicalPlanStep;
  index: number;
  canonicalId: string;
}): { step: NormalizedPlanStep; events: NormalizationEvent[] } | NormalizePlanFailure {
  const defaults = applyStepNormalizationDefaults({
    stepIndex: input.index,
    sourceId: input.step.stepId,
  });
  const enums = normalizeStepEnums({
    stepIndex: input.index,
    sourceId: input.step.stepId,
    retryable: input.step.execution.retryable,
    approvalRequired: input.step.safety.approvalRequired || input.plan.approvals.required,
  });

  if (enums.error) {
    return {
      ok: false,
      error: enums.error,
    };
  }

  const stepWithoutHash: Omit<NormalizedPlanStep, "hash"> = {
    id: input.canonicalId,
    sourceId: input.step.stepId,
    index: input.index,
    title: input.step.title,
    intent: input.step.action.operation,
    type: input.step.type,
    action: input.step.action,
    inputs: { ...input.step.action.parameters },
    outputs: defaults.outputs,
    dependencies: [...input.step.dependencies],
    constraints: defaults.constraints,
    approvalMode: enums.approvalMode,
    retryMode: enums.retryMode,
    executionMode: enums.executionMode,
    autonomyLevel: enums.autonomyLevel,
    containmentLevel: enums.containmentLevel,
  };

  const hash = hashPayloadDeterministically(stepWithoutHash);
  const step: NormalizedPlanStep = {
    ...stepWithoutHash,
    hash,
  };

  const events: NormalizationEvent[] = [
    ...defaults.events,
    ...enums.events,
    {
      eventId: `dependency:${input.step.stepId}`,
      path: `steps.${input.index}.dependencies`,
      action: "DEPENDENCY_NORMALIZED",
      before: input.step.dependencies,
      after: step.dependencies,
      reason: "Dependencies are preserved from validated structure without semantic change.",
    },
    {
      eventId: `hash:${input.step.stepId}`,
      path: `steps.${input.index}.hash`,
      action: "HASH_COMPUTED",
      before: null,
      after: hash,
      reason: "Stable step hash computed from normalized step payload.",
    },
  ];

  return {
    step,
    events,
  };
}
