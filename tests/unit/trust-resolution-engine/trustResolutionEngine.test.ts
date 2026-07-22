import { describe, expect, it } from "vitest";

import { getTrustResolutionEngineBundle, replayTrustResolutionEngine, runTrustResolutionEngine, validateTrustResolutionEngine } from "@/services/trust-resolution-engine";
import type { TrustResolutionFailure } from "@/types/trust-resolution-engine";

const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "UNQUALIFIED_EVALUATION_EVIDENCE_USED", "RESOLUTION_RULE_REGISTRY_MISSING", "RESOLUTION_RULE_MODEL_MISSING", "RESOLUTION_ORDERING_INVALID", "RULE_VERSIONING_MISSING", "CONSTITUTIONAL_PRECEDENCE_BYPASSED", "RULE_CONFLICTS_PRESENT", "RULE_CERTIFICATION_MISSING", "DECISION_COMPOSITION_MISSING", "EVIDENCE_AGGREGATION_MISSING", "TRUST_CONTEXT_BUILDER_MISSING", "EVALUATION_CORRELATION_MISSING", "EVIDENCE_COMPLETENESS_INVALID", "STANDING_RESOLUTION_MISSING", "STANDING_PRIORITY_MATRIX_MISSING", "STANDING_RESTRICTIONS_MISSING", "STANDING_CONSISTENCY_INVALID", "RESTRICTION_RESOLUTION_MISSING", "RESTRICTION_PRECEDENCE_MISSING", "RESTRICTION_CONFLICT_RESOLUTION_MISSING", "RESTRICTIONS_RELAXED", "ESCALATION_LOGIC_MISSING", "HUMAN_OVERSIGHT_TRIGGERS_MISSING", "PENDING_DECISION_GENERATION_MISSING", "ESCALATION_LINEAGE_MISSING", "FINAL_DECISION_RESOLVER_MISSING", "OUTCOME_PRIORITY_MATRIX_MISSING", "DECISION_NORMALIZATION_MISSING", "DECISION_VALIDATION_MISSING", "CONSTITUTIONAL_OVERRIDE_ALLOWED", "MULTIPLE_AUTHORITATIVE_DECISIONS", "DECISION_LINEAGE_MISSING", "EVIDENCE_REFERENCES_MISSING", "REPLAY_REFERENCES_MISSING", "IMMUTABLE_DECISION_RECORDS_MISSING", "LINEAGE_NOT_TRACEABLE", "RESOLUTION_NOT_DETERMINISTIC", "RESOLUTION_NOT_REPLAYABLE", "DECISION_NOT_EXPLAINABLE"] as const satisfies readonly TrustResolutionFailure[];

describe("Stage 5 Trust Resolution Engine", () => {
  it("publishes the sole authoritative resolution doctrine", () => {
    const bundle = getTrustResolutionEngineBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-resolution-engine/stage-5", sole_authoritative_resolution_engine: true, never_performs_evaluation: true, constitutional_precedence_terminal: true, exactly_one_decision_required: true, deterministic_replay_required: true, immutable_lineage_required: true, qualification_gate: "Stage 5 Trust Resolution Engine Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("TRUST_RESOLUTION_QUALIFIED");
    expect(bundle.result.readiness.outcome).toBe("ALLOW");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 4", () => {
    const first = runTrustResolutionEngine({ seed: "deterministic" });
    const second = runTrustResolutionEngine({ seed: "deterministic" });

    expect(first.upstream_refs).toContain("trust-independent-evaluation/stage-4");
    expect(first.provides).toEqual(["authoritative-trust-decisions", "decision-evidence", "decision-lineage", "replay"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustResolutionEngine(first).valid).toBe(true);
    expect(replayTrustResolutionEngine()).toBe(true);
  });

  it("finalizes deterministic resolution rules with constitutional precedence", () => {
    const result = runTrustResolutionEngine();

    expect(result.rules.rules).toEqual(["FAIL_CLOSED_TERMINAL", "DENY_TERMINAL", "ESCALATE_PENDING", "RESTRICTIONS_PRESERVED", "ALLOW_ONLY_WHEN_SATISFIED", "CONSTITUTIONAL_ADMISSIBILITY_FIRST"]);
    expect(result.rules).toMatchObject({ rule_model: true, resolution_ordering: true, rule_versioning: true, constitutional_precedence: true, rule_validation: true, rule_certification: true, conflicts_eliminated: true });
  });

  it("composes only qualified independent evaluation evidence", () => {
    const result = runTrustResolutionEngine();

    expect(result.composition).toMatchObject({ input_aggregator: true, evidence_aggregation: true, trust_context_builder: true, evaluation_correlation: true, composition_model: true, evidence_completeness_validation: true, qualified_independent_evidence_only: true, missing_evidence_deterministic: true });
    expect(runTrustResolutionEngine({ scenario: "UNQUALIFIED_EVALUATION_EVIDENCE_USED" }).readiness.outcome).toBe("FAIL_CLOSED");
  });

  it("resolves standing, restrictions, and escalation deterministically", () => {
    const result = runTrustResolutionEngine();

    expect(result.standing).toMatchObject({ standing_rules: true, priority_matrix: true, standing_restrictions: true, standing_validation: true, standing_consistency_checks: true, deterministic_resolution: true, replay_verified: true });
    expect(result.restrictions).toMatchObject({ restriction_aggregation: true, restriction_intersection: true, restriction_precedence: true, conflict_resolution: true, restriction_evidence: true, restrictions_preserved: true, deterministic_replay: true });
    expect(result.escalation).toMatchObject({ escalation_rules: true, escalation_thresholds: true, human_oversight_triggers: true, pending_decision_generation: true, oversight_evidence: true, escalation_lineage: true, deterministic_escalation: true, no_executable_authorization_until_terminal: true });
  });

  it("produces exactly one authoritative final decision", () => {
    const result = runTrustResolutionEngine();

    expect(result.final).toMatchObject({ outcome: "ALLOW", outcome_priority_matrix: true, decision_normalization: true, decision_validation: true, constitutional_override_enforcement: true, decision_certification: true, single_authoritative_decision: true, fail_closed_terminal: true, deny_terminal: true, escalate_pending: true, allow_with_restrictions_preserved: true, allow_only_when_satisfied: true });
    expect(runTrustResolutionEngine({ scenario: "MULTIPLE_AUTHORITATIVE_DECISIONS" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("preserves complete immutable decision lineage", () => {
    const result = runTrustResolutionEngine();

    expect(result.lineage).toMatchObject({ lineage_graph: true, parent_decision_links: true, evidence_references: true, oversight_references: true, version_history: true, replay_references: true, immutable_decision_records: true, complete_lineage: true, traceable: true });
  });

  it("never performs evaluation while resolving the final decision", () => {
    const result = runTrustResolutionEngine();

    expect(result.readiness).toMatchObject({ exactly_one_authoritative_decision: true, deterministic_ordering: true, constitutional_precedence_enforced: true, no_evaluation_performed: true, explainable: true, replayable: true, immutable_lineage: true, sole_resolution_authority: true });
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustResolutionEngine({ scenario: failure });
    const validation = validateTrustResolutionEngine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.outcome).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustResolutionEngine({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustResolutionEngine({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustResolutionEngine({ scenario: "TRUST_RESOLUTION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.outcome).toBe("FAIL_CLOSED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.outcome).toBe("FAIL_CLOSED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.outcome).toBe("FAIL_CLOSED");
    expect(validateTrustResolutionEngine(notQualified).valid).toBe(false);
  });
});
