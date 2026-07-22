import { describe, expect, it } from "vitest";
import {
  DECISION_TIMELINE_EVENT_TYPES,
  DECISION_TIMELINE_LIFECYCLE_STAGES,
  computeTimelineEventHash,
  getDecisionTimelineFoundation,
  replayDecisionTimelineVisualization,
  runDecisionTimelineVisualization,
} from "@/services/decision-timeline-visualization";
import type { DecisionTimelineFailure, DecisionTimelineInput } from "@/types/decision-timeline-visualization";

describe("Mission Control Phase 9.11.3 Decision Timeline Visualization", () => {
  it("publishes the decision timeline visualization foundation", () => {
    const foundation = getDecisionTimelineFoundation();

    expect(foundation.timeline_version).toBe("decision-timeline-visualization/v1");
    expect(foundation.lifecycle_stages).toEqual(DECISION_TIMELINE_LIFECYCLE_STAGES);
    expect(foundation.event_types).toEqual(DECISION_TIMELINE_EVENT_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("constructs a complete deterministic lifecycle timeline", () => {
    const result = runDecisionTimelineVisualization();

    expect(result.events.map((event) => event.lifecycle_stage)).toEqual(expect.arrayContaining(DECISION_TIMELINE_LIFECYCLE_STAGES));
    expect(result.events[0]?.event_type).toBe("DECISION_CREATED");
    expect(result.events.at(-1)?.event_type).toBe("ARCHIVAL_COMPLETED");
    expect(result.events.every((event) => computeTimelineEventHash(event) === event.integrity_hash)).toBe(true);
  });

  it("renders chronological, lifecycle, governance, operator, replay, certification, and dependency views", () => {
    const result = runDecisionTimelineVisualization();

    expect(result.chronological_view.event_refs).toHaveLength(result.events.length);
    expect(result.lifecycle_view.grouping_key).toBe("lifecycle_stage");
    expect(result.governance_view.event_refs).toHaveLength(3);
    expect(result.operator_view.event_refs).toHaveLength(7);
    expect(result.replay_view.event_refs).toHaveLength(2);
    expect(result.certification_view.event_refs).toHaveLength(2);
    expect(result.dependency_view.event_refs.length).toBeGreaterThan(0);
  });

  it("stores every timeline event in an immutable ledger", () => {
    const result = runDecisionTimelineVisualization();

    expect(result.timeline_ledger).toHaveLength(result.events.length);
    expect(result.timeline_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
    expect(result.timeline_ledger.map((entry) => entry.event_hash)).toEqual(result.events.map((event) => event.integrity_hash));
  });

  it("calculates lifecycle, governance, operator, replay, and certification metrics", () => {
    const result = runDecisionTimelineVisualization();

    expect(result.metrics.completion_rate).toBe(100);
    expect(result.metrics.escalation_frequency).toBe(1);
    expect(result.metrics.approval_count).toBe(1);
    expect(result.metrics.override_frequency).toBe(1);
    expect(result.metrics.replay_success_rate).toBe(100);
    expect(result.metrics.validation_failures).toBe(0);
  });

  it("is replay-identical and advisory-only", () => {
    const first = runDecisionTimelineVisualization();
    const second = runDecisionTimelineVisualization();

    expect(second).toEqual(first);
    expect(replayDecisionTimelineVisualization(first)).toBe(true);
    expect(first.chronological_view.deterministic_sort).toEqual(["sequence_number", "event_timestamp", "lifecycle_stage", "dependency_order", "replay_order"]);
    expect(first.advisory_only).toBe(true);
    expect(first.mutates_orchestration).toBe(false);
  });

  it("validates ordering, timestamps, governance, operator, replay, tenant, authorization, and integrity", () => {
    const result = runDecisionTimelineVisualization();

    expect(result.validation.event_ordering_reproducible).toBe(true);
    expect(result.validation.timestamp_consistency_verified).toBe(true);
    expect(result.validation.governance_checkpoints_complete).toBe(true);
    expect(result.validation.operator_actions_complete).toBe(true);
    expect(result.validation.replay_reconstructed_identically).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.authorization_valid).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_EVENTS", "TIMELINE_EVENTS_MISSING"],
    ["BAD_LIFECYCLE_ORDER", "LIFECYCLE_ORDERING_INCORRECT"],
    ["BAD_TIMESTAMP", "TIMESTAMP_INCONSISTENT"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_EVENTS_OMITTED"],
    ["MISSING_OPERATOR", "OPERATOR_ACTIONS_ABSENT"],
    ["MISSING_REPLAY", "REPLAY_CHECKPOINTS_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_MILESTONES_INCOMPLETE"],
    ["NONDETERMINISTIC_ORDER", "NONDETERMINISTIC_EVENT_ORDERING"],
    ["CROSS_TENANT", "CROSS_TENANT_TIMELINE_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "TIMELINE_REPLAY_RECONSTRUCTION_FAILED"],
    ["LEDGER_MUTATION", "LEDGER_IMMUTABILITY_FAILURE"],
  ] as readonly [NonNullable<DecisionTimelineInput["scenario"]>, DecisionTimelineFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runDecisionTimelineVisualization({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_orchestration).toBe(false);
  });

  it("fails closed when the role lacks timeline visibility", () => {
    const result = runDecisionTimelineVisualization({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runDecisionTimelineVisualization();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayDecisionTimelineVisualization(tampered)).toBe(false);
  });
});
