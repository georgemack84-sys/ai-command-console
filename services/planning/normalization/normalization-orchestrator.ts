import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import { createNormalizationEvidence } from "./evidence/normalization-evidence";
import { computeNormalizationHashes } from "./normalize-hashes";
import { normalizePlanStepIds } from "./normalize-ids";
import { normalizePlanMetadata } from "./normalize-metadata";
import { normalizePlanRoot } from "./normalize-plan";
import { normalizeReplayMetadata } from "./normalize-replay";
import { preserveValidatedOrdering } from "./normalize-ordering";
import { normalizePlanStep } from "./normalize-step";
import { enforceNormalizationBoundary } from "./normalization-boundary";
import { createNormalizationError } from "./normalization-errors";
import type {
  NormalizePlanInput,
  NormalizePlanResult,
  NormalizationEvent,
} from "./normalization-types";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        deepFreeze(item);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }

  return value as Readonly<T>;
}

function isNormalizeFailure(value: unknown): value is Extract<NormalizePlanResult, { ok: false }> {
  return Boolean(
    value
    && typeof value === "object"
    && "ok" in (value as { ok?: unknown })
    && (value as { ok?: unknown }).ok === false,
  );
}

export function orchestratePlanNormalization(
  input: NormalizePlanInput,
): NormalizePlanResult {
  if (!input.validationResult.ok || !input.validationResult.validated) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_UNVALIDATED_INPUT",
        "Phase 4.2C only accepts plans that passed 4.2B validation.",
      ),
    };
  }

  if (
    input.validationResult.graphHash !== input.graphHash
    || input.validationResult.validationHash !== input.validationHash
  ) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_REPLAY_MISMATCH",
        "Normalization input hashes diverged from 4.2B validation output.",
      ),
    };
  }

  const replay = normalizeReplayMetadata(input);
  if (isNormalizeFailure(replay)) {
    return replay;
  }

  const idNormalization = normalizePlanStepIds(input.validatedPlan);
  if (idNormalization.error) {
    return {
      ok: false,
      error: idNormalization.error,
    };
  }

  const root = normalizePlanRoot(input.validatedPlan);
  const ordering = preserveValidatedOrdering(input.validatedPlan);
  const metadata = normalizePlanMetadata(input.validatedPlan);

  const normalizedSteps = [];
  const stepHashes: Record<string, string> = {};
  const events: NormalizationEvent[] = [
    ...idNormalization.events,
    ...root.events,
    ...ordering.events,
    ...metadata.events,
  ];

  for (const [index, step] of input.validatedPlan.steps.entries()) {
    const normalized = normalizePlanStep({
      plan: input.validatedPlan,
      step,
      index,
      canonicalId: idNormalization.ids[step.stepId]!,
    });

    if (isNormalizeFailure(normalized)) {
      return normalized;
    }

    normalizedSteps.push(normalized.step);
    stepHashes[normalized.step.id] = normalized.step.hash;
    events.push(...normalized.events);
  }

  const normalizedPlanWithoutHashes = {
    schemaVersion: input.validatedPlan.schemaVersion,
    normalizationVersion: input.normalizationVersion,
    planId: input.validatedPlan.planId,
    goal: root.goal,
    validatedGraphHash: input.graphHash,
    validationHash: input.validationHash,
    steps: normalizedSteps,
    metadata: metadata.metadata,
  };

  const hashesResult = computeNormalizationHashes({
    graphHash: input.graphHash,
    validationHash: input.validationHash,
    normalizedPlanWithoutHashes,
    replaySnapshot: replay.replaySnapshot,
    stepHashes,
  });

  if (isNormalizeFailure(hashesResult)) {
    return hashesResult;
  }

  events.push({
    eventId: `hash:${input.validatedPlan.planId}`,
    path: "normalizationHash",
    action: "HASH_COMPUTED",
    before: null,
    after: hashesResult.hashes.normalizationHash,
    reason: "Stable normalization hash computed from normalized plan and replay-safe inputs.",
  });

  const evidenceRef = `evidence:${hashPayloadDeterministically({
    planId: input.validatedPlan.planId,
    normalizationHash: hashesResult.hashes.normalizationHash,
  }).slice(0, 16)}`;

  const normalizedPlan = {
    ...normalizedPlanWithoutHashes,
    normalizationHash: hashesResult.hashes.normalizationHash,
    replayHash: hashesResult.hashes.replayHash,
    evidenceRef,
  };

  const boundary = enforceNormalizationBoundary({
    sourcePlan: input.validatedPlan,
    normalizedPlan,
    graphHash: input.graphHash,
    validationHash: input.validationHash,
    replaySnapshot: replay.replaySnapshot,
  });

  if (!boundary.ok) {
    return boundary;
  }

  const normalizationEvidence = createNormalizationEvidence({
    normalizedPlan,
    normalizationVersion: input.normalizationVersion,
    orderedEvents: events,
    hashes: hashesResult.hashes,
    normalizeInput: input,
  });

  return {
    ok: true,
    normalizedPlan: deepFreeze(normalizedPlan),
    normalizationEvidence: deepFreeze(normalizationEvidence),
    hashes: deepFreeze(hashesResult.hashes),
  };
}
