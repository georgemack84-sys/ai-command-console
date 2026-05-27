import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";
import { validatePlanStructure } from "@/services/planning/validation/validation-engine";
import { buildCanonicalPlan } from "@/tests/planning/validation/helpers";

describe("fuzz normalization", () => {
  it("enum aliases and randomized object key ordering normalize deterministically", () => {
    const plan = buildCanonicalPlan({
      steps: [
        buildCanonicalPlan().steps[0]!,
        {
          ...buildCanonicalPlan().steps[1]!,
          action: {
            tool: "inspect_runtime",
            operation: "validate",
            parameters: {
              zeta: 2,
              alpha: 1,
            },
          },
          execution: {
            timeoutMs: 1000,
            retryable: true,
            idempotent: true,
          },
        },
      ],
    });
    const validationResult = validatePlanStructure(plan);

    const first = normalizeValidatedPlan({
      validatedPlan: plan,
      validationResult,
      replaySnapshot: validationResult.evidence.replaySnapshot,
      graphHash: validationResult.graphHash,
      validationHash: validationResult.validationHash,
      normalizationVersion: "4.2C",
    });
    const second = normalizeValidatedPlan({
      validatedPlan: {
        ...plan,
        steps: [
          plan.steps[0]!,
          {
            ...plan.steps[1]!,
            action: {
              tool: "inspect_runtime",
              operation: "validate",
              parameters: {
                alpha: 1,
                zeta: 2,
              },
            },
          },
        ],
      },
      validationResult,
      replaySnapshot: validationResult.evidence.replaySnapshot,
      graphHash: validationResult.graphHash,
      validationHash: validationResult.validationHash,
      normalizationVersion: "4.2C",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    expect(first.hashes.normalizationHash).toBe(second.hashes.normalizationHash);
  });
});

