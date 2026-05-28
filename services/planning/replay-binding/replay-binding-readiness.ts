import { buildReplayBindingContext, hashReplayBindingContext } from "./replay-binding-context";
import { deriveReplayBindingHash } from "./derived-replay-binding-hasher";
import { buildImmutableReplayBinding } from "./immutable-replay-binder";
import { certifyReplayReadiness } from "./replay-certification-engine";
import { coordinateReplayRevocation } from "./replay-revocation-coordinator";
import { observeRuntimeDrift } from "./runtime-drift-observer";
import { validateTrustZoneReplay } from "./trust-zone-replay-validator";
import { createReplayBindingFailure } from "./replay-binding-errors";
import type { ReplayBindingBuildInput, ReplayBindingReadiness } from "./replay-binding-types";

export function buildReplayBindingReadiness(input: ReplayBindingBuildInput): ReplayBindingReadiness {
  const context = buildReplayBindingContext(input);
  const binding = buildImmutableReplayBinding(input);
  const runtime = observeRuntimeDrift(input);
  const trustZone = validateTrustZoneReplay(input);
  const certification = certifyReplayReadiness({
    buildInput: input,
    binding,
    runtimeValid: runtime.valid,
    trustZoneValid: trustZone.valid,
    preexistingFailures: [
      ...runtime.failures,
      ...trustZone.failures,
    ],
  });
  const revocation = coordinateReplayRevocation({
    buildInput: input,
    failures: certification.failures,
  });

  const replayBindingHash = deriveReplayBindingHash({
    context,
    binding,
    certification: certification.certification,
    revocation,
  });

  const failures = [...certification.failures];
  if (input.expectedReplayBindingHash && input.expectedReplayBindingHash !== replayBindingHash) {
    failures.push(createReplayBindingFailure(
      "REPLAY_BINDING_DRIFT",
      "Derived replay binding hash does not match expected value.",
      "expectedReplayBindingHash",
    ));
  }

  return {
    context,
    contextHash: hashReplayBindingContext(context),
    binding,
    certification: certification.certification,
    ...(revocation ? { revocation } : {}),
    replayBindingHash,
    failures,
  };
}
