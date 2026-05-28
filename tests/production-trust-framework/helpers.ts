import {
  appendCertificationRevocation,
  appendOperationalTrustEvent,
  createDeploymentAttestation,
  createProductionCertificationRecord,
  evaluateProductionReadiness,
  type ProductionCertificationRecord,
  type ProductionReadinessInput,
} from "@/services/production-trust-framework";
import { buildEnforcementHarnessFixture, certifyAllHarnesses, runAllAttackHarnesses } from "@/tests/enforcement-test-harness/helpers";
import { evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";
import type { RegistrySnapshot } from "@/services/registry-snapshots";
import type { RuntimeValidationFailure, RuntimeValidationResult } from "@/services/runtime-validation";

export function buildProductionTrustFixture(
  overrides: Partial<ProductionReadinessInput> = {},
) {
  const base = buildEnforcementHarnessFixture();
  const harnessResults = runAllAttackHarnesses(base);
  const trustCertification = certifyAllHarnesses(base);
  const failureState = evaluateFailureFixture();

  const certificationInput = {
    snapshot: base.snapshot,
    trustedSnapshotAdmission: base.trustedSnapshotAdmission,
    runtimeValidation: base.runtimeValidation,
    failureState,
    harnessResults,
    trustCertification,
    issuedAt: "2026-05-16T00:00:00.000Z",
    expiresAt: "2026-06-16T00:00:00.000Z",
    certifiedBy: "governance-authority-01",
  } as const;

  const certificationBuild = createProductionCertificationRecord(certificationInput);
  if (!certificationBuild.record) {
    throw new Error(`production certification fixture failed: ${JSON.stringify(certificationBuild.errors)}`);
  }

  const certification = certificationBuild.record;
  const input: ProductionReadinessInput = {
    snapshot: base.snapshot,
    trustedSnapshotAdmission: base.trustedSnapshotAdmission,
    runtimeValidation: base.runtimeValidation,
    failureState,
    harnessResults,
    trustCertification,
    certification,
    currentTime: "2026-05-16T12:00:00.000Z",
    authorityId: "governance-authority-01",
    authorityStatus: "known",
    attestationApprovalChainHash: "sha256:approval-chain",
    environmentId: "production",
    deploymentConstraints: ["no-execution", "read-only-attestation"],
    rollbackRequired: true,
    currentRegistryHash: certification.registryHash,
    currentReplayHash: certification.replayHash,
    currentGovernanceHash: certification.governanceHash,
    currentIntegrityHash: certification.integrityHash,
    ...overrides,
  };

  return {
    input,
    certification,
    harnessResults,
    trustCertification,
  };
}

export function evaluateProductionFixture(
  overrides: Partial<ProductionReadinessInput> = {},
) {
  return evaluateProductionReadiness(buildProductionTrustFixture(overrides).input);
}

export function buildRevokedCertification(
  certification: ProductionCertificationRecord,
) {
  return appendCertificationRevocation([], {
    certificationId: certification.certificationId,
    reason: "MANUAL_GOVERNANCE_REVOKE",
    revokedAt: "2026-05-17T00:00:00.000Z",
    revokedBy: "governance-review-44",
  })[0];
}

export function buildDeploymentAttestationFixture(
  certification: ProductionCertificationRecord,
) {
  return createDeploymentAttestation({
    productionTrustId: "production-trust-001",
    certification,
    approvalChainHash: "sha256:approval-chain",
    trustBoundary: "production",
    environmentId: "prod-a",
    deploymentConstraints: ["no-deploy", "attestation-only"],
    rollbackRequired: true,
  });
}

export function appendLedgerFixture() {
  const first = appendOperationalTrustEvent([], {
    eventType: "certification.created",
    productionTrustId: "production-trust-001",
    certificationId: "cert-001",
    result: "success",
    occurredAt: "2026-05-16T00:00:00.000Z",
  });
  return appendOperationalTrustEvent(first, {
    eventType: "compliance.evidence.generated",
    productionTrustId: "production-trust-001",
    certificationId: "cert-001",
    result: "success",
    occurredAt: "2026-05-16T00:01:00.000Z",
  });
}

export function buildProductionSnapshotWithoutGovernance(
  snapshot: RegistrySnapshot,
): RegistrySnapshot {
  return {
    ...snapshot,
    content: {
      ...snapshot.content,
      governance: {},
    },
  };
}

export function buildRuntimeUnsupportedValidation(
  validation: RuntimeValidationResult,
): RuntimeValidationResult {
  const failure: RuntimeValidationFailure = {
    code: "TOOL_RUNTIME_UNSUPPORTED",
    message: "runtime is unsupported",
    path: "runtimeValidation",
  };
  const ambiguousFailure: RuntimeValidationFailure = {
    code: "TOOL_RESOLUTION_AMBIGUOUS" as RuntimeValidationFailure["code"],
    message: "resolution is ambiguous",
    path: "binding.toolId",
  };

  return {
    ...validation,
    allowed: false,
    bindingCompatibility: {
      ...validation.bindingCompatibility,
      valid: false,
    },
    certification: {
      ...validation.certification,
      valid: false,
      trustState: "uncertified",
      failures: [
        ...validation.certification.failures,
        failure,
      ],
    },
    failures: [
      ...validation.failures,
      failure,
      ambiguousFailure,
    ],
  };
}
