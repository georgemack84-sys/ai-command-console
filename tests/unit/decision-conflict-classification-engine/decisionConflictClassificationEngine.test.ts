import { describe, expect, it } from "vitest";
import {
  buildConflictClassificationObservability,
  calculateConflictClassificationSeverity,
  classifyDetectedConflict,
  classifyDetectedConflicts,
  computeConflictClassificationIntegrityHash,
  determinePrimaryConflictCategory,
  determineSecondaryConflictCategories,
  generateConflictClassificationReport,
  getConflictClassificationEngineFoundation,
  replayConflictClassification,
  validateConflictClassification,
} from "@/services/decision-conflict-classification-engine";
import { computeConflictRecordIntegrityHash, registerConflict } from "@/services/decision-conflict-detection-contract";
import { createConflictDetectionCandidate, detectDecisionCandidateConflicts } from "@/services/decision-conflict-detection-engine";

describe("Mission Control Phase 9.6.3 Conflict Classification Engine", () => {
  it("publishes the classification foundation with deterministic category priority", () => {
    const foundation = getConflictClassificationEngineFoundation();

    expect(foundation.engine_version).toBe("conflict-classification-engine/v1");
    expect(foundation.category_priority[0]).toBe("Constitutional");
    expect(foundation.category_priority.at(-1)).toBe("Recommendation");
    expect(foundation.result.classification_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("chooses the highest-priority primary category and stable secondary categories", () => {
    const conflict = registerConflict({
      conflict_category: "Recommendation",
      governance_refs: ["governance_policy_binding"],
      authority_refs: ["authority_overlap_review"],
      certification_refs: ["certification_dependency"],
      risk_refs: ["risk_high"],
    }).conflict!;

    expect(determinePrimaryConflictCategory(conflict)).toBe("Governance");
    expect(determineSecondaryConflictCategories(conflict)).toEqual(["Authority", "Certification", "Risk", "Confidence", "Evidence", "Recommendation"]);
  });

  it("calculates deterministic severity including blocking constraints", () => {
    const recommendation = registerConflict({ conflict_category: "Recommendation" }).conflict!;
    const governance = registerConflict({ conflict_category: "Governance" }).conflict!;
    const certification = registerConflict({ conflict_category: "Certification", certification_refs: ["certification_blocked_dependency"] }).conflict!;
    const tenant = registerConflict({ conflict_category: "Tenant Boundary", evidence_refs: ["evidence_tenant_beta_leak"], tenant_id: "tenant_beta" }).conflict!;

    expect(calculateConflictClassificationSeverity(recommendation)).toBe("CRITICAL");
    expect(calculateConflictClassificationSeverity(governance)).toBe("CRITICAL");
    expect(calculateConflictClassificationSeverity(certification)).toBe("BLOCKING");
    expect(calculateConflictClassificationSeverity(tenant)).toBe("BLOCKING");
  });

  it("classifies detected engine conflicts into immutable operator-visible records and reports", () => {
    const left = createConflictDetectionCandidate({ candidate_id: "left", proposed_action: "shutdown subsystem", policy_refs: ["policy_allow_shutdown"] });
    const right = createConflictDetectionCandidate({ candidate_id: "right", proposed_action: "continue subsystem", policy_refs: ["policy_deny_shutdown"] });
    const detection = detectDecisionCandidateConflicts({ candidates: [left, right] });
    const result = classifyDetectedConflicts({ detection_result: detection });

    expect(result.classification_status).toBe("PASS");
    expect(result.classifications.length).toBeGreaterThan(0);
    expect(result.classifications.every((classification) => classification.advisory_only)).toBe(true);
    expect(result.classifications.every((classification) => classification.integrity_hash === computeConflictClassificationIntegrityHash(classification))).toBe(true);
    expect(result.reports).toHaveLength(result.classifications.length);
    expect(result.ledger_records).toHaveLength(result.classifications.length);
  });

  it("generates complete deterministic classification reports", () => {
    const conflict = registerConflict({ conflict_category: "Authority" }).conflict!;
    const classification = classifyDetectedConflict(conflict);
    const report = generateConflictClassificationReport(conflict, classification);

    expect(report.conflict_id).toBe(conflict.conflict_id);
    expect(report.primary_category).toBe(classification.primary_category);
    expect(report.severity).toBe(classification.severity);
    expect(report.evidence_summary).toContain("evidence reference");
    expect(report.governance_summary).toContain("governance reference");
    expect(report.constitutional_evaluation).toContain("constitutional reference");
    expect(report.integrity_verified).toBe(true);
  });

  it("fails closed for missing governance, missing constitutional metadata, tampering, and advisory-only violations", () => {
    const valid = registerConflict().conflict!;
    const classification = classifyDetectedConflict(valid);
    const missingGovernance = { ...valid, governance_refs: [], integrity_hash: computeConflictRecordIntegrityHash({ ...valid, governance_refs: [] }) };
    const missingConstitutional = { ...valid, constitutional_refs: [], integrity_hash: computeConflictRecordIntegrityHash({ ...valid, constitutional_refs: [] }) };
    const tampered = { ...classification, severity_score: 1 };
    const autonomous = { ...classification, advisory_only: false as true };

    expect(validateConflictClassification(missingGovernance, classifyDetectedConflict(missingGovernance)).failures).toContain("MISSING_GOVERNANCE_REFERENCES");
    expect(validateConflictClassification(missingConstitutional, classifyDetectedConflict(missingConstitutional)).failures).toContain("MISSING_CONSTITUTIONAL_METADATA");
    expect(validateConflictClassification(valid, tampered).failures).toContain("INVALID_SEVERITY");
    expect(validateConflictClassification(valid, autonomous).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("fails closed for unauthorized access, replay mismatch, and no conflicts", () => {
    const valid = classifyDetectedConflicts();
    const unauthorized = classifyDetectedConflicts({ authorized_component: "unknown" });
    const replayMismatch = classifyDetectedConflicts({ replay_expected_hash: `${valid.replay_hash}_wrong` });
    const empty = classifyDetectedConflicts({ conflicts: [] });

    expect(unauthorized.classification_status).toBe("FAIL");
    expect(unauthorized.failures).toContain("UNAUTHORIZED_COMPONENT");
    expect(replayMismatch.failures).toContain("REPLAY_CORRUPTION");
    expect(empty.failures).toContain("NO_CONFLICTS");
  });

  it("replays identical classification selections, reports, and ledger records", () => {
    const result = classifyDetectedConflicts();
    const replay = replayConflictClassification(result);
    const tampered = replayConflictClassification({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.classification_refs).toEqual(result.classifications.map((classification) => classification.classification_id));
    expect(replay.report_refs).toEqual(result.reports.map((report) => report.report_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_CORRUPTION");
  });

  it("publishes observability for category, severity, replay, validation, and integrity outcomes", () => {
    const result = classifyDetectedConflicts();
    const metrics = buildConflictClassificationObservability(result);

    expect(metrics.conflicts_classified).toBe(result.classifications.length);
    expect(metrics.classifications_by_category.Governance).toBeGreaterThan(0);
    expect(metrics.classifications_by_severity.CRITICAL + metrics.classifications_by_severity.BLOCKING).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.validation_failures).toBe(0);
    expect(metrics.integrity_failures).toBe(0);
  });
});
