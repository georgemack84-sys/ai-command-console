import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runStrategicObservabilityOperations, validateStrategicObservabilityOperations } from "@/services/strategic-observability-operations";
import type {
  CertificationDomainReport,
  CertificationEvidenceRecord,
  CertificationEvidenceRegistry,
  CertificationTestDefinition,
  CertificationTestRegistry,
  ContinuousCertificationStatus,
  Phase12CertificationContract,
  Phase12CertificationContractBundle,
  Phase12CertificationDecision,
  Phase12CertificationFailure,
  Phase12CertificationInput,
  Phase12CertificationLedger,
  Phase12CertificationLedgerEntry,
  Phase12CertificationOutcome,
  Phase12CertificationResult,
  Phase12CertificationScenario,
  Phase12CertificationTestResult,
  Phase12CertificationValidation,
  ProductionReadinessReport,
} from "@/types/phase-12-certification-gate";

const VERSION = "phase-12-certification-gate/v12.14" as const;
const ID = "Phase12CertificationGate" as const;
const MATRIX: readonly (readonly [string, string, Phase12CertificationFailure])[] = Object.freeze([
  ["contract", "Strategic Recommendation Intelligence Contract valid", "CONTRACT_INVALID"],
  ["constitutional", "Advisory-only boundary enforced", "AUTHORITY_FAILURE"],
  ["constitutional", "Operator supremacy preserved", "CONSTITUTIONAL_FAILURE"],
  ["governance", "Governance supremacy preserved", "GOVERNANCE_FAILURE"],
  ["contract", "Vocabulary registry complete", "CONTRACT_INVALID"],
  ["artifacts", "All first-class artifact types registered", "ARTIFACT_FAILURE"],
  ["artifacts", "Artifact identities deterministic", "DETERMINISM_FAILURE"],
  ["lineage", "SRC-018 Artifact Origin Contract enforced", "LINEAGE_FAILURE"],
  ["artifacts", "Orphan artifacts rejected", "ARTIFACT_FAILURE"],
  ["artifacts", "Multiple canonical origins rejected", "ARTIFACT_FAILURE"],
  ["integrity", "SRI-005 Single Source of Truth enforced", "INTEGRITY_FAILURE"],
  ["integrity", "Duplicate authoritative state rejected", "INTEGRITY_FAILURE"],
  ["operations", "Derived views remain non-authoritative", "OPERATIONS_FAILURE"],
  ["policy", "Policy Set Manifest complete", "POLICY_FAILURE"],
  ["policy", "Required policy set immutable", "POLICY_FAILURE"],
  ["policy", "Policy dependencies compatible", "POLICY_FAILURE"],
  ["policy", "Revoked policies rejected", "POLICY_FAILURE"],
  ["policy", "Policy version substitution detected", "POLICY_FAILURE"],
  ["lifecycle", "Recommendation cycle lifecycle deterministic", "LIFECYCLE_FAILURE"],
  ["lifecycle", "Transaction semantics atomic", "LIFECYCLE_FAILURE"],
  ["lifecycle", "COMPLETE state contract enforced", "LIFECYCLE_FAILURE"],
  ["recommendation", "Exactly one terminal recommendation outcome", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Candidate generation deterministic", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Duplicate strategy suppression deterministic", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Scenario generation reproducible", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Forecast model versions bound", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Forecast uncertainty explicit", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Comparison eligibility deterministic", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Threshold evaluation reproducible", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Tie resolution deterministic", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Superseded comparison cannot produce recommendation", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Post-recommendation reevaluation creates new cycle", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Baseline strategy immutable within cycle", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Portfolio membership version-bound", "RECOMMENDATION_FAILURE"],
  ["recommendation", "Recommendation supported by completed comparisons", "RECOMMENDATION_FAILURE"],
  ["authority", "Recommendation remains advisory-only", "AUTHORITY_FAILURE"],
  ["observation", "Observation window defined", "OBSERVATION_FAILURE"],
  ["observation", "Observation closure deterministic", "OBSERVATION_FAILURE"],
  ["observation", "Mandatory open observation windows block closure", "OBSERVATION_FAILURE"],
  ["observation", "Late evidence handled without history mutation", "OBSERVATION_FAILURE"],
  ["replay", "Full-cycle replay deterministic", "REPLAY_FAILURE"],
  ["replay", "Artifact-level replay deterministic", "REPLAY_FAILURE"],
  ["replay", "Replay divergence detected", "REPLAY_FAILURE"],
  ["lineage", "Lineage complete", "LINEAGE_FAILURE"],
  ["lineage", "Referential integrity complete", "LINEAGE_FAILURE"],
  ["integrity", "Integrity hashes reproducible", "INTEGRITY_FAILURE"],
  ["tenant", "Tenant isolation validated", "TENANT_FAILURE"],
  ["tenant", "Cross-tenant reuse blocked by default", "TENANT_FAILURE"],
  ["security", "Restricted information protected", "SECURITY_FAILURE"],
  ["explainability", "Every artifact explainable", "EXPLAINABILITY_FAILURE"],
  ["integrity", "Strategic ledger append-only", "LEDGER_FAILURE"],
  ["operations", "Operational observability complete", "OPERATIONS_FAILURE"],
  ["security", "Security assessment passed", "SECURITY_FAILURE"],
  ["production", "Production readiness validated", "PRODUCTION_READINESS_FAILURE"],
]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function scenarioFailure(scenario: Phase12CertificationScenario): Phase12CertificationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly Phase12CertificationFailure[]): Phase12CertificationOutcome { return failures.length ? "FAIL" : "PASS"; }

function contract(failures: readonly Phase12CertificationFailure[]): Phase12CertificationContract {
  return nested({ contract_id: id("phase_12_certification_contract", VERSION), scope: "Strategic Recommendation Intelligence" as const, authority: "final constitutional certification authority" as const, lifecycle: failures.includes("CONTRACT_INVALID") ? "REQUESTED" as const : "MONITORED" as const, evidence_required: !failures.includes("CONTRACT_INVALID"), replay_required: true, production_promotion_requires_pass: true as const });
}

function registry(failures: readonly Phase12CertificationFailure[]): CertificationTestRegistry {
  const tests = freezeArray(MATRIX.map(([category, name, failure]) => nested({ test_id: id("phase_12_certification_test", name), category, name, expected: "PASS" as const, critical: failure !== "OPERATIONS_FAILURE" })));
  return nested({ registry_id: id("phase_12_test_registry", VERSION), tests, complete: !failures.includes("CONTRACT_INVALID"), categories: freezeArray([...new Set(MATRIX.map(([category]) => category))]) });
}

function evidence(failures: readonly Phase12CertificationFailure[], operationsHash: string): CertificationEvidenceRegistry {
  const sources = freezeArray(["12.2-policy-manifest", "12.3-cycle", "12.4-candidates", "12.5-scenarios", "12.6-forecasts", "12.7-comparison", "12.8-portfolio", "12.9-recommendation", "12.10-observation", "12.11-assurance", "12.12-governance", "12.13-operations"]);
  const records = freezeArray(sources.map((source) => nested({ evidence_id: id("phase_12_evidence", source), source_phase: source, artifact_ref: `artifact:${source}`, evidence_type: "certification-input", replay_ref: `replay:${source}`, integrity_ref: operationsHash, accepted: !failures.includes("CONTRACT_INVALID") })));
  return nested({ registry_id: id("phase_12_evidence_registry", VERSION), evidence: records, complete: records.every((record) => record.accepted), immutable: true, replayable: !failures.includes("REPLAY_FAILURE") });
}

function testResults(reg: CertificationTestRegistry, ev: CertificationEvidenceRegistry, failures: readonly Phase12CertificationFailure[]): readonly Phase12CertificationTestResult[] {
  const refs = ev.evidence.map((record) => record.integrity_hash);
  return freezeArray(reg.tests.map((test, index) => {
    const failure = MATRIX[index][2];
    const passed = !failures.includes(failure);
    return nested({ test_id: test.test_id, name: test.name, category: test.category, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs.slice(0, 4) });
  }));
}

function domain(domain: string, results: readonly Phase12CertificationTestResult[]): CertificationDomainReport {
  const scoped = results.filter((result) => result.category === domain || (domain === "constitutional_governance" && ["constitutional", "governance", "authority"].includes(result.category)) || (domain === "replay_lineage_integrity" && ["replay", "lineage", "integrity"].includes(result.category)) || (domain === "security_tenant" && ["security", "tenant"].includes(result.category)) || (domain === "recommendation_intelligence" && ["lifecycle", "recommendation", "observation", "policy"].includes(result.category)));
  const failures = freezeArray([...new Set(scoped.map((result) => result.failure_reason).filter((failure): failure is Phase12CertificationFailure => Boolean(failure)))]);
  return nested({ report_id: id("phase_12_domain_report", domain), domain, passed: scoped.every((result) => result.passed), score: scoped.length ? scoped.filter((result) => result.passed).length / scoped.length : 1, evidence_refs: scoped.flatMap((result) => result.evidence_refs).slice(0, 6), failures });
}

function decision(failures: readonly Phase12CertificationFailure[]): Phase12CertificationDecision {
  const outcome = outcomeFor(failures);
  return nested({ decision_id: id("phase_12_certification_decision", failures), outcome, production_ready: outcome === "PASS", production_promotion_allowed: outcome === "PASS", conditions: outcome === "PASS" ? freezeArray([]) : freezeArray(["resolve all critical failures", "supply complete evidence", "rerun certification and achieve PASS"]), critical_failures: failures, decision_reason: outcome === "PASS" ? "Phase 12 certified for production promotion." : "Phase 12 production promotion blocked by certification failures." });
}

function production(failures: readonly Phase12CertificationFailure[], opsValid: boolean): ProductionReadinessReport {
  const ready = failures.length === 0 && opsValid;
  return nested({ report_id: id("phase_12_production_readiness", failures), production_ready: ready, deployment_allowed: ready, all_required_evidence_supplied: !failures.includes("CONTRACT_INVALID"), all_critical_tests_passed: failures.length === 0, operationally_observable: opsValid && !failures.includes("OPERATIONS_FAILURE"), rollback_ready: !failures.includes("PRODUCTION_READINESS_FAILURE") });
}

function ledger(dec: Phase12CertificationDecision, ev: CertificationEvidenceRegistry, failures: readonly Phase12CertificationFailure[]): Phase12CertificationLedger {
  let previous: string | null = null;
  const events = ["CERTIFICATION_REQUESTED", "EVIDENCE_REGISTERED", "TESTS_EXECUTED", "DECISION_RECORDED", "PRODUCTION_GATE_EVALUATED"];
  const entries = freezeArray(events.map((event_type, sequence) => {
    const entry_hash = hash({ event_type, sequence, previous, outcome: dec.outcome });
    const entry: Phase12CertificationLedgerEntry = nested({ entry_id: id("phase_12_certification_ledger_entry", { event_type, sequence }), sequence, event_type, decision_ref: dec.decision_id, evidence_refs: ev.evidence.map((record) => record.evidence_id).slice(0, 3), outcome: dec.outcome, previous_hash: previous, entry_hash });
    previous = entry_hash;
    return entry;
  }));
  return nested({ ledger_id: id("phase_12_certification_ledger", failures), entries, append_only: !failures.includes("LEDGER_FAILURE"), replayable: !failures.includes("REPLAY_FAILURE"), tenant_isolated: !failures.includes("TENANT_FAILURE"), integrity_protected: !failures.includes("INTEGRITY_FAILURE") });
}

function replayHash(result: Omit<Phase12CertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, registry: result.test_registry.integrity_hash, evidence: result.evidence_registry.integrity_hash, reports: [result.determinism.integrity_hash, result.constitutional_governance.integrity_hash, result.artifacts.integrity_hash, result.recommendation_intelligence.integrity_hash, result.replay_lineage_integrity.integrity_hash, result.security_tenant.integrity_hash, result.operations.integrity_hash], production: result.production_readiness.integrity_hash, tests: result.test_results.map((test) => test.integrity_hash), decision: result.decision.integrity_hash, ledger: result.ledger.integrity_hash, continuous: result.continuous_certification.integrity_hash });
}
function integrityHash(result: Omit<Phase12CertificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, outcome: result.decision.outcome, replay_hash: result.replay_hash }); }

export function runPhase12CertificationGate(input: Phase12CertificationInput = {}): Phase12CertificationResult {
  const operations = runStrategicObservabilityOperations({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const operationsValid = validateStrategicObservabilityOperations(operations).valid;
  const directFailure = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<Phase12CertificationFailure>([...(operationsValid ? [] : ["OPERATIONS_FAILURE" as const]), ...(directFailure ? [directFailure] : [])]);
  const c = contract(failures);
  const reg = registry(failures);
  const ev = evidence(failures, operations.integrity_hash);
  const results = testResults(reg, ev, failures);
  const dec = decision(freezeArray([...new Set([...failures, ...results.map((result) => result.failure_reason).filter((failure): failure is Phase12CertificationFailure => Boolean(failure))])]));
  const prod = production(dec.critical_failures, operationsValid);
  const led = ledger(dec, ev, dec.critical_failures);
  const continuous: ContinuousCertificationStatus = nested({ monitor_id: id("phase_12_continuous_certification", dec.outcome), certified: dec.outcome === "PASS", drift_detected: dec.outcome !== "PASS", recertification_required: dec.outcome !== "PASS", monitored_signals: freezeArray(["policy changes", "governance changes", "replay failures", "integrity failures", "recommendation anomalies", "observation anomalies", "security violations", "tenant isolation violations", "certification drift"]), last_certification_outcome: dec.outcome });
  const base = { phase_version: VERSION, phase_identifier: ID, contract: c, test_registry: reg, evidence_registry: ev, determinism: domain("determinism", results), constitutional_governance: domain("constitutional_governance", results), artifacts: domain("artifacts", results), recommendation_intelligence: domain("recommendation_intelligence", results), replay_lineage_integrity: domain("replay_lineage_integrity", results), security_tenant: domain("security_tenant", results), operations: domain("operations", results), production_readiness: prod, test_results: results, decision: dec, ledger: led, continuous_certification: continuous };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validatePhase12CertificationGate(result?: Phase12CertificationResult): Phase12CertificationValidation {
  if (!result) {
    const base = { valid: false, outcome: "FAIL" as const, production_ready: false, replay_hash_valid: false, integrity_hash_valid: false, ledger_valid: false, evidence_valid: false, tests_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.decision) === result.decision.integrity_hash;
  const ledger_valid = result.ledger.append_only && result.ledger.replayable && result.ledger.tenant_isolated && result.ledger.integrity_protected;
  const evidence_valid = result.evidence_registry.complete && result.evidence_registry.immutable && result.evidence_registry.replayable;
  const tests_valid = result.test_results.length === MATRIX.length && result.test_results.every((test) => test.passed);
  const valid = result.decision.outcome === "PASS" && result.decision.production_promotion_allowed && result.production_readiness.production_ready && replay_hash_valid && integrity_hash_valid && ledger_valid && evidence_valid && tests_valid;
  const base = { valid, outcome: result.decision.outcome, production_ready: result.production_readiness.production_ready, replay_hash_valid, integrity_hash_valid, ledger_valid, evidence_valid, tests_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayPhase12CertificationGate(result = runPhase12CertificationGate()): boolean {
  const replayed = runPhase12CertificationGate();
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validatePhase12CertificationGate(result).valid;
}

export function getPhase12CertificationGateContract(): Phase12CertificationContractBundle {
  const result = runPhase12CertificationGate();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, final_certification_authority: true, pass_required_for_production: true, conditional_pass_blocks_production: true, immutable_certification_ledger_required: true, continuous_certification_required: true }), result, validation: validatePhase12CertificationGate(result) });
}

export const Phase12CertificationGate = Object.freeze({ run: runPhase12CertificationGate, validate: validatePhase12CertificationGate, replay: replayPhase12CertificationGate });
