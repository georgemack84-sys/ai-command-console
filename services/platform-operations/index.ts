import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runCafLegionRuntime, validateCafLegionRuntime } from "@/services/caf-legion-runtime";
import { runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import { runIdentityFull, validateIdentityFull } from "@/services/identity-full";
import { runMessagingFull, validateMessagingFull } from "@/services/messaging-full";
import { runObservabilityPlatform, validateObservabilityPlatform } from "@/services/observability-platform";
import { runRegistryFull, validateRegistryFull } from "@/services/registry-full";
import { runSecurityFull, validateSecurityFull } from "@/services/security-full";
import { runStorageFull, validateStorageFull } from "@/services/storage-full";
import type { PlatformOperationsBundle, PlatformOperationsDecision, PlatformOperationsFailure, PlatformOperationsInput, PlatformOperationsResult, PlatformOperationsScenario, PlatformOperationsValidation } from "@/types/platform-operations";

const VERSION = "platform-operations/w1.9" as const;
const IDENTIFIER = "PlatformOperations" as const;
let identityBaseline: ReturnType<typeof runIdentityFull> | undefined;
let storageBaseline: ReturnType<typeof runStorageFull> | undefined;
let messagingBaseline: ReturnType<typeof runMessagingFull> | undefined;
let registryBaseline: ReturnType<typeof runRegistryFull> | undefined;
let configurationBaseline: ReturnType<typeof runConfigurationPlatform> | undefined;
let observabilityBaseline: ReturnType<typeof runObservabilityPlatform> | undefined;
let securityBaseline: ReturnType<typeof runSecurityFull> | undefined;
let cafBaseline: ReturnType<typeof runCafLegionRuntime> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly PlatformOperationsFailure[], failure: PlatformOperationsFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: PlatformOperationsScenario): PlatformOperationsFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly PlatformOperationsFailure[], scenario: PlatformOperationsScenario): PlatformOperationsDecision {
  if (has(failures, "W1_1B_IDENTITY_FULL_INVALID") || has(failures, "W1_2B_STORAGE_FULL_INVALID") || has(failures, "W1_3B_MESSAGING_FULL_INVALID") || has(failures, "W1_4B_REGISTRY_FULL_INVALID") || has(failures, "W1_5_CONFIGURATION_PLATFORM_INVALID") || has(failures, "W1_6_OBSERVABILITY_PLATFORM_INVALID") || has(failures, "W1_7B_SECURITY_FULL_INVALID") || has(failures, "W1_8_CAF_LEGION_RUNTIME_INVALID") || has(failures, "DEPLOYMENT_NON_DETERMINISTIC") || has(failures, "BACKUP_NOT_RESTORABLE") || has(failures, "QUALIFIED_STATE_NOT_RESTORED") || has(failures, "SCALING_TENANT_ISOLATION_FAILED") || has(failures, "SCALING_GOVERNANCE_VIOLATED") || has(failures, "OPERATOR_SUPREMACY_FAILED") || has(failures, "OPERATIONAL_GOVERNANCE_FAILED") || has(failures, "TENANT_ISOLATION_FAILED") || has(failures, "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE") || has(failures, "OPERATIONAL_REPLAY_INVALID")) return "FAIL_CLOSED";
  if (has(failures, "PLATFORM_OPERATIONS_QUALIFICATION_GATE_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "PLATFORM_OPERATIONS_QUALIFIED";
}
function resultReplayHash(result: Omit<PlatformOperationsResult, "replay_hash" | "integrity_hash">): string { return hash({ deployment: result.deployment.integrity_hash, release: result.release.integrity_hash, backup: result.backup.integrity_hash, recovery: result.recovery.integrity_hash, rollback: result.rollback.integrity_hash, scaling: result.scaling.integrity_hash, incidents: result.incidents.integrity_hash, dashboard: result.dashboard.integrity_hash, readiness: result.operational_readiness.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, phase: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<PlatformOperationsResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runPlatformOperations(input: PlatformOperationsInput = {}): PlatformOperationsResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<PlatformOperationsFailure>(direct ? [direct] : []);
  identityBaseline ??= runIdentityFull(); storageBaseline ??= runStorageFull(); messagingBaseline ??= runMessagingFull(); registryBaseline ??= runRegistryFull(); configurationBaseline ??= runConfigurationPlatform(); observabilityBaseline ??= runObservabilityPlatform(); securityBaseline ??= runSecurityFull(); cafBaseline ??= runCafLegionRuntime();
  const invalids = {
    identity: !validateIdentityFull(identityBaseline).valid || has(scenarioFailures, "W1_1B_IDENTITY_FULL_INVALID"),
    storage: !validateStorageFull(storageBaseline).valid || has(scenarioFailures, "W1_2B_STORAGE_FULL_INVALID"),
    messaging: !validateMessagingFull(messagingBaseline).valid || has(scenarioFailures, "W1_3B_MESSAGING_FULL_INVALID"),
    registry: !validateRegistryFull(registryBaseline).valid || has(scenarioFailures, "W1_4B_REGISTRY_FULL_INVALID"),
    configuration: !validateConfigurationPlatform(configurationBaseline).valid || has(scenarioFailures, "W1_5_CONFIGURATION_PLATFORM_INVALID"),
    observability: !validateObservabilityPlatform(observabilityBaseline).valid || has(scenarioFailures, "W1_6_OBSERVABILITY_PLATFORM_INVALID"),
    security: !validateSecurityFull(securityBaseline).valid || has(scenarioFailures, "W1_7B_SECURITY_FULL_INVALID"),
    caf: !validateCafLegionRuntime(cafBaseline).valid || has(scenarioFailures, "W1_8_CAF_LEGION_RUNTIME_INVALID"),
  };
  const failures = freezeArray([...new Set([...scenarioFailures, ...(invalids.identity ? ["W1_1B_IDENTITY_FULL_INVALID" as const] : []), ...(invalids.storage ? ["W1_2B_STORAGE_FULL_INVALID" as const] : []), ...(invalids.messaging ? ["W1_3B_MESSAGING_FULL_INVALID" as const] : []), ...(invalids.registry ? ["W1_4B_REGISTRY_FULL_INVALID" as const] : []), ...(invalids.configuration ? ["W1_5_CONFIGURATION_PLATFORM_INVALID" as const] : []), ...(invalids.observability ? ["W1_6_OBSERVABILITY_PLATFORM_INVALID" as const] : []), ...(invalids.security ? ["W1_7B_SECURITY_FULL_INVALID" as const] : []), ...(invalids.caf ? ["W1_8_CAF_LEGION_RUNTIME_INVALID" as const] : [])])]);
  const deploymentOk = !has(failures, "DEPLOYMENT_AUTOMATION_MISSING") && !has(failures, "DEPLOYMENT_NON_DETERMINISTIC") && !has(failures, "DEPLOYMENT_VERIFICATION_FAILED");
  const releaseOk = !has(failures, "RELEASE_MANAGEMENT_MISSING") && !has(failures, "RELEASE_APPROVAL_NOT_ENFORCED") && !has(failures, "ROLLBACK_CHECKPOINTS_MISSING");
  const backupOk = !has(failures, "BACKUP_PLATFORM_MISSING") && !has(failures, "BACKUP_INTEGRITY_FAILED") && !has(failures, "BACKUP_NOT_RESTORABLE");
  const recoveryOk = !has(failures, "RECOVERY_PLATFORM_MISSING") && !has(failures, "RECOVERY_VALIDATION_FAILED") && !has(failures, "DISASTER_RECOVERY_UNTESTED");
  const rollbackOk = !has(failures, "ROLLBACK_SERVICES_MISSING") && !has(failures, "ROLLBACK_VALIDATION_FAILED") && !has(failures, "QUALIFIED_STATE_NOT_RESTORED");
  const scalingOk = !has(failures, "SCALING_PLATFORM_MISSING") && !has(failures, "SCALING_TENANT_ISOLATION_FAILED") && !has(failures, "SCALING_GOVERNANCE_VIOLATED");
  const incidentOk = !has(failures, "INCIDENT_MANAGEMENT_MISSING") && !has(failures, "INCIDENT_ESCALATION_FAILED") && !has(failures, "INCIDENT_EVIDENCE_MISSING");
  const dashboardOk = !has(failures, "PLATFORM_DASHBOARD_MISSING") && !has(failures, "OPERATIONAL_VISIBILITY_INCOMPLETE") && !has(failures, "OPERATOR_SUPREMACY_FAILED");
  const operationalReadyOk = !has(failures, "OPERATIONAL_READINESS_MISSING") && !has(failures, "PRODUCTION_READINESS_FAILED") && !has(failures, "OPERATIONAL_GOVERNANCE_FAILED") && !has(failures, "TENANT_ISOLATION_FAILED");
  const evidenceOk = !has(failures, "OPERATIONAL_EVIDENCE_MISSING") && !has(failures, "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "OPERATIONAL_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "PLATFORM_OPERATIONS_QUALIFIED";
  const deployment = nested({ controller_id: deploymentOk ? `controller:w1.9:deployment:${input.seed ?? "canonical"}` : "", deployment_controller: deploymentOk, deployment_pipeline: deploymentOk, environment_definitions: deploymentOk, manifests: deploymentOk, validation: deploymentOk, deterministic_execution: deploymentOk, deployment_evidence: deploymentOk, immutable_history: deploymentOk });
  const release = nested({ controller_id: releaseOk ? "controller:w1.9:release" : "", release_registry: releaseOk, version_catalog: releaseOk, promotion_workflow: releaseOk, approval_workflow: releaseOk, release_audit: releaseOk, rollback_checkpoints: releaseOk, reproducible_releases: releaseOk });
  const backup = nested({ manager_id: backupOk ? "manager:w1.9:backup" : "", backup_scheduler: backupOk, snapshot_manager: backupOk, backup_registry: backupOk, integrity_verification: backupOk, retention_policies: backupOk, recovery_metadata: backupOk, immutable_backups: backupOk, restorable: backupOk });
  const recovery = nested({ manager_id: recoveryOk ? "manager:w1.9:recovery" : "", recovery_workflows: recoveryOk, disaster_recovery_plans: recoveryOk, recovery_automation: recoveryOk, recovery_validation: recoveryOk, recovery_reporting: recoveryOk, deterministic_testing: recoveryOk });
  const rollback = nested({ controller_id: rollbackOk ? "controller:w1.9:rollback" : "", automated_rollback: rollbackOk, configuration_rollback: rollbackOk, deployment_rollback: rollbackOk, version_rollback: rollbackOk, rollback_validation: rollbackOk, qualified_state_restore: rollbackOk });
  const scaling = nested({ manager_id: scalingOk ? "manager:w1.9:scaling" : "", horizontal_scaling: scalingOk, vertical_scaling: scalingOk, node_lifecycle: scalingOk, capacity_policies: scalingOk, resource_scheduler: scalingOk, load_balancing: scalingOk, scaling_evidence: scalingOk, tenant_isolation: scalingOk, governance_preserved: scalingOk });
  const incidents = nested({ registry_id: incidentOk ? "registry:w1.9:incidents" : "", incident_detection: incidentOk, severity_model: incidentOk, incident_workflow: incidentOk, operator_escalation: incidentOk, root_cause_tracking: incidentOk, corrective_action_tracking: incidentOk, incident_evidence: incidentOk, traceable: incidentOk });
  const dashboard = nested({ dashboard_id: dashboardOk ? "dashboard:w1.9:operations" : "", executive_dashboard: dashboardOk, operations_dashboard: dashboardOk, infrastructure_dashboard: dashboardOk, deployment_dashboard: dashboardOk, incident_dashboard: dashboardOk, health_dashboard: dashboardOk, capacity_monitoring: dashboardOk, runtime_health: dashboardOk, complete_visibility: dashboardOk });
  const operational_readiness = nested({ assessment_id: operationalReadyOk ? "assessment:w1.9:operational-readiness" : "", environment_readiness: operationalReadyOk, infrastructure_readiness: operationalReadyOk, deployment_readiness: operationalReadyOk, recovery_readiness: operationalReadyOk, operational_checklist: operationalReadyOk, production_readiness: operationalReadyOk, readiness_evidence: operationalReadyOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.9:operations-evidence" : "", records: evidenceOk ? freezeArray(["ops:deployment", "ops:release", "ops:backup", "ops:recovery", "ops:rollback", "ops:scaling", "ops:incident", "ops:readiness", "ops:qualification"]) : freezeArray<string>([]), deployment_lineage: evidenceOk, release_lineage: evidenceOk, backup_lineage: evidenceOk, recovery_lineage: evidenceOk, rollback_lineage: evidenceOk, scaling_lineage: evidenceOk, incident_lineage: evidenceOk, readiness_evidence: evidenceOk, qualification_evidence: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const qualification = nested({ report_id: "report:w1.9:platform-operations-qualification", deployment_qualification: qualified, release_qualification: qualified, backup_qualification: qualified, recovery_qualification: qualified, rollback_qualification: qualified, scaling_qualification: qualified, incident_qualification: qualified, dashboard_qualification: qualified, readiness_qualification: qualified, governance_compliance: qualified, deterministic_replay: qualified, evidence_validation: qualified, tenant_isolation: qualified, constitutional_compliance: qualified, gate_decision: decision });
  const readiness = nested({ readiness_id: "W1.9-PLATFORM-OPERATIONS-READINESS-001", decision, phase_ready: qualified, identity_ready: !invalids.identity, storage_ready: !invalids.storage, messaging_ready: !invalids.messaging, registry_ready: !invalids.registry, configuration_ready: !invalids.configuration, observability_ready: !invalids.observability, security_ready: !invalids.security, caf_runtime_ready: !invalids.caf, deployment_ready: deploymentOk, release_ready: releaseOk, backup_ready: backupOk, recovery_ready: recoveryOk, rollback_ready: rollbackOk, scaling_ready: scalingOk, incident_ready: incidentOk, dashboard_ready: dashboardOk, operational_readiness_ready: operationalReadyOk, evidence_ready: evidenceOk, qualification_ready: qualified, failures });
  const base: Omit<PlatformOperationsResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, identity_full_ref: "identity-full/w1.1b", storage_full_ref: "storage-full/w1.2b", messaging_full_ref: "messaging-full/w1.3b", registry_full_ref: "registry-full/w1.4b", configuration_platform_ref: "configuration-platform/w1.5", observability_platform_ref: "observability-platform/w1.6", security_full_ref: "security-full/w1.7b", caf_legion_runtime_ref: "caf-legion-runtime/w1.8", deployment, release, backup, recovery, rollback, scaling, incidents, dashboard, operational_readiness, evidence, qualification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePlatformOperations(result?: PlatformOperationsResult): PlatformOperationsValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, deployment_valid: false, release_valid: false, backup_valid: false, recovery_valid: false, rollback_valid: false, scaling_valid: false, incident_valid: false, dashboard_valid: false, operational_readiness_valid: false, evidence_valid: false, qualification_valid: false, readiness_valid: false, failures: freezeArray(["DEPLOYMENT_AUTOMATION_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const deployment_valid = verifyHashed(result.deployment) && result.deployment.deterministic_execution && result.deployment.deployment_evidence;
  const release_valid = verifyHashed(result.release) && result.release.approval_workflow && result.release.rollback_checkpoints && result.release.reproducible_releases;
  const backup_valid = verifyHashed(result.backup) && result.backup.integrity_verification && result.backup.immutable_backups && result.backup.restorable;
  const recovery_valid = verifyHashed(result.recovery) && result.recovery.recovery_validation && result.recovery.deterministic_testing;
  const rollback_valid = verifyHashed(result.rollback) && result.rollback.rollback_validation && result.rollback.qualified_state_restore;
  const scaling_valid = verifyHashed(result.scaling) && result.scaling.tenant_isolation && result.scaling.governance_preserved;
  const incident_valid = verifyHashed(result.incidents) && result.incidents.operator_escalation && result.incidents.incident_evidence && result.incidents.traceable;
  const dashboard_valid = verifyHashed(result.dashboard) && result.dashboard.complete_visibility && result.dashboard.runtime_health;
  const operational_readiness_valid = verifyHashed(result.operational_readiness) && result.operational_readiness.production_readiness && result.operational_readiness.readiness_evidence;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 9 && result.evidence.immutable && result.evidence.replayable;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.deployment_qualification && result.qualification.constitutional_compliance && result.qualification.gate_decision === "PLATFORM_OPERATIONS_QUALIFIED";
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && deployment_valid && release_valid && backup_valid && recovery_valid && rollback_valid && scaling_valid && incident_valid && dashboard_valid && operational_readiness_valid && evidence_valid && qualification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, deployment_valid, release_valid, backup_valid, recovery_valid, rollback_valid, scaling_valid, incident_valid, dashboard_valid, operational_readiness_valid, evidence_valid, qualification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayPlatformOperations(result = runPlatformOperations()): boolean { const replayed = runPlatformOperations(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePlatformOperations(result).valid; }
export function getPlatformOperationsBundle(): PlatformOperationsBundle { const result = runPlatformOperations(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_deployment_lifecycle: true, owns_release_lifecycle: true, owns_backup_lifecycle: true, owns_recovery_lifecycle: true, owns_rollback_lifecycle: true, owns_scaling_lifecycle: true, owns_incident_lifecycle: true, owns_operational_dashboard: true, owns_production_readiness: true, owns_operational_evidence: true, qualification_gate: "Platform Operations Qualification Gate" }), result, validation: validatePlatformOperations(result) }); }
export const PlatformOperationsService = Object.freeze({ run: runPlatformOperations, validate: validatePlatformOperations, replay: replayPlatformOperations });
