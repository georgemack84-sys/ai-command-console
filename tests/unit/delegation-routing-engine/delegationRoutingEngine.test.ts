import { describe, expect, it } from "vitest";
import {
  buildDelegationRoutingPackage,
  buildDelegationRoutingVisibilitySurface,
  computeContingencyPlanHash,
  computeDelegationPlanHash,
  computeRoutingDecisionHash,
  computeRoutingExplanationHash,
  getDelegationRoutingFramework,
} from "@/services/delegation-routing-engine";
import type { DelegationRoutingFailureReason, DelegationRoutingScenario } from "@/types/delegation-routing-engine";

describe("Mission Control Phase 8D.4 Delegation Planning & Routing Engine", () => {
  it("publishes delegation routing doctrine", () => {
    const framework = getDelegationRoutingFramework();

    expect(framework.doctrine.engine_version).toBe("delegation-routing-engine/v8D.4");
    expect(framework.doctrine.principles).toContain("single-primary-owner");
    expect(framework.doctrine.principles).toContain("non-executing");
    expect(framework.doctrine.states).toContain("READY_FOR_EXECUTION");
  });

  it("builds a baseline delegation plan and route", () => {
    const pkg = buildDelegationRoutingPackage();

    expect(pkg.validation.validation_state).toBe("PASS");
    expect(pkg.validation.ready_for_delegation_certification).toBe(true);
    expect(pkg.routing_decision.route_state).toBe("READY_FOR_EXECUTION");
    expect(pkg.delegation_plan.delegate_id).toBe(pkg.routing_decision.primary_execution_owner);
    expect(pkg.delegation_plan.dependencies).toEqual(pkg.source_authority_validation.source_classification.classification.dependency_analysis.dependency_refs);
    expect(pkg.routing_decision.escalation_path).toEqual(["primary delegate", "operator review", "governance review", "mission authority"]);
  });

  it("preserves immutable hashes for all routing artifacts", () => {
    const pkg = buildDelegationRoutingPackage();

    expect(pkg.delegation_plan.plan_hash).toBe(computeDelegationPlanHash(pkg.delegation_plan));
    expect(pkg.routing_decision.routing_hash).toBe(computeRoutingDecisionHash(pkg.routing_decision));
    expect(pkg.contingency_plan.contingency_hash).toBe(computeContingencyPlanHash(pkg.contingency_plan));
    expect(pkg.explainability.explanation_hash).toBe(computeRoutingExplanationHash(pkg.explainability));
    expect(pkg.contingency_plan.governance_policy_modified).toBe(false);
    expect(pkg.contingency_plan.constitutional_policy_modified).toBe(false);
  });

  it("replays deterministic routing decisions", () => {
    const first = buildDelegationRoutingPackage();
    const second = buildDelegationRoutingPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(second.replay.replay_hash).toBe(first.replay.replay_hash);
    expect(first.replay.reconstructed_owner).toBe(first.routing_decision.primary_execution_owner);
    expect(first.replay.reconstructed_sequence).toEqual(first.routing_decision.routing_sequence);
    expect(first.replay.reconstructed_contingency_hash).toBe(first.contingency_plan.contingency_hash);
  });

  it.each([
    ["OPERATOR_ROUTE", "WAITING_OPERATOR"],
    ["EXTERNAL_ROUTE", "READY_FOR_EXECUTION"],
  ] as const)("supports %s", (scenario, state) => {
    const pkg = buildDelegationRoutingPackage({ scenario });

    expect(pkg.routing_decision.route_state).toBe(state);
    if (scenario === "EXTERNAL_ROUTE") expect(pkg.routing_decision.primary_owner_type).toBe("EXTERNAL");
    if (scenario === "OPERATOR_ROUTE") expect(pkg.contingency_plan.operator_takeover.takeover_required).toBe(true);
  });

  it.each([
    ["BLOCKED_AUTHORITY", "INVALID_AUTHORITY_VALIDATION"],
    ["UNRESOLVED_DEPENDENCIES", "UNRESOLVED_DEPENDENCIES"],
    ["MULTIPLE_OWNERS", "MULTIPLE_PRIMARY_EXECUTION_OWNERS"],
    ["NONDETERMINISTIC_ROUTING", "NONDETERMINISTIC_ROUTING"],
    ["UNAUTHORIZED_DELEGATE", "UNAUTHORIZED_DELEGATE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION"],
    ["UNCERTIFIED_FALLBACK", "UNCERTIFIED_FALLBACK_DELEGATE"],
    ["INVALID_ROLLBACK", "INVALID_ROLLBACK_PLAN"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["MISSING_EXPLAINABILITY", "MISSING_EXPLAINABILITY"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [DelegationRoutingScenario, DelegationRoutingFailureReason][])("rejects %s", (scenario, reason) => {
    const pkg = buildDelegationRoutingPackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.validation.ready_for_delegation_certification).toBe(false);
    expect(pkg.replay.validation_state).toBe("FAIL");
  });

  it("generates complete explainability for baseline routes", () => {
    const pkg = buildDelegationRoutingPackage();

    expect(pkg.explainability.why_delegated).toContain(pkg.delegation_plan.task_id);
    expect(pkg.explainability.authority_used.length).toBeGreaterThan(0);
    expect(pkg.explainability.policies_satisfied.length).toBeGreaterThan(0);
    expect(pkg.explainability.risks_evaluated).toContain("governance risk");
    expect(pkg.explainability.confidence_rationale).toContain("Confidence");
    expect(pkg.explainability.governance_evidence.length).toBeGreaterThan(0);
  });

  it("exposes routing visibility", () => {
    const pkg = buildDelegationRoutingPackage({ scenario: "UNCERTIFIED_FALLBACK" });
    const surface = buildDelegationRoutingVisibilitySurface(pkg);

    expect(surface.validation_state).toBe("FAIL");
    expect(surface.failure_reasons).toContain("UNCERTIFIED_FALLBACK_DELEGATE");
    expect(surface.fallback_delegate).toBe("agent:uncertified-fallback");
    expect(surface.integrity_status).toBe("VALID");
  });
});
