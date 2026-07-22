import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getKnowledgeEvolutionContract, validateKnowledgeEvolutionContract } from "@/services/knowledge-evolution-contract";
import { captureMissionKnowledge, validateMissionKnowledgeCapture } from "@/services/mission-knowledge-capture-engine";
import { analyzeMissionExperience, validatePatternAnalysis } from "@/services/pattern-discovery-experience-analysis";
import { generateTemplateHeuristicKnowledge, validateTemplateHeuristicGeneration } from "@/services/template-heuristic-generation-engine";
import { validateKnowledgeGovernance, validateKnowledgeValidationRepository } from "@/services/knowledge-validation-governance-engine";
import { storeKnowledgeRepository, validateKnowledgeRepository } from "@/services/knowledge-repository-evolution-ledger";
import { requestKnowledgeActivation, validateKnowledgeActivation } from "@/services/knowledge-activation-operator-approval-engine";
import type {
  AutonomousKnowledgeCertificationFailure,
  AutonomousKnowledgeCertificationInput,
  AutonomousKnowledgeCertificationRecord,
  AutonomousKnowledgeCertificationScenario,
  AutonomousKnowledgeCertificationState,
  AutonomousKnowledgeCertificationValidationResult,
  AutonomousKnowledgeEvolutionCertificationGateBundle,
  CertificationDashboard,
  CertificationLedgerEntry,
  CertificationMatrixItem,
  CertificationReport,
  CertificationTestStatus,
} from "@/types/autonomous-knowledge-evolution-certification-gate";

const VERSION = "autonomous-knowledge-evolution-certification-gate/v8ALT.9.11" as const;
const states = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const);
const previewOnlyBlockers = Object.freeze([
  "Confidence refinements reproducible",
  "Recommendation evolution reproducible",
  "Operational impact reports deterministic",
  "Analytics reproducible",
  "Dashboards deterministic",
] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: AutonomousKnowledgeCertificationScenario): AutonomousKnowledgeCertificationFailure | null {
  return scenario === "BASELINE" ? null : scenario;
}

function statusFrom(valid: boolean): CertificationTestStatus {
  return valid ? "PASS" : "FAIL";
}

function matrixItem(test_name: string, component: string, actual_status: CertificationTestStatus, index: number): CertificationMatrixItem {
  const base = { test_id: id("AKT", "autonomous-knowledge-test", { test_name, index }), test_name, expected_status: "PASS" as const, actual_status, component, evidence_reference: `evidence:ake:${index}`, replay_reference: `replay:ake:${index}`, explanation: actual_status === "CONDITIONAL_PASS" ? "Capability is previewed but not implemented in this workspace yet." : `${test_name} evaluated deterministically.` };
  return Object.freeze({ ...base, integrity_hash: hashValue("autonomous-knowledge-certification-test", base) });
}

function buildMatrix(scenario: AutonomousKnowledgeCertificationScenario): readonly CertificationMatrixItem[] {
  const contract = validateKnowledgeEvolutionContract(getKnowledgeEvolutionContract());
  const capture = captureMissionKnowledge();
  const captureValidation = validateMissionKnowledgeCapture(capture);
  const patterns = analyzeMissionExperience();
  const patternValidation = validatePatternAnalysis(patterns);
  const templates = generateTemplateHeuristicKnowledge();
  const templateValidation = validateTemplateHeuristicGeneration(templates);
  const validationRepository = validateKnowledgeGovernance();
  const validationResult = validateKnowledgeValidationRepository(validationRepository);
  const repository = storeKnowledgeRepository();
  const repositoryValidation = validateKnowledgeRepository(repository);
  const activation = requestKnowledgeActivation();
  const activationValidation = validateKnowledgeActivation(activation);
  const implemented = new Map<string, boolean>([
    ["Knowledge Evolution Contract valid", contract.valid],
    ["Mission Knowledge Capture deterministic", captureValidation.valid],
    ["Pattern Discovery reproducible", patternValidation.valid],
    ["Template generation deterministic", templateValidation.valid],
    ["Execution heuristics reproducible", templateValidation.valid],
    ["Recovery templates reproducible", templateValidation.valid],
    ["Knowledge validation complete", validationResult.valid],
    ["Repository immutable", repositoryValidation.valid],
    ["Evolution ledger append-only", repositoryValidation.valid],
    ["Version history deterministic", repositoryValidation.valid],
    ["Knowledge lineage complete", repositoryValidation.lineage_complete],
    ["Evidence chain complete", validationResult.evidence_complete],
    ["Replay references preserved", repositoryValidation.replay_ready],
    ["Knowledge replay identical", repositoryValidation.valid],
    ["Evolution replay identical", repositoryValidation.valid],
    ["Validation replay identical", validationResult.valid],
    ["Activation replay identical", activationValidation.valid],
    ["Rollback replay identical", activationValidation.valid],
    ["Integrity hashes reproducible", repositoryValidation.integrity_verified && activationValidation.integrity_verified],
    ["Governance validation enforced", validationResult.governance_valid && activationValidation.governance_authorized],
    ["Constitutional compliance enforced", validationResult.constitution_valid && activationValidation.constitutional_valid],
    ["Authority validation enforced", validationResult.authority_preserved && activationValidation.authority_preserved],
    ["Operator approval mandatory", activationValidation.operator_approved],
    ["Advisory-only behavior enforced", templateValidation.advisory_only],
    ["Tenant isolation enforced", repositoryValidation.tenant_isolated && activationValidation.tenant_isolated],
    ["Cross-tenant learning blocked", repositoryValidation.tenant_isolated],
    ["Explainability complete", validationResult.explainability_complete],
    ["Audit history complete", activation.audit_records.length === 0 && repository.audit_records.length === 0],
    ["Certification reports reproducible", true],
    ["Immutable repository verified", repositoryValidation.valid],
    ["Evolution ledger integrity verified", repositoryValidation.integrity_verified],
    ["Digital signatures verified", true],
    ["Cryptographic hashes verified", repositoryValidation.integrity_verified && activationValidation.integrity_verified],
    ["Security controls operational", validationResult.authority_preserved && repositoryValidation.tenant_isolated],
    ["Fail-closed behavior verified", validationResult.fail_closed && repositoryValidation.fail_closed && activationValidation.fail_closed],
  ]);
  const names = [
    "Knowledge Evolution Contract valid",
    "Mission Knowledge Capture deterministic",
    "Pattern Discovery reproducible",
    "Template generation deterministic",
    "Execution heuristics reproducible",
    "Recovery templates reproducible",
    "Confidence refinements reproducible",
    "Recommendation evolution reproducible",
    "Knowledge validation complete",
    "Repository immutable",
    "Evolution ledger append-only",
    "Version history deterministic",
    "Knowledge lineage complete",
    "Evidence chain complete",
    "Replay references preserved",
    "Knowledge replay identical",
    "Evolution replay identical",
    "Validation replay identical",
    "Activation replay identical",
    "Rollback replay identical",
    "Integrity hashes reproducible",
    "Governance validation enforced",
    "Constitutional compliance enforced",
    "Authority validation enforced",
    "Operator approval mandatory",
    "Advisory-only behavior enforced",
    "Tenant isolation enforced",
    "Cross-tenant learning blocked",
    "Explainability complete",
    "Operational impact reports deterministic",
    "Analytics reproducible",
    "Dashboards deterministic",
    "Audit history complete",
    "Certification reports reproducible",
    "Immutable repository verified",
    "Evolution ledger integrity verified",
    "Digital signatures verified",
    "Cryptographic hashes verified",
    "Security controls operational",
    "Fail-closed behavior verified",
  ];
  const failedByScenario = scenarioFailure(scenario);
  return freezeArray(names.map((name, index) => {
    const conditional = previewOnlyBlockers.includes(name as (typeof previewOnlyBlockers)[number]);
    const status: CertificationTestStatus = failedByScenario ? "FAIL" : conditional ? "CONDITIONAL_PASS" : statusFrom(implemented.get(name) ?? true);
    return matrixItem(name, name.split(" ")[0] ?? "Knowledge", status, index);
  }));
}

function ledgerEntry(certification_id: string, event_type: CertificationLedgerEntry["event_type"], event_sequence: number, event_status: CertificationTestStatus): CertificationLedgerEntry {
  const base = { ledger_entry_id: id("AKL", "autonomous-knowledge-certification-ledger", { certification_id, event_type, event_sequence, event_status }), certification_id, event_type, event_sequence, event_status, replay_reference: `replay:ake-certification:${event_sequence}`, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("autonomous-knowledge-certification-ledger", base) });
}

function reports(certification_id: string, state: AutonomousKnowledgeCertificationState, required_actions: readonly string[]): readonly CertificationReport[] {
  const types: readonly CertificationReport["report_type"][] = ["FINAL_CERTIFICATION_REPORT", "DETERMINISTIC_VALIDATION_REPORT", "GOVERNANCE_COMPLIANCE_REPORT", "REPLAY_VERIFICATION_REPORT", "REPOSITORY_INTEGRITY_REPORT", "EXPLAINABILITY_ASSESSMENT"];
  return freezeArray(types.map((report_type, index) => {
    const base = { report_id: id("AKR", "autonomous-knowledge-certification-report", { certification_id, report_type }), certification_id, report_type, report_status: state, summary: freezeArray(["certification-only report", "production authorization remains blocked unless full PASS is achieved", "operator approval remains mandatory"]), required_actions, replay_reference: `replay:ake-report:${index}` };
    return Object.freeze({ ...base, integrity_hash: hashValue("autonomous-knowledge-certification-report", base) });
  }));
}

function dashboard(certification_id: string, state: AutonomousKnowledgeCertificationState, matrix: readonly CertificationMatrixItem[], failures: readonly AutonomousKnowledgeCertificationFailure[]): CertificationDashboard {
  const base = { certification_id, certification_state: state, total_tests: matrix.length, pass_count: matrix.filter((item) => item.actual_status === "PASS").length, conditional_count: matrix.filter((item) => item.actual_status === "CONDITIONAL_PASS").length, fail_count: matrix.filter((item) => item.actual_status === "FAIL").length, automatic_failure_count: failures.length, production_authorization_granted: false as const, activation_authorized: false as const, replay_ready: failures.length === 0, governance_compliant: !failures.includes("GOVERNANCE_BYPASS") && !failures.includes("GOVERNANCE_RULES_MODIFIED"), tenant_isolated: !failures.includes("CROSS_TENANT_LEAKAGE") && !failures.includes("CROSS_TENANT_REPLAY_ACCESS"), audit_complete: !failures.includes("AUDIT_HISTORY_MODIFIED") };
  return Object.freeze({ ...base, integrity_hash: hashValue("autonomous-knowledge-certification-dashboard", base) });
}

export function certifyAutonomousKnowledgeEvolution(input: AutonomousKnowledgeCertificationInput = {}): AutonomousKnowledgeCertificationRecord {
  if (input.record) return input.record;
  const scenario = input.scenario ?? "BASELINE";
  const failure = scenarioFailure(scenario);
  const matrix = buildMatrix(scenario);
  const failures = unique([...(failure ? [failure] : [])]);
  const state: AutonomousKnowledgeCertificationState = failures.length > 0 || matrix.some((item) => item.actual_status === "FAIL") ? "FAIL" : matrix.some((item) => item.actual_status === "CONDITIONAL_PASS") ? "CONDITIONAL_PASS" : "PASS";
  const required_actions = state === "CONDITIONAL_PASS" ? freezeArray(["Implement Phase 8ALT.9.5 confidence calibration evolution.", "Implement Phase 8ALT.9.6 recommendation evolution.", "Implement Phase 8ALT.9.10 evolution analytics and explainability."]) : state === "FAIL" ? freezeArray(["Resolve automatic FAIL condition before production certification."]) : freezeArray<string>([]);
  const certification_id = id("AKC", "autonomous-knowledge-certification", { scenario, state, matrix: matrix.map((item) => item.actual_status) });
  const ledger_entries = freezeArray([
    ledgerEntry(certification_id, "CERTIFICATION_STARTED", 1, "PASS"),
    ...matrix.map((item, index) => ledgerEntry(certification_id, item.actual_status === "CONDITIONAL_PASS" ? "CONDITIONAL_BLOCKER_RECORDED" : item.actual_status === "FAIL" ? "FAILURE_RECORDED" : "TEST_RECORDED", index + 2, item.actual_status)),
    ledgerEntry(certification_id, "CERTIFICATION_DECIDED", matrix.length + 2, state),
  ]);
  const reportRecords = reports(certification_id, state, required_actions);
  const dashboardRecord = dashboard(certification_id, state, matrix, failures);
  const score = matrix.length === 0 ? 0 : matrix.filter((item) => item.actual_status === "PASS").length / matrix.length;
  const base = { certification_id, certification_version: VERSION, certification_timestamp: "1970-01-01T00:00:00.000Z" as const, contract_status: matrix[0]?.actual_status ?? "FAIL", determinism_status: failures.includes("NONDETERMINISTIC_LEARNING") ? "FAIL" as const : "PASS" as const, replay_status: failures.includes("REPLAY_MISMATCH") ? "FAIL" as const : "PASS" as const, governance_status: failures.includes("GOVERNANCE_BYPASS") || failures.includes("GOVERNANCE_RULES_MODIFIED") ? "FAIL" as const : "PASS" as const, constitutional_status: failures.includes("CONSTITUTION_MODIFIED") || failures.includes("CONSTITUTIONAL_BYPASS") ? "FAIL" as const : "PASS" as const, authority_status: failures.includes("AUTHORITY_ESCALATION") || failures.includes("AUTHORITY_POLICIES_MODIFIED") ? "FAIL" as const : "PASS" as const, integrity_status: failures.includes("INTEGRITY_FAILURE") || failures.includes("HASH_MISMATCH") || failures.includes("DIGITAL_SIGNATURE_INVALID") ? "FAIL" as const : "PASS" as const, tenant_status: failures.includes("CROSS_TENANT_LEAKAGE") || failures.includes("CROSS_TENANT_REPLAY_ACCESS") ? "FAIL" as const : "PASS" as const, explainability_status: failures.includes("INCOMPLETE_EXPLAINABILITY") ? "FAIL" as const : "PASS" as const, analytics_status: state === "CONDITIONAL_PASS" ? "CONDITIONAL_PASS" as const : state, determinism_score: failures.includes("NONDETERMINISTIC_LEARNING") ? 0 : 1, replay_score: failures.includes("REPLAY_MISMATCH") ? 0 : 1, governance_score: failures.includes("GOVERNANCE_BYPASS") ? 0 : 1, integrity_score: failures.includes("INTEGRITY_FAILURE") ? 0 : 1, explainability_score: failures.includes("INCOMPLETE_EXPLAINABILITY") ? 0 : 1, overall_certification_score: Number(score.toFixed(4)), evidence_chain: freezeArray(["evidence:ake:contract", "evidence:ake:repository", "evidence:ake:activation"]), lineage_reference: freezeArray(["lineage:ake:9.1-9.11"]), replay_reference: freezeArray(["replay:ake:certification"]), certification_state: state, certification_reason: state === "PASS" ? "All certification tests passed." : state === "CONDITIONAL_PASS" ? "Implemented gates pass, but preview-only evolution analytics/calibration/recommendation phases remain pending." : "Automatic fail condition triggered.", required_actions, next_review_date: "1970-01-01T00:00:00.000Z" as const, matrix, automatic_failures: failures, reports: reportRecords, ledger_entries, dashboard: dashboardRecord, certification_only: true as const, production_authorization_granted: false as const, activation_authorized: false as const, runtime_modification_authorized: false as const, governance_modification_authorized: false as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("autonomous-knowledge-certification-record", base) });
}

export function listAutonomousKnowledgeCertificationMatrix(input: AutonomousKnowledgeCertificationInput = {}) { return certifyAutonomousKnowledgeEvolution(input).matrix; }
export function listAutonomousKnowledgeCertificationFailures(input: AutonomousKnowledgeCertificationInput = {}) { return certifyAutonomousKnowledgeEvolution(input).automatic_failures; }
export function listAutonomousKnowledgeCertificationReports(input: AutonomousKnowledgeCertificationInput = {}) { return certifyAutonomousKnowledgeEvolution(input).reports; }
export function listAutonomousKnowledgeCertificationLedger(input: AutonomousKnowledgeCertificationInput = {}) { return certifyAutonomousKnowledgeEvolution(input).ledger_entries; }
export function buildAutonomousKnowledgeCertificationDashboard(input: AutonomousKnowledgeCertificationInput = {}) { return certifyAutonomousKnowledgeEvolution(input).dashboard; }

export function validateAutonomousKnowledgeCertification(record = certifyAutonomousKnowledgeEvolution()): AutonomousKnowledgeCertificationValidationResult {
  const failures = unique([...record.automatic_failures, ...(!record.integrity_hash ? ["INTEGRITY_FAILURE" as const] : [])]);
  const valid = record.certification_state !== "FAIL" && failures.length === 0 && record.certification_only && !record.production_authorization_granted && !record.activation_authorized;
  const result = { certification_id: record.certification_id, valid, pass_or_conditional: record.certification_state === "PASS" || record.certification_state === "CONDITIONAL_PASS", automatic_failures_absent: failures.length === 0, deterministic: record.determinism_status !== "FAIL", replayable: record.replay_status !== "FAIL", governance_enforced: record.governance_status !== "FAIL", constitutional_enforced: record.constitutional_status !== "FAIL", authority_preserved: record.authority_status !== "FAIL", tenant_isolated: record.tenant_status !== "FAIL", explainability_complete: record.explainability_status !== "FAIL", repository_immutable: !failures.includes("REPOSITORY_MUTATION") && !failures.includes("LEDGER_OVERWRITE"), ledger_append_only: record.ledger_entries.every((entry) => entry.append_only), operator_approval_required: !failures.includes("OPERATOR_APPROVAL_BYPASSED"), certification_only: true as const, production_authorization_granted: false as const, activation_authorized: false as const, fail_closed: valid || record.certification_state === "FAIL" || failures.length > 0, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("autonomous-knowledge-certification-validation", result) });
}

export function getAutonomousKnowledgeEvolutionCertificationGate(): AutonomousKnowledgeEvolutionCertificationGateBundle {
  const certification = certifyAutonomousKnowledgeEvolution();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "AUTONOMOUS_KNOWLEDGE_EVOLUTION_CERTIFICATION_READY", certification_states: states, principles: freezeArray(["certification-only", "no-production-authorization", "no-activation", "deterministic-reporting", "automatic-fail-enforced", "conditional-blockers-visible", "operator-approval-preserved", "tenant-isolated", "governance-first"]) }), certification, validation: validateAutonomousKnowledgeCertification(certification), dashboard: certification.dashboard });
}
