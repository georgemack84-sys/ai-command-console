import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GovernanceQueryAuditRecord,
  GovernanceQueryAuthorizationLevel,
  GovernanceQueryContract,
  GovernanceQueryContractInput,
  GovernanceQueryErrorState,
  GovernanceQueryLifecycleState,
  GovernanceQueryObservabilitySurface,
  GovernanceQueryScenario,
  GovernanceQueryTargetObject,
  GovernanceQueryType,
  GovernanceQueryValidationIssue,
  GovernanceQueryValidationResult,
} from "@/types/governance-query-contract";

const NOW = "2026-06-27T12:30:00.000Z";
const CONTRACT_VERSION = "governance-query-contract/v7J.1" as const;
const SCHEMA_VERSION = "governance-query-schema/v7J.1" as const;
const ORDERING = ["TENANT", "MISSION", "GOVERNANCE_TIMESTAMP", "LEDGER_SEQUENCE", "LINEAGE_HIERARCHY", "IMMUTABLE_IDENTIFIER"] as const;

const QUERY_TYPES = new Set<GovernanceQueryType>(["POLICY_LOOKUP", "RECOMMENDATION_LOOKUP", "VIOLATION_LOOKUP", "ESCALATION_LOOKUP", "RISK_LOOKUP", "COMPLIANCE_LOOKUP", "EVIDENCE_LOOKUP", "LINEAGE_LOOKUP", "REPLAY_LOOKUP", "GOVERNANCE_TIMELINE", "GOVERNANCE_HISTORY", "CROSS_LEDGER_QUERY"]);
const TARGETS = new Set<GovernanceQueryTargetObject>(["POLICY", "RECOMMENDATION", "EVIDENCE", "COMPLIANCE_EVALUATION", "RISK_ASSESSMENT", "ESCALATION", "GOVERNANCE_DECISION", "AUTHORITY_ASSIGNMENT", "REPLAY_SESSION", "REPLAY_SNAPSHOT", "LINEAGE_CHAIN", "INTEGRITY_RECORD", "CERTIFICATION_RESULT", "TRUTH_RECORD"]);
const AUTHORITY_ORDER: readonly GovernanceQueryAuthorizationLevel[] = ["READ_ONLY", "AUDITOR", "OPERATOR", "GOVERNANCE", "SYSTEM", "CERTIFICATION"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function issue(state: GovernanceQueryErrorState, path: string, message: string): GovernanceQueryValidationIssue {
  return Object.freeze({ state, path, message });
}

function requiredAuthority(queryType: GovernanceQueryType): GovernanceQueryAuthorizationLevel {
  if (queryType === "CROSS_LEDGER_QUERY") return "GOVERNANCE";
  if (queryType === "GOVERNANCE_HISTORY" || queryType === "GOVERNANCE_TIMELINE") return "AUDITOR";
  return "READ_ONLY";
}

function authorityMeets(actual: GovernanceQueryAuthorizationLevel, required: GovernanceQueryAuthorizationLevel): boolean {
  return AUTHORITY_ORDER.indexOf(actual) >= AUTHORITY_ORDER.indexOf(required);
}

function queryPayload(contract: GovernanceQueryContract): Record<string, unknown> {
  const { query_hash: _hash, ...payload } = contract;
  return payload;
}

export function computeGovernanceQueryHash(contract: GovernanceQueryContract): string {
  return hashValue("governance-query-contract-hash", queryPayload(contract));
}

export function normalizeGovernanceQuery(contract: GovernanceQueryContract): GovernanceQueryContract {
  const normalized = Object.freeze({
    ...contract,
    filters: Object.freeze(JSON.parse(canonicalizeConfidenceToString(contract.filters)) as GovernanceQueryContract["filters"]),
    policy_scope: freezeArray([...contract.policy_scope].sort()),
    governance_scope: freezeArray([...contract.governance_scope].sort()),
    authority_scope: freezeArray([...contract.authority_scope].sort()),
    evidence_requirements: freezeArray([...contract.evidence_requirements].sort()),
    deterministic_ordering: ORDERING,
    query_hash: "",
  }) as GovernanceQueryContract;
  return Object.freeze({ ...normalized, query_hash: computeGovernanceQueryHash(normalized) });
}

function baseContract(input: GovernanceQueryContractInput): GovernanceQueryContract {
  const source = {
    query_id: `GQ-7J1-${hashValue("governance-query-id", { tenant: input.tenant_id ?? "tenant_alpha", mission: input.mission_id ?? "mission_governance_001", type: input.query_type ?? "RECOMMENDATION_LOOKUP" }).slice(0, 10).toUpperCase()}`,
    tenant_id: input.tenant_id ?? "tenant_alpha",
    mission_id: input.mission_id ?? "mission_governance_001",
    query_type: input.query_type ?? "RECOMMENDATION_LOOKUP" as const,
    target_object: input.target_object ?? "RECOMMENDATION" as const,
    filters: Object.freeze({ tenant: input.tenant_id ?? "tenant_alpha", mission: input.mission_id ?? "mission_governance_001", risk_level: Object.freeze(["MEDIUM", "HIGH"]), lineage_depth: 5 }),
    time_range: Object.freeze({ start: "2026-06-01T00:00:00.000Z", end: NOW }),
    policy_scope: freezeArray(["policy:governance-integrity", "policy:tenant-isolation"]),
    governance_scope: freezeArray(["RECOMMENDATION", "INTEGRITY", "CERTIFICATION"]),
    authority_scope: freezeArray(["READ_ONLY", "AUDITOR", "OPERATOR", "GOVERNANCE"]),
    lineage_scope: Object.freeze({ mode: "FULL_ANCESTRY" as const, max_depth: 5, lineage_reference: "lineage:governance-query:root" }),
    replay_scope: Object.freeze({ replay_id: "replay:governance-query:7j1", replay_hash: "replay_hash_7j1", truth_record_reference: "truth-ledger:governance-query:7j1", ledger_reference: "governance-ledger:query:7j1", reconstruction_version: "governance-query-reconstruction/v7J.1" as const }),
    evidence_requirements: freezeArray(["truth-ledger-record", "policy-reference", "integrity-hash", "replay-snapshot"]),
    requested_by: input.requested_by ?? "operator_governance_001",
    authorization_level: input.authorization_level ?? "GOVERNANCE" as const,
    authorization_context: Object.freeze({ tenant_membership_verified: true, constitutional_authority_verified: true, read_only: true as const, permissions: freezeArray(["governance.query.read", "governance.replay.read"]) }),
    deterministic_ordering: ORDERING,
    lifecycle_state: "CREATED" as GovernanceQueryLifecycleState,
    query_version: "governance-query/v7J.1" as const,
    contract_version: CONTRACT_VERSION,
    schema_version: SCHEMA_VERSION,
    normalization_version: "governance-query-normalization/v7J.1" as const,
    validation_version: "governance-query-validation/v7J.1" as const,
    created_timestamp: NOW,
    query_hash: "",
  };
  return normalizeGovernanceQuery(Object.freeze(source) as GovernanceQueryContract);
}

function applyScenario(contract: GovernanceQueryContract, scenario: GovernanceQueryScenario): GovernanceQueryContract {
  switch (scenario) {
    case "MISSING_TENANT":
      return Object.freeze({ ...contract, tenant_id: "", filters: { ...contract.filters, tenant: "" } });
    case "INVALID_MISSION":
      return Object.freeze({ ...contract, mission_id: "" });
    case "AUTHORIZATION_MISSING":
      return Object.freeze({ ...contract, authorization_context: { ...contract.authorization_context, tenant_membership_verified: false, permissions: [] } });
    case "AUTHORIZATION_INSUFFICIENT":
      return Object.freeze({ ...contract, query_type: "CROSS_LEDGER_QUERY", authorization_level: "READ_ONLY" });
    case "UNSUPPORTED_TARGET":
      return Object.freeze({ ...contract, target_object: "BAD_TARGET" as GovernanceQueryTargetObject });
    case "UNSUPPORTED_QUERY":
      return Object.freeze({ ...contract, query_type: "BAD_QUERY" as GovernanceQueryType });
    case "INVALID_LINEAGE_REFERENCE":
      return Object.freeze({ ...contract, lineage_scope: { ...contract.lineage_scope, lineage_reference: "" } });
    case "INVALID_REPLAY_SCOPE":
      return Object.freeze({ ...contract, replay_scope: { ...contract.replay_scope, replay_hash: "" } });
    case "MUTABLE_FILTERS":
      return Object.freeze({ ...contract, filters: { ...contract.filters, mutable: true } as GovernanceQueryContract["filters"] });
    case "ORDERING_ABSENT":
      return Object.freeze({ ...contract, deterministic_ordering: [] as unknown as GovernanceQueryContract["deterministic_ordering"] });
    case "UNSUPPORTED_CONTRACT_VERSION":
      return Object.freeze({ ...contract, contract_version: "governance-query-contract/v0" as GovernanceQueryContract["contract_version"] });
    case "GOVERNANCE_SCOPE_UNDEFINED":
      return Object.freeze({ ...contract, governance_scope: [] });
    case "CONSTITUTIONAL_VIOLATION":
      return Object.freeze({ ...contract, authorization_context: { ...contract.authorization_context, constitutional_authority_verified: false } });
    case "TENANT_ISOLATION_VIOLATION":
      return Object.freeze({ ...contract, filters: { ...contract.filters, tenant: "tenant_beta" } });
    default:
      return contract;
  }
}

export function buildGovernanceQueryContract(input: GovernanceQueryContractInput = {}): GovernanceQueryContract {
  return applyScenario(input.contract ?? baseContract(input), input.scenario ?? "BASELINE");
}

function validate(contract: GovernanceQueryContract): readonly GovernanceQueryValidationIssue[] {
  const errors: GovernanceQueryValidationIssue[] = [];
  if (!text(contract.tenant_id)) errors.push(issue("INVALID_QUERY", "tenant_id", "Tenant identifier is mandatory."));
  if (!text(contract.mission_id)) errors.push(issue("INVALID_QUERY", "mission_id", "Mission identifier is mandatory."));
  if (!QUERY_TYPES.has(contract.query_type)) errors.push(issue("UNSUPPORTED_QUERY", "query_type", "Query type is not supported."));
  if (!TARGETS.has(contract.target_object)) errors.push(issue("UNSUPPORTED_QUERY", "target_object", "Target object is not supported."));
  if (contract.governance_scope.length === 0) errors.push(issue("INVALID_SCOPE", "governance_scope", "Governance scope is mandatory."));
  if (!contract.authorization_context.tenant_membership_verified || contract.authorization_context.permissions.length === 0) errors.push(issue("UNAUTHORIZED", "authorization_context", "Authorization context is missing or incomplete."));
  if (!authorityMeets(contract.authorization_level, requiredAuthority(contract.query_type))) errors.push(issue("UNAUTHORIZED", "authorization_level", "Authorization level is insufficient for query type."));
  if (!contract.authorization_context.constitutional_authority_verified) errors.push(issue("CONSTITUTIONAL_VIOLATION", "authorization_context.constitutional_authority_verified", "Query exceeds constitutional authority."));
  if (contract.filters.tenant && contract.filters.tenant !== contract.tenant_id) errors.push(issue("TENANT_ISOLATION_VIOLATION", "filters.tenant", "Cross-tenant query filters are prohibited."));
  if (!contract.lineage_scope.lineage_reference || contract.lineage_scope.max_depth < 0) errors.push(issue("INVALID_LINEAGE_REFERENCE", "lineage_scope", "Lineage scope must be complete."));
  if (!contract.replay_scope.replay_id || !contract.replay_scope.replay_hash || !contract.replay_scope.truth_record_reference || !contract.replay_scope.ledger_reference) errors.push(issue("INVALID_REPLAY_REFERENCE", "replay_scope", "Replay references must be verifiable."));
  if ("mutable" in contract.filters) errors.push(issue("INVALID_QUERY", "filters", "Filters must be immutable."));
  if (contract.deterministic_ordering.length !== ORDERING.length) errors.push(issue("VALIDATION_FAILED", "deterministic_ordering", "Deterministic ordering is mandatory."));
  if (contract.contract_version !== CONTRACT_VERSION || contract.schema_version !== SCHEMA_VERSION) errors.push(issue("VALIDATION_FAILED", "contract_version", "Unsupported query contract or schema version."));
  if (!contract.authorization_context.read_only) errors.push(issue("VALIDATION_FAILED", "authorization_context.read_only", "Governance queries must be read-only."));
  return freezeArray(errors);
}

export function validateGovernanceQueryContract(input: GovernanceQueryContract | GovernanceQueryContractInput = {}): GovernanceQueryValidationResult {
  const contract = "query_id" in input ? input as GovernanceQueryContract : buildGovernanceQueryContract(input as GovernanceQueryContractInput);
  const normalized = normalizeGovernanceQuery(contract);
  const errors = validate(contract);
  const valid = errors.length === 0 && normalized.query_hash === contract.query_hash;
  const source = {
    query_id: contract.query_id || null,
    valid,
    lifecycle_state: valid ? "VALIDATED" as const : "CREATED" as const,
    errors,
    normalized_query_hash: valid ? normalized.query_hash : null,
    authorization_verified: !errors.some((error) => error.state === "UNAUTHORIZED" || error.state === "CONSTITUTIONAL_VIOLATION"),
    tenant_isolated: !errors.some((error) => error.state === "TENANT_ISOLATION_VIOLATION"),
    replay_verified: !errors.some((error) => error.state === "INVALID_REPLAY_REFERENCE"),
    lineage_verified: !errors.some((error) => error.state === "INVALID_LINEAGE_REFERENCE"),
    read_only: contract.authorization_context.read_only === true,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-query-validation", source) });
}

export function buildGovernanceQueryAuditRecord(contract = buildGovernanceQueryContract(), result_count = 0): GovernanceQueryAuditRecord {
  const source = {
    audit_id: `GQA-7J1-${hashValue("governance-query-audit-id", contract.query_id).slice(0, 10).toUpperCase()}`,
    query_id: contract.query_id,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    requested_by: contract.requested_by,
    authorization_level: contract.authorization_level,
    query_type: contract.query_type,
    target_object: contract.target_object,
    filters: contract.filters,
    execution_timestamp: NOW,
    result_count,
    replay_reference: contract.replay_scope.replay_id,
    lineage_reference: contract.lineage_scope.lineage_reference,
    query_hash: contract.query_hash,
    contract_version: contract.contract_version,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("governance-query-audit-record", source) });
}

export function buildGovernanceQueryObservabilitySurface(input: GovernanceQueryContractInput = {}): GovernanceQueryObservabilitySurface {
  const contract = buildGovernanceQueryContract(input);
  const validation = validateGovernanceQueryContract(contract);
  const audit = buildGovernanceQueryAuditRecord(contract);
  return Object.freeze({
    query_id: contract.query_id,
    query_type: contract.query_type,
    target_object: contract.target_object,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    valid: validation.valid,
    errors: freezeArray(validation.errors.map((error) => error.state)),
    query_hash: contract.query_hash,
    audit_hash: audit.audit_hash,
  });
}

export function getGovernanceQueryContract() {
  const contract = buildGovernanceQueryContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "replayable", "explainable", "evidence-backed", "constitutionally-governed", "tenant-isolated", "immutable", "auditable", "versioned", "certification-ready"]),
      schema_version: SCHEMA_VERSION,
      contract_version: CONTRACT_VERSION,
      query_types: freezeArray([...QUERY_TYPES].sort()),
      target_objects: freezeArray([...TARGETS].sort()),
      deterministic_ordering: ORDERING,
    }),
    contract,
    validation: validateGovernanceQueryContract(contract),
    audit: buildGovernanceQueryAuditRecord(contract),
    observability: buildGovernanceQueryObservabilitySurface({ contract }),
  });
}
