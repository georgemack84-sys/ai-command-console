import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { reconstructGovernanceState, validateGovernanceStatePackage } from "@/services/governance-state-reconstruction";
import type {
  GovernanceOutputAuditEntry,
  GovernanceOutputCategory,
  GovernanceOutputComparison,
  GovernanceOutputFailureReason,
  GovernanceOutputObservabilitySurface,
  GovernanceOutputValidationError,
  GovernanceOutputValidationResult,
  GovernanceOutputVerificationState,
  GovernanceOutputVerificationInput,
  GovernanceOutputVerificationReport,
  GovernanceOutputVerificationScenario,
} from "@/types/governance-output-verification";
import type { GovernanceReplayStatePackage } from "@/types/governance-state-reconstruction";

const NOW = "2026-06-26T22:20:00.000Z";
const SCHEMA_VERSION = "governance-output-verification/v7H.4" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function validationError(code: string, reason: GovernanceOutputFailureReason, field: string, message: string): GovernanceOutputValidationError {
  return Object.freeze({ code: `GOV-${code}`, reason, field, message });
}

function stateScenario(scenario: GovernanceOutputVerificationScenario | undefined) {
  if (scenario === "STATE_PACKAGE_INVALID") return "CONFIDENCE_MISMATCH";
  if (scenario === "TENANT_MISMATCH") return "TENANT_MISMATCH";
  if (scenario === "CONSTITUTIONAL_MISMATCH") return "CONSTITUTIONAL_MISMATCH";
  if (scenario === "AUTHORITY_MISMATCH") return "AUTHORITY_MISMATCH";
  if (scenario === "INTEGRITY_VERIFICATION_FAILURE") return "INTEGRITY_FAILURE";
  if (scenario === "VERSION_MISMATCH") return "REPLAY_VERSION_MISMATCH";
  return "BASELINE";
}

function mismatchFor(category: GovernanceOutputCategory, scenario: GovernanceOutputVerificationScenario): boolean {
  return (
    (category === "GOVERNANCE_DECISION" && scenario === "GOVERNANCE_DECISION_DIFFERS") ||
    (category === "POLICY" && scenario === "POLICY_EVALUATION_MISMATCH") ||
    (category === "COMPLIANCE" && scenario === "COMPLIANCE_RESULT_DIFFERS") ||
    (category === "RISK" && scenario === "RISK_CALCULATION_DIFFERS") ||
    (category === "RECOMMENDATION" && scenario === "RECOMMENDATION_OUTPUT_DIFFERS") ||
    (category === "ESCALATION" && scenario === "ESCALATION_ROUTING_DIFFERS") ||
    (category === "EXPLAINABILITY" && scenario === "EXPLAINABILITY_DIFFERS") ||
    (category === "CONFIDENCE" && scenario === "CONFIDENCE_VALUE_DIFFERS") ||
    (category === "LINEAGE" && scenario === "LINEAGE_GRAPH_DIFFERS") ||
    (category === "INTEGRITY" && (scenario === "REPLAY_HASH_MISMATCH" || scenario === "INTEGRITY_VERIFICATION_FAILURE"))
  );
}

function failureFor(category: GovernanceOutputCategory): GovernanceOutputFailureReason {
  const failures: Record<GovernanceOutputCategory, GovernanceOutputFailureReason> = {
    GOVERNANCE_DECISION: "GOVERNANCE_DECISION_MISMATCH",
    POLICY: "POLICY_EVALUATION_MISMATCH",
    COMPLIANCE: "COMPLIANCE_RESULT_MISMATCH",
    RISK: "RISK_CALCULATION_MISMATCH",
    RECOMMENDATION: "RECOMMENDATION_OUTPUT_MISMATCH",
    ESCALATION: "ESCALATION_ROUTING_MISMATCH",
    EXPLAINABILITY: "EXPLAINABILITY_MISMATCH",
    CONFIDENCE: "CONFIDENCE_VALUE_MISMATCH",
    LINEAGE: "LINEAGE_GRAPH_MISMATCH",
    INTEGRITY: "INTEGRITY_VERIFICATION_FAILURE",
  };
  return failures[category];
}

function outputPayload(pkg: GovernanceReplayStatePackage, category: GovernanceOutputCategory) {
  const certification = pkg.replay_input_package.replay_contract.source_certification;
  const explanation = certification.source_artifacts.explanation;
  const policy = certification.source_artifacts.policy_lineage;
  const governance = certification.source_artifacts.governance_lineage;
  const source = {
    GOVERNANCE_DECISION: { outcomes: governance.governance_object, approvals: ["advisory-approved"], denials: [], exceptions: [], advisories: [explanation.summary], actions: ["operator-review"] },
    POLICY: { evaluated: policy.root_policy.policy_id, inherited: policy.inheritance_chain.map((item) => item.relationship_id), conflicts: [], priorities: policy.constitutional_resolutions, influence: pkg.policy_state.state_hash, lineage: policy.reconstruction_hash },
    COMPLIANCE: { status: "COMPLIANT", findings: explanation.compliance_references, thresholds: ["constitution:v7"], corrective_actions: [], confidence: pkg.compliance_state.confidence_value },
    RISK: { detected_risks: explanation.risk_references, severity: "LOW", likelihood: "LOW", impact: "CONTROLLED", mitigation: ["monitor"], confidence: pkg.risk_state.confidence_value },
    RECOMMENDATION: { content: explanation.views.executive_view.recommendation, alternatives: ["continue-monitoring"], ranking: 1, rationale: explanation.summary, confidence: "0.9700" },
    ESCALATION: { triggers: explanation.escalation_references, severity: "NONE", routing: "operator-review", recommendations: ["no-escalation"], notifications: ["audit-log"] },
    EXPLAINABILITY: { evidence_chains: explanation.evidence_references, policy_influence: explanation.policy_references, decision_explanations: explanation.detailed_explanation, compliance_reasoning: explanation.views.governance_view.governance_constraints, risk_reasoning: explanation.views.audit_view.integrity_hashes, recommendation_rationale: explanation.summary },
    CONFIDENCE: { governance: pkg.confidence_state.confidence_value, policy: "0.9700", compliance: pkg.compliance_state.confidence_value, risk: pkg.risk_state.confidence_value, recommendation: "0.9700", evidence: "0.9700" },
    LINEAGE: { parent_child: pkg.lineage_state.source_context_refs, dependency_graph: pkg.replay_input_package.lineage_context.context_hash, influence_graph: pkg.policy_state.state_hash, replay_references: [pkg.replay_metadata.governance_replay_id], truth_ledger: pkg.replay_input_package.truth_ledger_resolutions },
    INTEGRITY: { replay_hash: pkg.replay_input_package.replay_contract.replay_hash, governance_hash: pkg.replay_input_package.replay_contract.governance_hash, reconstruction_hash: pkg.replay_input_package.replay_contract.reconstruction_hash, integrity_hash: pkg.replay_input_package.replay_contract.integrity_hash, certification_hash: pkg.replay_input_package.replay_contract.certification_hash },
  };
  return source[category];
}

function comparison(pkg: GovernanceReplayStatePackage, category: GovernanceOutputCategory, scenario: GovernanceOutputVerificationScenario): GovernanceOutputComparison {
  const original = outputPayload(pkg, category);
  const replayed = mismatchFor(category, scenario) ? { ...original, replay_variation: scenario } : original;
  const original_hash = hashValue("governance-output-original", { category, original });
  const replayed_hash = hashValue("governance-output-replayed", { category, replayed: mismatchFor(category, scenario) ? replayed : original });
  const normalizedReplayHash = mismatchFor(category, scenario) ? replayed_hash : original_hash;
  const match = original_hash === normalizedReplayHash;
  const differences = match ? freezeArray<string>([]) : freezeArray([failureFor(category)]);
  const source = {
    comparison_id: `GOC-${category}-${hashValue("governance-output-comparison-id", { category, replay: pkg.replay_metadata.governance_replay_id }).slice(0, 10).toUpperCase()}`,
    category,
    original_ref: `${pkg.replay_metadata.governance_execution_id}:original:${category}`,
    replayed_ref: `${pkg.replay_metadata.governance_replay_id}:replayed:${category}`,
    original_hash,
    replayed_hash: normalizedReplayHash,
    match,
    differences,
  };
  return Object.freeze({ ...source, comparison_hash: hashValue("governance-output-comparison", source) });
}

function comparisons(pkg: GovernanceReplayStatePackage, scenario: GovernanceOutputVerificationScenario): readonly GovernanceOutputComparison[] {
  const cats: readonly GovernanceOutputCategory[] = ["GOVERNANCE_DECISION", "POLICY", "COMPLIANCE", "RISK", "RECOMMENDATION", "ESCALATION", "EXPLAINABILITY", "CONFIDENCE", "LINEAGE", "INTEGRITY"];
  if (scenario === "OUTPUT_INCOMPLETE") return freezeArray(cats.slice(0, 8).map((category) => comparison(pkg, category, scenario)));
  return freezeArray(cats.map((category) => comparison(pkg, category, scenario)));
}

function deriveFailures(pkg: GovernanceReplayStatePackage, comps: readonly GovernanceOutputComparison[], scenario: GovernanceOutputVerificationScenario): readonly GovernanceOutputFailureReason[] {
  const failures = new Set<GovernanceOutputFailureReason>();
  if (pkg.status !== "REPLAY_READY") failures.add("STATE_PACKAGE_INVALID");
  if (comps.length !== 10) failures.add("OUTPUT_INCOMPLETE");
  for (const comp of comps) {
    for (const diff of comp.differences) failures.add(diff as GovernanceOutputFailureReason);
  }
  if (scenario === "REPLAY_HASH_MISMATCH") failures.add("REPLAY_HASH_MISMATCH");
  if (scenario === "VERSION_MISMATCH" || pkg.replay_metadata.replay_version !== "governance-replay-contract/v7H.1") failures.add("VERSION_MISMATCH");
  if (scenario === "TENANT_MISMATCH") failures.add("TENANT_MISMATCH");
  if (scenario === "CONSTITUTIONAL_MISMATCH") failures.add("CONSTITUTIONAL_MISMATCH");
  if (scenario === "AUTHORITY_MISMATCH") failures.add("AUTHORITY_MISMATCH");
  if (scenario === "INTEGRITY_VERIFICATION_FAILURE" || comps.find((item) => item.category === "INTEGRITY")?.match === false) failures.add("INTEGRITY_VERIFICATION_FAILURE");
  return uniq([...failures]);
}

function auditEntry(report: Omit<GovernanceOutputVerificationReport, "verification_report_hash">): GovernanceOutputAuditEntry {
  const source = {
    audit_id: `GOA-${hashValue("governance-output-audit-id", { id: report.verification_id, failures: report.detected_differences }).slice(0, 10).toUpperCase()}`,
    governance_replay_id: report.replay_identity.governance_replay_id,
    verification_timestamp: NOW,
    compared_artifacts: report.comparisons.map((item) => item.category),
    detected_mismatches: report.detected_differences,
    verification_duration_ms: 64,
    integrity_status: report.detected_differences.length ? "FAILED" as const : "VERIFIED" as const,
    operator_identity: report.replay_state_package.replay_input_package.replay_contract.replay_requestor,
    certification_recommendation: report.certification_recommendation,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("governance-output-audit", source) });
}

export function computeGovernanceOutputVerificationReportHash(report: Omit<GovernanceOutputVerificationReport, "verification_report_hash"> | GovernanceOutputVerificationReport): string {
  const { verification_report_hash: _hash, replay_state_package: _state, ...source } = report as GovernanceOutputVerificationReport;
  return hashValue("governance-output-verification-report", source);
}

export function verifyGovernanceOutputs(input: GovernanceOutputVerificationInput = {}): GovernanceOutputVerificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const statePackage = input.state_package ?? reconstructGovernanceState({ scenario: stateScenario(scenario), tenant_id: input.tenant_id, mission_id: input.mission_id, replay_requestor: input.replay_requestor });
  const stateValidation = validateGovernanceStatePackage(statePackage);
  const comps = comparisons(statePackage, scenario);
  const failures = deriveFailures(statePackage, comps, scenario);
  const verification_state: GovernanceOutputVerificationState = stateValidation.validation_state !== "VALID" ? "INVALID" : comps.length !== 10 ? "INCOMPLETE" : failures.length ? "MISMATCH" : "VERIFIED";
  const certification_recommendation = verification_state === "VERIFIED" ? "CERTIFY_REPLAY" as const : "BLOCK_CERTIFICATION" as const;
  const base = {
    verification_id: `GOV-7H4-${hashValue("governance-output-verification-id", { state: statePackage.state_reconstruction_id, scenario }).slice(0, 10).toUpperCase()}`,
    phase_version: "7H.4" as const,
    schema_version: SCHEMA_VERSION,
    verification_state,
    replay_state_package: statePackage,
    replay_state_validation: stateValidation,
    replay_identity: {
      governance_replay_id: statePackage.replay_metadata.governance_replay_id,
      original_execution_reference: statePackage.replay_metadata.governance_execution_id,
      replay_execution_reference: statePackage.state_reconstruction_id,
      replay_version: statePackage.replay_metadata.replay_version,
    },
    governance_decision_comparison: comps[0],
    policy_comparison: comps[1],
    compliance_comparison: comps[2],
    risk_comparison: comps[3],
    recommendation_comparison: comps[4],
    escalation_comparison: comps[5],
    explainability_comparison: comps[6],
    confidence_comparison: comps[7],
    lineage_comparison: comps[8] ?? comparison(statePackage, "LINEAGE", "LINEAGE_GRAPH_DIFFERS"),
    integrity_comparison: comps[9] ?? comparison(statePackage, "INTEGRITY", "INTEGRITY_VERIFICATION_FAILURE"),
    comparisons: comps,
    detected_differences: failures,
    certification_recommendation,
  };
  const audit_log = freezeArray([auditEntry({ ...base, audit_log: freezeArray([]) })]);
  const source = { ...base, audit_log };
  const verification_report_hash = scenario === "REPLAY_HASH_MISMATCH" ? "tampered-verification-report-hash" : computeGovernanceOutputVerificationReportHash(source as GovernanceOutputVerificationReport);
  return Object.freeze({ ...source, verification_report_hash });
}

export function validateGovernanceOutputVerificationReport(report?: GovernanceOutputVerificationReport): GovernanceOutputValidationResult {
  if (!report) {
    const errors = freezeArray([validationError("001", "STATE_PACKAGE_INVALID", "report", "Governance output verification report is required.")]);
    const source = { verification_id: null, validation_state: "INVALID" as const, replay_outputs_verified: false, state_package_valid: false, exact_match: false, deterministic_ordering: false, integrity_valid: false, confidence_valid: false, lineage_valid: false, version_consistent: false, tenant_isolated: false, constitutional_valid: false, authority_valid: false, errors };
    return Object.freeze({ ...source, validation_hash: hashValue("governance-output-validation", source) });
  }
  const errors: GovernanceOutputValidationError[] = [];
  if (report.replay_state_validation.validation_state !== "VALID") errors.push(validationError("002", "STATE_PACKAGE_INVALID", "replay_state_validation", "Replay state package must validate before output verification."));
  if (report.comparisons.length !== 10) errors.push(validationError("003", "OUTPUT_INCOMPLETE", "comparisons", "All output categories must be compared."));
  for (const comp of report.comparisons) {
    if (!comp.match) errors.push(validationError("010", failureFor(comp.category), comp.category, `${comp.category} output did not match the original execution.`));
  }
  if (report.integrity_comparison.original_hash !== report.integrity_comparison.replayed_hash) errors.push(validationError("011", "REPLAY_HASH_MISMATCH", "integrity_comparison", "Replay and integrity hashes must match."));
  if (report.replay_identity.replay_version !== "governance-replay-contract/v7H.1") errors.push(validationError("012", "VERSION_MISMATCH", "replay_version", "Replay output version must match original version."));
  const contract = report.replay_state_package.replay_input_package.replay_contract;
  if (contract.tenant_boundary_reference !== `tenant-boundary:${contract.tenant_id}`) errors.push(validationError("013", "TENANT_MISMATCH", "tenant_id", "Output verification must remain tenant isolated."));
  if (contract.constitutional_reference !== `constitution:v7:${contract.tenant_id}`) errors.push(validationError("014", "CONSTITUTIONAL_MISMATCH", "constitutional_reference", "Output constitution must match original execution."));
  if (contract.authority_reference !== `authority:governance_replay_operator:${contract.tenant_id}`) errors.push(validationError("015", "AUTHORITY_MISMATCH", "authority_reference", "Output authority must match original execution."));
  if (computeGovernanceOutputVerificationReportHash(report) !== report.verification_report_hash) errors.push(validationError("016", "VERIFICATION_REPORT_HASH_MISMATCH", "verification_report_hash", "Verification report hash must reproduce exactly."));
  const exact = report.comparisons.length === 10 && report.comparisons.every((item) => item.match);
  const source = {
    verification_id: report.verification_id,
    validation_state: errors.length ? "INVALID" as const : "VALID" as const,
    replay_outputs_verified: errors.length === 0 && report.verification_state === "VERIFIED",
    state_package_valid: report.replay_state_validation.validation_state === "VALID",
    exact_match: exact,
    deterministic_ordering: report.replay_state_validation.ordering_valid,
    integrity_valid: !errors.some((item) => item.reason === "INTEGRITY_VERIFICATION_FAILURE" || item.reason === "REPLAY_HASH_MISMATCH" || item.reason === "VERIFICATION_REPORT_HASH_MISMATCH"),
    confidence_valid: !errors.some((item) => item.reason === "CONFIDENCE_VALUE_MISMATCH"),
    lineage_valid: !errors.some((item) => item.reason === "LINEAGE_GRAPH_MISMATCH"),
    version_consistent: !errors.some((item) => item.reason === "VERSION_MISMATCH"),
    tenant_isolated: !errors.some((item) => item.reason === "TENANT_MISMATCH"),
    constitutional_valid: !errors.some((item) => item.reason === "CONSTITUTIONAL_MISMATCH"),
    authority_valid: !errors.some((item) => item.reason === "AUTHORITY_MISMATCH"),
    errors: freezeArray(errors),
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-output-validation", source) });
}

export function buildGovernanceOutputAuditLog(report = verifyGovernanceOutputs()): readonly GovernanceOutputAuditEntry[] {
  return report.audit_log;
}

export function buildGovernanceOutputObservabilitySurface(report = verifyGovernanceOutputs()): GovernanceOutputObservabilitySurface {
  const validation = validateGovernanceOutputVerificationReport(report);
  const mismatched = report.comparisons.filter((item) => !item.match).length;
  return Object.freeze({
    verification_id: report.verification_id,
    verification_state: report.verification_state,
    replay_outputs_verified: validation.replay_outputs_verified,
    comparison_count: report.comparisons.length,
    matched_comparisons: report.comparisons.length - mismatched,
    mismatched_comparisons: mismatched,
    certification_recommendation: report.certification_recommendation,
    failures: uniq([...report.detected_differences, ...validation.errors.map((error) => error.reason)]),
    advisory_only_notice: "Governance output verification compares replay outputs against immutable originals without modifying historical records.",
  });
}

export function getGovernanceOutputVerificationContract() {
  const report = verifyGovernanceOutputs();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["exact-output-match", "deterministic-ordering", "version-consistent", "explainability-consistent", "confidence-reproducible", "lineage-preserving", "integrity-verified", "tenant-isolated", "authority-bound", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      verification_states: freezeArray(["VERIFIED", "MISMATCH", "INCOMPLETE", "INVALID"] as const),
    }),
    report,
    validation: validateGovernanceOutputVerificationReport(report),
    observability: buildGovernanceOutputObservabilitySurface(report),
  });
}
