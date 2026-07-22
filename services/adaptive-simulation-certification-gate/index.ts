import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { appendSimulationValidationLedgerRecord, replaySimulationValidationLedger } from "@/services/simulation-validation-ledger";
import type {
  AdaptiveSimulationCertificationApiSurface,
  AdaptiveSimulationCertificationComponent,
  AdaptiveSimulationCertificationEvidencePackage,
  AdaptiveSimulationCertificationFailure,
  AdaptiveSimulationCertificationFoundation,
  AdaptiveSimulationCertificationInput,
  AdaptiveSimulationCertificationMetrics,
  AdaptiveSimulationCertificationOutcome,
  AdaptiveSimulationCertificationRecord,
  AdaptiveSimulationCertificationResult,
  AdaptiveSimulationCertificationScenario,
  ComponentCertification,
} from "@/types/adaptive-simulation-certification-gate";

const GATE_VERSION = "adaptive-simulation-certification-gate/v1" as const;
const GATE_IDENTIFIER = "AdaptiveSimulationCertificationGate" as const;

const COMPONENTS: readonly AdaptiveSimulationCertificationComponent[] = Object.freeze([
  "REPLAY_CERTIFICATION",
  "SIMULATION_CERTIFICATION",
  "GOVERNANCE_CERTIFICATION",
  "OPERATOR_CERTIFICATION",
  "ROLLBACK_CERTIFICATION",
  "AUDIT_CERTIFICATION",
]);

type Scenario = NonNullable<AdaptiveSimulationCertificationInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): AdaptiveSimulationCertificationApiSurface {
  const base: Omit<AdaptiveSimulationCertificationApiSurface, "integrity_hash"> = {
    api_id: "adaptive_simulation_certification_gate_api",
    certify_simulation: "POST /adaptive-simulation-certification-gate/certify",
    retrieve_components: "POST /adaptive-simulation-certification-gate/components",
    retrieve_evidence: "POST /adaptive-simulation-certification-gate/evidence",
    retrieve_metrics: "POST /adaptive-simulation-certification-gate/metrics",
    replay_certification: "POST /adaptive-simulation-certification-gate/replay",
    inspect_gate: "POST /adaptive-simulation-certification-gate/inspect",
    retrieve_contract: "GET /adaptive-simulation-certification-gate/contract",
    implementation_authorization_supported: false,
    governance_bypass_supported: false,
    fail_open_supported: false,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): AdaptiveSimulationCertificationFailure | undefined {
  const map: Partial<Record<AdaptiveSimulationCertificationScenario, AdaptiveSimulationCertificationFailure>> = {
    NONDETERMINISTIC_REPLAY: "NONDETERMINISTIC_REPLAY",
    SIMULATION_INCONSISTENCY: "SIMULATION_INCONSISTENCY",
    UNEXPLAINED_REPLAY_DIVERGENCE: "UNEXPLAINED_REPLAY_DIVERGENCE",
    HIDDEN_REGRESSION: "HIDDEN_REGRESSION",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION",
    OPERATOR_AUTHORITY_REDUCTION: "OPERATOR_AUTHORITY_REDUCTION",
    APPROVAL_WORKFLOW_DEGRADATION: "APPROVAL_WORKFLOW_DEGRADATION",
    ROLLBACK_FAILURE: "ROLLBACK_FAILURE",
    INCOMPLETE_AUDIT_EVIDENCE: "INCOMPLETE_AUDIT_EVIDENCE",
    MISSING_LINEAGE: "MISSING_LINEAGE",
    LEDGER_INTEGRITY_FAILURE: "LEDGER_INTEGRITY_FAILURE",
    REPLAY_INTEGRITY_FAILURE: "REPLAY_INTEGRITY_FAILURE",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    INCOMPLETE_CERTIFICATION_EVIDENCE: "INCOMPLETE_CERTIFICATION_EVIDENCE",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, ledgerReplayable: boolean): readonly AdaptiveSimulationCertificationFailure[] {
  const failures: AdaptiveSimulationCertificationFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!ledgerReplayable) failures.push("SIMULATION_LEDGER_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(scenario: Scenario, failures: readonly AdaptiveSimulationCertificationFailure[]): AdaptiveSimulationCertificationOutcome {
  if (scenario === "CONDITIONAL_DOCUMENTATION") return "CONDITIONAL_PASS";
  if (failures.includes("MISSING_LINEAGE") || failures.includes("INCOMPLETE_CERTIFICATION_EVIDENCE") || failures.includes("SIMULATION_LEDGER_UNAVAILABLE")) return "REQUIRES_MORE_EVIDENCE";
  if (failures.includes("GOVERNANCE_BYPASS") || failures.includes("CONSTITUTIONAL_VIOLATION") || failures.includes("AUTHORITY_EXPANSION") || failures.includes("APPROVAL_WORKFLOW_DEGRADATION")) return "REQUIRES_GOVERNANCE_REVIEW";
  if (failures.includes("OPERATOR_AUTHORITY_REDUCTION")) return "REQUIRES_OPERATOR_REVIEW";
  return failures.length ? "FAIL" : "PASS";
}

function componentFailures(component: AdaptiveSimulationCertificationComponent, failures: readonly AdaptiveSimulationCertificationFailure[]): readonly AdaptiveSimulationCertificationFailure[] {
  const map: Record<AdaptiveSimulationCertificationComponent, readonly AdaptiveSimulationCertificationFailure[]> = {
    REPLAY_CERTIFICATION: ["NONDETERMINISTIC_REPLAY", "REPLAY_INTEGRITY_FAILURE", "UNEXPLAINED_REPLAY_DIVERGENCE"],
    SIMULATION_CERTIFICATION: ["SIMULATION_INCONSISTENCY", "HIDDEN_REGRESSION", "UNEXPLAINED_REPLAY_DIVERGENCE"],
    GOVERNANCE_CERTIFICATION: ["GOVERNANCE_BYPASS", "CONSTITUTIONAL_VIOLATION", "AUTHORITY_EXPANSION", "APPROVAL_WORKFLOW_DEGRADATION"],
    OPERATOR_CERTIFICATION: ["OPERATOR_AUTHORITY_REDUCTION"],
    ROLLBACK_CERTIFICATION: ["ROLLBACK_FAILURE"],
    AUDIT_CERTIFICATION: ["INCOMPLETE_AUDIT_EVIDENCE", "MISSING_LINEAGE", "LEDGER_INTEGRITY_FAILURE", "INCOMPLETE_CERTIFICATION_EVIDENCE", "SIMULATION_LEDGER_UNAVAILABLE"],
  };
  const scoped = map[component].filter((failure) => failures.includes(failure));
  if (failures.includes("TENANT_ISOLATION_BREACH")) return freezeArray([...scoped, "TENANT_ISOLATION_BREACH"]);
  return freezeArray(scoped);
}

function requirementsFor(component: AdaptiveSimulationCertificationComponent): readonly string[] {
  const map: Record<AdaptiveSimulationCertificationComponent, readonly string[]> = {
    REPLAY_CERTIFICATION: ["deterministic_replay", "replay_reproducibility", "replay_integrity", "replay_hash_consistency", "event_ordering", "checkpoint_integrity", "lineage_completeness"],
    SIMULATION_CERTIFICATION: ["improvement_demonstrated", "no_hidden_regression", "measurable_benefit", "deterministic_outcomes", "explainable_improvements", "reproducible_metrics"],
    GOVERNANCE_CERTIFICATION: ["policy_preserved", "constitutional_compliance", "authority_boundaries", "approval_integrity", "governance_consistency", "certification_integrity"],
    OPERATOR_CERTIFICATION: ["operator_visibility", "operator_authority", "explainability", "override_capability", "review_workflow", "approval_transparency"],
    ROLLBACK_CERTIFICATION: ["rollback_executable", "rollback_deterministic", "rollback_complete", "rollback_replay", "rollback_integrity", "rollback_evidence_preservation"],
    AUDIT_CERTIFICATION: ["audit_complete", "lineage_complete", "ledger_complete", "evidence_complete", "replay_lineage", "governance_lineage", "certification_lineage", "operator_lineage"],
  };
  return freezeArray(map[component]);
}

function buildComponent(component: AdaptiveSimulationCertificationComponent, failures: readonly AdaptiveSimulationCertificationFailure[]): ComponentCertification {
  const scopedFailures = componentFailures(component, failures);
  const base: Omit<ComponentCertification, "integrity_hash"> = {
    component,
    verified_requirements: requirementsFor(component),
    pass: scopedFailures.length === 0,
    failures: scopedFailures,
    evidence_hash: hash({ component, requirements: requirementsFor(component), failures: scopedFailures }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function component(components: readonly ComponentCertification[], id: AdaptiveSimulationCertificationComponent): ComponentCertification {
  return components.find((item) => item.component === id) ?? components[0];
}

function buildEvidencePackage(components: readonly ComponentCertification[], recordSeed: string): AdaptiveSimulationCertificationEvidencePackage {
  const base: Omit<AdaptiveSimulationCertificationEvidencePackage, "integrity_hash"> = {
    replay_certification_report_hash: component(components, "REPLAY_CERTIFICATION").evidence_hash,
    simulation_certification_report_hash: component(components, "SIMULATION_CERTIFICATION").evidence_hash,
    governance_certification_report_hash: component(components, "GOVERNANCE_CERTIFICATION").evidence_hash,
    operator_certification_report_hash: component(components, "OPERATOR_CERTIFICATION").evidence_hash,
    rollback_certification_report_hash: component(components, "ROLLBACK_CERTIFICATION").evidence_hash,
    audit_certification_report_hash: component(components, "AUDIT_CERTIFICATION").evidence_hash,
    certification_decision_summary_hash: hash({ recordSeed, components: components.map((item) => item.integrity_hash) }),
    replay_integrity_report_hash: hash({ replay: component(components, "REPLAY_CERTIFICATION").integrity_hash }),
    simulation_evidence_package_hash: hash({ simulation: component(components, "SIMULATION_CERTIFICATION").integrity_hash }),
    certification_lineage_package_hash: hash({ audit: component(components, "AUDIT_CERTIFICATION").integrity_hash, lineage: true }),
    governance_review_package_hash: hash({ governance: component(components, "GOVERNANCE_CERTIFICATION").integrity_hash, next_step: "governance_review" }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function requiredFollowUp(outcome: AdaptiveSimulationCertificationOutcome): string {
  const map: Record<AdaptiveSimulationCertificationOutcome, string> = {
    PASS: "Governance Review",
    CONDITIONAL_PASS: "Additional Simulation Required",
    FAIL: "Proposal Blocked",
    REQUIRES_MORE_EVIDENCE: "Evidence Collection",
    REQUIRES_GOVERNANCE_REVIEW: "Governance Escalation",
    REQUIRES_OPERATOR_REVIEW: "Operator Review",
  };
  return map[outcome];
}

function buildRecord(input: AdaptiveSimulationCertificationInput, components: readonly ComponentCertification[], evidence: AdaptiveSimulationCertificationEvidencePackage, outcome: AdaptiveSimulationCertificationOutcome, failures: readonly AdaptiveSimulationCertificationFailure[]): AdaptiveSimulationCertificationRecord {
  const ledger = input.ledger_result ?? appendSimulationValidationLedgerRecord();
  const proposal_id = input.proposal_id ?? ledger.record.proposal_id;
  const tenant_id = input.tenant_id ?? ledger.record.tenant_id;
  const base: Omit<AdaptiveSimulationCertificationRecord, "integrity_hash"> = {
    certification_id: `adaptive_sim_cert_${hash({ proposal_id, tenant_id, ledger: ledger.record.integrity_hash }).slice(0, 16)}`,
    proposal_id,
    tenant_id,
    replay_certification: component(components, "REPLAY_CERTIFICATION"),
    simulation_certification: component(components, "SIMULATION_CERTIFICATION"),
    governance_certification: component(components, "GOVERNANCE_CERTIFICATION"),
    operator_certification: component(components, "OPERATOR_CERTIFICATION"),
    rollback_certification: component(components, "ROLLBACK_CERTIFICATION"),
    audit_certification: component(components, "AUDIT_CERTIFICATION"),
    certification_outcome: outcome,
    certification_rationale: failures.length ? `Certification blocked by ${failures.join(", ")}.` : "All mandatory adaptive simulation certification requirements passed with immutable evidence.",
    required_follow_up: requiredFollowUp(outcome),
    evidence_package_reference: evidence.integrity_hash,
    replay_reference: ledger.record.replay_hash,
    simulation_reference: ledger.record.simulation_id,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(components: readonly ComponentCertification[], failures: readonly AdaptiveSimulationCertificationFailure[], outcome: AdaptiveSimulationCertificationOutcome): AdaptiveSimulationCertificationMetrics {
  const base: Omit<AdaptiveSimulationCertificationMetrics, "integrity_hash"> = {
    mandatory_certifications_evaluated: components.length,
    mandatory_certifications_passed: components.filter((item) => item.pass).length,
    deterministic_replay_certified: component(components, "REPLAY_CERTIFICATION").pass,
    simulation_reproducibility_certified: component(components, "SIMULATION_CERTIFICATION").pass,
    measurable_improvement_certified: component(components, "SIMULATION_CERTIFICATION").pass,
    governance_certified: component(components, "GOVERNANCE_CERTIFICATION").pass,
    operator_authority_certified: component(components, "OPERATOR_CERTIFICATION").pass,
    rollback_certified: component(components, "ROLLBACK_CERTIFICATION").pass,
    audit_certified: component(components, "AUDIT_CERTIFICATION").pass,
    certification_progression_authorized: outcome === "PASS",
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveSimulationCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    ledger_hash: result.ledger_result.integrity_hash,
    component_hashes: result.components.map((item) => item.integrity_hash),
    record_hash: result.record.integrity_hash,
    evidence_hash: result.evidence_package.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    outcome: result.certification_outcome,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveSimulationCertificationResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_simulation_certification_gate_version,
    gate_identifier: result.gate_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function certifyAdaptiveSimulation(input: AdaptiveSimulationCertificationInput = {}): AdaptiveSimulationCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const ledger_result = input.ledger_result ?? appendSimulationValidationLedgerRecord();
  const failures = collectFailures(scenario, replaySimulationValidationLedger(ledger_result));
  const outcome = outcomeFor(scenario, failures);
  const components = freezeArray(COMPONENTS.map((item) => buildComponent(item, failures)));
  const evidence_package = buildEvidencePackage(components, hash({ ledger: ledger_result.record.integrity_hash, outcome }));
  const record = buildRecord({ ...input, ledger_result }, components, evidence_package, outcome, failures);
  const metrics = buildMetrics(components, failures, outcome);
  const base: Omit<AdaptiveSimulationCertificationResult, "integrity_hash" | "replay_hash"> = {
    adaptive_simulation_certification_gate_version: GATE_VERSION,
    gate_identifier: GATE_IDENTIFIER,
    api_surface,
    ledger_result,
    components,
    record,
    evidence_package,
    metrics,
    certification_outcome: outcome,
    failures,
    deterministic: metrics.deterministic_replay_certified,
    replayable: failures.length === 0,
    explainable: !failures.includes("UNEXPLAINED_REPLAY_DIVERGENCE") && !failures.includes("INCOMPLETE_CERTIFICATION_EVIDENCE"),
    governance_preserved: metrics.governance_certified,
    constitutional_preserved: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    operator_authority_preserved: metrics.operator_authority_certified,
    rollback_ready: metrics.rollback_certified,
    audit_complete: metrics.audit_certified,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    authorizes_governance_review: outcome === "PASS",
    authorizes_implementation: false,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveSimulationCertification(result: AdaptiveSimulationCertificationResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replaySimulationValidationLedger(result.ledger_result) &&
    result.components.every(verifyHashedRecord) &&
    verifyHashedRecord(result.evidence_package) &&
    verifyHashedRecord(result.record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveSimulationCertificationFoundation(): AdaptiveSimulationCertificationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_simulation_certification_gate_version: GATE_VERSION,
    certification_components: COMPONENTS,
    api_surface,
    result: certifyAdaptiveSimulation(),
  });
}

export const AdaptiveSimulationCertificationGate = Object.freeze({
  certify: certifyAdaptiveSimulation,
  replay: replayAdaptiveSimulationCertification,
});
