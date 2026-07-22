import { describe, expect, it } from "vitest";
import {
  certifyPatternIntelligence,
  getPatternIntelligenceCertificationFoundation,
  replayPatternIntelligenceCertification,
} from "@/services/pattern-intelligence-certification-gate";
import type { PatternCertificationFailure, PatternCertificationScenario } from "@/types/pattern-intelligence-certification-gate";

describe("Mission Control Phase 10.4.10 Pattern Intelligence Certification Gate", () => {
  it("publishes the pattern intelligence certification foundation", () => {
    const foundation = getPatternIntelligenceCertificationFoundation();

    expect(foundation.pattern_intelligence_certification_gate_version).toBe("pattern-intelligence-certification-gate/v1");
    expect(foundation.api_surface.execute_certification).toBe("POST /pattern-intelligence-certification-gate/certify");
    expect(foundation.result.certification_record.certification_state).toBe("PASS");
  });

  it("certifies the full Phase 10.4 pipeline with a production PASS", () => {
    const result = certifyPatternIntelligence();

    expect(result.certification_record.certification_state).toBe("PASS");
    expect(result.certification_record.production_readiness_result).toBe("PASS");
    expect(result.certification_record.failed_tests).toEqual([]);
    expect(result.adaptive_consumption_allowed).toBe(true);
    expect(result.production_readiness_report.status).toBe("PASS");
  });

  it("records every phase result in the certification record", () => {
    const record = certifyPatternIntelligence().certification_record;

    expect(record.contract_validation_result).toBe("PASS");
    expect(record.candidate_generation_result).toBe("PASS");
    expect(record.detection_result).toBe("PASS");
    expect(record.validation_result).toBe("PASS");
    expect(record.scoring_result).toBe("PASS");
    expect(record.governance_result).toBe("PASS");
    expect(record.ledger_result).toBe("PASS");
    expect(record.replay_result).toBe("PASS");
    expect(record.dashboard_result).toBe("PASS");
  });

  it("verifies determinism, replay, governance, constitutional, integrity, tenant, and explainability reports", () => {
    const result = certifyPatternIntelligence();

    expect(result.determinism_report.status).toBe("PASS");
    expect(result.replay_report.status).toBe("PASS");
    expect(result.governance_report.status).toBe("PASS");
    expect(result.constitutional_report.status).toBe("PASS");
    expect(result.integrity_report.status).toBe("PASS");
    expect(result.tenant_isolation_report.status).toBe("PASS");
    expect(result.explainability_report.status).toBe("PASS");
  });

  it("keeps certification advisory-only and blocks adaptive consumption without a full PASS", () => {
    const conditional = certifyPatternIntelligence({ scenario: "CONDITIONAL_GAP" });

    expect(conditional.certification_record.certification_state).toBe("CONDITIONAL_PASS");
    expect(conditional.adaptive_consumption_allowed).toBe(false);
    expect(conditional.production_readiness_report.status).toBe("FAIL");
    expect(conditional.certification_record.failed_tests).toContain("CONDITIONAL_GAP_REMAINING");
    expect(conditional.advisory_only).toBe(true);
    expect(conditional.autonomous_execution).toBe(false);
  });

  it("replays certification reports deterministically", () => {
    const first = certifyPatternIntelligence();
    const second = certifyPatternIntelligence();

    expect(first.certification_record.certification_id).toBe(second.certification_record.certification_id);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayPatternIntelligenceCertification(first)).toBe(true);
  });

  it.each([
    ["CONTRACT_FAILURE", "CONTRACT_VALIDATION_FAILED"],
    ["CANDIDATE_FAILURE", "CANDIDATE_GENERATION_FAILED"],
    ["DETECTION_FAILURE", "DETECTION_FAILED"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILED"],
    ["SCORING_FAILURE", "SCORING_FAILED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_FAILED"],
    ["LEDGER_FAILURE", "LEDGER_FAILED"],
    ["REPLAY_FAILURE", "REPLAY_FAILED"],
    ["DASHBOARD_FAILURE", "DASHBOARD_FAILED"],
    ["DETERMINISM_FAILURE", "DETERMINISM_FAILED"],
    ["INSUFFICIENT_EVIDENCE", "EVIDENCE_INSUFFICIENT"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["HASH_MISMATCH", "INTEGRITY_FAILURE"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["CROSS_TENANT", "TENANT_ISOLATION_BREACH"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION"],
    ["INCOMPLETE_EXPLAINABILITY", "EXPLAINABILITY_INCOMPLETE"],
    ["MISSING_OPERATOR_VISIBILITY", "OPERATOR_VISIBILITY_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternCertificationScenario, PatternCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = certifyPatternIntelligence({ scenario });

    expect(result.certification_record.certification_state).toBe("FAIL");
    expect(result.certification_record.failed_tests).toContain(failure);
    expect(result.adaptive_consumption_allowed).toBe(false);
    expect(result.certification_record.production_readiness_result).toBe("FAIL");
    expect(result.fail_closed).toBe(true);
  });

  it("detects certification tampering during replay", () => {
    const result = certifyPatternIntelligence();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPatternIntelligenceCertification(tampered)).toBe(false);
  });
});
