import { describe, expect, it } from "vitest";
import {
  buildQuerySecurityTenantIsolationObservabilitySurface,
  getQuerySecurityTenantIsolationContract,
  runQuerySecurityTenantIsolation,
  validateQuerySecurityTenantIsolation,
} from "@/services/query-security-tenant-isolation";
import type { QueryOperation, QuerySecurityErrorState, QuerySecurityScenario } from "@/types/query-security-tenant-isolation";

describe("Mission Control Phase 8I.9 Query Security & Tenant Isolation", () => {
  it("defines fail-closed query security doctrine", () => {
    const contract = getQuerySecurityTenantIsolationContract();

    expect(contract.doctrine.schema_version).toBe("query-security-tenant-isolation/v8I.9");
    expect(contract.doctrine.principles).toContain("least-privilege");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.protected_services).toContain("CROSS_REFERENCE_SEARCH");
    expect(contract.doctrine.roles).toContain("SECURITY_OFFICER");
    expect(contract.doctrine.allowed_operations).toEqual(["SEARCH", "LOOKUP", "RECONSTRUCT", "INSPECT", "TRACE", "VIEW", "VERIFY"]);
    expect(contract.doctrine.prohibited_operations).toContain("MODIFY_INTEGRITY");
    expect(contract.doctrine.evaluation_order).toEqual(["Authentication", "Tenant Validation", "Mission Validation", "Role Validation", "Policy Validation", "Governance Validation", "Constitution Validation", "Read-Only Validation", "Authorization Decision"]);
    expect(contract.doctrine.fail_closed).toBe(true);
  });

  it("authorizes a tenant-scoped read-only query deterministically", () => {
    const response = runQuerySecurityTenantIsolation({ protected_service: "LINEAGE_SEARCH", requested_operation: "TRACE", role: "AUDITOR", records_returned: 12 });

    expect(response.phase_version).toBe("8I.9");
    expect(response.security_state).toBe("SECURITY_APPROVED");
    expect(response.authorization_record.authorization_result).toBe("AUTHORIZED");
    expect(response.tenant_isolation.cross_tenant_detected).toBe(false);
    expect(response.read_only_enforcement.operation_allowed).toBe(true);
    expect(response.audit_record.records_returned).toBe(12);
    expect(response.read_only).toBe(true);
    expect(response.fail_closed).toBe(true);
    expect(response.result_hash).toBeTruthy();
  });

  it("repeats identical security decisions with identical hashes", () => {
    const first = runQuerySecurityTenantIsolation({ protected_service: "REPLAY_QUERY", requested_operation: "VERIFY", role: "SECURITY_OFFICER" });
    const second = runQuerySecurityTenantIsolation({ protected_service: "REPLAY_QUERY", requested_operation: "VERIFY", role: "SECURITY_OFFICER" });

    expect(second.result_hash).toBe(first.result_hash);
    expect(second.audit_record.audit_hash).toBe(first.audit_record.audit_hash);
    expect(second.authorization_record.authorization_hash).toBe(first.authorization_record.authorization_hash);
    expect(second.security_record.security_hash).toBe(first.security_record.security_hash);
  });

  it("rejects prohibited mutation operations through read-only enforcement", () => {
    const response = runQuerySecurityTenantIsolation({ requested_operation: "MODIFY_REPLAY" as QueryOperation });

    expect(response.security_state).toBe("QUERY_MUTATION_ATTEMPT");
    expect(response.authorization_record.authorization_result).toBe("READ_ONLY_VIOLATION");
    expect(response.read_only_enforcement.prohibited_operation_detected).toBe(true);
    expect(response.read_only_enforcement.immutable_record_protection).toBe("VIOLATED");
    expect(response.audit_record.records_returned).toBe(0);
  });

  it("enforces tenant isolation and returns no partial data on cross-tenant failures", () => {
    const response = runQuerySecurityTenantIsolation({ scenario: "CROSS_TENANT_ACCESS", records_returned: 99 });

    expect(response.security_state).toBe("CROSS_TENANT_ACCESS");
    expect(response.authorization_record.authorization_result).toBe("TENANT_SCOPE_VIOLATION");
    expect(response.tenant_isolation.cross_tenant_detected).toBe(true);
    expect(response.tenant_isolation.tenant_matches_replay).toBe(false);
    expect(response.audit_record.records_returned).toBe(0);
    expect(response.result_hash).toBeNull();
  });

  it.each([
    ["AUTHENTICATION_FAILED", "AUTHENTICATION_FAILED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["MISSION_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION"],
    ["ROLE_VIOLATION", "ROLE_VIOLATION"],
    ["READ_ONLY_VIOLATION", "READ_ONLY_VIOLATION"],
    ["POLICY_REJECTED", "POLICY_REJECTED"],
    ["GOVERNANCE_REJECTED", "GOVERNANCE_REJECTED"],
    ["CONSTITUTION_REJECTED", "CONSTITUTION_REJECTED"],
    ["CROSS_TENANT_ACCESS", "CROSS_TENANT_ACCESS"],
    ["QUERY_MUTATION_ATTEMPT", "QUERY_MUTATION_ATTEMPT"],
    ["REPLAY_TAMPERING_DETECTED", "REPLAY_TAMPERING_DETECTED"],
    ["INVALID_SECURITY_CONTEXT", "INVALID_SECURITY_CONTEXT"],
  ] as readonly [QuerySecurityScenario, QuerySecurityErrorState][])(
    "maps %s to %s deterministically and fail-closed",
    (scenario, state) => {
      const response = runQuerySecurityTenantIsolation({ scenario });
      const validation = validateQuerySecurityTenantIsolation({ scenario });

      expect(response.security_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.audit_record.records_returned).toBe(0);
      expect(response.failures.length).toBeGreaterThan(0);
      expect(response.fail_closed).toBe(true);
    },
  );

  it("exposes operator diagnostics for security failures", () => {
    const surface = buildQuerySecurityTenantIsolationObservabilitySurface({ scenario: "POLICY_REJECTED" });

    expect(surface.security_state).toBe("POLICY_REJECTED");
    expect(surface.authorization_result).toBe("POLICY_REJECTED");
    expect(surface.errors).toContain("POLICY_REJECTED");
    expect(surface.read_only_enforced).toBe(true);
    expect(surface.audit_hash).toBeTruthy();
  });
});
