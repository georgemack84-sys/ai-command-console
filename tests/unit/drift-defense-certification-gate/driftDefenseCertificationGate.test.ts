import { describe, expect, it } from "vitest";
import {
  certifyDriftDefense,
  getDriftDefenseCertificationFoundation,
  replayDriftDefenseCertification,
} from "@/services/drift-defense-certification-gate";
import type {
  DriftDefenseCertificationFailure,
  DriftDefenseCertificationOutcome,
  DriftDefenseCertificationScenario,
} from "@/types/drift-defense-certification-gate";

describe("Mission Control Phase 10.12.14 Drift Defense Certification Gate", () => {
  it("publishes the drift defense certification contract", () => {
    const foundation = getDriftDefenseCertificationFoundation();

    expect(foundation.drift_defense_certification_version).toBe("drift-defense-certification-gate/v1");
    expect(foundation.api_surface.certify_drift_defense).toBe("POST /drift-defense-certification-gate/certify");
    expect(foundation.api_surface.retrieve_certification_report).toBe("POST /drift-defense-certification-gate/report");
    expect(foundation.api_surface.retrieve_detection_coverage).toBe("POST /drift-defense-certification-gate/detection-coverage");
    expect(foundation.api_surface.retrieve_adversarial_defense).toBe("POST /drift-defense-certification-gate/adversarial-defense");
    expect(foundation.api_surface.retrieve_containment).toBe("POST /drift-defense-certification-gate/containment");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /drift-defense-certification-gate/contract");
    expect(foundation.api_surface.production_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.gate_identifier).toBe("DriftDefenseCertificationGate");
    expect(foundation.result.outcome).toBe("PASS");
  });

  it("certifies deterministically with stable replay and integrity hashes", () => {
    const first = certifyDriftDefense();
    const second = certifyDriftDefense();

    expect(first.detection_coverage_report.integrity_hash).toBe(second.detection_coverage_report.integrity_hash);
    expect(first.adversarial_defense_report.integrity_hash).toBe(second.adversarial_defense_report.integrity_hash);
    expect(first.containment_validation_report.integrity_hash).toBe(second.containment_validation_report.integrity_hash);
    expect(first.replay_integrity_report.integrity_hash).toBe(second.replay_integrity_report.integrity_hash);
    expect(first.governance_preservation_report.integrity_hash).toBe(second.governance_preservation_report.integrity_hash);
    expect(first.certification_report.integrity_hash).toBe(second.certification_report.integrity_hash);
    expect(first.traceability_matrix.integrity_hash).toBe(second.traceability_matrix.integrity_hash);
    expect(first.production_readiness_assessment.integrity_hash).toBe(second.production_readiness_assessment.integrity_hash);
    expect(first.certification_record.integrity_hash).toBe(second.certification_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayDriftDefenseCertification(first)).toBe(true);
  });

  it("passes full Phase 10.12 certification in the baseline case", () => {
    const result = certifyDriftDefense();

    expect(result.outcome).toBe("PASS");
    expect(result.detection_coverage_report.status).toBe("PASS");
    expect(result.adversarial_defense_report.status).toBe("PASS");
    expect(result.containment_validation_report.status).toBe("PASS");
    expect(result.replay_integrity_report.status).toBe("PASS");
    expect(result.governance_preservation_report.status).toBe("PASS");
    expect(result.certification_report.production_progression_authorized).toBe(true);
    expect(result.production_readiness_assessment.production_ready).toBe(true);
    expect(result.certification_record.production_progression_authorized).toBe(true);
    expect(result.traceability_matrix.unmet_requirements).toEqual([]);
  });

  it("enforces advisory-only certification invariants", () => {
    const result = certifyDriftDefense();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.authorizes_production).toBe(false);
    expect(result.mutates_production_behavior).toBe(false);
  });

  it.each([
    ["DETECTION_COVERAGE_GAP", "DETECTION_COVERAGE_GAP", "FAIL"],
    ["UNDETECTED_UNSAFE_DRIFT", "UNDETECTED_UNSAFE_DRIFT", "FAIL"],
    ["NONDETERMINISTIC_CONTAINMENT", "NONDETERMINISTIC_CONTAINMENT", "FAIL"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION", "FAIL"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION", "FAIL"],
    ["AUTHORITY_BOUNDARY_FAILURE", "AUTHORITY_BOUNDARY_FAILURE", "FAIL"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH", "FAIL"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE", "FAIL"],
    ["EVIDENCE_POISONING", "EVIDENCE_POISONING_VULNERABILITY", "FAIL"],
    ["FEEDBACK_MANIPULATION", "FEEDBACK_MANIPULATION_INFLUENCE", "FAIL"],
    ["OPTIMIZATION_BYPASS", "OPTIMIZATION_GOVERNANCE_BYPASS", "FAIL"],
    ["OPERATOR_AUTHORITY_DEGRADATION", "OPERATOR_AUTHORITY_DEGRADATION", "FAIL"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS", "FAIL"],
    ["AUDIT_INTEGRITY_FAILURE", "AUDIT_INTEGRITY_FAILURE", "FAIL"],
    ["ROLLBACK_FAILURE", "ROLLBACK_FAILURE", "FAIL"],
    ["LEDGER_VIOLATION", "IMMUTABLE_LEDGER_VIOLATION", "FAIL"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_RECONSTRUCTION_FAILURE", "FAIL"],
    ["OUTSIDE_CERTIFIED_BOUNDARIES", "ADAPTIVE_BEHAVIOR_OUTSIDE_CERTIFIED_BOUNDARIES", "FAIL"],
    ["DOCUMENTATION_GAP", "DOCUMENTATION_GAP", "CONDITIONAL_PASS"],
    ["OBSERVABILITY_GAP", "OBSERVABILITY_GAP", "CONDITIONAL_PASS"],
    ["REPORTING_GAP", "REPORTING_GAP", "CONDITIONAL_PASS"],
    ["VISUALIZATION_GAP", "VISUALIZATION_GAP", "CONDITIONAL_PASS"],
    ["OPERATIONAL_USABILITY_GAP", "OPERATIONAL_USABILITY_GAP", "CONDITIONAL_PASS"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_CERTIFICATION", "FAIL"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_CERTIFICATION_EVIDENCE", "FAIL"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_CERTIFICATION_BEHAVIOR", "FAIL"],
  ] as readonly [DriftDefenseCertificationScenario, DriftDefenseCertificationFailure, DriftDefenseCertificationOutcome][])(
    "maps %s to %s with %s outcome",
    (scenario, failure, outcome) => {
      const result = certifyDriftDefense({ scenario });

      expect(result.failures).toContain(failure);
      expect(result.outcome).toBe(outcome);
      expect(result.certification_record.outcome).toBe(outcome);
      expect(result.production_readiness_assessment.production_ready).toBe(outcome === "PASS");
      expect(replayDriftDefenseCertification(result)).toBe(true);
    },
  );

  it("blocks production progression for conditional pass findings", () => {
    const result = certifyDriftDefense({ scenario: "DOCUMENTATION_GAP" });

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_report.detected_failures).toEqual([]);
    expect(result.certification_report.conditional_findings).toContain("DOCUMENTATION_GAP");
    expect(result.certification_report.production_progression_authorized).toBe(false);
    expect(result.production_readiness_assessment.production_ready).toBe(false);
  });

  it("degrades guarantees for the corresponding certification failure class", () => {
    expect(certifyDriftDefense({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    const evidence = certifyDriftDefense({ scenario: "NONREPLAYABLE_EVIDENCE" });
    expect(evidence.replayable).toBe(false);
    expect(evidence.evidence_backed).toBe(false);
    expect(certifyDriftDefense({ scenario: "GOVERNANCE_VIOLATION" }).governance_preserved).toBe(false);
    expect(certifyDriftDefense({ scenario: "CONSTITUTIONAL_VIOLATION" }).constitutional_preserved).toBe(false);
    expect(certifyDriftDefense({ scenario: "AUTHORITY_BOUNDARY_FAILURE" }).operator_authority_preserved).toBe(false);
    expect(certifyDriftDefense({ scenario: "TENANT_ISOLATION_BREACH" }).tenant_isolated).toBe(false);
  });

  it("fails replay when certification evidence is tampered", () => {
    const result = certifyDriftDefense();
    const tampered = {
      ...result,
      production_readiness_assessment: {
        ...result.production_readiness_assessment,
        production_ready: false,
      },
    };

    expect(replayDriftDefenseCertification(result)).toBe(true);
    expect(replayDriftDefenseCertification(tampered)).toBe(false);
  });
});
