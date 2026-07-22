import { describe, expect, it } from "vitest";
import {
  certifyAdaptiveSimulation,
  getAdaptiveSimulationCertificationFoundation,
  replayAdaptiveSimulationCertification,
} from "@/services/adaptive-simulation-certification-gate";
import type {
  AdaptiveSimulationCertificationComponent,
  AdaptiveSimulationCertificationFailure,
  AdaptiveSimulationCertificationScenario,
} from "@/types/adaptive-simulation-certification-gate";

describe("Mission Control Phase 10.11.7 Adaptive Simulation Certification Gate", () => {
  const expectedComponents: readonly AdaptiveSimulationCertificationComponent[] = [
    "REPLAY_CERTIFICATION",
    "SIMULATION_CERTIFICATION",
    "GOVERNANCE_CERTIFICATION",
    "OPERATOR_CERTIFICATION",
    "ROLLBACK_CERTIFICATION",
    "AUDIT_CERTIFICATION",
  ];

  it("publishes the adaptive simulation certification contract", () => {
    const foundation = getAdaptiveSimulationCertificationFoundation();

    expect(foundation.adaptive_simulation_certification_gate_version).toBe("adaptive-simulation-certification-gate/v1");
    expect(foundation.certification_components).toEqual(expectedComponents);
    expect(foundation.api_surface.certify_simulation).toBe("POST /adaptive-simulation-certification-gate/certify");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /adaptive-simulation-certification-gate/contract");
    expect(foundation.api_surface.implementation_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.gate_identifier).toBe("AdaptiveSimulationCertificationGate");
    expect(foundation.result.certification_outcome).toBe("PASS");
  });

  it("certifies deterministically with stable replay and integrity hashes", () => {
    const first = certifyAdaptiveSimulation();
    const second = certifyAdaptiveSimulation();

    expect(first.components.map((item) => item.integrity_hash)).toEqual(second.components.map((item) => item.integrity_hash));
    expect(first.record.integrity_hash).toBe(second.record.integrity_hash);
    expect(first.evidence_package.integrity_hash).toBe(second.evidence_package.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveSimulationCertification(first)).toBe(true);
  });

  it("passes only when every mandatory certification passes", () => {
    const result = certifyAdaptiveSimulation();

    expect(result.certification_outcome).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.components.map((item) => item.component)).toEqual(expectedComponents);
    expect(result.components.every((item) => item.pass)).toBe(true);
    expect(result.metrics.mandatory_certifications_evaluated).toBe(6);
    expect(result.metrics.mandatory_certifications_passed).toBe(6);
    expect(result.authorizes_governance_review).toBe(true);
    expect(result.authorizes_implementation).toBe(false);
  });

  it("generates the canonical AdaptiveSimulationCertificationRecord", () => {
    const record = certifyAdaptiveSimulation().record;

    expect(record.certification_id).toMatch(/^adaptive_sim_cert_/);
    expect(record.proposal_id).toBeTruthy();
    expect(record.tenant_id).toBeTruthy();
    expect(record.replay_certification.component).toBe("REPLAY_CERTIFICATION");
    expect(record.simulation_certification.component).toBe("SIMULATION_CERTIFICATION");
    expect(record.governance_certification.component).toBe("GOVERNANCE_CERTIFICATION");
    expect(record.operator_certification.component).toBe("OPERATOR_CERTIFICATION");
    expect(record.rollback_certification.component).toBe("ROLLBACK_CERTIFICATION");
    expect(record.audit_certification.component).toBe("AUDIT_CERTIFICATION");
    expect(record.certification_rationale).toContain("All mandatory");
    expect(record.required_follow_up).toBe("Governance Review");
    expect(record.evidence_package_reference).toMatch(/[a-f0-9]{64}/);
    expect(record.replay_reference).toMatch(/[a-f0-9]{64}/);
    expect(record.simulation_reference).toMatch(/^counterfactual_simulation_/);
  });

  it("produces every required certification evidence artifact", () => {
    const evidence = certifyAdaptiveSimulation().evidence_package;

    expect(evidence.replay_certification_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.simulation_certification_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.governance_certification_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.operator_certification_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.rollback_certification_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.audit_certification_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.certification_decision_summary_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.replay_integrity_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.simulation_evidence_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.certification_lineage_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(evidence.governance_review_package_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("certifies replay, simulation, governance, operator, rollback, audit, tenant, and advisory guarantees", () => {
    const result = certifyAdaptiveSimulation();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.rollback_ready).toBe(true);
    expect(result.audit_complete).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
  });

  it("supports conditional pass without implementation authorization", () => {
    const result = certifyAdaptiveSimulation({ scenario: "CONDITIONAL_DOCUMENTATION" });

    expect(result.certification_outcome).toBe("CONDITIONAL_PASS");
    expect(result.record.required_follow_up).toBe("Additional Simulation Required");
    expect(result.authorizes_governance_review).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
    expect(replayAdaptiveSimulationCertification(result)).toBe(true);
  });

  it.each([
    ["NONDETERMINISTIC_REPLAY", "NONDETERMINISTIC_REPLAY", "FAIL"],
    ["SIMULATION_INCONSISTENCY", "SIMULATION_INCONSISTENCY", "FAIL"],
    ["UNEXPLAINED_REPLAY_DIVERGENCE", "UNEXPLAINED_REPLAY_DIVERGENCE", "FAIL"],
    ["HIDDEN_REGRESSION", "HIDDEN_REGRESSION", "FAIL"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["OPERATOR_AUTHORITY_REDUCTION", "OPERATOR_AUTHORITY_REDUCTION", "REQUIRES_OPERATOR_REVIEW"],
    ["APPROVAL_WORKFLOW_DEGRADATION", "APPROVAL_WORKFLOW_DEGRADATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["ROLLBACK_FAILURE", "ROLLBACK_FAILURE", "FAIL"],
    ["INCOMPLETE_AUDIT_EVIDENCE", "INCOMPLETE_AUDIT_EVIDENCE", "FAIL"],
    ["MISSING_LINEAGE", "MISSING_LINEAGE", "REQUIRES_MORE_EVIDENCE"],
    ["LEDGER_INTEGRITY_FAILURE", "LEDGER_INTEGRITY_FAILURE", "FAIL"],
    ["REPLAY_INTEGRITY_FAILURE", "REPLAY_INTEGRITY_FAILURE", "FAIL"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH", "FAIL"],
    ["INCOMPLETE_CERTIFICATION_EVIDENCE", "INCOMPLETE_CERTIFICATION_EVIDENCE", "REQUIRES_MORE_EVIDENCE"],
  ] as const)("fails closed for %s", (scenario: AdaptiveSimulationCertificationScenario, failure: AdaptiveSimulationCertificationFailure, outcome) => {
    const result = certifyAdaptiveSimulation({ scenario });

    expect(result.certification_outcome).toBe(outcome);
    expect(result.failures).toContain(failure);
    expect(result.authorizes_governance_review).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
    expect(replayAdaptiveSimulationCertification(result)).toBe(true);
  });

  it("detects nested certification tampering", () => {
    const result = certifyAdaptiveSimulation();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        certification_outcome: "FAIL" as const,
      },
    };

    expect(replayAdaptiveSimulationCertification(tampered)).toBe(false);
  });
});
