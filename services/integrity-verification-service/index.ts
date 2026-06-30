import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomousHashChain, validateAutonomousHashChain } from "@/services/autonomous-hash-chain-engine";
import { buildIntegrityContract, validateIntegrityContract } from "@/services/integrity-contract";
import { runTamperDetection } from "@/services/tamper-detection-engine";
import type { IntegrityState } from "@/types/integrity-contract";
import type { TamperDetectionScenario } from "@/types/tamper-detection-engine";
import type {
  GovernanceVerificationSummary,
  HashVerificationSummary,
  IntegrityCertificationEvidence,
  IntegrityStatusLevel,
  IntegrityVerificationFailure,
  IntegrityVerificationInput,
  IntegrityVerificationMode,
  IntegrityVerificationModule,
  IntegrityVerificationObservabilitySurface,
  IntegrityVerificationRecord,
  IntegrityVerificationReport,
  IntegrityVerificationResult,
  IntegrityVerificationScenario,
  IntegrityVerificationState,
  LineageVerificationSummary,
  ReplayVerificationSummary,
  TenantIsolationSummary,
} from "@/types/integrity-verification-service";

const NOW = "2026-06-30T14:00:00.000Z";
const SCHEMA_VERSION = "integrity-verification-service/v8H.4" as const;

const FAILURE_STATE: Readonly<Record<IntegrityVerificationFailure, IntegrityVerificationState>> = Object.freeze({
  INTEGRITY_CONTRACT_INVALID: "INVALID",
  HASH_REPRODUCTION_FAILED: "FAILED",
  PARENT_HASH_INVALID: "FAILED",
  CHAIN_CONTINUITY_BROKEN: "FAILED",
  REPLAY_NOT_REPRODUCIBLE: "CERTIFICATION_BLOCKED",
  REPLAY_CHECKPOINT_MISMATCH: "CERTIFICATION_BLOCKED",
  LINEAGE_INCOMPLETE: "FAILED",
  ORPHANED_ARTIFACT: "FAILED",
  GOVERNANCE_REFERENCE_MISSING: "DEGRADED",
  CONSTITUTIONAL_REFERENCE_INVALID: "INVALID",
  AUTHORITY_REFERENCE_INVALID: "DEGRADED",
  TENANT_ISOLATION_VIOLATION: "INVALID",
  IMMUTABLE_IDENTIFIER_MODIFIED: "INVALID",
  OPTIONAL_METADATA_WARNING: "WARNING",
  UNSUPPORTED_VERIFICATION_VERSION: "DEGRADED",
  EXECUTION_DIVERGENCE_DETECTED: "INVALID",
});

const SCENARIO_TAMPER: Partial<Record<IntegrityVerificationScenario, TamperDetectionScenario>> = Object.freeze({
  HASH_REPRODUCTION_FAILED: "INCONSISTENT_HASH",
  PARENT_HASH_INVALID: "HISTORICAL_INCONSISTENCY",
  CHAIN_CONTINUITY_BROKEN: "DELETED_RECORD",
  REPLAY_NOT_REPRODUCIBLE: "REPLAY_ALTERATION",
  REPLAY_CHECKPOINT_MISMATCH: "CHECKPOINT_INCONSISTENCY",
  LINEAGE_INCOMPLETE: "LINEAGE_CORRUPTION",
  ORPHANED_ARTIFACT: "ORPHAN_RECORD",
  GOVERNANCE_REFERENCE_MISSING: "GOVERNANCE_REFERENCE_LOSS",
  CONSTITUTIONAL_REFERENCE_INVALID: "CONSTITUTIONAL_REFERENCE_LOSS",
  TENANT_ISOLATION_VIOLATION: "CROSS_TENANT_LINKAGE",
  IMMUTABLE_IDENTIFIER_MODIFIED: "UNAUTHORIZED_MODIFICATION",
  OPTIONAL_METADATA_WARNING: "MALFORMED_METADATA",
  UNSUPPORTED_VERIFICATION_VERSION: "UNSUPPORTED_HASH_ALGORITHM",
  EXECUTION_DIVERGENCE_DETECTED: "EXECUTION_DIVERGENCE",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter((value) => value.trim().length > 0))].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function stateRank(state: IntegrityVerificationState): number {
  if (state === "INVALID") return 7;
  if (state === "CERTIFICATION_BLOCKED") return 6;
  if (state === "FAILED") return 5;
  if (state === "DEGRADED") return 4;
  if (state === "WARNING") return 3;
  if (state === "MONITORING") return 2;
  return 1;
}

function deriveVerificationState(results: readonly IntegrityVerificationResult[]): IntegrityVerificationState {
  return results.reduce<IntegrityVerificationState>((state, result) => stateRank(result.verification_state) > stateRank(state) ? result.verification_state : state, "VERIFIED");
}

function statusFromState(state: IntegrityVerificationState): IntegrityStatusLevel {
  if (state === "INVALID") return "UNTRUSTED";
  if (state === "FAILED" || state === "CERTIFICATION_BLOCKED") return "COMPROMISED";
  if (state === "DEGRADED") return "DEGRADED";
  if (state === "WARNING" || state === "MONITORING") return "WATCH";
  return "TRUSTED";
}

function integrityStateFromVerification(state: IntegrityVerificationState): IntegrityState {
  if (state === "INVALID" || state === "FAILED" || state === "CERTIFICATION_BLOCKED") return "CORRUPTED";
  if (state === "DEGRADED" || state === "WARNING" || state === "MONITORING") return "DEGRADED";
  return "VALID";
}

function scoreFor(state: IntegrityVerificationState): number {
  if (state === "INVALID") return 0;
  if (state === "CERTIFICATION_BLOCKED") return 0.08;
  if (state === "FAILED") return 0.16;
  if (state === "DEGRADED") return 0.72;
  if (state === "WARNING") return 0.88;
  if (state === "MONITORING") return 0.95;
  return 1;
}

export function classifyIntegrityVerificationFailure(failure: IntegrityVerificationFailure): IntegrityVerificationState {
  return FAILURE_STATE[failure];
}

function moduleFor(failure: IntegrityVerificationFailure): IntegrityVerificationModule {
  if (["INTEGRITY_CONTRACT_INVALID", "IMMUTABLE_IDENTIFIER_MODIFIED"].includes(failure)) return "SCHEMA_IDENTIFIER";
  if (["HASH_REPRODUCTION_FAILED", "PARENT_HASH_INVALID"].includes(failure)) return "HASH";
  if (failure === "CHAIN_CONTINUITY_BROKEN") return "CHAIN_CONTINUITY";
  if (["REPLAY_NOT_REPRODUCIBLE", "REPLAY_CHECKPOINT_MISMATCH"].includes(failure)) return "REPLAY";
  if (["LINEAGE_INCOMPLETE", "ORPHANED_ARTIFACT"].includes(failure)) return "LINEAGE";
  if (["GOVERNANCE_REFERENCE_MISSING", "CONSTITUTIONAL_REFERENCE_INVALID", "AUTHORITY_REFERENCE_INVALID"].includes(failure)) return "GOVERNANCE";
  if (failure === "TENANT_ISOLATION_VIOLATION") return "TENANT_ISOLATION";
  if (failure === "EXECUTION_DIVERGENCE_DETECTED") return "CERTIFICATION";
  return "CONFIDENCE";
}

function scenarioFailure(scenario: IntegrityVerificationScenario): IntegrityVerificationFailure | null {
  return scenario === "BASELINE" ? null : scenario;
}

function result(module: IntegrityVerificationModule, failure: IntegrityVerificationFailure | null, message: string, evidence: readonly string[]): IntegrityVerificationResult {
  const verification_state = failure ? classifyIntegrityVerificationFailure(failure) : "VERIFIED";
  const source = {
    module,
    verification_state,
    integrity_status: statusFromState(verification_state),
    passed: verification_state === "VERIFIED",
    failure,
    confidence_score: scoreFor(verification_state),
    message,
    evidence_refs: uniq(evidence),
  };
  return Object.freeze({ ...source, result_hash: hashValue("integrity-verification-result", source) });
}

function buildResults(input: IntegrityVerificationInput): readonly IntegrityVerificationResult[] {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const integrity = input.integrityRecord ?? buildIntegrityContract();
  const chain = input.chain ?? buildAutonomousHashChain({ integrityRecord: integrity });
  const tamper = input.tamperReport ?? runTamperDetection({ scenario: input.tamper_scenario ?? SCENARIO_TAMPER[scenario], chain });
  const integrityValidation = validateIntegrityContract(integrity);
  const chainValidation = validateAutonomousHashChain(chain);
  const evidence = uniq([
    integrity.record_hash,
    integrityValidation.validation_hash,
    chain.validation.validation_hash,
    chainValidation.validation_hash,
    tamper.report_hash,
    tamper.forensic_evidence.evidence_hash,
  ]);
  const hasTamper = (reason: string) => tamper.detections.some((detection) => detection.detected_issue === reason);
  const moduleFailure = (module: IntegrityVerificationModule) => direct && moduleFor(direct) === module ? direct : null;
  return freezeArray([
    result("SCHEMA_IDENTIFIER", moduleFailure("SCHEMA_IDENTIFIER") ?? (integrityValidation.required_fields_valid && integrityValidation.immutable_identifiers_valid ? null : "INTEGRITY_CONTRACT_INVALID"), "Schema and immutable identifiers verified.", evidence),
    result("HASH", moduleFailure("HASH") ?? (chainValidation.hash_reproducible && chainValidation.algorithm_supported ? null : "HASH_REPRODUCTION_FAILED"), "Stored hashes reproduced against regenerated hashes.", evidence),
    result("CHAIN_CONTINUITY", moduleFailure("CHAIN_CONTINUITY") ?? (chainValidation.parent_links_valid && chainValidation.chain_complete && chainValidation.ordering_deterministic ? null : "CHAIN_CONTINUITY_BROKEN"), "Hash chain continuity and append-only ordering verified.", evidence),
    result("REPLAY", moduleFailure("REPLAY") ?? (tamper.replay_verification.replay_reproducible && tamper.replay_verification.replay_evidence_valid ? null : "REPLAY_NOT_REPRODUCIBLE"), "Replay reconstruction and replay hashes verified.", evidence),
    result("LINEAGE", moduleFailure("LINEAGE") ?? (chainValidation.lineage_continuous && tamper.lineage_analysis.lineage_continuous ? null : hasTamper("ORPHAN_RECORD") ? "ORPHANED_ARTIFACT" : "LINEAGE_INCOMPLETE"), "Lineage continuity and ancestry verified.", evidence),
    result("GOVERNANCE", moduleFailure("GOVERNANCE") ?? (chainValidation.governance_traceable && chainValidation.constitutional_traceable ? null : hasTamper("CONSTITUTIONAL_REFERENCE_LOSS") ? "CONSTITUTIONAL_REFERENCE_INVALID" : "GOVERNANCE_REFERENCE_MISSING"), "Governance, constitutional, policy, and authority references verified.", evidence),
    result("TENANT_ISOLATION", moduleFailure("TENANT_ISOLATION") ?? (chainValidation.tenant_isolated && !tamper.detections.some((detection) => detection.detected_issue === "CROSS_TENANT_LINKAGE") ? null : "TENANT_ISOLATION_VIOLATION"), "Tenant scoped hashes, replay references, lineage, and governance references verified.", evidence),
    result("CONFIDENCE", moduleFailure("CONFIDENCE"), "Confidence score calculated from hash, replay, lineage, governance, tenant, and chain checks.", evidence),
    result("CERTIFICATION", moduleFailure("CERTIFICATION") ?? (direct ? null : tamper.certification_ready || tamper.detections.length === 0 ? null : tamper.detection_state === "INVALID" ? "EXECUTION_DIVERGENCE_DETECTED" : null), "Certification readiness verified with fail-closed blocking on critical failure.", evidence),
  ]);
}

function buildHashSummary(chainValid: ReturnType<typeof validateAutonomousHashChain>): HashVerificationSummary {
  const source = {
    replay_hash: chainValid.replay_reconstructable,
    execution_hash: chainValid.hash_reproducible,
    planning_hash: chainValid.hash_reproducible,
    decision_hash: chainValid.hash_reproducible,
    orchestration_hash: chainValid.hash_reproducible,
    supervision_hash: chainValid.hash_reproducible,
    intervention_hash: chainValid.hash_reproducible,
    parent_hash: chainValid.parent_links_valid,
    lineage_hash: chainValid.lineage_continuous,
    chain_hash: chainValid.hash_reproducible && chainValid.parent_links_valid,
  };
  return Object.freeze({ ...source, hash_verification_hash: hashValue("integrity-verification-hash-summary", source) });
}

function buildLineageSummary(chain: ReturnType<typeof buildAutonomousHashChain>, chainValid: ReturnType<typeof validateAutonomousHashChain>): LineageVerificationSummary {
  const source = {
    lineage_reference: chain.source_integrity_contract.lineage_reference,
    parent_reference: chain.source_integrity_contract.lineage.parent_artifact_id,
    chain_reference: chain.lineage_graph.lineage_hash,
    complete_lineage: chainValid.lineage_continuous,
    orphaned_records_detected: !chainValid.parent_existence_valid,
  };
  return Object.freeze({ ...source, lineage_verification_hash: hashValue("integrity-verification-lineage-summary", source) });
}

function buildGovernanceSummary(integrity: ReturnType<typeof buildIntegrityContract>, chainValid: ReturnType<typeof validateAutonomousHashChain>): GovernanceVerificationSummary {
  const source = {
    governance_reference: integrity.governance_reference,
    constitutional_reference: integrity.constitutional_reference,
    policy_reference: integrity.policy_reference,
    authority_reference: integrity.authority_reference,
    governance_valid: chainValid.governance_traceable && Boolean(integrity.governance_reference && integrity.policy_reference),
    constitutional_valid: chainValid.constitutional_traceable && Boolean(integrity.constitutional_reference),
    authority_valid: Boolean(integrity.authority_reference),
  };
  return Object.freeze({ ...source, governance_verification_hash: hashValue("integrity-verification-governance-summary", source) });
}

function buildReplaySummary(chain: ReturnType<typeof buildAutonomousHashChain>, tamper: ReturnType<typeof runTamperDetection>): ReplayVerificationSummary {
  const source = {
    replay_reference: chain.source_integrity_contract.replay_reference,
    replay_result: tamper.replay_verification.replay_reproducible ? "REPRODUCIBLE" as const : "NOT_REPRODUCIBLE" as const,
    replay_hash_result: tamper.replay_verification.replay_evidence_valid ? "MATCH" as const : "MISMATCH" as const,
    replay_checkpoint_valid: tamper.replay_verification.replay_ordering_valid,
  };
  return Object.freeze({ ...source, replay_verification_hash: hashValue("integrity-verification-replay-summary", source) });
}

function buildTenantSummary(chain: ReturnType<typeof buildAutonomousHashChain>, chainValid: ReturnType<typeof validateAutonomousHashChain>): TenantIsolationSummary {
  const source = {
    tenant_id: chain.tenant_id,
    tenant_scope_valid: chainValid.tenant_isolated,
    cross_tenant_access_detected: !chainValid.tenant_isolated,
  };
  return Object.freeze({ ...source, tenant_isolation_hash: hashValue("integrity-verification-tenant-summary", source) });
}

function recommendedAction(state: IntegrityVerificationState): string {
  if (state === "INVALID" || state === "CERTIFICATION_BLOCKED") return "Block certification, preserve forensic evidence, and require operator review.";
  if (state === "FAILED") return "Quarantine affected records and rerun hash-chain verification.";
  if (state === "DEGRADED") return "Escalate for governance review and schedule deterministic revalidation.";
  if (state === "WARNING") return "Continue monitoring and capture follow-up evidence.";
  return "Continue continuous verification.";
}

function buildEvidence(verification_id: string, integrity: ReturnType<typeof buildIntegrityContract>, chain: ReturnType<typeof buildAutonomousHashChain>, tamper: ReturnType<typeof runTamperDetection>, results: readonly IntegrityVerificationResult[], confidence: number): IntegrityCertificationEvidence {
  const source = {
    evidence_id: id("IVE", "integrity-verification-evidence-id", { verification_id, chain: chain.chain_id }),
    verification_id,
    source_integrity_hash: integrity.record_hash,
    chain_terminal_hash: chain.terminal_hash,
    tamper_forensic_hash: tamper.forensic_evidence.evidence_hash,
    result_hashes: freezeArray(results.map((item) => item.result_hash)),
    confidence_score: confidence,
  };
  return Object.freeze({ ...source, certification_evidence_hash: hashValue("integrity-verification-certification-evidence", source) });
}

function buildRecord(verification_id: string, integrity: ReturnType<typeof buildIntegrityContract>, chain: ReturnType<typeof buildAutonomousHashChain>, tamper: ReturnType<typeof runTamperDetection>, results: readonly IntegrityVerificationResult[], state: IntegrityVerificationState, confidence: number): IntegrityVerificationRecord {
  const chainValid = validateAutonomousHashChain(chain);
  const hash_verification = buildHashSummary(chainValid);
  const lineage_verification = buildLineageSummary(chain, chainValid);
  const governance_verification = buildGovernanceSummary(integrity, chainValid);
  const replay_verification = buildReplaySummary(chain, tamper);
  const tenant_isolation = buildTenantSummary(chain, chainValid);
  const certification_evidence = buildEvidence(verification_id, integrity, chain, tamper, results, confidence);
  const failed = results.map((item) => item.failure).filter((item): item is IntegrityVerificationFailure => Boolean(item));
  const source = {
    verification_id,
    tenant_id: integrity.tenant_id,
    artifact_id: integrity.artifact_id,
    artifact_type: integrity.artifact_type,
    verification_state: state,
    integrity_status: statusFromState(state),
    confidence_score: confidence,
    hash_verification,
    lineage_verification,
    governance_verification,
    replay_verification,
    tenant_isolation,
    recommended_action: recommendedAction(state),
    repair_recommendations: freezeArray(failed.length ? failed.map((failure) => `${failure}: ${recommendedAction(classifyIntegrityVerificationFailure(failure))}`) : ["No repair required. Continue monitoring."]),
    certification_evidence,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: hashValue("integrity-verification-record", source) });
}

export function runIntegrityVerification(input: IntegrityVerificationInput = {}): IntegrityVerificationReport {
  const mode: IntegrityVerificationMode = input.mode ?? "ON_DEMAND";
  const source_integrity_contract = input.integrityRecord ?? buildIntegrityContract();
  const source_chain = input.chain ?? buildAutonomousHashChain({ integrityRecord: source_integrity_contract });
  const tamper_report = input.tamperReport ?? runTamperDetection({ scenario: input.tamper_scenario ?? SCENARIO_TAMPER[input.scenario ?? "BASELINE"], chain: source_chain });
  const verification_results = buildResults({ ...input, integrityRecord: source_integrity_contract, chain: source_chain, tamperReport: tamper_report });
  const verification_state = deriveVerificationState(verification_results);
  const confidence_score = Math.min(...verification_results.map((item) => item.confidence_score));
  const verification_id = id("IVS", "integrity-verification-id", { mode, scenario: input.scenario ?? "BASELINE", chain: source_chain.chain_id });
  const verification_record = buildRecord(verification_id, source_integrity_contract, source_chain, tamper_report, verification_results, verification_state, confidence_score);
  const failed_checks = freezeArray([...new Set(verification_results.map((item) => item.failure).filter((item): item is IntegrityVerificationFailure => Boolean(item)))]);
  const supporting_evidence = uniq([
    source_integrity_contract.record_hash,
    source_chain.certification_evidence_hash,
    tamper_report.report_hash,
    tamper_report.forensic_evidence.evidence_hash,
    verification_record.certification_evidence.certification_evidence_hash,
    ...verification_results.map((item) => item.result_hash),
  ]);
  const base = {
    phase_version: "8H.4" as const,
    schema_version: SCHEMA_VERSION,
    verification_id,
    verification_mode: mode,
    verification_timestamp: NOW,
    source_integrity_contract,
    source_chain,
    tamper_report,
    verification_results,
    verification_record,
    verification_state,
    integrity_status: statusFromState(verification_state),
    integrity_state: integrityStateFromVerification(verification_state),
    confidence_score,
    certification_ready: verification_state === "VERIFIED",
    certification_blocked: verification_state !== "VERIFIED",
    failed_checks,
    supporting_evidence,
    advisory_only_notice: "The Integrity Verification Service produces certification evidence and does not rewrite autonomous history.",
  };
  return Object.freeze({ ...base, report_hash: hashValue("integrity-verification-report", base) });
}

export function validateIntegrityVerificationReport(input: IntegrityVerificationInput | IntegrityVerificationReport = {}) {
  const report = "phase_version" in input ? input as IntegrityVerificationReport : runIntegrityVerification(input as IntegrityVerificationInput);
  return Object.freeze({
    verification_id: report.verification_id,
    verification_state: report.verification_state,
    integrity_status: report.integrity_status,
    valid: report.verification_state === "VERIFIED",
    certification_ready: report.certification_ready,
    certification_blocked: report.certification_blocked,
    evidence_complete: Boolean(report.verification_record.certification_evidence.certification_evidence_hash),
    failed_checks: report.failed_checks,
    report_hash: report.report_hash,
  });
}

export function buildIntegrityVerificationObservabilitySurface(input: IntegrityVerificationInput = {}): IntegrityVerificationObservabilitySurface {
  const report = runIntegrityVerification(input);
  return Object.freeze({
    verification_id: report.verification_id,
    verification_mode: report.verification_mode,
    tenant_id: report.source_integrity_contract.tenant_id,
    artifact_id: report.source_integrity_contract.artifact_id,
    verification_state: report.verification_state,
    integrity_status: report.integrity_status,
    confidence_score: report.confidence_score,
    certification_ready: report.certification_ready,
    certification_blocked: report.certification_blocked,
    failed_modules: freezeArray(report.verification_results.filter((item) => !item.passed).map((item) => item.module)),
    failed_checks: report.failed_checks,
    evidence_hash: report.verification_record.certification_evidence.certification_evidence_hash,
    report_hash: report.report_hash,
  });
}

export function getIntegrityVerificationContract() {
  const report = runIntegrityVerification({ mode: "CONTINUOUS" });
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "continuous-autonomous-history-verification",
        "hash-reproducibility-verification",
        "deterministic-replay-verification",
        "complete-lineage-verification",
        "governance-and-constitutional-verification",
        "tenant-isolation-verification",
        "chain-continuity-verification",
        "confidence-scored-certification-evidence",
        "fail-closed-certification-blocking",
      ]),
      schema_version: SCHEMA_VERSION,
      verification_modes: freezeArray(["CONTINUOUS", "SCHEDULED", "ON_DEMAND"] as const),
      failure_state_mapping: FAILURE_STATE,
    }),
    report,
    validation: validateIntegrityVerificationReport(report),
    observability: buildIntegrityVerificationObservabilitySurface({ mode: "CONTINUOUS" }),
  });
}
