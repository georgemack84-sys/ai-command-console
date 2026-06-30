import { describe, expect, it } from "vitest";
import {
  buildEscalationPrioritizationDoctrine,
  buildEscalationPrioritizationMetrics,
  buildEscalationPrioritizationObservabilitySurface,
  computeEscalationPrioritizationHash,
  getEscalationPrioritizationContract,
  prioritizeEscalations,
  replayEscalationPrioritization,
  validateEscalationPrioritization,
} from "@/services/escalation-prioritization";

describe("Mission Control Phase 7F.3 Escalation Prioritization", () => {
  it("defines prioritization doctrine, supported priority levels, and a valid baseline contract", () => {
    const doctrine = buildEscalationPrioritizationDoctrine();
    const contract = getEscalationPrioritizationContract();
    expect(doctrine.prioritizer_version).toBe("ESCALATION-PRIORITIZATION-V1");
    expect(doctrine.supported_priority_levels).toEqual(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    expect(doctrine.supported_detection_outputs).toEqual(expect.arrayContaining(["CONSTITUTIONAL_ESCALATION", "AUTHORITY_ESCALATION", "POLICY_ESCALATION"]));
    expect(contract.baseline_prioritization.validation_state).toBe("VALID");
    expect(contract.baseline_prioritization.replay_state).toBe("REPRODUCED");
  });

  it("assigns one deterministic priority to every validated detected escalation", () => {
    const a = prioritizeEscalations();
    const b = prioritizeEscalations();
    expect(a.priority_records).toHaveLength(a.source_detection.escalation_records.length);
    expect(a.priority_records.map((record) => record.priority_id)).toEqual(b.priority_records.map((record) => record.priority_id));
    expect(a.priority_records.map((record) => record.priority_level)).toEqual(b.priority_records.map((record) => record.priority_level));
    expect(a.priority_records.map((record) => record.priority_score)).toEqual(b.priority_records.map((record) => record.priority_score));
    expect(a.prioritization_hash).toBe(b.prioritization_hash);
    expect(validateEscalationPrioritization(a).validation_state).toBe("VALID");
  });

  it("maps deterministic severity scores into INFO, LOW, MEDIUM, HIGH, and CRITICAL priority levels", () => {
    expect(prioritizeEscalations({ scenario: "INFO_EVENT" }).priority_records[0].priority_level).toBe("INFO");
    expect(prioritizeEscalations({ scenario: "LOW_POLICY_INCONSISTENCY" }).priority_records[0].priority_level).toBe("LOW");
    expect(prioritizeEscalations({ scenario: "POLICY_FAILURE" }).priority_records[0].priority_level).toBe("MEDIUM");
    expect(prioritizeEscalations({ scenario: "AUTHORITY_VIOLATION" }).priority_records[0].priority_level).toBe("HIGH");
    expect(prioritizeEscalations({ scenario: "CONSTITUTIONAL_RISK" }).priority_records[0].priority_level).toBe("CRITICAL");
  });

  it("incorporates constitutional, authority, policy, compliance, process, risk, evidence, replay, and integrity impacts", () => {
    expect(prioritizeEscalations({ scenario: "CONSTITUTIONAL_RISK" }).priority_records[0].priority_score).toBe(100);
    expect(prioritizeEscalations({ scenario: "AUTHORITY_VIOLATION" }).priority_records[0].priority_score).toBe(84);
    expect(prioritizeEscalations({ scenario: "COMPLIANCE_DEGRADATION" }).priority_records[0].priority_score).toBe(58);
    expect(prioritizeEscalations({ scenario: "PROCESS_FAILURE" }).priority_records[0].priority_score).toBe(55);
    expect(prioritizeEscalations({ scenario: "RISK_ESCALATION" }).priority_records[0].priority_score).toBe(82);
    expect(prioritizeEscalations({ scenario: "EVIDENCE_ESCALATION" }).priority_records[0].priority_score).toBe(52);
    expect(prioritizeEscalations({ scenario: "REPLAY_ESCALATION" }).priority_records[0].priority_score).toBe(86);
    expect(prioritizeEscalations({ scenario: "INTEGRITY_ESCALATION" }).priority_records[0].priority_level).toBe("CRITICAL");
  });

  it("records confidence, explainability, governance basis, evidence basis, and priority factors", () => {
    const record = prioritizeEscalations({ scenario: "CONSTITUTIONAL_RISK" }).priority_records[0];
    expect(record.confidence.confidence_score).toBeGreaterThan(0);
    expect(record.confidence.confidence_hash).toBeTruthy();
    expect(record.priority_factors.map((factor) => factor.factor_type)).toEqual(expect.arrayContaining(["CONSTITUTIONAL_IMPACT", "AUTHORITY_IMPACT", "POLICY_IMPACT", "COMPLIANCE_IMPACT", "EVIDENCE_QUALITY"]));
    expect(record.explainability.why_assigned).toContain("fixed threshold");
    expect(record.explainability.higher_priority_exclusion).toContain("No higher priority");
    expect(record.explainability.constitutional_basis.length).toBeGreaterThan(0);
    expect(record.explainability.evidence_basis.length).toBeGreaterThan(0);
  });

  it("preserves priority lineage, replay refs, Truth Ledger refs, and advisory-only boundaries", () => {
    const result = prioritizeEscalations();
    const record = result.priority_records[0];
    expect(record.lineage.priority_id).toBe(record.priority_id);
    expect(record.lineage.escalation_id).toBe(record.escalation_id);
    expect(record.lineage.priority_history).toEqual([record.escalation_id, record.priority_id]);
    expect(record.lineage.trigger_chain.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.truth_ledger_refs.length).toBeGreaterThan(0);
    expect(record.advisory_boundary.advisory_only).toBe(true);
    expect(record.advisory_boundary.execution_authority).toBe(false);
    expect(record.advisory_boundary.recommendation_authority).toBe(false);
    expect(result.ledger_record.priority_ids).toEqual(result.priority_records.map((item) => item.priority_id));
  });

  it("allows empty valid prioritization when no validated escalations exist", () => {
    const result = prioritizeEscalations({ scenario: "NO_ESCALATION" });
    expect(result.source_detection.escalation_records).toEqual([]);
    expect(result.priority_records).toEqual([]);
    expect(result.validation_state).toBe("VALID");
    expect(result.replay_state).toBe("REPRODUCED");
  });

  it("rejects invalid escalation records, unsupported priorities, missing evidence, incomplete context, replay gaps, and broken lineage", () => {
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "INVALID_ESCALATION_RECORD" })).errors.some((error) => error.reason === "INVALID_ESCALATION_RECORD")).toBe(true);
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "UNSUPPORTED_PRIORITY" })).errors.some((error) => error.reason === "UNSUPPORTED_PRIORITY_LEVEL")).toBe(true);
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "MISSING_PRIORITY_EVIDENCE" })).errors.some((error) => error.reason === "MISSING_EVIDENCE")).toBe(true);
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "INCOMPLETE_PRIORITY_CONTEXT" })).errors.some((error) => error.reason === "INCOMPLETE_GOVERNANCE_CONTEXT")).toBe(true);
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "PRIORITY_REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "BROKEN_PRIORITY_LINEAGE" })).errors.some((error) => error.reason === "BROKEN_LINEAGE")).toBe(true);
  });

  it("blocks source detection failures, hidden prioritization state, cross-tenant references, and authority leakage", () => {
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "UNSUPPORTED_TRIGGER" })).errors.some((error) => error.reason === "SOURCE_DETECTION_INVALID")).toBe(true);
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "HIDDEN_PRIORITY_STATE" })).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "CROSS_TENANT_PRIORITY" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    const result = prioritizeEscalations();
    const authorityLeak = {
      ...result,
      priority_records: [{ ...result.priority_records[0], advisory_boundary: { ...result.priority_records[0].advisory_boundary, execution_authority: true } }, ...result.priority_records.slice(1)],
    };
    expect(validateEscalationPrioritization(authorityLeak as never).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("replays prioritization deterministically and detects record or result tampering", () => {
    const result = prioritizeEscalations();
    expect(computeEscalationPrioritizationHash(result)).toBe(result.prioritization_hash);
    expect(replayEscalationPrioritization(result).replay_state).toBe("REPRODUCED");
    expect(replayEscalationPrioritization({ ...result, prioritization_hash: "tampered" }).replay_state).toBe("MISMATCH");
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "PRIORITY_HASH_MISMATCH" })).errors.some((error) => error.reason === "PRIORITY_HASH_MISMATCH")).toBe(true);
    expect(validateEscalationPrioritization(prioritizeEscalations({ scenario: "PRIORITIZATION_HASH_MISMATCH" })).errors.some((error) => error.reason === "PRIORITIZATION_HASH_MISMATCH")).toBe(true);
  });

  it("exposes metrics for distribution, average score, category rates, confidence, replay, latency, and lineage", () => {
    const metrics = buildEscalationPrioritizationMetrics(prioritizeEscalations({ scenario: "CONSTITUTIONAL_RISK" }));
    expect(metrics.total_prioritized_escalations).toBe(1);
    expect(metrics.priority_distribution.CRITICAL).toBe(1);
    expect(metrics.average_priority_score).toBe(100);
    expect(metrics.constitutional_escalation_rate).toBe(1);
    expect(metrics.evidence_completeness_rate).toBe(1);
    expect(metrics.confidence_distribution.CERTIFICATION_READY).toBeGreaterThanOrEqual(0);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.prioritization_latency_ms).toBe(0);
    expect(metrics.lineage_reconstruction_success).toBe(1);
  });

  it("exposes operator visibility over reasons, factors, evidence, governance refs, replay refs, ledger refs, and advisory notice", () => {
    const surface = buildEscalationPrioritizationObservabilitySurface(prioritizeEscalations());
    expect(surface.priority_count).toBe(1);
    expect(surface.priority_ids.length).toBe(1);
    expect(surface.priorities).toEqual(["MEDIUM"]);
    expect(surface.priority_reasons[0]).toContain("priority assigned");
    expect(surface.contributing_factors.length).toBeGreaterThan(0);
    expect(surface.evidence_refs.length).toBeGreaterThan(0);
    expect(surface.governance_refs.length).toBeGreaterThan(0);
    expect(surface.replay_refs.length).toBeGreaterThan(0);
    expect(surface.ledger_refs.length).toBeGreaterThan(0);
    expect(surface.advisory_only_notice).toContain("advisory only");
  });
});
