import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceAuthorityBoundaryValidation } from "@/services/governance-authority-boundary-validation";
import { runGovernanceCertificationOrchestrator } from "@/services/governance-certification-orchestrator";
import { runGovernanceDeterministicReplayValidation } from "@/services/governance-deterministic-replay-validation";
import { runGovernanceIntegrityValidation } from "@/services/governance-integrity-validation";
import type { GovernanceAuthorityBoundaryValidationReport } from "@/types/governance-authority-boundary-validation";
import type { GovernanceCertificationOrchestratorReport } from "@/types/governance-certification-orchestrator";
import type { GovernanceDeterministicReplayValidationReport } from "@/types/governance-deterministic-replay-validation";
import type { GovernanceIntegrityValidationReport } from "@/types/governance-integrity-validation";
import type {
  GovernanceIsolationCheck,
  GovernanceIsolationDomain,
  GovernanceIsolationObservabilitySurface,
  GovernanceIsolationScenario,
  GovernanceIsolationTimelineEvent,
  GovernanceIsolationValidationInput,
  GovernanceIsolationValidationReport,
  GovernanceIsolationValidationResult,
  GovernanceIsolationValidationResultState,
  GovernanceIsolationValidationRun,
  GovernanceIsolationValidationState,
  GovernanceIsolationViolation,
} from "@/types/governance-isolation-validation";

const NOW = "2026-06-27T19:30:00.000Z";
const END = "2026-06-27T19:30:10.000Z";
const SCHEMA_VERSION = "governance-isolation-validation/v7L.5" as const;
const orchestratorCache = new Map<string, GovernanceCertificationOrchestratorReport>();
const replayCache = new Map<string, GovernanceDeterministicReplayValidationReport>();
const integrityCache = new Map<string, GovernanceIntegrityValidationReport>();
const authorityCache = new Map<string, GovernanceAuthorityBoundaryValidationReport>();

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
  const report = runGovernanceCertificationOrchestrator({ tenant_id, mission_id, initiated_by: validator_id, execution_mode: "FULL_SYSTEM_CERTIFICATION" });
  orchestratorCache.set(key, report);
  return report;
}

function cachedReplay(tenant_id: string, mission_id: string, validator_id: string): GovernanceDeterministicReplayValidationReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = replayCache.get(key);
  if (cached) return cached;
  const report = runGovernanceDeterministicReplayValidation({ tenant_id, mission_id, replay_requestor: validator_id });
  replayCache.set(key, report);
  return report;
}

function cachedIntegrity(tenant_id: string, mission_id: string, validator_id: string): GovernanceIntegrityValidationReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = integrityCache.get(key);
  if (cached) return cached;
  const report = runGovernanceIntegrityValidation({ tenant_id, mission_id, validator_id });
  integrityCache.set(key, report);
  return report;
}

function cachedAuthority(tenant_id: string, mission_id: string, validator_id: string): GovernanceAuthorityBoundaryValidationReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = authorityCache.get(key);
  if (cached) return cached;
  const report = runGovernanceAuthorityBoundaryValidation({ tenant_id, mission_id, validator_id });
  authorityCache.set(key, report);
  return report;
}

function forcedViolation(scenario: GovernanceIsolationScenario): { domain: GovernanceIsolationDomain; violation: Exclude<GovernanceIsolationViolation, "NONE">; state: GovernanceIsolationValidationState } | null {
  const map: Partial<Record<GovernanceIsolationScenario, { domain: GovernanceIsolationDomain; violation: Exclude<GovernanceIsolationViolation, "NONE">; state: GovernanceIsolationValidationState }>> = {
    TENANT_MISMATCH: { domain: "TENANT_BOUNDARY", violation: "TENANT_MISMATCH", state: "TENANT_BOUNDARY_FAILURE" },
    CROSS_TENANT_RECORD_REFERENCE: { domain: "TENANT_BOUNDARY", violation: "CROSS_TENANT_RECORD_REFERENCE", state: "CROSS_TENANT_ACCESS_DETECTED" },
    UNAUTHORIZED_TENANT_ACCESS: { domain: "TENANT_BOUNDARY", violation: "UNAUTHORIZED_TENANT_ACCESS", state: "CROSS_TENANT_ACCESS_DETECTED" },
    SHARED_GOVERNANCE_STATE: { domain: "GOVERNANCE_SEPARATION", violation: "SHARED_GOVERNANCE_STATE", state: "GOVERNANCE_ISOLATION_FAILURE" },
    POLICY_CONTAMINATION: { domain: "GOVERNANCE_SEPARATION", violation: "POLICY_CONTAMINATION", state: "GOVERNANCE_ISOLATION_FAILURE" },
    GOVERNANCE_STATE_LEAKAGE: { domain: "GOVERNANCE_SEPARATION", violation: "GOVERNANCE_STATE_LEAKAGE", state: "GOVERNANCE_ISOLATION_FAILURE" },
    REPLAY_DATA_LEAKAGE: { domain: "REPLAY_ISOLATION", violation: "REPLAY_DATA_LEAKAGE", state: "REPLAY_ISOLATION_FAILURE" },
    CROSS_TENANT_REPLAY_RECONSTRUCTION: { domain: "REPLAY_ISOLATION", violation: "CROSS_TENANT_REPLAY_RECONSTRUCTION", state: "CROSS_TENANT_ACCESS_DETECTED" },
    SHARED_REPLAY_HISTORY: { domain: "REPLAY_ISOLATION", violation: "SHARED_REPLAY_HISTORY", state: "REPLAY_ISOLATION_FAILURE" },
    SHARED_RECOMMENDATIONS: { domain: "RECOMMENDATION_ISOLATION", violation: "SHARED_RECOMMENDATIONS", state: "RECOMMENDATION_ISOLATION_FAILURE" },
    RECOMMENDATION_VISIBILITY_LEAK: { domain: "RECOMMENDATION_ISOLATION", violation: "RECOMMENDATION_VISIBILITY_LEAK", state: "RECOMMENDATION_ISOLATION_FAILURE" },
    RECOMMENDATION_OWNERSHIP_MISMATCH: { domain: "RECOMMENDATION_ISOLATION", violation: "RECOMMENDATION_OWNERSHIP_MISMATCH", state: "RECOMMENDATION_ISOLATION_FAILURE" },
    SHARED_EVIDENCE: { domain: "EVIDENCE_ISOLATION", violation: "SHARED_EVIDENCE", state: "EVIDENCE_ISOLATION_FAILURE" },
    UNAUTHORIZED_EVIDENCE_REFERENCE: { domain: "EVIDENCE_ISOLATION", violation: "UNAUTHORIZED_EVIDENCE_REFERENCE", state: "EVIDENCE_ISOLATION_FAILURE" },
    EVIDENCE_LEAKAGE: { domain: "EVIDENCE_ISOLATION", violation: "EVIDENCE_LEAKAGE", state: "EVIDENCE_ISOLATION_FAILURE" },
    UNAUTHORIZED_DASHBOARD_VISIBILITY: { domain: "VISIBILITY_CONTROL", violation: "UNAUTHORIZED_DASHBOARD_VISIBILITY", state: "VISIBILITY_FAILURE" },
    UNAUTHORIZED_SEARCH_RESULT: { domain: "VISIBILITY_CONTROL", violation: "UNAUTHORIZED_SEARCH_RESULT", state: "VISIBILITY_FAILURE" },
    UNAUTHORIZED_LINEAGE_VIEW: { domain: "VISIBILITY_CONTROL", violation: "UNAUTHORIZED_LINEAGE_VIEW", state: "VISIBILITY_FAILURE" },
    UNAUTHORIZED_RECOMMENDATION_VISIBILITY: { domain: "VISIBILITY_CONTROL", violation: "UNAUTHORIZED_RECOMMENDATION_VISIBILITY", state: "VISIBILITY_FAILURE" },
    UNAUTHORIZED_EVIDENCE_INSPECTION: { domain: "VISIBILITY_CONTROL", violation: "UNAUTHORIZED_EVIDENCE_INSPECTION", state: "VISIBILITY_FAILURE" },
  };
  return map[scenario] ?? null;
}

function validationType(domain: GovernanceIsolationDomain): GovernanceIsolationCheck["validation_type"] {
  const map: Record<GovernanceIsolationDomain, GovernanceIsolationCheck["validation_type"]> = {
    TENANT_BOUNDARY: "TENANT_BOUNDARY",
    GOVERNANCE_SEPARATION: "GOVERNANCE_CONTEXT",
    REPLAY_ISOLATION: "REPLAY_SCOPE",
    RECOMMENDATION_ISOLATION: "RECOMMENDATION_SCOPE",
    EVIDENCE_ISOLATION: "EVIDENCE_SCOPE",
    VISIBILITY_CONTROL: "VISIBILITY_SCOPE",
  };
  return map[domain];
}

function resourceIdentifier(domain: GovernanceIsolationDomain, tenant_id: string, mission_id: string): string {
  return `${tenant_id}:${mission_id}:${domain.toLowerCase()}`;
}

function observedScope(domain: GovernanceIsolationDomain, tenant_id: string, mission_id: string, orchestrator: GovernanceCertificationOrchestratorReport, replay: GovernanceDeterministicReplayValidationReport, integrity: GovernanceIntegrityValidationReport, authority: GovernanceAuthorityBoundaryValidationReport): string {
  const scope = `${tenant_id}:${mission_id}`;
  const map: Record<GovernanceIsolationDomain, string> = {
    TENANT_BOUNDARY: orchestrator.isolation_context.tenant_id === tenant_id && replay.replay_validation_run.tenant_id === tenant_id && integrity.validation_run.tenant_id === tenant_id && authority.validation_run.tenant_id === tenant_id ? scope : "cross-tenant",
    GOVERNANCE_SEPARATION: orchestrator.isolation_context.isolated_governance_state && orchestrator.tenant_isolated && integrity.tenant_isolated ? scope : "shared-governance-state",
    REPLAY_ISOLATION: orchestrator.isolation_context.isolated_replay_state && replay.tenant_isolated && replay.replay_lineage_preserved ? scope : "shared-replay-state",
    RECOMMENDATION_ISOLATION: replay.comparisons.find((item) => item.component === "RECOMMENDATION")?.comparison_result === "PASS" ? scope : "shared-recommendations",
    EVIDENCE_ISOLATION: orchestrator.isolation_context.isolated_evidence_cache && integrity.validation_result.evidence_result === "PASS" && replay.evidence_package.evidence_hash ? scope : "shared-evidence",
    VISIBILITY_CONTROL: authority.tenant_isolated && authority.authority_protected ? scope : "unauthorized-visibility",
  };
  return map[domain];
}

function buildChecks(
  validation_id: string,
  scenario: GovernanceIsolationScenario,
  tenant_id: string,
  mission_id: string,
  orchestrator: GovernanceCertificationOrchestratorReport,
  replay: GovernanceDeterministicReplayValidationReport,
  integrity: GovernanceIntegrityValidationReport,
  authority: GovernanceAuthorityBoundaryValidationReport,
): readonly GovernanceIsolationCheck[] {
  const forced = forcedViolation(scenario);
  const expected_scope = `${tenant_id}:${mission_id}`;
  const evidenceRefs = unique([
    orchestrator.report_hash,
    orchestrator.truth_ledger_record.ledger_hash,
    replay.report_hash,
    replay.truth_ledger_record.ledger_hash,
    integrity.report_hash,
    integrity.truth_ledger_record.ledger_hash,
    authority.report_hash,
    authority.truth_ledger_record.ledger_hash,
  ]);
  const domains: readonly GovernanceIsolationDomain[] = ["TENANT_BOUNDARY", "GOVERNANCE_SEPARATION", "REPLAY_ISOLATION", "RECOMMENDATION_ISOLATION", "EVIDENCE_ISOLATION", "VISIBILITY_CONTROL"];
  return freezeArray(domains.map((domain, index) => {
    const shouldFail = forced?.domain === domain;
    const observed = shouldFail ? `${expected_scope}:isolation-violation:${forced.violation}` : observedScope(domain, tenant_id, mission_id, orchestrator, replay, integrity, authority);
    const source = {
      isolation_check_id: `GISOCHK-7L5-${hashValue("governance-isolation-check-id", { validation_id, domain }).slice(0, 10).toUpperCase()}`,
      component: domain,
      validation_type: validationType(domain),
      resource_identifier: resourceIdentifier(domain, tenant_id, mission_id),
      expected_scope,
      observed_scope: observed,
      validation_result: observed === expected_scope ? "PASS" as const : "FAIL" as const,
      violation_type: observed === expected_scope ? "NONE" as const : forced?.violation ?? "TENANT_MISMATCH" as const,
      timestamp: `2026-06-27T19:30:${String(index + 1).padStart(2, "0")}.000Z`,
      evidence_refs: evidenceRefs,
    };
    return Object.freeze({ ...source, check_hash: hashValue("governance-isolation-check", source) });
  }));
}

function result(validation_id: string, checks: readonly GovernanceIsolationCheck[]): GovernanceIsolationValidationResult {
  const resultFor = (domain: GovernanceIsolationDomain): GovernanceIsolationValidationResultState => checks.find((check) => check.component === domain)?.validation_result ?? "FAIL";
  const failure_count = checks.filter((check) => check.validation_result === "FAIL").length;
  const source = {
    validation_result_id: `GISOR-7L5-${hashValue("governance-isolation-result-id", validation_id).slice(0, 10).toUpperCase()}`,
    overall_result: failure_count === 0 ? "PASS" as const : "FAIL" as const,
    tenant_boundary_result: resultFor("TENANT_BOUNDARY"),
    governance_result: resultFor("GOVERNANCE_SEPARATION"),
    replay_result: resultFor("REPLAY_ISOLATION"),
    recommendation_result: resultFor("RECOMMENDATION_ISOLATION"),
    evidence_result: resultFor("EVIDENCE_ISOLATION"),
    visibility_result: resultFor("VISIBILITY_CONTROL"),
    failure_count,
    warning_count: 0,
  };
  return Object.freeze({ ...source, result_hash: hashValue("governance-isolation-result", source) });
}

function timeline(finalState: GovernanceIsolationValidationState): readonly GovernanceIsolationTimelineEvent[] {
  const stages: readonly GovernanceIsolationTimelineEvent["stage"][] = ["LOAD_TENANT_CONTEXT", "VALIDATE_TENANT_BOUNDARIES", "VALIDATE_GOVERNANCE_SEPARATION", "VALIDATE_REPLAY_ISOLATION", "VALIDATE_RECOMMENDATION_ISOLATION", "VALIDATE_EVIDENCE_ISOLATION", "EVALUATE_VISIBILITY_CONTROLS", "STORE_ISOLATION_VALIDATION"];
  const states: readonly GovernanceIsolationValidationState[] = ["LOADING_CONTEXT", "VALIDATING_BOUNDARIES", "VERIFYING_ISOLATION", "VERIFYING_ISOLATION", "VERIFYING_ISOLATION", "VERIFYING_ISOLATION", "VALIDATING_VISIBILITY", finalState];
  return freezeArray(stages.map((stage, index) => {
    const source = {
      event_id: `GISOT-7L5-${String(index + 1).padStart(2, "0")}`,
      stage,
      timestamp: `2026-06-27T19:30:${String(index).padStart(2, "0")}.000Z`,
      state: states[index],
      summary: `${stage.replace(/_/g, " ").toLowerCase()} completed for isolation validation.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-isolation-timeline-event", source) });
  }));
}

export function runGovernanceIsolationValidation(input: GovernanceIsolationValidationInput = {}): GovernanceIsolationValidationReport {
  const scenario = input.scenario ?? "BASELINE";
  const validator = input.validator_id ?? "governance_isolation_validator";
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_lineage";
  const orchestrator = cachedOrchestrator(tenant_id, mission_id, validator);
  const replay = cachedReplay(tenant_id, mission_id, validator);
  const integrity = cachedIntegrity(tenant_id, mission_id, validator);
  const authority = cachedAuthority(tenant_id, mission_id, validator);
  const validation_id = `GISO-7L5-${hashValue("governance-isolation-validation-id", { tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`;
  const isolation_checks = buildChecks(validation_id, scenario, tenant_id, mission_id, orchestrator, replay, integrity, authority);
  const validation_result = result(validation_id, isolation_checks);
  const rejected_violations = unique(isolation_checks.map((check) => check.violation_type).filter((item): item is Exclude<GovernanceIsolationViolation, "NONE"> => item !== "NONE"));
  const finalState = validation_result.overall_result === "PASS" ? "VALIDATED" : forcedViolation(scenario)?.state ?? "CROSS_TENANT_ACCESS_DETECTED";
  const tenantContextSource = {
    tenant_id,
    mission_id,
    isolated_runtime: true as const,
    isolated_governance_state: true as const,
    isolated_replay_state: true as const,
    isolated_evidence_cache: true as const,
  };
  const tenant_context = Object.freeze({ ...tenantContextSource, tenant_context_hash: hashValue("governance-isolation-tenant-context", tenantContextSource) });
  const validation_scope = freezeArray(isolation_checks.map((check) => check.component));
  const runSource = {
    isolation_validation_id: validation_id,
    tenant_id,
    mission_id,
    validation_timestamp: NOW,
    validation_scope,
    overall_result: validation_result.overall_result,
    tenant_context,
    integrity_hash: hashValue("governance-isolation-integrity", isolation_checks.map((check) => check.check_hash)),
  };
  const validation_run: GovernanceIsolationValidationRun = Object.freeze({ ...runSource, run_hash: hashValue("governance-isolation-run", runSource) });
  const evidenceSource = {
    evidence_package_id: `GISOE-7L5-${hashValue("governance-isolation-evidence-id", validation_id).slice(0, 10).toUpperCase()}`,
    tenant_refs: unique([tenant_context.tenant_context_hash, orchestrator.isolation_context.isolation_hash, authority.validation_run.authority_validation_id]),
    governance_refs: unique([orchestrator.run.run_hash, integrity.validation_run.run_hash, orchestrator.truth_ledger_record.ledger_hash]),
    replay_refs: unique([replay.replay_validation_run.run_hash, replay.truth_ledger_record.ledger_hash, orchestrator.run.replay_reference]),
    recommendation_refs: unique(replay.comparisons.filter((item) => item.component === "RECOMMENDATION").map((item) => item.comparison_hash)),
    evidence_refs: unique([orchestrator.evidence_package.evidence_hash, integrity.evidence_package.evidence_hash, replay.evidence_package.evidence_hash, authority.evidence_package.evidence_hash]),
    visibility_refs: unique([authority.report_hash, authority.truth_ledger_record.ledger_hash, "visibility:tenant-scoped:operator-authorized"]),
    integrity_hashes: unique([validation_run.integrity_hash, orchestrator.run.integrity_hash, replay.replay_validation_run.integrity_hash, integrity.validation_run.integrity_hash, authority.validation_run.integrity_hash]),
  };
  const evidence_package = Object.freeze({ ...evidenceSource, evidence_hash: hashValue("governance-isolation-evidence-package", evidenceSource) });
  const ledgerSource = {
    ledger_record_id: `GISOL-7L5-${hashValue("governance-isolation-ledger-id", validation_id).slice(0, 10).toUpperCase()}`,
    isolation_validation_id: validation_id,
    tenant_id,
    mission_id,
    check_hashes: freezeArray(isolation_checks.map((check) => check.check_hash)),
    result_hash: validation_result.result_hash,
    evidence_hash: evidence_package.evidence_hash,
    integrity_hash: validation_run.integrity_hash,
    append_only: true as const,
    recorded_at: END,
  };
  const truth_ledger_record = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("governance-isolation-ledger-record", ledgerSource) });
  const source = {
    validator_id: `GISOVAL-7L5-${hashValue("governance-isolation-validator-id", { validation_id, validator }).slice(0, 10).toUpperCase()}`,
    phase_version: "7L.5" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: END,
    read_only: true as const,
    advisory_only: true as const,
    tenant_data_mutation_allowed: false as const,
    ownership_mutation_allowed: false as const,
    authorization_bypass_allowed: false as const,
    protected_information_exposure_allowed: false as const,
    governance_execution_allowed: false as const,
    tenant_isolated: rejected_violations.length === 0 && orchestrator.tenant_isolated && replay.tenant_isolated && integrity.tenant_isolated && authority.tenant_isolated,
    authority_protected: rejected_violations.length === 0 && authority.authority_protected && integrity.authority_protected,
    validation_run,
    isolation_checks,
    validation_result,
    rejected_violations,
    timeline: timeline(finalState),
    evidence_package,
    truth_ledger_record,
    observability: Object.freeze({
      isolation_validation_duration_ms: 10000,
      tenant_isolation_success_rate: validation_result.tenant_boundary_result === "PASS" ? 1 : 0,
      cross_tenant_access_attempts: rejected_violations.some((violation) => violation.includes("CROSS_TENANT") || violation.includes("TENANT")) ? 1 : 0,
      governance_separation_violations: validation_result.governance_result === "PASS" ? 0 : 1,
      replay_isolation_success_rate: validation_result.replay_result === "PASS" ? 1 : 0,
      recommendation_isolation_success_rate: validation_result.recommendation_result === "PASS" ? 1 : 0,
      evidence_isolation_success_rate: validation_result.evidence_result === "PASS" ? 1 : 0,
      unauthorized_visibility_detections: rejected_violations.some((violation) => violation.includes("UNAUTHORIZED") || violation.includes("VISIBILITY")) ? 1 : 0,
    }),
  };
  return Object.freeze({ ...source, report_hash: hashValue("governance-isolation-report", source) });
}

export function buildGovernanceIsolationObservabilitySurface(input: GovernanceIsolationValidationInput = {}): GovernanceIsolationObservabilitySurface {
  const report = runGovernanceIsolationValidation(input);
  return Object.freeze({
    isolation_validation_id: report.validation_run.isolation_validation_id,
    validation_state: report.timeline.at(-1)?.state ?? "CROSS_TENANT_ACCESS_DETECTED",
    overall_result: report.validation_result.overall_result,
    check_count: report.isolation_checks.length,
    failure_count: report.validation_result.failure_count,
    rejected_violations: report.rejected_violations,
    cross_tenant_access_attempts: report.observability.cross_tenant_access_attempts,
    unauthorized_visibility_detections: report.observability.unauthorized_visibility_detections,
    report_hash: report.report_hash,
  });
}

export function getGovernanceIsolationValidationContract() {
  const report = runGovernanceIsolationValidation();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["tenant-isolation", "strict-boundaries", "governance-separation", "replay-isolation", "recommendation-isolation", "evidence-isolation", "visibility-control", "read-only", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      states: freezeArray(["REQUESTED", "LOADING_CONTEXT", "VALIDATING_BOUNDARIES", "VERIFYING_ISOLATION", "VALIDATING_VISIBILITY", "GENERATING_REPORT", "VALIDATED"] as const),
      failure_states: freezeArray(["TENANT_BOUNDARY_FAILURE", "GOVERNANCE_ISOLATION_FAILURE", "REPLAY_ISOLATION_FAILURE", "RECOMMENDATION_ISOLATION_FAILURE", "EVIDENCE_ISOLATION_FAILURE", "VISIBILITY_FAILURE", "CROSS_TENANT_ACCESS_DETECTED"] as const),
      domains: freezeArray(["TENANT_BOUNDARY", "GOVERNANCE_SEPARATION", "REPLAY_ISOLATION", "RECOMMENDATION_ISOLATION", "EVIDENCE_ISOLATION", "VISIBILITY_CONTROL"] as const),
    }),
    report,
    observability: buildGovernanceIsolationObservabilitySurface(),
  });
}
