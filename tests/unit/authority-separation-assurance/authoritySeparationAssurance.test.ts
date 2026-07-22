import { describe, expect, it } from "vitest";
import {
  buildAuthorityObservabilitySurface,
  createAuthoritySeparationContract,
  detectAuthorityConflicts,
  generateAuthorityConflictMap,
  getAuthoritySeparationAssurance,
  replayAuthoritySeparation,
  validateAuthorityProfiles,
  validateAuthorityReplay,
  validateAuthoritySeparation,
  validateEscalation,
  verifyRoleSeparation,
} from "@/services/authority-separation-assurance";
import type { AuthorityFailure, AuthorityScenario } from "@/types/authority-separation-assurance";

describe("authority separation assurance", () => {
  it("publishes the 8ALT.7.4 certified doctrine bundle", () => {
    const bundle = getAuthoritySeparationAssurance();

    expect(bundle.doctrine.contract_version).toBe("authority-separation-assurance/v8ALT.7.4");
    expect(bundle.doctrine.final_state).toBe("AUTHORITY_SEPARATION_ASSURANCE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.replay.deterministic).toBe(true);
  });

  it("validates deterministic immutable authority profiles and boundaries", () => {
    const first = createAuthoritySeparationContract();
    const second = createAuthoritySeparationContract();
    const validation = validateAuthoritySeparation(first);

    expect(first.contract_hash).toBe(second.contract_hash);
    expect(validateAuthorityProfiles().profiles_deterministic).toBe(true);
    expect(validation.boundaries_valid).toBe(true);
    expect(first.authority_profiles.every((profile) => profile.immutable && profile.integrity_hash)).toBe(true);
  });

  it("enforces role separation, operator supremacy, and governance supremacy", () => {
    const validation = validateAuthoritySeparation();
    const contract = createAuthoritySeparationContract();

    expect(verifyRoleSeparation().role_separation_valid).toBe(true);
    expect(validation.operator_supremacy_valid).toBe(true);
    expect(validation.governance_valid).toBe(true);
    expect(validation.constitutional_valid).toBe(true);
    expect(contract.operator_supremacy_policy).toContain("operator-revoke");
  });

  it("validates tenant isolation, escalation boundaries, advisory-only constraints, lineage, and replay", () => {
    const contract = createAuthoritySeparationContract();
    const validation = validateAuthoritySeparation(contract);
    const replay = replayAuthoritySeparation(contract);

    expect(validation.tenant_isolated).toBe(true);
    expect(validateEscalation().escalation_valid).toBe(true);
    expect(validation.advisory_only_valid).toBe(true);
    expect(validation.lineage_preserved).toBe(true);
    expect(validateAuthorityReplay().replay_valid).toBe(true);
    expect(replay.deterministic).toBe(true);
  });

  it("produces an empty conflict map in the certified baseline", () => {
    const map = generateAuthorityConflictMap();

    expect(map.conflicts).toHaveLength(0);
    expect(map.alerts).toHaveLength(0);
    expect(map.boundaries.every((boundary) => boundary.validation_status === "VALID")).toBe(true);
  });

  it.each([
    ["AUTHORITY_OVERLAP", "AUTHORITY_OVERLAP_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["UNAUTHORIZED_CONTROL_TRANSFER", "UNAUTHORIZED_CONTROL_TRANSFER_DETECTED"],
    ["HIDDEN_COMMAND_AUTHORITY", "HIDDEN_COMMAND_AUTHORITY_DETECTED"],
    ["PRIVILEGE_LEAKAGE", "CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED"],
    ["ROLE_MERGING", "ROLE_SEPARATION_VIOLATED"],
    ["OPERATOR_BYPASS", "OPERATOR_SUPREMACY_VIOLATED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["CROSS_TENANT_AUTHORITY", "CROSS_TENANT_AUTHORITY_DETECTED"],
    ["UNAUTHORIZED_ESCALATION", "UNAUTHORIZED_ESCALATION_DETECTED"],
    ["ADVISORY_EXECUTION", "ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION"],
    ["REPLAY_MISMATCH", "AUTHORITY_REPLAY_MISMATCH_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
    ["HIDDEN_AUTHORITY_STATE", "HIDDEN_AUTHORITY_STATE_DETECTED"],
  ] satisfies [AuthorityScenario, AuthorityFailure][])("fails closed for %s", (scenario, failure) => {
    const contract = createAuthoritySeparationContract({ scenario });
    const validation = validateAuthoritySeparation(contract);

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("emits conflicts and alerts for authority violations", () => {
    const conflicts = detectAuthorityConflicts({ scenario: "PRIVILEGE_LEAKAGE" });
    const map = generateAuthorityConflictMap({ scenario: "PRIVILEGE_LEAKAGE" });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ conflict_type: "PRIVILEGE_LEAKAGE", severity: "CRITICAL" });
    expect(map.alerts[0]).toMatchObject({ violation_type: "CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED" });
  });

  it("publishes an operator-visible authority observability surface", () => {
    const surface = buildAuthorityObservabilitySurface();

    expect(surface.state).toBe("CERTIFIED");
    expect(surface.profile_count).toBeGreaterThan(5);
    expect(surface.boundary_count).toBe(surface.profile_count);
    expect(surface.conflict_count).toBe(0);
    expect(surface.contract_hash).toBeTruthy();
  });
});
