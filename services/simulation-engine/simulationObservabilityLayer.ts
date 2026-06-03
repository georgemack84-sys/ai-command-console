import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedSimulationObservabilityRecord,
  SimulationObservabilityInput,
  SimulationObservabilityReasonCode,
  SimulationObservabilityRequest,
  SimulationObservabilityResult,
  SimulationObservabilityValidation,
} from "./types";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: SimulationObservabilityReasonCode[], reason: SimulationObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

export function buildSimulationObservabilityRequest(input: Omit<SimulationObservabilityInput, "request"> & {
  visibilityScope: SimulationObservabilityRequest["visibilityScope"];
}): SimulationObservabilityRequest {
  return Object.freeze({
    simulationId: input.resultModel.result.simulationId,
    tenantId: input.resultModel.result.tenantId,
    visibilityScope: input.visibilityScope,
    artifactReferences: normalizeStrings([
      input.sealedContract.contract.immutableHash,
      ...input.branchReplays.map((replay) => replay.result.replayHash),
      ...input.sandboxes.map((sandbox) => sandbox.result.isolationHash),
      ...input.forecasts.map((forecast) => forecast.result.forecastHash),
      ...input.analyses.map((analysis) => analysis.result.analysisHash),
      input.replayLedger.bundle.reconstructionHash,
      input.resultModel.result.immutableHash,
      input.certification.result.certificationHash,
      input.certificationReplay.result.reconstructedHash,
    ]),
  });
}

function scopeVisibility(scope: SimulationObservabilityRequest["visibilityScope"]): Readonly<{
  replayVisible: boolean;
  lineageVisible: boolean;
  certificationVisible: boolean;
  containmentVisible: boolean;
  reconstructionVisible: boolean;
}> {
  switch (scope) {
    case "HEALTH":
      return Object.freeze({
        replayVisible: true,
        lineageVisible: false,
        certificationVisible: false,
        containmentVisible: false,
        reconstructionVisible: true,
      });
    case "LINEAGE":
      return Object.freeze({
        replayVisible: true,
        lineageVisible: true,
        certificationVisible: false,
        containmentVisible: false,
        reconstructionVisible: true,
      });
    case "CERTIFICATION":
      return Object.freeze({
        replayVisible: true,
        lineageVisible: true,
        certificationVisible: true,
        containmentVisible: false,
        reconstructionVisible: true,
      });
    case "CONTAINMENT":
      return Object.freeze({
        replayVisible: true,
        lineageVisible: false,
        certificationVisible: false,
        containmentVisible: true,
        reconstructionVisible: true,
      });
    case "FULL":
      return Object.freeze({
        replayVisible: true,
        lineageVisible: true,
        certificationVisible: true,
        containmentVisible: true,
        reconstructionVisible: true,
      });
  }
}

function validateSealedArtifacts(input: SimulationObservabilityInput, reasons: SimulationObservabilityReasonCode[]): boolean {
  const valid = input.sealedContract.sealed
    && input.branchReplays.length > 0
    && input.branchReplays.every((replay) => replay.sealed)
    && input.sandboxes.length > 0
    && input.sandboxes.every((sandbox) => sandbox.sealed)
    && input.forecasts.length > 0
    && input.forecasts.every((forecast) => forecast.sealed)
    && input.analyses.length > 0
    && input.analyses.every((analysis) => analysis.sealed)
    && input.replayLedger.sealed
    && input.resultModel.sealed
    && input.certification.sealed
    && input.certificationReplay.sealed;
  addReason(reasons, valid ? "ARTIFACTS_SEALED" : "ARTIFACT_UNSEALED");
  return valid;
}

function validateTenant(input: SimulationObservabilityInput, reasons: SimulationObservabilityReasonCode[]): boolean {
  const valid = input.request.tenantId === input.sealedContract.contract.tenantId
    && input.resultModel.result.tenantId === input.request.tenantId
    && input.sandboxes.every((sandbox) => sandbox.context.tenantId === input.request.tenantId)
    && input.replayLedger.entries.every((entry) => entry.tenantId === input.request.tenantId)
    && input.certificationReplay.validation.tenantBoundaryPreserved;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateScope(input: SimulationObservabilityInput, reasons: SimulationObservabilityReasonCode[]): boolean {
  const valid = ["HEALTH", "LINEAGE", "CERTIFICATION", "CONTAINMENT", "FULL"].includes(input.request.visibilityScope);
  addReason(reasons, valid ? "VISIBILITY_SCOPE_VALID" : "VISIBILITY_SCOPE_INVALID");
  return valid;
}

function validateArtifactReferences(input: SimulationObservabilityInput, reasons: SimulationObservabilityReasonCode[]): boolean {
  const expected = buildSimulationObservabilityRequest({
    sealedContract: input.sealedContract,
    branchReplays: input.branchReplays,
    sandboxes: input.sandboxes,
    forecasts: input.forecasts,
    analyses: input.analyses,
    replayLedger: input.replayLedger,
    resultModel: input.resultModel,
    certification: input.certification,
    certificationReplay: input.certificationReplay,
    visibilityScope: input.request.visibilityScope,
  }).artifactReferences;
  const actual = normalizeStrings(input.request.artifactReferences);
  const valid = actual.length > 0 && expected.every((reference) => actual.includes(reference));
  addReason(reasons, valid ? "ARTIFACT_REFERENCES_PRESENT" : "ARTIFACT_REFERENCES_MISSING");
  return valid;
}

function validateLineage(input: SimulationObservabilityInput, reasons: SimulationObservabilityReasonCode[]): boolean {
  const valid = input.replayLedger.validation.lineageIntegrity
    && input.resultModel.validation.lineageIntegrity
    && input.certification.validation.lineageIntegrity
    && input.certificationReplay.validation.lineageIntegrity;
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateContainment(input: SimulationObservabilityInput, reasons: SimulationObservabilityReasonCode[]): boolean {
  const valid = input.sandboxes.every((sandbox) => sandbox.result.sandboxStatus === "PASS" && sandbox.validation.containmentState === "CONTAINED")
    && input.certification.result.containmentVerified;
  addReason(reasons, valid ? "CONTAINMENT_HEALTHY" : "CONTAINMENT_FAILURE");
  return valid;
}

function validateCertification(input: SimulationObservabilityInput, reasons: SimulationObservabilityReasonCode[]): boolean {
  const valid = input.certification.result.certificationStatus !== "FAIL"
    && input.certificationReplay.result.replayStatus !== "FAIL";
  addReason(reasons, valid ? "CERTIFICATION_HEALTHY" : "CERTIFICATION_FAILURE");
  return valid;
}

function addVisibilityReasons(
  visibility: ReturnType<typeof scopeVisibility>,
  reasons: SimulationObservabilityReasonCode[],
): void {
  addReason(reasons, visibility.replayVisible ? "REPLAY_VISIBLE" : "REPLAY_NOT_VISIBLE");
  addReason(reasons, visibility.lineageVisible ? "LINEAGE_VISIBLE" : "LINEAGE_NOT_VISIBLE");
  addReason(reasons, visibility.certificationVisible ? "CERTIFICATION_VISIBLE" : "CERTIFICATION_NOT_VISIBLE");
  addReason(reasons, visibility.containmentVisible ? "CONTAINMENT_VISIBLE" : "CONTAINMENT_NOT_VISIBLE");
  addReason(reasons, visibility.reconstructionVisible ? "RECONSTRUCTION_VISIBLE" : "RECONSTRUCTION_NOT_VISIBLE");
}

function resolveState(input: {
  artifactsSealed: boolean;
  tenantValid: boolean;
  scopeValid: boolean;
  artifactReferencesPresent: boolean;
  lineageIntegrity: boolean;
  containmentHealthy: boolean;
  certificationHealthy: boolean;
  replayStatus: string;
  resultStatus: string;
}): SimulationObservabilityResult["observabilityState"] {
  if (!input.artifactsSealed || !input.tenantValid || !input.scopeValid) return "FROZEN";
  if (!input.artifactReferencesPresent || !input.lineageIntegrity || !input.containmentHealthy) return "ESCALATED";
  if (!input.certificationHealthy) return "LIMITED";
  if (input.replayStatus === "ESCALATE" || input.resultStatus === "ESCALATE") return "DEGRADED";
  return "HEALTHY";
}

export function validateSimulationObservability(input: SimulationObservabilityInput): SimulationObservabilityValidation {
  const reasons: SimulationObservabilityReasonCode[] = [];
  const artifactsSealed = validateSealedArtifacts(input, reasons);
  const tenantValid = validateTenant(input, reasons);
  const scopeValid = validateScope(input, reasons);
  const artifactReferencesPresent = validateArtifactReferences(input, reasons);
  const lineageIntegrity = validateLineage(input, reasons);
  const containmentHealthy = validateContainment(input, reasons);
  const certificationHealthy = validateCertification(input, reasons);
  const visibility = scopeVisibility(input.request.visibilityScope);
  addVisibilityReasons(visibility, reasons);
  addReason(reasons, "OBSERVABILITY_IS_NOT_CONTROL");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");

  return Object.freeze({
    observabilityState: resolveState({
      artifactsSealed,
      tenantValid,
      scopeValid,
      artifactReferencesPresent,
      lineageIntegrity,
      containmentHealthy,
      certificationHealthy,
      replayStatus: input.certificationReplay.result.replayStatus,
      resultStatus: input.resultModel.result.resultStatus,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly SimulationObservabilityReasonCode[],
    ...visibility,
    lineageIntegrity,
    deterministic: true as const,
    readOnly: true as const,
    visibilityOnly: true as const,
    authorityBounded: true as const,
  });
}

export function buildSimulationObservability(input: SimulationObservabilityInput): SimulationObservabilityResult {
  const validation = validateSimulationObservability(input);
  const observabilityCore = Object.freeze({
    simulationId: input.request.simulationId,
    tenantId: input.request.tenantId,
    visibilityScope: input.request.visibilityScope,
    artifactReferences: normalizeStrings(input.request.artifactReferences),
    observabilityState: validation.observabilityState,
    replayVisible: validation.replayVisible,
    lineageVisible: validation.lineageVisible,
    certificationVisible: validation.certificationVisible,
    containmentVisible: validation.containmentVisible,
    reconstructionVisible: validation.reconstructionVisible,
    lineageIntegrity: validation.lineageIntegrity,
  });
  const observabilityHash = hashObservabilityValue("simulation-observability-layer", observabilityCore);

  return Object.freeze({
    observabilityId: hashObservabilityValue("simulation-observability-layer-id", observabilityHash),
    simulationId: input.request.simulationId,
    observabilityState: validation.observabilityState,
    replayVisible: validation.replayVisible,
    lineageVisible: validation.lineageVisible,
    certificationVisible: validation.certificationVisible,
    containmentVisible: validation.containmentVisible,
    reconstructionVisible: validation.reconstructionVisible,
    lineageIntegrity: validation.lineageIntegrity,
    observabilityHash,
  });
}

export function sealSimulationObservability(input: SimulationObservabilityInput): SealedSimulationObservabilityRecord {
  const validation = validateSimulationObservability(input);
  const result = buildSimulationObservability(input);

  return Object.freeze({
    result,
    validation,
    sealed: true as const,
    readOnly: true as const,
    visibilityOnly: true as const,
    executionAuthorized: false as const,
    workflowMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    artifactMutationAllowed: false as const,
    remediationAllowed: false as const,
    persistenceAllowed: false as const,
    schedulingAllowed: false as const,
  });
}

export const SimulationObservabilityValidator = Object.freeze({
  validate: validateSimulationObservability,
});

export const SimulationObservabilityLayer = Object.freeze({
  buildRequest: buildSimulationObservabilityRequest,
  build: buildSimulationObservability,
  seal: sealSimulationObservability,
});
