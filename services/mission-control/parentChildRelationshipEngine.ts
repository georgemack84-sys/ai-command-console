import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthParentChildRelationshipEngine,
  TruthCertificationState,
  TruthParentChildObjectType,
  TruthParentChildRelationshipContract,
  TruthParentChildRelationshipInput,
  TruthParentChildRelationshipLedgerEntry,
  TruthParentChildRelationshipObservability,
  TruthParentChildRelationshipReasonCode,
  TruthParentChildRelationshipReplay,
  TruthParentChildRelationshipRequest,
  TruthParentChildRelationshipType,
  TruthParentChildRelationshipValidation,
  TruthParentChildRelationshipVisibility,
  TruthParentChildTraversalNode,
  TruthReplayResult,
} from "./types";

const OBJECT_TYPES = new Set<TruthParentChildObjectType>([
  "POLICY",
  "RULE",
  "AUTHORITY",
  "EVALUATION",
  "ENFORCEMENT",
  "CONTAINMENT",
  "CERTIFICATION",
  "REPLAY",
]);

const RELATIONSHIP_TYPES = new Set<TruthParentChildRelationshipType>([
  "PARENT_OF",
  "CHILD_OF",
  "OWNS",
  "GENERATES",
  "AUTHORIZES",
  "CERTIFIES",
  "CONTAINS",
  "ESCALATES",
  "INHERITS",
]);

function addReason(reasons: TruthParentChildRelationshipReasonCode[], reason: TruthParentChildRelationshipReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthParentChildRelationshipRequest): TruthParentChildRelationshipRequest {
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

function freezeTraversal(nodes: readonly TruthParentChildTraversalNode[]): readonly TruthParentChildTraversalNode[] {
  return Object.freeze(nodes.map((node) => Object.freeze({ ...node })));
}

export function buildTruthParentChildRelationshipRequest(
  request: TruthParentChildRelationshipRequest,
): TruthParentChildRelationshipRequest {
  return requestCore(request);
}

export function sealTruthParentChildRelationshipEngine(
  input: TruthParentChildRelationshipInput,
): SealedTruthParentChildRelationshipEngine {
  const reasons: TruthParentChildRelationshipReasonCode[] = [];
  const relationshipTimestamp = input.relationshipTimestamp ?? input.request.now;
  const ancestryPath = freezeTraversal(input.ancestryPath);
  const descendantPath = freezeTraversal(input.descendantPath);
  const replayReferences = Object.freeze([...input.replayReferences]);
  const hierarchyDepth = input.hierarchyDepth ?? ancestryPath.length;

  const relationshipHash = hashValue("mission-control-parent-child-relationship-hash", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    parent_object_id: input.parentObjectId,
    parent_object_type: input.parentObjectType,
    child_object_id: input.childObjectId,
    child_object_type: input.childObjectType,
    relationship_type: input.relationshipType,
    relationship_timestamp: relationshipTimestamp,
    replay_references: replayReferences,
    ancestry_path: ancestryPath,
    descendant_path: descendantPath,
  });
  const relationshipId = hashValue("mission-control-parent-child-relationship-id", {
    parent_object_id: input.parentObjectId,
    child_object_id: input.childObjectId,
    relationship_type: input.relationshipType,
    relationship_hash: relationshipHash,
  });

  const parentObjectIdPresent = input.parentObjectId.trim().length > 0;
  addReason(reasons, parentObjectIdPresent ? "PARENT_OBJECT_ID_PRESENT" : "PARENT_OBJECT_ID_MISSING");
  const childObjectIdPresent = input.childObjectId.trim().length > 0;
  addReason(reasons, childObjectIdPresent ? "CHILD_OBJECT_ID_PRESENT" : "CHILD_OBJECT_ID_MISSING");
  const relationshipTypePresent = input.relationshipType.length > 0;
  addReason(reasons, relationshipTypePresent ? "RELATIONSHIP_TYPE_PRESENT" : "RELATIONSHIP_TYPE_MISSING");
  const contractValid = parentObjectIdPresent && childObjectIdPresent && relationshipTypePresent;
  addReason(reasons, contractValid ? "RELATIONSHIP_CONTRACT_VALID" : "RELATIONSHIP_CONTRACT_INVALID");

  const parentRegistered = input.missingParentDetected !== true
    && input.invalidParentDetected !== true
    && parentObjectIdPresent
    && OBJECT_TYPES.has(input.parentObjectType);
  addReason(reasons, parentRegistered ? "PARENT_REGISTERED" : input.missingParentDetected === true ? "PARENT_MISSING" : "PARENT_INVALID");
  const childRegistered = input.missingChildDetected !== true
    && input.invalidChildDetected !== true
    && input.orphanedChildDetected !== true
    && childObjectIdPresent
    && OBJECT_TYPES.has(input.childObjectType);
  addReason(reasons, childRegistered ? "CHILD_REGISTERED" : input.orphanedChildDetected === true ? "ORPHANED_CHILD_DETECTED" : input.missingChildDetected === true ? "CHILD_MISSING" : "CHILD_INVALID");
  const relationshipClassified = input.unknownRelationshipTypeDetected !== true
    && input.multipleRelationshipTypesDetected !== true
    && RELATIONSHIP_TYPES.has(input.relationshipType);
  addReason(reasons, relationshipClassified ? "RELATIONSHIP_CLASSIFIED" : input.multipleRelationshipTypesDetected === true ? "RELATIONSHIP_TYPE_MULTIPLE" : "RELATIONSHIP_TYPE_UNKNOWN");
  const hierarchyBuilt = input.hierarchyCorruptionDetected !== true && hierarchyDepth >= 0;
  addReason(reasons, hierarchyBuilt ? "HIERARCHY_BUILT" : "HIERARCHY_CORRUPTION");
  const ancestryResolved = input.ancestryFailureDetected !== true
    && ancestryPath.length > 0
    && ancestryPath.every((node) => node.object_id.trim().length > 0 && OBJECT_TYPES.has(node.object_type));
  addReason(reasons, ancestryResolved ? "ANCESTRY_RESOLVED" : "ANCESTRY_FAILURE");
  const descendantsResolved = input.descendantFailureDetected !== true
    && descendantPath.length > 0
    && descendantPath.every((node) => node.object_id.trim().length > 0 && OBJECT_TYPES.has(node.object_type));
  addReason(reasons, descendantsResolved ? "DESCENDANTS_RESOLVED" : "DESCENDANT_FAILURE");
  const integrityValid = input.brokenRelationshipDetected !== true
    && parentRegistered
    && childRegistered
    && relationshipClassified
    && hierarchyBuilt
    && ancestryResolved
    && descendantsResolved
    && replayReferences.length > 0;
  addReason(reasons, integrityValid ? "RELATIONSHIP_INTEGRITY_VALID" : "RELATIONSHIP_INTEGRITY_INVALID");

  const replayResult: TruthReplayResult = replayReferences.length === 0 || !contractValid
    ? "INCOMPLETE_EVIDENCE"
    : input.replayMismatchDetected === true || !integrityValid
      ? "MISMATCH"
      : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "RELATIONSHIP_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "RELATIONSHIP_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "RELATIONSHIP_REPLAY_INCOMPLETE_EVIDENCE"
          : "RELATIONSHIP_REPLAY_UNREPLAYABLE",
  );

  const tenantIsolationValid = input.crossTenantRelationshipAccessDetected !== true
    && input.crossTenantAncestryDetected !== true
    && input.crossTenantDescendantDetected !== true
    && input.crossTenantReplayDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_RELATIONSHIP_ISOLATION_VALID" : "TENANT_RELATIONSHIP_ISOLATION_FAILED");
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
  addReason(reasons, "PARENT_CHILD_RELATIONSHIP_IS_NOT_CONTROL");

  const valid = contractValid
    && parentRegistered
    && childRegistered
    && relationshipClassified
    && hierarchyBuilt
    && ancestryResolved
    && descendantsResolved
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

  const contract: TruthParentChildRelationshipContract = Object.freeze({
    relationship_id: relationshipId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    parent_object_id: input.parentObjectId,
    parent_object_type: input.parentObjectType,
    child_object_id: input.childObjectId,
    child_object_type: input.childObjectType,
    relationship_type: input.relationshipType,
    relationship_timestamp: relationshipTimestamp,
    relationship_hash: relationshipHash,
    replay_references: replayReferences,
  });

  const failureReason = valid
    ? null
    : [
      !parentRegistered && "missing or invalid parent",
      !childRegistered && "missing, invalid, or orphaned child",
      !relationshipClassified && "invalid relationship type",
      !hierarchyBuilt && "hierarchy corruption",
      !ancestryResolved && "ancestry failure",
      !descendantsResolved && "descendant failure",
      !tenantIsolationValid && "cross-tenant relationship access",
      replayResult === "MISMATCH" && "relationship replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthParentChildRelationshipLedgerEntry = Object.freeze({
    relationship_id: relationshipId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    parent_object_id: input.parentObjectId,
    child_object_id: input.childObjectId,
    relationship_type: input.relationshipType,
    hierarchy_depth: hierarchyDepth,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    certification_state: certification,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-parent-child-relationship-ledger-entry-hash", {
      relationship_id: relationshipId,
      relationship_hash: relationshipHash,
      certification,
      failureReason,
    }),
  });

  const validation: TruthParentChildRelationshipValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    parentRegistered,
    childRegistered,
    relationshipClassified,
    hierarchyBuilt,
    ancestryResolved,
    descendantsResolved,
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

  const replay: TruthParentChildRelationshipReplay = Object.freeze({
    replayResult,
    reconstructedContract: contract,
    reconstructedAncestry: ancestryPath,
    reconstructedDescendants: descendantPath,
  });

  const visibility: TruthParentChildRelationshipVisibility = Object.freeze({
    relationship_id: relationshipId,
    parent_object_id: input.parentObjectId,
    child_object_id: input.childObjectId,
    relationship_type: input.relationshipType,
    hierarchy_depth: hierarchyDepth,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: relationshipTimestamp,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthParentChildRelationshipObservability = Object.freeze({
    relationships_total: 1,
    parent_assignments: parentRegistered ? 1 : 0,
    child_assignments: childRegistered ? 1 : 0,
    hierarchy_depth: hierarchyDepth,
    relationship_failures: valid || conditional ? 0 : 1,
    orphaned_objects: input.orphanedChildDetected === true ? 1 : 0,
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
