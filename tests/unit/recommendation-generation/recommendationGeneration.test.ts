import { describe, expect, it } from "vitest";
import {
  aggregateRecommendationEvidence,
  buildGovernanceFindings,
  buildRecommendationGenerationContract,
  buildRecommendationGenerationDoctrine,
  buildRecommendationGenerationObservabilitySurface,
  calculateRecommendationConfidence,
  calculateRecommendationPriority,
  computeRecommendationGenerationHash,
  correlateGovernanceFindings,
  generateRecommendationCandidates,
  generateRecommendations,
  replayRecommendationGeneration,
  validateRecommendationGeneration,
} from "@/services/recommendation-generation";

describe("Mission Control Phase 7E.2 Recommendation Generation Engine", () => {
  it("defines generation doctrine, supported recommendation types, priority levels, and baseline contract", () => {
    const doctrine = buildRecommendationGenerationDoctrine();
    const contract = buildRecommendationGenerationContract();
    expect(doctrine.generator_version).toBe("RECOMMENDATION-GENERATION-V1");
    expect(doctrine.supported_recommendation_types).toEqual(expect.arrayContaining(["POLICY_UPDATE", "CONTROL_IMPROVEMENT", "COMPLIANCE_IMPROVEMENT"]));
    expect(doctrine.priority_levels).toEqual(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]);
    expect(contract.baseline_generation.certification_state).toBe("PASS");
  });

  it("generates recommendations deterministically and reuses stable IDs, ordering, priority, confidence, and hash", () => {
    const a = generateRecommendations();
    const b = generateRecommendations();
    expect(a.recommendations.map((item) => item.recommendation_id)).toEqual(b.recommendations.map((item) => item.recommendation_id));
    expect(a.recommendations.map((item) => item.priority)).toEqual(b.recommendations.map((item) => item.priority));
    expect(a.recommendations.map((item) => item.confidence_score)).toEqual(b.recommendations.map((item) => item.confidence_score));
    expect(a.generation_hash).toBe(b.generation_hash);
    expect(validateRecommendationGeneration(a).validation_state).toBe("VALID");
  });

  it("generates policy update, control improvement, escalation, compliance improvement, remediation, monitoring, and certification recommendations", () => {
    expect(generateRecommendations({ scenario: "POLICY_CONFLICT" }).recommendations.some((item) => item.recommendation_type === "POLICY_UPDATE")).toBe(true);
    expect(generateRecommendations({ scenario: "CONTROL_GAP" }).recommendations.some((item) => item.recommendation_type === "CONTROL_IMPROVEMENT")).toBe(true);
    expect(generateRecommendations({ scenario: "ESCALATION_REQUIRED" }).recommendations.some((item) => item.recommendation_type === "ESCALATION_RECOMMENDATION")).toBe(true);
    expect(generateRecommendations({ scenario: "COMPLIANCE_GAP" }).recommendations.some((item) => item.recommendation_type === "COMPLIANCE_IMPROVEMENT")).toBe(true);
    expect(generateRecommendations({ scenario: "REMEDIATION_REQUIRED" }).recommendations.some((item) => item.recommendation_type === "REMEDIATION_RECOMMENDATION")).toBe(true);
    expect(generateRecommendations({ scenario: "MONITORING_GAP" }).recommendations.some((item) => item.recommendation_type === "MONITORING_RECOMMENDATION")).toBe(true);
    expect(generateRecommendations({ scenario: "CERTIFICATION_READY" }).recommendations.some((item) => item.recommendation_type === "CERTIFICATION_RECOMMENDATION")).toBe(true);
  });

  it("aggregates evidence deterministically, eliminates duplicates, preserves lineage, and detects conflicts", () => {
    const findings = buildGovernanceFindings();
    const evidence = aggregateRecommendationEvidence([...findings, findings[0]], "EVIDENCE_CONFLICT");
    expect(evidence.evidence_refs).toEqual([...evidence.evidence_refs].sort());
    expect(new Set(evidence.evidence_refs).size).toBe(evidence.evidence_refs.length);
    expect(evidence.lineage_refs.length).toBeGreaterThan(0);
    expect(evidence.conflicting_evidence_refs.length).toBe(1);
  });

  it("rejects missing or unsupported evidence", () => {
    expect(validateRecommendationGeneration(generateRecommendations({ scenario: "MISSING_EVIDENCE" })).validation_state).toBe("UNKNOWN");
    const unsupported = generateRecommendations({ scenario: "UNSUPPORTED_EVIDENCE" });
    const validation = validateRecommendationGeneration(unsupported);
    expect(validation.validation_state).toBe("INVALID");
    expect(validation.errors.some((error) => error.reason === "UNSUPPORTED_EVIDENCE_ACCEPTED")).toBe(true);
  });

  it("correlates policy, risk, compliance, evidence, controls, certification, and historical outcomes", () => {
    const findings = buildGovernanceFindings();
    const evidence = aggregateRecommendationEvidence(findings);
    const correlation = correlateGovernanceFindings(findings, evidence);
    expect(correlation.policy_to_compliance.length).toBeGreaterThan(0);
    expect(correlation.policy_to_risk.length).toBeGreaterThan(0);
    expect(correlation.risk_to_evidence.length).toBeGreaterThan(0);
    expect(correlation.compliance_to_controls.length).toBeGreaterThan(0);
    expect(correlation.governance_to_certification.length).toBeGreaterThan(0);
    expect(correlation.historical_outcome_refs.length).toBeGreaterThan(0);
  });

  it("generates candidates from normalized findings with source evidence, risk, policies, compliance, and rationale", () => {
    const findings = buildGovernanceFindings();
    const evidence = aggregateRecommendationEvidence(findings);
    const candidates = generateRecommendationCandidates(findings, evidence);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].source_findings.length).toBe(1);
    expect(candidates[0].supporting_evidence.length).toBeGreaterThan(0);
    expect(candidates[0].supporting_risk.length).toBeGreaterThan(0);
    expect(candidates[0].rationale).toContain("generated from");
  });

  it("calculates priority deterministically from severity, certification impact, recurrence, and type", () => {
    const result = generateRecommendations({ scenario: "ESCALATION_REQUIRED" });
    expect(result.recommendations.some((item) => item.priority === "CRITICAL")).toBe(true);
    const findings = buildGovernanceFindings({ scenario: "REMEDIATION_REQUIRED" });
    const evidence = aggregateRecommendationEvidence(findings);
    const candidate = generateRecommendationCandidates(findings, evidence, "REMEDIATION_REQUIRED").find((item) => item.recommendation_type === "REMEDIATION_RECOMMENDATION")!;
    expect(calculateRecommendationPriority(candidate, findings).priority).toBe("HIGH");
  });

  it("calculates confidence deterministically from evidence, policy, risk, compliance, history, and replay", () => {
    const findings = buildGovernanceFindings();
    const evidence = aggregateRecommendationEvidence(findings);
    const correlation = correlateGovernanceFindings(findings, evidence);
    const candidate = generateRecommendationCandidates(findings, evidence)[0];
    const a = calculateRecommendationConfidence(candidate, evidence, correlation);
    const b = calculateRecommendationConfidence(candidate, evidence, correlation);
    expect(a.confidence_score).toBe(b.confidence_score);
    expect(a.confidence_hash).toBe(b.confidence_hash);
    expect(a.rationale).toContain("deterministically correlated");
  });

  it("preserves governance constraints and advisory-only authority on every generated recommendation", () => {
    const result = generateRecommendations();
    expect(result.recommendations.every((item) => item.governance_constraints.authority_limits.includes("no_execution_authority"))).toBe(true);
    expect(result.recommendations.every((item) => item.advisory_only === true && item.advisory_boundary.execution_authority === false)).toBe(true);
    expect(result.recommendations.every((item) => item.advisory_notice.includes("Advisory only"))).toBe(true);
  });

  it("detects execution authority and hidden generation state", () => {
    expect(validateRecommendationGeneration(generateRecommendations({ scenario: "EXECUTION_AUTHORITY" })).validation_state).toBe("CERTIFICATION_BLOCKED");
    const result = generateRecommendations();
    expect(validateRecommendationGeneration({ ...result, hidden_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("detects duplicate recommendations when duplicate records reach validation", () => {
    const result = generateRecommendations();
    const duplicated = { ...result, recommendations: [result.recommendations[0], result.recommendations[0], ...result.recommendations.slice(1)] };
    const validation = validateRecommendationGeneration(duplicated);
    expect(validation.errors.some((error) => error.reason === "DUPLICATE_RECOMMENDATIONS_GENERATED")).toBe(true);
  });

  it("replays generation and detects replay mismatches", () => {
    const result = generateRecommendations();
    expect(replayRecommendationGeneration(result).replay_state).toBe("REPRODUCED");
    const tampered = { ...result, generation_hash: "tampered" };
    expect(replayRecommendationGeneration(tampered).replay_state).toBe("MISMATCH");
    expect(validateRecommendationGeneration(tampered).validation_state).toBe("REPLAY_MISMATCH");
  });

  it("preserves recommendation lineage and writes Truth Ledger records", () => {
    const result = generateRecommendations();
    expect(result.recommendations.every((item) => item.source_findings.length > 0)).toBe(true);
    expect(result.recommendations.every((item) => item.truth_record_ref)).toBe(true);
    expect(result.ledger_record.truth_ledger_refs.length).toBeGreaterThan(0);
    expect(result.ledger_record.recommendation_ids).toEqual(result.recommendations.map((item) => item.recommendation_id));
  });

  it("fails when Truth Ledger recording is unavailable", () => {
    const result = generateRecommendations({ scenario: "LEDGER_FAILURE" });
    const validation = validateRecommendationGeneration(result);
    expect(validation.errors.some((error) => error.reason === "TRUTH_LEDGER_RECORD_MISSING")).toBe(true);
    expect(result.certification_state).toBe("FAIL");
  });

  it("preserves tenant isolation and blocks cross-tenant recommendation generation", () => {
    expect(validateRecommendationGeneration(generateRecommendations()).checks.tenant_isolated).toBe(true);
    const result = generateRecommendations({ scenario: "CROSS_TENANT" });
    expect(validateRecommendationGeneration(result).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(result.certification_state).toBe("FAIL");
  });

  it("exposes operator visibility over summaries, types, priority, confidence, evidence, risk, policy, compliance, replay, and certification", () => {
    const surface = buildRecommendationGenerationObservabilitySurface(generateRecommendations());
    expect(surface.recommendation_count).toBeGreaterThan(0);
    expect(surface.recommendation_summaries.length).toBe(surface.recommendation_count);
    expect(surface.recommendation_types.length).toBe(surface.recommendation_count);
    expect(surface.priorities.length).toBe(surface.recommendation_count);
    expect(surface.confidence.length).toBe(surface.recommendation_count);
    expect(surface.evidence_refs.length).toBeGreaterThan(0);
    expect(surface.replay_state).toBe("REPRODUCED");
    expect(surface.certification_state).toBe("PASS");
  });

  it("computes a stable generation hash and certification PASS for valid generation", () => {
    const result = generateRecommendations();
    expect(computeRecommendationGenerationHash(result)).toBe(result.generation_hash);
    expect(result.validation_state).toBe("VALID");
    expect(result.replay_state).toBe("REPRODUCED");
    expect(result.certification_state).toBe("PASS");
  });
});
