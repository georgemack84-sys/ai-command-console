import { describe, expect, it } from "vitest";
import {
  getOperationsIncidentGovernanceBundle,
  replayOperationsIncidentGovernance,
  runOperationsIncidentGovernance,
  validateOperationsIncidentGovernance,
} from "@/services/caf-operations-incident-governance";
import type { OperationsIncidentGovernanceScenario } from "@/types/caf-operations-incident-governance";

describe("Program 3 P3.13 Operations and Incident Governance", () => {
  it("publishes operations doctrine without owning CCI infrastructure", () => {
    const bundle = getOperationsIncidentGovernanceBundle();

    expect(bundle.doctrine.version).toBe("caf-operations-incident-governance/v3.13");
    expect(bundle.doctrine.owns_operations).toBe(true);
    expect(bundle.doctrine.owns_incidents).toBe(true);
    expect(bundle.doctrine.owns_recovery).toBe(true);
    expect(bundle.doctrine.owns_platform_infrastructure_operations).toBe(false);
    expect(bundle.doctrine.owns_platform_failover).toBe(false);
    expect(bundle.doctrine.consumes_cci_operations).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic operations, incident, recovery, governance, and evidence records", () => {
    const first = runOperationsIncidentGovernance();
    const second = runOperationsIncidentGovernance();

    expect(first.runtime_orchestration_ref).toBe("caf-runtime-orchestration/v3.3");
    expect(first.governance_authority_policy_ref).toBe("caf-governance-authority-policy/v3.7");
    expect(first.safety_behavioral_constraints_ref).toBe("caf-safety-behavioral-constraints/v3.8");
    expect(first.observability_telemetry_ref).toBe("caf-observability-telemetry/v3.10");
    expect(first.behavioral_replay_divergence_ref).toBe("caf-behavioral-replay-divergence/v3.11");
    expect(first.learning_adaptation_ref).toBe("caf-learning-adaptation/v3.12");
    expect(first.operations_console.operational).toBe(true);
    expect(first.incident.lifecycle.at(-1)).toBe("CLOSED");
    expect(first.recovery.lifecycle.at(-1)).toBe("COMPLETED");
    expect(first.recovery.deterministic).toBe(true);
    expect(first.operational_evidence.immutable).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperationsIncidentGovernance(first).valid).toBe(true);
    expect(replayOperationsIncidentGovernance(first)).toBe(true);
  });

  it("enforces governance, safety, operator oversight, replay, and no authority expansion during recovery", () => {
    const result = runOperationsIncidentGovernance();

    expect(result.operational_governance.governance_precedes_recovery).toBe(true);
    expect(result.operational_governance.safety_precedes_recovery).toBe(true);
    expect(result.operational_governance.operator_authority_supreme).toBe(true);
    expect(result.replay_validation.deterministic).toBe(true);
    expect(result.recovery.authority_expanded).toBe(false);
    expect(result.incident_ledger.complete).toBe(true);
    expect(result.certification.certified).toBe(true);
  });

  it.each([
    "P3_1_AGENT_IDENTITY_INVALID",
    "P3_3_RUNTIME_INVALID",
    "P3_7_GOVERNANCE_INVALID",
    "P3_8_SAFETY_INVALID",
    "P3_10_OBSERVABILITY_INVALID",
    "P3_11_REPLAY_INVALID",
    "P3_12_LEARNING_INVALID",
    "CCI_OPERATIONS_NOT_CONSUMED",
    "CCI_OPERATIONS_DUPLICATED",
    "INCIDENT_NOT_RECORDED",
    "INCIDENT_LIFECYCLE_INCOMPLETE",
    "INCIDENT_SEVERITY_INVALID",
    "RECOVERY_NOT_GOVERNED",
    "RECOVERY_NON_DETERMINISTIC",
    "RECOVERY_LIFECYCLE_INVALID",
    "GOVERNANCE_BYPASSED",
    "SAFETY_VALIDATION_BYPASSED",
    "OPERATOR_OVERSIGHT_MISSING",
    "REPLAY_VALIDATION_MISSING",
    "OPERATIONAL_EVIDENCE_MISSING",
    "OPERATIONAL_EVIDENCE_MUTABLE",
    "AUTHORITY_EXPANSION_DURING_RECOVERY",
    "CONSTITUTIONAL_COMPLIANCE_LOST",
    "OPERATIONS_CONSOLE_INCOMPLETE",
    "INCIDENT_LEDGER_INCOMPLETE",
    "RECOVERY_FRAMEWORK_UNCERTIFIED",
  ] as const)("fails certification for %s", (scenario: OperationsIncidentGovernanceScenario) => {
    const result = runOperationsIncidentGovernance({ scenario });
    const validation = validateOperationsIncidentGovernance(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runOperationsIncidentGovernance({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
