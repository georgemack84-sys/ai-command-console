import { describe, expect, it } from "vitest";
import {
  establishGovernanceAwareMemoryControl,
  getGovernanceAwareMemoryControl,
  replayGovernanceAwareMemoryControl,
} from "@/services/governance-aware-memory-control";
import type {
  GovernanceControlValidator,
  GovernanceMemoryControlFailure,
  GovernanceMemoryControlScenario,
  MemoryReuseDecision,
} from "@/types/governance-aware-memory-control";

describe("Mission Control Phase 10.13G Governance-Aware Memory Control", () => {
  const validators: readonly GovernanceControlValidator[] = [
    "IDENTITY_VALIDATION",
    "AUTHORITY_VALIDATION",
    "CONSTITUTIONAL_VALIDATION",
    "GOVERNANCE_VALIDATION",
    "MISSION_AUTHORIZATION",
    "REPLAY_VALIDATION",
    "REUSE_POLICY_EVALUATION",
    "INTEGRITY_VERIFICATION",
  ];

  const decisions: readonly MemoryReuseDecision[] = [
    "APPROVED",
    "DENIED",
    "REQUIRES_GOVERNANCE_REVIEW",
    "REQUIRES_OPERATOR_APPROVAL",
    "REQUIRES_CERTIFICATION",
  ];

  it("publishes the authoritative governance-aware memory control contract", () => {
    const control = getGovernanceAwareMemoryControl();

    expect(control.governance_memory_control_version).toBe("governance-aware-memory-control/v1");
    expect(control.supported_validators).toEqual(validators);
    expect(control.supported_decisions).toEqual(decisions);
    expect(control.api_surface.establish_control).toBe("POST /governance-aware-memory-control/establish");
    expect(control.api_surface.retrieve_contract).toBe("GET /governance-aware-memory-control/contract");
    expect(control.api_surface.governance_bypass_supported).toBe(false);
    expect(control.api_surface.authority_expansion_supported).toBe(false);
    expect(control.api_surface.cross_tenant_default_supported).toBe(false);
    expect(control.result.control_identifier).toBe("GovernanceAwareMemoryControl");
    expect(control.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic governance decisions, replay, and integrity", () => {
    const first = establishGovernanceAwareMemoryControl();
    const second = establishGovernanceAwareMemoryControl();

    expect(first.governance_records.map((record) => record.integrity_hash)).toEqual(second.governance_records.map((record) => record.integrity_hash));
    expect(first.governance_ledger.map((entry) => entry.integrity_hash)).toEqual(second.governance_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayGovernanceAwareMemoryControl(first)).toBe(true);
  });

  it("approves qualified memory only after all validators pass", () => {
    const result = establishGovernanceAwareMemoryControl();

    expect(result.governance_records).toHaveLength(10);
    expect(result.governance_records.every((record) => record.final_decision === "APPROVED")).toBe(true);
    expect(result.governance_records.every((record) => record.authority_validation.valid)).toBe(true);
    expect(result.governance_records.every((record) => record.constitutional_validation.valid)).toBe(true);
    expect(result.governance_records.every((record) => record.governance_validation.valid)).toBe(true);
    expect(result.governance_records.every((record) => record.mission_authorization.valid)).toBe(true);
    expect(result.governance_records.every((record) => record.replay_validation.valid)).toBe(true);
    expect(result.governance_records.every((record) => record.reuse_policy_result.valid)).toBe(true);
  });

  it("produces explainable governance decisions", () => {
    const result = establishGovernanceAwareMemoryControl();

    expect(result.governance_records.every((record) => record.explanation.explanation_complete)).toBe(true);
    expect(result.governance_records.every((record) => record.explanation.authority_evaluation.includes("passed"))).toBe(true);
    expect(result.governance_records.every((record) => record.explanation.constitutional_validation.includes("passed"))).toBe(true);
    expect(result.governance_records.every((record) => record.explanation.reuse_policy_evaluation.includes("passed"))).toBe(true);
  });

  it("records append-only immutable governance ledger events", () => {
    const result = establishGovernanceAwareMemoryControl();

    expect(result.governance_ledger).toHaveLength(100);
    expect(result.governance_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.governance_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.governance_ledger.every((entry) => entry.deterministic)).toBe(true);
    expect(result.governance_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.governance_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.governance_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("enforces constitutional authority boundaries and cross-tenant default blocking", () => {
    const result = establishGovernanceAwareMemoryControl();

    expect(result.contract.governance_before_memory).toBe(true);
    expect(result.contract.constitution_supreme).toBe(true);
    expect(result.contract.memory_grants_authority).toBe(false);
    expect(result.contract.cross_tenant_blocked_by_default).toBe(true);
    expect(result.governance_enforced).toBe(true);
    expect(result.constitutional_protections_preserved).toBe(true);
    expect(result.authority_boundaries_preserved).toBe(true);
    expect(result.cross_tenant_blocked_by_default).toBe(true);
  });

  it("publishes observability metrics", () => {
    const metrics = establishGovernanceAwareMemoryControl().metrics;

    expect(metrics.reuse_requests).toBe(10);
    expect(metrics.approvals).toBe(10);
    expect(metrics.denials).toBe(0);
    expect(metrics.governance_escalations).toBe(0);
    expect(metrics.constitutional_violations).toBe(0);
    expect(metrics.authority_failures).toBe(0);
    expect(metrics.replay_failures).toBe(0);
    expect(metrics.mission_authorization_failures).toBe(0);
    expect(metrics.blocked_cross_tenant_requests).toBe(0);
    expect(metrics.decision_latency_ms).toBe(7);
  });

  it.each([
    ["QUALIFICATION_UNAVAILABLE", "QUALIFICATION_UNAVAILABLE"],
    ["UNAUTHORIZED_REUSE", "UNAUTHORIZED_MEMORY_REUSED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_VALIDATION_BYPASSED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_PROTECTION_VIOLATED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_INCORRECTLY_GRANTED"],
    ["REPLAY_OMITTED", "REPLAY_VALIDATION_OMITTED"],
    ["MISSION_AUTH_IGNORED", "MISSION_AUTHORIZATION_IGNORED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["POLICY_CIRCUMVENTION", "REUSE_POLICY_CIRCUMVENTED"],
    ["NONDETERMINISTIC_DECISION", "NONDETERMINISTIC_GOVERNANCE_DECISION"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT_REUSE", "CROSS_TENANT_REUSE_NOT_APPROVED"],
    ["OPERATOR_APPROVAL_REQUIRED", "OPERATOR_APPROVAL_REQUIRED"],
    ["CERTIFICATION_REQUIRED", "CERTIFICATION_REQUIRED"],
  ] as const)("blocks unsafe reuse for %s", (scenario: GovernanceMemoryControlScenario, failure: GovernanceMemoryControlFailure) => {
    const result = establishGovernanceAwareMemoryControl({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.approvals).toBe(0);
    expect(replayGovernanceAwareMemoryControl(result)).toBe(true);
  });

  it("routes governance, operator, and certification cases to explicit review decisions", () => {
    const governance = establishGovernanceAwareMemoryControl({ scenario: "GOVERNANCE_BYPASS" });
    const operator = establishGovernanceAwareMemoryControl({ scenario: "OPERATOR_APPROVAL_REQUIRED" });
    const certification = establishGovernanceAwareMemoryControl({ scenario: "CERTIFICATION_REQUIRED" });

    expect(governance.governance_records.every((record) => record.final_decision === "REQUIRES_GOVERNANCE_REVIEW")).toBe(true);
    expect(operator.governance_records.every((record) => record.final_decision === "REQUIRES_OPERATOR_APPROVAL")).toBe(true);
    expect(certification.governance_records.every((record) => record.final_decision === "REQUIRES_CERTIFICATION")).toBe(true);
  });

  it("blocks cross-tenant reuse by default", () => {
    const result = establishGovernanceAwareMemoryControl({ scenario: "CROSS_TENANT_REUSE" });

    expect(result.contract.cross_tenant_blocked_by_default).toBe(true);
    expect(result.governance_records.every((record) => record.reuse_policy_result.valid === false)).toBe(true);
    expect(result.metrics.blocked_cross_tenant_requests).toBe(1);
  });

  it("detects nested governance record tampering", () => {
    const result = establishGovernanceAwareMemoryControl();
    const tampered = {
      ...result,
      governance_records: [
        {
          ...result.governance_records[0],
          tenant_id: "tenant-other",
        },
        ...result.governance_records.slice(1),
      ],
    };

    expect(replayGovernanceAwareMemoryControl(tampered)).toBe(false);
  });
});
