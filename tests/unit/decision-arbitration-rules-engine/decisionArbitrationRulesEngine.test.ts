import { describe, expect, it } from "vitest";
import {
  ARBITRATION_PRIORITY_HIERARCHY,
  buildArbitrationObservability,
  arbitrateClassifiedConflicts,
  arbitrateClassification,
  computeArbitrationIntegrityHash,
  createArbitrationRules,
  getArbitrationRulesEngineFoundation,
  replayArbitrationRulesEngine,
  validateArbitration,
} from "@/services/decision-arbitration-rules-engine";
import { classifyDetectedConflict, classifyDetectedConflicts, generateConflictClassificationReport } from "@/services/decision-conflict-classification-engine";
import { registerConflict } from "@/services/decision-conflict-detection-contract";

describe("Mission Control Phase 9.6.4 Arbitration Rules Engine", () => {
  it("loads certified deterministic arbitration rules in canonical priority order", () => {
    const rules = createArbitrationRules();

    expect(rules.map((rule) => rule.priority_level)).toEqual(ARBITRATION_PRIORITY_HIERARCHY);
    expect(rules.map((rule) => rule.evaluation_order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(rules.every((rule) => rule.integrity_hash.match(/^[a-f0-9]{64}$/))).toBe(true);
  });

  it("publishes the arbitration foundation with supported outcomes and replay", () => {
    const foundation = getArbitrationRulesEngineFoundation();

    expect(foundation.engine_version).toBe("arbitration-rules-engine/v1");
    expect(foundation.priority_hierarchy[0]).toBe("Constitution");
    expect(foundation.supported_outcomes).toContain("REQUIRE_CERTIFICATION");
    expect(foundation.result.arbitration_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("applies constitutional precedence and rejects before lower-priority rules", () => {
    const conflict = registerConflict({
      conflict_category: "Constitutional",
      constitutional_refs: ["constitutional_violation_operator_supremacy"],
    });
    const rejectedConflict = registerConflict({ conflict_category: "Constitutional" }).conflict!;
    const classification = {
      ...classifyDetectedConflict(rejectedConflict),
      primary_category: "Constitutional" as const,
      constitutional_impact: "BLOCKING" as const,
      severity: "BLOCKING" as const,
      severity_score: 100,
    };
    const arbitration = arbitrateClassification(classification, undefined);

    expect(conflict.registration_status).toBe("REJECTED");
    expect(arbitration.arbitration_outcome).toBe("REJECT");
    expect(arbitration.resolution_priority_path).toEqual(["Constitution"]);
    expect(arbitration.rejected_candidate_refs).toEqual([classification.conflict_id]);
  });

  it("enforces governance and authority precedence over lower-priority outcomes", () => {
    const governance = classifyDetectedConflict(registerConflict({ conflict_category: "Governance" }).conflict!);
    const authority = {
      ...classifyDetectedConflict(registerConflict({ conflict_category: "Authority", governance_refs: ["policy_neutral"] }).conflict!),
      primary_category: "Authority" as const,
      governance_impact: "NONE" as const,
    };

    const governanceArbitration = arbitrateClassification(governance, undefined);
    const authorityArbitration = arbitrateClassification(authority, undefined);

    expect(governanceArbitration.arbitration_outcome).toBe("ESCALATE_TO_GOVERNANCE");
    expect(governanceArbitration.resolution_priority_path).toEqual(["Constitution", "Governance"]);
    expect(authorityArbitration.arbitration_outcome).toBe("ESCALATE_TO_OPERATOR");
    expect(authorityArbitration.resolution_priority_path).toEqual(["Constitution", "Governance", "Authority"]);
  });

  it("detects certification, simulation, mission tradeoff, and resolved outcomes deterministically", () => {
    const base = classifyDetectedConflict(registerConflict({ conflict_category: "Recommendation", governance_refs: ["governance_ok"], policy_refs: ["policy_ok"], confidence_refs: [] }).conflict!);
    const certification = { ...base, primary_category: "Certification" as const, secondary_categories: [], governance_impact: "NONE" as const, operator_visibility: "STANDARD" as const };
    const forecast = { ...base, primary_category: "Forecast" as const, secondary_categories: ["Confidence"] as const, governance_impact: "NONE" as const, operator_visibility: "STANDARD" as const, severity: "MEDIUM" as const, severity_score: 40 };
    const mission = { ...base, primary_category: "Mission Objective" as const, secondary_categories: [] as const, governance_impact: "NONE" as const, operator_visibility: "STANDARD" as const, severity: "MEDIUM" as const, severity_score: 40 };
    const resolved = { ...base, primary_category: "Recommendation" as const, secondary_categories: [] as const, governance_impact: "NONE" as const, operator_visibility: "STANDARD" as const, severity: "MEDIUM" as const, severity_score: 40 };

    expect(arbitrateClassification(certification, undefined).arbitration_outcome).toBe("REQUIRE_CERTIFICATION");
    expect(arbitrateClassification(forecast, undefined).arbitration_outcome).toBe("REQUIRE_SIMULATION");
    expect(arbitrateClassification(mission, undefined).arbitration_outcome).toBe("SPLIT_DECISION");
    expect(arbitrateClassification(resolved, undefined).arbitration_outcome).toBe("RESOLVED");
  });

  it("generates complete immutable arbitration records and ledger entries from classification results", () => {
    const classificationResult = classifyDetectedConflicts();
    const result = arbitrateClassifiedConflicts({ classification_result: classificationResult });

    expect(result.arbitration_status).toBe("PASS");
    expect(result.arbitrations).toHaveLength(classificationResult.classifications.length);
    expect(result.arbitrations.every((arbitration) => arbitration.integrity_hash === computeArbitrationIntegrityHash(arbitration))).toBe(true);
    expect(result.ledger_records).toHaveLength(result.arbitrations.length);
    expect(result.validations.every((validation) => validation.validation_state === "VALID")).toBe(true);
  });

  it("preserves originating candidates from classification reports", () => {
    const conflict = registerConflict({ candidate_refs: ["candidate_a", "candidate_b"] }).conflict!;
    const classification = classifyDetectedConflict(conflict);
    const report = generateConflictClassificationReport(conflict, classification);
    const arbitration = arbitrateClassification(classification, report);

    expect(arbitration.evaluated_candidates).toEqual(["candidate_a", "candidate_b"]);
    expect(arbitration.governance_summary).toContain("Governance");
    expect(arbitration.constitutional_summary).toContain("Constitutional");
  });

  it("fails closed for missing rules, invalid priority ordering, unauthorized execution, unsupported outcomes, and replay mismatch", () => {
    const valid = arbitrateClassifiedConflicts();
    const unauthorized = arbitrateClassifiedConflicts({ authorized_component: "unknown" });
    const noRules = arbitrateClassifiedConflicts({ rules: [] });
    const badRules = createArbitrationRules().map((rule) => rule.priority_level === "Governance" ? { ...rule, evaluation_order: 7 } : rule);
    const replayMismatch = arbitrateClassifiedConflicts({ replay_expected_hash: `${valid.replay_hash}_wrong` });
    const classification = classifyDetectedConflicts().classifications[0];
    const arbitration = { ...valid.arbitrations[0], arbitration_outcome: "UNSUPPORTED" as never };

    expect(unauthorized.failures).toContain("UNAUTHORIZED_RULE_EXECUTION");
    expect(noRules.failures).toContain("MISSING_ARBITRATION_RULES");
    expect(arbitrateClassifiedConflicts({ rules: badRules }).failures).toContain("INVALID_PRIORITY_ORDERING");
    expect(replayMismatch.failures).toContain("REPLAY_CORRUPTION");
    expect(validateArbitration(classification, arbitration).failures).toContain("UNSUPPORTED_ARBITRATION_OUTCOME");
  });

  it("replays identical arbitration outcomes and detects replay drift", () => {
    const result = arbitrateClassifiedConflicts();
    const replay = replayArbitrationRulesEngine(result);
    const tampered = replayArbitrationRulesEngine({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.arbitration_refs).toEqual(result.arbitrations.map((arbitration) => arbitration.arbitration_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_CORRUPTION");
  });

  it("publishes arbitration observability metrics", () => {
    const result = arbitrateClassifiedConflicts();
    const metrics = buildArbitrationObservability(result);

    expect(metrics.arbitrations_executed).toBe(result.arbitrations.length);
    expect(metrics.rules_executed).toBeGreaterThan(0);
    expect(metrics.governance_escalations).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.validation_failures).toBe(0);
    expect(metrics.integrity_failures).toBe(0);
  });
});
