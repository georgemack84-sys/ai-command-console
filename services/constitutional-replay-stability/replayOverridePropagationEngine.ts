import type {
  ConstitutionalReplayStabilityError,
  ConstitutionalReplayStabilityInput,
  ReplayOverridePropagation,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function reconstructReplayOverridePropagation(input: ConstitutionalReplayStabilityInput): {
  override: ReplayOverridePropagation;
  errors: readonly ConstitutionalReplayStabilityError[];
} {
  const operatorSupremacyPreserved = input.constitutionalAuthorityBoundaryResult.authorityClasses
    .some((item) => item.authorityClass === "A4");
  const normalized = normalizeReplayStabilityMetadata(input.metadata);
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (!operatorSupremacyPreserved || normalized.includes("overridecorruption") || normalized.includes("operatoroverridefailure")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_OVERRIDE_CORRUPTION",
      message: "Override propagation failed or operator override markers were corrupted.",
      path: !operatorSupremacyPreserved ? "authorityClasses" : "metadata",
    }));
  }
  const override: ReplayOverridePropagation = Object.freeze({
    replayId: input.replayId,
    operatorSupremacyPreserved,
    overrideHash: hashReplayStabilityValue("constitutional-replay-stability-override", {
      replayId: input.replayId,
      operatorSupremacyPreserved,
    }),
  });
  return Object.freeze({
    override,
    errors: Object.freeze(errors),
  });
}
