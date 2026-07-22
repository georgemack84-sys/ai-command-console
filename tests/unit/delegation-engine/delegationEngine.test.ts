import { describe, expect, it } from "vitest";

import {
  getDelegationEngineBundle,
  replayDelegationEngine,
  runDelegationEngine,
  validateDelegationEngine,
} from "@/services/delegation-engine";
import type { DelegationEngineFailure } from "@/types/delegation-engine";

const conditionalFailures = [
  "DELEGATION_CONTRACTS_MISSING",
  "DELEGATION_EVIDENCE_MISSING",
  "AUTHORITY_INTERSECTION_MISSING",
  "DELEGATION_LIFECYCLE_MISSING",
  "REVOCATION_ENGINE_MISSING",
  "DELEGATION_MONITORING_MISSING",
  "DELEGATION_LINEAGE_MISSING",
  "DELEGATION_GOVERNANCE_MISSING",
  "RUNTIME_DELEGATION_INTEGRATION_MISSING",
  "DELEGATION_API_MISSING",
] as const satisfies readonly DelegationEngineFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "W2_5_AUTHORITY_VALIDATOR_INVALID",
  "W2_6_POLICY_GATE_INVALID",
  "W2_7_SAFETY_GATE_INVALID",
  "W2_8_PLANNING_ENGINE_INVALID",
  "W2_9_MEMORY_ENGINE_INVALID",
  "W2_10_RUNTIME_ORCHESTRATOR_INVALID",
  "DELEGATION_CONTRACT_INVALID",
  "DELEGATION_SCOPE_AMBIGUOUS",
  "AUTHORITY_ELEVATION_ALLOWED",
  "POLICY_RESTRICTION_BYPASSED",
  "SAFETY_RESTRICTION_BYPASSED",
  "RUNTIME_RESTRICTION_BYPASSED",
  "TENANT_RESTRICTION_BYPASSED",
  "INVALID_LIFECYCLE_TRANSITION_ALLOWED",
  "DELEGATION_VALIDATION_INCOMPLETE",
  "REVOCATION_NOT_IMMEDIATE",
  "CASCADE_REVOCATION_FAILED",
  "REVOKED_DELEGATION_RETAINS_AUTHORITY",
  "AUTHORITY_DRIFT_UNDETECTED",
  "EXPIRED_DELEGATION_UNDETECTED",
  "DELEGATION_CHAIN_DEPTH_UNDETECTED",
  "DELEGATION_LINEAGE_NOT_IMMUTABLE",
  "PRIVILEGE_ESCALATION_ALLOWED",
  "CROSS_TENANT_DELEGATION_ALLOWED",
  "POLICY_BYPASS_ALLOWED",
  "DELEGATED_ACTION_NOT_VALIDATED",
  "DELEGATION_EVIDENCE_NOT_IMMUTABLE",
  "DELEGATION_REPLAY_INVALID",
] as const satisfies readonly DelegationEngineFailure[];

describe("Delegation Engine W2.11", () => {
  it("publishes the W2.11 delegation doctrine and operational bundle", () => {
    const bundle = getDelegationEngineBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "delegation-engine/w2.11",
      owns_delegation_contracts: true,
      owns_authority_intersection: true,
      owns_delegation_lifecycle: true,
      owns_revocation: true,
      owns_delegation_monitoring: true,
      owns_delegation_lineage: true,
      owns_delegation_governance: true,
      owns_runtime_delegation: true,
      owns_delegation_evidence: true,
      prevents_authority_elevation: true,
      operational_gate: "Delegation Engine Operational Gate",
    });
    expect(bundle.result.readiness.decision).toBe("DELEGATION_ENGINE_OPERATIONAL");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic delegation to W2.0 through W2.10", () => {
    const first = runDelegationEngine();
    const second = runDelegationEngine();

    expect(first.runtime_orchestrator_ref).toBe("runtime-orchestrator/w2.10");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateDelegationEngine(first).valid).toBe(true);
    expect(replayDelegationEngine(first)).toBe(true);
  });

  it("validates contracts and computes minimum constitutional authority", () => {
    const result = runDelegationEngine();

    expect(result.contracts).toMatchObject({
      contract_schema: true,
      delegation_scope: true,
      constraints: true,
      duration: true,
      conditions: true,
      delegator: true,
      delegate: true,
      authority_granted: true,
      capabilities_granted: true,
      restrictions: true,
      expiration: true,
      revocation_policy: true,
      contract_validator: true,
    });
    expect(result.authority_intersection).toMatchObject({
      delegator_authority: true,
      delegate_eligibility: true,
      policy_restrictions: true,
      safety_restrictions: true,
      runtime_restrictions: true,
      tenant_restrictions: true,
      minimum_constitutional_authority: true,
      no_authority_elevation: true,
      deterministic_resolution: true,
    });
  });

  it("enforces lifecycle, revocation, monitoring, lineage, and governance", () => {
    const result = runDelegationEngine();

    expect(result.lifecycle.states).toEqual(["Proposed", "Validated", "Approved", "Active", "Suspended", "Revoked", "Expired", "Archived"]);
    expect(result.lifecycle.transitions_enforced).toBe(true);
    expect(result.revocation.immediate_termination).toBe(true);
    expect(result.revocation.cascading_revocation).toBe(true);
    expect(result.monitoring).toMatchObject({
      authority_validity: true,
      policy_compliance: true,
      safety_compliance: true,
      runtime_compliance: true,
      authority_drift_alerts: true,
      expired_alerts: true,
      depth_alerts: true,
      continuous: true,
    });
    expect(result.lineage.immutable_history).toBe(true);
    expect(result.governance).toMatchObject({
      no_authority_elevation: true,
      no_policy_bypass: true,
      no_safety_bypass: true,
      tenant_isolation: true,
      fully_auditable: true,
      revoked_authority_removed_immediately: true,
    });
  });

  it("integrates with runtime enforcement and immutable evidence", () => {
    const result = runDelegationEngine();

    expect(result.runtime_integration).toMatchObject({
      runtime_orchestrator_integration: true,
      planning_engine_integration: true,
      authority_validator_integration: true,
      policy_gate_integration: true,
      safety_gate_integration: true,
      verify_before_execution: true,
      enforce_restrictions: true,
      validate_expiration: true,
      validate_revocation_status: true,
      validate_runtime_eligibility: true,
      enforcement_api: true,
    });
    expect(result.apis.replay_delegation).toBe(true);
    expect(result.evidence.records).toHaveLength(8);
    expect(result.evidence.immutable).toBe(true);
    expect(result.readiness.no_elevation).toBe(true);
    expect(result.readiness.immediate_revocation).toBe(true);
    expect(result.readiness.tenant_isolation_preserved).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional operation for %s", (failure) => {
    const result = runDelegationEngine({ scenario: failure });
    const validation = validateDelegationEngine(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_OPERATIONAL");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runDelegationEngine({ scenario: failure });
    const validation = validateDelegationEngine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit operational gate failure as not operational", () => {
    const result = runDelegationEngine({ scenario: "DELEGATION_ENGINE_OPERATIONAL_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_OPERATIONAL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateDelegationEngine(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runDelegationEngine({ scenario: "OPERATIONAL_WITH_OBSERVATIONS" });
    const followup = runDelegationEngine({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(followup.readiness.failures).toEqual([]);
  });
});
