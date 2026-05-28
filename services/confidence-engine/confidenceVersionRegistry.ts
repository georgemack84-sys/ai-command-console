import { SUPPORTED_NORMALIZATION_VERSIONS } from "./contracts/confidenceContracts";
import { resolveConfidenceModelSnapshot } from "./confidenceModelSnapshotRegistry";
import { resolveConfidenceWeightSnapshot } from "./confidenceWeightSnapshotRegistry";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceVersionRecord,
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
} from "./types/confidenceTypes";

export function resolveConfidenceVersions(
  input: DeterministicConfidenceInput,
): {
  versions: ConfidenceVersionRecord;
  errors: readonly DeterministicConfidenceError[];
} {
  const errors: DeterministicConfidenceError[] = [];
  const model = resolveConfidenceModelSnapshot(input.scoringModelVersion);
  const weight = resolveConfidenceWeightSnapshot(input.weightTableVersion);
  errors.push(...model.errors, ...weight.errors);

  if (!SUPPORTED_NORMALIZATION_VERSIONS.includes(input.normalizationVersion as (typeof SUPPORTED_NORMALIZATION_VERSIONS)[number])) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_SCORING_VERSION_UNKNOWN",
      message: "Confidence normalization version is not registered for deterministic replay.",
      path: "normalizationVersion",
    });
  }

  const versions = Object.freeze({
    scoringModelVersion: input.scoringModelVersion,
    normalizationVersion: input.normalizationVersion,
    weightTableVersion: input.weightTableVersion,
    validatorVersionSetId: input.proposalGovernanceBindingResult.validatorVersionSet.validatorVersionSetId,
    versionHash: hashConfidenceValue("confidence-version-record", {
      scoringModelVersion: input.scoringModelVersion,
      normalizationVersion: input.normalizationVersion,
      weightTableVersion: input.weightTableVersion,
      validatorVersionSetId: input.proposalGovernanceBindingResult.validatorVersionSet.validatorVersionSetId,
    }),
  } satisfies ConfidenceVersionRecord);

  return {
    versions,
    errors: Object.freeze(errors),
  };
}
