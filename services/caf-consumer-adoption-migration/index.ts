import { runPlatformCertification, validatePlatformCertification } from "@/services/caf-platform-certification";
import { runSdkInterfaceQualification, validateSdkInterfaceQualification } from "@/services/caf-sdk-interface-qualification";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ConsumerAdoptionCertificationOutcome,
  ConsumerAdoptionMigrationBundle,
  ConsumerAdoptionMigrationFailure,
  ConsumerAdoptionMigrationInput,
  ConsumerAdoptionMigrationResult,
  ConsumerAdoptionMigrationScenario,
  ConsumerAdoptionMigrationValidation,
  MigrationState,
} from "@/types/caf-consumer-adoption-migration";

const VERSION = "caf-consumer-adoption-migration/v3.17" as const;
const IDENTIFIER = "CafConsumerAdoptionMigration" as const;
const LIFECYCLE: readonly MigrationState[] = Object.freeze(["PLANNED", "READINESS_IN_PROGRESS", "READY_FOR_APPROVAL", "APPROVED", "ROLLOUT_IN_PROGRESS", "TRANSITION_IN_PROGRESS", "STABILIZING", "COMPLETED"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: ConsumerAdoptionMigrationScenario): ConsumerAdoptionMigrationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly ConsumerAdoptionMigrationFailure[], failure: ConsumerAdoptionMigrationFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly ConsumerAdoptionMigrationFailure[]): ConsumerAdoptionCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<ConsumerAdoptionMigrationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    plan: result.migration_plan.integrity_hash,
    readiness: result.readiness_assessment.integrity_hash,
    compatibility: result.compatibility_result.integrity_hash,
    adoption: result.adoption_decision.integrity_hash,
    rollout: result.rollout_status.integrity_hash,
    transition: result.transition_record.integrity_hash,
    evidence: result.migration_evidence.integrity_hash,
    report: result.adoption_report.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ConsumerAdoptionMigrationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runConsumerAdoptionMigration(input: ConsumerAdoptionMigrationInput = {}): ConsumerAdoptionMigrationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ConsumerAdoptionMigrationFailure>(direct ? [direct] : []);
  const p315 = runPlatformCertification();
  const p316 = runSdkInterfaceQualification();
  const dependencyFailures = freezeArray<ConsumerAdoptionMigrationFailure>([
    ...(!validatePlatformCertification(p315).valid || has(scenarioFailures, "P3_15_PLATFORM_CERTIFICATE_INVALID") ? ["P3_15_PLATFORM_CERTIFICATE_INVALID" as const] : []),
    ...(!validateSdkInterfaceQualification(p316).valid || has(scenarioFailures, "P3_16_SDK_INTERFACE_INVALID") ? ["P3_16_SDK_INTERFACE_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const lifecycle = has(failures, "MIGRATION_LIFECYCLE_BYPASSED") ? freezeArray(["PLANNED", "APPROVED", "COMPLETED"] as const) : LIFECYCLE;
  const migration_plan = nested({
    plan_id: has(failures, "MIGRATION_PLAN_MISSING") ? "" : "P3.17-MIGRATION-PLAN-001",
    strategy: "PHASED" as const,
    sequencing: lifecycle,
    dependency_plan_refs: freezeArray([p315.certificate.certificate_id, p316.certified_sdk_manifest.manifest_id]),
    rollout_waves: freezeArray(["pilot", "canary", "tenant-wave-1", "full"]),
    rollback_prepared: !has(failures, "ROLLBACK_GOVERNANCE_MISSING"),
    readiness_validation_ref: "readiness:p3.17:consumer",
    approved: !has(failures, "GOVERNANCE_APPROVAL_MISSING"),
  });
  const readinessOk = !has(failures, "READINESS_ASSESSMENT_FAILED");
  const readiness_assessment = nested({
    assessment_id: "P3.17-CONSUMER-READINESS-001",
    platform_compatible: readinessOk,
    infrastructure_ready: readinessOk,
    governance_ready: readinessOk,
    operational_ready: readinessOk,
    security_ready: readinessOk,
    dependency_ready: readinessOk,
    result: readinessOk ? "READY" as const : "NOT_READY" as const,
  });
  const compatibilityOk = !has(failures, "COMPATIBILITY_NOT_VERIFIED") && !has(failures, "INCOMPATIBLE_CONSUMER_APPROVED");
  const compatibility_result = nested({
    compatibility_id: "P3.17-COMPATIBILITY-001",
    api_status: compatibilityOk ? "COMPATIBLE" as const : "UNKNOWN" as const,
    sdk_status: compatibilityOk ? "COMPATIBLE" as const : "UNKNOWN" as const,
    behavioral_status: compatibilityOk ? "COMPATIBLE" as const : "UNKNOWN" as const,
    governance_status: compatibilityOk ? "COMPATIBLE" as const : "UNKNOWN" as const,
    policy_status: compatibilityOk ? "COMPATIBLE" as const : "UNKNOWN" as const,
    version_status: compatibilityOk ? "COMPATIBLE" as const : "UNKNOWN" as const,
    verified_before_rollout: compatibilityOk,
    deterministic: !has(failures, "COMPATIBILITY_NOT_VERIFIED"),
  });
  const governanceOk = !has(failures, "GOVERNANCE_APPROVAL_MISSING") && !has(failures, "CONSTITUTIONAL_GOVERNANCE_BYPASSED");
  const adoption_decision = nested({
    decision_id: "P3.17-ADOPTION-DECISION-001",
    approval_refs: governanceOk ? freezeArray(["approval:p3.17:adoption-board", p315.decision.decision_id]) : freezeArray([]),
    governance_checkpoint_refs: freezeArray(["checkpoint:readiness", "checkpoint:compatibility", "checkpoint:rollout"]),
    rollout_authorization_ref: governanceOk ? "rollout-authorization:p3.17" : "",
    constitutional_compliance: !has(failures, "CONSTITUTIONAL_GOVERNANCE_BYPASSED"),
    policy_enforced: !has(failures, "CONSTITUTIONAL_GOVERNANCE_BYPASSED"),
    decision: governanceOk && compatibilityOk ? "APPROVE" as const : "REQUIRES_GOVERNANCE_REVIEW" as const,
  });
  const rolloutAuthorized = adoption_decision.decision === "APPROVE" && !has(failures, "ROLLOUT_NOT_AUTHORIZED");
  const rollout_status = nested({
    rollout_id: "P3.17-ROLLOUT-001",
    strategy: migration_plan.strategy,
    deployment_waves: migration_plan.rollout_waves,
    checkpoints: freezeArray(["pilot-exit", "canary-exit", "tenant-wave-exit", "completion"]),
    advancement_criteria: freezeArray(["compatibility-clean", "governance-clear", "stability-threshold-met"]),
    rollback_triggers: has(failures, "ROLLBACK_GOVERNANCE_MISSING") ? freezeArray([]) : freezeArray(["compatibility-violation", "governance-violation", "operational-instability", "safety-breach"]),
    authorized: rolloutAuthorized,
    deterministic_sequence: !has(failures, "ROLLOUT_SEQUENCE_NON_DETERMINISTIC"),
    status: rolloutAuthorized ? "COMPLETED" as const : "PAUSED" as const,
  });
  const transition_record = nested({
    transition_id: "P3.17-TRANSITION-001",
    execution_ref: "migration-execution:p3.17",
    coexistence_period_ref: "coexistence:p3.17:30d",
    cutover_plan_ref: "cutover:p3.17:phased",
    rollback_readiness_ref: migration_plan.rollback_prepared ? "rollback:p3.17:ready" : "",
    operational_transition_ref: "operational-transition:p3.17",
    stabilization_ref: "stabilization:p3.17",
    operational_continuity_preserved: !has(failures, "TRANSITION_CONTINUITY_LOST"),
  });
  const evidenceComplete = !has(failures, "MIGRATION_EVIDENCE_MISSING");
  const lineageComplete = !has(failures, "MIGRATION_LINEAGE_INCOMPLETE");
  const migration_evidence = nested({
    evidence_id: "P3.17-MIGRATION-EVIDENCE-001",
    migration_plan_refs: evidenceComplete ? freezeArray([migration_plan.plan_id]) : freezeArray([]),
    readiness_refs: evidenceComplete ? freezeArray([readiness_assessment.assessment_id]) : freezeArray([]),
    compatibility_refs: evidenceComplete ? freezeArray([compatibility_result.compatibility_id]) : freezeArray([]),
    approval_refs: evidenceComplete ? adoption_decision.approval_refs : freezeArray([]),
    rollout_checkpoint_refs: evidenceComplete ? rollout_status.checkpoints : freezeArray([]),
    transition_milestone_refs: evidenceComplete ? freezeArray([transition_record.transition_id]) : freezeArray([]),
    rollback_refs: evidenceComplete ? rollout_status.rollback_triggers : freezeArray([]),
    completion_verification_refs: evidenceComplete ? freezeArray(["completion:p3.17:verified"]) : freezeArray([]),
    lineage_refs: lineageComplete ? freezeArray([p315.certificate.certificate_id, p316.certified_sdk_manifest.manifest_id, migration_plan.plan_id, rollout_status.rollout_id]) : freezeArray([]),
    timestamps: freezeArray(["2026-07-17T01:20:00.000Z", "2026-07-17T01:30:00.000Z"]),
    responsible_authorities: freezeArray(["authority:p3.17:adoption-governance"]),
    immutable: evidenceComplete && !has(failures, "MIGRATION_EVIDENCE_MUTABLE"),
    replayable: evidenceComplete,
    complete: evidenceComplete,
  });
  const adoption_report = nested({
    report_id: has(failures, "ADOPTION_REPORT_MISSING") ? "" : "P3.17-ADOPTION-REPORT-001",
    migration_progress: "completed",
    rollout_summary: "phased rollout completed with rollback criteria preserved",
    adoption_metrics: freezeArray(["adoption_progress", "rollout_completion", "migration_success_rate", "rollback_frequency", "compatibility_issues", "governance_exceptions", "transition_duration", "consumer_readiness", "stabilization_performance"]),
    compatibility_report_ref: compatibility_result.compatibility_id,
    governance_report_ref: adoption_decision.decision_id,
    executive_summary: "Consumer adoption completed with certified platform and certified SDK interfaces.",
    generated: !has(failures, "ADOPTION_REPORT_MISSING"),
  });
  const certifiedPlatformOnly = !has(failures, "UNCERTIFIED_PLATFORM_MIGRATION_ALLOWED") && dependencyFailures.every((failure) => failure !== "P3_15_PLATFORM_CERTIFICATE_INVALID");
  const certifiedSdksOnly = !has(failures, "UNCERTIFIED_SDK_MIGRATION_ALLOWED") && dependencyFailures.every((failure) => failure !== "P3_16_SDK_INTERFACE_INVALID");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(has(failures, "PLATFORM_CERTIFICATION_DUPLICATED") ? ["PLATFORM_CERTIFICATION_DUPLICATED" as const] : []),
    ...(has(failures, "SDK_CERTIFICATION_DUPLICATED") ? ["SDK_CERTIFICATION_DUPLICATED" as const] : []),
    ...(has(failures, "RUNTIME_DEPLOYMENT_ATTEMPTED") ? ["RUNTIME_DEPLOYMENT_ATTEMPTED" as const] : []),
    ...(has(failures, "OPERATIONAL_GOVERNANCE_DUPLICATED") ? ["OPERATIONAL_GOVERNANCE_DUPLICATED" as const] : []),
    ...(has(failures, "PLATFORM_ASSURANCE_DUPLICATED") ? ["PLATFORM_ASSURANCE_DUPLICATED" as const] : []),
    ...(migration_plan.plan_id.length === 0 ? ["MIGRATION_PLAN_MISSING" as const] : []),
    ...(migration_plan.sequencing.length < LIFECYCLE.length ? ["MIGRATION_LIFECYCLE_BYPASSED" as const] : []),
    ...(readiness_assessment.result !== "READY" ? ["READINESS_ASSESSMENT_FAILED" as const] : []),
    ...(!compatibility_result.verified_before_rollout ? ["COMPATIBILITY_NOT_VERIFIED" as const] : []),
    ...(has(failures, "INCOMPATIBLE_CONSUMER_APPROVED") ? ["INCOMPATIBLE_CONSUMER_APPROVED" as const] : []),
    ...(adoption_decision.approval_refs.length === 0 ? ["GOVERNANCE_APPROVAL_MISSING" as const] : []),
    ...(!rollout_status.authorized ? ["ROLLOUT_NOT_AUTHORIZED" as const] : []),
    ...(!rollout_status.deterministic_sequence ? ["ROLLOUT_SEQUENCE_NON_DETERMINISTIC" as const] : []),
    ...(!transition_record.operational_continuity_preserved ? ["TRANSITION_CONTINUITY_LOST" as const] : []),
    ...(rollout_status.rollback_triggers.length === 0 ? ["ROLLBACK_GOVERNANCE_MISSING" as const] : []),
    ...(!migration_evidence.complete ? ["MIGRATION_EVIDENCE_MISSING" as const] : []),
    ...(!migration_evidence.immutable ? ["MIGRATION_EVIDENCE_MUTABLE" as const] : []),
    ...(migration_evidence.lineage_refs.length === 0 ? ["MIGRATION_LINEAGE_INCOMPLETE" as const] : []),
    ...(!adoption_report.generated ? ["ADOPTION_REPORT_MISSING" as const] : []),
    ...(!certifiedPlatformOnly ? ["UNCERTIFIED_PLATFORM_MIGRATION_ALLOWED" as const] : []),
    ...(!certifiedSdksOnly ? ["UNCERTIFIED_SDK_MIGRATION_ALLOWED" as const] : []),
    ...(!adoption_decision.constitutional_compliance ? ["CONSTITUTIONAL_GOVERNANCE_BYPASSED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.17-CONSUMER-ADOPTION-MIGRATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    certified_platform_only: certifiedPlatformOnly,
    certified_sdks_only: certifiedSdksOnly,
    migration_planning_complete: migration_plan.plan_id.length > 0,
    readiness_verified: readiness_assessment.result === "READY",
    compatibility_verified: compatibility_result.verified_before_rollout,
    governance_approval_complete: adoption_decision.approval_refs.length > 0,
    rollout_governed: rollout_status.authorized && rollout_status.rollback_triggers.length > 0,
    transition_continuity_preserved: transition_record.operational_continuity_preserved,
    rollback_validated: rollout_status.rollback_triggers.length > 0,
    evidence_complete: migration_evidence.complete && migration_evidence.immutable && migration_evidence.lineage_refs.length > 0,
    reporting_complete: adoption_report.generated,
    lifecycle_deterministic: migration_plan.sequencing.length === LIFECYCLE.length && rollout_status.deterministic_sequence,
    constitutional_governance_enforced: adoption_decision.constitutional_compliance && adoption_decision.policy_enforced,
    failures: derivedFailures,
  });
  const base: Omit<ConsumerAdoptionMigrationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    platform_certification_ref: "caf-platform-certification/v3.15",
    sdk_interface_qualification_ref: "caf-sdk-interface-qualification/v3.16",
    migration_plan,
    readiness_assessment,
    compatibility_result,
    adoption_decision,
    rollout_status,
    transition_record,
    migration_evidence,
    adoption_report,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateConsumerAdoptionMigration(result?: ConsumerAdoptionMigrationResult): ConsumerAdoptionMigrationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, plan_valid: false, readiness_valid: false, compatibility_valid: false, governance_valid: false, rollout_valid: false, transition_valid: false, evidence_valid: false, report_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const plan_valid = verifyHashedRecord(result.migration_plan) && result.migration_plan.plan_id.length > 0 && result.migration_plan.rollback_prepared && result.migration_plan.sequencing.length === LIFECYCLE.length;
  const readiness_valid = verifyHashedRecord(result.readiness_assessment) && result.readiness_assessment.result === "READY";
  const compatibility_valid = verifyHashedRecord(result.compatibility_result) && result.compatibility_result.verified_before_rollout && result.compatibility_result.deterministic;
  const governance_valid = verifyHashedRecord(result.adoption_decision) && result.adoption_decision.decision === "APPROVE" && result.adoption_decision.approval_refs.length > 0 && result.adoption_decision.constitutional_compliance;
  const rollout_valid = verifyHashedRecord(result.rollout_status) && result.rollout_status.authorized && result.rollout_status.deterministic_sequence && result.rollout_status.rollback_triggers.length > 0;
  const transition_valid = verifyHashedRecord(result.transition_record) && result.transition_record.operational_continuity_preserved;
  const evidence_valid = verifyHashedRecord(result.migration_evidence) && result.migration_evidence.complete && result.migration_evidence.immutable && result.migration_evidence.replayable && result.migration_evidence.lineage_refs.length > 0;
  const report_valid = verifyHashedRecord(result.adoption_report) && result.adoption_report.generated;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && plan_valid && readiness_valid && compatibility_valid && governance_valid && rollout_valid && transition_valid && evidence_valid && report_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, plan_valid, readiness_valid, compatibility_valid, governance_valid, rollout_valid, transition_valid, evidence_valid, report_valid, certification_valid, failures: result.certification.failures });
}

export function replayConsumerAdoptionMigration(result = runConsumerAdoptionMigration()): boolean {
  const replayed = runConsumerAdoptionMigration();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateConsumerAdoptionMigration(result).valid;
}

export function getConsumerAdoptionMigrationBundle(): ConsumerAdoptionMigrationBundle {
  const result = runConsumerAdoptionMigration();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_migration_planning: true,
      owns_adoption_governance: true,
      owns_rollout_governance: true,
      owns_compatibility_validation: true,
      owns_transition_management: true,
      owns_migration_evidence: true,
      owns_platform_certification: false,
      owns_sdk_certification: false,
      owns_runtime_deployment: false,
      owns_operational_governance: false,
      owns_platform_assurance: false,
    }),
    result,
    validation: validateConsumerAdoptionMigration(result),
  });
}

export const ConsumerAdoptionMigrationService = Object.freeze({
  run: runConsumerAdoptionMigration,
  validate: validateConsumerAdoptionMigration,
  replay: replayConsumerAdoptionMigration,
});
