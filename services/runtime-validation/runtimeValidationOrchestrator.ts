import type { RuntimeValidationInput, RuntimeValidationResult, RuntimeValidationFailure } from "./runtimeValidationTypes";
import { validateRuntimeBindingCompatibility } from "./validateRuntimeBindingCompatibility";
import { validateRuntimeCertification } from "./validateRuntimeCertification";
import { validateRuntimeDrift } from "./validateRuntimeDrift";
import { validateReplayRuntimeAttestation } from "./validateReplayRuntimeAttestation";
import { buildRuntimeValidationFailureEvent, buildRuntimeValidationLedgerEvent } from "./runtimeValidationLedger";
import { hashRuntimeValidationResult } from "./runtimeValidationHasher";

function deriveTrustState(input: {
  compatibilityValid: boolean;
  certificationTrustState: RuntimeValidationResult["trustState"];
  driftTrustState: RuntimeValidationResult["trustState"];
  attestationTrustState: RuntimeValidationResult["trustState"];
}): RuntimeValidationResult["trustState"] {
  if (!input.compatibilityValid) return "revoked";
  if (input.driftTrustState === "drifted" || input.driftTrustState === "revoked") return input.driftTrustState;
  if (input.attestationTrustState === "quarantined" || input.attestationTrustState === "uncertified") return input.attestationTrustState;
  return input.certificationTrustState;
}

export function validateRuntimeEnvironment(input: RuntimeValidationInput): RuntimeValidationResult {
  const compatibility = validateRuntimeBindingCompatibility(input);
  const certification = validateRuntimeCertification(input);
  const drift = validateRuntimeDrift(input);
  const attestation = validateReplayRuntimeAttestation(input);

  const failures: RuntimeValidationFailure[] = [
    ...compatibility.failures,
    ...certification.failures,
    ...drift.failures,
    ...attestation.failures,
  ];

  const trustState = deriveTrustState({
    compatibilityValid: compatibility.valid,
    certificationTrustState: certification.trustState,
    driftTrustState: drift.trustState,
    attestationTrustState: attestation.trustState,
  });

  const ledger = [
    buildRuntimeValidationLedgerEvent({
      eventType: "runtime.binding.validated",
      toolId: input.binding.toolId,
      toolVersion: input.binding.toolVersion,
      bindingHash: input.binding.bindingHash,
      result: compatibility.valid ? "success" : "failure",
      failureCode: compatibility.failures[0]?.code,
      validationHash: compatibility.compatibilityHash,
    }),
    buildRuntimeValidationLedgerEvent({
      eventType: "runtime.certification.validated",
      toolId: input.binding.toolId,
      toolVersion: input.binding.toolVersion,
      bindingHash: input.binding.bindingHash,
      result: certification.valid ? "success" : "failure",
      failureCode: certification.failures[0]?.code,
      validationHash: certification.certificationHash,
    }),
    buildRuntimeValidationLedgerEvent({
      eventType: "runtime.attestation.validated",
      toolId: input.binding.toolId,
      toolVersion: input.binding.toolVersion,
      bindingHash: input.binding.bindingHash,
      result: attestation.valid ? "success" : "failure",
      failureCode: attestation.failures[0]?.code,
      validationHash: attestation.attestationHash,
    }),
    ...(drift.driftDetected
      ? [buildRuntimeValidationFailureEvent({
          eventType: "runtime.drift.detected",
          toolId: input.binding.toolId,
          toolVersion: input.binding.toolVersion,
          bindingHash: input.binding.bindingHash,
          failureCode: drift.failures[0]?.code ?? "RUNTIME_BINDING_INVALIDATED",
          validationHash: drift.driftHash,
        })]
      : []),
    ...((!compatibility.valid || !certification.valid || drift.driftDetected || !attestation.valid)
      ? [buildRuntimeValidationFailureEvent({
          eventType: "runtime.execution.rejected",
          toolId: input.binding.toolId,
          toolVersion: input.binding.toolVersion,
          bindingHash: input.binding.bindingHash,
          failureCode: failures[0]?.code ?? "RUNTIME_BINDING_INVALIDATED",
        })]
      : []),
    ...((drift.driftDetected || !attestation.valid)
      ? [buildRuntimeValidationFailureEvent({
          eventType: "runtime.binding.invalidated",
          toolId: input.binding.toolId,
          toolVersion: input.binding.toolVersion,
          bindingHash: input.binding.bindingHash,
          failureCode: drift.failures[0]?.code ?? attestation.failures[0]?.code ?? "RUNTIME_BINDING_INVALIDATED",
        })]
      : []),
  ];

  const validationHash = hashRuntimeValidationResult({
    allowed: compatibility.valid && certification.valid && !drift.driftDetected && attestation.valid,
    trustState,
    bindingCompatibility: compatibility,
    certification,
    drift,
    attestation,
    ledger,
  });

  return {
    allowed: compatibility.valid && certification.valid && !drift.driftDetected && attestation.valid,
    trustState,
    bindingCompatibility: compatibility,
    certification,
    drift,
    attestation,
    ledger,
    validationHash,
    failures,
  };
}
