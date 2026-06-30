import { describe, expect, it } from "vitest";
import {
  buildGovernancePolicyPackage,
  buildGovernancePolicyVisibilitySurface,
  computeGovernanceEnforcementHash,
  computeGovernancePolicyEvaluationHash,
  computeGovernancePolicyEvidenceHash,
  getGovernancePolicyFramework,
} from "@/services/governance-policy-enforcement-engine";
import type { GovernancePolicyDecision, GovernancePolicyScenario, GovernancePolicyViolation } from "@/types/governance-policy-enforcement-engine";

describe("Mission Control Phase 8F.4 Governance & Policy Enforcement Engine", () => {
  it("publishes governance policy enforcement doctrine", () => {
    const framework = getGovernancePolicyFramework();

    expect(framework.doctrine.engine_version).toBe("governance-policy-enforcement-engine/v8F.4");
    expect(framework.doctrine.principles).toContain("governance-supremacy");
    expect(framework.doctrine.principles).toContain("constitutional-supremacy");
    expect(framework.doctrine.principles).toContain("no-autonomous-policy-changes");
    expect(framework.doctrine.states).toEqual(["RECEIVED", "DISCOVERING", "VALIDATING", "AUTHORIZED", "RESTRICTED", "PAUSED", "ESCALATED", "BLOCKED", "FAILED", "COMPLETED"]);
    expect(framework.doctrine.decisions).toEqual(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "CHECKPOINT", "PAUSE", "ESCALATE", "BLOCK", "FAIL_SAFE"]);
    expect(framework.doctrine.categories).toEqual(["CONSTITUTIONAL", "GOVERNANCE", "POLICY", "REGULATORY", "MISSION", "RUNTIME"]);
  });

  it("allows baseline execution without creating or modifying governance artifacts", () => {
    const pkg = buildGovernancePolicyPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.enforcement_state).toBe("AUTHORIZED");
    expect(pkg.governance_enforcement.enforcement_decision).toBe("ALLOW");
    expect(pkg.policy_created).toBe(false);
    expect(pkg.policy_modified).toBe(false);
    expect(pkg.constitutional_rules_modified).toBe(false);
    expect(pkg.ledger_entry.append_only).toBe(true);
  });

  it("produces deterministic hashes, evidence, ledger, and replay", () => {
    const first = buildGovernancePolicyPackage();
    const second = buildGovernancePolicyPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeGovernanceEnforcementHash(first.governance_enforcement)).toBe(first.governance_enforcement.integrity_hash);
    expect(first.evaluations.every((item) => computeGovernancePolicyEvaluationHash(item) === item.integrity_hash)).toBe(true);
    expect(computeGovernancePolicyEvidenceHash(first.evidence)).toBe(first.evidence.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["Governance Discovery", "Policy Discovery", "Constitutional Evaluation", "Regulatory Evaluation", "Conflict Resolution", "Compliance Validation", "Enforcement Reasoning", "Applied Restrictions", "Escalation Path", "Final Decision"]);
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["MINOR_POLICY_CONFLICT", "ALLOW_WITH_RESTRICTIONS", "MINOR_POLICY_CONFLICT"],
    ["GOVERNANCE_UNCERTAINTY", "PAUSE", "GOVERNANCE_UNCERTAIN"],
    ["EXPIRED_APPROVALS", "PAUSE", "EXPIRED_APPROVAL"],
    ["MISSING_APPROVALS", "PAUSE", "MISSING_APPROVAL"],
    ["RUNTIME_GOVERNANCE_DRIFT", "PAUSE", "RUNTIME_GOVERNANCE_DRIFT"],
    ["GOVERNANCE_CONFLICT", "ESCALATE", "GOVERNANCE_CONFLICT"],
    ["CONFLICTING_OPERATOR_APPROVALS", "ESCALATE", "CONFLICTING_OPERATOR_APPROVALS"],
    ["REGULATORY_AMBIGUITY", "ESCALATE", "REGULATORY_AMBIGUITY"],
    ["CONSTITUTIONAL_VIOLATION", "BLOCK", "CONSTITUTIONAL_VIOLATION"],
    ["GOVERNANCE_BYPASS", "BLOCK", "GOVERNANCE_BYPASS"],
    ["POLICY_BYPASS", "BLOCK", "POLICY_BYPASS"],
    ["UNAUTHORIZED_POLICY_OVERRIDE", "BLOCK", "UNAUTHORIZED_POLICY_OVERRIDE"],
    ["PROTECTED_RESOURCE_ACCESS", "BLOCK", "PROTECTED_RESOURCE_ACCESS"],
    ["UNAUTHORIZED_EXECUTION", "BLOCK", "UNAUTHORIZED_EXECUTION"],
    ["COMPLIANCE_FAILURE", "BLOCK", "COMPLIANCE_FAILURE"],
    ["TENANT_MISMATCH", "BLOCK", "TENANT_ISOLATION_VIOLATION"],
    ["INTEGRITY_FAILURE", "FAIL_SAFE", "INTEGRITY_VERIFICATION_FAILURE"],
    ["MISSING_POLICY_REFERENCES", "FAIL_SAFE", "POLICY_REFERENCE_MISSING"],
    ["REPLAY_MISMATCH", "FAIL_SAFE", "REPLAY_RECONSTRUCTION_MISMATCH"],
    ["EXECUTION_BOUNDARY_BLOCKED", "FAIL_SAFE", "EXECUTION_BOUNDARY_NOT_AUTHORIZED"],
  ] as readonly [GovernancePolicyScenario, GovernancePolicyDecision, GovernancePolicyViolation][])("maps %s to %s", (scenario, decision, violation) => {
    const pkg = buildGovernancePolicyPackage({ scenario });

    expect(pkg.governance_enforcement.enforcement_decision).toBe(decision);
    expect(pkg.governance_enforcement.detected_violations).toContain(violation);
    expect(pkg.policy_created).toBe(false);
    expect(pkg.policy_modified).toBe(false);
    expect(pkg.constitutional_rules_modified).toBe(false);
  });

  it("exposes governance policy visibility", () => {
    const surface = buildGovernancePolicyVisibilitySurface(buildGovernancePolicyPackage({ scenario: "GOVERNANCE_CONFLICT" }));

    expect(surface.governance_status).toBe("CONFLICT");
    expect(surface.violation_history).toContain("GOVERNANCE_CONFLICT");
    expect(surface.detected_conflicts.length).toBeGreaterThan(0);
    expect(surface.enforcement_reasoning).toContain("GOVERNANCE_CONFLICT");
    expect(surface.integrity_status).toBe("VALID");
  });
});
