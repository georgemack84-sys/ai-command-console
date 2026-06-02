import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  BranchReplayInput,
  BranchReplayObservability,
  BranchReplayReasonCode,
  BranchReplayStatus,
  BranchReplayValidation,
  ReplayRequest,
  ReplayResult,
  SealedBranchReplayRecord,
  SealedSimulationBoundaryRecord,
} from "./types";

export const MAX_REPLAY_DEPTH = 3;
export const MAX_BRANCH_REPLAY_COUNT = 25;

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function addReason(reasons: BranchReplayReasonCode[], reason: BranchReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function approvedBranches(contract?: SealedSimulationBoundaryRecord): readonly string[] {
  return normalizeStrings(contract?.contract.approvedScope ?? []);
}

function validContract(input: BranchReplayInput, reasons: BranchReplayReasonCode[]): boolean {
  const contract = input.sealedContract;
  if (!contract?.sealed || contract.validation.status !== "SEALED") {
    addReason(reasons, "SEALED_CONTRACT_MISSING");
    return false;
  }
  addReason(reasons, "SEALED_CONTRACT_VALID");
  return true;
}

function validBoundary(contract: SealedSimulationBoundaryRecord | undefined, reasons: BranchReplayReasonCode[]): boolean {
  if (!contract) return false;
  let valid = true;
  if (contract.contract.executionAuthorized) {
    addReason(reasons, "CONTRACT_EXECUTION_AUTHORITY_BLOCKED");
    valid = false;
  }
  if (contract.contract.runtimeMutationAllowed) {
    addReason(reasons, "CONTRACT_RUNTIME_MUTATION_BLOCKED");
    valid = false;
  }
  addReason(reasons, "REPLAY_IS_NOT_EXECUTION");
  addReason(reasons, "AUTHORITY_BOUNDARY_PRESERVED");
  return valid;
}

function validRiskCertification(input: BranchReplayInput, reasons: BranchReplayReasonCode[]): boolean {
  const reference = input.request.riskCertificationReference;
  if (reference.length === 0) {
    addReason(reasons, "RISK_CERTIFICATION_MISSING");
    return false;
  }
  if (input.sealedContract && input.sealedContract.contract.riskCertificationReference !== reference) {
    addReason(reasons, "RISK_CERTIFICATION_MISMATCH");
    return false;
  }
  addReason(reasons, "RISK_CERTIFICATION_VALID");
  return true;
}

function validBranchScope(input: BranchReplayInput, reasons: BranchReplayReasonCode[]): boolean {
  const approved = new Set(approvedBranches(input.sealedContract));
  const requested = normalizeStrings(input.request.branchIds);
  const generated = new Set(input.generatedBranchIds ?? []);
  const allApproved = requested.every((branchId) => approved.has(branchId));
  const generatedRequested = requested.some((branchId) => generated.has(branchId));
  if (!allApproved) addReason(reasons, "BRANCH_SCOPE_INVALID");
  else addReason(reasons, "BRANCH_SCOPE_VALID");
  if (generatedRequested) addReason(reasons, "BRANCH_GENERATION_BLOCKED");
  return allApproved && !generatedRequested;
}

function validateReplayBounds(input: BranchReplayInput, reasons: BranchReplayReasonCode[]): boolean {
  let valid = true;
  if (input.request.replayDepth > MAX_REPLAY_DEPTH) {
    addReason(reasons, "REPLAY_DEPTH_LIMITED");
    valid = false;
  }
  if (input.request.branchIds.length > MAX_BRANCH_REPLAY_COUNT) {
    addReason(reasons, "BRANCH_COUNT_LIMITED");
    valid = false;
  }
  if (input.nestedReplay) {
    addReason(reasons, "NESTED_REPLAY_BLOCKED");
    valid = false;
  }
  if (input.recursiveReplay || input.request.replayReferenceIds.includes(input.request.contractId)) {
    addReason(reasons, "RECURSIVE_REPLAY_BLOCKED");
    valid = false;
  }
  if (input.request.branchIds.length > (input.sealedContract?.contract.branchLimit ?? 0)) {
    addReason(reasons, "REPLAY_GROWTH_BLOCKED");
    valid = false;
  }
  return valid;
}

function validTenant(input: BranchReplayInput, reasons: BranchReplayReasonCode[]): boolean {
  const contractTenant = input.sealedContract?.contract.tenantId;
  const valid = contractTenant === undefined || contractTenant === input.tenantId;
  if (!valid) addReason(reasons, "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validLineage(input: BranchReplayInput, reasons: BranchReplayReasonCode[]): boolean {
  const valid = input.lineageReferenceIds.length > 0 && input.request.replayReferenceIds.length > 0;
  if (!valid) addReason(reasons, "LINEAGE_REFERENCE_MISSING");
  return valid;
}

function resolveStatus(input: {
  contractValid: boolean;
  boundaryValid: boolean;
  riskValid: boolean;
  branchScopeValid: boolean;
  boundsValid: boolean;
  tenantValid: boolean;
  lineageValid: boolean;
  missingRiskCertification: boolean;
}): BranchReplayStatus {
  if (!input.contractValid || !input.boundaryValid || !input.tenantValid || !input.lineageValid) return "FREEZE";
  if (input.missingRiskCertification) return "ESCALATE";
  if (!input.riskValid) return "ESCALATE";
  if (!input.branchScopeValid) return "FREEZE";
  if (!input.boundsValid) return "LIMIT_SCOPE";
  return "PASS";
}

function escalationStateFor(status: BranchReplayStatus): BranchReplayValidation["escalationState"] {
  switch (status) {
    case "PASS":
      return "NONE";
    case "LIMIT_SCOPE":
      return "LIMIT_SCOPE";
    case "ESCALATE":
      return "ESCALATE";
    case "FREEZE":
      return "FREEZE";
  }
}

export function validateBranchReplay(input: BranchReplayInput): BranchReplayValidation {
  const reasons: BranchReplayReasonCode[] = [];
  const contractValid = validContract(input, reasons);
  const boundaryValid = validBoundary(input.sealedContract, reasons);
  const riskValid = validRiskCertification(input, reasons);
  const branchScopeValid = validBranchScope(input, reasons);
  const boundsValid = validateReplayBounds(input, reasons);
  const tenantValid = validTenant(input, reasons);
  const lineageValid = validLineage(input, reasons);
  const missingRiskCertification = input.request.riskCertificationReference.length === 0;
  const status = resolveStatus({
    contractValid,
    boundaryValid,
    riskValid,
    branchScopeValid,
    boundsValid,
    tenantValid,
    lineageValid,
    missingRiskCertification,
  });

  return Object.freeze({
    replayStatus: status,
    reasonCodes: normalizeStrings(reasons) as readonly BranchReplayReasonCode[],
    branchCount: input.request.branchIds.length,
    replayDepth: Math.min(input.request.replayDepth, MAX_REPLAY_DEPTH),
    escalationState: escalationStateFor(status),
    deterministic: true as const,
    readOnly: true as const,
    authorityBounded: boundaryValid,
    executionImpossible: boundaryValid,
  });
}

function reconstructBranches(request: ReplayRequest, contract?: SealedSimulationBoundaryRecord): readonly string[] {
  const approved = new Set(approvedBranches(contract));
  return Object.freeze(normalizeStrings(request.branchIds).filter((branchId) => approved.has(branchId)));
}

function lineageHash(input: BranchReplayInput, reconstructedBranches: readonly string[]): string {
  return hashConfidenceValue("branch-replay-lineage", canonicalizeConfidenceToString({
    contractHash: input.sealedContract?.contract.immutableHash ?? "",
    lineageReferenceIds: normalizeStrings(input.lineageReferenceIds),
    replayReferenceIds: normalizeStrings(input.request.replayReferenceIds),
    reconstructedBranches,
  }));
}

function escalationReason(validation: BranchReplayValidation): string | undefined {
  if (validation.replayStatus === "PASS") return undefined;
  return validation.reasonCodes.join(",");
}

export function replayBranches(input: BranchReplayInput): ReplayResult {
  const validation = validateBranchReplay(input);
  const reconstructedBranches = reconstructBranches(input.request, input.sealedContract);
  const replayLineageHash = lineageHash(input, reconstructedBranches);
  const deterministicCore = Object.freeze({
    request: Object.freeze({
      simulationId: input.request.simulationId,
      contractId: input.request.contractId,
      replayReferenceIds: normalizeStrings(input.request.replayReferenceIds),
      replayDepth: input.request.replayDepth,
      branchIds: normalizeStrings(input.request.branchIds),
      riskCertificationReference: input.request.riskCertificationReference,
      replayType: input.request.replayType,
    }),
    contractHash: input.sealedContract?.contract.immutableHash ?? "",
    reconstructedBranches,
    replayLineageHash,
    validationStatus: validation.replayStatus,
  });
  const deterministicHash = hashConfidenceValue("branch-replay-deterministic", canonicalizeConfidenceToString(deterministicCore));
  const replayCore = Object.freeze({
    simulationId: input.request.simulationId,
    replayType: input.request.replayType,
    replayStatus: validation.replayStatus,
    deterministicHash,
    reconstructedBranches,
    replayLineageHash,
    branchCount: reconstructedBranches.length,
    replayDepth: validation.replayDepth,
    escalationReason: escalationReason(validation),
  });
  const replayHash = hashConfidenceValue("branch-replay-result", canonicalizeConfidenceToString(replayCore));

  return Object.freeze({
    replayId: hashConfidenceValue("branch-replay-id", replayHash),
    ...replayCore,
    replayHash,
  });
}

export function buildBranchReplayObservability(
  result: ReplayResult,
  validation: BranchReplayValidation,
): BranchReplayObservability {
  return Object.freeze({
    replayId: result.replayId,
    replayType: result.replayType,
    replayDepth: result.replayDepth,
    branchCount: result.branchCount,
    replayHash: result.replayHash,
    replayStatus: result.replayStatus,
    escalationState: validation.escalationState,
  });
}

export function sealBranchReplay(input: BranchReplayInput): SealedBranchReplayRecord {
  const validation = validateBranchReplay(input);
  const result = replayBranches(input);
  const observability = buildBranchReplayObservability(result, validation);

  return Object.freeze({
    result,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    advisoryOnly: true as const,
    executionAuthorized: false as const,
    runtimeMutationAllowed: false as const,
    schedulingAllowed: false as const,
    authorityMutationAllowed: false as const,
    persistenceAllowed: false as const,
    branchGenerationAllowed: false as const,
  });
}

export const BranchReplayValidator = Object.freeze({
  validate: validateBranchReplay,
});

export const BranchReplayEngine = Object.freeze({
  replay: replayBranches,
  seal: sealBranchReplay,
});

export const BranchReplayObservabilityService = Object.freeze({
  build: buildBranchReplayObservability,
});
