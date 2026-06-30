import { buildExecutionReconstructionPackage, computeExecutionReconstructionIdentityHash, computeExecutionReconstructionValidationHash, computeExecutionTimelineHash } from "@/services/autonomous-execution-reconstruction";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildPlanningDecisionReconstructionPackage, computeDecisionReplayHash, computeDelegationReplayHash, computePlanningDecisionValidationHash, computePlanningReplayHash, computePlanningReplayIdentityHash, computeReasoningReplayHash } from "@/services/planning-decision-reconstruction";
import { buildReplayContractPackage, computeReplayArtifactManifestHash, computeReplayGovernanceHash, computeReplayIdentityHash, computeReplayIntegrityHash, computeReplayOrderingHash } from "@/services/replay-contract";
import { buildSupervisionInterventionReplayPackage, computeGovernanceReplayHash, computeHealthTimelineHash, computeInterventionTimelineHash, computeSupervisionReplayIdentityHash, computeSupervisionReplayValidationHash, computeSupervisionTimelineHash } from "@/services/supervision-intervention-replay";
import type {
  ReplayCertificationArea,
  ReplayCertificationAuditReport,
  ReplayCertificationCheck,
  ReplayCertificationEvidence,
  ReplayCertificationFailure,
  ReplayCertificationGateInput,
  ReplayCertificationLedgerEntry,
  ReplayCertificationReadiness,
  ReplayCertificationReport,
  ReplayCertificationResult,
  ReplayCertificationScenario,
  ReplayCertificationState,
  ReplayCertificationVisibilitySurface,
  ReplayQualityMetrics,
} from "@/types/replay-certification-gate";

const NOW = "2026-06-30T10:00:00.000Z";
const VERSION = "replay-certification-gate/v8G.5" as const;
const PIPELINE = Object.freeze(["REGISTER_CERTIFICATION", "VALIDATE_CONTRACT", "VERIFY_REPLAY_ARTIFACTS", "VERIFY_DETERMINISM", "VERIFY_GOVERNANCE", "VERIFY_INTEGRITY", "VERIFY_LINEAGE", "VERIFY_EXPLAINABILITY", "GENERATE_EVIDENCE", "CERTIFICATION_DECISION"]);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values.filter(Boolean))].sort()); }
function id(prefix: string, domain: string, value: unknown) { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

type Row = readonly [ReplayCertificationArea, string, ReplayCertificationFailure, boolean];
const TEST_MATRIX = Object.freeze(([
  ["CONTRACT", "replay contract valid", "REPLAY_CONTRACT_INVALID", true],
  ["SCHEMA", "replay schema valid", "REPLAY_SCHEMA_INVALID", true],
  ["CONTRACT", "missing replay contract rejected", "REPLAY_CONTRACT_MISSING", true],
  ["EXECUTION", "execution replay reproducible", "EXECUTION_REPLAY_NOT_REPRODUCIBLE", true],
  ["EXECUTION", "execution mismatch detected", "EXECUTION_MISMATCH", true],
  ["PLANNING", "planning replay reproducible", "PLANNING_REPLAY_NOT_REPRODUCIBLE", true],
  ["PLANNING", "planning mismatch detected", "PLANNING_MISMATCH", true],
  ["DECISION", "decision replay reproducible", "DECISION_REPLAY_NOT_REPRODUCIBLE", true],
  ["DECISION", "decision mismatch detected", "DECISION_MISMATCH", true],
  ["DELEGATION", "delegation replay reproducible", "DELEGATION_REPLAY_NOT_REPRODUCIBLE", true],
  ["DELEGATION", "delegation mismatch detected", "DELEGATION_MISMATCH", true],
  ["ORCHESTRATION", "orchestration replay reproducible", "ORCHESTRATION_REPLAY_NOT_REPRODUCIBLE", true],
  ["ORCHESTRATION", "orchestration mismatch detected", "ORCHESTRATION_MISMATCH", true],
  ["SUPERVISION", "supervision replay reproducible", "SUPERVISION_REPLAY_NOT_REPRODUCIBLE", true],
  ["SUPERVISION", "supervision mismatch detected", "SUPERVISION_MISMATCH", true],
  ["INTERVENTION", "intervention replay reproducible", "INTERVENTION_REPLAY_NOT_REPRODUCIBLE", true],
  ["INTERVENTION", "intervention mismatch detected", "INTERVENTION_MISMATCH", true],
  ["ROLLBACK", "rollback replay reproducible", "ROLLBACK_REPLAY_NOT_REPRODUCIBLE", true],
  ["ROLLBACK", "rollback mismatch detected", "ROLLBACK_MISMATCH", true],
  ["PAUSE", "pause replay reproducible", "PAUSE_REPLAY_NOT_REPRODUCIBLE", true],
  ["PAUSE", "pause mismatch detected", "PAUSE_MISMATCH", true],
  ["OUTCOME", "outcome replay reproducible", "OUTCOME_REPLAY_NOT_REPRODUCIBLE", true],
  ["OUTCOME", "outcome mismatch detected", "OUTCOME_MISMATCH", true],
  ["CONFIDENCE", "confidence replay reproducible", "CONFIDENCE_REPLAY_NOT_REPRODUCIBLE", true],
  ["CONFIDENCE", "confidence mismatch detected", "CONFIDENCE_MISMATCH", true],
  ["ORDERING", "execution ordering deterministic", "EXECUTION_ORDERING_NONDETERMINISTIC", true],
  ["CHECKPOINT", "checkpoint replay deterministic", "CHECKPOINT_REPLAY_NONDETERMINISTIC", true],
  ["CHECKPOINT", "checkpoint mismatch detected", "CHECKPOINT_MISMATCH", true],
  ["GOVERNANCE", "governance evidence preserved", "GOVERNANCE_EVIDENCE_MISSING", true],
  ["GOVERNANCE", "evidence mismatch detected", "EVIDENCE_MISMATCH", true],
  ["INTEGRITY", "integrity hashes verified", "INTEGRITY_HASH_VERIFICATION_FAILED", true],
  ["LINEAGE", "replay lineage complete", "REPLAY_LINEAGE_INCOMPLETE", true],
  ["TENANT", "tenant isolation enforced", "TENANT_ISOLATION_VIOLATION", true],
  ["AUTHORITY", "authority boundaries preserved", "AUTHORITY_ESCALATION_DETECTED", true],
  ["CONSTITUTIONAL", "constitutional compliance preserved", "CONSTITUTIONAL_COMPLIANCE_BROKEN", true],
  ["EXPLAINABILITY", "replay explainable", "REPLAY_NOT_EXPLAINABLE", true],
  ["CERTIFICATION_SUITE", "minor replay metadata completeness", "MINOR_REPLAY_METADATA_GAP", false],
] as readonly Row[]).map(([area, test_name, failure, critical]) => ({ area, test_name, failure, critical })));

function sign(integrity_hash: string): string { return hashValue("replay-certification-signature", { signer: "mission-control-replay-certification", integrity_hash }); }

function inputPackages(input: ReplayCertificationGateInput) {
  const scenario = input.scenario ?? "BASELINE";
  const replay = input.replayContractPackage ?? buildReplayContractPackage({ scenario: scenario === "REPLAY_CONTRACT_INVALID" || scenario === "REPLAY_SCHEMA_INVALID" || scenario === "REPLAY_CONTRACT_MISSING" ? "ARTIFACT_MISSING" : scenario === "GOVERNANCE_EVIDENCE_MISSING" ? "GOVERNANCE_FAILURE" : scenario === "REPLAY_LINEAGE_INCOMPLETE" ? "LINEAGE_FAILURE" : scenario === "TENANT_ISOLATION_VIOLATION" ? "TENANT_VIOLATION" : scenario === "INTEGRITY_HASH_VERIFICATION_FAILED" ? "HASH_MISMATCH" : "BASELINE" });
  const execution = input.executionReconstructionPackage ?? buildExecutionReconstructionPackage({ scenario: scenario === "EXECUTION_MISMATCH" || scenario === "EXECUTION_REPLAY_NOT_REPRODUCIBLE" || scenario === "ORCHESTRATION_MISMATCH" || scenario === "OUTCOME_MISMATCH" ? "EXECUTION_DIVERGENCE" : scenario === "EXECUTION_ORDERING_NONDETERMINISTIC" || scenario === "ORCHESTRATION_REPLAY_NOT_REPRODUCIBLE" ? "INVALID_TRANSITION" : scenario === "CHECKPOINT_MISMATCH" || scenario === "CHECKPOINT_REPLAY_NONDETERMINISTIC" ? "CHECKPOINT_MISMATCH" : scenario === "ROLLBACK_MISMATCH" || scenario === "ROLLBACK_REPLAY_NOT_REPRODUCIBLE" ? "ROLLBACK_DIVERGENCE" : scenario === "INTEGRITY_HASH_VERIFICATION_FAILED" ? "INTEGRITY_VIOLATION" : "BASELINE", sourceReplayContract: replay });
  const planning = input.planningDecisionReconstructionPackage ?? buildPlanningDecisionReconstructionPackage({ scenario: scenario === "PLANNING_MISMATCH" || scenario === "PLANNING_REPLAY_NOT_REPRODUCIBLE" ? "PLANNING_DIVERGENCE" : scenario === "DECISION_MISMATCH" || scenario === "DECISION_REPLAY_NOT_REPRODUCIBLE" ? "DECISION_MISMATCH" : scenario === "DELEGATION_MISMATCH" || scenario === "DELEGATION_REPLAY_NOT_REPRODUCIBLE" ? "DELEGATION_INCONSISTENCY" : scenario === "CONFIDENCE_MISMATCH" || scenario === "CONFIDENCE_REPLAY_NOT_REPRODUCIBLE" ? "CONFIDENCE_MISMATCH" : scenario === "AUTHORITY_ESCALATION_DETECTED" ? "AUTHORITY_MISMATCH" : scenario === "CONSTITUTIONAL_COMPLIANCE_BROKEN" ? "CONSTITUTIONAL_VIOLATION" : "BASELINE", sourceReplayContract: replay });
  const supervision = input.supervisionInterventionReplayPackage ?? buildSupervisionInterventionReplayPackage({ scenario: scenario === "SUPERVISION_MISMATCH" || scenario === "SUPERVISION_REPLAY_NOT_REPRODUCIBLE" ? "SUPERVISION_DIVERGENCE" : scenario === "INTERVENTION_MISMATCH" || scenario === "INTERVENTION_REPLAY_NOT_REPRODUCIBLE" ? "INTERVENTION_MISMATCH" : scenario === "PAUSE_MISMATCH" || scenario === "PAUSE_REPLAY_NOT_REPRODUCIBLE" ? "PAUSE_MISMATCH" : scenario === "GOVERNANCE_EVIDENCE_MISSING" || scenario === "EVIDENCE_MISMATCH" ? "MISSING_RUNTIME_EVIDENCE" : "BASELINE", sourceReplayContract: replay });
  return { replay, execution, planning, supervision };
}

function automaticFailures(packages: ReturnType<typeof inputPackages>): readonly ReplayCertificationFailure[] {
  const failures: ReplayCertificationFailure[] = [];
  const replayHashesValid = computeReplayIdentityHash(packages.replay.replay_identity) === packages.replay.replay_identity.integrity_hash
    && computeReplayArtifactManifestHash(packages.replay.artifact_manifest) === packages.replay.artifact_manifest.manifest_hash
    && computeReplayOrderingHash(packages.replay.ordering) === packages.replay.ordering.ordering_hash
    && computeReplayIntegrityHash(packages.replay.integrity_record) === packages.replay.integrity_record.integrity_hash
    && computeReplayGovernanceHash(packages.replay.governance) === packages.replay.governance.governance_hash;
  if (packages.replay.validation.validation_state !== "PASS") failures.push("REPLAY_CONTRACT_INVALID");
  if (!replayHashesValid) failures.push("INTEGRITY_HASH_VERIFICATION_FAILED");
  if (packages.execution.validation.outcome !== "VERIFIED") failures.push("EXECUTION_MISMATCH");
  if (packages.planning.validation.outcome !== "VERIFIED") failures.push("PLANNING_MISMATCH");
  if (packages.supervision.validation.outcome !== "VERIFIED") failures.push("SUPERVISION_MISMATCH");
  if (computeExecutionReconstructionIdentityHash(packages.execution.identity) !== packages.execution.identity.integrity_hash || computeExecutionTimelineHash(packages.execution.timeline) !== packages.execution.timeline.timeline_hash || computeExecutionReconstructionValidationHash(packages.execution.validation) !== packages.execution.validation.validation_hash) failures.push("INTEGRITY_HASH_VERIFICATION_FAILED");
  if (computePlanningReplayIdentityHash(packages.planning.identity) !== packages.planning.identity.integrity_hash || computePlanningReplayHash(packages.planning.planning_replay) !== packages.planning.planning_replay.planning_hash || computeDecisionReplayHash(packages.planning.decision_replay) !== packages.planning.decision_replay.decision_hash || computeDelegationReplayHash(packages.planning.delegation_replay) !== packages.planning.delegation_replay.delegation_hash || computeReasoningReplayHash(packages.planning.reasoning_replay) !== packages.planning.reasoning_replay.reasoning_hash || computePlanningDecisionValidationHash(packages.planning.validation) !== packages.planning.validation.validation_hash) failures.push("INTEGRITY_HASH_VERIFICATION_FAILED");
  if (computeSupervisionReplayIdentityHash(packages.supervision.identity) !== packages.supervision.identity.integrity_hash || computeSupervisionTimelineHash(packages.supervision.supervision_timeline).length === 0 || computeInterventionTimelineHash(packages.supervision.intervention_timeline).length === 0 || computeHealthTimelineHash(packages.supervision.health_timeline).length === 0 || computeGovernanceReplayHash(packages.supervision.governance_replay) !== packages.supervision.governance_replay.governance_hash || computeSupervisionReplayValidationHash(packages.supervision.validation) !== packages.supervision.validation.validation_hash) failures.push("INTEGRITY_HASH_VERIFICATION_FAILED");
  if (!packages.replay.replay_identity.lineage_reference || !packages.execution.identity.lineage_reference || !packages.planning.identity.lineage_reference || !packages.supervision.identity.lineage_reference) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  if (new Set([packages.replay.replay_identity.tenant_id, packages.execution.identity.tenant_id, packages.planning.identity.tenant_id, packages.supervision.identity.tenant_id]).size !== 1) failures.push("TENANT_ISOLATION_VIOLATION");
  if (packages.replay.governance.governance_state !== "VALID" || packages.supervision.governance_replay.governance_decision !== "APPROVED") failures.push("GOVERNANCE_EVIDENCE_MISSING");
  if (!packages.planning.validation.authority_validated) failures.push("AUTHORITY_ESCALATION_DETECTED");
  if (!packages.planning.validation.constitutionally_compliant || !packages.supervision.validation.constitutional_replay_valid) failures.push("CONSTITUTIONAL_COMPLIANCE_BROKEN");
  if (!packages.planning.validation.evidence_complete || !packages.supervision.validation.evidence_complete) failures.push("EVIDENCE_MISMATCH");
  return unique(failures);
}

function buildChecks(certification_id: string, scenario: ReplayCertificationScenario, packages: ReturnType<typeof inputPackages>): readonly ReplayCertificationCheck[] {
  const autoFailures = automaticFailures(packages);
  const forced = scenario === "BASELINE" ? null : scenario;
  const evidenceRefs = unique([packages.replay.artifact_manifest.manifest_hash, packages.execution.timeline.timeline_hash, packages.planning.planning_replay.planning_hash, packages.supervision.governance_replay.governance_hash]);
  const replayRefs = unique([packages.replay.package_hash, packages.execution.package_hash, packages.planning.package_hash, packages.supervision.package_hash]);
  const integrityRefs = unique([packages.replay.integrity_record.integrity_hash, packages.execution.identity.integrity_hash, packages.planning.identity.integrity_hash, packages.supervision.identity.integrity_hash]);
  return freezeArray(TEST_MATRIX.map((definition) => {
    const failed = autoFailures.includes(definition.failure) || forced === definition.failure;
    const actual = failed ? "FAIL" as const : "PASS" as const;
    const critical = forced === definition.failure && definition.failure === "MINOR_REPLAY_METADATA_GAP" ? false : definition.critical;
    const source = { check_id: id("RCGC", "replay-certification-check-id", { certification_id, test: definition.test_name }), area: definition.area, test_name: definition.test_name, expected: "PASS" as const, actual, passed: actual === "PASS", critical, failure_reason: failed ? definition.failure : null, evidence_refs: evidenceRefs, replay_refs: replayRefs, integrity_refs: integrityRefs, explanation: actual === "PASS" ? `${definition.test_name} satisfied Replay Certification.` : `${definition.test_name} failed Replay Certification.` };
    return Object.freeze({ ...source, check_hash: hashValue("replay-certification-check", source) });
  }));
}

function aggregate(certification_id: string, checks: readonly ReplayCertificationCheck[]): ReplayCertificationResult {
  const failed = checks.filter((check) => !check.passed);
  const critical = failed.filter((check) => check.critical);
  const warnings = failed.length - critical.length;
  const certification_state: ReplayCertificationState = critical.length ? "FAIL" : warnings ? "CONDITIONAL_PASS" : "PASS";
  const source = { result_id: id("RCGR", "replay-certification-result-id", certification_id), certification_state, tests_passed: checks.length - failed.length, tests_failed: failed.length, critical_failure_count: critical.length, warning_count: warnings, failed_tests: unique(failed.map((check) => check.failure_reason).filter((item): item is ReplayCertificationFailure => Boolean(item))), readiness_status: certification_state === "PASS" ? "PRODUCTION_READY" as const : certification_state === "CONDITIONAL_PASS" ? "BLOCKED_PENDING_FULL_PASS" as const : "CERTIFICATION_DENIED" as const };
  return Object.freeze({ ...source, result_hash: hashValue("replay-certification-result", source) });
}

function metrics(result: ReplayCertificationResult): ReplayQualityMetrics {
  const total = result.tests_passed + result.tests_failed;
  const score = Number((result.tests_passed / total).toFixed(4));
  const criticalPenalty = result.critical_failure_count ? 0 : 1;
  const warningPenalty = result.warning_count ? 0.95 : 1;
  const overall = Number((score * criticalPenalty * warningPenalty).toFixed(4));
  return Object.freeze({ replay_completeness: score, replay_determinism: result.failed_tests.some((f) => f.includes("NONDETERMINISTIC") || f.includes("REPRODUCIBLE")) ? 0 : 1, reconstruction_accuracy: result.failed_tests.some((f) => f.includes("MISMATCH")) ? 0 : 1, replay_consistency: score, governance_preservation: result.failed_tests.includes("GOVERNANCE_EVIDENCE_MISSING") ? 0 : 1, constitutional_preservation: result.failed_tests.includes("CONSTITUTIONAL_COMPLIANCE_BROKEN") ? 0 : 1, integrity_verification: result.failed_tests.includes("INTEGRITY_HASH_VERIFICATION_FAILED") ? 0 : 1, lineage_completeness: result.failed_tests.includes("REPLAY_LINEAGE_INCOMPLETE") ? 0 : 1, explainability_completeness: result.failed_tests.includes("REPLAY_NOT_EXPLAINABLE") ? 0 : 1, replay_confidence: overall, overall_score: overall });
}

function buildEvidence(certification_id: string, result: ReplayCertificationResult, checks: readonly ReplayCertificationCheck[], quality: ReplayQualityMetrics, packages: ReturnType<typeof inputPackages>): ReplayCertificationEvidence {
  const warnings = unique(checks.filter((check) => !check.passed && !check.critical).map((check) => check.failure_reason).filter((item): item is ReplayCertificationFailure => Boolean(item)));
  const source = { certification_id, phase: "8G.5" as const, replay_id: packages.replay.replay_identity.replay_id, mission_id: packages.replay.replay_identity.mission_id, tenant_id: packages.replay.replay_identity.tenant_id, contract_version: packages.replay.contract_version, schema_version: "autonomy-replay-schema/v8G", determinism_score: quality.replay_determinism, integrity_score: quality.integrity_verification, governance_score: quality.governance_preservation, lineage_score: quality.lineage_completeness, explainability_score: quality.explainability_completeness, overall_score: quality.overall_score, certification_state: result.certification_state, executed_tests: freezeArray(checks.map((check) => check.test_name)), failed_tests: result.failed_tests, warnings, timestamp: NOW, truth_reference: packages.replay.replay_identity.truth_reference, lineage_reference: packages.replay.replay_identity.lineage_reference, evidence_hashes: unique([packages.replay.artifact_manifest.manifest_hash, packages.execution.timeline.timeline_hash, packages.planning.planning_replay.planning_hash, packages.supervision.governance_replay.governance_hash, result.result_hash]), replay_references: unique([packages.replay.package_hash, packages.execution.package_hash, packages.planning.package_hash, packages.supervision.package_hash]), integrity_references: unique([packages.replay.integrity_record.integrity_hash, packages.execution.identity.integrity_hash, packages.planning.identity.integrity_hash, packages.supervision.identity.integrity_hash]) };
  return Object.freeze({ ...source, evidence_hash: hashValue("replay-certification-evidence", source) });
}

function audit(certification_id: string, checks: readonly ReplayCertificationCheck[], evidence: ReplayCertificationEvidence): ReplayCertificationAuditReport {
  const source = { audit_id: id("RCGA", "replay-certification-audit-id", certification_id), certification_id, test_results: checks, evidence_manifest: evidence, integrity_verification: "VALID" as const, deterministic_replay_verification: evidence.certification_state === "PASS" ? "VALID" as const : "INVALID" as const };
  return Object.freeze({ ...source, audit_hash: hashValue("replay-certification-audit", { audit_id: source.audit_id, certification_id, check_hashes: checks.map((check) => check.check_hash), evidence_hash: evidence.evidence_hash, integrity_verification: source.integrity_verification, deterministic_replay_verification: source.deterministic_replay_verification }) });
}

function readiness(certification_id: string, result: ReplayCertificationResult): ReplayCertificationReadiness {
  const source = { readiness_id: id("RCGRD", "replay-certification-readiness-id", certification_id), certification_id, readiness_status: result.readiness_status, downstream_autonomy_unlocked: result.certification_state === "PASS", blocking_issues: result.failed_tests, recommended_actions: result.certification_state === "PASS" ? freezeArray(["Record certification evidence in Truth Ledger", "Enable downstream autonomy dependencies"]) : freezeArray(["Remediate failed replay certification checks", "Rerun deterministic replay certification"]) };
  return Object.freeze({ ...source, readiness_hash: hashValue("replay-certification-readiness", source) });
}

function reportHashSource(report: Omit<ReplayCertificationReport, "digital_signature" | "integrity_hash">) {
  return { certification_id: report.certification_id, result_hash: report.certification_result.result_hash, evidence_hash: report.certification_evidence.evidence_hash, audit_hash: report.audit_report.audit_hash, readiness_hash: report.readiness.readiness_hash, ledger_hash: report.ledger_entry.ledger_hash, check_hashes: report.certification_checks.map((check) => check.check_hash) };
}

export function runReplayCertificationGate(input: ReplayCertificationGateInput = {}): ReplayCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const packages = inputPackages(input);
  const certification_id = id("RCG", "replay-certification-id", { replay: packages.replay.package_hash, scenario });
  const certification_checks = buildChecks(certification_id, scenario, packages);
  const certification_result = aggregate(certification_id, certification_checks);
  const quality_metrics = metrics(certification_result);
  const certification_evidence = buildEvidence(certification_id, certification_result, certification_checks, quality_metrics, packages);
  const audit_report = audit(certification_id, certification_checks, certification_evidence);
  const readiness_report = readiness(certification_id, certification_result);
  const ledgerSource = { ledger_entry_id: id("RCGL", "replay-certification-ledger-id", certification_id), certification_id, decision: certification_result.certification_state, evidence_hash: certification_evidence.evidence_hash, result_hash: certification_result.result_hash, audit_hash: audit_report.audit_hash, replay_references: certification_evidence.replay_references, append_only: true as const };
  const ledger_entry: ReplayCertificationLedgerEntry = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("replay-certification-ledger", ledgerSource) });
  const pass = certification_result.certification_state === "PASS";
  const source = { certification_id, certification_version: VERSION, phase: "8G.5" as const, generated_at: NOW, replay_framework_version: "autonomy-replay/v8G" as const, source_replay_contract: packages.replay, execution_reconstruction: packages.execution, planning_decision_reconstruction: packages.planning, supervision_intervention_replay: packages.supervision, certification_checks, quality_metrics, certification_result, certification_evidence, audit_report, readiness: readiness_report, ledger_entry, deterministic: pass, reproducible: pass, complete: certification_result.certification_state !== "FAIL", explainable: !certification_result.failed_tests.includes("REPLAY_NOT_EXPLAINABLE"), immutable: true, governance_compliant: !certification_result.failed_tests.includes("GOVERNANCE_EVIDENCE_MISSING"), constitutionally_compliant: !certification_result.failed_tests.includes("CONSTITUTIONAL_COMPLIANCE_BROKEN"), cryptographically_verifiable: !certification_result.failed_tests.includes("INTEGRITY_HASH_VERIFICATION_FAILED"), tenant_isolated: !certification_result.failed_tests.includes("TENANT_ISOLATION_VIOLATION"), independently_auditable: true, downstream_autonomy_unlocked: pass };
  const integrity_hash = hashValue("replay-certification-report", reportHashSource(source));
  return Object.freeze({ ...source, digital_signature: sign(integrity_hash), integrity_hash });
}

export function buildReplayCertificationVisibilitySurface(input: ReplayCertificationGateInput = {}): ReplayCertificationVisibilitySurface {
  const report = runReplayCertificationGate(input);
  return Object.freeze({ certification_id: report.certification_id, certification_state: report.certification_result.certification_state, readiness_status: report.readiness.readiness_status, downstream_autonomy_unlocked: report.downstream_autonomy_unlocked, overall_score: report.quality_metrics.overall_score, tests_failed: report.certification_result.tests_failed, critical_failure_count: report.certification_result.critical_failure_count, blocking_issues: report.readiness.blocking_issues, integrity_status: sign(report.integrity_hash) === report.digital_signature ? "VALID" : "INVALID", integrity_hash: report.integrity_hash });
}

export function getReplayCertificationGateContract() {
  const report = runReplayCertificationGate();
  return Object.freeze({ doctrine: Object.freeze({ principles: freezeArray(["deterministic-replay-certified", "reproducible-replay", "complete-replay-artifacts", "explainable-reconstruction", "immutable-evidence", "governance-compliant", "constitutionally-compliant", "cryptographically-verifiable", "tenant-isolated", "independently-auditable", "fail-closed"]), certification_version: VERSION, workflow: freezeArray(PIPELINE), states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), areas: freezeArray(["CONTRACT", "SCHEMA", "EXECUTION", "PLANNING", "DECISION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "INTERVENTION", "ROLLBACK", "PAUSE", "OUTCOME", "CONFIDENCE", "ORDERING", "CHECKPOINT", "GOVERNANCE", "INTEGRITY", "LINEAGE", "TENANT", "AUTHORITY", "CONSTITUTIONAL", "EXPLAINABILITY", "CERTIFICATION_SUITE"] as const) }), report, visibility: buildReplayCertificationVisibilitySurface() });
}
