import { describe, expect, it } from "vitest";
import {
  buildAuthorityBoundaryPackage,
  buildAuthorityBoundaryVisibilitySurface,
  computeAuthorityEvidenceHash,
  computeAuthorityScopeHash,
  computeAuthorityValidationHash,
  computeAuthorizationDecisionHash,
  computeDelegationAuthorityHash,
  computeRuntimeAuthorityMonitorHash,
  getAuthorityBoundaryFramework,
} from "@/services/authority-boundary-engine";
import type { AuthorityBoundaryFailureReason, AuthorityBoundaryScenario } from "@/types/authority-boundary-engine";

describe("Mission Control Phase 8F.2 Authority Boundary Engine", () => {
  it("publishes authority boundary doctrine, levels, states, decisions, and domains", () => {
    const framework = getAuthorityBoundaryFramework();

    expect(framework.doctrine.engine_version).toBe("authority-boundary-engine/v8F.2");
    expect(framework.doctrine.principles).toContain("explicit-authority");
    expect(framework.doctrine.principles).toContain("no-implied-authority");
    expect(framework.doctrine.principles).toContain("least-privilege");
    expect(framework.doctrine.authority_levels).toEqual(["NONE", "VIEW", "RECOMMEND", "PLAN", "ORCHESTRATE", "DELEGATE", "SUPERVISE", "EXECUTE", "ROLLBACK", "RECOVER", "ADMINISTRATIVE", "SYSTEM"]);
    expect(framework.doctrine.authority_states).toEqual(["UNVERIFIED", "VALIDATING", "AUTHORIZED", "RESTRICTED", "ESCALATED", "BLOCKED", "FAILED"]);
    expect(framework.doctrine.decision_types).toEqual(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "ESCALATE", "BLOCK", "FAIL_SAFE"]);
    expect(framework.doctrine.authority_types).toContain("delegation");
  });

  it("authorizes a baseline request without granting new authority or executing autonomously", () => {
    const pkg = buildAuthorityBoundaryPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("authority-boundary-engine/v8F.2");
    expect(pkg.authority_state).toBe("AUTHORIZED");
    expect(pkg.authorization_decision.decision).toBe("ALLOW");
    expect(pkg.authorization_decision.approved_scope).toEqual(["mission", "workflow", "execution"]);
    expect(pkg.authority_granted).toBe(false);
    expect(pkg.new_authority_created).toBe(false);
    expect(pkg.autonomous_execution_performed).toBe(false);
    expect(pkg.ledger_entry.append_only).toBe(true);
  });

  it("produces deterministic hashes, evidence, and replay reconstruction", () => {
    const first = buildAuthorityBoundaryPackage();
    const second = buildAuthorityBoundaryPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeAuthorityValidationHash(first.authority_validation)).toBe(first.authority_validation.integrity_hash);
    expect(computeAuthorityScopeHash(first.scope_validation)).toBe(first.scope_validation.integrity_hash);
    expect(computeDelegationAuthorityHash(first.delegation_validation)).toBe(first.delegation_validation.integrity_hash);
    expect(computeAuthorizationDecisionHash(first.authorization_decision)).toBe(first.authorization_decision.integrity_hash);
    expect(computeRuntimeAuthorityMonitorHash(first.runtime_monitor)).toBe(first.runtime_monitor.integrity_hash);
    expect(computeAuthorityEvidenceHash(first.authority_evidence)).toBe(first.authority_evidence.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["Execution Request", "Identity Validation", "Authority Discovery", "Authority Scope Validation", "Governance Validation", "Constitution Validation", "Policy Validation", "Delegation Validation", "Decision Engine", "Evidence Recording"]);
    expect(first.replay.validation_state).toBe("PASS");
  });

  it("supports restricted and escalated authority decisions", () => {
    const restricted = buildAuthorityBoundaryPackage({ scenario: "ALLOW_WITH_RESTRICTIONS" });
    const escalated = buildAuthorityBoundaryPackage({ scenario: "OPERATOR_ESCALATION_REQUIRED" });

    expect(restricted.authority_state).toBe("RESTRICTED");
    expect(restricted.authorization_decision.decision).toBe("ALLOW_WITH_RESTRICTIONS");
    expect(restricted.authorization_decision.restrictions).toContain("SUPERVISION_REQUIRED");
    expect(restricted.runtime_monitor.runtime_action).toBe("RESTRICT");
    expect(escalated.authority_state).toBe("ESCALATED");
    expect(escalated.authorization_decision.decision).toBe("ESCALATE");
    expect(escalated.authorization_decision.escalation_request).toBe("operator:mission-control-review");
    expect(escalated.runtime_monitor.runtime_action).toBe("ESCALATE");
  });

  it.each([
    ["MISSING_AUTHORITY_SOURCE", "AUTHORITY_SOURCE_MISSING"],
    ["INSUFFICIENT_SCOPE", "AUTHORITY_SCOPE_INSUFFICIENT"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_DETECTED"],
    ["ROLE_EXPANSION", "UNAUTHORIZED_ROLE_EXPANSION"],
    ["IMPLICIT_AUTHORITY", "IMPLICIT_AUTHORITY_ASSUMPTION"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION"],
    ["DELEGATION_LOOP", "DELEGATION_LOOP_DETECTED"],
    ["RECURSIVE_DELEGATION", "RECURSIVE_DELEGATION_DETECTED"],
    ["DELEGATION_OUTSIDE_SCOPE", "DELEGATION_OUTSIDE_SCOPE"],
    ["EXPIRED_DELEGATION", "DELEGATION_EXPIRED"],
    ["HIDDEN_DELEGATION", "HIDDEN_DELEGATION_DETECTED"],
    ["GOVERNANCE_REJECTION", "GOVERNANCE_REJECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION"],
    ["OPERATOR_APPROVAL_MISSING", "OPERATOR_APPROVAL_MISSING"],
    ["MISSION_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION"],
    ["TENANT_MISMATCH", "TENANT_MISMATCH"],
    ["AUTHORITY_EXPIRED", "AUTHORITY_EXPIRED"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH"],
    ["LINEAGE_MISSING", "LINEAGE_REFERENCE_MISSING"],
    ["TRUTH_LEDGER_MISSING", "TRUTH_LEDGER_REFERENCE_MISSING"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["SIGNATURE_MISMATCH", "DIGITAL_SIGNATURE_INVALID"],
  ] as readonly [AuthorityBoundaryScenario, AuthorityBoundaryFailureReason][])("blocks unsafe authority scenario %s", (scenario, reason) => {
    const pkg = buildAuthorityBoundaryPackage({ scenario });

    expect(pkg.authorization_decision.decision).toBe("BLOCK");
    expect(pkg.authorization_decision.failures).toContain(reason);
    expect(pkg.authorization_decision.approved_scope).toEqual([]);
    expect(pkg.runtime_monitor.runtime_action).toBe("BLOCK");
    expect(pkg.authority_granted).toBe(false);
  });

  it("fails safe when runtime authority is lost or authority is uncertain", () => {
    const lost = buildAuthorityBoundaryPackage({ scenario: "RUNTIME_AUTHORITY_LOST" });
    const uncertain = buildAuthorityBoundaryPackage({ scenario: "UNKNOWN_CONDITION" });

    expect(lost.authorization_decision.decision).toBe("FAIL_SAFE");
    expect(lost.authorization_decision.failures).toContain("RUNTIME_AUTHORITY_LOST");
    expect(lost.runtime_monitor.authority_still_active).toBe(false);
    expect(lost.runtime_monitor.runtime_action).toBe("FAIL_SAFE");
    expect(uncertain.authorization_decision.decision).toBe("FAIL_SAFE");
    expect(uncertain.authorization_decision.failures).toContain("FAIL_CLOSED");
  });

  it("exposes authority visibility for operators", () => {
    const surface = buildAuthorityBoundaryVisibilitySurface(buildAuthorityBoundaryPackage({ scenario: "UNAUTHORIZED_DELEGATION" }));

    expect(surface.authority_state).toBe("BLOCKED");
    expect(surface.authority_level).toBe("EXECUTE");
    expect(surface.denied_permissions).toEqual(["mission", "workflow", "execution"]);
    expect(surface.delegation_chain).toContain("controlled-autonomy-runtime");
    expect(surface.decision_explanation).toContain("UNAUTHORIZED_DELEGATION");
    expect(surface.integrity_status).toBe("VALID");
  });
});
