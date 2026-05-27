import { hashFailurePayload } from "@/services/failure-orchestration";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ProductionTrustError,
  type ReplayTrustValidationResult,
} from "./productionTrustTypes";

export function validateProductionReplayTrust(input: {
  registryHash: string;
  replayHash: string;
  replayEligible: boolean;
  attestationValid: boolean;
  currentRegistryHash?: string;
  currentReplayHash?: string;
  currentSchemaHash?: string;
  currentPolicyHash?: string;
  liveRegistryFallbackDetected?: boolean;
}): ReplayTrustValidationResult {
  const errors: ProductionTrustError[] = [];

  if (!input.replayEligible) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH,
      message: "snapshot is not replay eligible",
      path: "snapshot.manifest.replayEligible",
    });
  }
  if (!input.attestationValid) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH,
      message: "runtime replay attestation is invalid",
      path: "runtimeValidation.attestation.valid",
    });
  }
  if (input.currentRegistryHash !== undefined && input.currentRegistryHash !== input.registryHash) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH,
      message: "current registry hash drifted from historical replay trust",
      path: "currentRegistryHash",
      expected: input.registryHash,
      actual: input.currentRegistryHash,
    });
  }
  if (input.currentReplayHash !== undefined && input.currentReplayHash !== input.replayHash) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH,
      message: "current replay hash drifted",
      path: "currentReplayHash",
      expected: input.replayHash,
      actual: input.currentReplayHash,
    });
  }
  if (input.currentSchemaHash !== undefined && input.currentSchemaHash !== input.replayHash) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH,
      message: "schema mutation detected during replay trust validation",
      path: "currentSchemaHash",
    });
  }
  if (input.currentPolicyHash !== undefined && input.currentPolicyHash !== input.replayHash) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH,
      message: "policy mutation detected during replay trust validation",
      path: "currentPolicyHash",
    });
  }
  if (input.liveRegistryFallbackDetected) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH,
      message: "live registry fallback is forbidden during replay validation",
      path: "liveRegistryFallbackDetected",
    });
  }

  return {
    valid: errors.length === 0,
    replayHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      registryHash: input.registryHash,
      replayHash: input.replayHash,
      replayEligible: input.replayEligible,
      attestationValid: input.attestationValid,
    }),
    errors,
  };
}
