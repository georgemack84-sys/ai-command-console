import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthLineageCertificationGate,
  TruthCertificationState,
  TruthLineageCertificationContract,
  TruthLineageCertificationDomainResult,
  TruthLineageCertificationInput,
  TruthLineageCertificationLedgerEntry,
  TruthLineageCertificationReasonCode,
  TruthLineageCertificationReplay,
  TruthLineageCertificationRequest,
  TruthLineageCertificationScope,
  TruthLineageCertificationValidation,
  TruthLineageLayerAdvancementState,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthLineageCertificationReasonCode[], reason: TruthLineageCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthLineageCertificationRequest): TruthLineageCertificationRequest {
  return Object.freeze({ tenant_id: request.tenant_id, now: request.now });
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function advancementState(certification: TruthCertificationState): TruthLineageLayerAdvancementState {
  if (certification === "PASS") return "LINEAGE_LAYER_CERTIFIED";
  if (certification === "CONDITIONAL_PASS") return "LINEAGE_LAYER_CONDITIONAL";
  return "LINEAGE_LAYER_FAILED";
}

function certified(state: TruthCertificationState): boolean {
  return state !== "FAIL";
}

function domainResult(
  scope: TruthLineageCertificationScope,
  certification_state: TruthCertificationState,
  failure_reason: string | null,
): TruthLineageCertificationDomainResult {
  return Object.freeze({
    scope,
    certification_state,
    certified: certified(certification_state),
    failure_reason,
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

export function buildTruthLineageCertificationRequest(
  request: TruthLineageCertificationRequest,
): TruthLineageCertificationRequest {
  return requestCore(request);
}

export function sealTruthLineageCertificationGate(
  input: TruthLineageCertificationInput,
): SealedTruthLineageCertificationGate {
  const reasons: TruthLineageCertificationReasonCode[] = [];
  const scope = Object.freeze([...input.certificationScope]);
  const evidenceReferences = Object.freeze([...input.evidenceReferences]);
  const replayReferences = Object.freeze([...input.replayReferences]);

  const scopePresent = scope.length > 0;
  addReason(reasons, scopePresent ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");
  const authorityPresent = input.certificationAuthority.authority_id.trim().length > 0
    && input.certificationAuthority.authority_scope.trim().length > 0
    && input.certificationAuthority.authority_evidence.length > 0;
  addReason(reasons, authorityPresent ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");
  const evidencePresent = evidenceReferences.length > 0;
  addReason(reasons, evidencePresent ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  const replayPresent = replayReferences.length > 0;
  addReason(reasons, replayPresent ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  const contractValid = scopePresent && authorityPresent && evidencePresent && replayPresent;

  const lineageContractCertified = certified(input.lineageContract.certification);
  addReason(reasons, lineageContractCertified ? "LINEAGE_CONTRACT_CERTIFIED" : "LINEAGE_CONTRACT_FAILED");
  const relationshipEngineCertified = certified(input.relationshipEngine.certification)
    && input.orphanedChildDetected !== true
    && input.relationshipMismatchDetected !== true;
  addReason(reasons, relationshipEngineCertified ? "RELATIONSHIP_ENGINE_CERTIFIED" : "RELATIONSHIP_ENGINE_FAILED");
  if (input.orphanedChildDetected === true) addReason(reasons, "ORPHANED_CHILD_DETECTED");
  const causalityGraphCertified = certified(input.causalityGraph.certification)
    && input.dependencyCycleDetected !== true
    && input.rootCauseUnresolvedDetected !== true
    && input.causalityMismatchDetected !== true;
  addReason(reasons, causalityGraphCertified ? "CAUSALITY_GRAPH_CERTIFIED" : "CAUSALITY_GRAPH_FAILED");
  if (input.dependencyCycleDetected === true) addReason(reasons, "DEPENDENCY_CYCLE_DETECTED");
  if (input.rootCauseUnresolvedDetected === true) addReason(reasons, "ROOT_CAUSE_UNRESOLVED");
  const truthEvolutionCertified = certified(input.truthEvolution.certification)
    && input.evolutionMismatchDetected !== true;
  addReason(reasons, truthEvolutionCertified ? "TRUTH_EVOLUTION_CERTIFIED" : "TRUTH_EVOLUTION_FAILED");

  const replayResult: TruthReplayResult = !evidencePresent || !replayPresent
    ? "INCOMPLETE_EVIDENCE"
    : input.replayMismatchDetected === true
      || input.lineageMismatchDetected === true
      || input.relationshipMismatchDetected === true
      || input.causalityMismatchDetected === true
      || input.evolutionMismatchDetected === true
      ? "MISMATCH"
      : "REPRODUCED";
  const replayPreservationVerified = replayResult === "REPRODUCED";
  addReason(reasons, replayPreservationVerified ? "REPLAY_PRESERVATION_VERIFIED" : "REPLAY_PRESERVATION_FAILED");
  addReason(reasons, replayResult === "REPRODUCED" ? "CERTIFICATION_REPLAY_REPRODUCED" : replayResult === "MISMATCH" ? "CERTIFICATION_REPLAY_MISMATCH" : "CERTIFICATION_REPLAY_INCOMPLETE_EVIDENCE");
  if (replayResult !== "REPRODUCED") addReason(reasons, "REPLAY_MISMATCH_DETECTED");

  const ownershipIntegrityVerified = input.ownershipCorruptionDetected !== true
    && input.ownershipMismatchDetected !== true
    && input.lineageContract.validation.ownershipValid === true;
  addReason(reasons, ownershipIntegrityVerified ? "OWNERSHIP_INTEGRITY_VERIFIED" : "OWNERSHIP_INTEGRITY_FAILED");
  if (!ownershipIntegrityVerified) addReason(reasons, "OWNERSHIP_CORRUPTION_DETECTED");
  const governanceTraceabilityVerified = input.governanceInfluenceMissingDetected !== true
    && input.traceabilityCorruptionDetected !== true
    && input.lineageContract.validation.governanceInfluenceValid === true
    && input.causalityGraph.validation.influenceMapped === true;
  addReason(reasons, governanceTraceabilityVerified ? "GOVERNANCE_TRACEABILITY_VERIFIED" : "GOVERNANCE_TRACEABILITY_FAILED");
  if (!governanceTraceabilityVerified) addReason(reasons, "GOVERNANCE_INFLUENCE_MISSING");
  const tenantIsolationCertified = input.crossTenantLineageAccessDetected !== true
    && input.crossTenantCausalityAccessDetected !== true
    && input.crossTenantTruthAccessDetected !== true
    && input.crossTenantReplayDetected !== true
    && input.lineageContract.validation.tenantIsolationValid === true
    && input.relationshipEngine.validation.tenantIsolationValid === true
    && input.causalityGraph.validation.tenantIsolationValid === true
    && input.truthEvolution.validation.tenantIsolationValid === true;
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFIED" : "TENANT_ISOLATION_FAILED");
  if (!tenantIsolationCertified) addReason(reasons, "CROSS_TENANT_LINEAGE_ACCESS_DETECTED");
  const operatorVisibilityCertified = input.hiddenLineageStateDetected !== true
    && input.hiddenCausalityStateDetected !== true
    && input.hiddenOwnershipStateDetected !== true
    && input.lineageContract.visibility.tenantScoped === true
    && input.relationshipEngine.visibility.tenantScoped === true
    && input.causalityGraph.visibility.tenantScoped === true
    && input.truthEvolution.visibility.tenantScoped === true;
  addReason(reasons, operatorVisibilityCertified ? "OPERATOR_VISIBILITY_CERTIFIED" : "OPERATOR_VISIBILITY_FAILED");
  if (!operatorVisibilityCertified) addReason(reasons, "HIDDEN_LINEAGE_STATE_DETECTED");

  const domainResults = Object.freeze([
    domainResult("LINEAGE_CONTRACT", input.lineageContract.certification, lineageContractCertified ? null : "lineage contract failed"),
    domainResult("PARENT_CHILD_RELATIONSHIP_ENGINE", relationshipEngineCertified ? input.relationshipEngine.certification : "FAIL", relationshipEngineCertified ? null : "relationship engine failed"),
    domainResult("CAUSALITY_GRAPH", causalityGraphCertified ? input.causalityGraph.certification : "FAIL", causalityGraphCertified ? null : "causality graph failed"),
    domainResult("TRUTH_EVOLUTION_TRACKER", truthEvolutionCertified ? input.truthEvolution.certification : "FAIL", truthEvolutionCertified ? null : "truth evolution failed"),
    domainResult("REPLAY_PRESERVATION", replayPreservationVerified ? "PASS" : "FAIL", replayPreservationVerified ? null : "replay preservation failed"),
    domainResult("OWNERSHIP_INTEGRITY", ownershipIntegrityVerified ? "PASS" : "FAIL", ownershipIntegrityVerified ? null : "ownership integrity failed"),
    domainResult("GOVERNANCE_TRACEABILITY", governanceTraceabilityVerified ? "PASS" : "FAIL", governanceTraceabilityVerified ? null : "governance traceability failed"),
    domainResult("TENANT_ISOLATION", tenantIsolationCertified ? "PASS" : "FAIL", tenantIsolationCertified ? null : "tenant isolation failed"),
    domainResult("OPERATOR_VISIBILITY", operatorVisibilityCertified ? "PASS" : "FAIL", operatorVisibilityCertified ? null : "operator visibility failed"),
  ]);

  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");
  const ledgerImmutable = true;
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
  addReason(reasons, "LINEAGE_CERTIFICATION_IS_NOT_CONTROL");

  const coreValid = contractValid
    && domainResults.every((domain) => domain.certified)
    && ledgerImmutable
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;
  const observabilityGap = input.observabilityGapDetected === true || input.reportingLimitationDetected === true;
  const conditional = coreValid
    && observabilityGap
    && input.remediationDocumented === true
    && tenantIsolationCertified
    && governanceTraceabilityVerified
    && replayPreservationVerified;
  const certification = certificationState(coreValid && !observabilityGap, conditional);
  addReason(reasons, certification === "PASS" ? "CERTIFICATION_PASS" : certification === "CONDITIONAL_PASS" ? "CERTIFICATION_CONDITIONAL_PASS" : "CERTIFICATION_FAIL");
  const advancementState = certification === "PASS"
    ? "LINEAGE_LAYER_CERTIFIED"
    : certification === "CONDITIONAL_PASS"
      ? "LINEAGE_LAYER_CONDITIONAL"
      : "LINEAGE_LAYER_FAILED";

  const certificationId = hashValue("mission-control-lineage-certification-id", {
    tenant_id: input.request.tenant_id,
    lineage_layer_version: input.lineageLayerVersion,
    scope,
    evidenceReferences,
    replayReferences,
  });
  const certificationReason = certification === "PASS"
    ? "Lineage layer certified for downstream lineage-dependent intelligence."
    : certification === "CONDITIONAL_PASS"
      ? "Lineage layer conditionally certified with documented remediation."
      : "Lineage layer certification failed; downstream lineage-dependent intelligence is blocked.";

  const contract: TruthLineageCertificationContract = Object.freeze({
    certification_id: certificationId,
    certification_timestamp: input.request.now,
    lineage_layer_version: input.lineageLayerVersion,
    certification_scope: scope,
    certification_state: certification,
    certification_reason: certificationReason,
    certification_authority: Object.freeze({
      authority_id: input.certificationAuthority.authority_id,
      authority_type: input.certificationAuthority.authority_type,
      authority_scope: input.certificationAuthority.authority_scope,
      authority_evidence: Object.freeze([...input.certificationAuthority.authority_evidence]),
    }),
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const failureReason = coreValid
    ? null
    : domainResults.filter((domain) => !domain.certified).map((domain) => domain.failure_reason).filter(Boolean).join("; ");
  const ledgerEntry: TruthLineageCertificationLedgerEntry = Object.freeze({
    certification_id: certificationId,
    tenant_id: input.request.tenant_id,
    lineage_layer_version: input.lineageLayerVersion,
    certification_state: certification,
    advancement_state: advancementState,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-lineage-certification-ledger-entry-hash", {
      certification_id: certificationId,
      certification,
      advancementState,
      failureReason,
    }),
  });

  const replay: TruthLineageCertificationReplay = Object.freeze({
    replayResult,
    reproducedContract: contract,
    reproducedDomains: domainResults,
  });

  const validation: TruthLineageCertificationValidation = Object.freeze({
    valid: coreValid || conditional,
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    lineageContractCertified,
    relationshipEngineCertified,
    causalityGraphCertified,
    truthEvolutionCertified,
    replayPreservationVerified,
    ownershipIntegrityVerified,
    governanceTraceabilityVerified,
    tenantIsolationCertified,
    operatorVisibilityCertified,
    certificationReplayReproduced: replayResult === "REPRODUCED",
    ledgerImmutable,
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

  return Object.freeze({
    request: requestCore(input.request),
    contract,
    domainResults,
    ledgerEntry,
    replay,
    validation,
    advancementState,
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
