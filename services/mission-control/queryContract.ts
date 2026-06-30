import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthIntegrityFinalCertificationState,
  TruthLedgerQueryAuditMetadata,
  TruthLedgerQueryContract,
  TruthLedgerQueryContractValidation,
  TruthLedgerQueryRequesterType,
  TruthLedgerQueryResultState,
  TruthLedgerQueryType,
  TruthLedgerQueryValidationContext,
  TruthLedgerQueryValidationReasonCode,
  TruthLedgerRequestedView,
} from "./types";

export const TRUTH_LEDGER_QUERY_REQUESTER_TYPES: readonly TruthLedgerQueryRequesterType[] = Object.freeze([
  "OPERATOR",
  "GOVERNANCE_ENGINE",
  "REPLAY_ENGINE",
  "CERTIFICATION_GATE",
  "INTEGRITY_SERVICE",
  "OBSERVABILITY_SURFACE",
  "MISSION_CONTROL_SERVICE",
  "EXTERNAL_SYSTEM",
]);

export const TRUTH_LEDGER_QUERY_TYPES: readonly TruthLedgerQueryType[] = Object.freeze([
  "TRUTH_RECORD_LOOKUP",
  "EVENT_LOOKUP",
  "EVIDENCE_LOOKUP",
  "RECOMMENDATION_LOOKUP",
  "GOVERNANCE_LOOKUP",
  "ESCALATION_LOOKUP",
  "LINEAGE_LOOKUP",
  "REPLAY_LOOKUP",
  "INTEGRITY_LOOKUP",
  "CERTIFICATION_LOOKUP",
  "TIMELINE_QUERY",
  "RELATIONSHIP_QUERY",
  "AUDIT_QUERY",
]);

export const TRUTH_LEDGER_REQUESTED_VIEWS: readonly TruthLedgerRequestedView[] = Object.freeze([
  "RAW_RECORD",
  "SUMMARY",
  "OPERATOR_VIEW",
  "GOVERNANCE_VIEW",
  "REPLAY_VIEW",
  "EVIDENCE_VIEW",
  "LINEAGE_VIEW",
  "INTEGRITY_VIEW",
  "CERTIFICATION_VIEW",
  "REDACTED_VIEW",
]);

const REPLAY_REQUIRED_QUERY_TYPES = new Set<TruthLedgerQueryType>([
  "RECOMMENDATION_LOOKUP",
  "GOVERNANCE_LOOKUP",
  "ESCALATION_LOOKUP",
  "LINEAGE_LOOKUP",
  "REPLAY_LOOKUP",
  "INTEGRITY_LOOKUP",
  "CERTIFICATION_LOOKUP",
  "AUDIT_QUERY",
]);

const INTEGRITY_RANK: Readonly<Record<TruthIntegrityFinalCertificationState, number>> = Object.freeze({
  CORRUPTED: 0,
  DEGRADED: 1,
  VALID: 2,
});

function addReason(reasons: TruthLedgerQueryValidationReasonCode[], reason: TruthLedgerQueryValidationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function isRequesterType(value: unknown): value is TruthLedgerQueryRequesterType {
  return TRUTH_LEDGER_QUERY_REQUESTER_TYPES.includes(value as TruthLedgerQueryRequesterType);
}

function isQueryType(value: unknown): value is TruthLedgerQueryType {
  return TRUTH_LEDGER_QUERY_TYPES.includes(value as TruthLedgerQueryType);
}

function isValidDate(value: string | undefined): boolean {
  return !value || !Number.isNaN(Date.parse(value));
}

function queryHash(contract: TruthLedgerQueryContract): string {
  return hashValue("mission-control-query-contract-hash", contract);
}

function resultState(errors: readonly string[], reasons: readonly TruthLedgerQueryValidationReasonCode[], redacted: boolean): TruthLedgerQueryResultState {
  if (reasons.includes("INTEGRITY_BLOCKED")) return "INTEGRITY_BLOCKED";
  if (reasons.includes("GOVERNANCE_BLOCKED")) return "GOVERNANCE_BLOCKED";
  if (reasons.includes("AUTHORITY_BLOCKED")) return "AUTHORITY_BLOCKED";
  if (reasons.includes("REDACTION_POLICY_FAILED")) return "DENIED";
  if (errors.length > 0) return "INVALID";
  if (redacted) return "REDACTED";
  return "COMPLETE";
}

function lifecycleState(result: TruthLedgerQueryResultState, redacted: boolean): TruthLedgerQueryContractValidation["lifecycle_state"] {
  if (result === "INVALID") return "FAILED";
  if (result === "AUTHORITY_BLOCKED" || result === "GOVERNANCE_BLOCKED") return "DENIED";
  if (result === "INTEGRITY_BLOCKED") return "ESCALATED";
  if (redacted) return "PARTIALLY_REDACTED";
  return "AUTHORIZED";
}

export function validateTruthLedgerQueryContract(
  contract: TruthLedgerQueryContract,
  context: TruthLedgerQueryValidationContext = {},
): TruthLedgerQueryContractValidation {
  const reasons: TruthLedgerQueryValidationReasonCode[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const raw = contract as unknown as Record<string, unknown>;

  if (hasValue(raw.query_id)) addReason(reasons, "QUERY_ID_PRESENT");
  else {
    addReason(reasons, "QUERY_ID_MISSING");
    errors.push("Query ID is required.");
  }

  const scope = raw.query_scope;
  const tenantScope = isObject(scope) ? scope.tenant_scope : undefined;
  const tenantId = isObject(tenantScope) ? tenantScope.tenant_id : undefined;
  const tenantScoped = hasValue(raw.tenant_id) && hasValue(tenantId) && raw.tenant_id === tenantId;
  if (tenantScoped) addReason(reasons, "TENANT_SCOPE_PRESENT");
  else {
    addReason(reasons, "TENANT_SCOPE_MISSING");
    errors.push("Query must include a tenant scope matching the contract tenant.");
  }

  if (isRequesterType(raw.requester_type)) addReason(reasons, "REQUESTER_TYPE_VALID");
  else {
    addReason(reasons, "REQUESTER_TYPE_INVALID");
    errors.push("Requester type is not supported by the query contract registry.");
  }

  if (isQueryType(raw.query_type)) addReason(reasons, "QUERY_TYPE_VALID");
  else {
    addReason(reasons, "QUERY_TYPE_INVALID");
    errors.push("Query type is not supported by the query contract registry.");
  }

  if (isObject(raw.requested_records)) addReason(reasons, "REQUESTED_RECORDS_PRESENT");
  else {
    addReason(reasons, "REQUESTED_RECORDS_MISSING");
    errors.push("Requested record criteria are required.");
  }

  const requestedViews = Array.isArray(raw.requested_views) ? raw.requested_views : [];
  if (requestedViews.length > 0 && requestedViews.every((view) => TRUTH_LEDGER_REQUESTED_VIEWS.includes(view as TruthLedgerRequestedView))) {
    addReason(reasons, "REQUESTED_VIEWS_PRESENT");
  } else {
    addReason(reasons, "REQUESTED_VIEWS_MISSING");
    errors.push("At least one valid requested view is required.");
  }

  const authority = raw.authority_context;
  if (isObject(authority)) {
    addReason(reasons, "AUTHORITY_CONTEXT_PRESENT");
    if (authority.authority_verified === true) addReason(reasons, "AUTHORITY_VERIFIED");
    else {
      addReason(reasons, "AUTHORITY_BLOCKED");
      errors.push("Authority must be explicitly verified before protected query access.");
    }
  } else {
    addReason(reasons, "AUTHORITY_CONTEXT_MISSING");
    errors.push("Authority context is required.");
  }

  const governance = raw.governance_context;
  if (isObject(governance)) {
    addReason(reasons, "GOVERNANCE_CONTEXT_PRESENT");
    const governanceEvaluated = context.governance_evaluated ?? ((governance.governance_policy_refs as readonly unknown[] | undefined)?.length ?? 0) > 0;
    if (governanceEvaluated && governance.fail_closed_required === true) addReason(reasons, "GOVERNANCE_EVALUATED");
    else {
      addReason(reasons, "GOVERNANCE_BLOCKED");
      errors.push("Governance context must be evaluated and fail-closed.");
    }
  } else {
    addReason(reasons, "GOVERNANCE_CONTEXT_MISSING");
    errors.push("Governance context is required.");
  }

  if (isObject(raw.integrity_requirements)) {
    addReason(reasons, "INTEGRITY_REQUIREMENTS_PRESENT");
    const required = raw.integrity_requirements as Record<string, unknown>;
    const minimum = required.minimum_integrity_state as TruthIntegrityFinalCertificationState;
    const observed = context.observed_integrity_state;
    if (observed && INTEGRITY_RANK[observed] < INTEGRITY_RANK[minimum]) {
      addReason(reasons, "INTEGRITY_BLOCKED");
      errors.push("Observed integrity state does not satisfy the query contract minimum.");
    } else addReason(reasons, "INTEGRITY_REQUIREMENTS_SATISFIED");
  } else {
    addReason(reasons, "INTEGRITY_REQUIREMENTS_MISSING");
    errors.push("Integrity requirements are required.");
  }

  if (isObject(raw.replay_requirements)) {
    addReason(reasons, "REPLAY_REQUIREMENTS_PRESENT");
    const replay = raw.replay_requirements as Record<string, unknown>;
    const queryType = raw.query_type as TruthLedgerQueryType;
    const replayRequiredByType = isQueryType(queryType) && REPLAY_REQUIRED_QUERY_TYPES.has(queryType);
    const replaySatisfied = (!replayRequiredByType || replay.replay_required === true)
      && (replay.replay_required !== true || replay.deterministic_order_required === true)
      && (replay.replay_required !== true || replay.include_query_hash === true);
    if (replaySatisfied) addReason(reasons, "REPLAYABLE_QUERY");
    else {
      addReason(reasons, "REPLAY_REQUIREMENTS_FAILED");
      errors.push("Decision-relevant queries must declare replay requirements.");
    }
  } else {
    addReason(reasons, "REPLAY_REQUIREMENTS_MISSING");
    errors.push("Replay requirements are required.");
  }

  const redaction = raw.redaction_policy;
  const restrictedFieldsRequested = context.restricted_fields_requested ?? [];
  let redacted = false;
  if (isObject(redaction)) {
    addReason(reasons, "REDACTION_POLICY_PRESENT");
    const redactionLevel = redaction.redaction_level;
    const redactionCoversRestrictedFields = restrictedFieldsRequested.length === 0
      || (redaction.redaction_required === true && redactionLevel !== "NONE");
    if (redactionCoversRestrictedFields && hasValue(redaction.reason)) {
      addReason(reasons, "REDACTION_POLICY_SATISFIED");
      redacted = redactionLevel === "PARTIAL" || redactionLevel === "SUMMARY_ONLY";
      if (redacted) warnings.push("Restricted fields require a redacted or summary view.");
    } else {
      addReason(reasons, "REDACTION_POLICY_FAILED");
      errors.push("Restricted fields require an explicit redaction policy.");
    }
  } else {
    addReason(reasons, "REDACTION_POLICY_MISSING");
    errors.push("Redaction policy is required.");
  }

  const ordering = raw.ordering_policy;
  if (
    isObject(ordering)
    && ["created_at", "truth_record_id", "event_sequence", "lineage_depth"].includes(ordering.order_by as string)
    && ["ASC", "DESC"].includes(ordering.direction as string)
    && ordering.tie_breaker === "truth_record_id"
  ) {
    addReason(reasons, "DETERMINISTIC_ORDERING_PRESENT");
  } else {
    addReason(reasons, "NONDETERMINISTIC_ORDERING");
    errors.push("Query ordering must be deterministic and use truth_record_id as tie breaker.");
  }

  const pagination = raw.pagination_policy;
  if (isObject(pagination) && typeof pagination.limit === "number" && pagination.limit > 0 && pagination.deterministic_cursor_required === true) {
    addReason(reasons, "PAGINATION_POLICY_VALID");
  } else {
    addReason(reasons, "PAGINATION_POLICY_INVALID");
    errors.push("Pagination must set a positive limit and deterministic cursor requirement.");
  }

  if (hasValue(raw.query_reason)) addReason(reasons, "QUERY_REASON_PRESENT");
  else {
    addReason(reasons, "QUERY_REASON_MISSING");
    errors.push("Query reason is required.");
  }

  const crossTenantAllowed = isObject(tenantScope) && tenantScope.allow_cross_tenant === true;
  if (crossTenantAllowed && hasValue(tenantScope.cross_tenant_authorization_ref)) addReason(reasons, "CROSS_TENANT_AUTHORIZED");
  else if (crossTenantAllowed) {
    addReason(reasons, "CROSS_TENANT_BLOCKED");
    errors.push("Cross-tenant queries require an explicit authorization reference.");
  }

  const now = context.now ?? (typeof raw.created_at === "string" ? raw.created_at : undefined);
  if (!isValidDate(raw.created_at as string | undefined) || !isValidDate(raw.expires_at as string | undefined)) {
    addReason(reasons, "QUERY_EXPIRED");
    errors.push("Query timestamps must be valid ISO-compatible dates.");
  } else if (typeof raw.expires_at === "string" && typeof now === "string" && Date.parse(raw.expires_at) <= Date.parse(now)) {
    addReason(reasons, "QUERY_EXPIRED");
    errors.push("Query contract is expired.");
  } else addReason(reasons, "QUERY_NOT_EXPIRED");

  if (context.mutation_attempted) {
    addReason(reasons, "MUTATION_ATTEMPT_BLOCKED");
    errors.push("Query contracts are read-only and cannot mutate the Truth Ledger.");
  } else addReason(reasons, "READ_ONLY_CONTRACT");

  const qHash = queryHash(contract);
  addReason(reasons, "QUERY_HASH_GENERATED");
  const computedResultHash = context.result_payload === undefined ? undefined : hashValue("mission-control-query-result-hash", context.result_payload);
  if (computedResultHash) addReason(reasons, "RESULT_HASH_GENERATED");

  const state = resultState(errors, reasons, redacted);
  const expired = reasons.includes("QUERY_EXPIRED");
  const finalLifecycle = expired ? "EXPIRED" : lifecycleState(state, redacted);

  return Object.freeze({
    query_id: contract.query_id,
    valid: errors.length === 0,
    lifecycle_state: finalLifecycle,
    result_state: state,
    reason_codes: Object.freeze(reasons),
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    query_hash: qHash,
    result_hash: computedResultHash,
    replayable: reasons.includes("REPLAYABLE_QUERY"),
    tenant_scoped: tenantScoped,
    readOnly: true as const,
    sourceMutationAllowed: false as const,
  });
}

export function createTruthLedgerQueryAuditMetadata(
  contract: TruthLedgerQueryContract,
  validation: TruthLedgerQueryContractValidation,
  executedAt?: string,
): TruthLedgerQueryAuditMetadata {
  return Object.freeze({
    query_id: contract.query_id,
    requester_type: contract.requester_type,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    query_type: contract.query_type,
    query_hash: validation.query_hash,
    result_hash: validation.result_hash,
    result_state: validation.result_state,
    executed_at: executedAt,
    governance_decision_ref: contract.governance_context.governance_policy_refs[0],
    authority_decision_ref: contract.authority_context.verification_ref,
    integrity_decision_ref: contract.integrity_requirements.minimum_integrity_state,
  });
}
