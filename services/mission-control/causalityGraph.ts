import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthCausalityGraph,
  TruthCausalityDependencyMapping,
  TruthCausalityDependencyType,
  TruthCausalityGraphContract,
  TruthCausalityGraphInput,
  TruthCausalityGraphLedgerEntry,
  TruthCausalityGraphNode,
  TruthCausalityGraphObservability,
  TruthCausalityGraphReasonCode,
  TruthCausalityGraphReplay,
  TruthCausalityGraphRequest,
  TruthCausalityGraphValidation,
  TruthCausalityGraphVisibility,
  TruthCausalityInfluenceMapping,
  TruthCausalityObjectType,
  TruthCausalityType,
  TruthCertificationState,
  TruthReplayResult,
} from "./types";

const OBJECT_TYPES = new Set<TruthCausalityObjectType>([
  "POLICY",
  "RULE",
  "AUTHORITY",
  "EVALUATION",
  "ENFORCEMENT",
  "VIOLATION",
  "ESCALATION",
  "CONTAINMENT",
  "CERTIFICATION",
  "RUNTIME_ACTION",
]);

const CAUSALITY_TYPES = new Set<TruthCausalityType>([
  "CAUSES",
  "INFLUENCES",
  "DEPENDS_ON",
  "TRIGGERS",
  "BLOCKS",
  "ENABLES",
  "ESCALATES",
  "CONTAINS",
  "CERTIFIES",
  "AUTHORIZES",
]);

const DEPENDENCY_TYPES = new Set<TruthCausalityDependencyType>([
  "DIRECT_DEPENDENCY",
  "INDIRECT_DEPENDENCY",
  "RUNTIME_DEPENDENCY",
  "POLICY_DEPENDENCY",
  "AUTHORITY_DEPENDENCY",
  "CERTIFICATION_DEPENDENCY",
]);

function addReason(reasons: TruthCausalityGraphReasonCode[], reason: TruthCausalityGraphReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthCausalityGraphRequest): TruthCausalityGraphRequest {
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

function freezeInfluences(influences: readonly TruthCausalityInfluenceMapping[]): readonly TruthCausalityInfluenceMapping[] {
  return Object.freeze(influences.map((influence) => Object.freeze({ ...influence })));
}

function freezeDependencies(dependencies: readonly TruthCausalityDependencyMapping[]): readonly TruthCausalityDependencyMapping[] {
  return Object.freeze(dependencies.map((dependency) => Object.freeze({ ...dependency })));
}

function freezeChain(chain: readonly TruthCausalityGraphNode[]): readonly TruthCausalityGraphNode[] {
  return Object.freeze(chain.map((node) => Object.freeze({ ...node })));
}

export function buildTruthCausalityGraphRequest(request: TruthCausalityGraphRequest): TruthCausalityGraphRequest {
  return requestCore(request);
}

export function sealTruthCausalityGraph(input: TruthCausalityGraphInput): SealedTruthCausalityGraph {
  const reasons: TruthCausalityGraphReasonCode[] = [];
  const causalityTimestamp = input.causalityTimestamp ?? input.request.now;
  const replayReferences = Object.freeze([...input.replayReferences]);
  const influences = freezeInfluences(input.influences);
  const dependencies = freezeDependencies(input.dependencies);
  const causalChain = freezeChain(input.causalChain);

  const causalityHash = hashValue("mission-control-causality-graph-hash", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    source_object_id: input.sourceObjectId,
    source_object_type: input.sourceObjectType,
    target_object_id: input.targetObjectId,
    target_object_type: input.targetObjectType,
    causality_type: input.causalityType,
    causality_timestamp: causalityTimestamp,
    replay_references: replayReferences,
    influences,
    dependencies,
    root_cause: input.rootCause,
    causal_chain: causalChain,
  });
  const causalityId = hashValue("mission-control-causality-graph-id", {
    source_object_id: input.sourceObjectId,
    target_object_id: input.targetObjectId,
    causality_type: input.causalityType,
    causality_hash: causalityHash,
  });

  const sourceObjectIdPresent = input.sourceObjectId.trim().length > 0;
  addReason(reasons, sourceObjectIdPresent ? "SOURCE_OBJECT_ID_PRESENT" : "SOURCE_OBJECT_ID_MISSING");
  const targetObjectIdPresent = input.targetObjectId.trim().length > 0;
  addReason(reasons, targetObjectIdPresent ? "TARGET_OBJECT_ID_PRESENT" : "TARGET_OBJECT_ID_MISSING");
  const causalityTypePresent = input.causalityType.length > 0;
  addReason(reasons, causalityTypePresent ? "CAUSALITY_TYPE_PRESENT" : "CAUSALITY_TYPE_MISSING");
  const contractValid = sourceObjectIdPresent && targetObjectIdPresent && causalityTypePresent;
  addReason(reasons, contractValid ? "CAUSALITY_CONTRACT_VALID" : "CAUSALITY_CONTRACT_INVALID");

  const sourceRegistered = input.missingSourceDetected !== true
    && input.invalidSourceDetected !== true
    && sourceObjectIdPresent
    && OBJECT_TYPES.has(input.sourceObjectType);
  addReason(reasons, sourceRegistered ? "SOURCE_REGISTERED" : input.missingSourceDetected === true ? "SOURCE_MISSING" : "SOURCE_INVALID");
  const targetRegistered = input.missingTargetDetected !== true
    && input.invalidTargetDetected !== true
    && input.orphanedTargetDetected !== true
    && targetObjectIdPresent
    && OBJECT_TYPES.has(input.targetObjectType);
  addReason(reasons, targetRegistered ? "TARGET_REGISTERED" : input.orphanedTargetDetected === true ? "ORPHANED_TARGET_DETECTED" : input.missingTargetDetected === true ? "TARGET_MISSING" : "TARGET_INVALID");
  const causalityClassified = input.unknownCausalityTypeDetected !== true
    && input.multipleCausalityTypesDetected !== true
    && CAUSALITY_TYPES.has(input.causalityType);
  addReason(reasons, causalityClassified ? "CAUSALITY_CLASSIFIED" : input.multipleCausalityTypesDetected === true ? "CAUSALITY_TYPE_MULTIPLE" : "CAUSALITY_TYPE_UNKNOWN");
  const influenceMapped = input.missingInfluenceMappingDetected !== true
    && influences.length > 0
    && influences.every((influence) => (
      influence.influence_id.trim().length > 0
      && influence.influence_source_id.trim().length > 0
      && influence.influence_target_id.trim().length > 0
      && influence.influence_rationale.trim().length > 0
    ));
  addReason(reasons, influenceMapped ? "INFLUENCE_MAPPED" : "INFLUENCE_MISSING");

  const dependencyKnown = input.unknownDependencyDetected !== true
    && dependencies.every((dependency) => DEPENDENCY_TYPES.has(dependency.dependency_type));
  if (!dependencyKnown) addReason(reasons, "DEPENDENCY_UNKNOWN");
  const dependencyCycleFree = input.dependencyCycleDetected !== true;
  if (!dependencyCycleFree) addReason(reasons, "DEPENDENCY_CYCLE_DETECTED");
  const dependencyMapped = dependencyKnown
    && dependencyCycleFree
    && dependencies.length > 0
    && dependencies.every((dependency) => (
      dependency.dependency_id.trim().length > 0
      && dependency.dependency_source_id.trim().length > 0
      && dependency.dependency_target_id.trim().length > 0
      && dependency.dependency_rationale.trim().length > 0
    ));
  if (dependencyMapped) addReason(reasons, "DEPENDENCY_MAPPED");

  const rootCauseIdentified = input.rootCauseUnresolvedDetected !== true
    && input.rootCause.root_cause_id.trim().length > 0
    && input.rootCause.root_object_id.trim().length > 0
    && OBJECT_TYPES.has(input.rootCause.root_object_type)
    && input.rootCause.root_cause_rationale.trim().length > 0;
  addReason(reasons, rootCauseIdentified ? "ROOT_CAUSE_IDENTIFIED" : "ROOT_CAUSE_UNRESOLVED");
  const causalChainResolved = input.causalChainFailureDetected !== true
    && causalChain.length > 0
    && causalChain.every((node) => node.object_id.trim().length > 0 && OBJECT_TYPES.has(node.object_type));
  addReason(reasons, causalChainResolved ? "CAUSAL_CHAIN_RESOLVED" : "CAUSAL_CHAIN_FAILURE");
  const integrityValid = input.brokenCausalityDetected !== true
    && sourceRegistered
    && targetRegistered
    && causalityClassified
    && influenceMapped
    && dependencyMapped
    && rootCauseIdentified
    && causalChainResolved
    && replayReferences.length > 0;
  addReason(reasons, integrityValid ? "CAUSALITY_INTEGRITY_VALID" : "CAUSALITY_INTEGRITY_INVALID");

  const replayResult: TruthReplayResult = replayReferences.length === 0 || !contractValid
    ? "INCOMPLETE_EVIDENCE"
    : input.replayMismatchDetected === true || !integrityValid
      ? "MISMATCH"
      : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "CAUSALITY_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "CAUSALITY_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "CAUSALITY_REPLAY_INCOMPLETE_EVIDENCE"
          : "CAUSALITY_REPLAY_UNREPLAYABLE",
  );

  const tenantIsolationValid = input.crossTenantCausalityAccessDetected !== true
    && input.crossTenantDependencyDetected !== true
    && input.crossTenantInfluenceDetected !== true
    && input.crossTenantReplayDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_CAUSALITY_ISOLATION_VALID" : "TENANT_CAUSALITY_ISOLATION_FAILED");
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
  addReason(reasons, "CAUSALITY_GRAPH_IS_NOT_CONTROL");

  const valid = contractValid
    && sourceRegistered
    && targetRegistered
    && causalityClassified
    && influenceMapped
    && dependencyMapped
    && rootCauseIdentified
    && causalChainResolved
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

  const contract: TruthCausalityGraphContract = Object.freeze({
    causality_id: causalityId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    source_object_id: input.sourceObjectId,
    source_object_type: input.sourceObjectType,
    target_object_id: input.targetObjectId,
    target_object_type: input.targetObjectType,
    causality_type: input.causalityType,
    causality_timestamp: causalityTimestamp,
    causality_hash: causalityHash,
    replay_references: replayReferences,
  });

  const failureReason = valid
    ? null
    : [
      !sourceRegistered && "missing or invalid source",
      !targetRegistered && "missing, invalid, or orphaned target",
      !causalityClassified && "invalid causality type",
      !influenceMapped && "missing influence mapping",
      !dependencyMapped && "invalid dependency mapping",
      !rootCauseIdentified && "root cause unresolved",
      !causalChainResolved && "causal chain failure",
      !tenantIsolationValid && "cross-tenant causality access",
      replayResult === "MISMATCH" && "causality replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthCausalityGraphLedgerEntry = Object.freeze({
    causality_id: causalityId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    source_object_id: input.sourceObjectId,
    target_object_id: input.targetObjectId,
    causality_type: input.causalityType,
    root_cause_status: rootCauseIdentified ? "VALID" : "INVALID",
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    certification_state: certification,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-causality-graph-ledger-entry-hash", {
      causality_id: causalityId,
      causality_hash: causalityHash,
      certification,
      failureReason,
    }),
  });

  const validation: TruthCausalityGraphValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    sourceRegistered,
    targetRegistered,
    causalityClassified,
    influenceMapped,
    dependencyMapped,
    rootCauseIdentified,
    causalChainResolved,
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

  const replay: TruthCausalityGraphReplay = Object.freeze({
    replayResult,
    reconstructedContract: contract,
    reconstructedInfluences: influences,
    reconstructedDependencies: dependencies,
    reconstructedRootCause: Object.freeze({ ...input.rootCause }),
    reconstructedCausalChain: causalChain,
  });

  const visibility: TruthCausalityGraphVisibility = Object.freeze({
    causality_id: causalityId,
    source_object_id: input.sourceObjectId,
    target_object_id: input.targetObjectId,
    causality_type: input.causalityType,
    root_cause_status: rootCauseIdentified ? "VALID" : "INVALID",
    dependency_count: dependencies.length,
    influence_count: influences.length,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthCausalityGraphObservability = Object.freeze({
    causal_relationships_total: 1,
    influence_relationships_total: influences.length,
    dependency_relationships_total: dependencies.length,
    root_causes_identified: rootCauseIdentified ? 1 : 0,
    causal_chain_depth: causalChain.length,
    causality_failures: valid || conditional ? 0 : 1,
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
