import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import { serializeDeterministically } from "./deterministic-serializer";
import { createNormalizationError } from "./normalization-errors";
import type { NormalizePlanFailure, NormalizationHashes, NormalizedPlan } from "./normalization-types";

export function computeNormalizationHashes(input: {
  graphHash: string;
  validationHash: string;
  normalizedPlanWithoutHashes: Omit<NormalizedPlan, "normalizationHash" | "replayHash" | "evidenceRef">;
  replaySnapshot: unknown;
  stepHashes: Record<string, string>;
}): { hashes: NormalizationHashes } | NormalizePlanFailure {
  try {
    const replayHash = hashPayloadDeterministically({
      replaySnapshot: JSON.parse(serializeDeterministically(input.replaySnapshot)),
      graphHash: input.graphHash,
      validationHash: input.validationHash,
    });

    const normalizationHash = hashPayloadDeterministically({
      normalizedPlan: JSON.parse(serializeDeterministically(input.normalizedPlanWithoutHashes)),
      graphHash: input.graphHash,
      validationHash: input.validationHash,
      replayHash,
    });

    return {
      hashes: {
        graphHash: input.graphHash,
        validationHash: input.validationHash,
        normalizationHash,
        replayHash,
        stepHashes: { ...input.stepHashes },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_HASH_FAILED",
        "Failed to compute deterministic normalization hashes.",
        { error: error instanceof Error ? error.message : String(error) },
      ),
    };
  }
}

