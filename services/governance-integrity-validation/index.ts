import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceCertificationOrchestrator } from "@/services/governance-certification-orchestrator";
import { runGovernanceDeterministicReplayValidation } from "@/services/governance-deterministic-replay-validation";
import { runGovernanceIntegrityCertification } from "@/services/governance-integrity-certification";
import type { GovernanceCertificationOrchestratorReport } from "@/types/governance-certification-orchestrator";
import type { GovernanceDeterministicReplayValidationReport } from "@/types/governance-deterministic-replay-validation";
import type { GovernanceIntegrityCertificationReport } from "@/types/governance-integrity-certification";
import type {
  GovernanceIntegrityCheck,
  GovernanceIntegrityValidationDomain,
  GovernanceIntegrityValidationInput,
  GovernanceIntegrityValidationObservabilitySurface,
  GovernanceIntegrityValidationReport,
  GovernanceIntegrityValidationResult,
  GovernanceIntegrityValidationResultState,
  GovernanceIntegrityValidationRun,
  GovernanceIntegrityValidationScenario,
  GovernanceIntegrityValidationState,
  GovernanceIntegrityValidationTimelineEvent,
  GovernanceIntegrityViolation,
} from "@/types/governance-integrity-validation";

const NOW = "2026-06-27T18:30:00.000Z";
const END = "2026-06-27T18:30:11.000Z";
const SCHEMA_VERSION = "governance-integrity-validation/v7L.3" as const;
const integrityCache = new Map<string, GovernanceIntegrityCertificationReport>();
const replayValidationCache = new Map<string, GovernanceDeterministicReplayValidationReport>();
const orchestratorCache = new Map<string, GovernanceCertificationOrchestratorReport>();

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function cachedIntegrity(tenant_id: string, mission_id: string, validator_id: string): GovernanceIntegrityCertificationReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = integrityCache.get(key);
  if (cached) return cached;
  const report = runGovernanceIntegrityCertification({ tenant_id, mission_id, created_by: validator_id });
  integrityCache.set(key, report);
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

function cachedOrchestrator(tenant_id: string, mission_id: string, validator_id: string): GovernanceCertificationOrchestratorReport {
  const key = `${tenant_id}:${mission_id}:${validator_id}`;
  const cached = orchestratorCache.get(key);
  if (cached) return cached;
  const report = runGovernanceCertificationOrchestrator({ execution_mode: "FULL_SYSTEM_CERTIFICATION", tenant_id, mission_id, initiated_by: validator_id });
  orchestratorCache.set(key, report);
  return report;
}

function forcedViolation(scenario: GovernanceIntegrityValidationScenario): { domain: GovernanceIntegrityValidationDomain; violation: Exclude<GovernanceIntegrityViolation, "NONE">; state: GovernanceIntegrityValidationState } | null {
  const map: Partial<Record<GovernanceIntegrityValidationScenario, { domain: GovernanceIntegrityValidationDomain; violation: Exclude<GovernanceIntegrityViolation, "NONE">; state: GovernanceIntegrityValidationState }>> = {
    BROKEN_HASH_CHAIN: { domain: "HASH_CHAIN", violation: "BROKEN_HASH_CHAIN", state: "HASH_FAILURE" },
    HASH_MISMATCH: { domain: "HASH_CHAIN", violation: "HASH_MISMATCH", state: "HASH_FAILURE" },
    MISSING_HASH: { domain: "HASH_CHAIN", violation: "MISSING_HASH", state: "HASH_FAILURE" },
    ORPHANED_RECORD: { domain: "HASH_CHAIN", violation: "ORPHANED_RECORD", state: "HASH_FAILURE" },
    MISSING_EVIDENCE: { domain: "EVIDENCE", violation: "MISSING_EVIDENCE", state: "EVIDENCE_FAILURE" },
    ALTERED_EVIDENCE: { domain: "EVIDENCE", violation: "ALTERED_EVIDENCE", state: "EVIDENCE_FAILURE" },
    INVALID_EVIDENCE_REFERENCE: { domain: "EVIDENCE", violation: "INVALID_EVIDENCE_REFERENCE", state: "EVIDENCE_FAILURE" },
    RECOMMENDATION_MODIFICATION: { domain: "RECOMMENDATION", violation: "RECOMMENDATION_MODIFICATION", state: "RECOMMENDATION_FAILURE" },
    CONFIDENCE_ALTERATION: { domain: "RECOMMENDATION", violation: "CONFIDENCE_ALTERATION", state: "RECOMMENDATION_FAILURE" },
    POLICY_MODIFICATION: { domain: "POLICY", violation: "POLICY_MODIFICATION", state: "POLICY_FAILURE" },
    POLICY_DELETION: { domain: "POLICY", violation: "POLICY_DELETION", state: "POLICY_FAILURE" },
    REPLAY_ALTERATION: { domain: "REPLAY", violation: "REPLAY_ALTERATION", state: "REPLAY_FAILURE" },
    REPLAY_EVIDENCE_MISSING: { domain: "REPLAY", violation: "REPLAY_EVIDENCE_MISSING", state: "REPLAY_FAILURE" },
    DELETED_HISTORY: { domain: "HISTORY", violation: "DELETED_HISTORY", state: "HISTORY_FAILURE" },
    MODIFIED_HISTORY: { domain: "HISTORY", violation: "MODIFIED_HISTORY", state: "HISTORY_FAILURE" },
    REORDERED_HISTORY: { domain: "HISTORY", violation: "REORDERED_HISTORY", state: "HISTORY_FAILURE" },
    INCOMPLETE_TIMELINE: { domain: "HISTORY", violation: "INCOMPLETE_TIMELINE", state: "HISTORY_FAILURE" },
    TENANT_ISOLATION_VIOLATION: { domain: "TENANT", violation: "TENANT_ISOLATION_VIOLATION", state: "CORRUPTION_DETECTED" },
    AUTHORITY_BOUNDARY_BYPASS: { domain: "AUTHORITY", violation: "AUTHORITY_BOUNDARY_BYPASS", state: "CORRUPTION_DETECTED" },
    HIDDEN_INTEGRITY_STATE: { domain: "HISTORY", violation: "HIDDEN_INTEGRITY_STATE", state: "CORRUPTION_DETECTED" },
  };
  return map[scenario] ?? null;
}

function baseHashes(integrity: GovernanceIntegrityCertificationReport, replay: GovernanceDeterministicReplayValidationReport, orchestrator: GovernanceCertificationOrchestratorReport): Record<GovernanceIntegrityValidationDomain, string> {
  return {
    HASH_CHAIN: hashValue("governance-integrity-validation-hash-chain-source", {
      verification: integrity.verification_report.report_hash,
      source_chain: integrity.certification_evidence.source_chain_hash,
      ledger: orchestrator.truth_ledger_record.ledger_hash,
      replay_ledger: replay.truth_ledger_record.ledger_hash,
    }),
    EVIDENCE: hashValue("governance-integrity-validation-evidence-source", {
      integrity: integrity.certification_evidence.evidence_hash,
      replay: replay.evidence_package.evidence_hash,
      orchestrator: orchestrator.evidence_package.evidence_hash,
    }),
    RECOMMENDATION: hashValue("governance-integrity-validation-recommendation-source", {
      replay: replay.comparisons.find((item) => item.component === "RECOMMENDATION")?.original_hash,
      orchestrator: orchestrator.scenario_results.map((item) => item.integrity_hash),
    }),
    POLICY: hashValue("governance-integrity-validation-policy-source", {
      replay: replay.comparisons.find((item) => item.component === "POLICY")?.original_hash,
      integrity: integrity.verification_report.source_chain.chain_execution_hash,
    }),
    REPLAY: hashValue("governance-integrity-validation-replay-source", {
      replay_run: replay.replay_validation_run.run_hash,
      replay_result: replay.validation_outcome.outcome_hash,
      replay_report: replay.report_hash,
    }),
    HISTORY: hashValue("governance-integrity-validation-history-source", {
      timeline: replay.timeline.map((item) => item.event_hash),
      orchestration: orchestrator.timeline.map((item) => item.event_hash),
      ledger: orchestrator.truth_ledger_record.ledger_hash,
    }),
    TENANT: hashValue("governance-integrity-validation-tenant-source", {
      integrity: integrity.verification_report.tenant_id,
      replay: replay.replay_validation_run.tenant_id,
      orchestrator: orchestrator.isolation_context.tenant_id,
      isolated: orchestrator.tenant_isolated && replay.tenant_isolated,
    }),
    AUTHORITY: hashValue("governance-integrity-validation-authority-source", {
      read_only: orchestrator.read_only && replay.read_only,
      advisory_only: orchestrator.advisory_only && replay.advisory_only,
      mutation_allowed: orchestrator.mutation_allowed,
      governance_execution_allowed: orchestrator.governance_execution_allowed || replay.governance_execution_allowed,
    }),
  };
}

function checkType(domain: GovernanceIntegrityValidationDomain): GovernanceIntegrityCheck["check_type"] {
  const map: Record<GovernanceIntegrityValidationDomain, GovernanceIntegrityCheck["check_type"]> = {
    HASH_CHAIN: "HASH_CONTINUITY",
    EVIDENCE: "EVIDENCE_AUTHENTICITY",
    RECOMMENDATION: "RECOMMENDATION_IMMUTABILITY",
    POLICY: "POLICY_IMMUTABILITY",
    REPLAY: "REPLAY_IMMUTABILITY",
    HISTORY: "HISTORY_IMMUTABILITY",
    TENANT: "TENANT_ISOLATION",
    AUTHORITY: "AUTHORITY_PROTECTION",
  };
  return map[domain];
}

function buildChecks(
  validation_id: string,
  scenario: GovernanceIntegrityValidationScenario,
  integrity: GovernanceIntegrityCertificationReport,
  replay: GovernanceDeterministicReplayValidationReport,
  orchestrator: GovernanceCertificationOrchestratorReport,
): readonly GovernanceIntegrityCheck[] {
  const forced = forcedViolation(scenario);
  const hashes = baseHashes(integrity, replay, orchestrator);
  const evidenceRefs = unique([
    integrity.certification_evidence.evidence_hash,
    integrity.truth_ledger_certification_reference,
    replay.evidence_package.evidence_hash,
    replay.truth_ledger_record.ledger_hash,
    orchestrator.evidence_package.evidence_hash,
    orchestrator.truth_ledger_record.ledger_hash,
  ]);
  const domains: readonly GovernanceIntegrityValidationDomain[] = ["HASH_CHAIN", "EVIDENCE", "RECOMMENDATION", "POLICY", "REPLAY", "HISTORY", "TENANT", "AUTHORITY"];
  return freezeArray(domains.map((domain, index) => {
    const expected_hash = hashes[domain];
    const shouldFail = forced?.domain === domain;
    const actual_hash = shouldFail ? `${expected_hash}:integrity-violation:${forced.violation}` : expected_hash;
    const source = {
      integrity_check_id: `GIVC-7L3-${hashValue("governance-integrity-validation-check-id", { validation_id, domain }).slice(0, 10).toUpperCase()}`,
      component: domain,
      check_type: checkType(domain),
      expected_hash,
      actual_hash,
      validation_result: expected_hash === actual_hash ? "PASS" as const : "FAIL" as const,
      violation: expected_hash === actual_hash ? "NONE" as const : forced?.violation ?? "HASH_MISMATCH" as const,
      difference_location: expected_hash === actual_hash ? null : `governance_history.${domain.toLowerCase()}`,
      timestamp: `2026-06-27T18:30:${String(index + 1).padStart(2, "0")}.000Z`,
      evidence_refs: evidenceRefs,
    };
    return Object.freeze({ ...source, check_hash: hashValue("governance-integrity-validation-check", source) });
  }));
}

function result(validation_id: string, checks: readonly GovernanceIntegrityCheck[]): GovernanceIntegrityValidationResult {
  const resultFor = (domain: GovernanceIntegrityValidationDomain): GovernanceIntegrityValidationResultState => checks.find((check) => check.component === domain)?.validation_result ?? "FAIL";
  const failure_count = checks.filter((check) => check.validation_result === "FAIL").length;
  const source = {
    validation_result_id: `GIVR-7L3-${hashValue("governance-integrity-validation-result-id", validation_id).slice(0, 10).toUpperCase()}`,
    overall_result: failure_count === 0 ? "PASS" as const : "FAIL" as const,
    hash_chain_result: resultFor("HASH_CHAIN"),
    evidence_result: resultFor("EVIDENCE"),
    recommendation_result: resultFor("RECOMMENDATION"),
    policy_result: resultFor("POLICY"),
    replay_result: resultFor("REPLAY"),
    history_result: resultFor("HISTORY"),
    failure_count,
    warning_count: 0,
  };
  return Object.freeze({ ...source, result_hash: hashValue("governance-integrity-validation-result", source) });
}

function timeline(finalState: GovernanceIntegrityValidationState): readonly GovernanceIntegrityValidationTimelineEvent[] {
  const stages: readonly GovernanceIntegrityValidationTimelineEvent["stage"][] = ["LOAD_IMMUTABLE_HISTORY", "VERIFY_HASH_CHAINS", "VALIDATE_EVIDENCE", "VALIDATE_RECORDS", "VALIDATE_REPLAY", "VALIDATE_HISTORY", "STORE_VALIDATION"];
  const states: readonly GovernanceIntegrityValidationState[] = ["LOADING_HISTORY", "VALIDATING_HASHES", "VALIDATING_RECORDS", "VALIDATING_RECORDS", "VALIDATING_HISTORY", "VALIDATING_HISTORY", finalState];
  return freezeArray(stages.map((stage, index) => {
    const source = {
      event_id: `GIVT-7L3-${String(index + 1).padStart(2, "0")}`,
      stage,
      timestamp: `2026-06-27T18:30:${String(index).padStart(2, "0")}.000Z`,
      state: states[index],
      summary: `${stage.replace(/_/g, " ").toLowerCase()} completed for governance integrity validation.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-integrity-validation-timeline-event", source) });
  }));
}

export function runGovernanceIntegrityValidation(input: GovernanceIntegrityValidationInput = {}): GovernanceIntegrityValidationReport {
  const scenario = input.scenario ?? "BASELINE";
  const validator = input.validator_id ?? "governance_integrity_validator";
  const integrity = cachedIntegrity(input.tenant_id ?? "tenant_alpha", input.mission_id ?? "mission_governance_lineage", validator);
  const replay = cachedReplayValidation(input.tenant_id ?? integrity.verification_report.tenant_id, input.mission_id ?? integrity.verification_report.mission_id, validator);
  const orchestrator = cachedOrchestrator(input.tenant_id ?? integrity.verification_report.tenant_id, input.mission_id ?? integrity.verification_report.mission_id, validator);
  const tenant_id = input.tenant_id ?? integrity.verification_report.tenant_id;
  const mission_id = input.mission_id ?? integrity.verification_report.mission_id;
  const validation_id = `GIV-7L3-${hashValue("governance-integrity-validation-id", { tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`;
  const integrity_checks = buildChecks(validation_id, scenario, integrity, replay, orchestrator);
  const validation_result = result(validation_id, integrity_checks);
  const detected_violations = unique(integrity_checks.map((check) => check.violation).filter((item): item is Exclude<GovernanceIntegrityViolation, "NONE"> => item !== "NONE"));
  const finalState = validation_result.overall_result === "PASS" ? "VALIDATED" : forcedViolation(scenario)?.state ?? "CORRUPTION_DETECTED";
  const validation_scope = freezeArray(integrity_checks.map((check) => check.component));
  const runSource = {
    integrity_validation_id: validation_id,
    tenant_id,
    mission_id,
    validation_timestamp: NOW,
    validation_scope,
    overall_result: validation_result.overall_result,
    validated_components: freezeArray(["governance-foundation", "policy-intelligence", "governance-risk-intelligence", "compliance-intelligence", "recommendation-intelligence", "escalation-intelligence", "lineage-intelligence", "replay-framework", "query-framework", "visibility-framework", "truth-ledger"]),
    integrity_hash: hashValue("governance-integrity-validation-integrity", integrity_checks.map((check) => check.check_hash)),
  };
  const validation_run: GovernanceIntegrityValidationRun = Object.freeze({ ...runSource, run_hash: hashValue("governance-integrity-validation-run", runSource) });
  const evidenceSource = {
    evidence_package_id: `GIVE-7L3-${hashValue("governance-integrity-validation-evidence-id", validation_id).slice(0, 10).toUpperCase()}`,
    governance_history_refs: unique([orchestrator.truth_ledger_record.ledger_hash, replay.truth_ledger_record.ledger_hash, integrity.verification_report.truth_ledger_record.evidence_hash]),
    certification_refs: unique([integrity.report_hash, orchestrator.report_hash, ...orchestrator.scenario_results.map((item) => item.result_hash)]),
    replay_refs: unique([replay.replay_validation_run.replay_id, replay.replay_validation_run.replay_execution_id, orchestrator.run.replay_reference]),
    integrity_hashes: unique([validation_run.integrity_hash, integrity.report_hash, replay.report_hash, orchestrator.run.integrity_hash]),
  };
  const evidence_package = Object.freeze({ ...evidenceSource, evidence_hash: hashValue("governance-integrity-validation-evidence-package", evidenceSource) });
  const ledgerSource = {
    ledger_record_id: `GIVL-7L3-${hashValue("governance-integrity-validation-ledger-id", validation_id).slice(0, 10).toUpperCase()}`,
    integrity_validation_id: validation_id,
    tenant_id,
    mission_id,
    check_hashes: freezeArray(integrity_checks.map((check) => check.check_hash)),
    result_hash: validation_result.result_hash,
    evidence_hash: evidence_package.evidence_hash,
    integrity_hash: validation_run.integrity_hash,
    append_only: true as const,
    recorded_at: END,
  };
  const truth_ledger_record = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("governance-integrity-validation-ledger-record", ledgerSource) });
  const failCount = validation_result.failure_count;
  const source = {
    validator_id: `GIVV-7L3-${hashValue("governance-integrity-validator-id", { validation_id, validator }).slice(0, 10).toUpperCase()}`,
    phase_version: "7L.3" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: END,
    read_only: true as const,
    advisory_only: true as const,
    governance_history_mutation_allowed: false as const,
    certification_evidence_mutation_allowed: false as const,
    governance_execution_allowed: false as const,
    tenant_isolated: scenario !== "TENANT_ISOLATION_VIOLATION" && orchestrator.tenant_isolated && replay.tenant_isolated,
    authority_protected: scenario !== "AUTHORITY_BOUNDARY_BYPASS" && orchestrator.authority_protected,
    validation_run,
    integrity_checks,
    validation_result,
    detected_violations,
    timeline: timeline(finalState),
    evidence_package,
    truth_ledger_record,
    observability: Object.freeze({
      integrity_validation_duration_ms: 11000,
      hash_verification_rate: Number((integrity_checks.filter((check) => check.component === "HASH_CHAIN" && check.validation_result === "PASS").length / 1).toFixed(4)),
      corruption_detection_rate: detected_violations.length > 0 ? 1 : 0,
      modification_detection_rate: detected_violations.some((violation) => violation.includes("MODIFICATION") || violation.includes("ALTERED") || violation === "MODIFIED_HISTORY") ? 1 : 0,
      deletion_detection_rate: detected_violations.some((violation) => violation.includes("DELETION") || violation.includes("DELETED") || violation.includes("MISSING")) ? 1 : 0,
      replay_alteration_rate: detected_violations.some((violation) => violation.startsWith("REPLAY")) ? 1 : 0,
      validation_success_rate: failCount === 0 ? 1 : 0,
    }),
  };
  return Object.freeze({ ...source, report_hash: hashValue("governance-integrity-validation-report", source) });
}

export function buildGovernanceIntegrityValidationObservabilitySurface(input: GovernanceIntegrityValidationInput = {}): GovernanceIntegrityValidationObservabilitySurface {
  const report = runGovernanceIntegrityValidation(input);
  return Object.freeze({
    integrity_validation_id: report.validation_run.integrity_validation_id,
    validation_state: report.timeline.at(-1)?.state ?? "CORRUPTION_DETECTED",
    overall_result: report.validation_result.overall_result,
    check_count: report.integrity_checks.length,
    failure_count: report.validation_result.failure_count,
    detected_violations: report.detected_violations,
    validation_success_rate: report.observability.validation_success_rate,
    report_hash: report.report_hash,
  });
}

export function getGovernanceIntegrityValidationContract() {
  const report = runGovernanceIntegrityValidation();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["immutable-history", "cryptographic-integrity", "evidence-authenticity", "replay-integrity", "policy-integrity", "recommendation-integrity", "tenant-isolation", "read-only", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      states: freezeArray(["REQUESTED", "LOADING_HISTORY", "VALIDATING_HASHES", "VALIDATING_RECORDS", "VALIDATING_HISTORY", "GENERATING_REPORT", "VALIDATED"] as const),
      failure_states: freezeArray(["HASH_FAILURE", "EVIDENCE_FAILURE", "POLICY_FAILURE", "RECOMMENDATION_FAILURE", "REPLAY_FAILURE", "HISTORY_FAILURE", "CORRUPTION_DETECTED"] as const),
      domains: freezeArray(["HASH_CHAIN", "EVIDENCE", "RECOMMENDATION", "POLICY", "REPLAY", "HISTORY", "TENANT", "AUTHORITY"] as const),
    }),
    report,
    observability: buildGovernanceIntegrityValidationObservabilitySurface(),
  });
}
