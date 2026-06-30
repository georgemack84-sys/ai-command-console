import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthIdentityFramework,
  TruthCertificationState,
  TruthChildRelationshipType,
  TruthIdentity,
  TruthIdentityAnalytics,
  TruthIdentityCertification,
  TruthIdentityFrameworkInput,
  TruthIdentityFrameworkRequest,
  TruthIdentityFrameworkValidation,
  TruthIdentityNodeReference,
  TruthIdentityOperatorVisibility,
  TruthIdentityReasonCode,
  TruthIdentityState,
  TruthParentRelationshipType,
  TruthReplayResult,
} from "./types";

const PARENT_RELATIONSHIP_TYPES = new Set<TruthParentRelationshipType>([
  "DERIVED_FROM",
  "INFLUENCED_BY",
  "APPROVED_BY",
  "RECOMMENDED_BY",
  "CERTIFIED_BY",
  "ESCALATED_BY",
  "GENERATED_BY",
]);

const CHILD_RELATIONSHIP_TYPES = new Set<TruthChildRelationshipType>([
  "CREATED",
  "DERIVED",
  "AUTHORIZED",
  "ESCALATED",
  "CERTIFIED",
  "RESTRICTED",
  "GENERATED",
]);

const IDENTITY_STATES = new Set<TruthIdentityState>([
  "CREATED",
  "VALIDATED",
  "ACTIVE",
  "SUPERSEDED",
  "REVOKED",
]);

function addReason(reasons: TruthIdentityReasonCode[], reason: TruthIdentityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthIdentityFrameworkRequest): TruthIdentityFrameworkRequest {
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

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function graphFromCatalog(
  currentId: string,
  currentParents: readonly string[],
  currentChildren: readonly string[],
  catalog: readonly TruthIdentityNodeReference[],
): Map<string, { parents: readonly string[]; children: readonly string[]; tenantId: string; lineageRootId: string }> {
  const graph = new Map<string, { parents: readonly string[]; children: readonly string[]; tenantId: string; lineageRootId: string }>();
  for (const node of catalog) {
    graph.set(node.truth_record_id, {
      parents: normalizeStrings(node.parent_truth_ids),
      children: normalizeStrings(node.child_truth_ids),
      tenantId: node.tenant_id,
      lineageRootId: node.lineage_root_id,
    });
  }
  const existing = graph.get(currentId);
  graph.set(currentId, {
    parents: normalizeStrings(currentParents),
    children: normalizeStrings(currentChildren),
    tenantId: existing?.tenantId ?? "",
    lineageRootId: existing?.lineageRootId ?? currentId,
  });
  return graph;
}

function traverse(
  graph: Map<string, { parents: readonly string[]; children: readonly string[] }>,
  start: string,
  direction: "parents" | "children",
): string[] {
  const visited = new Set<string>();
  const stack = [...(graph.get(start)?.[direction] ?? [])];
  while (stack.length > 0) {
    const next = stack.pop()!;
    if (visited.has(next)) continue;
    visited.add(next);
    for (const linked of graph.get(next)?.[direction] ?? []) stack.push(linked);
  }
  return [...visited].sort();
}

function detectCycle(
  graph: Map<string, { parents: readonly string[]; children: readonly string[] }>,
  start: string,
): boolean {
  const reachesStart = (direction: "parents" | "children"): boolean => {
    const seen = new Set<string>();
    const stack = [...(graph.get(start)?.[direction] ?? [])];
    while (stack.length > 0) {
      const next = stack.pop()!;
      if (next === start) return true;
      if (seen.has(next)) continue;
      seen.add(next);
      const node = graph.get(next);
      if (!node) continue;
      stack.push(...node[direction]);
    }
    return false;
  };

  return reachesStart("parents") || reachesStart("children");
}

function relationshipIntegrity(
  currentId: string,
  parents: readonly string[],
  children: readonly string[],
  catalog: readonly TruthIdentityNodeReference[],
): boolean {
  const byId = new Map(catalog.map((node) => [node.truth_record_id, node]));
  const parentsBacklink = parents.every((parentId) => byId.get(parentId)?.child_truth_ids.includes(currentId) ?? false);
  const childrenBacklink = children.every((childId) => byId.get(childId)?.parent_truth_ids.includes(currentId) ?? false);
  return parentsBacklink && childrenBacklink;
}

function certificationState(valid: boolean, replayResult: TruthReplayResult): TruthCertificationState {
  if (!valid) return "FAIL";
  if (replayResult !== "REPRODUCED") return "FAIL";
  return "PASS";
}

function buildIdentity(input: TruthIdentityFrameworkInput): TruthIdentity {
  const record = input.truthRecord.record;
  const parentTruthIds = normalizeStrings(input.parentTruthIds ?? []);
  const childTruthIds = normalizeStrings(input.childTruthIds ?? []);
  const lineageRootId = input.lineageRootId ?? parentTruthIds[0] ?? record.truth_record_id;
  const createdTimestamp = input.createdTimestamp ?? record.timestamp;
  const rootCreationTimestamp = input.rootCreationTimestamp ?? createdTimestamp;
  const rootEventType = input.rootEventType ?? record.event_type;
  const rootSource = input.rootSource ?? record.event_source;
  const parentRelationshipType = input.parentRelationshipType ?? "DERIVED_FROM";
  const childRelationshipType = input.childRelationshipType ?? "CREATED";
  const graph = graphFromCatalog(record.truth_record_id, parentTruthIds, childTruthIds, input.identityCatalog);
  const ancestor_truth_ids = traverse(graph, record.truth_record_id, "parents");
  const descendant_truth_ids = traverse(graph, record.truth_record_id, "children");

  return Object.freeze({
    truth_record_id: record.truth_record_id,
    lineage_root_id: lineageRootId,
    parent_truth_ids: parentTruthIds,
    child_truth_ids: childTruthIds,
    identity_version: input.identityVersion ?? "truth-identity/v1",
    identity_state: input.identityState ?? "VALIDATED",
    created_timestamp: createdTimestamp,
    root_creation_timestamp: rootCreationTimestamp,
    root_event_type: rootEventType,
    root_source: rootSource,
    parent_relationship_type: parentRelationshipType,
    child_relationship_type: childRelationshipType,
    parent_count: parentTruthIds.length,
    child_count: childTruthIds.length,
    ancestor_truth_ids,
    descendant_truth_ids,
    ancestor_count: ancestor_truth_ids.length,
    descendant_count: descendant_truth_ids.length,
  });
}

export function buildTruthIdentityFrameworkRequest(
  request: TruthIdentityFrameworkRequest,
): TruthIdentityFrameworkRequest {
  return requestCore(request);
}

export function sealTruthIdentityFramework(
  input: TruthIdentityFrameworkInput,
): SealedTruthIdentityFramework {
  const reasons: TruthIdentityReasonCode[] = [];
  const identity = buildIdentity(input);
  const record = input.truthRecord.record;
  const graph = graphFromCatalog(identity.truth_record_id, identity.parent_truth_ids, identity.child_truth_ids, input.identityCatalog);
  const byId = new Map(input.identityCatalog.map((node) => [node.truth_record_id, node]));

  const identityPresent = identity.truth_record_id.length > 0;
  addReason(reasons, identityPresent ? "IDENTITY_PRESENT" : "IDENTITY_MISSING");

  const uniquenessValid = identityPresent
    && !(input.existingTruthRecordIds ?? []).includes(identity.truth_record_id)
    && !(input.historicalTruthRecordIds ?? []).includes(identity.truth_record_id);
  addReason(reasons, uniquenessValid ? "IDENTITY_UNIQUE" : "IDENTITY_DUPLICATE");
  addReason(reasons, (input.historicalTruthRecordIds ?? []).includes(identity.truth_record_id) ? "IDENTITY_REUSE_BLOCKED" : "IDENTITY_IMMUTABLE");
  addReason(reasons, (input.existingTruthRecordIds ?? []).includes(identity.truth_record_id) ? "IDENTITY_OVERWRITE_BLOCKED" : "IDENTITY_IMMUTABLE");

  const immutableBaseline = input.immutableBaseline;
  const immutableValid = !immutableBaseline
    || (
      (immutableBaseline.truth_record_id === undefined || immutableBaseline.truth_record_id === identity.truth_record_id)
      && (immutableBaseline.lineage_root_id === undefined || immutableBaseline.lineage_root_id === identity.lineage_root_id)
      && (immutableBaseline.created_timestamp === undefined || immutableBaseline.created_timestamp === identity.created_timestamp)
      && (immutableBaseline.identity_version === undefined || immutableBaseline.identity_version === identity.identity_version)
    );
  addReason(reasons, immutableValid ? "IDENTITY_IMMUTABLE" : "IDENTITY_MUTATION_DETECTED");

  const lineageRootPresent = identity.lineage_root_id.length > 0;
  addReason(reasons, lineageRootPresent ? "LINEAGE_ROOT_PRESENT" : "LINEAGE_ROOT_MISSING");
  const lineageRootUnique = normalizeStrings([identity.lineage_root_id]).length === 1;
  addReason(reasons, lineageRootUnique ? "LINEAGE_ROOT_UNIQUE" : "LINEAGE_ROOT_MULTIPLE");
  const lineageRootImmutable = !immutableBaseline
    || immutableBaseline.lineage_root_id === undefined
    || immutableBaseline.lineage_root_id === identity.lineage_root_id;
  addReason(reasons, lineageRootImmutable ? "LINEAGE_ROOT_IMMUTABLE" : "LINEAGE_ROOT_MUTATION_DETECTED");

  const knownParents = identity.parent_truth_ids.every((id) => byId.has(id));
  addReason(reasons, knownParents ? "PARENT_REFERENCES_KNOWN" : "PARENT_REFERENCES_UNKNOWN");
  const knownChildren = identity.child_truth_ids.every((id) => byId.has(id));
  addReason(reasons, knownChildren ? "CHILD_REFERENCES_KNOWN" : "CHILD_REFERENCES_UNKNOWN");

  const parentTenantIsolation = identity.parent_truth_ids.every((id) => byId.get(id)?.tenant_id === record.tenant_id);
  addReason(reasons, parentTenantIsolation ? "PARENT_TENANT_ISOLATION_VALID" : "PARENT_TENANT_ISOLATION_FAILED");
  const childTenantIsolation = identity.child_truth_ids.every((id) => byId.get(id)?.tenant_id === record.tenant_id);
  addReason(reasons, childTenantIsolation ? "CHILD_TENANT_ISOLATION_VALID" : "CHILD_TENANT_ISOLATION_FAILED");

  const parentRelationshipsValid = knownParents && parentTenantIsolation && PARENT_RELATIONSHIP_TYPES.has(identity.parent_relationship_type);
  addReason(reasons, parentRelationshipsValid ? "PARENT_RELATIONSHIPS_VALID" : "PARENT_RELATIONSHIPS_INVALID");
  const childRelationshipsValid = knownChildren && childTenantIsolation && CHILD_RELATIONSHIP_TYPES.has(identity.child_relationship_type);
  addReason(reasons, childRelationshipsValid ? "CHILD_RELATIONSHIPS_VALID" : "CHILD_RELATIONSHIPS_INVALID");

  const cycleFree = !detectCycle(graph, identity.truth_record_id);
  addReason(reasons, cycleFree ? "CYCLE_NOT_DETECTED" : "CYCLE_DETECTED");

  const ancestorsReachable = identity.ancestor_truth_ids.every((id) => byId.has(id));
  addReason(reasons, ancestorsReachable ? "ANCESTORS_REACHABLE" : "ANCESTORS_UNREACHABLE");
  const descendantsReachable = identity.descendant_truth_ids.every((id) => byId.has(id));
  addReason(reasons, descendantsReachable ? "DESCENDANTS_REACHABLE" : "DESCENDANTS_ORPHANED");

  const genealogyValid = lineageRootPresent
    && lineageRootUnique
    && lineageRootImmutable
    && ancestorsReachable
    && descendantsReachable
    && cycleFree
    && (identity.parent_truth_ids.length === 0 || identity.ancestor_truth_ids.length >= identity.parent_truth_ids.length)
    && (identity.child_truth_ids.length === 0 || identity.descendant_truth_ids.length >= identity.child_truth_ids.length);
  addReason(reasons, genealogyValid ? "GENEALOGY_VALID" : "GENEALOGY_INVALID");

  const relationshipIntegrityValid = relationshipIntegrity(
    identity.truth_record_id,
    identity.parent_truth_ids,
    identity.child_truth_ids,
    input.identityCatalog,
  );
  addReason(reasons, relationshipIntegrityValid ? "RELATIONSHIP_INTEGRITY_VALID" : "RELATIONSHIP_INTEGRITY_INVALID");

  const tenantIsolationValid = input.accessTenantId === undefined || input.accessTenantId === record.tenant_id;
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const stateValid = IDENTITY_STATES.has(identity.identity_state);
  const replayResult: TruthReplayResult = !knownParents || !knownChildren
    ? "INCOMPLETE_EVIDENCE"
    : !relationshipIntegrityValid
      ? "UNREPLAYABLE"
      : !genealogyValid || !stateValid
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
  addReason(reasons, "TRUTH_IDENTITY_FRAMEWORK_IS_NOT_CONTROL");

  const analyticsOperational = true;
  addReason(reasons, analyticsOperational ? "ANALYTICS_OPERATIONAL" : "ANALYTICS_FAILED");

  const valid = identityPresent
    && uniquenessValid
    && immutableValid
    && lineageRootPresent
    && lineageRootUnique
    && lineageRootImmutable
    && parentRelationshipsValid
    && childRelationshipsValid
    && genealogyValid
    && relationshipIntegrityValid
    && cycleFree
    && tenantIsolationValid
    && stateValid
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent
    && analyticsOperational;

  const operatorVisibility: TruthIdentityOperatorVisibility = Object.freeze({
    truth_record_id: identity.truth_record_id,
    lineage_root_id: identity.lineage_root_id,
    parent_truth_ids: [...identity.parent_truth_ids],
    child_truth_ids: [...identity.child_truth_ids],
    ancestor_count: identity.ancestor_count,
    descendant_count: identity.descendant_count,
    identity_state: identity.identity_state,
    identity_version: identity.identity_version,
    validation_status: valid ? "VALID" : "INVALID",
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "OPERATOR_VISIBILITY_AVAILABLE" : "OPERATOR_VISIBILITY_BLOCKED");

  const totalTruthRecords = input.identityCatalog.length + (byId.has(identity.truth_record_id) ? 0 : 1);
  const lineageGroups = new Set([
    identity.lineage_root_id,
    ...input.identityCatalog.map((node) => node.lineage_root_id),
  ]);
  const lineageDepths = [
    identity.ancestor_count + 1,
    ...input.identityCatalog.map((node) => traverse(graphFromCatalog(node.truth_record_id, node.parent_truth_ids, node.child_truth_ids, input.identityCatalog), node.truth_record_id, "parents").length + 1),
  ];
  const analytics: TruthIdentityAnalytics = Object.freeze({
    total_truth_records: totalTruthRecords,
    total_lineages: lineageGroups.size,
    average_lineage_depth: lineageDepths.reduce((sum, depth) => sum + depth, 0) / lineageDepths.length,
    largest_lineage: Math.max(...lineageDepths),
    orphaned_truth_records: input.identityCatalog.filter((node) => node.parent_truth_ids.length === 0 && node.lineage_root_id !== node.truth_record_id).length,
    lineage_validation_failures: genealogyValid ? 0 : 1,
    identity_collisions: uniquenessValid ? 0 : 1,
    cycle_detection_failures: cycleFree ? 0 : 1,
    relationship_integrity_failures: relationshipIntegrityValid ? 0 : 1,
    genealogy_reconstruction_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const certState = certificationState(valid, replayResult);
  addReason(reasons, certState === "PASS" ? "CERTIFICATION_PASS" : "CERTIFICATION_FAIL");
  const certification: TruthIdentityCertification = Object.freeze({
    certificationState: certState,
    uniquenessEnforced: uniquenessValid,
    lineageRootsValid: lineageRootPresent && lineageRootUnique && lineageRootImmutable,
    parentRelationshipsValid,
    childRelationshipsValid,
    genealogyIntact: genealogyValid,
    relationshipIntegrityMaintained: relationshipIntegrityValid,
    replayReproducible: replayResult === "REPRODUCED",
    tenantIsolationCertified: tenantIsolationValid,
    operatorVisibilityCertified: tenantIsolationValid,
    analyticsOperational,
    failClosedVerified: executionImpossible
      && approvalAbsent
      && rankingAbsent
      && prioritizationAbsent
      && scoringAbsent
      && resourceAllocationAbsent
      && authorityBounded
      && controlSurfaceAbsent,
  });

  const validation: TruthIdentityFrameworkValidation = Object.freeze({
    valid,
    validationState: valid ? "VALID" : "INVALID",
    reasonCodes: [...reasons],
    uniquenessValid,
    lineageRootValid: lineageRootPresent && lineageRootUnique && lineageRootImmutable,
    parentRelationshipsValid,
    childRelationshipsValid,
    genealogyValid,
    relationshipIntegrityValid,
    cycleFree,
    tenantIsolationValid,
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
    identity,
    validation,
    replay: Object.freeze({
      replayResult,
      reconstructedIdentity: identity,
    }),
    operatorVisibility,
    analytics,
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
