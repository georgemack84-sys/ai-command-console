import { describe, expect, it } from "vitest";

import { getOperationalEvidenceReplayBundle, replayOperationalEvidenceReplay, runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import type { OperationalEvidenceReplayFailure } from "@/types/operational-evidence-replay";

const conditionalFailures = ["REPLAY_RECONSTRUCTION_ENGINE_MISSING", "REPLAY_SESSION_MANAGER_MISSING", "TIMELINE_RECONSTRUCTION_MISSING", "STATE_RECONSTRUCTION_MISSING", "OPERATIONAL_EVIDENCE_INTEGRATION_MISSING", "DIVERGENCE_DETECTION_MISSING", "REPLAY_REPORTING_MISSING", "REPLAY_VIEWER_BACKEND_MISSING", "OPERATIONAL_EVIDENCE_INDEX_MISSING"] as const satisfies readonly OperationalEvidenceReplayFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "MC_4_PORTFOLIO_MANAGEMENT_INVALID", "W2_REPLAY_ENGINE_INVALID", "W2_EVIDENCE_ENGINE_INVALID", "W2_OPERATOR_CONSOLE_INVALID", "W1_REGISTRY_INVALID", "W1_IDENTITY_INVALID", "CCI_EVENT_HISTORY_NOT_AUTHORITATIVE", "MISSION_CONTROL_EVENT_STREAM_CREATED", "SYNTHETIC_EVENTS_USED", "INFERRED_OPERATIONAL_HISTORY_USED", "REPLAY_NON_DETERMINISTIC", "REPLAY_GOVERNANCE_METADATA_MISSING", "TIMELINE_ORDERING_INVALID", "STATE_RECONSTRUCTION_NON_REPRODUCIBLE", "EVIDENCE_LINKAGE_INCOMPLETE", "UNAUTHORIZED_DIVERGENCE_UNDETECTED", "REPLAY_REPORT_EVIDENCE_INCOMPLETE", "EVIDENCE_LOOKUP_SLOW", "AUTHORITY_VALIDATION_BYPASSED", "EVIDENCE_ACCESS_CONTROL_BYPASSED", "TENANT_ISOLATION_FAILED", "MISSION_ISOLATION_FAILED", "AUDIT_LOGGING_MISSING", "REPLAY_AUTHORIZATION_MISSING", "HISTORY_MUTATION_ATTEMPTED", "PERFORMANCE_TARGETS_MISSED", "CONCURRENT_HISTORY_TARGET_NOT_MET"] as const satisfies readonly OperationalEvidenceReplayFailure[];

describe("Replay and Operational Evidence MC-5", () => {
  it("publishes the MC-5 replay doctrine with CCI Event History exclusivity", () => {
    const bundle = getOperationalEvidenceReplayBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "operational-evidence-replay/mc-5",
      owns_replay_reconstruction: true,
      owns_replay_sessions: true,
      owns_timeline_reconstruction: true,
      owns_state_reconstruction: true,
      owns_operational_evidence_index: true,
      owns_replay_reports: true,
      derives_exclusively_from_cci_event_history: true,
      read_only_replay: true,
      no_independent_replay_event_stream: true,
      concurrent_history_qualification_target: 1000,
      qualification_gate: "Operational Evidence Replay Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("OPERATIONAL_EVIDENCE_REPLAY_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC-1 through MC-4 plus replay evidence infrastructure", () => {
    const first = runOperationalEvidenceReplay({ seed: "deterministic" });
    const second = runOperationalEvidenceReplay({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "replay-engine/w2.14", "evidence-engine/w2.13", "operator-console/w2.16", "registry-core/w1.4a", "identity-core/w1.1a"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperationalEvidenceReplay(first).valid).toBe(true);
    expect(replayOperationalEvidenceReplay()).toBe(true);
  });

  it("reconstructs operations read-only from CCI Event History only", () => {
    const result = runOperationalEvidenceReplay();

    expect(result.reconstruction).toMatchObject({ event_stream_loading: true, mission_reconstruction: true, timeline_rebuilding: true, state_reconstruction: true, dependency_replay: true, cross_service_reconstruction: true, historical_projection: true, source_exclusively_cci_event_history: true, no_independent_event_stream: true, no_synthetic_events: true, no_inferred_history: true, deterministic_reconstruction: true, read_only: true });
    expect(result.readiness.cci_event_history_exclusive).toBe(true);
    expect(result.readiness.read_only).toBe(true);
  });

  it("manages governed replay sessions, timeline, and state reconstruction", () => {
    const result = runOperationalEvidenceReplay();

    expect(result.sessions).toMatchObject({ replay_creation: true, session_persistence: true, replay_checkpoints: true, time_navigation: true, bookmarking: true, investigation_sessions: true, replay_identifier: true, replay_requestor: true, replay_authority: true, replay_scope: true, replay_timestamp: true, event_history_version: true, evidence_references: true, completion_status: "COMPLETED" });
    expect(result.timeline).toMatchObject({ event_ordering: true, decision_ordering: true, approval_ordering: true, state_transitions: true, evidence_creation_timeline: true, mission_lifecycle_replay: true, canonical_ordering: true });
    expect(result.state).toMatchObject({ mission_status: true, objectives: true, assignments: true, dependencies: true, approvals: true, governance_state: true, execution_progress: true, point_in_time_state: true, reproducible_state: true });
  });

  it("links evidence, detects divergence, reports, and powers the viewer", () => {
    const result = runOperationalEvidenceReplay();

    expect(result.evidence).toMatchObject({ evidence_lookup: true, evidence_attachment: true, decision_evidence: true, approval_evidence: true, mission_evidence: true, governance_evidence: true, authoritative_evidence_linkage: true, immutable_lineage: true });
    expect(result.divergence).toMatchObject({ replay_validation: true, state_validation: true, missing_events: true, duplicate_events: true, ordering_violations: true, dependency_violations: true, zero_unauthorized_divergence: true });
    expect(result.reporting).toMatchObject({ replay_summary: true, event_timeline: true, mission_reconstruction: true, evidence_references: true, governance_findings: true, replay_statistics: true, authoritative_reports: true, complete_evidence_linkage: true });
    expect(result.viewer).toMatchObject({ replay_navigation: true, timeline_browsing: true, event_inspection: true, state_comparison: true, evidence_viewing: true, mission_playback: true, decision_review: true, approval_visualization: true });
  });

  it("meets security and performance targets for 1000 concurrent histories", () => {
    const result = runOperationalEvidenceReplay();

    expect(result.index.lookup_latency_ms).toBeLessThan(500);
    expect(result.security).toMatchObject({ authority_validation: true, evidence_access_control: true, tenant_isolation: true, mission_isolation: true, immutable_history: true, audit_logging: true, replay_authorization: true, read_only_enforcement: true });
    expect(result.performance.startup_seconds).toBeLessThan(5);
    expect(result.performance.timeline_reconstruction_seconds).toBeLessThan(10);
    expect(result.performance.state_reconstruction_seconds).toBeLessThan(2);
    expect(result.performance.report_generation_seconds).toBeLessThan(30);
    expect(result.performance.evidence_lookup_ms).toBeLessThan(500);
    expect(result.performance.concurrent_history_capacity).toBe(1000);
    expect(result.performance.targets_met).toBe(true);
  });

  it("requires at least 1000 concurrent mission histories for qualification", () => {
    const result = runOperationalEvidenceReplay({ concurrent_histories: 999 });

    expect(result.performance.concurrent_history_capacity).toBe(0);
    expect(result.readiness.performance_ready).toBe(false);
    expect(validateOperationalEvidenceReplay(result).valid).toBe(false);
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runOperationalEvidenceReplay({ scenario: failure });
    const validation = validateOperationalEvidenceReplay(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runOperationalEvidenceReplay({ scenario: failure });
    const validation = validateOperationalEvidenceReplay(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runOperationalEvidenceReplay({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runOperationalEvidenceReplay({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runOperationalEvidenceReplay({ scenario: "OPERATIONAL_REPLAY_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateOperationalEvidenceReplay(notQualified).valid).toBe(false);
  });
});
