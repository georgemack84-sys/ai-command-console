import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GovernanceForecastInput,
  GovernanceForecastObservability,
  GovernanceForecastReasonCode,
  GovernanceForecastResult,
  GovernanceForecastStatus,
  GovernanceForecastValidation,
  SealedGovernanceForecastRecord,
} from "./types";

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: GovernanceForecastReasonCode[], reason: GovernanceForecastReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function clampPressure(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function validateContract(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const valid = input.sealedContract.sealed
    && input.sealedContract.validation.status === "SEALED"
    && input.request.contractId === input.sealedContract.contract.immutableHash;
  addReason(reasons, valid ? "CONTRACT_VALID" : "CONTRACT_INVALID");
  return valid;
}

function validateReplay(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const valid = input.branchReplay.sealed
    && input.branchReplay.result.replayId === input.request.replayId
    && input.branchReplay.result.replayStatus === "PASS";
  addReason(reasons, valid ? "REPLAY_VALID" : "REPLAY_INTEGRITY_FAILED");
  return valid;
}

function validateSandbox(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const valid = input.sandbox.sealed
    && input.sandbox.context.sandboxId === input.request.sandboxId
    && input.sandbox.result.sandboxStatus === "PASS"
    && input.sandbox.result.replayIntegrity;
  addReason(reasons, valid ? "SANDBOX_VALID" : "SANDBOX_CONTAINMENT_FAILED");
  return valid;
}

function validateCertification(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const valid = input.request.riskCertificationReference.length > 0
    && input.request.riskCertificationReference === input.sealedContract.contract.riskCertificationReference;
  addReason(reasons, valid ? "CERTIFICATION_VALID" : "CERTIFICATION_INVALID");
  return valid;
}

function validateGovernance(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const valid = input.request.governanceVersion.length > 0
    && input.request.governanceVersion === input.sealedContract.contract.governanceVersion;
  addReason(reasons, valid ? "GOVERNANCE_VERSION_PRESENT" : "GOVERNANCE_VERSION_MISSING");
  return valid;
}

function validateLineage(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const lineage = normalizeStrings(input.request.lineageReferences);
  const valid = lineage.length > 0
    && lineage.includes(input.branchReplay.result.replayLineageHash)
    && lineage.includes(input.sandbox.result.isolationHash);
  addReason(reasons, valid ? "LINEAGE_PRESENT" : "LINEAGE_MISSING");
  return valid;
}

function validateTenant(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const valid = input.sealedContract.contract.tenantId === input.tenantId
    && input.sandbox.context.tenantId === input.tenantId;
  if (!valid) addReason(reasons, "CROSS_TENANT_INPUTS_BLOCKED");
  return valid;
}

function validateSealedArtifacts(input: GovernanceForecastInput, reasons: GovernanceForecastReasonCode[]): boolean {
  const valid = input.sealedContract.sealed && input.branchReplay.sealed && input.sandbox.sealed;
  addReason(reasons, valid ? "FORECAST_REFERENCES_SEALED_ARTIFACTS" : "FORECAST_REFERENCES_UNSEALED_ARTIFACTS");
  return valid;
}

function pressureForType(input: GovernanceForecastInput): number {
  const replayPressure = input.branchReplay.result.replayStatus === "PASS" ? 0.05 : 0.8;
  const sandboxPressure = input.sandbox.result.sandboxStatus === "PASS" ? 0.05 : 0.8;
  const policyPressure = input.policyConflict ? 0.85 : 0.05;
  const approvalPressure = clampPressure(input.approvalComplexity ?? 0.1);
  const containmentPressure = clampPressure(input.containmentStress ?? 0.1);

  switch (input.request.forecastType) {
    case "ESCALATION_FORECAST":
      return clampPressure((replayPressure * 0.25) + (sandboxPressure * 0.25) + (policyPressure * 0.25) + (containmentPressure * 0.25));
    case "APPROVAL_PRESSURE":
      return clampPressure((approvalPressure * 0.55) + (policyPressure * 0.25) + (sandboxPressure * 0.2));
    case "CONTAINMENT_FORECAST":
      return clampPressure((containmentPressure * 0.55) + (sandboxPressure * 0.35) + (replayPressure * 0.1));
    case "POLICY_ALIGNMENT":
      return clampPressure((policyPressure * 0.75) + (approvalPressure * 0.15) + (replayPressure * 0.1));
  }
}

function resolveStatus(input: {
  contractValid: boolean;
  replayValid: boolean;
  sandboxValid: boolean;
  certificationValid: boolean;
  governanceValid: boolean;
  lineageValid: boolean;
  tenantValid: boolean;
  sealedArtifactsValid: boolean;
  governanceMissing: boolean;
  pressure: number;
}): GovernanceForecastStatus {
  if (!input.replayValid || !input.sandboxValid || !input.certificationValid || !input.tenantValid || !input.lineageValid || !input.sealedArtifactsValid) {
    return "FREEZE";
  }
  if (!input.contractValid) return "FREEZE";
  if (input.governanceMissing) return "ESCALATE";
  if (!input.governanceValid) return "ESCALATE";
  if (input.pressure >= 0.65) return "ESCALATE";
  if (input.pressure >= 0.35) return "LIMIT_SCOPE";
  return "PASS";
}

export function validateGovernanceForecast(input: GovernanceForecastInput): GovernanceForecastValidation {
  const reasons: GovernanceForecastReasonCode[] = [];
  const contractValid = validateContract(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const sandboxValid = validateSandbox(input, reasons);
  const certificationValid = validateCertification(input, reasons);
  const governanceValid = validateGovernance(input, reasons);
  const lineageValid = validateLineage(input, reasons);
  const tenantValid = validateTenant(input, reasons);
  const sealedArtifactsValid = validateSealedArtifacts(input, reasons);
  if (input.policyConflict) addReason(reasons, "POLICY_CONFLICT_SURFACED");
  addReason(reasons, "FORECAST_IS_NOT_APPROVAL");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");
  const pressure = pressureForType(input);
  const forecastStatus = resolveStatus({
    contractValid,
    replayValid,
    sandboxValid,
    certificationValid,
    governanceValid,
    lineageValid,
    tenantValid,
    sealedArtifactsValid,
    governanceMissing: input.request.governanceVersion.length === 0,
    pressure,
  });

  return Object.freeze({
    forecastStatus,
    reasonCodes: normalizeStrings(reasons) as readonly GovernanceForecastReasonCode[],
    replayIntegrity: replayValid,
    containmentIntegrity: sandboxValid,
    governancePressure: pressure,
    deterministic: true as const,
    readOnly: true as const,
    authorityBounded: true,
    governanceAuthoritative: true as const,
  });
}

function lineageHash(input: GovernanceForecastInput): string {
  return hashConfidenceValue("governance-forecast-lineage", canonicalizeConfidenceToString({
    lineageReferences: normalizeStrings(input.request.lineageReferences),
    contractHash: input.sealedContract.contract.immutableHash,
    replayHash: input.branchReplay.result.replayHash,
    sandboxHash: input.sandbox.result.isolationHash,
    governanceVersion: input.request.governanceVersion,
  }));
}

function escalationReason(validation: GovernanceForecastValidation): string | undefined {
  if (validation.forecastStatus === "PASS") return undefined;
  return validation.reasonCodes.join(",");
}

export function forecastGovernance(input: GovernanceForecastInput): GovernanceForecastResult {
  const validation = validateGovernanceForecast(input);
  const forecastLineageHash = lineageHash(input);
  const forecastCore = Object.freeze({
    simulationId: input.request.simulationId,
    forecastType: input.request.forecastType,
    forecastStatus: validation.forecastStatus,
    governancePressure: validation.governancePressure,
    lineageHash: forecastLineageHash,
    replayIntegrity: validation.replayIntegrity,
    containmentIntegrity: validation.containmentIntegrity,
    request: Object.freeze({
      sandboxId: input.request.sandboxId,
      replayId: input.request.replayId,
      contractId: input.request.contractId,
      riskCertificationReference: input.request.riskCertificationReference,
      governanceVersion: input.request.governanceVersion,
      lineageReferences: normalizeStrings(input.request.lineageReferences),
    }),
  });
  const forecastHash = hashConfidenceValue("governance-forecast-result", canonicalizeConfidenceToString(forecastCore));

  return Object.freeze({
    forecastId: hashConfidenceValue("governance-forecast-id", forecastHash),
    simulationId: input.request.simulationId,
    forecastType: input.request.forecastType,
    forecastStatus: validation.forecastStatus,
    governancePressure: validation.governancePressure,
    forecastHash,
    lineageHash: forecastLineageHash,
    replayIntegrity: validation.replayIntegrity,
    containmentIntegrity: validation.containmentIntegrity,
    escalationReason: escalationReason(validation),
  });
}

export function buildGovernanceForecastObservability(result: GovernanceForecastResult): GovernanceForecastObservability {
  return Object.freeze({
    forecastId: result.forecastId,
    forecastType: result.forecastType,
    forecastStatus: result.forecastStatus,
    governancePressure: result.governancePressure,
    forecastHash: result.forecastHash,
    replayIntegrity: result.replayIntegrity,
    containmentIntegrity: result.containmentIntegrity,
  });
}

export function sealGovernanceForecast(input: GovernanceForecastInput): SealedGovernanceForecastRecord {
  const validation = validateGovernanceForecast(input);
  const result = forecastGovernance(input);
  const observability = buildGovernanceForecastObservability(result);

  return Object.freeze({
    result,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    advisoryOnly: true as const,
    approvalAuthorized: false as const,
    rejectionAuthorized: false as const,
    policyMutationAllowed: false as const,
    executionAuthorized: false as const,
    authorityMutationAllowed: false as const,
  });
}

export const GovernanceForecastValidator = Object.freeze({
  validate: validateGovernanceForecast,
});

export const GovernanceForecastingEngine = Object.freeze({
  forecast: forecastGovernance,
  seal: sealGovernanceForecast,
});

export const GovernanceForecastObservabilityService = Object.freeze({
  build: buildGovernanceForecastObservability,
});
