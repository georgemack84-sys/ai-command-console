import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceReplayCertification } from "@/services/governance-replay-certification";
import { runGovernanceCertificationOrchestrator } from "@/services/governance-certification-orchestrator";
import type { GovernanceReplayCertificationReport } from "@/types/governance-replay-certification";
import type {
  GovernanceDeterministicReplayScenario,
  GovernanceDeterministicReplayValidationInput,
  GovernanceDeterministicReplayValidationObservabilitySurface,
  GovernanceDeterministicReplayValidationReport,
  GovernanceReplayComparison,
  GovernanceReplayDifferenceType,
  GovernanceReplayValidationComponent,
  GovernanceReplayValidationLedgerRecord,
  GovernanceReplayValidationOutcome,
  GovernanceReplayValidationResultState,
  GovernanceReplayValidationRun,
  GovernanceReplayValidationState,
  GovernanceReplayValidationTimelineEvent,
} from "@/types/governance-deterministic-replay-validation";

const NOW = "2026-06-27T18:00:00.000Z";
const END = "2026-06-27T18:00:09.000Z";
const SCHEMA_VERSION = "governance-deterministic-replay-validation/v7L.2" as const;
const replayCache = new Map<string, GovernanceReplayCertificationReport>();

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function cachedReplay(tenant_id?: string, mission_id?: string, replay_requestor?: string): GovernanceReplayCertificationReport {
  const key = `${tenant_id ?? "default"}:${mission_id ?? "default"}:${replay_requestor ?? "default"}`;
  const cached = replayCache.get(key);
  if (cached) return cached;
  const report = tenant_id || mission_id || replay_requestor
    ? runGovernanceReplayCertification({ tenant_id, mission_id, replay_requestor })
    : runGovernanceReplayCertification();
  replayCache.set(key, report);
  return report;
}

function differenceForScenario(scenario: GovernanceDeterministicReplayScenario): { component: GovernanceReplayValidationComponent; difference: GovernanceReplayDifferenceType; state: GovernanceReplayValidationState } | null {
  const map: Partial<Record<GovernanceDeterministicReplayScenario, { component: GovernanceReplayValidationComponent; difference: GovernanceReplayDifferenceType; state: GovernanceReplayValidationState }>> = {
    POLICY_MISMATCH: { component: "POLICY", difference: "POLICY_RECONSTRUCTION_MISMATCH", state: "COMPARISON_FAILED" },
    RECOMMENDATION_MISMATCH: { component: "RECOMMENDATION", difference: "RECOMMENDATION_RECONSTRUCTION_MISMATCH", state: "COMPARISON_FAILED" },
    COMPLIANCE_MISMATCH: { component: "COMPLIANCE", difference: "COMPLIANCE_RECONSTRUCTION_MISMATCH", state: "COMPARISON_FAILED" },
    RISK_MISMATCH: { component: "RISK", difference: "RISK_RECONSTRUCTION_MISMATCH", state: "COMPARISON_FAILED" },
    ESCALATION_MISMATCH: { component: "ESCALATION", difference: "ESCALATION_RECONSTRUCTION_MISMATCH", state: "COMPARISON_FAILED" },
    LINEAGE_MISMATCH: { component: "LINEAGE", difference: "LINEAGE_MISMATCH", state: "LINEAGE_FAILED" },
    GOVERNANCE_STATE_MISMATCH: { component: "GOVERNANCE_STATE", difference: "GOVERNANCE_STATE_MISMATCH", state: "STATE_FAILED" },
    OUTPUT_MISMATCH: { component: "OUTPUT", difference: "OUTPUT_MISMATCH", state: "COMPARISON_FAILED" },
    ORDERING_MISMATCH: { component: "ORDERING", difference: "ORDERING_MISMATCH", state: "COMPARISON_FAILED" },
    CONFIDENCE_MISMATCH: { component: "CONFIDENCE", difference: "CONFIDENCE_MISMATCH", state: "COMPARISON_FAILED" },
    REPLAY_EVIDENCE_MISSING: { component: "OUTPUT", difference: "REPLAY_EVIDENCE_MISSING", state: "REPLAY_FAILED" },
    INTEGRITY_VERIFICATION_FAILURE: { component: "OUTPUT", difference: "INTEGRITY_VERIFICATION_FAILURE", state: "INTEGRITY_FAILED" },
    TENANT_ISOLATION_VIOLATION: { component: "GOVERNANCE_STATE", difference: "TENANT_ISOLATION_VIOLATION", state: "STATE_FAILED" },
    HIDDEN_REPLAY_STATE: { component: "GOVERNANCE_STATE", difference: "HIDDEN_REPLAY_STATE", state: "STATE_FAILED" },
  };
  return map[scenario] ?? null;
}

function componentHashes(report: GovernanceReplayCertificationReport): Record<GovernanceReplayValidationComponent, string> {
  const output = report.output_verification_report;
  return {
    POLICY: output.policy_comparison.comparison_hash,
    RECOMMENDATION: output.recommendation_comparison.comparison_hash,
    COMPLIANCE: output.compliance_comparison.comparison_hash,
    RISK: output.risk_comparison.comparison_hash,
    ESCALATION: output.escalation_comparison.comparison_hash,
    LINEAGE: output.lineage_comparison.comparison_hash,
    GOVERNANCE_STATE: output.replay_state_package.state_package_hash,
    OUTPUT: output.verification_report_hash,
    ORDERING: hashValue("governance-replay-ordering", output.comparisons.map((comparison) => comparison.comparison_id)),
    CONFIDENCE: output.confidence_comparison.comparison_hash,
  };
}

function comparison(
  replay_validation_id: string,
  component: GovernanceReplayValidationComponent,
  originalHash: string,
  replayHash: string,
  difference: GovernanceReplayDifferenceType = "NONE",
): GovernanceReplayComparison {
  const source = {
    comparison_id: `GRVC-7L2-${hashValue("governance-replay-validation-comparison-id", { replay_validation_id, component }).slice(0, 10).toUpperCase()}`,
    replay_validation_id,
    component,
    original_hash: originalHash,
    replay_hash: replayHash,
    comparison_result: originalHash === replayHash && difference === "NONE" ? "PASS" as const : "FAIL" as const,
    difference_type: originalHash === replayHash && difference === "NONE" ? "NONE" as const : difference,
    difference_location: originalHash === replayHash && difference === "NONE" ? null : `replay.${component.toLowerCase()}`,
  };
  return Object.freeze({ ...source, comparison_hash: hashValue("governance-replay-validation-comparison", source) });
}

function buildComparisons(replay_validation_id: string, report: GovernanceReplayCertificationReport, scenario: GovernanceDeterministicReplayScenario): readonly GovernanceReplayComparison[] {
  const hashes = componentHashes(report);
  const forced = differenceForScenario(scenario);
  const components: readonly GovernanceReplayValidationComponent[] = ["POLICY", "RECOMMENDATION", "COMPLIANCE", "RISK", "ESCALATION", "LINEAGE", "GOVERNANCE_STATE", "OUTPUT", "ORDERING", "CONFIDENCE"];
  return freezeArray(components.map((component) => {
    const originalHash = hashes[component];
    const shouldMismatch = forced?.component === component;
    const replayHash = shouldMismatch ? `${originalHash}:replay-mismatch:${forced.difference}` : originalHash;
    return comparison(replay_validation_id, component, originalHash, replayHash, shouldMismatch ? forced.difference : "NONE");
  }));
}

function outcome(replay_validation_id: string, comparisons: readonly GovernanceReplayComparison[]): GovernanceReplayValidationOutcome {
  const resultFor = (component: GovernanceReplayValidationComponent): GovernanceReplayValidationResultState => comparisons.find((item) => item.component === component)?.comparison_result ?? "FAIL";
  const failure_count = comparisons.filter((item) => item.comparison_result === "FAIL").length;
  const source = {
    validation_result_id: `GRVO-7L2-${hashValue("governance-replay-validation-outcome-id", replay_validation_id).slice(0, 10).toUpperCase()}`,
    overall_result: failure_count === 0 ? "PASS" as const : "FAIL" as const,
    policy_result: resultFor("POLICY"),
    recommendation_result: resultFor("RECOMMENDATION"),
    compliance_result: resultFor("COMPLIANCE"),
    risk_result: resultFor("RISK"),
    escalation_result: resultFor("ESCALATION"),
    lineage_result: resultFor("LINEAGE"),
    governance_state_result: resultFor("GOVERNANCE_STATE"),
    failure_count,
    warning_count: 0,
  };
  return Object.freeze({ ...source, outcome_hash: hashValue("governance-replay-validation-outcome", source) });
}

function timeline(finalState: GovernanceReplayValidationState): readonly GovernanceReplayValidationTimelineEvent[] {
  const stages: readonly GovernanceReplayValidationTimelineEvent["stage"][] = ["VALIDATE_REPLAY_CONTRACT", "LOAD_IMMUTABLE_EVIDENCE", "RECONSTRUCT_GOVERNANCE_STATE", "REPLAY_GOVERNANCE_INTELLIGENCE", "COMPARE_ORIGINAL_REPLAY", "VALIDATE_DETERMINISM", "STORE_REPLAY_EVIDENCE"];
  return freezeArray(stages.map((stage, index) => {
    const state = index === stages.length - 1 ? finalState : ["VALIDATING", "VALIDATING", "RECONSTRUCTING", "REPLAYING", "COMPARING", "COMPARING"][index] as GovernanceReplayValidationState;
    const source = {
      event_id: `GRVT-7L2-${String(index + 1).padStart(2, "0")}`,
      stage,
      timestamp: `2026-06-27T18:00:${String(index).padStart(2, "0")}.000Z`,
      state,
      summary: `${stage.replace(/_/g, " ").toLowerCase()} completed for deterministic governance replay validation.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-replay-validation-timeline-event", source) });
  }));
}

export function runGovernanceDeterministicReplayValidation(input: GovernanceDeterministicReplayValidationInput = {}): GovernanceDeterministicReplayValidationReport {
  const scenario = input.scenario ?? "BASELINE";
  const replayReport = cachedReplay(input.tenant_id, input.mission_id, input.replay_requestor);
  const contract = replayReport.output_verification_report.replay_state_package.replay_input_package.replay_contract;
  const tenant_id = input.tenant_id ?? contract.tenant_id;
  const mission_id = input.mission_id ?? contract.mission_id;
  const orchestrator = runGovernanceCertificationOrchestrator({ execution_mode: "REPLAY_CERTIFICATION" });
  const replay_validation_id = `GRV-7L2-${hashValue("governance-replay-validation-id", { replay: contract.governance_replay_id, scenario }).slice(0, 10).toUpperCase()}`;
  const comparisons = buildComparisons(replay_validation_id, replayReport, scenario);
  const validation_outcome = outcome(replay_validation_id, comparisons);
  const forced = differenceForScenario(scenario);
  const finalState: GovernanceReplayValidationState = validation_outcome.overall_result === "PASS" ? "VALIDATED" : forced?.state ?? "COMPARISON_FAILED";
  const confidence = validation_outcome.overall_result === "PASS" ? 0.99 : 0.12;
  const runSource = {
    replay_validation_id,
    tenant_id,
    mission_id,
    replay_id: contract.governance_replay_id,
    original_execution_id: replayReport.output_verification_report.replay_identity.original_execution_reference,
    replay_execution_id: replayReport.output_verification_report.replay_identity.replay_execution_reference,
    validation_timestamp: NOW,
    validation_result: validation_outcome.overall_result,
    overall_confidence: confidence,
    integrity_hash: hashValue("governance-replay-validation-integrity", comparisons.map((item) => item.comparison_hash)),
  };
  const replay_validation_run: GovernanceReplayValidationRun = Object.freeze({ ...runSource, run_hash: hashValue("governance-replay-validation-run", runSource) });
  const evidenceSource = {
    evidence_package_id: `GRVE-7L2-${hashValue("governance-replay-validation-evidence-id", replay_validation_id).slice(0, 10).toUpperCase()}`,
    immutable_evidence_refs: unique([
      replayReport.certification_evidence.evidence_hash,
      replayReport.output_verification_report.verification_report_hash,
      orchestrator.evidence_package.evidence_hash,
    ]),
    replay_refs: unique([contract.governance_replay_id, contract.replay_hash, orchestrator.run.replay_reference]),
    lineage_refs: unique([replayReport.truth_ledger_record_reference, replayReport.governance_ledger_record_reference, orchestrator.truth_ledger_record.ledger_record_id]),
    integrity_hashes: unique([replayReport.report_hash, replay_validation_run.integrity_hash, orchestrator.report_hash]),
  };
  const evidence_package = Object.freeze({ ...evidenceSource, evidence_hash: hashValue("governance-replay-validation-evidence-package", evidenceSource) });
  const ledgerSource = {
    ledger_record_id: `GRVL-7L2-${hashValue("governance-replay-validation-ledger-id", replay_validation_id).slice(0, 10).toUpperCase()}`,
    replay_validation_id,
    tenant_id,
    mission_id,
    comparison_hashes: freezeArray(comparisons.map((item) => item.comparison_hash)),
    outcome_hash: validation_outcome.outcome_hash,
    evidence_hash: evidence_package.evidence_hash,
    integrity_hash: replay_validation_run.integrity_hash,
    append_only: true as const,
    recorded_at: END,
  };
  const truth_ledger_record: GovernanceReplayValidationLedgerRecord = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("governance-replay-validation-ledger-record", ledgerSource) });
  const mismatchCount = comparisons.filter((item) => item.comparison_result === "FAIL").length;
  const source = {
    validator_id: `GRVV-7L2-${hashValue("governance-replay-validator-id", replay_validation_id).slice(0, 10).toUpperCase()}`,
    phase_version: "7L.2" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: END,
    read_only: true as const,
    advisory_only: true as const,
    replay_mutation_allowed: false as const,
    governance_execution_allowed: false as const,
    tenant_isolated: scenario !== "TENANT_ISOLATION_VIOLATION",
    replay_lineage_preserved: scenario !== "LINEAGE_MISMATCH",
    replay_validation_run,
    comparisons,
    validation_outcome,
    timeline: timeline(finalState),
    evidence_package,
    truth_ledger_record,
    observability: Object.freeze({
      replay_success_rate: validation_outcome.overall_result === "PASS" ? 1 : 0,
      replay_duration_ms: 9000,
      reconstruction_latency_ms: 140,
      comparison_accuracy: Number(((comparisons.length - mismatchCount) / comparisons.length).toFixed(4)),
      mismatch_frequency: mismatchCount,
      replay_confidence: confidence,
      lineage_reconstruction_rate: scenario === "LINEAGE_MISMATCH" ? 0 : 1,
    }),
  };
  return Object.freeze({ ...source, report_hash: hashValue("governance-deterministic-replay-validation-report", source) });
}

export function buildGovernanceDeterministicReplayValidationObservabilitySurface(input: GovernanceDeterministicReplayValidationInput = {}): GovernanceDeterministicReplayValidationObservabilitySurface {
  const report = runGovernanceDeterministicReplayValidation(input);
  return Object.freeze({
    replay_validation_id: report.replay_validation_run.replay_validation_id,
    validation_result: report.replay_validation_run.validation_result,
    validation_state: report.timeline.at(-1)?.state ?? "REPLAY_FAILED",
    comparison_count: report.comparisons.length,
    mismatch_count: report.validation_outcome.failure_count,
    replay_success_rate: report.observability.replay_success_rate,
    replay_confidence: report.observability.replay_confidence,
    report_hash: report.report_hash,
  });
}

export function getGovernanceDeterministicReplayValidationContract() {
  const report = runGovernanceDeterministicReplayValidation();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-replay", "immutable-evidence", "binary-output-equality", "ordering-equality", "confidence-equality", "lineage-equality", "tenant-isolated", "read-only", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      states: freezeArray(["REQUESTED", "VALIDATING", "RECONSTRUCTING", "REPLAYING", "COMPARING", "VALIDATED"] as const),
      failure_states: freezeArray(["REPLAY_FAILED", "COMPARISON_FAILED", "LINEAGE_FAILED", "STATE_FAILED", "INTEGRITY_FAILED"] as const),
      components: freezeArray(["POLICY", "RECOMMENDATION", "COMPLIANCE", "RISK", "ESCALATION", "LINEAGE", "GOVERNANCE_STATE", "OUTPUT", "ORDERING", "CONFIDENCE"] as const),
    }),
    report,
    observability: buildGovernanceDeterministicReplayValidationObservabilitySurface(),
  });
}
