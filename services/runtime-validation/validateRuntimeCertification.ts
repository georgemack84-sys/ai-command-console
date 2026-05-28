import type { RuntimeCertification, RuntimeValidationFailure, RuntimeValidationInput, RuntimeTrustState } from "./runtimeValidationTypes";
import { hashRuntimeCertification } from "./runtimeValidationHasher";

function deriveTrustState(failures: readonly RuntimeValidationFailure[]): RuntimeTrustState {
  if (!failures.length) {
    return "certified";
  }
  if (failures.some((failure) => failure.code === "RUNTIME_BINDING_INVALIDATED")) {
    return "revoked";
  }
  if (failures.some((failure) => failure.code === "RUNTIME_SANDBOX_DRIFT" || failure.code === "RUNTIME_AUTHORITY_DRIFT")) {
    return "drifted";
  }
  if (failures.some((failure) => failure.code === "RUNTIME_ISOLATION_UNVERIFIED")) {
    return "quarantined";
  }
  if (failures.some((failure) => failure.code === "RUNTIME_CERTIFICATION_INVALID" || failure.code === "RUNTIME_UNCERTIFIED")) {
    return "uncertified";
  }
  return "degraded";
}

export function validateRuntimeCertification(input: RuntimeValidationInput): RuntimeCertification {
  const failures: RuntimeValidationFailure[] = [];
  const { certification, manifest } = input.activeRuntime;

  if (!certification.certified) {
    failures.push({
      code: "RUNTIME_UNCERTIFIED",
      message: "active runtime is not certified",
    });
  }
  if (!certification.provenanceValid || !manifest.adapterProvenance || !manifest.policyProvenance) {
    failures.push({
      code: "RUNTIME_PROVENANCE_INVALID",
      message: "adapter or policy provenance is invalid",
    });
  }
  if (!certification.isolationVerified) {
    failures.push({
      code: "RUNTIME_ISOLATION_UNVERIFIED",
      message: "runtime isolation could not be verified",
    });
  }
  if (!certification.auditIntegrity || !certification.replayIntegrity) {
    failures.push({
      code: "RUNTIME_CERTIFICATION_INVALID",
      message: "runtime certification integrity checks failed",
    });
  }
  if (manifest.adapterProvenance !== input.activeRuntime.adapter.adapterId) {
    failures.push({
      code: "ADAPTER_PROVENANCE_INVALID",
      message: "adapter provenance does not match active runtime adapter identity",
    });
  }

  const trustState = deriveTrustState(failures);
  const certificationHash = hashRuntimeCertification({
    valid: failures.length === 0,
    trustState,
    certificationHash: certification.certificationHash,
  });

  return {
    valid: failures.length === 0,
    trustState,
    certificationHash,
    failures,
  };
}
