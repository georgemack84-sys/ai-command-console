import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildExecutionBoundaryPackage } from "@/services/execution-boundary-engine";
import type { ExecutionBoundaryPackage } from "@/types/execution-boundary-engine";
import type {
  GovernanceEnforcementContract,
  GovernancePolicyCategory,
  GovernancePolicyDecision,
  GovernancePolicyEvaluation,
  GovernancePolicyEvidence,
  GovernancePolicyFramework,
  GovernancePolicyLedgerEntry,
  GovernancePolicyPackage,
  GovernancePolicyReplayResult,
  GovernancePolicyScenario,
  GovernancePolicyState,
  GovernancePolicyViolation,
  GovernancePolicyVisibilitySurface,
} from "@/types/governance-policy-enforcement-engine";

const NOW = "2026-06-30T05:00:00.000Z";
const ENGINE_VERSION = "governance-policy-enforcement-engine/v8F.4" as const;
const PIPELINE = Object.freeze(["Governance Discovery", "Policy Discovery", "Constitutional Evaluation", "Regulatory Evaluation", "Conflict Resolution", "Compliance Validation", "Enforcement Reasoning", "Applied Restrictions", "Escalation Path", "Final Decision"]);
const CATEGORIES = Object.freeze(["CONSTITUTIONAL", "GOVERNANCE", "POLICY", "REGULATORY", "MISSION", "RUNTIME"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values.filter(Boolean))].sort()); }
function id(prefix: string, domain: string, value: unknown) { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function scenarioViolation(scenario: GovernancePolicyScenario): GovernancePolicyViolation | null {
  const map: Partial<Record<GovernancePolicyScenario, GovernancePolicyViolation>> = {
    MINOR_POLICY_CONFLICT: "MINOR_POLICY_CONFLICT",
    GOVERNANCE_UNCERTAINTY: "GOVERNANCE_UNCERTAIN",
    GOVERNANCE_CONFLICT: "GOVERNANCE_CONFLICT",
    CONFLICTING_OPERATOR_APPROVALS: "CONFLICTING_OPERATOR_APPROVALS",
    REGULATORY_AMBIGUITY: "REGULATORY_AMBIGUITY",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    POLICY_BYPASS: "POLICY_BYPASS",
    UNAUTHORIZED_POLICY_OVERRIDE: "UNAUTHORIZED_POLICY_OVERRIDE",
    PROTECTED_RESOURCE_ACCESS: "PROTECTED_RESOURCE_ACCESS",
    UNAUTHORIZED_EXECUTION: "UNAUTHORIZED_EXECUTION",
    EXPIRED_APPROVALS: "EXPIRED_APPROVAL",
    COMPLIANCE_FAILURE: "COMPLIANCE_FAILURE",
    MISSING_APPROVALS: "MISSING_APPROVAL",
    RUNTIME_GOVERNANCE_DRIFT: "RUNTIME_GOVERNANCE_DRIFT",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILURE",
    MISSING_POLICY_REFERENCES: "POLICY_REFERENCE_MISSING",
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
    TENANT_MISMATCH: "TENANT_ISOLATION_VIOLATION",
    EXECUTION_BOUNDARY_BLOCKED: "EXECUTION_BOUNDARY_NOT_AUTHORIZED",
  };
  return map[scenario] ?? null;
}

function categoryFor(violation: GovernancePolicyViolation | null): GovernancePolicyCategory | null {
  if (!violation) return null;
  if (["CONSTITUTIONAL_VIOLATION", "PROTECTED_RESOURCE_ACCESS"].includes(violation)) return "CONSTITUTIONAL";
  if (["GOVERNANCE_BYPASS", "GOVERNANCE_CONFLICT", "GOVERNANCE_UNCERTAIN", "CONFLICTING_OPERATOR_APPROVALS", "RUNTIME_GOVERNANCE_DRIFT"].includes(violation)) return "GOVERNANCE";
  if (["POLICY_BYPASS", "UNAUTHORIZED_POLICY_OVERRIDE", "POLICY_REFERENCE_MISSING", "MINOR_POLICY_CONFLICT"].includes(violation)) return "POLICY";
  if (["COMPLIANCE_FAILURE", "REGULATORY_AMBIGUITY"].includes(violation)) return "REGULATORY";
  if (["EXPIRED_APPROVAL", "MISSING_APPROVAL"].includes(violation)) return "MISSION";
  return "RUNTIME";
}

function decisionFor(scenario: GovernancePolicyScenario, execution: ExecutionBoundaryPackage): GovernancePolicyDecision {
  if (execution.execution_boundary.decision === "FAIL_SAFE" || execution.execution_boundary.decision === "TERMINATE") return "FAIL_SAFE";
  if (["INTEGRITY_FAILURE", "MISSING_POLICY_REFERENCES", "REPLAY_MISMATCH"].includes(scenario)) return "FAIL_SAFE";
  if (["CONSTITUTIONAL_VIOLATION", "GOVERNANCE_BYPASS", "POLICY_BYPASS", "UNAUTHORIZED_POLICY_OVERRIDE", "PROTECTED_RESOURCE_ACCESS", "UNAUTHORIZED_EXECUTION", "COMPLIANCE_FAILURE", "TENANT_MISMATCH"].includes(scenario)) return "BLOCK";
  if (["GOVERNANCE_CONFLICT", "CONFLICTING_OPERATOR_APPROVALS", "REGULATORY_AMBIGUITY"].includes(scenario)) return "ESCALATE";
  if (["GOVERNANCE_UNCERTAINTY", "EXPIRED_APPROVALS", "MISSING_APPROVALS", "RUNTIME_GOVERNANCE_DRIFT"].includes(scenario)) return "PAUSE";
  if (scenario === "MINOR_POLICY_CONFLICT") return "ALLOW_WITH_RESTRICTIONS";
  return execution.execution_boundary.decision === "CHECKPOINT" ? "CHECKPOINT" : "ALLOW";
}

function stateFor(decision: GovernancePolicyDecision): GovernancePolicyState {
  if (decision === "ALLOW") return "AUTHORIZED";
  if (decision === "ALLOW_WITH_RESTRICTIONS" || decision === "CHECKPOINT") return "RESTRICTED";
  if (decision === "PAUSE") return "PAUSED";
  if (decision === "ESCALATE") return "ESCALATED";
  if (decision === "BLOCK") return "BLOCKED";
  return "FAILED";
}

function evalHashSource(evaluation: Omit<GovernancePolicyEvaluation, "integrity_hash"> | GovernancePolicyEvaluation) {
  return { evaluation_id: evaluation.evaluation_id, category: evaluation.category, status: evaluation.status, evaluated_rules: evaluation.evaluated_rules, evaluated_references: evaluation.evaluated_references, detected_conflicts: evaluation.detected_conflicts, detected_violations: evaluation.detected_violations, explanation: evaluation.explanation };
}
export function computeGovernancePolicyEvaluationHash(evaluation: Omit<GovernancePolicyEvaluation, "integrity_hash"> | GovernancePolicyEvaluation): string {
  return hashValue("governance-policy-evaluation", evalHashSource(evaluation));
}
function buildEvaluation(category: GovernancePolicyCategory, scenario: GovernancePolicyScenario): GovernancePolicyEvaluation {
  const violation = scenarioViolation(scenario);
  const matched = categoryFor(violation) === category && violation ? [violation] : [];
  const source = {
    evaluation_id: id("GPE", "governance-policy-evaluation-id", { category, scenario }),
    category,
    status: matched.length ? "FAIL" as const : "PASS" as const,
    evaluated_rules: freezeArray([`${category.toLowerCase()}:supremacy`, `${category.toLowerCase()}:runtime-enforcement`, "fail-closed"]),
    evaluated_references: freezeArray(scenario === "MISSING_POLICY_REFERENCES" && category === "POLICY" ? [] : [`${category.toLowerCase()}:ref:v8f4`]),
    detected_conflicts: freezeArray(matched.length ? [`conflict:${matched[0].toLowerCase()}`] : []),
    detected_violations: freezeArray(matched),
    explanation: matched.length ? `${category} enforcement rejected ${matched[0]}.` : `${category} enforcement passed deterministically.`,
  };
  return Object.freeze({ ...source, integrity_hash: computeGovernancePolicyEvaluationHash(source) });
}

function contractHashSource(contract: Omit<GovernanceEnforcementContract, "integrity_hash"> | GovernanceEnforcementContract) {
  return { governance_enforcement_id: contract.governance_enforcement_id, mission_id: contract.mission_id, execution_id: contract.execution_id, workflow_id: contract.workflow_id, tenant_id: contract.tenant_id, governance_status: contract.governance_status, evaluated_rules: contract.evaluated_rules, evaluated_policies: contract.evaluated_policies, evaluated_constitution: contract.evaluated_constitution, evaluated_regulations: contract.evaluated_regulations, compliance_status: contract.compliance_status, detected_conflicts: contract.detected_conflicts, detected_violations: contract.detected_violations, enforcement_decision: contract.enforcement_decision, restrictions: contract.restrictions, confidence: contract.confidence, explanation: contract.explanation, lineage_reference: contract.lineage_reference, replay_reference: contract.replay_reference, truth_ledger_reference: contract.truth_ledger_reference };
}
export function computeGovernanceEnforcementHash(contract: Omit<GovernanceEnforcementContract, "integrity_hash"> | GovernanceEnforcementContract): string {
  return hashValue("governance-policy-contract", contractHashSource(contract));
}
function buildContract(execution: ExecutionBoundaryPackage, evaluations: readonly GovernancePolicyEvaluation[], scenario: GovernancePolicyScenario): GovernanceEnforcementContract {
  const violations = unique([...(scenarioViolation(scenario) ? [scenarioViolation(scenario)!] : []), ...(execution.execution_boundary.decision === "FAIL_SAFE" ? ["EXECUTION_BOUNDARY_NOT_AUTHORIZED" as const] : [])]);
  const decision = decisionFor(scenario, execution);
  const source = {
    governance_enforcement_id: id("GPC", "governance-policy-contract-id", { execution: execution.package_id, scenario }),
    mission_id: execution.execution_boundary.mission_id,
    execution_id: execution.execution_boundary.execution_id,
    workflow_id: execution.execution_boundary.workflow_id,
    tenant_id: scenario === "TENANT_MISMATCH" ? "tenant_beta" : execution.execution_boundary.tenant_id,
    governance_version: "governance-intelligence/v7m",
    constitution_version: "mission-control-constitution/v1",
    policy_versions: freezeArray(scenario === "MISSING_POLICY_REFERENCES" ? [] : ["policy:mission:v8f4", "policy:runtime:v8f4", "policy:security:v8f4"]),
    regulatory_versions: freezeArray(["regulatory:runtime-audit:v8f4"]),
    execution_state: execution.execution_boundary.execution_state,
    governance_status: decision === "PAUSE" ? "UNCERTAIN" as const : decision === "ESCALATE" ? "CONFLICT" as const : decision === "BLOCK" || decision === "FAIL_SAFE" ? "INVALID" as const : "VALID" as const,
    evaluated_rules: freezeArray(evaluations.flatMap((item) => item.evaluated_rules)),
    evaluated_policies: freezeArray(["mission-policy", "security-policy", "runtime-policy"]),
    evaluated_constitution: freezeArray(["operator-supremacy", "governance-supremacy", "constitutional-supremacy"]),
    evaluated_regulations: freezeArray(["audit-retention", "explainability-required"]),
    compliance_status: violations.includes("COMPLIANCE_FAILURE") ? "NON_COMPLIANT" as const : decision === "FAIL_SAFE" ? "UNKNOWN" as const : "COMPLIANT" as const,
    detected_conflicts: unique(evaluations.flatMap((item) => item.detected_conflicts)),
    detected_violations: violations,
    enforcement_decision: decision,
    restrictions: freezeArray(decision === "ALLOW_WITH_RESTRICTIONS" || decision === "CHECKPOINT" ? ["additional logging", "reduced execution scope", "mandatory checkpoint"] : []),
    operator_required: ["PAUSE", "ESCALATE", "BLOCK", "FAIL_SAFE"].includes(decision),
    governance_review_required: decision !== "ALLOW",
    confidence: violations.length ? 0.25 : decision === "PAUSE" || decision === "ESCALATE" ? 0.72 : 0.98,
    explanation: violations.length ? `Governance policy enforcement resolved ${violations[0]} using constitutional precedence.` : "Governance, policy, constitutional, regulatory, mission, and runtime enforcement passed.",
    timestamp: NOW,
    lineage_reference: scenario === "LINEAGE_MISSING" ? "" : "lineage:governance-policy:v8f4",
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : "replay:governance-policy:v8f4",
    truth_ledger_reference: `truth-ledger:governance-policy:${execution.package_id}`,
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-governance-policy" : computeGovernanceEnforcementHash(source) });
}

function evidenceHashSource(evidence: Omit<GovernancePolicyEvidence, "integrity_hash"> | GovernancePolicyEvidence) {
  return { evidence_id: evidence.evidence_id, governance_rules_evaluated: evidence.governance_rules_evaluated, policies_evaluated: evidence.policies_evaluated, constitutional_rules_evaluated: evidence.constitutional_rules_evaluated, regulatory_rules_evaluated: evidence.regulatory_rules_evaluated, conflict_analysis: evidence.conflict_analysis, compliance_analysis: evidence.compliance_analysis, enforcement_reasoning: evidence.enforcement_reasoning, restrictions_applied: evidence.restrictions_applied, detected_violations: evidence.detected_violations, operator_approvals: evidence.operator_approvals, governance_approvals: evidence.governance_approvals, confidence: evidence.confidence, timestamp: evidence.timestamp, replay_reference: evidence.replay_reference, lineage_reference: evidence.lineage_reference, truth_ledger_reference: evidence.truth_ledger_reference };
}
export function computeGovernancePolicyEvidenceHash(evidence: Omit<GovernancePolicyEvidence, "integrity_hash"> | GovernancePolicyEvidence): string {
  return hashValue("governance-policy-evidence", evidenceHashSource(evidence));
}
function buildEvidence(contract: GovernanceEnforcementContract, scenario: GovernancePolicyScenario): GovernancePolicyEvidence {
  const source = { evidence_id: id("GPEV", "governance-policy-evidence-id", contract.governance_enforcement_id), governance_rules_evaluated: contract.evaluated_rules, policies_evaluated: contract.evaluated_policies, constitutional_rules_evaluated: contract.evaluated_constitution, regulatory_rules_evaluated: contract.evaluated_regulations, conflict_analysis: contract.detected_conflicts, compliance_analysis: freezeArray([contract.compliance_status]), enforcement_reasoning: contract.explanation, restrictions_applied: contract.restrictions, detected_violations: contract.detected_violations, operator_approvals: freezeArray(contract.operator_required ? ["operator:required"] : ["operator:approved"]), governance_approvals: freezeArray(contract.governance_review_required ? ["governance:review-required"] : ["governance:approved"]), confidence: contract.confidence, timestamp: NOW, replay_reference: contract.replay_reference, lineage_reference: contract.lineage_reference, truth_ledger_reference: scenario === "MISSING_POLICY_REFERENCES" ? "" : contract.truth_ledger_reference };
  return Object.freeze({ ...source, integrity_hash: computeGovernancePolicyEvidenceHash(source) });
}

function buildLedger(contract: GovernanceEnforcementContract, evidence: GovernancePolicyEvidence): GovernancePolicyLedgerEntry {
  const source = { ledger_entry_id: id("GPL", "governance-policy-ledger-id", contract.governance_enforcement_id), governance_enforcement_id: contract.governance_enforcement_id, governance_evidence: hashValue("governance-evidence", evidence.governance_rules_evaluated), policy_evidence: hashValue("policy-evidence", evidence.policies_evaluated), constitutional_evidence: hashValue("constitutional-evidence", evidence.constitutional_rules_evaluated), compliance_evidence: hashValue("compliance-evidence", evidence.compliance_analysis), violation_evidence: contract.detected_violations, enforcement_decision: contract.enforcement_decision, restriction_evidence: contract.restrictions, replay_references: freezeArray([contract.replay_reference]), append_only: true as const };
  return Object.freeze({ ...source, ledger_hash: evidence.truth_ledger_reference ? hashValue("governance-policy-ledger", source) : "" });
}

function replayPackage(contract: GovernanceEnforcementContract, evidence: GovernancePolicyEvidence, scenario: GovernancePolicyScenario): GovernancePolicyReplayResult {
  const source = { replay_id: id("GPR", "governance-policy-replay-id", contract.governance_enforcement_id), governance_enforcement_id: contract.governance_enforcement_id, reconstructed_pipeline: freezeArray(PIPELINE), reconstructed_decision: contract.enforcement_decision, reconstructed_contract_hash: scenario === "REPLAY_MISMATCH" ? "mismatched-governance-replay" : contract.integrity_hash, reconstructed_evidence_hash: evidence.integrity_hash, validation_state: scenario === "REPLAY_MISMATCH" ? "FAIL" as const : "PASS" as const, failure_reason: scenario === "REPLAY_MISMATCH" ? "REPLAY_RECONSTRUCTION_MISMATCH" as const : null };
  return Object.freeze({ ...source, replay_hash: hashValue("governance-policy-replay", source) });
}

function packageHashSource(pkg: Omit<GovernancePolicyPackage, "package_hash">) {
  return { package_id: pkg.package_id, engine_version: pkg.engine_version, execution_package_id: pkg.source_execution_boundary_package.package_id, contract_hash: pkg.governance_enforcement.integrity_hash, evaluation_hashes: pkg.evaluations.map((item) => item.integrity_hash), evidence_hash: pkg.evidence.integrity_hash, ledger_hash: pkg.ledger_entry.ledger_hash, replay_hash: pkg.replay.replay_hash };
}
export function buildGovernancePolicyPackage(input: { scenario?: GovernancePolicyScenario; executionBoundaryPackage?: ExecutionBoundaryPackage } = {}): GovernancePolicyPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_execution_boundary_package = input.executionBoundaryPackage ?? buildExecutionBoundaryPackage({ scenario: scenario === "EXECUTION_BOUNDARY_BLOCKED" ? "AUTHORITY_BLOCKED" : "BASELINE" });
  const evaluations = freezeArray(CATEGORIES.map((category) => buildEvaluation(category, scenario)));
  const governance_enforcement = buildContract(source_execution_boundary_package, evaluations, scenario);
  const evidence = buildEvidence(governance_enforcement, scenario);
  const ledger_entry = buildLedger(governance_enforcement, evidence);
  const replay = replayPackage(governance_enforcement, evidence, scenario);
  const enforcement_state: GovernancePolicyState = stateFor(governance_enforcement.enforcement_decision);
  const full = { package_id: id("GPP", "governance-policy-package-id", { execution: source_execution_boundary_package.package_id, scenario }), engine_version: ENGINE_VERSION, source_execution_boundary_package, enforcement_state, governance_enforcement, evaluations, evidence, ledger_entry, replay, policy_created: false as const, policy_modified: false as const, constitutional_rules_modified: false as const };
  return Object.freeze({ ...full, package_hash: hashValue("governance-policy-package", packageHashSource(full)) });
}

export function buildGovernancePolicyVisibilitySurface(pkg = buildGovernancePolicyPackage()): GovernancePolicyVisibilitySurface {
  return Object.freeze({ package_id: pkg.package_id, governance_status: pkg.governance_enforcement.governance_status, policy_status: pkg.governance_enforcement.policy_versions.length ? "VALID" : "MISSING", constitutional_status: pkg.governance_enforcement.detected_violations.includes("CONSTITUTIONAL_VIOLATION") ? "INVALID" : "VALID", compliance_status: pkg.governance_enforcement.compliance_status, evaluated_rules: pkg.governance_enforcement.evaluated_rules, applied_restrictions: pkg.governance_enforcement.restrictions, detected_conflicts: pkg.governance_enforcement.detected_conflicts, violation_history: pkg.governance_enforcement.detected_violations, operator_approvals: pkg.evidence.operator_approvals, governance_approvals: pkg.evidence.governance_approvals, confidence_score: pkg.governance_enforcement.confidence, enforcement_reasoning: pkg.governance_enforcement.explanation, replay_status: pkg.replay.validation_state, lineage_reference: pkg.governance_enforcement.lineage_reference, integrity_status: computeGovernanceEnforcementHash(pkg.governance_enforcement) === pkg.governance_enforcement.integrity_hash && pkg.replay.validation_state === "PASS" ? "VALID" : "INVALID" });
}

export function getGovernancePolicyFramework(): GovernancePolicyFramework {
  const pkg = buildGovernancePolicyPackage();
  return Object.freeze({ doctrine: Object.freeze({ principles: freezeArray(["governance-supremacy", "constitutional-supremacy", "policy-consistency", "deterministic-enforcement", "no-autonomous-policy-changes", "fail-closed", "explainability", "truth-ledger-required", "replayable-enforcement"]), engine_version: ENGINE_VERSION, states: freezeArray(["RECEIVED", "DISCOVERING", "VALIDATING", "AUTHORIZED", "RESTRICTED", "PAUSED", "ESCALATED", "BLOCKED", "FAILED", "COMPLETED"] as const), decisions: freezeArray(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "CHECKPOINT", "PAUSE", "ESCALATE", "BLOCK", "FAIL_SAFE"] as const), categories: freezeArray(CATEGORIES) }), package: pkg, visibility: buildGovernancePolicyVisibilitySurface(pkg) });
}
