import { readFileSync } from "node:fs";
import path from "node:path";

import { hashFailurePayload } from "@/services/failure-orchestration";
import { buildExecutionTreatyPackage, type ExecutionTreatyBuildInput, verifyExecutionTreatyIntegrity } from "@/services/execution-treaty";
import { certifyProductionSurvivability, evaluateProductionReadiness } from "@/services/production-trust-framework";
import { buildEnforcementHarnessFixture } from "@/tests/enforcement-test-harness/helpers";
import { evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";
import { appendLedgerFixture, buildProductionTrustFixture } from "@/tests/production-trust-framework/helpers";

export function buildExecutionTreatyFixture(
  overrides: Partial<ExecutionTreatyBuildInput> = {},
) {
  const production = buildProductionTrustFixture();
  const readiness = evaluateProductionReadiness(production.input);
  const failureInput = buildEnforcementHarnessFixture();
  const failureState = evaluateFailureFixture();
  const survivabilityCertification = certifyProductionSurvivability({
    failureState,
    trustCertification: production.trustCertification,
  });

  const input: ExecutionTreatyBuildInput = {
    planId: "plan-001",
    planHash: "sha256:plan-001",
    executionTruthHash: failureState.snapshot.snapshotHash,
    executionCompatibilityHash: production.input.runtimeValidation.bindingCompatibility.compatibilityHash,
    replaySnapshotHash: production.input.runtimeValidation.attestation.attestationHash,
    replayBindingHash: production.input.runtimeValidation.validationHash,
    derivedSimulationHash: hashFailurePayload("EVIDENCE_BUNDLE", production.harnessResults.map((result) => result.evidence.resultHash)),
    derivedAdmissionHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      trustedSnapshotAdmission: production.input.trustedSnapshotAdmission.ok,
      readinessStatus: readiness.status,
    }),
    snapshot: production.input.snapshot,
    trustedSnapshotAdmission: production.input.trustedSnapshotAdmission,
    readiness,
    productionCertification: production.certification,
    productionEvidence: readiness.evidence,
    operationalTrustLedger: appendLedgerFixture(),
    trustCertification: production.trustCertification,
    survivabilityCertification,
    failureInput,
    failureState,
    createdAt: "2026-05-16T12:00:00.000Z",
    createdBy: "governance-authority-01",
    scenarioId: "treaty-handoff",
    currentRegistrySnapshotHash: production.input.snapshot.manifest.registrySnapshotHash,
    currentReplaySnapshotHash: production.input.runtimeValidation.attestation.attestationHash,
    currentReplayBindingHash: production.input.runtimeValidation.validationHash,
    ...overrides,
  };

  return {
    input,
    treaty: buildExecutionTreatyPackage(input),
  };
}

export function verifyExecutionTreatyFixture(
  overrides: Partial<ExecutionTreatyBuildInput> = {},
) {
  const { treaty } = buildExecutionTreatyFixture(overrides);
  return verifyExecutionTreatyIntegrity(treaty);
}

export function loadExecutionTreatySources() {
  const root = path.resolve("services", "execution-treaty");
  return [
    "executionTreatyManifestBuilder.ts",
    "executionTreatyHasher.ts",
    "executionTreatyEvidenceLedger.ts",
    "executionTreatyIntegrityVerifier.ts",
    "executionTreatyRevocationEngine.ts",
    "executionTreatyConstraintEngine.ts",
    "executionTreatyReplayValidator.ts",
    "executionTreatyGovernanceBinder.ts",
    "executionTreatyRegistryBinder.ts",
    "executionTreatyProvenanceBinder.ts",
    "executionTreatySurvivabilityBinder.ts",
    "executionTreatyForensicBinder.ts",
    "zeroTrustExecutorReadiness.ts",
    "immutableTreatySerializer.ts",
    "executionTreatyArchive.ts",
    "boundaryViolationDetector.ts",
    "index.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
