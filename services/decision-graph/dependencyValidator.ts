import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
} from "./decisionGraphContractRoadmap";
import type {
  CanonicalDecisionRelationshipType,
  DecisionDependencyStatus,
  DecisionDependencyValidationState,
  DecisionGraphRoadmapNodeInput,
  DecisionRelationshipLineage,
  DecisionRelationshipRecord,
  DependencyValidationLedgerEvent,
  DependencyValidationReasonCode,
  DependencyValidationRecord,
  DependencyValidationReport,
  DependencyValidatorInput,
  DependencyValidatorResult,
  ExpectedDependencyRequirement,
  MissingDependencyRecord,
} from "./types";

export const DEPENDENCY_VALIDATOR_VERSION = "decision-dependency-validator/v1";
const VALIDATION_TIMESTAMP = "dependency-validation-timestamp-ref";

const DEPENDENCY_TYPES = new Set<CanonicalDecisionRelationshipType>([
  "depends_on",
  "requires_operator_approval",
  "requires_governance_review",
  "requires_simulation",
  "requires_recovery_plan",
  "requires_certification",
]);

const READY_STATES = new Set<DecisionGraphRoadmapNodeInput["state"]>([
  "RELATIONSHIPS_RESOLVED",
  "DEPENDENCY_VALIDATED",
  "READY_FOR_ORDERING",
  "ORDERED",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DependencyValidationReasonCode[], reason: DependencyValidationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function recordHash(record: Omit<DependencyValidationRecord, "integrity_hash"> | DependencyValidationRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as DependencyValidationRecord;
  return hash(hashable);
}

function missingHash(record: Omit<MissingDependencyRecord, "integrity_hash"> | MissingDependencyRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as MissingDependencyRecord;
  return hash(hashable);
}

function ledgerHash(event: Omit<DependencyValidationLedgerEvent, "integrity_hash"> | DependencyValidationLedgerEvent): string {
  const { integrity_hash: _ignored, ...hashable } = event as DependencyValidationLedgerEvent;
  return hash(hashable);
}

function reportHash(report: Omit<DependencyValidationReport, "integrity_hash"> | DependencyValidationReport): string {
  const { integrity_hash: _ignored, ...hashable } = report as DependencyValidationReport;
  return hash(hashable);
}

function resultHash(result: Omit<DependencyValidatorResult, "integrity_hash"> | DependencyValidatorResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as DependencyValidatorResult;
  return hash(hashable);
}

function relationshipHash(relationship: DecisionRelationshipRecord): string {
  const { integrity_hash: _ignored, ...hashable } = relationship;
  return hash(hashable);
}

function nodeById(nodes: readonly DecisionGraphRoadmapNodeInput[]): Map<string, DecisionGraphRoadmapNodeInput> {
  return new Map(nodes.map((node) => [node.node_id, node]));
}

function lineageByRelationship(lineage: readonly DecisionRelationshipLineage[]): Map<string, DecisionRelationshipLineage> {
  return new Map(lineage.map((item) => [item.relationship_id, item]));
}

function validationState(reason: DependencyValidationReasonCode): DecisionDependencyValidationState {
  if (reason === "MISSING_REPLAY_REFERENCE" || reason === "REPLAY_MISMATCH") return "REPLAY_FAILED";
  if (reason === "UNAUTHORIZED_AUTHORITY" || reason === "GOVERNANCE_VIOLATION") return "UNAUTHORIZED";
  if (reason === "DEPENDENCY_NOT_READY") return "UNRESOLVED";
  if (reason.includes("MISSING") || reason === "PREREQUISITE_DECISION_MISSING") return "MISSING";
  if (reason === "REFERENCE_VALIDATION_PASSED") return "VALIDATED";
  return "INVALID";
}

function dependencyStatus(reason: DependencyValidationReasonCode): DecisionDependencyStatus {
  if (reason === "REFERENCE_VALIDATION_PASSED") return "COMPLETE";
  if (reason.includes("MISSING") || reason === "PREREQUISITE_DECISION_MISSING") return "MISSING";
  if (reason === "DEPENDENCY_NOT_READY") return "UNRESOLVED";
  return "INVALID";
}

function failureReason(input: {
  relationship: DecisionRelationshipRecord;
  nodes: Map<string, DecisionGraphRoadmapNodeInput>;
  lineage: Map<string, DecisionRelationshipLineage>;
  graph: DependencyValidatorInput;
}): DependencyValidationReasonCode {
  const source = input.nodes.get(input.relationship.source_node_id);
  const target = input.relationship.target_type === "DECISION_NODE"
    ? input.nodes.get(input.relationship.target_node_id)
    : undefined;

  if (!input.relationship.relationship_id || !input.relationship.source_node_id || !input.relationship.target_node_id) return "MALFORMED_DEPENDENCY_REFERENCE";
  if (!source) return "INVALID_DEPENDENCY_REFERENCE";
  if (source.tenant_id !== input.graph.tenant_id) return "CROSS_TENANT_DEPENDENCY";
  if (source.mission_id !== input.graph.mission_id) return "CROSS_MISSION_DEPENDENCY";
  if (input.relationship.target_type === "DECISION_NODE" && !target) return "PREREQUISITE_DECISION_MISSING";
  if (target && target.tenant_id !== input.graph.tenant_id) return "CROSS_TENANT_DEPENDENCY";
  if (target && target.mission_id !== input.graph.mission_id) return "CROSS_MISSION_DEPENDENCY";
  if (!input.lineage.has(input.relationship.relationship_id)) return "RELATIONSHIP_LINEAGE_MISSING";
  if (input.relationship.governance_refs.length === 0) return "GOVERNANCE_VIOLATION";
  if (input.relationship.replay_refs.length === 0) return "MISSING_REPLAY_REFERENCE";
  if (input.relationship.integrity_hash !== relationshipHash(input.relationship)) return "DEPENDENCY_INTEGRITY_MISMATCH";
  if (input.graph.authorized_governance_refs?.length && !input.relationship.governance_refs.every((ref) => input.graph.authorized_governance_refs!.includes(ref))) return "GOVERNANCE_VIOLATION";
  if (input.relationship.relationship_type === "requires_operator_approval" && input.graph.authorized_authority_refs?.length === 0) return "UNAUTHORIZED_AUTHORITY";
  if (target && !READY_STATES.has(target.state)) return "DEPENDENCY_NOT_READY";
  return "REFERENCE_VALIDATION_PASSED";
}

function buildValidationRecord(input: {
  graph: DependencyValidatorInput;
  relationship: DecisionRelationshipRecord;
  reason: DependencyValidationReasonCode;
  validatorVersion: string;
  lineage?: DecisionRelationshipLineage;
}): DependencyValidationRecord {
  const base: Omit<DependencyValidationRecord, "integrity_hash"> = {
    validation_id: `validation_${input.relationship.relationship_id}`,
    graph_id: input.graph.graph_id,
    node_id: input.relationship.source_node_id,
    dependency_id: input.relationship.relationship_id,
    dependency_type: input.relationship.relationship_type,
    validation_state: validationState(input.reason),
    validation_reason: input.reason,
    dependency_status: dependencyStatus(input.reason),
    governance_status: input.reason === "GOVERNANCE_VIOLATION" ? "VIOLATION" : input.relationship.governance_refs.length > 0 ? "VERIFIED" : "MISSING",
    authority_status: input.reason === "UNAUTHORIZED_AUTHORITY" ? "UNAUTHORIZED" : input.reason === "AUTHORITY_ESCALATION" ? "ESCALATED" : "VERIFIED",
    replay_status: input.reason === "MISSING_REPLAY_REFERENCE" ? "MISSING" : input.reason === "REPLAY_MISMATCH" ? "MISMATCH" : "VERIFIED",
    tenant_validation: input.reason === "CROSS_TENANT_DEPENDENCY" ? "FAILED" : "PASSED",
    mission_validation: input.reason === "CROSS_MISSION_DEPENDENCY" ? "FAILED" : "PASSED",
    validation_timestamp: VALIDATION_TIMESTAMP,
    validator_version: input.validatorVersion,
    replay_refs: normalizeStrings(input.relationship.replay_refs),
    governance_refs: normalizeStrings(input.relationship.governance_refs),
    evidence_refs: normalizeStrings(input.lineage?.evidence_refs ?? []),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function expectedReason(type: CanonicalDecisionRelationshipType): DependencyValidationReasonCode {
  if (type === "requires_operator_approval") return "REQUIRED_APPROVAL_MISSING";
  if (type === "requires_governance_review") return "REQUIRED_GOVERNANCE_REVIEW_MISSING";
  if (type === "requires_simulation") return "REQUIRED_SIMULATION_MISSING";
  if (type === "requires_recovery_plan") return "REQUIRED_RECOVERY_PLAN_MISSING";
  if (type === "requires_certification") return "REQUIRED_CERTIFICATION_MISSING";
  return "MISSING_DEPENDENCY_DETECTED";
}

function buildMissing(requirement: ExpectedDependencyRequirement): MissingDependencyRecord {
  const reason = requirement.reason ?? expectedReason(requirement.dependency_type);
  const base: Omit<MissingDependencyRecord, "integrity_hash"> = {
    missing_dependency_id: `missing_${hash(requirement).slice(0, 32)}`,
    node_id: requirement.node_id,
    expected_dependency: requirement.expected_dependency,
    dependency_type: requirement.dependency_type,
    reason,
    severity: "BLOCKING",
    required_before_state: requirement.required_before_state,
    governance_refs: normalizeStrings(requirement.governance_refs),
    replay_refs: normalizeStrings(requirement.replay_refs),
    evidence_refs: normalizeStrings(requirement.evidence_refs ?? []),
  };
  return Object.freeze({ ...base, integrity_hash: missingHash(base) });
}

function detectMissing(
  expected: readonly ExpectedDependencyRequirement[],
  relationships: readonly DecisionRelationshipRecord[],
): MissingDependencyRecord[] {
  return expected
    .filter((requirement) => !relationships.some((relationship) => (
      relationship.source_node_id === requirement.node_id
      && relationship.target_node_id === requirement.expected_dependency
      && relationship.relationship_type === requirement.dependency_type
    )))
    .map(buildMissing)
    .sort((a, b) => a.missing_dependency_id.localeCompare(b.missing_dependency_id));
}

function detectCycle(relationships: readonly DecisionRelationshipRecord[]): boolean {
  const graph = new Map<string, string[]>();
  for (const relationship of relationships.filter((item) => item.relationship_type === "depends_on" && item.target_type === "DECISION_NODE")) {
    graph.set(relationship.source_node_id, [...(graph.get(relationship.source_node_id) ?? []), relationship.target_node_id].sort());
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...graph.keys()].sort().some(visit);
}

function detectDuplicateDependency(relationships: readonly DecisionRelationshipRecord[]): boolean {
  const keys = new Set<string>();
  for (const relationship of relationships) {
    const key = `${relationship.source_node_id}|${relationship.target_node_id}|${relationship.relationship_type}`;
    if (keys.has(key)) return true;
    keys.add(key);
  }
  return false;
}

function buildLedger(record: DependencyValidationRecord, passed: boolean): DependencyValidationLedgerEvent {
  const base: Omit<DependencyValidationLedgerEvent, "integrity_hash"> = {
    event_id: `event_${record.validation_id}`,
    validation_id: record.validation_id,
    event_type: passed ? "DEPENDENCY_VALIDATED" : "DEPENDENCY_REJECTED",
    reason_code: record.validation_reason,
    replay_ref: record.replay_refs[0] ?? `replay_${record.validation_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function buildMissingLedger(record: MissingDependencyRecord): DependencyValidationLedgerEvent {
  const base: Omit<DependencyValidationLedgerEvent, "integrity_hash"> = {
    event_id: `event_${record.missing_dependency_id}`,
    validation_id: record.missing_dependency_id,
    event_type: "MISSING_DEPENDENCY_RECORDED",
    reason_code: record.reason,
    replay_ref: record.replay_refs[0] ?? `replay_${record.missing_dependency_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function updateNodes(nodes: readonly DecisionGraphRoadmapNodeInput[], records: readonly DependencyValidationRecord[], missing: readonly MissingDependencyRecord[]): DecisionGraphRoadmapNodeInput[] {
  const blocked = new Set([
    ...records.filter((record) => record.dependency_status !== "COMPLETE").map((record) => record.node_id),
    ...missing.map((record) => record.node_id),
  ]);
  return [...nodes]
    .map((node) => {
      const state = blocked.has(node.node_id) ? node.state : "DEPENDENCY_VALIDATED";
      const hashable = { ...node, state, previous_state: node.state };
      return Object.freeze({
        ...hashable,
        integrity_hash: computeDecisionGraphNodeIntegrityHash(hashable, DECISION_GRAPH_CONTRACT_VERSION),
      } satisfies DecisionGraphRoadmapNodeInput);
    })
    .sort((a, b) => a.node_id.localeCompare(b.node_id));
}

function replayHash(input: {
  records: readonly DependencyValidationRecord[];
  missing: readonly MissingDependencyRecord[];
  updatedNodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger: readonly DependencyValidationLedgerEvent[];
}): string {
  return hash({
    records: input.records,
    missing: input.missing,
    updatedNodes: input.updatedNodes,
    ledger: input.ledger,
  });
}

function buildReport(input: {
  graph: DependencyValidatorInput;
  status: "PASS" | "FAIL";
  records: readonly DependencyValidationRecord[];
  missing: readonly MissingDependencyRecord[];
  updatedNodes: readonly DecisionGraphRoadmapNodeInput[];
  validatorVersion: string;
  replay: string;
}): DependencyValidationReport {
  const blocked = new Set([
    ...input.records.filter((record) => record.dependency_status !== "COMPLETE").map((record) => record.node_id),
    ...input.missing.map((record) => record.node_id),
  ]);
  const base: Omit<DependencyValidationReport, "integrity_hash"> = {
    report_id: `dependency_report_${input.graph.graph_id}`,
    graph_id: input.graph.graph_id,
    tenant_id: input.graph.tenant_id,
    mission_id: input.graph.mission_id,
    validation_status: input.status,
    ready_node_ids: normalizeStrings(input.updatedNodes.filter((node) => !blocked.has(node.node_id)).map((node) => node.node_id)),
    blocked_node_ids: normalizeStrings([...blocked]),
    missing_dependency_count: input.missing.length,
    invalid_dependency_count: input.records.filter((record) => record.dependency_status !== "COMPLETE").length,
    validator_version: input.validatorVersion,
    replay_hash: input.replay,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function validateDecisionDependencies(input: DependencyValidatorInput): DependencyValidatorResult {
  const reasons: DependencyValidationReasonCode[] = [];
  const validatorVersion = input.validator_version ?? DEPENDENCY_VALIDATOR_VERSION;
  const nodes = nodeById(input.nodes);
  const lineage = lineageByRelationship(input.lineage);
  const dependencyRelationships = input.relationships
    .filter((relationship) => DEPENDENCY_TYPES.has(relationship.relationship_type))
    .sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));

  addReason(reasons, "DEPENDENCY_REFERENCES_LOADED");
  if (detectDuplicateDependency(dependencyRelationships)) addReason(reasons, "DUPLICATE_DEPENDENCY");
  if (detectCycle(dependencyRelationships)) addReason(reasons, "DEPENDENCY_CYCLE_DETECTED");

  const validationRecords = dependencyRelationships.map((relationship) => {
    const reason = failureReason({ relationship, nodes, lineage, graph: input });
    addReason(reasons, reason === "REFERENCE_VALIDATION_PASSED" ? "REFERENCE_VALIDATION_PASSED" : reason);
    if (reason === "REFERENCE_VALIDATION_PASSED") {
      addReason(reasons, "INTEGRITY_VALIDATION_PASSED");
      addReason(reasons, "GOVERNANCE_VALIDATION_PASSED");
      addReason(reasons, "REPLAY_VALIDATION_PASSED");
      addReason(reasons, "AUTHORITY_VALIDATION_PASSED");
    }
    return buildValidationRecord({
      graph: input,
      relationship,
      reason,
      validatorVersion,
      lineage: lineage.get(relationship.relationship_id),
    });
  });

  const missing = detectMissing(input.expected_dependencies ?? [], dependencyRelationships);
  for (const item of missing) addReason(reasons, item.reason);

  const structuralFailure = reasons.some((reason) => [
    "DUPLICATE_DEPENDENCY",
    "DEPENDENCY_CYCLE_DETECTED",
  ].includes(reason));
  const valid = !structuralFailure
    && missing.length === 0
    && validationRecords.every((record) => record.dependency_status === "COMPLETE");

  addReason(reasons, "DEPENDENCY_READINESS_EVALUATED");
  addReason(reasons, "IMMUTABLE_VALIDATION_EVIDENCE_PRODUCED");

  const ledger = Object.freeze([
    ...validationRecords.map((record) => buildLedger(record, record.dependency_status === "COMPLETE")),
    ...missing.map(buildMissingLedger),
  ].sort((a, b) => a.event_id.localeCompare(b.event_id)));
  addReason(reasons, "DEPENDENCY_VALIDATION_LEDGER_PERSISTED");

  const updatedNodes = Object.freeze(updateNodes(input.nodes, validationRecords, missing));
  const replay = replayHash({ records: validationRecords, missing, updatedNodes, ledger });
  if (input.replay_expected_hash && input.replay_expected_hash !== replay) {
    addReason(reasons, "REPLAY_DIVERGENCE");
  } else {
    addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_VALIDATION");
  }
  const status: "PASS" | "FAIL" = valid && !reasons.includes("REPLAY_DIVERGENCE") ? "PASS" : "FAIL";
  const report = buildReport({ graph: input, status, records: validationRecords, missing, updatedNodes, validatorVersion, replay });
  const replayPackage = Object.freeze({
    replay_id: `replay_dependency_validation_${input.graph_id}`,
    graph_id: input.graph_id,
    validator_version: validatorVersion,
    validation_record_refs: normalizeStrings(validationRecords.map((record) => record.validation_id)),
    missing_dependency_refs: normalizeStrings(missing.map((record) => record.missing_dependency_id)),
    expected_replay_hash: replay,
  });
  const base: Omit<DependencyValidatorResult, "integrity_hash"> = {
    validation_status: status,
    certificationStatus: status,
    reasonCodes: Object.freeze(normalizeStrings(reasons) as DependencyValidationReasonCode[]),
    validation_records: Object.freeze(validationRecords),
    missing_dependencies: Object.freeze(missing),
    updated_nodes: updatedNodes,
    ledger_events: ledger,
    report,
    replay_package: replayPackage,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export const DependencyValidator = Object.freeze({
  validate: validateDecisionDependencies,
});
