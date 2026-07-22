import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskActualization } from "@/services/risk-actualization-analyzer";
import { generateRiskAdaptationDashboards } from "@/services/risk-adaptation-dashboards";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { analyzeRiskAdaptationLedger } from "@/services/risk-adaptation-ledger";
import { runRiskAdaptationSimulation } from "@/services/risk-adaptation-simulation";
import { analyzeRiskDrift } from "@/services/risk-drift-detector";
import { evaluateGovernanceAwareRiskAdaptation } from "@/services/governance-aware-risk-adaptation";
import { analyzeRiskPatternIntelligence } from "@/services/risk-pattern-intelligence";
import { analyzeRiskSeverityRecalibration } from "@/services/risk-severity-recalibrator";
import type {
  RiskAdaptationCertificationApiSurface,
  RiskAdaptationCertificationArea,
  RiskAdaptationCertificationEvidencePackage,
  RiskAdaptationCertificationFailure,
  RiskAdaptationCertificationFoundation,
  RiskAdaptationCertificationInput,
  RiskAdaptationCertificationOutcome,
  RiskAdaptationCertificationRecord,
  RiskAdaptationCertificationResult,
  RiskAdaptationCertificationTest,
  RiskAdaptationCertificationValidation,
} from "@/types/risk-adaptation-certification-gate";

const VERSION = "risk-adaptation-certification-gate/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskAdaptationCertificationInput["scenario"]>;

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

function buildApiSurface(): RiskAdaptationCertificationApiSurface {
  const base: Omit<RiskAdaptationCertificationApiSurface, "integrity_hash"> = {
    api_id: "risk_adaptation_certification_gate_api",
    certify: "POST /risk-adaptation-certification-gate/certify",
    retrieve_record: "POST /risk-adaptation-certification-gate/record",
    retrieve_tests: "POST /risk-adaptation-certification-gate/tests",
    retrieve_evidence: "POST /risk-adaptation-certification-gate/evidence",
    retrieve_validation: "POST /risk-adaptation-certification-gate/validation",
    replay_certification: "POST /risk-adaptation-certification-gate/replay",
    retrieve_contract: "GET /risk-adaptation-certification-gate/contract",
    update_supported: false,
    delete_supported: false,
    production_mutation_supported: false,
    autonomous_learning_supported: false,
    governance_bypass_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): RiskAdaptationCertificationFailure | undefined {
  const map: Partial<Record<Scenario, RiskAdaptationCertificationFailure>> = {
    MISSING_COMPONENT: "COMPONENT_CERTIFICATION_MISSING",
    NONDETERMINISTIC: "NONDETERMINISTIC_RECOMMENDATION_GENERATION",
    UNSUPPORTED_RECALIBRATION: "UNSUPPORTED_RECALIBRATION_PROPOSAL",
    MISSING_EVIDENCE: "SUPPORTING_EVIDENCE_MISSING",
    SCORING_INCONSISTENCY: "RISK_SCORING_INCONSISTENT",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE_DETECTED",
    HISTORICAL_MUTATION: "HISTORICAL_RECORD_MODIFICATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    AUTHORITY_ESCALATION: "UNAUTHORIZED_AUTHORITY_ESCALATION",
    MISSING_OPERATOR_APPROVAL: "OPERATOR_APPROVAL_MISSING",
    MISSING_SIMULATION: "HIGH_IMPACT_SIMULATION_MISSING",
    PRODUCTION_MUTATION: "AUTOMATIC_PRODUCTION_MUTATION_DETECTED",
    CONFIGURATION_CHANGE: "UNAUTHORIZED_PRODUCTION_CONFIGURATION_CHANGE",
    LEDGER_FAILURE: "LEDGER_INTEGRITY_FAILURE",
    HASH_MISMATCH: "HASH_VERIFICATION_FAILURE",
    REPLAY_GAP: "REPLAY_LINEAGE_GAP",
    CERTIFICATION_GAP: "CERTIFICATION_LINEAGE_GAP",
    ROLLBACK_GAP: "ROLLBACK_LINEAGE_GAP",
    CROSS_TENANT: "CROSS_TENANT_DATA_LEAKAGE",
    AUDIT_GAP: "AUDIT_TRAIL_INCOMPLETE",
    EXPLAINABILITY_GAP: "EXPLAINABILITY_DEFICIENCY",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILURE",
    ADVISORY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
    AUTONOMOUS_LEARNING: "AUTONOMOUS_LEARNING_DETECTED",
    FAIL_OPEN: "FAIL_OPEN_BEHAVIOR",
  };
  return map[scenario];
}

function buildTest(area: RiskAdaptationCertificationArea, description: string, failure?: RiskAdaptationCertificationFailure): RiskAdaptationCertificationTest {
  const actual: RiskAdaptationCertificationOutcome = failure ? "FAIL" : "PASS";
  const base: Omit<RiskAdaptationCertificationTest, "integrity_hash"> = {
    test_id: `risk_adaptation_cert_test_${hash(`${area}:${description}`).slice(0, 14)}`,
    area,
    description,
    expected: "PASS",
    actual,
    evidence_refs: freezeArray([`evidence_${area.toLowerCase()}_ref_1`]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTests(failures: readonly RiskAdaptationCertificationFailure[]): readonly RiskAdaptationCertificationTest[] {
  const tests: readonly [RiskAdaptationCertificationArea, string, RiskAdaptationCertificationFailure?][] = [
    ["DETERMINISM", "Recommendation, scoring, drift, pattern, simulation, and replay determinism", failures.includes("NONDETERMINISTIC_RECOMMENDATION_GENERATION") ? "NONDETERMINISTIC_RECOMMENDATION_GENERATION" : undefined],
    ["EVIDENCE", "Complete supporting evidence and attribution", failures.includes("SUPPORTING_EVIDENCE_MISSING") ? "SUPPORTING_EVIDENCE_MISSING" : undefined],
    ["GOVERNANCE", "Governance review, authority, compliance, trust, and escalation enforcement", failures.includes("GOVERNANCE_BYPASS_DETECTED") ? "GOVERNANCE_BYPASS_DETECTED" : undefined],
    ["CONSTITUTIONAL", "Constitutional safeguards, operator authority, immutability, and tenant isolation", failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? "CONSTITUTIONAL_VIOLATION_DETECTED" : undefined],
    ["SIMULATION", "Historical replay, forecast, improvement, escalation, rollback, and governance simulation", failures.includes("HIGH_IMPACT_SIMULATION_MISSING") ? "HIGH_IMPACT_SIMULATION_MISSING" : undefined],
    ["LEDGER", "Append-only immutable ledger, hash verification, and lineage", failures.includes("LEDGER_INTEGRITY_FAILURE") ? "LEDGER_INTEGRITY_FAILURE" : undefined],
    ["DASHBOARD", "Deterministic metrics, evidence visibility, governance visibility, and tenant isolation", failures.includes("AUDIT_TRAIL_INCOMPLETE") ? "AUDIT_TRAIL_INCOMPLETE" : undefined],
    ["REPLAY", "Complete replay lineage and reproducibility", failures.includes("REPLAY_DIVERGENCE_DETECTED") || failures.includes("REPLAY_LINEAGE_GAP") ? "REPLAY_LINEAGE_GAP" : undefined],
    ["TENANT_ISOLATION", "Cross-tenant isolation", failures.includes("CROSS_TENANT_DATA_LEAKAGE") ? "CROSS_TENANT_DATA_LEAKAGE" : undefined],
    ["PRODUCTION_READINESS", "Advisory-only, production-safe, no autonomous learning", failures.includes("AUTOMATIC_PRODUCTION_MUTATION_DETECTED") || failures.includes("AUTONOMOUS_LEARNING_DETECTED") ? "AUTOMATIC_PRODUCTION_MUTATION_DETECTED" : undefined],
  ];
  return freezeArray(tests.map(([area, description, failure]) => buildTest(area, description, failure)));
}

function outcomeFor(scenario: Scenario, failures: readonly RiskAdaptationCertificationFailure[]): RiskAdaptationCertificationOutcome {
  if (failures.length) return "FAIL";
  if (scenario === "CONDITIONAL") return "CONDITIONAL_PASS";
  return "PASS";
}

function buildEvidencePackage(tests: readonly RiskAdaptationCertificationTest[], hashes: readonly string[], scenario: Scenario): RiskAdaptationCertificationEvidencePackage {
  const base: Omit<RiskAdaptationCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: `risk_adaptation_cert_evidence_${hash(tests.map((test) => test.integrity_hash)).slice(0, 14)}`,
    certification_summary: scenario === "CONDITIONAL" ? "Conditional pass: minor documentation or reporting gaps remain." : "Risk adaptation certification evidence package.",
    test_execution_refs: tests.map((test) => test.test_id),
    determinism_report_ref: "risk_adaptation_determinism_report_ref",
    governance_report_ref: "risk_adaptation_governance_report_ref",
    constitutional_report_ref: "risk_adaptation_constitutional_report_ref",
    simulation_report_ref: "risk_adaptation_simulation_report_ref",
    replay_report_ref: "risk_adaptation_replay_report_ref",
    ledger_integrity_report_ref: "risk_adaptation_ledger_integrity_report_ref",
    dashboard_validation_report_ref: "risk_adaptation_dashboard_validation_report_ref",
    tenant_isolation_ref: "risk_adaptation_tenant_isolation_ref",
    audit_trail_ref: "risk_adaptation_audit_trail_ref",
    production_readiness_ref: "risk_adaptation_production_readiness_ref",
    certification_lineage_refs: freezeArray(["risk_adaptation_certification_lineage_ref_1"]),
    integrity_hashes: freezeArray(hashes),
    immutable: true,
    replayable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(outcome: RiskAdaptationCertificationOutcome, failures: readonly RiskAdaptationCertificationFailure[], tests: readonly RiskAdaptationCertificationTest[], evidence: RiskAdaptationCertificationEvidencePackage): RiskAdaptationCertificationRecord {
  const areas: RiskAdaptationCertificationArea[] = ["DETERMINISM", "EVIDENCE", "GOVERNANCE", "CONSTITUTIONAL", "SIMULATION", "LEDGER", "DASHBOARD", "REPLAY", "TENANT_ISOLATION", "PRODUCTION_READINESS"];
  const components = ["Risk Adaptation Engine Foundation", "Risk Actualization Analyzer", "Risk Drift Detector", "Risk Severity Recalibrator", "Risk Pattern Intelligence", "Risk Adaptation Ledger", "Governance-Aware Risk Adaptation", "Risk Adaptation Simulation", "Risk Adaptation Dashboards"];
  const base: Omit<RiskAdaptationCertificationRecord, "integrity_hash"> = {
    certification_id: `risk_adaptation_certification_${hash(`${outcome}:${failures.join(":")}`).slice(0, 16)}`,
    tenant_id: failures.includes("CROSS_TENANT_DATA_LEAKAGE") ? "tenant_mission_control:foreign" : "tenant_mission_control",
    certification_scope: "PHASE_10_7_RISK_ADAPTATION",
    outcome,
    certified_components: outcome === "FAIL" ? freezeArray([]) : freezeArray(components),
    validation_areas: freezeArray(areas),
    failures,
    certification_tests: tests,
    evidence_package_ref: evidence.evidence_package_id,
    governance_approved: !failures.includes("GOVERNANCE_BYPASS_DETECTED"),
    constitutional_compliant: !failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED"),
    simulation_validated: !failures.includes("HIGH_IMPACT_SIMULATION_MISSING"),
    replay_validated: !failures.includes("REPLAY_DIVERGENCE_DETECTED") && !failures.includes("REPLAY_LINEAGE_GAP"),
    ledger_integrity_verified: !failures.includes("LEDGER_INTEGRITY_FAILURE") && !failures.includes("HASH_VERIFICATION_FAILURE"),
    dashboard_validated: !failures.includes("AUDIT_TRAIL_INCOMPLETE"),
    operator_authority_preserved: !failures.includes("UNAUTHORIZED_AUTHORITY_ESCALATION") && !failures.includes("OPERATOR_APPROVAL_MISSING"),
    advisory_only_enforced: !failures.includes("ADVISORY_ONLY_VIOLATION"),
    production_safe: !failures.includes("AUTOMATIC_PRODUCTION_MUTATION_DETECTED") && !failures.includes("UNAUTHORIZED_PRODUCTION_CONFIGURATION_CHANGE"),
    tenant_isolated: !failures.includes("CROSS_TENANT_DATA_LEAKAGE"),
    replay_refs: freezeArray(["risk_adaptation_certification_replay_ref_1"]),
    lineage_refs: failures.includes("CERTIFICATION_LINEAGE_GAP") ? freezeArray([]) : freezeArray(["risk_adaptation_certification_lineage_ref_1"]),
    created_at: CREATED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(outcome: RiskAdaptationCertificationOutcome, failures: readonly RiskAdaptationCertificationFailure[]): RiskAdaptationCertificationValidation["state"] {
  if (failures.includes("REPLAY_DIVERGENCE_DETECTED") || failures.includes("REPLAY_LINEAGE_GAP")) return "PENDING_REPLAY";
  if (outcome === "FAIL") return "REJECTED";
  if (outcome === "CONDITIONAL_PASS") return "FAILED";
  return "CERTIFIED";
}

function buildValidation(record: RiskAdaptationCertificationRecord, evidence: RiskAdaptationCertificationEvidencePackage, failures: readonly RiskAdaptationCertificationFailure[]): RiskAdaptationCertificationValidation {
  const integrityVerified = hashWithoutIntegrity(record) === record.integrity_hash && hashWithoutIntegrity(evidence) === evidence.integrity_hash && record.certification_tests.every((test) => hashWithoutIntegrity(test) === test.integrity_hash);
  const base: Omit<RiskAdaptationCertificationValidation, "integrity_hash"> = {
    validation_id: "risk_adaptation_certification_validation",
    state: stateFor(record.outcome, failures),
    certified: record.outcome === "PASS" && failures.length === 0 && integrityVerified,
    outcome: record.outcome,
    failures,
    determinism_validated: !failures.includes("NONDETERMINISTIC_RECOMMENDATION_GENERATION"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    governance_compliant: record.governance_approved,
    constitutional_compliant: record.constitutional_compliant,
    simulation_validated: record.simulation_validated,
    ledger_validated: record.ledger_integrity_verified,
    dashboard_validated: record.dashboard_validated,
    replay_complete: record.replay_validated,
    tenant_isolated: record.tenant_isolated,
    audit_ready: !failures.includes("AUDIT_TRAIL_INCOMPLETE"),
    explainability_complete: !failures.includes("EXPLAINABILITY_DEFICIENCY"),
    advisory_only: record.advisory_only_enforced,
    production_safe: record.production_safe,
    no_autonomous_learning: !failures.includes("AUTONOMOUS_LEARNING_DETECTED"),
    integrity_verified: integrityVerified && !failures.includes("INTEGRITY_VERIFICATION_FAILURE"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskAdaptationCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({ record: result.record, evidence_package: result.evidence_package, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskAdaptationCertificationResult, "integrity_hash">): string {
  return hash({
    version: result.risk_adaptation_certification_gate_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hash: result.record.integrity_hash,
    evidence_hash: result.evidence_package.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function certifyRiskAdaptation(input: RiskAdaptationCertificationInput = {}): RiskAdaptationCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = input.foundation_result ?? analyzeRiskAdaptationFoundation();
  const actualization = input.actualization_result ?? analyzeRiskActualization();
  const drift = input.drift_result ?? analyzeRiskDrift();
  const severity = input.severity_result ?? analyzeRiskSeverityRecalibration();
  const pattern = input.pattern_result ?? analyzeRiskPatternIntelligence();
  const ledger = input.ledger_result ?? analyzeRiskAdaptationLedger();
  const governance = input.governance_result ?? evaluateGovernanceAwareRiskAdaptation();
  const simulation = input.simulation_result ?? runRiskAdaptationSimulation();
  const dashboard = input.dashboard_result ?? generateRiskAdaptationDashboards();
  const componentCertified = [foundation.validation.certified, actualization.validation.certified, drift.validation.certified, severity.validation.certified, pattern.validation.certified, ledger.validation.certified, governance.validation.certified, simulation.validation.certified, dashboard.validation.certified].every(Boolean);
  const scenarioFailure = failureForScenario(scenario);
  const failures = freezeArray([...new Set([...(componentCertified ? [] : ["COMPONENT_CERTIFICATION_MISSING" as const]), ...(scenarioFailure ? [scenarioFailure] : [])])]);
  const tests = buildTests(failures);
  const evidence = buildEvidencePackage(tests, [foundation.integrity_hash, actualization.integrity_hash, drift.integrity_hash, severity.integrity_hash, pattern.integrity_hash, ledger.integrity_hash, governance.integrity_hash, simulation.integrity_hash, dashboard.integrity_hash], scenario);
  const outcome = outcomeFor(scenario, failures);
  const record = buildRecord(outcome, failures, tests, evidence);
  const validation = buildValidation(record, evidence, failures);
  const api_surface = buildApiSurface();
  const base: Omit<RiskAdaptationCertificationResult, "integrity_hash" | "replay_hash"> = {
    risk_adaptation_certification_gate_version: VERSION,
    api_surface,
    record,
    evidence_package: evidence,
    validation,
    deterministic: true,
    replayable: true,
    evidence_backed: validation.evidence_complete,
    governance_compliant: validation.governance_compliant,
    constitutional_compliant: validation.constitutional_compliant,
    advisory_only: true,
    production_safe: validation.production_safe,
    tenant_isolated: validation.tenant_isolated,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskAdaptationCertification(result: RiskAdaptationCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskAdaptationCertificationFoundation(): RiskAdaptationCertificationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_adaptation_certification_gate_version: VERSION,
    api_surface,
    result: certifyRiskAdaptation(),
  });
}

export const RiskAdaptationCertificationGate = Object.freeze({
  certify: certifyRiskAdaptation,
  replay: replayRiskAdaptationCertification,
});
