import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthLineageContract,
  TruthCertificationState,
  TruthLineageChildRelationship,
  TruthLineageContract,
  TruthLineageDependency,
  TruthLineageDependencyType,
  TruthLineageGovernanceInfluence,
  TruthLineageInput,
  TruthLineageLedgerEntry,
  TruthLineageObjectType,
  TruthLineageReasonCode,
  TruthLineageReplay,
  TruthLineageRequest,
  TruthLineageValidation,
  TruthLineageVisibility,
  TruthReplayResult,
} from "./types";

const OBJECT_TYPES = new Set<TruthLineageObjectType>([
  "POLICY",
  "RULE",
  "AUTHORITY",
  "EVALUATION",
  "ENFORCEMENT",
  "VIOLATION",
  "ESCALATION",
  "CONTAINMENT",
  "CERTIFICATION",
  "REPLAY",
]);

const DEPENDENCY_TYPES = new Set<TruthLineageDependencyType>([
  "DEPENDS_ON",
  "DERIVED_FROM",
  "INHERITS_FROM",
  "INFLUENCED_BY",
  "CERTIFIED_BY",
  "AUTHORIZED_BY",
]);

function addReason(reasons: TruthLineageReasonCode[], reason: TruthLineageReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthLineageRequest): TruthLineageRequest {
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

function freezeChildren(children: readonly TruthLineageChildRelationship[]): readonly TruthLineageChildRelationship[] {
  return Object.freeze(children.map((child) => Object.freeze({ ...child })));
}

function freezeDependencies(dependencies: readonly TruthLineageDependency[]): readonly TruthLineageDependency[] {
  return Object.freeze(dependencies.map((dependency) => Object.freeze({ ...dependency })));
}

function freezeInfluences(influences: readonly TruthLineageGovernanceInfluence[]): readonly TruthLineageGovernanceInfluence[] {
  return Object.freeze(influences.map((influence) => Object.freeze({ ...influence })));
}

export function buildTruthLineageRequest(request: TruthLineageRequest): TruthLineageRequest {
  return requestCore(request);
}

export function sealTruthLineageContract(input: TruthLineageInput): SealedTruthLineageContract {
  const reasons: TruthLineageReasonCode[] = [];
  const lineageTimestamp = input.lineageTimestamp ?? input.request.now;
  const parent = input.parent === undefined ? null : input.parent;
  const children = freezeChildren(input.children ?? []);
  const dependencies = freezeDependencies(input.dependencies ?? []);
  const governanceInfluences = freezeInfluences(input.governanceInfluences);
  const lineageRootId = input.lineageRootId ?? parent?.parent_lineage_id ?? "lineage-root";

  const lineageHash = hashValue("mission-control-lineage-hash", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    object_id: input.objectId,
    object_type: input.objectType,
    lineage_root_id: lineageRootId,
    parent_lineage_id: parent?.parent_lineage_id ?? null,
    lineage_version: input.lineageVersion,
    lineage_timestamp: lineageTimestamp,
    children,
    dependencies,
    governanceInfluences,
    ownership: input.ownership,
  });
  const computedLineageId = hashValue("mission-control-lineage-id", {
    tenant_id: input.request.tenant_id,
    object_id: input.objectId,
    object_type: input.objectType,
    lineage_version: input.lineageVersion,
    lineage_hash: lineageHash,
  });
  const lineageId = input.lineageId ?? computedLineageId;

  const lineageIdPresent = input.missingLineageIdDetected !== true && lineageId.trim().length > 0;
  addReason(reasons, lineageIdPresent ? "LINEAGE_ID_PRESENT" : "LINEAGE_ID_MISSING");
  const objectIdPresent = input.missingObjectIdDetected !== true && input.objectId.trim().length > 0;
  addReason(reasons, objectIdPresent ? "OBJECT_ID_PRESENT" : "OBJECT_ID_MISSING");
  const objectTypePresent = input.missingObjectTypeDetected !== true && input.objectType.length > 0;
  addReason(reasons, objectTypePresent ? "OBJECT_TYPE_PRESENT" : "OBJECT_TYPE_MISSING");
  const contractValid = lineageIdPresent && objectIdPresent && objectTypePresent;

  const lineageIdUnique = input.duplicateLineageIdDetected !== true
    && !(input.priorLineageIds ?? []).includes(lineageId);
  addReason(reasons, lineageIdUnique ? "LINEAGE_ID_UNIQUE" : "LINEAGE_ID_DUPLICATE");
  const identityImmutable = input.identityMutated !== true;
  addReason(reasons, identityImmutable ? "LINEAGE_ID_IMMUTABLE" : "LINEAGE_ID_MUTATED");
  const hashValid = input.hashMismatchDetected !== true && lineageHash.trim().length > 0;
  addReason(reasons, hashValid ? "LINEAGE_HASH_VALID" : "LINEAGE_HASH_MISMATCH");
  const identityValid = lineageIdPresent && lineageIdUnique && identityImmutable && hashValid;

  const objectTypeValid = OBJECT_TYPES.has(input.objectType) && input.unknownObjectTypeDetected !== true;
  addReason(reasons, objectTypeValid ? "OBJECT_TYPE_VALID" : "OBJECT_TYPE_UNKNOWN");

  const parentValid = input.missingParentDetected !== true
    && input.invalidParentDetected !== true
    && (parent === null || (
      parent.parent_lineage_id.trim().length > 0
      && parent.parent_object_id.trim().length > 0
      && parent.relationship_reason.trim().length > 0
    ));
  addReason(reasons, parentValid ? "PARENT_RELATIONSHIP_VALID" : "PARENT_RELATIONSHIP_BROKEN");

  const childValid = input.orphanedChildDetected !== true
    && children.every((child) => (
      child.child_lineage_id.trim().length > 0
      && child.child_object_id.trim().length > 0
      && child.child_relationship.trim().length > 0
    ));
  addReason(reasons, childValid ? "CHILD_RELATIONSHIP_VALID" : "ORPHANED_CHILD_DETECTED");

  const dependencyKnown = input.unknownDependencyDetected !== true
    && dependencies.every((dependency) => DEPENDENCY_TYPES.has(dependency.dependency_type));
  if (!dependencyKnown) addReason(reasons, "DEPENDENCY_UNKNOWN");
  const dependencyCycleFree = input.dependencyCycleDetected !== true
    && dependencies.every((dependency) => dependency.dependency_lineage_id !== lineageId);
  if (!dependencyCycleFree) addReason(reasons, "DEPENDENCY_CYCLE_DETECTED");
  const dependencyValid = dependencyKnown
    && dependencyCycleFree
    && dependencies.every((dependency) => (
      dependency.dependency_id.trim().length > 0
      && dependency.dependency_lineage_id.trim().length > 0
      && dependency.dependency_object_id.trim().length > 0
      && dependency.dependency_reason.trim().length > 0
    ));
  if (dependencyValid) addReason(reasons, "DEPENDENCY_VALID");

  const governanceInfluenceValid = input.missingGovernanceInfluenceDetected !== true
    && governanceInfluences.length > 0
    && governanceInfluences.every((influence) => (
      influence.influence_id.trim().length > 0
      && influence.influence_type.trim().length > 0
      && influence.influence_source_id.trim().length > 0
      && influence.influence_rationale.trim().length > 0
    ));
  addReason(reasons, governanceInfluenceValid ? "GOVERNANCE_INFLUENCE_PRESENT" : "GOVERNANCE_INFLUENCE_MISSING");

  const ownerPresent = input.missingOwnerDetected !== true
    && input.ownership.owner_id.trim().length > 0
    && input.ownership.ownership_scope.trim().length > 0
    && !Number.isNaN(Date.parse(input.ownership.ownership_timestamp));
  if (!ownerPresent) addReason(reasons, "OWNER_MISSING");
  const ownershipValid = ownerPresent && input.ownershipMismatchDetected !== true;
  addReason(reasons, ownershipValid ? "OWNERSHIP_TRACEABLE" : input.ownershipMismatchDetected === true ? "OWNERSHIP_MISMATCH" : "OWNER_MISSING");

  const integrityValid = input.brokenLineageDetected !== true
    && input.orphanedObjectDetected !== true
    && contractValid
    && identityValid
    && objectTypeValid
    && parentValid
    && childValid
    && dependencyValid
    && governanceInfluenceValid
    && ownershipValid;
  addReason(reasons, integrityValid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_INVALID");

  const replayResult: TruthReplayResult = !contractValid
    || !dependencyValid
    || !governanceInfluenceValid
    ? "INCOMPLETE_EVIDENCE"
    : input.replayMismatchDetected === true || input.ownershipMismatchDetected === true || !integrityValid
      ? "MISMATCH"
      : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "LINEAGE_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "LINEAGE_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "LINEAGE_REPLAY_INCOMPLETE_EVIDENCE"
          : "LINEAGE_REPLAY_UNREPLAYABLE",
  );

  const tenantIsolationValid = input.crossTenantLineageAccessDetected !== true
    && input.crossTenantDependencyDetected !== true
    && input.crossTenantOwnershipDetected !== true
    && input.crossTenantReplayDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_LINEAGE_ISOLATION_VALID" : "TENANT_LINEAGE_ISOLATION_FAILED");

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
  addReason(reasons, "LINEAGE_CONTRACT_IS_NOT_CONTROL");

  const valid = contractValid
    && identityValid
    && objectTypeValid
    && parentValid
    && childValid
    && dependencyValid
    && governanceInfluenceValid
    && ownershipValid
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

  const contract: TruthLineageContract = Object.freeze({
    lineage_id: lineageId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    object_id: input.objectId,
    object_type: input.objectType,
    lineage_root_id: lineageRootId,
    parent_lineage_id: parent?.parent_lineage_id ?? null,
    lineage_version: input.lineageVersion,
    lineage_timestamp: lineageTimestamp,
    lineage_hash: lineageHash,
  });

  const failureReason = valid
    ? null
    : [
      !identityValid && "invalid lineage identity",
      !objectTypeValid && "unknown object type",
      !parentValid && "broken parent relationship",
      !childValid && "orphaned child",
      !dependencyValid && "invalid dependency",
      !governanceInfluenceValid && "missing governance influence",
      !ownershipValid && "ownership mismatch",
      !tenantIsolationValid && "cross-tenant lineage access",
      replayResult === "MISMATCH" && "lineage replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthLineageLedgerEntry = Object.freeze({
    lineage_id: lineageId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    object_id: input.objectId,
    object_type: input.objectType,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    certification_state: certification,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-lineage-ledger-entry-hash", {
      lineage_id: lineageId,
      lineage_hash: lineageHash,
      certification,
      failureReason,
    }),
  });

  const validation: TruthLineageValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    identityValid,
    objectTypeValid,
    parentValid,
    childValid,
    dependencyValid,
    governanceInfluenceValid,
    ownershipValid,
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

  const replay: TruthLineageReplay = Object.freeze({
    replayResult,
    reconstructedContract: contract,
    reconstructedParent: parent === null ? null : Object.freeze({ ...parent }),
    reconstructedChildren: children,
    reconstructedDependencies: dependencies,
    reconstructedOwnership: Object.freeze({ ...input.ownership }),
    reconstructedGovernanceInfluence: governanceInfluences,
  });

  const visibility: TruthLineageVisibility = Object.freeze({
    lineage_id: lineageId,
    lineage_root_id: lineageRootId,
    object_id: input.objectId,
    object_type: input.objectType,
    parent_lineage_id: parent?.parent_lineage_id ?? null,
    dependency_count: dependencies.length,
    owner: input.ownership.owner_id,
    validation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability = Object.freeze({
    lineages_total: 1,
    parent_relationships: parent === null ? 0 : 1,
    child_relationships: children.length,
    dependencies: dependencies.length,
    governance_influences: governanceInfluences.length,
    ownership_records: ownerPresent ? 1 : 0,
    validation_failures: valid || conditional ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
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
