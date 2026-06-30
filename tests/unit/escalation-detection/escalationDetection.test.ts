import { describe, expect, it } from "vitest";
import {
  buildEscalationDetectionDoctrine,
  buildEscalationDetectionMetrics,
  buildEscalationDetectionObservabilitySurface,
  computeEscalationDetectionHash,
  getEscalationDetectionContract,
  replayEscalationDetection,
  runEscalationDetection,
  validateEscalationDetection,
} from "@/services/escalation-detection";

describe("Mission Control Phase 7F.2 Escalation Detection Engine", () => {
  it("defines the detection doctrine, baseline contract, and supported escalation outputs", () => {
    const doctrine = buildEscalationDetectionDoctrine();
    const contract = getEscalationDetectionContract();
    expect(doctrine.detector_version).toBe("ESCALATION-DETECTION-V1");
    expect(doctrine.supported_outputs).toEqual(["CONSTITUTIONAL_ESCALATION", "AUTHORITY_ESCALATION", "POLICY_ESCALATION", "COMPLIANCE_ESCALATION", "PROCESS_ESCALATION", "RISK_ESCALATION", "EVIDENCE_ESCALATION", "REPLAY_ESCALATION", "INTEGRITY_ESCALATION"]);
    expect(contract.baseline_detection.validation_state).toBe("VALID");
    expect(contract.baseline_detection.replay_state).toBe("REPRODUCED");
  });

  it("detects a baseline policy escalation and emits a valid 7F.1 escalation contract record", () => {
    const result = runEscalationDetection();
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].output_type).toBe("POLICY_ESCALATION");
    expect(result.escalation_records[0].escalation_type).toBe("POLICY");
    expect(result.validation_state).toBe("VALID");
    expect(validateEscalationDetection(result).validation_state).toBe("VALID");
  });

  it("detects constitutional, authority, policy, compliance, process, risk, evidence, replay, and integrity escalations deterministically", () => {
    expect(runEscalationDetection({ scenario: "CONSTITUTIONAL_RISK" }).findings[0].output_type).toBe("CONSTITUTIONAL_ESCALATION");
    expect(runEscalationDetection({ scenario: "AUTHORITY_VIOLATION" }).findings[0].output_type).toBe("AUTHORITY_ESCALATION");
    expect(runEscalationDetection({ scenario: "POLICY_FAILURE" }).findings[0].output_type).toBe("POLICY_ESCALATION");
    expect(runEscalationDetection({ scenario: "COMPLIANCE_DEGRADATION" }).findings[0].output_type).toBe("COMPLIANCE_ESCALATION");
    expect(runEscalationDetection({ scenario: "PROCESS_FAILURE" }).findings[0].output_type).toBe("PROCESS_ESCALATION");
    expect(runEscalationDetection({ scenario: "RISK_ESCALATION" }).findings[0].output_type).toBe("RISK_ESCALATION");
    expect(runEscalationDetection({ scenario: "EVIDENCE_ESCALATION" }).findings[0].output_type).toBe("EVIDENCE_ESCALATION");
    expect(runEscalationDetection({ scenario: "REPLAY_ESCALATION" }).findings[0].output_type).toBe("REPLAY_ESCALATION");
    expect(runEscalationDetection({ scenario: "INTEGRITY_ESCALATION" }).findings[0].output_type).toBe("INTEGRITY_ESCALATION");
  });

  it("does not generate an escalation when trigger conditions are not applicable", () => {
    const result = runEscalationDetection({ scenario: "NO_ESCALATION" });
    expect(result.trigger_evaluations).toEqual([]);
    expect(result.findings).toEqual([]);
    expect(result.escalation_records).toEqual([]);
    expect(result.validation_state).toBe("VALID");
  });

  it("rejects unsupported triggers, missing evidence, invalid authority, invalid constitutional references, and incomplete governance context", () => {
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "UNSUPPORTED_TRIGGER" })).errors.some((error) => error.reason === "UNSUPPORTED_TRIGGER_ACCEPTED")).toBe(true);
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "MISSING_EVIDENCE" })).errors.some((error) => error.reason === "MISSING_EVIDENCE_ACCEPTED")).toBe(true);
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "INVALID_AUTHORITY" })).errors.some((error) => error.reason === "INVALID_AUTHORITY_ACCEPTED")).toBe(true);
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "INVALID_CONSTITUTIONAL_REF" })).errors.some((error) => error.reason === "INVALID_CONSTITUTIONAL_REF_ACCEPTED")).toBe(true);
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "INCOMPLETE_GOVERNANCE_CONTEXT" })).errors.some((error) => error.reason === "INCOMPLETE_GOVERNANCE_CONTEXT_ACCEPTED")).toBe(true);
  });

  it("detects replay mismatch, broken lineage, hidden state, detection hash mismatch, and Truth Ledger gaps", () => {
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "BROKEN_LINEAGE" })).errors.some((error) => error.reason === "BROKEN_LINEAGE_ACCEPTED")).toBe(true);
    expect(validateEscalationDetection({ ...runEscalationDetection(), hidden_detection_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateEscalationDetection(runEscalationDetection({ scenario: "DETECTION_HASH_MISMATCH" })).errors.some((error) => error.reason === "DETECTION_HASH_MISMATCH")).toBe(true);
    expect(validateEscalationDetection({ ...runEscalationDetection(), ledger_record: { ...runEscalationDetection().ledger_record, truth_ledger_refs: [] } }).errors.some((error) => error.reason === "TRUTH_LEDGER_RECORD_MISSING")).toBe(true);
  });

  it("enforces tenant isolation and blocks execution authority", () => {
    const tenant = validateEscalationDetection(runEscalationDetection({ scenario: "CROSS_TENANT" }));
    const authority = validateEscalationDetection(runEscalationDetection({ scenario: "EXECUTION_AUTHORITY" }));
    expect(tenant.validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(tenant.errors.some((error) => error.reason === "CROSS_TENANT_DETECTION")).toBe(true);
    expect(authority.validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(authority.errors.some((error) => error.reason === "EXECUTION_AUTHORITY_DETECTED")).toBe(true);
  });

  it("replays detection deterministically and detects tampered output", () => {
    const result = runEscalationDetection();
    expect(computeEscalationDetectionHash(result)).toBe(result.detection_hash);
    expect(replayEscalationDetection(result).replay_state).toBe("REPRODUCED");
    expect(replayEscalationDetection({ ...result, detection_hash: "tampered" }).replay_state).toBe("MISMATCH");
  });

  it("records Truth Ledger, confidence, evidence, governance, replay, and lineage refs", () => {
    const result = runEscalationDetection();
    expect(result.ledger_record.detection_ledger_id).toBeTruthy();
    expect(result.ledger_record.trigger_evidence_refs.length).toBeGreaterThan(0);
    expect(result.ledger_record.confidence_refs.length).toBeGreaterThan(0);
    expect(result.ledger_record.governance_context_refs.length).toBeGreaterThan(0);
    expect(result.ledger_record.replay_refs.length).toBeGreaterThan(0);
    expect(result.ledger_record.lineage_refs.length).toBeGreaterThan(0);
    expect(result.ledger_record.truth_ledger_refs.length).toBeGreaterThan(0);
  });

  it("exposes monitoring metrics for detection rate, trigger frequency, replay success, evidence completeness, confidence, and category counts", () => {
    const metrics = buildEscalationDetectionMetrics(runEscalationDetection({ scenario: "CONSTITUTIONAL_RISK" }));
    expect(metrics.detection_rate).toBe(1);
    expect(metrics.trigger_frequency.CONSTITUTIONAL_CONFLICT).toBe(1);
    expect(metrics.trigger_distribution.CONSTITUTIONAL_ESCALATION).toBe(1);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.evidence_completeness).toBe(1);
    expect(metrics.average_confidence).toBeGreaterThan(0);
    expect(metrics.constitutional_escalation_count).toBe(1);
  });

  it("exposes operator visibility for explanations, evidence, governance refs, replay refs, ledger refs, metrics, and advisory-only notice", () => {
    const surface = buildEscalationDetectionObservabilitySurface(runEscalationDetection());
    expect(surface.escalation_count).toBe(1);
    expect(surface.finding_explanations[0]).toContain("generated because");
    expect(surface.evidence_refs.length).toBeGreaterThan(0);
    expect(surface.governance_refs.length).toBeGreaterThan(0);
    expect(surface.replay_refs.length).toBeGreaterThan(0);
    expect(surface.ledger_refs.length).toBeGreaterThan(0);
    expect(surface.replay_state).toBe("REPRODUCED");
    expect(surface.advisory_only_notice).toContain("advisory only");
    expect(surface.metrics.detection_rate).toBe(1);
  });
});
