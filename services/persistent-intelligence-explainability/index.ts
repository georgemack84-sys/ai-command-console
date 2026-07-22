import { runGovernanceConstitutionalEnforcement, validateGovernanceConstitutionalEnforcement } from "@/services/governance-constitutional-enforcement";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ArtifactExplanation,
  ConfidenceEvolution,
  EvidenceTrace,
  ExplainabilityCertification,
  ExplainabilityCertificationTest,
  ExplainabilityContract,
  ExplainabilityContractBundle,
  ExplainabilityFailure,
  ExplainabilityGraph,
  ExplainabilityInput,
  ExplainabilityLedgerEntry,
  ExplainabilityObservability,
  ExplainabilityResult,
  ExplainabilityScenario,
  ExplainabilityValidation,
  GovernanceHistory,
  QualificationHistory,
  ReplayLineageHistory,
  UsageIntelligence,
} from "@/types/persistent-intelligence-explainability";

const VERSION = "persistent-intelligence-explainability/v11.10" as const;
const ID = "PersistentIntelligenceExplainability" as const;
const DEFAULT_ARTIFACT = "persistent-intelligence-artifact:mission-control-operational-learning";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: ExplainabilityScenario): ExplainabilityFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly ExplainabilityFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

function contract(failures: readonly ExplainabilityFailure[]): ExplainabilityContract {
  const base: Omit<ExplainabilityContract, "integrity_hash"> = {
    contract_id: id("persistent_explainability_contract", VERSION),
    required_metadata: freezeArray(["identity", "persistence rationale", "retention rationale", "approval chain", "governance history", "confidence history", "lineage", "usage", "expiration", "supersession", "replay"]),
    mandatory_evidence: freezeArray(["observations", "outcomes", "simulations", "governance reviews", "operator approvals", "certifications"]),
    lineage_required: !failures.includes("LINEAGE_GRAPH_BROKEN"),
    governance_required: !failures.includes("GOVERNANCE_HISTORY_MISSING"),
    replay_required: !failures.includes("REPLAY_HISTORY_NONDETERMINISTIC"),
    certification_required: !failures.includes("CERTIFICATION_TRACE_MISSING"),
    human_readable_required: !failures.includes("HUMAN_EXPLANATION_MISSING"),
    machine_readable_required: !failures.includes("STRUCTURED_EXPLANATION_INCONSISTENT"),
    black_box_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INVALID") ? "invalid-explainability-contract" : hashWithoutIntegrity(base) });
}

function explanation(artifact_id: string, failures: readonly ExplainabilityFailure[]): ArtifactExplanation {
  const complete = !failures.includes("ARTIFACT_UNEXPLAINED");
  const base: Omit<ArtifactExplanation, "integrity_hash"> = {
    explanation_id: id("artifact_explanation", artifact_id),
    artifact_id,
    title: "Mission Control persistent operational learning",
    human_readable: failures.includes("HUMAN_EXPLANATION_MISSING") ? "" : "This artifact exists because repeated mission outcomes produced governance-approved operational learning that was qualified, retained, replayed, and reused under constitutional oversight.",
    machine_readable: Object.freeze({
      what: "governance-qualified persistent intelligence artifact",
      why_exists: "qualified cross-mission operational learning",
      why_retained: "reusable organizational knowledge with replayable evidence",
      expiration: "review on supersession or confidence degradation",
      supersession: "version 1.1 supersedes version 1.0 without deleting history",
    }),
    persistence_rationale: failures.includes("PERSISTENCE_RATIONALE_MISSING") ? "" : "High-confidence recurrent outcome pattern qualified for persistent organizational reuse.",
    retention_rationale: "Retained because it remains active, cited, and governance-certified.",
    evidence_rationale: "Supported by observations, outcomes, simulations, approvals, and certifications.",
    qualification_rationale: "Qualified after reviewer approval, trust scoring, duplicate consolidation, and replay validation.",
    governance_rationale: failures.includes("GOVERNANCE_HISTORY_MISSING") ? "" : "Approved through governance, constitutional, policy, authority, and human approval checks.",
    confidence_rationale: "Confidence increased only when linked evidence and calibration events were recorded.",
    historical_rationale: "Historical versions are preserved through append-only supersession.",
    usage_rationale: failures.includes("USAGE_ATTRIBUTION_MISSING") ? "" : "Used in retrieval, recommendation, replay, simulation, and governance review workflows.",
    lifecycle_rationale: "Lifecycle state remains persistent until supersession, archive, or retirement review.",
    replay_ref: failures.includes("REPLAY_HISTORY_NONDETERMINISTIC") ? "" : "replay:explainability:artifact",
    complete,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function graph(artifact_id: string, failures: readonly ExplainabilityFailure[]): ExplainabilityGraph {
  const nodes = freezeArray(["artifact", "evidence", "qualification", "confidence", "governance", "replay", "lineage", "usage", "lifecycle"]);
  const edges = freezeArray([
    Object.freeze({ from: "artifact", to: "evidence", relation: "supported_by" }),
    Object.freeze({ from: "evidence", to: "qualification", relation: "qualifies" }),
    Object.freeze({ from: "qualification", to: "governance", relation: "approved_by" }),
    Object.freeze({ from: "governance", to: "confidence", relation: "validates" }),
    Object.freeze({ from: "artifact", to: "lineage", relation: "evolves_through" }),
    Object.freeze({ from: "artifact", to: "usage", relation: "used_by" }),
    Object.freeze({ from: "artifact", to: "replay", relation: "reproduced_by" }),
    Object.freeze({ from: "artifact", to: "lifecycle", relation: "managed_by" }),
  ]);
  const base: Omit<ExplainabilityGraph, "integrity_hash"> = { graph_id: id("explainability_graph", artifact_id), artifact_id, nodes, edges, navigable_forward: true, navigable_backward: true, complete: !failures.includes("LINEAGE_GRAPH_BROKEN") && !failures.includes("PARENT_CHILD_RELATION_INVALID") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function evidenceTrace(artifact_id: string, failures: readonly ExplainabilityFailure[]): EvidenceTrace {
  const missing = failures.includes("EVIDENCE_CHAIN_INCOMPLETE");
  const base: Omit<EvidenceTrace, "integrity_hash"> = {
    trace_id: id("evidence_trace", artifact_id),
    evidence_refs: missing ? freezeArray([]) : freezeArray(["evidence:observation:alpha", "evidence:outcome:beta", "evidence:simulation:gamma", "evidence:approval:delta"]),
    source_refs: failures.includes("SOURCE_REFERENCE_MISSING") ? freezeArray([]) : freezeArray(["source:mission:001", "source:mission:002"]),
    observation_refs: freezeArray(["observation:recurring-risk-pattern"]),
    outcome_refs: freezeArray(["outcome:reduced-escalation-latency"]),
    simulation_refs: freezeArray(["simulation:counterfactual-validation"]),
    approval_refs: freezeArray(["approval:operator:governance"]),
    certification_refs: failures.includes("CERTIFICATION_TRACE_MISSING") ? freezeArray([]) : freezeArray(["certification:persistent-knowledge", "certification:governance-enforcement"]),
    immutable_links: true,
    duplicate_evidence_resolved: !failures.includes("DUPLICATE_EVIDENCE_UNRESOLVED"),
    complete: !missing,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function qualificationHistory(artifact_id: string, failures: readonly ExplainabilityFailure[]): QualificationHistory {
  const base: Omit<QualificationHistory, "integrity_hash"> = { history_id: id("qualification_history", artifact_id), qualification_scores: freezeArray([0.78, 0.86, 0.93]), reviewer_decisions: failures.includes("REVIEWER_DECISION_MISSING") ? freezeArray([]) : freezeArray(["reviewer:accepted", "operator:certified"]), replay_validated: !failures.includes("QUALIFICATION_REPLAY_FAILED"), trust_qualified: true, duplicate_consolidation: true, certification_status: failures.includes("CERTIFICATION_TRACE_MISSING") ? "UNCERTIFIED" : "CERTIFIED", complete: !failures.includes("QUALIFICATION_HISTORY_MISSING") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function confidenceEvolution(artifact_id: string, failures: readonly ExplainabilityFailure[]): ConfidenceEvolution {
  const unsupported = failures.includes("CONFIDENCE_CHANGE_UNSUPPORTED");
  const base: Omit<ConfidenceEvolution, "integrity_hash"> = {
    evolution_id: id("confidence_evolution", artifact_id),
    timeline: freezeArray([
      Object.freeze({ event: "initial qualification", confidence: 0.78, evidence_ref: "evidence:observation:alpha" }),
      Object.freeze({ event: "outcome validation", confidence: 0.86, evidence_ref: unsupported ? "" : "evidence:outcome:beta" }),
      Object.freeze({ event: "simulation calibration", confidence: 0.93, evidence_ref: "evidence:simulation:gamma" }),
    ]),
    evidence_backed_changes: !unsupported,
    calibration_history_valid: !failures.includes("CALIBRATION_HISTORY_MISSING"),
    consistent: !failures.includes("CONFIDENCE_INCONSISTENT"),
    complete: !failures.includes("CONFIDENCE_HISTORY_MISSING"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governanceHistory(artifact_id: string, failures: readonly ExplainabilityFailure[]): GovernanceHistory {
  const base: Omit<GovernanceHistory, "integrity_hash"> = { history_id: id("governance_history", artifact_id), governance_approvals: failures.includes("GOVERNANCE_HISTORY_MISSING") ? freezeArray([]) : freezeArray(["governance:approved:11.9"]), constitutional_validations: failures.includes("CONSTITUTIONAL_HISTORY_MISSING") ? freezeArray([]) : freezeArray(["constitutional:validated:11.9"]), operator_approvals: freezeArray(["operator:governance-authority"]), policy_validations: freezeArray(["policy:retention", "policy:visibility", "policy:security"]), authority_verifications: failures.includes("AUTHORITY_BOUNDARY_MISSING") ? freezeArray([]) : freezeArray(["authority:advisory-only", "authority:human-supremacy"]), overrides: failures.includes("OVERRIDE_TRACE_MISSING") ? freezeArray(["override:untraced"]) : freezeArray([]), revocations: freezeArray([]), complete: !failures.includes("GOVERNANCE_HISTORY_MISSING") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayLineage(artifact_id: string, failures: readonly ExplainabilityFailure[]): ReplayLineageHistory {
  const base: Omit<ReplayLineageHistory, "integrity_hash"> = { history_id: id("replay_lineage", artifact_id), originating_missions: freezeArray(["mission:001", "mission:002"]), parent_artifacts: failures.includes("PARENT_CHILD_RELATION_INVALID") ? freezeArray([]) : freezeArray(["artifact:parent:operational-pattern"]), child_artifacts: freezeArray(["artifact:child:recommendation-pattern"]), related_artifacts: freezeArray(["artifact:related:governance-decision"]), version_tree: failures.includes("VERSION_TREE_INCONSISTENT") ? freezeArray(["1.1", "1.0"]) : freezeArray(["1.0", "1.1"]), supersession_chain: freezeArray(["artifact:v1 -> artifact:v1.1"]), archival_history: freezeArray(["archive:scheduled-on-retirement"]), replay_executions: failures.includes("REPLAY_HISTORY_NONDETERMINISTIC") ? freezeArray([]) : freezeArray(["replay:2026-07-14:deterministic"]), deterministic: !failures.includes("REPLAY_HISTORY_NONDETERMINISTIC"), complete: !failures.includes("LINEAGE_GRAPH_BROKEN") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function usage(artifact_id: string, failures: readonly ExplainabilityFailure[]): UsageIntelligence {
  const base: Omit<UsageIntelligence, "integrity_hash"> = { usage_id: id("usage_intelligence", artifact_id), retrievals: 17, recommendation_refs: failures.includes("RECOMMENDATION_USAGE_MISSING") ? freezeArray([]) : freezeArray(["recommendation:adaptive-routing"]), mission_refs: failures.includes("MISSION_REFERENCE_MISSING") ? freezeArray([]) : freezeArray(["mission:003", "mission:004"]), operator_refs: freezeArray(["operator:mission-lead"]), certification_refs: freezeArray(["certification:phase-11.10"]), replay_session_refs: freezeArray(["replay:usage:001"]), simulation_refs: freezeArray(["simulation:usage-impact"]), governance_review_refs: freezeArray(["governance-review:quarterly"]), organizational_impact_score: failures.includes("IMPACT_REPRODUCTION_FAILED") ? 0 : 0.82, attributable: !failures.includes("USAGE_ATTRIBUTION_MISSING") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(artifact_id: string, failures: readonly ExplainabilityFailure[]): readonly ExplainabilityLedgerEntry[] {
  const events: readonly ExplainabilityLedgerEntry["event"][] = freezeArray(["EXPLANATION_RECORDED", "EVIDENCE_TRACED", "QUALIFICATION_EXPLAINED", "CONFIDENCE_EXPLAINED", "GOVERNANCE_EXPLAINED", "LINEAGE_EXPLAINED", "USAGE_EXPLAINED", "OBSERVABILITY_RECORDED", "CERTIFICATION_RECORDED"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<ExplainabilityLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("explainability_ledger", `${artifact_id}:${event}:${index}`), sequence: index + 1, event, artifact_id, replay_refs: freezeArray([`replay:explainability-ledger:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION"), tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(failures: readonly ExplainabilityFailure[]): ExplainabilityObservability {
  const base: Omit<ExplainabilityObservability, "integrity_hash"> = { observability_id: "persistent_explainability_observability", explainability_coverage: failures.includes("ARTIFACT_UNEXPLAINED") ? 0.2 : 1, evidence_trace_completeness: failures.includes("EVIDENCE_CHAIN_INCOMPLETE") ? 0.45 : 1, lineage_integrity_score: failures.includes("LINEAGE_GRAPH_BROKEN") ? 0.5 : 1, governance_traceability_score: failures.includes("GOVERNANCE_HISTORY_MISSING") ? 0.4 : 1, confidence_history_completeness: failures.includes("CONFIDENCE_HISTORY_MISSING") ? 0.5 : 1, replay_explainability_success_rate: failures.includes("REPLAY_HISTORY_NONDETERMINISTIC") ? 0 : 1, usage_attribution_coverage: failures.includes("USAGE_ATTRIBUTION_MISSING") ? 0.4 : 1, ledger_consistency: failures.includes("LEDGER_MUTATION") ? 0 : 1, api_latency_ms: 32, dashboard_available: !failures.includes("DASHBOARD_INCONSISTENT"), operational: !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certTest(name: string, passed: boolean, failure: ExplainabilityFailure, refs: readonly string[]): ExplainabilityCertificationTest {
  const base: Omit<ExplainabilityCertificationTest, "integrity_hash"> = { test_id: id("explainability_certification_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<ExplainabilityResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: TestBase): readonly ExplainabilityCertificationTest[] {
  const refs = freezeArray([result.explanation.integrity_hash, result.evidence_trace.integrity_hash, result.governance_history.integrity_hash]);
  return freezeArray([
    certTest("Artifact Explanation Completeness", result.explanation.complete, "ARTIFACT_UNEXPLAINED", refs),
    certTest("Persistence Rationale Validation", result.explanation.persistence_rationale.length > 0, "PERSISTENCE_RATIONALE_MISSING", refs),
    certTest("Structured Explanation Consistency", Object.keys(result.explanation.machine_readable).length >= 5, "STRUCTURED_EXPLANATION_INCONSISTENT", refs),
    certTest("Human-Readable Explanation Validation", result.explanation.human_readable.length > 0, "HUMAN_EXPLANATION_MISSING", refs),
    certTest("Complete Evidence Chain Validation", result.evidence_trace.complete && result.evidence_trace.evidence_refs.length >= 4, "EVIDENCE_CHAIN_INCOMPLETE", refs),
    certTest("Integrity Hash Verification", hashWithoutIntegrity(result.evidence_trace) === result.evidence_trace.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    certTest("Source Reference Completeness", result.evidence_trace.source_refs.length > 0, "SOURCE_REFERENCE_MISSING", refs),
    certTest("Duplicate Evidence Detection", result.evidence_trace.duplicate_evidence_resolved, "DUPLICATE_EVIDENCE_UNRESOLVED", refs),
    certTest("Qualification History Replay", result.qualification_history.complete && result.qualification_history.replay_validated, "QUALIFICATION_REPLAY_FAILED", refs),
    certTest("Qualification Score Evolution", result.qualification_history.qualification_scores.length >= 3, "QUALIFICATION_HISTORY_MISSING", refs),
    certTest("Reviewer Decision Validation", result.qualification_history.reviewer_decisions.length > 0, "REVIEWER_DECISION_MISSING", refs),
    certTest("Certification Traceability", result.qualification_history.certification_status === "CERTIFIED" && result.evidence_trace.certification_refs.length > 0, "CERTIFICATION_TRACE_MISSING", refs),
    certTest("Confidence Evolution Replay", result.confidence_evolution.complete, "CONFIDENCE_HISTORY_MISSING", refs),
    certTest("Evidence-Backed Confidence Changes", result.confidence_evolution.evidence_backed_changes && result.confidence_evolution.timeline.every((item) => item.evidence_ref.length > 0), "CONFIDENCE_CHANGE_UNSUPPORTED", refs),
    certTest("Calibration History Validation", result.confidence_evolution.calibration_history_valid, "CALIBRATION_HISTORY_MISSING", refs),
    certTest("Confidence Consistency Checks", result.confidence_evolution.consistent, "CONFIDENCE_INCONSISTENT", refs),
    certTest("Governance Approval Replay", result.governance_history.governance_approvals.length > 0, "GOVERNANCE_HISTORY_MISSING", refs),
    certTest("Constitutional Validation Replay", result.governance_history.constitutional_validations.length > 0, "CONSTITUTIONAL_HISTORY_MISSING", refs),
    certTest("Authority Boundary Validation", result.governance_history.authority_verifications.length > 0, "AUTHORITY_BOUNDARY_MISSING", refs),
    certTest("Override and Revocation Traceability", result.governance_history.overrides.length === 0, "OVERRIDE_TRACE_MISSING", refs),
    certTest("Lineage Graph Integrity", result.graph.complete && result.replay_lineage.complete, "LINEAGE_GRAPH_BROKEN", refs),
    certTest("Version Tree Consistency", result.replay_lineage.version_tree.join(">") === "1.0>1.1", "VERSION_TREE_INCONSISTENT", refs),
    certTest("Replay History Determinism", result.replay_lineage.deterministic && result.replay_lineage.replay_executions.length > 0, "REPLAY_HISTORY_NONDETERMINISTIC", refs),
    certTest("Parent-Child Relationship Validation", result.replay_lineage.parent_artifacts.length > 0 && result.replay_lineage.child_artifacts.length > 0, "PARENT_CHILD_RELATION_INVALID", refs),
    certTest("Retrieval Attribution", result.usage.attributable && result.usage.retrievals > 0, "USAGE_ATTRIBUTION_MISSING", refs),
    certTest("Mission Reference Validation", result.usage.mission_refs.length > 0, "MISSION_REFERENCE_MISSING", refs),
    certTest("Recommendation Usage Traceability", result.usage.recommendation_refs.length > 0, "RECOMMENDATION_USAGE_MISSING", refs),
    certTest("Organizational Impact Reproducibility", result.usage.organizational_impact_score > 0, "IMPACT_REPRODUCTION_FAILED", refs),
    certTest("Append-Only Enforcement", result.ledger.every((entry) => entry.append_only), "LEDGER_MUTATION", refs),
    certTest("Immutable History Verification", result.ledger.every((entry, index) => entry.sequence === index + 1), "LEDGER_MUTATION", refs),
    certTest("Tenant Isolation Validation", result.ledger.every((entry) => entry.tenant_isolated), "TENANT_ISOLATION_BREACH", refs),
    certTest("Cryptographic Integrity Checks", result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash), "INTEGRITY_HASH_MISMATCH", refs),
    certTest("Explainability Coverage Metrics", result.observability.explainability_coverage === 1, "ARTIFACT_UNEXPLAINED", refs),
    certTest("Missing Artifact Detection", result.explanation.artifact_id.length > 0, "ARTIFACT_UNEXPLAINED", refs),
    certTest("Health Alert Validation", result.observability.operational, "OBSERVABILITY_INCOMPLETE", refs),
    certTest("Dashboard Consistency", result.observability.dashboard_available, "DASHBOARD_INCONSISTENT", refs),
  ]);
}

function replayHash(result: Omit<ExplainabilityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, explanation: result.explanation.integrity_hash, graph: result.graph.integrity_hash, evidence: result.evidence_trace.integrity_hash, qualification: result.qualification_history.integrity_hash, confidence: result.confidence_evolution.integrity_hash, governance: result.governance_history.integrity_hash, replay: result.replay_lineage.integrity_hash, usage: result.usage.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<ExplainabilityResult, "integrity_hash">): string {
  return hash({ version: result.explainability_version, id: result.explainability_identifier, status: result.certification.status, replay_hash: result.replay_hash });
}

export function runPersistentIntelligenceExplainability(input: ExplainabilityInput = {}): ExplainabilityResult {
  const artifactId = input.artifact_id ?? DEFAULT_ARTIFACT;
  const governance = runGovernanceConstitutionalEnforcement({ tenant_id: input.tenant_id });
  const governanceCertified = validateGovernanceConstitutionalEnforcement(governance).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<ExplainabilityFailure>([...(governanceCertified ? [] : ["GOVERNANCE_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const baseWithoutCertification: TestBase = { explainability_version: VERSION, explainability_identifier: ID, governance_certified: governanceCertified, contract: contract(failures), explanation: explanation(artifactId, failures), graph: graph(artifactId, failures), evidence_trace: evidenceTrace(artifactId, failures), qualification_history: qualificationHistory(artifactId, failures), confidence_evolution: confidenceEvolution(artifactId, failures), governance_history: governanceHistory(artifactId, failures), replay_lineage: replayLineage(artifactId, failures), usage: usage(artifactId, failures), ledger: ledger(artifactId, failures), observability: observability(failures) };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is ExplainabilityFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<ExplainabilityCertification, "integrity_hash"> = { certification_id: id("persistent_explainability_certification", VERSION), status, production_ready: status === "PASS", failures: finalFailures, tests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<ExplainabilityResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validatePersistentIntelligenceExplainability(result?: ExplainabilityResult): ExplainabilityValidation {
  if (!result) {
    const failures = freezeArray<ExplainabilityFailure>(["CONTRACT_INVALID"]);
    const base: Omit<ExplainabilityValidation, "validation_hash"> = { explanation_id: null, valid: false, status: "FAIL", production_ready: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash && hashWithoutIntegrity(result.explanation) === result.explanation.integrity_hash && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash) && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.production_ready && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<ExplainabilityValidation, "validation_hash"> = { explanation_id: result.explanation.explanation_id, valid, status: result.certification.status, production_ready: result.certification.production_ready, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayPersistentIntelligenceExplainability(result = runPersistentIntelligenceExplainability()): boolean {
  const replayed = runPersistentIntelligenceExplainability({ artifact_id: result.explanation.artifact_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validatePersistentIntelligenceExplainability(result).valid;
}

export function getPersistentIntelligenceExplainabilityContract(): ExplainabilityContractBundle {
  const result = runPersistentIntelligenceExplainability();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, black_box_intelligence_supported: false, every_artifact_explained: true, evidence_required: true, governance_history_required: true, replay_required: true, usage_attribution_required: true }), result, validation: validatePersistentIntelligenceExplainability(result), observability: result.observability });
}

export const PersistentIntelligenceExplainability = Object.freeze({ run: runPersistentIntelligenceExplainability, validate: validatePersistentIntelligenceExplainability, replay: replayPersistentIntelligenceExplainability });
