import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  AlternatePathAnalysisInput,
  AlternatePathObservability,
  AlternatePathReasonCode,
  AlternatePathResult,
  AlternatePathValidation,
  SealedAlternatePathAnalysisRecord,
} from "./types";

export const MAX_ANALYZED_PATHS = 25;
export const MAX_ANALYSIS_DEPTH = 3;

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: AlternatePathReasonCode[], reason: AlternatePathReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function clampDelta(value: number): number {
  return Number(Math.max(0, value).toFixed(4));
}

function validateContract(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const valid = input.sealedContract.sealed
    && input.sealedContract.validation.status === "SEALED"
    && input.request.contractId === input.sealedContract.contract.immutableHash;
  addReason(reasons, valid ? "CONTRACT_VALID" : "CONTRACT_INVALID");
  return valid;
}

function validateReplays(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const replayIds = new Set(input.request.replayIds);
  const valid = input.branchReplays.length > 0
    && input.branchReplays.every((replay) => replay.sealed && replay.result.replayStatus === "PASS" && replayIds.has(replay.result.replayId));
  addReason(reasons, valid ? "REPLAY_OUTPUTS_VALID" : "REPLAY_INTEGRITY_FAILED");
  return valid;
}

function validateSandboxes(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const sandboxIds = new Set(input.request.sandboxIds);
  const valid = input.sandboxes.length > 0
    && input.sandboxes.every((sandbox) => sandbox.sealed && sandbox.result.sandboxStatus === "PASS" && sandboxIds.has(sandbox.context.sandboxId));
  addReason(reasons, valid ? "SANDBOX_OUTPUTS_VALID" : "CONTAINMENT_INTEGRITY_FAILED");
  return valid;
}

function validateForecasts(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const forecastIds = new Set(input.request.forecastIds);
  const valid = input.forecasts.length > 0
    && input.forecasts.every((forecast) => forecast.sealed && forecast.result.forecastStatus !== "FREEZE" && forecastIds.has(forecast.result.forecastId));
  addReason(reasons, valid ? "FORECAST_OUTPUTS_VALID" : "INVALID_FORECAST");
  return valid;
}

function validatePaths(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const approved = new Set(input.sealedContract.contract.approvedScope);
  const requested = normalizeStrings(input.request.pathIds);
  const generated = new Set(input.generatedPathIds ?? []);
  let valid = requested.length > 0;

  if (requested.length <= 0) {
    addReason(reasons, "PATH_COUNT_INVALID");
    valid = false;
  }
  if (requested.length > MAX_ANALYZED_PATHS) {
    addReason(reasons, "PATH_COUNT_LIMITED");
    valid = false;
  }
  if (!requested.every((pathId) => approved.has(pathId))) {
    addReason(reasons, "UNAPPROVED_PATH_DETECTED");
    valid = false;
  }
  if (requested.some((pathId) => generated.has(pathId))) {
    addReason(reasons, "GENERATED_PATH_BLOCKED");
    valid = false;
  }
  addReason(reasons, valid ? "APPROVED_PATHS_VALID" : "UNAPPROVED_PATH_DETECTED");
  return valid;
}

function validateAnalysisBoundary(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  let valid = true;
  if ((input.analysisDepth ?? 1) > MAX_ANALYSIS_DEPTH) {
    addReason(reasons, "ANALYSIS_DEPTH_LIMITED");
    valid = false;
  }
  if (input.nestedAnalysis) {
    addReason(reasons, "NESTED_ANALYSIS_BLOCKED");
    valid = false;
  }
  if (input.recursiveAnalysis) {
    addReason(reasons, "RECURSIVE_ANALYSIS_BLOCKED");
    valid = false;
  }
  return valid;
}

function validateTenant(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const valid = input.sealedContract.contract.tenantId === input.tenantId
    && input.sandboxes.every((sandbox) => sandbox.context.tenantId === input.tenantId);
  if (!valid) addReason(reasons, "CROSS_TENANT_PATHS_BLOCKED");
  return valid;
}

function validateLineage(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const lineage = normalizeStrings(input.request.lineageReferences);
  const required = [
    ...input.branchReplays.map((replay) => replay.result.replayLineageHash),
    ...input.sandboxes.map((sandbox) => sandbox.result.isolationHash),
    ...input.forecasts.map((forecast) => forecast.result.lineageHash),
  ];
  const valid = lineage.length > 0 && required.every((reference) => lineage.includes(reference));
  addReason(reasons, valid ? "LINEAGE_PRESENT" : "LINEAGE_MISSING");
  return valid;
}

function validateSealedArtifacts(input: AlternatePathAnalysisInput, reasons: AlternatePathReasonCode[]): boolean {
  const valid = input.sealedContract.sealed
    && input.branchReplays.every((replay) => replay.sealed)
    && input.sandboxes.every((sandbox) => sandbox.sealed)
    && input.forecasts.every((forecast) => forecast.sealed);
  addReason(reasons, valid ? "ANALYSIS_REFERENCES_SEALED_ARTIFACTS" : "ANALYSIS_REFERENCES_UNSEALED_ARTIFACTS");
  return valid;
}

function resolveStatus(input: {
  contractValid: boolean;
  replayValid: boolean;
  sandboxValid: boolean;
  forecastValid: boolean;
  pathValid: boolean;
  boundaryValid: boolean;
  tenantValid: boolean;
  lineageValid: boolean;
  sealedValid: boolean;
  tooManyPaths: boolean;
  tooDeep: boolean;
}): AlternatePathValidation["analysisStatus"] {
  if (!input.replayValid || !input.sandboxValid || !input.forecastValid || !input.tenantValid || !input.pathValid || !input.sealedValid) {
    return "FREEZE";
  }
  if (!input.contractValid || !input.boundaryValid) return "FREEZE";
  if (!input.lineageValid) return "ESCALATE";
  if (input.tooManyPaths || input.tooDeep) return "LIMIT_SCOPE";
  return "PASS";
}

function pressureDelta(input: AlternatePathAnalysisInput): number {
  const pressures = input.forecasts.map((forecast) => forecast.result.governancePressure);
  if (pressures.length <= 1) return 0;
  return clampDelta(Math.max(...pressures) - Math.min(...pressures));
}

function containmentDelta(input: AlternatePathAnalysisInput): number {
  const frozenCount = input.sandboxes.filter((sandbox) => sandbox.result.sandboxStatus !== "PASS").length;
  const limitedForecasts = input.forecasts.filter((forecast) => forecast.result.forecastStatus !== "PASS").length;
  return clampDelta((frozenCount + limitedForecasts) / Math.max(1, input.sandboxes.length + input.forecasts.length));
}

export function validateAlternatePathAnalysis(input: AlternatePathAnalysisInput): AlternatePathValidation {
  const reasons: AlternatePathReasonCode[] = [];
  const contractValid = validateContract(input, reasons);
  const replayValid = validateReplays(input, reasons);
  const sandboxValid = validateSandboxes(input, reasons);
  const forecastValid = validateForecasts(input, reasons);
  const pathValid = validatePaths(input, reasons);
  const boundaryValid = validateAnalysisBoundary(input, reasons);
  const tenantValid = validateTenant(input, reasons);
  const lineageValid = validateLineage(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  addReason(reasons, "ANALYSIS_IS_NOT_DECISION");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");
  const tooManyPaths = input.request.pathIds.length > MAX_ANALYZED_PATHS;
  const tooDeep = (input.analysisDepth ?? 1) > MAX_ANALYSIS_DEPTH;

  return Object.freeze({
    analysisStatus: resolveStatus({
      contractValid,
      replayValid,
      sandboxValid,
      forecastValid,
      pathValid,
      boundaryValid,
      tenantValid,
      lineageValid,
      sealedValid,
      tooManyPaths,
      tooDeep,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly AlternatePathReasonCode[],
    comparedPathCount: input.request.pathIds.length,
    replayIntegrity: replayValid,
    containmentIntegrity: sandboxValid,
    deterministic: true as const,
    readOnly: true as const,
    authorityBounded: true,
    governanceAuthoritative: true as const,
  });
}

function buildLineageHash(input: AlternatePathAnalysisInput): string {
  return hashConfidenceValue("alternate-path-lineage", canonicalizeConfidenceToString({
    contractId: input.request.contractId,
    replayIds: normalizeStrings(input.request.replayIds),
    sandboxIds: normalizeStrings(input.request.sandboxIds),
    forecastIds: normalizeStrings(input.request.forecastIds),
    pathIds: normalizeStrings(input.request.pathIds),
    lineageReferences: normalizeStrings(input.request.lineageReferences),
  }));
}

function escalationReason(validation: AlternatePathValidation): string | undefined {
  if (validation.analysisStatus === "PASS") return undefined;
  return validation.reasonCodes.join(",");
}

export function analyzeAlternatePaths(input: AlternatePathAnalysisInput): AlternatePathResult {
  const validation = validateAlternatePathAnalysis(input);
  const lineageHash = buildLineageHash(input);
  const governancePressureDelta = pressureDelta(input);
  const containmentPressureDelta = containmentDelta(input);
  const analysisCore = Object.freeze({
    simulationId: input.request.simulationId,
    contractId: input.request.contractId,
    replayIds: normalizeStrings(input.request.replayIds),
    sandboxIds: normalizeStrings(input.request.sandboxIds),
    forecastIds: normalizeStrings(input.request.forecastIds),
    pathIds: normalizeStrings(input.request.pathIds),
    analysisType: input.request.analysisType,
    lineageHash,
    analysisStatus: validation.analysisStatus,
    governancePressureDelta,
    containmentDelta: containmentPressureDelta,
    replayIntegrity: validation.replayIntegrity,
    containmentIntegrity: validation.containmentIntegrity,
  });
  const analysisHash = hashConfidenceValue("alternate-path-analysis", canonicalizeConfidenceToString(analysisCore));

  return Object.freeze({
    analysisId: hashConfidenceValue("alternate-path-analysis-id", analysisHash),
    simulationId: input.request.simulationId,
    analysisType: input.request.analysisType,
    analysisStatus: validation.analysisStatus,
    comparedPathCount: validation.comparedPathCount,
    analysisHash,
    lineageHash,
    governancePressureDelta,
    containmentDelta: containmentPressureDelta,
    replayIntegrity: validation.replayIntegrity,
    containmentIntegrity: validation.containmentIntegrity,
    escalationReason: escalationReason(validation),
  });
}

export function buildAlternatePathObservability(result: AlternatePathResult): AlternatePathObservability {
  return Object.freeze({
    analysisId: result.analysisId,
    analysisType: result.analysisType,
    comparedPathCount: result.comparedPathCount,
    analysisStatus: result.analysisStatus,
    governancePressureDelta: result.governancePressureDelta,
    containmentDelta: result.containmentDelta,
    analysisHash: result.analysisHash,
  });
}

export function sealAlternatePathAnalysis(input: AlternatePathAnalysisInput): SealedAlternatePathAnalysisRecord {
  const validation = validateAlternatePathAnalysis(input);
  const result = analyzeAlternatePaths(input);
  const observability = buildAlternatePathObservability(result);

  return Object.freeze({
    result,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    advisoryOnly: true as const,
    pathSelectionAuthorized: false as const,
    executionRecommended: false as const,
    optimizationAllowed: false as const,
    pathGenerationAllowed: false as const,
    workflowMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
  });
}

export const AlternatePathAnalysisValidator = Object.freeze({
  validate: validateAlternatePathAnalysis,
});

export const AlternatePathAnalysisEngine = Object.freeze({
  analyze: analyzeAlternatePaths,
  seal: sealAlternatePathAnalysis,
});

export const AlternatePathObservabilityService = Object.freeze({
  build: buildAlternatePathObservability,
});
