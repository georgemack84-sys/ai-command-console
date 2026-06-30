import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  AutonomyQueryAuditRecord,
  AutonomyQueryAuthorizationLevel,
  AutonomyQueryContract,
  AutonomyQueryContractInput,
  AutonomyQueryErrorState,
  AutonomyQueryLifecycleState,
  AutonomyQueryObservabilitySurface,
  AutonomyQueryScenario,
  AutonomyQueryScope,
  AutonomyQueryType,
  AutonomyQueryTypeRegistryEntry,
  AutonomyQueryValidationIssue,
  AutonomyQueryValidationResult,
} from "@/types/autonomy-query-contract";

const NOW = "2026-06-30T16:00:00.000Z";
const CONTRACT_VERSION = "autonomy-query-contract/v8I.1" as const;
const SCHEMA_VERSION = "autonomy-query-schema/v8I.1" as const;
const ORDERING = ["tenant_id", "mission_id", "timestamp", "event_sequence", "immutable_record_id"] as const;
const AUTHORITY_ORDER: readonly AutonomyQueryAuthorizationLevel[] = ["READ_ONLY", "AUDITOR", "OPERATOR", "GOVERNANCE", "SYSTEM", "CERTIFICATION"];

const QUERY_TYPES = new Set<AutonomyQueryType>(["PLAN_LOOKUP", "EXECUTION_LOOKUP", "DELEGATION_LOOKUP", "SUPERVISION_LOOKUP", "REPLAY_LOOKUP", "INTERVENTION_LOOKUP", "POLICY_LOOKUP", "HISTORICAL_RECONSTRUCTION", "LINEAGE_SEARCH", "CROSS_REFERENCE_SEARCH"]);
const QUERY_SCOPES = new Set<AutonomyQueryScope>(["MISSION", "TENANT", "OBJECT", "EXECUTION", "PLAN", "REPLAY", "LINEAGE", "TIME_WINDOW"]);

const QUERY_REGISTRY: readonly AutonomyQueryTypeRegistryEntry[] = Object.freeze([
  Object.freeze({ query_type: "PLAN_LOOKUP", searches: Object.freeze(["plans", "alternatives", "contingencies", "confidence", "dependencies"]), returns: "Plan Objects", minimum_authority: "READ_ONLY" }),
  Object.freeze({ query_type: "EXECUTION_LOOKUP", searches: Object.freeze(["execution history", "runtime states", "checkpoints", "failures"]), returns: "Execution Records", minimum_authority: "READ_ONLY" }),
  Object.freeze({ query_type: "DELEGATION_LOOKUP", searches: Object.freeze(["delegated work", "routing", "authority validation", "assignments"]), returns: "Delegation Records", minimum_authority: "READ_ONLY" }),
  Object.freeze({ query_type: "SUPERVISION_LOOKUP", searches: Object.freeze(["runtime monitoring", "drift", "health", "governance events"]), returns: "Supervision Records", minimum_authority: "AUDITOR" }),
  Object.freeze({ query_type: "REPLAY_LOOKUP", searches: Object.freeze(["replay evidence", "replay history", "replay validation"]), returns: "Replay Records", minimum_authority: "AUDITOR" }),
  Object.freeze({ query_type: "INTERVENTION_LOOKUP", searches: Object.freeze(["pause recommendations", "rollback recommendations", "escalation recommendations"]), returns: "Intervention Records", minimum_authority: "OPERATOR" }),
  Object.freeze({ query_type: "POLICY_LOOKUP", searches: Object.freeze(["governance policies", "constitutional rules", "authority validation", "policy evaluations"]), returns: "Policy Records", minimum_authority: "GOVERNANCE" }),
  Object.freeze({ query_type: "HISTORICAL_RECONSTRUCTION", searches: Object.freeze(["complete autonomy timeline"]), returns: "Historical Timeline", minimum_authority: "AUDITOR" }),
  Object.freeze({ query_type: "LINEAGE_SEARCH", searches: Object.freeze(["parent objects", "child objects", "dependency graphs", "influence chains"]), returns: "Lineage Graph", minimum_authority: "AUDITOR" }),
  Object.freeze({ query_type: "CROSS_REFERENCE_SEARCH", searches: Object.freeze(["related records across subsystems"]), returns: "Cross-Reference Graph", minimum_authority: "GOVERNANCE" }),
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uuidv7Like(value: unknown): string {
  const hash = hashValue("autonomy-query-uuidv7", value).replace(/[^a-f0-9]/gi, "0").padEnd(32, "0").toLowerCase();
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-7${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function issue(state: AutonomyQueryErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  return Object.freeze({ state, path, message });
}

function registryEntry(queryType: AutonomyQueryType): AutonomyQueryTypeRegistryEntry | undefined {
  return QUERY_REGISTRY.find((entry) => entry.query_type === queryType);
}

function authorityMeets(actual: AutonomyQueryAuthorizationLevel, required: AutonomyQueryAuthorizationLevel): boolean {
  return AUTHORITY_ORDER.indexOf(actual) >= AUTHORITY_ORDER.indexOf(required);
}

function queryPayload(contract: AutonomyQueryContract): Record<string, unknown> {
  const { query_hash: _hash, ...payload } = contract;
  return payload;
}

export function computeAutonomyQueryHash(contract: AutonomyQueryContract): string {
  return hashValue("autonomy-query-contract-hash", queryPayload(contract));
}

export function normalizeAutonomyQuery(contract: AutonomyQueryContract): AutonomyQueryContract {
  const normalized = Object.freeze({
    ...contract,
    filters: Object.freeze(JSON.parse(canonicalizeConfidenceToString(contract.filters)) as AutonomyQueryContract["filters"]),
    authorization_context: Object.freeze({
      ...contract.authorization_context,
      governance_permissions: freezeArray([...contract.authorization_context.governance_permissions].sort()),
      tenant_permissions: freezeArray([...contract.authorization_context.tenant_permissions].sort()),
    }),
    deterministic_ordering: ORDERING,
    query_hash: "",
  }) as AutonomyQueryContract;
  return Object.freeze({ ...normalized, query_hash: computeAutonomyQueryHash(normalized) });
}

function baseContract(input: AutonomyQueryContractInput): AutonomyQueryContract {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_autonomy_001";
  const query_type = input.query_type ?? "HISTORICAL_RECONSTRUCTION";
  const authority = input.authorization_level ?? "GOVERNANCE";
  const source = {
    autonomy_query_id: uuidv7Like({ tenant_id, mission_id, operator: input.operator_id ?? "operator_autonomy_001", query_type }),
    tenant_id,
    mission_id,
    operator_id: input.operator_id ?? "operator_autonomy_001",
    query_type,
    query_scope: input.query_scope ?? "MISSION" as const,
    target_reference: input.target_reference ?? "mission:autonomy:001",
    time_range: Object.freeze({ start_timestamp: "2026-06-01T00:00:00.000Z", end_timestamp: NOW }),
    filters: Object.freeze({ tenant_id, mission_id, risk_level: Object.freeze(["MEDIUM", "HIGH"]), confidence: Object.freeze({ min: 0.7 }) }),
    authorization_context: Object.freeze({
      operator_role: authority,
      authority_level: authority,
      governance_permissions: freezeArray(["autonomy.query.read", "autonomy.replay.read", "autonomy.lineage.read"]),
      tenant_permissions: freezeArray([`tenant:${tenant_id}:read`]),
      constitutional_validation: true,
      read_only: true as const,
      tenant_membership_verified: true,
      mission_access_verified: true,
      policy_authorized: true,
    }),
    replay_reference: "replay:autonomy-query:8i1",
    lineage_reference: "lineage:autonomy-query:root",
    created_timestamp: NOW,
    deterministic_ordering: ORDERING,
    lifecycle_state: "CREATED" as AutonomyQueryLifecycleState,
    query_version: "autonomy-query/v8I.1" as const,
    contract_version: CONTRACT_VERSION,
    schema_version: SCHEMA_VERSION,
    normalization_version: "autonomy-query-normalization/v8I.1" as const,
    validation_version: "autonomy-query-validation/v8I.1" as const,
    read_only_enforced: true as const,
    no_execution_permitted: true as const,
    query_hash: "",
  };
  return normalizeAutonomyQuery(Object.freeze(source) as AutonomyQueryContract);
}

function applyScenario(contract: AutonomyQueryContract, scenario: AutonomyQueryScenario): AutonomyQueryContract {
  switch (scenario) {
    case "MISSING_QUERY_ID": return Object.freeze({ ...contract, autonomy_query_id: "" });
    case "MISSING_TENANT": return Object.freeze({ ...contract, tenant_id: "", filters: { ...contract.filters, tenant_id: "" } });
    case "INVALID_MISSION": return Object.freeze({ ...contract, mission_id: "" });
    case "MISSING_OPERATOR": return Object.freeze({ ...contract, operator_id: "" });
    case "UNSUPPORTED_QUERY_TYPE": return Object.freeze({ ...contract, query_type: "BAD_QUERY" as AutonomyQueryType });
    case "UNAUTHORIZED_OPERATOR": return Object.freeze({ ...contract, authorization_context: { ...contract.authorization_context, tenant_membership_verified: false, governance_permissions: [], tenant_permissions: [] } });
    case "TENANT_SCOPE_VIOLATION": return Object.freeze({ ...contract, filters: { ...contract.filters, tenant_id: "tenant_external" } });
    case "MISSION_SCOPE_VIOLATION": return Object.freeze({ ...contract, filters: { ...contract.filters, mission_id: "mission_external" } });
    case "OBJECT_NOT_FOUND": return Object.freeze({ ...contract, target_reference: "" });
    case "REPLAY_REFERENCE_INVALID": return Object.freeze({ ...contract, replay_reference: "" });
    case "LINEAGE_REFERENCE_INVALID": return Object.freeze({ ...contract, lineage_reference: "" });
    case "ORDERING_FAILURE": return Object.freeze({ ...contract, deterministic_ordering: [] as unknown as AutonomyQueryContract["deterministic_ordering"] });
    case "GOVERNANCE_REJECTION": return Object.freeze({ ...contract, authorization_context: { ...contract.authorization_context, policy_authorized: false } });
    case "CONSTITUTIONAL_REJECTION": return Object.freeze({ ...contract, authorization_context: { ...contract.authorization_context, constitutional_validation: false } });
    case "READ_ONLY_VIOLATION": return Object.freeze({ ...contract, read_only_enforced: false as true, no_execution_permitted: false as true });
    case "HIDDEN_STATE_REQUEST": return Object.freeze({ ...contract, filters: { ...contract.filters, include_hidden: true } });
    case "UNSUPPORTED_CONTRACT_VERSION": return Object.freeze({ ...contract, contract_version: "autonomy-query-contract/v0" as AutonomyQueryContract["contract_version"] });
    default: return contract;
  }
}

export function buildAutonomyQueryContract(input: AutonomyQueryContractInput = {}): AutonomyQueryContract {
  return applyScenario(input.contract ?? baseContract(input), input.scenario ?? "BASELINE");
}

function validate(contract: AutonomyQueryContract): readonly AutonomyQueryValidationIssue[] {
  const errors: AutonomyQueryValidationIssue[] = [];
  if (!text(contract.autonomy_query_id)) errors.push(issue("INVALID_SCHEMA", "autonomy_query_id", "Autonomy query id is mandatory and immutable."));
  if (!text(contract.tenant_id)) errors.push(issue("INVALID_QUERY", "tenant_id", "Tenant identifier is mandatory."));
  if (!text(contract.mission_id)) errors.push(issue("MISSION_SCOPE_VIOLATION", "mission_id", "Mission identifier is mandatory."));
  if (!text(contract.operator_id)) errors.push(issue("UNAUTHORIZED", "operator_id", "Operator identity is mandatory."));
  if (!QUERY_TYPES.has(contract.query_type)) errors.push(issue("UNSUPPORTED_QUERY_TYPE", "query_type", "Query type is not supported."));
  if (!QUERY_SCOPES.has(contract.query_scope)) errors.push(issue("INVALID_SCHEMA", "query_scope", "Query scope is not supported."));
  if (!text(contract.target_reference)) errors.push(issue("OBJECT_NOT_FOUND", "target_reference", "Target reference must identify immutable history."));
  const requiredAuthority = registryEntry(contract.query_type)?.minimum_authority ?? "READ_ONLY";
  if (!authorityMeets(contract.authorization_context.authority_level, requiredAuthority)) errors.push(issue("UNAUTHORIZED", "authorization_context.authority_level", "Operator authority is insufficient."));
  if (!contract.authorization_context.tenant_membership_verified || contract.authorization_context.tenant_permissions.length === 0) errors.push(issue("UNAUTHORIZED", "authorization_context", "Tenant membership and permissions are required."));
  if (!contract.authorization_context.mission_access_verified || contract.filters.mission_id && contract.filters.mission_id !== contract.mission_id) errors.push(issue("MISSION_SCOPE_VIOLATION", "filters.mission_id", "Cross-mission query scope is prohibited."));
  if (contract.filters.tenant_id && contract.filters.tenant_id !== contract.tenant_id) errors.push(issue("TENANT_SCOPE_VIOLATION", "filters.tenant_id", "Cross-tenant query visibility is prohibited."));
  if (!contract.authorization_context.policy_authorized) errors.push(issue("GOVERNANCE_REJECTION", "authorization_context.policy_authorized", "Governance policy rejected the query."));
  if (!contract.authorization_context.constitutional_validation) errors.push(issue("CONSTITUTIONAL_REJECTION", "authorization_context.constitutional_validation", "Constitutional validation rejected the query."));
  if (!contract.replay_reference) errors.push(issue("REPLAY_REFERENCE_INVALID", "replay_reference", "Replay reference is required for deterministic query replay."));
  if (!contract.lineage_reference) errors.push(issue("LINEAGE_REFERENCE_INVALID", "lineage_reference", "Lineage reference is required for historical traversal."));
  if (contract.deterministic_ordering.length !== ORDERING.length) errors.push(issue("ORDERING_FAILURE", "deterministic_ordering", "Stable deterministic ordering is mandatory."));
  if (contract.contract_version !== CONTRACT_VERSION || contract.schema_version !== SCHEMA_VERSION) errors.push(issue("VALIDATION_FAILURE", "contract_version", "Unsupported autonomy query contract or schema version."));
  if (!contract.authorization_context.read_only || !contract.read_only_enforced || !contract.no_execution_permitted) errors.push(issue("VALIDATION_FAILURE", "read_only_enforced", "Autonomy queries must never execute or mutate history."));
  if (contract.filters.include_hidden) errors.push(issue("UNAUTHORIZED", "filters.include_hidden", "Hidden state inspection is prohibited."));
  return freezeArray(errors);
}

export function validateAutonomyQueryContract(input: AutonomyQueryContract | AutonomyQueryContractInput = {}): AutonomyQueryValidationResult {
  const contract = "autonomy_query_id" in input ? input as AutonomyQueryContract : buildAutonomyQueryContract(input as AutonomyQueryContractInput);
  const normalized = normalizeAutonomyQuery(contract);
  const errors = validate(contract);
  const valid = errors.length === 0 && normalized.query_hash === contract.query_hash;
  const has = (state: AutonomyQueryErrorState) => errors.some((error) => error.state === state);
  const source = {
    autonomy_query_id: contract.autonomy_query_id || null,
    valid,
    lifecycle_state: valid ? "VALIDATED" as const : "CREATED" as const,
    errors,
    normalized_query_hash: valid ? normalized.query_hash : null,
    authorization_verified: !has("UNAUTHORIZED"),
    tenant_isolated: !has("TENANT_SCOPE_VIOLATION"),
    mission_scoped: !has("MISSION_SCOPE_VIOLATION"),
    replay_compatible: !has("REPLAY_REFERENCE_INVALID"),
    lineage_compatible: !has("LINEAGE_REFERENCE_INVALID"),
    governance_compliant: !has("GOVERNANCE_REJECTION"),
    constitutionally_compliant: !has("CONSTITUTIONAL_REJECTION"),
    read_only: contract.authorization_context.read_only === true && contract.read_only_enforced && contract.no_execution_permitted,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("autonomy-query-validation", source) });
}

export function buildAutonomyQueryAuditRecord(contract = buildAutonomyQueryContract(), returned_record_count = 0, execution_duration = "PT0.000S"): AutonomyQueryAuditRecord {
  const validation = validateAutonomyQueryContract(contract);
  const source = {
    query_audit_id: uuidv7Like({ audit: contract.autonomy_query_id }),
    autonomy_query_id: contract.autonomy_query_id,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    operator_id: contract.operator_id,
    query_type: contract.query_type,
    query_scope: contract.query_scope,
    authorization_result: validation.authorization_verified && validation.tenant_isolated && validation.mission_scoped ? "APPROVED" as const : "REJECTED" as const,
    returned_record_count,
    execution_duration,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    result_hash: hashValue("autonomy-query-result", { query_hash: contract.query_hash, returned_record_count }),
    audit_timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("autonomy-query-audit-record", source) });
}

export function buildAutonomyQueryObservabilitySurface(input: AutonomyQueryContractInput = {}): AutonomyQueryObservabilitySurface {
  const contract = buildAutonomyQueryContract(input);
  const validation = validateAutonomyQueryContract(contract);
  const audit = buildAutonomyQueryAuditRecord(contract);
  return Object.freeze({
    autonomy_query_id: contract.autonomy_query_id,
    query_type: contract.query_type,
    query_scope: contract.query_scope,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    valid: validation.valid,
    errors: freezeArray(validation.errors.map((error) => error.state)),
    query_hash: contract.query_hash,
    audit_hash: audit.audit_hash,
  });
}

export function getAutonomyQueryContract() {
  const contract = buildAutonomyQueryContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "replayable", "explainable", "immutable", "auditable", "authorized", "tenant-isolated", "governance-compliant", "constitutionally-compliant", "reproducible", "read-only"]),
      schema_version: SCHEMA_VERSION,
      contract_version: CONTRACT_VERSION,
      query_types: freezeArray([...QUERY_TYPES].sort()),
      query_scopes: freezeArray([...QUERY_SCOPES].sort()),
      query_registry: QUERY_REGISTRY,
      deterministic_ordering: ORDERING,
      lifecycle: freezeArray(["CREATED", "AUTHORIZED", "VALIDATED", "EXECUTING", "COLLECTING_RESULTS", "ORDERING_RESULTS", "RETURNED", "AUDITED", "COMPLETED"] as const),
      no_execution_permitted: true,
    }),
    contract,
    validation: validateAutonomyQueryContract(contract),
    audit: buildAutonomyQueryAuditRecord(contract),
    observability: buildAutonomyQueryObservabilitySurface({ contract }),
  });
}
