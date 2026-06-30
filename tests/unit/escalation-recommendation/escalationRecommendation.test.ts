import { describe, expect, it } from "vitest";
import {
  buildEscalationRecommendationDoctrine,
  buildEscalationRecommendationMetrics,
  buildEscalationRecommendationObservabilitySurface,
  computeEscalationRecommendationHash,
  generateEscalationRecommendations,
  getEscalationRecommendationContract,
  replayEscalationRecommendation,
  validateEscalationRecommendation,
} from "@/services/escalation-recommendation";

describe("Mission Control Phase 7F.4 Escalation Recommendation Engine", () => {
  it("defines recommendation doctrine, decision matrix, supported types, and a valid baseline contract", () => {
    const doctrine = buildEscalationRecommendationDoctrine();
    const contract = getEscalationRecommendationContract();
    expect(doctrine.recommender_version).toBe("ESCALATION-RECOMMENDATION-V1");
    expect(doctrine.supported_recommendation_types).toEqual(["OPERATOR_NOTIFICATION", "GOVERNANCE_REVIEW", "POLICY_REVIEW", "COMPLIANCE_REVIEW", "CONSTITUTIONAL_REVIEW", "AUTHORITY_REVIEW", "EMERGENCY_GOVERNANCE_REVIEW"]);
    expect(doctrine.decision_matrix.CRITICAL).toEqual(["EMERGENCY_GOVERNANCE_REVIEW", "CONSTITUTIONAL_REVIEW", "OPERATOR_NOTIFICATION"]);
    expect(contract.baseline_recommendation.validation_state).toBe("VALID");
    expect(contract.baseline_recommendation.replay_state).toBe("REPRODUCED");
  });

  it("generates deterministic recommendations for every prioritized escalation", () => {
    const a = generateEscalationRecommendations();
    const b = generateEscalationRecommendations();
    expect(a.recommendation_records.length).toBeGreaterThan(0);
    expect(a.recommended_escalation_ids).toEqual(a.source_prioritization.prioritized_escalation_ids);
    expect(a.recommendation_records.map((record) => record.recommendation_id)).toEqual(b.recommendation_records.map((record) => record.recommendation_id));
    expect(a.recommendation_records.map((record) => record.recommendation_type)).toEqual(b.recommendation_records.map((record) => record.recommendation_type));
    expect(a.recommendation_hash).toBe(b.recommendation_hash);
    expect(validateEscalationRecommendation(a).validation_state).toBe("VALID");
  });

  it("applies the recommendation decision matrix for INFO, LOW, MEDIUM, HIGH, and CRITICAL priorities", () => {
    expect(generateEscalationRecommendations({ scenario: "INFO_EVENT" }).recommendation_records.map((record) => record.recommendation_type)).toEqual(["OPERATOR_NOTIFICATION"]);
    expect(generateEscalationRecommendations({ scenario: "LOW_POLICY_INCONSISTENCY" }).recommendation_records.map((record) => record.recommendation_type)).toEqual(["OPERATOR_NOTIFICATION", "GOVERNANCE_REVIEW"]);
    expect(generateEscalationRecommendations({ scenario: "POLICY_FAILURE" }).recommendation_records.map((record) => record.recommendation_type)).toEqual(["GOVERNANCE_REVIEW", "POLICY_REVIEW"]);
    expect(generateEscalationRecommendations({ scenario: "AUTHORITY_VIOLATION" }).recommendation_records.map((record) => record.recommendation_type)).toEqual(["GOVERNANCE_REVIEW", "COMPLIANCE_REVIEW", "AUTHORITY_REVIEW"]);
    expect(generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" }).recommendation_records.map((record) => record.recommendation_type)).toEqual(["OPERATOR_NOTIFICATION", "CONSTITUTIONAL_REVIEW", "EMERGENCY_GOVERNANCE_REVIEW"]);
  });

  it("generates constitutional, authority, policy, compliance, and emergency review recommendations when required", () => {
    expect(generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" }).recommendation_records.some((record) => record.recommendation_type === "CONSTITUTIONAL_REVIEW")).toBe(true);
    expect(generateEscalationRecommendations({ scenario: "AUTHORITY_VIOLATION" }).recommendation_records.some((record) => record.recommendation_type === "AUTHORITY_REVIEW")).toBe(true);
    expect(generateEscalationRecommendations({ scenario: "POLICY_FAILURE" }).recommendation_records.some((record) => record.recommendation_type === "POLICY_REVIEW")).toBe(true);
    expect(generateEscalationRecommendations({ scenario: "COMPLIANCE_DEGRADATION" }).recommendation_records.some((record) => record.recommendation_type === "POLICY_REVIEW")).toBe(true);
    expect(generateEscalationRecommendations({ scenario: "INTEGRITY_ESCALATION" }).recommendation_records.some((record) => record.recommendation_type === "EMERGENCY_GOVERNANCE_REVIEW")).toBe(true);
  });

  it("records governance context, evidence, confidence, explainability, lineage, replay refs, and Truth Ledger refs", () => {
    const record = generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" }).recommendation_records.find((item) => item.recommendation_type === "CONSTITUTIONAL_REVIEW")!;
    expect(record.governance_context.constitutional_context.length).toBeGreaterThan(0);
    expect(record.governance_context.authority_context.length).toBeGreaterThan(0);
    expect(record.evidence.escalation_id).toBe(record.escalation_id);
    expect(record.evidence.priority_id).toBe(record.priority_id);
    expect(record.evidence.evidence_ids.length).toBeGreaterThan(0);
    expect(record.confidence.confidence_hash).toBeTruthy();
    expect(record.explainability.why_generated).toContain("selected because");
    expect(record.explainability.alternatives_not_selected.length).toBeGreaterThan(0);
    expect(record.lineage.recommendation_history).toEqual([record.escalation_id, record.priority_id, record.recommendation_id]);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.truth_ledger_refs.length).toBeGreaterThan(0);
  });

  it("preserves advisory-only behavior and never grants execution, policy mutation, approval, or override authority", () => {
    const result = generateEscalationRecommendations();
    expect(result.recommendation_records.every((record) => record.advisory_boundary.advisory_only === true)).toBe(true);
    expect(result.recommendation_records.every((record) => record.advisory_boundary.execution_authority === false)).toBe(true);
    expect(result.recommendation_records.every((record) => record.advisory_boundary.policy_modification_authority === false)).toBe(true);
    expect(result.recommendation_records.every((record) => record.advisory_boundary.approval_authority === false)).toBe(true);
    expect(result.recommendation_records.every((record) => record.advisory_boundary.operator_override_authority === false)).toBe(true);
  });

  it("allows empty valid recommendations when no prioritized escalations exist", () => {
    const result = generateEscalationRecommendations({ scenario: "NO_ESCALATION" });
    expect(result.source_prioritization.priority_records).toEqual([]);
    expect(result.recommendation_records).toEqual([]);
    expect(result.validation_state).toBe("VALID");
    expect(result.replay_state).toBe("REPRODUCED");
  });

  it("rejects source prioritization failures, missing priorities, unsupported types, incomplete evidence, context gaps, replay gaps, and broken lineage", () => {
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "UNSUPPORTED_PRIORITY" })).errors.some((error) => error.reason === "SOURCE_PRIORITIZATION_INVALID")).toBe(true);
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "MISSING_PRIORITY_ASSIGNMENT" })).errors.some((error) => error.reason === "MISSING_PRIORITY_ASSIGNMENT")).toBe(true);
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "UNSUPPORTED_RECOMMENDATION" })).errors.some((error) => error.reason === "UNSUPPORTED_RECOMMENDATION_TYPE")).toBe(true);
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "MISSING_RECOMMENDATION_EVIDENCE" })).errors.some((error) => error.reason === "INCOMPLETE_EVIDENCE")).toBe(true);
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "INCOMPLETE_RECOMMENDATION_CONTEXT" })).errors.some((error) => error.reason === "INCOMPLETE_GOVERNANCE_CONTEXT")).toBe(true);
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "RECOMMENDATION_REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "BROKEN_RECOMMENDATION_LINEAGE" })).errors.some((error) => error.reason === "BROKEN_LINEAGE")).toBe(true);
  });

  it("blocks hidden recommendation state, cross-tenant references, and authority leakage", () => {
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "HIDDEN_RECOMMENDATION_STATE" })).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "CROSS_TENANT_RECOMMENDATION" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    const result = generateEscalationRecommendations();
    const authorityLeak = {
      ...result,
      recommendation_records: [{ ...result.recommendation_records[0], advisory_boundary: { ...result.recommendation_records[0].advisory_boundary, execution_authority: true } }, ...result.recommendation_records.slice(1)],
    };
    expect(validateEscalationRecommendation(authorityLeak as never).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("replays recommendations deterministically and detects record or result tampering", () => {
    const result = generateEscalationRecommendations();
    expect(computeEscalationRecommendationHash(result)).toBe(result.recommendation_hash);
    expect(replayEscalationRecommendation(result).replay_state).toBe("REPRODUCED");
    expect(replayEscalationRecommendation({ ...result, recommendation_hash: "tampered" }).replay_state).toBe("MISMATCH");
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "RECOMMENDATION_HASH_MISMATCH" })).errors.some((error) => error.reason === "RECOMMENDATION_HASH_MISMATCH")).toBe(true);
    expect(validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "RECOMMENDATION_RESULT_HASH_MISMATCH" })).errors.some((error) => error.reason === "RECOMMENDATION_RESULT_HASH_MISMATCH")).toBe(true);
  });

  it("exposes metrics for recommendation distribution, confidence, review frequencies, replay, evidence, and latency", () => {
    const metrics = buildEscalationRecommendationMetrics(generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" }));
    expect(metrics.recommendations_generated).toBe(3);
    expect(metrics.recommendation_distribution.CONSTITUTIONAL_REVIEW).toBe(1);
    expect(metrics.recommendation_distribution.EMERGENCY_GOVERNANCE_REVIEW).toBe(1);
    expect(metrics.constitutional_review_frequency).toBe(1);
    expect(metrics.emergency_governance_review_frequency).toBe(1);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.evidence_completeness).toBe(1);
    expect(metrics.recommendation_generation_latency_ms).toBe(0);
  });

  it("exposes operator visibility over recommendations, priorities, confidence, evidence, governance refs, replay refs, ledger refs, and advisory notice", () => {
    const surface = buildEscalationRecommendationObservabilitySurface(generateEscalationRecommendations());
    expect(surface.recommendation_count).toBe(2);
    expect(surface.recommendation_ids.length).toBe(2);
    expect(surface.recommendation_types).toEqual(["GOVERNANCE_REVIEW", "POLICY_REVIEW"]);
    expect(surface.priorities).toEqual(["MEDIUM", "MEDIUM"]);
    expect(surface.confidence.length).toBe(2);
    expect(surface.evidence_refs.length).toBeGreaterThan(0);
    expect(surface.governance_refs.length).toBeGreaterThan(0);
    expect(surface.replay_refs.length).toBeGreaterThan(0);
    expect(surface.ledger_refs.length).toBeGreaterThan(0);
    expect(surface.advisory_only_notice).toContain("advisory only");
  });
});
