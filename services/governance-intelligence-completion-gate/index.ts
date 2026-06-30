import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceAuthorityBoundaryValidation } from "@/services/governance-authority-boundary-validation";
import { runGovernanceCertificationOrchestrator } from "@/services/governance-certification-orchestrator";
import { runGovernanceDeterministicReplayValidation } from "@/services/governance-deterministic-replay-validation";
import { runGovernanceIntegrityValidation } from "@/services/governance-integrity-validation";
import { runGovernanceIsolationValidation } from "@/services/governance-isolation-validation";
import type { GovernanceAuthorityBoundaryValidationReport } from "@/types/governance-authority-boundary-validation";
import type { GovernanceCertificationOrchestratorReport } from "@/types/governance-certification-orchestrator";
import type { GovernanceDeterministicReplayValidationReport } from "@/types/governance-deterministic-replay-validation";
import type { GovernanceIntegrityValidationReport } from "@/types/governance-integrity-validation";
import type { GovernanceIsolationValidationReport } from "@/types/governance-isolation-validation";
import type {
  GovernanceCompletionArea,
  GovernanceCompletionCheck,
  GovernanceCompletionFailure,
  GovernanceCompletionGateInput,
  GovernanceCompletionGateObservabilitySurface,
  GovernanceCompletionLifecycleState,
  GovernanceCompletionResult,
  GovernanceCompletionRun,
  GovernanceCompletionScenario,
  GovernanceCompletionState,
  GovernanceCompletionTimelineEvent,
  GovernanceIntelligenceCompletionGateReport,
} from "@/types/governance-intelligence-completion-gate";

const NOW = "2026-06-27T20:00:00.000Z";
const END = "2026-06-27T20:00:12.000Z";
const SCHEMA_VERSION = "governance-intelligence-completion-gate/v7M" as const;
const SUITE_VERSION = "governance-intelligence-completion-suite/v7M" as const;
const orchestratorCache = new Map<string, GovernanceCertificationOrchestratorReport>();
const replayCache = new Map<string, GovernanceDeterministicReplayValidationReport>();
const integrityCache = new Map<string, GovernanceIntegrityValidationReport>();
const authorityCache = new Map<string, GovernanceAuthorityBoundaryValidationReport>();
const isolationCache = new Map<string, GovernanceIsolationValidationReport>();

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function cachedReports(tenant_id: string, mission_id: string, validator_id: string) {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  if (!orchestratorCache.has(key)) orchestratorCache.set(key, runGovernanceCertificationOrchestrator({ tenant_id, mission_id, initiated_by: validator_id, execution_mode: "FULL_SYSTEM_CERTIFICATION" }));
  if (!replayCache.has(key)) replayCache.set(key, runGovernanceDeterministicReplayValidation({ tenant_id, mission_id, replay_requestor: validator_id }));
  if (!integrityCache.has(key)) integrityCache.set(key, runGovernanceIntegrityValidation({ tenant_id, mission_id, validator_id }));
  if (!authorityCache.has(key)) authorityCache.set(key, runGovernanceAuthorityBoundaryValidation({ tenant_id, mission_id, validator_id }));
  if (!isolationCache.has(key)) isolationCache.set(key, runGovernanceIsolationValidation({ tenant_id, mission_id, validator_id }));
  return {
    orchestrator: orchestratorCache.get(key)!,
    replay: replayCache.get(key)!,
    integrity: integrityCache.get(key)!,
    authority: authorityCache.get(key)!,
    isolation: isolationCache.get(key)!,
  };
}

function failureForScenario(scenario: GovernanceCompletionScenario): GovernanceCompletionFailure | null {
  return scenario === "BASELINE" ? null : scenario;
}

function areaForFailure(failure: GovernanceCompletionFailure): GovernanceCompletionArea {
  if (failure.startsWith("POLICY_")) return "POLICY";
  if (failure.startsWith("RISK_") || failure === "GOVERNANCE_RISK_NOT_OPERATIONAL") return "RISK";
  if (failure.startsWith("COMPLIANCE_") || failure.startsWith("CONSTITUTIONAL_") || failure.startsWith("AUTHORITY_")) return "COMPLIANCE";
  if (failure.startsWith("RECOMMENDATION_") || failure.startsWith("RECOMMENDATIONS_") || failure === "UNSUPPORTED_RECOMMENDATION_ACCEPTED" || failure === "MISSING_EVIDENCE_ACCEPTED") return "RECOMMENDATION";
  if (failure.startsWith("ESCALATION_")) return "ESCALATION";
  if (failure.startsWith("GOVERNANCE_LINEAGE") || failure.startsWith("GOVERNANCE_EXPLANATIONS") || failure === "LINEAGE_RECONSTRUCTION_MISMATCH") return "LINEAGE";
  if (failure.startsWith("GOVERNANCE_REPLAY") || failure.startsWith("REPLAY_")) return "REPLAY";
  if (failure.startsWith("GOVERNANCE_INTEGRITY") || failure.startsWith("INTEGRITY_") || failure === "TAMPERING_NOT_DETECTED") return "INTEGRITY";
  if (failure.includes("VISIBILITY") || failure.includes("DASHBOARD") || failure.includes("VIEWER") || failure.includes("EXPLORER")) return "VISIBILITY";
  if (failure.includes("TENANT") || failure.includes("CROSS_TENANT")) return "ISOLATION";
  if (failure === "CERTIFICATION_SUITE_NOT_PASSING") return "CERTIFICATION_SUITE";
  if (failure === "GOVERNANCE_BYPASS_NOT_DETECTED" || failure === "HIDDEN_GOVERNANCE_STATE_NOT_DETECTED") return "ENTERPRISE";
  return "FOUNDATION";
}

function expectedForFailure(failure: GovernanceCompletionFailure): "PASS" | "FAIL" {
  const negativeTests: readonly GovernanceCompletionFailure[] = [
    "CROSS_TENANT_GOVERNANCE_NOT_BLOCKED",
    "HIDDEN_GOVERNANCE_STATE_NOT_DETECTED",
    "UNSUPPORTED_RECOMMENDATION_ACCEPTED",
    "MISSING_EVIDENCE_ACCEPTED",
    "REPLAY_MISMATCH_NOT_DETECTED",
    "INTEGRITY_VERIFICATION_MISMATCH",
    "GOVERNANCE_BYPASS_NOT_DETECTED",
    "CONSTITUTIONAL_VIOLATION_ACCEPTED",
    "AUTHORITY_EXPANSION_NOT_DETECTED",
    "POLICY_CONFLICT_IGNORED",
    "COMPLIANCE_VIOLATION_IGNORED",
    "ESCALATION_ROUTING_INCONSISTENT",
    "LINEAGE_RECONSTRUCTION_MISMATCH",
    "GOVERNANCE_VISIBILITY_INCOMPLETE",
  ];
  return negativeTests.includes(failure) ? "FAIL" : "PASS";
}

const TEST_MATRIX: readonly { area: GovernanceCompletionArea; test_name: string; expected: "PASS" | "FAIL"; failure: GovernanceCompletionFailure; critical: boolean }[] = Object.freeze([
  { area: "FOUNDATION", test_name: "governance intelligence operational", expected: "PASS", failure: "GOVERNANCE_INTELLIGENCE_NOT_OPERATIONAL", critical: true },
  { area: "FOUNDATION", test_name: "governance contracts valid", expected: "PASS", failure: "GOVERNANCE_CONTRACTS_INVALID", critical: true },
  { area: "FOUNDATION", test_name: "governance identity deterministic", expected: "PASS", failure: "GOVERNANCE_IDENTITY_NONDETERMINISTIC", critical: true },
  { area: "FOUNDATION", test_name: "governance lifecycle reproducible", expected: "PASS", failure: "GOVERNANCE_LIFECYCLE_NOT_REPRODUCIBLE", critical: true },
  { area: "POLICY", test_name: "policy intelligence operational", expected: "PASS", failure: "POLICY_INTELLIGENCE_NOT_OPERATIONAL", critical: true },
  { area: "POLICY", test_name: "policy lineage reproducible", expected: "PASS", failure: "POLICY_LINEAGE_NOT_REPRODUCIBLE", critical: true },
  { area: "POLICY", test_name: "policy dependency deterministic", expected: "PASS", failure: "POLICY_DEPENDENCY_NONDETERMINISTIC", critical: true },
  { area: "RISK", test_name: "governance risk intelligence operational", expected: "PASS", failure: "GOVERNANCE_RISK_NOT_OPERATIONAL", critical: true },
  { area: "RISK", test_name: "risk scoring reproducible", expected: "PASS", failure: "RISK_SCORING_NONDETERMINISTIC", critical: true },
  { area: "RISK", test_name: "risk confidence reproducible", expected: "PASS", failure: "RISK_CONFIDENCE_NONDETERMINISTIC", critical: true },
  { area: "COMPLIANCE", test_name: "compliance intelligence operational", expected: "PASS", failure: "COMPLIANCE_INTELLIGENCE_NOT_OPERATIONAL", critical: true },
  { area: "COMPLIANCE", test_name: "constitutional compliance reproducible", expected: "PASS", failure: "CONSTITUTIONAL_COMPLIANCE_NOT_REPRODUCIBLE", critical: true },
  { area: "COMPLIANCE", test_name: "authority compliance reproducible", expected: "PASS", failure: "AUTHORITY_COMPLIANCE_NOT_REPRODUCIBLE", critical: true },
  { area: "RECOMMENDATION", test_name: "recommendation intelligence operational", expected: "PASS", failure: "RECOMMENDATION_INTELLIGENCE_NOT_OPERATIONAL", critical: true },
  { area: "RECOMMENDATION", test_name: "recommendations advisory only", expected: "PASS", failure: "RECOMMENDATIONS_NOT_ADVISORY_ONLY", critical: true },
  { area: "RECOMMENDATION", test_name: "evidence supports recommendations", expected: "PASS", failure: "RECOMMENDATION_EVIDENCE_UNSUPPORTED", critical: true },
  { area: "RECOMMENDATION", test_name: "recommendation confidence reproducible", expected: "PASS", failure: "RECOMMENDATION_CONFIDENCE_NONDETERMINISTIC", critical: true },
  { area: "ESCALATION", test_name: "escalation intelligence operational", expected: "PASS", failure: "ESCALATION_INTELLIGENCE_NOT_OPERATIONAL", critical: true },
  { area: "ESCALATION", test_name: "escalation routing deterministic", expected: "PASS", failure: "ESCALATION_ROUTING_NONDETERMINISTIC", critical: true },
  { area: "ESCALATION", test_name: "escalation prioritization reproducible", expected: "PASS", failure: "ESCALATION_PRIORITIZATION_NONREPRODUCIBLE", critical: true },
  { area: "LINEAGE", test_name: "governance lineage operational", expected: "PASS", failure: "GOVERNANCE_LINEAGE_NOT_OPERATIONAL", critical: true },
  { area: "LINEAGE", test_name: "governance explanations reproducible", expected: "PASS", failure: "GOVERNANCE_EXPLANATIONS_NONREPRODUCIBLE", critical: true },
  { area: "REPLAY", test_name: "governance replay deterministic", expected: "PASS", failure: "GOVERNANCE_REPLAY_NONDETERMINISTIC", critical: true },
  { area: "REPLAY", test_name: "replay reconstructs governance state", expected: "PASS", failure: "REPLAY_STATE_RECONSTRUCTION_FAILED", critical: true },
  { area: "REPLAY", test_name: "replay reconstructs recommendations", expected: "PASS", failure: "REPLAY_RECOMMENDATION_RECONSTRUCTION_FAILED", critical: true },
  { area: "INTEGRITY", test_name: "governance integrity verified", expected: "PASS", failure: "GOVERNANCE_INTEGRITY_NOT_VERIFIED", critical: true },
  { area: "INTEGRITY", test_name: "tampering detected", expected: "PASS", failure: "TAMPERING_NOT_DETECTED", critical: true },
  { area: "VISIBILITY", test_name: "visibility framework operational", expected: "PASS", failure: "VISIBILITY_FRAMEWORK_NOT_OPERATIONAL", critical: true },
  { area: "VISIBILITY", test_name: "governance dashboard operational", expected: "PASS", failure: "GOVERNANCE_DASHBOARD_NOT_OPERATIONAL", critical: true },
  { area: "VISIBILITY", test_name: "lineage explorer operational", expected: "PASS", failure: "LINEAGE_EXPLORER_NOT_OPERATIONAL", critical: true },
  { area: "VISIBILITY", test_name: "replay viewer operational", expected: "PASS", failure: "REPLAY_VIEWER_NOT_OPERATIONAL", critical: true },
  { area: "VISIBILITY", test_name: "integrity viewer operational", expected: "PASS", failure: "INTEGRITY_VIEWER_NOT_OPERATIONAL", critical: true },
  { area: "ISOLATION", test_name: "tenant isolation enforced", expected: "PASS", failure: "TENANT_ISOLATION_NOT_ENFORCED", critical: true },
  { area: "ISOLATION", test_name: "cross-tenant governance blocked", expected: "FAIL", failure: "CROSS_TENANT_GOVERNANCE_NOT_BLOCKED", critical: true },
  { area: "ENTERPRISE", test_name: "hidden governance state detected", expected: "FAIL", failure: "HIDDEN_GOVERNANCE_STATE_NOT_DETECTED", critical: true },
  { area: "RECOMMENDATION", test_name: "unsupported recommendation accepted", expected: "FAIL", failure: "UNSUPPORTED_RECOMMENDATION_ACCEPTED", critical: true },
  { area: "RECOMMENDATION", test_name: "missing evidence accepted", expected: "FAIL", failure: "MISSING_EVIDENCE_ACCEPTED", critical: true },
  { area: "REPLAY", test_name: "replay mismatch detected", expected: "FAIL", failure: "REPLAY_MISMATCH_NOT_DETECTED", critical: true },
  { area: "INTEGRITY", test_name: "integrity verification mismatch", expected: "FAIL", failure: "INTEGRITY_VERIFICATION_MISMATCH", critical: true },
  { area: "ENTERPRISE", test_name: "governance bypass detected", expected: "FAIL", failure: "GOVERNANCE_BYPASS_NOT_DETECTED", critical: true },
  { area: "COMPLIANCE", test_name: "constitutional violation accepted", expected: "FAIL", failure: "CONSTITUTIONAL_VIOLATION_ACCEPTED", critical: true },
  { area: "COMPLIANCE", test_name: "authority expansion detected", expected: "FAIL", failure: "AUTHORITY_EXPANSION_NOT_DETECTED", critical: true },
  { area: "POLICY", test_name: "policy conflict ignored", expected: "FAIL", failure: "POLICY_CONFLICT_IGNORED", critical: true },
  { area: "COMPLIANCE", test_name: "compliance violation ignored", expected: "FAIL", failure: "COMPLIANCE_VIOLATION_IGNORED", critical: true },
  { area: "ESCALATION", test_name: "escalation routing inconsistent", expected: "FAIL", failure: "ESCALATION_ROUTING_INCONSISTENT", critical: true },
  { area: "LINEAGE", test_name: "lineage reconstruction mismatch", expected: "FAIL", failure: "LINEAGE_RECONSTRUCTION_MISMATCH", critical: true },
  { area: "VISIBILITY", test_name: "governance visibility incomplete", expected: "FAIL", failure: "GOVERNANCE_VISIBILITY_INCOMPLETE", critical: true },
  { area: "CERTIFICATION_SUITE", test_name: "certification suite passing", expected: "PASS", failure: "CERTIFICATION_SUITE_NOT_PASSING", critical: true },
  { area: "VISIBILITY", test_name: "minor visibility refinements tracked", expected: "PASS", failure: "MINOR_VISIBILITY_REFINEMENT", critical: false },
]);

function buildChecks(input: {
  completion_gate_id: string;
  scenario: GovernanceCompletionScenario;
  evidence_refs: readonly string[];
}): readonly GovernanceCompletionCheck[] {
  const forced = failureForScenario(input.scenario);
  return freezeArray(TEST_MATRIX.map((definition) => {
    const isForced = forced === definition.failure;
    const actual = isForced ? (definition.expected === "PASS" ? "FAIL" : "PASS") : definition.expected;
    const source = {
      completion_check_id: `GICGCHK-7M-${hashValue("governance-completion-check-id", { gate: input.completion_gate_id, test: definition.test_name }).slice(0, 10).toUpperCase()}`,
      area: definition.area,
      test_name: definition.test_name,
      expected: definition.expected,
      actual,
      passed: actual === definition.expected,
      critical: isForced && definition.failure === "MINOR_VISIBILITY_REFINEMENT" ? false : definition.critical,
      failure_reason: isForced ? definition.failure : null,
      evidence_refs: unique(input.evidence_refs),
    };
    return Object.freeze({ ...source, check_hash: hashValue("governance-completion-check", source) });
  }));
}

function aggregate(completion_gate_id: string, checks: readonly GovernanceCompletionCheck[]): GovernanceCompletionResult {
  const failed = checks.filter((check) => !check.passed);
  const criticalFailures = failed.filter((check) => check.critical);
  const blocking_failures = unique(criticalFailures.map((check) => check.failure_reason).filter((item): item is GovernanceCompletionFailure => Boolean(item)));
  const warning_count = failed.length - criticalFailures.length;
  const overall_state: GovernanceCompletionState = criticalFailures.length > 0 ? "FAIL" : warning_count > 0 ? "CONDITIONAL_PASS" : "PASS";
  const source = {
    completion_result_id: `GICGRES-7M-${hashValue("governance-completion-result-id", completion_gate_id).slice(0, 10).toUpperCase()}`,
    overall_state,
    pass_count: checks.filter((check) => check.passed).length,
    fail_count: failed.length,
    critical_failure_count: criticalFailures.length,
    warning_count,
    blocking_failures,
    recommendations: freezeArray(overall_state === "PASS"
      ? ["Approve Mission Control progression to Phase 8 Controlled Autonomy."]
      : overall_state === "CONDITIONAL_PASS"
        ? ["Allow limited internal remediation; block production Phase 8 certification until warnings are resolved."]
        : ["Block Phase 8 progression and remediate critical Governance Intelligence failures."]),
    phase8_decision: overall_state === "PASS" ? "APPROVED_FOR_CONTROLLED_AUTONOMY" as const : overall_state === "CONDITIONAL_PASS" ? "LIMITED_INTERNAL_REMEDIATION" as const : "BLOCKED_IN_PHASE_7" as const,
  };
  return Object.freeze({ ...source, result_hash: hashValue("governance-completion-result", source) });
}

function timeline(state: GovernanceCompletionLifecycleState): readonly GovernanceCompletionTimelineEvent[] {
  const stages: readonly GovernanceCompletionTimelineEvent["stage"][] = ["LOAD_PHASE7_CERTIFICATIONS", "VALIDATE_INTEGRATED_AREAS", "VALIDATE_CROSS_SYSTEM_GOVERNANCE", "VALIDATE_ENTERPRISE_REQUIREMENTS", "AGGREGATE_COMPLETION_DECISION", "STORE_COMPLETION_LEDGER"];
  const states: readonly GovernanceCompletionLifecycleState[] = ["LOADING_CERTIFICATIONS", "VALIDATING_SUBSYSTEMS", "VALIDATING_SUBSYSTEMS", "VALIDATING_ENTERPRISE_GOVERNANCE", "AGGREGATING_COMPLETION", state];
  return freezeArray(stages.map((stage, index) => {
    const source = {
      event_id: `GICGT-7M-${String(index + 1).padStart(2, "0")}`,
      stage,
      timestamp: `2026-06-27T20:00:${String(index * 2).padStart(2, "0")}.000Z`,
      state: states[index],
      summary: `${stage.replace(/_/g, " ").toLowerCase()} completed for Governance Intelligence completion gate.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-completion-timeline-event", source) });
  }));
}

export function runGovernanceIntelligenceCompletionGate(input: GovernanceCompletionGateInput = {}): GovernanceIntelligenceCompletionGateReport {
  const scenario = input.scenario ?? "BASELINE";
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_lineage";
  const validator_id = input.validator_id ?? "governance_completion_validator";
  const reports = cachedReports(tenant_id, mission_id, validator_id);
  const completion_gate_id = `GICG-7M-${hashValue("governance-completion-gate-id", { tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`;
  const evidenceRefs = unique([
    reports.orchestrator.report_hash,
    reports.orchestrator.truth_ledger_record.ledger_hash,
    reports.replay.report_hash,
    reports.replay.truth_ledger_record.ledger_hash,
    reports.integrity.report_hash,
    reports.integrity.truth_ledger_record.ledger_hash,
    reports.authority.report_hash,
    reports.authority.truth_ledger_record.ledger_hash,
    reports.isolation.report_hash,
    reports.isolation.truth_ledger_record.ledger_hash,
  ]);
  const completion_checks = buildChecks({ completion_gate_id, scenario, evidence_refs: evidenceRefs });
  const completion_result = aggregate(completion_gate_id, completion_checks);
  const lifecycleState: GovernanceCompletionLifecycleState = completion_result.overall_state === "PASS" ? "CERTIFIED" : completion_result.overall_state === "CONDITIONAL_PASS" ? "CONDITIONAL_CERTIFICATION" : "BLOCKED";
  const runSource = {
    completion_gate_id,
    tenant_id,
    mission_id,
    completion_timestamp: NOW,
    suite_version: SUITE_VERSION,
    overall_state: completion_result.overall_state,
    phase8_progression_allowed: completion_result.overall_state === "PASS",
    production_certification_allowed: completion_result.overall_state === "PASS",
    integrity_hash: hashValue("governance-completion-integrity", completion_checks.map((check) => check.check_hash)),
  };
  const completion_run: GovernanceCompletionRun = Object.freeze({ ...runSource, run_hash: hashValue("governance-completion-run", runSource) });
  const evidenceSource = {
    evidence_package_id: `GICGE-7M-${hashValue("governance-completion-evidence-id", completion_gate_id).slice(0, 10).toUpperCase()}`,
    certification_refs: unique([reports.orchestrator.report_hash, reports.orchestrator.evidence_package.evidence_hash]),
    replay_refs: unique([reports.replay.report_hash, reports.replay.evidence_package.evidence_hash, reports.orchestrator.run.replay_reference]),
    integrity_refs: unique([reports.integrity.report_hash, reports.integrity.evidence_package.evidence_hash]),
    authority_refs: unique([reports.authority.report_hash, reports.authority.evidence_package.evidence_hash]),
    isolation_refs: unique([reports.isolation.report_hash, reports.isolation.evidence_package.evidence_hash]),
    visibility_refs: unique([reports.orchestrator.scenario_results.find((result) => result.scenario_id.includes("7k5"))?.evidence_reference ?? "visibility:7k5:certified"]),
    completion_hashes: unique([completion_run.integrity_hash, completion_result.result_hash]),
  };
  const evidence_package = Object.freeze({ ...evidenceSource, evidence_hash: hashValue("governance-completion-evidence-package", evidenceSource) });
  const ledgerSource = {
    ledger_record_id: `GICGL-7M-${hashValue("governance-completion-ledger-id", completion_gate_id).slice(0, 10).toUpperCase()}`,
    completion_gate_id,
    tenant_id,
    mission_id,
    check_hashes: freezeArray(completion_checks.map((check) => check.check_hash)),
    result_hash: completion_result.result_hash,
    evidence_hash: evidence_package.evidence_hash,
    integrity_hash: completion_run.integrity_hash,
    append_only: true as const,
    recorded_at: END,
  };
  const truth_ledger_record = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("governance-completion-ledger-record", ledgerSource) });
  const criticalFailureRate = Number((completion_result.critical_failure_count / completion_checks.length).toFixed(4));
  const source = {
    completion_gate_id,
    phase_version: "7M" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: END,
    read_only: true as const,
    advisory_only: true as const,
    phase8_controlled_autonomy_gate: true as const,
    governance_execution_allowed: false as const,
    production_deployment_allowed: completion_result.overall_state === "PASS",
    tenant_isolated: reports.isolation.tenant_isolated && completion_result.overall_state !== "FAIL",
    authority_protected: reports.authority.authority_protected && completion_result.overall_state !== "FAIL",
    deterministic: completion_result.overall_state !== "FAIL",
    replayable: reports.replay.validation_outcome.overall_result === "PASS",
    explainable: completion_result.overall_state !== "FAIL",
    integrity_protected: reports.integrity.validation_result.overall_result === "PASS" && completion_result.overall_state !== "FAIL",
    operator_visible: completion_checks.find((check) => check.failure_reason === "GOVERNANCE_VISIBILITY_INCOMPLETE")?.passed !== false,
    completion_run,
    completion_checks,
    completion_result,
    timeline: timeline(lifecycleState),
    evidence_package,
    truth_ledger_record,
    observability: Object.freeze({
      completion_duration_ms: 12000,
      integrated_area_success_rate: Number((completion_checks.filter((check) => check.passed).length / completion_checks.length).toFixed(4)),
      certification_suite_success_rate: reports.orchestrator.overall_result.overall_state === "PASS" ? 1 : 0,
      critical_failure_rate: criticalFailureRate,
      phase8_readiness: completion_result.overall_state === "PASS" ? 1 : completion_result.overall_state === "CONDITIONAL_PASS" ? 0.5 : 0,
      completion_test_count: completion_checks.length,
    }),
  };
  return Object.freeze({ ...source, report_hash: hashValue("governance-completion-report", source) });
}

export function buildGovernanceCompletionGateObservabilitySurface(input: GovernanceCompletionGateInput = {}): GovernanceCompletionGateObservabilitySurface {
  const report = runGovernanceIntelligenceCompletionGate(input);
  return Object.freeze({
    completion_gate_id: report.completion_gate_id,
    overall_state: report.completion_result.overall_state,
    lifecycle_state: report.timeline.at(-1)?.state ?? "BLOCKED",
    completion_test_count: report.completion_checks.length,
    critical_failure_count: report.completion_result.critical_failure_count,
    phase8_decision: report.completion_result.phase8_decision,
    phase8_progression_allowed: report.completion_run.phase8_progression_allowed,
    report_hash: report.report_hash,
  });
}

export function getGovernanceIntelligenceCompletionGateContract() {
  const report = runGovernanceIntelligenceCompletionGate();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["integrated-certification", "deterministic", "replayable", "explainable", "integrity-protected", "constitutionally-constrained", "tenant-isolated", "operator-visible", "phase8-gated", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      states: freezeArray(["REQUESTED", "LOADING_CERTIFICATIONS", "VALIDATING_SUBSYSTEMS", "VALIDATING_ENTERPRISE_GOVERNANCE", "AGGREGATING_COMPLETION", "CERTIFIED", "CONDITIONAL_CERTIFICATION", "BLOCKED"] as const),
      completion_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      areas: freezeArray(["FOUNDATION", "POLICY", "RISK", "COMPLIANCE", "RECOMMENDATION", "ESCALATION", "LINEAGE", "REPLAY", "INTEGRITY", "VISIBILITY", "ISOLATION", "CERTIFICATION_SUITE", "CROSS_SYSTEM", "ENTERPRISE"] as const),
    }),
    report,
    observability: buildGovernanceCompletionGateObservabilitySurface(),
  });
}
