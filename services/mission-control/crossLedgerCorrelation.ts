import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { validateTruthLedgerQueryContract } from "./queryContract";
import type {
  TruthCorrelationStrength,
  TruthCrossLedgerCorrelationAuditRecord,
  TruthCrossLedgerCorrelationConflict,
  TruthCrossLedgerCorrelationEdge,
  TruthCrossLedgerCorrelationExecutionContext,
  TruthCrossLedgerCorrelationGap,
  TruthCrossLedgerCorrelationIndexRecord,
  TruthCrossLedgerCorrelationNode,
  TruthCrossLedgerCorrelationQuery,
  TruthCrossLedgerCorrelationReplayMetadata,
  TruthCrossLedgerCorrelationResponse,
  TruthCrossLedgerCorrelationResultState,
  TruthCrossLedgerIndexedRelationship,
  TruthCrossLedgerLedgerManifest,
  TruthCrossLedgerRelationshipType,
  TruthCrossLedgerVisibilityState,
  TruthIntegrityFinalCertificationState,
  TruthLedgerQueryContract,
  TruthLedgerType,
} from "./types";

const CORRELATION_SCHEMA_VERSION = "mission-control-cross-ledger-correlation/v1";
const CORRELATION_INDEX_VERSION = "cross-ledger-index/v1";

const LEDGERS: readonly TruthLedgerType[] = Object.freeze([
  "TRUTH_LEDGER",
  "EVENT_LEDGER",
  "EVIDENCE_LEDGER",
  "RECOMMENDATION_LEDGER",
  "DECISION_LEDGER",
  "GOVERNANCE_LEDGER",
  "LINEAGE_LEDGER",
  "REPLAY_LEDGER",
  "INTEGRITY_LEDGER",
  "CERTIFICATION_LEDGER",
  "AUDIT_LEDGER",
]);

const RELATIONSHIPS: readonly TruthCrossLedgerRelationshipType[] = Object.freeze([
  "SUPPORTED_BY",
  "CONTRADICTED_BY",
  "DEPENDS_ON",
  "INFLUENCED_BY",
  "GOVERNED_BY",
  "RESTRICTED_BY",
  "ESCALATED_BY",
  "REPLAYED_BY",
  "VERIFIED_BY",
  "CERTIFIED_BY",
  "DERIVED_FROM",
  "DECIDED_FROM",
  "RECOMMENDED_FROM",
  "SUPERSEDES",
  "SUPERSEDED_BY",
  "RECORDED_AFTER",
  "RECORDED_BEFORE",
  "ASSOCIATED_WITH",
]);

const CORRELATION_TYPES: readonly TruthCrossLedgerCorrelationQuery["correlation_type"][] = Object.freeze([
  "RECOMMENDATION_TO_DECISION",
  "RECOMMENDATION_TO_EVIDENCE",
  "DECISION_TO_EVIDENCE",
  "DECISION_TO_GOVERNANCE",
  "DECISION_TO_REPLAY",
  "EVIDENCE_TO_INTEGRITY",
  "EVIDENCE_TO_GOVERNANCE",
  "REPLAY_TO_DECISION",
  "REPLAY_TO_RECOMMENDATION",
  "LINEAGE_TO_EVIDENCE",
  "INTEGRITY_TO_LEDGER_RECORDS",
  "CERTIFICATION_TO_EVIDENCE",
  "CERTIFICATION_TO_DECISION",
  "ESCALATION_TO_RELATED_RECORDS",
  "MISSION_CROSS_LEDGER_CONTEXT",
  "INCIDENT_CROSS_LEDGER_CONTEXT",
  "FULL_CONTEXT_CORRELATION",
]);

const INTEGRITY_RANK: Readonly<Record<TruthIntegrityFinalCertificationState, number>> = Object.freeze({
  CORRUPTED: 0,
  DEGRADED: 1,
  VALID: 2,
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function ledgerValid(value: unknown): value is TruthLedgerType {
  return LEDGERS.includes(value as TruthLedgerType);
}

function relationshipValid(value: unknown): value is TruthCrossLedgerRelationshipType {
  return RELATIONSHIPS.includes(value as TruthCrossLedgerRelationshipType);
}

function correlationTypeValid(value: unknown): value is TruthCrossLedgerCorrelationQuery["correlation_type"] {
  return CORRELATION_TYPES.includes(value as TruthCrossLedgerCorrelationQuery["correlation_type"]);
}

function nodeKey(ledger: TruthLedgerType, recordId: string): string {
  return `${ledger}:${recordId}`;
}

function edgeId(source: TruthCrossLedgerCorrelationIndexRecord, relationship: TruthCrossLedgerIndexedRelationship): string {
  return `edge_${source.ledger_type}_${source.record_id}_${relationship.target_ledger}_${relationship.target_record_id}`;
}

function emptyResponse(
  contract: TruthLedgerQueryContract | undefined,
  query: TruthCrossLedgerCorrelationQuery,
  state: TruthCrossLedgerCorrelationResultState,
  warnings: readonly string[],
): TruthCrossLedgerCorrelationResponse {
  const queryHash = contract ? hashValue("mission-control-query-contract-hash", contract) : hashValue("mission-control-missing-query-contract-hash", query.query_contract_ref);
  const manifest = ledgerManifest(query, [], undefined);
  const correlationHash = hashValue("mission-control-cross-ledger-correlation-hash", { state, query, warnings });
  return Object.freeze({
    correlation_query_id: query.correlation_query_id,
    query_id: contract?.query_id ?? query.query_contract_ref,
    tenant_id: query.tenant_id,
    mission_id: query.mission_id,
    correlation_type: query.correlation_type,
    result_state: state,
    nodes: Object.freeze([]),
    edges: Object.freeze([]),
    seed_records: query.seed_records,
    correlated_ledgers: Object.freeze([]),
    direct_correlation_count: 0,
    indirect_correlation_count: 0,
    candidate_correlation_count: 0,
    conflict_count: 0,
    gap_count: 0,
    gaps: Object.freeze([]),
    conflicts: Object.freeze([]),
    redaction_applied: false,
    redaction_refs: Object.freeze([]),
    authority_decision_ref: query.authority_context_ref,
    governance_decision_ref: query.governance_context_ref,
    integrity_decision_ref: query.integrity_requirements_ref,
    ledger_manifest: manifest,
    query_hash: queryHash,
    correlation_hash: correlationHash,
    replay_ref: contract?.replay_requirements.replay_ref,
    correlated_at: query.created_at,
    warnings: Object.freeze(warnings),
    readOnly: true as const,
    sourceMutationAllowed: false as const,
  });
}

function ledgerManifest(
  query: TruthCrossLedgerCorrelationQuery,
  records: readonly TruthCrossLedgerCorrelationIndexRecord[],
  context: TruthCrossLedgerCorrelationExecutionContext | undefined,
): TruthCrossLedgerLedgerManifest {
  const ledgers = unique([query.source_ledger, ...query.target_ledgers, ...records.map((record) => record.ledger_type)]);
  return Object.freeze({
    manifest_id: hashValue("mission-control-cross-ledger-manifest-id", { ledgers, index_version: context?.correlation_index_version ?? CORRELATION_INDEX_VERSION }),
    ledger_versions: Object.fromEntries(ledgers.map((ledger) => [ledger, context?.correlation_index_version ?? CORRELATION_INDEX_VERSION])) as Record<TruthLedgerType, string>,
    correlation_schema_version: context?.correlation_schema_version ?? CORRELATION_SCHEMA_VERSION,
    correlation_index_version: context?.correlation_index_version ?? CORRELATION_INDEX_VERSION,
    policy_version: context?.policy_version,
  });
}

function permissionsValid(contract: TruthLedgerQueryContract, query: TruthCrossLedgerCorrelationQuery): boolean {
  const permissions = new Set(contract.authority_context.permissions);
  const ledgerPermissions = [query.source_ledger, ...query.target_ledgers].map((ledger) => `truth.ledger.${ledger.toLowerCase().replace("_ledger", "")}.read`);
  const viewPermissions = query.requested_views.flatMap((view) => {
    if (view === "GOVERNANCE_VIEW") return ["truth.governance.read"];
    if (view === "REPLAY_VIEW") return ["truth.replay.read"];
    if (view === "INTEGRITY_VIEW") return ["truth.integrity.read"];
    if (view === "CERTIFICATION_VIEW") return ["truth.certification.read"];
    if (view === "AUDIT_VIEW") return ["truth.audit.read"];
    return [];
  });
  return permissions.has("truth.crossledger.read")
    && ledgerPermissions.every((permission) => permissions.has(permission))
    && viewPermissions.every((permission) => permissions.has(permission));
}

function queryValid(query: TruthCrossLedgerCorrelationQuery): boolean {
  return !!query.correlation_query_id
    && !!query.query_contract_ref
    && !!query.tenant_id
    && correlationTypeValid(query.correlation_type)
    && ledgerValid(query.source_ledger)
    && query.target_ledgers.length > 0
    && query.target_ledgers.every(ledgerValid)
    && query.seed_records.length > 0
    && query.relationship_types_allowed.every(relationshipValid)
    && query.traversal_policy.max_hops >= 0
    && query.traversal_policy.max_nodes > 0
    && query.traversal_policy.max_edges > 0
    && query.ordering_policy.tie_breakers.includes("record_id")
    && query.ordering_policy.tie_breakers.includes("edge_id");
}

function seedMatches(record: TruthCrossLedgerCorrelationIndexRecord, query: TruthCrossLedgerCorrelationQuery): boolean {
  return query.seed_records.some((seed) => seed.ledger_type === record.ledger_type
    && seed.record_id === record.record_id
    && seed.tenant_id === record.tenant_id
    && (!seed.mission_id || seed.mission_id === record.mission_id));
}

function temporalAllowed(record: TruthCrossLedgerCorrelationIndexRecord, query: TruthCrossLedgerCorrelationQuery): boolean {
  const policy = query.temporal_policy;
  if (!policy || policy.temporal_mode === "CURRENT_LEDGER_STATE") return true;
  if (policy.temporal_mode === "BETWEEN_TIMES") {
    if (!policy.start_time || !policy.end_time) return false;
    const time = Date.parse(record.recorded_at ?? record.created_at);
    return time >= Date.parse(policy.start_time) && time <= Date.parse(policy.end_time);
  }
  if (!policy.as_of_time) return false;
  const recorded = Date.parse(record.recorded_at ?? record.created_at);
  if (record.late_arriving && !policy.include_late_arriving_records) return false;
  return recorded <= Date.parse(policy.as_of_time) || (record.late_arriving === true && policy.include_late_arriving_records);
}

function targetRecord(records: readonly TruthCrossLedgerCorrelationIndexRecord[], relationship: TruthCrossLedgerIndexedRelationship): TruthCrossLedgerCorrelationIndexRecord | undefined {
  return records.find((record) => record.ledger_type === relationship.target_ledger && record.record_id === relationship.target_record_id);
}

function visibility(
  restricted: boolean,
  query: TruthCrossLedgerCorrelationQuery,
  kind: "node" | "edge",
  governanceDecision: string | undefined,
): TruthCrossLedgerVisibilityState {
  if (governanceDecision === "DENY" || governanceDecision === "ESCALATE") return "DENIED";
  if (!restricted) return governanceDecision === "SUMMARY_ONLY" ? "SUMMARY_ONLY" : "VISIBLE";
  if (kind === "node" && query.existence_disclosure_policy.allow_restricted_node_placeholder && query.include_redacted_placeholders) return "EXISTS_BUT_RESTRICTED";
  if (kind === "edge" && query.existence_disclosure_policy.allow_restricted_edge_placeholder && query.include_redacted_placeholders) return "REDACTED_EDGE";
  return "DENIED";
}

function nodeFrom(record: TruthCrossLedgerCorrelationIndexRecord, query: TruthCrossLedgerCorrelationQuery, governanceDecision: string | undefined): TruthCrossLedgerCorrelationNode | undefined {
  const state = visibility(record.restricted === true, query, "node", governanceDecision);
  if (state === "DENIED") return undefined;
  return Object.freeze({
    node_id: `node_${record.ledger_type}_${record.record_id}`,
    ledger_type: record.ledger_type,
    record_id: state === "EXISTS_BUT_RESTRICTED" && !query.existence_disclosure_policy.allow_restricted_ledger_type ? "REDACTED" : record.record_id,
    truth_record_id: state === "EXISTS_BUT_RESTRICTED" ? undefined : record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    record_type: record.record_type,
    lifecycle_state: record.lifecycle_state,
    summary: state === "EXISTS_BUT_RESTRICTED" ? "Restricted cross-ledger record exists." : record.summary,
    created_at: record.created_at,
    recorded_at: record.recorded_at,
    verified_at: record.verified_at,
    integrity_state: record.integrity_state,
    visibility_state: state,
    redacted: state !== "VISIBLE",
  });
}

function edgeFrom(
  source: TruthCrossLedgerCorrelationIndexRecord,
  target: TruthCrossLedgerCorrelationIndexRecord | undefined,
  relationship: TruthCrossLedgerIndexedRelationship,
  query: TruthCrossLedgerCorrelationQuery,
  governanceDecision: string | undefined,
): TruthCrossLedgerCorrelationEdge | undefined {
  const restricted = relationship.restricted === true || target?.restricted === true;
  const state = visibility(restricted, query, "edge", governanceDecision);
  if (state === "DENIED") return undefined;
  const onlyTemporal = relationship.correlation_basis.length === 1 && relationship.correlation_basis[0] === "TEMPORAL_OVERLAP";
  const strength: TruthCorrelationStrength = onlyTemporal && relationship.correlation_strength === "VERIFIED" ? "CANDIDATE" : relationship.correlation_strength;
  return Object.freeze({
    edge_id: edgeId(source, relationship),
    source_ledger: source.ledger_type,
    source_record_id: source.record_id,
    source_truth_record_id: source.truth_record_id,
    target_ledger: relationship.target_ledger,
    target_record_id: state === "REDACTED_EDGE" ? "REDACTED" : relationship.target_record_id,
    target_truth_record_id: state === "REDACTED_EDGE" ? undefined : relationship.target_truth_record_id,
    relationship_type: relationship.relationship_type,
    correlation_basis: Object.freeze([...relationship.correlation_basis]),
    correlation_strength: strength,
    direction: relationship.direction,
    evidence_refs: Object.freeze([...(relationship.evidence_refs ?? [])]),
    governance_refs: Object.freeze([...(relationship.governance_refs ?? [])]),
    replay_refs: Object.freeze([...(relationship.replay_refs ?? [])]),
    lineage_refs: Object.freeze([...(relationship.lineage_refs ?? [])]),
    integrity_refs: Object.freeze([...(relationship.integrity_refs ?? [])]),
    temporal_relation: relationship.temporal_relation,
    integrity_state: target?.integrity_state ?? source.integrity_state,
    visibility_state: state,
    verified: strength === "VERIFIED" && !onlyTemporal,
  });
}

function gap(id: string, type: TruthCrossLedgerCorrelationGap["gap_type"], severity: TruthCrossLedgerCorrelationGap["severity"], affected: readonly string[], description: string): TruthCrossLedgerCorrelationGap {
  return Object.freeze({ gap_id: id, gap_type: type, severity, affected_record_refs: Object.freeze([...affected]), description });
}

function conflict(id: string, type: TruthCrossLedgerCorrelationConflict["conflict_type"], affected: readonly string[], description: string): TruthCrossLedgerCorrelationConflict {
  return Object.freeze({ conflict_id: id, conflict_type: type, affected_record_refs: Object.freeze([...affected]), description });
}

function sortNodes(query: TruthCrossLedgerCorrelationQuery, nodes: readonly TruthCrossLedgerCorrelationNode[]): readonly TruthCrossLedgerCorrelationNode[] {
  const direction = query.ordering_policy.direction === "ASC" ? 1 : -1;
  return Object.freeze([...nodes].sort((a, b) => {
    const primaryA = String(a[query.ordering_policy.node_order_by] ?? "");
    const primaryB = String(b[query.ordering_policy.node_order_by] ?? "");
    if (primaryA < primaryB) return -1 * direction;
    if (primaryA > primaryB) return 1 * direction;
    return a.record_id.localeCompare(b.record_id);
  }));
}

function sortEdges(query: TruthCrossLedgerCorrelationQuery, edges: readonly TruthCrossLedgerCorrelationEdge[]): readonly TruthCrossLedgerCorrelationEdge[] {
  const direction = query.ordering_policy.direction === "ASC" ? 1 : -1;
  return Object.freeze([...edges].sort((a, b) => {
    const primaryA = String(a[query.ordering_policy.edge_order_by] ?? "");
    const primaryB = String(b[query.ordering_policy.edge_order_by] ?? "");
    if (primaryA < primaryB) return -1 * direction;
    if (primaryA > primaryB) return 1 * direction;
    return a.edge_id.localeCompare(b.edge_id);
  }));
}

function responseState(
  nodes: readonly TruthCrossLedgerCorrelationNode[],
  edges: readonly TruthCrossLedgerCorrelationEdge[],
  gaps: readonly TruthCrossLedgerCorrelationGap[],
  conflicts: readonly TruthCrossLedgerCorrelationConflict[],
  redacted: boolean,
): TruthCrossLedgerCorrelationResultState {
  if (nodes.length === 0 && edges.length === 0) return "EMPTY";
  if (conflicts.length > 0) return "CONFLICT_DETECTED";
  if (gaps.some((item) => item.severity === "HIGH" || item.severity === "CRITICAL")) return "GAP_DETECTED";
  if (redacted) return "REDACTED";
  if (edges.length > 0 && edges.every((edge) => edge.correlation_strength === "CANDIDATE")) return "CANDIDATE_ONLY";
  if (gaps.length > 0 || edges.some((edge) => edge.correlation_strength === "UNVERIFIED") || nodes.some((node) => node.integrity_state === "DEGRADED")) return "PARTIAL";
  return "CORRELATED";
}

export function correlateCrossLedgerRecords(
  contract: TruthLedgerQueryContract | undefined,
  query: TruthCrossLedgerCorrelationQuery,
  records: readonly TruthCrossLedgerCorrelationIndexRecord[],
  context: TruthCrossLedgerCorrelationExecutionContext = {},
): TruthCrossLedgerCorrelationResponse {
  if (!contract) return emptyResponse(contract, query, "INVALID_QUERY", ["Cross-ledger correlation requires a Query Contract."]);
  const validation = validateTruthLedgerQueryContract(contract, {
    observed_integrity_state: context.observed_integrity_state,
    mutation_attempted: context.mutation_attempted,
  });
  if (!validation.valid) {
    const state = validation.result_state === "AUTHORITY_BLOCKED" ? "AUTHORITY_BLOCKED" :
      validation.result_state === "GOVERNANCE_BLOCKED" ? "GOVERNANCE_BLOCKED" :
        validation.result_state === "INTEGRITY_BLOCKED" ? "INTEGRITY_BLOCKED" : "INVALID_QUERY";
    return emptyResponse(contract, query, state, validation.errors);
  }
  if (!queryValid(query) || query.query_contract_ref !== contract.query_id || query.tenant_id !== contract.tenant_id) {
    return emptyResponse(contract, query, "INVALID_QUERY", ["Cross-ledger correlation request is invalid or not bound to the Query Contract."]);
  }
  if (query.mission_id && contract.mission_id && query.mission_id !== contract.mission_id) return emptyResponse(contract, query, "INVALID_QUERY", ["Correlation mission scope does not match the Query Contract."]);
  if (!permissionsValid(contract, query)) return emptyResponse(contract, query, "AUTHORITY_BLOCKED", ["Requester lacks source, target, or requested-view ledger authority."]);
  if (context.mutation_attempted) return emptyResponse(contract, query, "INVALID_QUERY", ["Cross-ledger correlation is read-only and cannot mutate records."]);
  if (!contract.replay_requirements.replay_ref || !query.replay_requirements_ref) return emptyResponse(contract, query, "INVALID_QUERY", ["Replay-required correlation is missing replay metadata."]);
  const governanceDecision = context.governance_decision ?? (contract.redaction_policy.redaction_required ? "ALLOW_WITH_REDACTION" : "ALLOW");
  if (governanceDecision === "DENY" || governanceDecision === "ESCALATE") return emptyResponse(contract, query, "GOVERNANCE_BLOCKED", ["Governance blocks cross-ledger correlation."]);

  const usableRecords = records.filter((record) => record.tenant_id === query.tenant_id
    && (!query.mission_id || record.mission_id === query.mission_id)
    && !query.traversal_policy.blocked_ledgers.includes(record.ledger_type)
    && query.traversal_policy.allowed_ledgers.includes(record.ledger_type)
    && temporalAllowed(record, query));

  if (usableRecords.some((record) => record.integrity_state === "CORRUPTED" && (seedMatches(record, query) || query.traversal_policy.stop_at_corrupted_node))) {
    return emptyResponse(contract, query, "INTEGRITY_BLOCKED", ["Corrupted source or target records cannot be used as trusted correlation proof."]);
  }

  const minimum = contract.integrity_requirements.minimum_integrity_state;
  if (usableRecords.some((record) => INTEGRITY_RANK[record.integrity_state] < INTEGRITY_RANK[minimum] && record.integrity_state !== "DEGRADED")) {
    return emptyResponse(contract, query, "INTEGRITY_BLOCKED", ["Correlation record integrity is below the required threshold."]);
  }

  const redactionRequired = usableRecords.some((record) => record.restricted) || governanceDecision === "ALLOW_WITH_REDACTION" || governanceDecision === "SUMMARY_ONLY";
  if (usableRecords.some((record) => record.restricted) && !contract.redaction_policy.redaction_required && !query.existence_disclosure_policy.allow_restricted_node_placeholder) {
    return emptyResponse(contract, query, "GOVERNANCE_BLOCKED", ["Restricted cross-ledger nodes require redaction or existence disclosure policy."]);
  }
  if (usableRecords.some((record) => record.relationships.some((relationship) => relationship.restricted)) && !contract.redaction_policy.redaction_required && !query.existence_disclosure_policy.allow_restricted_edge_placeholder) {
    return emptyResponse(contract, query, "GOVERNANCE_BLOCKED", ["Restricted cross-ledger edges require redaction or existence disclosure policy."]);
  }

  const byKey = new Map(usableRecords.map((record) => [nodeKey(record.ledger_type, record.record_id), record]));
  const queue = usableRecords.filter((record) => seedMatches(record, query));
  const visited = new Set<string>();
  const nodeMap = new Map<string, TruthCrossLedgerCorrelationNode>();
  const edgeMap = new Map<string, TruthCrossLedgerCorrelationEdge>();
  const gaps: TruthCrossLedgerCorrelationGap[] = [];
  const conflicts: TruthCrossLedgerCorrelationConflict[] = [];
  const redactionRefs: string[] = [];
  let cycles = 0;

  for (let hop = 0; hop <= query.traversal_policy.max_hops && queue.length > 0; hop += 1) {
    const level = [...queue.splice(0, queue.length)];
    for (const source of level) {
      const sourceKey = nodeKey(source.ledger_type, source.record_id);
      if (visited.has(sourceKey)) {
        cycles += 1;
        if (!query.traversal_policy.allow_cycles && query.traversal_policy.detect_cycles) gaps.push(gap(`gap_cycle_${source.record_id}`, "CYCLE_DETECTED", "LOW", [source.record_id], "Traversal cycle was detected and bounded."));
        continue;
      }
      visited.add(sourceKey);
      const sourceNode = nodeFrom(source, query, governanceDecision);
      if (sourceNode) nodeMap.set(sourceKey, sourceNode);

      for (const relationship of source.relationships) {
        if (edgeMap.size >= query.traversal_policy.max_edges) {
          gaps.push(gap("gap_max_edges", "MAX_DEPTH_REACHED", "LOW", [source.record_id], "Maximum edge traversal was reached."));
          break;
        }
        if (!query.target_ledgers.includes(relationship.target_ledger) && !query.traversal_policy.allowed_ledgers.includes(relationship.target_ledger)) continue;
        if (!query.relationship_types_allowed.includes(relationship.relationship_type) || !query.traversal_policy.allowed_relationship_types.includes(relationship.relationship_type)) continue;
        if (!relationship.correlation_basis.some((basis) => query.correlation_basis_allowed.includes(basis))) continue;
        if (!query.include_candidate_correlations && relationship.correlation_strength === "CANDIDATE") continue;

        const onlyTemporal = relationship.correlation_basis.length === 1 && relationship.correlation_basis[0] === "TEMPORAL_OVERLAP";
        if (onlyTemporal && relationship.correlation_strength === "VERIFIED") {
          conflicts.push(conflict(`conflict_temporal_${source.record_id}_${relationship.target_record_id}`, "TEMPORAL_CONTRADICTION", [source.record_id, relationship.target_record_id], "Temporal overlap alone cannot be marked verified."));
        }
        if (relationship.candidate_for_certification && relationship.correlation_strength === "CANDIDATE" && query.requested_views.includes("CERTIFICATION_VIEW")) {
          conflicts.push(conflict(`conflict_candidate_cert_${source.record_id}_${relationship.target_record_id}`, "CERTIFICATION_CONTRADICTION", [source.record_id, relationship.target_record_id], "Candidate correlations cannot support certification."));
        }
        if (relationship.conflicting || relationship.relationship_type === "CONTRADICTED_BY" || relationship.correlation_strength === "CONFLICTING") {
          conflicts.push(conflict(`conflict_${source.record_id}_${relationship.target_record_id}`, relationship.governance_refs?.length ? "CONFLICTING_GOVERNANCE" : "CONFLICTING_EVIDENCE", [source.record_id, relationship.target_record_id], "Conflicting cross-ledger relationship detected."));
        }
        if (relationship.broken_lineage) gaps.push(gap(`gap_lineage_${source.record_id}_${relationship.target_record_id}`, "BROKEN_LINEAGE", "HIGH", [source.record_id, relationship.target_record_id], "Cross-ledger lineage is broken."));
        if (relationship.missing_target) gaps.push(gap(`gap_missing_${source.record_id}_${relationship.target_record_id}`, relationship.relationship_type === "SUPPORTED_BY" ? "MISSING_EVIDENCE" : "MISSING_TARGET_RECORD", "HIGH", [source.record_id, relationship.target_record_id], "Referenced cross-ledger target is missing."));

        const target = targetRecord(usableRecords, relationship);
        if (!target && !relationship.missing_target) gaps.push(gap(`gap_ref_${source.record_id}_${relationship.target_record_id}`, "BROKEN_REFERENCE", "HIGH", [source.record_id, relationship.target_record_id], "Referenced cross-ledger target was not found."));
        if (target?.integrity_state === "CORRUPTED") return emptyResponse(contract, query, "INTEGRITY_BLOCKED", ["Corrupted target record cannot be used as trusted correlation proof."]);
        if (target && visited.has(nodeKey(target.ledger_type, target.record_id)) && query.traversal_policy.detect_cycles) {
          cycles += 1;
          if (!query.traversal_policy.allow_cycles) gaps.push(gap(`gap_cycle_${source.record_id}_${target.record_id}`, "CYCLE_DETECTED", "LOW", [source.record_id, target.record_id], "Traversal cycle was detected and bounded."));
        }

        if (relationship.restricted) redactionRefs.push(relationship.target_record_id);
        if (target?.restricted) redactionRefs.push(...(target.restricted_fields ?? [target.record_id]));

        const edge = edgeFrom(source, target, relationship, query, governanceDecision);
        if (edge) edgeMap.set(edge.edge_id, edge);
        if (target && hop < query.traversal_policy.max_hops && !visited.has(nodeKey(target.ledger_type, target.record_id))) {
          if (nodeMap.size + queue.length < query.traversal_policy.max_nodes) queue.push(target);
          else gaps.push(gap("gap_max_nodes", "MAX_DEPTH_REACHED", "LOW", [target.record_id], "Maximum node traversal was reached."));
        }
      }
    }
  }

  const nodes = sortNodes(query, [...nodeMap.values()]);
  const edges = sortEdges(query, [...edgeMap.values()]);
  const correlatedLedgers = unique([...nodes.map((node) => node.ledger_type), ...edges.flatMap((edge) => [edge.source_ledger, edge.target_ledger])]);
  const manifest = ledgerManifest(query, usableRecords, context);
  const candidateCount = edges.filter((edge) => edge.correlation_strength === "CANDIDATE").length;
  const directCount = edges.filter((edge) => edge.correlation_basis.includes("DIRECT_REFERENCE")).length;
  const indirectCount = edges.length - directCount;
  const state = responseState(nodes, edges, gaps, conflicts, redactionRequired || redactionRefs.length > 0);
  const warnings = unique([
    ...gaps.map((item) => item.description),
    ...conflicts.map((item) => item.description),
    ...(usableRecords.some((record) => record.integrity_state === "DEGRADED") ? ["One or more correlated records are integrity-degraded."] : []),
    ...(cycles > 0 ? ["Traversal cycle was detected and bounded deterministically."] : []),
    ...(query.temporal_policy?.include_late_arriving_records && usableRecords.some((record) => record.late_arriving) ? ["Late-arriving records were included and must not be treated as known before recording."] : []),
  ]);

  const responseWithoutHash = {
    correlation_query_id: query.correlation_query_id,
    query_id: contract.query_id,
    tenant_id: query.tenant_id,
    mission_id: query.mission_id,
    correlation_type: query.correlation_type,
    result_state: state,
    nodes,
    edges,
    seed_records: query.seed_records,
    correlated_ledgers: correlatedLedgers,
    direct_correlation_count: directCount,
    indirect_correlation_count: indirectCount,
    candidate_correlation_count: candidateCount,
    conflict_count: conflicts.length,
    gap_count: gaps.length,
    gaps: Object.freeze(gaps),
    conflicts: Object.freeze(conflicts),
    redaction_applied: redactionRequired || redactionRefs.length > 0,
    redaction_refs: unique(redactionRefs),
    authority_decision_ref: query.authority_context_ref,
    governance_decision_ref: query.governance_context_ref,
    integrity_decision_ref: query.integrity_requirements_ref,
    ledger_manifest: manifest,
    query_hash: validation.query_hash,
    replay_ref: contract.replay_requirements.replay_ref,
    correlated_at: query.created_at,
    warnings,
    readOnly: true as const,
    sourceMutationAllowed: false as const,
  };

  return Object.freeze({
    ...responseWithoutHash,
    correlation_hash: hashValue("mission-control-cross-ledger-correlation-hash", responseWithoutHash),
  });
}

export function createCrossLedgerCorrelationReplayMetadata(
  query: TruthCrossLedgerCorrelationQuery,
  response: TruthCrossLedgerCorrelationResponse,
): TruthCrossLedgerCorrelationReplayMetadata {
  return Object.freeze({
    correlation_query_id: query.correlation_query_id,
    query_id: response.query_id,
    query_hash: response.query_hash,
    seed_record_hash: hashValue("mission-control-cross-ledger-seed-record-hash", query.seed_records),
    traversal_policy_hash: hashValue("mission-control-cross-ledger-traversal-policy-hash", query.traversal_policy),
    temporal_policy_hash: hashValue("mission-control-cross-ledger-temporal-policy-hash", query.temporal_policy ?? "CURRENT_LEDGER_STATE"),
    ordering_policy_hash: hashValue("mission-control-cross-ledger-ordering-policy-hash", query.ordering_policy),
    ledger_manifest_id: response.ledger_manifest.manifest_id,
    correlation_index_version: response.ledger_manifest.correlation_index_version,
    correlation_hash: response.correlation_hash,
    correlated_at: response.correlated_at,
  });
}

export function createCrossLedgerCorrelationAuditRecord(
  contract: TruthLedgerQueryContract,
  query: TruthCrossLedgerCorrelationQuery,
  response: TruthCrossLedgerCorrelationResponse,
): TruthCrossLedgerCorrelationAuditRecord {
  return Object.freeze({
    audit_id: `cross_ledger_audit_${query.correlation_query_id}`,
    correlation_query_id: query.correlation_query_id,
    query_id: contract.query_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    requester_type: contract.requester_type,
    operator_id: query.operator_id,
    correlation_type: query.correlation_type,
    source_ledger: query.source_ledger,
    target_ledgers: query.target_ledgers,
    result_state: response.result_state,
    node_count: response.nodes.length,
    edge_count: response.edges.length,
    gap_count: response.gap_count,
    conflict_count: response.conflict_count,
    redaction_applied: response.redaction_applied,
    authority_decision_ref: response.authority_decision_ref,
    governance_decision_ref: response.governance_decision_ref,
    integrity_decision_ref: response.integrity_decision_ref,
    replay_ref: response.replay_ref,
    query_hash: response.query_hash,
    correlation_hash: response.correlation_hash,
    created_at: response.correlated_at,
  });
}
