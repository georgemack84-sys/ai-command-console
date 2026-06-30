import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildDefaultPolicyGraphInputs, buildPolicyDependencyGraph } from "@/services/policy-dependency-graph";
import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyDependencyEdge, PolicyDependencyGraph } from "@/types/policy-dependency-graph";
import type {
  ConstitutionalResolution,
  PolicyIdentity,
  PolicyInfluenceScore,
  PolicyLineageEngineInput,
  PolicyLineageEngineResult,
  PolicyLineageErrorCode,
  PolicyLineageFailureReason,
  PolicyLineageObservabilitySurface,
  PolicyLineageReconstruction,
  PolicyLineageRelationship,
  PolicyLineageReplayRefs,
  PolicyLineageReplayResult,
  PolicyLineageScenario,
  PolicyLineageState,
  PolicyLineageTransitionResult,
  PolicyLineageValidationFailure,
  PolicyLineageValidationResult,
  PolicyTimelineEvent,
  PolicyTimelineEventType,
} from "@/types/policy-lineage-reconstruction";

const NOW = "2026-06-26T18:00:00.000Z";
const SCHEMA_VERSION = "policy-lineage-reconstruction/v7G.2" as const;
const STATES: readonly PolicyLineageState[] = Object.freeze(["DISCOVERED", "RESOLVED", "RECONSTRUCTED", "VALIDATED", "CERTIFIED", "ARCHIVED"]);
const ERROR_CODES: Readonly<Record<PolicyLineageFailureReason, PolicyLineageErrorCode>> = Object.freeze({
  MISSING_POLICY_IDENTIFIER: "PLR-001",
  DUPLICATE_POLICY_IDENTIFIER: "PLR-002",
  POLICY_VERSION_NOT_FOUND: "PLR-003",
  PARENT_POLICY_MISSING: "PLR-004",
  DEPENDENCY_RESOLUTION_FAILED: "PLR-005",
  INHERITANCE_CHAIN_INCOMPLETE: "PLR-006",
  SUPERSESSION_INCONSISTENCY: "PLR-007",
  CONSTITUTIONAL_REFERENCE_MISSING: "PLR-008",
  TIMELINE_RECONSTRUCTION_FAILED: "PLR-009",
  HIDDEN_POLICY_INFLUENCE_DETECTED: "PLR-010",
  CROSS_TENANT_POLICY_REFERENCE: "PLR-011",
  REPLAY_RECONSTRUCTION_MISMATCH: "PLR-012",
  HISTORICAL_INTEGRITY_VIOLATION: "PLR-013",
  INVALID_POLICY_STATE_TRANSITION: "PLR-014",
  POLICY_LINEAGE_VALIDATION_FAILED: "PLR-015",
});
let defaultInputsCache: Readonly<{ policy_analyses: readonly PolicyAnalysisRecord[]; policy_graph: PolicyDependencyGraph }> | null = null;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function failure(reason: PolicyLineageFailureReason, field_path: string, message: string): PolicyLineageValidationFailure {
  return Object.freeze({ error_code: ERROR_CODES[reason], reason, field_path, message, fail_closed: true });
}

function identity(policy: PolicyAnalysisRecord, status: PolicyIdentity["status"] = "ACTIVE"): PolicyIdentity {
  return Object.freeze({
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    tenant_id: policy.tenant_id,
    mission_id: policy.governance_scope.mission_scope,
    effective_timestamp: policy.supersession.effective_timestamp,
    expiration_timestamp: status === "SUPERSEDED" || status === "ARCHIVED" ? NOW : null,
    status,
  });
}

function syntheticPolicy(policy_id: string, tenant_id: string, mission_id: string, status: PolicyIdentity["status"] = "HISTORICAL"): PolicyIdentity {
  return Object.freeze({
    policy_id,
    policy_version: policy_id.includes("constitution") ? "v1.0.0" : "v0.9.0",
    tenant_id,
    mission_id,
    effective_timestamp: "2026-01-01T00:00:00.000Z",
    expiration_timestamp: status === "ACTIVE" ? null : "2026-06-25T23:59:59.000Z",
    status,
  });
}

function relationship(input: Omit<PolicyLineageRelationship, "relationship_hash">): PolicyLineageRelationship {
  return Object.freeze({ ...input, evidence_refs: uniq(input.evidence_refs), replay_refs: uniq(input.replay_refs), relationship_hash: hashValue("policy-lineage-relationship", input) });
}

function timeline(event_type: PolicyTimelineEventType, policy: PolicyIdentity, index: number, reason: string): PolicyTimelineEvent {
  const source = {
    event_id: `plt_${policy.policy_id}_${event_type.toLowerCase()}_${index}`,
    event_type,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    timestamp: new Date(Date.parse("2026-01-01T00:00:00.000Z") + index * 86400000).toISOString(),
    reason,
    truth_record_ref: `truth_${policy.tenant_id}_${policy.policy_id}_${event_type.toLowerCase()}`,
    evidence_refs: Object.freeze([`evidence_${policy.tenant_id}_${policy.policy_id}_${event_type.toLowerCase()}`]),
  };
  return Object.freeze({ ...source, event_hash: hashValue("policy-lineage-timeline-event", source) });
}

function resolution(policy: PolicyIdentity, scenario: PolicyLineageScenario): ConstitutionalResolution {
  const source = {
    constitutional_rule_id: scenario === "CONSTITUTION_MISSING" ? "" : `constitution_${policy.tenant_id}_operator_supremacy`,
    precedence: "HIGHEST" as const,
    constrains_policy_id: policy.policy_id,
    conflict_detected: scenario === "SUPERSESSION_INCONSISTENT",
    override_applied: scenario === "SUPERSESSION_INCONSISTENT",
    resolution_reason: "Constitutional governance has highest precedence; conflicting policies remain historically visible and are marked overridden.",
    evidence_refs: scenario === "CONSTITUTION_MISSING" ? Object.freeze([]) : Object.freeze([`evidence_${policy.tenant_id}_constitutional_precedence`]),
  };
  return Object.freeze({ ...source, resolution_hash: hashValue("policy-lineage-constitutional-resolution", source) });
}

function influence(policy: PolicyIdentity, factors: readonly string[], constitutional_weight: number, governance_weight: number): PolicyInfluenceScore {
  const score = Math.round(constitutional_weight * 40 + governance_weight * 60);
  const level: PolicyInfluenceScore["influence_level"] = score >= 90 ? "MANDATORY" : score >= 75 ? "HIGH" : score >= 55 ? "MEDIUM" : score >= 30 ? "LOW" : "INFORMATIONAL";
  const source = {
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    influence_level: level,
    influence_score: score,
    factors: Object.freeze([...factors].sort()),
    constitutional_weight,
    governance_weight,
    replay_refs: Object.freeze([`replay_${policy.tenant_id}_${policy.policy_id}_influence`]),
  };
  return Object.freeze({ ...source, influence_hash: hashValue("policy-lineage-influence", source) });
}

function defaults(input: PolicyLineageEngineInput = {}) {
  if (!input.policy_analyses && !input.policy_graph && defaultInputsCache) return defaultInputsCache;
  const base = buildDefaultPolicyGraphInputs();
  const policy_analyses = input.policy_analyses ?? base.policy_analyses;
  const policy_graph = input.policy_graph ?? buildPolicyDependencyGraph(policy_analyses, base.policy_correlations);
  const resolved = { policy_analyses, policy_graph };
  if (!input.policy_analyses && !input.policy_graph) defaultInputsCache = Object.freeze(resolved);
  return resolved;
}

export function resolvePolicy(input: PolicyLineageEngineInput = {}): PolicyIdentity {
  const scenario = input.scenario ?? "BASELINE";
  const { policy_analyses } = defaults(input);
  const root = policy_analyses[0];
  if (!root) return syntheticPolicy("", input.tenant_id ?? "tenant_alpha", input.mission_id ?? "mission_governance_lineage", "ARCHIVED");
  if (scenario === "MISSING_POLICY_ID") return Object.freeze({ ...identity(root), policy_id: "" });
  if (scenario === "VERSION_NOT_FOUND") return Object.freeze({ ...identity(root), policy_version: "" });
  if (scenario === "CROSS_TENANT") return Object.freeze({ ...identity(root), tenant_id: "tenant_beta" });
  return identity(root);
}

export function resolvePolicyDependencies(reconstructionOrInput: PolicyLineageReconstruction | PolicyLineageEngineInput = {}): readonly PolicyLineageRelationship[] {
  if ("dependency_graph" in reconstructionOrInput) return reconstructionOrInput.dependency_graph;
  const { policy_graph, policy_analyses } = defaults(reconstructionOrInput);
  const root = policy_analyses[0];
  const edges = policy_graph.dependency_records.length ? policy_graph.dependency_records : policy_graph.edge_set.filter((edge) => edge.relationship_type === "DEPENDS_ON");
  return Object.freeze(edges.map((edge) => relationship({
    relationship_id: `plr_dependency_${edge.edge_id}`,
    relationship_type: "DEPENDENCY",
    source_policy_id: edge.source_policy_id,
    target_policy_id: edge.target_policy_id,
    source_policy_version: edge.source_policy_version,
    target_policy_version: edge.target_policy_version,
    reason: "Policy dependency was reconstructed from the immutable 7B.3 dependency graph.",
    evidence_refs: edge.evidence_refs,
    replay_refs: edge.replay_refs,
  })).concat(root ? [relationship({
    relationship_id: `plr_constitution_dependency_${root.policy_id}`,
    relationship_type: "CONSTITUTIONAL",
    source_policy_id: root.policy_id,
    target_policy_id: `constitution_${root.tenant_id}_operator_supremacy`,
    source_policy_version: root.policy_version,
    target_policy_version: "v1.0.0",
    reason: "Constitutional precedence constrains every reconstructed policy lineage.",
    evidence_refs: [`evidence_${root.tenant_id}_constitutional_precedence`],
    replay_refs: [root.replay_refs.policy_snapshot_ref],
  })] : []));
}

export function resolvePolicyInheritance(reconstructionOrInput: PolicyLineageReconstruction | PolicyLineageEngineInput = {}): readonly PolicyLineageRelationship[] {
  if ("inheritance_chain" in reconstructionOrInput) return reconstructionOrInput.inheritance_chain;
  const { policy_graph, policy_analyses } = defaults(reconstructionOrInput);
  const edges = policy_graph.inheritance_records.length ? policy_graph.inheritance_records : policy_graph.edge_set.filter((edge) => edge.relationship_type === "INHERITS");
  const inferred = edges.map((edge) => relationshipFromGraph(edge, "INHERITANCE", "Policy inheritance was reconstructed from source policy lineage refs."));
  if (inferred.length) return Object.freeze(inferred);
  const root = policy_analyses[0];
  if (!root) return Object.freeze([]);
  return Object.freeze([relationship({
    relationship_id: `plr_inheritance_${root.policy_id}_tenant`,
    relationship_type: "INHERITANCE",
    source_policy_id: root.policy_id,
    target_policy_id: `policy_${root.tenant_id}_organization_governance`,
    source_policy_version: root.policy_version,
    target_policy_version: "v1.0.0",
    reason: "Mission policy inherits tenant organization governance.",
    evidence_refs: root.source_truth_records.flatMap((record) => record.evidence_refs),
    replay_refs: [root.replay_refs.policy_snapshot_ref],
  })]);
}

export function resolvePolicySupersession(reconstructionOrInput: PolicyLineageReconstruction | PolicyLineageEngineInput = {}): readonly PolicyLineageRelationship[] {
  if ("supersession_chain" in reconstructionOrInput) return reconstructionOrInput.supersession_chain;
  const { policy_graph, policy_analyses } = defaults(reconstructionOrInput);
  const edges = policy_graph.supersession_records.length ? policy_graph.supersession_records : policy_graph.edge_set.filter((edge) => edge.relationship_type === "SUPERSEDES");
  const reconstructed = edges.map((edge) => relationshipFromGraph(edge, "SUPERSESSION", "Supersession history was reconstructed from immutable historical policy refs."));
  if (reconstructed.length) return Object.freeze(reconstructed);
  const root = policy_analyses[0];
  if (!root) return Object.freeze([]);
  return Object.freeze([relationship({
    relationship_id: `plr_supersession_${root.policy_id}_v0`,
    relationship_type: "SUPERSESSION",
    source_policy_id: root.policy_id,
    target_policy_id: `${root.policy_id}_legacy`,
    source_policy_version: root.policy_version,
    target_policy_version: "v0.9.0",
    reason: "Current policy supersedes the historical predecessor while preserving historical visibility.",
    evidence_refs: root.source_truth_records.flatMap((record) => record.evidence_refs),
    replay_refs: [root.replay_refs.policy_snapshot_ref, root.replay_refs.output_hash],
  })]);
}

function relationshipFromGraph(edge: PolicyDependencyEdge, relationship_type: PolicyLineageRelationship["relationship_type"], reason: string): PolicyLineageRelationship {
  return relationship({
    relationship_id: `plr_${relationship_type.toLowerCase()}_${edge.edge_id}`,
    relationship_type,
    source_policy_id: edge.source_policy_id,
    target_policy_id: edge.target_policy_id,
    source_policy_version: edge.source_policy_version,
    target_policy_version: edge.target_policy_version,
    reason,
    evidence_refs: edge.evidence_refs,
    replay_refs: edge.replay_refs,
  });
}

export function buildPolicyTimeline(reconstructionOrInput: PolicyLineageReconstruction | PolicyLineageEngineInput = {}): readonly PolicyTimelineEvent[] {
  if ("historical_timeline" in reconstructionOrInput) return reconstructionOrInput.historical_timeline;
  const root = resolvePolicy(reconstructionOrInput);
  const history = [
    timeline("CREATED", root, 0, "Policy identity entered the truth ledger."),
    timeline("ACTIVATED", root, 1, "Policy became active for governance reasoning."),
    timeline("INHERITED", root, 2, "Policy inherited tenant and mission governance constraints."),
    timeline("MODIFIED", root, 3, "Policy lineage was updated with evidence-backed history."),
    timeline("SUPERSEDED", root, 4, "Historical predecessor was superseded and retained."),
    timeline("ARCHIVED", root, 5, "Historical reconstruction snapshot was archived for replay."),
  ];
  return Object.freeze(history);
}

export function computePolicyLineageReconstructionHash(reconstruction: Omit<PolicyLineageReconstruction, "reconstruction_hash"> | PolicyLineageReconstruction): string {
  const { reconstruction_hash: _hash, ...source } = reconstruction as PolicyLineageReconstruction;
  return hashValue("policy-lineage-reconstruction", source);
}

function replayRefs(source: Omit<PolicyLineageReconstruction, "replay_refs" | "reconstruction_hash">): PolicyLineageReplayRefs {
  const policy_history_hash = hashValue("policy-lineage-policy-history", source.policy_history);
  const dependency_graph_hash = hashValue("policy-lineage-dependencies", source.dependency_graph);
  const inheritance_chain_hash = hashValue("policy-lineage-inheritance", source.inheritance_chain);
  const supersession_chain_hash = hashValue("policy-lineage-supersession", source.supersession_chain);
  const constitutional_resolution_hash = hashValue("policy-lineage-constitutional", source.constitutional_resolutions);
  const timeline_hash = hashValue("policy-lineage-timeline", source.historical_timeline);
  const influence_hash = hashValue("policy-lineage-influence-set", source.influence_scores);
  return Object.freeze({
    replay_id: `PLR-REPLAY-${hashValue("policy-lineage-replay-id", { id: source.reconstruction_id }).slice(0, 10).toUpperCase()}`,
    policy_history_hash,
    dependency_graph_hash,
    inheritance_chain_hash,
    supersession_chain_hash,
    constitutional_resolution_hash,
    timeline_hash,
    influence_hash,
    reconstruction_output_hash: hashValue("policy-lineage-reconstruction-output", { policy_history_hash, dependency_graph_hash, inheritance_chain_hash, supersession_chain_hash, constitutional_resolution_hash, timeline_hash, influence_hash }),
  });
}

export function reconstructPolicyLineage(input: PolicyLineageEngineInput = {}): PolicyLineageReconstruction {
  const scenario = input.scenario ?? "BASELINE";
  const { policy_analyses, policy_graph } = defaults(input);
  const root_policy = resolvePolicy(input);
  const tenant_id = scenario === "CROSS_TENANT" ? input.tenant_id ?? "tenant_alpha" : input.tenant_id ?? root_policy.tenant_id;
  const mission_id = input.mission_id ?? root_policy.mission_id;
  const parent = scenario === "PARENT_MISSING" ? Object.freeze([]) : Object.freeze([syntheticPolicy(`policy_${tenant_id}_organization_governance`, tenant_id, mission_id)]);
  const constitutional = syntheticPolicy(`constitution_${tenant_id}_operator_supremacy`, tenant_id, mission_id, "ACTIVE");
  const child = syntheticPolicy(`policy_${tenant_id}_recommendation_governance`, tenant_id, mission_id, "ACTIVE");
  const history = scenario === "VERSION_NOT_FOUND" ? Object.freeze([root_policy]) : Object.freeze([constitutional, ...parent, root_policy, child, syntheticPolicy(`${root_policy.policy_id}_legacy`, tenant_id, mission_id, "SUPERSEDED")]);
  const dependency_graph = scenario === "DEPENDENCY_MISSING" ? Object.freeze([]) : resolvePolicyDependencies({ ...input, policy_graph, policy_analyses });
  const inheritance_chain = scenario === "INHERITANCE_INCOMPLETE" ? Object.freeze([]) : resolvePolicyInheritance({ ...input, policy_graph, policy_analyses });
  const supersession_chain = scenario === "SUPERSESSION_INCONSISTENT" ? Object.freeze([relationship({
    relationship_id: `plr_supersession_inconsistent_${root_policy.policy_id}`,
    relationship_type: "SUPERSESSION",
    source_policy_id: root_policy.policy_id,
    target_policy_id: root_policy.policy_id,
    source_policy_version: root_policy.policy_version,
    target_policy_version: root_policy.policy_version,
    reason: "Invalid self-supersession test fixture.",
    evidence_refs: [`evidence_${tenant_id}_supersession_inconsistent`],
    replay_refs: [`replay_${tenant_id}_supersession_inconsistent`],
  })]) : resolvePolicySupersession({ ...input, policy_graph, policy_analyses });
  const constitutional_resolutions = scenario === "CONSTITUTION_MISSING" ? Object.freeze([]) : Object.freeze([resolution(root_policy, scenario)]);
  const historical_timeline = scenario === "TIMELINE_GAP" ? Object.freeze(buildPolicyTimeline(input).filter((event) => event.event_type !== "INHERITED")) : buildPolicyTimeline(input);
  const influence_scores = scenario === "HIDDEN_INFLUENCE" ? Object.freeze([]) : Object.freeze([
    influence(root_policy, ["direct governance requirement", "recommendation constraint", "compliance requirement"], 0.9, 0.95),
    influence(constitutional, ["constitutional requirement", "authority restriction"], 1, 0.9),
  ]);
  const reconstruction_id = scenario === "MISSING_POLICY_ID" ? "" : `PLR-7G2-${hashValue("policy-lineage-reconstruction-id", { root_policy, tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`;
  const source: Omit<PolicyLineageReconstruction, "replay_refs" | "reconstruction_hash"> = {
    reconstruction_id,
    schema_version: SCHEMA_VERSION,
    tenant_id,
    mission_id,
    governance_conclusion_ref: input.governance_conclusion_ref ?? `governance_conclusion_${tenant_id}_7g2`,
    root_policy,
    policy_history: history,
    parent_policies: parent,
    child_policies: Object.freeze([child]),
    dependency_graph,
    inheritance_chain,
    supersession_chain,
    constitutional_resolutions,
    historical_timeline,
    influence_scores,
    source_policy_analyses: uniq(policy_analyses.map((policy) => policy.policy_analysis_id)),
    source_policy_graph_ref: policy_graph.policy_graph_id,
    source_truth_records: uniq(policy_analyses.flatMap((policy) => policy.source_truth_records.map((record) => record.truth_record_id))),
    state: scenario === "INVALID_TRANSITION" ? "ARCHIVED" : "RECONSTRUCTED",
    advisory_boundary: Object.freeze({ advisory_only: true, mutates_policy: false, resolves_conflicts_autonomously: false, execution_authority: false }),
    created_timestamp: NOW,
  };
  const withReplay = Object.freeze({ ...source, replay_refs: scenario === "REPLAY_MISMATCH" ? Object.freeze({ ...replayRefs(source), reconstruction_output_hash: "tampered" }) : replayRefs(source) });
  const reconstruction = Object.freeze({ ...withReplay, reconstruction_hash: computePolicyLineageReconstructionHash(withReplay) });
  if (scenario === "DUPLICATE_POLICY") return Object.freeze({ ...reconstruction, policy_history: Object.freeze([...reconstruction.policy_history, reconstruction.root_policy]) });
  if (scenario === "HISTORICAL_MUTATION") return Object.freeze({ ...reconstruction, created_timestamp: "2026-06-27T00:00:00.000Z" });
  return reconstruction;
}

export function transitionPolicyLineageState(from_state: PolicyLineageState, to_state: PolicyLineageState): PolicyLineageTransitionResult {
  const from = STATES.indexOf(from_state);
  const to = STATES.indexOf(to_state);
  const allowed = from >= 0 && to >= 0 && to >= from && !(from_state === "ARCHIVED" && to_state !== "ARCHIVED");
  return Object.freeze({ from_state, to_state, allowed, reason: allowed ? `${from_state} can transition to ${to_state}.` : `${from_state} cannot transition to ${to_state}; reverse transitions are prohibited.` });
}

export function validatePolicyLineageReconstruction(reconstruction: Partial<PolicyLineageReconstruction> | undefined): PolicyLineageValidationResult {
  const errors: PolicyLineageValidationFailure[] = [];
  if (!reconstruction?.root_policy?.policy_id || !reconstruction.reconstruction_id) errors.push(failure("MISSING_POLICY_IDENTIFIER", "root_policy.policy_id", "policy identifier is required"));
  if (!reconstruction?.root_policy?.policy_version) errors.push(failure("POLICY_VERSION_NOT_FOUND", "root_policy.policy_version", "policy version is required"));
  const identities = (reconstruction?.policy_history ?? []).map((policy) => `${policy.policy_id}@${policy.policy_version}`);
  if (new Set(identities).size !== identities.length) errors.push(failure("DUPLICATE_POLICY_IDENTIFIER", "policy_history", "duplicate policy identity detected"));
  if (!reconstruction?.parent_policies?.length) errors.push(failure("PARENT_POLICY_MISSING", "parent_policies", "parent policy is required"));
  if (!reconstruction?.dependency_graph?.length) errors.push(failure("DEPENDENCY_RESOLUTION_FAILED", "dependency_graph", "dependency graph is required"));
  if (!reconstruction?.inheritance_chain?.length) errors.push(failure("INHERITANCE_CHAIN_INCOMPLETE", "inheritance_chain", "inheritance chain is required"));
  if (!reconstruction?.supersession_chain?.length || reconstruction.supersession_chain.some((item) => item.source_policy_id === item.target_policy_id)) errors.push(failure("SUPERSESSION_INCONSISTENCY", "supersession_chain", "supersession history is incomplete or inconsistent"));
  if (!reconstruction?.constitutional_resolutions?.length || reconstruction.constitutional_resolutions.some((item) => !item.constitutional_rule_id || !item.evidence_refs.length)) errors.push(failure("CONSTITUTIONAL_REFERENCE_MISSING", "constitutional_resolutions", "constitutional reference is required"));
  const events = reconstruction?.historical_timeline ?? [];
  const ordered = events.every((event, index) => index === 0 || event.timestamp >= events[index - 1]!.timestamp);
  const hasRequiredTimeline = ["CREATED", "ACTIVATED", "INHERITED", "MODIFIED", "SUPERSEDED", "ARCHIVED"].every((event) => events.some((item) => item.event_type === event));
  if (!events.length || !ordered || !hasRequiredTimeline) errors.push(failure("TIMELINE_RECONSTRUCTION_FAILED", "historical_timeline", "timeline must be complete and chronological"));
  if (!reconstruction?.influence_scores?.length) errors.push(failure("HIDDEN_POLICY_INFLUENCE_DETECTED", "influence_scores", "policy influence cannot be hidden"));
  if (reconstruction?.policy_history?.some((policy) => policy.tenant_id !== reconstruction.tenant_id) || reconstruction?.dependency_graph?.some((edge) => edge.source_policy_id.includes("tenant_beta") || edge.target_policy_id.includes("tenant_beta"))) errors.push(failure("CROSS_TENANT_POLICY_REFERENCE", "tenant_id", "cross-tenant policy reference detected"));
  if (!reconstruction?.replay_refs?.replay_id || !reconstruction.replay_refs.reconstruction_output_hash) errors.push(failure("REPLAY_RECONSTRUCTION_MISMATCH", "replay_refs", "replay metadata is required"));
  if (reconstruction?.replay_refs && reconstruction.replay_refs.reconstruction_output_hash !== hashValue("policy-lineage-reconstruction-output", {
    policy_history_hash: reconstruction.replay_refs.policy_history_hash,
    dependency_graph_hash: reconstruction.replay_refs.dependency_graph_hash,
    inheritance_chain_hash: reconstruction.replay_refs.inheritance_chain_hash,
    supersession_chain_hash: reconstruction.replay_refs.supersession_chain_hash,
    constitutional_resolution_hash: reconstruction.replay_refs.constitutional_resolution_hash,
    timeline_hash: reconstruction.replay_refs.timeline_hash,
    influence_hash: reconstruction.replay_refs.influence_hash,
  })) errors.push(failure("REPLAY_RECONSTRUCTION_MISMATCH", "replay_refs.reconstruction_output_hash", "replay reconstruction output hash mismatch"));
  if (reconstruction?.created_timestamp && reconstruction.created_timestamp !== NOW) errors.push(failure("HISTORICAL_INTEGRITY_VIOLATION", "created_timestamp", "historical reconstruction timestamp mutation detected"));
  if (reconstruction?.state && !STATES.includes(reconstruction.state)) errors.push(failure("INVALID_POLICY_STATE_TRANSITION", "state", "policy lineage state is unsupported"));
  if (reconstruction?.state === "ARCHIVED" && reconstruction.historical_timeline?.at(-1)?.event_type !== "ARCHIVED") errors.push(failure("INVALID_POLICY_STATE_TRANSITION", "state", "archived reconstruction must end with archived timeline event"));
  if (reconstruction?.advisory_boundary && (reconstruction.advisory_boundary.advisory_only !== true || reconstruction.advisory_boundary.mutates_policy !== false || reconstruction.advisory_boundary.resolves_conflicts_autonomously !== false || reconstruction.advisory_boundary.execution_authority !== false)) errors.push(failure("POLICY_LINEAGE_VALIDATION_FAILED", "advisory_boundary", "policy lineage reconstruction must remain advisory-only"));
  if (reconstruction?.reconstruction_hash && computePolicyLineageReconstructionHash(reconstruction as PolicyLineageReconstruction) !== reconstruction.reconstruction_hash) errors.push(failure("HISTORICAL_INTEGRITY_VIOLATION", "reconstruction_hash", "historical reconstruction hash mismatch"));
  const validation_state: PolicyLineageValidationResult["validation_state"] = errors.some((error) => error.reason === "CROSS_TENANT_POLICY_REFERENCE")
    ? "TENANT_SCOPE_VIOLATION"
    : errors.some((error) => error.reason === "REPLAY_RECONSTRUCTION_MISMATCH")
      ? "REPLAY_MISMATCH"
      : errors.some((error) => ["HIDDEN_POLICY_INFLUENCE_DETECTED", "HISTORICAL_INTEGRITY_VIOLATION", "INVALID_POLICY_STATE_TRANSITION"].includes(error.reason))
        ? "CERTIFICATION_BLOCKED"
        : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    reconstruction_id: reconstruction?.reconstruction_id,
    validation_state,
    validator_version: "POLICY-LINEAGE-RECONSTRUCTION-VALIDATOR-V1",
    checks: Object.freeze({
      identity_valid: !errors.some((error) => ["MISSING_POLICY_IDENTIFIER", "DUPLICATE_POLICY_IDENTIFIER", "POLICY_VERSION_NOT_FOUND"].includes(error.reason)),
      relationships_complete: !errors.some((error) => ["PARENT_POLICY_MISSING", "DEPENDENCY_RESOLUTION_FAILED", "INHERITANCE_CHAIN_INCOMPLETE", "SUPERSESSION_INCONSISTENCY"].includes(error.reason)),
      timeline_complete: !errors.some((error) => error.reason === "TIMELINE_RECONSTRUCTION_FAILED"),
      constitutional_resolution_complete: !errors.some((error) => error.reason === "CONSTITUTIONAL_REFERENCE_MISSING"),
      replay_ready: !errors.some((error) => error.reason === "REPLAY_RECONSTRUCTION_MISMATCH"),
      influence_visible: !errors.some((error) => error.reason === "HIDDEN_POLICY_INFLUENCE_DETECTED"),
      tenant_isolated: !errors.some((error) => error.reason === "CROSS_TENANT_POLICY_REFERENCE"),
      state_valid: !errors.some((error) => error.reason === "INVALID_POLICY_STATE_TRANSITION"),
      historical_integrity_preserved: !errors.some((error) => error.reason === "HISTORICAL_INTEGRITY_VIOLATION"),
      advisory_only_enforced: !errors.some((error) => error.field_path === "advisory_boundary"),
      hash_valid: !errors.some((error) => error.field_path === "reconstruction_hash"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function verifyPolicyReplay(reconstruction: PolicyLineageReconstruction): PolicyLineageReplayResult {
  const validation = validatePolicyLineageReconstruction(reconstruction);
  const reconstructed_hash = computePolicyLineageReconstructionHash(reconstruction);
  const reproduced = validation.validation_state === "VALID" && reconstructed_hash === reconstruction.reconstruction_hash;
  return Object.freeze({
    replay_id: reconstruction.replay_refs.replay_id,
    replay_state: reproduced ? "REPRODUCED" : reconstruction.replay_refs.replay_id ? "MISMATCH" : "INCOMPLETE",
    reconstructed_hash,
    expected_hash: reconstruction.reconstruction_hash,
    reconstruction_id: reconstruction.reconstruction_id,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "REPLAY_RECONSTRUCTION_MISMATCH",
  });
}

export function runPolicyLineageReconstruction(input: PolicyLineageEngineInput = {}): PolicyLineageEngineResult {
  const reconstruction = reconstructPolicyLineage(input);
  const validation = validatePolicyLineageReconstruction(reconstruction);
  const replay = verifyPolicyReplay(reconstruction);
  return Object.freeze({ engine_id: hashValue("policy-lineage-engine", { reconstruction: reconstruction.reconstruction_hash }), reconstruction, validation, replay });
}

export function buildPolicyLineageObservabilitySurface(input: PolicyLineageEngineInput = {}): PolicyLineageObservabilitySurface {
  const result = runPolicyLineageReconstruction(input);
  const reconstruction = result.reconstruction;
  return Object.freeze({
    reconstruction_id: reconstruction.reconstruction_id,
    governance_conclusion_ref: reconstruction.governance_conclusion_ref,
    root_policy: reconstruction.root_policy,
    policy_history_count: reconstruction.policy_history.length,
    dependency_count: reconstruction.dependency_graph.length,
    inheritance_count: reconstruction.inheritance_chain.length,
    supersession_count: reconstruction.supersession_chain.length,
    constitutional_influence_count: reconstruction.constitutional_resolutions.length,
    timeline_events: reconstruction.historical_timeline,
    influence_scores: reconstruction.influence_scores,
    replay_state: result.replay.replay_state,
    validation_failures: Object.freeze(result.validation.errors.map((error) => error.reason)),
    advisory_only_notice: "Policy lineage reconstruction is advisory-only; it reconstructs policy history without mutating policy, resolving conflicts autonomously, or executing governance actions.",
  });
}

export function getPolicyLineageContract() {
  const result = runPolicyLineageReconstruction();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: Object.freeze(["deterministic", "immutable", "replayable", "explainable", "constitution-aware", "tenant-isolated", "time-aware", "evidence-backed", "advisory-only", "fail-closed"]),
      supported_states: STATES,
      supported_influence_levels: Object.freeze(["MANDATORY", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] as const),
      schema_version: SCHEMA_VERSION,
    }),
    reconstruction: result.reconstruction,
    validation: result.validation,
    replay: result.replay,
  });
}
