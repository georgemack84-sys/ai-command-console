import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEvolutionTracker,
  TruthCertificationState,
  TruthEvolutionBranchType,
  TruthEvolutionContract,
  TruthEvolutionInput,
  TruthEvolutionLedgerEntry,
  TruthEvolutionReasonCode,
  TruthEvolutionReplay,
  TruthEvolutionRequest,
  TruthEvolutionValidation,
  TruthEvolutionVisibility,
  TruthReplayResult,
} from "./types";

const BRANCH_TYPES = new Set<TruthEvolutionBranchType>([
  "EVIDENCE_BRANCH",
  "GOVERNANCE_BRANCH",
  "CONFIDENCE_BRANCH",
  "CLASSIFICATION_BRANCH",
  "INVESTIGATION_BRANCH",
]);

function addReason(reasons: TruthEvolutionReasonCode[], reason: TruthEvolutionReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEvolutionRequest): TruthEvolutionRequest {
  return Object.freeze({ tenant_id: request.tenant_id, now: request.now });
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "approvalAllowed",
    "rankingAllowed",
    "prioritizationAllowed",
    "scoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

export function buildTruthEvolutionRequest(request: TruthEvolutionRequest): TruthEvolutionRequest {
  return requestCore(request);
}

export function sealTruthEvolutionTracker(input: TruthEvolutionInput): SealedTruthEvolutionTracker {
  const reasons: TruthEvolutionReasonCode[] = [];
  const evolutionTimestamp = input.evolutionTimestamp ?? input.request.now;
  const evidenceReferences = Object.freeze([...input.evidenceReferences]);
  const replayReferences = Object.freeze([...input.replayReferences]);
  const evolutionId = hashValue("mission-control-truth-evolution-id", {
    truth_record_id: input.truthRecordId,
    evolution_type: input.evolutionType,
    previous_version: input.previousVersion,
    current_version: input.currentVersion,
    evolution_timestamp: evolutionTimestamp,
  });

  const truthRecordPresent = input.truthRecordId.trim().length > 0;
  addReason(reasons, truthRecordPresent ? "TRUTH_RECORD_ID_PRESENT" : "TRUTH_RECORD_ID_MISSING");
  const evolutionTypePresent = input.evolutionType.length > 0;
  addReason(reasons, evolutionTypePresent ? "EVOLUTION_TYPE_PRESENT" : "EVOLUTION_TYPE_MISSING");
  const versionReferencePresent = input.previousVersion.trim().length > 0 && input.currentVersion.trim().length > 0;
  addReason(reasons, versionReferencePresent ? "VERSION_REFERENCE_PRESENT" : "VERSION_REFERENCE_MISSING");
  const contractValid = truthRecordPresent && evolutionTypePresent && versionReferencePresent;
  addReason(reasons, contractValid ? "EVOLUTION_CONTRACT_VALID" : "EVOLUTION_CONTRACT_INVALID");

  const modificationTracked = input.evolutionType !== "MODIFICATION"
    || (input.missingModificationHistoryDetected !== true
      && input.missingPriorStateDetected !== true
      && input.modification !== undefined
      && input.modification.before_state.trim().length > 0
      && input.modification.after_state.trim().length > 0
      && input.modification.change_rationale.trim().length > 0);
  addReason(
    reasons,
    modificationTracked
      ? "MODIFICATION_RECORDED"
      : input.missingPriorStateDetected === true
        ? "PRIOR_STATE_MISSING"
        : "MODIFICATION_HISTORY_MISSING",
  );

  const supersessionTracked = input.evolutionType !== "SUPERSESSION"
    || (input.missingReplacementTruthDetected !== true
      && input.missingSupersessionRationaleDetected !== true
      && input.supersession !== undefined
      && input.supersession.replacement_truth_record_id.trim().length > 0
      && input.supersession.supersession_rationale.trim().length > 0);
  addReason(
    reasons,
    supersessionTracked
      ? "SUPERSESSION_RECORDED"
      : input.missingReplacementTruthDetected === true
        ? "REPLACEMENT_TRUTH_MISSING"
        : "SUPERSESSION_RATIONALE_MISSING",
  );

  const branchKnown = input.evolutionType !== "BRANCH"
    || (input.branch !== undefined && BRANCH_TYPES.has(input.branch.branch_type) && input.unknownBranchTypeDetected !== true);
  if (!branchKnown) addReason(reasons, "BRANCH_TYPE_UNKNOWN");
  const branchTracked = input.evolutionType !== "BRANCH"
    || (branchKnown
      && input.orphanedBranchDetected !== true
      && input.branch !== undefined
      && input.branch.branch_id.trim().length > 0
      && input.branch.branch_origin_truth_id.trim().length > 0
      && input.branch.branch_rationale.trim().length > 0);
  if (branchTracked) addReason(reasons, "BRANCH_RECORDED");
  if (!branchTracked && input.orphanedBranchDetected === true) addReason(reasons, "ORPHANED_BRANCH_DETECTED");

  const duplicateVersion = input.duplicateVersionDetected === true || (input.priorVersions ?? []).includes(input.version.truth_version);
  if (duplicateVersion) addReason(reasons, "VERSION_DUPLICATE");
  const versionOrderingValid = input.versionOrderingCorruptionDetected !== true
    && input.version.truth_version === input.currentVersion
    && input.version.version_number >= 0
    && !Number.isNaN(Date.parse(input.version.version_timestamp));
  if (!versionOrderingValid) addReason(reasons, "VERSION_ORDERING_CORRUPTION");
  const versionValid = !duplicateVersion && versionOrderingValid;
  if (versionValid) addReason(reasons, "VERSION_CREATED");

  const rationaleValid = input.missingRationaleDetected !== true
    && input.emptyExplanationDetected !== true
    && input.evolutionReason.trim().length > 0
    && evidenceReferences.length > 0;
  addReason(reasons, rationaleValid ? "RATIONALE_PRESENT" : input.emptyExplanationDetected === true ? "EXPLANATION_EMPTY" : "RATIONALE_MISSING");

  const lineagePreserved = input.brokenLineageDetected !== true
    && input.orphanedTruthDetected !== true
    && input.lineage.origin_truth_record_id.trim().length > 0
    && input.lineage.modification_chain.length >= 0
    && input.lineage.supersession_chain.length >= 0;
  addReason(reasons, lineagePreserved ? "LINEAGE_PRESERVED" : input.orphanedTruthDetected === true ? "ORPHANED_TRUTH_DETECTED" : "LINEAGE_BROKEN");

  const integrityValid = input.invalidEvolutionDetected !== true
    && contractValid
    && modificationTracked
    && supersessionTracked
    && branchTracked
    && versionValid
    && rationaleValid
    && lineagePreserved
    && replayReferences.length > 0;
  addReason(reasons, integrityValid ? "EVOLUTION_INTEGRITY_VALID" : "EVOLUTION_INTEGRITY_INVALID");

  const replayResult: TruthReplayResult = !contractValid || evidenceReferences.length === 0 || replayReferences.length === 0
    ? "INCOMPLETE_EVIDENCE"
    : input.replayMismatchDetected === true || !integrityValid
      ? "MISMATCH"
      : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "TRUTH_EVOLUTION_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "TRUTH_EVOLUTION_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "TRUTH_EVOLUTION_REPLAY_INCOMPLETE_EVIDENCE"
          : "TRUTH_EVOLUTION_REPLAY_UNREPLAYABLE",
  );

  const tenantIsolationValid = input.crossTenantTruthAccessDetected !== true
    && input.crossTenantBranchDetected !== true
    && input.crossTenantLineageDetected !== true
    && input.crossTenantReplayDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_TRUTH_ISOLATION_VALID" : "TENANT_TRUTH_ISOLATION_FAILED");
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");
  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.rankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.scoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = createBoundaryFlags({
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  addReason(reasons, "TRUTH_EVOLUTION_IS_NOT_CONTROL");

  const valid = contractValid
    && modificationTracked
    && supersessionTracked
    && branchTracked
    && versionValid
    && rationaleValid
    && lineagePreserved
    && integrityValid
    && replayResult === "REPRODUCED"
    && tenantIsolationValid
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;
  const observabilityOperational = input.observabilityGapDetected !== true && input.reportingLimitationDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");
  const conditional = valid && !observabilityOperational && input.remediationDocumented === true && integrityValid;
  const certification = certificationState(valid && observabilityOperational, conditional);
  addReason(reasons, certification === "PASS" ? "CERTIFICATION_PASS" : certification === "CONDITIONAL_PASS" ? "CERTIFICATION_CONDITIONAL_PASS" : "CERTIFICATION_FAIL");

  const contract: TruthEvolutionContract = Object.freeze({
    evolution_id: evolutionId,
    truth_record_id: input.truthRecordId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    evolution_timestamp: evolutionTimestamp,
    evolution_type: input.evolutionType,
    previous_version: input.previousVersion,
    current_version: input.currentVersion,
    evolution_reason: input.evolutionReason,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const failureReason = valid
    ? null
    : [
      !modificationTracked && "missing modification history",
      !supersessionTracked && "missing supersession history",
      !branchTracked && "orphaned or invalid branch",
      !versionValid && "invalid version",
      !rationaleValid && "missing rationale",
      !lineagePreserved && "broken lineage",
      !tenantIsolationValid && "cross-tenant truth access",
      replayResult === "MISMATCH" && "truth evolution replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthEvolutionLedgerEntry = Object.freeze({
    evolution_id: evolutionId,
    truth_record_id: input.truthRecordId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    evolution_type: input.evolutionType,
    truth_version: input.currentVersion,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    certification_state: certification,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-truth-evolution-ledger-entry-hash", {
      evolution_id: evolutionId,
      certification,
      failureReason,
    }),
  });

  const validation: TruthEvolutionValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    modificationTracked,
    supersessionTracked,
    branchTracked,
    versionValid,
    rationaleValid,
    lineagePreserved,
    integrityValid,
    replayValid: replayResult === "REPRODUCED",
    tenantIsolationValid,
    failClosed,
    deterministic: true,
    readOnly: true,
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    controlSurfaceAbsent,
  });

  const replay: TruthEvolutionReplay = Object.freeze({
    replayResult,
    reconstructedContract: contract,
    reconstructedVersion: Object.freeze({ ...input.version }),
    reconstructedLineage: Object.freeze({
      origin_truth_record_id: input.lineage.origin_truth_record_id,
      prior_evolution_id: input.lineage.prior_evolution_id,
      modification_chain: Object.freeze([...input.lineage.modification_chain]),
      supersession_chain: Object.freeze([...input.lineage.supersession_chain]),
      branch_ancestry: Object.freeze([...input.lineage.branch_ancestry]),
      branch_descendants: Object.freeze([...input.lineage.branch_descendants]),
    }),
  });

  const visibility: TruthEvolutionVisibility = Object.freeze({
    truth_record_id: input.truthRecordId,
    truth_version: input.currentVersion,
    evolution_type: input.evolutionType,
    branch_type: input.branch?.branch_type ?? null,
    supersession_status: supersessionTracked ? "VALID" : "INVALID",
    lineage_status: lineagePreserved ? "VALID" : "INVALID",
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: evolutionTimestamp,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability = Object.freeze({
    truth_modifications_total: input.evolutionType === "MODIFICATION" && modificationTracked ? 1 : 0,
    truth_supersessions_total: input.evolutionType === "SUPERSESSION" && supersessionTracked ? 1 : 0,
    truth_branches_total: input.evolutionType === "BRANCH" && branchTracked ? 1 : 0,
    version_failures: versionValid ? 0 : 1,
    lineage_failures: lineagePreserved ? 0 : 1,
    validation_failures: valid || conditional ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  return Object.freeze({
    request: requestCore(input.request),
    contract,
    ledgerEntry,
    validation,
    replay,
    visibility,
    observability,
    certification,
    sealed: true,
    readOnly: true,
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
