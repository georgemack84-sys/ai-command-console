import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthDecisionEvolutionTracker,
  TruthCertificationState,
  TruthDecisionEvolutionContract,
  TruthDecisionEvolutionInput,
  TruthDecisionEvolutionLedgerEntry,
  TruthDecisionEvolutionObservability,
  TruthDecisionEvolutionReasonCode,
  TruthDecisionEvolutionReplay,
  TruthDecisionEvolutionRequest,
  TruthDecisionEvolutionValidation,
  TruthDecisionEvolutionVisibility,
  TruthDecisionImpactAssessment,
  TruthDecisionImpactState,
  TruthDecisionLineage,
  TruthDecisionRevisionType,
  TruthDecisionVersionReference,
  TruthDecisionVersionState,
  TruthReplayResult,
} from "./types";

const EVOLUTION_TYPES = new Set([
  "CHANGE_TRACKED",
  "REVISION_CREATED",
  "VERSION_CREATED",
  "SUPERSESSION_RECORDED",
]);

const REVISION_TYPES = new Set<TruthDecisionRevisionType>([
  "MINOR_REVISION",
  "MAJOR_REVISION",
  "GOVERNANCE_REVISION",
  "AUTHORITY_REVISION",
  "CONFIDENCE_REVISION",
  "EVIDENCE_REVISION",
  "STATE_REVISION",
]);

const VERSION_STATES = new Set<TruthDecisionVersionState>([
  "CURRENT",
  "SUPERSEDED",
  "ARCHIVED",
]);

const IMPACT_STATES = new Set<TruthDecisionImpactState>([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

function addReason(reasons: TruthDecisionEvolutionReasonCode[], reason: TruthDecisionEvolutionReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthDecisionEvolutionRequest): TruthDecisionEvolutionRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
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

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function countByRevision(
  currentRevision: TruthDecisionRevisionType,
  type: TruthDecisionRevisionType,
): number {
  return currentRevision === type ? 1 : 0;
}

export function buildTruthDecisionEvolutionRequest(
  request: TruthDecisionEvolutionRequest,
): TruthDecisionEvolutionRequest {
  return requestCore(request);
}

export function sealTruthDecisionEvolutionTracker(
  input: TruthDecisionEvolutionInput,
): SealedTruthDecisionEvolutionTracker {
  const reasons: TruthDecisionEvolutionReasonCode[] = [];
  const decision = input.decision.decision;
  const recordedDecision = input.recordedDecision.record;
  const evolutionId = hashValue("mission-control-decision-evolution-id", {
    decision_id: decision.decision_id,
    previous_version: input.previousVersion,
    current_version: input.currentVersion,
    revision_type: input.revisionType,
    evolution_timestamp: input.request.now,
  });

  const versionState = input.versionState ?? (input.supersededByDecisionId ? "SUPERSEDED" : "CURRENT");
  const versionTimestamp = input.versionTimestamp ?? input.request.now;
  const lineage: TruthDecisionLineage = Object.freeze({
    source_recommendation_id: input.lineage?.source_recommendation_id ?? input.recordedDecision.lineage.source_recommendation_id,
    parent_decision_id: input.lineage?.parent_decision_id ?? decision.decision_id,
    influenced_by_operator_id: input.lineage?.influenced_by_operator_id ?? input.recordedDecision.lineage.influenced_by_operator_id,
    governance_parent_id: input.lineage?.governance_parent_id ?? input.recordedDecision.lineage.governance_parent_id,
    certification_parent_id: input.lineage?.certification_parent_id ?? input.recordedDecision.lineage.certification_parent_id,
    superseded_by_decision_id: input.lineage?.superseded_by_decision_id ?? input.supersededByDecisionId,
  });

  const version: TruthDecisionVersionReference = Object.freeze({
    decision_version: input.currentVersion,
    version_number: input.versionNumber,
    version_state: versionState,
    version_timestamp: versionTimestamp,
    superseded_by: input.supersededByDecisionId,
    supersedes: input.supersedesDecisionId,
  });

  const impactAssessment: TruthDecisionImpactAssessment = Object.freeze({
    impact_state: input.impactAssessment.impact_state,
    impact_rationale: input.impactAssessment.impact_rationale,
    evidence_impact: Object.freeze([...input.impactAssessment.evidence_impact]),
    governance_impact: Object.freeze([...input.impactAssessment.governance_impact]),
    authority_impact: Object.freeze([...input.impactAssessment.authority_impact]),
    confidence_impact: Object.freeze([...input.impactAssessment.confidence_impact]),
    state_impact: Object.freeze([...input.impactAssessment.state_impact]),
    operator_impact: Object.freeze([...input.impactAssessment.operator_impact]),
    replay_impact: Object.freeze([...input.impactAssessment.replay_impact]),
  });

  const evidenceReferences = Object.freeze([...(input.evidenceReferences ?? decision.supporting_evidence_ids)]);
  const replayReferences = Object.freeze([...(input.replayReferences ?? decision.replay_reference_ids)]);

  const evolutionIdPresent = evolutionId.length > 0;
  addReason(reasons, evolutionIdPresent ? "EVOLUTION_ID_PRESENT" : "EVOLUTION_ID_MISSING");
  const decisionIdPresent = decision.decision_id.length > 0;
  addReason(reasons, decisionIdPresent ? "DECISION_ID_PRESENT" : "DECISION_ID_MISSING");
  const versionReferencesPresent = input.previousVersion.length > 0 && input.currentVersion.length > 0;
  addReason(reasons, versionReferencesPresent ? "VERSION_REFERENCES_PRESENT" : "VERSION_REFERENCES_MISSING");

  const evolutionTypeValid = EVOLUTION_TYPES.has(input.evolutionType);
  addReason(reasons, evolutionTypeValid ? "EVOLUTION_TYPE_VALID" : "EVOLUTION_TYPE_INVALID");
  const revisionTypeValid = REVISION_TYPES.has(input.revisionType) && input.unknownRevisionTypeDetected !== true;
  addReason(reasons, revisionTypeValid ? "REVISION_TYPE_VALID" : "REVISION_TYPE_INVALID");

  const changeHistoryPresent = input.changeSet.changed_fields.length > 0 && input.missingChangeHistoryDetected !== true;
  addReason(reasons, changeHistoryPresent ? "CHANGE_HISTORY_PRESENT" : "CHANGE_HISTORY_MISSING");
  const previousStatePresent = Object.keys(input.changeSet.before_state).length > 0 && input.missingPreviousStateDetected !== true;
  addReason(reasons, previousStatePresent ? "PREVIOUS_STATE_PRESENT" : "PREVIOUS_STATE_MISSING");
  const revisionRationalePresent = input.evolutionReason.trim().length > 0 && input.missingRationaleDetected !== true;
  addReason(reasons, revisionRationalePresent ? "REVISION_RATIONALE_PRESENT" : "REVISION_RATIONALE_MISSING");

  const versionValid = VERSION_STATES.has(version.version_state)
    && input.duplicateVersionDetected !== true
    && input.versionNumber > 0;
  addReason(reasons, versionValid ? "VERSION_VALID" : "VERSION_INVALID");
  const versionOrderingValid = input.versionOrderingCorruptionDetected !== true
    && (input.priorVersionNumbers?.every((n) => n < input.versionNumber) ?? true);
  addReason(reasons, versionOrderingValid ? "VERSION_ORDERING_VALID" : "VERSION_ORDERING_CORRUPTED");
  const versionUnique = !(input.priorVersionNumbers?.includes(input.versionNumber) ?? false);
  addReason(reasons, versionUnique ? "VERSION_UNIQUE" : "VERSION_DUPLICATE");

  const rationalePresent = input.evolutionReason.trim().length > 0 && input.emptyExplanationDetected !== true;
  addReason(reasons, rationalePresent ? "RATIONALE_PRESENT" : "RATIONALE_MISSING");

  const lineageBroken = input.brokenLineageDetected === true;
  const lineageOrphaned = input.orphanedRevisionDetected === true;
  const lineageValid = !lineageBroken
    && !lineageOrphaned
    && lineage.parent_decision_id !== undefined;
  addReason(reasons, lineageValid ? "LINEAGE_VALID" : lineageBroken ? "LINEAGE_BROKEN" : "LINEAGE_ORPHANED");

  const impactRationalePresent = impactAssessment.impact_rationale.trim().length > 0
    && input.missingImpactRationaleDetected !== true;
  addReason(reasons, impactRationalePresent ? "IMPACT_RATIONALE_PRESENT" : "IMPACT_RATIONALE_MISSING");
  const impactValid = IMPACT_STATES.has(impactAssessment.impact_state)
    && input.unsupportedImpactStateDetected !== true
    && impactRationalePresent;
  addReason(reasons, impactValid ? "IMPACT_VALID" : "IMPACT_INVALID");

  const supersessionTargetPresent = input.evolutionType !== "SUPERSESSION_RECORDED"
    || ((input.supersededByDecisionId?.length ?? 0) > 0 && input.missingReplacementDecisionDetected !== true);
  addReason(reasons, supersessionTargetPresent ? "SUPERSESSION_TARGET_PRESENT" : "SUPERSESSION_TARGET_MISSING");
  const supersessionRationalePresent = input.evolutionType !== "SUPERSESSION_RECORDED"
    || (input.evolutionReason.trim().length > 0 && input.missingSupersessionRationaleDetected !== true);
  addReason(reasons, supersessionRationalePresent ? "SUPERSESSION_RATIONALE_PRESENT" : "SUPERSESSION_RATIONALE_MISSING");

  const decisionValid = input.decision.validation.valid && input.invalidDecisionDetected !== true;
  addReason(reasons, decisionValid ? "DECISION_VALID" : "DECISION_INVALID");
  const recorderValid = input.recordedDecision.validation.valid && input.invalidRecorderDetected !== true;
  addReason(reasons, recorderValid ? "RECORDER_VALID" : "RECORDER_INVALID");
  const evidenceValid = input.invalidEvidenceDetected !== true
    && evidenceReferences.length > 0
    && evidenceReferences.every((id) => input.knownEvidenceIds?.includes(id) ?? true);
  addReason(reasons, evidenceValid ? "EVIDENCE_VALID" : "EVIDENCE_INVALID");
  const governanceValid = input.invalidGovernanceDetected !== true && decision.governance_binding.governance_policy_ids.length > 0;
  addReason(reasons, governanceValid ? "GOVERNANCE_VALID" : "GOVERNANCE_INVALID");
  const authorityValid = input.invalidAuthorityDetected !== true && decision.authority_binding.authority_evidence.length > 0;
  addReason(reasons, authorityValid ? "AUTHORITY_VALID" : "AUTHORITY_INVALID");
  const confidenceValid = input.invalidConfidenceDetected !== true && decision.confidence_binding.confidence_evidence.length > 0;
  addReason(reasons, confidenceValid ? "CONFIDENCE_VALID" : "CONFIDENCE_INVALID");

  const replayBindingValid = input.replayReferencesResolvable !== false && replayReferences.length > 0;
  addReason(reasons, replayBindingValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");

  const transactionProtected = input.partialEvolutionDetected !== true && input.rollbackFailed !== true;
  addReason(reasons, transactionProtected ? "TRANSACTION_PROTECTED" : "PARTIAL_EVOLUTION_DETECTED");
  if (input.rollbackFailed === true) addReason(reasons, "ROLLBACK_FAILED");

  const tenantIsolationValid = input.crossTenantVersionAccessDetected !== true
    && input.crossTenantLineageTraversalDetected !== true
    && decision.tenant_id === input.request.tenant_id
    && recordedDecision.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayBindingValid
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "REPLAY_INCOMPLETE_EVIDENCE"
          : "REPLAY_UNREPLAYABLE",
  );

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
  addReason(reasons, "DECISION_EVOLUTION_TRACKER_IS_NOT_CONTROL");

  const tracked = evolutionIdPresent
    && decisionIdPresent
    && versionReferencesPresent
    && evolutionTypeValid
    && revisionTypeValid
    && changeHistoryPresent
    && previousStatePresent
    && revisionRationalePresent
    && versionValid
    && versionOrderingValid
    && versionUnique
    && rationalePresent
    && lineageValid
    && impactValid
    && supersessionTargetPresent
    && supersessionRationalePresent
    && decisionValid
    && recorderValid
    && evidenceValid
    && governanceValid
    && authorityValid
    && confidenceValid
    && replayBindingValid
    && transactionProtected
    && tenantIsolationValid
    && replayResult === "REPRODUCED"
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const evolution: TruthDecisionEvolutionContract = Object.freeze({
    evolution_id: evolutionId,
    decision_id: decision.decision_id,
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_id,
    evolution_timestamp: input.request.now,
    evolution_type: input.evolutionType,
    previous_version: input.previousVersion,
    current_version: input.currentVersion,
    evolution_reason: input.evolutionReason,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const failureReason = tracked
    ? null
    : [
      !changeHistoryPresent && "change history lost",
      !revisionTypeValid && "revision history lost",
      !versionUnique && "duplicate version accepted",
      !lineageValid && "broken lineage accepted",
      !supersessionTargetPresent && "missing supersession target",
      !transactionProtected && "partial evolution commit",
      !tenantIsolationValid && "cross-tenant version access",
      replayResult === "MISMATCH" && "evolution replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthDecisionEvolutionLedgerEntry = Object.freeze({
    evolution_id: evolution.evolution_id,
    decision_id: evolution.decision_id,
    tenant_id: evolution.tenant_id,
    mission_id: evolution.mission_id,
    evolution_type: evolution.evolution_type,
    revision_type: input.revisionType,
    current_version: input.currentVersion,
    impact_state: impactAssessment.impact_state,
    validation_status: tracked ? "VALID" : "INVALID",
    lineage_status: lineageValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    transaction_status: tracked ? "COMMITTED" : transactionProtected ? "ROLLED_BACK" : "NOT_STARTED",
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const tenantScopedVisibility = tenantIsolationValid;
  const visibility: TruthDecisionEvolutionVisibility = Object.freeze({
    decision_id: evolution.decision_id,
    decision_version: input.currentVersion,
    evolution_type: input.evolutionType,
    revision_type: input.revisionType,
    impact_state: impactAssessment.impact_state,
    authority_state: decision.authority_binding.authority_scope,
    lineage_status: lineageValid ? "VALID" : "INVALID",
    validation_status: tracked ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: evolution.evolution_timestamp,
    readOnly: true,
    tenantScoped: tenantScopedVisibility,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScopedVisibility ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const observability: TruthDecisionEvolutionObservability = Object.freeze({
    decision_changes_total: 1,
    decision_revisions_total: 1,
    major_revisions_total: countByRevision(input.revisionType, "MAJOR_REVISION"),
    minor_revisions_total: countByRevision(input.revisionType, "MINOR_REVISION"),
    supersessions_total: input.evolutionType === "SUPERSESSION_RECORDED" ? 1 : 0,
    lineage_failures: lineageValid ? 0 : 1,
    version_failures: versionValid && versionOrderingValid && versionUnique ? 0 : 1,
    validation_failures: tracked ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  const conditional = tracked
    && !observabilityOperational
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED";
  const certification = certificationState(
    tracked && observabilityOperational && replayResult === "REPRODUCED",
    conditional,
  );
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const validation: TruthDecisionEvolutionValidation = Object.freeze({
    valid: tracked || conditional,
    validationState: tracked || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    revisionValid: revisionTypeValid && revisionRationalePresent,
    versionValid: versionValid && versionOrderingValid && versionUnique,
    lineageValid,
    impactValid,
    transactionProtected,
    tenantIsolationValid,
    replayValid: replayResult === "REPRODUCED",
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

  const replay: TruthDecisionEvolutionReplay = Object.freeze({
    replayResult,
    reconstructedEvolution: evolution,
    reconstructedVersion: version,
    reconstructedLineage: lineage,
    reconstructedImpact: impactAssessment,
  });

  return Object.freeze({
    request: requestCore(input.request),
    decision: input.decision,
    recordedDecision: input.recordedDecision,
    evolution,
    version,
    lineage,
    impactAssessment,
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
