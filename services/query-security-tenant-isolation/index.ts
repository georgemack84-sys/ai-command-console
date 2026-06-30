import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import type { AutonomyQueryContract, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  QueryAuthorizationRecord,
  QueryOperation,
  QueryOperatorRole,
  QuerySecurityAuditRecord,
  QuerySecurityDecisionState,
  QuerySecurityErrorState,
  QuerySecurityProtectedService,
  QuerySecurityRecord,
  QuerySecurityScenario,
  QuerySecurityState,
  QuerySecurityTenantIsolationInput,
  QuerySecurityTenantIsolationObservabilitySurface,
  QuerySecurityTenantIsolationResponse,
  ReadOnlyEnforcementResult,
  TenantIsolationResult,
} from "@/types/query-security-tenant-isolation";

const NOW = "2026-07-01T00:00:00.000Z";
const SCHEMA_VERSION = "query-security-tenant-isolation/v8I.9" as const;
const allowedOperations: readonly QueryOperation[] = ["SEARCH", "LOOKUP", "RECONSTRUCT", "INSPECT", "TRACE", "VIEW", "VERIFY"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function queryForScenario(input: QuerySecurityTenantIsolationInput): AutonomyQueryContract {
  if (input.query_contract) return input.query_contract;
  switch (input.scenario) {
    case "AUTHENTICATION_FAILED": return buildAutonomyQueryContract({ scenario: "UNAUTHORIZED_OPERATOR" });
    case "TENANT_SCOPE_VIOLATION":
    case "CROSS_TENANT_ACCESS": return buildAutonomyQueryContract({ scenario: "TENANT_SCOPE_VIOLATION" });
    case "MISSION_SCOPE_VIOLATION": return buildAutonomyQueryContract({ scenario: "INVALID_MISSION" });
    case "REPLAY_TAMPERING_DETECTED": return buildAutonomyQueryContract({ scenario: "REPLAY_REFERENCE_INVALID" });
    default: return buildAutonomyQueryContract({ query_type: "CROSS_REFERENCE_SEARCH", query_scope: "MISSION", target_reference: "security:autonomy:8i9:query" });
  }
}

function issue(state: QuerySecurityErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<QuerySecurityErrorState, AutonomyQueryErrorState> = {
    AUTHENTICATION_FAILED: "UNAUTHORIZED",
    CONSTITUTION_REJECTED: "CONSTITUTIONAL_REJECTION",
    CROSS_TENANT_ACCESS: "TENANT_SCOPE_VIOLATION",
    GOVERNANCE_REJECTED: "GOVERNANCE_REJECTION",
    INVALID_SECURITY_CONTEXT: "INVALID_QUERY",
    MISSION_SCOPE_VIOLATION: "MISSION_SCOPE_VIOLATION",
    POLICY_REJECTED: "GOVERNANCE_REJECTION",
    QUERY_MUTATION_ATTEMPT: "VALIDATION_FAILURE",
    READ_ONLY_VIOLATION: "VALIDATION_FAILURE",
    REPLAY_TAMPERING_DETECTED: "REPLAY_REFERENCE_INVALID",
    ROLE_VIOLATION: "UNAUTHORIZED",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function scenarioFailure(scenario?: QuerySecurityScenario, operation?: QueryOperation): QuerySecurityErrorState | null {
  if (operation && !allowedOperations.includes(operation)) return "QUERY_MUTATION_ATTEMPT";
  switch (scenario) {
    case "AUTHENTICATION_FAILED": return "AUTHENTICATION_FAILED";
    case "TENANT_SCOPE_VIOLATION": return "TENANT_SCOPE_VIOLATION";
    case "MISSION_SCOPE_VIOLATION": return "MISSION_SCOPE_VIOLATION";
    case "ROLE_VIOLATION": return "ROLE_VIOLATION";
    case "READ_ONLY_VIOLATION": return "READ_ONLY_VIOLATION";
    case "POLICY_REJECTED": return "POLICY_REJECTED";
    case "GOVERNANCE_REJECTED": return "GOVERNANCE_REJECTED";
    case "CONSTITUTION_REJECTED": return "CONSTITUTION_REJECTED";
    case "CROSS_TENANT_ACCESS": return "CROSS_TENANT_ACCESS";
    case "QUERY_MUTATION_ATTEMPT": return "QUERY_MUTATION_ATTEMPT";
    case "REPLAY_TAMPERING_DETECTED": return "REPLAY_TAMPERING_DETECTED";
    case "INVALID_SECURITY_CONTEXT": return "INVALID_SECURITY_CONTEXT";
    default: return null;
  }
}

function failureFromQuery(errors: readonly AutonomyQueryValidationIssue[]): QuerySecurityErrorState | null {
  const states = errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_SCOPE_VIOLATION";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "REPLAY_TAMPERING_DETECTED";
  if (states.includes("CONSTITUTIONAL_REJECTION")) return "CONSTITUTION_REJECTED";
  if (states.includes("GOVERNANCE_REJECTION")) return "GOVERNANCE_REJECTED";
  if (states.length) return "INVALID_SECURITY_CONTEXT";
  return null;
}

function decisionForFailure(failure: QuerySecurityErrorState | null): QuerySecurityDecisionState {
  switch (failure) {
    case null: return "AUTHORIZED";
    case "TENANT_SCOPE_VIOLATION":
    case "CROSS_TENANT_ACCESS": return "TENANT_SCOPE_VIOLATION";
    case "MISSION_SCOPE_VIOLATION": return "MISSION_SCOPE_VIOLATION";
    case "ROLE_VIOLATION": return "ROLE_VIOLATION";
    case "POLICY_REJECTED": return "POLICY_REJECTED";
    case "GOVERNANCE_REJECTED": return "GOVERNANCE_REJECTED";
    case "CONSTITUTION_REJECTED": return "CONSTITUTION_REJECTED";
    case "READ_ONLY_VIOLATION":
    case "QUERY_MUTATION_ATTEMPT": return "READ_ONLY_VIOLATION";
    default: return "DENIED";
  }
}

function buildAuthorization(contract: AutonomyQueryContract, service: QuerySecurityProtectedService, role: QueryOperatorRole, decision: QuerySecurityDecisionState): QueryAuthorizationRecord {
  const source = {
    authorization_id: id("QAR", "query-authorization-id", { query: contract.autonomy_query_id, service, role, decision }),
    operator_id: contract.operator_id,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    role,
    requested_scope: service,
    authorization_result: decision,
    governance_reference: "governance:query-security:8i9",
    policy_reference: "policy:query-security:8i9",
    replay_reference: contract.replay_reference,
    authorization_timestamp: NOW,
  };
  return Object.freeze({ ...source, authorization_hash: hashValue("query-authorization-record", source) });
}

function buildTenantIsolation(contract: AutonomyQueryContract, failure: QuerySecurityErrorState | null): TenantIsolationResult {
  const cross = failure === "TENANT_SCOPE_VIOLATION" || failure === "CROSS_TENANT_ACCESS";
  const source = {
    tenant_filter_id: id("TIF", "tenant-isolation-filter-id", { tenant: contract.tenant_id, cross }),
    tenant_exists: !cross,
    tenant_active: !cross,
    tenant_matches_request: !cross,
    tenant_matches_target_records: !cross,
    tenant_matches_replay: !cross,
    tenant_matches_lineage: !cross,
    tenant_matches_integrity: !cross,
    cross_tenant_detected: cross,
  };
  return Object.freeze({ ...source, isolation_hash: hashValue("tenant-isolation-result", source) });
}

function buildReadOnly(operation: QueryOperation, failure: QuerySecurityErrorState | null): ReadOnlyEnforcementResult {
  const prohibited = !allowedOperations.includes(operation) || failure === "READ_ONLY_VIOLATION" || failure === "QUERY_MUTATION_ATTEMPT";
  const source = {
    enforcement_id: id("ROE", "read-only-enforcement-id", { operation, prohibited }),
    requested_operation: operation,
    operation_allowed: !prohibited,
    prohibited_operation_detected: prohibited,
    immutable_record_protection: prohibited ? "VIOLATED" as const : "ENFORCED" as const,
  };
  return Object.freeze({ ...source, enforcement_hash: hashValue("read-only-enforcement-result", source) });
}

function buildSecurityRecord(contract: AutonomyQueryContract, operation: QueryOperation, decision: QuerySecurityDecisionState, failure: QuerySecurityErrorState | null): QuerySecurityRecord {
  const source = {
    security_event_id: id("QSE", "query-security-event-id", { query: contract.autonomy_query_id, decision, operation }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    operator_id: contract.operator_id,
    query_id: contract.autonomy_query_id,
    requested_operation: operation,
    security_decision: decision,
    rejection_reason: failure,
    policy_reference: "policy:query-security:8i9",
    governance_reference: "governance:query-security:8i9",
    replay_reference: contract.replay_reference,
    integrity_hash: hashValue("query-security-record-integrity", { decision, failure, operation }),
    security_timestamp: NOW,
  };
  return Object.freeze({ ...source, security_hash: hashValue("query-security-record", source) });
}

function buildAudit(response: Omit<QuerySecurityTenantIsolationResponse, "audit_record">, records: number): QuerySecurityAuditRecord {
  const source = {
    audit_id: id("QSA", "query-security-audit-id", response.security_validation_id),
    query_id: response.query_contract.autonomy_query_id,
    operator_id: response.operator_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    role: response.role,
    requested_scope: response.protected_service,
    authorization_result: response.authorization_record.authorization_result,
    records_returned: response.security_state === "SECURITY_APPROVED" ? records : 0,
    result_hash: response.result_hash ?? "",
    replay_reference: response.replay_reference,
    lineage_reference: response.lineage_reference,
    integrity_hash: response.integrity_hash,
    timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("query-security-audit", source) });
}

export function runQuerySecurityTenantIsolation(input: QuerySecurityTenantIsolationInput = {}): QuerySecurityTenantIsolationResponse {
  const contract = queryForScenario(input);
  const query_validation = validateAutonomyQueryContract(contract);
  const service = input.protected_service ?? "CROSS_REFERENCE_SEARCH";
  const role = input.role ?? "MISSION_OPERATOR";
  const operation = input.requested_operation ?? (input.scenario === "QUERY_MUTATION_ATTEMPT" ? "UPDATE" : "LOOKUP");
  const explicitFailure = scenarioFailure(input.scenario, operation);
  const queryFailure = failureFromQuery(query_validation.errors);
  const failure = explicitFailure ?? queryFailure;
  const decision = decisionForFailure(failure);
  const state: QuerySecurityState = failure ?? "SECURITY_APPROVED";
  const authorization_record = buildAuthorization(contract, service, role, decision);
  const tenant_isolation = buildTenantIsolation(contract, failure);
  const read_only_enforcement = buildReadOnly(operation, failure);
  const security_record = buildSecurityRecord(contract, operation, decision, failure);
  const security_validation_id = id("QSV", "query-security-validation-id", { query: contract.autonomy_query_id, service, operation, role, scenario: input.scenario ?? "BASELINE" });
  const failures = freezeArray([
    ...query_validation.errors,
    ...(failure ? [issue(failure, "query_security_tenant_isolation", `${failure} detected during query security validation.`)] : []),
  ]);
  const integrity_hash = hashValue("query-security-integrity", { authorization: authorization_record.authorization_hash, tenant: tenant_isolation.isolation_hash, readonly: read_only_enforcement.enforcement_hash, security: security_record.security_hash });
  const result_hash = failure ? null : hashValue("query-security-result", { integrity_hash, service, role, operation });
  const base = {
    phase_version: "8I.9" as const,
    schema_version: SCHEMA_VERSION,
    security_validation_id,
    security_state: state,
    protected_service: service,
    requested_operation: operation,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    operator_id: contract.operator_id,
    role,
    query_contract: contract,
    query_validation,
    authorization_record,
    tenant_isolation,
    read_only_enforcement,
    security_record,
    failures,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    integrity_hash,
    result_hash,
    read_only: true as const,
    fail_closed: true as const,
  };
  const audit_record = buildAudit(base, input.records_returned ?? 0);
  return Object.freeze({ ...base, audit_record });
}

export function validateQuerySecurityTenantIsolation(input: QuerySecurityTenantIsolationInput = {}) {
  const response = runQuerySecurityTenantIsolation(input);
  return Object.freeze({
    security_validation_id: response.security_validation_id,
    valid: response.security_state === "SECURITY_APPROVED",
    security_state: response.security_state,
    errors: response.failures,
    replay_compatible: Boolean(response.replay_reference) && response.query_validation.replay_compatible,
    read_only_enforced: response.read_only_enforcement.operation_allowed,
    result_hash: response.result_hash,
  });
}

export function buildQuerySecurityTenantIsolationObservabilitySurface(input: QuerySecurityTenantIsolationInput = {}): QuerySecurityTenantIsolationObservabilitySurface {
  const response = runQuerySecurityTenantIsolation(input);
  const errors = response.security_state === "SECURITY_APPROVED" ? [] : [response.security_state as QuerySecurityErrorState];
  return Object.freeze({
    security_validation_id: response.security_validation_id,
    security_state: response.security_state,
    protected_service: response.protected_service,
    requested_operation: response.requested_operation,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    authorization_result: response.authorization_record.authorization_result,
    cross_tenant_detected: response.tenant_isolation.cross_tenant_detected,
    read_only_enforced: response.read_only_enforcement.operation_allowed,
    errors: freezeArray(errors),
    result_hash: response.result_hash,
    audit_hash: response.audit_record.audit_hash,
  });
}

export function getQuerySecurityTenantIsolationContract() {
  const response = runQuerySecurityTenantIsolation();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "read-only", "replayable", "immutable", "auditable", "least-privilege", "tenant-isolated", "governance-aware", "constitutionally-compliant", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      protected_services: freezeArray(["PLAN_LOOKUP", "EXECUTION_LOOKUP", "DELEGATION_LOOKUP", "ORCHESTRATION_LOOKUP", "SUPERVISION_LOOKUP", "INTERVENTION_LOOKUP", "BOUNDARY_LOOKUP", "REPLAY_QUERY", "HISTORICAL_RECONSTRUCTION", "LINEAGE_SEARCH", "CROSS_REFERENCE_SEARCH"] as const),
      roles: freezeArray(["SYSTEM_ADMIN", "TENANT_ADMIN", "MISSION_OPERATOR", "MISSION_OBSERVER", "GOVERNANCE_OFFICER", "AUDITOR", "SECURITY_OFFICER"] as const),
      allowed_operations: freezeArray(allowedOperations),
      prohibited_operations: freezeArray(["CREATE", "UPDATE", "DELETE", "PATCH", "EXECUTE", "APPROVE", "ROLLBACK", "RESUME", "PAUSE", "REROUTE", "REASSIGN", "MODIFY_LINEAGE", "MODIFY_REPLAY", "MODIFY_INTEGRITY"] as const),
      evaluation_order: freezeArray(["Authentication", "Tenant Validation", "Mission Validation", "Role Validation", "Policy Validation", "Governance Validation", "Constitution Validation", "Read-Only Validation", "Authorization Decision"]),
      fail_closed: true,
    }),
    response,
    validation: validateQuerySecurityTenantIsolation(),
    observability: buildQuerySecurityTenantIsolationObservabilitySurface(),
  });
}
