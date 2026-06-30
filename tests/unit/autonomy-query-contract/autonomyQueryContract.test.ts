import { describe, expect, it } from "vitest";
import {
  buildAutonomyQueryAuditRecord,
  buildAutonomyQueryContract,
  buildAutonomyQueryObservabilitySurface,
  computeAutonomyQueryHash,
  getAutonomyQueryContract,
  normalizeAutonomyQuery,
  validateAutonomyQueryContract,
} from "@/services/autonomy-query-contract";
import type { AutonomyQueryErrorState, AutonomyQueryScenario } from "@/types/autonomy-query-contract";

describe("Mission Control Phase 8I.1 Autonomy Query Contract", () => {
  it("defines the deterministic autonomy query doctrine and registries", () => {
    const contract = getAutonomyQueryContract();

    expect(contract.doctrine.schema_version).toBe("autonomy-query-schema/v8I.1");
    expect(contract.doctrine.contract_version).toBe("autonomy-query-contract/v8I.1");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("tenant-isolated");
    expect(contract.doctrine.principles).toContain("read-only");
    expect(contract.doctrine.query_types).toContain("HISTORICAL_RECONSTRUCTION");
    expect(contract.doctrine.query_types).toContain("CROSS_REFERENCE_SEARCH");
    expect(contract.doctrine.no_execution_permitted).toBe(true);
  });

  it("builds an immutable replay-aware query contract", () => {
    const contract = buildAutonomyQueryContract();

    expect(contract.autonomy_query_id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
    expect(contract.tenant_id).toBe("tenant_alpha");
    expect(contract.mission_id).toBe("mission_autonomy_001");
    expect(contract.replay_reference).toBeTruthy();
    expect(contract.lineage_reference).toBeTruthy();
    expect(contract.authorization_context.read_only).toBe(true);
    expect(contract.no_execution_permitted).toBe(true);
    expect(contract.query_hash).toBe(computeAutonomyQueryHash(contract));
  });

  it("normalizes equivalent filters and permissions into the same query hash", () => {
    const first = buildAutonomyQueryContract();
    const second = normalizeAutonomyQuery({
      ...first,
      authorization_context: {
        ...first.authorization_context,
        governance_permissions: [...first.authorization_context.governance_permissions].reverse(),
        tenant_permissions: [...first.authorization_context.tenant_permissions].reverse(),
      },
      query_hash: "",
    });

    expect(second.query_hash).toBe(first.query_hash);
    expect(validateAutonomyQueryContract(first).valid).toBe(true);
  });

  it.each([
    ["MISSING_QUERY_ID", "INVALID_SCHEMA"],
    ["MISSING_TENANT", "INVALID_QUERY"],
    ["INVALID_MISSION", "MISSION_SCOPE_VIOLATION"],
    ["MISSING_OPERATOR", "UNAUTHORIZED"],
    ["UNSUPPORTED_QUERY_TYPE", "UNSUPPORTED_QUERY_TYPE"],
    ["UNAUTHORIZED_OPERATOR", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["MISSION_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION"],
    ["OBJECT_NOT_FOUND", "OBJECT_NOT_FOUND"],
    ["REPLAY_REFERENCE_INVALID", "REPLAY_REFERENCE_INVALID"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["GOVERNANCE_REJECTION", "GOVERNANCE_REJECTION"],
    ["CONSTITUTIONAL_REJECTION", "CONSTITUTIONAL_REJECTION"],
    ["READ_ONLY_VIOLATION", "VALIDATION_FAILURE"],
    ["HIDDEN_STATE_REQUEST", "UNAUTHORIZED"],
    ["UNSUPPORTED_CONTRACT_VERSION", "VALIDATION_FAILURE"],
  ] as readonly [AutonomyQueryScenario, AutonomyQueryErrorState][])(
    "rejects %s deterministically",
    (scenario, errorState) => {
      const validation = validateAutonomyQueryContract({ scenario });

      expect(validation.valid).toBe(false);
      expect(validation.errors.map((error) => error.state)).toContain(errorState);
      expect(validation.normalized_query_hash).toBeNull();
    },
  );

  it("enforces query-type authority requirements", () => {
    const validation = validateAutonomyQueryContract({
      query_type: "POLICY_LOOKUP",
      authorization_level: "READ_ONLY",
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors.map((error) => error.state)).toContain("UNAUTHORIZED");
  });

  it("builds immutable audit records for autonomy query execution", () => {
    const contract = buildAutonomyQueryContract();
    const audit = buildAutonomyQueryAuditRecord(contract, 5, "PT0.125S");

    expect(audit.autonomy_query_id).toBe(contract.autonomy_query_id);
    expect(audit.returned_record_count).toBe(5);
    expect(audit.execution_duration).toBe("PT0.125S");
    expect(audit.authorization_result).toBe("APPROVED");
    expect(audit.replay_reference).toBe(contract.replay_reference);
    expect(audit.lineage_reference).toBe(contract.lineage_reference);
    expect(audit.append_only).toBe(true);
    expect(audit.audit_hash).toBeTruthy();
  });

  it("exposes operator query contract diagnostics", () => {
    const surface = buildAutonomyQueryObservabilitySurface({ scenario: "TENANT_SCOPE_VIOLATION" });

    expect(surface.valid).toBe(false);
    expect(surface.errors).toContain("TENANT_SCOPE_VIOLATION");
    expect(surface.query_hash).toBeTruthy();
    expect(surface.audit_hash).toBeTruthy();
  });
});
