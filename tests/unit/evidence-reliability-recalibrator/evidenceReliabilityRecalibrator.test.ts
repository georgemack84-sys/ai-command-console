import { describe, expect, it } from "vitest";
import {
  analyzeEvidenceReliability,
  getEvidenceReliabilityFoundation,
  replayEvidenceReliability,
} from "@/services/evidence-reliability-recalibrator";
import type { EvidenceReliabilityFailure, EvidenceReliabilityScenario } from "@/types/evidence-reliability-recalibrator";

describe("Mission Control Phase 10.6.3 Evidence Reliability Recalibrator", () => {
  it("publishes the evidence reliability foundation", () => {
    const foundation = getEvidenceReliabilityFoundation();

    expect(foundation.evidence_reliability_recalibrator_version).toBe("evidence-reliability-recalibrator/v1");
    expect(foundation.api_surface.analyze_reliability).toBe("POST /evidence-reliability-recalibrator/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("analyzes evidence reliability deterministically", () => {
    const first = analyzeEvidenceReliability({ scenario: "CONTRADICTORY" });
    const second = analyzeEvidenceReliability({ scenario: "CONTRADICTORY" });

    expect(first.reliability_records[0].evidence_reliability_id).toBe(second.reliability_records[0].evidence_reliability_id);
    expect(first.reliability_records[0].overall_reliability_score).toBe(second.reliability_records[0].overall_reliability_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports all evidence source categories", () => {
    expect(analyzeEvidenceReliability({ scenario: "AUTHORITATIVE" }).reliability_records[0].source_category).toBe("AUTHORITATIVE");
    expect(analyzeEvidenceReliability({ scenario: "VERIFIED" }).reliability_records[0].source_category).toBe("VERIFIED");
    expect(analyzeEvidenceReliability({ scenario: "TRUSTED" }).reliability_records[0].source_category).toBe("TRUSTED");
    expect(analyzeEvidenceReliability({ scenario: "OPERATIONAL" }).reliability_records[0].source_category).toBe("OPERATIONAL");
    expect(analyzeEvidenceReliability({ scenario: "EXTERNAL" }).reliability_records[0].source_category).toBe("EXTERNAL");
    expect(analyzeEvidenceReliability({ scenario: "DERIVED" }).reliability_records[0].source_category).toBe("DERIVED");
    expect(analyzeEvidenceReliability({ scenario: "UNVERIFIED" }).reliability_records[0].source_category).toBe("UNVERIFIED");
    expect(analyzeEvidenceReliability({ scenario: "UNKNOWN" }).reliability_records[0].source_category).toBe("UNKNOWN");
  });

  it("measures completeness, freshness, conflicts, uncertainty, lineage, verification, and durability", () => {
    const incomplete = analyzeEvidenceReliability({ scenario: "INCOMPLETE" }).reliability_records[0];
    const stale = analyzeEvidenceReliability({ scenario: "STALE" }).reliability_records[0];
    const contradictory = analyzeEvidenceReliability({ scenario: "CONTRADICTORY" }).reliability_records[0];
    const uncertain = analyzeEvidenceReliability({ scenario: "UNCERTAIN" }).reliability_records[0];
    const durability = analyzeEvidenceReliability({ scenario: "LOW_DURABILITY" }).reliability_records[0];

    expect(incomplete.completeness_rating).toBe("INSUFFICIENT");
    expect(stale.freshness_score).toBeLessThan(0.5);
    expect(contradictory.conflict_severity).toBe("CRITICAL");
    expect(uncertain.uncertainty_score).toBeLessThan(0.3);
    expect(durability.durability_rating).toBe("VERY_LOW");
    expect(contradictory.confidence_accuracy_influence).toBeGreaterThan(0.5);
  });

  it("builds source reliability profiles and explainable reports", () => {
    const result = analyzeEvidenceReliability({ scenario: "VERIFIED" });
    const profile = result.source_profiles[0];

    expect(profile.historical_accuracy).toBeGreaterThan(0);
    expect(profile.verification_success_rate).toBeGreaterThan(0);
    expect(profile.trust_score).toBeGreaterThan(0);
    expect(result.report.source_analysis).toContain("Source trust score");
    expect(result.report.governance_findings.length).toBeGreaterThan(0);
    expect(result.report.recommended_actions.length).toBeGreaterThan(0);
  });

  it("records immutable reliability trend registry indexes", () => {
    const result = analyzeEvidenceReliability({ scenario: "AUTHORITATIVE" });
    const record = result.reliability_records[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.reliability_record_refs).toContain(record.evidence_reliability_id);
    expect(result.registry.source_quality_history.AUTHORITATIVE).toContain(record.evidence_reliability_id);
    expect(result.registry.completeness_history.COMPLETE).toContain(record.evidence_reliability_id);
  });

  it("keeps the recalibrator advisory-only without changing evidence, weights, confidence models, or history", () => {
    const result = analyzeEvidenceReliability({ scenario: "UNKNOWN" });
    const record = result.reliability_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_evidence).toBe(false);
    expect(result.updates_evidence_weights).toBe(false);
    expect(result.updates_confidence_model).toBe(false);
    expect(result.changes_historical_decisions).toBe(false);
    expect(record.advisory_only).toBe(true);
    expect(record.mutates_evidence).toBe(false);
  });

  it("replays evidence reliability analyses", () => {
    const result = analyzeEvidenceReliability({ scenario: "VERIFIED" });

    expect(replayEvidenceReliability(result)).toBe(true);
  });

  it.each([
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["BROKEN_LINEAGE", "EVIDENCE_LINEAGE_BROKEN"],
    ["MISSING_VERIFICATION", "VERIFICATION_HISTORY_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["EVIDENCE_MUTATION", "EVIDENCE_MUTATION_DETECTED"],
    ["WEIGHT_UPDATE", "EVIDENCE_WEIGHT_UPDATE_DETECTED"],
    ["CONFIDENCE_MODEL_UPDATE", "CONFIDENCE_MODEL_UPDATE_DETECTED"],
    ["HISTORICAL_DECISION_CHANGE", "HISTORICAL_DECISION_CHANGE_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ANALYSIS"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [EvidenceReliabilityScenario, EvidenceReliabilityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeEvidenceReliability({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_confidence_model).toBe(false);
  });

  it("keeps missing verification pending instead of certified", () => {
    const result = analyzeEvidenceReliability({ scenario: "MISSING_VERIFICATION" });

    expect(result.validation.state).toBe("PENDING_VERIFICATION");
    expect(result.validation.verification_history_complete).toBe(false);
  });

  it("detects evidence reliability tampering during replay", () => {
    const result = analyzeEvidenceReliability({ scenario: "VERIFIED" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayEvidenceReliability(tampered)).toBe(false);
  });
});
