import { runAdaptiveDomainBoundaryModel } from "@/services/adaptive-domain-boundary-model";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { AdaptiveBoundaryOperation, AdaptiveBoundaryResult } from "@/types/adaptive-domain-boundary-model";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  AdaptiveCapability,
  LearningPermission,
  LearningPermissionCertificationReport,
  LearningPermissionCheck,
  LearningPermissionFailure,
  LearningPermissionLedgerEntry,
  LearningPermissionRegistryFoundation,
  LearningPermissionRegistryInput,
  LearningPermissionRegistryRecord,
  LearningPermissionRegistryResult,
  LearningPermissionReplayModel,
  LearningPermissionRequest,
  LearningPermissionValidation,
  LearningPermissionValidationDecision,
  LearningPermissionValidationResult,
  LearningPermissionValidationState,
} from "@/types/learning-permission-registry";

const REGISTRY_VERSION = "learning-permission-registry/v1" as const;

export const LEARNING_PERMISSION_CHECKS: readonly LearningPermissionCheck[] = Object.freeze(["BOUNDARY_MODEL", "PERMISSION_LOOKUP", "IDENTITY", "VERSION", "SCOPE", "CAPABILITY", "GOVERNANCE", "CERTIFICATION", "REPLAY", "LIFECYCLE", "EXPIRATION", "REVOCATION", "ROLLBACK", "INTEGRITY", "DEFAULT_DENY"]);

type Scenario = NonNullable<LearningPermissionRegistryInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function state(pass: boolean): LearningPermissionValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: AdaptiveBoundaryResult) {
  return {
    tenant_id: source.registry.tenant_id,
    mission_scope: source.request.mission_scope,
    boundary_ref: source.replay_hash,
  };
}

function visibleToRole(source: AdaptiveBoundaryResult, role: VisibilityRole): boolean {
  return source.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildPermission(source: AdaptiveBoundaryResult, scenario: Scenario): LearningPermission {
  const c = ctx(source);
  const base: Omit<LearningPermission, "integrity_hash"> = {
    permission_id: "permission:recommendation-quality-analysis",
    permission_name: "Recommendation Quality Analysis Permission",
    permission_version: "10.0.3",
    adaptive_capability: "RECOMMENDATION_QUALITY_ANALYSIS",
    tenant_id: c.tenant_id,
    mission_scope: c.mission_scope,
    authorized_scope: scenario === "SCOPE_MISMATCH" ? "WORKFLOW" : "MISSION",
    authorized_operations: scenario === "EXECUTION_AUTHORITY" ? freezeArray(["ANALYZE", "SIMULATE", "RECOMMEND", "EXECUTE"]) : freezeArray(["ANALYZE", "SIMULATE", "RECOMMEND"]),
    authorized_domain: "domain:recommendation-quality",
    requesting_component: "adaptive-recommendation-quality-analyzer",
    owning_component: "mission-control-adaptive-intelligence",
    governance_approval_status: scenario === "MISSING_GOVERNANCE" || scenario === "GOVERNANCE_BYPASS" ? "MISSING" : "APPROVED",
    governance_reference: scenario === "MISSING_GOVERNANCE" || scenario === "GOVERNANCE_BYPASS" ? "" : source.enforcement_result.governance_refs[0] ?? "governance:adaptive-domain-boundary",
    replay_required: true,
    replay_reference: scenario === "MISSING_REPLAY" || scenario === "REPLAY_BYPASS" ? "" : source.replay_hash,
    certification_status: scenario === "MISSING_CERTIFICATION" ? "MISSING" : "CERTIFIED",
    certification_reference: scenario === "MISSING_CERTIFICATION" ? "" : source.certification_report.report_id,
    operator_approval_required: source.enforcement_result.validation_result === "RESTRICT",
    operator_refs: source.enforcement_result.validation_result === "RESTRICT" ? freezeArray(["operator:adaptive-permission-review"]) : freezeArray([]),
    expiration_policy: scenario === "EXPIRED_PERMISSION" ? "SCHEDULED_EXPIRATION" : "PERMANENT",
    expiration_timestamp: scenario === "EXPIRED_PERMISSION" ? "2026-01-01T00:00:00.000Z" : "9999-12-31T23:59:59.999Z",
    rollback_available: scenario !== "MISSING_ROLLBACK",
    rollback_reference: scenario === "MISSING_ROLLBACK" ? "" : "rollback:permission:recommendation-quality-analysis:v1",
    lifecycle_state: scenario === "INACTIVE_PERMISSION" ? "SUSPENDED" : scenario === "EXPIRED_PERMISSION" ? "EXPIRED" : scenario === "REVOKED_PERMISSION" ? "REVOKED" : "ACTIVE",
    created_at: "2026-07-05T10:00:30.000Z",
    updated_at: "2026-07-05T10:00:30.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" || scenario === "PERMISSION_FORGERY") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.permission_id }) });
  return built;
}

function buildRegistry(source: AdaptiveBoundaryResult, permission: LearningPermission, scenario: Scenario): LearningPermissionRegistryRecord {
  const c = ctx(source);
  const permissions = scenario === "MISSING_PERMISSION" ? freezeArray([]) : scenario === "HIDDEN_PERMISSION" ? freezeArray([]) : freezeArray([permission]);
  const withUnauthorized = scenario === "UNAUTHORIZED_CAPABILITY" ? freezeArray([...permissions, Object.freeze({ ...permission, permission_id: "permission:unauthorized", adaptive_capability: "PATTERN_INTELLIGENCE" as AdaptiveCapability, integrity_hash: hash({ unauthorized: true }) })]) : permissions;
  const base: Omit<LearningPermissionRegistryRecord, "integrity_hash"> = {
    registry_id: "learning_permission_registry",
    tenant_id: scenario === "TENANT_CROSSOVER" ? `${c.tenant_id}:foreign` : c.tenant_id,
    boundary_model_ref: source.replay_hash,
    permissions: withUnauthorized,
    active_permission_ids: freezeArray(withUnauthorized.filter((entry) => entry.lifecycle_state === "ACTIVE").map((entry) => entry.permission_id)),
    suspended_permission_ids: freezeArray(withUnauthorized.filter((entry) => entry.lifecycle_state === "SUSPENDED").map((entry) => entry.permission_id)),
    revoked_permission_ids: freezeArray(withUnauthorized.filter((entry) => entry.lifecycle_state === "REVOKED").map((entry) => entry.permission_id)),
    expired_permission_ids: freezeArray(withUnauthorized.filter((entry) => entry.lifecycle_state === "EXPIRED").map((entry) => entry.permission_id)),
    append_only: (scenario === "FAIL_OPEN" ? false : true) as true,
    default_decision: "REJECT",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRequest(source: AdaptiveBoundaryResult, input: LearningPermissionRegistryInput, scenario: Scenario): LearningPermissionRequest {
  const c = ctx(source);
  return Object.freeze({
    request_id: "learning_permission_request",
    tenant_id: scenario === "TENANT_MISMATCH" || scenario === "TENANT_CROSSOVER" ? `${c.tenant_id}:foreign` : c.tenant_id,
    mission_scope: scenario === "MISSION_SCOPE_MISMATCH" ? freezeArray(["mission:foreign"]) : c.mission_scope,
    permission_id: input.permission_id ?? (scenario === "MISSING_PERMISSION" || scenario === "IMPLICIT_PERMISSION" ? "permission:missing" : "permission:recommendation-quality-analysis"),
    requested_capability: input.capability ?? (scenario === "CAPABILITY_MISMATCH" ? "FORECAST_ACCURACY" : "RECOMMENDATION_QUALITY_ANALYSIS"),
    requested_domain: input.domain_id ?? "domain:recommendation-quality",
    requested_operation: input.operation ?? (scenario === "EXECUTION_AUTHORITY" ? "EXECUTE" : "RECOMMEND"),
    requesting_component: "adaptive-recommendation-quality-analyzer",
    validation_timestamp: "2026-07-05T10:00:31.000Z",
  });
}

function isExpired(permission: LearningPermission | undefined): boolean {
  if (!permission) return false;
  return permission.lifecycle_state === "EXPIRED" || permission.expiration_timestamp < "2026-07-05T10:00:31.000Z";
}

function decide(permission: LearningPermission | undefined, request: LearningPermissionRequest): LearningPermissionValidationResult {
  if (!permission) return "REJECT";
  if (permission.lifecycle_state !== "ACTIVE") return "REJECT";
  if (isExpired(permission)) return "REJECT";
  if (permission.governance_approval_status !== "APPROVED") return "REJECT";
  if (permission.certification_status !== "CERTIFIED") return "REJECT";
  if (!permission.replay_reference) return "REJECT";
  if (!permission.rollback_available) return "REJECT";
  if (permission.tenant_id !== request.tenant_id) return "REJECT";
  if (!request.mission_scope.every((scope) => permission.mission_scope.includes(scope))) return "REJECT";
  if (permission.adaptive_capability !== request.requested_capability) return "REJECT";
  if (permission.authorized_domain !== request.requested_domain) return "REJECT";
  if (!permission.authorized_operations.includes(request.requested_operation)) return "REJECT";
  if (request.requested_operation === "EXECUTE") return "REJECT";
  return "ALLOW";
}

function buildDecision(registry: LearningPermissionRegistryRecord, request: LearningPermissionRequest, scenario: Scenario): LearningPermissionValidationDecision {
  const permission = registry.permissions.find((entry) => entry.permission_id === request.permission_id);
  const result = scenario === "FAIL_OPEN" ? "ALLOW" : decide(permission, request);
  const base: Omit<LearningPermissionValidationDecision, "integrity_hash"> = {
    decision_id: "learning_permission_validation_decision",
    permission_id: request.permission_id,
    tenant_id: request.tenant_id,
    requested_capability: request.requested_capability,
    requested_operation: request.requested_operation,
    lifecycle_state: permission?.lifecycle_state ?? "UNKNOWN",
    validation_result: result,
    governance_refs: permission?.governance_reference ? freezeArray([permission.governance_reference]) : freezeArray([]),
    replay_refs: permission?.replay_reference ? freezeArray([permission.replay_reference]) : freezeArray([]),
    certification_refs: permission?.certification_reference ? freezeArray([permission.certification_reference]) : freezeArray([]),
    operator_refs: permission?.operator_refs ?? freezeArray([]),
    rollback_refs: permission?.rollback_reference ? freezeArray([permission.rollback_reference]) : freezeArray([]),
    reason: result === "ALLOW" ? "Active certified learning permission authorizes the adaptive request." : "Learning permission validation rejected the adaptive request.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(request: LearningPermissionRequest, decision: LearningPermissionValidationDecision, scenario: Scenario): LearningPermissionReplayModel {
  const base: Omit<LearningPermissionReplayModel, "integrity_hash"> = {
    replay_model_id: "learning_permission_replay_model",
    permission_id: request.permission_id,
    requesting_component: request.requesting_component,
    requested_capability: request.requested_capability,
    validation_result: decision.validation_result,
    governance_refs: decision.governance_refs,
    replay_refs: decision.replay_refs,
    lifecycle_state: decision.lifecycle_state,
    integrity_reproducible: scenario !== "HASH_MISMATCH" && scenario !== "REPLAY_BYPASS",
    deterministic_reconstruction: scenario !== "REPLAY_BYPASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  boundary: AdaptiveBoundaryResult;
  registry: LearningPermissionRegistryRecord;
  request: LearningPermissionRequest;
  decision: LearningPermissionValidationDecision;
  replay: LearningPermissionReplayModel;
  ledger: readonly LearningPermissionLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly LearningPermissionFailure[] {
  const failures: LearningPermissionFailure[] = [];
  const permission = input.registry.permissions.find((entry) => entry.permission_id === input.request.permission_id);
  if (input.boundary.validation.validation_status !== "VALID") failures.push("BOUNDARY_MODEL_INVALID");
  if (!permission) failures.push("PERMISSION_DOES_NOT_EXIST");
  if (permission && permission.lifecycle_state !== "ACTIVE") failures.push("PERMISSION_INACTIVE");
  if (isExpired(permission)) failures.push("PERMISSION_EXPIRED");
  if (permission?.lifecycle_state === "REVOKED") failures.push("PERMISSION_REVOKED");
  if (permission && permission.adaptive_capability !== input.request.requested_capability) failures.push("CAPABILITY_MISMATCH");
  if (permission && permission.tenant_id !== input.request.tenant_id) failures.push("TENANT_MISMATCH");
  if (permission && !input.request.mission_scope.every((scope) => permission.mission_scope.includes(scope))) failures.push("MISSION_SCOPE_MISMATCH");
  if (permission && (permission.authorized_scope === "WORKFLOW" || permission.authorized_domain !== input.request.requested_domain || !permission.authorized_operations.includes(input.request.requested_operation))) failures.push("AUTHORIZED_SCOPE_MISMATCH");
  if (!permission?.governance_reference || permission.governance_approval_status !== "APPROVED") failures.push("GOVERNANCE_APPROVAL_MISSING");
  if (!permission?.certification_reference || permission.certification_status !== "CERTIFIED") failures.push("CERTIFICATION_MISSING");
  if (!permission?.replay_reference || !input.replay.deterministic_reconstruction) failures.push("REPLAY_REFERENCES_MISSING");
  if (!permission?.rollback_available || !permission.rollback_reference) failures.push("ROLLBACK_MISSING");
  if (
    hashWithoutIntegrity(input.registry) !== input.registry.integrity_hash
    || input.registry.permissions.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || hashWithoutIntegrity(input.decision) !== input.decision.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.registry.permissions.some((entry) => entry.permission_id === "permission:unauthorized")) failures.push("UNAUTHORIZED_CAPABILITY_CREATION");
  if (input.scenario === "HIDDEN_PERMISSION") failures.push("HIDDEN_PERMISSION");
  if (input.scenario === "IMPLICIT_PERMISSION") failures.push("IMPLICIT_PERMISSION");
  if (input.scenario === "PERMISSION_FORGERY") failures.push("PERMISSION_FORGERY");
  if (input.scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
  if (input.scenario === "REPLAY_BYPASS") failures.push("REPLAY_BYPASS");
  if (input.registry.tenant_id !== input.boundary.registry.tenant_id || input.scenario === "TENANT_CROSSOVER") failures.push("TENANT_CROSSOVER");
  if (input.scenario === "AUTHORITY_ESCALATION") failures.push("AUTHORITY_ESCALATION");
  if (!input.registry.append_only || (input.decision.validation_result === "ALLOW" && failures.length > 0)) failures.push("FAIL_OPEN_PERMISSION_BEHAVIOR");
  if (!visibleToRole(input.boundary, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.request.requested_operation === "EXECUTE" || input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildReport(registry: LearningPermissionRegistryRecord, failures: readonly LearningPermissionFailure[]): LearningPermissionCertificationReport {
  const has = (failure: LearningPermissionFailure) => failures.includes(failure);
  const base: Omit<LearningPermissionCertificationReport, "integrity_hash"> = {
    report_id: "learning_permission_registry_certification_report",
    tenant_id: registry.tenant_id,
    checks: LEARNING_PERMISSION_CHECKS,
    registry_complete: !has("BOUNDARY_MODEL_INVALID") && !has("HIDDEN_PERMISSION") && !has("UNAUTHORIZED_CAPABILITY_CREATION"),
    permission_lookup_valid: !has("PERMISSION_DOES_NOT_EXIST") && !has("IMPLICIT_PERMISSION"),
    scope_valid: !has("TENANT_MISMATCH") && !has("MISSION_SCOPE_MISMATCH") && !has("AUTHORIZED_SCOPE_MISMATCH") && !has("TENANT_CROSSOVER"),
    governance_valid: !has("GOVERNANCE_APPROVAL_MISSING") && !has("GOVERNANCE_BYPASS"),
    certification_valid: !has("CERTIFICATION_MISSING"),
    replay_valid: !has("REPLAY_REFERENCES_MISSING") && !has("REPLAY_BYPASS"),
    lifecycle_valid: !has("PERMISSION_INACTIVE") && !has("PERMISSION_REVOKED"),
    expiration_valid: !has("PERMISSION_EXPIRED"),
    revocation_valid: !has("PERMISSION_REVOKED"),
    rollback_valid: !has("ROLLBACK_MISSING"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH") && !has("PERMISSION_FORGERY"),
    failure_analysis: failures,
    certification_decision: failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(request: LearningPermissionRequest, decision: LearningPermissionValidationDecision, scenario: Scenario): readonly LearningPermissionLedgerEntry[] {
  const event: Omit<LearningPermissionLedgerEntry, "integrity_hash"> = {
    record_id: "learning_permission_ledger_001",
    permission_id: request.permission_id,
    tenant_id: request.tenant_id,
    mission_scope: request.mission_scope,
    adaptive_capability: request.requested_capability,
    lifecycle_event: decision.validation_result === "ALLOW" ? "VALIDATED" : "REJECTED",
    validation_result: decision.validation_result,
    governance_refs: decision.governance_refs,
    replay_refs: decision.replay_refs,
    certification_refs: decision.certification_refs,
    operator_refs: decision.operator_refs,
    rollback_refs: decision.rollback_refs,
    event_timestamp: request.validation_timestamp,
    sequence_number: 1,
    append_only: (scenario === "FAIL_OPEN" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })]);
}

function buildValidation(failures: readonly LearningPermissionFailure[]): LearningPermissionValidation {
  const has = (failure: LearningPermissionFailure) => failures.includes(failure);
  const base: Omit<LearningPermissionValidation, "integrity_hash"> = {
    validation_id: "learning_permission_registry_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    boundary_model_valid: !has("BOUNDARY_MODEL_INVALID"),
    permission_exists: !has("PERMISSION_DOES_NOT_EXIST") && !has("HIDDEN_PERMISSION") && !has("IMPLICIT_PERMISSION"),
    permission_active: !has("PERMISSION_INACTIVE"),
    permission_not_expired: !has("PERMISSION_EXPIRED"),
    permission_not_revoked: !has("PERMISSION_REVOKED"),
    capability_matches: !has("CAPABILITY_MISMATCH") && !has("UNAUTHORIZED_CAPABILITY_CREATION"),
    tenant_matches: !has("TENANT_MISMATCH") && !has("TENANT_CROSSOVER"),
    mission_scope_matches: !has("MISSION_SCOPE_MISMATCH"),
    authorized_scope_matches: !has("AUTHORIZED_SCOPE_MISMATCH"),
    governance_approved: !has("GOVERNANCE_APPROVAL_MISSING") && !has("GOVERNANCE_BYPASS"),
    certification_current: !has("CERTIFICATION_MISSING"),
    replay_registered: !has("REPLAY_REFERENCES_MISSING") && !has("REPLAY_BYPASS"),
    rollback_available: !has("ROLLBACK_MISSING"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH") && !has("PERMISSION_FORGERY"),
    default_deny_enforced: !has("FAIL_OPEN_PERMISSION_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<LearningPermissionRegistryResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    registry: result.registry,
    request: result.request,
    decision: result.decision,
    replay: result.replay_model,
    report: result.certification_report,
    ledger: result.permission_ledger,
    validation: result.validation,
  });
}

export function runLearningPermissionRegistry(input: LearningPermissionRegistryInput = {}): LearningPermissionRegistryResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const boundary_model = input.boundary_model ?? runAdaptiveDomainBoundaryModel({ scenario: scenario === "BOUNDARY_INVALID" ? "CONTRACT_INVALID" : "BASELINE" });
  const permission = buildPermission(boundary_model, scenario);
  const registry = buildRegistry(boundary_model, permission, scenario);
  const request = buildRequest(boundary_model, input, scenario);
  const decision = buildDecision(registry, request, scenario);
  const replay_model = buildReplay(request, decision, scenario);
  const preFailures = collectFailures({ boundary: boundary_model, registry, request, decision, replay: replay_model, ledger: [], role, scenario });
  const permission_ledger = buildLedger(request, decision, scenario);
  const failures = collectFailures({ boundary: boundary_model, registry, request, decision, replay: replay_model, ledger: permission_ledger, role, scenario });
  const certification_report = buildReport(registry, failures);
  const validation = buildValidation(failures);
  const base: Omit<LearningPermissionRegistryResult, "integrity_hash" | "replay_hash"> = {
    registry_version: REGISTRY_VERSION,
    boundary_model,
    registry,
    request,
    decision,
    replay_model,
    certification_report: preFailures.length === failures.length ? certification_report : buildReport(registry, failures),
    permission_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    permits_learning: decision.validation_result === "ALLOW" && failures.length === 0,
    permits_execution: false,
    mutates_permission_registry: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayLearningPermissionRegistry(result: LearningPermissionRegistryResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeLearningPermissionHash(record: Omit<LearningPermission, "integrity_hash"> | LearningPermission): string {
  return hashWithoutIntegrity(record);
}

export function getLearningPermissionRegistryFoundation(): LearningPermissionRegistryFoundation {
  return Object.freeze({
    registry_version: REGISTRY_VERSION,
    checks: LEARNING_PERMISSION_CHECKS,
    result: runLearningPermissionRegistry(),
  });
}

export const LearningPermissionRegistry = Object.freeze({
  run: runLearningPermissionRegistry,
  replay: replayLearningPermissionRegistry,
});
