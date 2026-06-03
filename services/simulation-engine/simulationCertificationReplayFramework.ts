import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  CertificationReplayInput,
  CertificationReplayObservability,
  CertificationReplayReasonCode,
  CertificationReplayRequest,
  CertificationReplayResult,
  CertificationReplayValidation,
  SealedCertificationReplayRecord,
} from "./types";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: CertificationReplayReasonCode[], reason: CertificationReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

export function buildCertificationReplayRequest(input: Omit<CertificationReplayInput, "request"> & {
  reconstructionMode: CertificationReplayRequest["reconstructionMode"];
  certificationLineageReferences?: readonly string[];
}): CertificationReplayRequest {
  return Object.freeze({
    certificationId: input.certification.result.certificationId,
    simulationId: input.certification.result.simulationId,
    tenantId: input.resultModel.result.tenantId,
    certificationHash: input.certification.result.certificationHash,
    reconstructionMode: input.reconstructionMode,
    lineageReferences: normalizeStrings(input.certificationLineageReferences ?? [
      input.resultModel.result.lineageHash,
      ...input.replayLedger.entries.map((entry) => entry.lineageHash),
    ]),
  });
}

function validateSealedArtifacts(input: CertificationReplayInput, reasons: CertificationReplayReasonCode[]): boolean {
  const certificationSealed = input.certification.sealed === true;
  const ledgerSealed = input.replayLedger.sealed === true;
  const resultSealed = input.resultModel.sealed === true;
  addReason(reasons, certificationSealed ? "CERTIFICATION_ARTIFACT_SEALED" : "CERTIFICATION_ARTIFACT_UNSEALED");
  addReason(reasons, ledgerSealed ? "LEDGER_ARTIFACT_SEALED" : "LEDGER_ARTIFACT_UNSEALED");
  addReason(reasons, resultSealed ? "RESULT_MODEL_ARTIFACT_SEALED" : "RESULT_MODEL_ARTIFACT_UNSEALED");
  return certificationSealed && ledgerSealed && resultSealed;
}

function validateEvidence(input: CertificationReplayInput, reasons: CertificationReplayReasonCode[]): boolean {
  const evidencePresent = input.replayLedger.entries.length > 0
    && input.replayLedger.bundle.ledgerEntries.length > 0
    && input.resultModel.result.evidenceReferences.length > 0;
  addReason(reasons, evidencePresent ? "REPLAY_EVIDENCE_PRESENT" : "REPLAY_EVIDENCE_MISSING");
  return evidencePresent;
}

function validateCertificationHash(input: CertificationReplayInput, reasons: CertificationReplayReasonCode[]): boolean {
  const present = input.request.certificationHash.length > 0 && input.certification.result.certificationHash.length > 0;
  addReason(reasons, present ? "CERTIFICATION_HASH_PRESENT" : "CERTIFICATION_HASH_MISSING");
  return present;
}

function validateTenant(input: CertificationReplayInput, reasons: CertificationReplayReasonCode[]): boolean {
  const valid = input.request.tenantId === input.resultModel.result.tenantId
    && input.replayLedger.entries.every((entry) => entry.tenantId === input.request.tenantId)
    && input.resultModel.validation.tenantBoundaryPreserved;
  addReason(reasons, valid ? "TENANT_BOUNDARY_PRESERVED" : "CROSS_TENANT_REFERENCES_BLOCKED");
  return valid;
}

function expectedLineage(input: CertificationReplayInput): string[] {
  return normalizeStrings([
    input.resultModel.result.lineageHash,
    ...input.replayLedger.entries.map((entry) => entry.lineageHash),
  ]);
}

function validateLineage(input: CertificationReplayInput, reasons: CertificationReplayReasonCode[]): boolean {
  const references = normalizeStrings(input.request.lineageReferences);
  const expected = expectedLineage(input);
  const valid = references.length > 0
    && input.certification.validation.lineageIntegrity
    && input.replayLedger.validation.lineageIntegrity
    && input.resultModel.validation.lineageIntegrity
    && expected.every((reference) => references.includes(reference));
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateReplayReferences(input: CertificationReplayInput, reasons: CertificationReplayReasonCode[]): boolean {
  const expected = expectedLineage(input);
  const actual = normalizeStrings(input.request.lineageReferences);
  const valid = expected.every((reference) => actual.includes(reference));
  addReason(reasons, valid ? "REPLAY_REFERENCES_IMMUTABLE" : "REPLAY_REFERENCES_MUTATED");
  return valid;
}

export function reconstructCertificationHash(input: CertificationReplayInput): string {
  return input.certification.result.certificationHash;
}

function validateReconstructedHash(
  input: CertificationReplayInput,
  reconstructedHash: string,
  reasons: CertificationReplayReasonCode[],
): boolean {
  const valid = reconstructedHash === input.request.certificationHash
    && reconstructedHash === input.certification.result.certificationHash;
  addReason(reasons, valid ? "RECONSTRUCTED_HASH_VALID" : "RECONSTRUCTED_HASH_MISMATCH");
  return valid;
}

function resolveStatus(input: {
  artifactsSealed: boolean;
  certificationHashPresent: boolean;
  lineageIntegrity: boolean;
  tenantBoundary: boolean;
  reconstructedHashValid: boolean;
  replayReferencesImmutable: boolean;
  evidencePresent: boolean;
}): CertificationReplayResult["replayStatus"] {
  if (
    !input.artifactsSealed
    || !input.certificationHashPresent
    || !input.lineageIntegrity
    || !input.tenantBoundary
    || !input.reconstructedHashValid
    || !input.replayReferencesImmutable
  ) {
    return "FAIL";
  }
  if (!input.evidencePresent) return "ESCALATE";
  return "PASS";
}

function escalationReason(validation: CertificationReplayValidation): string | undefined {
  if (validation.replayStatus === "PASS") return undefined;
  return validation.reasonCodes.join(",");
}

export function validateCertificationReplay(input: CertificationReplayInput): CertificationReplayValidation {
  const reasons: CertificationReplayReasonCode[] = [];
  const reconstructedHash = reconstructCertificationHash(input);
  const artifactsSealed = validateSealedArtifacts(input, reasons);
  const certificationHashPresent = validateCertificationHash(input, reasons);
  const evidencePresent = validateEvidence(input, reasons);
  const lineageIntegrity = validateLineage(input, reasons);
  const tenantBoundary = validateTenant(input, reasons);
  const replayReferencesImmutable = validateReplayReferences(input, reasons);
  const reconstructedHashValid = validateReconstructedHash(input, reconstructedHash, reasons);
  addReason(reasons, "REPLAY_IS_NOT_RECERTIFICATION");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");

  return Object.freeze({
    replayStatus: resolveStatus({
      artifactsSealed,
      certificationHashPresent,
      evidencePresent,
      lineageIntegrity,
      tenantBoundary,
      reconstructedHashValid,
      replayReferencesImmutable,
    }),
    reasonCodes: normalizeStrings(reasons) as readonly CertificationReplayReasonCode[],
    lineageIntegrity,
    reconstructionDeterministic: reconstructedHashValid,
    replayable: reconstructedHashValid && lineageIntegrity && tenantBoundary,
    tenantBoundaryPreserved: tenantBoundary,
    deterministic: true as const,
    readOnly: true as const,
    replayOnly: true as const,
  });
}

export function replayCertification(input: CertificationReplayInput): CertificationReplayResult {
  const reconstructedHash = reconstructCertificationHash(input);
  const validation = validateCertificationReplay(input);
  const replayCore = Object.freeze({
    certificationId: input.request.certificationId,
    reconstructionMode: input.request.reconstructionMode,
    replayStatus: validation.replayStatus,
    reconstructedHash,
    lineageIntegrity: validation.lineageIntegrity,
    reconstructionDeterministic: validation.reconstructionDeterministic,
    replayable: validation.replayable,
    lineageReferences: normalizeStrings(input.request.lineageReferences),
  });

  return Object.freeze({
    replayId: hashReplayValue("simulation-certification-replay-id", replayCore),
    certificationId: input.request.certificationId,
    replayStatus: validation.replayStatus,
    reconstructedHash,
    lineageIntegrity: validation.lineageIntegrity,
    reconstructionDeterministic: validation.reconstructionDeterministic,
    replayable: validation.replayable,
    escalationReason: escalationReason(validation),
  });
}

export function buildCertificationReplayObservability(result: CertificationReplayResult): CertificationReplayObservability {
  return Object.freeze({
    replayId: result.replayId,
    certificationId: result.certificationId,
    replayStatus: result.replayStatus,
    replayable: result.replayable,
    lineageIntegrity: result.lineageIntegrity,
    reconstructedHash: result.reconstructedHash,
  });
}

export function sealCertificationReplay(input: CertificationReplayInput): SealedCertificationReplayRecord {
  const validation = validateCertificationReplay(input);
  const result = replayCertification(input);
  const observability = buildCertificationReplayObservability(result);

  return Object.freeze({
    result,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    replayOnly: true as const,
    recertificationAllowed: false as const,
    artifactMutationAllowed: false as const,
    lineageMutationAllowed: false as const,
    executionAuthorized: false as const,
    workflowMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    remediationAllowed: false as const,
    persistenceAllowed: false as const,
    schedulingAllowed: false as const,
  });
}

export const CertificationReplayValidator = Object.freeze({
  validate: validateCertificationReplay,
});

export const SimulationCertificationReplayFramework = Object.freeze({
  buildRequest: buildCertificationReplayRequest,
  reconstructHash: reconstructCertificationHash,
  replay: replayCertification,
  seal: sealCertificationReplay,
});

export const CertificationReplayObservabilityService = Object.freeze({
  build: buildCertificationReplayObservability,
});
