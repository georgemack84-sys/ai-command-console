import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateReplay(context: ValidationContext) {
  const manifest = context.treaty.manifest;
  const evidence = context.treaty.evidence;
  const failures = [];

  if (!manifest.replaySnapshotHash || !manifest.replayBindingHash) {
    failures.push(createFailure({
      code: "VALIDATION_REPLAY_INVALID",
      message: "replay binding is incomplete",
      path: !manifest.replaySnapshotHash ? "manifest.replaySnapshotHash" : "manifest.replayBindingHash",
    }));
  }
  if (!evidence.replayLineageHash) {
    failures.push(createFailure({
      code: "VALIDATION_REPLAY_INVALID",
      message: "replay lineage hash missing",
      path: "evidence.replayLineageHash",
    }));
  }
  if (!evidence.productionEvidence.replayValidation.valid) {
    failures.push(createFailure({
      code: "VALIDATION_REPLAY_DIVERGENCE",
      message: "frozen replay validation failed",
      path: "evidence.productionEvidence.replayValidation",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "replay",
      status: failures.length === 0 ? "passed" : failures.some((failure) => failure.code === "VALIDATION_REPLAY_DIVERGENCE") ? "disputed" : "failed",
      failureCode: failures[0]?.code,
      evidence: [
        manifest.replaySnapshotHash,
        manifest.replayBindingHash,
        evidence.replayLineageHash,
      ].filter(Boolean),
    }),
    failures,
  };
}
