import { buildBoundaryEnforcementContract } from "@/services/boundary-enforcement-contract";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { BoundaryEnforcementContract, BoundaryEnforcementScenario } from "@/types/boundary-enforcement-contract";
import type {
  AuthorityBoundaryDecisionType,
  AuthorityBoundaryEvidence,
  AuthorityBoundaryFailureReason,
  AuthorityBoundaryFramework,
  AuthorityBoundaryLedgerEntry,
  AuthorityBoundaryLevel,
  AuthorityBoundaryPackage,
  AuthorityBoundaryReplayResult,
  AuthorityBoundaryScenario,
  AuthorityBoundaryState,
  AuthorityBoundaryType,
  AuthorityBoundaryVisibilitySurface,
  AuthorityScopeValidation,
  AuthorityValidation,
  AuthorizationDecision,
  DelegationAuthorityValidation,
  RuntimeAuthorityMonitor,
} from "@/types/authority-boundary-engine";

const NOW = "2026-06-30T03:00:00.000Z";
const ENGINE_VERSION = "authority-boundary-engine/v8F.2" as const;
const PIPELINE = Object.freeze(["Execution Request", "Identity Validation", "Authority Discovery", "Authority Scope Validation", "Governance Validation", "Constitution Validation", "Policy Validation", "Delegation Validation", "Decision Engine", "Evidence Recording"]);
const LEVELS = Object.freeze(["NONE", "VIEW", "RECOMMEND", "PLAN", "ORCHESTRATE", "DELEGATE", "SUPERVISE", "EXECUTE", "ROLLBACK", "RECOVER", "ADMINISTRATIVE", "SYSTEM"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function boundaryScenarioFor(scenario: AuthorityBoundaryScenario): BoundaryEnforcementScenario {
  if (scenario === "ALLOW_WITH_RESTRICTIONS") return "ALLOW_WITH_RESTRICTIONS";
  if (scenario === "OPERATOR_ESCALATION_REQUIRED" || scenario === "OPERATOR_APPROVAL_MISSING") return "OPERATOR_ESCALATION_REQUIRED";
  if (scenario === "GOVERNANCE_REJECTION") return "GOVERNANCE_REJECTION";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "POLICY_VIOLATION") return "POLICY_VIOLATION";
  if (scenario === "TENANT_MISMATCH") return "TENANT_MISMATCH";
  if (scenario === "HIDDEN_DELEGATION") return "HIDDEN_EXECUTION";
  if (scenario === "REPLAY_MISMATCH") return "REPLAY_INTEGRITY_FAILURE";
  if (scenario === "TRUTH_LEDGER_MISSING") return "MISSING_TRUTH_LEDGER";
  if (scenario === "LINEAGE_MISSING") return "LINEAGE_MISSING";
  if (scenario === "HASH_MISMATCH") return "HASH_MISMATCH";
  if (scenario === "SIGNATURE_MISMATCH") return "SIGNATURE_MISMATCH";
  if (scenario === "UNKNOWN_CONDITION") return "UNKNOWN_CONDITION";
  return "BASELINE";
}

function scenarioFailure(scenario: AuthorityBoundaryScenario): AuthorityBoundaryFailureReason | null {
  const map: Partial<Record<AuthorityBoundaryScenario, AuthorityBoundaryFailureReason>> = {
    MISSING_AUTHORITY_SOURCE: "AUTHORITY_SOURCE_MISSING",
    INSUFFICIENT_SCOPE: "AUTHORITY_SCOPE_INSUFFICIENT",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_DETECTED",
    ROLE_EXPANSION: "UNAUTHORIZED_ROLE_EXPANSION",
    IMPLICIT_AUTHORITY: "IMPLICIT_AUTHORITY_ASSUMPTION",
    UNAUTHORIZED_DELEGATION: "UNAUTHORIZED_DELEGATION",
    DELEGATION_LOOP: "DELEGATION_LOOP_DETECTED",
    RECURSIVE_DELEGATION: "RECURSIVE_DELEGATION_DETECTED",
    DELEGATION_OUTSIDE_SCOPE: "DELEGATION_OUTSIDE_SCOPE",
    EXPIRED_DELEGATION: "DELEGATION_EXPIRED",
    HIDDEN_DELEGATION: "HIDDEN_DELEGATION_DETECTED",
    GOVERNANCE_REJECTION: "GOVERNANCE_REJECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    POLICY_VIOLATION: "POLICY_VIOLATION",
    OPERATOR_APPROVAL_MISSING: "OPERATOR_APPROVAL_MISSING",
    MISSION_SCOPE_VIOLATION: "MISSION_SCOPE_VIOLATION",
    TENANT_MISMATCH: "TENANT_MISMATCH",
    AUTHORITY_EXPIRED: "AUTHORITY_EXPIRED",
    RUNTIME_AUTHORITY_LOST: "RUNTIME_AUTHORITY_LOST",
    UNKNOWN_CONDITION: "FAIL_CLOSED",
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
    LINEAGE_MISSING: "LINEAGE_REFERENCE_MISSING",
    TRUTH_LEDGER_MISSING: "TRUTH_LEDGER_REFERENCE_MISSING",
    HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
    SIGNATURE_MISMATCH: "DIGITAL_SIGNATURE_INVALID",
  };
  return map[scenario] ?? null;
}

function authorityTypeFor(requestType: string): AuthorityBoundaryType {
  const map: Record<string, AuthorityBoundaryType> = {
    PLAN: "planning",
    ORCHESTRATE: "orchestration",
    DELEGATE: "delegation",
    SUPERVISE: "supervision",
    EXECUTE: "execution",
    ROLLBACK: "rollback",
    PAUSE: "supervision",
    RESUME: "supervision",
    TERMINATE: "execution",
    ESCALATE: "escalation",
  };
  return map[requestType] ?? "execution";
}

function requiredLevelFor(type: AuthorityBoundaryType): AuthorityBoundaryLevel {
  const map: Record<AuthorityBoundaryType, AuthorityBoundaryLevel> = {
    planning: "PLAN",
    orchestration: "ORCHESTRATE",
    delegation: "DELEGATE",
    supervision: "SUPERVISE",
    execution: "EXECUTE",
    recovery: "RECOVER",
    rollback: "ROLLBACK",
    escalation: "ADMINISTRATIVE",
    replay: "VIEW",
    visibility: "VIEW",
    governance_interaction: "ADMINISTRATIVE",
  };
  return map[type];
}

function levelRank(level: AuthorityBoundaryLevel): number {
  return LEVELS.indexOf(level);
}

function hashAuthorityValidationSource(validation: Omit<AuthorityValidation, "integrity_hash"> | AuthorityValidation) {
  return {
    authority_validation_id: validation.authority_validation_id,
    authority_source: validation.authority_source,
    authority_type: validation.authority_type,
    authority_level: validation.authority_level,
    requested_action: validation.requested_action,
    requested_scope: validation.requested_scope,
    granted_scope: validation.granted_scope,
    validation_result: validation.validation_result,
    restriction_reason: validation.restriction_reason,
    escalation_reason: validation.escalation_reason,
    confidence: validation.confidence,
    evaluated_rules: validation.evaluated_rules,
    evidence: validation.evidence,
    operator_required: validation.operator_required,
    governance_required: validation.governance_required,
    timestamp: validation.timestamp,
    replay_reference: validation.replay_reference,
  };
}

export function computeAuthorityValidationHash(validation: Omit<AuthorityValidation, "integrity_hash"> | AuthorityValidation): string {
  return hashValue("authority-boundary-validation", hashAuthorityValidationSource(validation));
}

function buildAuthorityValidation(contract: BoundaryEnforcementContract, scenario: AuthorityBoundaryScenario, failure: AuthorityBoundaryFailureReason | null): AuthorityValidation {
  const authority_type = authorityTypeFor(contract.request_type);
  const authority_level = scenario === "MISSING_AUTHORITY_SOURCE" ? "NONE" : requiredLevelFor(authority_type);
  const validation_result: AuthorityBoundaryState = failure ? "BLOCKED" : contract.decision.decision === "ALLOW_WITH_RESTRICTIONS" ? "RESTRICTED" : contract.decision.decision === "ESCALATE" ? "ESCALATED" : "AUTHORIZED";
  const source = {
    authority_validation_id: id("ABV", "authority-boundary-validation-id", { contract: contract.boundary_enforcement_id, scenario }),
    authority_source: scenario === "MISSING_AUTHORITY_SOURCE" ? "" : contract.authority_context.authority_ref,
    authority_type,
    authority_level,
    requested_action: contract.requested_action,
    requested_scope: contract.requested_scope,
    granted_scope: freezeArray(failure ? [] : contract.requested_scope),
    validation_result,
    restriction_reason: contract.restriction_reason,
    escalation_reason: contract.escalation_reason,
    confidence: failure ? 0.22 : contract.confidence,
    evaluated_rules: freezeArray(["explicit-authority-required", "no-implied-authority", "least-privilege", "operator-supremacy", "governance-supremacy", "constitutional-supremacy", "fail-closed"]),
    evidence: freezeArray(failure ? [] : contract.authority_context.evidence_refs),
    operator_required: contract.operator_required,
    governance_required: true,
    timestamp: NOW,
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : contract.replay_reference,
  };
  return Object.freeze({ ...source, integrity_hash: computeAuthorityValidationHash(source) });
}

function hashScopeSource(scope: Omit<AuthorityScopeValidation, "integrity_hash"> | AuthorityScopeValidation) {
  return {
    scope_id: scope.scope_id,
    requested_action: scope.requested_action,
    requested_scope: scope.requested_scope,
    granted_scope: scope.granted_scope,
    denied_scope: scope.denied_scope,
    requested_level: scope.requested_level,
    granted_level: scope.granted_level,
    least_privilege_enforced: scope.least_privilege_enforced,
    validation_state: scope.validation_state,
  };
}

export function computeAuthorityScopeHash(scope: Omit<AuthorityScopeValidation, "integrity_hash"> | AuthorityScopeValidation): string {
  return hashValue("authority-boundary-scope", hashScopeSource(scope));
}

function buildScopeValidation(contract: BoundaryEnforcementContract, authority: AuthorityValidation, scenario: AuthorityBoundaryScenario): AuthorityScopeValidation {
  const insufficient = ["INSUFFICIENT_SCOPE", "PRIVILEGE_ESCALATION", "ROLE_EXPANSION", "MISSION_SCOPE_VIOLATION"].includes(scenario);
  const requested_level = scenario === "PRIVILEGE_ESCALATION" || scenario === "ROLE_EXPANSION" ? "SYSTEM" : authority.authority_level;
  const granted_level = authority.authority_level;
  const denied_scope = insufficient ? contract.requested_scope : [];
  const source = {
    scope_id: id("ABS", "authority-boundary-scope-id", { contract: contract.boundary_enforcement_id, scenario }),
    requested_action: contract.requested_action,
    requested_scope: contract.requested_scope,
    granted_scope: freezeArray(insufficient ? [] : authority.granted_scope),
    denied_scope: freezeArray(denied_scope),
    requested_level: requested_level as AuthorityBoundaryLevel,
    granted_level,
    least_privilege_enforced: levelRank(requested_level as AuthorityBoundaryLevel) <= levelRank(granted_level) && scenario !== "IMPLICIT_AUTHORITY",
    validation_state: insufficient ? "FAIL" as const : "PASS" as const,
  };
  return Object.freeze({ ...source, integrity_hash: computeAuthorityScopeHash(source) });
}

function delegationFailures(scenario: AuthorityBoundaryScenario): readonly AuthorityBoundaryFailureReason[] {
  const map: Partial<Record<AuthorityBoundaryScenario, AuthorityBoundaryFailureReason>> = {
    UNAUTHORIZED_DELEGATION: "UNAUTHORIZED_DELEGATION",
    DELEGATION_LOOP: "DELEGATION_LOOP_DETECTED",
    RECURSIVE_DELEGATION: "RECURSIVE_DELEGATION_DETECTED",
    DELEGATION_OUTSIDE_SCOPE: "DELEGATION_OUTSIDE_SCOPE",
    EXPIRED_DELEGATION: "DELEGATION_EXPIRED",
    HIDDEN_DELEGATION: "HIDDEN_DELEGATION_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function hashDelegationSource(delegation: Omit<DelegationAuthorityValidation, "integrity_hash"> | DelegationAuthorityValidation) {
  return {
    delegation_id: delegation.delegation_id,
    delegation_exists: delegation.delegation_exists,
    delegation_valid: delegation.delegation_valid,
    delegation_scope: delegation.delegation_scope,
    delegation_issuer: delegation.delegation_issuer,
    delegation_recipient: delegation.delegation_recipient,
    delegation_lineage: delegation.delegation_lineage,
    expires_at: delegation.expires_at,
    failures: delegation.failures,
    validation_state: delegation.validation_state,
  };
}

export function computeDelegationAuthorityHash(delegation: Omit<DelegationAuthorityValidation, "integrity_hash"> | DelegationAuthorityValidation): string {
  return hashValue("authority-boundary-delegation", hashDelegationSource(delegation));
}

function buildDelegationValidation(contract: BoundaryEnforcementContract, scenario: AuthorityBoundaryScenario): DelegationAuthorityValidation {
  const failures = delegationFailures(scenario);
  const source = {
    delegation_id: id("ABD", "authority-boundary-delegation-id", { contract: contract.boundary_enforcement_id, scenario }),
    delegation_exists: scenario !== "UNAUTHORIZED_DELEGATION",
    delegation_valid: failures.length === 0,
    delegation_scope: freezeArray(failures.length ? [] : ["mission", "workflow"]),
    delegation_issuer: "operator:mission-control",
    delegation_recipient: "controlled-autonomy-runtime",
    delegation_lineage: scenario === "LINEAGE_MISSING" ? "" : "lineage:delegation:authority-boundary:v8f2",
    expires_at: scenario === "EXPIRED_DELEGATION" ? "2026-06-01T00:00:00.000Z" : "2026-12-31T23:59:59.000Z",
    failures,
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
  };
  return Object.freeze({ ...source, integrity_hash: computeDelegationAuthorityHash(source) });
}

function decisionFrom(contract: BoundaryEnforcementContract, failures: readonly AuthorityBoundaryFailureReason[], scenario: AuthorityBoundaryScenario): AuthorityBoundaryDecisionType {
  if (scenario === "UNKNOWN_CONDITION" || scenario === "RUNTIME_AUTHORITY_LOST") return "FAIL_SAFE";
  if (failures.length) return "BLOCK";
  return contract.decision.decision as AuthorityBoundaryDecisionType;
}

function hashDecisionSource(decision: Omit<AuthorizationDecision, "integrity_hash"> | AuthorizationDecision) {
  return {
    authorization_decision_id: decision.authorization_decision_id,
    decision: decision.decision,
    boundary_decision: decision.boundary_decision,
    approved_scope: decision.approved_scope,
    denied_scope: decision.denied_scope,
    restrictions: decision.restrictions,
    escalation_request: decision.escalation_request,
    failures: decision.failures,
    operator_required: decision.operator_required,
    governance_required: decision.governance_required,
    confidence: decision.confidence,
    timestamp: decision.timestamp,
  };
}

export function computeAuthorizationDecisionHash(decision: Omit<AuthorizationDecision, "integrity_hash"> | AuthorizationDecision): string {
  return hashValue("authority-boundary-decision", hashDecisionSource(decision));
}

function buildAuthorizationDecision(contract: BoundaryEnforcementContract, authority: AuthorityValidation, scope: AuthorityScopeValidation, delegation: DelegationAuthorityValidation, scenario: AuthorityBoundaryScenario): AuthorizationDecision {
  const scenarioReason = scenarioFailure(scenario);
  const failures = unique([...(scenarioReason ? [scenarioReason] : []), ...delegation.failures, ...(scope.validation_state === "FAIL" ? ["AUTHORITY_SCOPE_INSUFFICIENT" as const] : [])]);
  const decision = decisionFrom(contract, failures, scenario);
  const source = {
    authorization_decision_id: id("ABAD", "authority-boundary-authorization-decision-id", { contract: contract.boundary_enforcement_id, scenario }),
    decision,
    boundary_decision: contract.decision.decision,
    approved_scope: freezeArray(decision === "ALLOW" || decision === "ALLOW_WITH_RESTRICTIONS" ? scope.granted_scope : []),
    denied_scope: freezeArray(failures.length ? contract.requested_scope : scope.denied_scope),
    restrictions: contract.decision.restrictions,
    escalation_request: decision === "ESCALATE" ? "operator:mission-control-review" : null,
    failures,
    operator_required: contract.operator_required || failures.length > 0,
    governance_required: true,
    confidence: failures.length ? 0.18 : authority.confidence,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: computeAuthorizationDecisionHash(source) });
}

function hashMonitorSource(monitor: Omit<RuntimeAuthorityMonitor, "integrity_hash"> | RuntimeAuthorityMonitor) {
  return {
    monitor_id: monitor.monitor_id,
    authority_still_active: monitor.authority_still_active,
    governance_unchanged: monitor.governance_unchanged,
    policies_unchanged: monitor.policies_unchanged,
    operator_approval_valid: monitor.operator_approval_valid,
    delegation_still_valid: monitor.delegation_still_valid,
    mission_authorization_active: monitor.mission_authorization_active,
    runtime_action: monitor.runtime_action,
  };
}

export function computeRuntimeAuthorityMonitorHash(monitor: Omit<RuntimeAuthorityMonitor, "integrity_hash"> | RuntimeAuthorityMonitor): string {
  return hashValue("authority-boundary-runtime-monitor", hashMonitorSource(monitor));
}

function buildRuntimeMonitor(contract: BoundaryEnforcementContract, decision: AuthorizationDecision, scenario: AuthorityBoundaryScenario): RuntimeAuthorityMonitor {
  const lost = scenario === "RUNTIME_AUTHORITY_LOST" || scenario === "AUTHORITY_EXPIRED";
  const source = {
    monitor_id: id("ABM", "authority-boundary-monitor-id", { contract: contract.boundary_enforcement_id, scenario }),
    authority_still_active: !lost,
    governance_unchanged: scenario !== "GOVERNANCE_REJECTION",
    policies_unchanged: scenario !== "POLICY_VIOLATION",
    operator_approval_valid: scenario !== "OPERATOR_APPROVAL_MISSING",
    delegation_still_valid: !delegationFailures(scenario).length,
    mission_authorization_active: scenario !== "MISSION_SCOPE_VIOLATION",
    runtime_action: decision.decision === "ALLOW" ? "CONTINUE" as const : decision.decision === "ALLOW_WITH_RESTRICTIONS" ? "RESTRICT" as const : decision.decision === "ESCALATE" ? "ESCALATE" as const : decision.decision === "FAIL_SAFE" ? "FAIL_SAFE" as const : "BLOCK" as const,
  };
  return Object.freeze({ ...source, integrity_hash: computeRuntimeAuthorityMonitorHash(source) });
}

function hashEvidenceSource(evidence: Omit<AuthorityBoundaryEvidence, "integrity_hash"> | AuthorityBoundaryEvidence) {
  return {
    evidence_id: evidence.evidence_id,
    authority_event: evidence.authority_event,
    authorization_evidence: evidence.authorization_evidence,
    denied_permissions: evidence.denied_permissions,
    granted_permissions: evidence.granted_permissions,
    delegation_evidence: evidence.delegation_evidence,
    governance_references: evidence.governance_references,
    constitutional_references: evidence.constitutional_references,
    operator_references: evidence.operator_references,
    replay_references: evidence.replay_references,
    lineage_reference: evidence.lineage_reference,
    truth_ledger_reference: evidence.truth_ledger_reference,
    timestamp: evidence.timestamp,
  };
}

export function computeAuthorityEvidenceHash(evidence: Omit<AuthorityBoundaryEvidence, "integrity_hash"> | AuthorityBoundaryEvidence): string {
  return hashValue("authority-boundary-evidence", hashEvidenceSource(evidence));
}

function buildEvidence(contract: BoundaryEnforcementContract, decision: AuthorizationDecision, delegation: DelegationAuthorityValidation, scenario: AuthorityBoundaryScenario): AuthorityBoundaryEvidence {
  const source = {
    evidence_id: id("ABE", "authority-boundary-evidence-id", decision.authorization_decision_id),
    authority_event: `authority-boundary:${decision.decision.toLowerCase()}`,
    authorization_evidence: freezeArray(decision.failures.length ? [] : contract.authority_context.evidence_refs),
    denied_permissions: decision.denied_scope,
    granted_permissions: decision.approved_scope,
    delegation_evidence: freezeArray(delegation.validation_state === "PASS" ? [delegation.integrity_hash] : []),
    governance_references: freezeArray(contract.governance_context.evidence_refs),
    constitutional_references: freezeArray(contract.constitutional_context.evidence_refs),
    operator_references: freezeArray(decision.operator_required ? ["operator:mission-control"] : []),
    replay_references: freezeArray(scenario === "REPLAY_MISMATCH" ? [] : [contract.replay_reference, contract.replay.replay_hash]),
    lineage_reference: scenario === "LINEAGE_MISSING" ? "" : contract.lineage_reference,
    truth_ledger_reference: scenario === "TRUTH_LEDGER_MISSING" ? "" : contract.truth_ledger_reference,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: computeAuthorityEvidenceHash(source) });
}

function buildLedger(decision: AuthorizationDecision, evidence: AuthorityBoundaryEvidence): AuthorityBoundaryLedgerEntry {
  const source = {
    ledger_entry_id: id("ABL", "authority-boundary-ledger-id", decision.authorization_decision_id),
    authorization_decision_id: decision.authorization_decision_id,
    authority_event: evidence.authority_event,
    evidence_hash: evidence.integrity_hash,
    decision_hash: decision.integrity_hash,
    replay_references: evidence.replay_references,
    append_only: true as const,
    recorded_at: NOW,
  };
  return Object.freeze({ ...source, ledger_hash: evidence.truth_ledger_reference ? hashValue("authority-boundary-ledger", source) : "" });
}

function replayPackage(decision: AuthorizationDecision, authority: AuthorityValidation, scope: AuthorityScopeValidation, delegation: DelegationAuthorityValidation, evidence: AuthorityBoundaryEvidence, scenario: AuthorityBoundaryScenario): AuthorityBoundaryReplayResult {
  const source = {
    replay_id: id("ABR", "authority-boundary-replay-id", decision.authorization_decision_id),
    authorization_decision_id: decision.authorization_decision_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_decision: decision.decision,
    reconstructed_authority_hash: scenario === "REPLAY_MISMATCH" ? "mismatched-authority-replay" : authority.integrity_hash,
    reconstructed_scope_hash: scope.integrity_hash,
    reconstructed_delegation_hash: delegation.integrity_hash,
    reconstructed_evidence_hash: evidence.integrity_hash,
    validation_state: scenario === "REPLAY_MISMATCH" ? "FAIL" as const : "PASS" as const,
    failure_reason: scenario === "REPLAY_MISMATCH" ? "REPLAY_RECONSTRUCTION_MISMATCH" as const : null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("authority-boundary-replay", source) });
}

function packageHashSource(pkg: Omit<AuthorityBoundaryPackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    source_boundary_id: pkg.source_boundary_contract.boundary_enforcement_id,
    authority_hash: pkg.authority_validation.integrity_hash,
    scope_hash: pkg.scope_validation.integrity_hash,
    delegation_hash: pkg.delegation_validation.integrity_hash,
    decision_hash: pkg.authorization_decision.integrity_hash,
    monitor_hash: pkg.runtime_monitor.integrity_hash,
    evidence_hash: pkg.authority_evidence.integrity_hash,
    ledger_hash: pkg.ledger_entry.ledger_hash,
    replay_hash: pkg.replay.replay_hash,
  };
}

export function buildAuthorityBoundaryPackage(input: { scenario?: AuthorityBoundaryScenario; boundaryContract?: BoundaryEnforcementContract } = {}): AuthorityBoundaryPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_boundary_contract = input.boundaryContract ?? buildBoundaryEnforcementContract({ scenario: boundaryScenarioFor(scenario) });
  const scenarioReason = scenarioFailure(scenario);
  const authority_validation = buildAuthorityValidation(source_boundary_contract, scenario, scenarioReason);
  const scope_validation = buildScopeValidation(source_boundary_contract, authority_validation, scenario);
  const delegation_validation = buildDelegationValidation(source_boundary_contract, scenario);
  const authorization_decision = buildAuthorizationDecision(source_boundary_contract, authority_validation, scope_validation, delegation_validation, scenario);
  const runtime_monitor = buildRuntimeMonitor(source_boundary_contract, authorization_decision, scenario);
  const authority_evidence = buildEvidence(source_boundary_contract, authorization_decision, delegation_validation, scenario);
  const ledger_entry = buildLedger(authorization_decision, authority_evidence);
  const replay = replayPackage(authorization_decision, authority_validation, scope_validation, delegation_validation, authority_evidence, scenario);
  const authority_state: AuthorityBoundaryState = authorization_decision.decision === "ALLOW" ? "AUTHORIZED" : authorization_decision.decision === "ALLOW_WITH_RESTRICTIONS" ? "RESTRICTED" : authorization_decision.decision === "ESCALATE" ? "ESCALATED" : authorization_decision.decision === "FAIL_SAFE" ? "FAILED" : "BLOCKED";
  const full = {
    package_id: id("ABP", "authority-boundary-package-id", { contract: source_boundary_contract.boundary_enforcement_id, scenario }),
    engine_version: ENGINE_VERSION,
    source_boundary_contract,
    authority_state,
    authority_validation,
    scope_validation,
    delegation_validation,
    authorization_decision,
    runtime_monitor,
    authority_evidence,
    ledger_entry,
    replay,
    authority_granted: false as const,
    new_authority_created: false as const,
    autonomous_execution_performed: false as const,
  };
  const package_hash = scenario === "HASH_MISMATCH" ? "tampered-authority-boundary-package" : hashValue("authority-boundary-package", packageHashSource(full));
  return Object.freeze({ ...full, package_hash });
}

export function buildAuthorityBoundaryVisibilitySurface(pkg = buildAuthorityBoundaryPackage()): AuthorityBoundaryVisibilitySurface {
  return Object.freeze({
    package_id: pkg.package_id,
    authority_state: pkg.authority_state,
    authority_source: pkg.authority_validation.authority_source || "BLOCKED",
    authority_level: pkg.authority_validation.authority_level,
    requested_permissions: pkg.scope_validation.requested_scope,
    granted_permissions: pkg.authorization_decision.approved_scope,
    denied_permissions: pkg.authorization_decision.denied_scope,
    delegation_chain: freezeArray([pkg.delegation_validation.delegation_issuer, pkg.delegation_validation.delegation_recipient, pkg.delegation_validation.delegation_lineage]),
    evaluated_governance_rules: pkg.source_boundary_contract.governance_context.evaluated_rules,
    constitutional_constraints: pkg.source_boundary_contract.constitutional_context.evaluated_rules,
    decision_explanation: pkg.authorization_decision.failures.length ? `Blocked by ${pkg.authorization_decision.failures[0]}.` : `${pkg.authorization_decision.decision} produced by deterministic authority boundary validation.`,
    confidence_score: pkg.authorization_decision.confidence,
    replay_status: pkg.replay.validation_state,
    execution_timeline: pkg.replay.reconstructed_pipeline,
    integrity_status: pkg.package_hash.startsWith("tampered") || pkg.replay.validation_state === "FAIL" ? "INVALID" : "VALID",
  });
}

export function getAuthorityBoundaryFramework(): AuthorityBoundaryFramework {
  const pkg = buildAuthorityBoundaryPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["explicit-authority", "no-implied-authority", "least-privilege", "operator-supremacy", "governance-supremacy", "constitutional-supremacy", "fail-closed", "deterministic-validation", "immutable-authorization-evidence", "truth-ledger-required"]),
      engine_version: ENGINE_VERSION,
      authority_levels: freezeArray(LEVELS),
      authority_states: freezeArray(["UNVERIFIED", "VALIDATING", "AUTHORIZED", "RESTRICTED", "ESCALATED", "BLOCKED", "FAILED"] as const),
      decision_types: freezeArray(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "ESCALATE", "BLOCK", "FAIL_SAFE"] as const),
      authority_types: freezeArray(["planning", "orchestration", "delegation", "supervision", "execution", "recovery", "rollback", "escalation", "replay", "visibility", "governance_interaction"] as const),
    }),
    package: pkg,
    visibility: buildAuthorityBoundaryVisibilitySurface(pkg),
  });
}
