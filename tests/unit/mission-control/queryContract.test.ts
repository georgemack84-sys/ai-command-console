import { describe, expect, it } from "vitest";
import {
  createTruthLedgerQueryAuditMetadata,
  validateTruthLedgerQueryContract,
} from "@/services/mission-control";
import type { TruthLedgerQueryContract } from "@/services/mission-control";

function query(overrides: Partial<TruthLedgerQueryContract> = {}): TruthLedgerQueryContract {
  return {
    query_id: "query_6j1_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    operator_id: "operator_17",
    requester_type: "OPERATOR",
    query_type: "LINEAGE_LOOKUP",
    query_scope: {
      tenant_scope: {
        tenant_id: "tenant_alpha",
        allow_cross_tenant: false,
      },
      mission_scope: {
        mission_id: "mission_042",
      },
      time_scope: {
        created_after: "2026-06-01T00:00:00.000Z",
        created_before: "2026-06-24T23:59:59.000Z",
      },
      lineage_scope: {
        root_record_id: "truth_001",
        max_depth: 4,
        include_parent_edges: true,
        include_child_edges: true,
      },
    },
    requested_records: {
      truth_record_ids: ["truth_001"],
      lifecycle_states: ["ACTIVE"],
      lineage_refs: ["lineage_001"],
      integrity_states: ["VALID"],
    },
    requested_views: ["LINEAGE_VIEW", "EVIDENCE_VIEW"],
    authority_context: {
      authority_id: "auth_778",
      operator_role: "MISSION_SUPERVISOR",
      permissions: ["truth.read", "lineage.read", "evidence.read"],
      authority_scope: ["tenant_alpha", "mission_042"],
      authority_verified: true,
      verification_ref: "authority_check_778",
    },
    governance_context: {
      governance_policy_refs: ["policy_truth_read_v1"],
      constitutional_rules_applied: ["tenant_isolation", "operator_supremacy"],
      restrictions: [],
      escalation_required: false,
      fail_closed_required: true,
    },
    integrity_requirements: {
      require_hash_validation: true,
      require_chain_validation: true,
      require_tamper_check: true,
      minimum_integrity_state: "VALID",
    },
    replay_requirements: {
      replay_required: true,
      deterministic_order_required: true,
      include_query_hash: true,
      include_result_hash: true,
      replay_ref: "replay_query_001",
    },
    redaction_policy: {
      redaction_required: false,
      redaction_level: "NONE",
      restricted_fields: [],
      reason: "Operator has authorized lineage visibility.",
    },
    pagination_policy: {
      limit: 100,
      deterministic_cursor_required: true,
    },
    ordering_policy: {
      order_by: "created_at",
      direction: "ASC",
      tie_breaker: "truth_record_id",
    },
    created_at: "2026-06-24T10:00:00.000Z",
    expires_at: "2026-06-24T10:15:00.000Z",
    query_reason: "Operator reviewing lineage for mission replay verification.",
    correlation_id: "corr_mission_042_replay_review",
    ...overrides,
  };
}

describe("Mission Control Phase 6J.1 Query Contract", () => {
  it("valid tenant-scoped query passes", () => {
    const result = validateTruthLedgerQueryContract(query());
    expect(result.valid).toBe(true);
    expect(result.result_state).toBe("COMPLETE");
    expect(result.reason_codes).toContain("TENANT_SCOPE_PRESENT");
  });

  it("missing tenant scope fails", () => {
    const result = validateTruthLedgerQueryContract(query({ query_scope: {} as TruthLedgerQueryContract["query_scope"] }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("TENANT_SCOPE_MISSING");
  });

  it("unknown query type fails", () => {
    const result = validateTruthLedgerQueryContract(query({ query_type: "UNKNOWN_QUERY" as TruthLedgerQueryContract["query_type"] }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("QUERY_TYPE_INVALID");
  });

  it("authorized record lookup passes", () => {
    const result = validateTruthLedgerQueryContract(query({ query_type: "TRUTH_RECORD_LOOKUP", requested_views: ["OPERATOR_VIEW"] }));
    expect(result.valid).toBe(true);
    expect(result.reason_codes).toContain("AUTHORITY_VERIFIED");
  });

  it("unauthorized record lookup fails", () => {
    const result = validateTruthLedgerQueryContract(query({
      authority_context: { ...query().authority_context, authority_verified: false },
    }));
    expect(result.valid).toBe(false);
    expect(result.result_state).toBe("AUTHORITY_BLOCKED");
  });

  it("cross-tenant query without authorization fails", () => {
    const result = validateTruthLedgerQueryContract(query({
      query_scope: {
        ...query().query_scope,
        tenant_scope: { tenant_id: "tenant_alpha", allow_cross_tenant: true },
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("CROSS_TENANT_BLOCKED");
  });

  it("cross-tenant query with authorization passes", () => {
    const result = validateTruthLedgerQueryContract(query({
      query_scope: {
        ...query().query_scope,
        tenant_scope: {
          tenant_id: "tenant_alpha",
          allow_cross_tenant: true,
          cross_tenant_authorization_ref: "cross_tenant_auth_001",
        },
      },
    }));
    expect(result.valid).toBe(true);
    expect(result.reason_codes).toContain("CROSS_TENANT_AUTHORIZED");
  });

  it("governance context missing fails", () => {
    const result = validateTruthLedgerQueryContract(query({ governance_context: undefined as unknown as TruthLedgerQueryContract["governance_context"] }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("GOVERNANCE_CONTEXT_MISSING");
  });

  it("authority context missing fails", () => {
    const result = validateTruthLedgerQueryContract(query({ authority_context: undefined as unknown as TruthLedgerQueryContract["authority_context"] }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("AUTHORITY_CONTEXT_MISSING");
  });

  it("deterministic ordering present passes", () => {
    expect(validateTruthLedgerQueryContract(query()).reason_codes).toContain("DETERMINISTIC_ORDERING_PRESENT");
  });

  it("nondeterministic ordering requested fails", () => {
    const result = validateTruthLedgerQueryContract(query({
      ordering_policy: { order_by: "created_at", direction: "ASC", tie_breaker: "created_at" } as TruthLedgerQueryContract["ordering_policy"],
    }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("NONDETERMINISTIC_ORDERING");
  });

  it("replay-required query without replay requirements fails", () => {
    const result = validateTruthLedgerQueryContract(query({
      query_type: "CERTIFICATION_LOOKUP",
      replay_requirements: {
        replay_required: false,
        deterministic_order_required: false,
        include_query_hash: false,
        include_result_hash: false,
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("REPLAY_REQUIREMENTS_FAILED");
  });

  it("integrity-required query with valid hash chain passes", () => {
    const result = validateTruthLedgerQueryContract(query({ query_type: "INTEGRITY_LOOKUP" }), { observed_integrity_state: "VALID" });
    expect(result.valid).toBe(true);
    expect(result.reason_codes).toContain("INTEGRITY_REQUIREMENTS_SATISFIED");
  });

  it("integrity-required query with corrupted chain fails", () => {
    const result = validateTruthLedgerQueryContract(query({ query_type: "INTEGRITY_LOOKUP" }), { observed_integrity_state: "CORRUPTED" });
    expect(result.valid).toBe(false);
    expect(result.result_state).toBe("INTEGRITY_BLOCKED");
  });

  it("restricted field with redaction policy passes", () => {
    const result = validateTruthLedgerQueryContract(query({
      requested_views: ["REDACTED_VIEW"],
      redaction_policy: {
        redaction_required: true,
        redaction_level: "PARTIAL",
        restricted_fields: ["payload.secret"],
        reason: "Sensitive field redacted for operator view.",
      },
    }), { restricted_fields_requested: ["payload.secret"] });
    expect(result.valid).toBe(true);
    expect(result.result_state).toBe("REDACTED");
  });

  it("restricted field without redaction policy fails", () => {
    const result = validateTruthLedgerQueryContract(query(), { restricted_fields_requested: ["payload.secret"] });
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("REDACTION_POLICY_FAILED");
  });

  it("expired query contract fails", () => {
    const result = validateTruthLedgerQueryContract(query({ expires_at: "2026-06-24T09:00:00.000Z" }), { now: "2026-06-24T10:00:00.000Z" });
    expect(result.valid).toBe(false);
    expect(result.lifecycle_state).toBe("EXPIRED");
  });

  it("query reason missing fails", () => {
    const result = validateTruthLedgerQueryContract(query({ query_reason: "" }));
    expect(result.valid).toBe(false);
    expect(result.reason_codes).toContain("QUERY_REASON_MISSING");
  });

  it("query attempts mutation fails", () => {
    const result = validateTruthLedgerQueryContract(query(), { mutation_attempted: true });
    expect(result.valid).toBe(false);
    expect(result.sourceMutationAllowed).toBe(false);
    expect(result.reason_codes).toContain("MUTATION_ATTEMPT_BLOCKED");
  });

  it("query result hash generated", () => {
    const validation = validateTruthLedgerQueryContract(query(), { result_payload: [{ truth_record_id: "truth_001" }] });
    const audit = createTruthLedgerQueryAuditMetadata(query(), validation, "2026-06-24T10:00:01.000Z");
    expect(validation.query_hash).toBeTruthy();
    expect(validation.result_hash).toBeTruthy();
    expect(audit.result_hash).toBe(validation.result_hash);
  });
});
