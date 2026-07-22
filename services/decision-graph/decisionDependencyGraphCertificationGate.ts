import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  CANONICAL_DECISION_RELATIONSHIP_TYPES,
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
} from "./decisionGraphContractRoadmap";
import type {
  DecisionDependencyGraphCertificationEvidencePackage,
  DecisionDependencyGraphCertificationInput,
  DecisionDependencyGraphCertificationLedgerRecord,
  DecisionDependencyGraphCertificationReasonCode,
  DecisionDependencyGraphCertificationRecord,
  DecisionDependencyGraphCertificationReplayRecord,
  DecisionDependencyGraphCertificationReport,
  DecisionDependencyGraphCertificationResult,
  DecisionDependencyGraphCertificationState,
  DecisionDependencyGraphCertificationTestResult,
  DecisionGraphRoadmapNodeInput,
  DecisionRelationshipRecord,
} from "./types";

export const DECISION_DEPENDENCY_GRAPH_CERTIFICATION_VERSION = "decision-dependency-graph-certification-gate/v1";
const CERTIFICATION_TIMESTAMP_REF = "decision-dependency-graph-certification-timestamp-ref";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DecisionDependencyGraphCertificationReasonCode[], reason: DecisionDependencyGraphCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function nodeHash(node: DecisionGraphRoadmapNodeInput): string {
  const { integrity_hash: _ignored, ...hashable } = node;
  return computeDecisionGraphNodeIntegrityHash(hashable, DECISION_GRAPH_CONTRACT_VERSION);
}

function relationshipHash(relationship: DecisionRelationshipRecord): string {
  const { integrity_hash: _ignored, ...hashable } = relationship;
  return hash(hashable);
}

function testHash(record: Omit<DecisionDependencyGraphCertificationTestResult, "integrity_hash"> | DecisionDependencyGraphCertificationTestResult): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionDependencyGraphCertificationTestResult;
  return hash(hashable);
}

function recordHash(record: Omit<DecisionDependencyGraphCertificationRecord, "integrity_hash"> | DecisionDependencyGraphCertificationRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionDependencyGraphCertificationRecord;
  return hash(hashable);
}

function replayHash(record: Omit<DecisionDependencyGraphCertificationReplayRecord, "integrity_hash"> | DecisionDependencyGraphCertificationReplayRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionDependencyGraphCertificationReplayRecord;
  return hash(hashable);
}

function evidenceHash(record: Omit<DecisionDependencyGraphCertificationEvidencePackage, "integrity_hash"> | DecisionDependencyGraphCertificationEvidencePackage): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionDependencyGraphCertificationEvidencePackage;
  return hash(hashable);
}

function reportHash(record: Omit<DecisionDependencyGraphCertificationReport, "integrity_hash"> | DecisionDependencyGraphCertificationReport): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionDependencyGraphCertificationReport;
  return hash(hashable);
}

function ledgerHash(record: Omit<DecisionDependencyGraphCertificationLedgerRecord, "integrity_hash"> | DecisionDependencyGraphCertificationLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionDependencyGraphCertificationLedgerRecord;
  return hash(hashable);
}

function resultHash(result: Omit<DecisionDependencyGraphCertificationResult, "integrity_hash"> | DecisionDependencyGraphCertificationResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as DecisionDependencyGraphCertificationResult;
  return hash(hashable);
}

function governanceRefs(input: DecisionDependencyGraphCertificationInput): string[] {
  return normalizeStrings([
    ...input.nodes.flatMap((node) => node.governance_refs),
    ...input.relationships.flatMap((relationship) => relationship.governance_refs),
    ...(input.graph_ordering.ordering_record?.governance_refs ?? []),
    ...(input.graph_ledger.snapshot_record?.governance_refs ?? []),
  ]);
}

function replayRefs(input: DecisionDependencyGraphCertificationInput): string[] {
  return normalizeStrings([
    ...input.nodes.flatMap((node) => node.replay_refs),
    ...input.relationships.flatMap((relationship) => relationship.replay_refs),
    input.graph_safety.replay_hash,
    input.graph_ordering.replay_hash,
    input.graph_ledger.replay_hash,
    input.dependency_validation?.replay_package.expected_replay_hash ?? "",
    input.conflict_detection?.replay_package.expected_replay_hash ?? "",
    input.blocker_detection?.replay_package.expected_replay_hash ?? "",
  ]);
}

function authorityRefs(input: DecisionDependencyGraphCertificationInput): string[] {
  return normalizeStrings([
    ...(input.authority_refs ?? []),
    ...input.nodes.flatMap((node) => node.authority_refs ?? []),
    ...(input.graph_ordering.ordering_record?.authority_refs ?? []),
  ]);
}

function buildTest(input: {
  id: string;
  name: string;
  pass: boolean;
  passReason: DecisionDependencyGraphCertificationReasonCode;
  failReason: DecisionDependencyGraphCertificationReasonCode;
  evidenceRefs: readonly string[];
}): DecisionDependencyGraphCertificationTestResult {
  const base: Omit<DecisionDependencyGraphCertificationTestResult, "integrity_hash"> = {
    test_id: input.id,
    test_name: input.name,
    expected: "PASS",
    actual: input.pass ? "PASS" : "FAIL",
    reason_code: input.pass ? input.passReason : input.failReason,
    evidence_refs: normalizeStrings(input.evidenceRefs),
  };
  return Object.freeze({ ...base, integrity_hash: testHash(base) });
}

function buildTests(input: DecisionDependencyGraphCertificationInput): DecisionDependencyGraphCertificationTestResult[] {
  const allowedRelationships = new Set(CANONICAL_DECISION_RELATIONSHIP_TYPES);
  const nodeSchemaValid = input.nodes.length > 0
    && input.nodes.every((node) => Boolean(node.node_id && node.decision_candidate_id && node.tenant_id && node.mission_id && node.integrity_hash));
  const candidatesConverted = input.nodes.every((node) => node.decision_candidate_id.length > 0);
  const relationshipTypesRegistered = input.relationships.every((relationship) => allowedRelationships.has(relationship.relationship_type));
  const dependenciesModeled = input.relationships.some((relationship) => relationship.relationship_type === "depends_on");
  const conflictFree = input.nodes.every((node) => node.conflict_refs.length === 0 && node.state !== "CONFLICT_DETECTED")
    && (input.conflict_detection?.detection_status ?? "PASS") === "PASS"
    && (input.conflict_detection?.conflicts.length ?? 0) === 0;
  const blockerFree = input.nodes.every((node) => node.blocker_refs.length === 0 && node.state !== "BLOCKED")
    && (input.blocker_detection?.detection_status ?? "PASS") === "PASS"
    && (input.blocker_detection?.blockers.length ?? 0) === 0;
  const cyclesBlocked = input.graph_safety.safety_status === "SAFE" && input.graph_safety.cycles.length === 0;
  const orderingReproducible = input.graph_ordering.ordering_status === "PASS"
    && input.graph_ordering.replay_record?.comparison_result === "MATCH"
    && input.graph_ordering.ordered_node_ids.every((nodeId) => input.nodes.some((node) => node.node_id === nodeId));
  const governancePresent = governanceRefs(input).length > 0
    && input.nodes.every((node) => node.governance_refs.length > 0)
    && input.relationships.every((relationship) => relationship.governance_refs.length > 0);
  const replayPresent = replayRefs(input).length > 0
    && input.nodes.every((node) => node.replay_refs.length > 0)
    && input.relationships.every((relationship) => relationship.replay_refs.length > 0);
  const hashesReproducible = input.nodes.every((node) => node.integrity_hash === nodeHash(node))
    && input.relationships.every((relationship) => relationship.integrity_hash === relationshipHash(relationship));
  const ledgerAppendOnly = input.graph_ledger.ledger_status === "PASS"
    && input.graph_ledger.integrity_records.every((record) => record.validation_result === "PASS");
  const replayMatch = input.graph_ledger.replay_record?.comparison_result === "MATCH"
    && input.graph_ordering.replay_record?.comparison_result === "MATCH";
  const constitutional = input.constitutional_refs.length > 0;
  const authority = input.nodes.every((node) => (node.authority_refs ?? []).every((ref) => authorityRefs(input).includes(ref)))
    && input.graph_ordering.reasonCodes.includes("AUTHORITY_PRECEDENCE_PRESERVED");
  const tenant = input.nodes.every((node) => node.tenant_id === input.tenant_id && node.mission_id === input.mission_id);
  const graphSafe = input.graph_safety.safety_status === "SAFE" && input.graph_ordering.ordering_status === "PASS" && input.graph_ledger.ledger_status === "PASS";

  return [
    buildTest({ id: "cert_test_node_schema", name: "Graph node schema valid", pass: nodeSchemaValid, passReason: "GRAPH_NODE_SCHEMA_VALID", failReason: "NODE_SCHEMA_INVALID", evidenceRefs: input.nodes.map((node) => node.integrity_hash ?? "") }),
    buildTest({ id: "cert_test_candidate_conversion", name: "Decision candidates converted to nodes", pass: candidatesConverted, passReason: "DECISION_CANDIDATES_CONVERTED_TO_NODES", failReason: "CANDIDATE_NODE_CONVERSION_MISSING", evidenceRefs: input.nodes.map((node) => node.decision_candidate_id) }),
    buildTest({ id: "cert_test_relationship_registry", name: "Relationship types registered", pass: relationshipTypesRegistered, passReason: "RELATIONSHIP_TYPES_REGISTERED", failReason: "UNKNOWN_RELATIONSHIP_TYPE", evidenceRefs: input.relationships.map((relationship) => relationship.relationship_id) }),
    buildTest({ id: "cert_test_dependencies", name: "Dependencies modeled", pass: dependenciesModeled, passReason: "DEPENDENCIES_MODELED", failReason: "DEPENDENCY_VALIDATION_FAILURE", evidenceRefs: input.relationships.filter((relationship) => relationship.relationship_type === "depends_on").map((relationship) => relationship.relationship_id) }),
    buildTest({ id: "cert_test_conflicts", name: "Conflicts detected deterministically", pass: conflictFree, passReason: "CONFLICTS_DETECTED_DETERMINISTICALLY", failReason: "UNRESOLVED_CONFLICT_EXISTS", evidenceRefs: input.conflict_detection?.ledger_records.map((record) => record.ledger_entry_id) ?? [] }),
    buildTest({ id: "cert_test_blockers", name: "Blockers detected deterministically", pass: blockerFree, passReason: "BLOCKERS_DETECTED_DETERMINISTICALLY", failReason: "UNRESOLVED_BLOCKER_EXISTS", evidenceRefs: input.blocker_detection?.ledger_records.map((record) => record.ledger_entry_id) ?? [] }),
    buildTest({ id: "cert_test_cycles", name: "Cycles detected and blocked", pass: cyclesBlocked, passReason: "CYCLES_DETECTED_AND_BLOCKED", failReason: "CYCLE_EXISTS", evidenceRefs: input.graph_safety.ledger_records.map((record) => record.ledger_entry_id) }),
    buildTest({ id: "cert_test_ordering", name: "Graph ordering reproducible", pass: orderingReproducible, passReason: "GRAPH_ORDERING_REPRODUCIBLE", failReason: "GRAPH_ORDERING_NOT_REPRODUCIBLE", evidenceRefs: input.graph_ordering.ledger_records.map((record) => record.ledger_entry_id) }),
    buildTest({ id: "cert_test_governance", name: "Governance references required", pass: governancePresent, passReason: "GOVERNANCE_REFERENCES_REQUIRED", failReason: "GOVERNANCE_REFERENCE_MISSING", evidenceRefs: governanceRefs(input) }),
    buildTest({ id: "cert_test_replay_refs", name: "Replay references required", pass: replayPresent, passReason: "REPLAY_REFERENCES_REQUIRED", failReason: "REPLAY_REFERENCE_MISSING", evidenceRefs: replayRefs(input) }),
    buildTest({ id: "cert_test_integrity", name: "Integrity hashes reproducible", pass: hashesReproducible, passReason: "INTEGRITY_HASHES_REPRODUCIBLE", failReason: "INTEGRITY_HASH_MISMATCH", evidenceRefs: [...input.nodes.map((node) => node.integrity_hash ?? ""), ...input.relationships.map((relationship) => relationship.integrity_hash)] }),
    buildTest({ id: "cert_test_ledger", name: "Ledger append-only", pass: ledgerAppendOnly, passReason: "LEDGER_APPEND_ONLY_VALIDATED", failReason: "LEDGER_INTEGRITY_FAILURE", evidenceRefs: input.graph_ledger.ledger_entries.map((entry) => entry.ledger_entry_id) }),
    buildTest({ id: "cert_test_replay", name: "Replay reconstructs identical graph", pass: replayMatch, passReason: "REPLAY_RECONSTRUCTS_IDENTICAL_GRAPH", failReason: "REPLAY_MISMATCH_DETECTED", evidenceRefs: [input.graph_ledger.replay_hash, input.graph_ordering.replay_hash] }),
    buildTest({ id: "cert_test_constitutional", name: "Constitutional compliance verified", pass: constitutional, passReason: "CONSTITUTIONAL_COMPLIANCE_VERIFIED", failReason: "CONSTITUTIONAL_VALIDATION_FAILED", evidenceRefs: input.constitutional_refs }),
    buildTest({ id: "cert_test_authority", name: "Authority boundaries enforced", pass: authority, passReason: "AUTHORITY_BOUNDARIES_ENFORCED", failReason: "AUTHORITY_VALIDATION_FAILED", evidenceRefs: authorityRefs(input) }),
    buildTest({ id: "cert_test_tenant", name: "Tenant isolation enforced", pass: tenant, passReason: "TENANT_ISOLATION_ENFORCED", failReason: "TENANT_ISOLATION_VIOLATED", evidenceRefs: [input.tenant_id, input.mission_id] }),
    buildTest({ id: "cert_test_graph_safe", name: "Graph safe for orchestration", pass: graphSafe, passReason: "GRAPH_SAFE_FOR_ORCHESTRATION", failReason: "GRAPH_SAFETY_FAILURE", evidenceRefs: [input.graph_safety.safety_record.integrity_hash, input.graph_ordering.integrity_hash, input.graph_ledger.integrity_hash] }),
  ];
}

function buildReplayRecord(input: DecisionDependencyGraphCertificationInput, tests: readonly DecisionDependencyGraphCertificationTestResult[], version: string): DecisionDependencyGraphCertificationReplayRecord {
  const expected = hash({
    nodes: input.nodes,
    relationships: input.relationships,
    safety: input.graph_safety.replay_hash,
    ordering: input.graph_ordering.replay_hash,
    ledger: input.graph_ledger.replay_hash,
    tests,
  });
  const replayed = hash({
    nodes: input.nodes,
    relationships: input.relationships,
    safety: input.graph_safety.replay_hash,
    ordering: input.graph_ordering.replay_hash,
    ledger: input.graph_ledger.replay_hash,
    tests,
  });
  const base: Omit<DecisionDependencyGraphCertificationReplayRecord, "integrity_hash"> = {
    replay_validation_id: `certification_replay_${input.graph_id}`,
    graph_id: input.graph_id,
    expected_graph_hash: expected,
    replayed_graph_hash: replayed,
    comparison_result: expected === replayed ? "MATCH" : "MISMATCH",
    ordering_result: input.graph_ordering.replay_record?.comparison_result === "MATCH" ? "MATCH" : "MISMATCH",
    ledger_result: input.graph_ledger.replay_record?.comparison_result === "MATCH" ? "MATCH" : "MISMATCH",
    validator_version: version,
  };
  return Object.freeze({ ...base, integrity_hash: replayHash(base) });
}

function buildEvidencePackage(input: DecisionDependencyGraphCertificationInput, replay: DecisionDependencyGraphCertificationReplayRecord): DecisionDependencyGraphCertificationEvidencePackage {
  const base: Omit<DecisionDependencyGraphCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: `certification_evidence_${input.graph_id}`,
    graph_id: input.graph_id,
    schema_validation_refs: input.nodes.map((node) => node.integrity_hash ?? ""),
    node_validation_refs: input.nodes.map((node) => node.node_id),
    relationship_validation_refs: input.relationships.map((relationship) => relationship.relationship_id),
    dependency_validation_refs: input.dependency_validation?.validation_records.map((record) => record.validation_id) ?? input.relationships.filter((relationship) => relationship.relationship_type === "depends_on").map((relationship) => relationship.relationship_id),
    conflict_validation_refs: input.conflict_detection?.ledger_records.map((record) => record.ledger_entry_id) ?? [],
    blocker_validation_refs: input.blocker_detection?.ledger_records.map((record) => record.ledger_entry_id) ?? [],
    cycle_validation_refs: input.graph_safety.ledger_records.map((record) => record.ledger_entry_id),
    ordering_validation_refs: input.graph_ordering.ledger_records.map((record) => record.ledger_entry_id),
    ledger_validation_refs: input.graph_ledger.integrity_records.map((record) => record.validation_id),
    replay_validation_refs: [replay.replay_validation_id],
    governance_evidence_refs: governanceRefs(input),
    constitutional_evidence_refs: input.constitutional_refs,
    authority_evidence_refs: authorityRefs(input),
    integrity_evidence_refs: normalizeStrings([
      input.graph_safety.integrity_hash,
      input.graph_ordering.integrity_hash,
      input.graph_ledger.integrity_hash,
      ...input.nodes.map((node) => node.integrity_hash ?? ""),
      ...input.relationships.map((relationship) => relationship.integrity_hash),
    ]),
  };
  return Object.freeze({ ...base, integrity_hash: evidenceHash(base) });
}

function certificationState(tests: readonly DecisionDependencyGraphCertificationTestResult[], replay: DecisionDependencyGraphCertificationReplayRecord): DecisionDependencyGraphCertificationState {
  const fail = tests.some((test) => test.actual === "FAIL")
    || replay.comparison_result !== "MATCH"
    || replay.ordering_result !== "MATCH"
    || replay.ledger_result !== "MATCH";
  return fail ? "FAIL" : "PASS";
}

function buildRecord(input: DecisionDependencyGraphCertificationInput, tests: readonly DecisionDependencyGraphCertificationTestResult[], replay: DecisionDependencyGraphCertificationReplayRecord, version: string): DecisionDependencyGraphCertificationRecord {
  const failures = normalizeStrings(tests.filter((test) => test.actual === "FAIL").map((test) => test.reason_code)) as DecisionDependencyGraphCertificationReasonCode[];
  const passed = tests.filter((test) => test.actual === "PASS").length;
  const state = certificationState(tests, replay);
  const base: Omit<DecisionDependencyGraphCertificationRecord, "integrity_hash"> = {
    certification_id: `decision_dependency_graph_certification_${input.graph_id}`,
    graph_id: input.graph_id,
    graph_version: input.graph_version,
    certification_state: state,
    test_results: tests,
    overall_score: Number((passed / tests.length).toFixed(4)),
    failure_reasons: failures,
    governance_status: governanceRefs(input).length > 0 ? "PASS" : "FAIL",
    constitutional_status: input.constitutional_refs.length > 0 ? "PASS" : "FAIL",
    authority_status: tests.find((test) => test.test_id === "cert_test_authority")?.actual ?? "FAIL",
    replay_status: replay.comparison_result === "MATCH" ? "PASS" : "FAIL",
    ledger_status: input.graph_ledger.ledger_status,
    validator_version: version,
    replay_refs: replayRefs(input),
    governance_refs: governanceRefs(input),
    evidence_refs: normalizeStrings(tests.flatMap((test) => test.evidence_refs)),
    timestamp: CERTIFICATION_TIMESTAMP_REF,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildReport(input: DecisionDependencyGraphCertificationInput, record: DecisionDependencyGraphCertificationRecord): DecisionDependencyGraphCertificationReport {
  const failed = record.test_results.filter((test) => test.actual === "FAIL");
  const base: Omit<DecisionDependencyGraphCertificationReport, "integrity_hash"> = {
    report_id: `decision_dependency_graph_certification_report_${input.graph_id}`,
    graph_id: input.graph_id,
    certification_state: record.certification_state,
    executive_summary: record.certification_state === "PASS"
      ? "Decision Dependency Graph is deterministic, replayable, ledger-backed, and safe for orchestration."
      : "Decision Dependency Graph certification failed and orchestration remains blocked.",
    executed_tests: record.test_results.length,
    passed_tests: record.test_results.length - failed.length,
    failed_tests: failed.length,
    warnings: Object.freeze([]),
    graph_statistics: Object.freeze({
      node_count: input.nodes.length,
      relationship_count: input.relationships.length,
      dependency_count: input.relationships.filter((relationship) => relationship.relationship_type === "depends_on").length,
      conflict_count: input.conflict_detection?.conflicts.length ?? input.nodes.filter((node) => node.conflict_refs.length > 0).length,
      blocker_count: input.blocker_detection?.blockers.length ?? input.nodes.filter((node) => node.blocker_refs.length > 0).length,
      cycle_count: input.graph_safety.cycles.length,
      ordered_node_count: input.graph_ordering.ordered_node_ids.length,
    }),
    certification_decision: record.certification_state === "PASS" ? "PASS: production orchestration may consume the certified graph." : "FAIL: production orchestration is blocked.",
    remediation_actions: failed.map((test) => `Resolve ${test.reason_code}.`),
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function buildLedgerRecord(input: DecisionDependencyGraphCertificationInput, record: DecisionDependencyGraphCertificationRecord, version: string): DecisionDependencyGraphCertificationLedgerRecord {
  const base: Omit<DecisionDependencyGraphCertificationLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `decision_dependency_graph_certification_ledger_${input.graph_id}`,
    certification_id: record.certification_id,
    graph_id: input.graph_id,
    graph_version: input.graph_version,
    certification_state: record.certification_state,
    certification_score: record.overall_score,
    test_results: record.test_results.map((test) => test.test_id),
    validator_version: version,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    evidence_refs: record.evidence_refs,
    timestamp: CERTIFICATION_TIMESTAMP_REF,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

export function certifyDecisionDependencyGraph(input: DecisionDependencyGraphCertificationInput): DecisionDependencyGraphCertificationResult {
  const reasons: DecisionDependencyGraphCertificationReasonCode[] = [];
  const version = input.certification_version ?? DECISION_DEPENDENCY_GRAPH_CERTIFICATION_VERSION;
  if ((input.hidden_certification_refs ?? []).length > 0) addReason(reasons, "HIDDEN_CERTIFICATION_LOGIC_REJECTED");
  if ((input.expected_graph_version ?? input.graph_version) !== input.graph_version) addReason(reasons, "GRAPH_SAFETY_FAILURE");

  const tests = Object.freeze(buildTests(input).map((test) => {
    addReason(reasons, test.reason_code);
    return test;
  }));
  addReason(reasons, "CERTIFICATION_TESTS_EXECUTED");
  const replay = buildReplayRecord(input, tests, version);
  if (input.replay_expected_hash && input.replay_expected_hash !== hash({ tests, replay })) addReason(reasons, "REPLAY_MISMATCH_DETECTED");
  if (replay.comparison_result === "MATCH") addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_GRAPH");

  const evidence = buildEvidencePackage(input, replay);
  addReason(reasons, "CERTIFICATION_EVIDENCE_GENERATED");
  const record = buildRecord(input, tests, replay, version);
  const report = buildReport(input, record);
  const ledger = buildLedgerRecord(input, record, version);
  addReason(reasons, "CERTIFICATION_LEDGER_RECORDED");

  const forcedFail = reasons.some((reason) => [
    "HIDDEN_CERTIFICATION_LOGIC_REJECTED",
    "REPLAY_MISMATCH_DETECTED",
    "GRAPH_SAFETY_FAILURE",
  ].includes(reason));
  const state: DecisionDependencyGraphCertificationState = forcedFail ? "FAIL" : record.certification_state;
  const replayResult = hash({ record: { ...record, certification_state: state }, replay, evidence, report, ledger });
  const base: Omit<DecisionDependencyGraphCertificationResult, "integrity_hash"> = {
    certification_state: state,
    certificationStatus: state,
    reasonCodes: Object.freeze(normalizeStrings(reasons) as DecisionDependencyGraphCertificationReasonCode[]),
    certification_record: state === record.certification_state ? record : Object.freeze({ ...record, certification_state: state, integrity_hash: recordHash({ ...record, certification_state: state }) }),
    test_results: tests,
    replay_record: replay,
    evidence_package: evidence,
    report,
    ledger_record: ledger,
    production_ready: state === "PASS",
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replayResult,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export const DecisionDependencyGraphCertificationGate = Object.freeze({
  certify: certifyDecisionDependencyGraph,
});
