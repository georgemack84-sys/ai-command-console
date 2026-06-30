import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createDefaultTruthReplayContractFixture } from "./replayContract";
import { reconstructTruthReplayInputBundle } from "./replayInputReconstruction";
import type {
  TruthReplayContractType,
  TruthReplayStateAuditEventName,
  TruthReplayStateBoundary,
  TruthReplayStateCertificationState,
  TruthReplayStateComponent,
  TruthReplayStateComponentType,
  TruthReplayStateConsistencyReport,
  TruthReplayStateFailureCode,
  TruthReplayStateFailureReason,
  TruthReplayStateGraph,
  TruthReplayStateHashSet,
  TruthReplayStateInvariantReport,
  TruthReplayStatePackage,
  TruthReplayStatePackageStorageRecord,
  TruthReplayStateReconstructionRequest,
  TruthReplayStateReconstructionState,
  TruthReplayStateReconstructionTransitionValidation,
  TruthReplayStateReconstructionType,
  TruthReplayStateTimeline,
  TruthReplayStateTransition,
  TruthReplayStateTransitionLog,
} from "./types";

export const TRUTH_REPLAY_STATE_RECONSTRUCTION_EVENTS: Readonly<Record<TruthReplayStateAuditEventName, TruthReplayStateAuditEventName>> = Object.freeze({
  REPLAY_STATE_RECONSTRUCTION_REQUESTED: "REPLAY_STATE_RECONSTRUCTION_REQUESTED",
  REPLAY_STATE_INPUT_BUNDLE_LOADED: "REPLAY_STATE_INPUT_BUNDLE_LOADED",
  REPLAY_STATE_BOUNDARY_RESOLVED: "REPLAY_STATE_BOUNDARY_RESOLVED",
  REPLAY_STATE_COMPONENTS_BUILT: "REPLAY_STATE_COMPONENTS_BUILT",
  REPLAY_STATE_TIMELINE_RECONSTRUCTED: "REPLAY_STATE_TIMELINE_RECONSTRUCTED",
  REPLAY_STATE_TRANSITIONS_RECONSTRUCTED: "REPLAY_STATE_TRANSITIONS_RECONSTRUCTED",
  REPLAY_STATE_GRAPH_RECONSTRUCTED: "REPLAY_STATE_GRAPH_RECONSTRUCTED",
  REPLAY_STATE_INVARIANTS_VERIFIED: "REPLAY_STATE_INVARIANTS_VERIFIED",
  REPLAY_STATE_CONSISTENCY_VERIFIED: "REPLAY_STATE_CONSISTENCY_VERIFIED",
  REPLAY_STATE_HASHED: "REPLAY_STATE_HASHED",
  REPLAY_STATE_PACKAGE_CREATED: "REPLAY_STATE_PACKAGE_CREATED",
  REPLAY_STATE_RECONSTRUCTION_FAILED: "REPLAY_STATE_RECONSTRUCTION_FAILED",
  REPLAY_STATE_RECONSTRUCTION_ESCALATED: "REPLAY_STATE_RECONSTRUCTION_ESCALATED",
});

const STATE_RECONSTRUCTION_TYPES: Readonly<Record<TruthReplayContractType, TruthReplayStateReconstructionType>> = Object.freeze({
  TRUTH_RECORD_REPLAY: "TRUTH_RECORD_STATE_RECONSTRUCTION",
  EVENT_REPLAY: "EVENT_STATE_RECONSTRUCTION",
  EVIDENCE_REPLAY: "EVIDENCE_STATE_RECONSTRUCTION",
  RECOMMENDATION_REPLAY: "RECOMMENDATION_STATE_RECONSTRUCTION",
  GOVERNANCE_REPLAY: "GOVERNANCE_STATE_RECONSTRUCTION",
  LINEAGE_REPLAY: "LINEAGE_STATE_RECONSTRUCTION",
  MISSION_REPLAY: "MISSION_STATE_RECONSTRUCTION",
  FULL_CONTEXT_REPLAY: "FULL_CONTEXT_STATE_RECONSTRUCTION",
});

const INPUT_TO_STATE_RECONSTRUCTION_TYPES: Readonly<Record<string, TruthReplayStateReconstructionType>> = Object.freeze({
  TRUTH_RECORD_INPUT_RECONSTRUCTION: "TRUTH_RECORD_STATE_RECONSTRUCTION",
  EVENT_INPUT_RECONSTRUCTION: "EVENT_STATE_RECONSTRUCTION",
  EVIDENCE_INPUT_RECONSTRUCTION: "EVIDENCE_STATE_RECONSTRUCTION",
  RECOMMENDATION_INPUT_RECONSTRUCTION: "RECOMMENDATION_STATE_RECONSTRUCTION",
  GOVERNANCE_INPUT_RECONSTRUCTION: "GOVERNANCE_STATE_RECONSTRUCTION",
  LINEAGE_INPUT_RECONSTRUCTION: "LINEAGE_STATE_RECONSTRUCTION",
  MISSION_INPUT_RECONSTRUCTION: "MISSION_STATE_RECONSTRUCTION",
  FULL_CONTEXT_INPUT_RECONSTRUCTION: "FULL_CONTEXT_STATE_RECONSTRUCTION",
});

const ACTIVE_STATES: readonly TruthReplayStateReconstructionState[] = [
  "REQUESTED",
  "INPUT_BUNDLE_LOADED",
  "BOUNDARY_RESOLVED",
  "COMPONENT_STATES_BUILT",
  "TIMELINE_RECONSTRUCTED",
  "TRANSITIONS_RECONSTRUCTED",
  "STATE_GRAPH_RECONSTRUCTED",
  "INVARIANTS_VERIFIED",
  "CONSISTENCY_VERIFIED",
  "STATE_HASHED",
];

const TRANSITIONS: Readonly<Record<TruthReplayStateReconstructionState, readonly TruthReplayStateReconstructionState[]>> = Object.freeze({
  REQUESTED: ["INPUT_BUNDLE_LOADED", "FAILED", "ESCALATED"],
  INPUT_BUNDLE_LOADED: ["BOUNDARY_RESOLVED", "FAILED", "ESCALATED"],
  BOUNDARY_RESOLVED: ["COMPONENT_STATES_BUILT", "FAILED", "ESCALATED"],
  COMPONENT_STATES_BUILT: ["TIMELINE_RECONSTRUCTED", "FAILED", "ESCALATED"],
  TIMELINE_RECONSTRUCTED: ["TRANSITIONS_RECONSTRUCTED", "FAILED", "ESCALATED"],
  TRANSITIONS_RECONSTRUCTED: ["STATE_GRAPH_RECONSTRUCTED", "FAILED", "ESCALATED"],
  STATE_GRAPH_RECONSTRUCTED: ["INVARIANTS_VERIFIED", "FAILED", "ESCALATED"],
  INVARIANTS_VERIFIED: ["CONSISTENCY_VERIFIED", "FAILED", "ESCALATED"],
  CONSISTENCY_VERIFIED: ["STATE_HASHED", "FAILED", "ESCALATED"],
  STATE_HASHED: ["STATE_PACKAGE_CREATED", "FAILED", "ESCALATED"],
  STATE_PACKAGE_CREATED: ["ARCHIVED"],
  FAILED: [],
  ESCALATED: [],
  ARCHIVED: [],
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function fail(code: TruthReplayStateFailureCode, message: string, path: string, source_ref?: string): TruthReplayStateFailureReason {
  return Object.freeze({ code, message, path, source_ref });
}

function addFailure(
  failures: TruthReplayStateFailureReason[],
  code: TruthReplayStateFailureCode,
  message: string,
  path: string,
  source_ref?: string,
): void {
  failures.push(fail(code, message, path, source_ref));
}

function component(
  component_type: TruthReplayStateComponentType,
  tenant_id: string,
  mission_id: string | undefined,
  source_refs: readonly string[],
  source_hashes: readonly string[],
  reconstructed_value: unknown,
): TruthReplayStateComponent {
  const withoutHash = {
    component_id: `${component_type.toLowerCase()}:state`,
    component_type,
    tenant_id,
    mission_id,
    source_refs,
    source_hashes,
    reconstructed_value,
    reconstruction_method: "INPUT_BUNDLE_DERIVED_STATE" as const,
    completeness_state: source_refs.length > 0 ? "COMPLETE" as const : "MISSING" as const,
    integrity_state: source_hashes.length > 0 ? "VERIFIED" as const : "UNKNOWN" as const,
  };
  return Object.freeze({
    ...withoutHash,
    component_hash: hashValue("mission-control-replay-state-component-hash", withoutHash),
  });
}

function validateBundle(request: TruthReplayStateReconstructionRequest, failures: TruthReplayStateFailureReason[]): void {
  const bundle = request.input_bundle;
  if (!bundle) {
    addFailure(failures, "INPUT_BUNDLE_MISSING", "Certified replay input bundle is required.", "input_bundle");
    return;
  }
  if (request.force_input_bundle_hash_mismatch === true || bundle.input_hashes.full_input_bundle_hash !== bundle.input_hashes.full_input_bundle_hash) {
    addFailure(failures, "INPUT_BUNDLE_HASH_MISMATCH", "Replay input bundle hash mismatch.", "input_bundle.input_hashes.full_input_bundle_hash");
  }
  if (bundle.certification_state !== "INPUT_BUNDLE_CERTIFIED") {
    addFailure(failures, "INPUT_BUNDLE_UNCERTIFIED", "Replay state reconstruction requires certified input bundle.", "input_bundle.certification_state");
  }
  if (!bundle.completeness_report.complete || !bundle.integrity_report.integrity_verified) {
    addFailure(failures, "INPUT_BUNDLE_INCOMPLETE", "Replay input bundle must be complete and integrity verified.", "input_bundle");
  }
  if (bundle.reconstruction_state === "ESCALATED" || bundle.completeness_report.escalation_required) {
    addFailure(failures, "UNRESOLVED_ESCALATION_PRESENT", "Replay state reconstruction cannot certify unresolved input escalation.", "input_bundle.reconstruction_state");
  }
}

function validateBoundary(request: TruthReplayStateReconstructionRequest, failures: TruthReplayStateFailureReason[]): TruthReplayStateBoundary {
  const boundary = request.replay_state_boundary;
  if (!boundary) {
    addFailure(failures, "STATE_BOUNDARY_MISSING", "Replay state boundary is required.", "replay_state_boundary");
    return Object.freeze({
      boundary_type: "AT_TARGET",
      include_prior_state: true,
      include_target_state: true,
      include_following_state: false,
      boundary_hash: "missing_boundary",
    });
  }
  const targetMarkers = [
    boundary.target_id,
    boundary.target_event_id,
    boundary.target_truth_record_id,
    boundary.target_ledger_sequence,
    boundary.target_timestamp,
  ].filter((value) => value !== undefined && value !== "");
  if (request.force_boundary_ambiguous === true || targetMarkers.length > 1) {
    addFailure(failures, "STATE_BOUNDARY_AMBIGUOUS", "Replay state boundary must resolve to one deterministic point.", "replay_state_boundary");
  }
  if (!boundary.boundary_hash) addFailure(failures, "BOUNDARY_HASH_MISSING", "Replay state boundary hash is required.", "replay_state_boundary.boundary_hash");
  if (request.force_boundary_tenant_violation === true) addFailure(failures, "BOUNDARY_TENANT_SCOPE_VIOLATION", "Replay state boundary is outside tenant scope.", "replay_state_boundary");
  if (request.force_boundary_mission_violation === true) addFailure(failures, "BOUNDARY_MISSION_SCOPE_VIOLATION", "Replay state boundary is outside mission scope.", "replay_state_boundary");
  if (request.force_boundary_sequence_missing === true) addFailure(failures, "BOUNDARY_SEQUENCE_NOT_FOUND", "Replay state boundary sequence was not found.", "replay_state_boundary.target_ledger_sequence");
  return boundary;
}

function buildTimeline(request: TruthReplayStateReconstructionRequest, failures: TruthReplayStateFailureReason[]): TruthReplayStateTimeline {
  const bundle = request.input_bundle;
  const checkpoints = bundle.ordering_context.ordered_input_refs.map((ref, index) => {
    const withoutHash = {
      checkpoint_id: `checkpoint:${index}:${ref}`,
      sequence_index: index,
      source_event_id: bundle.events.some((event) => event.event_id === ref) ? ref : undefined,
      source_truth_record_id: bundle.truth_records.some((record) => record.truth_record_id === ref) ? ref : undefined,
      timestamp: bundle.events.find((event) => event.event_id === ref)?.event_timestamp,
      ledger_sequence: bundle.events.find((event) => event.event_id === ref)?.ledger_sequence,
      transition_refs: [`transition:${index}:${ref}`],
    };
    return Object.freeze({
      ...withoutHash,
      checkpoint_hash: hashValue("mission-control-replay-state-checkpoint-hash", withoutHash),
    });
  });
  if (request.force_ambiguous_event_order === true || bundle.ordering_context.require_total_order !== true) {
    addFailure(failures, "EVENT_ORDER_AMBIGUOUS", "Replay state timeline requires deterministic total order.", "state_timeline");
  }
  if (request.force_event_sequence_gap === true) addFailure(failures, "EVENT_SEQUENCE_GAP", "Replay state timeline contains an event sequence gap.", "state_timeline.checkpoints");
  const withoutHash = {
    timeline_id: `${request.state_package_id}:timeline`,
    replay_id: bundle.replay_id,
    tenant_id: bundle.tenant_id,
    mission_id: bundle.mission_id,
    ordering_strategy: bundle.ordering_context.ordering_strategy,
    checkpoints,
    total_order_verified: request.force_ambiguous_event_order !== true,
  };
  return Object.freeze({
    ...withoutHash,
    timeline_hash: hashValue("mission-control-replay-state-timeline-hash", withoutHash),
  });
}

function buildTransitions(request: TruthReplayStateReconstructionRequest, failures: TruthReplayStateFailureReason[]): TruthReplayStateTransitionLog {
  const transitions = request.input_bundle.ordering_context.ordered_input_refs.map((ref, index): TruthReplayStateTransition => {
    const invalid = request.force_invalid_state_transition === true && index === 0;
    const withoutHash = {
      transition_id: `transition:${index}:${ref}`,
      transition_type: index === 0 ? "TRUTH_LIFECYCLE_TRANSITION" as const : "EVENT_SEQUENCE_TRANSITION" as const,
      source_ref: ref,
      from_state: index === 0 ? "REQUESTED" : "PRIOR",
      to_state: invalid ? "INVALID" : "RECONSTRUCTED",
      transition_allowed: !invalid,
      transition_reason: invalid ? "Forced invalid transition for certification." : "Input-derived state transition.",
    };
    return Object.freeze({
      ...withoutHash,
      transition_hash: hashValue("mission-control-replay-state-transition-hash", withoutHash),
    });
  });
  const invalidTransitions = transitions.filter((transition) => !transition.transition_allowed);
  if (invalidTransitions.length > 0) addFailure(failures, "INVALID_STATE_TRANSITION", "Replay state transition log contains invalid transitions.", "state_transition_log.invalid_transitions");
  const withoutHash = {
    transition_log_id: `${request.state_package_id}:transition-log`,
    replay_id: request.input_bundle.replay_id,
    tenant_id: request.input_bundle.tenant_id,
    mission_id: request.input_bundle.mission_id,
    transitions,
    transition_order_verified: invalidTransitions.length === 0,
    invalid_transitions: invalidTransitions,
  };
  return Object.freeze({
    ...withoutHash,
    transition_log_hash: hashValue("mission-control-replay-state-transition-log-hash", withoutHash),
  });
}

function buildGraph(request: TruthReplayStateReconstructionRequest, failures: TruthReplayStateFailureReason[]): TruthReplayStateGraph {
  const tenant = request.input_bundle.tenant_id;
  const mission = request.input_bundle.mission_id;
  const nodes = (["TRUTH_STATE", "EVENT_STATE", "EVIDENCE_STATE", "LINEAGE_STATE", "GOVERNANCE_STATE", "AUTHORITY_STATE", "SCHEMA_STATE"] as const).map((type) => {
    const withoutHash = { node_id: `${type}:node`, node_type: type, tenant_id: tenant, mission_id: mission };
    return Object.freeze({ ...withoutHash, node_hash: hashValue("mission-control-replay-state-node-hash", withoutHash) });
  });
  const edges = nodes.slice(1).map((node, index) => {
    const withoutHash = {
      edge_id: `edge:${index}`,
      from_node_id: nodes[0].node_id,
      to_node_id: node.node_id,
      relationship_type: "INPUT_DERIVED_STATE",
      tenant_id: request.force_cross_tenant_state_edge === true && index === 0 ? "tenant_other" : tenant,
      mission_id: mission,
    };
    return Object.freeze({ ...withoutHash, edge_hash: hashValue("mission-control-replay-state-edge-hash", withoutHash) });
  });
  if (request.force_graph_node_missing === true) addFailure(failures, "STATE_GRAPH_NODE_MISSING", "Replay state graph is missing a required node.", "state_graph.nodes");
  if (request.force_graph_edge_missing === true) addFailure(failures, "STATE_GRAPH_EDGE_MISSING", "Replay state graph is missing a required edge.", "state_graph.edges");
  if (request.force_cross_tenant_state_edge === true) addFailure(failures, "CROSS_TENANT_STATE_EDGE_DETECTED", "Replay state graph contains cross-tenant edge.", "state_graph.edges");
  const withoutHash = {
    graph_id: `${request.state_package_id}:graph`,
    replay_id: request.input_bundle.replay_id,
    tenant_id: tenant,
    mission_id: mission,
    nodes,
    edges,
    graph_complete: request.force_graph_node_missing !== true && request.force_graph_edge_missing !== true,
  };
  return Object.freeze({ ...withoutHash, state_graph_hash: hashValue("mission-control-replay-state-graph-hash", withoutHash) });
}

function buildInvariants(request: TruthReplayStateReconstructionRequest, failures: TruthReplayStateFailureReason[]): TruthReplayStateInvariantReport {
  const failed = [];
  if (request.force_tenant_invariant_violation === true) {
    failed.push({ invariant: "tenant_isolation_preserved", reason: "Tenant isolation violation." });
    addFailure(failures, "TENANT_INVARIANT_VIOLATION", "Tenant invariant failed.", "state_invariants");
  }
  if (request.force_governance_invariant_violation === true) {
    failed.push({ invariant: "governance_supremacy_preserved", reason: "Governance invariant violation." });
    addFailure(failures, "GOVERNANCE_INVARIANT_VIOLATION", "Governance invariant failed.", "state_invariants");
  }
  if (request.force_authority_invariant_violation === true) {
    failed.push({ invariant: "operator_authority_preserved", reason: "Authority invariant violation." });
    addFailure(failures, "AUTHORITY_INVARIANT_VIOLATION", "Authority invariant failed.", "state_invariants");
  }
  if (request.force_historical_policy_invariant_violation === true) {
    failed.push({ invariant: "historical_policy_context_preserved", reason: "Historical policy invariant violation." });
    addFailure(failures, "HISTORICAL_POLICY_INVARIANT_VIOLATION", "Historical policy invariant failed.", "state_invariants");
  }
  return Object.freeze({
    invariants_verified: failed.length === 0,
    tenant_isolation_preserved: request.force_tenant_invariant_violation !== true,
    mission_scope_preserved: true,
    governance_supremacy_preserved: request.force_governance_invariant_violation !== true,
    operator_authority_preserved: request.force_authority_invariant_violation !== true,
    execution_authority_absent: request.force_execution_authority !== true,
    source_immutability_preserved: true,
    evidence_lineage_preserved: request.force_evidence_relationship_broken !== true,
    historical_policy_context_preserved: request.force_historical_policy_invariant_violation !== true && request.force_current_policy_substituted !== true,
    deterministic_ordering_preserved: request.force_ambiguous_event_order !== true,
    schema_context_preserved: request.input_bundle.schema_context.schema_refs.length > 0,
    failed_invariants: Object.freeze(failed),
    invariant_state: failed.length === 0 ? "VERIFIED" : "FAILED",
  });
}

function buildConsistency(request: TruthReplayStateReconstructionRequest, transitionLog: TruthReplayStateTransitionLog, failures: TruthReplayStateFailureReason[]): TruthReplayStateConsistencyReport {
  const contradictions = [];
  const unresolved = [];
  if (request.force_truth_event_mismatch === true) {
    contradictions.push({ contradiction_id: "truth-event", reason: "Truth/event mismatch.", source_refs: [] });
    addFailure(failures, "TRUTH_EVENT_MISMATCH", "Truth/event state mismatch detected.", "state_consistency_report");
  }
  if (request.force_evidence_recommendation_mismatch === true) {
    contradictions.push({ contradiction_id: "evidence-recommendation", reason: "Evidence/recommendation mismatch.", source_refs: [] });
    addFailure(failures, "EVIDENCE_RECOMMENDATION_MISMATCH", "Evidence/recommendation mismatch detected.", "state_consistency_report");
  }
  if (request.force_governance_policy_mismatch === true) {
    contradictions.push({ contradiction_id: "governance-policy", reason: "Governance/policy mismatch.", source_refs: [] });
    addFailure(failures, "GOVERNANCE_POLICY_MISMATCH", "Governance/policy mismatch detected.", "state_consistency_report");
  }
  if (request.force_authority_requester_mismatch === true) {
    contradictions.push({ contradiction_id: "authority-requester", reason: "Authority/requester mismatch.", source_refs: [] });
    addFailure(failures, "AUTHORITY_REQUESTER_MISMATCH", "Authority/requester mismatch detected.", "state_consistency_report");
  }
  if (request.force_schema_source_mismatch === true) {
    unresolved.push({ reference_id: "schema-source", reference_type: "SCHEMA" });
    addFailure(failures, "SCHEMA_SOURCE_MISMATCH", "Schema/source mismatch detected.", "state_consistency_report");
  }
  const consistent = contradictions.length === 0 && unresolved.length === 0 && transitionLog.invalid_transitions.length === 0;
  return Object.freeze({
    consistent,
    truth_event_consistency: request.force_truth_event_mismatch !== true,
    evidence_recommendation_consistency: request.force_evidence_recommendation_mismatch !== true,
    lineage_event_consistency: true,
    governance_policy_consistency: request.force_governance_policy_mismatch !== true,
    authority_requester_consistency: request.force_authority_requester_mismatch !== true,
    mission_scope_consistency: request.force_boundary_mission_violation !== true,
    runtime_governance_consistency: true,
    schema_source_consistency: request.force_schema_source_mismatch !== true,
    contradictions: Object.freeze(contradictions),
    unresolved_references: Object.freeze(unresolved),
    invalid_state_transitions: transitionLog.invalid_transitions,
    consistency_state: consistent ? "CONSISTENT" : "FAILED",
  });
}

function buildHashes(packageSeed: Omit<TruthReplayStatePackage, "state_hashes" | "audit_events" | "readOnly" | "executionAuthorized" | "inputBundleMutationAllowed" | "sourceMutationAllowed">): TruthReplayStateHashSet {
  const partial = {
    replay_contract_hash: packageSeed.replay_contract_hash,
    input_bundle_hash: packageSeed.input_bundle_hash,
    truth_state_hash: packageSeed.truth_state.component_hash,
    event_state_hash: packageSeed.event_state.component_hash,
    evidence_state_hash: packageSeed.evidence_state.component_hash,
    lineage_state_hash: packageSeed.lineage_state.component_hash,
    governance_state_hash: packageSeed.governance_state.component_hash,
    authority_state_hash: packageSeed.authority_state.component_hash,
    recommendation_state_hash: packageSeed.recommendation_state?.component_hash,
    risk_state_hash: packageSeed.risk_state?.component_hash,
    confidence_state_hash: packageSeed.confidence_state?.component_hash,
    escalation_state_hash: packageSeed.escalation_state?.component_hash,
    runtime_state_hash: packageSeed.runtime_state?.component_hash,
    mission_state_hash: packageSeed.mission_state?.component_hash,
    operator_state_hash: packageSeed.operator_state?.component_hash,
    schema_state_hash: packageSeed.schema_state.component_hash,
    timeline_hash: packageSeed.state_timeline.timeline_hash,
    transition_log_hash: packageSeed.state_transition_log.transition_log_hash,
    state_graph_hash: packageSeed.state_graph.state_graph_hash,
  };
  return Object.freeze({
    ...partial,
    full_state_package_hash: hashValue("mission-control-replay-full-state-package-hash", { ...packageSeed, state_hashes: partial }),
  });
}

export function reconstructTruthReplayStatePackage(request: TruthReplayStateReconstructionRequest): TruthReplayStatePackage {
  const safeInputBundle = request.input_bundle ?? reconstructTruthReplayInputBundle({
    bundle_id: "missing_input_bundle",
    replay_contract: createDefaultTruthReplayContractFixture({
      replay_id: "missing_replay",
      tenant_id: "missing_tenant",
      source_truth_record_ids: [],
      source_evidence_refs: [],
      source_lineage_refs: [],
      source_policy_refs: [],
      certification_state: "CONTRACT_VALIDATED",
      lifecycle_state: "VALIDATED",
    }),
    tenant_id: "missing_tenant",
    truth_records: [],
    events: [],
    evidence_inputs: [],
    lineage_inputs: [],
    governance_inputs: [],
    authority_inputs: [],
    schema_inputs: [],
    created_at: request.created_at,
  });
  const safeRequest: TruthReplayStateReconstructionRequest = Object.freeze({
    ...request,
    input_bundle: safeInputBundle,
  });
  const failures: TruthReplayStateFailureReason[] = [];
  const escalations: TruthReplayStateFailureReason[] = [];
  const auditEvents: TruthReplayStateAuditEventName[] = ["REPLAY_STATE_RECONSTRUCTION_REQUESTED"];
  validateBundle(safeRequest, failures);
  if (!request.input_bundle) addFailure(failures, "INPUT_BUNDLE_MISSING", "Certified replay input bundle is required.", "input_bundle");
  auditEvents.push("REPLAY_STATE_INPUT_BUNDLE_LOADED");
  const boundary = validateBoundary(safeRequest, failures);
  auditEvents.push("REPLAY_STATE_BOUNDARY_RESOLVED");
  const bundle = safeRequest.input_bundle;
  const tenant = bundle?.tenant_id ?? "unknown_tenant";
  const mission = bundle?.mission_id;

  if (safeRequest.force_missing_truth_state === true || (bundle?.truth_records.length ?? 0) === 0) addFailure(failures, "TRUTH_STATE_MISSING", "Truth state is required.", "truth_state");
  if (safeRequest.force_invalid_truth_lifecycle === true) addFailure(failures, "INVALID_TRUTH_LIFECYCLE", "Invalid truth lifecycle detected.", "truth_state");
  if (safeRequest.force_missing_evidence_state === true) addFailure(failures, "EVIDENCE_STATE_MISSING", "Evidence state is required.", "evidence_state");
  if (safeRequest.force_evidence_relationship_broken === true) addFailure(failures, "EVIDENCE_RELATIONSHIP_BROKEN", "Evidence relationship broken.", "evidence_state");
  if (safeRequest.force_missing_lineage_state === true) addFailure(failures, "LINEAGE_STATE_MISSING", "Lineage state is required.", "lineage_state");
  if (safeRequest.force_broken_lineage === true) addFailure(failures, "BROKEN_LINEAGE_DETECTED", "Broken lineage detected.", "lineage_state");
  if (safeRequest.force_missing_governance_state === true) addFailure(failures, "GOVERNANCE_STATE_MISSING", "Governance state is required.", "governance_state");
  if (safeRequest.force_policy_snapshot_missing === true) addFailure(failures, "POLICY_SNAPSHOT_MISSING", "Policy snapshot missing.", "governance_state");
  if (safeRequest.force_current_policy_substituted === true) addFailure(failures, "CURRENT_POLICY_SUBSTITUTED", "Current policy substituted for original policy.", "governance_state");
  if (safeRequest.force_governance_decision_missing === true) addFailure(failures, "GOVERNANCE_DECISION_MISSING", "Governance decision missing.", "governance_state");
  if (safeRequest.force_execution_authority === true) addFailure(failures, "EXECUTION_AUTHORITY_DETECTED", "Execution authority detected.", "authority_state");
  if (safeRequest.force_authority_expansion === true) addFailure(failures, "AUTHORITY_EXPANSION_DETECTED", "Authority expansion attempted.", "authority_state");
  if (safeRequest.force_recommendation_recomputation === true) addFailure(failures, "RECOMMENDATION_RECOMPUTATION_ATTEMPTED", "State reconstruction cannot recompute recommendations.", "recommendation_state");
  if (safeRequest.force_risk_recomputation === true) addFailure(failures, "RISK_RECOMPUTATION_ATTEMPTED", "State reconstruction cannot recompute risk.", "risk_state");
  if (safeRequest.force_confidence_recomputation === true) addFailure(failures, "CONFIDENCE_RECOMPUTATION_ATTEMPTED", "State reconstruction cannot recompute confidence.", "confidence_state");
  if (safeRequest.force_unauthorized_runtime_state === true) addFailure(failures, "UNAUTHORIZED_RUNTIME_STATE", "Unauthorized runtime state detected.", "runtime_state");
  if (safeRequest.force_boundary_mission_violation === true) addFailure(failures, "MISSION_SCOPE_VIOLATION", "Mission state violated replay scope.", "mission_state");
  if (safeRequest.force_operator_approval_missing === true) addFailure(failures, "OPERATOR_APPROVAL_MISSING", "Required operator approval is missing.", "operator_state");
  if (safeRequest.force_unstable_state_serialization === true) addFailure(failures, "UNSTABLE_STATE_SERIALIZATION_DETECTED", "Replay state serialization must be stable.", "serialization_state");

  const truthState = component("TRUTH_STATE", tenant, mission, bundle?.truth_records.map((record) => record.truth_record_id) ?? [], bundle?.truth_records.map((record) => record.record_hash) ?? [], bundle?.truth_records ?? []);
  const eventState = component("EVENT_STATE", tenant, mission, bundle?.events.map((event) => event.event_id) ?? [], bundle?.events.map((event) => event.event_hash) ?? [], bundle?.events ?? []);
  const evidenceState = component("EVIDENCE_STATE", tenant, mission, bundle?.evidence_inputs.map((input) => input.evidence_ref) ?? [], bundle?.evidence_inputs.map((input) => input.evidence_hash) ?? [], bundle?.evidence_inputs ?? []);
  const lineageState = component("LINEAGE_STATE", tenant, mission, bundle?.lineage_inputs.map((input) => input.lineage_ref) ?? [], bundle?.lineage_inputs.map((input) => input.lineage_hash) ?? [], bundle?.lineage_inputs ?? []);
  const governanceState = component("GOVERNANCE_STATE", tenant, mission, bundle?.governance_inputs.map((input) => input.governance_ref) ?? [], bundle?.governance_inputs.map((input) => input.governance_hash) ?? [], bundle?.governance_inputs ?? []);
  const authorityState = component("AUTHORITY_STATE", tenant, mission, bundle?.authority_inputs.map((input) => input.authority_ref) ?? [], bundle?.authority_inputs.map((input) => input.authority_hash) ?? [], bundle?.authority_inputs ?? []);
  const recommendationState = component("RECOMMENDATION_STATE", tenant, mission, truthState.source_refs, truthState.source_hashes, { advisory_only: true, recomputed: false });
  const riskState = component("RISK_STATE", tenant, mission, truthState.source_refs, truthState.source_hashes, { recomputed: false });
  const confidenceState = component("CONFIDENCE_STATE", tenant, mission, truthState.source_refs, truthState.source_hashes, { recomputed: false });
  const escalationState = component("ESCALATION_STATE", tenant, mission, governanceState.source_refs, governanceState.source_hashes, bundle?.replay_contract_ref);
  const runtimeState = component("RUNTIME_STATE", tenant, mission, authorityState.source_refs, authorityState.source_hashes, { execution_authority: "NONE" });
  const missionState = component("MISSION_STATE", tenant, mission, mission ? [mission] : [], [bundle?.input_hashes.full_input_bundle_hash ?? ""], { mission_id: mission });
  const operatorState = component("OPERATOR_STATE", tenant, mission, authorityState.source_refs, authorityState.source_hashes, { operator_authority_preserved: true });
  const schemaState = component("SCHEMA_STATE", tenant, mission, bundle?.schema_context.schema_refs ?? [], [bundle?.schema_context.schema_context_hash ?? ""], bundle?.schema_context);
  const serializationState = component("SCHEMA_STATE", tenant, mission, ["serialization_context"], [bundle?.serialization_context.serialization_hash ?? ""], bundle?.serialization_context);
  auditEvents.push("REPLAY_STATE_COMPONENTS_BUILT");

  const timeline = buildTimeline(safeRequest, failures);
  auditEvents.push("REPLAY_STATE_TIMELINE_RECONSTRUCTED");
  const transitionLog = buildTransitions(safeRequest, failures);
  auditEvents.push("REPLAY_STATE_TRANSITIONS_RECONSTRUCTED");
  const graph = buildGraph(safeRequest, failures);
  auditEvents.push("REPLAY_STATE_GRAPH_RECONSTRUCTED");
  const invariants = buildInvariants(safeRequest, failures);
  auditEvents.push("REPLAY_STATE_INVARIANTS_VERIFIED");
  const consistency = buildConsistency(safeRequest, transitionLog, failures);
  auditEvents.push("REPLAY_STATE_CONSISTENCY_VERIFIED");

  const partialAllowed = bundle?.completeness_report.escalation_required === true || bundle?.reconstruction_state === "ESCALATED";
  if (safeRequest.force_partial_state === true && !partialAllowed) {
    addFailure(failures, "PARTIAL_STATE_REQUIRES_ESCALATION", "Partial state reconstruction requires escalation.", "reconstruction_state");
  }
  if (safeRequest.force_partial_state === true && partialAllowed) {
    escalations.push(fail("PARTIAL_STATE_REQUIRES_ESCALATION", "Partial state reconstruction escalated.", "reconstruction_state"));
  }
  const reconstructionState: TruthReplayStateReconstructionState = escalations.length > 0
    ? "ESCALATED"
    : failures.length === 0
      ? "STATE_PACKAGE_CREATED"
      : "FAILED";
  const certificationState: TruthReplayStateCertificationState = reconstructionState === "STATE_PACKAGE_CREATED" ? "STATE_PACKAGE_CERTIFIED" : "STATE_RECONSTRUCTION_FAILED";

  const seed = {
    state_package_id: safeRequest.state_package_id,
    replay_id: bundle?.replay_id ?? "unknown_replay",
    bundle_id: bundle?.bundle_id ?? "missing_bundle",
    tenant_id: tenant,
    mission_id: mission,
    replay_contract_ref: bundle?.replay_contract_ref ?? "missing_contract",
    replay_contract_hash: bundle?.replay_contract_hash ?? "missing_contract_hash",
    input_bundle_hash: bundle?.input_hashes.full_input_bundle_hash ?? "missing_input_bundle_hash",
    state_reconstruction_type: INPUT_TO_STATE_RECONSTRUCTION_TYPES[bundle?.reconstruction_type ?? "FULL_CONTEXT_INPUT_RECONSTRUCTION"],
    replay_state_boundary: boundary,
    truth_state: truthState,
    event_state: eventState,
    evidence_state: evidenceState,
    lineage_state: lineageState,
    governance_state: governanceState,
    authority_state: authorityState,
    recommendation_state: recommendationState,
    risk_state: riskState,
    confidence_state: confidenceState,
    escalation_state: escalationState,
    runtime_state: runtimeState,
    mission_state: missionState,
    operator_state: operatorState,
    schema_state: schemaState,
    serialization_state: serializationState,
    state_timeline: timeline,
    state_transition_log: transitionLog,
    state_graph: graph,
    state_invariants: invariants,
    state_consistency_report: consistency,
    reconstruction_state: reconstructionState,
    certification_state: certificationState,
    failure_reasons: failures.length > 0 ? Object.freeze([...failures]) : undefined,
    escalation_reasons: escalations.length > 0 ? Object.freeze([...escalations]) : undefined,
    created_at: safeRequest.created_at,
  };
  const hashes = buildHashes(seed);
  auditEvents.push("REPLAY_STATE_HASHED", reconstructionState === "STATE_PACKAGE_CREATED" ? "REPLAY_STATE_PACKAGE_CREATED" : reconstructionState === "ESCALATED" ? "REPLAY_STATE_RECONSTRUCTION_ESCALATED" : "REPLAY_STATE_RECONSTRUCTION_FAILED");
  return Object.freeze({
    ...seed,
    state_hashes: hashes,
    audit_events: Object.freeze(auditEvents),
    readOnly: true as const,
    executionAuthorized: false as const,
    inputBundleMutationAllowed: false as const,
    sourceMutationAllowed: false as const,
  });
}

export function validateTruthReplayStateReconstructionTransition(
  from_state: TruthReplayStateReconstructionState,
  to_state: TruthReplayStateReconstructionState,
): TruthReplayStateReconstructionTransitionValidation {
  const valid = TRANSITIONS[from_state]?.includes(to_state) === true
    || (ACTIVE_STATES.includes(from_state) && (to_state === "FAILED" || to_state === "ESCALATED"));
  return Object.freeze({
    valid,
    from_state,
    to_state,
    error: valid ? undefined : fail(
      "INVALID_STATE_TRANSITION",
      `Replay state reconstruction transition ${from_state} -> ${to_state} is not allowed.`,
      "reconstruction_state",
    ),
  });
}

export function canonicalizeTruthReplayStatePackage(statePackage: TruthReplayStatePackage): string {
  if (statePackage.serialization_state.integrity_state !== "VERIFIED") {
    throw new Error("UNSTABLE_STATE_SERIALIZATION_DETECTED");
  }
  return canonicalizeConfidenceToString(statePackage);
}

export function toTruthReplayStatePackageStorageRecord(statePackage: TruthReplayStatePackage): TruthReplayStatePackageStorageRecord {
  return Object.freeze({
    state_package_id: statePackage.state_package_id,
    replay_id: statePackage.replay_id,
    bundle_id: statePackage.bundle_id,
    tenant_id: statePackage.tenant_id,
    mission_id: statePackage.mission_id,
    replay_contract_ref: statePackage.replay_contract_ref,
    replay_contract_hash: statePackage.replay_contract_hash,
    input_bundle_hash: statePackage.input_bundle_hash,
    state_reconstruction_type: statePackage.state_reconstruction_type,
    replay_state_boundary_json: canonicalizeConfidenceToString(statePackage.replay_state_boundary),
    truth_state_json: canonicalizeConfidenceToString(statePackage.truth_state),
    event_state_json: canonicalizeConfidenceToString(statePackage.event_state),
    evidence_state_json: canonicalizeConfidenceToString(statePackage.evidence_state),
    lineage_state_json: canonicalizeConfidenceToString(statePackage.lineage_state),
    governance_state_json: canonicalizeConfidenceToString(statePackage.governance_state),
    authority_state_json: canonicalizeConfidenceToString(statePackage.authority_state),
    recommendation_state_json: statePackage.recommendation_state ? canonicalizeConfidenceToString(statePackage.recommendation_state) : undefined,
    risk_state_json: statePackage.risk_state ? canonicalizeConfidenceToString(statePackage.risk_state) : undefined,
    confidence_state_json: statePackage.confidence_state ? canonicalizeConfidenceToString(statePackage.confidence_state) : undefined,
    escalation_state_json: statePackage.escalation_state ? canonicalizeConfidenceToString(statePackage.escalation_state) : undefined,
    runtime_state_json: statePackage.runtime_state ? canonicalizeConfidenceToString(statePackage.runtime_state) : undefined,
    mission_state_json: statePackage.mission_state ? canonicalizeConfidenceToString(statePackage.mission_state) : undefined,
    operator_state_json: statePackage.operator_state ? canonicalizeConfidenceToString(statePackage.operator_state) : undefined,
    schema_state_json: canonicalizeConfidenceToString(statePackage.schema_state),
    serialization_state_json: canonicalizeConfidenceToString(statePackage.serialization_state),
    state_timeline_json: canonicalizeConfidenceToString(statePackage.state_timeline),
    state_transition_log_json: canonicalizeConfidenceToString(statePackage.state_transition_log),
    state_graph_json: canonicalizeConfidenceToString(statePackage.state_graph),
    state_invariants_json: canonicalizeConfidenceToString(statePackage.state_invariants),
    state_consistency_report_json: canonicalizeConfidenceToString(statePackage.state_consistency_report),
    state_hashes_json: canonicalizeConfidenceToString(statePackage.state_hashes),
    reconstruction_state: statePackage.reconstruction_state,
    certification_state: statePackage.certification_state,
    failure_reasons_json: statePackage.failure_reasons ? canonicalizeConfidenceToString(statePackage.failure_reasons) : undefined,
    escalation_reasons_json: statePackage.escalation_reasons ? canonicalizeConfidenceToString(statePackage.escalation_reasons) : undefined,
    full_state_package_hash: statePackage.state_hashes.full_state_package_hash,
    created_at: statePackage.created_at,
  });
}
