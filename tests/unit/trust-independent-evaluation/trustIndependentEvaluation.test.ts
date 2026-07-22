import { describe, expect, it } from "vitest";

import { getTrustIndependentEvaluationBundle, replayTrustIndependentEvaluation, runTrustIndependentEvaluation, validateTrustIndependentEvaluation } from "@/services/trust-independent-evaluation";
import type { TrustIndependentEvaluationFailure } from "@/types/trust-independent-evaluation";

const conditionalFailures = ["CONFIDENCE_ENGINE_MISSING", "CONFIDENCE_PIPELINE_MISSING", "CONFIDENCE_REGISTRY_MISSING", "CONFIDENCE_CONTRACTS_MISSING", "CONFIDENCE_MODELS_MISSING", "EVIDENCE_CONFIDENCE_SERVICE_MISSING", "CONFIDENCE_SCORING_MISSING", "CONFIDENCE_REPLAY_MISSING", "RISK_ENGINE_MISSING", "RISK_REGISTRY_MISSING", "RISK_CONTRACTS_MISSING", "RISK_PIPELINE_MISSING", "OPERATIONAL_RISK_MISSING", "BEHAVIORAL_RISK_MISSING", "POLICY_RISK_MISSING", "CONSTITUTIONAL_RISK_MISSING", "RISK_REPLAY_MISSING", "ALIGNMENT_ENGINE_MISSING", "ALIGNMENT_REGISTRY_MISSING", "ALIGNMENT_CONTRACTS_MISSING", "ALIGNMENT_PIPELINE_MISSING", "GOAL_ALIGNMENT_MISSING", "BEHAVIORAL_ALIGNMENT_MISSING", "CONSTITUTIONAL_ALIGNMENT_MISSING", "POLICY_ALIGNMENT_MISSING", "ALIGNMENT_REPLAY_MISSING"] as const satisfies readonly TrustIndependentEvaluationFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "IMMUTABLE_EVIDENCE_MISSING", "CONSTITUTIONAL_DECISION_RECORDS_MISSING", "EVALUATOR_OUTPUT_CROSS_CONSUMED", "CONFIDENCE_CONSUMES_RISK", "CONFIDENCE_CONSUMES_ALIGNMENT", "RISK_CONSUMES_CONFIDENCE", "RISK_CONSUMES_ALIGNMENT", "ALIGNMENT_CONSUMES_CONFIDENCE", "ALIGNMENT_CONSUMES_RISK", "CIRCULAR_EVALUATION_DEPENDENCY", "EVIDENCE_NOT_IMMUTABLE", "EVALUATION_NOT_DETERMINISTIC", "EVALUATION_NOT_REPLAYABLE", "ASSESSMENT_NOT_EXPLAINABLE", "MODEL_INDEPENDENCE_INVALID", "CONSTITUTIONAL_COMPLIANCE_BROKEN", "TRUST_DECISION_ENGINE_PREMATURE_COMBINATION"] as const satisfies readonly TrustIndependentEvaluationFailure[];

describe("Stage 4 Independent Trust Evaluation", () => {
  it("publishes the independent evaluation doctrine", () => {
    const bundle = getTrustIndependentEvaluationBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-independent-evaluation/stage-4", independent_evaluators: true, immutable_evidence_only: true, confidence_risk_alignment_separated: true, no_evaluator_cross_consumption: true, deterministic_replay_required: true, explainability_required: true, qualification_gate: "Stage 4 Independent Trust Evaluation Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("INDEPENDENT_EVALUATION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Stages 1 through 3 plus immutable evidence", () => {
    const first = runTrustIndependentEvaluation({ seed: "deterministic" });
    const second = runTrustIndependentEvaluation({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "immutable-trust-evidence", "constitutional-decision-records"]);
    expect(first.provides).toContain("stage-5:trust-decision-engine");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustIndependentEvaluation(first).valid).toBe(true);
    expect(replayTrustIndependentEvaluation()).toBe(true);
  });

  it("consumes immutable evidence and constitutional decision records only", () => {
    const result = runTrustIndependentEvaluation();

    expect(result.evidence).toMatchObject({ immutable_evidence_consumed: true, constitutional_decision_records: true, evidence_interfaces: true, replay_interfaces: true, traceability_records: true, explanation_services: true, no_mutable_evidence: true });
    expect(runTrustIndependentEvaluation({ scenario: "EVIDENCE_NOT_IMMUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("qualifies confidence models from evidence quality without risk or alignment outputs", () => {
    const result = runTrustIndependentEvaluation();

    expect(result.confidence.models).toEqual(["EVIDENCE_COMPLETENESS", "EVIDENCE_FRESHNESS", "EVIDENCE_CONSISTENCY", "SOURCE_RELIABILITY", "PROVENANCE_QUALITY", "TEMPORAL_CONFIDENCE", "COMPOSITE_CONFIDENCE"]);
    expect(result.confidence).toMatchObject({ pipeline: true, registry: true, contracts: true, evidence_validation: true, provenance_verification: true, chain_of_custody_validation: true, integrity_verification: true, deterministic_scoring: true, threshold_evaluation: true, trend_analysis: true, explanation: true, consumes_only_evidence_quality: true, consumes_risk_output: false, consumes_alignment_output: false });
  });

  it("qualifies independent operational, behavioral, policy, and constitutional risk", () => {
    const result = runTrustIndependentEvaluation();

    expect(result.risk.domains).toEqual(["OPERATIONAL", "BEHAVIORAL", "POLICY", "CONSTITUTIONAL"]);
    expect(result.risk).toMatchObject({ operational_risk: true, behavioral_risk: true, policy_risk: true, constitutional_risk: true, failure_impact_analysis: true, drift_indicators: true, policy_conflict_analysis: true, constitutional_threat_analysis: true, deterministic_assessment: true, explanation: true, consumes_confidence_output: false, consumes_alignment_output: false });
  });

  it("qualifies independent goal, behavioral, constitutional, and policy alignment", () => {
    const result = runTrustIndependentEvaluation();

    expect(result.alignment.domains).toEqual(["GOAL", "BEHAVIORAL", "CONSTITUTIONAL", "POLICY"]);
    expect(result.alignment).toMatchObject({ goal_alignment: true, behavioral_alignment: true, constitutional_alignment: true, policy_alignment: true, objective_matching: true, intent_consistency: true, governance_alignment: true, authority_alignment: true, rule_mapping: true, evidence_traceability: true, deterministic_assessment: true, explanation: true, consumes_confidence_output: false, consumes_risk_output: false });
  });

  it("produces explainable reports, replay records, and traceability records", () => {
    const result = runTrustIndependentEvaluation();

    expect(result.reports).toMatchObject({ confidence_evidence: true, risk_evidence: true, alignment_evidence: true, evaluation_reports: true, replay_records: true, traceability_records: true, explainable_results: true, reproducible_outputs: true });
  });

  it("fails closed when evaluators consume each other's outputs or combine prematurely", () => {
    expect(runTrustIndependentEvaluation({ scenario: "CONFIDENCE_CONSUMES_RISK" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustIndependentEvaluation({ scenario: "RISK_CONSUMES_ALIGNMENT" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustIndependentEvaluation({ scenario: "ALIGNMENT_CONSUMES_CONFIDENCE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustIndependentEvaluation({ scenario: "TRUST_DECISION_ENGINE_PREMATURE_COMBINATION" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("qualifies only when independent, deterministic, replayable, and explainable", () => {
    const result = runTrustIndependentEvaluation();

    expect(result.readiness).toMatchObject({ independent_evidence_consumption: true, evaluator_independence: true, no_cross_consumption: true, no_circular_dependencies: true, deterministic: true, replayable: true, explainable: true, constitutional_compliance_preserved: true, decision_engine_integration_ready: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustIndependentEvaluation({ scenario: failure });
    const validation = validateTrustIndependentEvaluation(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustIndependentEvaluation({ scenario: failure });
    const validation = validateTrustIndependentEvaluation(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustIndependentEvaluation({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustIndependentEvaluation({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustIndependentEvaluation({ scenario: "INDEPENDENT_EVALUATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustIndependentEvaluation(notQualified).valid).toBe(false);
  });
});
