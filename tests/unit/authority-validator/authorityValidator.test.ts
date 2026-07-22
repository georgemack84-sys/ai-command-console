import { describe, expect, it } from "vitest";

import {
  getAuthorityValidatorBundle,
  replayAuthorityValidator,
  runAuthorityValidator,
  validateAuthorityValidator,
} from "@/services/authority-validator";
import type { AuthorityValidatorFailure } from "@/types/authority-validator";

const conditionalFailures = [
  "AUTHORITY_PROFILES_MISSING",
  "AUTHORITY_PROFILE_CERTIFICATION_MISSING",
  "DELEGATION_ENGINE_MISSING",
  "DELEGATION_EVIDENCE_MISSING",
  "AUTHORITY_EVALUATION_ENGINE_MISSING",
  "RESTRICTION_MODEL_MISSING",
  "DISPOSITION_MAPPING_MISSING",
  "AUTHORITY_REGISTRY_MISSING",
  "AUTHORITY_API_MISSING",
  "DELEGATION_API_MISSING",
  "RESTRICTION_API_MISSING",
  "DECISION_API_MISSING",
  "AUTHORITY_EVIDENCE_MISSING",
] as const satisfies readonly AuthorityValidatorFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "AUTHORITY_PROFILE_SCOPE_INVALID",
  "AUTHORITY_PROFILE_OWNERSHIP_AMBIGUOUS",
  "UNSCOPED_DELEGATION_ALLOWED",
  "EXPIRED_DELEGATION_ALLOWED",
  "REVOKED_DELEGATION_ALLOWED",
  "AUTHORITY_DECISION_NON_DETERMINISTIC",
  "AUTHORITY_CONFLICT_UNRESOLVED",
  "TENANT_BOUNDARY_BYPASSED",
  "NAMESPACE_VALIDATION_FAILED",
  "LIFECYCLE_VALIDATION_FAILED",
  "CERTIFICATION_VALIDATION_FAILED",
  "RESTRICTIONS_NOT_ENFORCED",
  "POLICY_PREREQUISITES_SKIPPED",
  "SAFETY_PREREQUISITES_SKIPPED",
  "UNKNOWN_DISPOSITION_ALLOWED",
  "ENFORCEMENT_SEQUENCE_INVALID",
  "AUTHORITY_EVIDENCE_NOT_IMMUTABLE",
  "AUTHORITY_REPLAY_INVALID",
] as const satisfies readonly AuthorityValidatorFailure[];

describe("Authority Validator W2.5", () => {
  it("publishes the W2.5 authority-first doctrine and bundle", () => {
    const bundle = getAuthorityValidatorBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "authority-validator/w2.5",
      owns_authority_profiles: true,
      owns_delegated_authority: true,
      owns_authority_evaluation: true,
      owns_restriction_evaluation: true,
      owns_disposition_mapping: true,
      owns_authority_registry: true,
      owns_authority_decisions: true,
      owns_authority_apis: true,
      owns_authority_evidence: true,
      enforcement_sequence: "Authority -> Policy -> Safety -> Operator",
      operational_gate: "Authority Validator Operational Gate",
    });
    expect(bundle.result.readiness.decision).toBe("AUTHORITY_VALIDATOR_OPERATIONAL");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic authority validation to W2.0 through W2.4", () => {
    const first = runAuthorityValidator();
    const second = runAuthorityValidator();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.capability_registry_ref).toBe("capability-registry/w2.3");
    expect(first.skill_registry_ref).toBe("skill-registry/w2.4");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAuthorityValidator(first).valid).toBe(true);
    expect(replayAuthorityValidator(first)).toBe(true);
  });

  it("defines canonical authority profiles and constitutionally constrained delegation", () => {
    const result = runAuthorityValidator();

    expect(result.profiles.profile_kinds).toEqual(["Agent", "Operator", "Tenant", "Organization", "Runtime", "Service", "Workflow", "Capability", "Skill", "Administrative"]);
    expect(result.profiles).toMatchObject({
      authority_scope: true,
      authority_level: true,
      ownership: true,
      jurisdiction: true,
      inherited_authority: true,
      delegated_authority_eligibility: true,
      restrictions: true,
      expiration_rules: true,
      certification_requirements: true,
    });
    expect(result.delegation.delegation_kinds).toEqual(["Temporary", "Permanent", "Scoped", "Conditional", "Hierarchical", "Tenant", "Workflow", "Runtime"]);
    expect(result.delegation).toMatchObject({
      issuer: true,
      recipient: true,
      authority_scope: true,
      duration: true,
      limitations: true,
      revocation: true,
      evidence: true,
      approval_history: true,
      constitutional_constraints: true,
    });
  });

  it("evaluates requester authority, ownership, lifecycle, tenancy, namespace, and certification", () => {
    const result = runAuthorityValidator();

    expect(result.evaluation).toMatchObject({
      requester: true,
      authority_profile: true,
      delegated_authority: true,
      capability_ownership: true,
      skill_ownership: true,
      lifecycle_state: true,
      tenant_boundary: true,
      namespace: true,
      constitutional_constraints: true,
      runtime_eligibility: true,
      certification_status: true,
      conflict_resolution: true,
      deterministic_results: true,
    });
  });

  it("enforces restrictions before authorization and maps canonical dispositions", () => {
    const result = runAuthorityValidator();

    expect(result.restrictions).toMatchObject({
      tenant_restrictions: true,
      organization_restrictions: true,
      jurisdiction_restrictions: true,
      capability_restrictions: true,
      skill_restrictions: true,
      lifecycle_restrictions: true,
      runtime_restrictions: true,
      certification_restrictions: true,
      policy_prerequisites: true,
      safety_prerequisites: true,
      before_execution_authorization: true,
    });
    expect(result.disposition_mapping.dispositions).toEqual([
      "AUTHORIZED",
      "AUTHORIZED_WITH_RESTRICTIONS",
      "DELEGATED",
      "DENIED",
      "REQUIRES_OPERATOR",
      "REQUIRES_POLICY",
      "REQUIRES_CERTIFICATION",
      "SUSPENDED",
      "REVOKED",
      "UNKNOWN",
    ]);
    expect(result.disposition_mapping.unknown_rejected).toBe(true);
    expect(result.readiness.enforcement_sequence).toBe("Authority -> Policy -> Safety -> Operator");
    expect(result.readiness.authority_precedes_policy_safety_operator).toBe(true);
  });

  it("produces immutable decisions, registry records, APIs, and replay evidence", () => {
    const result = runAuthorityValidator();

    expect(result.registry).toMatchObject({
      authority_profiles: true,
      delegation_records: true,
      authority_hierarchy: true,
      restriction_definitions: true,
      constitutional_mappings: true,
      evidence_references: true,
      historical_decisions: true,
      queryable: true,
    });
    expect(result.decisions).toMatchObject({
      validate_authority: true,
      validate_delegation: true,
      resolve_authority: true,
      evaluate_restrictions: true,
      produce_decision: true,
      decision_identifier: true,
      requester: true,
      requested_action: true,
      evaluated_authority: true,
      restrictions_applied: true,
      delegated_authority_used: true,
      disposition: "AUTHORIZED",
      reasoning: true,
      timestamp: true,
      evidence_reference: true,
      deterministic_decision: true,
    });
    expect(result.apis).toMatchObject({
      validate_authority: true,
      evaluate_authority: true,
      resolve_authority: true,
      list_authority_profiles: true,
      query_authority: true,
      grant_delegation: true,
      revoke_delegation: true,
      validate_delegation: true,
      list_delegations: true,
      evaluate_restrictions: true,
      query_restrictions: true,
      list_restriction_policies: true,
      retrieve_decision: true,
      replay_decision: true,
      verify_decision: true,
      stable: true,
    });
    expect(result.evidence.records).toHaveLength(7);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional operation for %s", (failure) => {
    const result = runAuthorityValidator({ scenario: failure });
    const validation = validateAuthorityValidator(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_OPERATIONAL");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runAuthorityValidator({ scenario: failure });
    const validation = validateAuthorityValidator(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit operational gate failure as not operational", () => {
    const result = runAuthorityValidator({ scenario: "AUTHORITY_VALIDATOR_OPERATIONAL_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_OPERATIONAL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateAuthorityValidator(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runAuthorityValidator({ scenario: "OPERATIONAL_WITH_OBSERVATIONS" });
    const followup = runAuthorityValidator({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(followup.readiness.failures).toEqual([]);
  });
});
