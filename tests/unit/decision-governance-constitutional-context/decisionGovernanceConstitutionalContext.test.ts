import { describe, expect, it } from "vitest";
import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import {
  buildGovernanceConstitutionalObservability,
  createGovernanceConstitutionalContextRequest,
  getGovernanceConstitutionalContextResolver,
  replayGovernanceConstitutionalContext,
  resolveGovernanceConstitutionalContext,
} from "@/services/decision-governance-constitutional-context";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.6 Governance & Constitutional Context Resolver", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("resolves deterministic governance and constitutional context", () => {
    const pkg = resolveGovernanceConstitutionalContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.governance_context.active_policies.length).toBeGreaterThan(0);
    expect(pkg.governance_context.applicable_rules).toContain("rule_governance_context_required");
    expect(pkg.governance_context.governance_status).toBe("Review Required");
    expect(pkg.governance_context.governance_approvals).toContain("Governance Officer");
    expect(pkg.governance_context.required_reviews).toContain("Constitutional review");
    expect(pkg.constitutional_context.constitutional_principles.length).toBeGreaterThan(0);
    expect(pkg.constitutional_context.constitutional_compliance).toBe("Compliant");
    expect(pkg.constitutional_context.constitutional_constraints).toContain("No autonomous execution");
    expect(pkg.governance_domain.domain_name).toBe("governance_context");
    expect(pkg.constitutional_domain.domain_name).toBe("constitutional_context");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("preserves resolved policy conflicts instead of suppressing them", () => {
    const pkg = resolveGovernanceConstitutionalContext();

    expect(pkg.governance_context.policy_conflicts).toHaveLength(1);
    expect(pkg.governance_context.policy_conflicts[0]?.resolved).toBe(true);
    expect(pkg.governance_context.explainability.conflict_reasoning[0]).toContain("highest_precedence_policy");
    expect(pkg.validation.checks.policy_conflicts_resolved).toBe(true);
  });

  it("produces identical packages for identical inputs", () => {
    const request = createGovernanceConstitutionalContextRequest();
    const first = resolveGovernanceConstitutionalContext(request);
    const second = resolveGovernanceConstitutionalContext(request);

    expect(second.governance_context).toEqual(first.governance_context);
    expect(second.constitutional_context).toEqual(first.constitutional_context);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("can patch the 9.3.1 governance and constitutional domains", () => {
    const candidate = normalizedCandidate();
    const pkg = resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate }));
    const context = createDecisionContext({
      candidate,
      domain_overrides: {
        governance_context: pkg.governance_domain,
        constitutional_context: pkg.constitutional_domain,
      },
    });

    expect(context.governance_context.originating_record).toBe(pkg.governance_domain.originating_record);
    expect(context.constitutional_context.originating_record).toBe(pkg.constitutional_domain.originating_record);
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it("fails closed when applicable policies cannot be resolved", () => {
    const candidate = { ...normalizedCandidate(), mission_id: "mission_without_policies" };
    const pkg = resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("APPLICABLE_POLICIES_UNRESOLVED");
    expect(pkg.validation.checks.policies_identified).toBe(false);
    expect(pkg.governance_domain.status).toBe("UNAVAILABLE");
  });

  it("fails closed for cross-tenant governance references", () => {
    const candidate = { ...normalizedCandidate(), governance_refs: ["policy_tenant_beta_external_governance"] };
    const pkg = resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_GOVERNANCE_REFERENCE");
    expect(pkg.validation.checks.tenant_isolated).toBe(false);
  });

  it("fails closed when constitutional advisory-only operation is violated", () => {
    const candidate = { ...normalizedCandidate(), advisory_only: false };
    const pkg = resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_CONSTITUTIONAL");
    expect(pkg.validation.failure_reasons).toContain("CONSTITUTIONAL_VIOLATION_DETECTED");
    expect(pkg.constitutional_context.constitutional_violations).toContain("restore_advisory_only_constraint");
    expect(pkg.validation.checks.violations_absent).toBe(false);
  });

  it("fails closed when upstream replay is incompatible", () => {
    const candidate = { ...normalizedCandidate(), evidence_refs: ["missing"] };
    const pkg = resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("REPLAY_INCOMPATIBLE");
    expect(pkg.validation.checks.replay_compatible).toBe(false);
  });

  it("replays governance and constitutional context deterministically", () => {
    const pkg = resolveGovernanceConstitutionalContext();
    const replay = replayGovernanceConstitutionalContext(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes resolver observability metrics", () => {
    const pass = resolveGovernanceConstitutionalContext();
    const noPolicies = resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({
      candidate: { ...normalizedCandidate(), mission_id: "mission_without_policies" },
    }));
    const violation = resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({
      candidate: { ...normalizedCandidate(), advisory_only: false },
    }));

    const metrics = buildGovernanceConstitutionalObservability([pass, noPolicies, violation]);

    expect(metrics.resolution_attempts).toBe(3);
    expect(metrics.successful_resolutions).toBe(1);
    expect(metrics.failed_resolutions).toBe(2);
    expect(metrics.governance_failures).toBeGreaterThan(0);
    expect(metrics.constitutional_failures).toBeGreaterThan(0);
    expect(metrics.policy_conflict_count).toBeGreaterThan(0);
    expect(metrics.constitutional_violation_count).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the governance constitutional resolver package", () => {
    const resolver = getGovernanceConstitutionalContextResolver();

    expect(resolver.resolution_order).toContain("COMPLIANCE_ASSESSED");
    expect(resolver.context_package.validation.validation_status).toBe("PASS");
    expect(resolver.replay.replay_valid).toBe(true);
    expect(resolver.observability.resolution_attempts).toBe(1);
  });
});
