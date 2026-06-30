import { describe, expect, it } from "vitest";
import {
  buildGovernanceQueryAuditRecord,
  buildGovernanceQueryContract,
  buildGovernanceQueryObservabilitySurface,
  computeGovernanceQueryHash,
  getGovernanceQueryContract,
  normalizeGovernanceQuery,
  validateGovernanceQueryContract,
} from "@/services/governance-query-contract";
import type { GovernanceQueryErrorState, GovernanceQueryScenario } from "@/types/governance-query-contract";

describe("Mission Control Phase 7J.1 Governance Query Contract", () => {
  it("defines the deterministic governance query doctrine and registries", () => {
    const contract = getGovernanceQueryContract();

    expect(contract.doctrine.schema_version).toBe("governance-query-schema/v7J.1");
    expect(contract.doctrine.contract_version).toBe("governance-query-contract/v7J.1");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("tenant-isolated");
    expect(contract.doctrine.query_types).toContain("CROSS_LEDGER_QUERY");
    expect(contract.doctrine.target_objects).toContain("CERTIFICATION_RESULT");
  });

  it("builds an immutable replay-aware query contract", () => {
    const contract = buildGovernanceQueryContract();

    expect(contract.query_id).toMatch(/^GQ-7J1-/);
    expect(contract.tenant_id).toBe("tenant_alpha");
    expect(contract.mission_id).toBe("mission_governance_001");
    expect(contract.replay_scope.replay_hash).toBeTruthy();
    expect(contract.lineage_scope.lineage_reference).toBeTruthy();
    expect(contract.authorization_context.read_only).toBe(true);
    expect(contract.query_hash).toBe(computeGovernanceQueryHash(contract));
  });

  it("normalizes equivalent filters into the same query hash", () => {
    const first = buildGovernanceQueryContract();
    const second = normalizeGovernanceQuery({
      ...first,
      policy_scope: [...first.policy_scope].reverse(),
      governance_scope: [...first.governance_scope].reverse(),
      evidence_requirements: [...first.evidence_requirements].reverse(),
      query_hash: "",
    });

    expect(second.query_hash).toBe(first.query_hash);
    expect(validateGovernanceQueryContract(first).valid).toBe(true);
  });

  it.each([
    ["MISSING_TENANT", "INVALID_QUERY"],
    ["INVALID_MISSION", "INVALID_QUERY"],
    ["AUTHORIZATION_MISSING", "UNAUTHORIZED"],
    ["AUTHORIZATION_INSUFFICIENT", "UNAUTHORIZED"],
    ["UNSUPPORTED_TARGET", "UNSUPPORTED_QUERY"],
    ["UNSUPPORTED_QUERY", "UNSUPPORTED_QUERY"],
    ["INVALID_LINEAGE_REFERENCE", "INVALID_LINEAGE_REFERENCE"],
    ["INVALID_REPLAY_SCOPE", "INVALID_REPLAY_REFERENCE"],
    ["MUTABLE_FILTERS", "INVALID_QUERY"],
    ["ORDERING_ABSENT", "VALIDATION_FAILED"],
    ["UNSUPPORTED_CONTRACT_VERSION", "VALIDATION_FAILED"],
    ["GOVERNANCE_SCOPE_UNDEFINED", "INVALID_SCOPE"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
  ] as readonly [GovernanceQueryScenario, GovernanceQueryErrorState][])(
    "rejects %s deterministically",
    (scenario, errorState) => {
      const validation = validateGovernanceQueryContract({ scenario });

      expect(validation.valid).toBe(false);
      expect(validation.errors.map((error) => error.state)).toContain(errorState);
      expect(validation.normalized_query_hash).toBeNull();
    },
  );

  it("builds immutable audit records for governance query execution", () => {
    const contract = buildGovernanceQueryContract();
    const audit = buildGovernanceQueryAuditRecord(contract, 3);

    expect(audit.query_id).toBe(contract.query_id);
    expect(audit.result_count).toBe(3);
    expect(audit.replay_reference).toBe(contract.replay_scope.replay_id);
    expect(audit.lineage_reference).toBe(contract.lineage_scope.lineage_reference);
    expect(audit.query_hash).toBe(contract.query_hash);
    expect(audit.audit_hash).toBeTruthy();
  });

  it("exposes operator query contract diagnostics", () => {
    const surface = buildGovernanceQueryObservabilitySurface({ scenario: "TENANT_ISOLATION_VIOLATION" });

    expect(surface.valid).toBe(false);
    expect(surface.errors).toContain("TENANT_ISOLATION_VIOLATION");
    expect(surface.query_hash).toBeTruthy();
    expect(surface.audit_hash).toBeTruthy();
  });
});
