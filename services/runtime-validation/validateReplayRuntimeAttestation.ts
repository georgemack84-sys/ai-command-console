import { enforceReplayBinding } from "@/services/resolution-engine";
import type { RuntimeReplayAttestation, RuntimeValidationFailure, RuntimeValidationInput, RuntimeTrustState } from "./runtimeValidationTypes";
import { hashRuntimeReplayAttestation } from "./runtimeValidationHasher";

function attestationState(failures: readonly RuntimeValidationFailure[]): RuntimeTrustState {
  if (!failures.length) return "certified";
  if (failures.some((failure) => failure.code === "RUNTIME_BINDING_INVALIDATED")) return "revoked";
  if (failures.some((failure) => failure.code === "RUNTIME_UNCERTIFIED")) return "uncertified";
  return "quarantined";
}

export function validateReplayRuntimeAttestation(input: RuntimeValidationInput): RuntimeReplayAttestation {
  const failures: RuntimeValidationFailure[] = [];

  const replayFailures = enforceReplayBinding({
    binding: input.binding,
    runtime: input.activeRuntime.runtime,
    governance: input.activeRuntime.governance,
  });

  for (const failure of replayFailures) {
    if (failure.message.includes("replay containment hash")) {
      failures.push({
        code: "RUNTIME_REPLAY_CONTAINMENT_DRIFT",
        message: failure.message,
      });
    } else if (failure.code === "TOOL_REPLAY_RESOLUTION_MISMATCH") {
      failures.push({
        code: "RUNTIME_ATTESTATION_INVALID",
        message: failure.message,
      });
    } else if (failure.code === "TOOL_SNAPSHOT_INCONSISTENT") {
      failures.push({
        code: "RUNTIME_REPLAY_CONTAINMENT_DRIFT",
        message: failure.message,
      });
    } else {
      failures.push({
        code: "RUNTIME_BINDING_INVALIDATED",
        message: failure.message,
      });
    }
  }

  if (!input.activeRuntime.certification.certified) {
    failures.push({
      code: "RUNTIME_UNCERTIFIED",
      message: "replay attestation requires a certified runtime",
    });
  }

  const trustState = attestationState(failures);
  const attestationHash = hashRuntimeReplayAttestation({
    valid: failures.length === 0,
    trustState,
    attestationHash: input.binding.bindingHash,
  });

  return {
    valid: failures.length === 0,
    trustState,
    failures,
    attestationHash,
  };
}
