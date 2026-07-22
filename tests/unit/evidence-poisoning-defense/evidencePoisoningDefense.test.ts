import { describe, expect, it } from "vitest";
import {
  defendEvidenceIntegrity,
  getEvidencePoisoningFoundation,
  replayEvidencePoisoningDefense,
} from "@/services/evidence-poisoning-defense";
import type {
  EvidencePoisoningFailure,
  EvidencePoisoningScenario,
  EvidencePoisoningStatus,
} from "@/types/evidence-poisoning-defense";

describe("Mission Control Phase 10.12.7 Evidence Poisoning Defense", () => {
  it("publishes the evidence poisoning defense contract", () => {
    const foundation = getEvidencePoisoningFoundation();

    expect(foundation.evidence_poisoning_defense_version).toBe("evidence-poisoning-defense/v1");
    expect(foundation.api_surface.defend_evidence_integrity).toBe("POST /evidence-poisoning-defense/defend");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /evidence-poisoning-defense/baseline");
    expect(foundation.api_surface.retrieve_provenance_report).toBe("POST /evidence-poisoning-defense/provenance");
    expect(foundation.api_surface.retrieve_health_score).toBe("POST /evidence-poisoning-defense/health-score");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /evidence-poisoning-defense/contract");
    expect(foundation.api_surface.evidence_mutation_supported).toBe(false);
    expect(foundation.api_surface.learning_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.defense_identifier).toBe("EvidencePoisoningDefense");
    expect(foundation.result.status).toBe("PASS");
  });

  it("defends deterministically with stable replay and integrity hashes", () => {
    const first = defendEvidenceIntegrity();
    const second = defendEvidenceIntegrity();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.provenance_report.integrity_hash).toBe(second.provenance_report.integrity_hash);
    expect(first.consistency_report.integrity_hash).toBe(second.consistency_report.integrity_hash);
    expect(first.synthetic_report.integrity_hash).toBe(second.synthetic_report.integrity_hash);
    expect(first.quality_report.integrity_hash).toBe(second.quality_report.integrity_hash);
    expect(first.source_reliability_report.integrity_hash).toBe(second.source_reliability_report.integrity_hash);
    expect(first.health_score_report.integrity_hash).toBe(second.health_score_report.integrity_hash);
    expect(first.poisoning_assessment.integrity_hash).toBe(second.poisoning_assessment.integrity_hash);
    expect(first.source_reliability_impact.integrity_hash).toBe(second.source_reliability_impact.integrity_hash);
    expect(first.containment_decision.integrity_hash).toBe(second.containment_decision.integrity_hash);
    expect(first.poisoning_record.integrity_hash).toBe(second.poisoning_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayEvidencePoisoningDefense(first)).toBe(true);
  });

  it("maintains the authoritative evidence trust baseline", () => {
    const baseline = defendEvidenceIntegrity().baseline;

    expect(baseline.baseline_id).toBe("evidence_trust_baseline_v1");
    expect(baseline.evidence_policy_version).toBe("evidence-policy/v1");
    expect(baseline.trusted_sources).toEqual(expect.arrayContaining(["truth-ledger", "simulation-validation", "governance-audit"]));
    expect(baseline.source_classifications).toContain("authoritative");
    expect(baseline.quality_thresholds).toContain("fail_closed_unknown_origin");
    expect(baseline.provenance_requirements).toContain("chain_of_custody");
    expect(baseline.lineage_requirements).toContain("immutable_lineage");
    expect(baseline.governance_requirements).toContain("learning_exclusion_until_review");
    expect(baseline.constitutional_requirements).toContain("evidence_cannot_override_governance");
    expect(baseline.approval_reference).toBe("governance-approval:evidence-trust-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("validates provenance, consistency, synthetic evidence, quality, and source reliability in the baseline case", () => {
    const result = defendEvidenceIntegrity();

    expect(result.provenance_report.evidence_authenticity_assessment).toBe("authentic");
    expect(result.provenance_report.rejected_evidence_refs).toEqual([]);
    expect(result.consistency_report.contradiction_analysis).toContain("consistent");
    expect(result.synthetic_report.injection_assessment).toContain("No synthetic");
    expect(result.synthetic_report.automatic_blocks).toEqual([]);
    expect(result.quality_report.quality_trend_analysis).toContain("above policy");
    expect(result.source_reliability_report.reliability_trend_analysis).toContain("stable");
    expect(result.source_reliability_report.compromised_sources).toEqual([]);
  });

  it("generates health score, poisoning assessment, source impact, and containment decisions", () => {
    const result = defendEvidenceIntegrity();

    expect(result.health_score_report.evidence_health_score).toBe(0.97);
    expect(result.health_score_report.provenance_score).toBe(0.97);
    expect(result.poisoning_assessment.poisoning_detected).toBe(false);
    expect(result.poisoning_assessment.recommended_response).toBe("MONITOR");
    expect(result.source_reliability_impact.future_learning_eligibility).toBe("eligible");
    expect(result.containment_decision.containment_actions).toEqual(["monitor_evidence_integrity"]);
    expect(result.containment_decision.excluded_from_learning_refs).toEqual([]);
    expect(result.containment_decision.forensic_evidence_preserved).toBe(true);
    expect(result.containment_decision.fail_closed).toBe(false);
  });

  it("writes the canonical EvidencePoisoningRecord ledger entry", () => {
    const record = defendEvidenceIntegrity({ tenant_id: "tenant-alpha" }).poisoning_record;

    expect(record.poisoning_id).toMatch(/^evidence_poisoning_/);
    expect(record.tenant_id).toBe("tenant-alpha");
    expect(record.evidence_policy_version).toBe("evidence-policy/v1");
    expect(record.poisoning_type).toBe("EVIDENCE_POISONING");
    expect(record.evidence_health_score).toBe(0.97);
    expect(record.source_reliability_score).toBe(0.97);
    expect(record.severity).toBe("INFORMATIONAL");
    expect(record.affected_evidence_refs).toEqual([]);
    expect(record.affected_recommendations).toContain("recommendation:evidence-weighted");
    expect(record.supporting_evidence).toMatch(/[a-f0-9]{64}/);
    expect(record.recommended_response).toBe("MONITOR");
    expect(record.containment_required).toBe(false);
    expect(record.governance_impact).toBe("governance_preserved");
    expect(record.replay_refs).toContain("replay:evidence-poisoning-defense");
    expect(record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("preserves deterministic, replayable, governance, constitutional, tenant, advisory, and no-learning-authorization invariants", () => {
    const result = defendEvidenceIntegrity();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_learning).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_POLICY_CHANGE", "UNAUTHORIZED_POLICY_CHANGE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["UNKNOWN_SOURCE", "UNKNOWN_SOURCE_DETECTED", "QUARANTINED"],
    ["BROKEN_LINEAGE", "BROKEN_LINEAGE_DETECTED", "QUARANTINED"],
    ["MISSING_PROVENANCE", "MISSING_PROVENANCE_DETECTED", "QUARANTINED"],
    ["INVALID_SIGNATURE", "INVALID_SIGNATURE_DETECTED", "QUARANTINED"],
    ["TAMPERED_EVIDENCE", "TAMPERED_EVIDENCE_DETECTED", "QUARANTINED"],
    ["UNVERIFIABLE_ARTIFACT", "UNVERIFIABLE_ARTIFACT_DETECTED", "QUARANTINED"],
    ["FABRICATED_EVIDENCE", "FABRICATED_EVIDENCE_DETECTED", "QUARANTINED"],
    ["DUPLICATED_EVIDENCE", "DUPLICATED_EVIDENCE_DETECTED", "POISONING_DETECTED"],
    ["CONTRADICTORY_EVIDENCE", "CONTRADICTORY_EVIDENCE_DETECTED", "POISONING_DETECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED", "POISONING_DETECTED"],
    ["SOURCE_CORRUPTION", "SOURCE_CORRUPTION_DETECTED", "POISONING_DETECTED"],
    ["SYNTHETIC_DATA_INJECTION", "SYNTHETIC_DATA_INJECTION_DETECTED", "QUARANTINED"],
    ["LOW_QUALITY_CLUSTER", "LOW_QUALITY_EVIDENCE_CLUSTER", "POISONING_DETECTED"],
    ["ABNORMAL_GROWTH", "ABNORMAL_EVIDENCE_GROWTH", "POISONING_DETECTED"],
    ["INCOMPLETE_LINEAGE", "INCOMPLETE_EVIDENCE_LINEAGE", "POISONING_DETECTED"],
    ["REPLAY_MANIPULATION", "EVIDENCE_REPLAY_MANIPULATION", "POISONING_DETECTED"],
    ["COORDINATED_ATTACK", "COORDINATED_EVIDENCE_ATTACK", "POISONING_DETECTED"],
    ["STALE_EVIDENCE", "STALE_EVIDENCE_EXPLOITATION", "POISONING_DETECTED"],
    ["EVIDENCE_CONCENTRATION", "EVIDENCE_CONCENTRATION_ATTACK", "POISONING_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ASSESSMENT", "POISONING_DETECTED"],
    ["NONREPLAYABLE_VALIDATION", "NONREPLAYABLE_EVIDENCE_VALIDATION", "POISONING_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_EVIDENCE_BEHAVIOR", "FAIL_CLOSED"],
  ] as const)("classifies and replays %s", (scenario: EvidencePoisoningScenario, failure: EvidencePoisoningFailure, status: EvidencePoisoningStatus) => {
    const result = defendEvidenceIntegrity({ scenario });

    expect(result.status).toBe(status);
    expect(result.failures).toContain(failure);
    expect(result.poisoning_record.poisoning_type).toBe("EVIDENCE_POISONING");
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_learning).toBe(false);
    expect(replayEvidencePoisoningDefense(result)).toBe(true);
  });

  it("rejects unverifiable provenance before learning", () => {
    const unknown = defendEvidenceIntegrity({ scenario: "UNKNOWN_SOURCE" });
    const tampered = defendEvidenceIntegrity({ scenario: "TAMPERED_EVIDENCE" });

    expect(unknown.provenance_report.source_identity_valid).toBe(false);
    expect(unknown.provenance_report.rejected_evidence_refs).toContain("evidence:rejected-provenance");
    expect(unknown.containment_decision.excluded_from_learning_refs).toContain("evidence:rejected-provenance");
    expect(tampered.provenance_report.cryptographic_integrity_valid).toBe(false);
    expect(tampered.status).toBe("QUARANTINED");
  });

  it("blocks synthetic and fabricated evidence and isolates compromised sources", () => {
    const synthetic = defendEvidenceIntegrity({ scenario: "SYNTHETIC_DATA_INJECTION" });
    const fabricated = defendEvidenceIntegrity({ scenario: "FABRICATED_EVIDENCE" });
    const source = defendEvidenceIntegrity({ scenario: "SOURCE_CORRUPTION" });

    expect(synthetic.synthetic_report.synthetic_telemetry_detected).toBe(true);
    expect(synthetic.synthetic_report.automatic_blocks).toContain("block_synthetic_evidence");
    expect(fabricated.synthetic_report.fabricated_documents_detected).toBe(true);
    expect(source.source_reliability_report.compromised_sources).toContain("source:compromised-review");
    expect(source.containment_decision.isolated_sources).toContain("source:compromised-review");
  });

  it("detects contradictions, replay manipulation, and evidence quality attacks", () => {
    const contradiction = defendEvidenceIntegrity({ scenario: "CONTRADICTORY_EVIDENCE" });
    const replay = defendEvidenceIntegrity({ scenario: "REPLAY_MANIPULATION" });
    const quality = defendEvidenceIntegrity({ scenario: "LOW_QUALITY_CLUSTER" });

    expect(contradiction.consistency_report.detected_consistency_failures).toContain("CONTRADICTORY_EVIDENCE_DETECTED");
    expect(replay.poisoning_assessment.replay_impacts).toContain("replay_integrity_degraded");
    expect(quality.quality_report.detected_quality_failures).toContain("LOW_QUALITY_EVIDENCE_CLUSTER");
  });

  it("marks degraded determinism, replay, governance, constitutional, and tenant guarantees", () => {
    expect(defendEvidenceIntegrity({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    expect(defendEvidenceIntegrity({ scenario: "NONREPLAYABLE_VALIDATION" }).replayable).toBe(false);
    expect(defendEvidenceIntegrity({ scenario: "NONREPLAYABLE_VALIDATION" }).evidence_backed).toBe(false);
    expect(defendEvidenceIntegrity({ scenario: "UNAUTHORIZED_POLICY_CHANGE" }).governance_preserved).toBe(false);
    expect(defendEvidenceIntegrity({ scenario: "TENANT_BREACH" }).constitutional_preserved).toBe(false);
    expect(defendEvidenceIntegrity({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("detects nested evidence containment tampering", () => {
    const result = defendEvidenceIntegrity();
    const tampered = {
      ...result,
      containment_decision: {
        ...result.containment_decision,
        containment_actions: ["accept_poisoned_evidence"],
      },
    };

    expect(replayEvidencePoisoningDefense(tampered)).toBe(false);
  });
});
