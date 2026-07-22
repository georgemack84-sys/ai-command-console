import { describe, expect, it } from "vitest";

import { getTrustHumanOversightStageSevenBundle, replayTrustHumanOversightStageSeven, runTrustHumanOversightStageSeven, validateTrustHumanOversightStageSeven } from "@/services/trust-human-oversight-stage-seven";
import type { TrustHumanOversightFailure } from "@/types/trust-human-oversight-stage-seven";

const conditionalFailures = ["OVERSIGHT_QUEUE_MISSING", "QUEUE_PRIORITIZATION_MISSING", "ROUTING_RULES_MISSING", "REVIEWER_ASSIGNMENT_MISSING", "QUEUE_TENANT_ISOLATION_MISSING", "QUEUE_REPLAY_MISSING", "QUEUE_AUDIT_MISSING", "OVERSIGHT_WORKFLOW_MISSING", "REVIEW_TASKS_MISSING", "EVIDENCE_REVIEW_MISSING", "RESTRICTION_REVIEW_MISSING", "CONSTITUTIONAL_REVIEW_MISSING", "REVIEW_COMPLETION_MISSING", "WORKFLOW_REPLAY_MISSING", "REVIEW_LIFECYCLE_MISSING", "STATE_MACHINE_MISSING", "TRANSITION_VALIDATION_MISSING", "LIFECYCLE_HISTORY_MISSING", "LIFECYCLE_REPLAY_MISSING", "DECISION_RECORDING_MISSING", "REVIEWER_IDENTITY_MISSING", "DECISION_SIGNATURE_MISSING", "DISPOSITION_RECORDING_MISSING", "ESCALATION_RESOLUTION_MISSING", "DISPOSITION_VALIDATION_MISSING", "RESTRICTION_VALIDATION_MISSING", "STANDING_VALIDATION_MISSING", "CONSTITUTIONAL_VALIDATION_MISSING", "OVERSIGHT_EVIDENCE_MISSING", "REVIEWER_EVIDENCE_MISSING", "WORKFLOW_EVIDENCE_MISSING", "TIMELINE_EVIDENCE_MISSING", "EVIDENCE_REPLAY_MISSING", "DECISION_LINEAGE_MISSING", "ESCALATION_LINEAGE_MISSING", "REVIEW_LINEAGE_MISSING", "CONSTITUTIONAL_REFERENCES_MISSING", "TRUST_REFERENCES_MISSING"] as const satisfies readonly TrustHumanOversightFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "STAGE_6_EXPLAINABILITY_INVALID", "MULTIPLE_QUEUES_ASSIGNED", "INVALID_LIFECYCLE_STATE_ALLOWED", "DECISION_RECORD_MUTABLE", "CONSTITUTIONAL_DENY_OVERRIDDEN", "FAIL_CLOSED_OVERRIDDEN", "RESTRICTIONS_BYPASSED", "EVIDENCE_HASH_INVALID", "LINEAGE_NOT_TRACEABLE", "OVERSIGHT_BYPASSED_AUTOMATED_EVALUATION", "HISTORICAL_DECISION_REWRITTEN", "EVIDENCE_REMOVED"] as const satisfies readonly TrustHumanOversightFailure[];

describe("Stage 7 Human Oversight", () => {
  it("publishes the constitutional human oversight doctrine", () => {
    const bundle = getTrustHumanOversightStageSevenBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-human-oversight-stage-seven/stage-7", constitutional_authority: true, only_after_automated_trust_pipeline: true, cannot_override_deny_or_fail_closed: true, immutable_evidence_required: true, deterministic_replay_required: true, complete_lineage_required: true, qualification_gate: "Stage 7 Human Oversight Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("HUMAN_OVERSIGHT_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 6", () => {
    const first = runTrustHumanOversightStageSeven({ seed: "deterministic" });
    const second = runTrustHumanOversightStageSeven({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5", "trust-explainability-stage-six/stage-6"]);
    expect(first.provides).toEqual(["oversight-decisions", "oversight-evidence", "decision-lineage", "review-lifecycle-events", "trust-decision-records", "certification-evidence"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustHumanOversightStageSeven(first).valid).toBe(true);
    expect(replayTrustHumanOversightStageSeven()).toBe(true);
  });

  it("establishes exactly one tenant-isolated oversight queue", () => {
    const result = runTrustHumanOversightStageSeven();

    expect(result.queue).toMatchObject({ receives_escalate_decisions: true, exactly_one_queue: true, queue_prioritization: true, routing_rules: true, reviewer_assignment: true, tenant_isolation: true, queue_replay: true, queue_recovery: true, queue_audit: true, ordering_maintained: true, ownership_tracked: true });
    expect(runTrustHumanOversightStageSeven({ scenario: "MULTIPLE_QUEUES_ASSIGNED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("enforces required review workflow and lifecycle transitions", () => {
    const result = runTrustHumanOversightStageSeven();

    expect(result.workflow).toMatchObject({ review_workflow: true, review_tasks: true, evidence_review: true, restriction_review: true, constitutional_review: true, decision_preparation: true, review_completion: true, workflow_recovery: true, required_steps_enforced: true, deterministic: true, replay_verified: true });
    expect(result.lifecycle.states).toEqual(["PENDING", "UNDER_REVIEW", "INFORMATION_REQUESTED", "RESOLVED", "CANCELLED", "SUPERSEDED"]);
    expect(result.lifecycle).toMatchObject({ state_machine: true, transition_validation: true, lifecycle_events: true, timeout_handling: true, expiration: true, lifecycle_recovery: true, lifecycle_history: true, invalid_states_prevented: true, replay_identical: true });
    expect(runTrustHumanOversightStageSeven({ scenario: "INVALID_LIFECYCLE_STATE_ALLOWED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("records immutable reviewer decisions with allowed dispositions only", () => {
    const result = runTrustHumanOversightStageSeven();

    expect(result.decision_record.dispositions).toEqual(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "DENY", "CANCELLED", "SUPERSEDED"]);
    expect(result.decision_record).toMatchObject({ disposition_recording: true, reviewer_identity: true, decision_timestamp: true, decision_metadata: true, restriction_recording: true, approval_conditions: true, decision_signatures: true, immutable_records: true, replay_support: true });
    expect(runTrustHumanOversightStageSeven({ scenario: "DECISION_RECORD_MUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("resolves escalations without overriding constitutional denials or restrictions", () => {
    const result = runTrustHumanOversightStageSeven();

    expect(result.resolution).toMatchObject({ resolution_logic: true, disposition_validation: true, restriction_validation: true, standing_validation: true, constitutional_validation: true, resolution_evidence: true, resolution_lineage: true, authority_verified: true, deny_not_relaxed: true, fail_closed_not_overridden: true, restrictions_preserved: true, deterministic_outcomes: true });
    expect(runTrustHumanOversightStageSeven({ scenario: "CONSTITUTIONAL_DENY_OVERRIDDEN" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustHumanOversightStageSeven({ scenario: "FAIL_CLOSED_OVERRIDDEN" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustHumanOversightStageSeven({ scenario: "RESTRICTIONS_BYPASSED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("produces immutable oversight evidence and complete decision lineage", () => {
    const result = runTrustHumanOversightStageSeven();

    expect(result.evidence).toMatchObject({ oversight_evidence: true, reviewer_evidence: true, decision_evidence: true, workflow_evidence: true, timeline_evidence: true, immutable_storage: true, evidence_hashing: true, evidence_replay: true, certification_ready: true });
    expect(result.lineage).toMatchObject({ decision_lineage_graph: true, escalation_lineage: true, review_lineage: true, evidence_relationships: true, decision_relationships: true, constitutional_references: true, trust_references: true, replay_relationships: true, complete_lineage: true, traceability_validated: true });
    expect(runTrustHumanOversightStageSeven({ scenario: "EVIDENCE_REMOVED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustHumanOversightStageSeven({ scenario: "HISTORICAL_DECISION_REWRITTEN" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("declares certification readiness only when oversight remains bounded by prior gates", () => {
    const result = runTrustHumanOversightStageSeven();

    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, queue_ready: true, workflow_ready: true, lifecycle_ready: true, decision_recording_ready: true, resolution_ready: true, evidence_ready: true, lineage_ready: true, deterministic_routing: true, reviewer_assignment_validated: true, lifecycle_transitions_validated: true, constitutional_limits_preserved: true, no_constitutional_override: true, immutable_evidence: true, replayable: true, explainable: true, certification_ready: true });
    expect(runTrustHumanOversightStageSeven({ scenario: "OVERSIGHT_BYPASSED_AUTOMATED_EVALUATION" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustHumanOversightStageSeven({ scenario: failure });
    const validation = validateTrustHumanOversightStageSeven(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustHumanOversightStageSeven({ scenario: failure });
    const validation = validateTrustHumanOversightStageSeven(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustHumanOversightStageSeven({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustHumanOversightStageSeven({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustHumanOversightStageSeven({ scenario: "HUMAN_OVERSIGHT_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustHumanOversightStageSeven(notQualified).valid).toBe(false);
  });
});
