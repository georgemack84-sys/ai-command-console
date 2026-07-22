import { describe, expect, it } from "vitest";
import {
  getDriftResponseFoundation,
  replayDriftResponse,
  respondToDrift,
} from "@/services/drift-response-containment-engine";
import type {
  DriftContainmentResponse,
  DriftResponseContainmentStatus,
  DriftResponseFailure,
  DriftResponseScenario,
  DriftResponseSeverity,
} from "@/types/drift-response-containment-engine";

describe("Mission Control Phase 10.12.12 Drift Response & Containment Engine", () => {
  it("publishes the drift response containment contract", () => {
    const foundation = getDriftResponseFoundation();

    expect(foundation.drift_response_containment_version).toBe("drift-response-containment/v1");
    expect(foundation.api_surface.respond_to_drift).toBe("POST /drift-response-containment/respond");
    expect(foundation.api_surface.retrieve_policy).toBe("POST /drift-response-containment/policy");
    expect(foundation.api_surface.retrieve_severity).toBe("POST /drift-response-containment/severity");
    expect(foundation.api_surface.retrieve_containment).toBe("POST /drift-response-containment/containment");
    expect(foundation.api_surface.retrieve_escalation).toBe("POST /drift-response-containment/escalation");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /drift-response-containment/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.adaptive_execution_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.engine_identifier).toBe("DriftResponseContainmentEngine");
    expect(foundation.result.status).toBe("PASS");
  });

  it("responds deterministically with stable replay and integrity hashes", () => {
    const first = respondToDrift();
    const second = respondToDrift();

    expect(first.response_policy.integrity_hash).toBe(second.response_policy.integrity_hash);
    expect(first.severity_assessment.integrity_hash).toBe(second.severity_assessment.integrity_hash);
    expect(first.containment_decision.integrity_hash).toBe(second.containment_decision.integrity_hash);
    expect(first.escalation_package.integrity_hash).toBe(second.escalation_package.integrity_hash);
    expect(first.rollback_report.integrity_hash).toBe(second.rollback_report.integrity_hash);
    expect(first.certification_report.integrity_hash).toBe(second.certification_report.integrity_hash);
    expect(first.notification_package.integrity_hash).toBe(second.notification_package.integrity_hash);
    expect(first.replay_record.integrity_hash).toBe(second.replay_record.integrity_hash);
    expect(first.recovery_readiness_report.integrity_hash).toBe(second.recovery_readiness_report.integrity_hash);
    expect(first.response_record.integrity_hash).toBe(second.response_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayDriftResponse(first)).toBe(true);
  });

  it("maintains the authoritative baseline response policy", () => {
    const result = respondToDrift();

    expect(result.response_policy.drift_category).toBe("NO_DRIFT");
    expect(result.response_policy.severity_level).toBe("INFORMATIONAL");
    expect(result.response_policy.required_response).toBe("MONITOR");
    expect(result.response_policy.containment_level).toBe("none");
    expect(result.response_policy.escalation_policy).toBe("none");
    expect(result.response_policy.rollback_policy).toBe("rollback_requires_policy_trigger");
    expect(result.response_policy.certification_policy).toBe("certification_if_recovery_requested");
    expect(result.response_policy.operator_notification_policy).toBe("record_only");
    expect(result.response_policy.replay_policy).toBe("record_full_deterministic_replay");
    expect(result.response_policy.approval_reference).toBe("governance-approval:drift-response-policy:v1");
    expect(result.response_policy.version).toBe("drift-response-policy/v1");
    expect(result.response_policy.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("produces baseline containment, replay, recovery, and ledger evidence", () => {
    const result = respondToDrift();

    expect(result.severity_assessment.risk_classification).toBe("stable");
    expect(result.containment_decision.selected_response).toBe("MONITOR");
    expect(result.containment_decision.containment_actions).toEqual(["monitor_drift"]);
    expect(result.escalation_package.escalation_status).toBe("NONE");
    expect(result.rollback_report.rollback_required).toBe(false);
    expect(result.certification_report.certification_required).toBe(false);
    expect(result.notification_package.notification_status).toBe("NONE");
    expect(result.replay_record.response_selection).toBe("MONITOR");
    expect(result.recovery_readiness_report.recovery_decision).toBe("RECOVERY_PERMITTED");
    expect(result.response_record.response_id).toMatch(/^drift_response_/);
    expect(result.response_record.selected_response).toBe("MONITOR");
    expect(result.response_record.containment_level).toBe("none");
    expect(result.response_record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("enforces invariant guarantees without mutating production behavior", () => {
    const result = respondToDrift();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_adaptive_execution).toBe(false);
  });

  it.each([
    ["LOW_CONFIDENCE_DRIFT", "LOW_CONFIDENCE_DRIFT", "LOW", "MONITOR", "PASS"],
    ["MODERATE_STRATEGIC_DRIFT", "MODERATE_STRATEGIC_DRIFT", "MODERATE", "ESCALATE", "ESCALATED"],
    ["HIGH_RISK_DRIFT", "HIGH_RISK_DRIFT", "HIGH", "SUPPRESS_ADAPTATION", "CONTAINMENT_SELECTED"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION", "HIGH", "REQUIRE_REVIEW", "ESCALATED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION", "CRITICAL", "REQUIRE_REVIEW", "ESCALATED"],
    ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION", "CRITICAL", "REQUIRE_REVIEW", "ESCALATED"],
    ["REPLAY_FAILURE", "REPLAY_FAILURE", "CRITICAL", "ROLLBACK", "ROLLBACK_REQUIRED"],
    ["TENANT_CONTAMINATION", "TENANT_CONTAMINATION", "CRITICAL", "ROLLBACK", "ROLLBACK_REQUIRED"],
    ["EVIDENCE_POISONING", "EVIDENCE_POISONING", "HIGH", "SUPPRESS_ADAPTATION", "CONTAINMENT_SELECTED"],
    ["FEEDBACK_MANIPULATION", "FEEDBACK_MANIPULATION", "MODERATE", "SUPPRESS_ADAPTATION", "CONTAINMENT_SELECTED"],
    ["OPTIMIZATION_PRESSURE", "OPTIMIZATION_PRESSURE", "HIGH", "SUPPRESS_ADAPTATION", "CONTAINMENT_SELECTED"],
    ["ADVERSARIAL_SUCCESS", "ADVERSARIAL_SUCCESS", "CRITICAL", "REQUIRE_CERTIFICATION", "ESCALATED"],
    ["REPEATED_DRIFT", "REPEATED_DRIFT", "MODERATE", "ESCALATE", "ESCALATED"],
    ["UNRESOLVED_ADAPTIVE_BEHAVIOR", "UNRESOLVED_ADAPTIVE_BEHAVIOR", "MODERATE", "REQUIRE_SIMULATION", "CONTAINMENT_SELECTED"],
    ["CERTIFICATION_REQUIRED", "CERTIFICATION_REQUIRED", "MODERATE", "REQUIRE_CERTIFICATION", "ESCALATED"],
    ["ROLLBACK_REQUIRED", "ROLLBACK_REQUIRED", "HIGH", "ROLLBACK", "ROLLBACK_REQUIRED"],
    ["RECOVERY_READY", "RECOVERY_READY", "INFORMATIONAL", "MONITOR", "PASS"],
    ["RECOVERY_DEFERRED", "RECOVERY_DEFERRED", "LOW", "ESCALATE", "ESCALATED"],
    ["UNSUPPORTED_DRIFT", "UNSUPPORTED_DRIFT", "CATASTROPHIC", "FAIL_CLOSED", "FAIL_CLOSED"],
    ["AMBIGUOUS_DRIFT", "AMBIGUOUS_DRIFT", "CATASTROPHIC", "FAIL_CLOSED", "FAIL_CLOSED"],
    ["NONDETERMINISTIC_RESPONSE", "NONDETERMINISTIC_RESPONSE", "INFORMATIONAL", "MONITOR", "PASS"],
    ["NONREPLAYABLE_RESPONSE_EVIDENCE", "NONREPLAYABLE_RESPONSE_EVIDENCE", "INFORMATIONAL", "MONITOR", "PASS"],
    ["UNKNOWN_DRIFT_BEHAVIOR", "UNKNOWN_DRIFT_BEHAVIOR", "CATASTROPHIC", "FAIL_CLOSED", "FAIL_CLOSED"],
  ] as readonly [DriftResponseScenario, DriftResponseFailure, DriftResponseSeverity, DriftContainmentResponse, DriftResponseContainmentStatus][])(
    "maps %s to %s/%s/%s",
    (scenario, failure, severity, response, status) => {
      const result = respondToDrift({ scenario });

      expect(result.failures).toContain(failure);
      expect(result.severity_assessment.severity).toBe(severity);
      expect(result.containment_decision.selected_response).toBe(response);
      expect(result.response_record.selected_response).toBe(response);
      expect(result.status).toBe(status);
      expect(replayDriftResponse(result)).toBe(true);
    },
  );

  it("coordinates rollback, certification, escalation, and operator notification", () => {
    const rollback = respondToDrift({ scenario: "ROLLBACK_REQUIRED" });
    const certification = respondToDrift({ scenario: "CERTIFICATION_REQUIRED" });
    const simulation = respondToDrift({ scenario: "UNRESOLVED_ADAPTIVE_BEHAVIOR" });
    const review = respondToDrift({ scenario: "CONSTITUTIONAL_VIOLATION" });

    expect(rollback.rollback_report.rollback_required).toBe(true);
    expect(rollback.rollback_report.rollback_sequence).toContain("restore_last_certified_state");
    expect(rollback.certification_report.rollback_certification_required).toBe(true);
    expect(certification.certification_report.certification_required).toBe(true);
    expect(certification.recovery_readiness_report.recovery_decision).toBe("RECOVERY_DEFERRED");
    expect(simulation.recovery_readiness_report.recovery_decision).toBe("ADDITIONAL_SIMULATION_REQUIRED");
    expect(review.escalation_package.routes).toContain("Constitutional Review");
    expect(review.notification_package.notification_status).toBe("SENT");
  });

  it("degrades guarantees for the corresponding response failure class", () => {
    expect(respondToDrift({ scenario: "NONDETERMINISTIC_RESPONSE" }).deterministic).toBe(false);
    const evidence = respondToDrift({ scenario: "NONREPLAYABLE_RESPONSE_EVIDENCE" });
    expect(evidence.replayable).toBe(false);
    expect(evidence.evidence_backed).toBe(false);
    expect(respondToDrift({ scenario: "GOVERNANCE_VIOLATION" }).governance_preserved).toBe(false);
    expect(respondToDrift({ scenario: "CONSTITUTIONAL_VIOLATION" }).constitutional_preserved).toBe(false);
    expect(respondToDrift({ scenario: "AUTHORITY_EXPANSION" }).operator_authority_preserved).toBe(false);
    expect(respondToDrift({ scenario: "TENANT_CONTAMINATION" }).tenant_isolated).toBe(false);
  });

  it("fails replay when containment evidence is tampered", () => {
    const result = respondToDrift({ scenario: "HIGH_RISK_DRIFT" });
    const tampered = {
      ...result,
      containment_decision: {
        ...result.containment_decision,
        containment_actions: ["allow_unsafe_progression"],
      },
    };

    expect(replayDriftResponse(result)).toBe(true);
    expect(replayDriftResponse(tampered)).toBe(false);
  });
});
