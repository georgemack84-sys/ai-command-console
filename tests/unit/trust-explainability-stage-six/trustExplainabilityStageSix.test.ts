import { describe, expect, it } from "vitest";

import { getTrustExplainabilityStageSixBundle, replayTrustExplainabilityStageSix, runTrustExplainabilityStageSix, validateTrustExplainabilityStageSix } from "@/services/trust-explainability-stage-six";
import type { TrustExplainabilityFailure } from "@/types/trust-explainability-stage-six";

const conditionalFailures = ["EXPLAINABILITY_SERVICE_MISSING", "EXPLANATION_PIPELINE_MISSING", "EXPLANATION_MODEL_MISSING", "EXPLANATION_LIFECYCLE_MISSING", "EXPLANATION_APIS_MISSING", "REPLAY_INTEGRATION_MISSING", "EVIDENCE_INTEGRATION_MISSING", "CONSTITUTIONAL_INTEGRATION_MISSING", "DECISION_NARRATIVE_MISSING", "NARRATIVE_TIMELINE_MISSING", "NARRATIVE_TEMPLATES_MISSING", "NARRATIVE_REPLAY_FAILED", "EVIDENCE_MAPPING_MISSING", "EVIDENCE_REFERENCES_MISSING", "EVIDENCE_LINEAGE_MISSING", "EVIDENCE_PROVENANCE_MISSING", "MISSING_EVIDENCE_NOT_IDENTIFIED", "RULE_TRACE_MISSING", "CONSTITUTIONAL_RULE_TRACE_MISSING", "POLICY_RULE_TRACE_MISSING", "RESTRICTION_RULE_TRACE_MISSING", "RESOLUTION_RULE_TRACE_MISSING", "RULE_REPLAY_FAILED", "CONSTITUTIONAL_JUSTIFICATION_MISSING", "CONSTITUTIONAL_REFERENCES_INVALID", "AUTHORITY_MAPPING_MISSING", "CONSTITUTIONAL_DECISION_CHAIN_MISSING", "RESTRICTION_EXPLANATIONS_MISSING", "RESTRICTION_AUTHORITY_MISSING", "RESTRICTION_REMOVAL_CONDITIONS_MISSING", "ESCALATION_EXPLANATIONS_MISSING", "HUMAN_REVIEW_PACKAGE_MISSING", "ESCALATION_CONTEXT_INCOMPLETE", "EXPLANATION_PACKAGE_MISSING"] as const satisfies readonly TrustExplainabilityFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "NARRATIVE_NOT_DETERMINISTIC", "MUTABLE_EVIDENCE_REFERENCED", "RULE_ORDERING_NOT_DETERMINISTIC", "PACKAGE_NOT_DETERMINISTIC", "PACKAGE_NOT_REPLAYABLE", "PACKAGE_IMMUTABILITY_MISSING", "API_ACCESS_CONTROL_INVALID", "TENANT_ISOLATION_INVALID", "GOVERNANCE_BYPASS_ATTEMPTED", "UNEXPLAINED_TRUST_DECISION_PRODUCED"] as const satisfies readonly TrustExplainabilityFailure[];

describe("Stage 6 Trust Explainability", () => {
  it("publishes constitutional explainability doctrine", () => {
    const bundle = getTrustExplainabilityStageSixBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-explainability-stage-six/stage-6", constitutional_requirement: true, not_ui_feature: true, immutable_evidence_only: true, deterministic_explanations_required: true, every_decision_explained: true, replay_required: true, qualification_gate: "Stage 6 Explainability Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("TRUST_EXPLAINABILITY_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 5", () => {
    const first = runTrustExplainabilityStageSix({ seed: "deterministic" });
    const second = runTrustExplainabilityStageSix({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5"]);
    expect(first.provides).toContain("trust-explanation-packages");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustExplainabilityStageSix(first).valid).toBe(true);
    expect(replayTrustExplainabilityStageSix()).toBe(true);
  });

  it("establishes explainability architecture and deterministic narratives", () => {
    const result = runTrustExplainabilityStageSix();

    expect(result.architecture).toMatchObject({ explainability_service: true, explanation_pipeline: true, explanation_model: true, explanation_lifecycle: true, explanation_apis: true, replay_integration: true, evidence_integration: true, constitutional_integration: true, service_boundaries: true });
    expect(result.narrative).toMatchObject({ request: true, context: true, evidence: true, evaluation: true, resolution: true, restrictions: true, escalations: true, final_decision: true, decision_timeline: true, decision_summary: true, deterministic_wording: true, structured_narrative: true, replay_verified: true });
  });

  it("maps complete immutable evidence lineage and rejects mutable evidence", () => {
    const result = runTrustExplainabilityStageSix();

    expect(result.evidence_map).toMatchObject({ evidence_consumed: true, evidence_ignored: true, evidence_rejected: true, evidence_confidence: true, evidence_source: true, evidence_relationships: true, evidence_lineage: true, provenance: true, prioritization: true, supporting_evidence: true, contradictory_evidence: true, missing_evidence_identification: true, immutable_references: true });
    expect(runTrustExplainabilityStageSix({ scenario: "MUTABLE_EVIDENCE_REFERENCED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("traces every rule and constitutional justification", () => {
    const result = runTrustExplainabilityStageSix();

    expect(result.rule_trace).toMatchObject({ constitutional_rule_trace: true, trust_rule_trace: true, policy_rule_trace: true, restriction_rule_trace: true, resolution_rule_trace: true, rule_ordering: true, rule_dependencies: true, rule_outcomes: true, reasons: true, supporting_evidence: true, rule_precedence: true, final_impact: true, replay_verified: true });
    expect(result.constitutional).toMatchObject({ constitutional_references: true, constitutional_articles: true, constitutional_principles: true, constitutional_violations: true, constitutional_exceptions: true, authority_mapping: true, decision_chain: true, applicable_doctrine: true, governing_authority: true, constitutional_rationale: true, constitutional_evidence: true, constitutional_outcome: true });
  });

  it("explains restrictions and escalations for independent human review", () => {
    const result = runTrustExplainabilityStageSix();

    expect(result.restrictions).toMatchObject({ restriction_reasoning: true, restriction_evidence: true, restriction_policies: true, restriction_duration: true, restriction_scope: true, restriction_authority: true, restriction_alternatives: true, removal_conditions: true, constitutional_basis: true, policy_basis: true });
    expect(result.escalations).toMatchObject({ escalation_reasoning: true, escalation_evidence: true, trigger_mapping: true, human_oversight_requirements: true, outstanding_questions: true, reviewer_information: true, escalation_packages: true, automation_stop_reason: true, missing_evidence: true, conflicting_evidence: true, constitutional_ambiguity: true, policy_conflict: true, trust_uncertainty: true, risk_concerns: true });
  });

  it("assembles complete immutable explanation packages", () => {
    const result = runTrustExplainabilityStageSix();

    expect(result.package.sections).toEqual(["REQUEST", "DECISION", "NARRATIVE", "EVIDENCE_MAP", "RULE_TRACE", "CONSTITUTIONAL_JUSTIFICATION", "CONFIDENCE_SUMMARY", "RISK_SUMMARY", "ALIGNMENT_SUMMARY", "RESTRICTIONS", "ESCALATIONS", "FINAL_RESOLUTION"]);
    expect(result.package).toMatchObject({ composer: true, narrative_assembly: true, evidence_bundle: true, rule_bundle: true, constitutional_bundle: true, restriction_bundle: true, escalation_bundle: true, decision_summary: true, deterministic: true, replayable: true, immutable: true, exportable: true });
  });

  it("exposes governed tenant-isolated explainability APIs", () => {
    const result = runTrustExplainabilityStageSix();

    expect(result.apis).toMatchObject({ explanation_query_api: true, explanation_retrieval_api: true, narrative_api: true, evidence_api: true, rule_trace_api: true, constitutional_api: true, restriction_api: true, replay_api: true, access_control: true, tenant_isolation: true, governance_enforced: true });
    expect(runTrustExplainabilityStageSix({ scenario: "TENANT_ISOLATION_INVALID" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("prevents unexplained trust decisions", () => {
    const result = runTrustExplainabilityStageSix();

    expect(result.readiness).toMatchObject({ every_decision_explained: true, deterministic: true, replayable: true, immutable_package: true, evidence_backed_only: true, tenant_isolated: true, no_unexplained_decisions: true, qualification_ready: true });
    expect(runTrustExplainabilityStageSix({ scenario: "UNEXPLAINED_TRUST_DECISION_PRODUCED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustExplainabilityStageSix({ scenario: failure });
    const validation = validateTrustExplainabilityStageSix(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustExplainabilityStageSix({ scenario: failure });
    const validation = validateTrustExplainabilityStageSix(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustExplainabilityStageSix({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustExplainabilityStageSix({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustExplainabilityStageSix({ scenario: "TRUST_EXPLAINABILITY_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustExplainabilityStageSix(notQualified).valid).toBe(false);
  });
});
