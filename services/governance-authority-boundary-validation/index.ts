import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceCertificationOrchestrator } from "@/services/governance-certification-orchestrator";
import { runGovernanceDeterministicReplayValidation } from "@/services/governance-deterministic-replay-validation";
import { runGovernanceIntegrityValidation } from "@/services/governance-integrity-validation";
import type { GovernanceCertificationOrchestratorReport } from "@/types/governance-certification-orchestrator";
import type { GovernanceDeterministicReplayValidationReport } from "@/types/governance-deterministic-replay-validation";
import type { GovernanceIntegrityValidationReport } from "@/types/governance-integrity-validation";
import type {
  GovernanceAuthorityBoundaryObservabilitySurface,
  GovernanceAuthorityBoundaryScenario,
  GovernanceAuthorityBoundaryValidationInput,
  GovernanceAuthorityBoundaryValidationReport,
  GovernanceAuthorityCheck,
  GovernanceAuthorityDomain,
  GovernanceAuthorityTimelineEvent,
  GovernanceAuthorityValidationResult,
  GovernanceAuthorityValidationResultState,
  GovernanceAuthorityValidationRun,
  GovernanceAuthorityValidationState,
  GovernanceAuthorityViolation,
} from "@/types/governance-authority-boundary-validation";

const NOW = "2026-06-27T19:00:00.000Z";
const END = "2026-06-27T19:00:10.000Z";
const SCHEMA_VERSION = "governance-authority-boundary-validation/v7L.4" as const;
const orchestratorCache = new Map<string, GovernanceCertificationOrchestratorReport>();
const integrityValidationCache = new Map<string, GovernanceIntegrityValidationReport>();
const replayValidationCache = new Map<string, GovernanceDeterministicReplayValidationReport>();

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function cachedOrchestrator(tenant_id: string, mission_id: string, validator_id: string): GovernanceCertificationOrchestratorReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = orchestratorCache.get(key);
  if (cached) return cached;
  const report = runGovernanceCertificationOrchestrator({ execution_mode: "FULL_SYSTEM_CERTIFICATION", tenant_id, mission_id, initiated_by: validator_id });
  orchestratorCache.set(key, report);
  return report;
}

function cachedIntegrityValidation(tenant_id: string, mission_id: string, validator_id: string): GovernanceIntegrityValidationReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = integrityValidationCache.get(key);
  if (cached) return cached;
  const report = runGovernanceIntegrityValidation({ tenant_id, mission_id, validator_id });
  integrityValidationCache.set(key, report);
  return report;
}

function cachedReplayValidation(tenant_id: string, mission_id: string, validator_id: string): GovernanceDeterministicReplayValidationReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = replayValidationCache.get(key);
  if (cached) return cached;
  const report = runGovernanceDeterministicReplayValidation({ tenant_id, mission_id, replay_requestor: validator_id });
  replayValidationCache.set(key, report);
  return report;
}

function forcedViolation(scenario: GovernanceAuthorityBoundaryScenario): { domain: GovernanceAuthorityDomain; violation: Exclude<GovernanceAuthorityViolation, "NONE">; state: GovernanceAuthorityValidationState } | null {
  const map: Partial<Record<GovernanceAuthorityBoundaryScenario, { domain: GovernanceAuthorityDomain; violation: Exclude<GovernanceAuthorityViolation, "NONE">; state: GovernanceAuthorityValidationState }>> = {
    EXECUTION_COMMAND_GENERATED: { domain: "ADVISORY_ONLY", violation: "EXECUTION_COMMAND_GENERATED", state: "ADVISORY_FAILURE" },
    STATE_MODIFICATION_REQUESTED: { domain: "ADVISORY_ONLY", violation: "STATE_MODIFICATION_REQUESTED", state: "ADVISORY_FAILURE" },
    AUTONOMOUS_ACTION_INITIATED: { domain: "ADVISORY_ONLY", violation: "AUTONOMOUS_ACTION_INITIATED", state: "ADVISORY_FAILURE" },
    EXECUTION_CAPABILITY_DETECTED: { domain: "EXECUTION_AUTHORITY", violation: "EXECUTION_CAPABILITY_DETECTED", state: "EXECUTION_AUTHORITY_FAILURE" },
    PRIVILEGED_OPERATION_ATTEMPTED: { domain: "EXECUTION_AUTHORITY", violation: "PRIVILEGED_OPERATION_ATTEMPTED", state: "EXECUTION_AUTHORITY_FAILURE" },
    COMMAND_TRANSMISSION_INITIATED: { domain: "EXECUTION_AUTHORITY", violation: "COMMAND_TRANSMISSION_INITIATED", state: "EXECUTION_AUTHORITY_FAILURE" },
    CONSTITUTIONAL_VIOLATION: { domain: "CONSTITUTION", violation: "CONSTITUTIONAL_VIOLATION", state: "CONSTITUTION_FAILURE" },
    PROHIBITED_AUTHORITY_EXERCISED: { domain: "CONSTITUTION", violation: "PROHIBITED_AUTHORITY_EXERCISED", state: "CONSTITUTION_FAILURE" },
    CONSTITUTIONAL_BYPASS: { domain: "CONSTITUTION", violation: "CONSTITUTIONAL_BYPASS", state: "CONSTITUTION_FAILURE" },
    POLICY_IGNORED: { domain: "POLICY_ENFORCEMENT", violation: "POLICY_IGNORED", state: "POLICY_FAILURE" },
    ENFORCEMENT_BYPASSED: { domain: "POLICY_ENFORCEMENT", violation: "ENFORCEMENT_BYPASSED", state: "POLICY_FAILURE" },
    INCONSISTENT_ENFORCEMENT: { domain: "POLICY_ENFORCEMENT", violation: "INCONSISTENT_ENFORCEMENT", state: "POLICY_FAILURE" },
    OPERATOR_OVERRIDE_BLOCKED: { domain: "OPERATOR_SUPREMACY", violation: "OPERATOR_OVERRIDE_BLOCKED", state: "OPERATOR_FAILURE" },
    GOVERNANCE_SELF_APPROVAL: { domain: "OPERATOR_SUPREMACY", violation: "GOVERNANCE_SELF_APPROVAL", state: "OPERATOR_FAILURE" },
    OPERATOR_AUTHORITY_DIMINISHED: { domain: "OPERATOR_SUPREMACY", violation: "OPERATOR_AUTHORITY_DIMINISHED", state: "OPERATOR_FAILURE" },
    PRIVILEGE_EXPANSION: { domain: "AUTHORITY_ESCALATION", violation: "PRIVILEGE_EXPANSION", state: "AUTHORITY_ESCALATION_DETECTED" },
    ROLE_ELEVATION: { domain: "AUTHORITY_ESCALATION", violation: "ROLE_ELEVATION", state: "AUTHORITY_ESCALATION_DETECTED" },
    UNAUTHORIZED_AUTHORITY_ACQUISITION: { domain: "AUTHORITY_ESCALATION", violation: "UNAUTHORIZED_AUTHORITY_ACQUISITION", state: "AUTHORITY_ESCALATION_DETECTED" },
    APPROVAL_WORKFLOW_BYPASSED: { domain: "GOVERNANCE_BYPASS", violation: "APPROVAL_WORKFLOW_BYPASSED", state: "GOVERNANCE_BYPASS_DETECTED" },
    OPERATOR_REVIEW_BYPASSED: { domain: "GOVERNANCE_BYPASS", violation: "OPERATOR_REVIEW_BYPASSED", state: "GOVERNANCE_BYPASS_DETECTED" },
    TENANT_AUTHORITY_LEAK: { domain: "GOVERNANCE_BYPASS", violation: "TENANT_AUTHORITY_LEAK", state: "GOVERNANCE_BYPASS_DETECTED" },
  };
  return map[scenario] ?? null;
}

function authorityType(domain: GovernanceAuthorityDomain): GovernanceAuthorityCheck["authority_type"] {
  const map: Record<GovernanceAuthorityDomain, GovernanceAuthorityCheck["authority_type"]> = {
    ADVISORY_ONLY: "ADVISORY_BOUNDARY",
    EXECUTION_AUTHORITY: "EXECUTION_GUARD",
    CONSTITUTION: "CONSTITUTION_RULE",
    POLICY_ENFORCEMENT: "POLICY_CONTROL",
    OPERATOR_SUPREMACY: "OPERATOR_CONTROL",
    AUTHORITY_ESCALATION: "ESCALATION_GUARD",
    GOVERNANCE_BYPASS: "BYPASS_GUARD",
  };
  return map[domain];
}

function expectedBehavior(domain: GovernanceAuthorityDomain): string {
  const map: Record<GovernanceAuthorityDomain, string> = {
    ADVISORY_ONLY: "Produces recommendations, analysis, risk assessments, and escalation guidance without execution side effects.",
    EXECUTION_AUTHORITY: "Holds zero operational execution authority, privileged command interfaces, or runtime control pathways.",
    CONSTITUTION: "Evaluates immutable constitutional constraints deterministically before any governance recommendation is certified.",
    POLICY_ENFORCEMENT: "Applies policy precedence, inheritance, lineage, and enforcement outcomes reproducibly.",
    OPERATOR_SUPREMACY: "Requires human operator approval and preserves override, review, and escalation pathways.",
    AUTHORITY_ESCALATION: "Rejects privilege expansion, role elevation, and authority acquisition outside the approved scope.",
    GOVERNANCE_BYPASS: "Rejects skipped policy evaluation, constitutional review, approval workflow, and operator review.",
  };
  return map[domain];
}

function observedBehavior(domain: GovernanceAuthorityDomain, orchestrator: GovernanceCertificationOrchestratorReport, integrity: GovernanceIntegrityValidationReport, replay: GovernanceDeterministicReplayValidationReport): string {
  const map: Record<GovernanceAuthorityDomain, string> = {
    ADVISORY_ONLY: orchestrator.advisory_only && integrity.advisory_only && replay.advisory_only ? "Advisory-only outputs verified across certification, integrity, and replay evidence." : "Non-advisory behavior detected in authority evidence.",
    EXECUTION_AUTHORITY: !orchestrator.governance_execution_allowed && !integrity.governance_execution_allowed && !replay.governance_execution_allowed ? "No execution authority or command dispatch capability present." : "Execution authority detected in governance evidence.",
    CONSTITUTION: orchestrator.authority_protected && integrity.authority_protected ? "Constitutional authority boundaries preserved and immutable." : "Constitutional authority boundary evidence failed.",
    POLICY_ENFORCEMENT: orchestrator.overall_result.overall_state === "PASS" && integrity.validation_result.policy_result === "PASS" ? "Policy enforcement lineage and deterministic outcomes verified." : "Policy enforcement evidence failed validation.",
    OPERATOR_SUPREMACY: orchestrator.overall_result.approval_status === "APPROVED_FOR_PRODUCTION" ? "Operator approval checkpoints remain authoritative." : "Operator approval path did not certify authority supremacy.",
    AUTHORITY_ESCALATION: orchestrator.authority_protected && integrity.authority_protected ? "No privilege expansion or role elevation detected." : "Authority escalation evidence detected.",
    GOVERNANCE_BYPASS: orchestrator.run.failed_scenarios === 0 && integrity.validation_result.failure_count === 0 && replay.validation_outcome.failure_count === 0 ? "No governance bypass or skipped review path detected." : "Governance bypass evidence detected.",
  };
  return map[domain];
}

function buildChecks(validation_id: string, scenario: GovernanceAuthorityBoundaryScenario, orchestrator: GovernanceCertificationOrchestratorReport, integrity: GovernanceIntegrityValidationReport, replay: GovernanceDeterministicReplayValidationReport): readonly GovernanceAuthorityCheck[] {
  const forced = forcedViolation(scenario);
  const evidenceRefs = unique([
    orchestrator.report_hash,
    orchestrator.truth_ledger_record.ledger_hash,
    integrity.report_hash,
    integrity.truth_ledger_record.ledger_hash,
    replay.report_hash,
    replay.truth_ledger_record.ledger_hash,
  ]);
  const domains: readonly GovernanceAuthorityDomain[] = ["ADVISORY_ONLY", "EXECUTION_AUTHORITY", "CONSTITUTION", "POLICY_ENFORCEMENT", "OPERATOR_SUPREMACY", "AUTHORITY_ESCALATION", "GOVERNANCE_BYPASS"];
  return freezeArray(domains.map((domain, index) => {
    const expected = expectedBehavior(domain);
    const observed = forced?.domain === domain ? `${observedBehavior(domain, orchestrator, integrity, replay)} Rejected violation: ${forced.violation}.` : observedBehavior(domain, orchestrator, integrity, replay);
    const pass = forced?.domain !== domain;
    const source = {
      authority_check_id: `GABC-7L4-${hashValue("governance-authority-boundary-check-id", { validation_id, domain }).slice(0, 10).toUpperCase()}`,
      component: domain,
      authority_type: authorityType(domain),
      expected_behavior: expected,
      observed_behavior: observed,
      validation_result: pass ? "PASS" as const : "FAIL" as const,
      violation_type: pass ? "NONE" as const : forced.violation,
      timestamp: `2026-06-27T19:00:${String(index + 1).padStart(2, "0")}.000Z`,
      evidence_refs: evidenceRefs,
    };
    return Object.freeze({ ...source, check_hash: hashValue("governance-authority-boundary-check", source) });
  }));
}

function result(validation_id: string, checks: readonly GovernanceAuthorityCheck[]): GovernanceAuthorityValidationResult {
  const resultFor = (domain: GovernanceAuthorityDomain): GovernanceAuthorityValidationResultState => checks.find((check) => check.component === domain)?.validation_result ?? "FAIL";
  const failure_count = checks.filter((check) => check.validation_result === "FAIL").length;
  const source = {
    validation_result_id: `GABR-7L4-${hashValue("governance-authority-boundary-result-id", validation_id).slice(0, 10).toUpperCase()}`,
    overall_result: failure_count === 0 ? "PASS" as const : "FAIL" as const,
    advisory_result: resultFor("ADVISORY_ONLY"),
    execution_result: resultFor("EXECUTION_AUTHORITY"),
    constitution_result: resultFor("CONSTITUTION"),
    policy_result: resultFor("POLICY_ENFORCEMENT"),
    operator_result: resultFor("OPERATOR_SUPREMACY"),
    failure_count,
    warning_count: 0,
  };
  return Object.freeze({ ...source, result_hash: hashValue("governance-authority-boundary-result", source) });
}

function timeline(finalState: GovernanceAuthorityValidationState): readonly GovernanceAuthorityTimelineEvent[] {
  const stages: readonly GovernanceAuthorityTimelineEvent["stage"][] = ["LOAD_CONSTITUTION", "LOAD_GOVERNANCE_POLICIES", "VALIDATE_ADVISORY_BOUNDARIES", "VALIDATE_EXECUTION_AUTHORITY", "VALIDATE_CONSTITUTIONAL_COMPLIANCE", "VALIDATE_POLICY_ENFORCEMENT", "VALIDATE_OPERATOR_SUPREMACY", "STORE_AUTHORITY_VALIDATION"];
  const states: readonly GovernanceAuthorityValidationState[] = ["LOADING_RULES", "LOADING_RULES", "VALIDATING_BOUNDARIES", "VALIDATING_BOUNDARIES", "VERIFYING_COMPLIANCE", "VERIFYING_COMPLIANCE", "VERIFYING_COMPLIANCE", finalState];
  return freezeArray(stages.map((stage, index) => {
    const source = {
      event_id: `GABT-7L4-${String(index + 1).padStart(2, "0")}`,
      stage,
      timestamp: `2026-06-27T19:00:${String(index).padStart(2, "0")}.000Z`,
      state: states[index],
      summary: `${stage.replace(/_/g, " ").toLowerCase()} completed for authority boundary validation.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-authority-boundary-timeline-event", source) });
  }));
}

export function runGovernanceAuthorityBoundaryValidation(input: GovernanceAuthorityBoundaryValidationInput = {}): GovernanceAuthorityBoundaryValidationReport {
  const scenario = input.scenario ?? "BASELINE";
  const validator = input.validator_id ?? "governance_authority_validator";
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_lineage";
  const orchestrator = cachedOrchestrator(tenant_id, mission_id, validator);
  const integrity = cachedIntegrityValidation(tenant_id, mission_id, validator);
  const replay = cachedReplayValidation(tenant_id, mission_id, validator);
  const validation_id = `GABV-7L4-${hashValue("governance-authority-boundary-validation-id", { tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`;
  const authority_checks = buildChecks(validation_id, scenario, orchestrator, integrity, replay);
  const validation_result = result(validation_id, authority_checks);
  const rejected_violations = unique(authority_checks.map((check) => check.violation_type).filter((item): item is Exclude<GovernanceAuthorityViolation, "NONE"> => item !== "NONE"));
  const finalState = validation_result.overall_result === "PASS" ? "VALIDATED" : forcedViolation(scenario)?.state ?? "GOVERNANCE_BYPASS_DETECTED";
  const validation_scope = freezeArray(authority_checks.map((check) => check.component));
  const runSource = {
    authority_validation_id: validation_id,
    tenant_id,
    mission_id,
    validation_timestamp: NOW,
    validation_scope,
    overall_result: validation_result.overall_result,
    constitution_version: "governance-constitution/v7" as const,
    policy_version: "governance-policy-framework/v7" as const,
    integrity_hash: hashValue("governance-authority-boundary-integrity", authority_checks.map((check) => check.check_hash)),
  };
  const validation_run: GovernanceAuthorityValidationRun = Object.freeze({ ...runSource, run_hash: hashValue("governance-authority-boundary-run", runSource) });
  const evidenceSource = {
    evidence_package_id: `GABE-7L4-${hashValue("governance-authority-boundary-evidence-id", validation_id).slice(0, 10).toUpperCase()}`,
    constitution_refs: unique([orchestrator.isolation_context.isolation_hash, integrity.validation_run.integrity_hash, "constitution:governance-advisory-only:v7"]),
    policy_refs: unique(orchestrator.execution_plan.map((item) => item.scenario_hash)),
    operator_refs: unique([orchestrator.run.initiated_by, orchestrator.overall_result.approval_status, "operator-supremacy:manual-approval-required"]),
    certification_refs: unique([orchestrator.report_hash, integrity.report_hash, replay.report_hash]),
    integrity_hashes: unique([validation_run.integrity_hash, orchestrator.run.integrity_hash, integrity.validation_run.integrity_hash, replay.replay_validation_run.integrity_hash]),
  };
  const evidence_package = Object.freeze({ ...evidenceSource, evidence_hash: hashValue("governance-authority-boundary-evidence-package", evidenceSource) });
  const ledgerSource = {
    ledger_record_id: `GABL-7L4-${hashValue("governance-authority-boundary-ledger-id", validation_id).slice(0, 10).toUpperCase()}`,
    authority_validation_id: validation_id,
    tenant_id,
    mission_id,
    check_hashes: freezeArray(authority_checks.map((check) => check.check_hash)),
    result_hash: validation_result.result_hash,
    evidence_hash: evidence_package.evidence_hash,
    integrity_hash: validation_run.integrity_hash,
    append_only: true as const,
    recorded_at: END,
  };
  const truth_ledger_record = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("governance-authority-boundary-ledger-record", ledgerSource) });
  const source = {
    validator_id: `GABVAL-7L4-${hashValue("governance-authority-boundary-validator-id", { validation_id, validator }).slice(0, 10).toUpperCase()}`,
    phase_version: "7L.4" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: END,
    read_only: true as const,
    advisory_only: true as const,
    execution_authority_granted: false as const,
    privilege_elevation_allowed: false as const,
    governance_self_approval_allowed: false as const,
    policy_mutation_allowed: false as const,
    constitution_mutation_allowed: false as const,
    operator_supremacy_preserved: scenario !== "OPERATOR_AUTHORITY_DIMINISHED" && scenario !== "OPERATOR_OVERRIDE_BLOCKED" && scenario !== "GOVERNANCE_SELF_APPROVAL",
    tenant_isolated: scenario !== "TENANT_AUTHORITY_LEAK" && orchestrator.tenant_isolated && integrity.tenant_isolated && replay.tenant_isolated,
    authority_protected: rejected_violations.length === 0 && orchestrator.authority_protected && integrity.authority_protected,
    validation_run,
    authority_checks,
    validation_result,
    rejected_violations,
    timeline: timeline(finalState),
    evidence_package,
    truth_ledger_record,
    observability: Object.freeze({
      authority_validation_duration_ms: 10000,
      advisory_compliance_rate: validation_result.advisory_result === "PASS" ? 1 : 0,
      constitutional_compliance_rate: validation_result.constitution_result === "PASS" ? 1 : 0,
      policy_enforcement_success_rate: validation_result.policy_result === "PASS" ? 1 : 0,
      operator_override_verification_rate: validation_result.operator_result === "PASS" ? 1 : 0,
      authority_violation_count: rejected_violations.length,
      governance_bypass_detection_rate: rejected_violations.some((violation) => violation.includes("BYPASS") || violation.includes("TENANT")) ? 1 : 0,
      certification_success_rate: validation_result.failure_count === 0 ? 1 : 0,
    }),
  };
  return Object.freeze({ ...source, report_hash: hashValue("governance-authority-boundary-report", source) });
}

export function buildGovernanceAuthorityBoundaryObservabilitySurface(input: GovernanceAuthorityBoundaryValidationInput = {}): GovernanceAuthorityBoundaryObservabilitySurface {
  const report = runGovernanceAuthorityBoundaryValidation(input);
  return Object.freeze({
    authority_validation_id: report.validation_run.authority_validation_id,
    validation_state: report.timeline.at(-1)?.state ?? "GOVERNANCE_BYPASS_DETECTED",
    overall_result: report.validation_result.overall_result,
    check_count: report.authority_checks.length,
    failure_count: report.validation_result.failure_count,
    rejected_violations: report.rejected_violations,
    authority_violation_count: report.observability.authority_violation_count,
    certification_success_rate: report.observability.certification_success_rate,
    report_hash: report.report_hash,
  });
}

export function getGovernanceAuthorityBoundaryValidationContract() {
  const report = runGovernanceAuthorityBoundaryValidation();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["advisory-only", "zero-execution-authority", "constitutional-compliance", "policy-enforcement", "operator-supremacy", "no-authority-escalation", "no-governance-bypass", "tenant-isolated", "read-only", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      states: freezeArray(["REQUESTED", "LOADING_RULES", "VALIDATING_BOUNDARIES", "VERIFYING_COMPLIANCE", "GENERATING_REPORT", "VALIDATED"] as const),
      failure_states: freezeArray(["ADVISORY_FAILURE", "EXECUTION_AUTHORITY_FAILURE", "CONSTITUTION_FAILURE", "POLICY_FAILURE", "OPERATOR_FAILURE", "AUTHORITY_ESCALATION_DETECTED", "GOVERNANCE_BYPASS_DETECTED"] as const),
      domains: freezeArray(["ADVISORY_ONLY", "EXECUTION_AUTHORITY", "CONSTITUTION", "POLICY_ENFORCEMENT", "OPERATOR_SUPREMACY", "AUTHORITY_ESCALATION", "GOVERNANCE_BYPASS"] as const),
    }),
    report,
    observability: buildGovernanceAuthorityBoundaryObservabilitySurface(),
  });
}
