import { describe, expect, it } from "vitest";

import {
  getPolicyGateBundle,
  replayPolicyGate,
  runPolicyGate,
  validatePolicyGate,
} from "@/services/policy-gate";
import type { PolicyGateFailure } from "@/types/policy-gate";

const conditionalFailures = [
  "POLICY_ENGINE_MISSING",
  "POLICY_REGISTRY_INTEGRATION_MISSING",
  "POLICY_RESOLUTION_ENGINE_MISSING",
  "CONFLICT_DETECTION_MISSING",
  "EXCEPTION_WORKFLOW_MISSING",
  "EXCEPTION_EVIDENCE_MISSING",
  "DISPOSITION_MAPPING_MISSING",
  "POLICY_API_MISSING",
  "POLICY_EVIDENCE_MISSING",
] as const satisfies readonly PolicyGateFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "W2_5_AUTHORITY_VALIDATOR_INVALID",
  "AUTHORITY_DECISION_NOT_VALIDATED",
  "POLICY_ENGINE_NON_DETERMINISTIC",
  "POLICY_DEFINITION_INVALID",
  "POLICY_RESOLUTION_NON_DETERMINISTIC",
  "POLICY_INHERITANCE_INVALID",
  "POLICY_PRECEDENCE_INVALID",
  "CONSTITUTIONAL_PRECEDENCE_BYPASSED",
  "TENANT_ISOLATION_FAILED",
  "POLICY_CONFLICT_UNRESOLVED",
  "CIRCULAR_POLICY_DEPENDENCY_ALLOWED",
  "DUPLICATE_POLICY_ALLOWED",
  "INVALID_POLICY_CONDITION_ALLOWED",
  "UNAPPROVED_EXCEPTION_ALLOWED",
  "EXPIRED_EXCEPTION_ALLOWED",
  "REVOKED_EXCEPTION_ALLOWED",
  "INVALID_POLICY_DISPOSITION_ALLOWED",
  "POLICY_GRANTED_AUTHORITY",
  "SAFETY_EVALUATION_PERFORMED",
  "OPERATOR_APPROVAL_PERFORMED",
  "POLICY_REPLAY_INVALID",
  "POLICY_EVIDENCE_NOT_IMMUTABLE",
] as const satisfies readonly PolicyGateFailure[];

describe("Policy Gate W2.6", () => {
  it("publishes the W2.6 policy doctrine and certification bundle", () => {
    const bundle = getPolicyGateBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "policy-gate/w2.6",
      owns_policy_evaluation: true,
      owns_policy_inheritance: true,
      owns_policy_resolution: true,
      owns_policy_precedence: true,
      owns_policy_conflict_detection: true,
      owns_exception_workflow: true,
      owns_policy_disposition_mapping: true,
      owns_policy_decisions: true,
      owns_policy_evidence: true,
      does_not_grant_authority: true,
      does_not_evaluate_safety: true,
      does_not_perform_operator_approval: true,
      enforcement_sequence: "Authority -> Policy -> Safety -> Operator",
      certification_gate: "Policy Gate Certification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("POLICY_GATE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic policy evaluation to W2.0 through W2.5", () => {
    const first = runPolicyGate();
    const second = runPolicyGate();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.capability_registry_ref).toBe("capability-registry/w2.3");
    expect(first.skill_registry_ref).toBe("skill-registry/w2.4");
    expect(first.authority_validator_ref).toBe("authority-validator/w2.5");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePolicyGate(first).valid).toBe(true);
    expect(replayPolicyGate(first)).toBe(true);
  });

  it("evaluates policies deterministically and integrates policy registries", () => {
    const result = runPolicyGate();

    expect(result.engine).toMatchObject({
      load_applicable_policies: true,
      resolve_inheritance: true,
      evaluate_conditions: true,
      apply_restrictions: true,
      calculate_decisions: true,
      generate_evidence: true,
      policy_decision: true,
      evaluation_trace: true,
      resolution_tree: true,
      deterministic_evaluation: true,
      fail_closed: true,
    });
    expect(result.registry).toMatchObject({
      platform_policies: true,
      tenant_policies: true,
      runtime_policies: true,
      mission_policies: true,
      capability_policies: true,
      skill_policies: true,
      governance_policies: true,
      configuration_policies: true,
      definitions_versioned: true,
      evidence_references: true,
    });
  });

  it("resolves hierarchy, inheritance, precedence, tenant isolation, and conflicts", () => {
    const result = runPolicyGate();

    expect(result.resolution).toMatchObject({
      inheritance: true,
      aggregation: true,
      overrides: true,
      exclusions: true,
      conditional_activation: true,
      runtime_policy_activation: true,
      resolved_policy_set: true,
      deterministic_resolution: true,
    });
    expect(result.hierarchy.scopes).toEqual(["Constitutional", "Platform", "Regulatory", "Organization", "Tenant", "Mission", "Runtime", "Capability", "Skill", "Session"]);
    expect(result.hierarchy.constitutional_precedence).toBe(true);
    expect(result.hierarchy.tenant_isolation).toBe(true);
    expect(result.conflicts).toMatchObject({
      incompatible_permissions: true,
      conflicting_restrictions: true,
      circular_dependencies: true,
      duplicate_policies: true,
      invalid_inheritance: true,
      impossible_conditions: true,
      conflict_reports: true,
      deterministic_resolution: true,
    });
  });

  it("governs exceptions and maps canonical dispositions for the Safety Gate", () => {
    const result = runPolicyGate();

    expect(result.exceptions).toMatchObject({
      temporary_exceptions: true,
      emergency_exceptions: true,
      delegated_exceptions: true,
      operator_approved_exceptions: true,
      expiration: true,
      revocation: true,
      evidence: true,
      lineage: true,
      approval_required: true,
    });
    expect(result.disposition_mapping.dispositions).toEqual(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "DENY", "ESCALATE", "FAIL_CLOSED"]);
    expect(result.disposition_mapping.safety_gate_input).toBe(true);
    expect(result.decisions.final_disposition).toBe("ALLOW");
  });

  it("keeps policy in its lane while producing APIs and immutable evidence", () => {
    const result = runPolicyGate();

    expect(result.decisions.authority_decision_reference).toBe(true);
    expect(result.decisions.traceable_to_authority).toBe(true);
    expect(result.decisions.grants_authority).toBe(false);
    expect(result.decisions.evaluates_safety).toBe(false);
    expect(result.decisions.performs_operator_approval).toBe(false);
    expect(result.apis).toMatchObject({
      policy_evaluation_api: true,
      policy_registry_api: true,
      policy_resolution_api: true,
      conflict_detection_api: true,
      exception_api: true,
      policy_replay_api: true,
      stable: true,
    });
    expect(result.evidence.records).toHaveLength(8);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.readiness.policy_precedes_safety_operator).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional certification for %s", (failure) => {
    const result = runPolicyGate({ scenario: failure });
    const validation = validatePolicyGate(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_CERTIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_CERTIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runPolicyGate({ scenario: failure });
    const validation = validatePolicyGate(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit certification failure as not certified", () => {
    const result = runPolicyGate({ scenario: "POLICY_GATE_CERTIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_CERTIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validatePolicyGate(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runPolicyGate({ scenario: "CERTIFIED_WITH_OBSERVATIONS" });
    const followup = runPolicyGate({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_CERTIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_CERTIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
