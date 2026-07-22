import { describe, expect, it } from "vitest";
import {
  buildAuthorityOperatorObservability,
  createAuthorityOperatorContextRequest,
  getAuthorityOperatorContextResolver,
  replayAuthorityOperatorContext,
  resolveAuthorityOperatorContext,
} from "@/services/decision-authority-operator-context";
import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import type { AuthorityOperatorFailureReason } from "@/types/decision-authority-operator-context";

describe("Mission Control Phase 9.3.3 Authority & Operator Context Resolver", () => {
  it("resolves deterministic authority and operator context", () => {
    const pkg = resolveAuthorityOperatorContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.operator_context.operator_id).toBe("operator_alpha_mission_owner");
    expect(pkg.operator_context.operator_tenant).toBe("tenant_alpha");
    expect(pkg.authority_context.advisory_only_status).toBe("ENFORCED");
    expect(pkg.authority_context.approval_authority.sufficient).toBe(true);
    expect(pkg.authority_context.escalation_authority.escalation_required).toBe(false);
    expect(pkg.authority_context.authority_constraints).toContain("no_autonomous_execution");
    expect(pkg.operator_domain.domain_name).toBe("operator_context");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical authority packages for identical inputs", () => {
    const request = createAuthorityOperatorContextRequest();
    const first = resolveAuthorityOperatorContext(request);
    const second = resolveAuthorityOperatorContext(request);

    expect(second.authority_context).toEqual(first.authority_context);
    expect(second.operator_context).toEqual(first.operator_context);
    expect(second.cache_entry).toEqual(first.cache_entry);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("can patch the 9.3.1 operator context domain", () => {
    const normalized = normalizeDecisionCandidateInput();
    const pkg = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate: normalized.candidate }));
    const context = createDecisionContext({
      candidate: normalized.candidate,
      domain_overrides: { operator_context: pkg.operator_domain },
    });

    expect(context.operator_context.originating_record).toBe(pkg.operator_domain.originating_record);
    expect(context.operator_context.constitutional_rationale).toContain("Advisory-only");
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it("resolves explicit delegation lineage deterministically", () => {
    const pkg = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({
      operator_id: "operator_alpha_delegate",
      delegated_by: "operator_alpha_mission_owner",
    }));

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.authority_context.delegation_authority.delegation_validity).toBe("VALID");
    expect(pkg.authority_context.delegation_authority.delegation_lineage).toEqual(["delegation_operator_alpha_mission_owner_operator_alpha_delegate"]);
    expect(pkg.authority_context.explainability.delegation_chain).toEqual(pkg.authority_context.delegation_authority.delegation_lineage);
  });

  it("resolves escalation when authority is insufficient but escalation path exists", () => {
    const pkg = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({
      operator_id: "operator_alpha_delegate",
      requested_authority_level: "OPERATOR_APPROVAL",
      escalation_reason: "human_oversight_mandated",
    }));

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.authority_context.approval_authority.sufficient).toBe(false);
    expect(pkg.authority_context.escalation_authority.escalation_required).toBe(true);
    expect(pkg.authority_context.escalation_authority.escalation_target).toBe("operator_alpha_governance_officer");
    expect(pkg.authority_context.explainability.escalation_reasoning).toContain("human_oversight_mandated");
  });

  it.each<[
    string,
    Parameters<typeof createAuthorityOperatorContextRequest>[0],
    AuthorityOperatorFailureReason,
  ]>([
    ["unknown operator", { operator_id: "operator_unknown" }, "OPERATOR_NOT_FOUND"],
    ["suspended operator", { operator_id: "operator_alpha_suspended" }, "OPERATOR_NOT_AUTHENTICATED"],
    ["cross tenant operator", { operator_id: "operator_beta_external" }, "OPERATOR_TENANT_MISMATCH"],
    ["self delegation", { operator_id: "operator_alpha_mission_owner", delegated_by: "operator_alpha_mission_owner" }, "DELEGATION_INVALID"],
  ])("fails closed for %s", (_name, override, failure) => {
    const pkg = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest(override));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain(failure);
    expect(pkg.validation.failure_reason).toBe(failure);
    expect(pkg.validation.validation_state).not.toBe("PASSED");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects advisory-only violations", () => {
    const normalized = normalizeDecisionCandidateInput();
    const candidate = normalized.candidate ? { ...normalized.candidate, advisory_only: false, authority_required: true } : undefined;
    const pkg = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ADVISORY");
    expect(pkg.validation.failure_reasons).toContain("ADVISORY_ONLY_VIOLATION");
    expect(pkg.validation.checks.advisory_only_enforced).toBe(false);
  });

  it("requires constitutional references for constitutional approval", () => {
    const pkg = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({
      operator_id: "operator_alpha_governance_officer",
      requested_authority_level: "CONSTITUTIONAL_APPROVAL",
    }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_CONSTITUTION");
    expect(pkg.validation.failure_reasons).toContain("CONSTITUTIONAL_VALIDATION_UNAVAILABLE");
  });

  it("creates immutable authority cache evidence", () => {
    const pkg = resolveAuthorityOperatorContext();

    expect(pkg.cache_entry.cache_id).toContain(pkg.candidate_id);
    expect(pkg.cache_entry.authority_context).toEqual(pkg.authority_context);
    expect(pkg.cache_entry.authority_version).toBe("authority-context/v1");
    expect(pkg.cache_entry.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("replays authority context deterministically", () => {
    const pkg = resolveAuthorityOperatorContext();
    const replay = replayAuthorityOperatorContext(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes authority resolver observability metrics", () => {
    const pass = resolveAuthorityOperatorContext();
    const operatorFail = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ operator_id: "operator_unknown" }));
    const advisoryFail = resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({
      candidate: normalizeDecisionCandidateInput().candidate ? { ...normalizeDecisionCandidateInput().candidate!, advisory_only: false, authority_required: true } : undefined,
    }));

    const metrics = buildAuthorityOperatorObservability([pass, operatorFail, advisoryFail]);

    expect(metrics.resolution_attempts).toBe(3);
    expect(metrics.successful_resolutions).toBe(1);
    expect(metrics.failed_resolutions).toBe(2);
    expect(metrics.operator_failures).toBeGreaterThan(0);
    expect(metrics.advisory_failures).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the authority resolver foundation package", () => {
    const resolver = getAuthorityOperatorContextResolver();

    expect(resolver.resolution_order).toContain("AUTHORITY_VALIDATED");
    expect(resolver.context_package.validation.validation_status).toBe("PASS");
    expect(resolver.replay.replay_valid).toBe(true);
    expect(resolver.observability.resolution_attempts).toBe(1);
  });
});
